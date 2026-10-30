"""Offline source/caption/mix QA, decoded in RAM. No composition renders."""
import io
import json
from pathlib import Path
import subprocess
import wave
import numpy as np
import soundfile as sf
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
SR, FPS, SECONDS = 24000, 30, 48


def read(path):
    return json.loads((ROOT / path).read_text())


def main():
    story = read('scripts/projects/people-pleasing/story.json')
    captions = read('src/projects/people-pleasing/captions.json')
    metadata = read('public/people-pleasing/audio/voice-metadata.json')
    cfg = read('src/projects/people-pleasing/music.json')
    edit = json.loads(subprocess.check_output([
        'node', str(ROOT / 'scripts/projects/single-task/read-music-edit.cjs'),
        str(ROOT / 'src/projects/people-pleasing/Video.tsx'), 'peoplePleasingMusicVolume', 'Snowfall'
    ], text=True))
    assert len(story) == len(captions) == len(metadata) == 5
    assert [s['start'] for s in story] == [0, 8, 18, 28, 38]
    assert sum(s['duration'] for s in story) == SECONDS
    voice = np.zeros((SECONDS * SR, 2))
    timeline = np.arange(len(voice)) / SR
    activity = np.zeros(len(voice))
    for scene, pages, meta in zip(story, captions, metadata):
        assert meta['scene'] == scene['id'] and meta['voice'] == 'Hải Đăng'
        assert meta['speed'] == 1, 'Keep native narration tempo; shorten wording rather than retime'
        assert meta['wordMatchRatio'] >= .88
        assert .3 <= meta['tailSilenceSeconds'] <= 3
        samples, rate = sf.read(ROOT / 'public/people-pleasing/audio' / meta['file'], always_2d=True)
        assert rate == SR and len(samples) == scene['duration'] * SR
        start = scene['start'] * SR
        voice[start:start + len(samples)] += samples
        assert ' '.join(p['text'] for p in pages) == scene['text']
        previous = 0
        for page in pages:
            assert previous <= page['startMs'] < page['endMs'] <= scene['duration'] * 1000
            assert len(page['text']) <= 50
            previous = page['endMs']
            a, b = scene['start'] + page['startMs'] / 1000, scene['start'] + page['endMs'] / 1000
            activity = np.maximum(activity, np.interp(timeline, [a - .1, a, b, b + .2], [0, 1, 1, 0]))
        with Image.open(ROOT / 'public/people-pleasing/images' / (scene['id'] + '.png')) as image:
            w, h = image.size
            assert w >= 720 and h >= 1280 and abs(w / h - 9 / 16) < .03

    assert edit['src'] == cfg['file'] and edit['volume'] is None, 'Preserve caption ducking and config volume'
    assert edit['playbackRate'] > 0 and edit['trimBefore'] >= 0
    assert 0 <= cfg['speechVolume'] <= cfg['pauseVolume']
    assert cfg['fadeInSeconds'] > 0 and cfg['fadeOutSeconds'] > 0
    source = ROOT / 'public' / edit['src']
    source_start = edit['trimBefore'] / FPS
    source_span = edit['durationInFrames'] / FPS if edit['durationInFrames'] is not None else sf.info(source).duration - source_start
    assert source_span > 0 and source_start + source_span <= sf.info(source).duration + 1 / FPS
    at = edit['from'] / FPS
    begin, end = max(0, at), min(SECONDS, at + source_span / edit['playbackRate'])
    volume = cfg['pauseVolume'] - (cfg['pauseVolume'] - cfg['speechVolume']) * activity
    frame = timeline * FPS
    enter = np.clip((frame - begin * FPS) / (cfg['fadeInSeconds'] * FPS), 0, 1)
    leave = np.clip((end * FPS - 1 - frame) / (cfg['fadeOutSeconds'] * FPS), 0, 1)
    volume *= np.minimum(enter, leave)
    assert volume[0] == 0 and volume[-1] == 0
    music = np.zeros_like(voice)
    if end > begin:
        seek = source_start + (begin - at) * edit['playbackRate']
        ff = ROOT / 'node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg'
        raw = subprocess.check_output([str(ff), '-v', 'error', '-ss', str(seek), '-i', str(source), '-af', f'atempo={edit["playbackRate"]},apad', '-t', str(end - begin), '-ar', str(SR), '-ac', '2', '-c:a', 'pcm_s16le', '-f', 'wav', '-'])
        with wave.open(io.BytesIO(raw), 'rb') as wav:
            values = np.frombuffer(wav.readframes(wav.getnframes()), '<i2').reshape(-1, 2).astype(float) / 32768
        offset = round(begin * SR)
        count = min(len(values), len(music) - offset)
        music[offset:offset + count] = values[:count] * volume[offset:offset + count, None]
    peak = float(np.max(np.abs(voice + music)))
    voiced = np.max(np.abs(voice), axis=1) > .01
    rms = lambda x: float(20 * np.log10(np.sqrt(np.mean(x*x)) + 1e-12))
    margin = rms(voice[voiced]) - rms(music[voiced])
    report = {
        'durationSeconds': SECONDS, 'dimensions': [1080, 1920], 'voice': 'Hải Đăng', 'narrationTempo': 1,
        'minimumWordMatchRatio': min(m['wordMatchRatio'] for m in metadata),
        'sceneTailSeconds': [m['tailSilenceSeconds'] for m in metadata],
        'mixPeakDbFS': round(float(20 * np.log10(peak)), 2), 'musicBelowVoiceDuringSpeechDb': round(margin, 2),
        'musicEdit': edit, 'speechVolume': cfg['speechVolume'], 'pauseVolume': cfg['pauseVolume'],
        'fadeInSeconds': cfg['fadeInSeconds'], 'fadeOutSeconds': cfg['fadeOutSeconds'],
        'sfxEnabled': False, 'imagesChecked': 5, 'geminiVeoCalls': 0, 'compositionRendered': False,
        'listeningReview': 'Pending user audition in Studio; numerical checks do not establish perceived quality'
    }
    (ROOT / 'docs/projects/people-pleasing/qa.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))
    assert peak < .95, 'Mix needs headroom'
    assert margin >= 10, 'Music may mask narration'


if __name__ == '__main__':
    main()
