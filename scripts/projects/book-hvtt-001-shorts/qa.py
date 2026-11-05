"""Technical QA of the three shorts of episode 1 → docs/projects/book-hvtt-001-shorts/qa.json.

First writes the captions (same pages and timeline as ShortFrame.tsx) to src/projects/book-hvtt-001-shorts/captions.json
and one SRT per short (docs/projects/book-hvtt-001-shorts/captions-<n>.srt, for upload). Then checks:
  files        what the final review binds: Video.tsx, Thumbnail.tsx, captions.json, description.md, music, and the
               workflow documents (sources.md, script-review.md, voice-audition.md)
  duration     every short is 30–60 seconds
  captionText  each short's words are the script's (opening question, excerpt, invitation), in order
  captionTime  pages in order, no overlap, at least 0.6 s on screen, at most two lines (≤ 46 characters)
  voice        no clipping; opening, excerpt and invitation within 3 dB of each other
  music        the bed sits ≥ 15 dB under the narration while speaking
  build        typecheck and projects:check pass
A technical pass is not a listening approval.
Another episode's shorts: --project <slug> (gaps from src/projects/<slug>/layout.json, the same file ShortFrame's kit
reads there; compositions from the project's registrations in series.json).
Usage: .venv/bin/python scripts/projects/book-hvtt-001-shorts/qa.py [--project book-ah-001-shorts]
"""
import datetime, json, re, subprocess, sys, unicodedata
from pathlib import Path
import numpy as np
import soundfile as sf
import librosa

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'scripts/shared'))
from export_loudness import export_loudness  # noqa: E402
SLUG = sys.argv[sys.argv.index('--project') + 1] if '--project' in sys.argv else 'book-hvtt-001-shorts'
SRC, DOCS, HERE = ROOT / 'src/projects' / SLUG, ROOT / 'docs/projects' / SLUG, ROOT / 'scripts/projects' / SLUG
LAYOUT = json.loads((SRC / 'layout.json').read_text()) if (SRC / 'layout.json').exists() else {}
LEAD, GAP1, GAP2, TAIL, FPS = LAYOUT.get('lead', .3), LAYOUT.get('gap1', .35), LAYOUT.get('gap2', .5), LAYOUT.get('tail', 1.4), 30
TITLES = {}
IDS = {}
F = lambda s: round(s * FPS)
words_of = lambda t: re.findall(r'\w+', unicodedata.normalize('NFC', t.lower()))


def timeline(s):
    hook = F(LEAD)
    excerpt = hook + F(s['hook']['durationSeconds'] + GAP1)
    cta = excerpt + F(s['excerpt']['toSeconds'] - s['excerpt']['fromSeconds'] + GAP2)
    return {'hook': hook, 'excerpt': excerpt, 'cta': cta, 'total': cta + F(s['cta']['durationSeconds'] + TAIL)}


