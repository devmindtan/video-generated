#!/usr/bin/env python3
"""Export one sendable MP3 containing the complete Adam narration and SFX timeline."""
import json
from pathlib import Path
import subprocess
import tempfile

import numpy as np
import soundfile as sf
import soxr

ROOT = Path(__file__).resolve().parents[3]
PUBLIC = ROOT / 'public/skin-care-nhuy'
OUTPUT = ROOT / 'out/skin-care-nhuy-adam-voice-sfx.mp3'
FFMPEG = ROOT / 'node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg'
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


def main():
    if OUTPUT.exists():
        raise FileExistsError(f'Preserving existing mixdown: {OUTPUT}')
    story = json.loads((ROOT / 'scripts/projects/skin-care-nhuy/story.json').read_text())
    metadata = json.loads((PUBLIC / 'audio/voice-metadata.json').read_text())
    provenance = json.loads((PUBLIC / 'sfx/provenance.json').read_text())
    config = json.loads((ROOT / 'src/projects/skin-care-nhuy/audio.json').read_text())

    voice = np.zeros((N, 2), dtype=np.float32)
    for scene, item in zip(story, metadata):
        add(voice, read(PUBLIC / 'audio' / item['file']), scene['start'])
    effects = np.zeros_like(voice)
    for cue in provenance['cues']:
        add(effects, read(ROOT / 'public' / cue['file']), cue['atSeconds'])
    mix = voice * config['voiceVolume'] + effects * config['sfxVolume']
    peak = float(np.max(np.abs(mix)))
    if peak >= 1:
        raise RuntimeError(f'Mix clips at {20 * np.log10(peak):.2f} dBFS')

    with tempfile.TemporaryDirectory(prefix='skin-care-mix-', dir=ROOT / '.cache') as directory:
        wav = Path(directory) / 'mix.wav'
        sf.write(wav, mix, SR, subtype='PCM_24')
        subprocess.run([
            str(FFMPEG), '-v', 'error', '-i', str(wav),
            '-codec:a', 'libmp3lame', '-b:a', '192k', '-ar', str(SR),
            '-metadata', 'title=Skin Care Nhuy - Adam bua + SFX',
            str(OUTPUT),
        ], check=True)
    print(json.dumps({
        'output': str(OUTPUT),
        'durationSeconds': DURATION,
        'sampleRate': SR,
        'channels': 2,
        'codec': 'MP3 192 kbps',
        'mixPeakDbFS': round(float(20 * np.log10(peak)), 2),
        'contains': 'Six Adam bựa narration segments plus seven SFX cues; original video audio excluded',
    }, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
