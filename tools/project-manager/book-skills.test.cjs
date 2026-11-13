// node --test tools/project-manager/book-skills.test.cjs — the manager's "Bộ skill" backend on a fixture repo, with
// temporary agent folders; never touches the real book-skills/ or the real global skill folders.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'manager-book-skills-'));
const root=path.join(tmp,'repo'),agentA=path.join(tmp,'a'),agentB=path.join(tmp,'b');
process.env.BOOK_SKILLS_TARGETS=`claude=${agentA},codex=${agentB}`;
const {createBookSkills}=require('./book-skills.cjs');
test.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));
const write=(p,t)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,t);};

write(path.join(root,'series/c/s/books/demo/book.json'),JSON.stringify({id:'demo',title:'Demo',sourceSha256:'abc',chaptersRead:2,chaptersTotal:2,kind:'technical'}));
write(path.join(root,'series/c/s/books/plain/book.json'),JSON.stringify({id:'plain',title:'Plain',chaptersRead:1,chaptersTotal:3,kind:'technical'}));
write(path.join(root,'book-skills/demo/pack.json'),JSON.stringify({book:'demo',title:'Demo',sourceSha256:'abc',prefix:'demo',skills:[{name:'demo-a',purpose:'viết spec',pages:'7'}]}));
write(path.join(root,'book-skills/demo/skills/demo-a/SKILL.md'),'---\nname: demo-a\ndescription: Viết spec trước khi code.\n---\n\n# Demo\n\nXem [mẫu](references/mau.md).\n\n## Nguồn\n\n- PDF tr. 7: ý chính.\n');
write(path.join(root,'book-skills/demo/skills/demo-a/references/mau.md'),'# Mẫu\n');
write(path.join(tmp,'secret.md'),'secret');
const skills=createBookSkills(root);

test('a book without a pack reports its reading state and no pack',()=>{
  const info=skills.bookSkills('plain');
  assert.equal(info.pack,null);assert.equal(info.technical,true);assert.deepEqual(info.reading,{read:1,total:3});
  assert.deepEqual(info.targets.map(t=>t.label),['Claude Code','Codex']);
  assert.equal(skills.hasPack('plain'),false);assert.equal(skills.hasPack('demo'),true);
});

test('info lists skills, files and per-agent state; install copies to every agent',()=>{
  let info=skills.bookSkills('demo');
  assert.deepEqual(info.check.errors,[]);
  assert.equal(info.pack.skills[0].description,'Viết spec trước khi code.');
  assert.deepEqual(info.pack.skills[0].files,['SKILL.md','references/mau.md']);
  assert.deepEqual(info.pack.skills[0].states,{claude:'missing',codex:'missing'});
  const result=skills.installBookSkills('demo');
  assert.equal(result.ok,true);assert.deepEqual(result.info.pack.skills[0].states,{claude:'installed',codex:'installed'});
  assert.ok(fs.existsSync(path.join(agentB,'demo-a','references','mau.md')));
});

test('install that fails the check reports the error and changes nothing',()=>{
  write(path.join(root,'book-skills/demo/skills/demo-a/references/mau.md'),'# Mẫu\n\nTODO viết tiếp\n');
  const before=fs.readFileSync(path.join(agentA,'demo-a','references','mau.md'),'utf8');
  const result=skills.installBookSkills('demo');
  assert.equal(result.ok,false);assert.match(result.error,/chưa đạt kiểm tra/);
  assert.ok(result.info.check.errors.some(e=>/TODO/.test(e)));
  assert.equal(fs.readFileSync(path.join(agentA,'demo-a','references','mau.md'),'utf8'),before);
  assert.equal(result.info.pack.skills[0].states.claude,'outdated');
});

test('files are read only inside the skill folder and only as Markdown',()=>{
  assert.match(skills.bookSkillFile('demo','demo-a','SKILL.md').text,/# Demo/);
  assert.equal(skills.bookSkillFile('demo','demo-a','references/mau.md').name,'demo-a/references/mau.md');
  for(const bad of ['../../../../secret.md','references/../../pack.json','SKILL.txt','/etc/passwd.md',''])
    assert.throws(()=>skills.bookSkillFile('demo','demo-a',bad),/Invalid file|Không có tệp/);
  assert.throws(()=>skills.bookSkills('../x'),/Invalid identifier/);
  assert.throws(()=>skills.bookSkillFile('demo','../demo-a','SKILL.md'),/Invalid skill/);
});
