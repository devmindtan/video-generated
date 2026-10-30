"""Layered original sound design, offline; stylized synthesis, not recorded foley.

Separate stereo ambience and material cues. V1 remains untouched. No master
mix export: only editable source stems used by Remotion are written.
"""
import hashlib
import json
from pathlib import Path
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'public/right-advice/audio/sound-v2'
SR = 24000
RNG = np.random.default_rng(24102602)


def noise(duration, low=100, high=7000, slope=0):
    n = round(duration * SR)
    f = np.fft.rfftfreq(n, 1 / SR)
    weight = np.clip((f - low) / 120, 0, 1) * np.clip((high - f) / 600, 0, 1)
    weight *= (np.maximum(f, 100) / 1000) ** slope
    y = np.fft.irfft(np.fft.rfft(RNG.normal(size=n)) * weight, n)
    return y / max(np.std(y), 1e-9)


def edges(y, attack=.02, release=.1):
    t = np.arange(len(y)) / SR
    env = np.minimum(np.clip(t / attack, 0, 1), np.clip((len(y) / SR - t) / release, 0, 1))
    return y * env.reshape((-1,) + (1,) * (y.ndim - 1))


def stereo(y, pan=0):
    return y[:, None] * np.array([np.sqrt((1 - pan) / 2), np.sqrt((1 + pan) / 2)])


def place(target, y, at, pan=0, gain=1):
    start = round(at * SR)
    values = stereo(y, pan) if y.ndim == 1 else y
    count = min(len(target) - start, len(values))
    if count > 0:
        target[start:start + count] += values[:count] * gain


def reflections(y):
    # Dry attack remains; early reflections give material a small physical space.
    out = y.copy()
    for delay, gain in [(.023, .12), (.047, .07), (.079, .04)]:
        n = round(delay * SR)
        out[n:] += y[:-n, ::-1] * gain
    return out


def modal_hit(duration, frequencies, decay, hardness=1):
    t = np.arange(round(duration * SR)) / SR
    body = np.zeros(len(t))
    for i, f in enumerate(frequencies):
        body += np.sin(2 * np.pi * f * t + RNG.uniform(-.2, .2)) * np.exp(-t * decay * (1 + i * .19)) / (1 + i * .65)
    transient = noise(duration, 800, 8000) * np.exp(-t * 150) * hardness
    return edges(body + transient, .0015, .07)


def save(name, values, purpose, rms_db=None, peak=.24):
    if rms_db is not None:
        values *= 10 ** (rms_db / 20) / max(np.sqrt(np.mean(values ** 2)), 1e-9)
        values *= min(1, peak / max(np.max(np.abs(values)), 1e-9))
    else:
        values *= peak / max(np.max(np.abs(values)), 1e-9)
    values = edges(values, .004, .08)
    path = OUT / (name + '.wav')
    sf.write(path, values, SR, subtype='PCM_16')
    return {'file': str(path.relative_to(ROOT / 'public')), 'durationSeconds': len(values) / SR, 'purpose': purpose, 'peakDbFS': round(float(20 * np.log10(np.max(np.abs(values)) + 1e-12)), 2), 'rmsDbFS': round(float(20 * np.log10(np.sqrt(np.mean(values ** 2)) + 1e-12)), 2), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}


