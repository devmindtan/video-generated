/* "Tiến trình" tab against a temporary workspace: the agent's plan written through the real CLI after the lock,
   live refresh while the tab is open, an interrupted task keeping its last state, and the card line. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright-core'),{createManager}=require('./server.cjs');
const cli=require('../production-automation/cli.cjs'),review=require('../production-automation/review.cjs'),progress=require('../production-automation/progress.cjs');
(async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'progress-ui-')),out=path.resolve('.cache/project-manager/progress');fs.mkdirSync(out,{recursive:true});
 const write=(p,v)=>{const f=path.join(root,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,typeof v==='string'?v:JSON.stringify(v,null,2));};
 const id='demo-book',D=`docs/projects/${id}`,paths={source:`src/projects/${id}`,scripts:`scripts/projects/${id}`,docs:D,assets:`public/${id}`};
 write('series/catalog.json',{schemaVersion:1,channels:[{id:'tam-ly-cuoc-song',title:'Tâm lý cuộc sống',studioFolder:'Tam-Ly'}],series:[{id:'book-insights',channel:'tam-ly-cuoc-song',path:'series/tam-ly-cuoc-song/book-insights/series.json'}]});
 write('series/tam-ly-cuoc-song/book-insights/series.json',{schemaVersion:1,id:'book-insights',channel:'tam-ly-cuoc-song',title:'Đọc sách, hiểu mình',studioFolder:'Book-Insights',formats:['long'],projects:[{id,title:'Hiểu về trái tim: tổng quan',status:'planning',format:'long',paths,registrations:[]}]});
 for(const d of Object.values(paths))fs.mkdirSync(path.join(root,d),{recursive:true});
 for(const [f,t] of [[`${D}/script.md`,'# Kịch bản\n'],[`${D}/production-spec.md`,'12 phút ± 1'],[`${D}/image-prompts.md`,'1. Ngạch cửa'],[`src/projects/${id}/music.json`,'{}'],[`scripts/projects/${id}/voice.json`,'{}']])write(f,t);
 write('src/projects/registry.tsx','export const Projects=()=> <></>;');write('package.json',{name:'fixture',scripts:{}});
 fs.mkdirSync(path.join(root,'public/stoic/fonts'),{recursive:true});for(const name of ['NotoSans-Regular.ttf','NotoSans-Bold.ttf'])fs.copyFileSync(path.resolve('public/stoic/fonts',name),path.join(root,'public/stoic/fonts',name));
 const run=(...args)=>execFileSync(process.execPath,[path.resolve('tools/production-automation/cli.cjs'),'progress',id,...args],{env:{...process.env,AUTOMATION_ROOT:root},encoding:'utf8',stdio:['ignore','pipe','pipe']});
 const planFile=path.join(root,'plan.json');
 write('plan.json',{summary:'Sau chốt v1: giọng, hình, nhạc, dựng',tasks:[{id:'voice',title:'Clone giọng toàn bộ kịch bản',kind:'voice',weight:3,steps:12},{id:'img-mo-chuyen',title:'Ảnh/animation cảnh Mở chuyện',kind:'visuals',weight:2},{id:'img-cuon-sach',title:'Ảnh/animation cảnh Cuốn sách',kind:'visuals',weight:2},{id:'music',title:'Cắt và cân nhạc nền',kind:'music'},{id:'assembly',title:'Dựng các phần vào composition',kind:'assembly',weight:2}]});
 assert.throws(()=>run('plan','--file',planFile),/Chưa chốt ban đầu/);
 const server=createManager({root});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome'});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const base=`http://127.0.0.1:${server.address().port}`,mark=s=>console.log('✓ '+s);
 try{
  await page.goto(base+`/#project/${id}/tien-trinh`,{waitUntil:'networkidle'});await page.locator('.progress-empty').waitFor();
  assert.match(await page.locator('.progress-empty').innerText(),/bắt đầu sau khi bạn chốt ban đầu/);assert.equal(await page.locator('#tab-progress').getAttribute('aria-selected'),'true');
  mark('Before the lock the tab explains when progress starts; the CLI refuses a plan');
  review.lock(root,cli.plan(root,id),{by:'u'});
  run('plan','--file',planFile);run('start','voice','--steps','4/12','--note','Đang clone câu 4/12 trên máy GPU');
  run('done','music','--note','Nhạc Pufino đã cắt 0:00–12:10');run('start','img-mo-chuyen','--percent','40');run('log','--note','Đã giao việc ảnh cho 2 cảnh đầu');
  await page.reload({waitUntil:'networkidle'});await page.locator('.progress-hero').waitFor();
  // (3×33 + 2×40 + 0 + 100 + 0) / 10 = 27.9
  assert.match(await page.locator('.progress-big strong').innerText(),/^28%$/);
  assert.match(await page.locator('.progress-hero').innerText(),/1\/5 việc xong · 2 đang làm/);
  assert.equal(await page.locator('.now-card').count(),2);assert.match(await page.locator('.now-card').first().innerText(),/Clone giọng[\s\S]*4\/12 phần[\s\S]*máy GPU/);
  assert.deepEqual(await page.locator('.task-group-head span').allInnerTexts(),['Giọng đọc','Hình ảnh / animation','Nhạc nền','Dựng']);
  assert.match(await page.locator('.progress-timeline li').first().innerText(),/Ghi chú[\s\S]*Đã giao việc ảnh/);
  assert.match(await page.locator('#tab-progress').innerText(),/Tiến trình\s*28%/);
  await page.screenshot({path:path.join(out,'progress-1440.png'),fullPage:true});
  mark('Plan from the CLI: weighted percent, running tasks on top, plan grouped by kind, activity timeline, tab shows %');
  progress.update(root,id,'voice',{steps:{done:9,total:12},note:'Câu 9/12'});
  await page.waitForFunction(()=>/9\/12 phần/.test(document.querySelector('.progress-now')?.textContent||''),null,{timeout:9000});
  mark('The open tab refreshes by itself while the agent works');
  progress.update(root,id,'img-mo-chuyen',{pid:999999999,note:'Đang render ảnh 3/5'});
  await page.waitForFunction(()=>/Bị ngắt/.test(document.querySelector('.progress-now')?.textContent||''),null,{timeout:9000});
  assert.match(await page.locator('.progress-warn').innerText(),/trạng thái cuối cùng được giữ/);assert.match(await page.locator('.now-card.status-interrupted').innerText(),/40%[\s\S]*Đang render ảnh 3\/5/);
  assert.match(await page.locator('#tab-progress .tab-flag').innerText(),/Bị ngắt/);
  await page.screenshot({path:path.join(out,'progress-interrupted-1440.png'),fullPage:true});
  mark('An interrupted task shows its last saved state and percent');
  await page.goto(base+'/',{waitUntil:'networkidle'});await page.locator('.project-card').first().waitFor();
  assert.match(await page.locator('.card-progress').innerText(),/Bị ngắt · \d+%/);mark('The project card shows the agent progress line');
  for(const width of [768,390]){await page.setViewportSize({width,height:900});await page.goto(base+`/#project/${id}/tien-trinh`,{waitUntil:'networkidle'});await page.locator('.progress-hero').waitFor();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no overflow at '+width);await page.screenshot({path:path.join(out,`progress-${width}.png`),fullPage:true});}
  mark('Tablet and mobile fit without horizontal overflow');
  assert.deepEqual(errors.filter(e=>!/Failed to load resource/.test(e)),[]);mark('No browser errors; fixture workspace only');
 }finally{await browser.close();server.close();fs.rmSync(root,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
