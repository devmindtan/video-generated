#!/usr/bin/env python3
"""Original, copyright-safe sound for the reusable "Đọc sách, hiểu mình" intro (synthesized locally).

intro-score.wav  40 s bed in D major, 76 BPM: soft piano arpeggios and warm string pad (classic) over an
                 airy shimmer and a quiet sub pulse (modern). Full-length source so Studio can move/trim it.
frame-swell.wav  1.8 s air/paper swell under the gold frame drawing in.
title-chime.wav  bell + piano dyad for the title reveal.
card-resolve.wav low piano chord + bell when the episode book card appears.
All synthesized here (no samples, no recordings, no paid service). Nothing is applied to other projects.
"""
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import fftconvolve, butter, sosfilt

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'public/book-hvtt-001-overview/audio'
SR = 48000
BEAT = 60 / 76
rng = np.random.default_rng(1207)


def hz(midi):
    return 440 * 2 ** ((midi - 69) / 12)


def reverb(seconds=2.6, decay=3.2):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal((n, 2)) * np.exp(-decay * t)[:, None]
    ir = sosfilt(butter(2, 5200, 'low', fs=SR, output='sos'), ir, axis=0)
    ir[0] = 1.0
    return ir / np.sqrt((ir ** 2).sum(axis=0))


IR = reverb()


def wet(dry, mix=.32):
    tail = np.stack([fftconvolve(dry[:, c], IR[:, c])[:len(dry)] for c in range(2)], axis=1)
    return dry * (1 - mix) + tail * mix * 2.2


def piano(freq, length, vel=1.0):
    t = np.arange(int(length * SR)) / SR
    tone = np.zeros_like(t)
    for k, amp in enumerate([1, .42, .2, .11, .05, .03], start=1):
        f = freq * k * np.sqrt(1 + .0004 * k * k)  # slight string inharmonicity
        tone += amp * np.sin(2 * np.pi * f * t) * np.exp(-t * (1.1 + .55 * k))
    hammer = np.minimum(t / .004, 1)
    return vel * hammer * tone * np.exp(-t * .45)


def bell(freq, length, vel=1.0):
    t = np.arange(int(length * SR)) / SR
    tone = sum(a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t * d)
               for r, a, d in [(1, 1, 1.2), (2.76, .45, 2.4), (5.40, .22, 4.2), (8.93, .1, 6.5)])
    return vel * np.minimum(t / .002, 1) * tone


def pad(freqs, length):
    t = np.arange(int(length * SR)) / SR
    left = np.zeros_like(t)
    right = np.zeros_like(t)
    for f in freqs:
        for k in range(1, 7):
            amp = 1 / k ** 1.6
            left += amp * np.sin(2 * np.pi * f * k * 1.0015 * t + k)
            right += amp * np.sin(2 * np.pi * f * k * .9985 * t + 2 * k)
    env = np.minimum(t / 1.6, 1) * np.minimum((length - t) / 1.4, 1)
    sig = np.stack([left, right], axis=1) * env[:, None]
    return sosfilt(butter(2, 1500, 'low', fs=SR, output='sos'), sig, axis=0)


def place(buf, sig, at, pan=0.0, gain=1.0):
    i = int(at * SR)
    if sig.ndim == 1:
        sig = np.stack([sig * (1 - pan) ** .5, sig * (1 + pan) ** .5], axis=1) / np.sqrt(2)
    if i >= len(buf):
        return
    end = min(len(buf), i + len(sig))
    buf[i:end] += sig[:end - i] * gain


