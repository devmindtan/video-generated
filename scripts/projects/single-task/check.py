"""Validate local assets and mix in memory; no API or composition export."""
import hashlib
import json
import io
import subprocess
import wave
from pathlib import Path
import numpy as np
import soundfile as sf
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
SR = 24000


def read(path):
    return json.loads((ROOT / path).read_text())


def main():
    story = read('scripts/projects/single-task/story.json')
    captions = read('src/projects/single-task/captions.json')
    meta = read('public/single-task/audio/voice-metadata.json')
    cfg = read('src/projects/single-task/music.json')
    provenance = read('public/single-task/audio/music-provenance-full.json')
    edit = json.loads(subprocess.check_output(['node', str(ROOT / 'scripts/projects/single-task/read-music-edit.cjs')], text=True))
    assert len(story) == len(captions) == len(meta) == 5
    assert [s['start'] for s in story] == [0, 7, 17, 28, 38]
    assert sum(s['duration'] for s in story) == 45
    voice = np.zeros((45 * SR, 2))
    seconds = np.arange(len(voice)) / SR
    activity = np.zeros(len(voice))
    for scene, pages, recording in zip(story, captions, meta):
        assert recording['voice'] == 'Hải Đăng' and recording['scene'] == scene['id']
        assert recording['speed'] == 1 and recording['wordMatchRatio'] >= .88
        assert .2 <= recording['tailSilenceSeconds'] <= 3
        values, rate = sf.read(ROOT / 'public/single-task/audio' / recording['file'], always_2d=True)
        assert rate == SR and len(values) == scene['duration'] * SR
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
            activity = np.maximum(activity, np.interp(seconds, [a - .08, a, b, b + .18], [0, 1, 1, 0]))
        with Image.open(ROOT / 'public/single-task/images' / (scene['id'] + '.png')) as image:
            w, h = image.size
            assert w >= 720 and h >= 1280 and abs(w / h - 9 / 16) < .03
    assert edit['playbackRate'] > 0 and edit['trimBefore'] >= 0
    if edit['volume'] is None:
        assert cfg['speechVolume'] >= 0 and cfg['pauseVolume'] >= 0
        volume = cfg['pauseVolume'] - (cfg['pauseVolume'] - cfg['speechVolume']) * activity
    else:
        assert edit['volume'] >= 0
        volume = np.full(len(voice), edit['volume'])
    music_path = ROOT / 'public' / edit['src']
    info = sf.info(music_path)
    source_start = edit['trimBefore'] / 30
    source_span = edit['durationInFrames'] / 30 if edit['durationInFrames'] is not None else info.duration - source_start
    assert source_span > 0 and source_start + source_span <= info.duration + 1 / 30
    start = edit['from'] / 30
    stop = start + source_span / edit['playbackRate']
    visible_start, visible_stop = max(0, start), min(45, stop)
    music = np.zeros_like(voice)
    if visible_stop > visible_start:
        seek = source_start + (visible_start - start) * edit['playbackRate']
        ff = ROOT / 'node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg'
        data = subprocess.check_output([str(ff), '-v', 'error', '-ss', str(seek), '-i', str(music_path), '-af', f'atempo={edit["playbackRate"]},apad', '-t', str(visible_stop - visible_start), '-ar', str(SR), '-ac', '2', '-c:a', 'pcm_s16le', '-f', 'wav', '-'])
        with wave.open(io.BytesIO(data), 'rb') as wav:
            values = np.frombuffer(wav.readframes(wav.getnframes()), '<i2').reshape(-1, 2).astype(np.float64) / 32768
        offset = round(visible_start * SR)
        count = min(len(values), len(music) - offset)
        music[offset:offset + count] = values[:count] * volume[offset:offset + count, None]
    assert provenance['sourceUnchanged'] and provenance['output'] == cfg['file'] == edit['src']
    assert hashlib.sha256((ROOT / 'public' / cfg['sourceFile']).read_bytes()).hexdigest() == provenance['sourceSha256']
    mix = voice + music
    peak = float(np.max(np.abs(mix)))
    voiced = np.max(np.abs(voice), axis=1) > .01
    rms = lambda x: float(20 * np.log10(np.sqrt(np.mean(x*x)) + 1e-12))
    margin = rms(voice[voiced]) - rms(music[voiced])
    report = {
        'durationSeconds': 45, 'dimensions': [1080, 1920], 'voice': 'Hải Đăng', 'narrationTempo': 1,
        'minimumWordMatchRatio': min(m['wordMatchRatio'] for m in meta),
        'mixPeakDbFS': round(20 * np.log10(peak), 2), 'musicBelowVoiceDuringSpeechDb': round(margin, 2),
        'musicVersion': cfg['version'], 'musicSourcePreserved': True,
        'musicEdit': edit, 'musicSourceDurationSeconds': info.duration,
        'speechVolume': cfg['speechVolume'], 'pauseVolume': cfg['pauseVolume'],
        'musicTimelineRangeSeconds': [start, stop], 'musicSourceRangeSeconds': [source_start, source_start + source_span],
        'sceneTailSeconds': [m['tailSilenceSeconds'] for m in meta],
        'imagesChecked': 5, 'apiCalls': 0, 'compositionRendered': False,
    }
    (ROOT / 'docs/projects/single-task/qa.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))
    assert peak < .95, 'Clipping/headroom risk'
    assert margin >= 10, 'Music may mask narration'


if __name__ == '__main__':
    main()
