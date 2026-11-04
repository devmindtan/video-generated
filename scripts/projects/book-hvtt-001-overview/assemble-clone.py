"""Join a VoiceStudio clone take (one WAV per intro sentence) into one audition WAV for the intro.

Uses the same lead-in, pauses and tail as audition.json, one linear gain per sentence (no tempo change),
and aligns captions with the shared faster-whisper helper. Writes a catalog-shaped take in
public/voice-auditions/<out>/ so intro-bands.py can offer it as a `voice` prop. The clone take itself is
left untouched; nothing is applied to the video until the user picks a voice.
Several clone takes can be given: each sentence is taken from the last take that has exactly that text,
so a script edit only needs the changed sentences re-cloned.
Usage: .venv/bin/python scripts/projects/book-hvtt-001-overview/assemble-clone.py --clone clone-v2 clone-v3 --out book-hvtt-intro-clone-v3 --id clone-ban-v3
"""
import argparse, io, json, os, re, runpy, subprocess, sys
from pathlib import Path
import numpy as np
import soundfile as sf
import soxr

ROOT = Path(__file__).resolve().parents[3]
os.environ['HF_HUB_OFFLINE'] = '1'
sys.path.insert(0, str(ROOT / 'scripts/shared'))
from voice_quality import normalize_gain  # noqa: E402

SR = 48000
FF = ROOT / 'node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg'


def voiced_seconds(audio):
    loud = np.where(np.abs(audio) > np.abs(audio).max() * .02)[0]
    return (loud[-1] - loud[0]) / SR if len(loud) else 0.0


def slow_down(audio, factor):
    # Tempo factor < 1 makes speech slower with the pitch kept (ffmpeg atempo), same loudness.
    buf = io.BytesIO()
    sf.write(buf, audio, SR, format='WAV', subtype='PCM_24')
    out = subprocess.check_output([str(FF), '-v', 'error', '-f', 'wav', '-i', '-', '-af', f'atempo={factor:.5f}', '-c:a', 'pcm_s24le', '-f', 'wav', '-'],
                                  input=buf.getvalue(), env={'LD_LIBRARY_PATH': str(FF.parent)})
    slowed, _ = sf.read(io.BytesIO(out), dtype='float64')
    return slowed


def squeeze_pauses(audio, longest):
    # Shorten silent gaps inside a sentence (clone breaths at commas) to `longest` seconds; speech and tempo untouched.
    hop = SR // 50
    energy = np.array([np.sqrt(np.mean(audio[i:i + hop] ** 2)) for i in range(0, len(audio) - hop + 1, hop)])
    quiet = energy < energy.max() * .03
    keep, n = [], 0
    while n < len(quiet):
        m = n
        while m < len(quiet) and quiet[m] == quiet[n]: m += 1
        a, b = n * hop, m * hop if m < len(quiet) else len(audio)
        if quiet[n] and (m - n) * hop > longest * SR + hop and n > 0 and m < len(quiet):
            half = round(longest * SR / 2)
            keep += [audio[a:a + half], audio[b - half:b]]
        else:
            keep.append(audio[a:b])
        n = m
    return np.concatenate(keep)


