#!/usr/bin/env python3
"""Create restrained, original comedy foley for the supplied skincare footage."""
import json
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'public/skin-care-nhuy/sfx'
SR = 48000
RNG = np.random.default_rng(251025)


def envelope(length, attack=.01, release=.08):
    env = np.ones(length)
    a = min(length, round(attack * SR))
    r = min(length, round(release * SR))
    if a:
        env[:a] = np.linspace(0, 1, a)
    if r:
        env[-r:] = np.linspace(1, 0, r)
    return env


def tone(duration, frequencies, decay=5.0):
    t = np.arange(round(duration * SR)) / SR
    value = sum(np.sin(2 * np.pi * f * t) for f in frequencies) / len(frequencies)
    return value * np.exp(-decay * t) * envelope(len(t), .004, .05)


def filtered_noise(duration, low, high):
    n = round(duration * SR)
    raw = RNG.normal(0, 1, n)
    freqs = np.fft.rfftfreq(n, 1 / SR)
    spectrum = np.fft.rfft(raw)
    spectrum *= np.clip((freqs - low) / max(low * .35, 1), 0, 1)
    spectrum *= np.clip((high - freqs) / max(high * .25, 1), 0, 1)
    value = np.fft.irfft(spectrum, n)
    return value / max(np.max(np.abs(value)), 1e-9)


def save(name, value, peak=.22):
    value = value * (peak / max(np.max(np.abs(value)), 1e-9))
    stereo = np.column_stack((value, value))
    path = OUT / f'{name}.wav'
    if path.exists():
        raise FileExistsError(f'Preserving existing edit: {path}')
    sf.write(path, stereo, SR, subtype='PCM_16')
    return {
        'file': str(path.relative_to(ROOT / 'public')),
        'durationSeconds': round(len(value) / SR, 3),
        'peakDbFS': round(float(20 * np.log10(np.max(np.abs(value)))), 2),
        'origin': 'Original deterministic local synthesis; not a field recording',
    }


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    pickup = filtered_noise(.55, 180, 2600) * envelope(round(.55 * SR), .04, .18)
    x = np.arange(len(pickup)) / SR
    pickup *= .25 + .75 * np.sin(np.pi * np.clip(x / .55, 0, 1))

    page_flip = filtered_noise(.42, 600, 6500) * envelope(round(.42 * SR), .015, .16)
    page_flip *= .55 + .45 * np.sin(2 * np.pi * 11 * np.arange(len(page_flip)) / SR)

    cap_click = tone(.18, [420, 910, 1540], 15)

    squeeze = filtered_noise(.48, 70, 900) * envelope(round(.48 * SR), .05, .17)
    squeeze += .32 * tone(.48, [115, 165], 4)

    rub = filtered_noise(.75, 220, 1800) * envelope(round(.75 * SR), .09, .22)
    rub *= .58 + .42 * np.sin(2 * np.pi * 6.2 * np.arange(len(rub)) / SR)

    sparkle = tone(.8, [880, 1320, 1760], 3.8)
    upper = tone(.5, [1175, 1760, 2350], 5)
    upper = np.pad(upper, (round(.18 * SR), len(sparkle) - round(.18 * SR) - len(upper)))
    sparkle += upper * .7

    pop = tone(.24, [125, 250], 12)
    pop += .22 * filtered_noise(.24, 140, 1400) * envelope(round(.24 * SR), .002, .1)

    report = {
        'sampleRate': SR,
        'design': 'Deliberate quiet under speech; foley marks actual handling, texture and final product reveal.',
        'cues': [
            {'name': 'pickup-whoosh', 'atSeconds': 5.4, **save('pickup-whoosh', pickup, .12)},
            {'name': 'label-flip', 'atSeconds': 8.15, **save('label-flip', page_flip, .1)},
            {'name': 'cap-click', 'atSeconds': 11.05, **save('cap-click', cap_click, .18)},
            {'name': 'cream-squeeze', 'atSeconds': 13.45, **save('cream-squeeze', squeeze, .11)},
            {'name': 'rub-soft', 'atSeconds': 20.75, **save('rub-soft', rub, .08)},
            {'name': 'hero-sparkle', 'atSeconds': 24.0, **save('hero-sparkle', sparkle, .12)},
            {'name': 'outro-pop', 'atSeconds': 29.35, **save('outro-pop', pop, .16)},
        ],
    }
    (OUT / 'provenance.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
