const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {load,validate} = require('./catalog.cjs');
const {createProject,renameProject,createSeries} = require('./projects.cjs');

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
test('an empty title gets a temporary name that only the rename command replaces, together with paths and Studio IDs',t=>{
  const {root,write}=fixture(t);
  fs.mkdirSync(path.join(root,'docs/projects/chua-dat-ten-1'),{recursive:true});
  const first=createProject(load(root),{'--series':'demo','--id':'','--title':'  ','--format':'short'});
  assert.deepEqual([first.id,first.title,first.autoNamed],['chua-dat-ten-2','Chưa đặt tên 2',true]);
  const second=createProject(load(root),{'--series':'demo','--title':'','--format':'long'});
  assert.equal(second.id,'chua-dat-ten-3');
  assert.throws(()=>createProject(load(root),{'--series':'demo','--id':'','--title':'Có tên','--format':'short'}),/Require valid/);
  // Production files of the temporary project, plus its registration in the shared registry.
  write('src/projects/chua-dat-ten-2/Video.tsx',"export const ChuaDatTen2Video=()=>staticFile('chua-dat-ten-2/audio/a.wav');");
  write('scripts/projects/chua-dat-ten-2/story.json','{"asset":"public/chua-dat-ten-2/audio"}');
  write('public/chua-dat-ten-2/audio/voice-metadata.json','[]');
  write('docs/projects/chua-dat-ten-2/approvals.json','{"path":"docs/projects/chua-dat-ten-2"}');
  write('package.json','{"scripts":{"voice:chua-dat-ten-2":"x --story scripts/projects/chua-dat-ten-2/story.json","voice:chua-dat-ten-20":"keep"}}');
  const registry=fs.readFileSync(path.join(root,'src/projects/registry.tsx'),'utf8')
    .replace("import {Video} from './old/Video';","import {Video} from './old/Video'; import {ChuaDatTen2Video} from './chua-dat-ten-2/Video';")
    .replace('</Folder></Folder></Folder>;','</Folder><Folder name="chua-dat-ten-2"><Composition id="ChuaDatTen2Adam" component={ChuaDatTen2Video} durationInFrames={30} fps={30} width={720} height={1280} /></Folder></Folder></Folder>;');
  write('src/projects/registry.tsx',registry);
  const catalog=load(root);catalog.series[0].projects.find(p=>p.id==='chua-dat-ten-2').registrations.push({id:'ChuaDatTen2Adam',kind:'Composition'});
  fs.writeFileSync(catalog.series[0].file,JSON.stringify({...JSON.parse(fs.readFileSync(catalog.series[0].file,'utf8')),projects:catalog.series[0].projects}));
  validate(load(root));
  assert.throws(()=>renameProject(load(root),'old',{'--id':'new-old','--title':'Mới'}),/real name/);
  assert.throws(()=>renameProject(load(root),'chua-dat-ten-2',{'--id':'old','--title':'Trùng'}),/already exists/);
  const renamed=renameProject(load(root),'chua-dat-ten-2',{'--id':'son-merzy','--title':'Son Merzy — Adam bựa'});
  assert.deepEqual([renamed.id,renamed.title,renamed.autoNamed,renamed.paths.assets,renamed.registrations[0].id],['son-merzy','Son Merzy — Adam bựa',undefined,'public/son-merzy','SonMerzyAdam']);
  validate(load(root));
  for(const prefix of ['src/projects','scripts/projects','docs/projects','public'])assert.ok(!fs.existsSync(path.join(root,prefix,'chua-dat-ten-2'))&&fs.existsSync(path.join(root,prefix,'son-merzy')));
  assert.equal(fs.readFileSync(path.join(root,'src/projects/son-merzy/Video.tsx'),'utf8'),"export const SonMerzyVideo=()=>staticFile('son-merzy/audio/a.wav');");
  assert.match(fs.readFileSync(path.join(root,'docs/projects/son-merzy/brief.md'),'utf8'),/^# Son Merzy — Adam bựa\n/);
  assert.equal(fs.readFileSync(path.join(root,'docs/projects/son-merzy/approvals.json'),'utf8'),'{"path":"docs/projects/chua-dat-ten-2"}');
  assert.equal(fs.readFileSync(path.join(root,'package.json'),'utf8'),'{"scripts":{"voice:son-merzy":"x --story scripts/projects/son-merzy/story.json","voice:chua-dat-ten-20":"keep"}}');
  assert.throws(()=>renameProject(load(root),'son-merzy',{'--id':'again','--title':'Lần nữa'}),/real name/);
});
