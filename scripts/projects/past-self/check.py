"""Offline validation only; never renders or calls a generation API."""
import json
from pathlib import Path
import numpy as np
import soundfile as sf
import soxr
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
SR = 24000


def read(relative):
    return json.loads((ROOT / relative).read_text())


def main():
    story = read('scripts/projects/past-self/story.json')
    captions = read('src/projects/past-self/captions.json')
    metadata = read('public/past-self/audio/voice-metadata.json')
    cfg = read('src/projects/past-self/music.json')
    assert len(story) == len(captions) == len(metadata) == 5
    assert [s['start'] for s in story] == [0, 8, 18, 28, 40]
    assert sum(s['duration'] for s in story) == 50
    voice = np.zeros((50 * SR, 2))
    seconds = np.arange(len(voice)) / SR
    activity = np.zeros(len(voice))
    for scene, pages, meta in zip(story, captions, metadata):
        assert meta['voice'] == 'Hải Đăng' and meta['scene'] == scene['id']
        assert meta['wordMatchRatio'] >= .88
        assert meta['speed'] == 1, 'Keep original narration tempo; no slowing or speeding'
        assert scene['duration'] == meta['sceneDuration']
        values, sr = sf.read(ROOT / 'public/past-self/audio' / meta['file'], always_2d=True)
        assert sr == SR and len(values) == scene['duration'] * SR
        assert np.max(np.abs(values)) > .05
        start = scene['start'] * SR
        voice[start:start + len(values)] += values
        assert ' '.join(p['text'] for p in pages) == scene['text']
        end_ms = 0
        for p in pages:
            assert end_ms <= p['startMs'] < p['endMs'] <= scene['duration'] * 1000
            end_ms = p['endMs']
            a = scene['start'] + p['startMs'] / 1000
            b = scene['start'] + p['endMs'] / 1000
            activity = np.maximum(activity, np.interp(seconds, [a - .15, a, b, b + .25], [0, 1, 1, 0]))
        with Image.open(ROOT / 'public/past-self/images' / (scene['id'] + '.png')) as image:
            width, height = image.size
            assert width >= 720 and height >= 1280
            assert abs(width / height - 9 / 16) < .03
    music, sr = sf.read(ROOT / 'public' / cfg['file'], always_2d=True)
    if sr != SR:
        music = soxr.resample(music, sr, SR)
    offset = round(cfg['sourceStartSeconds'] * SR)
    music = music[offset:offset + len(voice), :2]
    assert len(music) == len(voice)
    base = cfg['pauseVolume'] - (cfg['pauseVolume'] - cfg['speechVolume']) * activity
    envelope = np.minimum(np.interp(seconds, [0, cfg['fadeInSeconds']], [0, 1]), np.interp(seconds, [50 - cfg['fadeOutSeconds'], 50 - 1 / 30], [1, 0]))
    music *= (base * envelope)[:, None]
    mix = voice + music
    peak = float(np.max(np.abs(mix)))
    assert peak < .95, 'Mix clipping risk'
    rms = lambda x: float(20 * np.log10(np.sqrt(np.mean(x*x)) + 1e-12))
    margin = rms(voice) - rms(music)
    report = {
        'durationSeconds': 50, 'dimensions': [1080, 1920], 'voice': 'Hải Đăng',
        'minimumWordMatchRatio': min(m['wordMatchRatio'] for m in metadata),
        'mixPeakDbFS': round(20 * np.log10(peak), 2),
        'musicBelowVoiceDb': round(margin, 2),
        'musicBalancePass': margin >= 14,
        'warnings': [] if margin >= 14 else ['Music exceeds the conservative narration-balance target; preserve user-authored levels and audition in Studio.'],
        'finalVoiceEndsAtSeconds': 40 + metadata[-1]['speechEndsAt'],
        'imagesChecked': 5, 'apiCalls': 0, 'compositionRendered': False,
    }
    # Data-only QA artifact; no audio export, frame render or thumbnail export.
    (ROOT / 'docs/projects/past-self/qa.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))
    assert margin >= 14, f'Music masks narration: voice/music margin {margin:.2f} dB'


if __name__ == '__main__':
    main()
