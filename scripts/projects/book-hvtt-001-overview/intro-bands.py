"""Per-frame speech level and frequency bands for the book-insights intro visualizer.

Reads the voice-catalog audition take (public/voice-auditions/<take>/), never synthesizes audio,
and writes src/projects/book-hvtt-001-overview/intro-takes.json so the bars are derived from the
frame number (preview, seeking and rendering agree) without loading audio in the browser.
Usage: .venv/bin/python scripts/projects/book-hvtt-001-overview/intro-bands.py [--take book-hvtt-intro-v1 book-hvtt-intro-xv-b ...]
Voices from later takes get the take's last suffix appended to their id (14-xuan-vinh-b).
"""
import argparse, json
from pathlib import Path
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[3]
FPS, BANDS, LOW, HIGH = 30, 32, 90.0, 7000.0


def analyse(path):
    audio, rate = sf.read(path, dtype='float32', always_2d=True)
    audio = audio.mean(axis=1)
    frames = int(np.ceil(len(audio) / rate * FPS))
    size = 2048
    window = np.hanning(size)
    edges = np.geomspace(LOW, HIGH, BANDS + 1)
    freqs = np.fft.rfftfreq(size, 1 / rate)
    bins = [(freqs >= a) & (freqs < b) for a, b in zip(edges[:-1], edges[1:])]
    padded = np.pad(audio, (size // 2, size))
    bands, level = np.zeros((frames, BANDS)), np.zeros(frames)
    for f in range(frames):
        start = int(f / FPS * rate)
        chunk = padded[start:start + size] * window
        spectrum = np.abs(np.fft.rfft(chunk))
        bands[f] = [spectrum[b].mean() if b.any() else 0 for b in bins]
        level[f] = np.sqrt(np.mean(audio[int(f / FPS * rate):int((f + 1) / FPS * rate)] ** 2) + 1e-12)
    # Loudness in dB, normalised per take so every voice fills the same visual range.
    db = 20 * np.log10(bands + 1e-9)
    top, floor = np.percentile(db, 97), np.percentile(db, 40)
    bands = np.clip((db - floor) / (top - floor), 0, 1)
    ldb = 20 * np.log10(level)
    ltop, lfloor = np.percentile(ldb, 97), np.percentile(ldb, 30)
    level = np.clip((ldb - lfloor) / (ltop - lfloor), 0, 1)
    # Fast attack, slower release: bars rise with the syllable and settle smoothly.
    for series in (bands, level):
        for f in range(1, frames):
            prev = series[f - 1]
            series[f] = np.where(series[f] > prev, prev + (series[f] - prev) * .75, prev + (series[f] - prev) * .28)
    return frames, np.round(bands * 100).astype(int).tolist(), np.round(level * 100).astype(int).tolist()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--take', nargs='+', default=['book-hvtt-intro-v1', 'book-hvtt-intro-xv-b', 'book-hvtt-intro-xv-c', 'book-hvtt-intro-xv-d', 'book-hvtt-intro-clone-v2', 'book-hvtt-intro-clone-v3', 'book-hvtt-intro-clone-v3-tram1', 'book-hvtt-intro-clone-v3-tram2', 'book-hvtt-intro-clone-v3-sang1', 'book-hvtt-intro-clone-v4a-sang1', 'book-hvtt-intro-clone-v4b-sang1'])
    args = parser.parse_args()
    voices = []
    for n, take in enumerate(args.take):
        folder = ROOT / 'public/voice-auditions' / take
        manifest = json.loads((folder / 'manifest.json').read_text())
        suffix = '' if n == 0 or 'clone' in take else '-' + take.rsplit('-', 1)[-1]
        for v in manifest['voices']:
            if v.get('status') != 'ready':
                continue
            frames, bands, level = analyse(folder / v['file'])
            captions = json.loads((folder / v['captionsFile']).read_text()) if v.get('captionsFile') else []
            voices.append({'id': v['id'] + suffix, 'name': v['name'] + suffix.replace('-', ' ').upper(), 'take': take,
                           'settings': manifest['config'].get('title'), 'file': f"voice-auditions/{take}/{v['file']}",
                           'durationSeconds': v['durationSeconds'], 'frames': frames, 'captions': captions,
                           'phraseRanges': v.get('phraseRanges'), 'bands': bands, 'level': level})
    out = ROOT / 'src/projects/book-hvtt-001-overview/intro-takes.json'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({'takes': args.take, 'fps': FPS, 'status': 'audition — chờ người dùng nghe chọn giọng',
                               'voices': voices}, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(f'{len(voices)} voice(s) → {out.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
