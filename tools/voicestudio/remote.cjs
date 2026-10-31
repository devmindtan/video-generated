// VoiceStudio on the user's GPU machine, reached over Tailscale + SSH (docs/voice-workflow.md, "Máy GPU").
// The server stays bound to 127.0.0.1 on that machine; one SSH process runs it in the foreground and maps it to a
// local port here, so the unauthenticated API is never exposed to the tailnet. Config: .voicestudio/remote.json.
const fs = require('node:fs');
const path = require('node:path');
const {spawn, spawnSync} = require('node:child_process');
const launcher = require('./launcher.cjs');

function config(root) {
  const base = launcher.paths(root).base, file = path.join(base, 'remote.json');
  if (!fs.existsSync(file)) throw Error('Chưa cấu hình máy GPU: thiếu .voicestudio/remote.json (xem docs/voice-workflow.md, mục Máy GPU).');
  const c = JSON.parse(fs.readFileSync(file, 'utf8')), localPort = Number(c.localPort || 3901);
  if (!/^[A-Za-z0-9._@-]+$/.test(c.host || '')) throw Error('remote.json: "host" phải là tên máy SSH, ví dụ desktop-kndgm60.');
  if (!/^[A-Za-z0-9._/~-]+$/.test(c.dir || '')) throw Error('remote.json: "dir" phải là thư mục VoiceStudio trong WSL, ví dụ ~/voicestudio-gpu.');
  if (!Number.isInteger(localPort) || localPort < 1024 || localPort === launcher.PORT) throw Error('remote.json: "localPort" phải khác 3900, ví dụ 3901.');
  return {host: c.host, dir: c.dir, localPort, url: `http://127.0.0.1:${localPort}/`,
    pidFile: path.join(base, 'remote-tunnel.pid'), log: path.join(base, 'remote.log')};
}
const SSH = ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10'];
const remoteBash = (c, script) => [c.host, 'wsl', '-e', 'bash', '-lc', `"${c.dir}/${script}"`];
function tunnelPid(c) {
  const pid = Number(fs.existsSync(c.pidFile) && fs.readFileSync(c.pidFile, 'utf8'));
  if (!pid) return null;
  try {process.kill(pid, 0);} catch {return null;}
  return pid;
}
async function start(root) {
  const c = config(root), now = await launcher.probe(c.url);
  if (now.state === 'ready') return {ready: true, url: c.url, version: now.version, device: now.device};
  if (now.state === 'occupied') throw Error(`Cổng ${c.localPort} ở máy này đang chạy ứng dụng khác.`);
  let child = null;
  if (!tunnelPid(c)) {
    const log = fs.openSync(c.log, 'a');
    child = spawn('ssh', [...SSH, '-o', 'ExitOnForwardFailure=yes', '-o', 'ServerAliveInterval=30',
      '-L', `127.0.0.1:${c.localPort}:127.0.0.1:${launcher.PORT}`, ...remoteBash(c, 'run.sh')],
    {detached: true, stdio: ['ignore', log, log]});
    fs.closeSync(log);child.unref();fs.writeFileSync(c.pidFile, String(child.pid));
  }
  for (let i = 0; i < 360; i++) {
    await new Promise(r => setTimeout(r, 500));
    const s = await launcher.probe(c.url);
    if (s.state === 'ready') return {ready: true, url: c.url, version: s.version, device: s.device};
    if (child && child.exitCode !== null) throw Error(`Không mở được VoiceStudio trên ${c.host}. Xem .voicestudio/remote.log.`);
  }
  throw Error(`VoiceStudio trên ${c.host} chưa sẵn sàng sau 3 phút. Xem .voicestudio/remote.log.`);
}
// Stop the server (and its engine sidecars) on the GPU machine, then the local tunnel.
async function stop(root) {
  const c = config(root), r = spawnSync('ssh', [...SSH, ...remoteBash(c, 'stop.sh')], {encoding: 'utf8', timeout: 60000});
  const pid = tunnelPid(c);
  if (pid) {try {process.kill(pid, 'SIGTERM');} catch {}}
  fs.rmSync(c.pidFile, {force: true});
  return {remote: (r.stdout || r.stderr || '').trim(), tunnel: Boolean(pid)};
}
// Whether the GPU machine answers over SSH and has the runtime (a quick check, a few seconds at most).
function reachable(root) {
  let c;try {c = config(root);} catch {return false;}
  const r = spawnSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5', c.host, 'wsl', '-e', 'bash', '-lc', `"test -x ${c.dir}/run.sh"`], {timeout: 15000});
  return r.status === 0;
}
// User rule (2026-10-31): clone on the GPU machine; run locally only when it is not on. --gpu/--local force one side.
function pickMachine(root, o, check = reachable) {
  if (o.gpu && o.local) throw Error('Chọn một trong --gpu hoặc --local.');
  if (o.local) return 'local';
  if (o.gpu || check(root)) return 'gpu';
  return 'local';
}
async function status(root) {
  const c = config(root), now = await launcher.probe(c.url);
  return {host: c.host, url: c.url, tunnel: Boolean(tunnelPid(c)), state: now.state, version: now.version || null, device: now.device || null};
}
module.exports = {config, start, stop, status, reachable, pickMachine};
