#!/usr/bin/env python3
"""Keep only the customer's designed sounds; drop the phone-mic hiss and handling crackle.

Regions come from the spectrogram of source-audio.wav: the CapCut music bed has
true digital silence between beats (0–3.05 s), the sparkle chime runs 3.08–4.10 s
and the whoosh 22.55–23.06 s. From 4.1 s the camera mic is live and only adds a
broadband hiss plus finger/handling clicks, so everything else becomes silence.
The full source-audio.wav is left untouched for comparison.
"""
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[3]
AUDIO = ROOT / 'public/flower-knows-powder/audio'
# (start, end, fade-in, fade-out) in seconds
KEEP = [
    (0.0, 4.2, 0.0, 0.12),   # music bed + sparkle chime
    (22.52, 23.1, 0.01, 0.04),  # whoosh on the powder reveal
]


def main():
    source, sr = sf.read(AUDIO / 'source-audio.wav', dtype='float32', always_2d=True)
    out = np.zeros_like(source)
    for start, end, fade_in, fade_out in KEEP:
        a, b = round(start * sr), min(round(end * sr), len(source))
        gain = np.ones(b - a, dtype=np.float32)
        if fade_in:
            n = round(fade_in * sr)
            gain[:n] = np.linspace(0, 1, n)
        n = round(fade_out * sr)
        gain[-n:] = np.linspace(1, 0, n)
        out[a:b] = source[a:b] * gain[:, None]
    sf.write(AUDIO / 'source-effects.wav', out, sr, subtype='PCM_16')
    print(f'Wrote source-effects.wav: {len(out) / sr:.3f} s, kept {[(s, e) for s, e, *_ in KEEP]}')


if __name__ == '__main__':
    main()
