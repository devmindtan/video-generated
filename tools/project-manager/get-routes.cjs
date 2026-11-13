const fs=require('node:fs');
const path=require('node:path');
const {VIDEO_FORMATS,videoLabel}=require('./video-formats.cjs');
const {contentTypes,serveFile,serveRange}=require('./http-response.cjs');

async function handleGet({req,res,url,route,send,root,web,token,store,voiceControl,backup,thumbnails,loudness,looks,live}) {
  if(route==='/api/workspace')return send(200,{...store.list(),token,videoFormats:{extensions:Object.keys(VIDEO_FORMATS),label:videoLabel}});
  if(route==='/api/project')return send(200,store.detail(url.searchParams.get('id')));
  if(route==='/api/thumbnails')return send(200,thumbnails.list(url.searchParams.get('id')||''));
  if(route.startsWith('/thumb/')||route.startsWith('/public/')) {
    const hit=thumbnails.resolve(route);
    if(!hit)return send(404,{error:'Not found'});
    res.setHeader('Content-Security-Policy',hit.csp);
    return serveFile(res,hit.file,hit.type);
  }
  if(route==='/api/loudness')return send(200,loudness.status(url.searchParams.get('id')||''));
  if(route==='/api/workflow')return send(200,store.workflow(url.searchParams.get('series')));
  if(route==='/api/channel-profile')return send(200,store.channelProfile(url.searchParams.get('channel')));
  if(route==='/api/voicestudio')return send(200,await voiceControl.status());
  if(route==='/api/backup')return send(200,backup.overview());
  if(route==='/api/backup/summary')return send(200,backup.summary());
  if(route==='/api/backup/pending')return send(200,backup.pendingFiles(url.searchParams.get('source'),url.searchParams.get('limit')));
  if(route==='/api/looks')return send(200,looks.looks());
  if(route==='/api/looks/series-revision')return send(200,looks.seriesRevision(url.searchParams.get('id')));
  if(route==='/api/voices')return send(200,store.voices());
  if(route==='/api/system')return send(200,require('./system-map.cjs').systemMap(root));
  if(route==='/api/music')return send(200,store.music());
  if(route==='/api/voice-references')return send(200,store.voiceReferences());
  if(route==='/api/approvals')return send(200,store.reviewView(url.searchParams.get('id')));
  if(route==='/api/progress')return send(200,store.progressView(url.searchParams.get('id')));
  if(route==='/api/events')return live.subscribe(req,res);
  if(route==='/api/review-detail')return send(200,store.reviewDetail(url.searchParams.get('id'),url.searchParams.get('mode'),url.searchParams.get('patch')));
  if(route==='/api/approval-review')return send(200,store.gateReview(url.searchParams.get('id'),url.searchParams.get('gate')));
  if(route==='/api/document')return send(200,store.document(url.searchParams.get('id'),url.searchParams.get('file')));
  if(route==='/api/book-skills')return send(200,store.bookSkills(url.searchParams.get('series'),url.searchParams.get('book')));
  if(route==='/api/book-skill-file')return send(200,store.bookSkillFile(url.searchParams.get('series'),url.searchParams.get('book'),url.searchParams.get('skill'),url.searchParams.get('file')));
  if(route==='/api/book-document')return send(200,store.bookDocument(url.searchParams.get('series'),url.searchParams.get('book'),url.searchParams.get('file')));

  let file;
  if(route==='/api/book-cover') {
    const cover=store.bookCover(url.searchParams.get('series'),url.searchParams.get('book'));
    if(!cover)return send(404,{error:'Chưa có ảnh bìa'});
    file=cover.file;
  } else if(route==='/api/channel-image') {
    file=store.channelImage(url.searchParams.get('channel'),url.searchParams.get('file'));
    if(!file)return send(404,{error:'Chưa có ảnh này'});
    res.setHeader('Cache-Control','private, max-age=31536000, immutable');
  } else if(route==='/api/review/media') {
    const media=store.reviewMedia(url.searchParams.get('id'),url.searchParams.get('kind'),url.searchParams.get('key'));
    if(!media||!fs.existsSync(media))return send(404,{error:'Không có file này'});
    return serveRange(req,res,media);
  } else if(route==='/api/project-media') {
    const media=store.projectMedia(url.searchParams.get('id'),url.searchParams.get('kind'),url.searchParams.get('file'));
    if(!media)return send(404,{error:'Không có file này'});
    return serveRange(req,res,media);
  } else if(route==='/api/playback') {
    const state=store.videoPlayback(url.searchParams.get('id'));
    if(!state)return send(404,{error:'Chưa có video'});
    return send(200,{ready:Boolean(state.file),preparing:Boolean(state.preparing),failed:Boolean(state.failed),converted:Boolean(state.converted),codec:state.codec||null});
  } else if(route==='/api/media'&&url.searchParams.get('kind')==='video') {
    const state=store.videoPlayback(url.searchParams.get('id'),url.searchParams.get('file')||'');
    if(!state?.file)return send(state?202:404,{error:state?'Đang chuẩn bị bản xem':'Chưa có bản xuất'});
    return serveRange(req,res,state.file);
  } else if(route==='/api/media') {
    const item=store.mediaFile(url.searchParams.get('id'),url.searchParams.get('kind'),url.searchParams.get('file')||'');
    if(!item)return send(404,{error:'Chưa có bản xuất'});
    return serveRange(req,res,item.file);
  } else if(route==='/api/audio') {
    const audio=store.referenceAudio(url.searchParams.get('kind'),url.searchParams.get('key'))||store.audio(url.searchParams.get('kind'),url.searchParams.get('key'));
    if(!audio)return send(404,{error:'Không có file âm thanh này'});
    return serveRange(req,res,audio);
  } else if(route.startsWith('/api/preview/')) {
    const preview=store.preview(decodeURIComponent(route.slice('/api/preview/'.length)));
    if(!preview)return send(404,{error:'No existing preview image'});
    file=preview.file;
    const stat=fs.statSync(file);
    const etag=`"${stat.size}-${stat.mtimeMs}"`;
    res.setHeader('Cache-Control','private, max-age=300');
    res.setHeader('ETag',etag);
    if(req.headers['if-none-match']===etag) {
      res.writeHead(304);
      return res.end();
    }
  } else if(route==='/font/regular.ttf'||route==='/font/bold.ttf') {
    file=path.join(root,'public/stoic/fonts',route.includes('bold')?'NotoSans-Bold.ttf':'NotoSans-Regular.ttf');
  } else {
    const files={'/':'index.html','/app.js':'app.js','/looks.js':'looks.js','/styles.css':'styles.css','/icon.svg':'icon.svg'};
    if(!files[route])return send(404,{error:'Not found'});
    file=path.join(web,files[route]);
  }
  if(!fs.existsSync(file))return send(404,{error:'File not found'});
  return serveFile(res,file,contentTypes[path.extname(file)]||'application/octet-stream');
}

module.exports={handleGet};
