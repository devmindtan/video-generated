/* Voice option 2 (clone) against a fake VoiceStudio and a temporary workspace: no model, no real server. */
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), http = require('node:http');
const {clone, parseArgs} = require('./clone.cjs');

async function fixture(t, {fail = false} = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'voice-clone-'));
  const write = (p, v) => {fs.mkdirSync(path.dirname(path.join(root, p)), {recursive: true});fs.writeFileSync(path.join(root, p), v);};
  write('scripts/projects/demo/audition.json', JSON.stringify({sentences: [{scene: 1, text: 'Câu một.'}, {scene: 1, text: 'Câu hai.'}, {scene: 2, text: 'Cảnh hai.'}]}));
  write('my-voice.wav', 'RIFF-reference-bytes');fs.mkdirSync(path.join(root, '.voicestudio/data'), {recursive: true});
  const requests = [], deleted = [];
  const server = http.createServer((req, res) => {
    const chunks = [];req.on('data', c => chunks.push(c));
    req.on('end', () => {
      if (req.method === 'DELETE') {deleted.push(req.url);res.writeHead(200, {'Content-Type': 'application/json'});return res.end('{"deleted":true}');}
      const body = Buffer.concat(chunks).toString('latin1');requests.push(body);
      if (fail && requests.length === 2) {res.writeHead(500);return res.end('engine crashed');}
      res.writeHead(200, {'Content-Type': 'audio/wav', 'x-seed': String(requests.length), 'x-audio-id': 'take' + requests.length, 'x-gen-time': '1.5', 'x-audio-duration': '2.0', 'x-omnivoice-backend': '0.5.7'});
      res.end('RIFF-fake-' + requests.length);
    });
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  t.after(() => {server.close();fs.rmSync(root, {recursive: true, force: true});});
  const calls = {ensure: 0, stop: 0};
  const deps = (running = false) => ({base: `http://127.0.0.1:${server.address().port}/`, ensure: async () => {calls.ensure++;}, probe: async () => ({state: running ? 'ready' : 'off'}), stop: async () => {calls.stop++;}, log: () => {}});
  return {root, requests, deleted, calls, deps};
}
const base = {project: 'demo', take: 'clone-v1', ref: 'my-voice.wav', consent: 'self'};

test('refuses without consent, without text, with an unknown scene or an existing take', async t => {
  const f = await fixture(t);
  await assert.rejects(clone(f.root, {...base, consent: undefined, scene: '1'}, f.deps()), /--consent/);
  await assert.rejects(clone(f.root, {...base, consent: 'yes', scene: '1'}, f.deps()), /--consent/);
  await assert.rejects(clone(f.root, {...base}, f.deps()), /--scene N/);
  await assert.rejects(clone(f.root, {...base, scene: '9'}, f.deps()), /Cảnh 9/);
  await assert.rejects(clone(f.root, {...base, ref: 'missing.wav', scene: '1'}, f.deps()), /bản ghi mẫu/);
  fs.mkdirSync(path.join(f.root, 'public/demo/voice-auditions/clone-v1'), {recursive: true});
  await assert.rejects(clone(f.root, {...base, scene: '1'}, f.deps()), /không bao giờ bị ghi đè/);
  assert.equal(f.requests.length, 0);assert.equal(f.calls.ensure, 0);
});

test('clones every scene into a new take with manifest, page and a private reference copy', async t => {
  const f = await fixture(t);
  const {out, manifest} = await clone(f.root, {...base, all: true, refText: 'Xin chào', instruct: 'chậm rãi'}, f.deps());
  assert.deepEqual(fs.readdirSync(out).sort(), ['index.html', 'manifest.json', 'scene-01-clone.wav', 'scene-02-clone.wav']);
  assert.equal(manifest.files[0].text, 'Câu một. Câu hai.');assert.equal(manifest.voiceOption, 2);assert.equal(manifest.reference.consent, 'self');
  assert.match(f.requests[0], /name="ref_audio"; filename="reference\.wav"[\s\S]*RIFF-reference-bytes/);
  assert.match(f.requests[0], /name="language"\r\n\r\nvi/);assert.match(f.requests[0], /name="engine"\r\n\r\nvoxcpm2/);assert.match(f.requests[0], /name="ref_text"\r\n\r\nXin ch/);
  // The reference is kept by hash outside public/ and outside Git; nothing of it is in the take.
  assert.ok(manifest.reference.storedAt.startsWith('.voicestudio/data/references/'));assert.ok(fs.existsSync(path.join(f.root, manifest.reference.storedAt)));
  assert.ok(!fs.readdirSync(out).some(n => n.includes('reference')));
  assert.match(fs.readFileSync(path.join(out, 'index.html'), 'utf8'), /chưa thay giọng của video/);
  assert.equal(f.calls.stop, 1, 'started by the command, so stopped afterwards');
});

test('text sources, keeps a VoiceStudio the user had open, and leaves a partial manifest on failure', async t => {
  const f = await fixture(t);
  fs.writeFileSync(path.join(f.root, 'lines.txt'), 'Đoạn đầu.\n\nĐoạn sau.\n');
  const r = await clone(f.root, {...base, take: 'clone-file', textFile: 'lines.txt'}, f.deps(true));
  assert.deepEqual(r.manifest.files.map(x => x.file), ['part-01-clone.wav', 'part-02-clone.wav']);assert.equal(f.calls.stop, 0);
  const g = await fixture(t, {fail: true});
  await assert.rejects(clone(g.root, {...base, all: true}, g.deps()), /lỗi 500/);
  const partial = JSON.parse(fs.readFileSync(path.join(g.root, 'public/demo/voice-auditions/clone-v1/manifest.json'), 'utf8'));
  assert.equal(partial.files.length, 1);assert.equal(g.calls.stop, 1, 'stopped even after a failure');
  assert.deepEqual(parseArgs(['--project', 'x', '--all', '--consent', 'permission']), {project: 'x', all: true, consent: 'permission'});
  assert.throws(() => parseArgs(['--bogus']), /không hiểu/);
});

test('on the GPU machine each take is deleted there after it is saved here; locally nothing is deleted', async t => {
  const f = await fixture(t);
  const r = await clone(f.root, {...base, all: true, gpu: true}, f.deps());
  assert.equal(r.manifest.machine, 'gpu');assert.deepEqual(f.deleted, ['/history/take1', '/history/take2']);
  assert.equal(r.manifest.files.length, 2, 'files are kept on the laptop');
  assert.deepEqual(parseArgs(['--gpu', '--local', '--scene', '1']), {gpu: true, local: true, scene: '1'});
  await clone(f.root, {...base, take: 'clone-local', scene: '1'}, f.deps());
  assert.equal(f.deleted.length, 2);
});

test('GPU machine: the lease holder releases instead of stopping, keeping it when --keep-running', async t => {
  const f = await fixture(t), released = [];
  const deps = {...f.deps(), release: async keep => {released.push(keep);}};
  await clone(f.root, {...base, scene: '1', gpu: true}, deps);
  await clone(f.root, {...base, take: 'clone-keep', scene: '1', gpu: true, keepRunning: true}, deps);
  assert.deepEqual(released, [false, true]);assert.equal(f.calls.stop, 0, 'never stops the machine directly');
});