def trim_quiet_edges(audio, level, margin=.06):
    # Clone sentences often start with ~0.2 s (up to 0.5 s) of breath or room noise above the plain-silence threshold;
    # left in, it lengthens every gap unevenly (user 2026-11-04: "hơi nhiều khoảng lặng").
    w = int(SR * .02)
    rms = np.sqrt(np.convolve(audio ** 2, np.ones(w) / w, 'same'))
    loud = np.flatnonzero(rms > level)
    if not len(loud): return audio
    m = int(margin * SR)
    return audio[max(0, loud[0] - m):min(len(audio), loud[-1] + m)]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--clone', nargs='+', required=True)
    parser.add_argument('--id', default='clone-ban')
    parser.add_argument('--config', default='audition.json', help='Sentence/pause config in this folder')
    parser.add_argument('--out', required=True)
    parser.add_argument('--max-pause', type=float, help='Shorten silences inside each sentence to this many seconds')
    parser.add_argument('--pause-scale', type=float, default=1.0, help='Scale the config lead-in, pauses between sentences and tail')
    parser.add_argument('--max-rate', type=float, help='Slow a sentence spoken faster than this many syllables per voiced second (pitch kept, at most 12%%)')
    parser.add_argument('--title-pause', type=float, help='At least this many seconds after a short heading sentence (six words or fewer)')
    parser.add_argument('--edge-rms', type=float, help='Also cut near-silent breath/noise at sentence edges: trim to where the 20 ms RMS first/last passes this level, keeping 60 ms of margin')
    parser.add_argument('--project', default='book-hvtt-001-overview', help='Episode whose config and clone takes are used')
    parser.add_argument('--choice', help='JSON {sentence text: clone take} overriding "last take wins" (build-body.py)')
    args = parser.parse_args()
    project = ROOT / 'scripts/projects' / args.project
    cfg = json.loads((project / args.config).read_text())
    choice = json.loads(Path(args.choice).read_text()) if args.choice else {}
    parts = {}
    for take in args.clone:
        folder = ROOT / 'public' / args.project / 'voice-auditions' / take
        clone = json.loads((folder / 'manifest.json').read_text())
        for f in clone['files']:
            if choice.get(f['text'].strip(), take) == take:
                parts[f['text'].strip()] = (folder, f)
    missing = [s['text'] for s in cfg['sentences'] if s['text'].strip() not in parts]
    if missing:
        raise RuntimeError(f'No clone for: {missing}')
    out = ROOT / 'public/voice-auditions' / args.out
    if out.exists():
        raise RuntimeError('Output take exists; choose a new --out')
    out.mkdir(parents=True)
    shared = runpy.run_path(str(ROOT / 'scripts/shared/make-voice.py'))
    shared['align_captions'].__globals__['CACHE'] = out / 'recognition'
    (out / 'recognition').mkdir()
    k = args.pause_scale
    chunks, ranges = [np.zeros(round(cfg['leadIn'] * k * SR))], []
    used = []
    for sentence in cfg['sentences']:
        source, part = parts[sentence['text'].strip()]
        used.append(str((source / part['file']).relative_to(ROOT)))
        audio, rate = sf.read(source / part['file'], dtype='float64')
        audio = audio.mean(axis=1) if audio.ndim > 1 else audio
        audio = soxr.resample(audio, rate, SR) if rate != SR else audio
        audio = normalize_gain(shared['trim_silence'](audio, SR))
        if args.edge_rms: audio = trim_quiet_edges(audio, args.edge_rms)
        if args.max_pause: audio = squeeze_pauses(audio, args.max_pause)
        words = len(re.findall(r'\w+', sentence['text']))
        if args.max_rate and voiced_seconds(audio) and words / voiced_seconds(audio) > args.max_rate:
            audio = slow_down(audio, max(.88, args.max_rate / (words / voiced_seconds(audio))))
        edge = min(240, len(audio) // 2)
        audio[:edge] *= np.linspace(0, 1, edge)
        audio[-edge:] *= np.linspace(1, 0, edge)
        at = sum(len(c) for c in chunks) / SR
        chunks.append(audio)
        ranges.append({'text': sentence['text'], 'startSeconds': round(at, 4), 'endSeconds': round(at + len(audio) / SR, 4)})
        pause = sentence['pauseAfter'] * k
        if args.title_pause and words <= 6: pause = max(pause, args.title_pause)
        if pause:
            chunks.append(np.zeros(round(pause * SR)))
    speech_end = sum(len(c) for c in chunks) / SR
    chunks.append(np.zeros(round(cfg['tail'] * k * SR)))
    audio = np.concatenate(chunks)
    record = {'id': args.id, 'name': 'Giọng bạn (clone)', 'label': 'Lựa chọn 2 · clone giọng người dùng (consent: self)',
              'file': f'{args.id}.wav', 'status': 'ready', 'durationSeconds': round(len(audio) / SR, 3), 'phraseRanges': ranges,
              'peakDbFS': round(float(20 * np.log10(np.max(np.abs(audio)))), 2)}
    sf.write(out / record['file'], audio, SR, subtype='PCM_24')
    from faster_whisper import WhisperModel
    recognizer = WhisperModel('medium', device='cpu', compute_type='int8', cpu_threads=4, download_root=str(ROOT / '.cache/whisper'))
    text = ' '.join(s['text'] for s in cfg['sentences'])
    try:
        pages, qa = shared['align_captions'](recognizer, out / record['file'], text, speech_end, .88)
        record.update(qa)
        (out / f'{args.id}-captions.json').write_text(json.dumps(pages, ensure_ascii=False, indent=2) + '\n')
        record['captionsFile'] = f'{args.id}-captions.json'
        record['verification'] = 'ASR passed; listening pending'
    except RuntimeError as error:
        record['verification'] = 'Needs listening review'
        record['recognitionWarning'] = str(error)
    manifest = {'title': f'Đọc sách, hiểu mình — intro — clone giọng người dùng ({", ".join(args.clone)})', 'config': {**cfg, 'title': f'clone {" + ".join(args.clone)}'},
                'text': text, 'voices': [record], 'source': {'cloneTakes': args.clone, 'sentenceFiles': used, 'reference': clone['reference']},
                'sampleRateHz': SR, 'pcmSubtype': 'PCM_24', 'tempo': 1, 'paidApiCalls': 0,
                'listeningReview': 'Pending user listening; ASR does not validate Vietnamese tones'}
    (out / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(f"{record['durationSeconds']} s · {record['verification']} → {out.relative_to(ROOT)}")


if __name__ == '__main__':
    main()
