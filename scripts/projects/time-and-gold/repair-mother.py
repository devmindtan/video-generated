"""Replace one mispronounced phrase; keep every other PCM sample and timing."""
import hashlib
import json
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[3]
read = lambda p: json.loads((ROOT/p).read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()


def main():
    backup = ROOT/'public/time-and-gold/backups/before-mother-fix'
    meta = json.loads((backup/'voice.json').read_text())
    old = ROOT/'public'/meta['activeSource']
    assert sha(old) == meta['activeSha256']
    folder = ROOT/'public/voice-auditions/time-and-gold-mother-fix-v1'
    take = json.loads((folder/'manifest.json').read_text())['voices'][0]
    audit = json.loads((folder/'recognition/25-quoc-tuan-recognition.json').read_text())
    assert 'mẹ' in audit['recognized'].lower() and 'mẽ' not in audit['recognized'].lower()
    repair_file = folder/take['file']
    assert sha(repair_file) == take['sha256']
    base, sr = sf.read(old, dtype='int16')
    sample, other_sr = sf.read(repair_file, dtype='int16')
    assert sr == other_sr == 24000
    phrase = meta['phraseRanges'][1]
    start, end = [round(phrase[k]*sr) for k in ['startSeconds','endSeconds']]
    bounds = take['phraseRanges'][0]
    left, right = [round(bounds[k]*sr) for k in ['startSeconds','endSeconds']]
    replacement = sample[left:right]
    assert len(replacement) <= end-start, 'Do not stretch speech or shift other sentences'
    output = base.copy()
    output[start:end] = 0
    output[start:start+len(replacement)] = replacement
    assert np.array_equal(output[:start],base[:start]) and np.array_equal(output[end:],base[end:])
    dest = ROOT/'public/time-and-gold/audio/narration-quoc-tuan-v2-mother-fix.wav'
    if dest.exists():
        raise RuntimeError('Repair exists; use a new version')
    sf.write(dest, output, sr, subtype='PCM_16')
    meta['speechRepair'] = {'reason':'User heard mẹ as mẽ; replace only this phrase',
        'previousSource':meta['activeSource'], 'previousSha256':meta['activeSha256'],
        'replacementSource':str(repair_file.relative_to(ROOT/'public')),
        'replacementSha256':take['sha256'], 'startSample':start, 'endSample':end,
        'replacementStartSample':left,'replacementEndSample':right,
        'ttsText':bounds['text'],'recognition':audit['recognized'],
        'targetWordAccentCheck':'mẹ present; mẽ absent; listening confirmation still pending',
        'unaffectedPcmPreserved':True,'allOtherCaptionAndSceneTimesPreserved':True}
    meta['copySpansReferTo'] = meta['activeSource']
    meta['activeSource'] = str(dest.relative_to(ROOT/'public'))
    meta['activeSha256'] = sha(dest)
    meta['allOriginalPcmSamplesPreserved'] = False
    meta['phraseRanges'][1]['endSeconds'] = (start+len(replacement))/sr
    pages = json.loads((backup/'captions.json').read_text())
    page = next(p for p in pages if p['text'] == phrase['text'])
    caption = json.loads((folder/take['captionsFile']).read_text())[0]
    page['startMs'] = round(start/sr*1000+max(0,caption['startMs']-bounds['startSeconds']*1000))
    page['endMs'] = round(min((start+len(replacement))/sr*1000,start/sr*1000+caption['endMs']-bounds['startSeconds']*1000))
    page['timestampMs'] = page['startMs']
    assert page['endMs'] > page['startMs']
    for path,data in [(ROOT/'scripts/projects/time-and-gold/voice.json',meta),(ROOT/'src/projects/time-and-gold/captions.json',pages)]:
        path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    def stamp(ms):
        return f'{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d},{ms%1000:03d}'
    (ROOT/'public/time-and-gold/captions.srt').write_text('\n\n'.join(f'{i+1}\n{stamp(p["startMs"])} --> {stamp(p["endMs"])}\n{p["text"]}' for i,p in enumerate(pages))+'\n')
    print(json.dumps(meta['speechRepair'],ensure_ascii=False,indent=2))


if __name__ == '__main__':
    main()
