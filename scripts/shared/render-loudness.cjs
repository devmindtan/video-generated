// Studio's Render button writes the YouTube loudness directly (user 2026-11-09: "Bạn không thể cấu hình xuất ngay trên
// studio bằng nút render thủ công à"): remotion.config.ts registers this as Config.overrideFfmpegCommand, so every
// video render (Studio render queue and `remotion render`) normalizes its audio to -14 LUFS integrated, true peak
// ≤ -1 dBTP while Remotion stitches the final file. No separate upload copy is needed afterwards.
//
// How: Remotion's last ffmpeg step ("stitcher") stream-copies an already encoded AAC/ADTS track (`-i audio.aac -c:a
// copy`). Here the audio is measured once (loudnorm two-pass, first pass on that file, a few seconds) and the copy is
// replaced by `-af loudnorm=…measured… -c:a aac`. ADTS cannot signal the encoder delay, so Remotion shifts the input by
// `-itsoffset -<delay>`; when re-encoding, that shift is replaced by trimming the same priming samples (atrim), keeping
// audio and picture in sync. Anything unexpected (other codec, audio-only render, measurement failure) leaves the
// command untouched and logs why: a render never fails because of this step. REMOTION_LOUDNORM=0 turns it off.
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

const TARGET_I = -14;
const TARGET_TP = -1.5; // aim under the -1 dBTP limit: AAC encoding adds a few tenths of a dB of overshoot
const TOLERANCE = 0.5; // already within ±0.5 LU and under -1 dBTP: keep the stream copy
const PRIMING_SAMPLES = 2048; // libfdk_aac AAC-LC encoder delay, as in @remotion/renderer aac-priming.js

function findFfmpeg() {
  const candidates = [
    process.env.REMOTION_LOUDNORM_FFMPEG,
    path.join(process.cwd(), 'node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg'),
    path.join(__dirname, '../../node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg'),
  ].filter(Boolean);
  return candidates.find(f => fs.existsSync(f)) || null;
}

function measure(ffmpeg, audio, trim) {
  const filter = `${trim ? `atrim=start_sample=${PRIMING_SAMPLES},` : ''}loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=11:print_format=json`;
  const r = spawnSync(ffmpeg, ['-hide_banner', '-nostdin', '-nostats', '-i', audio, '-vn', '-af', filter, '-f', 'null', '-'],
    {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024});
  if (r.status !== 0) throw new Error((r.stderr || '').trim().split('\n').slice(-1)[0] || `ffmpeg ${r.status}`);
  const json = r.stderr.slice(r.stderr.lastIndexOf('{'), r.stderr.lastIndexOf('}') + 1);
  const stats = JSON.parse(json);
  const rate = Number((r.stderr.match(/Audio: [^\n]*?(\d+) Hz/) || [])[1]) || 48000;
  return {stats, rate};
}

function loudnessOverride({type, args}, {log = msg => console.log(`[âm lượng] ${msg}`), ffmpeg = findFfmpeg()} = {}) {
  if (type !== 'stitcher' || process.env.REMOTION_LOUDNORM === '0') return args;
  const copyAt = args.findIndex((a, i) => a === '-c:a' && args[i + 1] === 'copy');
  if (copyAt < 0) return args; // muted render or a layout we do not know
  let inputAt = -1;
  for (let i = copyAt - 1; i >= 0; i--) if (args[i] === '-i') {inputAt = i; break;}
  const audio = inputAt >= 0 ? args[inputAt + 1] : null;
  if (!audio || !/\.aac$/i.test(audio)) return args;
  if (!ffmpeg) {log('không tìm thấy ffmpeg của Remotion; giữ nguyên âm lượng.'); return args;}
  const shifted = inputAt >= 2 && args[inputAt - 2] === '-itsoffset';
  try {
    const {stats, rate} = measure(ffmpeg, audio, shifted);
    const I = Number(stats.input_i), TP = Number(stats.input_tp);
    if (!Number.isFinite(I)) {log('không đo được âm lượng (tiếng im lặng?); giữ nguyên.'); return args;}
    if (Math.abs(I - TARGET_I) <= TOLERANCE && TP <= -1) {
      log(`đã đạt sẵn: ${I.toFixed(1)} LUFS, đỉnh ${TP.toFixed(1)} dBTP; giữ nguyên.`);
      return args;
    }
    const measured = `measured_I=${stats.input_i}:measured_TP=${stats.input_tp}:measured_LRA=${stats.input_lra}` +
      `:measured_thresh=${stats.input_thresh}:offset=${stats.target_offset}:linear=true`;
    const filter = [shifted ? `atrim=start_sample=${PRIMING_SAMPLES},asetpts=PTS-STARTPTS` : null,
      `loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=11:${measured}`, `aresample=${rate}`].filter(Boolean).join(',');
    const out = [...args];
    out.splice(copyAt, 2, '-af', filter, '-c:a', 'aac', '-b:a', '320k', '-ar', String(rate));
    if (shifted) out.splice(inputAt - 2, 2);
    log(`bản xuất đo ${I.toFixed(1)} LUFS, đỉnh ${TP.toFixed(1)} dBTP → chuẩn hóa về ${TARGET_I} LUFS, đỉnh ≤ -1 dBTP.`);
    return out;
  } catch (error) {
    log(`không đo được âm lượng (${error.message}); giữ nguyên âm lượng gốc.`);
    return args;
  }
}

module.exports = {loudnessOverride, TARGET_I, PRIMING_SAMPLES};
