// System map for the manager: the hand-written roles in docs/architecture/system-map.json plus facts measured
// on every request (pinned commit, installed versions, which source files import each package, which runtimes
// exist). Read-only: nothing here writes, installs or starts anything.
const fs=require('node:fs');
const path=require('node:path');

const MAP_FILE='docs/architecture/system-map.json';
const SOURCE_DIRS=['src','scripts','tools'];
const SOURCE_EXT=new Set(['.ts','.tsx','.js','.cjs','.mjs','.py']);
const SKIP_DIRS=new Set(['node_modules','__pycache__','.manager-history','web']);

const readJson=(file,fallback)=>{try{return JSON.parse(fs.readFileSync(file,'utf8'));}catch{return fallback;}};
const escapeRe=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

function sourceFiles(root){
  const out=[];
  const walk=dir=>{
    let entries;try{entries=fs.readdirSync(dir,{withFileTypes:true});}catch{return;}
    for(const e of entries){
      if(e.isDirectory()){if(!SKIP_DIRS.has(e.name)&&!e.name.startsWith('.'))walk(path.join(dir,e.name));}
      else if(SOURCE_EXT.has(path.extname(e.name)))out.push(path.join(dir,e.name));
    }
  };
  for(const d of SOURCE_DIRS)walk(path.join(root,d));
  return out.map(file=>({file:path.relative(root,file),text:fs.readFileSync(file,'utf8')}));
}

