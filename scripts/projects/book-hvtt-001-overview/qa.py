"""Technical QA of book-hvtt-001 → docs/projects/book-hvtt-001-overview/qa.json.

Runs the caption export first (captions.json / captions.srt from the video's own pacing), then checks:
  files        the files the final review binds exist (Video.tsx, Thumbnail.tsx, captions.json, description.md, music)
  captionText  every sentence of each narrated segment (lines-<segment>.txt) is in that part's captions, in order
  captionTime  pages in order, no overlap, at least 0.6 s on screen, at most two lines (≤ 90 characters), inside the video
  captionStyle captions use Stoic Sans 700, ivory text, gold keywords (Intro.tsx Captions)
  voice        published narration (audio/voice-metadata.json): no clipping, segments within 3 dB of each other
  music        music sits under the voice: body bed ≥ 15 dB below the narration while speaking
  build        typecheck and projects:check pass
  loudness     exported video to upload is -14 LUFS ± 1, true peak ≤ -1 dBTP (scripts/shared/export_loudness.py)
and lists the sentences the tone check flagged in the takes actually used (listening is the user's call).
A technical pass is not a listening approval.
Other episodes of the series: --project <slug> (series intro/outro/captions style come from episode 1's shared files).
Usage: .venv/bin/python scripts/projects/book-hvtt-001-overview/qa.py [--project <slug>]
"""
import datetime, json, re, subprocess, sys, unicodedata
from pathlib import Path
import numpy as np
import librosa

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'scripts/shared'))
from export_loudness import export_loudness  # noqa: E402
TOOLS = Path(__file__).resolve().parent
ID = sys.argv[sys.argv.index('--project') + 1] if '--project' in sys.argv else 'book-hvtt-001-overview'
HERE = ROOT / 'scripts/projects' / ID
SHARED = ROOT / 'src/projects/book-hvtt-001-overview'  # series Intro/Outro/caption style
PREFIX = '-'.join(ID.split('-')[:2])
SRC, DOCS, PUB = ROOT / 'src/projects' / ID, ROOT / 'docs/projects' / ID, ROOT / 'public'
AUD = PUB / ID / 'voice-auditions'
checks = []


def check(cid, title, ok, detail):
    checks.append({'id': cid, 'title': title, 'ok': bool(ok), 'detail': detail})
    print(f"{'ĐẠT ' if ok else 'LỖI '} {title}: {detail if isinstance(detail, str) else json.dumps(detail, ensure_ascii=False)[:300]}")


def norm(t):
    t = unicodedata.normalize('NFC', t.lower())
    return re.sub(r'\s+', ' ', re.sub(r'[^\w\s]', ' ', t)).strip()


def db(x):
    return 20 * np.log10(max(float(x), 1e-9))


def speech_rms(path):
    y, _ = librosa.load(path, sr=22050, mono=True)
    frames = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
    loud = frames[frames > frames.max() * .1]
    return float(np.sqrt(np.mean(loud ** 2))) if loud.size else 0.0, float(np.abs(y).max())


