"""Compare each cloned sentence's local ASR transcript with the script, keeping Vietnamese diacritics.

Accent-insensitive word match does not validate tones (mẹ → mẽ); this flags words whose diacritics differ
(Bà → Ba, mắng → mắn) so the specific sentence can be re-cloned. ASR can also mishear: a flag means "listen
here", not a verdict. Writes <clone take>/tone-check.json and prints the flagged sentences.
The cloned voice says an initial "x" as "s" (xếp → sếp): that is its accent, not an error (user 2026-11-05), so x/s
at the start of a word is never flagged. --recheck re-scores the saved transcripts (tone-check.json "heard") without
running ASR again, after a rule like this changes.
Usage: .venv/bin/python scripts/projects/book-hvtt-001-overview/check-tones.py [--project <slug>] [--recheck] <clone-take> [<clone-take> ...]
"""
import difflib, json, os, re, sys, unicodedata
from pathlib import Path
os.environ['HF_HUB_OFFLINE'] = '1'
import soundfile as sf, soxr
from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parents[3]
def project_arg(default='book-hvtt-001-overview'):
    """Another episode of the series: --project <slug> (removed from argv before the script's own options)."""
    if '--project' in sys.argv:
        i = sys.argv.index('--project'); slug = sys.argv[i + 1]; del sys.argv[i:i + 2]; return slug
    return default


PROJECT = project_arg()
RECHECK = '--recheck' in sys.argv
if RECHECK: sys.argv.remove('--recheck')
words = lambda t: re.findall(r'\w+', unicodedata.normalize('NFC', t.lower()))
plain = lambda w: ''.join(c for c in unicodedata.normalize('NFD', w.replace('đ', 'd')) if unicodedata.category(c) != 'Mn')
accent = lambda w: re.sub(r'^x', 's', w)  # the voice's own x → s (not an error)
model = None if RECHECK else WhisperModel('medium', device='cpu', compute_type='int8', cpu_threads=4, download_root=str(ROOT / '.cache/whisper'))

for take in sys.argv[1:]:
    folder = ROOT / 'public' / PROJECT / 'voice-auditions' / take
    manifest = json.loads((folder / 'manifest.json').read_text())
    report = []
    saved = {r['file']: r['heard'] for r in json.loads((folder / 'tone-check.json').read_text())} if RECHECK else {}
    for f in manifest['files']:
        if RECHECK:
            heard = saved[f['file']]
        else:
            audio, sr = sf.read(folder / f['file'], dtype='float32')
            audio = audio.mean(axis=1) if audio.ndim > 1 else audio
            segs, _ = model.transcribe(soxr.resample(audio, sr, 16000), language='vi', beam_size=5)  # no initial_prompt: it would bias ASR toward the script and hide real errors
            heard = ' '.join(s.text.strip() for s in segs)
        want, got = words(f['text']), words(heard)
        tone, other = [], []
        for op, a1, a2, b1, b2 in difflib.SequenceMatcher(a=[accent(plain(w)) for w in want], b=[accent(plain(w)) for w in got], autojunk=False).get_opcodes():
            if op == 'equal':
                tone += [(w, g) for w, g in zip(want[a1:a2], got[b1:b2]) if accent(w) != accent(g)]
            else:
                other.append((' '.join(want[a1:a2]), ' '.join(got[b1:b2])))
        report.append({'file': f['file'], 'text': f['text'], 'heard': heard, 'toneDiffs': tone, 'wordDiffs': other})
        if tone or other:
            print(f"{take}/{f['file']}: dấu {tone} · chữ {other}")
    (folder / 'tone-check.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(f'{take}: {sum(1 for r in report if r["toneDiffs"] or r["wordDiffs"])}/{len(report)} câu cần nghe lại')
