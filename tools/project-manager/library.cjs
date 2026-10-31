// Voice and music library: VieNeu presets, the chosen playlist, background music and SFX, with the
// projects that use each. Only files referenced here can be streamed. Writes: the preferred playlist and
// new files copied into the shared audio library (public/audio-library/<music|sfx>/), never overwriting.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {load} = require('../../scripts/catalog/catalog.cjs');

const audioTypes = new Set(['.wav', '.mp3', '.m4a', '.ogg', '.flac']);
const PRESETS = 'public/voice-auditions/all-presets-v1';
const SHARED = 'audio-library';
const LIMITS = {music: 200 * 1024 * 1024, sfx: 30 * 1024 * 1024};
const META = 'scripts/shared/audio-library.json';
// Container signatures, so a renamed non-audio file is refused.
function audioSignature(head, ext) {
  const ascii = (a, b) => head.toString('latin1', a, b);
  if (ext === '.wav') return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WAVE';
  if (ext === '.mp3') return ascii(0, 3) === 'ID3' || (head[0] === 0xff && (head[1] & 0xe0) === 0xe0);
  if (ext === '.flac') return ascii(0, 4) === 'fLaC';
  if (ext === '.ogg') return ascii(0, 4) === 'OggS';
  if (ext === '.m4a') return ascii(4, 8) === 'ftyp';
  return false;
}
const readJson = file => {try {return JSON.parse(fs.readFileSync(file, 'utf8'));} catch {return null;}};
const titleOf = file => path.basename(file, path.extname(file));
const hashText = text => crypto.createHash('sha256').update(text).digest('hex');

