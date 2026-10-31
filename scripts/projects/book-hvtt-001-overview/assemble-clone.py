"""Join a VoiceStudio clone take (one WAV per intro sentence) into one audition WAV for the intro.

Uses the same lead-in, pauses and tail as audition.json, one linear gain per sentence (no tempo change),
and aligns captions with the shared faster-whisper helper. Writes a catalog-shaped take in
public/voice-auditions/<out>/ so intro-bands.py can offer it as a `voice` prop. The clone take itself is
left untouched; nothing is applied to the video until the user picks a voice.
Several clone takes can be given: each sentence is taken from the last take that has exactly that text,
so a script edit only needs the changed sentences re-cloned.
Usage: .venv/bin/python scripts/projects/book-hvtt-001-overview/assemble-clone.py --clone clone-v2 clone-v3 --out book-hvtt-intro-clone-v3 --id clone-ban-v3
"""
import argparse, json, os, runpy, sys
from pathlib import Path
import numpy as np
import soundfile as sf
import soxr

ROOT = Path(__file__).resolve().parents[3]
os.environ['HF_HUB_OFFLINE'] = '1'
sys.path.insert(0, str(ROOT / 'scripts/shared'))
from voice_quality import normalize_gain  # noqa: E402

SR = 48000


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--clone', nargs='+', required=True)
    parser.add_argument('--id', default='clone-ban')
    parser.add_argument('--config', default='audition.json', help='Sentence/pause config in this folder')
    parser.add_argument('--out', required=True)
    args = parser.parse_args()
    project = ROOT / 'scripts/projects/book-hvtt-001-overview'
    cfg = json.loads((project / args.config).read_text())
    parts = {}
    for take in args.clone:
        folder = ROOT / 'public/book-hvtt-001-overview/voice-auditions' / take
        clone = json.loads((folder / 'manifest.json').read_text())
        for f in clone['files']:
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
    chunks, ranges = [np.zeros(round(cfg['leadIn'] * SR))], []
    used = []
    for sentence in cfg['sentences']:
        source, part = parts[sentence['text'].strip()]
        used.append(str((source / part['file']).relative_to(ROOT)))
        audio, rate = sf.read(source / part['file'], dtype='float64')
        audio = audio.mean(axis=1) if audio.ndim > 1 else audio
        audio = soxr.resample(audio, rate, SR) if rate != SR else audio
        audio = normalize_gain(shared['trim_silence'](audio, SR))
        edge = min(240, len(audio) // 2)
        audio[:edge] *= np.linspace(0, 1, edge)
        audio[-edge:] *= np.linspace(1, 0, edge)
        at = sum(len(c) for c in chunks) / SR
        chunks.append(audio)
        ranges.append({'text': sentence['text'], 'startSeconds': round(at, 4), 'endSeconds': round(at + len(audio) / SR, 4)})
        if sentence['pauseAfter']:
            chunks.append(np.zeros(round(sentence['pauseAfter'] * SR)))
    speech_end = sum(len(c) for c in chunks) / SR
    chunks.append(np.zeros(round(cfg['tail'] * SR)))
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
