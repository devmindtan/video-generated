#!/usr/bin/env python3
"""Find and replace dragged-out words in the cached sentence takes make-voice uses for this project.

User 2026-11-11: "Ví dụ đời thường chứ không phải là ví dụ đời... thường" (the preset voice held "đời" 0.44 s). VieNeu
samples differently on every draw, so a dragged word is a bad draw, not the text. For every sentence of the chosen
segments this reads the cached take (the exact file make-voice will reuse), asks faster-whisper for word timings and
flags a word held >= 0.42 s and >= 1.8x the sentence's median word. Skipped: the first and last word (ASR folds
silence into them), any word the script follows with punctuation (a natural phrase-final lengthening; the script's
punctuation is used because ASR drops commas), and long words such as English terms (more syllables, so longer). A flagged sentence is redrawn up to N times;
the take with the smallest drag that still reads the sentence (>= 85 % word match) replaces the cache file. The old take
stays next to it as <key>.drag-<n>.wav. Then re-run make-voice: it reuses the cache and re-times the segment.

Usage: fix-drag.py [segment-prefix ...] [--tries 4] [--check-only]
"""
import importlib.util
import json
import os
import re
import statistics
import sys
from difflib import SequenceMatcher
from importlib.metadata import version
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
os.environ.setdefault('HF_HOME', str(ROOT / '.cache/huggingface'))
os.environ.setdefault('HF_HUB_DISABLE_XET', '1')
os.environ.setdefault('HF_HUB_OFFLINE', '1')
sys.path.insert(0, str(ROOT / 'scripts/shared'))
import numpy as np  # noqa: E402
import soundfile as sf  # noqa: E402
from scipy.signal import resample_poly  # noqa: E402
from voice_quality import PROFILES, cache_key, engine_identity  # noqa: E402

spec = importlib.util.spec_from_file_location('make_voice', ROOT / 'scripts/shared/make-voice.py')
make_voice = importlib.util.module_from_spec(spec)
spec.loader.exec_module(make_voice)

VOICE, TEMPERATURE, QUALITY = 'Minh Đức', .5, PROFILES['legacy24']
SAMPLING = {'top_k': 25, 'top_p': .95, 'repetition_penalty': 1.2}
STORY = ROOT / 'scripts/projects/system-design-tong-quan/story.json'
CACHE = ROOT / '.cache/stoic-audio' / STORY.stem
MIN_HOLD, RATIO = .42, 1.8

args = sys.argv[1:]
tries = int(args[args.index('--tries') + 1]) if '--tries' in args else 4
check_only = '--check-only' in args
prefixes = [a for i, a in enumerate(args) if not a.startswith('--') and (i == 0 or args[i - 1] != '--tries')]


def plain(word):
    return re.sub(r'[^\w]', '', word.lower())


def words_of(model, audio, sr):
    x = resample_poly(audio, 16000, sr).astype('float32')
    segments, _ = model.transcribe(x, language='vi', beam_size=5, word_timestamps=True, condition_on_previous_text=False)
    return [(w.word.strip(), w.end - w.start) for s in segments for w in s.words if w.word.strip()]


def drag(words, text):
    """(worst ratio, word) among held words, or (0, None). `text` is the sentence as spoken (its punctuation)."""
    if len(words) < 3:
        return 0, None
    median = statistics.median(d for _, d in words)
    # Words the script ends a phrase on: lengthening there is natural.
    phrase_end = {plain(tok) for tok in text.split() if re.search(r'[,.;:!?…]$', tok)}
    worst = (0, None)
    for i, (w, d) in enumerate(words[:-1]):
        if i == 0 or re.search(r'[,.;:!?…]$', w) or plain(w) in phrase_end or len(plain(w)) > 6:
            continue
        ratio = d / median if median else 0
        if d >= MIN_HOLD and ratio >= RATIO and ratio > worst[0]:
            worst = (round(ratio, 2), f'{w} {d:.2f}s')
    return worst


def match(words, text):
    a, b = [plain(w) for w in text.split()], [plain(w) for w, _ in words]
    return SequenceMatcher(a=a, b=b, autojunk=False).ratio()


def main():
    from faster_whisper import WhisperModel
    story = json.loads(STORY.read_text())
    identity = engine_identity(ROOT, version('vieneu'))
    model = WhisperModel('medium', device='cpu', compute_type='int8', cpu_threads=4, download_root=str(ROOT / '.cache/whisper'))
    tts, report = None, []
    try:
        for scene in story:
            if prefixes and not any(scene['id'].startswith(p) for p in prefixes):
                continue
            for n, item in enumerate(scene['sentences']):
                spoken = item.get('say', item['text'])
                path = CACHE / f'{cache_key(VOICE, spoken, TEMPERATURE, QUALITY, identity, SAMPLING)}.wav'
                if not path.exists():
                    report.append({'scene': scene['id'], 'sentence': n + 1, 'status': 'not synthesized yet'})
                    continue
                audio, sr = sf.read(path, dtype='float32')
                ratio, word = drag(words_of(model, audio, sr), spoken)
                if not word:
                    continue
                entry = {'scene': scene['id'], 'sentence': n + 1, 'text': item['text'], 'dragged': word, 'ratio': ratio}
                if not check_only:
                    if tts is None:
                        from vieneu import Vieneu
                        tts = Vieneu(mode='v3turbo', backend='onnx', device='cpu', precision='fp32', threads=4)
                    best = None
                    for _ in range(tries):
                        candidate = tts.infer(spoken, voice=VOICE, temperature=TEMPERATURE, **SAMPLING)
                        heard = words_of(model, candidate, tts.sample_rate)
                        r, w = drag(heard, spoken)
                        if match(heard, item['text'] if 'say' not in item else spoken) < .85:
                            continue
                        if best is None or r < best[0]:
                            best = (r, w, candidate)
                        if not w:
                            break
                    if best and best[0] < ratio:
                        backup = next(path.with_name(f'{path.stem}.drag-{k}.wav') for k in range(1, 99) if not path.with_name(f'{path.stem}.drag-{k}.wav').exists())
                        path.rename(backup)
                        trimmed = make_voice.trim_silence(best[2], tts.sample_rate, QUALITY.trim_head, QUALITY.trim_tail)
                        sf.write(path, trimmed, tts.sample_rate, subtype=QUALITY.subtype)
                        entry.update({'replaced': True, 'newRatio': best[0], 'newDragged': best[1], 'previousTake': backup.name})
                    else:
                        entry['replaced'] = False
                report.append(entry)
                print(json.dumps(entry, ensure_ascii=False), flush=True)
    finally:
        if tts:
            tts.close()
    out = ROOT / '.cache/system-design-tong-quan-drag.json'
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    flagged = [r for r in report if 'dragged' in r]
    print(f'{len(flagged)} dragged sentences, {sum(1 for r in flagged if r.get("replaced"))} replaced; report {out.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
