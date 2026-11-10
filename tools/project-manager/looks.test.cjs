/* Chủ đề hình ảnh / Phong cách animation against a temporary workspace; never touches the real themes or series. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {chromium}=require('playwright-core'),{createManager}=require('./server.cjs'),{createLooks}=require('./looks.cjs');
const catalog=require('../../scripts/catalog/catalog.cjs');
(async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'looks-')),out=path.resolve('.cache/project-manager/looks');fs.mkdirSync(out,{recursive:true});
 const write=(p,v)=>{const f=path.join(root,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,typeof v==='string'?v:JSON.stringify(v,null,2)+'\n');};
 write('series/catalog.json',{schemaVersion:1,channels:[{id:'tam-ly-cuoc-song',title:'Tâm lý cuộc sống',studioFolder:'Tam-Ly'}],series:[{id:'self-help-shorts',channel:'tam-ly-cuoc-song',path:'series/tam-ly-cuoc-song/self-help-shorts/series.json'}]});
 const project={id:'thu-mot',title:'Tập thử một',status:'planning',format:'short',durationSeconds:45,paths:{source:'src/projects/thu-mot',scripts:'scripts/projects/thu-mot',docs:'docs/projects/thu-mot',assets:'public/thu-mot'},registrations:[]};
 write('series/tam-ly-cuoc-song/self-help-shorts/series.json',{schemaVersion:1,id:'self-help-shorts',channel:'tam-ly-cuoc-song',title:'Self-help',studioFolder:'Self',formats:['short','long'],summary:'Series thử.',projects:[project]});
 write('src/projects/registry.tsx','export const Projects=()=> <></>;');
 for(const f of ['themes.json','animation-styles.json'])fs.cpSync(path.resolve('src/looks',f),path.join(root,'src/looks',f));
 fs.mkdirSync(path.join(root,'public/stoic/fonts'),{recursive:true});for(const n of ['NotoSans-Regular.ttf','NotoSans-Bold.ttf'])fs.copyFileSync(path.resolve('public/stoic/fonts',n),path.join(root,'public/stoic/fonts',n));
 const mark=s=>console.log('✓ '+s);
 // ---- backend --------------------------------------------------------------------------------------------
 const looks=createLooks(root);let view=looks.looks();
 assert.equal(view.themes.length,10);assert.equal(view.styles.length,10);assert.equal(view.projects[0].id,'thu-mot');
 const base=structuredClone(view.themes[0]);delete base.id;delete base.usedBy;
 const made=looks.saveTheme({theme:{...base,name:'Biển chiều'},revision:view.revisions.themes});assert.equal(made.theme.id,'bien-chieu');
 assert.throws(()=>looks.saveTheme({theme:{...base,name:'Cũ'},revision:view.revisions.themes}),e=>e.status===409);mark('A new theme gets a slug id; a stale revision is refused (409)');
 assert.throws(()=>looks.saveTheme({theme:{...base,name:'X',palette:{...base.palette,ink:'red'}},revision:made.revision}),/#rrggbb/);
 assert.throws(()=>looks.saveTheme({theme:{...base,name:'X',sample:{caption:'Một câu',keyword:'không có'}},revision:made.revision}),/Từ khóa mẫu/);mark('Bad colours and a keyword outside the sample are refused');
 const seriesFile=path.join(root,'series/tam-ly-cuoc-song/self-help-shorts/series.json');
 const set=looks.setLook({project:'thu-mot',theme:'bien-chieu',style:'chu-chuyen-dong',revision:looks.seriesRevision('thu-mot').revision});
 assert.deepEqual(set.look,{theme:'bien-chieu',style:'chu-chuyen-dong'});assert.deepEqual(JSON.parse(fs.readFileSync(seriesFile,'utf8')).projects[0].look,set.look);
 assert.ok(fs.readdirSync(path.join(path.dirname(seriesFile),'.manager-history')).length>=1);catalog.validate(catalog.load(root));mark('A project look is written to series.json (history kept) and passes the catalog check');
 view=looks.looks();assert.deepEqual(view.themes.find(t=>t.id==='bien-chieu').usedBy,['thu-mot']);
 assert.throws(()=>looks.deleteTheme({id:'bien-chieu',revision:view.revisions.themes}),/đang dùng/i);mark('A theme in use cannot be deleted');
 const data=JSON.parse(fs.readFileSync(seriesFile,'utf8'));data.projects[0].look={theme:'khong-co'};fs.writeFileSync(seriesFile,JSON.stringify(data,null,2)+'\n');
 assert.throws(()=>catalog.validate(catalog.load(root)),/Unknown theme/);data.projects[0].look={theme:'bien-chieu',style:'chu-chuyen-dong'};fs.writeFileSync(seriesFile,JSON.stringify(data,null,2)+'\n');mark('projects:check rejects an unknown theme');
 const fav=looks.saveStyleNote({id:'net-ve',userNote:'Dùng cho tóm tắt sách',favorite:true,revision:view.revisions.styles});
 assert.equal(JSON.parse(fs.readFileSync(path.join(root,'src/looks/animation-styles.json'),'utf8')).styles[0].userNote,'Dùng cho tóm tắt sách');assert.ok(fav.revision);
 assert.ok(looks.sampleIds().includes('PhongCachNetVe'));mark('Style note and favourite are saved; sample IDs come from the list');
 // ---- browser --------------------------------------------------------------------------------------------
 const server=createManager({root,ensureStudio:async()=>{}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome'}),errors=[];
 try{
  for(const [w,h,tag] of [[1440,1000,'desktop'],[768,1024,'tablet'],[390,844,'mobile']]){
   const page=await browser.newPage({viewport:{width:w,height:h},locale:'vi-VN'});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   await page.goto(url+'/?view=themes',{waitUntil:'networkidle'});await page.locator('.theme-card').first().waitFor();
   assert.equal(await page.locator('.theme-card').count(),11);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow '+tag);
   // Theme colours reach the preview through CSS variables (the CSP blocks inline style attributes).
   assert.equal(await page.locator('.theme-card .look-stage').first().evaluate(el=>getComputedStyle(el).getPropertyValue('--t-accent').trim()),'#d9b56f');
   await page.locator('#looks-search').fill('lo au');await page.waitForTimeout(350);assert.equal(await page.locator('.theme-card').count(),1);
   await page.locator('#looks-search').fill('');await page.waitForTimeout(350);await page.locator('[data-look-format="long"]').click();assert.ok(await page.locator('.theme-card').count()<11);
   await page.screenshot({path:path.join(out,`themes-${tag}.png`)});mark(`${tag}: theme grid, accent-insensitive search and format filter`);
   await page.close();
  }
  const page=await browser.newPage({viewport:{width:1440,height:1000},locale:'vi-VN'});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url+'/?view=themes',{waitUntil:'networkidle'});await page.locator('[data-theme-new]').first().click();await page.locator('#look-form').waitFor();
  await page.locator('#looks-dialog input[name=name]').fill('Hoàng hôn tím');await page.locator('#looks-dialog input[name="palette.background"]').fill('#2a1840');
  assert.equal(await page.locator('#looks-dialog .look-stage').first().evaluate(el=>getComputedStyle(el).getPropertyValue('--t-background').trim()),'#2a1840');mark('The preview repaints while editing');
  await page.locator('#look-form button[type=submit]').click();await page.locator('#looks-dialog .swatches').waitFor();
  assert.ok(JSON.parse(fs.readFileSync(path.join(root,'src/looks/themes.json'),'utf8')).themes.some(t=>t.id==='hoang-hon-tim'&&t.palette.background==='#2a1840'));mark('A theme created in the form is saved');
  await page.locator('[data-look-assign^="theme:"]').click();await page.locator('#assign-form select').selectOption('thu-mot');await page.locator('#assign-form button[type=submit]').click();await page.waitForTimeout(400);
  assert.equal(JSON.parse(fs.readFileSync(seriesFile,'utf8')).projects[0].look.theme,'hoang-hon-tim');mark('"Gắn cho dự án" writes the project look');
  await page.goto(url+'/?view=motion',{waitUntil:'networkidle'});await page.locator('.motion-row').first().waitFor();assert.equal(await page.locator('.motion-row').count(),10);
  await page.locator('[data-motion-play="chu-chuyen-dong"]').click();assert.equal(await page.locator('[data-motion-play="chu-chuyen-dong"]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-style-fav="hinh-khoi"]').click();await page.waitForTimeout(400);await page.locator('[data-look-fav="1"]').click();assert.equal(await page.locator('.motion-row').count(),2);mark('Preview toggles; favourites filter shows the marked styles');
  const studio=page.waitForEvent('popup');await page.locator('[data-style-studio="PhongCachHinhKhoi"]').click();assert.match((await studio).url(),/PhongCachHinhKhoi/);mark('"Xem mẫu trong Studio" opens the sample composition');
  await page.screenshot({path:path.join(out,'motion-desktop.png')});
  assert.deepEqual(errors,[]);
 }finally{await browser.close();server.close();fs.rmSync(root,{recursive:true,force:true});}
 console.log('looks: all checks passed');
})().catch(e=>{console.error(e);process.exit(1);});
