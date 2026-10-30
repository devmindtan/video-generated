"""Original stylized sound design generated locally; not field recordings."""
import json
from pathlib import Path
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'public/discipline-purpose/audio'
SR = 24000


def band_noise(rng, n, low, high):
    values = rng.normal(0, 1, n)
    f = np.fft.rfftfreq(n, 1 / SR)
    spectrum = np.fft.rfft(values)
    spectrum *= np.clip((f - low) / 100, 0, 1) * np.clip((high - f) / 300, 0, 1)
    values = np.fft.irfft(spectrum, n)
    return values / max(np.std(values), 1e-9)


def save(name, values, rms_db, peak_limit):
    values *= 10 ** (rms_db / 20) / max(np.sqrt(np.mean(values * values)), 1e-9)
    values *= min(1, peak_limit / max(np.max(np.abs(values)), 1e-9))
    path = OUT / (name + '.wav')
    if path.exists():
        raise FileExistsError('Preserve existing sound edits; use a versioned output to regenerate')
    sf.write(path, np.column_stack([values, values]), SR, subtype='PCM_16')
    return {'file': str(path.relative_to(ROOT / 'public')), 'durationSeconds': len(values) / SR, 'peakDbFS': round(float(20 * np.log10(np.max(np.abs(values)))), 2), 'origin': 'Original deterministic local synthesis'}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(321024)
    t = np.arange(2 * SR) / SR
    scrape = band_noise(rng, len(t), 380, 3000)
    pulse = np.maximum(0, np.sin(2 * np.pi * 6.1 * t)) ** 1.8
    metal = .64 * scrape * (.25 + .75 * pulse)
    metal += .10 * np.sin(2 * np.pi * 717 * t + .4 * np.sin(2 * np.pi * 17 * t)) * pulse
    metal *= np.minimum(np.clip(t / .06, 0, 1), np.clip((2 - t) / .45, 0, 1))
    t = np.arange(4 * SR) / SR
    engine = .22 * band_noise(rng, len(t), 28, 300) + .45 * np.sin(2 * np.pi * 54 * t + .1 * np.sin(2 * np.pi * 2 * t))
    engine += .12 * np.sin(2 * np.pi * 108 * t) + .04 * np.sin(2 * np.pi * 162 * t)
    engine *= (.85 + .15 * np.sin(2 * np.pi * 7 * t)) * np.minimum(np.clip(t / .4, 0, 1), np.clip((4 - t) / .8, 0, 1))
    report = [save('metal-friction', metal, -25, .18), save('engine-rumble', engine, -28, .12)]
    (OUT / 'sfx-provenance.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
