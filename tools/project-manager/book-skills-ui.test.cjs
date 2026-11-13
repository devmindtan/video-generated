// Browser test of the "Bộ skill" tab on technical books (needs a running manager: MANAGER_TEST_URL, default 4310).
// Reads real data only: the install button is exercised against stubbed responses, so no skill folder is written.
const {chromium}=require('playwright-core');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome'});
 const page=await browser.newPage(),base=process.env.MANAGER_TEST_URL||'http://127.0.0.1:4310',out=path.resolve('.cache/project-manager/book-skills');fs.mkdirSync(out,{recursive:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const noOverflow=async label=>{assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page overflow '+label);
  assert.ok(await page.locator('#document-view').evaluate(n=>n.scrollWidth<=n.clientWidth+1),'view overflow '+label);};
 const openTab=async(series,book)=>{await page.goto(`${base}/#book/${series}/${book}`,{waitUntil:'networkidle'});
  await page.locator('.document-tabs [data-book-document="__skills"]').click();};
 try{
  const workspace=await (await page.request.get(base+'/api/workspace')).json();
  const technical=workspace.books.filter(b=>b.technical),plain=workspace.books.find(b=>!b.technical);
  assert.ok(technical.length>=3,'the three technical books are marked');
  for(const b of technical)assert.ok(b.skillPack,`${b.id} has its pack`);
  const sdd=technical.find(b=>b.id==='spec-driven-development');

  for(const width of [1440,768,390]){
   await page.setViewportSize({width,height:1000});await openTab(sdd.series,sdd.id);
   await page.locator('.skills-pack').waitFor();
   assert.equal(await page.locator('.skill-row').count(),4);assert.equal(await page.locator('.skill-agent').count(),3);
   assert.match(await page.locator('.skill-agents').innerText(),/Claude Code[\s\S]*Codex[\s\S]*OpenCode/);
   await page.locator('.skill-when summary').first().click();
   assert.match(await page.locator('.skill-when p').first().innerText(),/English triggers/);
   await noOverflow(width+'px');await page.locator('.document-tabs').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`pack-${width}.png`)});
  }
  console.log('✓ Technical books show a Bộ skill tab: agents strip, 4 skills, details, no overflow at 1440/768/390');

  // Every technical book has the tab; a non-technical one does not.
  for(const b of technical){await openTab(b.series,b.id);await page.locator('.skill-row').first().waitFor();}
  await page.goto(`${base}/#book/${plain.series}/${plain.id}`,{waitUntil:'networkidle'});await page.locator('.document-tabs').waitFor();
  assert.equal(await page.locator('[data-book-document="__skills"]').count(),0);
  console.log('✓ All technical books have the tab, other books do not');

  // A skill file opens in the viewer without its YAML header, and the back button returns to the pack.
  await page.setViewportSize({width:1440,height:1000});await openTab(sdd.series,sdd.id);
  await page.locator('[data-book-document-open="__skills:sdd-write-spec/SKILL.md"]').click();
  await page.locator('#document-view .doc-markdown h1').waitFor();
  assert.match(await page.locator('#document-view h1').innerText(),/Viết spec/);
  assert.doesNotMatch(await page.locator('#document-view .doc-markdown').innerText(),/^name: sdd-write-spec/m);
  assert.equal(await page.locator('.document-tabs [data-book-document="__skills"]').getAttribute('class'),'active');
  await page.locator('.skill-file-head button').click();await page.locator('.skills-pack').waitFor();
  await page.locator('[data-book-document-open="__skills:sdd-write-spec/references/templates.md"]').click();
  await page.locator('#document-view .doc-markdown h1').waitFor();await page.locator('.skill-file-head button').focus();
  await page.keyboard.press('Enter');await page.locator('.skills-pack').waitFor();
  console.log('✓ Skill files open in the viewer (keyboard too) and return to the pack');

  // Install: stubbed failure shows the check errors, stubbed success refreshes the states.
  const info=await (await page.request.get(`${base}/api/book-skills?series=${sdd.series}&book=${sdd.id}`)).json();
  const failed={ok:false,error:'Bộ skill "spec-driven-development" chưa đạt kiểm tra (1 lỗi): chạy check',
   info:{...info,check:{errors:['skills/sdd-write-spec/SKILL.md: còn TODO'],warnings:[]},pack:{...info.pack,skills:info.pack.skills.map((s,k)=>k?s:{...s,states:{...s.states,codex:'outdated'}})}}};
  await page.route('**/api/book-skills/install',route=>route.fulfill({json:failed}));
  await page.locator('[data-skills-install]').click();await page.locator('.skills-check').waitFor();
  assert.match(await page.locator('.skills-check').innerText(),/Chưa đạt kiểm tra \(1 lỗi\)/);assert.equal(await page.locator('#skills-install-status').innerText(),'','error shown once');
  assert.match(await page.locator('.skill-row').first().innerText(),/Codex: Cần cài lại/);
  assert.match(await page.locator('.skill-agent').nth(1).innerText(),/3\/4 đã cài/);
  assert.equal((await page.locator('[data-skills-install]').innerText()).trim(),'Cài cho các agent');
  await page.screenshot({path:path.join(out,'install-failed.png'),fullPage:false});
  await page.unroute('**/api/book-skills/install');
  await page.route('**/api/book-skills/install',route=>route.fulfill({json:{ok:true,info}}));
  await page.locator('[data-skills-install]').click();await page.waitForFunction(()=>/Đã cài xong/.test(document.querySelector('#skills-install-status')?.textContent||''));
  assert.equal(await page.locator('.skills-check').count(),0);
  console.log('✓ Install button shows check errors on failure and refreshed states on success (stubbed, nothing written)');

  // Empty state for a technical book without a pack (stubbed), with the sentence to give an agent.
  await page.route('**/api/workspace',async route=>{const r=await route.fetch(),d=await r.json();d.books=d.books.map(b=>b.id===plain.id?{...b,technical:true,skillPack:false}:b);await route.fulfill({json:d});});
  await page.route('**/api/book-skills?*',route=>route.fulfill({json:{book:plain.id,technical:true,reading:{read:3,total:10},targets:info.targets,pack:null,check:null}}));
  for(const width of [1440,390]){await page.setViewportSize({width,height:900});await page.goto(`${base}/#book/${plain.series}/${plain.id}`);await page.reload({waitUntil:'networkidle'});await page.locator('.document-tabs [data-book-document="__skills"]').click();await page.locator('.skills-empty').waitFor();
   assert.match(await page.locator('.skills-empty').innerText(),/Mới đọc 3\/10 chương/);
   assert.match(await page.locator('.skills-prompt code').innerText(),new RegExp('Làm bộ skill cho sách '+plain.title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
   await noOverflow('empty '+width);await page.locator('.skills-empty').screenshot({path:path.join(out,`empty-${width}.png`)});}
  console.log('✓ A technical book without a pack explains what to do');

  // The book edit form offers the technical flag; it is fixed on while a pack exists. Not submitted.
  await page.unroute('**/api/workspace');await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${base}/#book/${sdd.series}/${sdd.id}`);await page.reload({waitUntil:'networkidle'});await page.locator('[data-edit-book]').click();
  assert.ok(await page.locator('#book-technical-input').isChecked());assert.ok(await page.locator('#book-technical-input').isDisabled());
  await page.locator('[data-cancel-book]').click();
  await page.goto(`${base}/#book/${plain.series}/${plain.id}`,{waitUntil:'networkidle'});await page.locator('[data-edit-book]').click();
  assert.ok(!(await page.locator('#book-technical-input').isChecked()));assert.ok(!(await page.locator('#book-technical-input').isDisabled()));
  await page.locator('[data-cancel-book]').click();
  console.log('✓ Edit form has the technical checkbox (not submitted)');
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
