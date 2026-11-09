"""Build the audio and timing data of the four episode 3 shorts (book-dnt-001-shorts).

Each short = opening line + excerpt of episode 3's accepted clone voice + invitation. The excerpt cuts come from
voice.json ("excerpts": one range of a segment, or "parts" joined with a short pause), every cut set in a measured
silence of public/book-dnt-001-overview/audio/<segment>-voice-full.wav. The opening lines and the invitation come from
a take of scripts/projects/book-dnt-001-shorts/audition-*.json in public/voice-auditions/<take>/ (the placeholder voice
Quốc Tuấn first; the clone later), sliced by the take manifest's sentence ranges.

Writes public/book-dnt-001-shorts/audio/short-N-{hook,excerpt,cta}.wav and src/projects/book-dnt-001-shorts/shorts.json
(per clip: file, durationSeconds, words). Excerpt words keep the episode's word times (shifted to the cut); the
placeholder voice has no word times, so each of its phrases lights as a whole (series rule: word-lit captions only for
the picked clone). Never touches episode 3's files.
Usage: .venv/bin/python scripts/projects/book-dnt-001-shorts/build-shorts.py --take book-dnt-shorts-qt-v1 [--voice 25-quoc-tuan]
"""
import argparse, json, re
from pathlib import Path
import numpy as np, soundfile as sf

ROOT = Path(__file__).resolve().parents[3]
HERE = ROOT / 'scripts/projects/book-dnt-001-shorts'
EP = ROOT / 'public/book-dnt-001-overview/audio'
OUT = ROOT / 'public/book-dnt-001-shorts/audio'
DATA = ROOT / 'src/projects/book-dnt-001-shorts/shorts.json'
JOIN_PAUSE = .45  # between two excerpt parts

def words_of(segment):
    d = json.loads((EP / f'{segment}-captions.json').read_text())
    caps = d['captions'] if isinstance(d, dict) else d
    return [w for c in caps for w in c.get('words', [])]

