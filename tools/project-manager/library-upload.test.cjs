/* Copying music/SFX into the shared audio library, against a temporary workspace (never the real one). */
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const {Readable} = require('node:stream');
const {createLibrary} = require('./library.cjs');

function workspace(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'audio-library-'));
  fs.mkdirSync(path.join(root, 'series'), {recursive: true});
  fs.mkdirSync(path.join(root, 'public'), {recursive: true});
  fs.mkdirSync(path.join(root, 'scripts/shared'), {recursive: true});
  fs.writeFileSync(path.join(root, 'series/catalog.json'), JSON.stringify({series: []}));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  return {root, lib: createLibrary(root)};
}
const wav = (n = 64) => Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WAVE'), Buffer.alloc(n)]);
const body = buf => Readable.from([buf]);

test('copies music and SFX into the shared library with optional credit, listed and playable', async t => {
  const {root, lib} = workspace(t);
  const m = await lib.addAudio({kind: 'music', name: 'Bản nhạc mới.wav', title: 'Bản nhạc mới', artists: 'Tác giả A, Tác giả B'}, body(wav()));
  assert.equal(m.path, 'audio-library/music/Bản nhạc mới.wav');
  const s = await lib.addAudio({kind: 'sfx', name: 'gio.mp3'}, body(Buffer.concat([Buffer.from('ID3'), Buffer.alloc(32)])));
  assert.equal(s.path, 'audio-library/sfx/gio.mp3');
  const meta = JSON.parse(fs.readFileSync(path.join(root, 'scripts/shared/audio-library.json'), 'utf8'));
  assert.deepEqual(meta.files[m.path].artists, ['Tác giả A', 'Tác giả B']);
  assert.match(meta.files[m.path].sha256, /^[a-f0-9]{64}$/);
  const music = lib.music();
  const track = music.unused.find(x => x.path === m.path);
  assert.equal(track.title, 'Bản nhạc mới');assert.equal(track.shared, true);assert.deepEqual(track.artists, ['Tác giả A', 'Tác giả B']);
  const effect = music.effects.find(e => e.library);
  assert.equal(effect.title, 'gio');
  assert.ok(lib.audio('music', m.path) && lib.audio('sfx', s.path));
  assert.ok(!fs.readdirSync(path.join(root, 'public/audio-library/music')).some(n => n.startsWith('.upload-')));
});

test('never overwrites, refuses bad names, wrong content and unknown kinds, and leaves no partial file', async t => {
  const {root, lib} = workspace(t);
  await lib.addAudio({kind: 'music', name: 'a.wav'}, body(wav()));
  await assert.rejects(lib.addAudio({kind: 'music', name: 'a.wav'}, body(wav())), e => e.status === 409);
  await assert.rejects(lib.addAudio({kind: 'music', name: '../x.wav'}, body(wav())), /tên hợp lệ/);
  await assert.rejects(lib.addAudio({kind: 'music', name: '.hidden.wav'}, body(wav())), /tên hợp lệ/);
  await assert.rejects(lib.addAudio({kind: 'music', name: 'note.txt'}, body(wav())), /tên hợp lệ/);
  await assert.rejects(lib.addAudio({kind: 'video', name: 'b.wav'}, body(wav())), /Chọn loại/);
  await assert.rejects(lib.addAudio({kind: 'music', name: 'fake.wav'}, body(Buffer.from('not audio at all, just text'))), /không phải WAV/);
  await assert.rejects(lib.addAudio({kind: 'sfx', name: 'empty.ogg'}, body(Buffer.alloc(0))), /File rỗng/);
  const names = fs.readdirSync(path.join(root, 'public/audio-library/music'));
  assert.deepEqual(names, ['a.wav']);
});

test('renames a shared track in place with revision check and history; project folders are refused', async t => {
  const {root, lib} = workspace(t);
  await lib.addAudio({kind: 'music', name: 'Pufino - Enlivening.mp3', title: 'Pufino', artists: 'Enlivening'}, body(Buffer.concat([Buffer.from('ID3'), Buffer.alloc(32)])));
  const rel = 'audio-library/music/Pufino - Enlivening.mp3', revision = lib.music().metaRevision;
  const r = lib.updateAudioMeta({path: rel, title: 'Enlivening', artists: 'Pufino', revision});
  assert.deepEqual([r.title, r.artists], ['Enlivening', ['Pufino']]);
  const track = lib.music().unused.find(x => x.path === rel);
  assert.deepEqual([track.title, track.artists], ['Enlivening', ['Pufino']]);
  assert.throws(() => lib.updateAudioMeta({path: rel, title: 'X', artists: '', revision}), e => e.status === 409);
  assert.equal(fs.readdirSync(path.join(root, 'scripts/shared/.manager-history')).filter(n => n.startsWith('audio-library-')).length, 1);
  fs.mkdirSync(path.join(root, 'public/demo/audio'), {recursive: true});fs.writeFileSync(path.join(root, 'public/demo/audio/a.wav'), wav());
  assert.throws(() => lib.updateAudioMeta({path: 'demo/audio/a.wav', title: 'X', revision: lib.music().metaRevision}), /thư viện dùng chung/);
  assert.throws(() => lib.updateAudioMeta({path: rel, title: '  ', revision: lib.music().metaRevision}), /Tên bài/);
});
