/* System map: data coverage against repos-manifest.json, then a read-only browser check on its own manager instance. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {ROOT}=require('../../scripts/catalog/catalog.cjs');
const {systemMap}=require('./system-map.cjs');

const map=systemMap(ROOT);
const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'repos-manifest.json'),'utf8')).map(m=>path.basename(m.path));
const ids=map.repos.map(r=>r.id);
assert.deepEqual([...ids].sort(),[...manifest].sort(),'every pinned repo has exactly one map entry');
assert.equal(new Set(ids).size,ids.length,'no duplicate entries');
for(const r of map.repos){
  assert.ok(map.statuses[r.status],`${r.id}: known status`);
  for(const k of ['title','category','general','role','reuse'])assert.ok(r[k],`${r.id}: ${k}`);
}
assert.ok(map.stages.length>=10,'stages come from production automation');
const stageIds=new Set(map.stages.map(s=>s.id));
for(const c of map.components){assert.ok(map.layers.some(l=>l.id===c.layer),`${c.id}: known layer`);for(const s of c.stages)assert.ok(stageIds.has(s),`${c.id}: stage ${s}`);for(const id of c.repos)assert.ok(ids.includes(id),`${c.id}: repo ${id}`);}
assert.deepEqual(map.warnings,[],'map agrees with measured facts');
// Measurement sanity: Remotion is imported, an idle package is not.
assert.ok(map.repos.find(r=>r.id==='remotion-dev--remotion').facts.usedBy.length>10);
assert.equal(map.repos.find(r=>r.id==='mrdoob--three.js').facts.usedBy.length,0);
console.log(`✓ Map covers ${ids.length} repos, ${map.stages.length} stages, no drift`);

(async()=>{
  const {chromium}=require('playwright-core');
  const {createManager}=require('./server.cjs');
  const server=createManager({ensureStudio:async()=>{throw Error('no studio in test');},ensureVoiceStudio:async()=>({}),voiceStudio:{status:async()=>({state:'off'}),stop:async()=>({})}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome'});
  const out=path.join(ROOT,'.cache/project-manager/system-map');fs.mkdirSync(out,{recursive:true});
  const errors=[];
  try{
    for(const [name,width,height] of [['desktop',1440,1000],['tablet',900,1100],['mobile',390,860]]){
      const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>errors.push(e.message));
      await page.goto(base+'/?view=system',{waitUntil:'networkidle'});
      await page.locator('.sys-rail .sys-stage').first().waitFor();
      assert.equal(await page.locator('#page-title').innerText(),'Bản đồ hệ thống');
      assert.equal(await page.locator('#new-project-button').isVisible(),false,'no Thêm dự án on the map');
      assert.equal(await page.locator('#navigation [data-open-voicestudio]').count(),0,'no VoiceStudio entry in the sidebar');
      assert.ok(await page.locator('.sys-tabs').evaluate(t=>t.scrollHeight<=t.clientHeight+1&&t.scrollWidth<=t.clientWidth+1),'tabs fit without scrollbars');
      assert.equal(await page.locator('.sys-rail .sys-stage').count(),map.stages.length);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${name}: no horizontal scroll`);
      await page.screenshot({path:path.join(out,`${name}-flow.png`),fullPage:true});
      // Repo chip on a stage opens the catalog with that repo's detail.
      await page.locator('#sys-stage-sources [data-sys-repo="pymupdf--PyMuPDF"]').click();
      await page.locator('#sys-detail h3').filter({hasText:'PyMuPDF'}).waitFor();
      assert.match(page.url(),/sys=repos&repo=pymupdf--PyMuPDF/);
      assert.match(await page.locator('#sys-detail').innerText(),/1\.26\.7/);
      await page.screenshot({path:path.join(out,`${name}-repo.png`),fullPage:true});
      // Status filter + search.
      await page.locator('[data-sys-status="idle"]').click();
      const idle=map.repos.filter(r=>r.status==='idle').length;
      assert.equal(await page.locator('.sys-row').count(),idle);
      await page.locator('#sys-search').fill('three');await page.waitForTimeout(250);
      assert.ok(await page.locator('.sys-row').count()>=1);
      assert.equal(await page.locator('#sys-search').evaluate(e=>e===document.activeElement),true,'search keeps focus while filtering');
      await page.locator('#sys-search').fill('khong co repo nao');await page.waitForTimeout(250);
      assert.equal(await page.locator('.sys-row').count(),0);
      // Keyboard tabs and architecture view.
      await page.locator('#sys-tab-repos').focus();await page.keyboard.press('ArrowLeft');
      assert.equal(await page.locator('#sys-tab-layers').getAttribute('aria-selected'),'true');
      await page.locator('[data-sys-status="idle"]').click();
      assert.ok(await page.locator('.sys-layer').count()>=5);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${name}: layers fit`);
      await page.screenshot({path:path.join(out,`${name}-layers.png`),fullPage:true});
      // Stage link from a repo detail jumps back to the rail.
      await page.locator('#sys-tab-repos').click();await page.locator('#sys-search').fill('');await page.waitForTimeout(200);
      await page.locator('[data-sys-pick="remotion-dev--remotion"]').click();
      await page.locator('#sys-detail [data-sys-stage="assembly"]').click();
      await page.locator('#sys-stage-assembly.sys-highlight').waitFor();
      console.log(`✓ ${name} ${width}×${height}: flow, repo detail, filters, tabs, layers`);
      await page.close();
    }
    assert.deepEqual(errors,[]);
    console.log(`Screenshots in ${path.relative(ROOT,out)}/`);
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
