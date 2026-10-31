"""Split the approved script into narration segments for cloning: one audition config + one lines file per segment.

Segments follow the channel naming (NN-đoạn): 02 mở chuyện, 03 cuốn sách, 04 sợi chỉ, 05–08 nhóm 3A–3D,
09 nhận xét chung. Item titles in bold ("Cơn giận.") are spoken as a short lead sentence; "[nghỉ]" becomes a
longer pause; {…} notes, > quotes and ### headings are not spoken. Long sentences stay whole (natural prosody);
paragraphs are split at sentence ends outside quotation marks.
Usage: .venv/bin/python scripts/projects/book-hvtt-001-overview/sections.py
"""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
SCRIPT = ROOT / 'docs/projects/book-hvtt-001-overview/script.md'
SEGMENTS = {'0b': '02-mo-chuyen', '1': '03-cuon-sach', '2': '04-soi-chi', '3A': '05-nhom-3a', '3B': '06-nhom-3b',
            '3C': '07-nhom-3c', '3D': '08-nhom-3d', '5': '09-nhan-xet'}


def sentences(paragraph):
    out, buf, depth = [], '', 0
    for ch in paragraph:
        before = buf.rstrip()
        buf += ch
        closing = (ch == '"' and depth == 1) or ch == '”'
        if ch in '"“': depth = 1 - depth if ch == '"' else 1
        elif ch == '”': depth = 0
        # End of sentence outside quotes, or a quote that closes right after its own full stop.
        if (ch in '.?!' and depth == 0) or (closing and before[-1:] in ('.', '?', '!')):
            out.append(buf.strip()); buf = ''
    if buf.strip(): out.append(buf.strip())
    # Keep a closing quote that followed the sentence end with its sentence.
    merged = []
    for s in out:
        if merged and re.fullmatch(r'["”)\s]+', s): merged[-1] += s
        else: merged.append(s)
    return [s for s in merged if re.search(r'\w', s)]


def blocks():
    text = SCRIPT.read_text().split('---', 1)[1]
    current, sub, found = None, None, {}
    for line in text.split('\n'):
        h2 = re.match(r'## (\w+)\.', line); h3 = re.match(r'### (3[A-D])\.', line)
        if h2: current = h2.group(1); sub = None; continue
        if h3: sub = h3.group(1); continue
        key = sub or current
        if key not in SEGMENTS or not line.strip() or line.startswith(('{', '>', '#')): continue
        found.setdefault(key, []).append(line.strip())
    return found


def main():
    for key, paragraphs in blocks().items():
        seg, items = SEGMENTS[key], []
        for p in paragraphs:
            lead = re.match(r'\*\*(.+?)\*\*\s*(.*)', p)
            if lead:
                items.append([lead.group(1).strip(), .45]); p = lead.group(2)
            parts = re.split(r'\s*\[nghỉ\]\s*', p)
            for n, part in enumerate(parts):
                ss = sentences(part)
                for k, s in enumerate(ss):
                    items.append([s, .4])
                if items and ss: items[-1][1] = .9 if n < len(parts) - 1 else .65
            if p.strip().endswith('[nghỉ]') and items: items[-1][1] = .9
        if items: items[-1][1] = 0
        # Keep the timing of sentences that already have an approved, assembled take.
        old = HERE / f'audition-{seg}.json'
        if old.exists():
            kept = {x['text']: x['pauseAfter'] for x in json.loads(old.read_text())['sentences'][:-1]}
            for item in items[:-1]:
                if item[0] in kept: item[1] = kept[item[0]]
        cfg = {'title': f'Đọc sách, hiểu mình — tập 1 — {seg}', 'temperature': .5, 'leadIn': .3, 'tail': .5, 'maxDurationSeconds': 400,
               'sentences': [{'scene': 1, 'text': t, 'pauseAfter': pause} for t, pause in items]}
        (HERE / f'audition-{seg}.json').write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + '\n')
        (HERE / f'lines-{seg}.txt').write_text('\n'.join(t for t, _ in items) + '\n')
        print(f'{seg}: {len(items)} câu')


if __name__ == '__main__':
    main()
