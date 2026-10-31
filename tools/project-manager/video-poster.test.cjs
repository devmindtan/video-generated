const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const zlib=require('node:zlib');
const {execFileSync}=require('node:child_process');
const {createManager}=require('./server.cjs');

const FFMPEG=path.join(__dirname,'../../node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg');

function png(width,height,grey) {
  // Remotion's ffmpeg lacks rawvideo/lavfi inputs, so feed it real PNG frames.
  const chunk=(type,data)=>{const body=Buffer.concat([Buffer.from(type),data]),size=Buffer.alloc(4),crc=Buffer.alloc(4);size.writeUInt32BE(data.length);crc.writeUInt32BE(zlib.crc32(body));return Buffer.concat([size,body,crc]);};
  const header=Buffer.alloc(13);header.writeUInt32BE(width,0);header.writeUInt32BE(height,4);header.set([8,0,0,0,0],8);
  const rows=Buffer.concat(Array.from({length:height},()=>Buffer.concat([Buffer.from([0]),Buffer.alloc(width,grey)])));
  return Buffer.concat([Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
}
function tinyVideo(file) {
  const frames=Buffer.concat(Array.from({length:10},(_,i)=>png(64,112,i*25)));
  fs.mkdirSync(path.dirname(file),{recursive:true});
  execFileSync(FFMPEG,['-v','error','-f','image2pipe','-framerate','10','-c:v','png','-i','pipe:','-c:v','libx264','-pix_fmt','yuv420p',file],{input:frames});
}

async function fixture(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'manager-poster-test-'));
  const write=(file,value)=>{fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),typeof value==='string'?value:JSON.stringify(value));};
  const paths=id=>({source:`src/projects/${id}`,scripts:`scripts/projects/${id}`,docs:`docs/projects/${id}`,assets:`public/${id}`});
  write('series/catalog.json',{schemaVersion:1,channels:[{id:'client-work',title:'Video khách hàng',studioFolder:'Client-Work'}],series:[{id:'product-videos',channel:'client-work',path:'series/client-work/product-videos/series.json'}]});
  write('series/client-work/product-videos/series.json',{schemaVersion:1,id:'product-videos',channel:'client-work',title:'Video sản phẩm',studioFolder:'Product-Videos',formats:['short'],projects:[
    {id:'imported',title:'Video khách gửi',status:'planning',format:'short',paths:paths('imported'),registrations:[]},
    {id:'footage',title:'Có bản dựng',status:'existing',format:'short',paths:paths('footage'),registrations:[{id:'Footage',kind:'Composition'}]},
    {id:'with-image',title:'Có ảnh cảnh',status:'existing',format:'short',paths:paths('with-image'),registrations:[]},
    {id:'empty',title:'Chưa có gì',status:'planning',format:'short',paths:paths('empty'),registrations:[]}]});
  write('src/projects/footage/Video.tsx','video code');
  write('src/projects/registry.tsx',`import {Video} from './footage/Video';
export const Projects=()=> <Folder name="Client-Work"><Folder name="Product-Videos"><Folder name="footage"><Composition id="Footage" component={Video} durationInFrames={30} fps={30} width={64} height={112}/></Folder></Folder></Folder>;`);
  for(const id of ['imported','footage','with-image','empty'])fs.mkdirSync(path.join(root,`public/${id}`),{recursive:true});
  tinyVideo(path.join(root,'public/imported/imported-video.mp4'));
  tinyVideo(path.join(root,'public/footage/video/source.mp4'));
  write('public/with-image/images/01.png','\x89PNG\r\n\x1a\n');
  const server=createManager({root,openFolder:async()=>{}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  t.after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));fs.rmSync(root,{recursive:true,force:true});});
  return {root,base};
}

test('projects without a thumbnail show a cached frame of their own video',async t=>{
  const f=await fixture(t);
  const workspace=await (await fetch(f.base+'/api/workspace')).json(),type=id=>workspace.projects.find(p=>p.id===id).previewType;
  assert.deepEqual(['imported','footage','with-image','empty'].map(type),['video-frame','video-frame','scene',null]);
  assert.ok(!fs.existsSync(path.join(f.root,'.cache/manager-posters')),'listing must not decode videos');
  for(const id of ['imported','footage']){
    const response=await fetch(f.base+'/api/preview/'+id);
    assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/jpeg');
    const bytes=Buffer.from(await response.arrayBuffer());assert.deepEqual([...bytes.subarray(0,2)],[0xff,0xd8]);
  }
  const cached=fs.readdirSync(path.join(f.root,'.cache/manager-posters'));assert.equal(cached.length,2);
  await fetch(f.base+'/api/preview/imported');assert.deepEqual(fs.readdirSync(path.join(f.root,'.cache/manager-posters')),cached);
  assert.equal((await fetch(f.base+'/api/preview/empty')).status,404);
  for(const id of ['imported','footage','with-image','empty'])assert.ok(!fs.existsSync(path.join(f.root,`public/${id}/poster.jpg`)));
});
