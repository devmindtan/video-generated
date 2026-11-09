#!/usr/bin/env python3
"""Local media analysis with Remotion's bundled ffmpeg: shots, contact sheets, music energy, silences, loudness.

Ideas from OpenMontage's scene_detect, frame_sampler, audio_energy and
silence_cutter (reference clone in repos/calesthio--OpenMontage),
rewritten for the minimal ffmpeg shipped with @remotion/compositor
(no select/ebur128/tile filters): frames and PCM are decoded raw and
measured with numpy; sheets are tiled with Pillow. Read-only on inputs;
only writes the sheet image it is asked for.
"""
import argparse
import io
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import time
import wave

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
FFMPEG = ROOT/'node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg'
SHOT_SIZE = (64, 36)
AUDIO_RATE = 8000


def run_ffmpeg(*args, capture=True):
    result = subprocess.run([str(FFMPEG), '-hide_banner', '-nostdin', *args], capture_output=capture)
    if result.returncode:
        raise RuntimeError(result.stderr.decode(errors='replace').strip().splitlines()[-1] if result.stderr else 'ffmpeg failed')
    return result


def stream_info(path):
    stderr = subprocess.run([str(FFMPEG), '-hide_banner', '-i', str(path)], capture_output=True, text=True).stderr
    duration = re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)', stderr)
    if not duration:
        raise ValueError(f'{path}: no readable media')
    hours, minutes, seconds = map(float, duration.groups())
    fps = re.search(r'Video:.*?(\d+(?:\.\d+)?) fps', stderr)
    return {'durationSeconds': hours*3600+minutes*60+seconds, 'fps': float(fps.group(1)) if fps else 0.0,
            'hasVideo': 'Video:' in stderr, 'hasAudio': 'Audio:' in stderr}


def stamp(seconds):
    minutes, rest = divmod(max(seconds, 0), 60)
    return f'{int(minutes)}:{rest:05.2f}'


# Shots -------------------------------------------------------------------

def gray_frames(path):
    width, height = SHOT_SIZE
    raw = run_ffmpeg('-v', 'error', '-i', str(path), '-an', '-vf', f'scale={width}:{height}', '-pix_fmt', 'gray',
                     '-c:v', 'rawvideo', '-f', 'image2pipe', '-').stdout
    count = len(raw)//(width*height)
    return np.frombuffer(raw[:count*width*height], dtype=np.uint8).reshape(count, height, width)


def change_scores(frames):
    """Per-frame change in [0, 1]: mean of histogram distance and pixel difference to the previous frame."""
    if len(frames) < 2:
        return np.zeros(len(frames))
    histograms = np.stack([np.histogram(frame, bins=32, range=(0, 256))[0] for frame in frames]).astype(float)
    histograms /= histograms.sum(axis=1, keepdims=True)
    hist_distance = np.abs(np.diff(histograms, axis=0)).sum(axis=1)/2
    pixel_distance = np.abs(np.diff(frames.astype(np.int16), axis=0)).mean(axis=(1, 2))/255
    return np.concatenate([[0.0], (hist_distance+pixel_distance)/2])


def find_cuts(scores, fps, threshold, min_gap, contrast=4.0, floor=.08):
    """Cut times: peaks above `threshold`, or with threshold None, peaks that stand `contrast`x above
    the median of the surrounding second (catches dissolves in calm edits, ignores steady handheld motion)."""
    radius = max(1, int(fps))
    candidates = []
    for index, score in enumerate(scores):
        if threshold is not None:
            hit = score >= threshold
        else:
            around = np.concatenate([scores[max(0, index-radius):index], scores[index+1:index+1+radius]])
            hit = score >= floor and score >= contrast*max(float(np.median(around)) if len(around) else 0, .005)
        if hit:
            candidates.append((index/fps, float(score)))
    cuts = []
    for time, score in candidates:
        if cuts and time-cuts[-1][0] < min_gap:
            if score > cuts[-1][1]:
                cuts[-1] = (time, score)
            continue
        cuts.append((time, score))
    return [round(time, 3) for time, _ in cuts]


