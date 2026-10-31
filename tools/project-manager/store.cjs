const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {load, registrations, validate, slug, inside} = require('../../scripts/catalog/catalog.cjs');
const {createProject} = require('../../scripts/catalog/projects.cjs');

const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const exists = file => fs.existsSync(file);
const textTypes = new Set(['.md','.txt','.json','.tsx','.ts','.py','.cjs','.mjs']);
const imageTypes = new Set(['.png','.jpg','.jpeg','.webp']);
const posterVideoTypes = new Set(['.mp4','.webm','.mov','.mkv','.m4v']);
const contentChannels = new Set(['tam-ly-cuoc-song','kids']);
const videoTypes = new Set(['.mp4','.webm']);

function secureFile(root, file, extensions = textTypes) {
  const base = fs.realpathSync(root), real = fs.realpathSync(file);
  if (!real.startsWith(base + path.sep) || !fs.statSync(real).isFile() || !extensions.has(path.extname(real).toLowerCase())) throw new Error('File is not available');
  return real;
}
function checkedId(value) {
  if (!slug(value)) throw new Error('Invalid identifier');
  return value;
}
function createStore(root) {
  const workspaceRoot=fs.realpathSync(root);
  const extra={...require('./features.cjs').features(root),...require('./workflow.cjs').createWorkflow(root),...require('./library.cjs').createLibrary(root),...require('./voice-references.cjs').createVoiceReferences(root)};
  const posters=require('./video-poster.cjs').createPosters(root);
  function location(relative) {
    const target=inside(root,relative);
    if (exists(target)&&!fs.realpathSync(target).startsWith(workspaceRoot+path.sep)) throw new Error('Folder escapes workspace');
    return target;
  }
  function context(id) {
    checkedId(id);
    const catalog = load(root);
    for (const series of catalog.series) {
      const project = series.projects.find(p => p.id === id);
      if (project) return {catalog, series, project};
    }
    throw new Error('Project not found');
  }
  function documents(project) {
    const result = [];
    const labels = {'script.md':'Kịch bản','description.md':'Tiêu đề & mô tả','production-spec.md':'Ghi chú dựng',
      'brief.md':'Đề bài','manager-notes.md':'Ghi chú của bạn','imported-video.json':'Video đã import','qa.json':'Kiểm tra kỹ thuật',
      'music.json':'Cài đặt nhạc','captions.json':'Phụ đề','Video.tsx':'Video.tsx','Thumbnail.tsx':'Thumbnail.tsx'};
    for (const group of ['docs','source']) {
      const base = location(project.paths[group]);
      if (!exists(base)) continue;
      for (const file of fs.readdirSync(base).sort()) {
        if (!textTypes.has(path.extname(file)) || file.startsWith('.') || !fs.statSync(path.join(base,file)).isFile()) continue;
        try {secureFile(base,path.join(base,file));} catch {continue;}
        result.push({id:`${group}/${file}`,name:labels[file]||file,filename:file,group});
      }
    }
    const order = ['script.md','description.md','brief.md','manager-notes.md','production-spec.md'];
    return result.sort((a,b)=>(order.includes(a.filename)?order.indexOf(a.filename):99)-(order.includes(b.filename)?order.indexOf(b.filename):99));
  }
  function preview(project) {
    const base = location(project.paths.assets);
    if (!exists(base)) return null;
    const source = path.join(location(project.paths.source),'Thumbnail.tsx');
    if (exists(source)) {
      const text = fs.readFileSync(source,'utf8');
      const match = text.match(/staticFile\(['"]([^'"]+\.(?:png|jpg|jpeg|webp))['"]\)/i);
      if (match && match[1].startsWith(project.id+'/')) {
        try {return {file:secureFile(base,path.join(root,'public',match[1]),imageTypes),type:'thumbnail-background'};} catch {}
      }
    }
    const images = path.join(base,'images');
    if (exists(images)) for (const name of fs.readdirSync(images).sort()) {
      try {return {file:secureFile(base,path.join(images,name),imageTypes),type:'scene'};} catch {}
    }
    // No thumbnail or scene image: show a frame of the exported/imported video, else the composition's source footage.
    const video = (extra.media(project.id,'video')||extra.media(project.id,'original'))?.file || (()=>{
      const folder = path.join(base,'video');
      if (!exists(folder)) return null;
      for (const name of fs.readdirSync(folder).sort()) {
        try {return secureFile(base,path.join(folder,name),posterVideoTypes);} catch {}
      }
      return null;
    })();
    return video ? {video,type:'video-frame'} : null;
  }
  function servedPreview(id) {
    const image = preview(context(id).project);
    if (!image?.video) return image;
    const file = posters.posterFor(image.video);
    return file ? {file,type:image.type} : null;
  }
  function books(series) {
    const folder = path.join(path.dirname(series.file),'books');
    if (!exists(folder)) return [];
    return fs.readdirSync(folder,{withFileTypes:true}).filter(d=>d.isDirectory()&&slug(d.name)).flatMap(d=>{
      const file = path.join(folder,d.name,'book.json');
      if (!exists(file)) return [];
      const text = fs.readFileSync(secureFile(folder,file),'utf8'), book = JSON.parse(text);
      return [{id:d.name,revision:hash(text),title:book.title,authors:book.authors||[],status:book.status,series:series.id,channel:series.channel,
        cover:extra.bookCover(series.id,d.name)?.revision||null,hasSource:Boolean(book.sourceSha256)||extra.sources(series.id,d.name).length>0,sources:extra.sources(series.id,d.name),note:book.note||'',
        documents:['book.json','research.md','chapters.json','season-plan.md'].filter(f=>exists(path.join(folder,d.name,f)))}];
    });
  }
  function list() {
    const catalog = load(root), nodes = registrations(root);
    const projects = catalog.series.flatMap(series=>series.projects.map(project=>{
      const node = nodes.find(n=>n.project===project.id&&n.kind==='Composition');
      const image = preview(project);
      const renderedVideo=extra.media(project.id,'video'),originalVideo=extra.media(project.id,'original'),renderedThumbnail=extra.media(project.id,'thumbnail');
      const video = project.registrations.find(r=>r.kind==='Composition');
      const thumbnail = project.registrations.find(r=>r.kind==='Still');
      const source = path.join(location(project.paths.source),'Video.tsx');
      const brief = path.join(location(project.paths.docs),'brief.md');
      const updatedAt = exists(source)?fs.statSync(source).mtime.toISOString():exists(brief)?fs.statSync(brief).mtime.toISOString():null;
      return {id:project.id,title:project.title,status:project.status,format:project.format,series:series.id,channel:series.channel,
        seriesTitle:series.title,durationSeconds:node?.fps&&node.durationFrames?node.durationFrames/node.fps:project.durationSeconds??null,
        renderedVideo:Boolean(renderedVideo),renderedThumbnail:Boolean(renderedThumbnail),importedVideo:Boolean(originalVideo),videoId:video?.id||null,thumbnailId:thumbnail?.id||null,previewType:image?.type||null,updatedAt,book:project.book||null,
        hasScript:exists(path.join(location(project.paths.docs),'script.md')),
        hasDescription:exists(path.join(location(project.paths.docs),'description.md')),autoNamed:Boolean(project.autoNamed)};
    }));
    return {channels:catalog.channels,series:catalog.series.map(s=>({id:s.id,title:s.title,channel:s.channel,summary:s.summary,
      formats:s.formats,projectCount:s.projects.length})),projects,books:catalog.series.flatMap(books),
      generatedAt:new Date().toISOString()};
  }
  function detail(id) {
    const {series,project} = context(id);
    const note = path.join(location(project.paths.docs),'manager-notes.md');
    const notes = exists(note)?fs.readFileSync(secureFile(location(project.paths.docs),note),'utf8'):'';
    return {...project,series:series.id,seriesTitle:series.title,channel:series.channel,documents:documents(project),
      notes,notesRevision:hash(notes)};
  }
  function document(id,key) {
    const {project}=context(id);
    const entry=documents(project).find(d=>d.id===key);
    if (!entry) throw new Error('Document not found');
    const file=secureFile(location(project.paths[entry.group]),path.join(location(project.paths[entry.group]),entry.filename));
    if (fs.statSync(file).size>1024*1024) throw new Error('Document exceeds 1 MB; open its folder to read locally');
    return {name:entry.name,filename:entry.filename,text:fs.readFileSync(file,'utf8')};
  }
  function bookDocument(seriesId,bookId,file) {
    checkedId(seriesId);checkedId(bookId);
    const series=load(root).series.find(s=>s.id===seriesId);
    if (!series || !books(series).some(b=>b.id===bookId&&b.documents.includes(file))) throw new Error('Book document not found');
    const folder=path.join(path.dirname(series.file),'books',bookId);
    const target=secureFile(folder,path.join(folder,file));
    if (fs.statSync(target).size>1024*1024) throw new Error('Document too large');
    return {filename:file,name:file,text:fs.readFileSync(target,'utf8')};
  }
  function saveNotes(id,text,revision) {
    if (typeof text!=='string'||Buffer.byteLength(text)>50000) throw new Error('Notes must be under 50 KB');
    const {project}=context(id),folder=location(project.paths.docs);
    if (!exists(folder)) throw new Error('Project documents folder is missing');
    // Only this dedicated notes file is writable, never scripts, music, captions or research.
    if (!fs.realpathSync(folder).startsWith(fs.realpathSync(root)+path.sep)) throw new Error('Notes folder escapes workspace');
    const file=path.join(folder,'manager-notes.md');
    if (exists(file)) secureFile(folder,file);
    const before=exists(file)?fs.readFileSync(file,'utf8'):'';
    if (hash(before)!==revision) {const error=new Error('Ghi chú đã thay đổi bên ngoài. Hãy tải lại trước khi lưu.');error.status=409;throw error;}
    if (text===before) return {revision:hash(text)};
    if (exists(file)) {
      const backup=path.join(folder,'.manager-history');fs.mkdirSync(backup,{recursive:true});
      fs.writeFileSync(path.join(backup,`${Date.now()}-${crypto.randomBytes(4).toString('hex')}.md`),before,{flag:'wx'});
    }
    const temp=path.join(folder,`.manager-notes-${crypto.randomBytes(8).toString('hex')}.tmp`);
    fs.writeFileSync(temp,text,{flag:'wx'});
    if (hash(exists(file)?fs.readFileSync(file,'utf8'):'')!==revision) {
      fs.unlinkSync(temp);const error=new Error('Ghi chú vừa được chỉnh sửa. Hãy tải lại.');error.status=409;throw error;
    }
    fs.renameSync(temp,file);
    return {revision:hash(text)};
  }
  function folder(id,group) {
    const {project}=context(id);
    if (!['source','scripts','docs','assets'].includes(group)) throw new Error('Unknown folder');
    const directory=fs.realpathSync(location(project.paths[group]));
    if (!directory.startsWith(fs.realpathSync(root)+path.sep)||!fs.statSync(directory).isDirectory()) throw new Error('Folder not available');
    return directory;
  }
  function create(body) {
    const catalog=load(root);validate(catalog);
    const options={'--series':body.series,'--id':body.id,'--title':body.title,'--format':body.format};
    if (body.duration!==''&&body.duration!=null) options['--duration']=String(body.duration);
    if (body.book) options['--book']=body.book;
    return createProject(catalog,options);
  }
  async function createWithVideo(body,name,request) {
    const catalog=load(root);validate(catalog);const series=catalog.series.find(s=>s.id===body.series),id=body.id?checkedId(body.id):null,ext=path.extname(String(name||'')).toLowerCase();
    if(!series||contentChannels.has(series.channel))throw new Error('Chỉ import video có sẵn cho dự án thuộc kênh ngoài');
    if(typeof body.title!=='string'||!series.formats.includes(body.format))throw new Error('Tên dự án và định dạng không hợp lệ');
    if(typeof name!=='string'||name!==path.basename(name)||name.length>180||/[\x00-\x1f\\/]/.test(name)||!videoTypes.has(ext))throw new Error('Chỉ nhận video MP4 hoặc WebM có tên hợp lệ');
    if(id&&catalog.series.some(s=>s.projects.some(p=>p.id===id)))throw new Error(`Project slug already exists: ${id}`);
    const staging=location('.manager-staging');fs.mkdirSync(staging,{recursive:true});const temp=path.join(staging,`.project-video-${crypto.randomUUID()}`),handle=await fs.promises.open(temp,'wx'),hash=crypto.createHash('sha256');
    let bytes=0,head=Buffer.alloc(0),created=null,dest=null;
    try{
      for await(const chunk of request){bytes+=chunk.length;if(bytes>8*1024*1024*1024){const error=new Error('Video tối đa 8 GB');error.status=413;throw error;}if(head.length<16)head=Buffer.concat([head,chunk]).subarray(0,16);hash.update(chunk);await handle.write(chunk);}
      await handle.close();
      const valid=ext==='.mp4'?head.length>=12&&head.toString('ascii',4,8)==='ftyp':head.length>=4&&head.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]));
      if(!bytes||!valid)throw new Error(`Nội dung file không phải ${ext.slice(1).toUpperCase()} hợp lệ`);
      created=create(body);const assets=location(created.paths.assets);fs.mkdirSync(assets,{recursive:true});if(fs.lstatSync(assets).isSymbolicLink())throw new Error('Thư mục video không an toàn');
      dest=path.join(assets,'imported-video'+ext);if(fs.existsSync(dest))throw new Error('Dự án đã có video import');fs.linkSync(temp,dest);fs.unlinkSync(temp);
      const meta={originalName:name,file:path.relative(root,dest),bytes,sha256:hash.digest('hex'),importedAt:new Date().toISOString(),source:'customer-supplied'};
      fs.writeFileSync(path.join(location(created.paths.docs),'imported-video.json'),JSON.stringify(meta,null,2)+'\n',{flag:'wx'});
      return {...created,importedVideo:meta};
    }catch(error){await handle.close().catch(()=>{});if(dest&&fs.existsSync(dest))fs.unlinkSync(dest);throw error;}
    finally{if(fs.existsSync(temp))fs.unlinkSync(temp);try{if(fs.existsSync(staging)&&!fs.readdirSync(staging).length)fs.rmdirSync(staging);}catch{}}
  }
  return {...extra,list,detail,document,bookDocument,saveNotes,folder,create,createWithVideo,preview:servedPreview};
}
module.exports={createStore,hash};
