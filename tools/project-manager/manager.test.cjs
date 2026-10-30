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
test('folder opening is limited to known project directories and new series uses catalog workflow',async t=>{
  const f=await fixture(t);
  assert.equal((await f.post('/api/open-folder',{id:'old',group:'docs'})).status,200);
  assert.deepEqual(f.opened,[path.join(f.root,'docs/projects/old')]);
  assert.equal((await f.post('/api/open-folder',{id:'../../',group:'docs'})).status,400);
  assert.equal((await f.post('/api/series',{channel:'tam-ly-cuoc-song',id:'new-series',title:'Series mới',formats:'long,short'})).status,201);
  const next=await (await fetch(f.base+'/api/workspace')).json();assert.equal(next.series.length,2);
});
test('rendered media is discovered and served with seek ranges; source images are not rendered thumbnails',async t=>{
 const f=await fixture(t);f.write('projects/Old/Old.mp4','0123456789');f.write('projects/Old/OldThumb.png',Buffer.from('89504e470d0a1a0a','hex'));
 const data=await (await fetch(f.base+'/api/workspace')).json();assert.equal(data.projects[0].renderedVideo,true);assert.equal(data.projects[0].renderedThumbnail,true);
 const response=await fetch(f.base+'/api/media?id=old&kind=video',{headers:{Range:'bytes=2-5'}});assert.equal(response.status,206);assert.equal(await response.text(),'2345');assert.equal(response.headers.get('content-range'),'bytes 2-5/10');
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
test('empty and populated series deletion preserve private book sources and validate catalog',async t=>{
 const f=await fixture(t);await f.post('/api/series',{channel:'tam-ly-cuoc-song',id:'empty',title:'Trống',formats:'short'});
 let plan=await (await f.post('/api/delete-preview',{kind:'series',id:'empty'})).json();assert.equal(plan.projectCount,0);assert.equal(plan.registrations,0);
 assert.equal((await f.post('/api/delete',{...plan,confirm:true})).status,200);
 plan=await (await f.post('/api/delete-preview',{kind:'series',id:'demo'})).json();assert.equal(plan.projectCount,1);
 assert.equal((await f.post('/api/delete',{...plan,confirm:true})).status,200);
 assert.equal((await (await fetch(f.base+'/api/workspace')).json()).series.length,0);assert.equal(fs.existsSync(path.join(f.root,'library/books/private.pdf')),true);
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
