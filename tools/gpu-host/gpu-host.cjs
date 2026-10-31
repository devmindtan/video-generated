// The user's GPU machine (desktop-kndgm60: Windows + WSL Ubuntu, GTX 1660 SUPER 6 GB) over Tailscale + SSH, shared by
// VoiceStudio clones and the automation runner's Ollama (docs/architecture/gpu-host.md). User rule (2026-10-31): use it
// when it is on, fall back to the laptop only when it is not. Each service stays bound to 127.0.0.1 there; one SSH
// process runs it in the foreground and forwards it to a loopback port here, so nothing is exposed to the tailnet.
// The card holds one of the two models at a time: a service counts as busy-elsewhere while the other one runs.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {spawn, spawnSync} = require('node:child_process');

const SERVICES = {
  voicestudio: {label: 'VoiceStudio', dir: '~/voicestudio-gpu', remotePort: 3900, localPort: 3901, health: '/health',
    // ready / starting / another app, from VoiceStudio's /health body
    read: b => !b || typeof b.status !== 'string' || !('version' in b) ? {state: 'occupied'}
      : {state: b.status === 'ok' ? 'ready' : 'starting', version: b.version, device: b.device || null}},
  ollama: {label: 'Ollama', dir: '~/ollama-gpu', remotePort: 11434, localPort: 11435, health: '/api/version',
    read: b => b && typeof b.version === 'string' ? {state: 'ready', version: b.version, device: 'cuda'} : {state: 'occupied'}},
};
const SSH = ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5'];
const stateDir = root => path.join(root, '.gpu');

function config(root) {
  const file = path.join(stateDir(root), 'host.json');
  if (!fs.existsSync(file)) throw Error('Chưa cấu hình máy GPU: thiếu .gpu/host.json (xem docs/architecture/gpu-host.md).');
  const c = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!/^[A-Za-z0-9._@-]+$/.test(c.host || '')) throw Error('host.json: "host" phải là tên máy SSH, ví dụ desktop-kndgm60.');
  const services = {};
  for (const [id, d] of Object.entries(SERVICES)) {
    const s = {...d, ...(c.services || {})[id]};
    if (!/^[A-Za-z0-9._/~-]+$/.test(s.dir)) throw Error(`host.json: services.${id}.dir phải là thư mục trong WSL, ví dụ ${d.dir}.`);
    if (!Number.isInteger(s.localPort) || s.localPort < 1024 || s.localPort === s.remotePort) throw Error(`host.json: services.${id}.localPort phải khác ${s.remotePort}, ví dụ ${d.localPort}.`);
    services[id] = {...s, id, url: `http://127.0.0.1:${s.localPort}/`, pidFile: path.join(stateDir(root), `${id}-tunnel.pid`),
      log: path.join(stateDir(root), `${id}.log`), leases: path.join(stateDir(root), 'leases')};
  }
  return {host: c.host, services};
}
const service = (root, id) => {
  const s = config(root).services[id];
  if (!s) throw Error(`Dịch vụ GPU không có: ${id}`);
  return s;
};
const remoteBash = (c, cmd) => [c.host, 'wsl', '-e', 'bash', '-lc', `"${cmd}"`];
const alive = pid => {try {process.kill(pid, 0);return true;} catch (e) {return e.code === 'EPERM';}};