def command_shots(args):
    info = stream_info(args.file)
    if not info['hasVideo'] or not info['fps']:
        raise SystemExit(f'{args.file}: no video stream')
    scores = change_scores(gray_frames(args.file))
    cuts = [cut for cut in find_cuts(scores, info['fps'], args.threshold, args.min_gap)
            if 0 < cut < info['durationSeconds']-args.min_gap]
    edges = [0.0, *cuts, round(info['durationSeconds'], 3)]
    shots = [{'index': i+1, 'start': edges[i], 'end': edges[i+1], 'duration': round(edges[i+1]-edges[i], 3)}
             for i in range(len(edges)-1) if edges[i+1] > edges[i]]
    if args.json:
        print(json.dumps({'file': str(args.file), **info, 'threshold': args.threshold or 'relative', 'cuts': cuts, 'shots': shots}, indent=2))
        return 0
    for shot in shots:
        print(f'{shot["index"]:3d}  {stamp(shot["start"])} → {stamp(shot["end"])}  ({shot["duration"]:.2f}s)')
    print(f'{len(shots)} shot(s), {info["durationSeconds"]:.2f}s at {info["fps"]:g} fps', file=sys.stderr)
    return 0


# Contact sheet -------------------------------------------------------------

def sheet_times(duration, count, at):
    if at:
        return [float(value) for value in at.split(',')]
    step = duration/count
    return [round(step*(i+.5), 2) for i in range(count)]


