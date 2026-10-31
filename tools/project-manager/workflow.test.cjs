/* Series workflow UI against a temporary workspace; never modifies real series notes. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {chromium}=require('playwright-core'),{createManager}=require('./server.cjs');
(async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'workflow-ui-')),out=path.resolve('.cache/project-manager/workflow');fs.mkdirSync(out,{recursive:true});
 const write=(p,v)=>{const f=path.join(root,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,typeof v==='string'?v:JSON.stringify(v));};
 const series=[['self-help-shorts','tam-ly-cuoc-song','Self-help và lời nhắc cuộc sống'],['book-insights','tam-ly-cuoc-song','Đọc sách, hiểu mình'],['tiny-dino','kids','Những chuyến phiêu lưu của Tí Hon'],['product-videos','client-work','Video sản phẩm']];
 write('series/catalog.json',{schemaVersion:1,channels:[{id:'tam-ly-cuoc-song',title:'Tâm lý cuộc sống',studioFolder:'Tam-Ly'},{id:'kids',title:'Kênh thiếu nhi',studioFolder:'Kids'},{id:'client-work',title:'Video khách hàng',studioFolder:'Client'}],
  series:series.map(([id,channel])=>({id,channel,path:`series/${channel}/${id}/series.json`}))});
 for(const [id,channel,title] of series)write(`series/${channel}/${id}/series.json`,{schemaVersion:1,id,channel,title,studioFolder:id,formats:['short','long'],summary:'Series thử.',projects:[]});
 write('src/projects/registry.tsx','export const Projects=()=> <></>;');
 fs.mkdirSync(path.join(root,'public/stoic/fonts'),{recursive:true});for(const name of ['NotoSans-Regular.ttf','NotoSans-Bold.ttf'])fs.copyFileSync(path.resolve('public/stoic/fonts',name),path.join(root,'public/stoic/fonts',name));
 const server=createManager({root});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`,notesFile=path.join(root,'series/tam-ly-cuoc-song/self-help-shorts/workflow.json');
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome'});
 const page=await browser.newPage({viewport:{width:1440,height:1000},locale:'vi-VN'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));// The deliberate stale save logs its expected 409 response; anything else is a failure.
 page.on('console',m=>{if(m.type()==='error'&&!/status of 409/.test(m.text()))errors.push(m.text());});
 const mark=s=>console.log('✓ '+s),shot=name=>page.screenshot({path:path.join(out,name+'.png'),fullPage:false});
 const overflow=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Unexpected horizontal overflow');
 try{
  await page.goto(base,{waitUntil:'networkidle'});assert.ok(await page.locator('#workflow').isHidden());mark('Overview has no series workflow');
  await page.locator('[data-series="self-help-shorts"]').click();await page.locator('.workflow-step').first().waitFor();
  assert.equal(await page.locator('.workflow-step').count(),13);assert.equal(await page.locator('.workflow-phase h3').count(),5);
  assert.match(await page.locator('[data-workflow-stage="voice-audition"]').innerText(),/song song với bước 5/);
  await overflow();await shot('series-desktop');mark('Philosophy series shows 13 numbered steps in 5 phases with parallel hints');
  await page.locator('[data-workflow-stage="script"]').click();await page.locator('#drawer:not([hidden]) #workflow-rules').waitFor();
  assert.match(await page.locator('#drawer-eyebrow').innerText(),/BƯỚC 2\/13/);assert.match(await page.locator('#drawer-breadcrumb').innerText(),/Quy trình: Kịch bản/);
  await page.locator('#workflow-rules').fill('Mở đầu bằng một tình huống cụ thể\n\nKhông dùng câu hỏi tu từ ở câu đầu');
  await page.locator('#workflow-notes').fill('Giọng kể như đang nói với một người bạn.');
  page.once('dialog',d=>d.dismiss());await page.locator('#close-drawer').click();
  assert.ok(await page.locator('#drawer').isVisible());mark('Unsaved rules are guarded before closing');
  await page.locator('#save-workflow').click();await page.waitForFunction(()=>/Đã lưu/.test(document.querySelector('#workflow-status')?.textContent));
  const saved=JSON.parse(fs.readFileSync(notesFile,'utf8'));
  assert.deepEqual(saved.stages.script,{rules:['Mở đầu bằng một tình huống cụ thể','Không dùng câu hỏi tu từ ở câu đầu'],notes:'Giọng kể như đang nói với một người bạn.'});
  await shot('step-detail');await page.locator('#close-drawer').click();await page.locator('#drawer').waitFor({state:'hidden'});
  assert.equal(await page.locator('[data-workflow-stage="script"] .step-notes').innerText(),'3');mark('Step rules and notes save to workflow.json and show a count on the step');
  await page.locator('#workflow [data-workflow-stage="general"]').click();await page.locator('#drawer:not([hidden]) #workflow-rules').waitFor();
  assert.ok(await page.locator('.workflow-list li').count()>3);await page.locator('#workflow-rules').fill('Giữ tông trầm, không hô hào');await page.locator('#save-workflow').click();
  await page.waitForFunction(()=>/Đã lưu/.test(document.querySelector('#workflow-status')?.textContent));
  assert.deepEqual(JSON.parse(fs.readFileSync(notesFile,'utf8')).general.rules,['Giữ tông trầm, không hô hào']);
  await page.keyboard.press('Escape');await page.locator('#drawer').waitFor({state:'hidden'});mark('Series-wide rules show built-in rules and save; Escape closes');
  // A change made outside the page wins over a stale form.
  await page.locator('[data-workflow-stage="brief"]').click();await page.locator('#workflow-notes').waitFor();
  const external=JSON.parse(fs.readFileSync(notesFile,'utf8'));external.stages.brief={rules:['Sửa từ IDE'],notes:''};fs.writeFileSync(notesFile,JSON.stringify(external));
  await page.locator('#workflow-notes').fill('Bản nháp trên web');await page.locator('#save-workflow').click();
  await page.locator('#toast:not([hidden])').filter({hasText:'sửa ở nơi khác'}).waitFor();
  assert.deepEqual(JSON.parse(fs.readFileSync(notesFile,'utf8')).stages.brief.rules,['Sửa từ IDE']);
  await page.locator('#workflow-notes').fill('');page.once('dialog',d=>d.accept());await page.locator('#close-drawer').click();mark('External edit is preserved; stale save is refused');
  await page.goto(base+'/?channel=tam-ly-cuoc-song&series=self-help-shorts#workflow/self-help-shorts/approve-script',{waitUntil:'networkidle'});
  await page.locator('#drawer:not([hidden]) .workflow-command').waitFor();assert.match(await page.locator('.workflow-command').innerText(),/approve <slug> approve-script/);
  await page.locator('#drawer [data-back]').click();await page.locator('#drawer').waitFor({state:'hidden'});
  assert.equal(new URL(page.url()).searchParams.get('series'),'self-help-shorts');mark('Direct step link opens, Back returns to the series');
  await page.locator('[data-series="book-insights"]').click();await page.locator('[data-workflow-stage="sources"]').waitFor();
  assert.equal(await page.locator('.workflow-step').count(),14);mark('Book series adds the source step');
  await page.goto(base+'/?channel=kids&series=tiny-dino',{waitUntil:'networkidle'});await page.locator('[data-workflow-stage="visual-plan"]').click();
  assert.match(await page.locator('#drawer-content').innerText(),/footage chuyển động/i);await page.keyboard.press('Escape');mark('Kids series shows its own visual rule');
  await page.goto(base+'/?channel=client-work&series=product-videos',{waitUntil:'networkidle'});
  await page.locator('.workflow-empty').waitFor();assert.equal(await page.locator('.workflow-step').count(),0);mark('Series without an approved workflow says so and keeps only general rules');
  await page.goto(base+'/?channel=tam-ly-cuoc-song&series=self-help-shorts',{waitUntil:'networkidle'});await page.locator('.workflow-step').first().waitFor();
  await page.locator('[data-workflow-stage="script"]').focus();await page.keyboard.press('Enter');await page.locator('#drawer:not([hidden])').waitFor();
  assert.equal(await page.evaluate(()=>document.activeElement.id),'close-drawer');await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.workflowStage),'script');mark('Keyboard opens a step and focus returns to it');
  for(const [w,h,name] of [[768,1000,'tablet'],[390,844,'mobile']]){await page.setViewportSize({width:w,height:h});await overflow();await page.locator('#workflow').scrollIntoViewIfNeeded();await shot('series-'+name);}
  await page.locator('[data-workflow-stage="assembly"]').click();await page.locator('#drawer:not([hidden])').waitFor();await overflow();await shot('step-mobile');mark('Tablet and mobile fit without horizontal overflow');
  assert.deepEqual(errors,[]);mark('No browser JavaScript or console errors; fixture only');
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));fs.rmSync(root,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
