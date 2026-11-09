"""Build the narration audio and timing data of the four episode 3 shorts (book-dnt-001-shorts).

The words are written for the shorts (user 2026-11-09: "viết lại lời thoại có độ dài phù hợp, đừng lấy của video gốc"):
scripts/projects/book-dnt-001-shorts/narration.json lists every sentence with an id and the rest after it; the
invitation (cta) closes every short. The voice comes from one take that read all sentences in order
(public/voice-auditions/<take>/<voice>.wav, sliced by the take manifest's phraseRanges): the placeholder Quốc Tuấn
first, the picked clone later.

Writes public/book-dnt-001-shorts/audio/short-N.wav (one narration per short) and src/projects/book-dnt-001-shorts/
shorts.json (per short: file, durationSeconds, sentences with start/end, words with times) plus captions.json (one page
per sentence in video time, for visual-sync and the .srt export). Word times: measured ones from the take's captions
file when it has them (clone after word-times.py); otherwise estimated by letter count inside each sentence, only so
pages and drawings land at about the right moment (series rule: word-lit captions only for the picked clone).
Usage: .venv/bin/python scripts/projects/book-dnt-001-shorts/build-shorts.py --take book-dnt-shorts-qt-v2 [--voice 25-quoc-tuan]
"""
import argparse, json, re
from pathlib import Path
import numpy as np, soundfile as sf

ROOT = Path(__file__).resolve().parents[3]
HERE = ROOT / 'scripts/projects/book-dnt-001-shorts'
OUT = ROOT / 'public/book-dnt-001-shorts/audio'
SRC = ROOT / 'src/projects/book-dnt-001-shorts'
EDGE = .04  # keep a little air around each sliced sentence
COMPOSITIONS = {'short-1': 'BookDntShortThangThua', 'short-2': 'BookDntShortNhungVa', 'short-3': 'BookDntShortTamLong', 'short-4': 'BookDntShortChuaDat'}


def estimated_words(text, start, end):
    tokens = text.split();weights = [len(t) + 1 for t in tokens];total = sum(weights);acc = 0;words = []
    for t, w in zip(tokens, weights):
        a = start + (end - start) * acc / total;acc += w
        words.append({'text': t, 'startMs': round(a * 1000), 'endMs': round((start + (end - start) * acc / total) * 1000)})
    return words


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--take', required=True)
    ap.add_argument('--voice', default='25-quoc-tuan')
    args = ap.parse_args()
    nar = json.loads((HERE / 'narration.json').read_text())
    take = ROOT / 'public/voice-auditions' / args.take
    manifest = json.loads((take / 'manifest.json').read_text())
    record = next(r for r in manifest['voices'] if r['file'] == f'{args.voice}.wav')
    audio, sr = sf.read(take / record['file'], dtype='float32')
    order = [s for sh in nar['shorts'] for s in sh['sentences']] + [nar['cta']]
    ranges = record['phraseRanges']
    assert len(ranges) == len(order) and all(r['text'] == s['text'] for r, s in zip(ranges, order)), 'take does not match narration.json: make a new take'
    piece = {s['id']: audio[max(0, round((r['startSeconds'] - EDGE) * sr)):round((r['endSeconds'] + EDGE) * sr)] for s, r in zip(order, ranges)}
    OUT.mkdir(parents=True, exist_ok=True)
    layout = json.loads((SRC / 'layout.json').read_text())
    shorts, captions = [], {}
    for sh in nar['shorts']:
        items = [(s, s['pauseAfter']) for s in sh['sentences']]
        items[-1] = (items[-1][0], nar['ctaPause'])
        items.append((nar['cta'], 0))
        chunks, sentences, words, at = [], [], [], 0.0
        for s, rest in items:
            p = piece[s['id']].copy();fade = min(len(p) // 2, round(.01 * sr))
            p[:fade] *= np.linspace(0, 1, fade);p[-fade:] *= np.linspace(1, 0, fade)
            start, end = at + EDGE, at + len(p) / sr - EDGE
            sentences.append({'id': s['id'], 'text': s['text'], 'role': 'hook' if s is sh['sentences'][0] else 'cta' if s is nar['cta'] else 'body',
                              'startMs': round(start * 1000), 'endMs': round(end * 1000)})
            words += [{**w, 'sentence': s['id']} for w in estimated_words(s['text'], start, end)]
            chunks += [p, np.zeros(round(rest * sr), dtype='float32')];at += len(p) / sr + rest
        out = OUT / f"{sh['id']}.wav"
        sf.write(out, np.concatenate(chunks), sr, subtype='PCM_16')
        shorts.append({'id': sh['id'], 'title': sh['title'], 'file': str(out.relative_to(ROOT / 'public')), 'durationSeconds': round(at, 3),
                       'sentences': sentences, 'words': words})
        lead = layout['lead'];total = lead + at + layout['tail']
        captions[sh['id']] = {'title': f"Short {sh['id'][-1]} · {sh['title']}", 'composition': COMPOSITIONS[sh['id']], 'durationSeconds': round(total, 2),
                              'pages': [{'part': {'hook': 'Câu mở', 'body': 'Lời đọc', 'cta': 'Lời mời'}[x['role']], 'text': x['text'],
                                         'startMs': round(lead * 1000) + x['startMs'], 'endMs': round(lead * 1000) + x['endMs']} for x in sentences]}
    (SRC / 'shorts.json').write_text(json.dumps({'take': args.take, 'voice': args.voice, 'placeholder': args.voice != 'clone', 'estimatedWords': True, 'shorts': shorts}, ensure_ascii=False, indent=1) + '\n')
    (SRC / 'captions.json').write_text(json.dumps({'shorts': captions}, ensure_ascii=False, indent=1) + '\n')
    for s in shorts:
        print(s['id'], f"{s['durationSeconds']:.1f} s narration", f"{captions[s['id']]['durationSeconds']:.1f} s video")


if __name__ == '__main__':
    main()
