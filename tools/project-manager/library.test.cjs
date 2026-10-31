/* Browser QA of the voice and music library against the real local workspace. Read-only: the playlist save
   is intercepted in the browser (its server write is covered by manager.test.cjs fixtures). Screenshots go to .cache/. */
const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const base=process.env.MANAGER_TEST_URL||'http://127.0.0.1:4310',out=path.resolve('.cache/project-manager/library');fs.mkdirSync(out,{recursive:true});
 const playlistBefore=fs.readFileSync('scripts/shared/voice-playlists.json','utf8');
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage({viewport:{width:1440,height:1000},locale:'vi-VN'}),errors=[],saves=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route('**/api/voice-playlist',route=>{const body=route.request().postDataJSON();saves.push(body);route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({revision:'test-'+saves.length,voiceNames:body.voiceNames})});});
 const mark=s=>console.log('✓ '+s),shot=name=>page.screenshot({path:path.join(out,name+'.png')});
 const overflow=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Unexpected horizontal overflow');
 const rows=page.locator('#resource-list > .resource-row');
 try{
  await page.goto(base,{waitUntil:'networkidle'});await page.locator('[data-nav="voices"]').click();await page.locator('#resource-list .voice-card').first().waitFor();
  assert.deepEqual(await page.locator('#breadcrumb li').allTextContents(),['Tổng quan','Giọng đọc']);
  const chosen=page.locator('#chosen-list .voice-card'),all=page.locator('#resource-list .voice-card');
  const chosenBefore=await chosen.count();assert.ok(chosenBefore>=1);assert.equal(await all.count(),25);
  await overflow();await shot('voices');mark(`Voices: ${chosenBefore} chosen and all 25 presets`);
  // Choose a voice that is not chosen yet, then remove it again.
  const candidate=all.filter({has:page.locator('[data-pick-voice][aria-pressed="false"]')}).first(),name=await candidate.locator('h3').evaluate(h=>h.firstChild.textContent.trim());
  await candidate.locator('[data-pick-voice]').click();await page.locator('#toast:not([hidden])').filter({hasText:'Đã thêm'}).waitFor();
  assert.equal(await chosen.count(),chosenBefore+1);assert.ok(saves[0].voiceNames.includes(name));
  assert.equal(await page.locator(`#resource-list [data-pick-voice="${name}"]`).getAttribute('aria-pressed'),'true');
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.pickVoice),name);await shot('voice-chosen');
  await page.locator(`#chosen-list [data-pick-voice="${name}"]`).click();await page.locator('#toast:not([hidden])').filter({hasText:'Đã bỏ'}).waitFor();
  assert.equal(await chosen.count(),chosenBefore);assert.ok(!saves[1].voiceNames.includes(name));assert.equal(saves[1].revision,'test-1');
  mark('Choose and unchoose a voice from the page (revision carried between saves)');
  await page.locator('#resource-search').fill('quoc tuan');await page.waitForTimeout(200);
  assert.equal(await all.count(),1);assert.equal(await page.evaluate(()=>document.activeElement.id),'resource-search');
  assert.match(await page.locator('#resource-count').innerText(),/^1 \/ 25/);
  await page.locator('#resource-search').fill('mot ngay lam chua tot');await page.waitForTimeout(200);
  assert.ok(await all.filter({hasText:'Quốc Tuấn'}).count()===1);mark('Voice search is accent-insensitive and also matches episode titles; focus stays in the box');
  await page.locator('#resource-search').fill('');await page.locator('#voice-gender').selectOption('Nữ');await page.locator('#voice-use').selectOption('unused');
  const filtered=await all.count();assert.ok(filtered>0&&filtered<25);await page.locator('#voice-gender').selectOption('');await page.locator('#voice-use').selectOption('');mark('Gender and usage filters');
  const play=all.filter({hasText:'Quốc Tuấn'}).locator('[data-play]');await play.click();
  await page.locator('#player-bar:not([hidden])').waitFor();await page.waitForFunction(()=>!document.querySelector('#player-audio').paused);
  assert.equal(await page.locator('#player-title').innerText(),'Quốc Tuấn');assert.equal(await play.getAttribute('aria-label'),'Tạm dừng Quốc Tuấn');
  await play.click();await page.waitForFunction(()=>document.querySelector('#player-audio').paused&&[...document.querySelectorAll('[data-play="voice"]')].every(b=>b.getAttribute('aria-pressed')==='false'));await play.click();await play.click();await page.waitForTimeout(300);
  assert.ok(await page.locator('#toast').isHidden()||!(await page.locator('#toast').innerText()).includes('Không phát'),'Pausing must not report an error');mark('Shared player plays/pauses a voice sample');
  for(const bad of ['kind=music&key=..%2F.env.local','kind=music&key=one-bad-day%2Fbackups%2Fvoice-v1%2Fa.wav','kind=voice&key=..%2F..%2Fpackage','kind=file&key=Sahara.mp3'])assert.equal((await page.request.get(base+'/api/audio?'+bad)).status(),404,bad);
  mark('Audio route refuses unlisted paths and backups');

  await page.locator('[data-nav="music"]').click();await rows.first().waitFor();
  const total=await rows.count();assert.ok(total>=10);
  assert.match(await rows.first().innerText(),/Night/);mark(`Music rows sorted by use (${total} tracks)`);
  await page.locator('#resource-search').fill('snowfall');await page.waitForTimeout(200);assert.equal(await rows.count(),1);
  await page.locator('#resource-search').fill('mot ngay lam chua tot');await page.waitForTimeout(200);assert.match(await rows.first().innerText(),/Night/);
  await page.locator('#resource-search').fill('');await page.waitForTimeout(200);mark('Music search matches title and episode name');
  await page.locator('.resource-summary [data-resource-filter="uncredited"]').click();
  const uncredited=await rows.count();assert.ok(uncredited>0&&uncredited<total);assert.equal(await page.locator('#resource-filter').inputValue(),'uncredited');
  await page.locator('#resource-filter').selectOption('unused');assert.ok(await rows.count()>=1);assert.match(await rows.first().innerText(),/Chưa dùng/);
  await page.locator('#resource-filter').selectOption('');await page.locator('#resource-sort').selectOption('title');mark('Missing-credit shortcut, filters and sort');
  await page.locator('#resource-sort').selectOption('used');
  const night=rows.filter({hasText:'Night'}).first();await night.locator('[data-expand]').click();
  assert.equal(await night.locator('[data-expand]').getAttribute('aria-expanded'),'true');assert.ok(await night.locator('.usage-table tbody tr').count()>=10);
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.expand),await night.locator('[data-expand]').getAttribute('data-expand'));
  await shot('music-detail');mark('Track detail lists episodes with speech/pause levels and credit');
  await night.locator('[data-play]').click();await page.waitForFunction(()=>!document.querySelector('#player-audio').paused);
  assert.equal(await page.locator('#player-title').innerText(),'Night');
  await page.locator('#player-audio').evaluate(a=>{a.currentTime=120;});await page.waitForFunction(()=>document.querySelector('#player-audio').currentTime>=120);
  await page.locator('[data-nav="all"]').click();await page.locator('.project-card').first().waitFor();
  assert.ok(await page.locator('#player-bar').isVisible());assert.ok(!(await page.locator('#player-audio').evaluate(a=>a.paused)));
  mark('Full recording seeks in the player and keeps playing while browsing projects');
  await page.goBack();await rows.first().waitFor();assert.equal(await night.locator('[data-play]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-music-tab="effects"]').click();await rows.first().waitFor();assert.ok(await rows.count()>=4);
  await page.locator('#resource-filter').selectOption('off');assert.ok(await rows.count()>=1);await page.locator('#resource-filter').selectOption('');
  await shot('effects');mark('Effects tab with on/off filter');
  await page.locator('#player-toggle').click();await page.waitForFunction(()=>document.querySelector('#player-audio').paused&&/^Phát /.test(document.querySelector('#player-toggle').getAttribute('aria-label')));
  await page.locator('#player-toggle').click();await page.waitForFunction(()=>!document.querySelector('#player-audio').paused);mark('Player bar has its own play/pause control');
  await page.locator('#player-close').click();assert.ok(await page.locator('#player-bar').isHidden());
  for(const [w,h,view] of [[1024,900,'music'],[768,1000,'voices'],[390,844,'voices'],[390,844,'music']]){
   await page.setViewportSize({width:w,height:h});await page.goto(`${base}/?view=${view}`,{waitUntil:'networkidle'});await page.locator('#resource-list > *').first().waitFor();
   if(view==='music'){await rows.first().locator('[data-expand]').click();await rows.first().locator('[data-play]').click();await page.locator('#player-bar:not([hidden])').waitFor();}
   await overflow();await shot(`${view}-${w}`);
  }
  mark('Desktop, tablet and mobile fit without horizontal overflow (player and detail open)');
  assert.equal(fs.readFileSync('scripts/shared/voice-playlists.json','utf8'),playlistBefore);
  assert.deepEqual(errors,[]);mark('No browser errors; real playlist file unchanged');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