// JS/TS import or require of the package (bare or a subpath); Python `import x` / `from x import`.
// `refs` are plain strings (a binary path, a runtime folder) for repos used without an import.
function importers(files,{packages=[],module=null,refs=[]}){
  const patterns=packages.map(p=>new RegExp(`(?:from|require\\(|import\\(|import)\\s*['"]${escapeRe(p)}(?:['"/])`));
  if(module)patterns.push(new RegExp(`^\\s*(?:import|from)\\s+${escapeRe(module)}\\b`,'m'));
  for(const r of refs)patterns.push(new RegExp(escapeRe(r)));
  if(!patterns.length)return [];
  return files.filter(f=>!/\.test\.|\/tests?\//.test(f.file)&&patterns.some(re=>re.test(f.text))).map(f=>f.file).sort();
}

function distVersion(root,env,dist){
  const lib=path.join(root,env,'lib');
  let pythons;try{pythons=fs.readdirSync(lib).filter(n=>n.startsWith('python'));}catch{return null;}
  for(const py of pythons){
    const site=path.join(lib,py,'site-packages');
    let names;try{names=fs.readdirSync(site);}catch{continue;}
    const prefix=dist.toLowerCase().replace(/-/g,'_')+'-';
    const hit=names.find(n=>n.endsWith('.dist-info')&&n.toLowerCase().startsWith(prefix));
    if(hit)return hit.slice(prefix.length,-'.dist-info'.length);
  }
  return null;
}

function onPath(name){
  return (process.env.PATH||'').split(path.delimiter).some(dir=>{try{fs.accessSync(path.join(dir,name),fs.constants.X_OK);return true;}catch{return false;}});
}

function stagesOf(root){
  try{
    const {seriesWorkflow}=require('../production-automation/cli.cjs');
    const {load}=require('../../scripts/catalog/catalog.cjs');
    return seriesWorkflow(root,(load(root).series.find(s=>s.requireBook===true)||{id:'book-insights'}).id).stages.map(s=>({id:s.id,title:s.title,kind:s.kind,role:s.role,guide:s.guide,dependencies:s.dependencies}));
  }catch(error){return [];}
}

function systemMap(root){
  const map=readJson(path.join(root,MAP_FILE),null);
  if(!map)throw Object.assign(new Error(`Không đọc được ${MAP_FILE}`),{status:500});
  const manifest=readJson(path.join(root,'repos-manifest.json'),[]);
  const pkg=readJson(path.join(root,'package.json'),{});
  const deps={...pkg.devDependencies,...pkg.dependencies};
  const files=sourceFiles(root);
  const byPath=Object.fromEntries(manifest.map(m=>[path.basename(m.path),m]));
  const stages=stagesOf(root),stageIds=new Set(stages.map(s=>s.id));
  const warnings=[];

  const repos=map.repos.map(entry=>{
    const pin=byPath[entry.id];
    const packages=(entry.packages||[]).map(name=>({name,version:deps[name]||null}));
    const usedBy=importers(files,{packages:entry.packages,module:entry.python?.module,refs:entry.refs});
    const facts={
      upstream:pin?.repo||null,commit:pin?.commit?pin.commit.slice(0,10):null,
      cloned:Boolean(pin&&fs.existsSync(path.join(root,pin.path))),
      packages,usedBy,
      python:entry.python?{env:entry.python.env,version:distVersion(root,entry.python.env,entry.python.dist||entry.python.module)}:null,
      binary:entry.binary?{path:entry.binary,present:fs.existsSync(path.join(root,entry.binary))}:entry.binaryCheck?{path:entry.binaryCheck,present:onPath(entry.binaryCheck)}:null,
      runtime:entry.runtime?{path:entry.runtime,present:fs.existsSync(path.join(root,entry.runtime))}:null,
      graph:entry.codeGraph?(()=>{const g=require('../production-automation/cli.cjs').codeGraph(root);return {built:g.builtAt,stale:g.stale};})():null,
      skills:(entry.skills||[]).map(name=>({name,present:fs.existsSync(path.join(root,'skills',name,'SKILL.md'))}))
    };
    const notes=[];
    if(!pin)notes.push('Không có trong repos-manifest.json.');
    if(entry.packages?.length&&packages.some(p=>!p.version))notes.push('Có package chưa khai báo trong package.json.');
    if(entry.status==='idle'&&(entry.packages?.length||entry.python)&&usedBy.length)notes.push(`Đang ghi "chưa dùng" nhưng ${usedBy.length} file đã import; nên cập nhật trạng thái.`);
    if(entry.status==='production'&&entry.packages?.length&&!usedBy.length)notes.push('Ghi "chạy trong sản xuất" nhưng không tìm thấy file nào import.');
    if(entry.python&&!facts.python.version)notes.push(`Chưa thấy gói trong ${entry.python.env}.`);
    if(facts.runtime&&!facts.runtime.present)notes.push(`Chưa có runtime ${entry.runtime}.`);
    if(entry.status==='skill'&&facts.skills.some(s=>!s.present))notes.push('Thiếu thư mục skill đã khai báo.');
    for(const s of entry.stages||[])if(!stageIds.has(s))notes.push(`Bước "${s}" không còn trong quy trình.`);
    for(const n of notes)warnings.push({repo:entry.id,title:entry.title,message:n});
    return {...entry,facts,notes};
  });

  const mapped=new Set(map.repos.map(r=>r.id));
  for(const m of manifest){const id=path.basename(m.path);if(!mapped.has(id))warnings.push({repo:id,title:m.repo,message:'Repo có trong repos-manifest.json nhưng chưa có mô tả trong bản đồ.'});}
  for(const c of map.components)for(const s of c.stages||[])if(!stageIds.has(s))warnings.push({repo:null,title:c.title,message:`Bước "${s}" không còn trong quy trình.`});

  const environments=(map.environments||[]).map(e=>({...e,present:fs.existsSync(path.join(root,e.path))}));
  const counts=Object.fromEntries(Object.keys(map.statuses).map(k=>[k,repos.filter(r=>r.status===k).length]));
  return {updated:map.updated,source:MAP_FILE,statuses:map.statuses,layers:map.layers,components:map.components,environments,stages,repos,counts,warnings,
    scanned:files.length};
}

module.exports={systemMap,MAP_FILE};
