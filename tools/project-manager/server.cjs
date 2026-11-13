const http=require('node:http');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFile}=require('node:child_process');
const {ROOT,load}=require('../../scripts/catalog/catalog.cjs');
const {createStore}=require('./store.cjs');
const {sendJson}=require('./http-response.cjs');
const {handlePost}=require('./post-routes.cjs');
const {handleGet}=require('./get-routes.cjs');

const WEB=path.join(__dirname,'web');

function createManager({root=ROOT,ensureStudio=null,ensureVoiceStudio=null,voiceStudio=null,backupPanel=null,loudnessPanel=null,openFolder=directory=>new Promise((resolve,reject)=>execFile('xdg-open',[directory],{timeout:10000},error=>error?reject(error):resolve()))}={}) {
  const startStudio=ensureStudio||require('./studio.cjs').studioLauncher(root);
  const voice=require('../voicestudio/launcher.cjs');
  const startVoiceStudio=ensureVoiceStudio||voice.voiceStudioLauncher(root);
  const voiceControl=voiceStudio||{status:()=>voice.status(root),stop:()=>voice.stop(root)};
  const backup=backupPanel||require('./backup.cjs').createBackupPanel(root);
  const findProject=id=>load(root).series.flatMap(series=>series.projects).find(project=>project.id===id);
  const thumbnails=require('./thumbnails.cjs').createThumbnails(root,{catalog:findProject});
  const loudness=loudnessPanel||require('./loudness.cjs').createLoudness(root,{catalog:findProject});
  const looks=require('./looks.cjs').createLooks(root);
  const store=createStore(root);
  const token=crypto.randomBytes(32).toString('hex');
  const live=require('./live.cjs').createLive(root);
  const dependencies={root,web:WEB,token,store,startStudio,startVoiceStudio,voiceControl,backup,thumbnails,loudness,looks,openFolder,live};

  const server=http.createServer(async(req,res)=>{
    const authority=`127.0.0.1:${server.address().port}`;
    const allowedHosts=[authority,`localhost:${server.address().port}`];
    const allowedOrigins=allowedHosts.map(host=>`http://${host}`);
    const send=(status,value)=>sendJson(res,status,value);
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'");
    res.setHeader('Cache-Control','no-store');

    try {
      if(!allowedHosts.includes(req.headers.host))return send(403,{error:'Local host required'});
      if(req.headers.origin&&!allowedOrigins.includes(req.headers.origin))return send(403,{error:'Origin not allowed'});
      if(req.headers['sec-fetch-site']==='cross-site')return send(403,{error:'Cross-site request rejected'});
      const url=new URL(req.url,`http://${authority}`);
      const route=url.pathname;
      if(req.method==='POST') {
        if(req.headers['x-workspace-token']!==token||!req.headers.origin||!allowedOrigins.includes(req.headers.origin))return send(403,{error:'Refresh the workspace and try again'});
        return await handlePost({req,res,url,route,send,...dependencies});
      }
      if(req.method!=='GET')return send(405,{error:'Method not allowed'});
      return await handleGet({req,res,url,route,send,...dependencies});
    } catch(error) {
      if(!res.headersSent)send(error.status||400,{error:error.message});
      else res.destroy();
    }
  });
  const close=server.close.bind(server);
  server.close=callback=>{live.close();return close(callback);};
  return server;
}

if(require.main===module) {
  const port=Number(process.env.PROJECT_MANAGER_PORT||4310);
  if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid PROJECT_MANAGER_PORT');
  const server=createManager();
  server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`Cổng ${port} đang được dùng. Mở http://127.0.0.1:${port} hoặc đổi PROJECT_MANAGER_PORT.`:error.message);process.exitCode=1;});
  server.listen(port,'127.0.0.1',()=>console.log(`\n  Studio Workspace\n  Local: http://127.0.0.1:${port}\n  Dữ liệu đọc trực tiếp từ dự án trên máy. Ctrl+C để dừng.\n`));
}

module.exports={createManager};
