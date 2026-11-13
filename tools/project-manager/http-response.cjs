const fs=require('node:fs');
const path=require('node:path');
const {VIDEO_FORMATS}=require('./video-formats.cjs');

const contentTypes={...Object.fromEntries(Object.entries(VIDEO_FORMATS).map(([extension,format])=>[extension,format.type])),
  '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
  '.mp4':'video/mp4','.webm':'video/webm','.wav':'audio/wav','.mp3':'audio/mpeg','.m4a':'audio/mp4','.ogg':'audio/ogg','.flac':'audio/flac',
  '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ttf':'font/ttf','.svg':'image/svg+xml'};

function sendJson(res,status,value) {
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});
  res.end(JSON.stringify(value));
}

function serveRange(req,res,file) {
  const size=fs.statSync(file).size;
  res.setHeader('Accept-Ranges','bytes');
  res.setHeader('Content-Type',contentTypes[path.extname(file).toLowerCase()]);
  const range=req.headers.range;
  if(range) {
    const match=range.match(/^bytes=(\d*)-(\d*)$/);
    let start=match&&match[1]?Number(match[1]):0;
    let end=match&&match[2]?Number(match[2]):size-1;
    if(match&&!match[1]&&match[2]) {
      start=Math.max(0,size-Number(match[2]));
      end=size-1;
    }
    if(!match||start>end||start>=size) {
      res.writeHead(416,{'Content-Range':`bytes */${size}`});
      return res.end();
    }
    end=Math.min(end,size-1);
    res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});
    fs.createReadStream(file,{start,end}).on('error',()=>res.destroy()).pipe(res);
    return;
  }
  res.setHeader('Content-Length',size);
  res.writeHead(200);
  fs.createReadStream(file).on('error',()=>res.destroy()).pipe(res);
}

function serveFile(res,file,type=contentTypes[path.extname(file)]||'application/octet-stream') {
  res.writeHead(200,{'Content-Type':type});
  const stream=fs.createReadStream(file);
  stream.on('error',()=>res.destroy());
  stream.pipe(res);
}

module.exports={contentTypes,sendJson,serveRange,serveFile};
