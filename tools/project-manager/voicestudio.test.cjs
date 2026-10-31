/* Browser QA of the VoiceStudio status panel and stop button. Every VoiceStudio API call is mocked in the
   browser, so the test never starts or stops the real VoiceStudio. Screenshots go to .cache/. */
const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const base=process.env.MANAGER_TEST_URL||'http://127.0.0.1:4310',out=path.resolve('.cache/project-manager/voicestudio');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome'});
 const ctx=await browser.newContext({viewport:{width:1440,height:900},locale:'vi-VN'}),page=await ctx.newPage(),errors=[],calls=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 let current={state:'off',missing:[],processes:0,memoryBytes:0};
 const ready={state:'ready',version:'0.5.7',device:'cpu',engine:{id:'voxcpm2',name:'VoxCPM2'},processes:2,memoryBytes:7.3*1073741824,missing:[],url:'http://127.0.0.1:3900/'};
 await ctx.route('**/api/voicestudio**',async route=>{
  const r=route.request(),u=new URL(r.url());calls.push(`${r.method()} ${u.pathname}`);
  if(r.method()==='GET')return route.fulfill({json:current});
  if(u.pathname.endsWith('/stop')){await new Promise(x=>setTimeout(x,400));current={state:'off',missing:[],processes:0,memoryBytes:0};return route.fulfill({json:{stopped:2,forced:0}});}
  current=ready;return route.fulfill({json:{ready:true,url:'about:blank#voicestudio',version:'0.5.7'}});
 });
 const mark=s=>console.log('✓ '+s),panel=page.locator('#vs-panel'),dot=page.locator('#navigation [data-open-voicestudio] .vs-dot');
 try{
  await page.goto(base+'/?view=voices',{waitUntil:'networkidle'});await panel.locator('.vs-state').waitFor();
  assert.equal(await panel.locator('.vs-state').innerText(),'Đã tắt');assert.equal(await panel.locator('[data-stop-voicestudio]').count(),0);
  assert.match(await panel.locator('[data-open-voicestudio]').innerText(),/Bật và mở/);assert.match(await dot.getAttribute('class'),/vs-off/);
  await page.screenshot({path:path.join(out,'off.png')});mark('Off: status shown, only the open button, grey sidebar dot');
  const [tab]=await Promise.all([ctx.waitForEvent('page'),panel.locator('[data-open-voicestudio]').click()]);
  await page.waitForFunction(()=>document.querySelector('#vs-panel .vs-state')?.textContent==='Đang chạy');await tab.close();
  assert.match(await panel.locator('.vs-meta').innerText(),/VoiceStudio 0\.5\.7 · Engine VoxCPM2 · RAM 7,3 GB · Chạy trên CPU/);
  assert.match(await dot.getAttribute('class'),/vs-ready/);assert.equal(await panel.locator('[data-stop-voicestudio]').innerText(),'Tắt');
  await panel.screenshot({path:path.join(out,'ready.png')});mark('Opening starts it; panel shows version, engine, RAM; green dot; stop button appears');
  page.once('dialog',d=>d.dismiss());await panel.locator('[data-stop-voicestudio]').click();await page.waitForTimeout(200);
  assert.ok(!calls.includes('POST /api/voicestudio/stop'));assert.equal(await panel.locator('.vs-state').innerText(),'Đang chạy');mark('Cancelling the confirmation keeps it running');
  page.once('dialog',d=>d.accept());await panel.locator('[data-stop-voicestudio]').click();
  await page.waitForFunction(()=>document.querySelector('#vs-panel .vs-state')?.textContent==='Đang tắt…');
  await page.locator('#toast:not([hidden])').filter({hasText:'Đã tắt Studio giọng nói'}).waitFor();
  await page.waitForFunction(()=>document.querySelector('#vs-panel .vs-state')?.textContent==='Đã tắt');
  assert.equal(calls.filter(c=>c==='POST /api/voicestudio/stop').length,1);assert.equal(await panel.locator('[data-stop-voicestudio]').count(),0);
  assert.equal(await page.evaluate(()=>document.activeElement?.hasAttribute('data-open-voicestudio')),true);mark('Confirmed stop: stopping state, toast, back to off, focus on open button');
  current={state:'occupied',missing:[],processes:0,memoryBytes:0};await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  await page.waitForFunction(()=>/bị ứng dụng khác chiếm/.test(document.querySelector('#vs-panel .vs-state')?.textContent));
  assert.ok(await panel.locator('[data-open-voicestudio]').isDisabled());mark('Port taken by another app: warning and open disabled');
  current=ready;await page.locator('[data-nav="all"]').click();await page.locator('.project-card').first().waitFor();
  await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await page.waitForFunction(()=>/vs-ready/.test(document.querySelector('#navigation [data-open-voicestudio] .vs-dot')?.className));
  mark('Sidebar dot follows status on other pages');
  await page.setViewportSize({width:390,height:844});await page.goto(base+'/?view=voices',{waitUntil:'networkidle'});await panel.locator('[data-stop-voicestudio]').waitFor();
  assert.ok(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)));await panel.screenshot({path:path.join(out,'mobile.png')});mark('Mobile: panel fits');
  assert.deepEqual(errors,[]);mark('No browser errors; real VoiceStudio untouched');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
