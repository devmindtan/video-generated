"""Replace three flagged phrases locally, preserving all other PCM and times."""
import hashlib
import json
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[3]
read = lambda p: json.loads(p.read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()


def main():
    backup = ROOT/'public/small-mistakes/backups/narration-v1'
    meta = read(backup/'voice.json')
    base_file = ROOT/'public'/meta['activeSource']
    assert sha(base_file) == meta['activeSha256']
    pcm, sr = sf.read(base_file, dtype='int16')
    folder = ROOT/'public/voice-auditions/small-mistakes-pronunciation-fix-v2'
    record = read(folder/'manifest.json')['voices'][0]
    audit = read(folder/'recognition/25-quoc-tuan-recognition.json')
    assert 'mình nên im lặng' in audit['recognized'].lower()
    assert 'một lỗi nhỏ cần được sửa' in audit['recognized'].lower()
    source = folder/record['file']
    assert sha(source) == record['sha256']
    values, rate = sf.read(source, dtype='int16')
    assert rate == sr == 24000
    cfg = read(ROOT/'scripts/projects/small-mistakes/audition.json')
    old_pages = read(backup/'captions.json')
    groups = [[] for _ in meta['phraseRanges']]
    cursor = 0
    for p in old_pages:
        offset = 0
        for i, phrase in enumerate(meta['phraseRanges']):
            end = offset + len(phrase['text'].split())
            if offset <= cursor < end:
                assert cursor+len(p['text'].split()) <= end
                groups[i].append(p)
                break
            offset = end
        cursor += len(p['text'].split())
    repair_pages = read(folder/record['captionsFile'])
    repair_groups = [[] for _ in record['phraseRanges']]
    cursor = 0
    word_ends = np.cumsum([len(p['text'].split()) for p in record['phraseRanges']])
    for p in repair_pages:
        i = next(i for i,end in enumerate(word_ends) if cursor < end)
        assert cursor+len(p['text'].split()) <= word_ends[i]
        repair_groups[i].append(p)
        cursor += len(p['text'].split())
    output = pcm.copy()
    repairs = []
    for j, i in enumerate([4,11,12]):
        phrase = meta['phraseRanges'][i]
        start = round(phrase['startSeconds']*sr)
        end = min(round((phrase['endSeconds']+.4)*sr),round((meta['phraseRanges'][i+1]['startSeconds']-.05)*sr))
        bounds = record['phraseRanges'][j]
        left, right = [round(bounds[k]*sr) for k in ['startSeconds','endSeconds']]
        replacement = values[left:right]
        assert len(replacement) <= end-start
        output[start:end] = 0
        output[start:start+len(replacement)] = replacement
        authored = cfg['sentences'][i]['text'].split()
        cursor = 0
        groups[i] = []
        for p in repair_groups[j]:
            count = len(p['text'].split())
            a = max(p['startMs']/1000,bounds['startSeconds'])
            b = min(p['endMs']/1000,bounds['endSeconds'])
            at = start/sr + a-bounds['startSeconds']
            until = start/sr + b-bounds['startSeconds']
            item = {**p,'text':' '.join(authored[cursor:cursor+count]),'startMs':round(at*1000),'endMs':round(until*1000),'timestampMs':round(at*1000)}
            assert item['startMs'] < item['endMs']
            groups[i].append(item)
            cursor += count
        assert cursor == len(authored)
        repairs.append({'phraseIndex':i,'startSample':start,'endSample':end,'replacementStartSample':left,'replacementEndSample':right})
        meta['phraseRanges'][i] = {**phrase,'text':cfg['sentences'][i]['text'],'endSeconds':(start+len(replacement))/sr}
    mask = np.ones(len(pcm),dtype=bool)
    for r in repairs:
        mask[r['startSample']:r['endSample']] = False
    assert np.array_equal(pcm[mask],output[mask])
    dest = ROOT/'public/small-mistakes/audio/narration-quoc-tuan-v2-pronunciation.wav'
    if dest.exists():
        raise RuntimeError('Immutable repair already exists')
    sf.write(dest,output,sr,subtype='PCM_16')
    meta['speechRepairs'] = {'previousSource':meta['activeSource'],'previousSha256':meta['activeSha256'],
        'replacementSource':str(source.relative_to(ROOT/'public')),'replacementSha256':record['sha256'],
        'regions':repairs,'rawRecognition':audit['recognized'],'unaffectedPcmPreserved':True,
        'listeningReview':'Pending user confirmation; accent-insensitive ASR is not pronunciation approval'}
    meta['copySpansReferTo'] = meta['activeSource']
    meta['activeSource'] = str(dest.relative_to(ROOT/'public'))
    meta['activeSha256'] = sha(dest)
    meta['allOriginalPcmSamplesPreserved'] = False
    for i, chapter in enumerate(meta['chapters'],1):
        phrases = [p for p in meta['phraseRanges'] if p['scene']==i]
        chapter['endSeconds'] = phrases[-1]['endSeconds']
    pages = [p for group in groups for p in group]
    assert ' '.join(p['text'] for p in pages) == ' '.join(s['text'] for s in cfg['sentences'])
    for path,data in [(ROOT/'scripts/projects/small-mistakes/voice.json',meta),(ROOT/'src/projects/small-mistakes/captions.json',pages)]:
        path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    def stamp(ms):
        return f'{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d},{ms%1000:03d}'
    (ROOT/'public/small-mistakes/captions.srt').write_text('\n\n'.join(f'{i+1}\n{stamp(p["startMs"])} --> {stamp(p["endMs"])}\n{p["text"]}' for i,p in enumerate(pages))+'\n')
    print(json.dumps(meta['speechRepairs'],ensure_ascii=False,indent=2))


if __name__ == '__main__':
    main()
