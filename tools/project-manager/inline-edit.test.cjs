/* In-place editing of book title/authors and shared audio title/artists, against a temporary workspace. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {Readable}=require('node:stream');
const {chromium}=require('playwright-core'),{createManager}=require('./server.cjs'),{createLibrary}=require('./library.cjs');
(async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'inline-edit-ui-')),out=path.resolve('.cache/project-manager/inline-edit');fs.mkdirSync(out,{recursive:true});
 const write=(p,v)=>{const f=path.join(root,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,typeof v==='string'?v:JSON.stringify(v,null,2)+'\n');};
 write('series/catalog.json',{schemaVersion:1,channels:[{id:'demo',title:'Kênh thử',studioFolder:'Demo'}],series:[{id:'books',channel:'demo',path:'series/demo/books/series.json'}]});
 write('series/demo/books/series.json',{schemaVersion:1,id:'books',channel:'demo',title:'Tủ sách thử',studioFolder:'Books',formats:['long'],projects:[]});
 write('series/demo/books/books/sample/book.json',{id:'sample',title:'Tên sách gõ sai',authors:['Tác giả sai'],status:'research',sourceSha256:'abc',note:'Ghi chú phải giữ nguyên.'});
 write('series/demo/books/books/sample/research.md','# Nghiên cứu\nTài liệu thử.');write('src/projects/registry.tsx','export const Projects=()=> <></>;');
 write('scripts/shared/voice-playlists.json',{schemaVersion:1,preferredPlaylist:'p',playlists:[{id:'p',name:'Thử',voiceNames:[]}]});
 fs.mkdirSync(path.join(root,'public/stoic/fonts'),{recursive:true});for(const name of ['NotoSans-Regular.ttf','NotoSans-Bold.ttf'])fs.copyFileSync(path.resolve('public/stoic/fonts',name),path.join(root,'public/stoic/fonts',name));
 await createLibrary(root).addAudio({kind:'music',name:'Pufino - Enlivening.mp3',title:'Pufino',artists:'Enlivening'},Readable.from([Buffer.concat([Buffer.from('ID3'),Buffer.alloc(64)])]));
 const server=createManager({root});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome'});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const base=`http://127.0.0.1:${server.address().port}`,mark=s=>console.log('✓ '+s);
 try{
  await page.goto(base+'/?view=books#book/books/sample',{waitUntil:'networkidle'});await page.locator('[data-edit-book]').click();
  assert.equal(await page.locator('#book-title-input').evaluate(n=>document.activeElement===n),true);
  await page.keyboard.press('Escape');assert.ok(await page.locator('#drawer').isVisible(),'Escape cancels the edit, not the page');assert.equal(await page.locator('#drawer-title').innerText(),'Tên sách gõ sai');
  await page.locator('[data-edit-book]').click();await page.locator('#book-title-input').fill('Hiểu về trái tim');await page.locator('#book-authors-input').fill('Minh Niệm');
  await page.screenshot({path:path.join(out,'book-edit-1440.png')});await page.locator('#book-identity-form button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#drawer-title')?.textContent==='Hiểu về trái tim');
  assert.match(await page.locator('#drawer-breadcrumb').innerText(),/Hiểu về trái tim/);
  await page.locator('.book-cover-preview',{hasText:'Hiểu về trái tim'}).waitFor();await page.locator('#document-view',{hasText:'Minh Niệm'}).waitFor();
  const book=JSON.parse(fs.readFileSync(path.join(root,'series/demo/books/books/sample/book.json'),'utf8'));
  assert.deepEqual([book.title,book.authors,book.note,book.sourceSha256],['Hiểu về trái tim',['Minh Niệm'],'Ghi chú phải giữ nguyên.','abc']);
  assert.equal(fs.readdirSync(path.join(root,'series/demo/books/books/sample/.manager-history')).length,1);mark('Book title/authors edited in place; other book.json fields and history kept');
  write('series/demo/books/books/sample/book.json',{...book,title:'Sửa ở nơi khác'});
  await page.locator('[data-edit-book]').click();await page.locator('#book-title-input').fill('Ghi đè?');await page.locator('#book-identity-form button[type=submit]').click();
  await page.waitForFunction(()=>/nơi khác/.test(document.querySelector('#book-identity-status')?.textContent||''));
  assert.equal(JSON.parse(fs.readFileSync(path.join(root,'series/demo/books/books/sample/book.json'),'utf8')).title,'Sửa ở nơi khác');mark('External edit wins: stale save refused');
  await page.goto(base+'/?view=music',{waitUntil:'networkidle'});await page.locator('#resource-filter').selectOption('');
  await page.locator('.resource-row',{hasText:'Pufino'}).locator('[data-expand]').click();
  const form=page.locator('.audio-meta-form');await form.locator('input[name=title]').fill('Enlivening');await form.locator('input[name=artists]').fill('Pufino');
  await page.screenshot({path:path.join(out,'audio-edit-1440.png')});await form.locator('button[type=submit]').click();
  await page.locator('.resource-row',{hasText:'Enlivening'}).locator('small',{hasText:'Pufino'}).waitFor();
  const meta=JSON.parse(fs.readFileSync(path.join(root,'scripts/shared/audio-library.json'),'utf8')).files['audio-library/music/Pufino - Enlivening.mp3'];
  assert.deepEqual([meta.title,meta.artists],['Enlivening',['Pufino']]);mark('Shared track title/artists edited in place');
  for(const width of [768,390]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(out,`audio-edit-${width}.png`),fullPage:true});}
  await page.goto(base+'/?view=books#book/books/sample',{waitUntil:'networkidle'});await page.locator('[data-edit-book]').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(out,'book-edit-390.png')});
  mark('Tablet and mobile fit without horizontal overflow');
  assert.deepEqual(errors.filter(e=>!/409|Failed to load resource/.test(e)),[]);mark('No browser errors; fixture workspace only');
 }finally{await browser.close();server.close();fs.rmSync(root,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
