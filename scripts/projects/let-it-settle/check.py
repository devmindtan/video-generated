"""Offline asset, timing and mix checks; never exports a composition or calls APIs."""
import json
import io
import wave
from pathlib import Path
import subprocess
import numpy as np
import soundfile as sf
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
FF = ROOT / 'node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg'
SR = 24000


def read(relative):
    return json.loads((ROOT / relative).read_text())


def main():
    story = read('scripts/projects/let-it-settle/story.json')
    captions = read('src/projects/let-it-settle/captions.json')
    metadata = read('public/let-it-settle/audio/voice-metadata.json')
    cfg = read('src/projects/let-it-settle/music.json')
    assert len(story) == len(captions) == len(metadata) == 5
    assert [s['start'] for s in story] == [0, 8, 18, 28, 40]
    assert sum(s['duration'] for s in story) == cfg['videoEndSeconds'] == 48
    voice = np.zeros((48 * SR, 2))
    seconds = np.arange(len(voice)) / SR
    activity = np.zeros(len(voice))
    for scene, pages, meta in zip(story, captions, metadata):
        assert meta['voice'] == 'Hải Đăng' and meta['scene'] == scene['id']
        assert meta['wordMatchRatio'] >= .88
        assert meta['speed'] == 1, 'Keep narration at original tempo'
        assert .5 <= meta['tailSilenceSeconds'] <= 3.5
        values, sr = sf.read(ROOT / 'public/let-it-settle/audio' / meta['file'], always_2d=True)
        assert sr == SR and len(values) == scene['duration'] * SR
        assert np.max(np.abs(values)) > .05
        start = scene['start'] * SR
        voice[start:start + len(values)] += values
        assert ' '.join(p['text'] for p in pages) == scene['text']
        end = 0
        for page in pages:
            assert end <= page['startMs'] < page['endMs'] <= scene['duration'] * 1000
            assert len(page['text']) <= 50
            end = page['endMs']
            a = scene['start'] + page['startMs'] / 1000
            b = scene['start'] + page['endMs'] / 1000
            activity = np.maximum(activity, np.interp(seconds, [a - .15, a, b, b + .25], [0, 1, 1, 0]))
        with Image.open(ROOT / 'public/let-it-settle/images' / (scene['id'] + '.png')) as img:
            width, height = img.size
            assert width >= 720 and height >= 1280
            assert abs(width / height - 9 / 16) < .03
    music_path = ROOT / 'public' / cfg['file']
    assert sf.info(music_path).duration >= cfg['sourceStartSeconds'] + 48 * cfg['playbackRate']
    # Match runtime source trim AND rate. Decode only to RAM, not an audio export.
    data = subprocess.check_output([str(FF), '-v', 'error', '-ss', str(cfg['sourceStartSeconds']), '-i', str(music_path), '-af', f'atempo={cfg["playbackRate"]},apad', '-t', '48', '-ar', str(SR), '-ac', '2', '-c:a', 'pcm_s16le', '-f', 'wav', '-'])
    with wave.open(io.BytesIO(data), 'rb') as wav:
        music = np.frombuffer(wav.readframes(wav.getnframes()), '<i2').reshape(-1, 2).astype(np.float64) / 32768
    assert len(music) == len(voice)
    base = cfg['pauseVolume'] - (cfg['pauseVolume'] - cfg['speechVolume']) * activity
    envelope = np.minimum(np.interp(seconds, [0, cfg['fadeInSeconds']], [0, 1]), np.interp(seconds, [48 - cfg['fadeOutSeconds'], 48 - 1 / 30], [1, 0]))
    music *= (base * envelope)[:, None]
    peak = float(np.max(np.abs(voice + music)))
    rms = lambda x: float(20 * np.log10(np.sqrt(np.mean(x*x)) + 1e-12))
    voiced = np.max(np.abs(voice), axis=1) > .01
    speech_margin = rms(voice[voiced]) - rms(music[voiced])
    report = {
        'durationSeconds': 48, 'dimensions': [1080, 1920], 'voice': 'Hải Đăng',
        'narrationTempo': 1, 'musicPlaybackRate': cfg['playbackRate'],
        'minimumWordMatchRatio': min(m['wordMatchRatio'] for m in metadata),
        'mixPeakDbFS': round(20 * np.log10(peak), 2),
        'musicBelowVoiceDuringSpeechDb': round(speech_margin, 2),
        'finalVoiceEndsAtSeconds': round(40 + metadata[-1]['speechEndsAt'], 3),
        'sceneTailSeconds': [m['tailSilenceSeconds'] for m in metadata],
        'imagesChecked': 5, 'apiCalls': 0, 'compositionRendered': False,
        'warnings': [] if speech_margin >= 10 else ['Audition music/voice balance; music is less than 10 dB below active speech.'],
    }
    (ROOT / 'docs/projects/let-it-settle/qa.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))
    assert peak < .95, 'Clipping/headroom risk'
    assert speech_margin >= 10, 'Music may obscure active narration'


if __name__ == '__main__':
    main()