def main():
    names = ['crossroads-air', 'shelf-room', 'balance-room', 'clearing-air', 'wood-strain', 'bottle-contact', 'porcelain-break', 'brass-mechanism']
    if any((OUT / (name + '.wav')).exists() for name in names):
        raise FileExistsError('Preserve existing audition: choose sound-v3 to regenerate')
    OUT.mkdir(parents=True, exist_ok=True)
    report = []

    # Broad, irregular air. No pure whistle/beep; mono-compatible common core.
    for name, duration, low, high, level, attack, release in [
        ('crossroads-air', 8.4, 100, 4100, -32, .65, 1.2),
        ('shelf-room', 20.5, 170, 2100, -39, .55, .65),
        ('balance-room', 9.8, 140, 1800, -41, .45, 1.1),
        ('clearing-air', 3.8, 180, 2900, -36, .6, 2.1),
    ]:
        t = np.arange(round(duration * SR)) / SR
        common = noise(duration, low, high, -.45)
        sway = .65 + .19 * np.sin(t * 1.13 + .7) + .12 * np.sin(t * .47)
        width = noise(duration, low + 80, high, -.3) * .22
        y = np.column_stack([common + width, common - width]) * sway[:, None]
        y = edges(y, attack, release)
        report.append(save(name, y, 'Scene-specific spatial bed; withdraw to silence in ending', rms_db=level, peak=.13))

    # Weathered signpost: friction rasp plus a short wood-body response, not a tone.
    y = np.zeros((round(6.4 * SR), 2))
    for at, duration, pan, gain in [(.18, .65, -.32, 1), (2.45, .82, .25, .72), (4.86, .55, -.12, .5)]:
        t = np.arange(round(duration * SR)) / SR
        friction = noise(duration, 280, 2800, -.3) * (.5 + .5 * np.maximum(0, np.sin(2 * np.pi * (39 * t + 12 * t*t))))
        wood = modal_hit(duration, [230, 419, 771, 1260, 1845], 17, .13)
        place(y, edges(friction * .32 + wood * .22, .045, .16), at, pan, gain)
    report.append(save('wood-strain', reflections(y), 'Irregular signpost timber strain in wind, different positions', peak=.19))

    # Two restrained bottle contacts with dense glass resonances and wooden base.
    y = np.zeros((round(2.4 * SR), 2))
    for at, pan, gain, ratio in [(.13, -.2, 1, 1), (.49, .23, .48, .88)]:
        hit = modal_hit(1.1, np.array([1280, 2165, 3320, 4770, 6230]) * ratio, 7, .32)
        place(y, hit, at, pan, gain)
        base = modal_hit(.18, [190, 377, 690], 29, .15)
        place(y, base, at + .012, pan, gain * .35)
    report.append(save('bottle-contact', reflections(y), 'Brief glass contact and wood base when shelf enters, not repeated random pings', peak=.20))

    # Weight/body -> brittle fracture -> small decaying shard contacts.
    y = np.zeros((round(2.2 * SR), 2))
    place(y, modal_hit(.25, [270, 510, 930], 22, .6), .08, 0, .7)
    place(y, modal_hit(.65, [1730, 2493, 3685, 5041, 6590, 7920], 16, 1.2), .095, -.08, 1)
    for at, pan, gain in [(.17, .28, .48), (.29, -.35, .30), (.46, .18, .20), (.68, -.14, .12), (.96, .23, .07)]:
        hit = modal_hit(.42, [2110, 3717, 5831], 21, .65)
        scrape = noise(.42, 900, 6400) * np.exp(-np.arange(len(hit)) / SR * 26) * .16
        place(y, hit + scrape, at, pan, gain)
    report.append(save('porcelain-break', reflections(y), 'One dry porcelain fracture with body and tiny debris settling; no cinematic explosion', peak=.29))

    # Mechanism first, then diminishing pan/chain contacts rather than a lone ding.
    y = np.zeros((3 * SR, 2))
    t = np.arange(round(.7 * SR)) / SR
    rub = edges(noise(.7, 350, 2400) * (.5 + .5 * np.sin(2 * np.pi * 19 * t) ** 2), .07, .28)
    place(y, rub, .02, -.12, .10)
    for at, pan, gain, ratio in [(.19, -.18, 1, 1), (.47, .22, .62, .93), (.81, -.12, .35, 1.04), (1.24, .13, .16, 1.01), (1.73, 0, .06, 1)]:
        hit = modal_hit(1, np.array([710, 1187, 1933, 2861, 4070, 5590]) * ratio, 5.5, .25)
        place(y, hit, at, pan, gain)
    report.append(save('brass-mechanism', reflections(y), 'Scale axle friction, pans and chain contacts diminish to a stable quiet state', peak=.23))

    manifest = {'version': 2, 'origin': 'Original deterministic local modal/noise synthesis, stereo PCM16 24kHz. Stylized sound design, not recorded foley or field ambience.', 'seed': 24102602, 'apiCalls': 0, 'files': report}
    (OUT / 'provenance.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
