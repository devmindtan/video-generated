#!/usr/bin/env python3
"""Timeline for SystemDesignTongQuan: src/projects/system-design-tong-quan/timing.json and captions.json.

Reads the word-aligned caption pages make-voice wrote per segment (voice-captions.json, times relative to each
segment's audio) and the story's sentences. timing.json: title card length and, per segment, its audio, timeline
start, length (or review cut) and sentence start times (a sentence starts where its first word does, interpolated
inside its page). captions.json: the same pages on the video's timeline, in the shape the visual-sync sheet reads.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT / 'src/projects/system-design-tong-quan'
TITLE_SECONDS = 6.5
# Review build (first-30-seconds gate, user rule 2026-10-30): section 1 stops after its list of pitfalls.
CUTS = {'01-vong-phong-van-nay-cham-dieu-gi': 37.4}
END_PAD = 1.2

story = json.loads((ROOT / 'scripts/projects/system-design-tong-quan/story.json').read_text())
pages = json.loads((SRC / 'voice-captions.json').read_text())
meta = {m['scene']: m for m in json.loads((ROOT / 'public/system-design-tong-quan/audio/voice-metadata.json').read_text())}
segments, timeline, cursor = {}, [], TITLE_SECONDS
for scene, group in zip(story, pages):
    words = []
    for page in group:
        n = len(page['text'].split())
        words += [page['startMs'] + (page['endMs'] - page['startMs']) * i / n for i in range(n)]
    starts, index = [], 0
    for sentence in scene['sentences']:
        starts.append(round(words[index] / 1000, 3))
        index += len(sentence['text'].split())
    assert index == len(words), (scene['id'], index, len(words))
    m = meta[scene['id']]
    length = CUTS.get(scene['id'], m['sceneDuration'])
    segments[scene['id']] = {'file': m['file'], 'start': round(cursor, 3), 'length': length, 'duration': m['sceneDuration'],
                             'speechEndsAt': m['speechEndsAt'], 'sentences': starts, **({'cut': True} if scene['id'] in CUTS else {})}
    for page in group:
        if page['startMs'] < length * 1000:
            timeline.append({'part': scene['id'], 'text': page['text'], 'startMs': round(cursor * 1000 + page['startMs']),
                             'endMs': round(cursor * 1000 + min(page['endMs'], length * 1000))})
    cursor += length
(SRC / 'timing.json').write_text(json.dumps({'titleSeconds': TITLE_SECONDS, 'endPadSeconds': END_PAD, 'segments': segments},
                                            ensure_ascii=False, indent=2) + '\n')
(SRC / 'captions.json').write_text(json.dumps({'source': 'SystemDesignTongQuan defaultProps; scripts/projects/system-design-tong-quan/sentence-times.py',
                                               'pages': timeline}, ensure_ascii=False, indent=1) + '\n')
print(f'{len(segments)} segments, {len(timeline)} caption pages, video {cursor + END_PAD:.1f}s')
