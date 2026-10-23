#!/usr/bin/env python3
"""Build and validate the authored 48-second crab-mentality audio mix."""
import json
from pathlib import Path
import wave
import warnings
import numpy as np
import soundfile as sf
import soxr
import librosa

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'out'
SR = 24_000


def read_audio(path: Path) -> np.ndarray:
    values, sample_rate = sf.read(str(path), dtype='float64', always_2d=True)
    if sample_rate != SR:
        values = soxr.resample(values, sample_rate, SR)
    if values.shape[1] == 1:
        values = np.repeat(values, 2, axis=1)
    return values[:, :2]


def main() -> None:
    OUT.mkdir(exist_ok=True)
    story = json.loads((ROOT / 'scripts/projects/crab-mentality/story.json').read_text())
    cursor = 0
    for scene in story:
        assert scene['start'] == cursor, 'Scenes must be contiguous and ordered'
        cursor += scene['duration']
    duration = cursor
    assert duration == 48
    sample_count = duration * SR

    metadata = json.loads((ROOT / 'public/crab-mentality/audio/voice-metadata.json').read_text())
    captions = json.loads((ROOT / 'src/projects/crab-mentality/captions.json').read_text())
    cfg = json.loads((ROOT / 'src/projects/crab-mentality/music.json').read_text())
    assert cfg['videoStartSeconds'] == 0 and cfg['videoEndSeconds'] == duration
    playback_rate = cfg['playbackRate']
    assert 0 < playback_rate < 1
    assert cfg['preservePitch'] is True and cfg['toneFrequency'] == 1
    assert abs(cfg['sourceEndSeconds'] - (cfg['sourceStartSeconds'] + duration * playback_rate)) < 1e-9
    assert all(item['voice'] == 'Thiện Minh' for item in metadata)
    assert all(item['voice'] != 'Thiền Tâm Đức' for item in metadata)
    assert min(item['wordMatchRatio'] for item in metadata) >= .88
    assert max(item['speed'] for item in metadata) <= 1.05

    files = {item['scene']: item['file'] for item in metadata}
    voice = np.zeros((sample_count, 2))
    for scene in story:
        data = read_audio(ROOT / 'public/crab-mentality/audio' / files[scene['id']])
        assert len(data) == scene['duration'] * SR
        start = scene['start'] * SR
        voice[start:start + len(data)] += data

    seconds = np.arange(sample_count) / SR
    activity = np.zeros(sample_count)
    for scene, group in zip(story, captions):
        for caption in group:
            start = scene['start'] + caption['startMs'] / 1000
            end = scene['start'] + caption['endMs'] / 1000
            activity = np.maximum(activity, np.interp(seconds, [start - .12, start + .1, end - .1, end + .22], [0, 1, 1, 0]))
    base = cfg['pauseVolume'] - (cfg['pauseVolume'] - cfg['speechVolume']) * activity
    fade_in = np.interp(seconds, [0, cfg['fadeInSeconds']], [0, 1])
    lifted = np.where(seconds < cfg['finalLiftStartSeconds'], base, np.interp(seconds, [cfg['finalLiftStartSeconds'], cfg['finalLiftPeakSeconds']], [cfg['pauseVolume'], cfg['finalLiftVolume']]))
    fade_out = np.interp(seconds, [duration - cfg['fadeOutSeconds'], duration - 1 / SR], [1, 0])
    volume = lifted * np.minimum(fade_in, fade_out)

    source = read_audio(ROOT / 'public' / cfg['file'])
    source_start = round(cfg['sourceStartSeconds'] * SR)
    source_end = round(cfg['sourceEndSeconds'] * SR)
    assert source_end <= len(source)
    with warnings.catch_warnings():
        warnings.simplefilter('ignore', FutureWarning)
        stretched = librosa.effects.time_stretch(source[source_start:source_end].T, rate=playback_rate).T
    if len(stretched) < sample_count:
        stretched = np.pad(stretched, ((0, sample_count - len(stretched)), (0, 0)))
    music = stretched[:sample_count] * volume[:, None]

    sfx = np.zeros((sample_count, 2))
    for filename, start_seconds, gain in [
        ('soft-scene-swell.wav', 7.35, .16),
        ('soft-metal-glide.wav', 24.45, .12),
    ]:
        data = read_audio(ROOT / 'public/crab-mentality/sfx' / filename) * gain
        start = round(start_seconds * SR)
        sfx[start:min(start + len(data), sample_count)] += data[:sample_count - start]

    mix = voice + music + sfx
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
        'finalVoiceEndsAtSeconds': story[-1]['start'] + metadata[-1]['speechEndsAt'],
        'musicFile': cfg['file'],
        'musicSourceRangeSeconds': [cfg['sourceStartSeconds'], cfg['sourceEndSeconds']],
        'musicPlaybackRate': playback_rate,
        'musicPreservePitch': cfg['preservePitch'],
        'musicToneFrequency': cfg['toneFrequency'],
        'musicSpeechVolume': cfg['speechVolume'],
        'musicPauseVolume': cfg['pauseVolume'],
        'musicFadeOutSeconds': cfg['fadeOutSeconds'],
        'soundEffects': [
            {'file': 'soft-scene-swell.wav', 'atSeconds': 7.35, 'volume': .16, 'fadeCharacter': 'slow attack and long release'},
            {'file': 'soft-metal-glide.wav', 'atSeconds': 24.45, 'volume': .12, 'fadeCharacter': 'soft brushed-metal glide with reverb tail'},
        ],
        'voiceRmsDbFS': rms(voice),
        'musicRmsDbFS': rms(music),
        'sfxRmsDbFS': rms(sfx),
        'mixRmsDbFS': rms(mix),
        'peakDbFS': round(20 * np.log10(peak), 2),
        'clipping': False,
    }
    with wave.open(str(OUT / 'crab-mentality-audio-review.wav'), 'wb') as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(SR)
        wav.writeframes(np.round(mix * 32767).astype('<i2').tobytes())
    report = json.dumps(stats, ensure_ascii=False, indent=2) + '\n'
    (OUT / 'crab-mentality-audio-check.json').write_text(report)
    project_report = ROOT / 'projects/StoicCrabMentality/crab-mentality-audio-check.json'
    project_report.parent.mkdir(parents=True, exist_ok=True)
    project_report.write_text(report)
    print(report)


if __name__ == '__main__':
    main()
