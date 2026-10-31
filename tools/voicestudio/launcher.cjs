// Local VoiceStudio (repos/debpalash--VoiceStudio, runtime checkout in .voicestudio/app).
// Loopback only, analytics off, data in .voicestudio/data. Starting it never downloads a model:
// models are fetched only when the user chooses one inside VoiceStudio.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');

const PORT = 3900, HOST = '127.0.0.1', URL = `http://${HOST}:${PORT}/`;

function paths(root) {
  const base = path.join(root, '.voicestudio');
  return {base, app: path.join(base, 'app'), data: path.join(base, 'data'), python: path.join(base, 'app/.venv/bin/python'),
    web: path.join(base, 'app/frontend/dist/index.html'), log: path.join(base, 'server.log')};
}
// What VoiceStudio is running on the port: off, starting, ready, or another app.
function probe(base = URL) {
  return new Promise(resolve => {
    const req = http.get(new globalThis.URL('/health', base), res => {
      let text = '';
      res.on('data', c => {if (text.length < 20000) text += c;});
      res.on('end', () => {
        let body = null;try {body = JSON.parse(text);} catch {}
        if (!body || typeof body.status !== 'string' || !('version' in body)) return resolve({state: 'occupied'});
        resolve({state: body.status === 'ok' ? 'ready' : 'starting', version: body.version, device: body.device || null, step: body.label || null});
      });
    });
    req.setTimeout(1500, () => req.destroy());
    req.on('error', () => resolve({state: 'off'}));
  });
}
function installed(root) {
  const p = paths(root), missing = [];
  if (!fs.existsSync(p.python)) missing.push('môi trường Python (.voicestudio/app/.venv)');
  if (!fs.existsSync(p.web)) missing.push('giao diện web (.voicestudio/app/frontend/dist)');
  return missing;
}
function environment(root) {
  const p = paths(root);
  return {PATH: process.env.PATH, HOME: process.env.HOME, LANG: process.env.LANG || 'C.UTF-8', PYTHONUNBUFFERED: '1',
    OMNIVOICE_DATA_DIR: p.data, HF_HOME: path.join(p.data, 'huggingface'), OMNIVOICE_ANALYTICS_DISABLED: '1', OMNIVOICE_BIND_HOST: HOST, OMNIVOICE_PORT: String(PORT),
    OMNIVOICE_DEVICE: 'cpu', OMNIVOICE_TORCH_VARIANT: 'cpu'};
}
function voiceStudioLauncher(root) {
  let starting = null;
  return async function ensure() {
    if (starting) return starting;
    starting = (async () => {
      const now = await probe();
      if (now.state === 'ready') return now;
      if (now.state === 'occupied') throw Error(`Cổng ${PORT} đang chạy ứng dụng khác. Hãy giải phóng cổng trước khi mở Studio giọng nói.`);
      if (now.state === 'off') {
        const missing = installed(root);
        if (missing.length) throw Error(`VoiceStudio chưa cài đủ: thiếu ${missing.join(', ')}. Xem docs/voice-workflow.md.`);
        const p = paths(root);fs.mkdirSync(p.data, {recursive: true});
        const log = fs.openSync(p.log, 'a');
        const child = spawn(p.python, ['-m', 'uvicorn', 'main:app', '--app-dir', 'backend', '--host', HOST, '--port', String(PORT)],
          {cwd: p.app, env: environment(root), detached: true, stdio: ['ignore', log, log]});
        fs.closeSync(log);let failure;child.on('error', e => failure = e);child.unref();
        for (let i = 0; i < 240; i++) {
          if (failure) throw failure;
          await new Promise(r => setTimeout(r, 500));
          const s = await probe();if (s.state === 'ready') return s;
          if (s.state === 'occupied') throw Error(`Cổng ${PORT} vừa bị ứng dụng khác chiếm.`);
          if (child.exitCode !== null) throw Error('VoiceStudio dừng khi khởi động. Xem .voicestudio/server.log.');
        }
        throw Error('VoiceStudio chưa sẵn sàng sau 2 phút. Xem .voicestudio/server.log rồi thử lại.');
      }
      // Already starting (opened from elsewhere): wait for it.
      for (let i = 0; i < 240; i++) {await new Promise(r => setTimeout(r, 500));const s = await probe();if (s.state === 'ready') return s;}
      throw Error('VoiceStudio đang khởi động quá lâu. Xem .voicestudio/server.log.');
    })();
    try {const s = await starting;return {ready: true, url: URL, version: s.version, device: s.device};} finally {starting = null;}
  };
}
// Processes started from this runtime: cwd inside .voicestudio (the server and its engine sidecars).
function processes(root) {
  let base;try {base = fs.realpathSync(paths(root).base);} catch {return [];}
  const found = [];
  for (const pid of fs.readdirSync('/proc').filter(n => /^\d+$/.test(n))) {
    let cwd = '';try {cwd = fs.readlinkSync(`/proc/${pid}/cwd`);} catch {continue;}
    if (cwd !== base && !cwd.startsWith(base + path.sep)) continue;
    let rss = 0;try {rss = Number(fs.readFileSync(`/proc/${pid}/status`, 'utf8').match(/^VmRSS:\s+(\d+) kB/m)?.[1] || 0) * 1024;} catch {}
    found.push({pid: Number(pid), rss});
  }
  return found;
}
function activeEngine() {
  return new Promise(resolve => {
    const req = http.get(`http://${HOST}:${PORT}/engines/tts`, res => {
      let text = '';res.on('data', c => {if (text.length < 400000) text += c;});
      res.on('end', () => {try {const d = JSON.parse(text), b = (d.backends || []).find(x => x.id === d.active);resolve(b ? {id: b.id, name: b.display_name || b.id} : d.active ? {id: d.active, name: d.active} : null);} catch {resolve(null);}});
    });
    req.setTimeout(2000, () => req.destroy());req.on('error', () => resolve(null));
  });
}
// Read-only snapshot for the manager: server state, engine and memory used by this runtime.
async function status(root) {
  const now = await probe(), procs = processes(root);
  return {state: now.state, version: now.version || null, device: now.device || null, step: now.step || null, url: URL,
    engine: now.state === 'ready' ? await activeEngine() : null, processes: procs.length,
    memoryBytes: procs.reduce((n, p) => n + p.rss, 0), missing: installed(root)};
}
// Stop only this runtime's processes; wait for them to exit, then force any that remain.
async function stop(root, {graceMs = 8000} = {}) {
  const procs = processes(root);
  for (const p of procs) {try {process.kill(p.pid, 'SIGTERM');} catch {}}
  const alive = () => procs.filter(p => {try {process.kill(p.pid, 0);return true;} catch {return false;}});
  for (let waited = 0; waited < graceMs && alive().length; waited += 250) await new Promise(r => setTimeout(r, 250));
  const forced = alive();for (const p of forced) {try {process.kill(p.pid, 'SIGKILL');} catch {}}
  return {stopped: procs.length, forced: forced.length};
}
module.exports = {voiceStudioLauncher, probe, installed, paths, status, stop, URL, PORT};

