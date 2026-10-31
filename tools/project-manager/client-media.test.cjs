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
  const opened=[],server=createManager({root,openFolder:async folder=>opened.push(folder)});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`,workspace=async()=>(await fetch(base+'/api/workspace')).json(),token=(await workspace()).token;
  t.after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));fs.rmSync(root,{recursive:true,force:true});});
  const post=(route,body)=>fetch(base+route,{method:'POST',headers:{Origin:base,'Content-Type':'application/json','X-Workspace-Token':token},body:JSON.stringify(body)});
  return {root,write,base,workspace,token,opened,post};
}

test('client projects have one video: the import until an export exists',async t=>{
  const f=await fixture(t),project=async()=>(await f.workspace()).projects.find(p=>p.id==='edited');
  assert.deepEqual(await project().then(p=>[p.importedVideo,p.renderedVideo,p.videoId]),[true,true,'EditedCut']);
  assert.equal(await (await fetch(f.base+'/api/media?id=edited&kind=video')).text().then(x=>x.slice(12)),'ORIGINAL');
  const later=Date.now()/1000+5;f.write('out/EditedCut.mp4',mp4('EDITED'));fs.utimesSync(path.join(f.root,'out/EditedCut.mp4'),later,later);
  assert.deepEqual(await project().then(p=>[p.importedVideo,p.renderedVideo]),[false,true]);
  assert.equal(await (await fetch(f.base+'/api/media?id=edited&kind=video')).text().then(x=>x.slice(12)),'EDITED');
  assert.equal((await fetch(f.base+'/api/media?id=edited&kind=original')).status,404);
});

test('the folder of the rendered (or imported) video can be opened, wherever it was rendered',async t=>{
  const f=await fixture(t),real=p=>fs.realpathSync(path.join(f.root,p));
  assert.equal((await f.workspace()).projects.find(p=>p.id==='edited').videoFolder,'public/edited');
  assert.equal((await f.post('/api/open-folder',{id:'edited',group:'video'})).status,200);
  const later=Date.now()/1000+5;f.write('out/EditedCut.mp4',mp4('EDITED'));fs.utimesSync(path.join(f.root,'out/EditedCut.mp4'),later,later);
  assert.equal((await f.workspace()).projects.find(p=>p.id==='edited').videoFolder,'out');
  assert.equal((await f.post('/api/open-folder',{id:'edited',group:'video'})).status,200);
  assert.deepEqual(f.opened,[real('public/edited'),real('out')]);
  const missing=await f.post('/api/open-folder',{id:'edited',group:'thumbnail'});assert.equal(missing.status,400);assert.match((await missing.json()).error,/Chưa có bản xuất/);
  assert.equal((await f.post('/api/open-folder',{id:'edited',group:'../..'})).status,400);assert.equal(f.opened.length,2);
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

test('originals the browser cannot decode get a cached H.264 copy, the import stays untouched',async t=>{
  const {createPlayback}=require('./video-playback.cjs'),{execFileSync}=require('node:child_process');
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'manager-playback-')),bin=path.join(root,'bin'),real=path.join(__dirname,'../../node_modules/@remotion/compositor-linux-x64-gnu');
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  fs.mkdirSync(bin);fs.symlinkSync(path.join(real,'ffmpeg'),path.join(bin,'ffmpeg'));
  fs.writeFileSync(path.join(bin,'ffprobe'),'#!/bin/sh\necho hevc\n',{mode:0o755}); // pretend the import is HEVC
  const zlib=require('node:zlib'),chunk=(type,data)=>{const body=Buffer.concat([Buffer.from(type),data]),size=Buffer.alloc(4),crc=Buffer.alloc(4);size.writeUInt32BE(data.length);crc.writeUInt32BE(zlib.crc32(body));return Buffer.concat([size,body,crc]);};
  const header=Buffer.alloc(13);header.writeUInt32BE(32,0);header.writeUInt32BE(32,4);header.set([8,0,0,0,0],8);
  const png=Buffer.concat([Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(Buffer.alloc(32*33,90))),chunk('IEND',Buffer.alloc(0))]);
  const video=path.join(root,'imported-video.mov');
  execFileSync(path.join(real,'ffmpeg'),['-v','error','-f','image2pipe','-framerate','10','-c:v','png','-i','pipe:','-c:v','libx264','-pix_fmt','yuv420p','-f','mov',video],{input:Buffer.concat(Array(5).fill(png))});
  const before=fs.readFileSync(video),playback=createPlayback(root,{bin});
  assert.deepEqual(playback.playable(video),{preparing:true,codec:'hevc'});
  let state;for(let i=0;i<100&&!(state=playback.playable(video)).file;i++)await new Promise(r=>setTimeout(r,100));
  assert.equal(state.converted,true);assert.ok(state.file.startsWith(path.join(root,'.cache/manager-playback')));
  assert.equal(fs.readFileSync(state.file).toString('ascii',4,8),'ftyp');assert.deepEqual(fs.readFileSync(video),before);
});
