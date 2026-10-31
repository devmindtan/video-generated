const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {parse}=require('@babel/parser');
const {load,validate,slug}=require('../../scripts/catalog/catalog.cjs');
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const write=(f,v)=>{fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n');};
function features(root){
  root=fs.realpathSync(root);
  function safe(relative){const f=path.resolve(root,relative);if(!f.startsWith(root+path.sep))throw Error('Invalid path');let p=f;while(!fs.existsSync(p))p=path.dirname(p);if(!fs.realpathSync(p).startsWith(root+path.sep)&&p!==root)throw Error('Symlink outside workspace');return f;}
  function series(id){const s=load(root).series.find(s=>s.id===id);if(!s)throw Error('Series not found');return s;}
  function project(id){for(const s of load(root).series){const p=s.projects.find(p=>p.id===id);if(p)return p;}throw Error('Project not found');}
  function exportsFor(p){
    const files=new Map();
    const imported=safe(p.paths.assets);
    if(fs.existsSync(imported)&&!fs.lstatSync(imported).isSymbolicLink())for(const name of ['imported-video.mp4','imported-video.webm']){
      const file=safe(path.join(p.paths.assets,name));if(!fs.existsSync(file)||fs.lstatSync(file).isSymbolicLink()||!fs.statSync(file).isFile())continue;
      const st=fs.statSync(file);files.set(file,{file,name,kind:'original',size:st.size,modified:st.mtimeMs,imported:true});
    }
    for(const r of p.registrations){
      const extensions=r.kind==='Composition'?['.mp4','.webm']:['.png','.jpg','.jpeg','.webp'];
      const dirs=['out',`out/${p.id}`,`projects/${p.id}`,`public/${p.id}`,...p.registrations.map(x=>`projects/${x.id}`)];
      for(const dir of new Set(dirs)){
        const folder=safe(dir);if(!fs.existsSync(folder))continue;
        for(const name of fs.readdirSync(folder)){
          const ext=path.extname(name).toLowerCase(),stem=path.basename(name,ext);
          if(!extensions.includes(ext))continue;
          // Only exact composition/slug names in shared folders; any final media in dedicated projects folders.
          if(!(stem===r.id||stem===p.id||(dir.startsWith('projects/')&&(r.kind==='Composition'||/thumb/i.test(stem)))))continue;
          const file=safe(path.join(dir,name));if(!fs.statSync(file).isFile()||fs.lstatSync(file).isSymbolicLink())continue;
          const st=fs.statSync(file);files.set(file,{file,name,kind:r.kind==='Composition'?'video':'thumbnail',size:st.size,modified:st.mtimeMs});
        }
      }
    }
    return [...files.values()].sort((a,b)=>b.modified-a.modified);
  }
  function media(id,kind){const p=project(id);return exportsFor(p).find(f=>f.kind===kind)||null;}
  function bookFolder(sid,id){if(!slug(id))throw Error('Invalid book id');const s=series(sid);return safe(path.relative(root,path.join(path.dirname(s.file),'books',id)));}
  function sources(sid,id){if(!fs.existsSync(path.join(bookFolder(sid,id),'book.json')))throw Error('Book not found');const folder=safe(`library/books/${id}/sources`);return fs.existsSync(folder)?fs.readdirSync(folder).filter(n=>n.toLowerCase().endsWith('.pdf')).map(name=>({name,size:fs.statSync(safe(`library/books/${id}/sources/${name}`)).size})):[];}
  function coverFolder(sid,id){const folder=bookFolder(sid,id);if(!fs.existsSync(path.join(folder,'book.json')))throw Error('Book not found');const covers=safe(path.relative(root,path.join(folder,'covers')));if(fs.realpathSync(folder)!==folder||(fs.existsSync(covers)&&fs.realpathSync(covers)!==covers))throw Error('Cover folder must not be a symlink');return covers;}
  function bookCover(sid,id){
    const folder=coverFolder(sid,id),pointer=safe(path.relative(root,path.join(folder,'current.json')));if(!fs.existsSync(pointer))return null;if(fs.lstatSync(pointer).isSymbolicLink())throw Error('Invalid cover metadata path');
    const meta=read(pointer);if(!/^[a-f0-9]{64}\.(png|jpg|webp)$/.test(meta.file))throw Error('Invalid cover metadata');
    const file=safe(path.relative(root,path.join(folder,meta.file)));if(!fs.existsSync(file)||!fs.statSync(file).isFile())return null;if(fs.lstatSync(file).isSymbolicLink())throw Error('Invalid cover image path');
    return {file,revision:meta.file};
  }
  async function uploadCover(sid,id,request){
    const folder=coverFolder(sid,id);let bytes=0;const chunks=[];
    for await(const chunk of request){bytes+=chunk.length;if(bytes>8*1024*1024)throw Error('Ảnh bìa tối đa 8 MB');chunks.push(chunk);}
    const data=Buffer.concat(chunks);let ext;
    if(data.length>=33&&data.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))&&data.toString('ascii',12,16)==='IHDR')ext='png';
    else if(data.length>=4&&data[0]===255&&data[1]===216&&data[2]===255&&data[data.length-2]===255&&data[data.length-1]===217)ext='jpg';
    else if(data.length>=20&&data.toString('ascii',0,4)==='RIFF'&&data.toString('ascii',8,12)==='WEBP')ext='webp';
    else throw Error('Chỉ nhận ảnh JPG, PNG hoặc WebP hợp lệ');
    fs.mkdirSync(folder,{recursive:true});const name=digest(data)+'.'+ext,file=safe(path.relative(root,path.join(folder,name)));
    try{fs.writeFileSync(file,data,{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;}
    const temp=path.join(folder,'.cover-'+crypto.randomUUID()+'.tmp');write(temp,{file:name,updatedAt:new Date().toISOString()});
    fs.renameSync(temp,safe(path.relative(root,path.join(folder,'current.json'))));return {revision:name};
  }
  function newBook(b){
    if(!slug(b.id)||typeof b.title!=='string'||!b.title.trim()||b.title.length>300)throw Error('Tên và mã sách không hợp lệ');
    if(load(root).series.some(s=>s.id==='book-insights')&&b.series!=='book-insights')throw Error('Hồ sơ sách thuộc series Đọc sách, hiểu mình.');
    const folder=bookFolder(b.series,b.id);
    for(const s of load(root).series)if(fs.existsSync(path.join(path.dirname(s.file),'books',b.id)))throw Error('Mã sách đã tồn tại; hãy dùng hồ sơ nguồn hiện có.');
    if(fs.existsSync(folder))throw Error('Thư mục đã tồn tại');
    fs.mkdirSync(folder,{recursive:true});
    write(path.join(folder,'book.json'),{id:b.id,title:b.title.trim(),authors:String(b.authors||'').split(',').map(x=>x.trim()).filter(Boolean),status:'awaiting-source',sourceSha256:null,note:'Chưa kiểm tra nguồn và nội dung sách.'});
    fs.writeFileSync(path.join(folder,'research.md'),`# ${b.title.trim()}\n\nChưa đọc nguồn. Chưa xác minh chương và trang.\n`);
    write(path.join(folder,'chapters.json'),{chapters:[],coverage:'unreviewed'});
    return {id:b.id,series:b.series};
  }
  async function upload(sid,id,name,request){
    const folder=bookFolder(sid,id);if(!fs.existsSync(path.join(folder,'book.json')))throw Error('Book not found');
    if(typeof name!=='string'||name!==path.basename(name)||!name.toLowerCase().endsWith('.pdf')||name.length>180||/[\x00-\x1f\\]/.test(name))throw Error('Chỉ nhận tên file PDF hợp lệ');
    const dest=safe(`library/books/${id}/sources/${name}`);fs.mkdirSync(path.dirname(dest),{recursive:true});
    if(fs.existsSync(dest))throw Error('File đã có. Đổi tên nếu đây là phiên bản khác.');
    const temp=safe(`library/books/${id}/sources/.upload-${crypto.randomUUID()}`);
    const handle=await fs.promises.open(temp,'wx');let size=0,head=Buffer.alloc(0);const hash=crypto.createHash('sha256');
    try{for await(const chunk of request){size+=chunk.length;if(size>200*1024*1024)throw Error('PDF tối đa 200 MB');if(head.length<5)head=Buffer.concat([head,chunk]).subarray(0,5);hash.update(chunk);await handle.write(chunk);}await handle.close();if(head.toString()!=='%PDF-')throw Error('File không có định dạng PDF');fs.linkSync(temp,dest);fs.unlinkSync(temp);
      return {name,size,sha256:hash.digest('hex'),path:path.relative(root,dest)};
    }catch(e){await handle.close().catch(()=>{});if(fs.existsSync(temp))fs.unlinkSync(temp);throw e;}
  }
  // Series have their own workflow and structure; the manager only deletes individual projects.
  function deletion(kind,id){
    if(kind!=='project')throw Error('Chỉ có thể xóa dự án');
    const catalog=load(root);validate(catalog);const s=catalog.series.find(s=>s.projects.some(p=>p.id===id));if(!s)throw Error('Not found');
    const projects=[project(id)];
    const paths=projects.flatMap(p=>Object.values(p.paths)).filter(p=>fs.existsSync(safe(p)));
    const exports=projects.flatMap(exportsFor);for(const f of exports){const rel=path.relative(root,f.file);if(!paths.some(p=>rel.startsWith(p+'/')))paths.push(rel);}
    const fingerprints=[];function scan(rel){const f=safe(rel),st=fs.lstatSync(f);if(st.isSymbolicLink())throw Error('Không xóa thư mục có symlink; kiểm tra thủ công.');fingerprints.push([rel,st.size,st.mtimeMs]);if(st.isDirectory())for(const n of fs.readdirSync(f).sort())scan(path.join(rel,n));}
    [...new Set(paths)].forEach(scan);
    const config=[s.file,path.join(root,'series/catalog.json'),path.join(root,'src/projects/registry.tsx')];
    const revision=digest(JSON.stringify(fingerprints)+config.map(f=>fs.readFileSync(f,'utf8')).join(''));
    return {kind,id,title:projects[0].title,projectCount:projects.length,registrations:projects.reduce((n,p)=>n+p.registrations.length,0),rendered:exports.length,files:fingerprints.filter(x=>fs.statSync(safe(x[0])).isFile()).length,paths:[...new Set(paths)],revision,privateSourcesRetained:true};
  }
  function remove(b){
    const plan=deletion(b.kind,b.id);if(b.confirm!==true||b.revision!==plan.revision)throw Error('Dữ liệu đã đổi hoặc chưa xác nhận. Mở lại hộp xác nhận.');
    const s=load(root).series.find(s=>s.projects.some(p=>p.id===b.id));
    const ids=new Set([b.id]);
    const reg=safe('src/projects/registry.tsx'),original=fs.readFileSync(reg,'utf8'),ast=parse(original,{sourceType:'module',plugins:['typescript','jsx']}),ranges=[];
    function walk(n,folders=[]){if(!n||typeof n!=='object')return;let next=folders;
      if(n.type==='ImportDeclaration'&&ids.has(n.source.value.match(/^\.\/([^/]+)\//)?.[1])){ranges.push([n.start,n.end]);return;}
      if(n.type==='JSXElement'&&n.openingElement.name.name==='Folder'){const name=n.openingElement.attributes.find(a=>a.name?.name==='name')?.value?.value;next=[...folders,name];if(folders.length===2&&ids.has(name)){ranges.push([n.start,n.end]);return;}}
      for(const [k,v]of Object.entries(n)){if(['loc','start','end'].includes(k))continue;if(Array.isArray(v))v.forEach(x=>walk(x,next));else if(v&&typeof v==='object')walk(v,next);}}
    walk(ast);let updated=original;for(const [a,z]of ranges.sort((a,b)=>b[0]-a[0]))updated=updated.slice(0,a)+updated.slice(z);
    const trash=safe(`.manager-trash/${Date.now()}-${crypto.randomUUID()}`);fs.mkdirSync(trash,{recursive:true});
    const configFiles=[reg,s.file,safe('series/catalog.json')],snapshots=configFiles.map(file=>({file,text:fs.readFileSync(file,'utf8')}));
    write(path.join(trash,'manifest.json'),{...plan,createdAt:new Date().toISOString(),snapshots:snapshots.map(x=>({path:path.relative(root,x.file),text:x.text}))});
    const moved=[];
    try{
      for(const relative of plan.paths){const from=safe(relative),to=path.join(trash,'files',relative);fs.mkdirSync(path.dirname(to),{recursive:true});fs.renameSync(from,to);moved.push({from,to});}
      fs.writeFileSync(reg,updated);
      const data=read(s.file);data.projects=data.projects.filter(p=>p.id!==b.id);write(s.file,data);
      validate(load(root));
    }catch(e){for(const m of moved.reverse())fs.renameSync(m.to,m.from);for(const x of snapshots)fs.writeFileSync(x.file,x.text);throw e;}
    return {deleted:true,trash:path.relative(root,trash)};
  }
  // Edit only the book's title and authors in place; every other field of book.json stays as it is.
  function updateBook(b){
    const file=safe(path.relative(root,path.join(bookFolder(b.series,b.id),'book.json')));
    if(!fs.existsSync(file))throw Error('Book not found');if(fs.lstatSync(file).isSymbolicLink())throw Error('Invalid book path');
    const before=fs.readFileSync(file,'utf8'),conflict=()=>Object.assign(Error('Hồ sơ sách vừa được sửa ở nơi khác. Hãy tải lại trang.'),{status:409});
    if(digest(before)!==b.revision)throw conflict();
    const title=typeof b.title==='string'?b.title.trim():'';
    const authors=(Array.isArray(b.authors)?b.authors:String(b.authors||'').split(',')).map(a=>String(a).trim()).filter(Boolean);
    if(!title||title.length>300)throw Error('Tên sách cần từ 1 đến 300 ký tự');
    if(authors.length>10||authors.some(a=>a.length>120))throw Error('Tối đa 10 tác giả, mỗi tên dưới 120 ký tự');
    const data=JSON.parse(before);data.title=title;data.authors=authors;
    const text=JSON.stringify(data,null,2)+'\n';if(text===before)return {revision:digest(text),title,authors};
    const folder=path.dirname(file),history=path.join(folder,'.manager-history');fs.mkdirSync(history,{recursive:true});
    fs.writeFileSync(path.join(history,`book-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.json`),before,{flag:'wx'});
    const temp=path.join(folder,`.book-${crypto.randomBytes(8).toString('hex')}.tmp`);fs.writeFileSync(temp,text,{flag:'wx'});
    if(digest(fs.readFileSync(file,'utf8'))!==b.revision){fs.unlinkSync(temp);throw conflict();}
    fs.renameSync(temp,file);return {revision:digest(text),title,authors};
  }
  return {bookCover,uploadCover,media,exportsFor,newBook,updateBook,sources,upload,deletion,remove};
}
module.exports={features};
