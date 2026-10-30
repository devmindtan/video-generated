"""Local VieNeu synthesis profiles. No network, model loading or paid API here."""
from dataclasses import asdict, dataclass
import hashlib
import json
import os
from pathlib import Path

import numpy as np


@dataclass(frozen=True)
class VoiceQuality:
    name: str
    sample_rate: int
    subtype: str
    native_tempo: bool
    normalize_per_phrase: bool
    trim_head: float
    trim_tail: float
    temperature: float


PROFILES = {
    # Compatibility: retain existing cache, PCM16, atempo and phrase-level gains.
    'legacy24': VoiceQuality('legacy24', 24000, 'PCM_16', False, True, .07, .09, .65),
    # A candidate for audition, NOT automatic replacement of approved voices.
    'natural48': VoiceQuality('natural48', 48000, 'PCM_24', True, False, .12, .18, .8),
}


def cache_key(voice, text, temperature, profile, identity, sampling):
    if profile.name == 'legacy24' and sampling == {'top_k': 25, 'top_p': .95, 'repetition_penalty': 1.2}:
        # Deliberately identical to the previous pipeline's historical key.
        payload = voice + f'|complete-sentences-{temperature:.2f}|' + text
    else:
        payload = json.dumps({
            'schema': 2, 'voice': voice, 'text': text, 'temperature': temperature,
            'quality': asdict(profile), 'engine': identity, 'sampling': sampling,
        }, ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(payload.encode()).hexdigest()[:16]


def engine_identity(root, package_version):
    revisions = {}
    hub = Path(os.environ.get('HF_HOME',str(Path(root) / '.cache/huggingface'))) / 'hub'
    for name in ['pnnbao-ump--VieNeu-TTS-v3-Turbo', 'OpenMOSS-Team--MOSS-Audio-Tokenizer-Nano-ONNX']:
        ref = hub / ('models--' + name) / 'refs/main'
        revisions[name] = ref.read_text().strip() if ref.exists() else 'not-recorded'
    return {'package': package_version, 'mode': 'v3turbo', 'backend': 'onnx',
            'device': 'cpu', 'precision': 'fp32', 'cachedModelRefs': revisions}


def require_native_tempo(profile, speed):
    if profile.native_tempo and abs(speed - 1) > 1e-8:
        raise RuntimeError(
            'natural48 keeps narration at 1x. Text does not fit, or the story requests '
            'a different speed. Adjust wording/picture beats, not narration tempo.'
        )


def normalize_gain(values, gain_db=0, active_only=False):
    """One linear gain, not compression. Keep relative dynamics within the clip."""
    values = np.asarray(values, dtype=np.float64).copy()
    if not len(values) or not np.all(np.isfinite(values)) or np.max(np.abs(values)) < 1e-12:
        raise RuntimeError('Empty/non-finite synthesis')
    active = values[np.abs(values) > .003] if active_only else values
    if not len(active):
        raise RuntimeError('Silent synthesis')
    rms = np.sqrt(np.mean(active * active))
    factor = min(10 ** ((-17.5 + gain_db) / 20) / max(rms, 1e-9),
                 .76 / max(np.max(np.abs(values)), 1e-9))
    return values * factor
