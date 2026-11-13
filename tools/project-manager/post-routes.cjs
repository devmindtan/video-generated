const invalidBody=Symbol('invalid-body');

async function readJson(req,send) {
  if(!req.headers['content-type']?.startsWith('application/json')) {
    send(415,{error:'JSON required'});
    return invalidBody;
  }
  let bytes=0;
  const chunks=[];
  for await(const chunk of req) {
    bytes+=chunk.length;
    if(bytes>100000) {
      send(413,{error:'Request too large'});
      return invalidBody;
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    send(400,{error:'Invalid JSON'});
    return invalidBody;
  }
}

async function handlePost({req,url,route,send,store,startStudio,startVoiceStudio,voiceControl,backup,thumbnails,loudness,looks,openFolder}) {
  if(route==='/api/book-cover')return send(201,await store.uploadCover(url.searchParams.get('series'),url.searchParams.get('book'),req));
  if(route==='/api/channel-image') {
    const query=url.searchParams;
    return send(201,await store.uploadChannelImage(query.get('channel'),query.get('platform'),query.get('kind'),query.get('revision'),req));
  }
  if(route==='/api/voice-reference') {
    if(req.headers['content-type']!=='application/octet-stream')return send(415,{error:'Audio file required'});
    const query=url.searchParams;
    return send(201,await store.addVoiceReference({name:query.get('name'),speaker:query.get('speaker'),consent:query.get('consent'),title:query.get('title')},req));
  }
  if(route==='/api/library-audio') {
    if(req.headers['content-type']!=='application/octet-stream')return send(415,{error:'Audio file required'});
    const query=url.searchParams;
    return send(201,await store.addAudio({kind:query.get('kind'),name:query.get('name'),title:query.get('title'),artists:query.get('artists')},req));
  }
  if(route==='/api/book-source') {
    if(req.headers['content-type']!=='application/pdf')return send(415,{error:'PDF required'});
    return send(201,await store.upload(url.searchParams.get('series'),url.searchParams.get('book'),url.searchParams.get('name'),req));
  }
  if(route==='/api/projects/import') {
    if(req.headers['content-type']!=='application/octet-stream')return send(415,{error:'Video file required'});
    const query=url.searchParams;
    return send(201,await store.createWithVideo({series:query.get('series'),id:query.get('id'),title:query.get('title'),format:query.get('format'),duration:query.get('duration')||'',book:query.get('book')||''},query.get('name'),req));
  }

  const body=await readJson(req,send);
  if(body===invalidBody)return;
  if(route==='/api/studio') {
    const project=store.detail(body.id);
    if(!project.registrations.some(registration=>registration.id===body.composition))throw Error('Composition not found');
    await startStudio();
    return send(200,{url:'http://localhost:3000/'+encodeURIComponent(body.composition)});
  }
  if(route==='/api/studio-look') {
    if(!looks.sampleIds().includes(String(body.composition||'')))throw Error('Composition not found');
    await startStudio();
    return send(200,{url:'http://localhost:3000/'+encodeURIComponent(body.composition)});
  }
  if(route==='/api/looks/theme')return send(200,looks.saveTheme(body));
  if(route==='/api/looks/theme-delete')return send(200,looks.deleteTheme(body));
  if(route==='/api/looks/style-note')return send(200,looks.saveStyleNote(body));
  if(route==='/api/looks/project')return send(200,looks.setLook(body));
  if(route==='/api/voicestudio')return send(200,await startVoiceStudio());
  if(route==='/api/voicestudio/stop')return send(200,await voiceControl.stop());
  if(route==='/api/backup/start')return send(202,await backup.start(body.action));
  if(route==='/api/backup/stop')return send(200,backup.stop());
  if(route==='/api/thumbnails/choose')return send(200,thumbnails.choose({id:String(body.id||''),variant:String(body.variant||''),set:body.set==null?null:String(body.set),revision:String(body.revision||'')}));
  if(route==='/api/loudness/fix')return send(202,loudness.start(String(body.id||''),String(body.composition||'')));
  if(route==='/api/books')return send(201,store.newBook(body));
  if(route==='/api/approve')return send(200,store.approveGate(body));
  if(route==='/api/review/lock')return send(200,store.lockProject(body));
  if(route==='/api/review/lock-return')return send(200,store.returnLock(body));
  if(route==='/api/review/patch')return send(200,store.decidePatch(body));
  if(route==='/api/review/scene')return send(200,store.reviewScene(body));
  if(route==='/api/review/note')return send(200,store.reviewNote(body));
  if(route==='/api/voice-reference-clip')return send(201,await store.cutVoiceReference(body));
  if(route==='/api/voice-reference-meta')return send(200,store.updateVoiceReference(body));
  if(route==='/api/book-skills/install')return send(200,store.installBookSkills(String(body.series||''),String(body.book||'')));
  if(route==='/api/book-meta')return send(200,store.updateBook(body));
  if(route==='/api/audio-meta')return send(200,store.updateAudioMeta(body));
  if(route==='/api/delete-preview')return send(200,store.deletion(body.kind,body.id));
  if(route==='/api/delete')return send(200,store.remove(body));
  if(route==='/api/projects')return send(201,store.create(body));
  if(route==='/api/notes')return send(200,store.saveNotes(body.id,body.text,body.revision));
  if(route==='/api/workflow')return send(200,store.saveWorkflow(body));
  if(route==='/api/channel-platform')return send(200,store.saveChannelPlatform(body));
  if(route==='/api/channel-platform-delete')return send(200,store.deleteChannelPlatform(body));
  if(route==='/api/channel-platform-move')return send(200,store.moveChannelPlatform(body));
  if(route==='/api/channel-image-remove')return send(200,store.removeChannelImage(body));
  if(route==='/api/voice-playlist')return send(200,store.savePlaylist(body));
  if(route==='/api/open-folder') {
    await openFolder(store.folder(body.id,body.group));
    return send(200,{opened:true});
  }
  return send(404,{error:'Unknown action'});
}

module.exports={handlePost};