def excerpt(short, spec):
    parts = spec.get('parts') or [{'take': spec['take'], 'fromSeconds': spec['fromSeconds'], 'toSeconds': spec['toSeconds']}]
    chunks, words, at, rate = [], [], 0.0, None
    for i, p in enumerate(parts):
        seg = p.get('take') or spec['take']
        audio, sr = sf.read(EP / f'{seg}-voice-full.wav', dtype='float32', always_2d=True)
        rate = rate or sr
        assert sr == rate, 'excerpt parts must share a sample rate'
        a, b = round(p['fromSeconds'] * sr), round(p['toSeconds'] * sr)
        piece = audio[a:b].copy()
        fade = min(len(piece) // 2, round(.012 * sr))  # click-free edges
        piece[:fade] *= np.linspace(0, 1, fade)[:, None];piece[-fade:] *= np.linspace(1, 0, fade)[:, None]
        if i:
            chunks.append(np.zeros((round(JOIN_PAUSE * sr), audio.shape[1]), dtype='float32'));at += JOIN_PAUSE
        chunks.append(piece)
        first = True
        for w in words_of(seg):
            mid = (w['startMs'] + w['endMs']) / 2000
            if p['fromSeconds'] <= mid <= p['toSeconds']:
                words.append({**({'partStart': True} if first else {}), 'text': w['text'], 'startMs': max(0, round((w['startMs'] / 1000 - p['fromSeconds'] + at) * 1000)),
                              'endMs': round((w['endMs'] / 1000 - p['fromSeconds'] + at) * 1000)})
                first = False
        at += (b - a) / sr
    # A part that starts mid-paragraph ("tác giả…", "một vài…") still opens its caption with a capital letter.
    for k, w in enumerate(words):
        if k == 0 or re.search(r'[.?!…]["”\']*$', words[k - 1]['text']) or w.get('partStart'):
            w['text'] = w['text'][:1].upper() + w['text'][1:]
        w.pop('partStart', None)
    out = OUT / f'{short}-excerpt.wav'
    sf.write(out, np.concatenate(chunks), rate, subtype='PCM_24')
    return {'file': str(out.relative_to(ROOT / 'public')), 'fromSeconds': 0, 'toSeconds': round(at, 3), 'durationSeconds': round(at, 3), 'words': words}

def take_clip(take, voice, ranges, sentence_id, name):
    audio, sr = sf.read(ROOT / 'public/voice-auditions' / take / f'{voice}.wav', dtype='float32')
    r = ranges[sentence_id]
    a, b = round(r['startSeconds'] * sr), round(r['endSeconds'] * sr)
    out = OUT / name
    sf.write(out, audio[a:b], sr, subtype='PCM_16')
    dur = (b - a) / sr
    # Placeholder voice: no measured word times (series rule: word times only for the picked clone). Estimated times,
    # spread over the clip by letter count, only so the caption pages turn at about the right moment.
    tokens = r['text'].split();lead, speech = .05, dur - .1
    weights = [len(t) + 1 for t in tokens];total = sum(weights);words, acc = [], 0
    for t, wgt in zip(tokens, weights):
        a0 = lead + speech * acc / total;acc += wgt
        words.append({'text': t, 'startMs': round(a0 * 1000), 'endMs': round((lead + speech * acc / total) * 1000), 'estimated': True})
    return {'file': str(out.relative_to(ROOT / 'public')), 'durationSeconds': round(dur, 3), 'words': words}

COMPOSITIONS = {'short-1': ('BookDntShortThangThua', 'Short 1 · Thắng cũng là thua'), 'short-2': ('BookDntShortNhungVa', 'Short 2 · Chữ “nhưng” thành “và”'),
                'short-3': ('BookDntShortTamLong', 'Short 3 · Tấm lòng hay cửa miệng'), 'short-4': ('BookDntShortChuaDat', 'Short 4 · Vì sao có người không thích cuốn sách')}

def write_captions(shorts, fps=30):
    """src/projects/book-dnt-001-shorts/captions.json: one sentence per page, in video time (same timeline as Video.tsx:
    timelineWith(layout.json) with frame rounding). Read by visual-sync and the captions-N.srt export."""
    g = json.loads((ROOT / 'src/projects/book-dnt-001-shorts/layout.json').read_text())
    F = lambda x: round(x * fps)
    out = {}
    for s in shorts:
        hook = F(g['lead']); ex = hook + F(s['hook']['durationSeconds'] + g['gap1']); cta = ex + F(s['excerpt']['toSeconds'] - s['excerpt']['fromSeconds'] + g['gap2'])
        total = cta + F(s['cta']['durationSeconds'] + g['tail'])
        pages = []
        def sentences(words, start_frame, part):
            cur = []
            for w in words:
                cur.append(w)
                if re.search(r'[.?!…]["”\']*$', w['text']) or w is words[-1]:
                    pages.append({'part': part, 'text': ' '.join(x['text'] for x in cur), 'startMs': round(start_frame * 1000 / fps + cur[0]['startMs']),
                                  'endMs': round(start_frame * 1000 / fps + cur[-1]['endMs'])});cur = []
        sentences(s['hook']['words'], hook, 'Câu mở')
        sentences(s['excerpt']['words'], ex, 'Đoạn trích tập 3')
        sentences(s['cta']['words'], cta, 'Lời mời')
        cid, title = COMPOSITIONS[s['id']]
        out[s['id']] = {'title': title, 'composition': cid, 'durationSeconds': round(total / fps, 2), 'pages': pages}
    (ROOT / 'src/projects/book-dnt-001-shorts/captions.json').write_text(json.dumps({'shorts': out}, ensure_ascii=False, indent=1) + '\n')

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--take', required=True)
    ap.add_argument('--voice', default='25-quoc-tuan')
    args = ap.parse_args()
    cfg = json.loads((HERE / 'audition-qt.json').read_text())
    manifest = json.loads((ROOT / 'public/voice-auditions' / args.take / 'manifest.json').read_text())
    record = next(r for r in manifest['voices'] if r['file'] == f'{args.voice}.wav')
    phrases = record.get('phraseRanges') or record.get('phrases')
    assert phrases and len(phrases) == len(cfg['sentences']), 'take manifest has no sentence ranges for every line'
    ranges = {s['id']: {**p, 'text': s['text']} for s, p in zip(cfg['sentences'], phrases)}
    spec = json.loads((HERE / 'voice.json').read_text())['excerpts']
    OUT.mkdir(parents=True, exist_ok=True)
    shorts = []
    cta = take_clip(args.take, args.voice, ranges, 'cta', 'cta.wav')
    for n in range(1, 5):
        sid = f'short-{n}'
        shorts.append({'id': sid, 'hook': take_clip(args.take, args.voice, ranges, f'hook-{n}', f'{sid}-hook.wav'),
                       'excerpt': excerpt(sid, spec[sid]), 'cta': cta})
    DATA.write_text(json.dumps({'take': args.take, 'voice': args.voice, 'placeholder': args.voice != 'clone', 'shorts': shorts}, ensure_ascii=False, indent=1) + '\n')
    write_captions(shorts)
    for s in shorts:
        print(s['id'], 'hook', s['hook']['durationSeconds'], 'excerpt', s['excerpt']['durationSeconds'], 'cta', s['cta']['durationSeconds'])

if __name__ == '__main__':
    main()
