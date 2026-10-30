"""Offline checks and actual authored mix in RAM; no video/thumbnail render."""
import io
import json
from pathlib import Path
import subprocess
import wave
import numpy as np
import soundfile as sf
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
SR = 24000


def read(relative):
    return json.loads((ROOT / relative).read_text())


def main():
    story = read('scripts/projects/discipline-purpose/story.json')
    captions = read('src/projects/discipline-purpose/captions.json')
    meta = read('public/discipline-purpose/audio/voice-metadata.json')
    cfg = read('src/projects/discipline-purpose/music.json')
    fx_cfg = read('src/projects/discipline-purpose/sfx.json')
    edit = json.loads(subprocess.check_output(['node', str(ROOT / 'scripts/projects/single-task/read-music-edit.cjs'), str(ROOT / 'src/projects/discipline-purpose/Video.tsx'), 'disciplinePurposeMusicVolume'], text=True))
    assert len(story) == len(captions) == len(meta) == 5
    assert [s['start'] for s in story] == [0, 8, 18, 28, 38]
    assert sum(s['duration'] for s in story) == 48
    voice = np.zeros((48 * SR, 2))
    seconds = np.arange(len(voice)) / SR
    activity = np.zeros(len(voice))
    for scene, pages, recording in zip(story, captions, meta):
        assert recording['voice'] == 'Hải Đăng' and recording['scene'] == scene['id']
        assert recording['speed'] == 1 and recording['wordMatchRatio'] >= .88
        assert .3 <= recording['tailSilenceSeconds'] <= 3
        audio, rate = sf.read(ROOT / 'public/discipline-purpose/audio' / recording['file'], always_2d=True)
        assert rate == SR and len(audio) == scene['duration'] * SR
        start = scene['start'] * SR
        voice[start:start + len(audio)] += audio
        assert ' '.join(p['text'] for p in pages) == scene['text']
        end_ms = 0
        for p in pages:
            assert end_ms <= p['startMs'] < p['endMs'] <= scene['duration'] * 1000
            assert len(p['text']) <= 50
            end_ms = p['endMs']
            a = scene['start'] + p['startMs'] / 1000
            b = scene['start'] + p['endMs'] / 1000
            activity = np.maximum(activity, np.interp(seconds, [a - .1, a, b, b + .2], [0, 1, 1, 0]))
        with Image.open(ROOT / 'public/discipline-purpose/images' / (scene['id'] + '.png')) as image:
            w, h = image.size
            assert w >= 720 and h >= 1280 and abs(w / h - 9 / 16) < .03
    assert edit['playbackRate'] > 0 and edit['trimBefore'] >= 0
    path = ROOT / 'public' / edit['src']
    source_start = edit['trimBefore'] / 30
    source_span = edit['durationInFrames'] / 30 if edit['durationInFrames'] is not None else sf.info(path).duration - source_start
    assert source_span > 0 and source_start + source_span <= sf.info(path).duration + 1 / 30
    start = edit['from'] / 30
    end = start + source_span / edit['playbackRate']
    visible_start, visible_end = max(0, start), min(48, end)
    volume = cfg['pauseVolume'] - (cfg['pauseVolume'] - cfg['speechVolume']) * activity if edit['volume'] is None else np.full(len(voice), edit['volume'])
    # Same timeline-frame envelope as MusicFade; follows editable clip edges.
    assert cfg['fadeInSeconds'] > 0 and cfg['fadeOutSeconds'] > 0
    frame = seconds * 30
    a, b = visible_start * 30, visible_end * 30
    enter = np.clip((frame - a) / (cfg['fadeInSeconds'] * 30), 0, 1)
    leave = np.clip((b - 1 - frame) / (cfg['fadeOutSeconds'] * 30), 0, 1)
    volume *= np.minimum(enter, leave)
    assert volume[0] == 0 and volume[-1] == 0
    music = np.zeros_like(voice)
    if visible_end > visible_start:
        seek = source_start + (visible_start - start) * edit['playbackRate']
        ff = ROOT / 'node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg'
        data = subprocess.check_output([str(ff), '-v', 'error', '-ss', str(seek), '-i', str(path), '-af', f'atempo={edit["playbackRate"]},apad', '-t', str(visible_end - visible_start), '-ar', str(SR), '-ac', '2', '-c:a', 'pcm_s16le', '-f', 'wav', '-'])
        with wave.open(io.BytesIO(data), 'rb') as wav:
            values = np.frombuffer(wav.readframes(wav.getnframes()), '<i2').reshape(-1, 2).astype(np.float64) / 32768
        offset = round(visible_start * SR)
        count = min(len(values), len(music) - offset)
        music[offset:offset + count] = values[:count] * volume[offset:offset + count, None]
    effects = np.zeros_like(voice)
    cues = [('metal-friction', 8, 2, fx_cfg['metalVolume']), ('engine-rumble', 29, 4, fx_cfg['engineVolume'])]
    for name, at, duration, gain in cues:
        values, rate = sf.read(ROOT / 'public/discipline-purpose/audio' / (name + '.wav'), always_2d=True)
        assert rate == SR and len(values) == duration * SR and gain >= 0
        effects[at * SR:(at + duration) * SR] += values * gain
    peak = float(np.max(np.abs(voice + music + effects)))
    voiced = np.max(np.abs(voice), axis=1) > .01
    rms = lambda x: float(20 * np.log10(np.sqrt(np.mean(x*x)) + 1e-12))
    margin = rms(voice[voiced]) - rms((music + effects)[voiced])
    report = {'durationSeconds': 48, 'dimensions': [1080, 1920], 'voice': 'Hải Đăng', 'narrationTempo': 1, 'minimumWordMatchRatio': min(m['wordMatchRatio'] for m in meta), 'mixPeakDbFS': round(20 * np.log10(peak), 2), 'backgroundBelowVoiceDuringSpeechDb': round(margin, 2), 'musicEdit': edit, 'speechVolume': cfg['speechVolume'], 'pauseVolume': cfg['pauseVolume'], 'sfxCues': [{'file': name + '.wav', 'atSeconds': at, 'durationSeconds': length, 'volume': gain} for name, at, length, gain in cues], 'sceneTailSeconds': [m['tailSilenceSeconds'] for m in meta], 'imagesChecked': 5, 'apiCalls': 0, 'compositionRendered': False}
    (ROOT / 'docs/projects/discipline-purpose/qa.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))
    assert peak < .95, 'Mix headroom risk'
    assert margin >= 10, 'Background may mask narration'


if __name__ == '__main__':
    main()
