#!/usr/bin/env python3
"""Create a copyright-safe, original 48-second piano and cello healing score."""
import math
from pathlib import Path
import random
import struct
import wave

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'public/exhausted/audio/original-healing-score.wav'
SR = 24000
DURATION = 48


def envelope(age: float, length: float, attack: float, release: float) -> float:
    if age < 0 or age >= length:
        return 0
    return min(age / attack, 1) * min((length - age) / release, 1)


def main() -> None:
    rng = random.Random(824)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    # Dm(add9) – Bbmaj7 – F(add9) – Csus2, voiced sparsely and slowly.
    chords = [
        (73.42, 110.00, 146.83, 164.81),
        (58.27, 116.54, 146.83, 174.61),
        (65.41, 98.00, 130.81, 196.00),
        (65.41, 98.00, 146.83, 196.00),
    ]
    piano = [
        (1.2, 293.66), (5.8, 349.23), (9.4, 440.00),
        (13.2, 349.23), (17.6, 293.66), (21.0, 261.63),
        (25.4, 349.23), (29.0, 440.00), (33.0, 392.00),
        (36.7, 349.23), (40.8, 440.00), (44.0, 523.25),
    ]
    frames = bytearray()
    filtered_noise = 0.0
    for i in range(DURATION * SR):
        t = i / SR
        chord = chords[min(int(t // 12), 3)]
        chord_age = t % 12
        pad_env = min(chord_age / 2.8, 1) * min((12 - chord_age) / 2.8, 1)
        left = right = 0.0
        for note_index, frequency in enumerate(chord):
            phase = 2 * math.pi * frequency * t
            bowed = math.sin(phase) + 0.17 * math.sin(phase * 2.003 + 0.3)
            drift = math.sin(phase * 0.998 + 0.18) + 0.14 * math.sin(phase * 2.007)
            left += 0.012 * pad_env * bowed
            right += 0.012 * pad_env * drift
        for note_index, (start, frequency) in enumerate(piano):
            age = t - start
            env = envelope(age, 5.2, 0.018, 2.6) * math.exp(-max(age, 0) / 3.1)
            if env:
                tone = math.sin(2 * math.pi * frequency * age)
                tone += 0.24 * math.sin(2 * math.pi * frequency * 2.01 * age)
                tone += 0.08 * math.sin(2 * math.pi * frequency * 3.97 * age)
                pan = -0.22 if note_index % 2 == 0 else 0.22
                left += 0.055 * env * tone * (1 - pan)
                right += 0.055 * env * tone * (1 + pan)
        # A restrained cello line enters as the visual palette warms.
        for start, frequency, length in [(18, 110.0, 8), (26, 116.54, 7), (33, 130.81, 7), (40, 146.83, 7.5)]:
            age = t - start
            env = envelope(age, length, 1.7, 2.2)
            if env:
                vibrato = 1 + 0.0022 * math.sin(2 * math.pi * 4.6 * age)
                cello = math.sin(2 * math.pi * frequency * vibrato * age)
                cello += 0.28 * math.sin(2 * math.pi * frequency * 2 * age)
                left += 0.022 * env * cello
                right += 0.024 * env * cello
        filtered_noise = 0.9992 * filtered_noise + 0.0008 * rng.uniform(-1, 1)
        left += filtered_noise * 0.018
        right += filtered_noise * 0.016
        # Leave roughly 5dB of source headroom; Remotion mixes this below narration.
        master = 3.9
        l = int(max(-1, min(1, left * master)) * 32767)
        r = int(max(-1, min(1, right * master)) * 32767)
        frames.extend(struct.pack('<hh', l, r))
    with wave.open(str(OUT), 'wb') as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(SR)
        wav.writeframes(frames)
    print(f'Created {OUT.relative_to(ROOT)} ({DURATION}s, original piano + cello ambient)')


if __name__ == '__main__':
    main()
