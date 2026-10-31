/* GPU machine choice, config validation and leases, without SSH or a real machine. */
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const gpu = require('./gpu-host.cjs');

function workspace(t, host) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gpu-host-'));t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  if (host) {fs.mkdirSync(path.join(root, '.gpu'));fs.writeFileSync(path.join(root, '.gpu/host.json'), JSON.stringify(host));}
  return root;
}
const on = (running = {}) => () => ({reachable: true, installed: {voicestudio: true, ollama: true}, running: {voicestudio: false, ollama: false, ...running}});

test('config: host and per-service overrides are validated before any SSH command is built', t => {
  assert.throws(() => gpu.config(workspace(t)), /host\.json/);
  assert.throws(() => gpu.config(workspace(t, {host: 'gpu; rm -rf /'})), /host/);
  assert.throws(() => gpu.config(workspace(t, {host: 'h', services: {ollama: {dir: '~/x" & calc'}}})), /ollama\.dir/);
  assert.throws(() => gpu.config(workspace(t, {host: 'h', services: {ollama: {localPort: 11434}}})), /localPort/);
  const c = gpu.config(workspace(t, {host: 'desktop-kndgm60'}));
  assert.equal(c.services.voicestudio.url, 'http://127.0.0.1:3901/');assert.equal(c.services.ollama.url, 'http://127.0.0.1:11435/');
});

test('pick: GPU when it is on; laptop when it is off, lacks the service or the card is held by the other model', () => {
  assert.equal(gpu.pick('/x', 'ollama', {}, on()).machine, 'gpu');
  assert.equal(gpu.pick('/x', 'voicestudio', {}, on()).machine, 'gpu');
  assert.match(gpu.pick('/x', 'ollama', {}, () => ({reachable: false, reason: 'không kết nối được h'})).reason, /không kết nối/);
  assert.match(gpu.pick('/x', 'ollama', {}, on({voicestudio: true})).reason, /đang chạy VoiceStudio/);
  assert.equal(gpu.pick('/x', 'voicestudio', {}, on({ollama: true})).machine, 'local');
  assert.equal(gpu.pick('/x', 'ollama', {}, () => ({reachable: true, installed: {ollama: false}, running: {}})).machine, 'local');
  assert.equal(gpu.pick('/x', 'ollama', {local: true}, on()).machine, 'local');
  assert.throws(() => gpu.pick('/x', 'ollama', {gpu: true}, on({voicestudio: true})), /Không dùng được máy GPU/);
  assert.throws(() => gpu.pick('/x', 'ollama', {gpu: true, local: true}, on()), /một trong/);
});

test('leases: a live holder keeps the service for others, dead holders are dropped', t => {
  const root = workspace(t, {host: 'h'}), s = gpu.service(root, 'ollama');
  fs.mkdirSync(s.leases, {recursive: true});
  fs.writeFileSync(path.join(s.leases, 'ollama-manual'), '');
  fs.writeFileSync(path.join(s.leases, `ollama-${process.pid}`), '');
  fs.writeFileSync(path.join(s.leases, 'ollama-999999999'), '');
  fs.writeFileSync(path.join(s.leases, 'voicestudio-manual'), '');
  assert.deepEqual(gpu.holders(s).sort(), ['ollama-manual', `ollama-${process.pid}`].sort());
  assert.ok(!fs.existsSync(path.join(s.leases, 'ollama-999999999')));
});
