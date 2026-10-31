// Planning/status are read-only. Model runs, approvals and apply happen only through explicit
// commands (run, approve, apply); nothing here is scheduled or triggered by navigation.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const {load, slug} = require('../../scripts/catalog/catalog.cjs');
const policy = require('./policy.json');
const approvals = require('./approvals.cjs');
const runner = require('./runner.cjs');
const seriesNotes = require('./series-notes.cjs');
const review = require('./review.cjs');
const progress = require('./progress.cjs');
// AUTOMATION_ROOT exists for fixture tests of the CLI process itself.
const ROOT = path.resolve(process.env.AUTOMATION_ROOT || path.join(__dirname, '../..'));

const globRe=g=>new RegExp('^'+g.split(/(\*\*\/|\/\*\*|\*)/).map(t=>t==='**/'?'(?:.*/)?':t==='/**'?'(?:/.*)?':
  t==='*'?'[^/]*':t.replace(/[.+?^${}()|[\]\\]/g,'\\$&')).join('')+'$');
const DENY=policy.deniedPaths.map(globRe);
const denied=rel=>DENY.some(re=>re.test(rel.replace(/\/\*\*$/,'/x')));

// Each profile is an approved production workflow; a channel without one has no automated stages.
function profileFor(series){
  return series.id==='book-insights'?'book':series.channel==='kids'?'kids':series.channel==='tam-ly-cuoc-song'?'philosophy':null;
}
const seriesDirOf=series=>path.posix.dirname(series.relativeFile||`series/${series.channel}/${series.id}/series.json`);
// title/guide are the Vietnamese description shown in the manager; deliverable is what the worker receives.
function buildStages(profile,seriesDir,{source:S,scripts:X,docs:D,assets:P}){
  const stages=[];
  // kind: draft-task (future LLM worker), operator-task (host/user runs a fixed local tool),
  // check (fixed read-only operations), human-approval (user gate bound to artifact hashes).
  function add(id,role,title,guide,deliverable,dependencies=[],{kind='draft-task',upstreamKind=null,reads=[],writes=[],outputs=writes,operations=[]}={}) {
    stages.push({id,role,title,guide,deliverable,dependencies,kind,upstreamKind,status:'not-started',
      readScope:reads,writeScope:writes,outputs,operations});
  }
  const gate=(id,title,guide,deliverable,dependencies)=>add(id,'user',title,guide,deliverable,dependencies,{kind:'human-approval'});
  add('brief','editor','Đề bài','Chốt khán giả, thông điệp, format và thời lượng. Tập cũ giữ timing hiện có.',
    'Audience, message, format and duration. Existing timings are preserved.',[],
    {upstreamKind:'design',reads:[`${seriesDir}/README.md`,`${D}/**`],writes:[`${D}/brief.md`]});
  if(profile==='book') {
    add('sources','researcher','Nguồn sách','Truy xuất PDF đã cache theo phạm vi, ghi chương và trang. Không đưa cả cuốn sách vào ngữ cảnh.',
      'Use cached bounded PDF retrieval, chapter coverage, page provenance; no full-book context dump.',['brief'],
      {kind:'operator-task',reads:[`${seriesDir}/books/**`,`${D}/brief.md`],writes:[`${D}/sources.md`],operations:['pdf-retrieval']});
    add('script','writer','Kịch bản','Bám nguồn, tách ý tác giả khỏi diễn giải của kênh.',
      'Source-grounded Vietnamese draft separating author ideas and channel interpretation.',['sources'],
      {upstreamKind:'design',reads:[`${D}/brief.md`,`${D}/sources.md`],writes:[`${D}/script.md`]});
  } else add('script','writer','Kịch bản',profile==='kids'?'Lời kể tự nhiên, bám hành động nhìn thấy trên hình.':'Lời đọc tự nhiên có khoảng lặng; Short triết lý mới mặc định 45 giây.',
    'Natural Vietnamese script with purposeful pauses; new philosophy Shorts default to 45 seconds.',['brief'],
    {upstreamKind:'design',reads:[`${D}/brief.md`],writes:[`${D}/script.md`]});
  add('editorial-review','reviewer','Phản biện kịch bản','Độ rõ, mô-típ lặp với tập khác, cảm xúc, luận điểm cần kiểm tra, nhịp đọc 1×.',
    'Clarity, repetition, emotional tone, factual claims and natural 1x narration timing.',['script'],
    {upstreamKind:'review',reads:[`${D}/**`,'docs/projects/*/script.md'],writes:[`${D}/script-review.md`]});
  // Initial lock (docs/architecture/review-workflow.md): script, music, voice choice + sample, locked specs and
  // per-scene prompts are approved together once; later edits become patches the user accepts one by one.
  add('music','editor','Nhạc nền','Chọn bài có tên và tác giả; giữ fade theo cạnh clip, ducking dưới giọng, start/end chỉnh được trong Studio.',
    'Pick a credited track; keep edge fades, speech ducking and Studio-editable start/end.',['editorial-review'],
    {kind:'operator-task',reads:[`${D}/script.md`,'scripts/shared/audio-library.json'],writes:[`${S}/music.json`]});
  add('voice-audition','voice-editor','Chọn giọng',profile==='kids'?'Giữ giọng B Trúc Ly đã chọn; ghi voice.json kèm một đoạn nghe mẫu.':
    'Theo lựa chọn giọng trong brief (1: VieNeu có sẵn, ưu tiên playlist; 2: clone từ bản ghi được phép); ghi voice.json kèm một đoạn nghe mẫu. Lời đọc đầy đủ làm sau khi chốt.',
    profile==='kids'?'Keep accepted Trúc Ly B; record voice.json with a short sample.':
    'Choose the voice per the brief and record voice.json with a short sample; full narration comes after the lock.',['editorial-review'],
    {kind:'operator-task',reads:[`${D}/script.md`,'scripts/shared/voice-playlists.json'],
      writes:[`${P}/audio/**`,`${P}/voice-auditions/**`,`${X}/voice.json`,`${D}/voice-audition.md`],outputs:[`${X}/voice.json`,`${D}/voice-audition.md`],
      operations:profile==='kids'?['voice-audition']:['voice-audition','voice-clone']});
  add('visual-plan','visual-editor',profile==='kids'?'Kế hoạch footage':'Prompt từng cảnh',profile==='kids'?'Footage chuyển động liên tục cho từng cảnh; dùng lại asset phù hợp, thiếu thì handoff Gemini thủ công.':
    'Thông tin chốt (thời lượng ± dao động, định dạng, quy tắc) và prompt hình/animation cho từng cảnh; chủ thể không lộ mặt. Chưa làm ảnh. Không Gemini/Veo.',
    profile==='kids'?'Plan continuous true-motion footage per scene; reuse suitable assets and manual Gemini handoff.':
    'Locked specs (duration and tolerance, format, rules) and per-scene still/animation prompts; faceless subjects; no images yet; no Gemini/Veo.',['editorial-review'],
    {upstreamKind:'design',reads:[`${D}/script.md`,`${D}/brief.md`],writes:[`${D}/production-spec.md`,`${D}/image-prompts.md`]});
  gate('initial-lock','Chốt ban đầu','Bạn xem và chốt một lần: kịch bản, nhạc nền, giọng (đoạn mẫu), thông tin đã chốt, prompt từng cảnh. Sửa sau đó đi qua bản vá.',
    'User locks script, music, voice choice, specs and prompts once; later edits are patches.',['music','voice-audition','visual-plan']);
  add('narration','voice-editor','Lời đọc đầy đủ','Tạo giọng cho toàn bộ kịch bản đã chốt bằng giọng đã chọn; giữ take cũ, nghe lại thanh điệu.',
    'Narrate the locked script with the locked voice; keep previous takes.',['initial-lock'],
    {kind:'operator-task',reads:[`${D}/script.md`,`${X}/voice.json`],writes:[`${P}/audio/**`,`${P}/voice-auditions/**`],outputs:[],
      operations:profile==='kids'?['voice-audition']:['voice-audition','voice-clone']});
  add('visuals','visual-editor',profile==='kids'?'Footage':'Hình ảnh / animation',profile==='kids'?'Footage chuyển động theo kế hoạch đã chốt; thiếu thì báo, không thay bằng ảnh tĩnh.':
    'Làm ảnh/animation theo prompt đã chốt; đổi prompt thì tạo bản vá.',
    'Produce visuals from the locked prompts; prompt changes go through a patch.',['initial-lock'],
    {kind:'operator-task',reads:[`${D}/image-prompts.md`],writes:[`${P}/images/**`],outputs:[]});
  add('assembly','assembler','Dựng video','Dùng đường dẫn chuẩn và engine sẵn có; nhạc trim tự do, có ducking và fade theo cạnh clip. Không render cả video.',
    'Use canonical project paths, existing engines, editable music trim, ducking and edge fades; no full render.',['narration','visuals'],
    {upstreamKind:'implement',reads:[`${D}/**`,`${P}/**`,'src/shared/**'],writes:[`${S}/**`,`${X}/**`],
      outputs:[`${S}/Video.tsx`,`${S}/Thumbnail.tsx`,`${S}/captions.json`]});
  gate('scene-review','Duyệt từng cảnh','Cảnh nào xong thì có clip riêng (đã có giọng); bạn xem, bấm Đạt hoặc ghi chú chỗ chưa đạt.',
    'Per-scene review clips with notes; every scene must pass.',['assembly']);
  add('qa','verifier','Kiểm tra kỹ thuật','Kiểm tra riêng của tập, khớp phụ đề với giọng, typography, media. Đạt kỹ thuật không có nghĩa đã nghe duyệt.',
    'Project-specific checks, captions/voice alignment, typography and media availability; technical pass is not listening approval.',['assembly'],
    {kind:'check',upstreamKind:'test',reads:[`${S}/**`,`${X}/**`,`${D}/**`],writes:[`${D}/qa.json`],
      operations:['project-check','typecheck','projects-check']});
  add('metadata','publisher-assistant','Tiêu đề & mô tả','Soạn tiêu đề, mô tả, hashtag; ghi tên bài nhạc và tác giả.',
    'Draft title/description with music title AND artist; validate source and attribution.',['assembly'],
    {upstreamKind:'design',reads:[`${D}/**`,`${S}/music.json`],writes:[`${D}/description.md`]});
  gate('review-preview','Xem bản dựng','Bạn xem Studio và nghe thử; giữ nguyên chỉnh sửa trong Studio.',
    'Review Studio/audio manually; preserve edits.',['scene-review','qa','metadata']);
  gate('export','Xuất video','Render thủ công khi bạn yêu cầu rõ ràng; không tự đăng tải.',
    'Manual render only on explicit request; no automatic upload.',['review-preview']);
  const byId=Object.fromEntries(stages.map(s=>[s.id,s]));
  const ancestors=s=>[...new Set(s.dependencies.flatMap(d=>[d,...ancestors(byId[d])]))];
  for(const s of stages){
    s.invalidates=stages.filter(t=>ancestors(t).includes(s.id)).map(t=>t.id);
    if(s.kind==='human-approval') s.bindsArtifacts=[...new Set(ancestors(s).flatMap(a=>byId[a].outputs))];
  }
  return stages;
}
// Series-level view for the manager: same stages with a <slug> placeholder instead of a project.
function seriesWorkflow(root,seriesId){
  const series=load(root).series.find(s=>s.id===seriesId);
  if(!series) throw new Error('Series not found');
  const profile=profileFor(series),seriesDir=seriesDirOf(series),slugPath='<slug>';
  const paths={source:`src/projects/${slugPath}`,scripts:`scripts/projects/${slugPath}`,docs:`docs/projects/${slugPath}`,assets:`public/${slugPath}`};
  return {series:series.id,channel:series.channel,seriesDir,profile,stages:profile?buildStages(profile,seriesDir,paths):[]};
}

