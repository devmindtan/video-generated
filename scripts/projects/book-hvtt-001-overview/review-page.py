"""Listening page for every body sentence whose chosen take is still flagged by check-tones.py.

Puts all clone versions of that sentence side by side (original, repair-a, repair-b…), marks the one build-body.py
currently uses and what the ASR heard. ASR is biased toward a Northern accent, so a flag means "listen", not
"wrong". The user's pick goes into voice-picks.json ({sentence text: take}), which build-body.py honors first.
Writes public/book-hvtt-001-overview/voice-auditions/review/index.html.
Usage: .venv/bin/python scripts/projects/book-hvtt-001-overview/review-page.py
"""
import html, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
AUD = ROOT / 'public/book-hvtt-001-overview/voice-auditions'
SEGMENTS = ['02-mo-chuyen', '03-cuon-sach', '04-soi-chi', '05-nhom-3a', '06-nhom-3b', '07-nhom-3c', '08-nhom-3d', '09-nhan-xet']
esc = html.escape


def main():
    versions = {}  # text → [(take, file, check row or None)]
    for m in sorted(AUD.glob('*/manifest.json'), key=lambda p: p.stat().st_mtime):
        take = m.parent.name
        check = m.parent / 'tone-check.json'
        rows = {r['text'].strip(): r for r in json.loads(check.read_text())} if check.exists() else {}
        for f in json.loads(m.read_text()).get('files', []):
            versions.setdefault(f['text'].strip(), []).append((take, f['file'], rows.get(f['text'].strip())))
    cards, n = [], 0
    for seg in SEGMENTS:
        stamp = ROOT / 'public/voice-auditions' / f'book-hvtt-{seg}-clone/sources.json'
        chosen = json.loads(stamp.read_text()) if stamp.exists() else {}
        if not isinstance(chosen, dict): continue
        for i, (text, take) in enumerate(chosen.items(), 1):
            row = next((r for t, _, r in versions.get(text, []) if t == take), None)
            if not row or not (row['toneDiffs'] or any(not got.strip().isdigit() for _, got in row['wordDiffs'])): continue
            n += 1
            opts = ''.join(
                f'<div class="v{" on" if t == take else ""}"><b>{esc(t)}{" · đang dùng" if t == take else ""}</b>'
                f'<audio controls preload="none" src="../{esc(t)}/{esc(f)}"></audio><small>ASR nghe: {esc(r["heard"]) if r else "—"}</small></div>'
                for t, f, r in versions[text])
            cards.append(f'<section><h2>{n}. {esc(seg)} · câu {i}</h2><p>{esc(text)}</p>{opts}</section>')
    page = f'''<!doctype html><meta charset="utf-8"><title>Nghe lại câu bị gắn cờ</title>
<style>body{{font:16px/1.5 system-ui,sans-serif;max-width:960px;margin:24px auto;padding:0 16px;background:#111;color:#eee}}
section{{border:1px solid #333;border-radius:8px;padding:12px 16px;margin:14px 0}}h2{{font-size:15px;color:#d9b56f;margin:0}}
p{{font-size:18px;margin:6px 0 10px}}.v{{display:grid;grid-template-columns:220px 1fr;gap:4px 12px;align-items:center;padding:6px 0;border-top:1px solid #222}}
.v small{{grid-column:2;color:#999}}.on b{{color:#d9b56f}}audio{{width:100%}}</style>
<h1>Nghe lại {n} câu bị gắn cờ</h1>
<p>Mỗi câu có các bản clone khác nhau. Nhận dạng giọng nói thiên giọng Bắc, nên "ASR nghe" chỉ là gợi ý chỗ cần nghe, không phải kết luận. Bản <b style="color:#d9b56f">đang dùng</b> là bản đang được ghép vào video. Muốn đổi: nói số câu và tên bản (ví dụ "5: repair-b"), hoặc "câu 5 bản nào cũng sai".</p>
{"".join(cards)}'''
    out = AUD / 'review'
    out.mkdir(exist_ok=True)
    (out / 'index.html').write_text(page)
    print(f'{n} câu → {(out / "index.html").relative_to(ROOT)}')


if __name__ == '__main__':
    main()
