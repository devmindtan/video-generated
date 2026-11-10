"""Technical QA of the four episode 3 shorts → docs/projects/book-dnt-001-shorts/qa.json.

The narration is written for these shorts (narration.json, one voice file per short), so this replaces the episode 1–2
shorts QA (opening + excerpt + invitation). Writes one SRT per short (docs/projects/book-dnt-001-shorts/captions-<n>.srt,
for upload; same page split as the on-screen captions) and checks:
  files        Video.tsx, Thumbnail.tsx, captions.json, music, description.md and the workflow documents
  duration     every short is 30–60 seconds
  captionText  each short's caption words are its narration.json sentences plus the invitation, in order
  captionTime  pages in order, no overlap, at least 0.6 s on screen, at most two lines
  voice        no clipping; every sentence within 3 dB of the short's median
  music        the bed sits ≥ 15 dB under the narration
  build        typecheck and projects:check pass
  loudness     the exported shorts (once rendered) are at YouTube loudness
A technical pass is not a listening approval.
Usage: .venv/bin/python scripts/projects/book-dnt-001-shorts/qa.py
"""
import datetime, importlib.util, json, re, subprocess, sys, unicodedata
from pathlib import Path
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[3]
SLUG = 'book-dnt-001-shorts'
SRC, DOCS, HERE = ROOT / 'src/projects' / SLUG, ROOT / 'docs/projects' / SLUG, ROOT / 'scripts/projects' / SLUG
sys.path.insert(0, str(ROOT / 'scripts/shared'))
from export_loudness import export_loudness  # noqa: E402

spec = importlib.util.spec_from_file_location('shorts_qa', ROOT / 'scripts/projects/book-hvtt-001-shorts/qa.py')
shared = importlib.util.module_from_spec(spec);spec.loader.exec_module(shared)  # pages_of / srt, same as the on-screen split
LAYOUT = json.loads((SRC / 'layout.json').read_text())
words_of = lambda t: re.findall(r'\w+', unicodedata.normalize('NFC', t.lower()))


