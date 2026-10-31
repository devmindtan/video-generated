const {chromium}=require('playwright-core');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome'});
 const page=await browser.newPage(),base=process.env.MANAGER_TEST_URL||'http://127.0.0.1:4310',out=path.resolve('.cache/project-manager/book-layout');fs.mkdirSync(out,{recursive:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 async function check(){
  await page.locator('.book-object,.book-image-frame').first().waitFor();
  await page.waitForFunction(()=>[...document.querySelectorAll('.uploaded-book-cover')].every(img=>img.complete&&img.naturalWidth>0));await page.evaluate(()=>document.fonts.ready);
  const failures=await page.locator('.book-card').evaluateAll(cards=>cards.flatMap(card=>{
   const cover=card.querySelector('.card-cover').getBoundingClientRect(),book=card.querySelector('.book-object,.book-image-frame').getBoundingClientRect();const bad=[];
   if(book.top<cover.top||book.bottom>cover.bottom||book.left<cover.left||book.right>cover.right)bad.push('book outside cover');
   for(const node of card.querySelectorAll('.book-cover-title,.book-cover-author')){const r=node.getBoundingClientRect();if(r.top<book.top||r.bottom>book.bottom||r.left<book.left||r.right>book.right)bad.push('text outside book');}
   const title=card.querySelector('.card-title');if(title.scrollHeight>title.clientHeight+1)bad.push('full title clipped');
   return bad;
  }));assert.deepEqual(failures,[]);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 try{
  for(const width of [1440,768,390]){
   await page.setViewportSize({width,height:1000});await page.goto(base+'/?view=books',{waitUntil:'networkidle'});await check();await page.screenshot({path:path.join(out,`books-${width}.png`)});
   if(width===1440)assert.equal(await page.locator('#project-grid').evaluate(n=>getComputedStyle(n).gridTemplateColumns.split(' ').length),5);
   if(width===390)assert.equal(await page.locator('#project-grid').evaluate(n=>getComputedStyle(n).gridTemplateColumns.split(' ').length),2);
   await page.locator('#list-view').click();await check();console.log('✓ Real books fit grid/list at '+width+'px');
  }
  await page.route('**/api/workspace',async route=>{const response=await route.fetch();const data=await response.json();data.books=[{...data.books[0],id:'browser-only-fixture',cover:null,title:'TênSáchRấtDàiKhôngCóKhoảngTrắng'.repeat(12),authors:['Tên tác giả rất dài '.repeat(12)]}];await route.fulfill({response,json:data});});
  await page.goto(base+'/?view=books',{waitUntil:'networkidle'});await check();await page.locator('#list-view').click();await check();console.log('✓ Unbroken long title and long author remain contained; full title readable');
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