function plan(root, id) {
  if (!slug(id)) throw new Error('Invalid project slug');
  const matches = load(root).series.flatMap(series => series.projects.filter(p=>p.id===id).map(project=>({series,project})));
  if(matches.length!==1) throw new Error('Project must exist exactly once in canonical catalog');
  const {series,project}=matches[0];
  const profile=profileFor(series);
  if(!profile) throw new Error('This channel needs its own approved production workflow');
  const expected={source:`src/projects/${id}`,scripts:`scripts/projects/${id}`,docs:`docs/projects/${id}`,assets:`public/${id}`};
  for(const [key,value] of Object.entries(expected)) if(project.paths[key]!==value) throw new Error(`Unexpected canonical path: ${key}`);
  const seriesDir=seriesDirOf(series);
  const stages=buildStages(profile,seriesDir,expected);

  for(const s of stages){
    for(const p of [...s.readScope,...s.writeScope]) if(denied(p)) throw new Error(`Stage ${s.id} scope hits denied path: ${p}`);
    for(const p of s.writeScope) if(!Object.values(expected).some(base=>p===base||p.startsWith(base+'/')))
      throw new Error(`Stage ${s.id} writes outside canonical project paths: ${p}`);
  }
  let scripts={};
  try{scripts=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).scripts||{};}catch{}
  const operations={},gaps=[];
  for(const op of new Set(stages.flatMap(s=>s.operations))){
    const spec=policy.operations[op];
    if(!spec){operations[op]={operatorOnly:true,note:policy.operatorOnlyOperations[op]};continue;}
    const npmScript=spec.npmScript.replace('{projectId}',id);
    operations[op]={argv:['npm','run','--silent',npmScript],available:npmScript in scripts,writes:spec.writes,network:spec.network};
    if(!(npmScript in scripts)) gaps.push(`Missing npm script "${npmScript}" for operation ${op}; QA cannot be automated until it exists.`);
  }
  return {schemaVersion:2,mode:policy.mode,runtimeCompatible:false,projectId:id,channel:series.channel,series:series.id,profile,
    note:'Planning manifest only. No task or approval is executed. Existing catalog status does not imply approval.',
    paths:expected,deniedPaths:policy.deniedPaths,operations,gaps,policy,stages,
    seriesNotes:seriesNotes.read(root,series)};
}

