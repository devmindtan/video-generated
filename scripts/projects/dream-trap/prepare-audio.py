"""Publish an immutable local take with silence-only pacing; never render video."""
import hashlib
import json
from pathlib import Path
import shutil

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[3]


def write(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


def main():
    audition = ROOT/'public/voice-auditions/dream-trap-v1'
    manifest = json.loads((audition/'manifest.json').read_text())
    cfg = manifest['config']
    record = manifest['voices'][0]
    assert record['status'] == 'ready' and record['wordMatchRatio'] >= .95
    original = audition/record['file']
    assert hashlib.sha256(original.read_bytes()).hexdigest() == record['sha256']
    dest = ROOT/'public/dream-trap/audio'
    dest.mkdir(parents=True, exist_ok=True)
    output = dest/'narration-quoc-tuan-v2-pauses.wav'
    if output.exists():
        raise RuntimeError('Immutable take exists; use a new version rather than overwrite')
    shutil.copy2(original, dest/'narration-quoc-tuan-v1.wav')
    pcm, sr = sf.read(original, dtype='int16')
    assert sr == 24000 and pcm.ndim == 1
    phrases = record['phraseRanges']
    cuts = []
    for i, (a, b) in enumerate(zip(phrases, phrases[1:])):
        at = round((a['endSeconds'] + b['startSeconds']) / 2 * sr)
        assert np.max(np.abs(pcm[at-20:at+20])) == 0, 'Insert only into authored silence'
        chapter_end = cfg['sentences'][i]['scene'] != cfg['sentences'][i+1]['scene']
        extra = (.45 if i == 2 else .4) if chapter_end else .25
        cuts.append({'sourceSample': at, 'addedSamples': round(extra*sr)})
    chunks, spans, previous, cursor = [], [], 0, 0
    for cut in cuts:
        block = pcm[previous:cut['sourceSample']]
        chunks.append(block)
        spans.append({'sourceStart': previous, 'sourceEnd': cut['sourceSample'], 'outputStart': cursor, 'outputEnd': cursor+len(block)})
        cursor += len(block)
        chunks.append(np.zeros(cut['addedSamples'], dtype='int16'))
        cursor += cut['addedSamples']
        previous = cut['sourceSample']
    block = pcm[previous:]
    chunks.append(block)
    spans.append({'sourceStart': previous, 'sourceEnd': len(pcm), 'outputStart': cursor, 'outputEnd': cursor+len(block)})
    tail = 48*sr - sum(len(x) for x in chunks)
    assert 0 <= tail < sr
    chunks.append(np.zeros(tail, dtype='int16'))
    paced = np.concatenate(chunks)
    assert np.array_equal(pcm, np.concatenate([paced[s['outputStart']:s['outputEnd']] for s in spans]))
    sf.write(output, paced, sr, subtype='PCM_16')

    def mapped(t):
        return t + sum(c['addedSamples']/sr for c in cuts if c['sourceSample']/sr <= t)

    captions = json.loads((audition/record['captionsFile']).read_text())
    cursor = 0
    for page in captions:
        word_start = 0
        for p in phrases:
            word_end = word_start + len(p['text'].split())
            if word_start <= cursor < word_end:
                assert cursor + len(page['text'].split()) <= word_end
                page['startMs'] = round(mapped(max(page['startMs']/1000, p['startSeconds']))*1000)
                page['endMs'] = round(mapped(min(page['endMs']/1000, p['endSeconds']))*1000)
                page['timestampMs'] = page['startMs']
                assert page['startMs'] < page['endMs']
                break
            word_start = word_end
        cursor += len(page['text'].split())
    assert ' '.join(p['text'] for p in captions) == manifest['text']
    write(ROOT/'src/projects/dream-trap/captions.json', captions)
    adjusted = [{**p, 'scene': cfg['sentences'][i]['scene'], 'startSeconds': mapped(p['startSeconds']), 'endSeconds': mapped(p['endSeconds'])} for i, p in enumerate(phrases)]
    chapters = []
    for scene in range(1, 6):
        group = [p for p in adjusted if p['scene'] == scene]
        chapters.append({'scene': scene, 'startSeconds': group[0]['startSeconds'], 'endSeconds': group[-1]['endSeconds']})
    starts = [0] + [round((a['endSeconds']+b['startSeconds'])/2*30) for a,b in zip(chapters,chapters[1:])]
    lengths = [b-a+6 for a,b in zip(starts,starts[1:])] + [1440-starts[-1]]
    metadata = {'voice': 'Quốc Tuấn', 'selection': 'New episode editorial candidate from preferred playlist; pending listening review',
        'source': 'dream-trap/audio/narration-quoc-tuan-v1.wav', 'sourceSha256': record['sha256'],
        'activeSource': 'dream-trap/audio/narration-quoc-tuan-v2-pauses.wav',
        'activeSha256': hashlib.sha256(output.read_bytes()).hexdigest(),
        'qualityProfile': 'legacy24', 'sampleRateHz': sr, 'playbackRate': 1,
        'wordMatchRatio': record['wordMatchRatio'], 'sourceDurationSeconds': len(pcm)/sr,
        'durationSeconds': 48, 'addedSilenceSeconds': (len(paced)-len(pcm))/sr,
        'cuts': cuts, 'copySpans': spans, 'tailAddedSamples': tail, 'phraseRanges': adjusted,
        'chapters': chapters, 'sceneStartsFrames': starts, 'sceneLengthsFrames': lengths,
        'allOriginalPcmSamplesPreserved': True, 'paidApiCalls': 0,
        'listeningReview': 'Pending user review; ASR/PCM checks do not establish perceived quality'}
    write(ROOT/'scripts/projects/dream-trap/voice.json', metadata)
    def timestamp(ms):
        return f'{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d},{ms%1000:03d}'
    (ROOT/'public/dream-trap/captions.srt').write_text('\n\n'.join(f'{i+1}\n{timestamp(p["startMs"])} --> {timestamp(p["endMs"])}\n{p["text"]}' for i,p in enumerate(captions))+'\n')
    print(json.dumps({k:metadata[k] for k in ['durationSeconds','addedSilenceSeconds','sceneStartsFrames','sceneLengthsFrames','wordMatchRatio']}, indent=2))


if __name__ == '__main__':
    main()
