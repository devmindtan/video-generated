#!/usr/bin/env python3
"""Generate child-friendly cartoon SFX for the Tí Hon short."""
from pathlib import Path
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'public/tiny-dino-adventure/sfx'
SR = 48_000


def write(name: str, audio: np.ndarray, peak: float = .48) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    audio = audio / max(np.max(np.abs(audio)), 1e-9) * peak
    stereo = np.column_stack((audio, audio))
    with wave.open(str(OUT / name), 'wb') as wav:
        wav.setnchannels(2); wav.setsampwidth(2); wav.setframerate(SR)
        wav.writeframes(np.round(stereo * 32767).astype('<i2').tobytes())


def crack() -> np.ndarray:
    d = .72; t = np.arange(round(d * SR)) / SR; rng = np.random.default_rng(18)
    noise = rng.normal(0, 1, len(t)); result = np.zeros_like(t)
    for at, gain in [(.08, 1), (.24, .74), (.43, .9)]:
        age = t - at; mask = age >= 0
        result[mask] += gain * noise[mask] * np.exp(-age[mask] * 38)
    return result + .18 * np.sin(2 * np.pi * 170 * t) * np.exp(-t * 8)


def sneeze() -> np.ndarray:
    d = .85; t = np.arange(round(d * SR)) / SR; rng = np.random.default_rng(4)
    puff = rng.normal(0, 1, len(t)); spectrum = np.fft.rfft(puff)
    f = np.fft.rfftfreq(len(t), 1 / SR); puff = np.fft.irfft(spectrum * np.exp(-((f - 1200) / 850) ** 2), n=len(t))
    e = np.exp(-((t - .34) / .12) ** 2)
    chirp = np.sin(2 * np.pi * (540 * t + 520 * t * t)) * np.exp(-((t - .5) / .2) ** 2)
    return .72 * puff * e + .24 * chirp


def boing() -> np.ndarray:
    d = .64; t = np.arange(round(d * SR)) / SR
    phase = 2 * np.pi * (310 * t - 170 * t * t)
    return (np.sin(phase) + .25 * np.sin(phase * 2)) * np.exp(-t * 5.2)


def whoosh() -> np.ndarray:
    d = 1.15; t = np.arange(round(d * SR)) / SR; rng = np.random.default_rng(27)
    noise = rng.normal(0, 1, len(t)); spectrum = np.fft.rfft(noise)
    f = np.fft.rfftfreq(len(t), 1 / SR); soft = np.fft.irfft(spectrum * np.exp(-(f / 2600) ** 2), n=len(t))
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
    return soft * e + .1 * np.sin(2 * np.pi * (180 * t + 260 * t * t)) * e


if __name__ == '__main__':
    write('egg-crack.wav', crack(), .42)
    write('cute-sneeze.wav', sneeze(), .34)
    write('soft-boing.wav', boing(), .38)
    write('leaf-whoosh.wav', whoosh(), .34)
    print(f'Generated four original SFX in {OUT.relative_to(ROOT)}')
