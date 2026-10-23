#!/usr/bin/env python3
"""Build and validate the authored 52-second solitude audio mix."""
import json
from pathlib import Path
import wave
import numpy as np
import soundfile as sf
import soxr

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'out'
SR = 24000


def read_voice(path):
    with wave.open(str(path), 'rb') as wav:
        assert wav.getframerate() == SR
        values = np.frombuffer(wav.readframes(wav.getnframes()), '<i2').astype(np.float64) / 32768
        values = values.reshape(-1, wav.getnchannels())
        return np.repeat(values, 2, axis=1) if values.shape[1] == 1 else values[:, :2]


def read_music(path):
    values, sample_rate = sf.read(str(path), dtype='float64', always_2d=True)
    if sample_rate != SR:
        values = soxr.resample(values, sample_rate, SR)
    if values.shape[1] == 1:
        values = np.repeat(values, 2, axis=1)
    return values[:, :2]


def main():
    OUT.mkdir(exist_ok=True)
    story = json.loads((ROOT / 'scripts/projects/solitude/story.json').read_text())
    cursor = 0
    for scene in story:
        assert scene['start'] == cursor, 'Scenes must be contiguous and ordered'
        cursor += scene['duration']
    duration = cursor
    sample_count = duration * SR
    metadata = json.loads((ROOT / 'public/solitude/audio/voice-metadata.json').read_text())
    music_config = json.loads((ROOT / 'src/projects/solitude/music.json').read_text())
    assert 0 <= music_config['videoStartSeconds'] < music_config['videoEndSeconds'] <= duration
    assert 0 <= music_config['sourceStartSeconds'] < music_config['sourceEndSeconds']
    assert music_config['videoStartSeconds'] < music_config['spliceAtVideoSeconds'] < music_config['videoEndSeconds']
    assert music_config['spliceAtVideoSeconds'] < music_config['resumeFromOriginalVideoSeconds'] <= music_config['videoEndSeconds']
    assert 0 < music_config['spliceCrossfadeSeconds'] < 1
    resume_source = music_config['sourceStartSeconds'] + music_config['resumeFromOriginalVideoSeconds'] - music_config['videoStartSeconds']
    effective_music_end = min(
        music_config['videoEndSeconds'],
        duration,
        music_config['spliceAtVideoSeconds'] + music_config['sourceEndSeconds'] - resume_source,
    )
    music_duration = effective_music_end - music_config['videoStartSeconds']
    assert 0 <= music_config['fadeInSeconds'] <= music_duration
    assert 0 <= music_config['fadeOutSeconds'] <= music_duration
    files = {item['scene']: item['file'] for item in metadata}
    assert all(item['voice'] == 'Thiện Minh' for item in metadata)
    assert all(item['voice'] != 'Thiền Tâm Đức' for item in metadata)
    assert min(item['wordMatchRatio'] for item in metadata) >= 0.92
    assert max(item['speed'] for item in metadata) <= 1.0
    voice = np.zeros((sample_count, 2))
    for scene in story:
        data = read_voice(ROOT / 'public/solitude/audio' / files[scene['id']])
        assert len(data) == scene['duration'] * SR
        start = scene['start'] * SR
        voice[start:start + len(data)] += data
    seconds = np.arange(sample_count) / SR
    captions = json.loads((ROOT / 'src/projects/solitude/captions.json').read_text())
    activity = np.zeros(sample_count)
    for scene, group in zip(story, captions):
        for caption in group:
            start = scene['start'] + caption['startMs'] / 1000
            end = scene['start'] + caption['endMs'] / 1000
            activity = np.maximum(activity, np.interp(seconds, [start - .15, start + .12, end - .12, end + .25], [0, 1, 1, 0]))
    cfg = music_config
    volume = cfg['pauseVolume'] - (cfg['pauseVolume'] - cfg['speechVolume']) * activity
    fade_in = 1 if cfg['fadeInSeconds'] == 0 else np.interp(seconds, [cfg['videoStartSeconds'], cfg['videoStartSeconds'] + cfg['fadeInSeconds']], [0, 1])
    fade_out = 1 if cfg['fadeOutSeconds'] == 0 else np.interp(seconds, [effective_music_end - cfg['fadeOutSeconds'], effective_music_end - 1 / SR], [1, 0])
    volume *= np.minimum(fade_in, fade_out)
    source = read_music(ROOT / 'public' / cfg['file'])
    half_crossfade = cfg['spliceCrossfadeSeconds'] / 2
    crossfade_start = cfg['spliceAtVideoSeconds'] - half_crossfade
    crossfade_end = cfg['spliceAtVideoSeconds'] + half_crossfade
    video_start = round(cfg['videoStartSeconds'] * SR)
    first_video_end = round(crossfade_end * SR)
    second_video_start = round(crossfade_start * SR)
    video_end = round(effective_music_end * SR)
    first_source_start = round(cfg['sourceStartSeconds'] * SR)
    second_source_start = round((resume_source - half_crossfade) * SR)
    source_end = round(cfg['sourceEndSeconds'] * SR)
    first = source[first_source_start:first_source_start + first_video_end - video_start]
    second = source[second_source_start:second_source_start + video_end - second_video_start]
    assert len(first) == first_video_end - video_start
    assert len(second) == video_end - second_video_start
    assert second_source_start + len(second) <= source_end
    music = np.zeros((sample_count, 2))
    before_weight = np.interp(seconds, [crossfade_start, crossfade_end], [1, 0])
    after_weight = np.interp(seconds, [crossfade_start, crossfade_end], [0, 1])
    music[video_start:first_video_end] += first * (volume * before_weight)[video_start:first_video_end, None]
    music[second_video_start:video_end] += second * (volume * after_weight)[second_video_start:video_end, None]
    mix = voice + music
    peak = float(np.max(np.abs(mix)))
    assert peak < .99, f'Clipping risk: {peak}'
    rms = lambda value: round(float(20 * np.log10(np.sqrt(np.mean(value * value)) + 1e-12)), 2)
    stats = {
        'durationSeconds': duration,
        'sampleRate': SR,
        'voice': 'Thiện Minh',
        'voiceProvider': 'VieNeu-TTS v3 Turbo 3.8.3 (local CPU)',
        'minimumWordMatchRatio': min(item['wordMatchRatio'] for item in metadata),
        'maximumPlaybackSpeed': max(item['speed'] for item in metadata),
        'musicFile': cfg['file'],
        'musicSourceStartSeconds': cfg['sourceStartSeconds'],
        'musicSourceEndSeconds': cfg['sourceEndSeconds'],
        'musicVideoRangeSeconds': [cfg['videoStartSeconds'], effective_music_end],
        'musicRemovedOriginalVideoRangeSeconds': [cfg['spliceAtVideoSeconds'], cfg['resumeFromOriginalVideoSeconds']],
        'musicBeatMovedToVideoSecond': cfg['spliceAtVideoSeconds'],
        'musicResumeSourceSeconds': resume_source,
        'musicSpliceCrossfadeSeconds': cfg['spliceCrossfadeSeconds'],
        'musicFadeInSeconds': cfg['fadeInSeconds'],
        'musicFadeOutSeconds': cfg['fadeOutSeconds'],
        'musicSpeechVolume': cfg['speechVolume'],
        'musicPauseVolume': cfg['pauseVolume'],
        'voiceRmsDbFS': rms(voice),
        'musicRmsDbFS': rms(music),
        'mixRmsDbFS': rms(mix),
        'peakDbFS': round(20 * np.log10(peak), 2),
        'clipping': False,
    }
    with wave.open(str(OUT / 'solitude-audio-review.wav'), 'wb') as wav:
        wav.setnchannels(2); wav.setsampwidth(2); wav.setframerate(SR)
        wav.writeframes(np.round(mix * 32767).astype('<i2').tobytes())
    report = json.dumps(stats, ensure_ascii=False, indent=2) + '\n'
    (OUT / 'solitude-audio-check.json').write_text(report)
    project_report = ROOT / 'projects/StoicSolitude/solitude-audio-check.json'
    project_report.parent.mkdir(parents=True, exist_ok=True)
    project_report.write_text(report)
    print(report)


if __name__ == '__main__':
    main()
