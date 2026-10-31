#!/usr/bin/env python3
"""Offline structural and voice checks; listening approval remains manual."""
import json
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[3]
PUBLIC = ROOT / 'public/flower-knows-powder'
SRC = ROOT / 'src/projects/flower-knows-powder'
SR = 24000
DURATION = 958 / 30


def db(value):
    return round(float(20 * np.log10(max(value, 1e-9))), 2)


def main():
    story = json.loads((ROOT / 'scripts/projects/flower-knows-powder/story.json').read_text())
    metadata = json.loads((PUBLIC / 'audio/voice-metadata.json').read_text())
    config = json.loads((SRC / 'audio.json').read_text())
    assert sum(scene['duration'] for scene in story) <= DURATION
    assert [scene['id'] for scene in story] == [item['scene'] for item in metadata]
    assert [item['voice'] for item in metadata] == ['Adam bựa'] * len(story)
    assert max(item['speed'] for item in metadata) <= 1.12

    voice = np.zeros(round(DURATION * SR), dtype=np.float32)
    for scene, item in zip(story, metadata):
        values, sample_rate = sf.read(PUBLIC / 'audio' / item['file'], dtype='float32')
        assert sample_rate == SR and len(values) == round(scene['duration'] * SR)
        offset = round(scene['start'] * SR)
        voice[offset:offset + len(values)] += values
    peak = float(np.max(np.abs(voice * config['voiceVolume'])))
    assert peak < 1, f'Voice clips at {db(peak)} dBFS'

    # Mirror sourceAudioVolume() in Video.tsx: caption-driven dip, short tail fade.
    source, source_rate = sf.read(ROOT / 'public' / config['sourceFile'], dtype='float32', always_2d=True)
    assert abs(len(source) / source_rate - DURATION) < 0.01
    t = np.arange(len(voice)) / SR
    activity = np.zeros_like(t)
    captions = json.loads((SRC / 'captions.json').read_text())
    for scene, group in zip(story, captions):
        for caption in group:
            start = scene['start'] + caption['startMs'] / 1000
            end = scene['start'] + caption['endMs'] / 1000
            activity = np.maximum(activity, np.interp(t, [start - 0.12, start + 0.12, end - 0.12, end + 0.12], [0, 1, 1, 0], left=0, right=0))
    gain = config['sourcePauseVolume'] - (config['sourcePauseVolume'] - config['sourceSpeechVolume']) * activity
    gain *= np.interp(t, [DURATION - config['sourceEdgeFadeSeconds'], DURATION], [1, 0], left=1, right=0)
    source_at_voice_rate = np.stack([np.interp(t, np.arange(len(source)) / source_rate, source[:, ch]) for ch in range(source.shape[1])], 1)
    mix = source_at_voice_rate * gain[:, None] + (voice * config['voiceVolume'])[:, None]
    mix_peak = float(np.max(np.abs(mix)))
    assert mix_peak < 1, f'Voice + source mix clips at {db(mix_peak)} dBFS'
    report = {
        'durationSeconds': round(DURATION, 6),
        'dimensions': [1080, 1440],
        'fps': 30,
        'sourceAudioMuted': False,
        'sourceAudio': 'Customer music bed (0-3.05 s), sparkle chime (3.08-4.10 s) and whoosh (22.55-23.06 s) kept from source-effects.wav; phone-mic hiss and handling clicks removed; dips to sourceSpeechVolume under narration',
        'sourceVolumes': {key: config[key] for key in ('sourcePauseVolume', 'sourceSpeechVolume')},
        'captionsShown': False,
        'voice': 'Adam bựa',
        'voiceProvider': metadata[0]['provider'],
        'maximumTempo': max(item['speed'] for item in metadata),
        'wordMatchRatios': [item['wordMatchRatio'] for item in metadata],
        'voicePeakDbFS': db(peak),
        'mixPeakDbFS': db(mix_peak),
        'asrFlags': [
            '02-swan-lid: "Flower Knows" nghe thành "Flower Nose"; "hoa tuyết" nghe thành "hóa tuyết"',
            '03-stroke: "chứ" nghe thành "chưa"',
            '04-silver-rim: "Viền" nghe thành "Viên"',
            '06-snowflake: "Dặm … kẻo" nghe thành "dạm … kèo"',
        ],
        'rendered': False,
        'listeningReview': 'Pending user audition in Studio; ASR word-match does not validate Vietnamese tones.',
    }
    (ROOT / 'docs/projects/flower-knows-powder/qa.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
