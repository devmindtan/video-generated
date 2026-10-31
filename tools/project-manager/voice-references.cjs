// Voice reference recordings for future cloning (voice option 2). The user adds a recording with the
// speaker's name and a consent statement; the page shows its waveform, suggests the cleanest 15 s and cuts
// clips the clone command can use later. Once a clip is saved the full recording is deleted (user 2026-10-31):
// only the short clips are kept. Everything stays private in library/voice-references/ (Git-ignored);
// nothing is cloned or uploaded from here, and existing files are never overwritten.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {spawn} = require('node:child_process');

const DIR = 'library/voice-references';
const TYPES = new Set(['.wav', '.mp3', '.m4a', '.ogg', '.flac']);
const MAX_BYTES = 500 * 1024 * 1024;
const CONSENT = {self: 'Giọng của tôi', permission: 'Người trong bản ghi đã đồng ý cho clone'};
const RATE = 8000, PEAKS = 900;
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const slugOf = text => String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'ban-ghi';
const signature = (head, ext) => ({'.wav': head.toString('latin1', 0, 4) === 'RIFF' && head.toString('latin1', 8, 12) === 'WAVE',
  '.mp3': head.toString('latin1', 0, 3) === 'ID3' || (head[0] === 0xff && (head[1] & 0xe0) === 0xe0), '.flac': head.toString('latin1', 0, 4) === 'fLaC',
  '.ogg': head.toString('latin1', 0, 4) === 'OggS', '.m4a': head.toString('latin1', 4, 8) === 'ftyp'})[ext];