if (require.main === module) {
  const root = path.resolve(__dirname, '../..'), [command = 'status', ...rest] = process.argv.slice(2);
  (async () => {
    if (command === 'start') {const r = await voiceStudioLauncher(root)();console.log(`VoiceStudio ${r.version} sẵn sàng tại ${r.url} (${r.device || 'cpu'}). Log: .voicestudio/server.log`);}
    else if (command === 'stop') {const s = await stop(root);console.log(s.stopped ? `Đã dừng ${s.stopped} tiến trình VoiceStudio${s.forced ? ` (${s.forced} phải buộc dừng)` : ''}.` : 'VoiceStudio không chạy.');}
    else if (command === 'status') console.log(JSON.stringify(await status(root), null, 2));
    else if (command === 'gpu') {
      const gpu = require('../gpu-host/gpu-host.cjs'), [sub = 'status'] = rest;
      if (sub === 'start') {const r = await gpu.start(root, 'voicestudio', {lease: 'manual'});console.log(`VoiceStudio ${r.version} trên máy GPU sẵn sàng tại ${r.url} (${r.device || '?'}). Tắt bằng: npm run voicestudio -- gpu stop`);}
      else if (sub === 'stop') {const r = await gpu.stop(root, 'voicestudio');console.log(r.remote || 'Đã dừng.');}
      else if (sub === 'status') console.log(JSON.stringify((await gpu.status(root)).voicestudio, null, 2));
      else throw Error('Usage: npm run voicestudio -- gpu start|status|stop');
    }
    else if (command === 'clone') {
      const {clone, parseArgs} = require('./clone.cjs'), gpu = require('../gpu-host/gpu-host.cjs'), o = parseArgs(rest);
      const done = r => console.log(`Xong: ${r.manifest.files.length} file trong ${path.relative(root, r.out)}. Mở index.html để nghe; đây là take thử, chưa thay giọng của video.`);
      const local = reason => {console.log(`Clone trên máy này (CPU, chậm): ${reason}.`);return clone(root, {...o, gpu: false});};
      const choice = gpu.pick(root, 'voicestudio', o);
      if (choice.machine === 'local') return done(await local(choice.reason));
      console.log('Clone trên máy GPU.');
      const s = gpu.service(root, 'voicestudio');
      let started = false;
      const deps = {base: s.url, probe: () => gpu.probe(s), release: keep => gpu.release(root, 'voicestudio', {keep}),
        ensure: async () => {await gpu.start(root, 'voicestudio');started = true;}};
      try {done(await clone(root, {...o, gpu: true}, deps));}
      catch (e) {
        // Backup: the GPU machine answered but VoiceStudio did not come up there; nothing was written yet.
        if (started || o.gpu) throw e;
        await gpu.release(root, 'voicestudio').catch(() => {});
        done(await local(`không bật được VoiceStudio trên máy GPU (${e.message})`));
      }
    }
    else throw Error('Usage: npm run voicestudio -- start|status|stop|clone|gpu (xem docs/voice-workflow.md)');
  })().catch(e => {console.error(e.message);process.exitCode = 1;});
}
