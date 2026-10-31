const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {createManager}=require('./server.cjs');

const mp4=tag=>Buffer.concat([Buffer.from([0,0,0,20]),Buffer.from('ftypisom'),Buffer.from(tag)]);

async function fixture(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'manager-client-media-'));
  const write=(file,value)=>{fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value));};
  const paths={source:'src/projects/edited',scripts:'scripts/projects/edited',docs:'docs/projects/edited',assets:'public/edited'};
  write('series/catalog.json',{schemaVersion:1,channels:[{id:'client-work',title:'Video khách hàng',studioFolder:'Client-Work'}],series:[{id:'product-videos',channel:'client-work',path:'series/client-work/product-videos/series.json'}]});
  write('series/client-work/product-videos/series.json',{schemaVersion:1,id:'product-videos',channel:'client-work',title:'Video sản phẩm',studioFolder:'Product-Videos',formats:['short','long'],defaultDurationSeconds:null,projects:[
    {id:'edited',title:'Đã dựng',status:'existing',format:'short',paths,registrations:[{id:'EditedCut',kind:'Composition'}]}]});
  for(const folder of Object.values(paths))fs.mkdirSync(path.join(root,folder),{recursive:true});
  write('src/projects/edited/Video.tsx','video code');
  write('src/projects/registry.tsx',`import {Video} from './edited/Video';
export const Projects=()=> <Folder name="Client-Work"><Folder name="Product-Videos"><Folder name="edited"><Composition id="EditedCut" component={Video} durationInFrames={30} fps={30} width={720} height={1280}/></Folder></Folder></Folder>;`);
  write('public/edited/imported-video.mp4',mp4('ORIGINAL'));
  const server=createManager({root,openFolder:async()=>{}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`,workspace=async()=>(await fetch(base+'/api/workspace')).json(),token=(await workspace()).token;
  t.after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));fs.rmSync(root,{recursive:true,force:true});});
  return {root,write,base,workspace,token};
}

test('client projects keep the original video apart from the edited export',async t=>{
  const f=await fixture(t),project=async()=>(await f.workspace()).projects.find(p=>p.id==='edited');
  assert.deepEqual(await project().then(p=>[p.importedVideo,p.renderedVideo,p.videoId]),[true,false,'EditedCut']);
  assert.equal(await (await fetch(f.base+'/api/media?id=edited&kind=original')).text().then(x=>x.slice(12)),'ORIGINAL');
  assert.equal((await fetch(f.base+'/api/media?id=edited&kind=video')).status,404,'no edit is exported yet: the edit opens in Studio');
  f.write('out/EditedCut.mp4',mp4('EDITED'));
  assert.deepEqual(await project().then(p=>[p.importedVideo,p.renderedVideo]),[true,true]);
  assert.equal(await (await fetch(f.base+'/api/media?id=edited&kind=video')).text().then(x=>x.slice(12)),'EDITED');
  assert.equal(await (await fetch(f.base+'/api/media?id=edited&kind=original')).text().then(x=>x.slice(12)),'ORIGINAL');
});

test('a client video can be imported without a name and gets a temporary one',async t=>{
  const f=await fixture(t);
  const upload=await fetch(f.base+'/api/projects/import?'+new URLSearchParams({series:'product-videos',id:'',title:'',format:'short',duration:'',name:'clip.mp4'}),{method:'POST',headers:{Origin:f.base,'Content-Type':'application/octet-stream','X-Workspace-Token':f.token},body:mp4('NEW')});
  assert.equal(upload.status,201);
  const created=await upload.json();assert.deepEqual([created.id,created.title,created.autoNamed],['chua-dat-ten-1','Chưa đặt tên 1',true]);
  assert.ok(fs.existsSync(path.join(f.root,'public/chua-dat-ten-1/imported-video.mp4')));
  const listed=(await f.workspace()).projects.find(p=>p.id==='chua-dat-ten-1');assert.deepEqual([listed.autoNamed,listed.importedVideo],[true,true]);
  const plain=await fetch(f.base+'/api/projects',{method:'POST',headers:{Origin:f.base,'Content-Type':'application/json','X-Workspace-Token':f.token},body:JSON.stringify({series:'product-videos',id:'',title:'',format:'long',duration:''})});
  assert.equal(plain.status,201);assert.equal((await plain.json()).id,'chua-dat-ten-2');
});
