const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {plan,status,doctor,denied}=require('./cli.cjs');
function fixture(fn){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'production-plan-'));
 const write=(p,value)=>{fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),JSON.stringify(value));};
 const entries=[['self-help-shorts','tam-ly-cuoc-song'],['book-insights','tam-ly-cuoc-song'],['tiny-dino','kids']];
 write('package.json',{scripts:{'check:tiny-dino':'x',typecheck:'x','projects:check':'x'}});
 write('series/catalog.json',{schemaVersion:1,series:entries.map(([id,channel])=>({id,channel,path:`series/${id}/series.json`}))});
 for(const [id,channel] of entries)write(`series/${id}/series.json`,{id,channel,projects:[{id,status:'existing',paths:{source:`src/projects/${id}`,scripts:`scripts/projects/${id}`,docs:`docs/projects/${id}`,assets:`public/${id}`}}]});
 try{fn(root);}finally{fs.rmSync(root,{recursive:true,force:true});}
}
test('profiles preserve human gates and valid dependencies; planning does not write',()=>fixture(root=>{
 const before=fs.readdirSync(root,{recursive:true});
 for(const id of ['self-help-shorts','book-insights','tiny-dino']){
  const p=plan(root,id),seen=new Set();
  assert.equal(p.runtimeCompatible,false);assert.equal(p.policy.automaticExecution,false);
  for(const stage of p.stages){assert.ok(stage.dependencies.every(d=>seen.has(d)));assert.ok(!seen.has(stage.id));seen.add(stage.id);assert.equal(stage.status,'not-started');}
  assert.equal(p.stages.find(s=>s.id==='initial-lock').kind,'human-approval');
  assert.deepEqual(p.stages.find(s=>s.id==='assembly').dependencies,['narration','visuals']);
  assert.equal(p.stages.some(s=>s.id==='sources'),p.profile==='book');
 }
 assert.deepEqual(fs.readdirSync(root,{recursive:true}),before);
}));
test('reject unknown projects and traversal; doctor never claims execution ready',()=>fixture(root=>{
 assert.throws(()=>plan(root,'../secret'));assert.throws(()=>plan(root,'missing'));
 assert.equal(doctor(root).executionReady,false);assert.equal(doctor(root).pinnedCommitMatches,false);
}));
test('scopes avoid denied paths, gates bind upstream outputs and invalidate downstream',()=>fixture(root=>{
 for(const rel of ['.env','.env.local','library/books/a.pdf','public/x/backups/a.wav','docs/projects/x/.manager-history/1.md','repos/a/main.py','out/a.mp4'])assert.ok(denied(rel),rel);
 for(const rel of ['docs/projects/x/script.md','public/x/audio/a.wav','src/projects/x/Video.tsx'])assert.ok(!denied(rel),rel);
 for(const id of ['self-help-shorts','book-insights','tiny-dino']){
  const p=plan(root,id);
  for(const s of p.stages){
   for(const w of s.writeScope)assert.ok(Object.values(p.paths).some(b=>w.startsWith(b+'/')),w);
   if(s.kind==='human-approval')assert.ok(s.writeScope.length===0&&s.bindsArtifacts.length>0);
  }
  const gate=p.stages.find(s=>s.id==='initial-lock');
  assert.ok(gate.bindsArtifacts.includes(`docs/projects/${id}/script.md`));
  assert.ok(p.stages.find(s=>s.id==='script').invalidates.includes('assembly'));
  assert.equal(p.stages.find(s=>s.id==='voice-audition').kind,'operator-task');
  assert.equal(p.gaps.length,id==='tiny-dino'?0:1);
 }
}));
test('status hashes existing outputs without claiming approval or writing',()=>fixture(root=>{
 fs.mkdirSync(path.join(root,'docs/projects/tiny-dino'),{recursive:true});
 fs.writeFileSync(path.join(root,'docs/projects/tiny-dino/script.md'),'abc');
 fs.mkdirSync(path.join(root,'public/tiny-dino/audio/backups'),{recursive:true});
 fs.writeFileSync(path.join(root,'public/tiny-dino/audio/a.wav'),'');fs.mkdirSync(path.join(root,'public/tiny-dino/backups'));fs.writeFileSync(path.join(root,'public/tiny-dino/backups/old.wav'),'');
 const before=fs.readdirSync(root,{recursive:true});
 const s=status(root,'tiny-dino');
 const script=s.stages.find(x=>x.id==='script').artifacts[0];
 assert.equal(script.sha256,'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
 assert.equal(s.stages.find(x=>x.id==='brief').artifacts[0].exists,false);
 assert.match(s.note,/unless a gate below is approved/);assert.ok(s.gates.every(g=>g.state==='missing'));assert.equal(s.assets.audio,1);
 assert.deepEqual(fs.readdirSync(root,{recursive:true}),before);
}));

const approvals=require('./approvals.cjs'),runner=require('./runner.cjs');
const {execFileSync}=require('node:child_process');
const put=(root,rel,text)=>{fs.mkdirSync(path.dirname(path.join(root,rel)),{recursive:true});fs.writeFileSync(path.join(root,rel),text);};
test('approvals bind hashes, require earlier gates and go stale on edits',()=>fixture(root=>{
 const review=require('./review.cjs'),id='self-help-shorts',p=plan(root,id),D=`docs/projects/${id}`,X=`scripts/projects/${id}`;
 for(const g of ['initial-lock','scene-review'])assert.throws(()=>approvals.approve(root,p,g,{by:'t'}),/recorded in the manager/);
 assert.throws(()=>approvals.approve(root,p,'review-preview',{by:'t',allowMissing:true}),/Approve earlier gates first: initial-lock \(missing\), scene-review \(missing\)/);
 put(root,`${D}/script.md`,'s');put(root,`src/projects/${id}/music.json`,'{}');put(root,`${X}/voice.json`,'{}');put(root,`${D}/production-spec.md`,'p');put(root,`${D}/image-prompts.md`,'i');
 review.lock(root,p,{by:'u'});
 put(root,'src/projects/registry.tsx',`import {V} from './${id}/Video';\nexport const P=()=> <Folder name="a"><Folder name="b"><Folder name="${id}"><Composition id="S" component={V} durationInFrames={30} fps={30} width={1} height={1}/></Folder></Folder></Folder>;`);
 put(root,`${X}/story.json`,JSON.stringify([{id:'01',start:0,duration:1}]));put(root,`projects/${id}/review/01.mp4`,'c');
 review.addClip(root,p,'01',`projects/${id}/review/01.mp4`);review.reviewScene(root,p,'01',0,{decision:'approved',by:'u'});
 approvals.approve(root,p,'review-preview',{by:'t',allowMissing:true});
 assert.equal(approvals.gateState(root,p,'review-preview').state,'approved');
 put(root,`${D}/script.md`,'edited');
 const g=approvals.gateState(root,p,'review-preview');
 assert.equal(g.state,'stale');assert.ok(g.changed.includes(`${D}/script.md`));
 assert.ok(denied(`${D}/approvals.json`));
 assert.throws(()=>approvals.approve(root,p,'export',{by:'t'}),/manual render/);
}));
test('prepare stages only readable files and refuses blocked, ungated or existing outputs',()=>fixture(root=>{
 const id='self-help-shorts',D=`docs/projects/${id}`;
 put(root,`${D}/script.md`,'Kịch bản');put(root,`${D}/approvals.json`,'{"history":[]}');put(root,'docs/projects/other/script.md','Tập khác');
 put(root,`${D}/.manager-history/1.md`,'old');put(root,'.env','SECRET');put(root,`${D}/bin.md`,Buffer.from([0,1,2]));
 assert.throws(()=>runner.prepare(root,id,'assembly',{skipRuntimeCheck:true}),/not automated/);
 assert.throws(()=>runner.prepare(root,id,'metadata',{skipRuntimeCheck:true}),/Approve first: initial-lock/);
 const run=runner.prepare(root,id,'editorial-review',{skipRuntimeCheck:true,now:new Date('2026-10-30T01:02:03Z')});
 assert.equal(run.runId,`${id}--editorial-review--20261030-010203`);
 assert.deepEqual(Object.keys(run.inputs),['docs/projects/other/script.md',`${D}/script.md`]);
 assert.deepEqual(run.skipped,[`${D}/bin.md`]);
 const staging=path.join(root,'.automation/runs',run.runId,'staging');
 assert.ok(!fs.existsSync(path.join(staging,`${D}/approvals.json`))&&!fs.existsSync(path.join(staging,'.env')));
 assert.match(fs.readFileSync(path.join(staging,'project_context.md'),'utf8'),/KHÔNG viết lại toàn bộ kịch bản/);
 assert.equal(execFileSync('git',['-C',staging,'status','--porcelain'],{encoding:'utf8'}),'');
 const task=JSON.parse(fs.readFileSync(path.join(root,'.automation/runs',run.runId,'plan.json'))).tasks[0];
 assert.deepEqual(task.write_scope,[`${D}/script-review.md`]);assert.equal(task.profile,'writer');
 const tools=JSON.parse(fs.readFileSync(path.join(root,'.automation/runs',run.runId,'tools.json')));
 assert.equal(tools.commands.mode,'operations');assert.equal(tools.commands.network,false);
 put(root,`${D}/script-review.md`,'cũ');
 assert.throws(()=>runner.prepare(root,id,'editorial-review',{skipRuntimeCheck:true}),/--revise/);
}));
test('apply refuses scope escapes and user edits, then applies a reviewed patch',()=>fixture(root=>{
 const id='self-help-shorts',D=`docs/projects/${id}`;
 put(root,`${D}/script.md`,'Kịch bản\n');
 const make=(now,files)=>{
  const run=runner.prepare(root,id,'editorial-review',{skipRuntimeCheck:true,now});
  const dir=path.join(root,'.automation/runs',run.runId),staging=path.join(dir,'staging');
  for(const [rel,text] of Object.entries(files))put(staging,rel,text);
  execFileSync('git',['-C',staging,'add','-A']);
  const diff=execFileSync('git',['-C',staging,'diff','--cached','--binary'],{encoding:'utf8'});
  put(dir,`artifacts/${run.runId}.patch`,diff);
  Object.assign(run,{status:'awaiting-approval',patch:path.relative(root,path.join(dir,`artifacts/${run.runId}.patch`))});
  fs.writeFileSync(path.join(dir,'run.json'),JSON.stringify(run));
  return run.runId;
 };
 const escape=make(new Date('2026-10-30T01:00:00Z'),{[`${D}/script-review.md`]:'ok\n',[`${D}/script.md`]:'hijack\n'});
 assert.throws(()=>runner.apply(root,escape),/outside the stage write scope/);
 assert.equal(fs.readFileSync(path.join(root,`${D}/script.md`),'utf8'),'Kịch bản\n');
 const good=make(new Date('2026-10-30T02:00:00Z'),{[`${D}/script-review.md`]:'Nhận xét\n'});
 put(root,`${D}/script-review.md`,'user wrote this\n');
 assert.throws(()=>runner.apply(root,good),/your edits are kept/);
 fs.rmSync(path.join(root,`${D}/script-review.md`));
 const applied=runner.apply(root,good);
 assert.equal(applied.status,'applied');
 assert.equal(fs.readFileSync(path.join(root,`${D}/script-review.md`),'utf8'),'Nhận xét\n');
 assert.throws(()=>runner.apply(root,good),/nothing to apply/);
 assert.equal(runner.list(root,id).length,2);
}));
test('CLI process loads runner without circular-export failures',()=>fixture(root=>{
 const r=require('node:child_process').spawnSync(process.execPath,[path.join(__dirname,'cli.cjs'),'run','self-help-shorts','editorial-review','--prepare-only'],
  {env:{...process.env,AUTOMATION_ROOT:root},encoding:'utf8'});
 assert.equal(r.status,1);assert.match(r.stderr,/Hardened runtime not ready/);assert.doesNotMatch(r.stderr,/is not a function|circular/);
}));
test('series workflow notes reach the plan and the staged project context without changing stages',()=>fixture(root=>{
 const notes=require('./series-notes.cjs'),{seriesWorkflow}=require('./cli.cjs');
 const series={id:'self-help-shorts',file:path.join(root,'series/self-help-shorts/series.json')};
 const before=plan(root,'self-help-shorts').stages.map(s=>s.id);
 notes.save(root,series,'general',{rules:['Giữ tông trầm'],notes:''},notes.read(root,series).revision);
 notes.save(root,series,'script',{rules:['Mở bằng tình huống cụ thể'],notes:'Không giảng giải.'},notes.read(root,series).revision);
 const p=plan(root,'self-help-shorts');
 assert.deepEqual(p.stages.map(s=>s.id),before);assert.deepEqual(p.seriesNotes.stages.script.rules,['Mở bằng tình huống cụ thể']);
 const context=notes.contextFor(p.seriesNotes,'script');
 assert.match(context,/Giữ tông trầm/);assert.match(context,/Mở bằng tình huống cụ thể/);assert.match(context,/Không giảng giải/);
 assert.doesNotMatch(notes.contextFor(p.seriesNotes,'metadata'),/tình huống/);
 assert.equal(seriesWorkflow(root,'book-insights').stages.some(s=>s.id==='sources'),true);
 assert.ok(seriesWorkflow(root,'tiny-dino').stages.every(s=>s.title&&s.guide));
}));
test('a run whose worker process is gone is reported as interrupted',()=>fixture(root=>{
 const id='self-help-shorts';put(root,`docs/projects/${id}/script.md`,'s');
 const run=runner.prepare(root,id,'editorial-review',{skipRuntimeCheck:true});
 const file=path.join(root,'.automation/runs',run.runId,'run.json');
 fs.writeFileSync(file,JSON.stringify({...run,status:'running',pid:2147483646}));
 assert.equal(runner.readRun(root,run.runId).status,'interrupted');
 fs.writeFileSync(file,JSON.stringify({...run,status:'running',pid:process.pid}));
 assert.equal(runner.readRun(root,run.runId).status,'running');
}));
test('models use the GPU machine through a loopback tunnel when it is on, else this laptop',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'run-models-'));
 try{
  const R=require('./policy.json').runner;fs.writeFileSync(path.join(dir,'settings.json'),JSON.stringify(R.settings));
  const calls=[],fake=(pick,start=async()=>({url:'http://127.0.0.1:11435/'}))=>({pick:()=>{if(pick instanceof Error)throw pick;return pick;},start:async(...a)=>{calls.push('start');return start(...a);},release:async()=>{calls.push('release');}});
  const on={machine:'gpu',reason:'máy GPU đang bật'},off={machine:'local',reason:'không kết nối được h'};
  const g=await runner.chooseModels('/x',dir,{gpu:fake(on)});
  assert.equal(g.machine,'gpu');
  const s=JSON.parse(fs.readFileSync(g.settings,'utf8'));
  for(const m of Object.values(s.models))assert.equal(m.api_base,'http://127.0.0.1:11435','still loopback for the runtime gateway');
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'settings.json'),'utf8')).models.executor.api_base,'http://127.0.0.1:11434','laptop settings untouched');
  await g.release();
  const l=await runner.chooseModels('/x',dir,{gpu:fake(off)});
  assert.equal(l.machine,'local');assert.equal(path.basename(l.settings),'settings.json');assert.match(l.reason,/không kết nối/);
  const b=await runner.chooseModels('/x',dir,{gpu:fake(on,async()=>{throw new Error('timeout');})});
  assert.equal(b.machine,'local');assert.match(b.reason,/không bật được Ollama/);
  await assert.rejects(runner.chooseModels('/x',dir,{gpu:fake(on,async()=>{throw new Error('timeout');}),machine:{gpu:true}}),/timeout/);
  assert.deepEqual(calls,['start','release','start','release','start','release']);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('initial lock of five items, patches accepted or returned one by one, then per-scene clips with notes',()=>fixture(root=>{
 const review=require('./review.cjs'),id='self-help-shorts',p=plan(root,id),D=`docs/projects/${id}`,X=`scripts/projects/${id}`,S=`src/projects/${id}`;
 assert.deepEqual(p.stages.find(s=>s.id==='initial-lock').dependencies,['music','voice-audition','visual-plan']);
 assert.deepEqual(p.stages.find(s=>s.id==='review-preview').dependencies,['scene-review','qa','metadata']);
 assert.throws(()=>approvals.approve(root,p,'initial-lock',{by:'t'}),/recorded in the manager/);
 assert.throws(()=>review.lock(root,p,{by:'u'}),/Thiếu file/);
 put(root,`${D}/script.md`,'s1');put(root,`${S}/music.json`,'{"file":"m.mp3"}');put(root,`${X}/voice.json`,'{"voice":"Hải Đăng"}');
 put(root,`${D}/production-spec.md`,'45 ± 5 giây');put(root,`${D}/image-prompts.md`,'cảnh 1: ngọn nến');
 assert.equal(review.summary(root,p).state,'unlocked');assert.equal(approvals.gateState(root,p,'initial-lock').state,'missing');
 review.lock(root,p,{by:'u',note:'ok'});
 assert.throws(()=>review.lock(root,p,{by:'u'}),/bản vá/);
 assert.equal(approvals.gateState(root,p,'initial-lock').state,'approved');
 assert.throws(()=>review.createPatch(root,p,{reason:'x',by:'a'}),/Không có thay đổi/);
 put(root,`${D}/script.md`,'s2');
 assert.deepEqual(review.summary(root,p).drift,[`${D}/script.md`]);                 // edited but not proposed yet
 const p1=review.createPatch(root,p,{reason:'Sửa câu mở',by:'a'});
 assert.deepEqual([p1.id,Object.keys(p1.changed),review.summary(root,p).state,review.summary(root,p).drift],['p1',[`${D}/script.md`],'patch-pending',[]]);
 review.decidePatch(root,p,'p1',{decision:'returned',note:'Câu mở còn dài',by:'u'});
 assert.equal(review.summary(root,p).drift.length,1);                                // returned: still not part of the lock
 put(root,`${D}/script.md`,'s3');const p2=review.createPatch(root,p,{reason:'Rút gọn câu mở',by:'a'});
 put(root,`${D}/script.md`,'s4');
 assert.throws(()=>review.decidePatch(root,p,p2.id,{decision:'accepted',by:'u'}),/File đổi sau khi tạo bản vá/);
 const p3=review.createPatch(root,p,{reason:'Bản cuối',by:'a'});
 assert.equal(review.load(root,id).patches.find(x=>x.id===p2.id).status,'superseded');
 assert.equal(review.decidePatch(root,p,p3.id,{decision:'accepted',note:'Được',by:'u'}).version,2);
 const s=review.summary(root,p);assert.deepEqual([s.state,s.version,s.drift],['locked',2,[]]);
 // Scenes from story.json on the project's composition; clips are reviewed with notes.
 put(root,'src/projects/registry.tsx',`import {V} from './${id}/Video';\nexport const P=()=> <Folder name="a"><Folder name="b"><Folder name="${id}"><Composition id="Shorts" component={V} durationInFrames={1350} fps={30} width={1080} height={1920}/></Folder></Folder></Folder>;`);
 put(root,`${X}/story.json`,JSON.stringify([{id:'01-mo',start:0,duration:5},{id:'02-ket',start:5,duration:4}]));
 assert.deepEqual(review.sceneDefs(root,p),[{id:'01-mo',title:'01-mo',composition:'Shorts',frames:[0,149]},{id:'02-ket',title:'02-ket',composition:'Shorts',frames:[150,269]}]);
 put(root,`projects/${id}/review/01-mo-a.mp4`,'clip a');review.addClip(root,p,'01-mo',`projects/${id}/review/01-mo-a.mp4`);
 assert.throws(()=>review.reviewScene(root,p,'01-mo',0,{decision:'needs-changes',note:' ',by:'u'}),/Ghi chú/);
 review.reviewScene(root,p,'01-mo',0,{decision:'needs-changes',note:'Ảnh nến quá tối',by:'u'});
 put(root,`projects/${id}/review/01-mo-b.mp4`,'clip b');review.addClip(root,p,'01-mo',`projects/${id}/review/01-mo-b.mp4`);
 assert.throws(()=>review.reviewScene(root,p,'01-mo',0,{decision:'approved',by:'u'}),/clip mới hơn/);
 review.reviewScene(root,p,'01-mo',1,{decision:'approved',by:'u'});
 assert.equal(approvals.gateState(root,p,'scene-review').state,'missing');
 put(root,`projects/${id}/review/02-ket-a.mp4`,'clip c');review.addClip(root,p,'02-ket',`projects/${id}/review/02-ket-a.mp4`);
 review.reviewScene(root,p,'02-ket',0,{decision:'approved',by:'u'});
 const done=review.summary(root,p);
 assert.equal(approvals.gateState(root,p,'scene-review').state,'approved');assert.deepEqual(done.final,{ready:true,blockers:[]});
 assert.equal(done.scenes[0].clips[0].note,'Ảnh nến quá tối');
 assert.equal(JSON.parse(fs.readFileSync(path.join(root,`${D}/approvals.json`),'utf8')).schemaVersion,2);
}));
