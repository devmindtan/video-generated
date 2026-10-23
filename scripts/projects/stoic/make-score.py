#!/usr/bin/env python3
"""Create an original 45-second modern dark-cinematic score with NumPy.

The arrangement is designed for short-form narration: a restrained sub pulse,
muted impacts at chapter changes, airy texture and a sparse glass motif. No
downloaded samples or third-party music are used.
"""
import json
from pathlib import Path
import wave

import numpy as np

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'public/stoic/audio'
SR = 24000
DURATION = 45
N = SR * DURATION
RNG = np.random.default_rng(31051992)


def envelope(length, attack, release, curve=1.0):
    env = np.ones(length)
    a = min(length, max(1, int(attack * SR)))
    r = min(length, max(1, int(release * SR)))
    env[:a] = np.linspace(0, 1, a) ** curve
    env[-r:] = np.linspace(1, 0, r) ** curve
    return env


def pan(mono, position=0.0):
    left = np.sqrt((1 - position) / 2)
    right = np.sqrt((1 + position) / 2)
    return np.column_stack((mono * left, mono * right))


def add(track, signal, start):
    offset = max(0, round(start * SR))
    signal = signal[:max(0, N - offset)]
    track[offset:offset + len(signal)] += signal


def tone(freq, seconds, gain, harmonics=(1.0,), attack=.01, release=.2):
    length = round(seconds * SR)
    t = np.arange(length) / SR
    phase = RNG.uniform(0, 2 * np.pi)
    mono = np.zeros(length)
    for i, weight in enumerate(harmonics, 1):
        mono += np.sin(2 * np.pi * freq * i * t + phase / i) * weight
    mono /= max(1, sum(abs(x) for x in harmonics))
    return mono * envelope(length, attack, release, 1.4) * gain


def lowpass_noise(seconds, cutoff_hz, gain):
    length = round(seconds * SR)
    raw = RNG.normal(0, 1, length)
    alpha = 1 - np.exp(-2 * np.pi * cutoff_hz / SR)
    filtered = np.empty(length)
    filtered[0] = raw[0]
    for i in range(1, length):
        filtered[i] = filtered[i - 1] + alpha * (raw[i] - filtered[i - 1])
    filtered /= max(np.std(filtered), 1e-9)
    return filtered * envelope(length, 1.8, 2.2) * gain


def pulse(freq, seconds=.42, gain=.16):
    length = round(seconds * SR)
    t = np.arange(length) / SR
    pitch_drop = freq * t + 5.5 * (1 - np.exp(-t * 18))
    body = np.sin(2 * np.pi * pitch_drop)
    click = RNG.normal(0, 1, length) * np.exp(-t * 38) * .035
    return (body * np.exp(-t * 8.5) + click) * gain


def impact(seconds=2.2, gain=.23):
    length = round(seconds * SR)
    t = np.arange(length) / SR
    sub = np.sin(2 * np.pi * (47 * t - 11 * t * t)) * np.exp(-t * 2.4)
    air = RNG.normal(0, 1, length) * np.exp(-t * 7)
    air = np.convolve(air, np.ones(31) / 31, mode='same')
    return (sub + air * .55) * gain * envelope(length, .006, .5)


def glass_note(freq, seconds=2.8, gain=.055):
    length = round(seconds * SR)
    t = np.arange(length) / SR
    mono = (np.sin(2 * np.pi * freq * t) +
            .42 * np.sin(2 * np.pi * freq * 2.01 * t) +
            .19 * np.sin(2 * np.pi * freq * 3.98 * t)) * np.exp(-t * 1.55)
    return mono * envelope(length, .012, .55) * gain


def write(path, data):
    with wave.open(str(path), 'wb') as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(SR)
        wav.writeframes(np.round(np.clip(data, -1, 1) * 32767).astype('<i2').tobytes())


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    score = np.zeros((N, 2))

    add(score, pan(lowpass_noise(DURATION, 210, .018), -.22), 0)
    add(score, pan(tone(36.71, DURATION, .032, (1, .25, .12), 2.0, 2.0), -.1), 0)
    add(score, pan(tone(55.00, DURATION, .018, (1, .2), 2.5, 2.0), .16), 0)

    beat = 60 / 72
    for index, start in enumerate(np.arange(.95, 44.3, beat)):
        accent = index % 4 == 0
        add(score, pan(pulse(49 if accent else 55, gain=.145 if accent else .09), -.08), float(start))
        if index % 4 in (1, 3):
            add(score, pan(pulse(73.42, seconds=.28, gain=.035), .25), float(start + beat * .5))

    for start, gain in [(0, .20), (7, .24), (18, .25), (30, .26), (40, .22)]:
        add(score, pan(impact(gain=gain), 0), start)

    motif = [(2.2, 293.66), (5.4, 349.23), (9.6, 261.63), (15.0, 220.00),
             (20.7, 293.66), (25.2, 349.23), (32.4, 261.63), (37.1, 220.00),
             (41.3, 293.66), (43.0, 349.23)]
    for i, (start, freq) in enumerate(motif):
        dry = glass_note(freq)
        add(score, pan(dry, -.3 if i % 2 == 0 else .3), start)
        add(score, pan(dry * .22, .3 if i % 2 == 0 else -.3), start + .19)

    dry = score.copy()
    for delay, gain in [(.127, .10), (.271, .07), (.463, .045)]:
        samples = round(delay * SR)
        score[samples:] += dry[:-samples, ::-1] * gain

    timeline = np.arange(N) / SR
    score *= (np.clip(timeline / .65, 0, 1) * np.clip((45 - timeline) / 1.35, 0, 1))[:, None]
    rms = float(np.sqrt(np.mean(score ** 2)))
    score *= 10 ** (-22 / 20) / max(rms, 1e-9)
    peak = float(np.max(np.abs(score)))
    if peak > .76:
        score *= .76 / peak

    filename = 'stoic-modern-cinematic.wav'
    write(OUT / filename, score)
    metadata = {
        'title': 'Sức Mạnh Tĩnh Lặng',
        'file': filename,
        'durationSeconds': DURATION,
        'bpm': 72,
        'key': 'D minor',
        'style': 'Modern dark cinematic pulse, sub bass, impacts and sparse glass motif',
        'arrangement': 'Original procedural composition created for this video',
        'samples': 'None',
        'license': 'Original project asset',
        'rmsDbFS': round(20 * np.log10(np.sqrt(np.mean(score ** 2))), 2),
        'peakDbFS': round(20 * np.log10(np.max(np.abs(score))), 2),
    }
    (OUT / 'music-credits.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(metadata, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