def level_db(x):
    frames = x[:len(x) // 4800 * 4800].reshape(-1, 4800) if len(x) >= 4800 else x.reshape(1, -1)
    lv = 20 * np.log10(np.maximum(np.sqrt(np.mean(frames ** 2, axis=1)), 1e-9))
    return float(np.mean(lv[lv > lv.max() - 30]))


def main():
    data = json.loads((SRC / 'shorts.json').read_text())
    nar = json.loads((HERE / 'narration.json').read_text())
    music = json.loads((SRC / 'music.json').read_text())
    series = json.loads((ROOT / 'series/tam-ly-cuoc-song/book-insights/series.json').read_text())
    regs = [r for p in series['projects'] if p['id'] == SLUG for r in p['registrations'] if r['kind'] == 'Composition']
    ids = {s['id']: regs[k]['id'] for k, s in enumerate(data['shorts'])}
    lead = LAYOUT['lead'] * 1000
    checks, out = [], []
    caps_all = {}
    for k, s in enumerate(data['shorts']):
        words = [{**w, 'startMs': w['startMs'] + lead, 'endMs': w['endMs'] + lead} for w in s['words']]
        pages = shared.pages_of(words)
        caps = []
        for i, p in enumerate(pages):
            end = pages[i + 1][0]['startMs'] if i + 1 < len(pages) else p[-1]['endMs'] + 300
            caps.append({'text': ' '.join(w['text'] for w in p), 'startMs': round(p[0]['startMs']), 'endMs': round(min(end, p[-1]['endMs'] + 600))})
        (DOCS / f'captions-{k + 1}.srt').write_text(shared.srt(caps))
        caps_all[s['id']] = caps
        out.append({'id': s['id'], 'composition': ids[s['id']], 'seconds': round(LAYOUT['lead'] + s['durationSeconds'] + LAYOUT['tail'], 2), 'pages': len(caps),
                    'wordTimes': 'đo bằng nhận dạng' if not data.get('estimatedWords') else 'ước lượng'})

    need = [f'src/projects/{SLUG}/Video.tsx', f'src/projects/{SLUG}/Thumbnail.tsx', f'src/projects/{SLUG}/captions.json', f'src/projects/{SLUG}/music.json',
            f'docs/projects/{SLUG}/description.md', f'docs/projects/{SLUG}/sources.md', f'docs/projects/{SLUG}/script-review.md',
            f'docs/projects/{SLUG}/voice-audition.md', f'docs/projects/{SLUG}/production-spec.md', f'docs/projects/{SLUG}/image-prompts.md', 'public/' + music['file']]
    missing = [f for f in need if not (ROOT / f).exists()]
    checks.append({'id': 'files', 'title': 'Đủ file cho bước Xem bản dựng', 'ok': not missing, 'detail': 'đủ' if not missing else 'thiếu: ' + ', '.join(missing)})

    bad = [f"{x['composition']} {x['seconds']} giây" for x in out if not 30 <= x['seconds'] <= 60]
    checks.append({'id': 'duration', 'title': 'Mỗi short dài 30–60 giây', 'ok': not bad, 'detail': ', '.join(f"{x['seconds']} giây" for x in out) if not bad else 'ngoài khoảng: ' + ', '.join(bad)})

    wrong = []
    for sh in nar['shorts']:
        expected = words_of(' '.join(x['text'] for x in sh['sentences']) + ' ' + nar['cta']['text'])
        got = words_of(' '.join(p['text'] for p in caps_all[sh['id']]))
        if expected != got: wrong.append(f"{ids[sh['id']]}: {len(got)}/{len(expected)} chữ")
    checks.append({'id': 'captionText', 'title': 'Chữ phụ đề khớp lời đọc đã viết', 'ok': not wrong, 'detail': 'khớp cả 4 short' if not wrong else '; '.join(wrong)})

    issues = []
    for sid, caps in caps_all.items():
        last = 0
        for p in caps:
            if p['startMs'] < last - 1: issues.append(f'{sid} chồng ở "{p["text"][:20]}"')
            if p['endMs'] - p['startMs'] < 600: issues.append(f'{sid} quá ngắn ở "{p["text"][:20]}"')
            if len(p['text']) > 50 and len(p['text'].split()) > 1: issues.append(f'{sid} quá 2 dòng ở "{p["text"][:20]}"')
            last = p['endMs']
    checks.append({'id': 'captionTime', 'title': 'Phụ đề đúng thứ tự, không chồng, đủ lâu, tối đa 2 dòng', 'ok': not issues,
                   'detail': f"{sum(len(c) for c in caps_all.values())} trang" if not issues else '; '.join(issues[:6])})

    voice_issues, music_issues, levels = [], [], []
    m, msr = sf.read(ROOT / 'public' / music['file'], always_2d=True);m = m.mean(1)[int(30 * msr):int(90 * msr)]
    bed = level_db(m) + 20 * np.log10(music['speechVolume'])
    for s in data['shorts']:
        a, sr = sf.read(ROOT / 'public' / s['file'], always_2d=True);a = a.mean(1)
        per = [level_db(a[int(x['startMs'] / 1000 * sr):int(x['endMs'] / 1000 * sr)]) for x in s['sentences']]
        med = float(np.median(per))
        spread = max(abs(v - med) for v in per)
        if np.max(np.abs(a)) >= .999: voice_issues.append(f"{ids[s['id']]} chạm đỉnh")
        if spread > 3: voice_issues.append(f"{ids[s['id']]} có câu lệch {spread:.1f} dB")
        if min(per) - bed < 15: music_issues.append(f"{ids[s['id']]} nhạc chỉ thấp hơn giọng {min(per) - bed:.1f} dB")
        levels.append(f"{ids[s['id']]}: giọng {med:.1f} dBFS, lệch tối đa {spread:.1f} dB")
    checks.append({'id': 'voice', 'title': 'Giọng không chạm đỉnh, các câu đều nhau (≤ 3 dB)', 'ok': not voice_issues, 'detail': '; '.join(voice_issues or levels)})
    checks.append({'id': 'music', 'title': 'Nhạc nằm dưới giọng ≥ 15 dB', 'ok': not music_issues, 'detail': '; '.join(music_issues) or f'nhạc nền {bed:.1f} dBFS'})

    build = [subprocess.run(['npm', 'run', '--silent', c], cwd=ROOT, capture_output=True, text=True) for c in ['typecheck', 'projects:check']]
    checks.append({'id': 'build', 'title': 'Typecheck và projects:check', 'ok': all(b.returncode == 0 for b in build),
                   'detail': 'đạt' if all(b.returncode == 0 for b in build) else (build[0].stdout + build[0].stderr + build[1].stderr)[-400:]})
    ok, detail, _ = export_loudness(SLUG)
    checks.append({'id': 'loudness', 'title': 'Âm lượng bản đăng -14 LUFS, đỉnh ≤ -1 dBTP', 'ok': ok, 'detail': detail})

    report = {'project': SLUG, 'checkedAt': datetime.datetime.now().astimezone().isoformat(timespec='seconds'), 'shorts': out,
              'technicalPass': all(c['ok'] for c in checks), 'checks': checks,
              'listenNotes': ['Nhận dạng nghe "nhưng" như "nhân" ở mọi bản clone; tập 3 dùng cùng giọng và người dùng đã duyệt, short 2 người dùng nghe và chốt 2026-11-10.',
                              '"trọn" như "chọn", "giữ" như "dữ", "đắc" như "đắt": chất giọng, không clone lại.'],
              'note': 'Đạt kỹ thuật không thay cho nghe duyệt; không render tự động.'}
    (DOCS / 'qa.json').write_text(json.dumps(report, ensure_ascii=False, indent=1) + '\n')
    for c in checks: print('✓' if c['ok'] else '✗', c['title'], '·', c['detail'])
    print('technicalPass', report['technicalPass'])


if __name__ == '__main__':
    main()
