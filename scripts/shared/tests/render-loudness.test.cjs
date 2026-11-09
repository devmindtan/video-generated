// Checks the Studio render loudness step (scripts/shared/render-loudness.cjs) on a fixture shaped like Remotion's final
// stitch: a pre-encoded video plus an ADTS track from libfdk_aac shifted by -itsoffset. The rewritten command must
// reach -14 LUFS (±1), true peak ≤ -1 dBTP, and keep a click at the same time as the untouched command (sync).
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {loudnessOverride} = require('../render-loudness.cjs');

const ROOT = path.resolve(__dirname, '../../..');
const FFMPEG = path.join(ROOT, 'node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg');
const run = args => {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-nostdin', '-nostats', ...args], {encoding: 'latin1', maxBuffer: 256 * 1024 * 1024});
  if (r.status !== 0) throw new Error(r.stderr);
  return r;
};
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'render-loudness-'));
try {
  const video = path.join(tmp, 'video.mp4'), audio = path.join(tmp, 'audio.aac');
  // The minimal Remotion ffmpeg has no lavfi/rawvideo sources: one grey PNG frame (written here) looped by image2, as
  // Remotion's own stitcher reads its frames; audio as PCM written here.
  const crc = buf => {let c = ~0; for (const b of buf) {c ^= b; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));} return ~c >>> 0;};
  const chunk = (type, data) => {const len = Buffer.alloc(4), sum = Buffer.alloc(4), td = Buffer.concat([Buffer.from(type), data]);
    len.writeUInt32BE(data.length); sum.writeUInt32BE(crc(td)); return Buffer.concat([len, td, sum]);};
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(320, 0); ihdr.writeUInt32BE(180, 4); ihdr[8] = 8; ihdr[9] = 0;
  const rows = Buffer.concat(Array.from({length: 180}, () => Buffer.concat([Buffer.from([0]), Buffer.alloc(320, 128)])));
  const png = path.join(tmp, 'frame.png');
  fs.writeFileSync(png, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr),
    chunk('IDAT', require('node:zlib').deflateSync(rows)), chunk('IEND', Buffer.alloc(0))]));
  run(['-loop', '1', '-framerate', '30', '-t', '6', '-i', png, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', video]);
  // Quiet 220 Hz tone (about -30 LUFS) with a loud click at exactly 2.000 s.
  const pcm = Buffer.alloc(48000 * 6 * 2), pcmFile = path.join(tmp, 'audio.pcm');
  for (let i = 0; i < 48000 * 6; i++) {
    const t = i / 48000;
    pcm.writeInt16LE(Math.round(32767 * (0.03 * Math.sin(2 * Math.PI * 220 * t) + (t >= 2 && t < 2.004 ? 0.9 : 0))), i * 2);
  }
  fs.writeFileSync(pcmFile, pcm);
  run(['-f', 's16le', '-ar', '48000', '-ac', '1', '-i', pcmFile, '-c:a', 'libfdk_aac', '-b:a', '320k', '-f', 'adts', audio]);
  const stitch = out => ['-i', video, '-itsoffset', `-${Math.round(2048 / 48000 * 1e6)}us`, '-i', audio, '-c:a', 'copy',
    '-c:v', 'copy', '-map_metadata', '-1', '-y', out];

  const logs = [];
  const baseOut = path.join(tmp, 'base.mp4'), fixedOut = path.join(tmp, 'fixed.mp4');
  const fixedArgs = loudnessOverride({type: 'stitcher', args: stitch(fixedOut)}, {log: m => logs.push(m), ffmpeg: FFMPEG});
  assert.notDeepStrictEqual(fixedArgs, stitch(fixedOut), 'the command should be rewritten');
  assert.ok(!fixedArgs.includes('-itsoffset') && fixedArgs.includes('-af'), fixedArgs.join(' '));
  assert.deepStrictEqual(loudnessOverride({type: 'pre-stitcher', args: ['-x']}, {ffmpeg: FFMPEG}), ['-x']);
  assert.deepStrictEqual(loudnessOverride({type: 'stitcher', args: ['-an', 'o.mp4']}, {ffmpeg: FFMPEG}), ['-an', 'o.mp4']);
  run(stitch(baseOut));
  run(fixedArgs);

  const loud = file => JSON.parse((s => s.slice(s.lastIndexOf('{'), s.lastIndexOf('}') + 1))(
    run(['-i', file, '-vn', '-af', 'loudnorm=I=-14:TP=-1:LRA=11:print_format=json', '-f', 'null', '-']).stderr));
  const after = loud(fixedOut);
  assert.ok(Math.abs(Number(after.input_i) + 14) <= 1, `integrated ${after.input_i}`);
  assert.ok(Number(after.input_tp) <= -1, `true peak ${after.input_tp}`);

  // Sync: first sample of the click, decoded through each file's edit list.
  const onset = file => {
    const wav = Buffer.from(run(['-i', file, '-vn', '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', '-bitexact', '-f', 'wav', '-']).stdout, 'latin1');
    const pcm = wav.subarray(wav.indexOf('data') + 8); // no s16le muxer in this ffmpeg: skip the WAV header
    let peak = 0;
    for (let i = 0; i + 1 < pcm.length; i += 2) peak = Math.max(peak, Math.abs(pcm.readInt16LE(i)));
    for (let i = 0; i < Math.floor(pcm.length / 2); i++) if (Math.abs(pcm.readInt16LE(i * 2)) > peak * 0.5) return i / 48000;
    return NaN;
  };
  const drift = Math.abs(onset(fixedOut) - onset(baseOut));
  assert.ok(drift < 0.005, `audio moved by ${(drift * 1000).toFixed(1)} ms`);
  const samples = file => {const w = Buffer.from(run(['-i', file, '-vn', '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', '-bitexact', '-f', 'wav', '-']).stdout, 'latin1'); return (w.length - w.indexOf('data') - 8) / 2;};
  assert.strictEqual(samples(fixedOut), samples(baseOut), 'audio length changed');
  console.log(`render-loudness: ok (${after.input_i} LUFS, đỉnh ${after.input_tp} dBTP, lệch ${(drift * 1000).toFixed(1)} ms) — ${logs.join(' ')}`);
} finally {
  fs.rmSync(tmp, {recursive: true, force: true});
}
