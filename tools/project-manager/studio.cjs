const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process');
function studioLauncher(root){
  let starting=null;
  async function probe(){return new Promise(resolve=>{const req=http.get('http://127.0.0.1:3000',res=>{let text='';res.on('data',c=>{if(text.length<200000)text+=c;});res.on('end',()=>resolve(/remotion/i.test(text)?'ready':'occupied'));});req.setTimeout(1200,()=>req.destroy());req.on('error',()=>resolve('off'));});}
  return async function ensure(){
    if(starting)return starting;
    starting=(async()=>{const status=await probe();if(status==='ready')return;if(status==='occupied')throw Error('Cổng 3000 đang chạy ứng dụng khác. Hãy giải phóng cổng trước khi mở Studio.');
      const logDir=path.join(root,'.cache/project-manager');fs.mkdirSync(logDir,{recursive:true});const log=fs.openSync(path.join(logDir,'studio.log'),'a');
      const child=spawn(process.execPath,[path.join(root,'node_modules/@remotion/cli/remotion-cli.js'),'studio','src/index.tsx','--port=3000','--no-open'],{cwd:root,detached:true,stdio:['ignore',log,log]});fs.closeSync(log);let failure;child.on('error',e=>failure=e);child.unref();
      for(let i=0;i<90;i++){if(failure)throw failure;await new Promise(r=>setTimeout(r,500));if(await probe()==='ready')return;}
      throw Error('Studio chưa sẵn sàng. Xem .cache/project-manager/studio.log rồi thử lại.');
    })();try{await starting;return {ready:true};}finally{starting=null;}
  };
}
module.exports={studioLauncher};
