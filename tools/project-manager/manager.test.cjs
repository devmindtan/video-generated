const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {createManager}=require('./server.cjs');

async function fixture(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'local-manager-test-'));
  const write=(file,value)=>{fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value));};
  const paths={source:'src/projects/old',scripts:'scripts/projects/old',docs:'docs/projects/old',assets:'public/old'};
  for(const folder of Object.values(paths))fs.mkdirSync(path.join(root,folder),{recursive:true});
  write('series/catalog.json',{schemaVersion:1,channels:[{id:'tam-ly-cuoc-song',title:'Tâm lý cuộc sống',studioFolder:'Test'}],series:[{id:'demo',channel:'tam-ly-cuoc-song',path:'series/tam-ly-cuoc-song/demo/series.json'}]});
  write('series/tam-ly-cuoc-song/demo/series.json',{schemaVersion:1,id:'demo',channel:'tam-ly-cuoc-song',title:'Demo',studioFolder:'Demo',formats:['short','long'],projects:[{id:'old',title:'Một ngày chưa tốt',status:'existing',format:'short',paths,registrations:[{id:'Old',kind:'Composition'},{id:'OldThumb',kind:'Still'}]}]});
  write('src/projects/registry.tsx',`import {Video} from './old/Video';import {Thumbnail} from './old/Thumbnail';
export const Projects=()=> <Folder name="Test"><Folder name="Demo"><Folder name="old"><Composition id="Old" component={Video} durationInFrames={1350} fps={30} width={1080} height={1920}/><Still id="OldThumb" component={Thumbnail} width={1080} height={1920}/></Folder></Folder></Folder>;`);
  write('src/projects/old/Video.tsx','original video code');
  write('src/projects/old/Thumbnail.tsx',"staticFile('old/images/cover.png')");
  write('src/projects/old/music.json',{speechVolume:.2});
  write('docs/projects/old/script.md','# Kịch bản\n\nNội dung tiếng Việt.');
  write('.env.local','SECRET=not-for-browser');
  write('library/books/private.pdf','private book');
  write('public/old/images/cover.png',Buffer.from('89504e470d0a1a0a','hex'));
  write('series/tam-ly-cuoc-song/demo/books/test-book/book.json',{title:'Sách thử',authors:['Tác giả'],status:'awaiting-source',sourceSha256:null});
  write('series/tam-ly-cuoc-song/demo/books/test-book/research.md','# Nghiên cứu\nChưa đọc.');
  const opened=[];
  const server=createManager({root,openFolder:async folder=>opened.push(folder)});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const first=await fetch(base+'/api/workspace'),workspace=await first.json();
  const post=(route,body,headers={})=>fetch(base+route,{method:'POST',headers:{Origin:base,'Content-Type':'application/json','X-Workspace-Token':workspace.token,...headers},body:JSON.stringify(body)});
  t.after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));fs.rmSync(root,{recursive:true,force:true});});
  return {root,write,base,workspace,post,opened};
}
test('serves existing catalog, native durations, book records and readable documents without modifying projects',async t=>{
  const f=await fixture(t);
  assert.equal(f.workspace.projects.length,1);assert.equal(f.workspace.projects[0].durationSeconds,45);assert.equal(f.workspace.books.length,1);
  const html=await fetch(f.base+'/');assert.equal(html.status,200);assert.match(await html.text(),/Không gian sáng tạo/);
  const text=await (await fetch(f.base+'/api/document?id=old&file=docs%2Fscript.md')).json();assert.match(text.text,/tiếng Việt/);
  const book=await (await fetch(f.base+'/api/book-document?series=demo&book=test-book&file=research.md')).json();assert.match(book.text,/Chưa đọc/);
  assert.equal(fs.readFileSync(path.join(f.root,'src/projects/old/Video.tsx'),'utf8'),'original video code');
});
test('private files, traversal, symlink escape, off-origin and invalid host are rejected',async t=>{
  const f=await fixture(t);
  for(const url of ['/.env.local','/library/books/private.pdf','/api/document?id=old&file=../../.env.local','/api/book-document?series=demo&book=test-book&file=../../../.env.local'])assert.ok(!(await fetch(f.base+url)).ok,url);
  fs.symlinkSync(path.join(f.root,'.env.local'),path.join(f.root,'docs/projects/old/leak.md'));
  assert.equal((await fetch(f.base+'/api/document?id=old&file=docs/leak.md')).status,400);
  assert.equal((await fetch(f.base+'/api/workspace',{headers:{Origin:'https://other.example'}})).status,403);
  const status=await new Promise((resolve,reject)=>{const req=require('node:http').get(f.base+'/api/workspace',{headers:{host:'other.example'}},response=>{response.resume();resolve(response.statusCode);});req.on('error',reject);});
  assert.equal(status,403);
});
test('notes are isolated, backed up, and stale editor writes cannot overwrite external edits',async t=>{
  const f=await fixture(t),detail=await (await fetch(f.base+'/api/project?id=old')).json();
  const saved=await f.post('/api/notes',{id:'old',text:'Ghi chú riêng',revision:detail.notesRevision});assert.equal(saved.status,200);
  const {revision}=await saved.json();
  assert.equal((await f.post('/api/notes',{id:'old',text:'Lần hai',revision})).status,200);
  assert.equal(fs.readdirSync(path.join(f.root,'docs/projects/old/.manager-history')).length,1);
  f.write('docs/projects/old/manager-notes.md','Sửa từ IDE');
  const conflict=await f.post('/api/notes',{id:'old',text:'Stale',revision});assert.equal(conflict.status,409);
  assert.equal(fs.readFileSync(path.join(f.root,'docs/projects/old/manager-notes.md'),'utf8'),'Sửa từ IDE');
  assert.equal(fs.readFileSync(path.join(f.root,'src/projects/old/music.json'),'utf8'),JSON.stringify({speechVolume:.2}));
});
test('mutations require origin and session token; planning creates no render or media',async t=>{
  const f=await fixture(t);
  const body={series:'demo',id:'new-project',title:'Ý tưởng mới',format:'short'};
  assert.equal((await f.post('/api/projects',body,{'X-Workspace-Token':'wrong'})).status,403);
  assert.equal((await f.post('/api/projects',body,{Origin:'https://other.example'})).status,403);
  assert.equal((await f.post('/api/projects',body)).status,201);
  assert.ok(fs.existsSync(path.join(f.root,'docs/projects/new-project/brief.md')));
  assert.ok(!fs.existsSync(path.join(f.root,'public/new-project')));
  assert.ok(!fs.existsSync(path.join(f.root,'src/projects/new-project')));
  assert.equal((await f.post('/api/projects',body)).status,400);
  assert.equal((await f.post('/api/render',{})).status,404);
});
test('folder opening is limited to known project directories and series cannot be created from the manager',async t=>{
  const f=await fixture(t);
  assert.equal((await f.post('/api/open-folder',{id:'old',group:'docs'})).status,200);
  assert.deepEqual(f.opened,[path.join(f.root,'docs/projects/old')]);
  assert.equal((await f.post('/api/open-folder',{id:'../../',group:'docs'})).status,400);
  assert.equal((await f.post('/api/series',{channel:'tam-ly-cuoc-song',id:'new-series',title:'Series mới',formats:'long,short'})).status,404);
  const next=await (await fetch(f.base+'/api/workspace')).json();assert.equal(next.series.length,1);
});
test('rendered media is discovered and served with seek ranges; source images are not rendered thumbnails',async t=>{
 const f=await fixture(t);f.write('projects/Old/Old.mp4','0123456789');f.write('projects/Old/OldThumb.png',Buffer.from('89504e470d0a1a0a','hex'));
 const data=await (await fetch(f.base+'/api/workspace')).json();assert.equal(data.projects[0].renderedVideo,true);assert.equal(data.projects[0].renderedThumbnail,true);
 const response=await fetch(f.base+'/api/media?id=old&kind=video',{headers:{Range:'bytes=2-5'}});assert.equal(response.status,206,await response.clone().text());assert.equal(await response.text(),'2345');assert.equal(response.headers.get('content-range'),'bytes 2-5/10');
 assert.equal((await fetch(f.base+'/api/media?id=old&kind=video',{headers:{Range:'bytes=20-30'}})).status,416);
 assert.equal((await fetch(f.base+'/api/media?id=old&kind=source')).status,404);
});
test('multiple book records accept private PDF copies without extraction, overwrites or arbitrary paths',async t=>{
 const f=await fixture(t);assert.equal((await f.post('/api/books',{series:'demo',id:'another-book',title:'Cuốn thứ hai',authors:'A, B'})).status,201);
 const upload=(name,bytes)=>fetch(f.base+'/api/book-source?series=demo&book=another-book&name='+encodeURIComponent(name),{method:'POST',headers:{Origin:f.base,'X-Workspace-Token':f.workspace.token,'Content-Type':'application/pdf'},body:bytes});
 assert.equal((await upload('source.pdf','%PDF-1.4\nfixture')).status,201);
 assert.equal((await upload('source.pdf','%PDF-1.4\nother')).status,400);
 assert.equal((await upload('../escape.pdf','%PDF-1.4')).status,400);
 assert.equal((await upload('fake.pdf','not a PDF')).status,400);
 assert.equal(fs.readFileSync(path.join(f.root,'library/books/another-book/sources/source.pdf'),'utf8'),'%PDF-1.4\nfixture');
 const data=await (await fetch(f.base+'/api/workspace')).json();assert.equal(data.books.length,2);assert.equal(data.books.find(b=>b.id==='another-book').sources.length,1);
 assert.equal((await fetch(f.base+'/library/books/another-book/sources/source.pdf')).status,404);
});
test('delete requires fresh confirmation; archives production files and removes only matching registry nodes',async t=>{
 const f=await fixture(t);f.write('projects/Old/Old.mp4','video');
 const plan=await (await f.post('/api/delete-preview',{kind:'project',id:'old'})).json();assert.equal(plan.registrations,2);assert.equal(plan.rendered,1);
 assert.equal((await f.post('/api/delete',{...plan})).status,400);
 f.write('docs/projects/old/new.md','new data');assert.equal((await f.post('/api/delete',{...plan,confirm:true})).status,400);
 const current=await (await f.post('/api/delete-preview',{kind:'project',id:'old'})).json();const response=await f.post('/api/delete',{...current,confirm:true});assert.equal(response.status,200,await response.clone().text());
 const result=await response.json();assert.equal(fs.existsSync(path.join(f.root,'src/projects/old')),false);assert.equal(fs.readFileSync(path.join(f.root,result.trash,'files/projects/Old/Old.mp4'),'utf8'),'video');
 assert.equal((await (await fetch(f.base+'/api/workspace')).json()).projects.length,0);
 require('../../scripts/catalog/catalog.cjs').validate(require('../../scripts/catalog/catalog.cjs').load(f.root));
});
test('series cannot be deleted from the manager',async t=>{
 const f=await fixture(t);const catalog=fs.readFileSync(path.join(f.root,'series/catalog.json'),'utf8');
 assert.equal((await f.post('/api/delete-preview',{kind:'series',id:'demo'})).status,400);
 assert.equal((await f.post('/api/delete',{kind:'series',id:'demo',revision:'x',confirm:true})).status,400);
 assert.equal(fs.readFileSync(path.join(f.root,'series/catalog.json'),'utf8'),catalog);
 assert.equal((await (await fetch(f.base+'/api/workspace')).json()).projects.length,1);
});
test('Studio launch validates the requested project composition before starting',async t=>{
 const f=await fixture(t);let starts=0;
 const server=createManager({root:f.root,ensureStudio:async()=>{starts++;}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(()=>{server.closeAllConnections();return new Promise(r=>server.close(r));});
 const base=`http://127.0.0.1:${server.address().port}`,token=(await (await fetch(base+'/api/workspace')).json()).token;
 const post=body=>fetch(base+'/api/studio',{method:'POST',headers:{Origin:base,'X-Workspace-Token':token,'Content-Type':'application/json'},body:JSON.stringify(body)});
 assert.equal((await post({id:'old',composition:'NotRegistered'})).status,400);assert.equal(starts,0);
 const res=await post({id:'old',composition:'Old'});assert.equal(res.status,200);assert.equal((await res.json()).url,'http://localhost:3000/Old');assert.equal(starts,1);
});
test('book covers stay scoped to book records, preserve old images and reject non-image input',async t=>{
 const f=await fixture(t),png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
 const upload=(body,book='test-book',token=f.workspace.token)=>fetch(f.base+'/api/book-cover?series=demo&book='+encodeURIComponent(book),{method:'POST',headers:{Origin:f.base,'X-Workspace-Token':token,'Content-Type':'image/png'},body});
 assert.equal((await fetch(f.base+'/api/book-cover?series=demo&book=test-book')).status,404);
 assert.equal((await upload(png,'test-book','bad-token')).status,403);
 const r=await upload(png);assert.equal(r.status,201);const first=await r.json();
 const image=await fetch(f.base+'/api/book-cover?series=demo&book=test-book');assert.equal(image.headers.get('content-type'),'image/png');assert.deepEqual(Buffer.from(await image.arrayBuffer()),png);
 assert.equal((await upload('<svg onload="alert(1)"/>')).status,400);
 assert.equal((await upload(png,'../test-book')).status,400);
 const second=Buffer.concat([png,Buffer.from('another image take')]);assert.equal((await upload(second)).status,201);
 const folder=path.join(f.root,'series/tam-ly-cuoc-song/demo/books/test-book/covers');assert.ok(fs.existsSync(path.join(folder,first.revision)));
 const ws=await (await fetch(f.base+'/api/workspace')).json();assert.notEqual(ws.books[0].cover,first.revision);
 assert.equal(JSON.parse(fs.readFileSync(path.join(f.root,'series/tam-ly-cuoc-song/demo/books/test-book/book.json'))).sourceSha256,null);
});
test('series workflow shows automation stages; only per-stage rules and notes are writable, with conflict check and history',async t=>{
 const f=await fixture(t),file=path.join(f.root,'series/tam-ly-cuoc-song/demo/workflow.json');
 const flow=await (await fetch(f.base+'/api/workflow?series=demo')).json();
 assert.equal(flow.profile,'philosophy');assert.equal(flow.stages[0].id,'brief');assert.equal(flow.stages.find(s=>s.id==='approve-script').automation.mode,'gate');
 assert.ok(flow.phases.flatMap(p=>p.stages).length===flow.stages.length);assert.equal(fs.existsSync(file),false);
 assert.equal((await f.post('/api/workflow',{series:'demo',stage:'script',rules:['Mở đầu bằng một tình huống cụ thể'],notes:'Tránh giọng giảng giải.',revision:'stale'})).status,409);
 assert.equal((await f.post('/api/workflow',{series:'demo',stage:'render-now',rules:[],notes:'x',revision:flow.revision})).status,400);
 assert.equal((await f.post('/api/workflow',{series:'../demo',stage:'script',rules:[],notes:'',revision:flow.revision})).status,400);
 assert.equal((await f.post('/api/workflow',{series:'demo',stage:'script',rules:['a'.repeat(501)],notes:'',revision:flow.revision})).status,400);
 const saved=await (await f.post('/api/workflow',{series:'demo',stage:'script',rules:[' Mở đầu bằng một tình huống cụ thể ',''],notes:'Tránh giọng giảng giải.',revision:flow.revision})).json();
 assert.deepEqual(JSON.parse(fs.readFileSync(file,'utf8')).stages.script,{rules:['Mở đầu bằng một tình huống cụ thể'],notes:'Tránh giọng giảng giải.'});
 // An external edit wins: the old revision is refused and the user's extra keys survive the next save.
 const external=JSON.parse(fs.readFileSync(file,'utf8'));external.owner='edited in IDE';fs.writeFileSync(file,JSON.stringify(external));
 assert.equal((await f.post('/api/workflow',{series:'demo',stage:'general',rules:['Giữ tông trầm'],notes:'',revision:saved.revision})).status,409);
 const fresh=await (await fetch(f.base+'/api/workflow?series=demo')).json();assert.deepEqual(fresh.stages.find(s=>s.id==='script').config.rules,['Mở đầu bằng một tình huống cụ thể']);
 assert.equal((await f.post('/api/workflow',{series:'demo',stage:'general',rules:['Giữ tông trầm'],notes:'',revision:fresh.revision})).status,200);
 const data=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(data.owner,'edited in IDE');assert.deepEqual(data.general.rules,['Giữ tông trầm']);
 assert.equal(fs.readdirSync(path.join(f.root,'series/tam-ly-cuoc-song/demo/.manager-history')).filter(n=>n.startsWith('workflow-')).length,1);
 assert.equal(fs.readFileSync(path.join(f.root,'docs/projects/old/script.md'),'utf8'),'# Kịch bản\n\nNội dung tiếng Việt.');
});
test('voice playlist: choose/unchoose presets by name with conflict check and history; narration untouched',async t=>{
 const f=await fixture(t),playlistFile=path.join(f.root,'scripts/shared/voice-playlists.json');
 f.write('public/voice-auditions/all-presets-v1/manifest.json',{text:'Mẫu',voices:[{id:'01-a',name:'An',gender:'Nam',region:'Bắc',file:'01-a.wav'},{id:'02-b',name:'Bình',gender:'Nữ',region:'Nam',file:'02-b.wav'}]});
 f.write('public/voice-auditions/all-presets-v1/01-a.wav','RIFF');f.write('scripts/projects/old/voice.json',{voice:'Bình'});
 f.write('scripts/shared/voice-playlists.json',JSON.stringify({schemaVersion:1,preferredPlaylist:'production',playlists:[{id:'production',name:'Giọng đã chọn',voiceNames:['An'],selectedFrom:{catalog:'all-presets-v1',numbers:[1]}}],policy:'Giữ nguyên.'},null,2)+'\n');
 const voices=await (await fetch(f.base+'/api/voices')).json();
 assert.deepEqual(voices.voices.map(v=>[v.name,v.preferred,v.usedBy.length,v.sample]),[['An',true,0,true],['Bình',false,1,false]]);
 assert.equal((await f.post('/api/voice-playlist',{voiceNames:['An','Bình'],revision:'stale'})).status,409);
 for(const bad of [['Ai đó'],['An','An'],'An'])assert.equal((await f.post('/api/voice-playlist',{voiceNames:bad,revision:voices.playlist.revision})).status,400);
 const saved=await (await f.post('/api/voice-playlist',{voiceNames:['An','Bình'],revision:voices.playlist.revision})).json();
 const data=JSON.parse(fs.readFileSync(playlistFile,'utf8'));
 assert.deepEqual(data.playlists[0].voiceNames,['An','Bình']);assert.deepEqual(data.playlists[0].selectedFrom.numbers,[1,2]);assert.equal(data.policy,'Giữ nguyên.');
 assert.equal((await f.post('/api/voice-playlist',{voiceNames:['Bình'],revision:saved.revision})).status,200);
 assert.equal(fs.readdirSync(path.join(f.root,'scripts/shared/.manager-history')).length,2);
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(f.root,'scripts/projects/old/voice.json'),'utf8')),{voice:'Bình'});
 assert.equal((await fetch(f.base+'/api/audio?kind=voice&key=01-a')).status,200);assert.equal((await fetch(f.base+'/api/audio?kind=voice&key=02-b')).status,404);
});
test('VoiceStudio launch requires the session token and returns the loopback URL',async t=>{
 const f=await fixture(t);let starts=0;
 const server=createManager({root:f.root,ensureVoiceStudio:async()=>{starts++;return {ready:true,url:'http://127.0.0.1:3900/',version:'test'};},voiceStudio:{status:async()=>({state:'off'}),stop:async()=>({stopped:0,forced:0})}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(()=>{server.closeAllConnections();return new Promise(r=>server.close(r));});
 const base=`http://127.0.0.1:${server.address().port}`,token=(await (await fetch(base+'/api/workspace')).json()).token;
 const post=(headers)=>fetch(base+'/api/voicestudio',{method:'POST',headers:{Origin:base,'Content-Type':'application/json',...headers},body:'{}'});
 assert.equal((await post({'X-Workspace-Token':'wrong'})).status,403);assert.equal(starts,0);
 const ok=await post({'X-Workspace-Token':token});assert.equal(ok.status,200);assert.equal((await ok.json()).url,'http://127.0.0.1:3900/');assert.equal(starts,1);
 assert.equal((await (await fetch(base+'/api/voicestudio')).json()).state,'off');assert.equal(starts,1);
});
test('VoiceStudio status is read-only; stop requires the session token',async t=>{
 const f=await fixture(t);let stops=0;
 const server=createManager({root:f.root,voiceStudio:{status:async()=>({state:'ready',version:'test',memoryBytes:1024,engine:{id:'voxcpm2',name:'VoxCPM2'}}),stop:async()=>{stops++;return {stopped:2,forced:0};}}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>{server.closeAllConnections();return new Promise(r=>server.close(r));});
 const base=`http://127.0.0.1:${server.address().port}`,token=(await (await fetch(base+'/api/workspace')).json()).token;
 const status=await (await fetch(base+'/api/voicestudio')).json();assert.equal(status.state,'ready');assert.equal(status.engine.id,'voxcpm2');assert.equal(stops,0);
 const post=headers=>fetch(base+'/api/voicestudio/stop',{method:'POST',headers:{Origin:base,'Content-Type':'application/json',...headers},body:'{}'});
 assert.equal((await post({'X-Workspace-Token':'wrong'})).status,403);assert.equal(stops,0);
 assert.equal((await post({'X-Workspace-Token':token,Origin:'https://evil.example'})).status,403);assert.equal(stops,0);
 const ok=await post({'X-Workspace-Token':token});assert.equal(ok.status,200);assert.deepEqual(await ok.json(),{stopped:2,forced:0});assert.equal(stops,1);
});
