#!/usr/bin/env python3
"""Turn docs/projects/system-design-tong-quan/script.md into make-voice story files, one scene per script section.

Each script line is one spoken sentence. "[nghỉ]" marks a change of idea (longer pause). A line ending with
"→ [text]" carries its own spoken form. Otherwise English terms that the preset voice misreads get a phonetic
spoken form from SAY below; captions always keep the script's text.

Usage: build-story.py <out.json> [section-id ...]   (ids like 00, 01; default: all)
       --durations <voice-metadata.json>  sets each scene's duration from a previous run (speech end + tail).
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SCRIPT = ROOT / 'docs/projects/system-design-tong-quan/script.md'

# Spoken forms for terms Minh Đức misread in the 2026-11-11 probe (ASR check); written the way Vietnamese engineers
# usually say them. Order matters: longer keys first.
SAY = [
    ('idempotency key', 'ai đem pô tần xi ki'), ('Idempotency', 'Ai đem pô tần xi'), ('idempotency', 'ai đem pô tần xi'),
    ('Replication', 'Rép li kê sần'), ('replication', 'rép li kê sần'),
    ('Quorum', 'Quô rầm'), ('quorum', 'quô rầm'),
    ('sharding', 'sác đinh'), ('shard', 'sát'),
    ('cache-aside', 'cát ơ sai'),
    ('HTTPS', 'hát tê tê pê ét'), ('HttpOnly', 'hát tê tê pê ôn li'), ('HTTP', 'hát tê tê pê'),
    ('TCP', 'tê xê pê'), ('gRPC', 'gi a pi xi'), ('RPC', 'a pi xi'),
    ('POST', 'pốt'),
    ('MTBF', 'em ti bi ép'), ('MTTR', 'em ti ti a'),
    ('JWT', 'gi đáp bờ liu ti'), ('RBAC', 'a rờ bác'), ('ABAC', 'ây bác'), ('OAuth2', 'ô ót hai'),
    ('SameSite', 'sêm sai'), ('XSS', 'ích ét ét'), ('CSRF', 'xi ét a ép'),
    ('CPU', 'xi pi iu'), ('Metrics', 'Mét trích'), ('Logs', 'Lóc'),
]


def spoken(text):
    out = text
    for term, say in SAY:
        out = re.sub(rf'(?<![\w-]){re.escape(term)}(?![\w-])', say, out)
    return out[:1].upper() + out[1:] if text[:1].isupper() else out


def sections():
    found = []
    for block in re.split(r'\n## ', SCRIPT.read_text(encoding='utf8'))[1:]:
        head, _, body = block.partition('\n')
        sid = head.split(' ', 1)[0]
        sentences = []
        for raw in body.strip().splitlines():
            line = raw.strip()
            if not line:
                continue
            say = None
            if ' → [' in line:
                line, say = line.split(' → [', 1)
                say = say.rstrip(']')
            pause = 1.1 if '[nghỉ]' in line else .45
            text = line.replace('[nghỉ]', '').strip()
            if say:
                say = say.replace('[nghỉ]', '').strip()
            item = {'text': text, 'pauseAfter': pause}
            spoken_form = say or spoken(text)
            if spoken_form != text:
                item['say'] = spoken_form
            sentences.append(item)
        sentences[-1]['pauseAfter'] = 0
        found.append((sid, head, sentences))
    return found


def main():
    args = sys.argv[1:]
    durations = {}
    if '--durations' in args:
        i = args.index('--durations')
        meta = json.loads((ROOT / args[i + 1]).read_text())
        durations = {m['scene']: round(m['speechEndsAt'] + 1.2, 2) for m in meta}
        del args[i:i + 2]
    out, wanted = Path(args[0]), set(args[1:])
    story = []
    for sid, head, sentences in sections():
        if wanted and sid not in wanted:
            continue
        scene_id = f'{sid}-' + re.sub(r'[^a-z0-9]+', '-', head.split('·', 1)[-1].split('(')[0].strip().lower()
                                        .translate(str.maketrans('àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ',
                                                                 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd'))).strip('-')
        story.append({'id': scene_id, 'text': ' '.join(s['text'] for s in sentences), 'sentences': sentences,
                      'leadIn': .4, 'tail': 1.2, 'maxTail': 3 if scene_id in durations else 900,
                      'duration': durations.get(scene_id, 900), 'minWordMatchRatio': .75,
                      'start': round(sum(x['duration'] for x in story), 3)})
    out.write_text(json.dumps(story, ensure_ascii=False, indent=2) + '\n')
    print(f'{out}: {len(story)} scenes, {sum(len(s["sentences"]) for s in story)} sentences, '
          f'{sum(1 for s in story for x in s["sentences"] if "say" in x)} with spoken forms')


if __name__ == '__main__':
    main()
