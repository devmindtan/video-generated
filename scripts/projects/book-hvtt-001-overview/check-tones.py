"""Compare each cloned sentence's local ASR transcript with the script, keeping Vietnamese diacritics.

Accent-insensitive word match does not validate tones (mẹ → mẽ); this flags words whose diacritics differ
(Bà → Ba, mắng → mắn) so the specific sentence can be re-cloned. ASR can also mishear: a flag means "listen
here", not a verdict. Writes <clone take>/tone-check.json and prints the flagged sentences.
Usage: .venv/bin/python scripts/projects/book-hvtt-001-overview/check-tones.py <clone-take> [<clone-take> ...]
"""
import difflib, json, os, re, sys, unicodedata
from pathlib import Path
os.environ['HF_HUB_OFFLINE'] = '1'
import soundfile as sf, soxr
from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parents[3]
words = lambda t: re.findall(r'\w+', unicodedata.normalize('NFC', t.lower()))
plain = lambda w: ''.join(c for c in unicodedata.normalize('NFD', w.replace('đ', 'd')) if unicodedata.category(c) != 'Mn')
model = WhisperModel('medium', device='cpu', compute_type='int8', cpu_threads=4, download_root=str(ROOT / '.cache/whisper'))

for take in sys.argv[1:]:
    folder = ROOT / 'public/book-hvtt-001-overview/voice-auditions' / take
    manifest = json.loads((folder / 'manifest.json').read_text())
    report = []
    for f in manifest['files']:
        audio, sr = sf.read(folder / f['file'], dtype='float32')
        audio = audio.mean(axis=1) if audio.ndim > 1 else audio
        segs, _ = model.transcribe(soxr.resample(audio, sr, 16000), language='vi', beam_size=5)  # no initial_prompt: it would bias ASR toward the script and hide real errors
        heard = ' '.join(s.text.strip() for s in segs)
        want, got = words(f['text']), words(heard)
        tone, other = [], []
        for op, a1, a2, b1, b2 in difflib.SequenceMatcher(a=[plain(w) for w in want], b=[plain(w) for w in got], autojunk=False).get_opcodes():
            if op == 'equal':
                tone += [(w, g) for w, g in zip(want[a1:a2], got[b1:b2]) if w != g]
            else:
                other.append((' '.join(want[a1:a2]), ' '.join(got[b1:b2])))
        report.append({'file': f['file'], 'text': f['text'], 'heard': heard, 'toneDiffs': tone, 'wordDiffs': other})
        if tone or other:
            print(f"{take}/{f['file']}: dấu {tone} · chữ {other}")
    (folder / 'tone-check.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(f'{take}: {sum(1 for r in report if r["toneDiffs"] or r["wordDiffs"])}/{len(report)} câu cần nghe lại')
