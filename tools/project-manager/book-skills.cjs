// "Bộ skill" tab of a technical book (user 2026-11-13: every technical book shows its skill pack). The logic lives
// in scripts/book-skills (the same CLI agents use); this runs it in JSON mode against the manager's workspace and
// reads pack files for viewing. Installing is an explicit button, never a side effect of opening the page.
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {slug}=require('../../scripts/catalog/catalog.cjs');

const CLI=path.join(__dirname,'..','..','scripts','book-skills','cli.mjs');
const LABELS={claude:'Claude Code',codex:'Codex',opencode:'OpenCode'};

function createBookSkills(root){
  const run=(args)=>{
    const r=spawnSync(process.execPath,[CLI,...args],{cwd:root,env:{...process.env,BOOK_SKILLS_REPO:root},encoding:'utf8',timeout:60000,maxBuffer:8*1024*1024});
    if(r.error)throw r.error;
    const out=(r.stdout||'').trim().split('\n').pop();
    try{return JSON.parse(out);}catch{throw new Error((r.stderr||r.stdout||'Không chạy được công cụ bộ skill').trim().split('\n').pop());}
  };
  const label=info=>({...info,targets:info.targets.map(t=>({...t,label:LABELS[t.name]||t.name}))});
  const checked=bookId=>{if(!slug(bookId))throw Object.assign(new Error('Invalid identifier'),{status:400});return bookId;};
  return {
    hasPack:bookId=>fs.existsSync(path.join(root,'book-skills',bookId,'pack.json')),
    bookSkills(bookId){return label(run(['info',checked(bookId),'--json']));},
    installBookSkills(bookId){const r=run(['install',checked(bookId),'--json']);return {...r,info:label(r.info)};},
    // One Markdown file of one skill, for the viewer. Only .md files inside book-skills/<book>/skills/<skill>/.
    bookSkillFile(bookId,skill,file){
      checked(bookId);if(!slug(skill))throw Object.assign(new Error('Invalid skill'),{status:400});
      if(typeof file!=='string'||!/^[\w./-]+\.md$/.test(file)||file.split('/').some(p=>p==='..'||p===''))throw Object.assign(new Error('Invalid file'),{status:400});
      const base=path.join(root,'book-skills',bookId,'skills',skill),target=path.join(base,file);
      if(!fs.existsSync(target))throw Object.assign(new Error('Không có tệp này trong bộ skill'),{status:404});
      const real=fs.realpathSync(target),realBase=fs.realpathSync(base);
      if(!real.startsWith(realBase+path.sep)||!fs.statSync(real).isFile())throw Object.assign(new Error('Invalid file'),{status:400});
      if(fs.statSync(real).size>1024*1024)throw new Error('Tệp quá lớn');
      return {filename:file,name:`${skill}/${file}`,text:fs.readFileSync(real,'utf8')};
    },
  };
}
module.exports={createBookSkills};
