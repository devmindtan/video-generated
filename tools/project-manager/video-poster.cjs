// Card fallback for projects without a thumbnail: one cached frame from the project's own video.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');

const BIN=path.join(__dirname,'../../node_modules/@remotion/compositor-linux-x64-gnu');
const POSITIONS=[.35,.2,.5,.65]; // first is preferred: past intro fades/black openings, early in the story

function createPosters(root,{bin=BIN}={}) {
  const cache=path.join(root,'.cache/manager-posters');
  function duration(video) {
    try {return Number(execFileSync(path.join(bin,'ffprobe'),['-v','error','-show_entries','format=duration','-of','csv=p=0',video],{timeout:10000,encoding:'utf8'}).trim())||0;} catch {return 0;}
  }
  function posterFor(video) {
    const stat=fs.statSync(video);
    const key=crypto.createHash('sha256').update(`${fs.realpathSync(video)}|${stat.size}|${stat.mtimeMs}|${POSITIONS}`).digest('hex').slice(0,32);
    const file=path.join(cache,key+'.jpg');
    if(fs.existsSync(file))return file;
    fs.mkdirSync(cache,{recursive:true});
    const length=duration(video),candidates=POSITIONS.map((_,i)=>path.join(cache,`${key}.${process.pid}.${i}.tmp.jpg`));
    try {
      for(const [i,at] of POSITIONS.entries()) {
        try {execFileSync(path.join(bin,'ffmpeg'),['-v','error','-y','-ss',(length*at).toFixed(2),'-i',video,'-frames:v','1','-vf','scale=540:-2','-q:v','4',candidates[i]],{timeout:30000,stdio:'ignore'});} catch {}
      }
      // At equal quality a larger JPEG holds more detail: replace the preferred frame only when it is clearly blurred, dark or flat.
      const size=f=>fs.existsSync(f)?fs.statSync(f).size:0,sharpest=[...candidates].sort((a,b)=>size(b)-size(a))[0];
      const best=size(candidates[0])>=.6*size(sharpest)?candidates[0]:sharpest;
      if(!size(best))return null;
      fs.renameSync(best,file);
      return file;
    } finally {for(const f of candidates)fs.rmSync(f,{force:true});}
  }
  return {posterFor};
}

module.exports={createPosters};
