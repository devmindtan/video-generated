#!/usr/bin/env python3
"""Offline structural and voice checks; listening approval remains manual."""
import json
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[3]
PUBLIC = ROOT / 'public/merzy-glam-tint'
SRC = ROOT / 'src/projects/merzy-glam-tint'
SR = 24000
DURATION = 787 / 30


def db(value):
    return round(float(20 * np.log10(max(value, 1e-9))), 2)


def main():
    story = json.loads((ROOT / 'scripts/projects/merzy-glam-tint/story.json').read_text())
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
    report = {
        'durationSeconds': round(DURATION, 6),
        'dimensions': [720, 1280],
        'fps': 30,
        'sourceAudioMuted': True,
        'captionsShown': False,
        'voice': 'Adam bựa',
        'voiceProvider': metadata[0]['provider'],
        'maximumTempo': max(item['speed'] for item in metadata),
        'wordMatchRatios': [item['wordMatchRatio'] for item in metadata],
        'voicePeakDbFS': db(peak),
        'asrFlags': [
            '01-greeting: "quà" nghe thành "qua"',
            '03-product: tên tiếng Anh "The Glam … Tint" nghe thành "thật là … Thin"',
            '04-swatch: "chồng" nghe thành "trồng"',
            '05-korea: "Xuất xứ" nghe thành "Xoát xứ"',
            '06-outro: "Xinh … làm quà" nghe thành "sinh … lam qua"',
        ],
        'rendered': False,
        'listeningReview': 'Pending user audition in Studio; ASR word-match does not validate Vietnamese tones.',
    }
    (ROOT / 'docs/projects/merzy-glam-tint/qa.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
