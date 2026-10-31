const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFile}=require('node:child_process');
const {ROOT}=require('../../scripts/catalog/catalog.cjs');
const {createStore}=require('./store.cjs');

const WEB=path.join(__dirname,'web');
const {VIDEO_FORMATS}=require('./video-formats.cjs');
const contentTypes={...Object.fromEntries(Object.entries(VIDEO_FORMATS).map(([e,f])=>[e,f.type])),'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
  '.mp4':'video/mp4','.webm':'video/webm','.wav':'audio/wav','.mp3':'audio/mpeg','.m4a':'audio/mp4','.ogg':'audio/ogg','.flac':'audio/flac','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ttf':'font/ttf','.svg':'image/svg+xml'};

function createManager({root=ROOT,ensureStudio=null,ensureVoiceStudio=null,voiceStudio=null,openFolder=directory=>new Promise((resolve,reject)=>execFile('xdg-open',[directory],{timeout:10000},error=>error?reject(error):resolve()))}={}) {
  const startStudio=ensureStudio||require('./studio.cjs').studioLauncher(root);
  const voice=require('../voicestudio/launcher.cjs');
  const startVoiceStudio=ensureVoiceStudio||voice.voiceStudioLauncher(root);
  // Status/stop are injectable so tests never touch a real VoiceStudio.
  const voiceControl=voiceStudio||{status:()=>voice.status(root),stop:()=>voice.stop(root)};
  const store=createStore(root),token=crypto.randomBytes(32).toString('hex'),live=require('./live.cjs').createLive(root);
  const server=http.createServer(async(req,res)=>{
    const authority=`127.0.0.1:${server.address().port}`;
    const allowedHosts=[authority,`localhost:${server.address().port}`];
    const allowedOrigins=allowedHosts.map(h=>`http://${h}`);
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'");
    res.setHeader('Cache-Control','no-store');
    const send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
    // Video/audio with seek ranges so the native players can scrub without loading whole files.
    const serveRange=file=>{const size=fs.statSync(file).size;res.setHeader('Accept-Ranges','bytes');res.setHeader('Content-Type',contentTypes[path.extname(file).toLowerCase()]);const range=req.headers.range;if(range){const m=range.match(/^bytes=(\d*)-(\d*)$/);let start=m&&m[1]?Number(m[1]):0,end=m&&m[2]?Number(m[2]):size-1;if(m&&!m[1]&&m[2]){start=Math.max(0,size-Number(m[2]));end=size-1;}if(!m||start>end||start>=size){res.writeHead(416,{'Content-Range':`bytes */${size}`});return res.end();}end=Math.min(end,size-1);res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});fs.createReadStream(file,{start,end}).on('error',()=>res.destroy()).pipe(res);return;}res.setHeader('Content-Length',size);res.writeHead(200);fs.createReadStream(file).on('error',()=>res.destroy()).pipe(res);};
    try {
      if (!allowedHosts.includes(req.headers.host)) return send(403,{error:'Local host required'});
      if (req.headers.origin&&!allowedOrigins.includes(req.headers.origin)) return send(403,{error:'Origin not allowed'});
      if (req.headers['sec-fetch-site']==='cross-site') return send(403,{error:'Cross-site request rejected'});
      const url=new URL(req.url,`http://${authority}`),route=url.pathname;
      if (req.method==='POST') {
        if (req.headers['x-workspace-token']!==token || !req.headers.origin || !allowedOrigins.includes(req.headers.origin)) return send(403,{error:'Refresh the workspace and try again'});
        if(route==='/api/book-cover')return send(201,await store.uploadCover(url.searchParams.get('series'),url.searchParams.get('book'),req));
        if(route==='/api/voice-reference'){if(req.headers['content-type']!=='application/octet-stream')return send(415,{error:'Audio file required'});const q=url.searchParams;return send(201,await store.addVoiceReference({name:q.get('name'),speaker:q.get('speaker'),consent:q.get('consent'),title:q.get('title')},req));}
        if(route==='/api/library-audio'){if(req.headers['content-type']!=='application/octet-stream')return send(415,{error:'Audio file required'});const q=url.searchParams;return send(201,await store.addAudio({kind:q.get('kind'),name:q.get('name'),title:q.get('title'),artists:q.get('artists')},req));}
        if(route==='/api/book-source'){if(req.headers['content-type']!=='application/pdf')return send(415,{error:'PDF required'});return send(201,await store.upload(url.searchParams.get('series'),url.searchParams.get('book'),url.searchParams.get('name'),req));}
        if(route==='/api/projects/import'){if(req.headers['content-type']!=='application/octet-stream')return send(415,{error:'Video file required'});const q=url.searchParams;return send(201,await store.createWithVideo({series:q.get('series'),id:q.get('id'),title:q.get('title'),format:q.get('format'),duration:q.get('duration')||'',book:q.get('book')||''},q.get('name'),req));}
        if (!req.headers['content-type']?.startsWith('application/json')) return send(415,{error:'JSON required'});
        let bytes=0,chunks=[];
        for await(const chunk of req) {bytes+=chunk.length;if(bytes>100000){send(413,{error:'Request too large'});return;}chunks.push(chunk);}
        let body;try {body=JSON.parse(Buffer.concat(chunks).toString());}catch{return send(400,{error:'Invalid JSON'});}
        if(route==='/api/studio'){const p=store.detail(body.id);if(!p.registrations.some(r=>r.id===body.composition))throw Error('Composition not found');await startStudio();return send(200,{url:'http://localhost:3000/'+encodeURIComponent(body.composition)});}
        if(route==='/api/voicestudio')return send(200,await startVoiceStudio());
        if(route==='/api/voicestudio/stop')return send(200,await voiceControl.stop());
        if(route==='/api/books')return send(201,store.newBook(body));
        if(route==='/api/approve')return send(200,store.approveGate(body));
        if(route==='/api/review/lock')return send(200,store.lockProject(body));
        if(route==='/api/review/patch')return send(200,store.decidePatch(body));
        if(route==='/api/review/scene')return send(200,store.reviewScene(body));
        if(route==='/api/review/note')return send(200,store.reviewNote(body));
        if(route==='/api/voice-reference-clip')return send(201,await store.cutVoiceReference(body));
        if(route==='/api/voice-reference-meta')return send(200,store.updateVoiceReference(body));
        if(route==='/api/book-meta')return send(200,store.updateBook(body));
        if(route==='/api/audio-meta')return send(200,store.updateAudioMeta(body));
        if(route==='/api/delete-preview')return send(200,store.deletion(body.kind,body.id));
        if(route==='/api/delete')return send(200,store.remove(body));
        if (route==='/api/projects') return send(201,store.create(body));
        if (route==='/api/notes') return send(200,store.saveNotes(body.id,body.text,body.revision));
        if (route==='/api/workflow') return send(200,store.saveWorkflow(body));
        if (route==='/api/voice-playlist') return send(200,store.savePlaylist(body));
        if (route==='/api/open-folder') {await openFolder(store.folder(body.id,body.group));return send(200,{opened:true});}
        return send(404,{error:'Unknown action'});
      }
      if(req.method!=='GET')return send(405,{error:'Method not allowed'});
      if(route==='/api/workspace')return send(200,{...store.list(),token,videoFormats:{extensions:Object.keys(VIDEO_FORMATS),label:require('./video-formats.cjs').videoLabel}});
      if(route==='/api/project')return send(200,store.detail(url.searchParams.get('id')));
      if(route==='/api/workflow')return send(200,store.workflow(url.searchParams.get('series')));
      if(route==='/api/voicestudio')return send(200,await voiceControl.status());
      if(route==='/api/voices')return send(200,store.voices());
      if(route==='/api/music')return send(200,store.music());
      if(route==='/api/voice-references')return send(200,store.voiceReferences());
      if(route==='/api/approvals')return send(200,store.reviewView(url.searchParams.get('id')));
      if(route==='/api/progress')return send(200,store.progressView(url.searchParams.get('id')));
      if(route==='/api/events')return live.subscribe(req,res);
      if(route==='/api/review-detail')return send(200,store.reviewDetail(url.searchParams.get('id'),url.searchParams.get('mode'),url.searchParams.get('patch')));
      if(route==='/api/approval-review')return send(200,store.gateReview(url.searchParams.get('id'),url.searchParams.get('gate')));
      if(route==='/api/document')return send(200,store.document(url.searchParams.get('id'),url.searchParams.get('file')));
      if(route==='/api/book-document')return send(200,store.bookDocument(url.searchParams.get('series'),url.searchParams.get('book'),url.searchParams.get('file')));
      let file;
      if(route==='/api/book-cover'){const cover=store.bookCover(url.searchParams.get('series'),url.searchParams.get('book'));if(!cover)return send(404,{error:'Chưa có ảnh bìa'});file=cover.file;
      } else if(route==='/api/review/media'){const file=store.reviewMedia(url.searchParams.get('id'),url.searchParams.get('kind'),url.searchParams.get('key'));if(!file||!fs.existsSync(file))return send(404,{error:'Không có file này'});return serveRange(file);
      } else if(route==='/api/project-media'){const file=store.projectMedia(url.searchParams.get('id'),url.searchParams.get('kind'),url.searchParams.get('file'));if(!file)return send(404,{error:'Không có file này'});return serveRange(file);
      } else if(route==='/api/playback'){const state=store.videoPlayback(url.searchParams.get('id'));if(!state)return send(404,{error:'Chưa có video'});return send(200,{ready:Boolean(state.file),preparing:Boolean(state.preparing),failed:Boolean(state.failed),converted:Boolean(state.converted),codec:state.codec||null});
      } else if(route==='/api/media'&&url.searchParams.get('kind')==='video'){const state=store.videoPlayback(url.searchParams.get('id'));if(!state?.file)return send(state?202:404,{error:state?'Đang chuẩn bị bản xem':'Chưa có bản xuất'});return serveRange(state.file);
      } else if(route==='/api/media'){const item=store.media(url.searchParams.get('id'),url.searchParams.get('kind'));if(!item)return send(404,{error:'Chưa có bản xuất'});return serveRange(item.file);
      } else if(route==='/api/audio'){const audio=store.referenceAudio(url.searchParams.get('kind'),url.searchParams.get('key'))||store.audio(url.searchParams.get('kind'),url.searchParams.get('key'));if(!audio)return send(404,{error:'Không có file âm thanh này'});return serveRange(audio);
      } else if(route.startsWith('/api/preview/')) {
        const preview=store.preview(decodeURIComponent(route.slice('/api/preview/'.length)));
        if(!preview)return send(404,{error:'No existing preview image'});
        file=preview.file;
        const stat=fs.statSync(file),etag=`"${stat.size}-${stat.mtimeMs}"`;
        res.setHeader('Cache-Control','private, max-age=300');res.setHeader('ETag',etag);
        if(req.headers['if-none-match']===etag){res.writeHead(304);return res.end();}
      } else if(route==='/font/regular.ttf'||route==='/font/bold.ttf') {
        file=path.join(root,'public/stoic/fonts',route.includes('bold')?'NotoSans-Bold.ttf':'NotoSans-Regular.ttf');
      } else {
        const files={'/':'index.html','/app.js':'app.js','/styles.css':'styles.css','/icon.svg':'icon.svg'};
        if(!files[route])return send(404,{error:'Not found'});
        file=path.join(WEB,files[route]);
      }
      if(!fs.existsSync(file))return send(404,{error:'File not found'});
      res.writeHead(200,{'Content-Type':contentTypes[path.extname(file)]||'application/octet-stream'});
      const stream=fs.createReadStream(file);stream.on('error',()=>res.destroy());stream.pipe(res);
    }catch(error){if(!res.headersSent)send(error.status||400,{error:error.message});else res.destroy();}
  });
  // Open event streams would otherwise keep close() waiting.
  const close=server.close.bind(server);server.close=cb=>{live.close();return close(cb);};
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
