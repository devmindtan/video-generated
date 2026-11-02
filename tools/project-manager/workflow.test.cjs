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
  await page.locator('[data-series="self-help-shorts"]').click();await page.locator('.workflow-strip').waitFor();
  // Folded by default: one summary line of the four phases, no step buttons taking space.
  assert.equal(await page.locator('.workflow-step').count(),0);assert.equal(await page.locator('#workflow-toggle').getAttribute('aria-expanded'),'false');
  assert.match(await page.locator('.workflow-strip').innerText(),/Chuẩn bị\s*1[\s\S]*Chốt ban đầu\s*6[\s\S]*Hoàn thiện\s*2/);
  assert.ok((await page.locator('#workflow').boundingBox()).height<160);await shot('series-folded');mark('Workflow starts folded to a one-line phase summary');
  await page.locator('#workflow-toggle').click();await page.locator('.workflow-step').first().waitFor();
  assert.equal(await page.locator('#workflow-toggle').getAttribute('aria-expanded'),'true');assert.equal(await page.evaluate(()=>document.activeElement.id),'workflow-toggle');
  assert.equal(await page.locator('.workflow-step').count(),15);assert.equal(await page.locator('.workflow-phase h3').count(),4);
  // Music, voice choice and per-scene prompts are prepared side by side for the initial lock; so are QA and metadata.
  const column=id=>page.locator(`.flow-column:has([data-workflow-stage="${id}"]) .workflow-step`).count();
  assert.equal(await column('voice-audition'),3);assert.equal(await column('metadata'),3);assert.equal(await column('initial-lock'),1);
  assert.match(await page.locator('[data-workflow-stage="voice-audition"]').getAttribute('aria-label'),/song song với bước 4/);
  assert.match(await page.locator('[data-workflow-stage="metadata"]').getAttribute('aria-label'),/song song với bước 11/);
  // Steps of one row read left to right in order.
  const x=id=>page.locator(`[data-workflow-stage="${id}"]`).boundingBox().then(b=>b.x);
  assert.ok(await x('script')<await x('editorial-review')&&await x('editorial-review')<await x('music')&&await x('music')<await x('initial-lock'));
  await overflow();await shot('series-desktop');mark('Unfolded chart shows 15 steps in 4 phases, parallel steps stacked in one column');
  await page.reload({waitUntil:'networkidle'});await page.locator('.workflow-step').first().waitFor();mark('Unfolded choice is remembered');
  // At this width the phases wrap onto two rows: one drawn link turns down from the lock into production.
  assert.equal(await page.locator('.workflow-phase.row-start').count(),1);assert.equal(await page.locator('.flow-wrap path').count(),1);
  const wrap=await page.locator('.flow-wrap path').getAttribute('d'),pts=wrap.match(/-?[\d.]+/g).map(Number);
  const lock=await page.locator('[data-workflow-stage="initial-lock"]').boundingBox(),narr=await page.locator('[data-workflow-stage="narration"]').boundingBox();
  assert.ok(narr.y>lock.y+lock.height&&pts.length>=7,'second row sits below the first with a turning link');mark('Wrapped rows are joined by a link that turns down');
  await page.locator('[data-workflow-stage="script"]').click();await page.locator('#drawer:not([hidden]) #edit-workflow').waitFor();
  assert.match(await page.locator('#drawer-eyebrow').innerText(),/BƯỚC 2\/15/);assert.match(await page.locator('#drawer-breadcrumb').innerText(),/Quy trình: Kịch bản/);
  assert.equal(await page.locator('#workflow-own textarea').count(),0);await page.locator('#edit-workflow').click();
  await page.locator('#workflow-rules .rule-input').first().fill('Mở đầu bằng một tình huống cụ thể');await page.keyboard.press('Enter');
  assert.equal(await page.locator('#workflow-rules .rule-input').count(),2);assert.ok(await page.locator('#workflow-rules .rule-input').nth(1).evaluate(e=>e===document.activeElement));
  await page.keyboard.type('Không dùng câu hỏi tu từ ở câu đầu');await page.locator('[data-add-rule]').click();await page.keyboard.type('Bỏ đi');
  await page.locator('#workflow-rules li').nth(2).locator('[data-remove-rule]').click();assert.equal(await page.locator('#workflow-rules .rule-input').count(),2);
  await page.locator('#workflow-notes').fill('Giọng kể như đang nói với một người bạn.');mark('Rules edit one per field: Enter adds, Xóa removes');
  page.once('dialog',d=>d.dismiss());await page.locator('#close-drawer').click();
  assert.ok(await page.locator('#drawer').isVisible());mark('Unsaved rules are guarded before closing');
  await page.locator('#save-workflow').click();await page.waitForFunction(()=>/Đã lưu/.test(document.querySelector('#workflow-status')?.textContent));
  const saved=JSON.parse(fs.readFileSync(notesFile,'utf8'));
  assert.deepEqual(saved.stages.script,{rules:['Mở đầu bằng một tình huống cụ thể','Không dùng câu hỏi tu từ ở câu đầu'],notes:'Giọng kể như đang nói với một người bạn.'});
  assert.deepEqual(await page.locator('.rule-list li').allInnerTexts(),['Mở đầu bằng một tình huống cụ thể','Không dùng câu hỏi tu từ ở câu đầu']);
  assert.match(await page.locator('.rule-notes').innerText(),/một người bạn/);
  await shot('step-detail');await page.locator('#close-drawer').click();await page.locator('#drawer').waitFor({state:'hidden'});
  assert.equal(await page.locator('[data-workflow-stage="script"] .step-notes').innerText(),'3');mark('Step rules and notes save to workflow.json and show a count on the step');
  await page.locator('#workflow [data-workflow-stage="general"]').click();await page.locator('#drawer:not([hidden]) #edit-workflow').waitFor();
  assert.ok(await page.locator('.workflow-list li').count()>3);await page.locator('#edit-workflow').click();
  const long='Video dài: khi bắt tay dựng thật (ảnh, giọng, nhạc, caption, composition), làm intro và chỉ 30 giây đầu tiên sau intro trước, rồi mở Studio cho người dùng duyệt.';
  await page.locator('#workflow-rules .rule-input').first().fill(long);await page.locator('[data-add-rule]').click();await page.keyboard.type('Giữ tông trầm, không hô hào');
  assert.ok(await page.locator('#workflow-rules .rule-input').first().evaluate(e=>e.scrollHeight<=e.clientHeight+2),'long rule field grows to show all its text');
  await shot('general-edit');await page.locator('#save-workflow').click();
  await page.waitForFunction(()=>/Đã lưu/.test(document.querySelector('#workflow-status')?.textContent));
  assert.deepEqual(JSON.parse(fs.readFileSync(notesFile,'utf8')).general.rules,[long,'Giữ tông trầm, không hô hào']);
  await shot('general-read');
  await page.keyboard.press('Escape');await page.locator('#drawer').waitFor({state:'hidden'});mark('Series-wide rules show built-in rules and save; Escape closes');
  // A change made outside the page wins over a stale form.
  await page.locator('[data-workflow-stage="brief"]').click();await page.locator('#edit-workflow').click();await page.locator('#workflow-notes').waitFor();
  const external=JSON.parse(fs.readFileSync(notesFile,'utf8'));external.stages.brief={rules:['Sửa từ IDE'],notes:''};fs.writeFileSync(notesFile,JSON.stringify(external));
  await page.locator('#workflow-notes').fill('Bản nháp trên web');await page.locator('#save-workflow').click();
  await page.locator('#toast:not([hidden])').filter({hasText:'sửa ở nơi khác'}).waitFor();
  assert.deepEqual(JSON.parse(fs.readFileSync(notesFile,'utf8')).stages.brief.rules,['Sửa từ IDE']);
  page.once('dialog',d=>d.accept());await page.locator('[data-cancel-workflow]').click();await page.locator('#edit-workflow').waitFor();await page.locator('#close-drawer').click();mark('External edit is preserved; stale save is refused');
  await page.goto(base+'/?channel=tam-ly-cuoc-song&series=self-help-shorts#workflow/self-help-shorts/initial-lock',{waitUntil:'networkidle'});
  await page.locator('#drawer:not([hidden]) .workflow-command').waitFor();assert.match(await page.locator('.workflow-command').innerText(),/patch <slug> --reason/);
  await page.locator('#drawer [data-back]').click();await page.locator('#drawer').waitFor({state:'hidden'});
  assert.equal(new URL(page.url()).searchParams.get('series'),'self-help-shorts');mark('Direct step link opens, Back returns to the series');
  await page.locator('[data-series="book-insights"]').click();await page.locator('[data-workflow-stage="sources"]').waitFor();await shot('series-book');
  assert.equal(await page.locator('.workflow-step').count(),16);mark('Book series adds the source step');
  await page.goto(base+'/?channel=kids&series=tiny-dino',{waitUntil:'networkidle'});await page.locator('[data-workflow-stage="visual-plan"]').click();
  assert.match(await page.locator('#drawer-content').innerText(),/footage chuyển động/i);await page.keyboard.press('Escape');mark('Kids series shows its own visual rule');
  await page.goto(base+'/?channel=client-work&series=product-videos',{waitUntil:'networkidle'});
  await page.locator('.workflow-empty').waitFor();assert.equal(await page.locator('.workflow-step').count(),0);mark('Series without an approved workflow says so and keeps only general rules');
  await page.goto(base+'/?channel=tam-ly-cuoc-song&series=self-help-shorts',{waitUntil:'networkidle'});await page.locator('.workflow-step').first().waitFor();
  await page.locator('[data-workflow-stage="script"]').focus();await page.keyboard.press('Enter');await page.locator('#drawer:not([hidden])').waitFor();
  assert.equal(await page.evaluate(()=>document.activeElement.id),'close-drawer');await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.workflowStage),'script');mark('Keyboard opens a step and focus returns to it');
  for(const [w,h,name] of [[1024,900,'laptop'],[768,1000,'tablet'],[390,844,'mobile']]){await page.setViewportSize({width:w,height:h});await overflow();await page.locator('#workflow').scrollIntoViewIfNeeded();await shot('series-'+name);}
  await page.locator('[data-workflow-stage="assembly"]').click();await page.locator('#drawer:not([hidden])').waitFor();await overflow();await shot('step-mobile');mark('Tablet and mobile fit without horizontal overflow');
  await page.keyboard.press('Escape');await page.locator('#drawer').waitFor({state:'hidden'});
  await page.locator('#workflow-toggle').click();await page.locator('.workflow-strip').waitFor();assert.equal(await page.locator('.workflow-step').count(),0);mark('Chart folds again');
  assert.deepEqual(errors,[]);mark('No browser JavaScript or console errors; fixture only');
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));fs.rmSync(root,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