def pages_of(words, limit=46):
    """Same as ShortFrame.tsx pagesOf: each sentence split evenly into pages of at most two lines."""
    sentences, cur, pages = [], [], []
    for w in words:
        cur.append(w)
        if re.search(r'[.?!…]["”]?$', w['text']): sentences.append(cur); cur = []
    if cur: sentences.append(cur)
    for ws in sentences:
        ends, at = [], -1
        for w in ws: at += len(w['text']) + 1; ends.append(at)
        total, n = ends[-1], -(-ends[-1] // limit)
        while True:
            cuts = [min(range(len(ends)), key=lambda i: (abs(ends[i] - total * (k + 1) / n), i)) for k in range(n - 1)]
            bounds = sorted({-1, *cuts}) + [len(ws) - 1]
            split = [p for p in (ws[bounds[i] + 1:bounds[i + 1] + 1] for i in range(len(bounds) - 1)) if p]
            if all(len(' '.join(w['text'] for w in p)) <= limit + 4 for p in split) or n >= len(ws):
                pages += split; break
            n += 1
    return pages


def captions(s):
    tl = timeline(s)
    shift = lambda ws, frame: [{**w, 'startMs': w['startMs'] + frame * 1000 / FPS, 'endMs': w['endMs'] + frame * 1000 / FPS} for w in ws]
    out = []
    for part, ws in [('Câu mở', shift(s['hook']['words'], tl['hook'])), ('Đoạn trích tập 1', shift(s['excerpt']['words'], tl['excerpt'])), ('Lời mời', shift(s['cta']['words'], tl['cta']))]:
        pages = pages_of(ws)
        for i, p in enumerate(pages):
            end = pages[i + 1][0]['startMs'] if i + 1 < len(pages) else p[-1]['endMs'] + 300
            out.append({'part': part, 'text': ' '.join(w['text'] for w in p), 'startMs': round(p[0]['startMs']), 'endMs': round(min(end, p[-1]['endMs'] + 600))})
    return out, tl


def srt(pages):
    t = lambda ms: f'{int(ms // 3600000):02d}:{int(ms // 60000 % 60):02d}:{int(ms // 1000 % 60):02d},{int(ms % 1000):03d}'
    return '\n'.join(f'{i + 1}\n{t(p["startMs"])} --> {t(p["endMs"])}\n{p["text"]}\n' for i, p in enumerate(pages))


def rms_db(data):
    return 20 * np.log10(max(np.sqrt(np.mean(np.square(data))), 1e-9))


def speech_db(path, a=None, b=None):
    data, sr = sf.read(ROOT / 'public' / path, always_2d=True)
    data = data.mean(axis=1)
    if a is not None: data = data[int(a * sr):int(b * sr)]
    frames = librosa.util.frame(data, frame_length=sr // 10, hop_length=sr // 10)
    level = 20 * np.log10(np.maximum(np.sqrt(np.mean(frames ** 2, axis=0)), 1e-9))
    return float(np.mean(level[level > level.max() - 30])), float(np.max(np.abs(data)))


def main():
    data = json.loads((SRC / 'shorts.json').read_text())
    music = json.loads((SRC / 'music.json').read_text())
    script = (DOCS / 'script.md').read_text()
    series = json.loads((ROOT / 'series/tam-ly-cuoc-song/book-insights/series.json').read_text())
    global TITLES
    TITLES = {r['id']: r.get('title', r['id']) for p in series['projects'] if p['id'] == SLUG for r in p['registrations']}
    comps = [r['id'] for p in series['projects'] if p['id'] == SLUG for r in p['registrations'] if r['kind'] == 'Composition']
    IDS.update({s['id']: comps[k] for k, s in enumerate(data['shorts'])})
    checks, shorts_out, all_caps = [], [], {}
    for k, s in enumerate(data['shorts']):
        caps, tl = captions(s)
        all_caps[s['id']] = {'title': TITLES.get(IDS[s['id']], IDS[s['id']]), 'composition': IDS[s['id']], 'durationSeconds': round(tl['total'] / FPS, 2), 'pages': caps}
        (DOCS / f'captions-{k + 1}.srt').write_text(srt(caps))
        shorts_out.append({'id': s['id'], 'composition': IDS[s['id']], 'seconds': round(tl['total'] / FPS, 2), 'pages': len(caps)})
    (SRC / 'captions.json').write_text(json.dumps({'shorts': all_caps}, ensure_ascii=False, indent=1) + '\n')

    need = [f'src/projects/{SLUG}/Video.tsx', f'src/projects/{SLUG}/Thumbnail.tsx', f'src/projects/{SLUG}/captions.json',
            f'src/projects/{SLUG}/music.json', f'docs/projects/{SLUG}/description.md', f'docs/projects/{SLUG}/sources.md',
            f'docs/projects/{SLUG}/script-review.md', f'docs/projects/{SLUG}/voice-audition.md', 'public/' + music['file']]
    missing = [f for f in need if not (ROOT / f).exists()]
    checks.append({'id': 'files', 'title': 'Đủ file cho bước Xem bản dựng', 'ok': not missing, 'detail': 'đủ' if not missing else 'thiếu: ' + ', '.join(missing)})

    bad = [f"{x['composition']} {x['seconds']} giây" for x in shorts_out if not 30 <= x['seconds'] <= 60]
    checks.append({'id': 'duration', 'title': 'Mỗi short dài 30–60 giây', 'ok': not bad, 'detail': ', '.join(f"{x['seconds']} giây" for x in shorts_out) if not bad else 'ngoài khoảng: ' + ', '.join(bad)})

    # Script words of each short: its opening question, its excerpt paragraph and the invitation.
    blocks = re.split(r'^## Short \d', script, flags=re.M)
    cta = re.search(r'## Lời mời[^\n]*\n\n(.+)', script).group(1)
    wrong = []
    for k, s in enumerate(data['shorts']):
        block = blocks[k + 1]
        hook = re.search(r'\*\*Câu mở[^*]*\*\*\s*(.+)', block).group(1)
        excerpt = block.split('giây):', 1)[1].split('**Lời mời.**')[0]
        expected = words_of(hook) + words_of(excerpt) + words_of(cta)
        got = words_of(' '.join(p['text'] for p in all_caps[s['id']]['pages']))
        if expected != got: wrong.append(f"{IDS[s['id']]}: {len(got)}/{len(expected)} chữ")
    checks.append({'id': 'captionText', 'title': 'Chữ phụ đề khớp kịch bản đã chốt', 'ok': not wrong, 'detail': f"khớp cả {len(data['shorts'])} short" if not wrong else '; '.join(wrong)})

    issues = []
    for sid, c in all_caps.items():
        last = 0
        for p in c['pages']:
            if p['startMs'] < last - 1: issues.append(f'{sid} chồng ở "{p["text"][:20]}"')
            if p['endMs'] - p['startMs'] < 600: issues.append(f'{sid} quá ngắn ở "{p["text"][:20]}"')
            if len(p['text']) > 50 and len(p['text'].split()) > 1: issues.append(f'{sid} quá 2 dòng ở "{p["text"][:20]}"')
            last = p['endMs']
    checks.append({'id': 'captionTime', 'title': 'Phụ đề đúng thứ tự, không chồng, đủ lâu, tối đa 2 dòng', 'ok': not issues, 'detail': f"{sum(len(c['pages']) for c in all_caps.values())} trang" if not issues else '; '.join(issues[:6])})

    levels, voice_issues, music_issues = [], [], []
    bed, _ = speech_db(music['file'], 30, 90)
    for s in data['shorts']:
        hook, p1 = speech_db(s['hook']['file'])
        ex, p2 = speech_db(s['excerpt']['file'], s['excerpt']['fromSeconds'], s['excerpt']['toSeconds'])
        cta_db, p3 = speech_db(s['cta']['file'])
        if max(p1, p2, p3) >= .999: voice_issues.append(f"{IDS[s['id']]} chạm đỉnh")
        spread = max(hook, ex, cta_db) - min(hook, ex, cta_db)
        if spread > 3: voice_issues.append(f"{IDS[s['id']]} lệch {spread:.1f} dB")
        under = min(hook, ex, cta_db) - (bed + 20 * np.log10(music['speechVolume']))
        if under < 15: music_issues.append(f"{IDS[s['id']]} nhạc chỉ thấp hơn giọng {under:.1f} dB")
        levels.append(f"{IDS[s['id']]}: mở {hook:.1f}, trích {ex:.1f}, mời {cta_db:.1f} dBFS")
    checks.append({'id': 'voice', 'title': 'Giọng không chạm đỉnh, ba phần đều nhau (≤ 3 dB)', 'ok': not voice_issues, 'detail': '; '.join(voice_issues or levels)})
    checks.append({'id': 'music', 'title': 'Nhạc nằm dưới giọng ≥ 15 dB khi có lời', 'ok': not music_issues, 'detail': '; '.join(music_issues) or f"nhạc nền {bed + 20 * np.log10(music['speechVolume']):.1f} dBFS khi có lời"})

    build = [subprocess.run(['npm', 'run', '--silent', c], cwd=ROOT, capture_output=True, text=True) for c in ['typecheck', 'projects:check']]
    checks.append({'id': 'build', 'title': 'Typecheck và projects:check', 'ok': all(b.returncode == 0 for b in build), 'detail': 'đạt' if all(b.returncode == 0 for b in build) else (build[0].stdout + build[0].stderr + build[1].stderr)[-400:]})

    ok, detail, _ = export_loudness(SLUG)
    checks.append({'id': 'loudness', 'title': 'Âm lượng bản đăng -14 LUFS, đỉnh ≤ -1 dBTP', 'ok': ok, 'detail': detail})

    report = {'project': SLUG, 'checkedAt': datetime.datetime.now().astimezone().isoformat(timespec='seconds'), 'shorts': shorts_out,
              'technicalPass': all(c['ok'] for c in checks), 'checks': checks,
              'listenNotes': LAYOUT.get('listenNotes', ['Câu mở short 2: nhận dạng nghe "Cũng một chuyện" thay vì "Cùng một chuyện"; người dùng nghe trong bản vá p2/p3, không báo sai.'] if SLUG == 'book-hvtt-001-shorts' else []),
              'note': 'Đạt kỹ thuật không thay cho nghe duyệt; không render tự động.'}
    (DOCS / 'qa.json').write_text(json.dumps(report, ensure_ascii=False, indent=1) + '\n')
    for c in checks: print('✓' if c['ok'] else '✗', c['title'], '·', c['detail'])
    print('technicalPass', report['technicalPass'])


if __name__ == '__main__':
    main()
