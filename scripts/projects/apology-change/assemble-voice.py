"""Assemble selected local sentence takes with original pauses; preserve provenance."""
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
    configs = ['apology-change-quoc-tuan-v1','apology-change-pronunciation-fix-v2']
    inputs = []
    for name in configs:
        folder = ROOT/'public/voice-auditions'/name
        manifest = read(folder/'manifest.json')
        record = manifest['voices'][0]
        path = folder/record['file']
        assert record['status'] == 'ready' and sha(path) == record['sha256']
        pcm,sr = sf.read(path,dtype='int16')
        assert sr == 24000 and pcm.ndim == 1
        inputs.append({'path':path,'pcm':pcm,'record':record})
    cfg = read(ROOT/'scripts/projects/apology-change/audition.json')
    selected = {8:(1,0)}
    original = inputs[0]
    phrases = original['record']['phraseRanges']
    chunks,copy_map,ranges = [],[],[]
    cursor = 0
    def append(source,left,right,role):
        nonlocal cursor
        values = source['pcm'][left:right]
        chunks.append(values)
        copy_map.append({'source':str(source['path'].relative_to(ROOT/'public')),'sha256':sha(source['path']),
            'sourceStart':left,'sourceEnd':right,'outputStart':cursor,'outputEnd':cursor+len(values),'role':role})
        cursor += len(values)
    append(original,0,round(phrases[0]['startSeconds']*sr),'lead')
    for i,phrase in enumerate(phrases):
        source_id,phrase_id = selected.get(i,(0,i))
        chosen = inputs[source_id]
        bounds = chosen['record']['phraseRanges'][phrase_id]
        at = cursor/sr
        append(chosen,round(bounds['startSeconds']*sr),round(bounds['endSeconds']*sr),f'phrase-{i}')
        ranges.append({'text':cfg['sentences'][i]['text'],'startSeconds':at,'endSeconds':cursor/sr})
        left = round(phrase['endSeconds']*sr)
        right = round(phrases[i+1]['startSeconds']*sr) if i+1<len(phrases) else len(original['pcm'])
        append(original,left,right,'original-pause' if i+1<len(phrases) else 'tail')
    out = ROOT/'public/voice-auditions/apology-change-assembled-v3'
    if out.exists():
        raise RuntimeError('Assembly already exists; keep immutable takes')
    out.mkdir(parents=True)
    (out/'recognition').mkdir()
    audio = out/'narration-quoc-tuan.wav'
    sf.write(audio,np.concatenate(chunks),sr,subtype='PCM_16')
    shared = runpy.run_path(str(ROOT/'scripts/shared/make-voice.py'))
    shared['align_captions'].__globals__['CACHE'] = out/'recognition'
    from faster_whisper import WhisperModel
    model = WhisperModel('medium',device='cpu',compute_type='int8',cpu_threads=4,download_root=str(ROOT/'.cache/whisper'))
    text = ' '.join(s['text'] for s in cfg['sentences'])
    captions,qa = shared['align_captions'](model,audio,text,ranges[-1]['endSeconds'],.95)
    record = {'name':'Quốc Tuấn','status':'ready','file':audio.name,'sha256':sha(audio),
        'captionsFile':'captions.json','phraseRanges':ranges,'durationSeconds':cursor/sr,**qa}
    manifest = {'config':cfg,'text':text,'voices':[record],'sourceAssembly':'assembly.json',
        'listeningReview':'Pending user confirmation; ASR checks do not approve perceived quality','paidApiCalls':0}
    for path,data in [(out/'manifest.json',manifest),(out/'captions.json',captions),(out/'assembly.json',{'copyMap':copy_map,'selectedRepairs':selected,'allUnchangedPhrasesAndPausesPreserved':True,'tempo':1})]:
        path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'durationSeconds':cursor/sr,**qa},ensure_ascii=False,indent=2))


if __name__ == '__main__':
    main()
