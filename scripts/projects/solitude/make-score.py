#!/usr/bin/env python3
"""Create an original, copyright-safe 52-second dark piano/cello score."""
import math
from pathlib import Path
import random
import struct
import wave

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'public/solitude/audio/original-solitude-score.wav'
SR = 24000
DURATION = 52


def envelope(age: float, length: float, attack: float, release: float) -> float:
    if age < 0 or age >= length:
        return 0
    return min(age / attack, 1) * min((length - age) / release, 1)


def main() -> None:
    rng = random.Random(1107)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    # Dm(add9) – Bbmaj7 – Gm(add9) – Asus4; resolve only in the final scene.
    chords = [
        (73.42, 110.00, 146.83, 164.81),
        (58.27, 116.54, 146.83, 174.61),
        (49.00, 98.00, 146.83, 164.81),
        (55.00, 110.00, 146.83, 164.81),
    ]
    piano = [(1.3, 293.66), (6.4, 349.23), (10.2, 293.66), (15.5, 261.63),
             (20.8, 349.23), (25.5, 440.00), (30.2, 392.00), (35.0, 349.23),
             (39.6, 440.00), (44.9, 523.25), (48.1, 587.33)]
    frames = bytearray()
    filtered_noise = 0.0
    for i in range(DURATION * SR):
        t = i / SR
        chord = chords[min(int(t // 13), 3)]
        chord_age = t % 13
        pad_env = min(chord_age / 3.2, 1) * min((13 - chord_age) / 3.0, 1)
        left = right = 0.0
        for frequency in chord:
            phase = 2 * math.pi * frequency * t
            left += 0.0105 * pad_env * (math.sin(phase) + 0.16 * math.sin(phase * 2.002 + 0.2))
            right += 0.0105 * pad_env * (math.sin(phase * 0.999 + 0.16) + 0.13 * math.sin(phase * 2.006))
        for note_index, (start, frequency) in enumerate(piano):
            age = t - start
            env = envelope(age, 5.8, 0.025, 3.0) * math.exp(-max(age, 0) / 3.6)
            if env:
                tone = math.sin(2 * math.pi * frequency * age) + 0.23 * math.sin(2 * math.pi * frequency * 2.01 * age)
                pan = -0.2 if note_index % 2 == 0 else 0.2
                left += 0.05 * env * tone * (1 - pan)
                right += 0.05 * env * tone * (1 + pan)
        for start, frequency, length in [(18.5, 98.0, 8), (27, 110.0, 8), (35, 116.54, 8), (43, 146.83, 8.5)]:
            age = t - start
            env = envelope(age, length, 1.8, 2.4)
            if env:
                vibrato = 1 + 0.002 * math.sin(2 * math.pi * 4.4 * age)
                cello = math.sin(2 * math.pi * frequency * vibrato * age) + 0.27 * math.sin(4 * math.pi * frequency * age)
                left += 0.021 * env * cello
                right += 0.023 * env * cello
        filtered_noise = 0.9993 * filtered_noise + 0.0007 * rng.uniform(-1, 1)
        left += filtered_noise * 0.014
        right += filtered_noise * 0.012
        master = 4.1
        frames.extend(struct.pack('<hh', int(max(-1, min(1, left * master)) * 32767), int(max(-1, min(1, right * master)) * 32767)))
    with wave.open(str(OUT), 'wb') as wav:
        wav.setnchannels(2); wav.setsampwidth(2); wav.setframerate(SR); wav.writeframes(frames)
    print(f'Created {OUT.relative_to(ROOT)} ({DURATION}s, original piano + cello ambient)')


if __name__ == '__main__':
    main()
