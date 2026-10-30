const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {load,validate} = require('./catalog.cjs');
const {createProject,createSeries} = require('./projects.cjs');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'series-catalog-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const seriesPath = 'series/tam-ly-cuoc-song/demo/series.json';
  const write = (file,value) => {
    fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});
    fs.writeFileSync(path.join(root,file),typeof value==='string'?value:JSON.stringify(value));
  };
  write('series/catalog.json',{schemaVersion:1,channels:[{id:'tam-ly-cuoc-song',title:'Test',studioFolder:'Test'}],series:[{id:'demo',channel:'tam-ly-cuoc-song',path:seriesPath}]});
  const paths = {source:'src/projects/old',scripts:'scripts/projects/old',docs:'docs/projects/old',assets:'public/old'};
  for (const dir of Object.values(paths)) fs.mkdirSync(path.join(root,dir),{recursive:true});
  write(seriesPath,{schemaVersion:1,id:'demo',channel:'tam-ly-cuoc-song',title:'Demo',studioFolder:'Demo',formats:['short','long'],projects:[{id:'old',title:'Old',status:'existing',format:'short',paths,registrations:[{id:'Old',kind:'Composition'},{id:'OldThumb',kind:'Still'}]}]});
  write('src/projects/registry.tsx',`import {Composition,Still,Folder} from 'remotion';
import {Video} from './old/Video'; import {Thumbnail} from './old/Thumbnail';
export const Projects = () => <Folder name="Test"><Folder name="Demo"><Folder name="old">
<Composition id="Old" component={Video} durationInFrames={1350} fps={30} width={1080} height={1920} />
<Still id="OldThumb" component={Thumbnail} width={1080} height={1920} />
</Folder></Folder></Folder>;`);
  return {root,write,seriesPath};
}

test('catalog accounts for video and thumbnail in the same channel/series/project folder',t=>{
  const {root}=fixture(t);
  assert.deepEqual(validate(load(root)),{channels:1,series:1,projects:1,registeredCompositionsAndStills:2,planning:0});
});
test('wrong folder and orphaned production project fail validation',t=>{
  const {root}=fixture(t);
  const file=path.join(root,'src/projects/registry.tsx'),original=fs.readFileSync(file,'utf8');
  fs.writeFileSync(file,original.replace('name="Demo"','name="Other"'));
  assert.throws(()=>validate(load(root)),/Wrong Studio folder/);
  fs.writeFileSync(file,original);
  fs.mkdirSync(path.join(root,'src/projects/orphan'));
  assert.throws(()=>validate(load(root)),/no series/);
});
test('duplicate episode IDs cannot silently join another series',t=>{
  const {root}=fixture(t),catalog=load(root);
  catalog.series[0].projects.push({...catalog.series[0].projects[0]});
  assert.throws(()=>validate(catalog),/Duplicate\/invalid project/);
});
test('planning scaffold is isolated, defaults self-help shorts to 45 seconds and does not generate production assets',t=>{
  const {root}=fixture(t),catalog=load(root);
  const project=createProject(catalog,{'--series':'demo','--id':'next','--title':'Next','--format':'short'});
  assert.equal(project.durationSeconds,45);
  assert.equal(project.status,'planning');
  assert.deepEqual(project.registrations,[]);
  assert.ok(fs.existsSync(path.join(root,'docs/projects/next/brief.md')));
  assert.ok(!fs.existsSync(path.join(root,'src/projects/next')));
  assert.ok(!fs.existsSync(path.join(root,'public/next')));
  assert.equal(validate(load(root)).planning,1);
  const brief=fs.readFileSync(path.join(root,'docs/projects/next/brief.md'),'utf8');
  assert.throws(()=>createProject(load(root),{'--series':'demo','--id':'next','--title':'Overwrite','--format':'short'}),/already exists/);
  assert.equal(fs.readFileSync(path.join(root,'docs/projects/next/brief.md'),'utf8'),brief);
});
test('long episodes remain unapproved in duration; path traversal and unrelated book references are rejected',t=>{
  const {root}=fixture(t),catalog=load(root);
  const project=createProject(catalog,{'--series':'demo','--id':'long-episode','--title':'Long','--format':'long'});
  assert.equal(project.durationSeconds,null);
  assert.throws(()=>createProject(catalog,{'--series':'demo','--id':'../../escape','--title':'Bad','--format':'short'}),/Require valid/);
  assert.throws(()=>createProject(catalog,{'--series':'demo','--id':'bad-book','--title':'Bad','--format':'short','--book':'../../escape'}),/Unknown book/);
});
test('new series belongs to a known channel and does not replace existing configuration',t=>{
  const {root}=fixture(t),catalog=load(root);
  createSeries(catalog,{'--channel':'tam-ly-cuoc-song','--id':'new-series','--title':'New','--formats':'long,short'});
  assert.equal(validate(load(root)).series,2);
  assert.throws(()=>createSeries(load(root),{'--channel':'tam-ly-cuoc-song','--id':'new-series','--title':'Other','--formats':'short'}),/already exists/);
});
