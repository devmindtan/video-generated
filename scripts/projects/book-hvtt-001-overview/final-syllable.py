"""Rough length of the last syllable of each sentence in an audition WAV (energy valleys).
Diagnostic for drawn-out sentence endings; not a quality verdict.
Usage: .venv/bin/python scripts/projects/book-hvtt-001-overview/final-syllable.py <take> [<take>...]"""
import json, sys
from pathlib import Path
import numpy as np, soundfile as sf

ROOT = Path(__file__).resolve().parents[3]

def last_syllable(audio, rate, start, end):
    seg = audio[int(start * rate):int(end * rate)]
    hop = int(.01 * rate)
    env = np.array([np.sqrt(np.mean(seg[i:i + hop] ** 2) + 1e-12) for i in range(0, len(seg) - hop, hop)])
    db = 20 * np.log10(env / env.max())
    voiced = np.where(db > -32)[0]
    if not len(voiced): return 0
    stop = voiced[-1]
    smooth = np.convolve(db, np.ones(5) / 5, mode='same')
    # Walk back from the end to the deepest valley within the last 0.9 s.
    window = smooth[max(0, stop - 90):stop - 6]
    valley = max(0, stop - 90) + int(np.argmin(window)) if len(window) else 0
    return (stop - valley) / 100

for take in sys.argv[1:]:
    folder = ROOT / 'public/voice-auditions' / take
    for v in json.loads((folder / 'manifest.json').read_text())['voices']:
        if v.get('status') != 'ready': continue
        audio, rate = sf.read(folder / v['file'])
        ends = [last_syllable(audio, rate, r['startSeconds'], r['endSeconds']) for r in v['phraseRanges']]
        print(f"{take:28} {v['name']:10} {v['durationSeconds']:6.2f}s  tiếng cuối: " + ' '.join(f'{e:.2f}' for e in ends) + f"  (TB {np.mean(ends):.2f}s)")
