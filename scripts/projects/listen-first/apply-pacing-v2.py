"""Redistribute existing silence around meaning; retain speech samples at 1x."""
import hashlib
import json
from pathlib import Path
import re

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[3]
SR, FPS = 24000, 30
read = lambda p: json.loads(p.read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n')


def main():
    backup = ROOT/'public/listen-first/backups/pacing-v1'
    old = read(backup/'voice.json')
    pages = read(backup/'captions.json')
    original_path = ROOT/'public'/old['activeSource']
    pcm, sr = sf.read(original_path, dtype='int16')
    assert sr == SR and len(pcm) == 45*SR and sha(original_path) == old['activeSha256']
    out = ROOT/'public/listen-first/audio/narration-quoc-tuan-v2-pacing.wav'
    assert not out.exists(), 'Never overwrite a take'
    # Bounds lie in actual quiet intervals found using word alignment and PCM.
    plans = [
        {'name':'opening', 'start':0, 'end':6.4,
         'inserts':[(0,.2), (2.14954,.24), (4.06375,.16)]},
        {'name':'safe-space', 'start':26.4, 'end':33.5, 'inserts':[(30.62729,.18)]},
        {'name':'question', 'start':33.8, 'end':39.0, 'inserts':[(35.84121,.22)]},
        {'name':'ending', 'start':39.4, 'end':45, 'inserts':[(40.24283,.22), (42.28575,.18)]},
    ]
    inserts, removals, regions = [], [], []
    for plan in plans:
        additions = []
        for seconds, length in plan['inserts']:
            at = round(seconds*SR)
            if at:
                # Use the closest exact zero within a quiet 10ms neighborhood.
                candidates = np.flatnonzero(pcm[at-60:at+61] == 0)+at-60
                assert len(candidates)
                at = int(candidates[np.argmin(np.abs(candidates-at))])
                window = pcm[at-120:at+120].astype(float)
                rms = float(np.sqrt(np.mean(window*window)))
                assert rms < 20, 'Do not insert a pause inside voiced phonemes'
            else:
                rms = 0
            insert = {'at':at, 'samples':round(length*SR), 'region':plan['name'], 'boundaryRmsPcm16':rms}
            inserts.append(insert)
            additions.append(insert)
        removed = sum(c['samples'] for c in additions)
        right = round(plan['end']*SR)
        left = right-removed
        assert np.all(pcm[left:right] == 0), 'Borrow only post-phrase digital silence'
        assert max(c['at'] for c in additions) < left
        removals.append({'start':left,'end':right,'region':plan['name']})
        regions.append({'name':plan['name'],'startSample':round(plan['start']*SR),'endSample':right})
    events = [(i['at'],'insert',i) for i in inserts]+[(r['start'],'remove',r) for r in removals]
    events.sort(key=lambda e:e[0])
    chunks, spans, cursor, offset = [], [], 0, 0
    for at, kind, event in events:
        assert at >= cursor
        block = pcm[cursor:at]
        if len(block):
            chunks.append(block)
            spans.append({'sourceStart':cursor,'sourceEnd':at,'outputStart':offset,'outputEnd':offset+len(block)})
            offset += len(block)
        if kind == 'insert':
            chunks.append(np.zeros(event['samples'],dtype='int16'))
            offset += event['samples']
            cursor = at
        else:
            cursor = event['end']
    if cursor < len(pcm):
        chunks.append(pcm[cursor:])
        spans.append({'sourceStart':cursor,'sourceEnd':len(pcm),'outputStart':offset,'outputEnd':offset+len(pcm)-cursor})
    changed = np.concatenate(chunks)
    assert len(changed) == len(pcm)
    for span in spans:
        assert np.array_equal(changed[span['outputStart']:span['outputEnd']],pcm[span['sourceStart']:span['sourceEnd']])
    # Each edit balances within its own region; everything else stays timed exactly.
    outside = np.ones(len(pcm),dtype=bool)
    for region in regions:
        outside[region['startSample']:region['endSample']] = False
    assert np.array_equal(changed[outside],pcm[outside])
    sf.write(out,changed,SR,subtype='PCM_16')

    def mapped(seconds):
        at = round(seconds*SR)
        delta = sum(i['samples'] for i in inserts if i['at'] <= at)
        delta -= sum(r['end']-r['start'] for r in removals if r['end'] <= at)
        assert not any(r['start'] < at < r['end'] for r in removals), 'Only map retained content'
        return (at+delta)/SR

    rest = [{**p,'startMs':round(mapped(p['startMs']/1000)*1000),'endMs':round(mapped(p['endMs']/1000)*1000)}
            for p in pages if p['startMs'] >= old['phraseRanges'][1]['startSeconds']*1000]
    for p in rest:
        p['timestampMs'] = p['startMs']
    alignment = read(ROOT/'docs/projects/listen-first/pacing-review-v1.json')['words']
    assert [w['text'].strip(',.').lower() for w in alignment[:3]] == ['có','người','vừa']
    first_cut, second_cut = [i['at']/SR for i in inserts if i['region']=='opening' and i['at']]
    clauses = [
        ('Có người vừa kể rằng họ đang rất mệt,',old['phraseRanges'][0]['startSeconds'],min(alignment[8]['end'],first_cut-.001)),
        ('bạn đã vội chỉ ra họ nên làm gì,',alignment[9]['start'],min(alignment[17]['end'],second_cut-.001)),
        ('đáng lẽ phải nghĩ thế nào.',alignment[18]['start'],old['phraseRanges'][0]['endSeconds']),
    ]
    intro = [{'text':text,'startMs':round(mapped(start)*1000),'endMs':round(mapped(end)*1000),
              'timestampMs':round(mapped(start)*1000),'confidence':None} for text,start,end in clauses]
    adjusted_pages = intro+rest
    cfg = read(ROOT/'scripts/projects/listen-first/audition.json')
    assert ' '.join(p['text'] for p in adjusted_pages) == ' '.join(s['text'] for s in cfg['sentences'])
    phrases = [{**p,'startSeconds':mapped(p['startSeconds']),'endSeconds':mapped(p['endSeconds'])} for p in old['phraseRanges']]
    chapters = []
    for scene in range(1,7):
        group = [p for p in phrases if p['scene']==scene]
        chapters.append({'scene':scene,'startSeconds':group[0]['startSeconds'],'endSeconds':group[-1]['endSeconds']})
    starts = [0]+[round((a['endSeconds']+b['startSeconds'])/2*FPS) for a,b in zip(chapters,chapters[1:])]
    # Other scene boundaries already have enough room; preserve the Studio edit.
    starts[2:] = old['sceneStartsFrames'][2:]
    lengths = [b-a+6 for a,b in zip(starts,starts[1:])]+[1350-starts[-1]]
    meta = {**old,'source':old['activeSource'],'sourceSha256':old['activeSha256'],
            'activeSource':str(out.relative_to(ROOT/'public')),'activeSha256':sha(out),
            'sourceDurationSeconds':45,'addedSilenceSeconds':0,'cuts':[], 'tailAddedSamples':0,
            'copySpans':spans,'phraseRanges':phrases,'chapters':chapters,
            'sceneStartsFrames':starts,'sceneLengthsFrames':lengths,'wordMatchRatio':None,
            'priorSourceWordMatchRatio':old['wordMatchRatio'],
            'speechPcmPreserved':True,'pacingEdit':{'backup':str(backup.relative_to(ROOT)),
                'inserts':inserts,'removals':removals,'regions':regions,
                'redistributedSilenceSeconds':sum(i['samples'] for i in inserts)/SR,
                'outsideRegionsUnchanged':True},
            'recognitionNote':'No new TTS; all speech PCM retained. Prior unpaced transcript matches authored tones. Word-alignment pass on paced audio flags giải/dài and an ủi/ăn uỷ despite identical speech PCM; listening review remains pending.'}
    meta.pop('allOriginalPcmSamplesPreserved',None)
    write(ROOT/'scripts/projects/listen-first/voice.json',meta)
    write(ROOT/'src/projects/listen-first/captions.json',adjusted_pages)
    stamp = lambda ms: f'{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d},{ms%1000:03d}'
    (ROOT/'public/listen-first/captions.srt').write_text('\n\n'.join(f'{i+1}\n{stamp(p["startMs"])} --> {stamp(p["endMs"])}\n{p["text"]}' for i,p in enumerate(adjusted_pages))+'\n')
    video = ROOT/'src/projects/listen-first/Video.tsx'
    markup = video.read_text().replace(old['activeSource'],meta['activeSource'])
    for i in [0,1]:
        pattern = rf'(<Sequence name="{i+1:02d}[^"\n]*" from=\{{)\d+(\}} durationInFrames=\{{)\d+(\}})'
        markup,n = re.subn(pattern,lambda m:f'{m[1]}{starts[i]}{m[2]}{lengths[i]}{m[3]}',markup)
        assert n==1
    video.write_text(markup)
    for name,expected in read(backup/'unchanged-assets.json').items():
        assert sha(ROOT/name)==expected, 'Preserve music, thumbnail and wording'
    print(json.dumps({'durationSeconds':45,'introStartsSeconds':phrases[0]['startSeconds'],
                      'introEndsSeconds':phrases[0]['endSeconds'],'redistributedSilenceSeconds':meta['pacingEdit']['redistributedSilenceSeconds'],
                      'captionPages':len(adjusted_pages),'sceneStartsFrames':starts},indent=2))


if __name__ == '__main__':
    main()