def score(seconds=40.0):
    buf = np.zeros((int(seconds * SR), 2))
    # Dmaj9 – Bm7 – Gmaj7 – Asus4/A, one chord per bar of 4 beats.
    chords = [[50, 57, 62, 64, 66], [47, 54, 59, 62, 66], [43, 50, 55, 59, 62], [45, 52, 57, 62, 64]]
    bar = 4 * BEAT
    for b in range(int(seconds // bar) + 1):
        start, chord = b * bar, chords[b % 4]
        place(buf, pad([hz(n) for n in chord[:3]], bar + 1.2), start, gain=.05)
        # Broken-chord piano in eighths, gentle and slightly humanized.
        pattern = [chord[1] + 12, chord[2] + 12, chord[3] + 12, chord[4] + 12, chord[3] + 12, chord[2] + 12, chord[3] + 12, chord[4] + 12]
        for e, note in enumerate(pattern):
            at = start + e * BEAT / 2 + rng.normal(0, .006)
            vel = (.55 if e % 2 == 0 else .38) * (.8 if b == 0 else 1)
            place(buf, piano(hz(note), 2.4, vel), at, pan=(-.35 if e % 2 else .35), gain=.07)
        place(buf, piano(hz(chord[0] - 12), 3.2, .9), start, gain=.09)
        # Melody enters from bar 3: one long note per bar, top of the voicing.
        if b >= 2:
            melody = [74, 73, 71, 69][b % 4]
            place(buf, piano(hz(melody + 12), 3.0, .8), start + BEAT * .02, gain=.06)
        # Quiet sub pulse on beats 1 and 3 from bar 2: the modern layer, felt more than heard.
        if b >= 1:
            for k in (0, 2):
                t = np.arange(int(.5 * SR)) / SR
                thump = np.sin(2 * np.pi * (hz(chord[0] - 12) / 2) * t) * np.exp(-t * 9)
                place(buf, thump, start + k * BEAT, gain=.09)
    # Airy shimmer: band-passed noise breathing slowly across the bed.
    noise = sosfilt(butter(2, [3500, 9000], 'band', fs=SR, output='sos'), rng.standard_normal((len(buf), 2)), axis=0)
    breath = .5 + .5 * np.sin(2 * np.pi * np.arange(len(buf)) / SR / (8 * BEAT))
    buf += noise * breath[:, None] * .006
    return wet(buf, .3)


def frame_swell():
    n = int(1.8 * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal((n, 2))
    out = np.zeros_like(noise)
    # Low-pass opening from 600 Hz to 6 kHz: paper/air rising, then settles.
    for i, cut in enumerate(np.geomspace(600, 6000, 12)):
        seg = slice(i * n // 12, (i + 1) * n // 12)
        out[seg] = sosfilt(butter(2, cut, 'low', fs=SR, output='sos'), noise, axis=0)[seg]
    env = np.minimum(t / 1.2, 1) * np.minimum((1.8 - t) / .45, 1)
    return wet(out * env[:, None] * .5, .45)


def title_chime():
    buf = np.zeros((int(4.5 * SR), 2))
    place(buf, bell(hz(86), 4.2, .5), 0, pan=-.2)
    place(buf, bell(hz(81), 4.2, .35), .09, pan=.25)
    place(buf, piano(hz(62), 4.0, .7), 0, gain=.6)
    place(buf, piano(hz(69), 4.0, .5), .02, gain=.6)
    return wet(buf, .45)


def card_resolve():
    buf = np.zeros((int(4.5 * SR), 2))
    for note, delay in [(38, 0), (50, .01), (57, .03), (62, .05), (66, .07)]:
        place(buf, piano(hz(note), 4.2, .7), delay, gain=.55)
    place(buf, bell(hz(81), 4.0, .3), .12, pan=.2)
    return wet(buf, .5)


def write(name, sig, peak_db):
    sig = sig / np.max(np.abs(sig)) * 10 ** (peak_db / 20)
    fade = min(len(sig) // 4, int(.05 * SR))
    sig[-fade:] *= np.linspace(1, 0, fade)[:, None]
    sf.write(OUT / name, sig, SR, subtype='PCM_24')
    print(f'{name}: {len(sig) / SR:.1f} s, peak {peak_db} dBFS')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    write('intro-score.wav', score(), -6)
    write('frame-swell.wav', frame_swell(), -9)
    write('title-chime.wav', title_chime(), -6)
    write('card-resolve.wav', card_resolve(), -6)


if __name__ == '__main__':
    main()
