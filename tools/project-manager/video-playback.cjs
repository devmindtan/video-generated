// Browser copy of a customer's original video when Chrome cannot decode it (HEVC/ProRes MOV…).
// The imported file is never touched; the H.264 copy is cached under ignored .cache/.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync,spawn}=require('node:child_process');

const BIN=path.join(__dirname,'../../node_modules/@remotion/compositor-linux-x64-gnu');
const BROWSER_CODECS=new Set(['h264','vp8','vp9','av1']);

function createPlayback(root,{bin=BIN}={}) {
  const cache=path.join(root,'.cache/manager-playback'),running=new Map(),codecs=new Map();
  function codec(video,stat) {
    const key=`${video}|${stat.size}|${stat.mtimeMs}`;
    if(!codecs.has(key)) {
      try {codecs.set(key,execFileSync(path.join(bin,'ffprobe'),['-v','error','-select_streams','v:0','-show_entries','stream=codec_name','-of','csv=p=0',video],{timeout:10000,encoding:'utf8'}).trim());}
      catch {codecs.set(key,'');}
    }
    return codecs.get(key);
  }
  // {file} to serve now, {preparing:true} while the copy is made, {failed:true} if it cannot be made.
  function playable(video) {
    const stat=fs.statSync(video),name=codec(video,stat);
    if(!name||BROWSER_CODECS.has(name))return {file:video,converted:false}; // unknown codec: serve as before
    const key=crypto.createHash('sha256').update(`${fs.realpathSync(video)}|${stat.size}|${stat.mtimeMs}`).digest('hex').slice(0,32);
    const file=path.join(cache,key+'.mp4');
    if(fs.existsSync(file))return {file,converted:true,codec:name};
    if(running.get(key)==='failed')return {failed:true,codec:name};
    if(!running.has(key)) {
      fs.mkdirSync(cache,{recursive:true});
      const temp=path.join(cache,`${key}.${process.pid}.tmp.mp4`);
      const job=spawn(path.join(bin,'ffmpeg'),['-v','error','-y','-i',video,'-map','0:v:0','-map','0:a:0?','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart',temp],{stdio:'ignore'});
      running.set(key,'running');
      job.on('error',()=>{running.set(key,'failed');fs.rmSync(temp,{force:true});});
      job.on('exit',code=>{
        if(code===0&&fs.existsSync(temp)&&fs.statSync(temp).size){fs.renameSync(temp,file);running.delete(key);}
        else {running.set(key,'failed');fs.rmSync(temp,{force:true});}
      });
    }
    return {preparing:true,codec:name};
  }
  return {playable};
}

module.exports={createPlayback};
