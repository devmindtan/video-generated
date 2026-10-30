"""Create a local Experience reverb treatment; leave the original MP3 untouched."""
import hashlib
import json
from pathlib import Path
import numpy as np
import soundfile as sf
import soxr

ROOT = Path(__file__).resolve().parents[3]
SR = 24000


def main():
    cfg = json.loads((ROOT / 'src/projects/single-task/music.json').read_text())
    source = ROOT / 'public' / cfg['sourceFile']
    original_hash = hashlib.sha256(source.read_bytes()).hexdigest()
    info = sf.info(source)
    # Keep the entire recording available for non-destructive Studio trimming.
    dry, rate = sf.read(source, always_2d=True, dtype='float32')
    if rate != SR:
        dry = soxr.resample(dry, rate, SR)
    if dry.shape[1] == 1:
        dry = np.repeat(dry, 2, axis=1)
    dry = dry[:, :2]
    rng = np.random.default_rng(20261024)
    length = round(1.6 * SR)
    wet = np.zeros((len(dry) + length - 1, 2), dtype=np.float32)
    block_size = 65536
    nfft = 1 << (block_size + length - 2).bit_length()
    for channel in range(2):
        impulse = rng.normal(0, 1, length)
        # Smooth diffuse tail and short early reflections, rather than one obvious echo.
        impulse = np.convolve(impulse, np.ones(7) / 7, mode='same')
        impulse *= np.exp(-np.arange(length) / SR * 5)
        impulse[:round(.025 * SR)] = 0
        impulse /= max(np.sqrt(np.sum(impulse * impulse)), 1e-9)
        impulse *= .35
        for delay, gain in ((.043, .18), (.079, .13), (.131, .09)):
            impulse[round((delay + channel * .004) * SR)] += gain
        spectrum = np.fft.rfft(impulse, nfft)
        for offset in range(0, len(dry), block_size):
            block = dry[offset:offset + block_size, channel]
            convolved = np.fft.irfft(np.fft.rfft(block, nfft) * spectrum, nfft)[:len(block) + length - 1]
            wet[offset:offset + len(convolved), channel] += convolved.astype(np.float32)
    mixed = .25 * wet
    mixed[:len(dry)] += .84 * dry
    mixed *= min(10 ** (-17 / 20) / max(np.sqrt(np.mean(mixed * mixed)), 1e-9), .70 / max(np.max(np.abs(mixed)), 1e-9))
    target = ROOT / 'public' / cfg['file']
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        raise FileExistsError('Full-length reverb already exists; preserve edits and use a new version instead of overwriting it.')
    sf.write(target, mixed, SR, subtype='PCM_16')
    assert hashlib.sha256(source.read_bytes()).hexdigest() == original_hash
    report = {'source': cfg['sourceFile'], 'sourceSha256': original_hash, 'sourceRangeSeconds': [0, info.duration], 'output': cfg['file'], 'durationSeconds': len(mixed) / SR, 'sampleRate': SR, 'playbackRate': 1, 'treatment': 'Full recording plus locally generated stereo early reflections and diffuse 1.6-second reverb tail; not a verified remix', 'sourceUnchanged': True, 'license': 'Commercial underlying recording; local processing does not grant publishing rights'}
    (target.parent / 'music-provenance-full.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
