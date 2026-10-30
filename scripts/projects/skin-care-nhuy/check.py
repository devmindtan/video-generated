#!/usr/bin/env python3
"""Offline structural and mix checks; listening approval remains manual."""
import json
from pathlib import Path

import numpy as np
import soundfile as sf
import soxr

ROOT = Path(__file__).resolve().parents[3]
PUBLIC = ROOT / 'public/skin-care-nhuy'
SRC = ROOT / 'src/projects/skin-care-nhuy'
SR = 48000
DURATION = 30.133333
N = round(DURATION * SR)


def read(path):
    values, sample_rate = sf.read(path, dtype='float32')
    if values.ndim == 1:
        values = np.column_stack((values, values))
    if sample_rate != SR:
        values = soxr.resample(values, sample_rate, SR)
    return values


def add(track, values, at):
    offset = round(at * SR)
    end = min(N, offset + len(values))
    track[offset:end] += values[:end - offset]


def db(value):
    return round(float(20 * np.log10(max(value, 1e-9))), 2)


def main():
    story = json.loads((ROOT / 'scripts/projects/skin-care-nhuy/story.json').read_text())
    metadata = json.loads((PUBLIC / 'audio/voice-metadata.json').read_text())
    provenance = json.loads((PUBLIC / 'sfx/provenance.json').read_text())
    config = json.loads((SRC / 'audio.json').read_text())
    assert (PUBLIC / 'video/source.mp4').read_bytes() == (ROOT / 'out/skin-care-nhuy.mp4').read_bytes()
    assert sum(scene['duration'] for scene in story) == 30
    assert [item['voice'] for item in metadata] == ['Adam bựa'] * 6
    assert max(item['speed'] for item in metadata) <= 1.12
    assert min(item['wordMatchRatio'] for item in metadata) >= .8

    voice = np.zeros((N, 2), dtype=np.float32)
    for scene, item in zip(story, metadata):
        add(voice, read(PUBLIC / 'audio' / item['file']), scene['start'])
    sfx = np.zeros_like(voice)
    for cue in provenance['cues']:
        add(sfx, read(ROOT / 'public' / cue['file']), cue['atSeconds'])
    mix = voice * config['voiceVolume'] + sfx * config['sfxVolume']
    peak = float(np.max(np.abs(mix)))
    assert peak < 1, f'Mix clips at {db(peak)} dBFS'
    active = np.max(np.abs(voice), axis=1) > .003
    voice_rms = float(np.sqrt(np.mean(voice[active] ** 2)))
    sfx_rms = float(np.sqrt(np.mean(sfx[active] ** 2)))
    report = {
        'durationSeconds': DURATION,
        'dimensions': [368, 654],
        'fps': 30,
        'sourceAudioMuted': True,
        'voice': 'Adam bựa',
        'voiceProvider': metadata[0]['provider'],
        'maximumTempo': max(item['speed'] for item in metadata),
        'wordMatchRatios': [item['wordMatchRatio'] for item in metadata],
        'sfxCueCount': len(provenance['cues']),
        'mixPeakDbFS': db(peak),
        'sfxBelowVoiceDuringSpeechDb': round(db(voice_rms) - db(sfx_rms), 2),
        'rendered': False,
        'listeningReview': 'Pending user audition in Studio; numerical checks do not establish perceived quality.',
    }
    (ROOT / 'docs/projects/skin-care-nhuy/qa.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
