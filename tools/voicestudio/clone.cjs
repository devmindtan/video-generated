// Voice option 2: clone a voice in the local VoiceStudio (VoxCPM2) from a reference recording the user supplies.
// Only on the user's request, with an explicit consent statement. Output is an audition take next to the
// VieNeu takes (public/<project>/voice-auditions/<take>/); nothing replaces approved narration.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const launcher = require('./launcher.cjs');

const CONSENT = {self: 'Giọng của chính người dùng', permission: 'Người trong bản ghi đã đồng ý cho clone'};
const AUDIO = new Set(['.wav', '.mp3', '.flac', '.m4a', '.ogg']);
const slugOk = s => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s || '');
const sha256 = buf => crypto.createHash('sha256').update(buf).digest('hex');
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

// Segments to synthesise, each becoming one WAV: scenes from audition.json, paragraphs of a text file, or one text.
function segments(root, o) {
  if (o.text) return [{id: 'text', label: 'Lời đọc', text: o.text.trim()}];
  if (o.textFile) {
    const parts = fs.readFileSync(path.resolve(root, o.textFile), 'utf8').split(/\n\s*\n|\r?\n/).map(s => s.trim()).filter(Boolean);
    return parts.map((text, i) => ({id: `part-${String(i + 1).padStart(2, '0')}`, label: `Đoạn ${i + 1}`, text}));
  }
  const file = path.join(root, 'scripts/projects', o.project, 'audition.json');
  if (!fs.existsSync(file)) throw Error(`Tập ${o.project} không có scripts/projects/${o.project}/audition.json; dùng --text hoặc --text-file.`);
  const sentences = JSON.parse(fs.readFileSync(file, 'utf8')).sentences || [];
  const scenes = [...new Set(sentences.map(s => s.scene))].filter(n => Number.isInteger(n)).sort((a, b) => a - b);
  const wanted = o.all ? scenes : [Number(o.scene)];
  if (!o.all && !scenes.includes(wanted[0])) throw Error(`Cảnh ${o.scene} không có trong audition.json (có: ${scenes.join(', ')}).`);
  return wanted.map(n => ({id: `scene-${String(n).padStart(2, '0')}`, label: `Cảnh ${n}`, text: sentences.filter(s => s.scene === n).map(s => s.text.trim()).join(' ')}));
}
function validate(root, o) {
  if (!slugOk(o.project)) throw Error('Thiếu hoặc sai --project <mã tập>.');
  if (!slugOk(o.take)) throw Error('Thiếu hoặc sai --take <tên take mới>, ví dụ clone-v1.');
  if (!CONSENT[o.consent]) throw Error('Cần --consent self (giọng của bạn) hoặc --consent permission (người trong bản ghi đã đồng ý). Không clone giọng người khác khi chưa được phép.');
  if (!o.ref) throw Error('Thiếu --ref <file bản ghi mẫu>.');
  const ref = path.resolve(root, o.ref);
  if (!fs.existsSync(ref) || !fs.statSync(ref).isFile()) throw Error(`Không thấy file bản ghi mẫu: ${o.ref}`);
  if (!AUDIO.has(path.extname(ref).toLowerCase())) throw Error('Bản ghi mẫu phải là WAV, MP3, FLAC, M4A hoặc OGG.');
  if (fs.statSync(ref).size > 50 * 1024 * 1024) throw Error('Bản ghi mẫu quá lớn; chỉ cần 10–30 giây.');
  if (!(o.text || o.textFile || o.all || o.scene)) throw Error('Chọn lời đọc: --scene N, --all, --text "…" hoặc --text-file <file>.');
  const out = path.join(root, 'public', o.project, 'voice-auditions', o.take);
  if (fs.existsSync(out)) throw Error(`Take ${o.take} đã tồn tại; take cũ không bao giờ bị ghi đè. Dùng tên mới.`);
  return {ref, out};
}
// Keep the reference private: copied once by content hash outside Git and outside public/.
function storeReference(root, ref) {
  const buf = fs.readFileSync(ref), hash = sha256(buf), dir = path.join(launcher.paths(root).data, 'references');
  fs.mkdirSync(dir, {recursive: true});
  const kept = path.join(dir, hash.slice(0, 16) + path.extname(ref).toLowerCase());
  if (!fs.existsSync(kept)) fs.writeFileSync(kept, buf, {flag: 'wx'});
  return {buf, hash, kept, name: path.basename(ref)};
}
// multipart/form-data POST /generate through node:http: no client timeout, CPU generation takes minutes.
function generate(base, fields, ref) {
  const boundary = '----vs' + crypto.randomBytes(12).toString('hex'), parts = [];
  for (const [k, v] of Object.entries(fields)) if (v !== undefined && v !== null && v !== '')
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="ref_audio"; filename="reference${path.extname(ref.name)}"\r\nContent-Type: application/octet-stream\r\n\r\n`), ref.buf, Buffer.from(`\r\n--${boundary}--\r\n`));
  const body = Buffer.concat(parts), url = new URL('/generate', base);
  return new Promise((resolve, reject) => {
    const req = http.request(url, {method: 'POST', headers: {'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': body.length}}, res => {
      const chunks = [];res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const data = Buffer.concat(chunks);
        if (res.statusCode !== 200 || !/audio\//.test(res.headers['content-type'] || '')) return reject(Error(`VoiceStudio trả lỗi ${res.statusCode}: ${data.toString('utf8').slice(0, 300)}`));
        resolve({audio: data, audioId: res.headers['x-audio-id'] || null, seed: res.headers['x-seed'] || null, genSeconds: Number(res.headers['x-gen-time']) || null, durationSeconds: Number(res.headers['x-audio-duration']) || null, version: res.headers['x-omnivoice-backend'] || null});
      });
    });
    req.on('error', reject);req.end(body);
  });
}
// Delete VoiceStudio's own history row and WAV for one take (used on the GPU machine: the user keeps no copy there).
function forget(base, id) {
  return new Promise((resolve, reject) => {
    const req = http.request(new URL(`/history/${encodeURIComponent(id)}`, base), {method: 'DELETE'}, res => {
      res.resume();res.on('end', () => res.statusCode === 200 ? resolve() : reject(Error(`HTTP ${res.statusCode}`)));
    });
    req.setTimeout(15000, () => req.destroy(Error('timeout')));req.on('error', reject);req.end();
  });
}
function page(manifest) {
  const cards = manifest.files.map(f => `<section><h2>${esc(f.label)}</h2><p>${esc(f.text)}</p><audio controls preload="none" src="${esc(f.file)}"></audio><p><small>${f.durationSeconds ?? '?'} giây · tạo trong ${f.genSeconds ?? '?'} giây · seed ${esc(f.seed ?? '?')}</small></p></section>`).join('');
  return `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(manifest.project)} · ${esc(manifest.take)}</title>
