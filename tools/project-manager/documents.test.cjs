/* Read-only browser QA of the readable document views (book record, chapter map, Markdown, JSON) on the real workspace. */
const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const base=process.env.MANAGER_TEST_URL||'http://127.0.0.1:4310',out=path.resolve('.cache/project-manager/documents');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome'});
 const page=await browser.newPage({viewport:{width:1440,height:1000},locale:'vi-VN'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const view=page.locator('#document-view'),mark=s=>console.log('✓ '+s);
 const shot=async(name,scroll=0)=>{await view.evaluate((v,s)=>v.scrollTop=s,scroll);await view.screenshot({path:path.join(out,name+'.png')});};
 try{
  await page.goto(base+'/?view=books#book/book-insights/hieu-ve-trai-tim',{waitUntil:'networkidle'});await page.locator('#drawer:not([hidden])').waitFor();
  await page.locator('[data-book-document="book.json"]').click();await view.locator('.kv').first().waitFor();
  assert.equal(await view.locator('pre').count(),0);assert.match(await view.innerText(),/Tác giả\s+Minh Niệm/);assert.match(await view.innerText(),/Nhà xuất bản\s+Không có trong PDF/);
  assert.ok(await view.locator('[role="progressbar"]').count());await shot('book');mark('Book record shows labelled fields and reading progress, not raw JSON');
  await page.locator('[data-raw-toggle]').click();await view.locator('pre').waitFor();assert.match(await view.locator('pre').innerText(),/"sourceSha256"/);
  await page.locator('[data-raw-toggle]').click();await view.locator('.kv').first().waitFor();mark('Raw toggle shows the exact file and switches back');
  await page.locator('[data-book-document="chapters.json"]').click();await view.locator('.doc-table.chapters').waitFor();
  assert.equal(await view.locator('tr[data-chapter]').count(),50);
  await view.locator('.doc-filter').fill('gian');assert.equal(await view.locator('tr[data-chapter]:not([hidden])').count(),2);await view.locator('.doc-filter').fill('');
  await view.locator('details.sections summary').first().click();assert.ok(await view.locator('details.sections[open] li').count()>=1);
  await shot('chapters');mark('Chapter map: 50 chapters, accent-insensitive filter, expandable sub-sections');
  await page.locator('[data-book-document="research.md"]').click();await view.locator('.doc-markdown .doc-table').first().waitFor();
  assert.ok(await view.locator('.doc-markdown h2').count()>=3);assert.ok(await view.locator('.doc-markdown code').count()>=1);
  await view.locator('[data-open-tab]').first().click();await view.locator('.doc-table.chapters').waitFor();mark('Markdown renders headings, tables and code; in-document link opens the chapter tab');
  await page.goto(base+'/?view=books#book/book-insights/thay-doi-ti-hon-hieu-qua-bat-ngo-atomic-habits',{waitUntil:'networkidle'});await page.locator('#drawer:not([hidden])').waitFor();
  await page.locator('[data-book-document="chapters.json"]').click();await view.locator('.group-row').first().waitFor();
  assert.equal(await view.locator('tr[data-chapter]').count(),20);assert.ok(await view.locator('.warn-callout').count());await shot('atomic',400);mark('Atomic Habits chapters grouped by law, missing figures flagged');
  await page.goto(base+'/#project/one-bad-day',{waitUntil:'networkidle'});await page.locator('#drawer:not([hidden])').waitFor();
  await page.locator('[data-document]').filter({hasText:/^Phụ đề$/}).click();await view.locator('.doc-table').waitFor();
  const headers=await view.locator('.doc-table th').allInnerTexts();assert.deepEqual(headers,['#','Lời','Bắt đầu','Kết thúc']);assert.match(await view.locator('tbody tr').first().innerText(),/0:00\.5/);
  await shot('captions');mark('Captions table hides empty/duplicate columns and shows mm:ss times');
  await page.locator('[data-document]').filter({hasText:/^Kiểm tra kỹ thuật$/}).click();await view.locator('.kv').first().waitFor();assert.match(await view.innerText(),/Giọng\s+Quốc Tuấn/);
  await page.locator('[data-document]').filter({hasText:/^Kịch bản$/}).click();await view.locator('h1').waitFor();mark('QA JSON as labelled list; script Markdown keeps its headings');
  await page.locator('[data-document]').filter({hasText:/^Video\.tsx$/}).click();await view.locator('pre.doc-code').waitFor();assert.equal(await view.locator('[data-raw-toggle]').count(),0);mark('Source code stays as code');
  await page.setViewportSize({width:390,height:844});await page.goto(base+'/?view=books#book/book-insights/hieu-ve-trai-tim',{waitUntil:'networkidle'});await page.locator('#drawer:not([hidden])').waitFor();
  await page.locator('[data-book-document="chapters.json"]').click();await view.locator('.doc-table.chapters').waitFor();
  assert.ok(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)));assert.ok(!(await page.locator('#drawer').evaluate(d=>d.scrollWidth>d.clientWidth+1)));
  await shot('mobile-chapters');mark('Mobile: no horizontal overflow');
  assert.deepEqual(errors,[]);mark('No browser errors; nothing written');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
