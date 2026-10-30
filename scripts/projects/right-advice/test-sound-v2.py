"""Source-stem health and mono compatibility, not a perceptual quality rating."""
import hashlib
import json
from pathlib import Path
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[3]
report = json.loads((ROOT / 'public/right-advice/audio/sound-v2/provenance.json').read_text())
assert report['apiCalls'] == 0 and len(report['files']) == 8
for item in report['files']:
    path = ROOT / 'public' / item['file']
    assert hashlib.sha256(path.read_bytes()).hexdigest() == item['sha256'], f'Source was edited: update provenance for {path.name}'
    audio, sr = sf.read(path, always_2d=True)
    assert sr == 24000 and audio.shape[1] == 2
    assert abs(len(audio) / sr - item['durationSeconds']) < 1 / sr
    assert np.max(np.abs(audio)) < .4
    assert np.max(np.abs(audio[[0, -1]])) <= 1 / 32768
    assert np.max(np.abs(np.mean(audio, axis=0))) < .001, 'DC offset'
    mono = audio.mean(axis=1)
    retention = np.mean(mono ** 2) / np.mean(audio ** 2)
    assert retention > .65, f'Mono cancellation in {path.name}'
    print(f'{path.name}: edges clean, mono energy retention {retention:.0%}')
for name in ['crossroads-wind', 'porcelain-crack', 'brass-clink']:
    assert (ROOT / 'public/right-advice/audio' / (name + '.wav')).is_file(), 'V1 must remain recoverable'
print('Eight stereo stems checked; V1 source files preserved. Listening review still required.')
