/* "Thêm vào thư viện" UI against a temporary workspace; never writes to the real audio library. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {chromium}=require('playwright-core'),{createManager}=require('./server.cjs');
(async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'audio-upload-ui-')),out=path.resolve('.cache/project-manager/audio-upload');fs.mkdirSync(out,{recursive:true});
 const write=(p,v)=>{const f=path.join(root,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,typeof v==='string'?v:JSON.stringify(v));};
 write('series/catalog.json',{schemaVersion:1,channels:[{id:'demo',title:'Kênh thử',studioFolder:'Demo'}],series:[{id:'shorts',channel:'demo',path:'series/demo/shorts/series.json'}]});
 write('series/demo/shorts/series.json',{schemaVersion:1,id:'shorts',channel:'demo',title:'Series thử',studioFolder:'Shorts',formats:['short'],projects:[]});
 write('src/projects/registry.tsx','export const Projects=()=> <></>;');write('scripts/shared/voice-playlists.json',{schemaVersion:1,preferredPlaylist:'p',playlists:[{id:'p',name:'Thử',voiceNames:[]}]});
 fs.mkdirSync(path.join(root,'public/stoic/fonts'),{recursive:true});for(const name of ['NotoSans-Regular.ttf','NotoSans-Bold.ttf'])fs.copyFileSync(path.resolve('public/stoic/fonts',name),path.join(root,'public/stoic/fonts',name));
 const wav=Buffer.concat([Buffer.from('RIFF'),Buffer.alloc(4),Buffer.from('WAVE'),Buffer.alloc(256)]);
 const server=createManager({root});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome'});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const mark=s=>console.log('✓ '+s);
 try{
  await page.goto(`http://127.0.0.1:${server.address().port}/?view=music`,{waitUntil:'networkidle'});
  await page.locator('[data-add-audio]').click();await page.locator('#add-audio-form').waitFor();
  assert.equal(await page.locator('#audio-files').evaluate(n=>document.activeElement===n),true);
  await page.locator('#audio-files').setInputFiles({name:'Nhạc nền thử có tên rất dài để kiểm tra bố cục.wav',mimeType:'audio/wav',buffer:wav});
  await page.locator('#audio-title').fill('Bình minh trên trang sách');await page.locator('#audio-artists').fill('Kênh tự soạn');
  await page.screenshot({path:path.join(out,'form-1440.png')});
  await page.locator('#add-audio-submit').click();
  await page.locator('.resource-row',{hasText:'Bình minh trên trang sách'}).waitFor();
  assert.ok(fs.existsSync(path.join(root,'public/audio-library/music/Nhạc nền thử có tên rất dài để kiểm tra bố cục.wav')));
  assert.equal(await page.locator('#resource-filter').inputValue(),'unused');mark('Music copied from a picked file, credited, shown under "Chưa dùng"');
  await page.locator('[data-add-audio]').click();await page.locator('input[name="audio-kind"][value="sfx"]').check();
  await page.locator('#audio-files').setInputFiles([{name:'gio-thoang.wav',mimeType:'audio/wav',buffer:wav},{name:'trang-sach.wav',mimeType:'audio/wav',buffer:wav}]);
  await page.locator('#add-audio-submit').click();await page.locator('.resource-row',{hasText:'trang-sach'}).waitFor();
  assert.equal(await page.locator('[data-music-tab="effects"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('.resource-row',{hasText:'Thư viện dùng chung'}).count(),2);mark('Two SFX copied at once, listed in the shared library filter');
  await page.locator('[data-add-audio]').click();await page.locator('#audio-files').setInputFiles({name:'gio-thoang.wav',mimeType:'audio/wav',buffer:wav});
  await page.locator('#add-audio-submit').click();await page.waitForFunction(()=>/đã có file cùng tên/.test(document.querySelector('#add-audio-status')?.textContent||''));
  await page.locator('#audio-files').setInputFiles({name:'gia-mao.wav',mimeType:'audio/wav',buffer:Buffer.from('plain text pretending to be audio')});
  await page.locator('#add-audio-submit').click();await page.waitForFunction(()=>/không phải WAV/.test(document.querySelector('#add-audio-status')?.textContent||''));
  assert.deepEqual(fs.readdirSync(path.join(root,'public/audio-library/sfx')).sort(),['gio-thoang.wav','trang-sach.wav']);mark('Duplicate name and fake audio are refused with a readable message; nothing overwritten');
  for(const width of [1440,768,390]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`no overflow at ${width}`);await page.screenshot({path:path.join(out,`form-${width}.png`),fullPage:true});}
  mark('Desktop, tablet and mobile fit without horizontal overflow');
  assert.deepEqual(errors.filter(e=>!/409|400|Failed to load resource/.test(e)),[]);mark('No browser errors; fixture workspace only');
 }finally{await browser.close();server.close();fs.rmSync(root,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