def command_sheet(args):
    from PIL import Image, ImageDraw, ImageFont
    info = stream_info(args.file)
    if not info['hasVideo']:
        raise SystemExit(f'{args.file}: no video stream')
    times = sheet_times(info['durationSeconds'], args.count, args.at)
    cell_width = args.width//args.cols
    tiles = []
    for time in times:
        frame = run_ffmpeg('-v', 'error', '-ss', f'{time:.3f}', '-i', str(args.file), '-frames:v', '1', '-an',
                           '-vf', f'scale={cell_width}:-2', '-c:v', 'png', '-f', 'image2pipe', '-').stdout
        if frame:
            tiles.append((time, Image.open(io.BytesIO(frame)).convert('RGB')))
    if not tiles:
        raise SystemExit('no frames decoded')
    cell_height = max(tile.height for _, tile in tiles)
    rows = -(-len(tiles)//args.cols)
    sheet = Image.new('RGB', (cell_width*args.cols, cell_height*rows), (16, 16, 16))
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default(size=max(18, cell_width//14))
    for index, (time, tile) in enumerate(tiles):
        x, y = index % args.cols*cell_width, index//args.cols*cell_height
        sheet.paste(tile, (x, y))
        label = stamp(time)
        box = draw.textbbox((x+8, y+6), label, font=font)
        draw.rectangle((box[0]-4, box[1]-3, box[2]+4, box[3]+3), fill=(0, 0, 0))
        draw.text((x+8, y+6), label, fill=(255, 255, 255), font=font)
    out = Path(args.out) if args.out else ROOT/'.cache/media'/f'{Path(args.file).stem}-sheet.png'
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)
    print(out)
    return 0


# Audio ------------------------------------------------------------------------

def mono_pcm(path):
    raw = run_ffmpeg('-v', 'error', '-i', str(path), '-vn', '-ac', '1', '-ar', str(AUDIO_RATE), '-c:a', 'pcm_s16le', '-f', 'wav', '-').stdout
    with wave.open(io.BytesIO(raw)) as handle:
        frames = handle.readframes(handle.getnframes())
    return np.frombuffer(frames, dtype=np.int16).astype(np.float32)/32768


def loudness_profile(samples, rate=AUDIO_RATE, window=.4, hop=.1):
    """RMS level in dBFS over sliding windows (a momentary-loudness stand-in without ebur128)."""
    size, step = int(rate*window), int(rate*hop)
    if len(samples) < size:
        samples = np.pad(samples, (0, size-len(samples)))
    starts = np.arange(0, len(samples)-size+1, step)
    rms = np.array([np.sqrt(np.mean(np.square(samples[start:start+size]))) for start in starts])
    return starts/rate, 20*np.log10(np.maximum(rms, 1e-6))


def reach_time(times, levels, below_body_db, hold_seconds, hop=.1):
    """First time the 1 s smoothed level stays within `below_body_db` of the loud body (95th percentile) for `hold_seconds`."""
    smoothed = np.convolve(levels, np.ones(10)/10, mode='same')
    target = np.percentile(levels, 95)-below_body_db
    need = max(1, int(round(hold_seconds/hop)))
    run = 0
    for index, level in enumerate(smoothed):
        run = run+1 if level >= target else 0
        if run >= need:
            return round(float(times[index-need+1]), 1)
    return None


def command_energy(args):
    samples = mono_pcm(args.file)
    times, levels = loudness_profile(samples)
    body = float(np.percentile(levels, 95))
    reaches = {f'-{gap:g}': reach_time(times, levels, gap, args.hold) for gap in args.steps}
    seconds = int(len(samples)/AUDIO_RATE)
    per_second = [round(float(levels[(times >= s) & (times < s+1)].mean()), 1) for s in range(seconds) if ((times >= s) & (times < s+1)).any()]
    result = {'file': str(args.file), 'durationSeconds': round(len(samples)/AUDIO_RATE, 2),
              'peakDb': round(float(levels.max()), 1), 'bodyDb': round(body, 1),
              'reachesBodyMinusDb': reaches, 'perSecondDb': per_second}
    if args.json:
        print(json.dumps(result, indent=2))
        return 0
    print(f'duration {result["durationSeconds"]}s, loud body {result["bodyDb"]} dBFS (95th percentile), peak {result["peakDb"]} dBFS')
    for gap, time in reaches.items():
        where = stamp(time) if time is not None else 'never'
        print(f'  holds ≥ body {gap} dB for {args.hold:g}s from {where}')
    bars = ' ▁▂▃▄▅▆▇█'
    floor, top = body-36, max(per_second, default=body)
    line = ''.join(bars[int(np.clip((level-floor)/max(top-floor, 1e-6), 0, 1)*(len(bars)-1))] for level in per_second)
    for start in range(0, len(line), 60):
        print(f'{stamp(start):>8} {line[start:start+60]}')
    return 0


def parse_silences(stderr, duration):
    starts = [float(value) for value in re.findall(r'silence_start: (-?[\d.]+)', stderr)]
    ends = [float(value) for value in re.findall(r'silence_end: ([\d.]+)', stderr)]
    silences = []
    for index, start in enumerate(starts):
        end = ends[index] if index < len(ends) else duration
        silences.append({'start': round(max(start, 0), 3), 'end': round(end, 3), 'duration': round(end-max(start, 0), 3)})
    return silences


def command_silences(args):
    info = stream_info(args.file)
    stderr = subprocess.run([str(FFMPEG), '-hide_banner', '-nostdin', '-i', str(args.file), '-vn',
                             '-af', f'silencedetect=noise={args.noise}dB:d={args.min}', '-f', 'null', '-'],
                            capture_output=True, text=True).stderr
    silences = parse_silences(stderr, info['durationSeconds'])
    silent = sum(item['duration'] for item in silences)
    if args.json:
        print(json.dumps({'file': str(args.file), 'durationSeconds': info['durationSeconds'], 'noiseDb': args.noise,
                          'minSeconds': args.min, 'silences': silences, 'silentSeconds': round(silent, 3)}, indent=2))
        return 0
    for item in silences:
        print(f'{stamp(item["start"])} → {stamp(item["end"])}  ({item["duration"]:.2f}s)')
    print(f'{len(silences)} pause(s) ≥ {args.min}s below {args.noise} dB, {silent:.2f}s of {info["durationSeconds"]:.2f}s silent', file=sys.stderr)
    return 0

LOUDNESS_TARGET = -14.0   # YouTube plays louder uploads down to about -14 LUFS but never turns quieter ones up
TRUE_PEAK = -1.0
LOUDNESS_TOLERANCE = 1.0


def ffmpeg_with_progress(args, duration=None, on_progress=None):
    """Runs ffmpeg and returns its stderr; calls on_progress(0..1) from the time= stats when given."""
    if not on_progress or not duration:
        return subprocess.run([str(FFMPEG), '-hide_banner', '-nostdin', '-nostats', *args], capture_output=True, text=True).stderr
    proc = subprocess.Popen([str(FFMPEG), '-hide_banner', '-nostdin', '-stats', *args], stderr=subprocess.PIPE, text=True, errors='replace')
    out, buf = [], ''
    while True:
        chunk = proc.stderr.read(512)
        if not chunk:
            break
        buf += chunk
        *parts, buf = re.split(r'[\r\n]', buf)
        for line in parts:
            out.append(line)
            hit = re.search(r'time=(\d+):(\d+):(\d+(?:\.\d+)?)', line)
            if hit:
                on_progress(min(1, (int(hit[1]) * 3600 + int(hit[2]) * 60 + float(hit[3])) / duration))
    out.append(buf)
    proc.wait()
    if proc.returncode:
        raise RuntimeError(next((l for l in reversed(out) if l.strip()), 'ffmpeg failed'))
    return '\n'.join(out)


def loudnorm_stats(path, extra='', duration=None, on_progress=None):
    stderr = ffmpeg_with_progress(['-i', str(path), '-vn', '-af', f'loudnorm=I={LOUDNESS_TARGET}:TP={TRUE_PEAK}:LRA=11{extra}:print_format=json',
                                   '-f', 'null', '-'], duration, on_progress)
    match = re.search(r'\{[^{}]*"input_i"[^{}]*\}', stderr)
    if not match:
        raise RuntimeError(f'{path}: loudness could not be measured')
    return {key: (float(value) if re.fullmatch(r'-?[\d.]+|-?inf', value) else value)
            for key, value in json.loads(match.group(0)).items()}


def loudness_verdict(integrated, true_peak):
    return abs(integrated - LOUDNESS_TARGET) <= LOUDNESS_TOLERANCE and true_peak <= TRUE_PEAK + .2


def command_loudness(args):
    path = Path(args.file)
    # --progress <file.json>: phase and percent for the project manager's "Chuẩn hóa âm lượng" button (measure 0–40 %,
    # write the upload copy 40–90 %, measure it 90–100 %); the final report is written there too.
    progress_file = Path(args.progress) if getattr(args, 'progress', None) else None
    def report_progress(phase, percent, **extra):
        if progress_file:
            tmp = progress_file.with_suffix('.tmp')
            tmp.write_text(json.dumps({'pid': os.getpid(), 'phase': phase, 'percent': round(percent, 1), 'file': str(path),
                                       'updatedAt': time.strftime('%Y-%m-%dT%H:%M:%S%z'), **extra}, ensure_ascii=False))
            tmp.replace(progress_file)
    duration = None
    if progress_file:
        try:
            duration = stream_info(path)['durationSeconds']
        except Exception:
            duration = None
    stage = lambda phase, lo, hi: (lambda f: report_progress(phase, lo + (hi - lo) * f))
    report_progress('measuring', 0)
    try:
        return _loudness(args, path, duration, stage, report_progress)
    except BaseException as error:
        report_progress('failed', 100, error=str(error) or error.__class__.__name__)
        raise


def _loudness(args, path, duration, stage, report_progress):
    stats = loudnorm_stats(path, duration=duration, on_progress=stage('measuring', 0, 40))
    report = {'file': str(path), 'integratedLufs': stats['input_i'], 'truePeakDb': stats['input_tp'],
              'loudnessRange': stats['input_lra'], 'target': LOUDNESS_TARGET, 'truePeakLimit': TRUE_PEAK,
              'ok': loudness_verdict(stats['input_i'], stats['input_tp'])}
    if args.fix and not report['ok']:
        out = Path(args.out) if args.out else path.with_name(f'{path.stem}-upload{path.suffix}')
        if out.resolve() == path.resolve():
            raise SystemExit('--out must differ from the input; the export is never overwritten')
        if out.exists():
            raise SystemExit(f'{out} already exists; remove it or pass another --out')
        measured = (f":measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:measured_LRA={stats['input_lra']}"
                    f":measured_thresh={stats['input_thresh']}:offset={stats['target_offset']}:linear=true")
        ffmpeg_with_progress(['-n', '-i', str(path), '-map', '0:v?', '-map', '0:a', '-c:v', 'copy',
                              '-af', f'loudnorm=I={LOUDNESS_TARGET}:TP={TRUE_PEAK}:LRA=11{measured}',
                              '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-movflags', '+faststart', str(out)],
                             duration, stage('writing', 40, 90))
        after = loudnorm_stats(out, duration=duration, on_progress=stage('verifying', 90, 100))
        report['fixed'] = {'file': str(out), 'integratedLufs': after['input_i'], 'truePeakDb': after['input_tp'],
                           'ok': loudness_verdict(after['input_i'], after['input_tp'])}
    report_progress('done', 100, report=report)
    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        state = 'đạt' if report['ok'] else 'chưa đạt'
        print(f"{path.name}: {report['integratedLufs']:.1f} LUFS, đỉnh {report['truePeakDb']:.1f} dBTP "
              f"(mục tiêu {LOUDNESS_TARGET:.0f} ± {LOUDNESS_TOLERANCE:.0f} LUFS, đỉnh ≤ {TRUE_PEAK:.0f}) → {state}")
        if 'fixed' in report:
            f = report['fixed']
            print(f"  bản đăng: {f['file']}: {f['integratedLufs']:.1f} LUFS, đỉnh {f['truePeakDb']:.1f} dBTP → {'đạt' if f['ok'] else 'chưa đạt'}")
        elif not report['ok']:
            print('  chạy lại với --fix để ghi bản <tên>-upload.mp4 đã chuẩn hóa (bản xuất gốc giữ nguyên)')
    return 0 if report['ok'] or report.get('fixed', {}).get('ok') else 1


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    commands = parser.add_subparsers(dest='command', required=True)
    shots = commands.add_parser('shots', help='shot boundaries of a video')
    shots.add_argument('file')
    shots.add_argument('--threshold', type=float, help='fixed change score 0..1 for a cut (default: relative to the surrounding second)')
    shots.add_argument('--min-gap', type=float, default=.5, help='minimum seconds between cuts')
    shots.add_argument('--json', action='store_true')
    sheet = commands.add_parser('sheet', help='contact sheet of frames with timestamps')
    sheet.add_argument('file')
    sheet.add_argument('--count', type=int, default=12)
    sheet.add_argument('--at', help='comma list of seconds instead of --count')
    sheet.add_argument('--cols', type=int, default=4)
    sheet.add_argument('--width', type=int, default=1600)
    sheet.add_argument('--out', help='PNG path (default .cache/media/<name>-sheet.png)')
    energy = commands.add_parser('energy', help='music loudness profile and when it reaches its loud body')
    energy.add_argument('file')
    energy.add_argument('--steps', type=lambda value: [float(v) for v in value.split(',')], default=[18, 12, 6],
                        help='comma list of dB gaps under the loud body to report (default 18,12,6)')
    energy.add_argument('--hold', type=float, default=2, help='seconds the level must stay there')
    energy.add_argument('--json', action='store_true')
    silences = commands.add_parser('silences', help='pauses in narration or music')
    silences.add_argument('file')
    silences.add_argument('--noise', type=float, default=-35, help='silence threshold in dB')
    silences.add_argument('--min', type=float, default=.35, help='minimum pause in seconds')
    silences.add_argument('--json', action='store_true')
    loudness = commands.add_parser('loudness', help='integrated loudness and true peak against the YouTube target')
    loudness.add_argument('file')
    loudness.add_argument('--fix', action='store_true', help='write <name>-upload.mp4 normalised to -14 LUFS, peak -1 dBTP (video copied)')
    loudness.add_argument('--out', help='output path for --fix')
    loudness.add_argument('--json', action='store_true')
    loudness.add_argument('--progress', help='write phase/percent/report JSON here while working (project manager)')
    args = parser.parse_args(argv)
    return {'shots': command_shots, 'sheet': command_sheet, 'energy': command_energy, 'silences': command_silences,
            'loudness': command_loudness}[args.command](args)


if __name__ == '__main__':
    raise SystemExit(main())
