/* Voice reference recordings: add with consent, waveform + suggestion, cut 15 s clips. Temporary workspace only. */
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const {Readable} = require('node:stream');
const {createVoiceReferences} = require('./voice-references.cjs');
const ffmpeg = path.resolve(__dirname, '../../node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg');

// 40 s of 16 kHz "speech": tone bursts with pauses, plus a long silent gap from 5 s to 12 s.
function recording(seconds = 40) {
  const rate = 16000, n = rate * seconds, data = Buffer.alloc(44 + n * 2);
  data.write('RIFF', 0);data.writeUInt32LE(36 + n * 2, 4);data.write('WAVEfmt ', 8);data.writeUInt32LE(16, 16);data.writeUInt16LE(1, 20);data.writeUInt16LE(1, 22);
  data.writeUInt32LE(rate, 24);data.writeUInt32LE(rate * 2, 28);data.writeUInt16LE(2, 32);data.writeUInt16LE(16, 34);data.write('data', 36);data.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const t = i / rate, gap = t > 5 && t < 12, pause = (t % 2.2) > 1.9;
    data.writeInt16LE(gap || pause ? 0 : Math.round(Math.sin(2 * Math.PI * 180 * t) * 9000), 44 + i * 2);
  }
  return data;
}
function workspace(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'voice-ref-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  return {root, refs: createVoiceReferences(root, {ffmpeg})};
}
const body = buf => Readable.from([buf]);

test('adds a recording with consent, suggests a clean 15 s window and cuts reusable clips', async t => {
  const {root, refs} = workspace(t);
  const r = await refs.addVoiceReference({name: 'Giọng tôi.wav', speaker: 'Hiếu', consent: 'self', title: 'Giọng đọc của tôi'}, body(recording()));
  assert.equal(r.id, 'giong-doc-cua-toi');assert.equal(r.durationSeconds, 40);assert.equal(r.peaks.length, 900);
  const s = r.suggestion;assert.equal(s.durationSeconds, 15);
  assert.ok(s.startSeconds + 15 <= 5.5 || s.startSeconds >= 11.5, `suggestion avoids the long silent gap: ${s.startSeconds}`);
  const clip = await refs.cutVoiceReference({id: r.id, startSeconds: s.startSeconds, durationSeconds: 15});
  assert.match(clip.path, /^library\/voice-references\/giong-doc-cua-toi\/clips\/\d{6}-15s\.wav$/);
  const file = path.join(root, clip.path), head = fs.readFileSync(file).subarray(0, 12).toString('latin1');
  assert.ok(head.startsWith('RIFF') && head.endsWith('WAVE'));
  assert.equal(clip.sourceDeleted, true);assert.ok(!fs.existsSync(path.join(root, 'library/voice-references', r.id, 'source.wav')), 'full recording deleted after the clip is saved');
  await assert.rejects(refs.cutVoiceReference({id: r.id, startSeconds: 0, durationSeconds: 15}), /đã được xóa/);
  // A clone take that used this clip shows up as usage.
  fs.mkdirSync(path.join(root, 'public/demo-ep/voice-auditions/clone-v1'), {recursive: true});
  fs.writeFileSync(path.join(root, 'public/demo-ep/voice-auditions/clone-v1/manifest.json'), JSON.stringify({reference: {sha256: clip.sha256}}));
  const listed = refs.voiceReferences().references[0];
  assert.equal(listed.clips.length, 1);assert.equal(listed.consentLabel, 'Giọng của tôi');
  assert.deepEqual(listed.clips[0].usedBy, ['demo-ep']);assert.equal(listed.hasSource, false);
  assert.match(listed.revision, /^[a-f0-9]{64}$/);
  const updated = refs.updateVoiceReference({id:r.id,title:'Giọng kể buổi tối',speaker:'Minh Hiếu',consent:'permission',clipFile:clip.file,fileName:'giong-ke-buoi-toi.wav',revision:listed.revision});
  assert.equal(updated.title, 'Giọng kể buổi tối');assert.equal(updated.consentLabel, 'Người trong bản ghi đã đồng ý cho clone');
  const edited = refs.voiceReferences().references[0], renamed = path.join(root, edited.clips[0].path);
  assert.equal(edited.speaker, 'Minh Hiếu');assert.equal(edited.clips[0].file, 'giong-ke-buoi-toi.wav');assert.deepEqual(edited.clips[0].usedBy, ['demo-ep']);
  assert.ok(fs.existsSync(renamed));assert.ok(!fs.existsSync(file));assert.ok(fs.readdirSync(path.join(root,'library/voice-references',r.id,'.manager-history')).length);
  assert.throws(()=>refs.updateVoiceReference({id:r.id,title:'Bản cũ',speaker:'Hiếu',consent:'self',revision:listed.revision}),e=>e.status===409);
  assert.equal(refs.referenceAudio('reference', r.id), null);assert.ok(refs.referenceAudio('reference-clip', `${r.id}/giong-ke-buoi-toi.wav`));
  assert.equal(refs.referenceAudio('reference-clip', `${r.id}/${clip.file}`), null);
  assert.equal(refs.referenceAudio('reference-clip', `${r.id}/../reference.json`), null);
});

test('refuses missing consent or speaker, bad files, duplicates and out-of-range clips', async t => {
  const {root, refs} = workspace(t);
  await assert.rejects(refs.addVoiceReference({name: 'a.wav', speaker: 'X'}, body(recording(10))), /xác nhận/);
  await assert.rejects(refs.addVoiceReference({name: 'a.wav', consent: 'self'}, body(recording(10))), /tên người nói/);
  await assert.rejects(refs.addVoiceReference({name: 'a.txt', speaker: 'X', consent: 'self'}, body(recording(10))), /tên hợp lệ/);
  await assert.rejects(refs.addVoiceReference({name: 'a.wav', speaker: 'X', consent: 'self'}, body(Buffer.from('not audio'))), /không phải WAV/);
  const r = await refs.addVoiceReference({name: 'a.wav', speaker: 'X', consent: 'permission'}, body(recording(20)));
  await assert.rejects(refs.addVoiceReference({name: 'b.wav', speaker: 'X', consent: 'self'}, body(recording(20))), e => e.status === 409);
  await assert.rejects(refs.cutVoiceReference({id: r.id, startSeconds: 10, durationSeconds: 15}), /vượt quá/);
  await assert.rejects(refs.cutVoiceReference({id: r.id, startSeconds: 0, durationSeconds: 60}), /5–30/);
  await assert.rejects(refs.cutVoiceReference({id: '../x', startSeconds: 0}), /không hợp lệ/);
  assert.equal(fs.readdirSync(path.join(root, 'library/voice-references')).filter(n => n.startsWith('.')).length, 0);
});

test('refuses a symlinked private voice-reference directory', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'voice-ref-link-')), outside = fs.mkdtempSync(path.join(os.tmpdir(), 'voice-ref-outside-'));
  t.after(() => {fs.rmSync(root, {recursive: true, force: true});fs.rmSync(outside, {recursive: true, force: true});});
  fs.mkdirSync(path.join(root, 'library'), {recursive: true});fs.symlinkSync(outside, path.join(root, 'library/voice-references'));
  const refs = createVoiceReferences(root);
  assert.throws(() => refs.voiceReferences(), /không an toàn|vượt khỏi workspace/);
});
