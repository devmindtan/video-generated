#!/usr/bin/env python3
"""Create an original ambient underscore and transition bell, using only Python stdlib."""
import math
from pathlib import Path
import random
import struct
import wave

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'public/stoic/audio'
SR = 24000

def save(path, samples):
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(samples)

def ambient():
    rng = random.Random(31)
    data = bytearray()
    noise = 0.0
    # D minor/add9, Bb major, F major, C suspended: quiet, slow four-chord bed.
    chords = [(73.416, 110, 146.832, 174.614, 220), (58.27, 116.54, 146.832, 174.614, 233.08), (65.406, 130.813, 164.814, 196, 261.626), (65.406, 97.999, 130.813, 146.832, 196)]
    for i in range(45 * SR):
        t = i / SR
        v = 0.0
        right = 0.0
        for ci, notes in enumerate(chords):
            start = ci * 11
            age = t - start
            if age < 0:
                continue
            env = min(age / 3, 1) * min(max((14 - age) / 3, 0), 1)
            if env <= 0:
                continue
            for ni, freq in enumerate(notes):
                # A soft bowed pad with slightly detuned harmonics.
                phase = 2 * math.pi * freq * t
                pad = math.sin(phase) + .22 * math.sin(phase * 2 + .1 * math.sin(t))
                v += .008 * env * pad
                right += .008 * env * (math.sin(phase + .14) + .22 * math.sin(phase * 2 + .14))
        # Sparse struck notes with long exponential decay.
        for note_i, freq in enumerate([293.665, 349.228, 440, 391.995]):
            age = t - (note_i * 9 + 2)
            if age >= 0:
                tone = .032 * math.exp(-age / 3.2) * (1 - math.exp(-age * 55)) * (math.sin(2 * math.pi * freq * age) + .3 * math.sin(2 * math.pi * freq * 2.002 * age))
                v += tone
                right += tone * .85
        noise = .997 * noise + .003 * rng.uniform(-1, 1)
        fade = min(t / 2, 1) * min(max((45 - t) / 3, 0), 1)
        left = (v + noise * .08) * fade
        r = (right + noise * .07) * fade
        data.extend(struct.pack('<hh', int(max(-1, min(1, left)) * 32767), int(max(-1, min(1, r)) * 32767)))
    save(OUT / 'ambient.wav', data)

def bell():
    data = bytearray()
    for i in range(4 * SR):
        t = i / SR
        attack = 1 - math.exp(-t * 95)
        value = sum(amp * math.sin(2 * math.pi * hz * t) * math.exp(-t / decay) for hz, amp, decay in [(110,.12,1.8),(221.2,.055,1.1),(329.5,.025,.7),(554,.012,.5)]) * attack
        fade = min((4 - t) / .3, 1)
        v = int(value * fade * 32767)
        data.extend(struct.pack('<hh', v, v))
    save(OUT / 'bell.wav', data)

if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    ambient()
    bell()
    print('Created original ambient.wav (45s) and bell.wav (4s)')
