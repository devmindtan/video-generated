// Human approvals bound to artifact hashes. Only `automation approve` writes the store;
// workers never see it (deniedPaths) and a changed artifact makes the approval stale.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');

const storePath=(root,id)=>path.join(root,`docs/projects/${id}/approvals.json`);
// Content-addressed copies of approved files, so a later review can show exactly what changed since then.
// Inside .automation/ (Git-ignored, denied to workers); never overwritten.
const snapshotPath=(root,hash)=>path.join(root,'.automation/approved-files',hash);
function snapshot(root,rel,hash){
  if(!hash)return;
  const file=snapshotPath(root,hash);if(fs.existsSync(file))return;
  const data=fs.readFileSync(path.join(root,rel));
  if(crypto.createHash('sha256').update(data).digest('hex')!==hash)return; // changed meanwhile: keep only the hash
  fs.mkdirSync(path.dirname(file),{recursive:true});
  const tmp=`${file}.${process.pid}.tmp`;fs.writeFileSync(tmp,data);fs.renameSync(tmp,file);
}
function approvedContent(root,hash){try{return hash?fs.readFileSync(snapshotPath(root,hash)):null;}catch{return null;}}
function sha256(root,rel){
  try{
    const st=fs.lstatSync(path.join(root,rel));
    if(!st.isFile()) return null;
    return crypto.createHash('sha256').update(fs.readFileSync(path.join(root,rel))).digest('hex');
  }catch{return null;}
}
function load(root,id){
  let store;
  try{store=JSON.parse(fs.readFileSync(storePath(root,id),'utf8'));}
  catch(e){if(e.code==='ENOENT')return {schemaVersion:1,projectId:id,history:[]};throw e;}
  if(!store||!Array.isArray(store.history)) throw new Error(`Malformed approvals store: ${storePath(root,id)}`);
  return store;
}
function latest(store,stageId){
  return [...store.history].reverse().find(e=>e.stageId===stageId)||null;
}
// approved: every bound file still has the recorded hash (null = recorded as missing).
// Initial lock and per-scene review live in review.cjs (lock + patches, scene clips), not in hash-bound gates.
const REVIEW_GATES=new Set(['initial-lock','scene-review']);
function gateState(root,plan,stageId){
  const stage=plan.stages.find(s=>s.id===stageId);
  if(!stage||stage.kind!=='human-approval') throw new Error(`Not an approval stage: ${stageId}`);
  if(REVIEW_GATES.has(stageId)){
    const r=require('./review.cjs').summary(root,plan);
    const ok=stageId==='initial-lock'?r.version>0:r.scenesApproved;
    return {stageId,state:ok?'approved':'missing',changed:[],entry:null,review:r};
  }
  const entry=latest(load(root,plan.projectId),stageId);
  if(!entry||entry.decision!=='approved') return {stageId,state:entry?entry.decision:'missing',entry};
  const changed=stage.bindsArtifacts.filter(rel=>(entry.artifactSha256[rel]??null)!==sha256(root,rel));
  return {stageId,state:changed.length?'stale':'approved',changed,entry};
}
function approve(root,plan,stageId,{allowMissing=false,note='',by=null,decision='approved',now=new Date()}={}){
  const stage=plan.stages.find(s=>s.id===stageId);
  if(!stage||stage.kind!=='human-approval') throw new Error(`Not an approval stage: ${stageId}`);
  if(stageId==='export') throw new Error('export is a manual render decision, not recorded here');
  if(REVIEW_GATES.has(stageId)) throw new Error(`${stageId} is recorded in the manager (Duyệt sản xuất), not with approve`);
  const hashes=Object.fromEntries(stage.bindsArtifacts.map(rel=>[rel,sha256(root,rel)]));
  const missing=Object.keys(hashes).filter(rel=>hashes[rel]===null);
  if(decision==='approved'&&missing.length&&!allowMissing)
    throw new Error(`Cannot approve ${stageId}; missing artifacts:\n  ${missing.join('\n  ')}\n`+
      'Create them, or pass --allow-missing to record them explicitly as absent.');
  const blocking=plan.stages.filter(s=>s.kind==='human-approval'&&s.invalidates.includes(stageId))
    .map(s=>gateState(root,plan,s.id)).filter(g=>g.state!=='approved');
  if(decision==='approved'&&blocking.length)
    throw new Error(`Approve earlier gates first: ${blocking.map(g=>`${g.stageId} (${g.state})`).join(', ')}`);
  let approvedBy=by;
  if(!approvedBy){try{approvedBy=execFileSync('git',['-C',root,'config','user.name'],{encoding:'utf8'}).trim();}catch{}}
  const store=load(root,plan.projectId);
  const entry={projectId:plan.projectId,stageId,decision,artifactSha256:hashes,missing,
    approvedBy:approvedBy||'unknown',approvedAt:now.toISOString(),note};
  if(decision==='approved')for(const [rel,hash] of Object.entries(hashes))snapshot(root,rel,hash);
  store.history.push(entry);
  fs.mkdirSync(path.dirname(storePath(root,plan.projectId)),{recursive:true});
  const file=storePath(root,plan.projectId),tmp=`${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp,JSON.stringify(store,null,2)+'\n');
  fs.renameSync(tmp,file);
  return entry;
}
module.exports={approve,gateState,load,sha256,storePath,snapshot,snapshotPath,approvedContent};