function createLibrary(root) {
  root = fs.realpathSync(root);
  const publicDir = path.join(root, 'public');
  // A public-relative audio path that exists inside public/, is not a backup and is not a symlink escape.
  function audioFile(rel) {
    if (typeof rel !== 'string' || !rel || rel.includes('\0') || path.isAbsolute(rel) || rel.split('/').includes('..')) return null;
    if (rel.split('/').includes('backups') || !audioTypes.has(path.extname(rel).toLowerCase())) return null;
    const file = path.join(publicDir, rel);
    try {
      const real = fs.realpathSync(file);
      if (!real.startsWith(fs.realpathSync(publicDir) + path.sep) || !fs.statSync(real).isFile()) return null;
      return real;
    } catch {return null;}
  }
  const metadata = () => readJson(path.join(root, META)) || {schemaVersion: 1, files: {}};
  function projects() {
    return load(root).series.flatMap(series => series.projects.map(p => ({id: p.id, title: p.title, series: series.id, seriesTitle: series.title, channel: series.channel})));
  }
  // The narration voice a project records: scripts/projects/<id>/voice.json, else the per-scene voice metadata.
  function voiceOf(id) {
    const chosen = readJson(path.join(root, 'scripts/projects', id, 'voice.json'));
    if (typeof chosen?.voice === 'string') return chosen.voice;
    const scenes = readJson(path.join(publicDir, id, 'audio/voice-metadata.json'));
    const names = [...new Set((Array.isArray(scenes) ? scenes : [scenes]).map(s => s?.voice).filter(v => typeof v === 'string'))];
    return names.length === 1 ? names[0] : null;
  }
  function voices() {
    const manifest = readJson(path.join(root, PRESETS, 'manifest.json')) || {voices: []};
    const playlistText = fs.existsSync(path.join(root, 'scripts/shared/voice-playlists.json')) ? fs.readFileSync(path.join(root, 'scripts/shared/voice-playlists.json'), 'utf8') : '';
    let playlists = {playlists: []};try {playlists = JSON.parse(playlistText);} catch {}
    const playlist = playlists.playlists.find(p => p.id === playlists.preferredPlaylist) || playlists.playlists[0] || null;
    const all = projects(), usage = new Map(), unrecorded = [];
    for (const p of all) {
      const voice = voiceOf(p.id);
      if (!voice) {unrecorded.push(p.id); continue;}
      if (!usage.has(voice)) usage.set(voice, []);
      usage.get(voice).push(p);
    }
    const names = new Set(manifest.voices.map(v => v.name));
    return {
      catalog: path.basename(PRESETS), sampleText: manifest.text || '',
      playlist: playlist && {name: playlist.name, voiceNames: playlist.voiceNames, policy: playlists.policy || '', revision: hashText(playlistText)},
      voices: manifest.voices.map((v, index) => ({id: v.id, number: index + 1, name: v.name, gender: v.gender, region: v.region,
        durationSeconds: v.durationSeconds ?? null, verification: v.verification || '', sample: Boolean(audioFile(`${PRESETS.slice(7)}/${v.file}`)),
        preferred: Boolean(playlist?.voiceNames.includes(v.name)), usedBy: usage.get(v.name) || []})),
      otherVoices: [...usage].filter(([name]) => !names.has(name)).map(([name, usedBy]) => ({name, usedBy})),
      unrecorded: unrecorded.length,
    };
  }
  function music() {
    const tracks = new Map(), effects = [];
    const track = rel => {
      if (!tracks.has(rel)) {
        const file = audioFile(rel);
        const info = metadata().files[rel] || {};
        tracks.set(rel, {path: rel, exists: Boolean(file), bytes: file ? fs.statSync(file).size : null, shared: !rel.includes('/') || rel.startsWith(SHARED + '/'),
          title: info.title || null, artists: Array.isArray(info.artists) ? info.artists : [], usedBy: [], addedAt: info.addedAt || null});
      }
      return tracks.get(rel);
    };
    for (const p of projects()) {
      const config = readJson(path.join(root, 'src/projects', p.id, 'music.json'));
      if (typeof config?.file === 'string') {
        const t = track(config.file), credit = config.credit;
        if (!t.title && typeof credit?.title === 'string') t.title = credit.title;
        if (!t.artists.length && Array.isArray(credit?.artists)) t.artists = credit.artists.filter(a => typeof a === 'string');
        t.usedBy.push({...p, credited: Boolean(credit?.title && credit?.artists?.length), speechVolume: config.speechVolume ?? null, pauseVolume: config.pauseVolume ?? null});
      }
      const sfx = readJson(path.join(root, 'src/projects', p.id, 'sfx.json'));
      if (typeof sfx?.file === 'string') {const file = audioFile(sfx.file); effects.push({...p, path: sfx.file, exists: Boolean(file), bytes: file ? fs.statSync(file).size : null, volume: sfx.volume ?? null, enabled: sfx.enabled !== false});}
      // Layered SFX keep their timing on Audio nodes in Video.tsx; list the layers, there is no single file to play.
      else if (sfx && typeof sfx === 'object') effects.push({...p, path: null, exists: false, bytes: null, enabled: sfx.enabled !== false,
        layers: Object.keys(sfx).filter(k => /Volume$/.test(k) && k !== 'masterVolume').length, provenance: typeof sfx.provenance === 'string' ? sfx.provenance : ''});
    }
    // Full recordings kept at the top of public/ are the shared music library, used or not.
    for (const name of fs.existsSync(publicDir) ? fs.readdirSync(publicDir).sort() : []) if (audioFile(name)) track(name);
    for (const name of listShared('music')) track(`${SHARED}/music/${name}`);
    const meta = metadata().files;
    const library = listShared('sfx').map(name => {
      const rel = `${SHARED}/sfx/${name}`, file = audioFile(rel), info = meta[rel] || {};
      return {library: true, id: rel, title: info.title || titleOf(name), seriesTitle: 'Thư viện dùng chung', path: rel, exists: Boolean(file),
        bytes: file ? fs.statSync(file).size : null, enabled: true, artists: Array.isArray(info.artists) ? info.artists : [], addedAt: info.addedAt || null};
    });
    effects.push(...library);
    const list = [...tracks.values()].map(t => ({...t, title: t.title || titleOf(t.path), credited: Boolean(t.artists.length),
      uncredited: t.usedBy.filter(u => !u.credited).length}));
    list.sort((a, b) => b.usedBy.length - a.usedBy.length || a.title.localeCompare(b.title, 'vi'));
    const metaFile = path.join(root, META);
    return {tracks: list.filter(t => t.usedBy.length), unused: list.filter(t => !t.usedBy.length), effects,
      metaRevision: hashText(fs.existsSync(metaFile) ? fs.readFileSync(metaFile, 'utf8') : '')};
  }
  function listShared(kind) {
    const dir = path.join(publicDir, SHARED, kind);
    return fs.existsSync(dir) ? fs.readdirSync(dir).filter(n => !n.startsWith('.') && audioFile(`${SHARED}/${kind}/${n}`)).sort() : [];
  }
  // Copy one audio file the user picked (from any folder) into the shared library. Never overwrites a file.
  async function addAudio({kind, name, title, artists}, request) {
    if (!LIMITS[kind]) throw new Error('Chọn loại: nhạc nền hoặc hiệu ứng');
    const ext = path.extname(String(name || '')).toLowerCase();
    if (typeof name !== 'string' || name !== path.basename(name) || name.startsWith('.') || name.length > 180 || /[\x00-\x1f\\/]/.test(name) || !audioTypes.has(ext))
      throw new Error('Chỉ nhận file WAV, MP3, M4A, OGG hoặc FLAC có tên hợp lệ');
    const dir = path.join(publicDir, SHARED, kind);
    fs.mkdirSync(dir, {recursive: true});
    if (fs.lstatSync(dir).isSymbolicLink()) throw new Error('Thư mục thư viện không hợp lệ');
    const rel = `${SHARED}/${kind}/${name}`, dest = path.join(dir, name);
    if (fs.existsSync(dest)) {const e = new Error('Thư viện đã có file cùng tên. Đổi tên nếu đây là bản khác.'); e.status = 409; throw e;}
    const temp = path.join(dir, `.upload-${crypto.randomUUID()}`), handle = await fs.promises.open(temp, 'wx');
    const hash = crypto.createHash('sha256');let size = 0, head = Buffer.alloc(0);
    try {
      for await (const chunk of request) {
        size += chunk.length;
        if (size > LIMITS[kind]) throw new Error(`File tối đa ${LIMITS[kind] / 1048576} MB`);
        if (head.length < 16) head = Buffer.concat([head, chunk]).subarray(0, 16);
        hash.update(chunk);await handle.write(chunk);
      }
      await handle.close();
      if (!size) throw new Error('File rỗng');
      if (!audioSignature(head, ext)) throw new Error('Nội dung file không phải ' + ext.slice(1).toUpperCase() + ' hợp lệ');
      fs.linkSync(temp, dest);fs.unlinkSync(temp);
    } catch (e) {await handle.close().catch(() => {});if (fs.existsSync(temp)) fs.unlinkSync(temp);throw e;}
    // Optional title/artist so descriptions can credit the track; stored beside the voice playlist.
    const metaFile = path.join(root, META), before = fs.existsSync(metaFile) ? fs.readFileSync(metaFile, 'utf8') : '';
    const data = before ? JSON.parse(before) : {schemaVersion: 1, files: {}};
    const clean = v => typeof v === 'string' ? v.trim().slice(0, 200) : '';
    data.files[rel] = {kind, title: clean(title) || titleOf(name), artists: String(artists || '').split(',').map(clean).filter(Boolean),
      originalName: name, sha256: hash.digest('hex'), bytes: size, addedAt: new Date().toISOString()};
    const tmp = path.join(path.dirname(metaFile), `.audio-library-${crypto.randomBytes(8).toString('hex')}.tmp`);
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n', {flag: 'wx'});fs.renameSync(tmp, metaFile);
    return {kind, path: rel, bytes: size, title: data.files[rel].title};
  }
  // Rename a shared track or library SFX in place: title/artists in audio-library.json. Project credits
  // in each music.json are not touched.
  function updateAudioMeta({path: rel, title, artists, revision}) {
    const shared = typeof rel === 'string' && (!rel.includes('/') || /^audio-library\/(music|sfx)\/[^/]+$/.test(rel));
    if (!shared || !audioFile(rel)) throw new Error('Chỉ sửa được bài trong thư viện dùng chung');
    const clean = v => typeof v === 'string' ? v.trim() : '';
    const name = clean(title), people = (Array.isArray(artists) ? artists : String(artists || '').split(',')).map(clean).filter(Boolean);
    if (!name || name.length > 200) throw new Error('Tên bài cần từ 1 đến 200 ký tự');
    if (people.length > 10 || people.some(a => a.length > 120)) throw new Error('Tối đa 10 tác giả, mỗi tên dưới 120 ký tự');
    const metaFile = path.join(root, META), conflict = () => Object.assign(new Error('Thư viện vừa được sửa ở nơi khác. Hãy tải lại trang.'), {status: 409});
    if (fs.existsSync(metaFile) && fs.lstatSync(metaFile).isSymbolicLink()) throw new Error('audio-library.json must not be a symlink');
    const before = fs.existsSync(metaFile) ? fs.readFileSync(metaFile, 'utf8') : '';
    if (hashText(before) !== revision) throw conflict();
    const data = before ? JSON.parse(before) : {schemaVersion: 1, files: {}};
    const kind = rel.startsWith('audio-library/sfx/') ? 'sfx' : 'music';
    data.files[rel] = {...(data.files[rel] || {kind}), title: name, artists: people, updatedAt: new Date().toISOString()};
    const text = JSON.stringify(data, null, 2) + '\n';
    if (before) {
      const history = path.join(root, 'scripts/shared/.manager-history');
      fs.mkdirSync(history, {recursive: true});
      fs.writeFileSync(path.join(history, `audio-library-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.json`), before, {flag: 'wx'});
    }
    const temp = path.join(path.dirname(metaFile), `.audio-library-${crypto.randomBytes(8).toString('hex')}.tmp`);
    fs.writeFileSync(temp, text, {flag: 'wx'});
    if (hashText(fs.existsSync(metaFile) ? fs.readFileSync(metaFile, 'utf8') : '') !== revision) {fs.unlinkSync(temp);throw conflict();}
    fs.renameSync(temp, metaFile);
    return {revision: hashText(text), path: rel, title: name, artists: people};
  }
  // The only other write: which presets are in the preferred playlist. Existing narration is never touched.
  function savePlaylist(body) {
    const file = path.join(root, 'scripts/shared/voice-playlists.json');
    if (fs.lstatSync(file).isSymbolicLink()) throw new Error('voice-playlists.json must not be a symlink');
    const before = fs.readFileSync(file, 'utf8');
    if (hashText(before) !== body?.revision) {const e = new Error('Danh sách giọng vừa được sửa ở nơi khác. Hãy tải lại trang.'); e.status = 409; throw e;}
    const presets = (readJson(path.join(root, PRESETS, 'manifest.json')) || {voices: []}).voices;
    const names = body.voiceNames;
    if (!Array.isArray(names) || names.length > presets.length || new Set(names).size !== names.length || names.some(n => !presets.some(v => v.name === n)))
      throw new Error('Danh sách giọng không hợp lệ');
    const data = JSON.parse(before), playlist = data.playlists.find(p => p.id === data.preferredPlaylist) || data.playlists[0];
    if (!playlist) throw new Error('Chưa có playlist giọng');
    playlist.voiceNames = names;
    // Numbers only describe the catalog the names were picked from; TTS is always called by name.
    playlist.selectedFrom = {...playlist.selectedFrom, catalog: path.basename(PRESETS), numbers: names.map(n => presets.findIndex(v => v.name === n) + 1)};
    const text = JSON.stringify(data, null, 2) + '\n';
    const history = path.join(root, 'scripts/shared/.manager-history');
    fs.mkdirSync(history, {recursive: true});
    fs.writeFileSync(path.join(history, `voice-playlists-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.json`), before, {flag: 'wx'});
    const temp = path.join(path.dirname(file), `.voice-playlists-${crypto.randomBytes(8).toString('hex')}.tmp`);
    fs.writeFileSync(temp, text, {flag: 'wx'});
    if (hashText(fs.readFileSync(file, 'utf8')) !== body.revision) {fs.unlinkSync(temp); const e = new Error('Danh sách giọng vừa được sửa ở nơi khác. Hãy tải lại trang.'); e.status = 409; throw e;}
    fs.renameSync(temp, file);
    return {revision: hashText(text), voiceNames: names};
  }
  // Stream only files this library lists.
  function audio(kind, key) {
    if (kind === 'voice') {
      const preset = (readJson(path.join(root, PRESETS, 'manifest.json'))?.voices || []).find(v => v.id === key);
      return preset ? audioFile(`${PRESETS.slice(7)}/${preset.file}`) : null;
    }
    if (kind === 'music') {const m = music(); return [...m.tracks, ...m.unused].some(t => t.path === key) ? audioFile(key) : null;}
    if (kind === 'sfx') return music().effects.some(e => e.path === key) ? audioFile(key) : null;
    return null;
  }
  return {voices, music, audio, savePlaylist, addAudio, updateAudioMeta};
}
module.exports = {createLibrary};
