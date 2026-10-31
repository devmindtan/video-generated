/* Voice reference UI (add with consent, choose window on the waveform, preview, cut) on a temporary workspace. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {chromium}=require('playwright-core'),{createManager}=require('./server.cjs');
(async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'voice-refs-ui-')),out=path.resolve('.cache/project-manager/voice-refs');fs.mkdirSync(out,{recursive:true});
 const write=(p,v)=>{const f=path.join(root,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,typeof v==='string'?v:JSON.stringify(v));};
 write('series/catalog.json',{schemaVersion:1,channels:[{id:'demo',title:'Kênh thử',studioFolder:'Demo'}],series:[{id:'shorts',channel:'demo',path:'series/demo/shorts/series.json'}]});
 write('series/demo/shorts/series.json',{schemaVersion:1,id:'shorts',channel:'demo',title:'Series thử',studioFolder:'Shorts',formats:['short'],projects:[]});
 write('src/projects/registry.tsx','export const Projects=()=> <></>;');write('scripts/shared/voice-playlists.json',{schemaVersion:1,preferredPlaylist:'p',playlists:[{id:'p',name:'Thử',voiceNames:[]}]});
 fs.mkdirSync(path.join(root,'public/stoic/fonts'),{recursive:true});for(const name of ['NotoSans-Regular.ttf','NotoSans-Bold.ttf'])fs.copyFileSync(path.resolve('public/stoic/fonts',name),path.join(root,'public/stoic/fonts',name));
 fs.mkdirSync(path.join(root,'node_modules/@remotion'),{recursive:true});fs.symlinkSync(path.resolve('node_modules/@remotion/compositor-linux-x64-gnu'),path.join(root,'node_modules/@remotion/compositor-linux-x64-gnu'));
 const rate=16000,secs=45,n=rate*secs,wav=Buffer.alloc(44+n*2);
 wav.write('RIFF',0);wav.writeUInt32LE(36+n*2,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(n*2,40);
 for(let i=0;i<n;i++){const t=i/rate;wav.writeInt16LE((t>4&&t<10)||(t%2.5)>2.1?0:Math.round(Math.sin(2*Math.PI*170*t)*9000),44+i*2);}
 const server=createManager({root});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome'});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const mark=s=>console.log('✓ '+s);
 try{
  await page.goto(`http://127.0.0.1:${server.address().port}/?view=voices`,{waitUntil:'networkidle'});
  await page.locator('[data-add-ref]').click();await page.locator('#ref-file').setInputFiles({name:'Giọng thu ở nhà.wav',mimeType:'audio/wav',buffer:wav});
  await page.locator('#ref-speaker').fill('Hiếu');await page.locator('#add-ref-form button[type=submit]').click();
  await page.waitForFunction(()=>/xác nhận/i.test(document.querySelector('#add-ref-status')?.textContent||''));mark('Consent is required before adding');
  await page.locator('input[name="ref-consent"][value="self"]').check();await page.locator('#add-ref-form button[type=submit]').click();
  const card=page.locator('.ref-row').first();await card.waitFor();await card.locator('.ref-wave').waitFor();
  assert.equal(await card.locator('.ref-wave .ref-bars rect').count(),900);
  const suggested=await card.locator('.ref-start').inputValue(),[mm,ss]=suggested.split(':').map(Number),at=mm*60+ss;assert.ok(at>=9.5||at+15<=4.5,'suggestion skips the silent gap: '+suggested);
  await page.screenshot({path:path.join(out,'refs-1440.png'),fullPage:true});mark('Recording added privately with waveform and a suggested 15 s window');
  const box=await card.locator('.ref-wave').boundingBox();await page.mouse.click(box.x+box.width*.5,box.y+box.height/2);
  assert.match(await card.locator('.ref-start').inputValue(),/^0:2[0-3]/);
  await card.locator('.ref-wave').press('ArrowRight');assert.match(await card.locator('.ref-start').inputValue(),/^0:2[1-4]/);
  await card.locator('.ref-len').selectOption('10');assert.match(await card.locator('.ref-range').innerText(),/–/);
  await card.locator('[data-ref-suggest]').click();assert.equal(await card.locator('.ref-start').inputValue(),suggested);
  await card.locator('.ref-start').fill('0:30');await card.locator('.ref-start').press('Tab');assert.equal(await card.locator('.ref-start').inputValue(),'0:30.0');
  await card.locator('.ref-len').selectOption('20');assert.equal(await card.locator('.ref-start').inputValue(),'0:25.0','window clamped to the end of the recording');mark('Waveform click, arrow keys, time input, length and suggestion move the window');
  await card.locator('[data-ref-preview]').click();await page.waitForFunction(()=>document.querySelector('[data-ref-preview]')?.getAttribute('aria-pressed')==='true');
  await card.locator('[data-ref-preview]').click();assert.equal(await card.locator('[data-ref-preview]').getAttribute('aria-pressed'),'false');mark('Preview plays the chosen window and stops');
  await card.locator('[data-ref-cut]').click();await page.locator('.ref-clips li').first().waitFor();
  assert.equal(await card.locator('.ref-wave').count(),0,'editor gone: full recording deleted');assert.ok(!fs.existsSync(path.join(root,'library/voice-references/giong-thu-o-nha/source.wav')));
  const clipPath=await page.locator('.ref-clips code').first().innerText();assert.match(clipPath,/^library\/voice-references\/giong-thu-o-nha\/clips\/000250-20s\.wav$/);
  assert.ok(fs.existsSync(path.join(root,clipPath)));assert.equal(await card.locator('.ref-command').getAttribute('open'),null,'clone command starts collapsed');assert.match(await card.locator('.ref-command code').textContent(),/--consent self/);await card.locator('[data-ref-toggle]').click();assert.equal(await page.locator('.ref-panel').count(),0);assert.match(await card.locator('.row-title small').innerText(),/1 đoạn mẫu/);
  mark('Clip cut, full recording deleted, row collapses to one compact line');
  for(const width of [768,390]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no overflow at '+width);await page.screenshot({path:path.join(out,`refs-${width}.png`),fullPage:true});}
  mark('Tablet and mobile fit without horizontal overflow');
  assert.deepEqual(errors.filter(e=>!/Failed to load resource|404/.test(e)),[]);mark('No browser errors; fixture workspace only');
 }finally{await browser.close();server.close();fs.rmSync(root,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
