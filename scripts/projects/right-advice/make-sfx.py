"""Deterministic original stylized SFX. No downloads/API, not field recordings."""
import json
from pathlib import Path
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'public/right-advice/audio'
SR = 24000


def noise(rng, n, low, high):
    f = np.fft.rfftfreq(n, 1 / SR)
    spec = np.fft.rfft(rng.normal(size=n))
    spec *= np.clip((f - low) / 100, 0, 1) * np.clip((high - f) / 300, 0, 1)
    out = np.fft.irfft(spec, n)
    return out / max(np.std(out), 1e-9)


def save(name, sound, peak):
    sound *= peak / max(np.max(np.abs(sound)), 1e-9)
    # Gentle global edges, including the brittle initial transient.
    t = np.arange(len(sound)) / SR
    sound *= np.minimum(np.clip(t / .004, 0, 1), np.clip((len(sound) / SR - t) / .06, 0, 1))
    path = OUT / (name + '.wav')
    if path.exists():
        raise FileExistsError('Preserve sound edits: choose a versioned filename to regenerate')
    sf.write(path, np.column_stack([sound, sound]), SR, subtype='PCM_16')
    return {'file': str(path.relative_to(ROOT / 'public')), 'durationSeconds': len(sound) / SR, 'peakDbFS': round(float(20 * np.log10(np.max(np.abs(sound)))), 2), 'origin': 'Original deterministic local synthesis; stylized, not a field recording'}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(241026)
    t = np.arange(3 * SR) / SR
    gust = noise(rng, len(t), 160, 3000) * (.6 + .4 * np.sin(t * 2.7) ** 2)
    whistle = np.sin(2 * np.pi * (710 * t + 18 * np.sin(t * 2))) * .12
    wind = (gust * .35 + whistle) * np.sin(np.pi * t / 3) ** 1.8
    t = np.arange(round(1.2 * SR)) / SR
    porcelain = np.zeros(len(t))
    for at, strength in [(0, 1), (.035, .45), (.09, .32), (.19, .2), (.34, .11)]:
        u = np.maximum(0, t - at)
        active = t >= at
        impact = noise(rng, len(t), 1700, 8500) * np.exp(-u * 75)
        ring = sum(np.sin(2 * np.pi * f * u) * np.exp(-u * d) for f, d in [(1840, 18), (3227, 23), (5100, 31)]) / 3
        porcelain += strength * active * (impact * .45 + ring * .5)
    t = np.arange(round(1.4 * SR)) / SR
    brass = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) * a for f, d, a in [(1230, 4.5, .6), (2108, 6, .25), (3260, 8, .13)])
    brass += noise(rng, len(t), 700, 6000) * np.exp(-t * 130) * .22
    report = [save('crossroads-wind', wind, .13), save('porcelain-crack', porcelain, .28), save('brass-clink', brass, .19)]
    (OUT / 'sfx-provenance.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