function status(root,id){
  const p=plan(root,id);
  const inspect=rel=>{
    const file=path.join(root,rel);
    let st=null;try{st=fs.lstatSync(file);}catch{}
    if(!st||!st.isFile()) return {path:rel,exists:false};
    return {path:rel,exists:true,bytes:st.size,modifiedAt:st.mtime.toISOString(),
      sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')};
  };
  const countFiles=rel=>{
    try{return fs.readdirSync(path.join(root,rel),{recursive:true,withFileTypes:true})
      .filter(e=>e.isFile()&&!denied(path.relative(root,path.join(e.parentPath??e.path,e.name)).split(path.sep).join('/'))).length;}
    catch{return null;}
  };
  return {projectId:id,profile:p.profile,
    note:'Present artifacts are drafts or legacy files unless a gate below is approved.',
    gates:p.stages.filter(s=>s.kind==='human-approval'&&s.id!=='export').map(s=>{
      const g=approvals.gateState(root,p,s.id);
      return {id:s.id,state:g.state,changed:g.changed||[],approvedAt:g.entry?.approvedAt||null};
    }),
    runs:runner.list(root,id),
    gaps:p.gaps,
    assets:{images:countFiles(`${p.paths.assets}/images`),audio:countFiles(`${p.paths.assets}/audio`)},
    stages:p.stages.filter(s=>s.outputs.length).map(s=>({id:s.id,kind:s.kind,
      artifacts:s.outputs.filter(o=>!o.includes('*')).map(inspect)}))};
}

// Graphify code-only graph: cheap structural context for future workers; never a semantic/LLM pass.
function codeGraph(root){
  const file=path.join(root,'graphify-out/graph.json');
  let st=null;try{st=fs.statSync(file);}catch{}
  const builtAt=st?st.mtime:null,newer=[];
  if(builtAt) for(const dir of ['src','scripts','tools']){
    try{for(const e of fs.readdirSync(path.join(root,dir),{recursive:true,withFileTypes:true}))
      if(e.isFile()&&fs.statSync(path.join(e.parentPath??e.path,e.name)).mtime>builtAt) newer.push(dir);}catch{}
  }
  return {venv:fs.existsSync(path.join(root,'.venv-graph/bin/graphify')),graphFound:!!st,
    builtAt:builtAt&&builtAt.toISOString(),stale:builtAt?newer.length>0:null,
    refresh:'npm run graph:update (local AST only, no LLM)'};
}

function doctor(root) {
  const runtime=path.join(root,policy.runtime);
  let actualCommit=null;
  try{actualCommit=execFileSync('git',['-C',runtime,'rev-parse','HEAD'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{}
  const upstreamProbes=policy.upstreamProbes.map(({id,file,pattern,blocker})=>{
    let text=null;try{text=fs.readFileSync(path.join(runtime,file),'utf8');}catch{}
    return {id,file,blocker:policy.upstreamBlockers[blocker],
      stillPresent:text===null?null:new RegExp(pattern,'m').test(text)};
  });
  const bwrap=(process.env.PATH||'').split(path.delimiter).some(dir=>dir&&fs.existsSync(path.join(dir,'bwrap')));
  return {mode:policy.mode,executionReady:false,cloneFound:fs.existsSync(path.join(runtime,'main.py')),
    pinnedCommitMatches:actualCommit===policy.commit,actualCommit,expectedCommit:policy.commit,
    host:{bubblewrapInPath:bwrap,agentsVenv:fs.existsSync(path.join(root,'.venv-agents'))},
    upstreamProbes,blockers:policy.upstreamBlockers,
    codeGraph:codeGraph(root),
    runner:runner.runtimeCheck(root),
    checksPerformed:['clone presence','pinned revision','static source probes for known blockers','bubblewrap/.venv-agents presence','code graph age'],
    checksNotPerformed:['model inference','dependency installation','GPU benchmark','approval enforcement','sandbox behaviour']};
}
const USAGE=`Usage: npm run automation -- <command>
  doctor                              runtime, sandbox and graph readiness
  plan <slug>                         stage manifest (read-only)
  status <slug>                       artifacts, gates and runs (read-only)
  run <slug> <stage> [--revise] [--prepare-only] [--gpu|--local]
                                      draft one document with the local model in a staging copy
                                      (model on the GPU machine when it is on, else this laptop)
  runs [slug]                         list runs
  events <run-id> [--follow]          event timeline of a run
  apply <run-id>                      apply a finished run's patch (checks your edits first)
  reject <run-id> [note]              discard a run's patch
  approve <slug> review-preview [--allow-missing] [--note text]
                                      record your approval of the final preview by hash
                                      (initial lock, patches, scenes: in the manager)
  review <slug>                       initial lock, patches, scene clips and your notes (read-only)
  patch <slug> --reason text          propose the edits made since the latest lock as a patch
  scene-clip <slug> <scene>           render one finished scene as a review clip (projects/<slug>/review/)
  progress <slug>                     live task plan and status shown on the project's Tiến trình tab
  progress <slug> plan --file plan.json        agent's task plan after the lock ({summary, tasks:[{id,title,kind,weight,steps}]})
  progress <slug> start|update|done|fail|block <task> [--percent N|--steps 3/10] [--note text]
  progress <slug> log --note text [task]       add a line to the activity timeline
  Lock, patch decisions and scene reviews are yours: Duyệt sản xuất in the manager.`;

function printEvent(e){
  const d=Object.entries(e.data).filter(([,v])=>v!==''&&v!==null).map(([k,v])=>`${k}=${typeof v==='string'?v:JSON.stringify(v)}`).join(' ');
  console.log(`${e.timestamp.slice(11,19)}  ${e.source.padEnd(18)} ${e.type.padEnd(22)} ${d}`.trimEnd());
}
async function main(argv){
  const valued=['--note','--reason','--percent','--steps','--file'],flags=new Set(argv.filter(a=>a.startsWith('--')&&!valued.includes(a)));
  const machine={gpu:flags.has('--gpu'),local:flags.has('--local')};
  const valueOf=name=>{const at=argv.indexOf(name);return at>=0?argv[at+1]||'':'';};
  const note=valueOf('--note'),reason=valueOf('--reason'),hasFlag=name=>argv.includes(name);
  const args=argv.filter((a,i)=>!a.startsWith('--')&&!valued.includes(argv[i-1]));
  const [command,a,b,...extra]=args;
  const json=v=>console.log(JSON.stringify(v,null,2));
  switch(command){
    case 'doctor': return json(doctor(ROOT));
    case 'plan': if(!a)break; return json(plan(ROOT,a));
    case 'status': if(!a)break; return json(status(ROOT,a));
    case 'runs': return json(runner.list(ROOT,a||null));
    case 'events': {
      if(!a)break;
      let seen=0;
      for(;;){
        const all=runner.events(ROOT,a);all.slice(seen).forEach(printEvent);seen=all.length;
        const st=runner.readRun(ROOT,a).status;
        if(!flags.has('--follow')||!['prepared','running'].includes(st)){console.log(`status: ${st}`);return;}
        await new Promise(r=>setTimeout(r,1000));
      }
    }
    case 'run': {
      if(!a||!b)break;
      const run=runner.prepare(ROOT,a,b,{revise:flags.has('--revise')});
      console.log(`Prepared ${run.runId}: ${Object.keys(run.inputs).length} files copied to staging, writes ${run.writeScope.join(', ')}`);
      if(flags.has('--prepare-only')) return console.log(`Start later: npm run automation -- run-prepared ${run.runId}`);
      const done=await runner.execute(ROOT,run.runId,{machine});
      return finish(done);
    }
    case 'run-prepared': if(!a)break; return finish(await runner.execute(ROOT,a,{machine}));
    case 'apply': if(!a)break; {const r=runner.apply(ROOT,a);
      return console.log(`Applied ${r.appliedFiles.join(', ')}. This is not an approval; review the file, then:\n  npm run automation -- status ${r.projectId}`);}
    case 'reject': if(!a)break; return json(runner.reject(ROOT,a,[b,...extra].filter(Boolean).join(' ')));
    case 'review': if(!a)break; return json(review.summary(ROOT,plan(ROOT,a)));
    case 'patch': if(!a)break; return json(review.createPatch(ROOT,plan(ROOT,a),{reason,by:'agent (automation patch)'}));
    case 'scene-clip': {
      if(!a||!b)break;
      const p=plan(ROOT,a),scene=review.sceneDefs(ROOT,p).find(s=>s.id===b);
      if(!scene) throw new Error(`Unknown scene ${b}; scenes: ${review.sceneDefs(ROOT,p).map(s=>s.id).join(', ')||'none (add scripts/projects/<slug>/scenes.json)'}`);
      // The user allows rendering review clips of finished scenes (2026-10-31); full-video export stays manual.
      const rel=`projects/${a}/review/${b}-${new Date().toISOString().replace(/[-:]/g,'').slice(0,15)}.mp4`,task=`clip-${b}`;
      fs.mkdirSync(path.dirname(path.join(ROOT,rel)),{recursive:true});
      // Reported live on the project's Tiến trình tab; a killed render shows as interrupted (pid gone).
      progress.ensureTask(ROOT,a,{id:task,title:`Xuất clip duyệt cảnh ${scene.title}`,kind:'clip'});
      progress.update(ROOT,a,task,{status:'running',percent:0,note:rel,pid:process.pid});
      try{execFileSync(path.join(ROOT,'node_modules/.bin/remotion'),['render','src/index.tsx',scene.composition,rel,
        ...(scene.frames?[`--frames=${scene.frames[0]}-${scene.frames[1]}`]:[])],{cwd:ROOT,stdio:'inherit'});}
      catch(e){progress.update(ROOT,a,task,{status:'failed',note:`Render lỗi: ${e.message.split('\n')[0]}`});throw e;}
      const clip=review.addClip(ROOT,p,b,rel);progress.update(ROOT,a,task,{status:'done',note:'Clip sẵn sàng để bạn duyệt'});
      return json(clip);
    }
    case 'progress': {
      if(!a)break;
      const p=plan(ROOT,a),[task]=extra,percent=valueOf('--percent'),steps=valueOf('--steps');
      const changes={...(percent!==''&&hasFlag('--percent')?{percent:Number(percent)}:{}),
        ...(steps?(()=>{const m=steps.match(/^(\d+)\/(\d+)$/);if(!m)throw new Error('--steps dạng done/total, ví dụ 3/10');return {steps:{done:+m[1],total:+m[2]}};})():{}),
        ...(hasFlag('--note')?{note}:{})};
      if(!b)return json(progress.view(ROOT,a));
      if(b==='plan'){
        const r=review.summary(ROOT,p);if(!r.version)throw new Error('Chưa chốt ban đầu: kế hoạch thực hiện lập sau khi bạn chốt');
        const data=JSON.parse(fs.readFileSync(path.resolve(ROOT,valueOf('--file')||'-'),'utf8'));
        return json(progress.setPlan(ROOT,a,{tasks:data.tasks,summary:data.summary||'',by:'agent',lockVersion:r.version}));
      }
      if(b==='log'){progress.log(ROOT,a,note,task||null);return json(progress.view(ROOT,a).events[0]);}
      const status={start:'running',update:undefined,done:'done',fail:'failed',block:'blocked',reset:'pending'}[b];
      if(!(b in {start:1,update:1,done:1,fail:1,block:1,reset:1})||!task)break;
      return json(progress.update(ROOT,a,task,{...changes,...(status?{status}:{})}));
    }
    case 'approve': {
      if(!a||!b)break;
      const entry=approvals.approve(ROOT,plan(ROOT,a),b,{allowMissing:flags.has('--allow-missing'),note});
      return json(entry);
    }
  }
  throw new Error(USAGE);
}
function finish(run){
  console.log(`\nRun ${run.runId}: ${run.status}`);
  if(run.status==='awaiting-approval') console.log(`Review: ${run.patch}\nThen:   npm run automation -- apply ${run.runId}   (or reject ${run.runId})`);
  else console.log(`Log:    ${path.relative(ROOT,path.join(ROOT,policy.runner.runDirectory,run.runId,'log.txt'))}`);
  if(['failed','timed-out','interrupted'].includes(run.status)) process.exitCode=1;
}
// Export before main() runs: runner.cjs reads these through a lazy require.
module.exports={plan,status,doctor,denied,seriesWorkflow,profileFor};
if(require.main===module) main(process.argv.slice(2)).catch(e=>{console.error(e.message);process.exitCode=1;});
