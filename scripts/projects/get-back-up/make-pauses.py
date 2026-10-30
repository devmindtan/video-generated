"""Insert silence only: preserve every PCM16 sample of the selected original.
Metadata maps the old source clock to the new source and .99x audible clock.
No synthesis, atempo, pitch, gain, compression or rendering.
"""
import hashlib
import json
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT=Path(__file__).resolve().parents[3]


def main():
    cfg=json.loads((ROOT/'scripts/projects/get-back-up/pauses-v2.json').read_text())
    voice=json.loads((ROOT/'scripts/projects/get-back-up/voice.json').read_text())
    source=ROOT/'public'/cfg['source']
    assert hashlib.sha256(source.read_bytes()).hexdigest()==voice['sha256']
    original,sr=sf.read(source,dtype='int16')
    assert sr==24000 and original.ndim==1
    data=original.astype(float)/32768
    cuts=[]
    for cue in cfg['cuts']:
        candidates=[]
        for j in range(round((cue['near']-.22)*sr),round((cue['near']+.22)*sr),round(.005*sr)):
            block=data[j:j+round(.025*sr)]
            if len(block) and np.max(np.abs(block))<.006 and np.sqrt(np.mean(block*block))<.002:
                candidates.append((abs(j/sr+.0125-cue['near']),j))
        if not candidates:raise RuntimeError(f'No quiet insertion point: {cue}')
        _,j=min(candidates)
        center=j+round(.0125*sr)
        window=range(center-round(.008*sr),center+round(.008*sr))
        index=min(window,key=lambda k:(abs(int(original[k])),abs(k-center)))
        assert abs(data[index])<.006
        cuts.append({**cue,'sourceSample':index,'sourceSeconds':index/sr,
                     'addedSamples':round(cue['add']*sr),'boundaryAmplitude':float(abs(data[index]))})
    assert all(a['sourceSample']<b['sourceSample'] for a,b in zip(cuts,cuts[1:]))
    chunks=[];previous=0;spans=[];cursor=0
    for cut in cuts:
        block=original[previous:cut['sourceSample']]
        chunks.append(block)
        spans.append({'sourceStart':previous,'sourceEnd':cut['sourceSample'],'outputStart':cursor,'outputEnd':cursor+len(block)})
        cursor+=len(block)
        chunks.append(np.zeros(cut['addedSamples'],dtype='int16'));cursor+=cut['addedSamples']
        previous=cut['sourceSample']
    chunks.append(original[previous:])
    spans.append({'sourceStart':previous,'sourceEnd':len(original),'outputStart':cursor,'outputEnd':cursor+len(original)-previous})
    output=np.concatenate(chunks)
    assert np.array_equal(np.concatenate([output[s['outputStart']:s['outputEnd']] for s in spans]),original)
    dest=ROOT/'public'/cfg['output']
    if dest.exists():raise RuntimeError('Pacing take already exists; do not overwrite it')
    sf.write(dest,output,sr,subtype='PCM_16')

    def source_time(t,edge=None):
        close=[c for c in cuts if abs(t-c['sourceSeconds'])<=.035]
        if edge and close:
            c=min(close,key=lambda c:abs(t-c['sourceSeconds']))
            t=c['sourceSeconds']
            extra=sum(cut['add'] for cut in cuts if cut['sourceSeconds']<t or (edge=='start' and cut['sourceSeconds']==t))
        else:extra=sum(c['add'] for c in cuts if c['sourceSeconds']<=t)
        return t+extra

    captions=json.loads((ROOT/'public/get-back-up/backups/pacing-v1/captions.json').read_text())
    expected=[p['text'] for p in captions]
    phrases=voice['phraseRanges'];word_offset=0;bounds=[]
    for p in phrases:
        bounds.append((word_offset,word_offset+len(p['text'].split()),p))
        word_offset+=len(p['text'].split())
    cursor=0
    for page in captions:
        begin,end,p=next(b for b in bounds if b[0]<=cursor<b[1])
        assert cursor+len(page['text'].split())<=end
        a=max(page['startMs']/1000,p['startSeconds'])
        b=min(page['endMs']/1000,p['endSeconds'])
        page['startMs']=round(source_time(a,'start')/cfg['playbackRate']*1000)
        page['endMs']=round(source_time(b,'end')/cfg['playbackRate']*1000)
        page['timestampMs']=page['startMs']
        assert page['endMs']>page['startMs']
        cursor+=len(page['text'].split())
    assert [p['text'] for p in captions]==expected
    adjusted_phrases=[{**p,'startSeconds':source_time(p['startSeconds'])/cfg['playbackRate'],
                      'endSeconds':source_time(p['endSeconds'])/cfg['playbackRate']} for p in phrases]
    starts=[0]+[round((a['endSeconds']+b['startSeconds'])/2*30) for a,b in zip(adjusted_phrases,adjusted_phrases[1:])]
    lengths=[b-a+6 for a,b in zip(starts,starts[1:])]+[cfg['compositionSeconds']*30-starts[-1]]
    report={**cfg,'sampleRateHz':sr,'sourceSha256':voice['sha256'],
            'outputSha256':hashlib.sha256(dest.read_bytes()).hexdigest(),
            'sourceDurationSeconds':len(original)/sr,'outputSourceDurationSeconds':len(output)/sr,
            'audibleDurationSeconds':len(output)/sr/cfg['playbackRate'],
            'addedSilenceSeconds':sum(c['add'] for c in cuts),'cuts':cuts,'copySpans':spans,
            'allOriginalPcmSamplesPreserved':True,'phraseRanges':adjusted_phrases,
            'sceneStartsFrames':starts,'sceneLengthsFrames':lengths,
            'listeningReview':'Pending user review of added pauses; no new synthesis'}
    folder=ROOT/'public/get-back-up/audio'
    (folder/'pacing-v2.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    (folder/'pacing-v2-captions.json').write_text(json.dumps(captions,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:report[k] for k in ['addedSilenceSeconds','audibleDurationSeconds','sceneStartsFrames','sceneLengthsFrames']},indent=2))


if __name__=='__main__':main()