def main():
    subprocess.run(['node', str(TOOLS / 'export-captions.mjs'), '--project', ID], cwd=ROOT, check=True)
    cap = json.loads((SRC / 'captions.json').read_text())
    pages, fps, total = cap['pages'], cap['fps'], cap['totalFrames']

    musics = [SRC / m for m in ['music.json', 'body-music.json']] + [f for f in [SRC / 'outro-music.json', SHARED / 'outro-music.json'] if f.exists()][:1]
    need = [SRC / 'Video.tsx', SRC / 'Thumbnail.tsx', SRC / 'captions.json', DOCS / 'description.md', *musics]
    missing = [str(p.relative_to(ROOT)) for p in need if not p.exists()]
    for m in musics:
        if not m.exists(): continue
        f = json.loads(m.read_text())['file']
        if not (PUB / f).exists(): missing.append(f'public/{f}')
    check('files', 'Đủ file cho bước Xem bản dựng', not missing, 'đủ' if not missing else missing)

    # Caption text against the locked script, segment by segment.
    by_part = {}
    for p in pages: by_part.setdefault(p['part'], []).append(p['text'])
    problems, matched = [], 0
    for lines in sorted(HERE.glob('lines-*.txt')):
        seg = lines.stem[len('lines-'):]
        if not (HERE / f'audition-{seg}.json').exists(): continue
        # A sentence may be spoken differently from how it is shown ("say", e.g. Meade read as "Mít"): lines-*.txt keep
        # the spoken form, captions keep the written one.
        shown = {norm(x['say']): norm(x['text']) for x in json.loads((HERE / f'audition-{seg}.json').read_text()).get('sentences', []) if x.get('say')}
        sentences = [shown.get(norm(s), norm(s)) for s in lines.read_text().splitlines() if s.strip()]
        best = max(by_part.items(), key=lambda kv: sum(s in norm(' '.join(kv[1])) for s in sentences))
        text = norm(' '.join(best[1])); pos, lost = 0, []
        for s in sentences:
            i = text.find(s, pos)
            if i < 0: lost.append(s[:80])
            else: pos = i + len(s)
        matched += len(sentences) - len(lost)
        if lost: problems.append({'segment': seg, 'part': best[0], 'missing': lost})
    check('captionText', 'Chữ phụ đề khớp kịch bản đã chốt', not problems, f'{matched} câu khớp' if not problems else problems)

    # Caption timing and length.
    bad = []
    for a, b in zip(pages, pages[1:]):
        if b['startMs'] < a['endMs'] - 1 and b['part'] == a['part']: bad.append(f"chồng: {a['text'][:30]}… / {b['text'][:30]}…")
    for p in pages:
        if p['endMs'] - p['startMs'] < 600: bad.append(f"ngắn {p['endMs'] - p['startMs']} ms: {p['text'][:40]}")
        if len(p['text']) > 90: bad.append(f"dài {len(p['text'])} ký tự: {p['text'][:40]}…")
        if p['endMs'] > total * 1000 / fps: bad.append(f"quá cuối video: {p['text'][:40]}")
    check('captionTime', 'Phụ đề đúng thứ tự, không chồng, đủ lâu, tối đa 2 dòng', not bad, f'{len(pages)} trang' if not bad else bad[:12])

    intro = (SHARED / 'Intro.tsx').read_text()
    start = intro.index('export const Captions'); block = intro[start:intro.find('\nexport ', start + 10)]  # the whole Captions component
    style = {'Stoic Sans': 'Stoic Sans' in intro, 'fontWeight 700': 'fontWeight: 700' in block, 'chữ ngà': 'color: IVORY' in block, 'từ khóa vàng': 'GOLD' in block}
    check('captionStyle', 'Kiểu chữ phụ đề đúng chuẩn kênh', all(style.values()), style)

    # Narration levels.
    meta_file = PUB / ID / 'audio/voice-metadata.json'
    meta = json.loads(meta_file.read_text()) if meta_file.exists() else []
    levels = {}
    for m in meta:
        rms, peak = speech_rms(PUB / ID / 'audio' / m['file'])
        levels[m['scene']] = {'rmsDb': round(db(rms), 1), 'peakDb': round(db(peak), 1)}
    if not levels:
        check('voice', 'Giọng không vỡ tiếng, các đoạn to nhỏ đồng đều', False, 'chưa ghép giọng cuối (public/<slug>/audio trống): chạy publish-voice.py sau khi người dùng chọn giọng clone')
        levels = {'_': {'rmsDb': -20.0, 'peakDb': -3.0}}
    clip = {k: v for k, v in levels.items() if v['peakDb'] > -0.3}
    rmss = [v['rmsDb'] for v in levels.values()]
    spread = round(max(rmss) - min(rmss), 1)
    if '_' not in levels: check('voice', 'Giọng không vỡ tiếng, các đoạn to nhỏ đồng đều', not clip and spread <= 3,
          {'đoạn': len(levels), 'chênhLệchDb': spread, 'đỉnhCaoNhấtDb': max(v['peakDb'] for v in levels.values()), 'vỡTiếng': list(clip)})

    voice_db = float(np.median(rmss))
    body = json.loads((SRC / 'body-music.json').read_text())
    music_rms, _ = speech_rms(PUB / body['file'])
    under = round(voice_db - (db(music_rms) + db(body['speechVolume'])), 1)
    under_rest = round(voice_db - (db(music_rms) + db(body['pauseVolume'])), 1)
    check('music', 'Nhạc nền nội dung nằm dưới giọng', under >= 15, {'thấpHơnGiọngKhiCóLờiDb': under, 'thấpHơnGiọngLúcNghỉDb': under_rest, 'bài': body['credit']['title']})

    build = {}
    for name, cmd in [('typecheck', ['npm', 'run', '--silent', 'typecheck']), ('projects:check', ['npm', 'run', '--silent', 'projects:check'])]:
        r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
        build[name] = r.returncode == 0
    check('build', 'Typecheck và kiểm tra đăng ký dự án', all(build.values()), build)
    ok, detail, _ = export_loudness(ID)
    check('loudness', 'Âm lượng bản đăng -14 LUFS, đỉnh ≤ -1 dBTP', ok, detail)

    # Sentences in use that the tone check flagged (accent-insensitive ASR; the user's ear decides).
    flags = []
    for d in sorted((PUB / 'voice-auditions').glob(f'{PREFIX}-*-clone')):
        src = d / 'sources.json'
        if not src.exists(): continue
        seg = d.name[len(PREFIX) + 1:-len('-clone')]
        for text, take in json.loads(src.read_text()).items():
            if text.startswith('__'): continue
            rows = json.loads((AUD / take / 'tone-check.json').read_text()) if (AUD / take / 'tone-check.json').exists() else []
            row = next((r for r in reversed(rows) if r['text'].strip() == text.strip()), None)
            if row and (row['toneDiffs'] or any(not re.fullmatch(r'[\d\s]*', got) for _, got in row['wordDiffs'])):
                flags.append({'segment': seg, 'text': text, 'heard': row['heard'], 'tone': row['toneDiffs'], 'words': row['wordDiffs']})

    result = {'project': ID, 'checkedAt': datetime.datetime.now().astimezone().isoformat(timespec='seconds'),
              'durationSeconds': round(total / fps, 2), 'parts': [{'name': p['name'], 'start': round(p['startFrame'] / fps, 2), 'seconds': round(p['frames'] / fps, 2)} for p in cap['parts']],
              'technicalPass': all(c['ok'] for c in checks), 'checks': checks, 'voiceLevels': levels,
              'toneFlags': flags, 'listening': 'Chưa nghe duyệt: kiểm tra kỹ thuật đạt không có nghĩa là phát âm đã được duyệt; các câu ở toneFlags cần người dùng nghe.'}
    (DOCS / 'qa.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(f"\n{'ĐẠT' if result['technicalPass'] else 'CÓ LỖI'} kỹ thuật; {len(flags)} câu máy nghi dấu/chữ cần nghe.")


if __name__ == '__main__':
    main()
