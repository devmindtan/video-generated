#!/usr/bin/env python3
"""Generate quiet, object-attached foley for the reciprocity-trap short."""
from pathlib import Path
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'public/reciprocity-trap/sfx'
SR = 48_000


def smoothstep(value: np.ndarray) -> np.ndarray:
    value = np.clip(value, 0, 1)
    return value * value * (3 - 2 * value)


def write_wav(name: str, audio: np.ndarray, target_peak: float) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    peak = np.max(np.abs(audio)) or 1
    audio = np.clip(audio / peak * target_peak, -1, 1)
    stereo = np.column_stack((audio, audio))
    with wave.open(str(OUT / name), 'wb') as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(SR)
        wav.writeframes(np.round(stereo * 32767).astype('<i2').tobytes())


def band_noise(length: int, seed: int, center: float, width: float) -> np.ndarray:
    rng = np.random.default_rng(seed)
    spectrum = np.fft.rfft(rng.normal(0, 1, length))
    frequencies = np.fft.rfftfreq(length, 1 / SR)
    band = np.exp(-.5 * ((frequencies - center) / width) ** 2)
    result = np.fft.irfft(spectrum * band, n=length)
    return result / (np.max(np.abs(result)) or 1)


def brass_scale_shift() -> np.ndarray:
    duration = 1.9
    t = np.arange(round(duration * SR)) / SR
    air = band_noise(len(t), 31, 720, 520)
    movement = np.zeros_like(t)
    for onset, gain, frequency in [(.22, .8, 318), (.54, .48, 406), (.91, .25, 512)]:
        local = np.maximum(0, t - onset)
        movement += gain * np.sin(2 * np.pi * frequency * local) * np.exp(-local * 5.2) * (t >= onset)
    envelope = smoothstep(t / .38) * smoothstep((duration - t) / .82)
    return (.72 * movement + .28 * air) * envelope


def soft_chain_settle() -> np.ndarray:
    duration = 2.15
    t = np.arange(round(duration * SR)) / SR
    texture = band_noise(len(t), 74, 1450, 900)
    result = np.zeros_like(t)
    for onset, gain, decay in [(.16, .78, 8.5), (.48, .56, 9.2), (.82, .36, 10), (1.15, .2, 11)]:
        local = np.maximum(0, t - onset)
        ring = (.68 * np.sin(2 * np.pi * 1160 * local) + .32 * np.sin(2 * np.pi * 1730 * local + .7))
        result += gain * (ring + .42 * texture) * np.exp(-local * decay) * (t >= onset)
    return result * smoothstep(t / .2) * smoothstep((duration - t) / .72)


if __name__ == '__main__':
    write_wav('brass-scale-shift.wav', brass_scale_shift(), target_peak=.31)
    write_wav('soft-chain-settle.wav', soft_chain_settle(), target_peak=.27)
    print(f'Generated subtle foley in {OUT}')