function probe(s) {
  return new Promise(resolve => {
    const req = http.get(new URL(s.health, s.url), res => {
      let text = '';res.on('data', c => {if (text.length < 20000) text += c;});
      res.on('end', () => {let b = null;try {b = JSON.parse(text);} catch {}resolve(s.read(b));});
    });
    req.setTimeout(1500, () => req.destroy());req.on('error', () => resolve({state: 'off'}));
  });
}
// One SSH round trip: is the machine on, which services are installed, which ports are listening there.
function remoteState(root) {
  let c;try {c = config(root);} catch (e) {return {reachable: false, reason: e.message};}
  const list = Object.values(c.services);
  const cmd = ['ss -ltnH', ...list.map(s => `test -x ${s.dir}/run.sh && echo INSTALLED:${s.id}`), 'true'].join('; ');
  const r = spawnSync('ssh', [...SSH, ...remoteBash(c, cmd)], {encoding: 'utf8', timeout: 15000});
  if (r.status !== 0) return {reachable: false, reason: `không kết nối được ${c.host}`};
  const out = r.stdout || '', installed = {}, running = {};
  for (const s of list) {
    installed[s.id] = out.split('\n').includes(`INSTALLED:${s.id}`);
    running[s.id] = new RegExp(`127\\.0\\.0\\.1:${s.remotePort}\\s`).test(out);
  }
  return {reachable: true, installed, running};
}
// Which machine a job for `id` should use. --gpu forces the GPU machine (an error instead of falling back),
// --local forces the laptop. Otherwise: GPU when it is on, has the service and the card is not held by the other one.
function pick(root, id, o = {}, check = remoteState) {
  if (o.gpu && o.local) throw Error('Chọn một trong --gpu hoặc --local.');
  if (o.local) return {machine: 'local', reason: 'chọn --local'};
  const st = check(root), other = Object.keys(SERVICES).find(k => k !== id);
  const no = reason => {if (o.gpu) throw Error(`Không dùng được máy GPU: ${reason}.`);return {machine: 'local', reason};};
  if (!st.reachable) return no(st.reason || 'máy GPU không bật');
  if (!st.installed[id]) return no(`máy GPU chưa cài ${SERVICES[id].label}`);
  if (st.running[other]) return no(`máy GPU đang chạy ${SERVICES[other].label} (card 6 GB chỉ chứa một model)`);
  return {machine: 'gpu', reason: 'máy GPU đang bật'};
}
function tunnelPid(s) {
  const pid = Number(fs.existsSync(s.pidFile) && fs.readFileSync(s.pidFile, 'utf8'));
  return pid && alive(pid) ? pid : null;
}
// Leases: each user of a service (a clone, a run, a manual `gpu start`) holds one; the last one out stops it.
function acquire(s, name = String(process.pid)) {
  fs.mkdirSync(s.leases, {recursive: true});
  fs.writeFileSync(path.join(s.leases, `${s.id}-${name}`), new Date().toISOString());
}
function holders(s) {
  if (!fs.existsSync(s.leases)) return [];
  return fs.readdirSync(s.leases).filter(n => n.startsWith(`${s.id}-`)).filter(n => {
    const who = n.slice(s.id.length + 1);
    if (!/^\d+$/.test(who) || alive(Number(who))) return true;
    fs.rmSync(path.join(s.leases, n), {force: true});return false; // holder died
  });
}
async function start(root, id, {lease} = {}) {
  const c = config(root), s = c.services[id];
  acquire(s, lease);
  const now = await probe(s);
  if (now.state === 'ready') return {...now, url: s.url};
  if (now.state === 'occupied') throw Error(`Cổng ${s.localPort} ở máy này đang chạy ứng dụng khác.`);
  let child = null;
  if (!tunnelPid(s)) {
    const log = fs.openSync(s.log, 'a');
    child = spawn('ssh', [...SSH, '-o', 'ExitOnForwardFailure=yes', '-o', 'ServerAliveInterval=30',
      '-L', `127.0.0.1:${s.localPort}:127.0.0.1:${s.remotePort}`, ...remoteBash(c, `${s.dir}/run.sh`)],
    {detached: true, stdio: ['ignore', log, log]});
    fs.closeSync(log);child.unref();fs.writeFileSync(s.pidFile, String(child.pid));
  }
  for (let i = 0; i < 360; i++) {
    await new Promise(r => setTimeout(r, 500));
    const st = await probe(s);
    if (st.state === 'ready') return {...st, url: s.url};
    if (child && child.exitCode !== null) throw Error(`Không mở được ${s.label} trên ${c.host}. Xem .gpu/${id}.log.`);
  }
  throw Error(`${s.label} trên ${c.host} chưa sẵn sàng sau 3 phút. Xem .gpu/${id}.log.`);
}
// Stop the service on the GPU machine (freeing the VRAM) and close the tunnel, whoever still holds it.
async function stop(root, id) {
  const c = config(root), s = c.services[id], r = spawnSync('ssh', [...SSH, ...remoteBash(c, `${s.dir}/stop.sh`)], {encoding: 'utf8', timeout: 60000});
  const pid = tunnelPid(s);
  if (pid) {try {process.kill(pid, 'SIGTERM');} catch {}}
  fs.rmSync(s.pidFile, {force: true});
  for (const n of holders(s)) fs.rmSync(path.join(s.leases, n), {force: true});
  return {remote: (r.stdout || r.stderr || '').trim(), tunnel: Boolean(pid)};
}
// Drop this process's lease; stop the service when nobody else holds one (unless keep is set).
async function release(root, id, {keep = false, lease = String(process.pid)} = {}) {
  const s = service(root, id);
  fs.rmSync(path.join(s.leases, `${id}-${lease}`), {force: true});
  if (keep || holders(s).length) return {stopped: false, holders: holders(s).length};
  return {stopped: true, ...(await stop(root, id))};
}
async function status(root) {
  const c = config(root), out = {host: c.host};
  for (const s of Object.values(c.services)) out[s.id] = {url: s.url, tunnel: Boolean(tunnelPid(s)), holders: holders(s).length, ...(await probe(s))};
  return out;
}
module.exports = {SERVICES, config, service, probe, remoteState, pick, start, stop, release, status, holders};
