/* Full upload UI against a temporary workspace; never modifies real books. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {chromium}=require('playwright-core'),{createManager}=require('./server.cjs');
(async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'book-cover-ui-')),out=path.resolve('.cache/project-manager/book-cover');fs.mkdirSync(out,{recursive:true});
 const write=(p,v)=>{const f=path.join(root,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,typeof v==='string'?v:JSON.stringify(v));};
 write('series/catalog.json',{schemaVersion:1,channels:[{id:'demo',title:'Kênh thử',studioFolder:'Demo'}],series:[{id:'books',channel:'demo',path:'series/demo/books/series.json'}]});
 write('series/demo/books/series.json',{schemaVersion:1,id:'books',channel:'demo',title:'Tủ sách thử',studioFolder:'Books',formats:['long'],projects:[]});
 write('series/demo/books/books/sample/book.json',{title:'Một cuốn sách thử có tên dài để kiểm tra ảnh bìa',authors:['Tác giả thử'],status:'awaiting-source'});
 write('series/demo/books/books/sample/research.md','# Nghiên cứu\nTài liệu thử.');write('src/projects/registry.tsx','export const Projects=()=> <></>;');
 fs.mkdirSync(path.join(root,'public/stoic/fonts'),{recursive:true});for(const name of ['NotoSans-Regular.ttf','NotoSans-Bold.ttf'])fs.copyFileSync(path.resolve('public/stoic/fonts',name),path.join(root,'public/stoic/fonts',name));
 const server=createManager({root});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome'});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const png=async color=>Buffer.from(await page.evaluate(color=>{const c=document.createElement('canvas');c.width=400;c.height=400;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,400,400);x.fillStyle=color;x.fillRect(100,10,200,380);x.fillStyle='white';x.font='bold 34px sans-serif';x.fillText('BÌA SÁCH',100,200);return c.toDataURL('image/png').split(',')[1];},color),'base64');
 try{
  await page.goto(`http://127.0.0.1:${server.address().port}/?view=books`,{waitUntil:'networkidle'});await page.locator('.book-card .card-title').click();
  await page.locator('#book-cover-upload').setInputFiles({name:'cover.png',mimeType:'image/png',buffer:await png('#234d72')});
  await page.locator('#drawer .uploaded-book-cover').waitFor();await page.waitForFunction(()=>document.querySelector('#drawer .uploaded-book-cover')?.naturalWidth===400);
  const first=await page.locator('#drawer .uploaded-book-cover').getAttribute('src');await page.screenshot({path:path.join(out,'editor.png')});
  await page.locator('#book-cover-upload').setInputFiles({name:'replacement.png',mimeType:'image/png',buffer:await png('#73462b')});
  await page.waitForFunction(first=>document.querySelector('#drawer .uploaded-book-cover')?.getAttribute('src')!==first,first);
  await page.waitForFunction(()=>document.querySelector('#drawer .uploaded-book-cover')?.naturalWidth===400);
  await page.locator('#close-drawer').click();await page.locator('.book-card .uploaded-book-cover').waitFor();
  await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelector('.book-card .uploaded-book-cover')?.naturalWidth===400);
  const ratio=await page.locator('.book-card .book-image-frame').evaluate(n=>n.clientWidth/n.clientHeight);assert.ok(ratio>.52&&ratio<.55,'White padding is hidden without distorting the portrait cover');
  for(const width of [1440,768,390]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(out,`library-${width}.png`)});}
  await page.locator('.book-card .card-title').click();await page.screenshot({path:path.join(out,'editor-mobile.png')});
  assert.equal(fs.readdirSync(path.join(root,'series/demo/books/books/sample/covers')).filter(n=>n.endsWith('.png')).length,2);
  assert.deepEqual(errors,[]);console.log('✓ Upload, replace, persistent library cover, two retained takes and responsive layout; fixture only');
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));fs.rmSync(root,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
