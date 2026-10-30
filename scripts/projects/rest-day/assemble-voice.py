"""Assemble local clause takes at native 1x; retain each source and PCM provenance."""
import hashlib
import json
from pathlib import Path
import runpy

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[3]
read = lambda p: json.loads(p.read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()


def main():
    cfg = read(ROOT/'scripts/projects/rest-day/audition.json')
    sources = []
    for name in ['rest-day-quoc-tuan-v1', 'rest-day-pronunciation-fix-v1', 'rest-day-pronunciation-fix-v2']:
        folder = ROOT/'public/voice-auditions'/name
        record = read(folder/'manifest.json')['voices'][0]
        path = folder/record['file']
        assert record['status'] == 'ready' and sha(path) == record['sha256']
        pcm, sr = sf.read(path, dtype='int16')
        assert sr == 24000 and pcm.ndim == 1
        sources.append({'path': path, 'pcm': pcm, 'record': record})
    choices = [(0,0), (1,0), (1,1), (0,3), (2,0), (2,1), (2,2), (0,6)]
    chunks, ranges, copy_map = [np.zeros(round(cfg['leadIn']*sr), dtype='int16')], [], []
    cursor = len(chunks[0])
    for sentence, (source_id, phrase_id) in zip(cfg['sentences'], choices):
        chosen = sources[source_id]
        phrase = chosen['record']['phraseRanges'][phrase_id]
        assert phrase['text'] == sentence['text']
        left, right = round(phrase['startSeconds']*sr), round(phrase['endSeconds']*sr)
        values = chosen['pcm'][left:right]
        chunks.append(values)
        copy_map.append({'source':str(chosen['path'].relative_to(ROOT/'public')), 'sha256':sha(chosen['path']),
                         'sourceStart':left, 'sourceEnd':right, 'outputStart':cursor, 'outputEnd':cursor+len(values)})
        ranges.append({'text':sentence['text'], 'startSeconds':cursor/sr, 'endSeconds':(cursor+len(values))/sr})
        pause = np.zeros(round(sentence['pauseAfter']*sr), dtype='int16')
        chunks.append(pause)
        cursor += len(values)+len(pause)
    assert len(ranges) == len(cfg['sentences'])
    chunks.append(np.zeros(round(cfg['tail']*sr), dtype='int16'))
    audio_values = np.concatenate(chunks)
    assert len(audio_values)/sr < 44.4, 'Shorten script; never accelerate voice'
    out = ROOT/'public/voice-auditions/rest-day-assembled-v3'
    if out.exists():
        raise RuntimeError('Keep immutable audition; choose another take')
    out.mkdir(parents=True)
    (out/'recognition').mkdir()
    audio = out/'narration-quoc-tuan.wav'
    sf.write(audio, audio_values, sr, subtype='PCM_16')
    shared = runpy.run_path(str(ROOT/'scripts/shared/make-voice.py'))
    shared['align_captions'].__globals__['CACHE'] = out/'recognition'
    from faster_whisper import WhisperModel
    model = WhisperModel('medium',device='cpu',compute_type='int8',cpu_threads=4,download_root=str(ROOT/'.cache/whisper'))
    text = ' '.join(s['text'] for s in cfg['sentences'])
    pages, qa = shared['align_captions'](model, audio, text, ranges[-1]['endSeconds'], .95)
    record = {'name':'Quốc Tuấn', 'status':'ready', 'file':audio.name, 'sha256':sha(audio),
              'captionsFile':'captions.json', 'phraseRanges':ranges, 'durationSeconds':len(audio_values)/sr, **qa}
    manifest = {'config':cfg, 'text':text, 'voices':[record], 'paidApiCalls':0,
                'listeningReview':'Pending user listening; raw Vietnamese tones need separate review'}
    for path, value in [(out/'manifest.json',manifest), (out/'captions.json',pages),
                        (out/'assembly.json',{'copyMap':copy_map, 'choices':choices, 'tempo':1, 'allSelectedPcmPreserved':True})]:
        path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'durationSeconds':len(audio_values)/sr, **qa},ensure_ascii=False,indent=2))


if __name__ == '__main__':
    main()
