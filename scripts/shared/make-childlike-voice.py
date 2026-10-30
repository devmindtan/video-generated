"""Apply accepted Tí Hon voice B to a project without replacing its original WAVs."""
import argparse
import io
import json
from pathlib import Path
import subprocess
import numpy as np
import soundfile as sf
import soxr

ROOT = Path(__file__).resolve().parents[2]
FF = ROOT/'node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project', required=True)
    parser.add_argument('--output-subdir', default='childlike')
    args = parser.parse_args()
    base = (ROOT/'public'/args.project/'audio').resolve()
    assert base.is_relative_to(ROOT/'public')
    story = json.loads((ROOT/'scripts/projects'/args.project/'story.json').read_text())
    output = (base/args.output_subdir).resolve()
    assert output.is_relative_to(base) and output!=base
    output.mkdir(exist_ok=True)
    cache = ROOT/'.cache/childlike-voice'/args.project
    cache.mkdir(parents=True, exist_ok=True)
    ratio = 2**(2.5/12)
    for scene in story:
        filename = scene['id']+'-voice-full.wav'
        data, sr = sf.read(base/filename)
        temp = cache/filename
        sf.write(temp, soxr.resample(data, sr*ratio, sr), sr, subtype='PCM_16')
        encoded = subprocess.check_output([str(FF), '-v', 'error', '-i', str(temp), '-af', f'atempo={1/ratio}', '-f', 'wav', '-'])
        processed, _ = sf.read(io.BytesIO(encoded))
        processed = np.pad(processed[:len(data)], (0, max(0, len(data)-len(processed))))
        processed *= min(1.5, np.sqrt(np.mean(data**2))/max(np.sqrt(np.mean(processed**2)), 1e-9), .76/max(np.max(np.abs(processed)), 1e-9))
        sf.write(output/filename, processed, sr, subtype='PCM_16')
        print(scene['id']+': voice B ready', flush=True)
    metadata = json.loads((base/'voice-metadata.json').read_text())
    (output/'voice-metadata.json').write_text(json.dumps({'baseVoice':'Trúc Ly', 'profile':'Tí Hon voice B — stylized childlike cartoon narrator', 'pitchSemitones':2.5, 'durationPreserved':True, 'scenes':metadata}, ensure_ascii=False, indent=2)+'\n')


if __name__ == '__main__':
    main()
