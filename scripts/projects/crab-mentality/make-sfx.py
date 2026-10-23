#!/usr/bin/env python3
"""Generate the two authored sound effects for the crab-mentality short."""
from pathlib import Path
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'public/crab-mentality/sfx'
SR = 48_000


def write_wav(name: str, audio: np.ndarray, target_peak: float = 0.52) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    peak = np.max(np.abs(audio)) or 1
    audio = np.clip(audio / peak * target_peak, -1, 1)
    stereo = np.column_stack((audio, audio))
    with wave.open(str(OUT / name), 'wb') as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(SR)
        wav.writeframes(np.round(stereo * 32767).astype('<i2').tobytes())


def smoothstep(value: np.ndarray) -> np.ndarray:
    value = np.clip(value, 0, 1)
    return value * value * (3 - 2 * value)


def soften_with_echoes(audio: np.ndarray, taps: list[tuple[float, float]]) -> np.ndarray:
    result = audio.copy()
    for delay_seconds, gain in taps:
        delay = round(delay_seconds * SR)
        result[delay:] += audio[:-delay] * gain
    return result


def soft_scene_swell() -> np.ndarray:
    duration = 2.2
    t = np.arange(round(duration * SR)) / SR
    frequency = 52 * np.exp(np.log(36 / 52) * t / duration)
    phase = 2 * np.pi * np.cumsum(frequency) / SR
    attack = smoothstep(t / .62)
    release = smoothstep((duration - t) / 1.18)
    envelope = attack * release
    rng = np.random.default_rng(8)
    spectrum = np.fft.rfft(rng.normal(0, 1, len(t)))
    frequencies = np.fft.rfftfreq(len(t), 1 / SR)
    soft_air = np.fft.irfft(spectrum * np.exp(-((frequencies / 520) ** 2)), n=len(t))
    soft_air /= np.max(np.abs(soft_air)) or 1
    body = .68 * np.sin(phase) + .2 * np.sin(phase * .5) + .12 * soft_air
    return soften_with_echoes(body * envelope, [(.14, .16), (.29, .09)])


def soft_metal_glide() -> np.ndarray:
    duration = 1.8
    t = np.arange(round(duration * SR)) / SR
    rng = np.random.default_rng(25)
    spectrum = np.fft.rfft(rng.normal(0, 1, len(t)))
    frequencies = np.fft.rfftfreq(len(t), 1 / SR)
    band = np.exp(-.5 * ((frequencies - 2050) / 1050) ** 2)
    brushed_metal = np.fft.irfft(spectrum * band, n=len(t))
    brushed_metal /= np.max(np.abs(brushed_metal)) or 1
    shimmer = (
        .5 * np.sin(2 * np.pi * 1640 * t + .3)
        + .3 * np.sin(2 * np.pi * 2370 * t + 1.2)
        + .2 * np.sin(2 * np.pi * 3180 * t + 2.1)
    )
    attack = smoothstep(t / .42)
    release = smoothstep((duration - t) / .92)
    envelope = attack * release
    texture = (.7 * brushed_metal + .3 * shimmer) * envelope
    return soften_with_echoes(texture, [(.095, .18), (.19, .11), (.34, .055)])


if __name__ == '__main__':
    write_wav('soft-scene-swell.wav', soft_scene_swell(), target_peak=.48)
    write_wav('soft-metal-glide.wav', soft_metal_glide(), target_peak=.42)
    print(f'Generated SFX in {OUT}')

