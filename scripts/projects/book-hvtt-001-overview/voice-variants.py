"""Pitch variants of an intro audition take, duration preserved (same method as kids voice B).

Resample to shift pitch, then ffmpeg atempo to restore the original length, so captions, phrase ranges
and timing stay valid. Writes catalog-shaped takes public/voice-auditions/<source>-<suffix>/ for
intro-bands.py; the source take is never modified. Audition only: nothing is applied until the user picks.
Usage: .venv/bin/python scripts/projects/book-hvtt-001-overview/voice-variants.py --source book-hvtt-intro-clone-v3 --semitones -1 -2 1
"""
import argparse, io, json, shutil, subprocess
from pathlib import Path
import numpy as np
import soundfile as sf
import soxr

ROOT = Path(__file__).resolve().parents[3]
FF = ROOT / 'node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg'
LABELS = {-2: 'trầm hẳn', -1: 'trầm hơn', 1: 'sáng hơn', 2: 'sáng hẳn'}


def shift(data, sr, semitones):
    ratio = 2 ** (semitones / 12)
    raised = soxr.resample(data, sr * ratio, sr)
    buf = io.BytesIO()
    sf.write(buf, raised, sr, format='WAV', subtype='PCM_24')
    encoded = subprocess.check_output([str(FF), '-v', 'error', '-f', 'wav', '-i', '-', '-af', f'atempo={1 / ratio:.8f}', '-c:a', 'pcm_s24le', '-f', 'wav', '-'],
                                      input=buf.getvalue(), env={'LD_LIBRARY_PATH': str(FF.parent)})
    out, _ = sf.read(io.BytesIO(encoded))
    out = out[:len(data)] if len(out) >= len(data) else np.pad(out, [(0, len(data) - len(out))] + [(0, 0)] * (out.ndim - 1))
    # Same loudness as the source, never above its peak headroom.
    rms = lambda x: np.sqrt(np.mean(x ** 2))
    return out * min(rms(data) / max(rms(out), 1e-9), np.max(np.abs(data)) / max(np.max(np.abs(out)), 1e-9))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', default='book-hvtt-intro-clone-v3')
    parser.add_argument('--semitones', type=float, nargs='+', default=[-1, -2, 1])
    args = parser.parse_args()
    src = ROOT / 'public/voice-auditions' / args.source
    manifest = json.loads((src / 'manifest.json').read_text())
    for st in args.semitones:
        suffix = ('tram' if st < 0 else 'sang') + str(abs(st)).rstrip('0').rstrip('.').replace('.', '_')
        out = ROOT / 'public/voice-auditions' / f'{args.source}-{suffix}'
        if out.exists():
            raise RuntimeError(f'{out.name} exists; variants are never overwritten')
        out.mkdir()
        voices = []
        for v in manifest['voices']:
            data, sr = sf.read(src / v['file'])
            vid = f"{v['id']}-{suffix}"
            sf.write(out / f'{vid}.wav', shift(data, sr, st), sr, subtype='PCM_24')
            record = {**v, 'id': vid, 'name': f"{v['name']} · {LABELS.get(int(st), '')} ({st:+g} bán cung)".replace(' ()', ''),
                      'file': f'{vid}.wav', 'pitchSemitones': st, 'durationPreserved': True, 'derivedFrom': f"{args.source}/{v['file']}"}
            if v.get('captionsFile'):
                shutil.copy2(src / v['captionsFile'], out / f'{vid}-captions.json')
                record['captionsFile'] = f'{vid}-captions.json'
            voices.append(record)
        (out / 'manifest.json').write_text(json.dumps({**manifest, 'title': f"{manifest['title']} — {st:+g} bán cung", 'voices': voices,
            'config': {**manifest['config'], 'title': f"{manifest['config'].get('title', '')} · cao độ {st:+g}"},
            'processing': 'soxr resample + ffmpeg atempo, duration preserved; captions copied from source'}, ensure_ascii=False, indent=2) + '\n')
        print(f'{out.relative_to(ROOT)} ({st:+g} semitones)')


if __name__ == '__main__':
    main()
