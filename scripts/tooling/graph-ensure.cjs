#!/usr/bin/env node
// Keep the Graphify code graph fresh without anyone remembering to run graph:update.
//   node scripts/tooling/graph-ensure.cjs            rebuild now if src/scripts/tools changed since the graph
//   node scripts/tooling/graph-ensure.cjs --quiet    same, one short line only when it rebuilt (SessionStart hook)
//   ... --after-commit                               PostToolUse hook: reads the hook JSON on stdin and, only
//                                                    after a `git commit`, rebuilds in the background (non-blocking)
// Local AST only (`graphify update .`): no LLM, no network, no git hooks. A lock prevents parallel rebuilds.
const fs=require('node:fs'),path=require('node:path'),{spawn,spawnSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../..');
const BIN=path.join(ROOT,'.venv-graph/bin/graphify');
const LOCK=path.join(ROOT,'graphify-out/.ensure.lock');
const {codeGraph}=require('../../tools/production-automation/cli.cjs');

function locked(){try{const age=Date.now()-fs.statSync(LOCK).mtimeMs;if(age<5*60*1000)return true;fs.rmSync(LOCK,{force:true});}catch{}return false;}

function rebuild({background=false,quiet=false}={}){
  if(!fs.existsSync(BIN)){if(!quiet)console.log('Graphify chưa cài (.venv-graph); bỏ qua.');return 0;}
  if(locked()){if(!quiet)console.log('Đồ thị code đang được dựng ở tiến trình khác.');return 0;}
  fs.mkdirSync(path.dirname(LOCK),{recursive:true});fs.writeFileSync(LOCK,String(process.pid));
  if(background){
    // Detached shell removes the lock when graphify finishes, so the hook returns immediately.
    const child=spawn('sh',['-c',`"${BIN}" update . >/dev/null 2>&1; rm -f "${LOCK}"`],{cwd:ROOT,detached:true,stdio:'ignore'});
    child.unref();return 0;
  }
  try{
    const r=spawnSync(BIN,['update','.'],{cwd:ROOT,encoding:'utf8',timeout:120000});
    if(r.status!==0){console.error('Dựng đồ thị code thất bại: '+(r.stderr||r.error?.message||'').trim().split('\n').pop());return 1;}
    console.log('Đã cập nhật đồ thị code (graphify, AST cục bộ).');return 0;
  }finally{fs.rmSync(LOCK,{force:true});}
}

function main(args){
  const quiet=args.includes('--quiet');
  if(args.includes('--after-commit')){
    let input='';try{input=fs.readFileSync(0,'utf8');}catch{}
    let command='';try{command=JSON.parse(input).tool_input?.command||'';}catch{}
    if(!/\bgit\b[^\n]*\bcommit\b/.test(command))return 0;
    return rebuild({background:true,quiet:true});
  }
  const g=codeGraph(ROOT);
  if(g.graphFound&&!g.stale){if(!quiet)console.log(`Đồ thị code còn mới (dựng ${g.builtAt}).`);return 0;}
  return rebuild({quiet});
}
if(require.main===module)process.exitCode=main(process.argv.slice(2));
module.exports={main};
