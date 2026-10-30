"""Replace only the approved ending at native 1x; preserve earlier PCM/timing."""
import hashlib
import json
from pathlib import Path
import re

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[3]
SR, FPS, SECONDS = 24000, 30, 45
read = lambda p: json.loads(p.read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n')


def main():
    backup = ROOT/'public/apology-change/backups/ending-v2'
    cfg = read(backup/'audition.json')
    old = read(backup/'voice.json')
    old_pages = read(backup/'captions.json')
    prior_path = ROOT/'public'/old['activeSource']
    prior, sr = sf.read(prior_path, dtype='int16')
    assert sr == SR and sha(prior_path) == old['activeSha256']
    audition = ROOT/'public/voice-auditions/apology-change-ending-v1'
    manifest = read(audition/'manifest.json')
    record = manifest['voices'][0]
    assert record['status'] == 'ready' and record['wordMatchRatio'] >= .95
    ending_path = audition/record['file']
    ending, sr = sf.read(ending_path, dtype='int16')
    assert sr == SR and sha(ending_path) == record['sha256']
    clauses = manifest['config']['sentences']
    retained = old['phraseRanges'][:7]
    join = round(old['phraseRanges'][7]['startSeconds']*SR)
    assert np.all(prior[round(retained[-1]['endSeconds']*SR):join] == 0)
    output = [prior[:join]]
    ranges = [dict(p) for p in retained]
    mapping = [{'source': old['activeSource'], 'sha256':sha(prior_path), 'sourceStart':0,
                'sourceEnd':join, 'outputStart':0, 'outputEnd':join, 'role':'unchanged-prefix'}]
    offset = join
    # Keep native voice samples, add a little breathing space between new ideas.
    pauses = [.55, .7, 0]
    new_ranges = []
    for i, (sentence, phrase) in enumerate(zip(clauses, record['phraseRanges'])):
        left, right = round(phrase['startSeconds']*SR), round(phrase['endSeconds']*SR)
        values = ending[left:right]
        output.append(values)
        mapping.append({'source':str(ending_path.relative_to(ROOT/'public')), 'sha256':sha(ending_path),
                        'sourceStart':left, 'sourceEnd':right, 'outputStart':offset,
                        'outputEnd':offset+len(values), 'role':f'ending-phrase-{i}'})
        new_ranges.append({'text':sentence['text'], 'scene':sentence['scene'],
                           'startSeconds':offset/SR, 'endSeconds':(offset+len(values))/SR})
        pause = np.zeros(round(pauses[i]*SR), dtype='int16')
        output.append(pause)
        offset += len(values)+len(pause)
    ranges.extend(new_ranges)
    output.append(np.zeros(round(.65*SR), dtype='int16'))
    source_pcm = np.concatenate(output)
    assert len(source_pcm) <= SECONDS*SR, 'Do not speed speech or extend the composition'
    active_pcm = np.pad(source_pcm, (0,SECONDS*SR-len(source_pcm)))
    assert np.array_equal(active_pcm[:join], prior[:join])
    source = ROOT/'public/apology-change/audio/narration-quoc-tuan-v3-ending-source.wav'
    active = source.with_name('narration-quoc-tuan-v3-ending.wav')
    assembly = source.with_name('assembly-ending-v1.json')
    assert not any(p.exists() for p in [source, active, assembly]), 'Keep immutable takes'
    sf.write(source, source_pcm, SR, subtype='PCM_16')
    sf.write(active, active_pcm, SR, subtype='PCM_16')
    write(assembly, {'copyMap':mapping,'tempo':1,'unchangedPrefixSamples':join,
                     'previousActive':old['activeSource'],'extraEndingPausesSeconds':pauses})
    prefix_pages = [p for p in old_pages if p['endMs'] <= round(retained[-1]['endSeconds']*1000)]
    assert ' '.join(p['text'] for p in prefix_pages) == ' '.join(s['text'] for s in cfg['sentences'][:7])
    ending_pages = read(audition/record['captionsFile'])
    pages, cursor = list(prefix_pages), 0
    for i, (sentence, phrase, target) in enumerate(zip(clauses,record['phraseRanges'],new_ranges)):
        group, word_count = [], 0
        while word_count < len(sentence['text'].split()):
            page = ending_pages[cursor]
            group.append(page)
            word_count += len(page['text'].split())
            cursor += 1
        assert ' '.join(p['text'] for p in group) == sentence['text']
        for p in group:
            at = max(target['startSeconds'], target['startSeconds']+p['startMs']/1000-phrase['startSeconds'])
            until = min(target['endSeconds'], target['startSeconds']+p['endMs']/1000-phrase['startSeconds'])
            start_ms, end_ms = round(at*1000), round(until*1000)
            assert start_ms < end_ms
            pages.append({**p,'startMs':start_ms,'endMs':end_ms,'timestampMs':start_ms})
    assert cursor == len(ending_pages)
    new_cfg = {**cfg,'sentences':cfg['sentences'][:7]+[{**s,'pauseAfter':pauses[i]} for i,s in enumerate(clauses)]}
    assert ' '.join(p['text'] for p in pages) == ' '.join(s['text'] for s in new_cfg['sentences'])
    chapters = []
    for scene in range(1,7):
        group = [p for p in ranges if p['scene'] == scene]
        chapters.append({'scene':scene,'startSeconds':group[0]['startSeconds'],'endSeconds':group[-1]['endSeconds']})
    starts = old['sceneStartsFrames'][:5]+[round((chapters[4]['endSeconds']+chapters[5]['startSeconds'])/2*FPS)]
    lengths = [b-a+6 for a,b in zip(starts,starts[1:])]+[SECONDS*FPS-starts[-1]]
    meta = {**old,'source':str(source.relative_to(ROOT/'public')),'sourceSha256':sha(source),
            'activeSource':str(active.relative_to(ROOT/'public')),'activeSha256':sha(active),
            'sourceDurationSeconds':len(source_pcm)/SR,'addedSilenceSeconds':(len(active_pcm)-len(source_pcm))/SR,
            'cuts':[], 'copySpans':[{'sourceStart':0,'sourceEnd':len(source_pcm),'outputStart':0,'outputEnd':len(source_pcm)}],
            'tailAddedSamples':len(active_pcm)-len(source_pcm),'phraseRanges':ranges,'chapters':chapters,
            'sceneStartsFrames':starts,'sceneLengthsFrames':lengths,
            'sourceAssembly':str(assembly.relative_to(ROOT/'public')),
            'wordMatchRatio':None,'endingWordMatchRatio':record['wordMatchRatio'],
            'rawRecognitionFile':str((audition/'recognition/25-quoc-tuan-recognition.json').relative_to(ROOT/'public')),
            'recognitionNote':'Raw ending transcript reviewed with tones; prefix PCM/captions/timing preserved from prior take. Ending ASR is not a full new transcript or listening approval.',
            'endingEdit':{'backup':str(backup.relative_to(ROOT)),'unchangedPrefixSamples':join,
                          'unchangedPrefixSeconds':join/SR,'prefixCaptionPages':len(prefix_pages)}}
    meta.pop('allOriginalPcmSamplesPreserved', None)
    meta['allSourcePcmSamplesPreserved'] = True
    meta['allUnchangedPrefixPcmPreserved'] = True
    write(ROOT/'scripts/projects/apology-change/audition.json',new_cfg)
    write(ROOT/'scripts/projects/apology-change/voice.json',meta)
    write(ROOT/'src/projects/apology-change/captions.json',pages)
    stamp = lambda ms: f'{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d},{ms%1000:03d}'
    (ROOT/'public/apology-change/captions.srt').write_text('\n\n'.join(f'{i+1}\n{stamp(p["startMs"])} --> {stamp(p["endMs"])}\n{p["text"]}' for i,p in enumerate(pages))+'\n')
    video = ROOT/'src/projects/apology-change/Video.tsx'
    markup = video.read_text().replace(old['activeSource'],meta['activeSource'])
    for i in [4,5]:
        pattern = rf'(<Sequence name="{i+1:02d}[^"\n]*" from=\{{)\d+(\}} durationInFrames=\{{)\d+(\}})'
        markup,n = re.subn(pattern,lambda m:f'{m[1]}{starts[i]}{m[2]}{lengths[i]}{m[3]}',markup)
        assert n == 1
    markup = markup.replace('label="MUỐN GIỮ MỘT NGƯỜI">Đừng chỉ hối hận.<br /><span style={{color: GOLD}}>Hãy thay đổi.</span>',
                            'label="NIỀM TIN SAU LỜI XIN LỖI">Đừng để họ<br /><span style={{color: GOLD}}>hối hận vì đã tin.</span>')
    markup = markup.replace('|chịu lại)/gi','|chịu lại|đủ nhiều|ở bên|chuyện cũ|lặp lại)/gi')
    video.write_text(markup)
    sections=['# Xin lỗi và thay đổi — phần kết đã sửa','45 giây, Quốc Tuấn native 1×. Bản trước được giữ tại `public/apology-change/backups/ending-v2/`.']
    for scene in range(1,7):
        sections.append(f'## Cảnh {scene}\n\n'+' '.join(s['text'] for s in new_cfg['sentences'] if s['scene']==scene))
    (ROOT/'docs/projects/apology-change/script.md').write_text('\n\n'.join(sections)+'\n')
    for name, expected in read(backup/'unchanged-assets.json').items():
        assert sha(ROOT/name) == expected, 'Preserve music and thumbnail edits'
    print(json.dumps({'durationSeconds':45,'unchangedPrefixSeconds':join/SR,'newEndingEndsSeconds':new_ranges[-1]['endSeconds'],
                      'sceneStartsFrames':starts,'sceneLengthsFrames':lengths,'captionPages':len(pages)},indent=2))


if __name__ == '__main__':
    main()