<style>body{font:15px/1.6 system-ui,sans-serif;max-width:760px;margin:32px auto;padding:0 16px;color:#20362d}section{border:1px solid #dce4dc;border-radius:10px;padding:14px 16px;margin:12px 0}audio{width:100%}small{color:#5d7053}</style>
<h1>Clone giọng · ${esc(manifest.project)} · ${esc(manifest.take)}</h1><p>Lựa chọn 2 (clone). Bản thử để nghe chọn; chưa thay giọng của video. ${esc(CONSENT[manifest.reference.consent])}.</p>${cards}</html>\n`;
}
async function clone(root, o, {base = launcher.URL, ensure = launcher.voiceStudioLauncher(root), probe = launcher.probe, stop = () => launcher.stop(root), log = console.log} = {}) {
  const {ref, out} = validate(root, o), list = segments(root, o);
  if (!list.length || list.some(s => !s.text)) throw Error('Không có lời đọc để tạo.');
  const wasRunning = (await probe()).state === 'ready';
  await ensure();
  const reference = storeReference(root, ref);
  fs.mkdirSync(out, {recursive: true});
  const manifest = {schemaVersion: 1, voiceOption: 2, project: o.project, take: o.take, createdAt: new Date().toISOString(),
    engine: 'voxcpm2', model: 'openbmb/VoxCPM2', language: 'vi', machine: o.gpu ? 'gpu' : 'local', instruct: o.instruct || null,
    reference: {sha256: reference.hash, originalName: reference.name, storedAt: path.relative(root, reference.kept), transcriptProvided: Boolean(o.refText), consent: o.consent},
    status: 'audition — chờ người dùng nghe chọn; chưa áp dụng vào video', files: []};
  try {
    for (const [i, s] of list.entries()) {
      log(`[${i + 1}/${list.length}] ${s.label}: đang tạo (${o.gpu ? 'máy GPU' : 'CPU, có thể mất vài phút'})…`);
      const r = await generate(base, {text: s.text, language: 'vi', engine: 'voxcpm2', ref_text: o.refText, instruct: o.instruct, seed: o.seed, wav_bits: '24'}, reference);
      const file = `${s.id}-clone.wav`;fs.writeFileSync(path.join(out, file), r.audio, {flag: 'wx'});
      if (o.gpu) {
        if (!r.audioId) log('    ! máy GPU không trả mã bản tạo; bản sao trên đó chưa xóa.');
        else await forget(base, r.audioId).catch(e => log(`    ! chưa xóa được bản sao trên máy GPU (${e.message}).`));
      }
      manifest.voiceStudioVersion = r.version;
      manifest.files.push({file, label: s.label, text: s.text, sha256: sha256(r.audio), seed: r.seed, genSeconds: r.genSeconds, durationSeconds: r.durationSeconds});
      fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
      log(`    → ${path.relative(root, path.join(out, file))} (${r.durationSeconds ?? '?'} giây, ${r.genSeconds ?? '?'} giây tạo)`);
    }
    fs.writeFileSync(path.join(out, 'index.html'), page(manifest));
  } finally {
    // Free the memory the model holds (RAM here, VRAM on the GPU machine), unless VoiceStudio was already open.
    if (!wasRunning && !o.keepRunning) await stop();
  }
  return {out, manifest};
}
function parseArgs(argv) {
  const o = {}, flags = {'--all': 'all', '--keep-running': 'keepRunning', '--gpu': 'gpu', '--local': 'local'}, keys = {'--project': 'project', '--take': 'take', '--ref': 'ref', '--ref-text': 'refText', '--consent': 'consent', '--scene': 'scene', '--text': 'text', '--text-file': 'textFile', '--instruct': 'instruct', '--seed': 'seed'};
  for (let i = 0; i < argv.length; i++) {
    if (flags[argv[i]]) o[flags[argv[i]]] = true;
    else if (keys[argv[i]] && i + 1 < argv.length) o[keys[argv[i]]] = argv[++i];
    else throw Error(`Tham số không hiểu: ${argv[i]}`);
  }
  return o;
}
module.exports = {clone, parseArgs, segments, validate, CONSENT};
