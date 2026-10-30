#!/usr/bin/env python3
"""Create an original 48-second playful marimba and xylophone score."""
import math
from pathlib import Path
import random
import struct
import wave

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'public/tiny-dino-adventure/audio/tiny-dino-playful-score.wav'
SR = 24_000
DURATION = 48


def env(age: float, length: float, attack: float, release: float) -> float:
    if age < 0 or age >= length:
        return 0
    return min(age / attack, 1) * min((length - age) / release, 1)


def pluck(age: float, frequency: float, decay: float = 4.8) -> float:
    if age < 0:
        return 0
    e = math.exp(-age * decay)
    return e * (
        math.sin(2 * math.pi * frequency * age)
        + .34 * math.sin(2 * math.pi * frequency * 2.01 * age)
        + .12 * math.sin(2 * math.pi * frequency * 3.98 * age)
    )


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    rng = random.Random(731)
    melody = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880.00, 783.99]
    bass = [130.81, 174.61, 146.83, 196.00]
    notes = []
    for step in range(96):
        start = step * .5
        degree = (step + (step // 16) * 2) % len(melody)
        if step % 8 not in (6, 7):
            notes.append((start, melody[degree], -.22 if step % 2 == 0 else .22))
        if step % 4 == 0:
            notes.append((start, melody[(degree + 2) % len(melody)] / 2, .05))
    frames = bytearray()
    shaker = 0.0
    for i in range(DURATION * SR):
        t = i / SR
        left = right = 0.0
        for start, frequency, pan in notes[max(0, int(t * 2) - 3):int(t * 2) + 1]:
            age = t - start
            tone = pluck(age, frequency)
            left += .032 * tone * (1 - pan)
            right += .032 * tone * (1 + pan)
        bar = int(t // 4)
        base = bass[bar % len(bass)]
        age = t % 1
        marimba = pluck(age, base, 6.2)
        left += .045 * marimba
        right += .042 * marimba
        beat = t % .5
        shaker = .72 * shaker + .28 * rng.uniform(-1, 1)
        shake_env = env(beat, .11, .008, .09)
        left += .007 * shaker * shake_env
        right += .008 * shaker * shake_env
        # Gentle warm pad keeps the short cue connected between notes.
        pad = .006 * math.sin(2 * math.pi * base * t) + .004 * math.sin(2 * math.pi * base * 1.5 * t)
        left += pad
        right += pad
        master_fade = min(t / .5, 1, (DURATION - t) / 1.2)
        master = 4.2 * max(0, master_fade)
        frames.extend(struct.pack('<hh', int(max(-1, min(1, left * master)) * 32767), int(max(-1, min(1, right * master)) * 32767)))
    with wave.open(str(OUT), 'wb') as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(SR)
        wav.writeframes(frames)
    print(f'Created {OUT.relative_to(ROOT)} ({DURATION}s, original marimba + xylophone)')


if __name__ == '__main__':
    main()