function createVoiceReferences(root, {ffmpeg = path.join(root, 'node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg')} = {}) {
  root = fs.realpathSync(root);
  const base = path.join(root, DIR);
  const safeDir = (folder, parent, create = false) => {
    if (create) fs.mkdirSync(folder, {recursive: true});
    if (!fs.existsSync(folder) || fs.lstatSync(folder).isSymbolicLink()) throw new Error('Thư mục bản ghi không an toàn');
    const real = fs.realpathSync(folder), realParent = fs.realpathSync(parent);
    if (real !== realParent && !real.startsWith(realParent + path.sep)) throw new Error('Thư mục bản ghi vượt khỏi workspace');
    return real;
  };
  const safeFile = (folder, name, nested = '') => {
    if (typeof name !== 'string' || name !== path.basename(name)) return null;
    const parent = nested ? safeDir(path.join(folder, nested), folder) : folder, file = path.join(parent, name);
    if (!fs.existsSync(file) || fs.lstatSync(file).isSymbolicLink() || !fs.lstatSync(file).isFile()) return null;
    const real = fs.realpathSync(file);return real.startsWith(fs.realpathSync(folder) + path.sep) ? real : null;
  };
  const run = args => new Promise((resolve, reject) => {
    const child = spawn(ffmpeg, ['-v', 'error', ...args], {env: {LD_LIBRARY_PATH: path.dirname(ffmpeg)}});
    const out = [], err = [];
    child.stdout.on('data', c => out.push(c));child.stderr.on('data', c => err.push(c));
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve(Buffer.concat(out)) : reject(new Error('Không đọc được file âm thanh: ' + Buffer.concat(err).toString().trim().split('\n').pop())));
  });
  const folderOf = id => {
    if (typeof id !== 'string' || !/^[a-z0-9-]{1,64}$/.test(id)) throw new Error('Mã bản ghi không hợp lệ');
    const realBase = safeDir(base, root), folder = safeDir(path.join(realBase, id), realBase);
    if (!safeFile(folder, 'reference.json')) throw new Error('Không tìm thấy bản ghi');
    return folder;
  };
  const readMetaText = folder => fs.readFileSync(safeFile(folder, 'reference.json') || (() => {throw new Error('Metadata bản ghi không an toàn');})(), 'utf8');
  const readMeta = folder => JSON.parse(readMetaText(folder));
  const writeMeta = (folder, meta) => {
    const temp = path.join(folder, `.reference-${crypto.randomBytes(6).toString('hex')}.tmp`);
    fs.writeFileSync(temp, JSON.stringify(meta, null, 2) + '\n', {flag: 'wx'});fs.renameSync(temp, path.join(folder, 'reference.json'));
  };
  // Decode to 8 kHz mono PCM once: duration, a waveform and the window of `seconds` with the fewest pauses.
  async function analyse(file, seconds = 15) {
    const wav = await run(['-i', file, '-ac', '1', '-ar', String(RATE), '-c:a', 'pcm_s16le', '-f', 'wav', '-']);
    const at = wav.indexOf('data', 12);if (at < 0) throw new Error('Không đọc được dữ liệu âm thanh');
    const pcm = wav.subarray(at + 8), samples = Math.floor(pcm.length / 2), duration = samples / RATE;
    if (duration < 3) throw new Error('Bản ghi quá ngắn; cần ít nhất vài giây giọng nói');
    const hop = RATE / 20, frames = Math.floor(samples / hop), rms = new Float64Array(frames);
    for (let f = 0; f < frames; f++) {let s = 0;for (let i = 0; i < hop; i++) {const v = pcm.readInt16LE((f * hop + i) * 2) / 32768;s += v * v;}rms[f] = Math.sqrt(s / hop);}
    const max = Math.max(...rms, 1e-9), peaks = [], per = frames / PEAKS;
    for (let p = 0; p < PEAKS; p++) {let m = 0;for (let f = Math.floor(p * per); f < Math.min(frames, Math.floor((p + 1) * per)); f++) m = Math.max(m, rms[f]);peaks.push(Math.round(m / max * 100));}
    const silent = Array.from(rms, v => 20 * Math.log10(v / max + 1e-9) < -35 ? 1 : 0), win = Math.min(frames, seconds * 20);
    let best = null, sum = silent.slice(0, win).reduce((a, b) => a + b, 0);
    for (let s = 0; s + win <= frames; s++) {
      if (s) sum += silent[s + win - 1] - silent[s - 1];
      // Fewest pauses inside; starting or ending mid-speech (a cut word) costs a little extra.
      const score = sum / win + (silent[s] ? 0 : .15) + (silent[s + win - 1] ? 0 : .15);
      if (s % 2 === 0 && (!best || score < best.score)) best = {score, start: s / 20, silence: sum / win};
    }
    // Skip leading silence so the clip starts just before speech (0.15 s of air kept).
    let first = Math.round(best.start * 20);while (first < frames - win && silent[first] && silent[first + 1]) first++;
    if (first > Math.round(best.start * 20) + 3) best.start = Math.max(0, first - 3) / 20;
    return {durationSeconds: Math.round(duration * 100) / 100, peaks, suggestion: {startSeconds: Math.round(best.start * 10) / 10, durationSeconds: Math.min(seconds, Math.floor(duration)), silenceRatio: Math.round(best.silence * 100) / 100}};
  }
  // Projects whose clone takes were made from a clip: clone manifests record the reference's SHA-256.
  function cloneUsage() {
    const usage = new Map(), pub = path.join(root, 'public');
    for (const slug of fs.existsSync(pub) ? fs.readdirSync(pub) : []) {
      const dir = path.join(pub, slug, 'voice-auditions');
      if (!fs.existsSync(dir)) continue;
      for (const take of fs.readdirSync(dir)) {
        let m;try {m = JSON.parse(fs.readFileSync(path.join(dir, take, 'manifest.json'), 'utf8'));} catch {continue;}
        const hash = m?.reference?.sha256;if (!hash) continue;
        if (!usage.has(hash)) usage.set(hash, []);
        if (!usage.get(hash).includes(slug)) usage.get(hash).push(slug);
      }
    }
    return usage;
  }
  function list() {
    if (!fs.existsSync(base)) return {references: []};
    const realBase = safeDir(base, root);
    const usage = cloneUsage();
    const references = fs.readdirSync(realBase).filter(n => /^[a-z0-9-]+$/.test(n)).map(n => {
      const folder = folderOf(n), text = readMetaText(folder), meta = JSON.parse(text), hasSource = Boolean(meta.file) && Boolean(safeFile(folder, meta.file));
      return {...meta, revision: sha(text), hasSource, consentLabel: CONSENT[meta.consent], clips: (meta.clips || []).filter(c => safeFile(folder, c.file, 'clips'))
        .map(c => ({...c, path: `${DIR}/${n}/clips/${c.file}`, usedBy: usage.get(c.sha256) || []}))};
    });
    references.sort((a, b) => String(b.addedAt).localeCompare(String(a.addedAt)));
    return {references, folder: DIR};
  }
  async function add({name, speaker, consent, title}, request) {
    const ext = path.extname(String(name || '')).toLowerCase();
    if (typeof name !== 'string' || name !== path.basename(name) || name.length > 180 || /[\x00-\x1f\\/]/.test(name) || !TYPES.has(ext)) throw new Error('Chỉ nhận file WAV, MP3, M4A, OGG hoặc FLAC có tên hợp lệ');
    if (!CONSENT[consent]) throw new Error('Cần xác nhận đây là giọng của bạn, hoặc người trong bản ghi đã đồng ý cho clone');
    const who = String(speaker || '').trim().slice(0, 120);if (!who) throw new Error('Ghi tên người nói trong bản ghi');
    const realBase = safeDir(base, root, true);
    const temp = path.join(realBase, `.upload-${crypto.randomUUID()}`), handle = await fs.promises.open(temp, 'wx'), hash = crypto.createHash('sha256');
    let size = 0, head = Buffer.alloc(0);
    try {
      for await (const chunk of request) {size += chunk.length;if (size > MAX_BYTES) throw new Error('Bản ghi tối đa 500 MB');if (head.length < 16) head = Buffer.concat([head, chunk]).subarray(0, 16);hash.update(chunk);await handle.write(chunk);}
      await handle.close();
      if (!size) throw new Error('File rỗng');if (!signature(head, ext)) throw new Error('Nội dung file không phải ' + ext.slice(1).toUpperCase() + ' hợp lệ');
      const digest = hash.digest('hex');
      for (const r of list().references) if (r.sha256 === digest) {const e = new Error(`Bản ghi này đã có (“${r.title}”).`);e.status = 409;throw e;}
      const label = String(title || '').trim().slice(0, 160) || path.basename(name, ext);
      let id = slugOf(label), n = 2;while (fs.existsSync(path.join(realBase, id))) id = `${slugOf(label)}-${n++}`;
      const folder = path.join(realBase, id);fs.mkdirSync(path.join(folder, 'clips'), {recursive: true});
      const source = path.join(folder, 'source' + ext);fs.renameSync(temp, source);
      let info;try {info = await analyse(source);} catch (e) {fs.rmSync(folder, {recursive: true, force: true});throw e;}
      const meta = {id, title: label, speaker: who, consent, originalName: name, file: 'source' + ext, sha256: digest, bytes: size, addedAt: new Date().toISOString(), ...info, clips: []};
      writeMeta(folder, meta);return {...meta, consentLabel: CONSENT[consent]};
    } catch (e) {await handle.close().catch(() => {});if (fs.existsSync(temp)) fs.unlinkSync(temp);throw e;}
  }
  // Cut one clip (default 15 s) to 48 kHz mono PCM24 for the clone command. Same start/length → same clip.
  async function cut({id, startSeconds, durationSeconds = 15}) {
    const folder = folderOf(id), meta = readMeta(folder), start = Number(startSeconds), length = Number(durationSeconds);
    const source = meta.file && safeFile(folder, meta.file);
    if (!source) throw new Error('File gốc đã được xóa sau lần cắt trước; thêm lại bản ghi nếu cần cắt đoạn khác');
    if (!Number.isFinite(start) || start < 0 || !Number.isFinite(length) || length < 5 || length > 30) throw new Error('Đoạn mẫu dài 5–30 giây, bắt đầu từ 0 trở đi');
    if (start + length > meta.durationSeconds + .05) throw new Error('Đoạn chọn vượt quá độ dài bản ghi');
    const clips = safeDir(path.join(folder, 'clips'), folder), name = `${String(Math.round(start * 10)).padStart(6, '0')}-${Math.round(length)}s.wav`, dest = path.join(clips, name);
    const existing = (meta.clips || []).find(c => c.file === name && fs.existsSync(dest));if (existing) return {...existing, path: `${DIR}/${id}/clips/${name}`, existed: true};
    if (fs.existsSync(dest)) throw new Error('Đã có file trùng tên; kiểm tra thư mục bản ghi');
    const temp = path.join(clips, `.cut-${crypto.randomUUID()}.wav`);
    await run(['-ss', String(start), '-t', String(length), '-i', source, '-vn', '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s24le', '-f', 'wav', temp]);
    fs.linkSync(temp, dest);fs.unlinkSync(temp);
    const clip = {file: name, startSeconds: start, durationSeconds: length, sha256: sha(fs.readFileSync(dest)), createdAt: new Date().toISOString()};
    // Only the clip is needed for cloning; delete the full recording (user request 2026-10-31).
    const fresh = readMeta(folder);fresh.clips = [...(fresh.clips || []), clip];
    const original = safeFile(folder, fresh.file);fresh.file = null;fresh.sourceDeletedAt = new Date().toISOString();delete fresh.peaks;
    writeMeta(folder, fresh);if (original) fs.rmSync(original, {force: true});
    return {...clip, path: `${DIR}/${id}/clips/${name}`, sourceDeleted: true};
  }
  // Edit human-readable metadata and the private clip filename. The folder id and audio bytes stay stable;
  // a revision binds the form to the reference.json version the user opened.
  function update({id, title, speaker, consent, clipFile, fileName, revision}) {
    const folder = folderOf(id), before = readMetaText(folder), conflict = () => Object.assign(new Error('Bản ghi vừa được sửa ở nơi khác. Hãy tải lại trang.'), {status: 409});
    if (sha(before) !== revision) throw conflict();
    const meta = JSON.parse(before), cleanTitle = String(title || '').trim(), cleanSpeaker = String(speaker || '').trim();
    if (!cleanTitle || cleanTitle.length > 160) throw new Error('Tên bản ghi cần từ 1 đến 160 ký tự');
    if (!cleanSpeaker || cleanSpeaker.length > 120) throw new Error('Tên người nói cần từ 1 đến 120 ký tự');
    if (!CONSENT[consent]) throw new Error('Chọn xác nhận quyền sử dụng giọng');
    let oldPath = null, newPath = null;
    if (clipFile != null || fileName != null) {
      const clip = (meta.clips || []).find(c => c.file === clipFile);
      if (!clip || !safeFile(folder, clip.file, 'clips')) throw new Error('Không tìm thấy đoạn mẫu cần đổi tên');
      const next = String(fileName || '').trim();
      if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}\.wav$/.test(next)) throw new Error('Tên file dùng chữ, số, dấu chấm, gạch ngang hoặc gạch dưới và kết thúc bằng .wav');
      if (next !== clip.file) {
        const clips = safeDir(path.join(folder, 'clips'), folder);oldPath = safeFile(folder, clip.file, 'clips');newPath = path.join(clips, next);
        if (fs.existsSync(newPath)) throw new Error('Tên file này đã tồn tại trong bản ghi');
        clip.file = next;
      }
    }
    meta.title = cleanTitle;meta.speaker = cleanSpeaker;meta.consent = consent;meta.updatedAt = new Date().toISOString();
    const text = JSON.stringify(meta, null, 2) + '\n', temp = path.join(folder, `.reference-${crypto.randomBytes(6).toString('hex')}.tmp`);
    fs.writeFileSync(temp, text, {flag: 'wx'});
    if (sha(readMetaText(folder)) !== revision) {fs.unlinkSync(temp);throw conflict();}
    const history = safeDir(path.join(folder, '.manager-history'), folder, true);
    fs.writeFileSync(path.join(history, `reference-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.json`), before, {flag: 'wx'});
    try {
      if (oldPath) fs.renameSync(oldPath, newPath);
      fs.renameSync(temp, path.join(folder, 'reference.json'));
    } catch (error) {
      if (oldPath && fs.existsSync(newPath) && !fs.existsSync(oldPath)) fs.renameSync(newPath, oldPath);
      if (fs.existsSync(temp)) fs.unlinkSync(temp);
      throw error;
    }
    return {id, title: cleanTitle, speaker: cleanSpeaker, consent, consentLabel: CONSENT[consent], fileName: fileName || null, revision: sha(text)};
  }
  // Stream only a listed recording or clip.
  function audio(kind, key) {
    try {
      if (kind === 'reference') {const folder = folderOf(key), file = readMeta(folder).file;return file && safeFile(folder, file);}
      if (kind === 'reference-clip') {const [id, file] = String(key).split('/');const folder = folderOf(id);return (readMeta(folder).clips || []).some(c => c.file === file) ? safeFile(folder, file, 'clips') : null;}
    } catch {return null;}
    return null;
  }
  return {voiceReferences: list, addVoiceReference: add, cutVoiceReference: cut, updateVoiceReference: update, referenceAudio: audio};
}
module.exports = {createVoiceReferences, CONSENT};
