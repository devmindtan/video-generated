/* Browser QA for a project with several exported videos (three shorts): the media dialog shows one numbered, named
   button per video, opens on the first and switches source. Uses a temporary fixture workspace with copies of real
   local MP4 exports; screenshots go to .cache/project-manager/qa/. */
const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {createManager}=require('./server.cjs');

const ROOT=path.resolve(__dirname,'../..');
const samples=['StoicRestDay','StoicSingleTask','StoicSmallMistakes'].map(id=>path.join(ROOT,'projects',id,id+'.mp4'));

async function run(){
  const missing=samples.filter(f=>!fs.existsSync(f));if(missing.length){console.log('skip: no local sample exports',missing);return;}
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'media-switch-'));
  const write=(file,value)=>{fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),typeof value==='string'?value:JSON.stringify(value));};
  const paths={source:'src/projects/shorts',scripts:'scripts/projects/shorts',docs:'docs/projects/shorts',assets:'public/shorts'};
  for(const folder of Object.values(paths))fs.mkdirSync(path.join(root,folder),{recursive:true});
  const ids=['ShortOne','ShortTwo','ShortThree'],titles=['Short 1 · Vốc muối và dòng sông','Short 2 · Đau và khổ khác nhau','Short 3 · Gọi mãi không nghe máy'];
  write('series/catalog.json',{schemaVersion:1,channels:[{id:'tam-ly-cuoc-song',title:'Tâm lý cuộc sống',studioFolder:'Test'}],series:[{id:'demo',channel:'tam-ly-cuoc-song',path:'series/tam-ly-cuoc-song/demo/series.json'}]});
  write('series/tam-ly-cuoc-song/demo/series.json',{schemaVersion:1,id:'demo',channel:'tam-ly-cuoc-song',title:'Demo',studioFolder:'Demo',formats:['short'],projects:[{id:'shorts',title:'Short giới thiệu tập 1 · Hiểu về trái tim',status:'existing',format:'short',paths,
    registrations:[...ids.map((id,i)=>({id,kind:'Composition',title:titles[i]})),...ids.map((id,i)=>({id:id+'Cover',kind:'Still',title:'Bìa '+titles[i]}))]}]});
  write('src/projects/registry.tsx',`import {Video} from './shorts/Video';
export const Projects=()=> <Folder name="Test"><Folder name="Demo"><Folder name="shorts">${ids.map(id=>`<Composition id="${id}" component={Video} durationInFrames={900} fps={30} width={1080} height={1920}/><Still id="${id}Cover" component={Video} width={1080} height={1920}/>`).join('')}</Folder></Folder></Folder>;`);
  write('src/projects/shorts/Video.tsx','video');
  // Exported in reverse order: the dialog still lists them by registration order.
  [2,1,0].forEach(i=>{fs.mkdirSync(path.join(root,'projects/shorts'),{recursive:true});fs.copyFileSync(samples[i],path.join(root,'projects/shorts',ids[i]+'.mp4'));});
  const server=createManager({root,openFolder:async()=>{}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}`,output=path.join(ROOT,'.cache/project-manager/qa');fs.mkdirSync(output,{recursive:true});
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome'});
  const errors=[];
  try{
    for(const [name,viewport] of [['desktop',{width:1440,height:1000}],['tablet',{width:820,height:1100}],['mobile',{width:390,height:844}]]){
      const page=await browser.newPage({viewport,locale:'vi-VN'});page.on('pageerror',e=>errors.push(e.message));
      await page.goto(base,{waitUntil:'networkidle'});await page.waitForSelector('.project-card');
      await page.locator('[data-watch="video"]').first().click();await page.locator('#media-dialog[open] video').waitFor();
      const buttons=page.locator('#media-switch button');assert.equal(await buttons.count(),3);
      assert.deepEqual(await buttons.allInnerTexts(),titles.map((t,i)=>`${i+1}\n${t}`));
      assert.equal(await buttons.nth(0).getAttribute('aria-pressed'),'true');
      assert.match(await page.locator('#media-content video').getAttribute('src'),/file=ShortOne\.mp4/);
      await page.waitForFunction(()=>document.querySelector('#media-content video')?.readyState>=1);
      await buttons.nth(2).click();
      assert.match(await page.locator('#media-content video').getAttribute('src'),/file=ShortThree\.mp4/);
      assert.equal(await buttons.nth(2).getAttribute('aria-pressed'),'true');assert.equal(await buttons.nth(0).getAttribute('aria-pressed'),'false');
      await page.waitForFunction(()=>document.querySelector('#media-content video')?.readyState>=1);
      await buttons.nth(1).focus();await page.keyboard.press('Enter');assert.match(await page.locator('#media-content video').getAttribute('src'),/file=ShortTwo\.mp4/);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow');
      assert.ok(await page.locator('#media-dialog').evaluate(d=>d.scrollWidth<=d.clientWidth+1),'dialog overflow');
      await page.screenshot({path:path.join(output,`media-switch-${name}.png`)});
      await page.locator('#close-media').click();assert.equal(await page.locator('#media-switch').isHidden(),true);
      // Covers not exported yet: the dialog still lists all three; Studio opens the selected one.
      let studio=null;await page.route('**/api/studio',r=>{studio=JSON.parse(r.request().postData()||'{}');r.fulfill({status:500,body:'{"error":"test"}',contentType:'application/json'});});
      await page.locator('[data-watch="thumbnail"]').first().click();await page.locator('#media-dialog[open] .media-unplayable').waitFor();
      const covers=page.locator('#media-switch button');assert.equal(await covers.count(),3);
      assert.match(await covers.nth(0).innerText(),/Bìa Short 1[\s\S]*Chưa xuất/);
      assert.equal(await page.locator('#media-folder').isHidden(),true);
      await covers.nth(2).click();assert.match(await page.locator('#media-content').innerText(),/Bìa Short 3 · Gọi mãi không nghe máy chưa được xuất/);
      await page.locator('#media-studio').click();await page.waitForTimeout(300);assert.equal(studio?.composition,'ShortThreeCover');
      if(name==='mobile')await page.screenshot({path:path.join(output,'media-switch-covers-mobile.png')});
      await page.locator('#close-media').click();
      console.log(`✓ ${name}: three numbered videos, opens on the first, switches by click and keyboard`);
      await page.close();
    }
    assert.deepEqual(errors,[]);
  }finally{await browser.close();server.close();fs.rmSync(root,{recursive:true,force:true});}
}
run().catch(e=>{console.error(e);process.exit(1);});
