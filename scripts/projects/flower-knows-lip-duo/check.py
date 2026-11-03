#!/usr/bin/env python3
"""Offline structural and mix checks; listening approval remains manual."""
import json
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[3]
PUBLIC = ROOT / 'public/flower-knows-lip-duo'
SRC = ROOT / 'src/projects/flower-knows-lip-duo'
SR = 24000
FRAMES = 638
DURATION = FRAMES / 30
# The customer's track already hits 0 dBFS on single-sample clicks; any voice on top of
# one tips a sample over. Allow that, but never a sustained overshoot.
MAX_OVER_SAMPLES = 4


def db(value):
    return round(float(20 * np.log10(max(value, 1e-9))), 2)


def main():
    story = json.loads((ROOT / 'scripts/projects/flower-knows-lip-duo/story.json').read_text())
    metadata = json.loads((PUBLIC / 'audio/voice-metadata.json').read_text())
    config = json.loads((SRC / 'audio.json').read_text())
    assert story[-1]['start'] + story[-1]['duration'] <= DURATION
    assert [scene['id'] for scene in story] == [item['scene'] for item in metadata]
    assert [item['voice'] for item in metadata] == ['Adam bựa'] * len(story)
    assert max(item['speed'] for item in metadata) <= 1.12

    source, source_rate = sf.read(PUBLIC / 'audio/source-audio.wav', dtype='float32', always_2d=True)
    source = source[:round(DURATION * source_rate)]
    voice = np.zeros(len(source), dtype=np.float32)
    for scene, item in zip(story, metadata):
        values, sample_rate = sf.read(PUBLIC / 'audio' / item['file'], dtype='float32')
        assert sample_rate == SR and len(values) == round(scene['duration'] * SR)
        t = np.arange(round(len(values) * source_rate / SR)) / source_rate
        values = np.interp(t, np.arange(len(values)) / SR, values)
        offset = round(scene['start'] * source_rate)
        voice[offset:offset + len(values)] += values[:len(voice) - offset]
    mix = source * config['sourceVolume'] + (voice * config['voiceVolume'])[:, None]
    peaks = np.abs(mix).max(1)
    over = np.flatnonzero(peaks >= 1)
    assert len(over) <= MAX_OVER_SAMPLES, f'{len(over)} samples clip, first at {over[0] / source_rate:.3f} s'
    assert all(np.abs(source[i]).max() >= 10 ** (-0.1 / 20) for i in over), 'Clipping outside a 0 dBFS source click'
    report = {
        'durationSeconds': round(DURATION, 6),
        'dimensions': [1080, 1920],
        'fps': 30,
        'sourceAudio': 'Customer track kept unchanged (full level, no ducking or cleanup)',
        'sourceVolume': config['sourceVolume'],
        'captionsShown': False,
        'voice': 'Adam bựa',
        'voiceProvider': metadata[0]['provider'],
        'maximumTempo': max(item['speed'] for item in metadata),
        'wordMatchRatios': [item['wordMatchRatio'] for item in metadata],
        'voicePeakDbFS': db(float(np.abs(voice).max() * config['voiceVolume'])),
        'mixPeakDbFS': db(float(peaks.max())),
        'mixSamplesOverFullScale': [round(i / source_rate, 4) for i in over],
        'asrFlags': [
            '01-greeting: "Flower Knows" nghe thành "Flower Nose"',
            '02-case: "hoa tuyết" nghe thành "khóa tuyết" (take-1 còn mất chữ "bạc")',
            '03-two-ends: "Mua một, được hai" ASR viết số "Mua 1 được 2" (khớp)',
            '04-tint: "hồng" nghe thành "hông", "trầm" nghe thành "chầm"',
        ],
        'rendered': False,
        'listeningReview': 'Pending user audition in Studio; ASR word-match does not validate Vietnamese tones.',
    }
    (ROOT / 'docs/projects/flower-knows-lip-duo/qa.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
