"""Shorten editorially using retained native PCM; preserve the complete 60s edit."""
import hashlib
import json
from pathlib import Path
import re
import shutil

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[3]
SR, FPS, SECONDS = 24000, 30, 45
read = lambda p: json.loads(p.read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n')


def main():
    config_path = ROOT/'scripts/projects/cherish-today/audition.json'
    meta_path = ROOT/'scripts/projects/cherish-today/voice.json'
    captions_path = ROOT/'src/projects/cherish-today/captions.json'
    video_path = ROOT/'src/projects/cherish-today/Video.tsx'
    old_cfg, old_meta, old_pages = map(read, [config_path, meta_path, captions_path])
    assert old_meta['durationSeconds'] == 60
    backup = ROOT/'public/cherish-today/backups/edit-60s-v2'
    if backup.exists():
        raise RuntimeError('60-second backup exists; do not overwrite or rerun')
    backup.mkdir(parents=True)
    for p in [config_path, meta_path, captions_path, video_path,
              ROOT/'public/cherish-today/captions.srt',
              ROOT/'docs/projects/cherish-today/script.md',
              ROOT/'docs/projects/cherish-today/production-spec.md',
              ROOT/'docs/projects/cherish-today/qa.json']:
        shutil.copy2(p, backup/p.name)

    source_path = ROOT/'public'/old_meta['source']
    assert sha(source_path) == old_meta['sourceSha256']
    original, sr = sf.read(source_path, dtype='int16')
    assert sr == SR
    source_manifest = read(ROOT/'public/voice-auditions/cherish-today-assembled-v2/manifest.json')
    old_ranges = source_manifest['voices'][0]['phraseRanges']
    selected = [0, 3, 4, 6, 7, 8, 9, 10]
    sentences = [dict(old_cfg['sentences'][i]) for i in selected]
    for i, sentence in enumerate(sentences):
        sentence['pauseAfter'] = 0 if i == len(sentences)-1 else (.65 if sentence['scene'] != sentences[i+1]['scene'] else .35)
    cfg = {**old_cfg, 'sentences': sentences, 'edit': '45s editorial cut; retained native takes, no new synthesis'}

    # Existing caption pages were split at authored phrase boundaries.
    old_groups, cursor = [], 0
    for sentence in old_cfg['sentences']:
        group, count = [], 0
        while count < len(sentence['text'].split()):
            page = old_pages[cursor]
            group.append(page)
            count += len(page['text'].split())
            cursor += 1
        assert ' '.join(p['text'] for p in group) == sentence['text']
        old_groups.append(group)
    assert cursor == len(old_pages)

    chunks = [np.zeros(round(.3*SR), dtype='int16')]
    offset = len(chunks[0])
    ranges, copy_map = [], []
    for i, old_i in enumerate(selected):
        phrase = old_ranges[old_i]
        left, right = round(phrase['startSeconds']*SR), round(phrase['endSeconds']*SR)
        values = original[left:right]
        chunks.append(values)
        copy_map.append({'source': str(source_path.relative_to(ROOT/'public')), 'sha256': sha(source_path),
                         'sourceStart': left, 'sourceEnd': right, 'outputStart': offset,
                         'outputEnd': offset+len(values), 'role': f'retained-phrase-{old_i}'})
        ranges.append({'text': sentences[i]['text'], 'scene': sentences[i]['scene'],
                       'startSeconds': offset/SR, 'endSeconds': (offset+len(values))/SR})
        pause = np.zeros(round(sentences[i]['pauseAfter']*SR), dtype='int16')
        chunks.append(pause)
        offset += len(values)+len(pause)
    chunks.append(np.zeros(round(.8*SR), dtype='int16'))
    source_pcm = np.concatenate(chunks)
    assert len(source_pcm)/SR < 44, 'Shorten wording; never speed up voice to fit'
    source = ROOT/'public/cherish-today/audio/narration-quoc-tuan-v3-short-source.wav'
    active = source.with_name('narration-quoc-tuan-v3-45s.wav')
    assert not source.exists() and not active.exists()
    sf.write(source, source_pcm, SR, subtype='PCM_16')
    assembly_path = ROOT/'public/cherish-today/audio/assembly-v3-45s.json'
    write(assembly_path, {'copyMap': copy_map, 'retainedPhraseIndices': selected,
                         'allRetainedPcmSamplesPreserved': True, 'tempo': 1,
                         'priorEdit': str(backup.relative_to(ROOT))})

    # Add pauses only in silence between retained phrases, plus a short music tail.
    budget = SECONDS*SR-len(source_pcm)-round(.6*SR)
    weights = [1.3 if a['scene'] != b['scene'] else 1 for a,b in zip(ranges, ranges[1:])]
    cuts = [{'sourceSample': round((a['endSeconds']+b['startSeconds'])/2*SR),
             'addedSamples': round(budget*w/sum(weights))}
            for a,b,w in zip(ranges, ranges[1:], weights)]
    output, spans, previous, offset = [], [], 0, 0
    for cut in cuts:
        at = cut['sourceSample']
        assert np.all(source_pcm[at-20:at+20] == 0)
        block = source_pcm[previous:at]
        output.append(block)
        spans.append({'sourceStart': previous, 'sourceEnd': at, 'outputStart': offset, 'outputEnd': offset+len(block)})
        output.append(np.zeros(cut['addedSamples'], dtype='int16'))
        offset += len(block)+cut['addedSamples']
        previous = at
    block = source_pcm[previous:]
    output.append(block)
    spans.append({'sourceStart': previous, 'sourceEnd': len(source_pcm), 'outputStart': offset, 'outputEnd': offset+len(block)})
    tail = SECONDS*SR-sum(len(x) for x in output)
    assert tail >= 0
    output.append(np.zeros(tail, dtype='int16'))
    pcm = np.concatenate(output)
    assert np.array_equal(source_pcm, np.concatenate([pcm[s['outputStart']:s['outputEnd']] for s in spans]))
    sf.write(active, pcm, SR, subtype='PCM_16')
    mapped = lambda t: t+sum(c['addedSamples']/SR for c in cuts if c['sourceSample']/SR <= t)
    captions = []
    for new, old_i in zip(ranges, selected):
        old = old_meta['phraseRanges'][old_i]
        for page in old_groups[old_i]:
            start = new['startSeconds']+page['startMs']/1000-old['startSeconds']
            end = new['startSeconds']+page['endMs']/1000-old['startSeconds']
            start, end = max(start,new['startSeconds']), min(end,new['endSeconds'])
            start_ms, end_ms = round(mapped(start)*1000), round(mapped(end)*1000)
            assert start_ms < end_ms
            captions.append({**page, 'startMs': start_ms, 'endMs': end_ms, 'timestampMs': start_ms})
    assert ' '.join(p['text'] for p in captions) == ' '.join(s['text'] for s in sentences)
    adjusted = [{**p, 'startSeconds': mapped(p['startSeconds']), 'endSeconds': mapped(p['endSeconds'])} for p in ranges]
    chapters = []
    for scene in range(1,7):
        group = [p for p in adjusted if p['scene'] == scene]
        chapters.append({'scene': scene, 'startSeconds': group[0]['startSeconds'], 'endSeconds': group[-1]['endSeconds']})
    starts = [0]+[round((a['endSeconds']+b['startSeconds'])/2*FPS) for a,b in zip(chapters,chapters[1:])]
    lengths = [b-a+6 for a,b in zip(starts,starts[1:])]+[SECONDS*FPS-starts[-1]]
    meta = {**old_meta, 'source': str(source.relative_to(ROOT/'public')), 'sourceSha256': sha(source),
            'activeSource': str(active.relative_to(ROOT/'public')), 'activeSha256': sha(active),
            'durationSeconds': SECONDS, 'sourceDurationSeconds': len(source_pcm)/SR,
            'addedSilenceSeconds': (len(pcm)-len(source_pcm))/SR, 'cuts': cuts, 'copySpans': spans,
            'tailAddedSamples': tail, 'phraseRanges': adjusted, 'chapters': chapters,
            'sceneStartsFrames': starts, 'sceneLengthsFrames': lengths,
            'sourceAssembly': str(assembly_path.relative_to(ROOT/'public')),
            'wordMatchRatio': None, 'priorSourceWordMatchRatio': old_meta['wordMatchRatio'],
            'allRetainedPcmSamplesPreserved': True, 'asrReusedFromPriorSource': True,
            'recognitionNote': 'No new synthesis. Retained clauses preserve original PCM; removed hỏi han clause and its tone flag. Full-source transcript contains discarded phrases and must not be treated as a new transcription.'}
    write(config_path,cfg)
    write(meta_path,meta)
    write(captions_path,captions)
    stamp = lambda ms: f'{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d},{ms%1000:03d}'
    (ROOT/'public/cherish-today/captions.srt').write_text('\n\n'.join(f'{i+1}\n{stamp(p["startMs"])} --> {stamp(p["endMs"])}\n{p["text"]}' for i,p in enumerate(captions))+'\n')
    markup = video_path.read_text()
    for i,(start,length) in enumerate(zip(starts,lengths),1):
        pattern = rf'(<Sequence name="{i:02d}[^"\n]*" from=\{{)\d+(\}} durationInFrames=\{{)\d+(\}})'
        markup,n = re.subn(pattern,lambda m: f'{m[1]}{start}{m[2]}{length}{m[3]}',markup)
        assert n == 1
    markup = markup.replace(old_meta['activeSource'],meta['activeSource'])
    # Music source timing/volume stays user-editable and unchanged; shared fade
    # clamps to the new composition edge at 45s automatically.
    markup = markup.replace('name="Quốc Tuấn + caption · Native 1x" from={0} durationInFrames={60 * fps}',
                            'name="Quốc Tuấn + caption · Native 1x" from={0} durationInFrames={45 * fps}')
    video_path.write_text(markup)
    registry = ROOT/'src/projects/registry.tsx'
    registry.write_text(registry.read_text().replace('id="StoicCherishToday" component={CherishTodayVideo} durationInFrames={1800}',
                                                   'id="StoicCherishToday" component={CherishTodayVideo} durationInFrames={1350}'))
    title = '# Khi vẫn còn có nhau — bản 45 giây\n\nQuốc Tuấn native 1×; rút lời, không tăng tốc. Bản 60 giây được lưu ở `public/cherish-today/backups/edit-60s-v2/`.\n\n'
    sections=[]
    for scene in range(1,7):
        sections.append(f'## Cảnh {scene}\n\n'+' '.join(s['text'] for s in sentences if s['scene']==scene))
    (ROOT/'docs/projects/cherish-today/script.md').write_text(title+'\n\n'.join(sections)+'\n')
    print(json.dumps({'durationSeconds':SECONDS,'sourceDurationSeconds':len(source_pcm)/SR,'sceneStartsFrames':starts,
                      'sceneLengthsFrames':lengths,'captionPages':len(captions),'words':sum(len(s['text'].split()) for s in sentences)},indent=2))


if __name__ == '__main__':
    main()
