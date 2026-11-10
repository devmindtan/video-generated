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
       .venv/bin/python scripts/projects/book-dnt-001-shorts/build-shorts.py --clone clone-v1 [clone-v2 …]   (→ *-clone files)
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


def word_timer():
    """Measured word times for the picked clone (series rule: word-lit captions only for the final cloned voice):
    faster-whisper medium (local, CPU, int8) with word timestamps on each processed sentence. The caption keeps the
    script's words; each script word gets the time where the recognised speech reaches the same share of letters, so a
    mis-heard word ("nhân" for "nhưng") still lands at the right moment."""
    import soxr
    from faster_whisper import WhisperModel
    model = WhisperModel('medium', device='cpu', compute_type='int8', cpu_threads=6, download_root=str(ROOT / '.cache/whisper'))

    def measure(audio, sr, text, offset):
        a16 = soxr.resample(audio.astype('float32'), sr, 16000).astype('float32')
        segs, _ = model.transcribe(a16, language='vi', word_timestamps=True, beam_size=5)
        heard = [w for sg in segs for w in sg.words if w.word.strip()]
        if not heard:
            return None
        lens = [len(w.word.strip()) for w in heard];total_h = sum(lens);acc = 0;marks = []
        for w, n in zip(heard, lens):
            marks.append((acc / total_h, w.start));acc += n;marks.append((acc / total_h, w.end))
        at = lambda f: float(np.interp(f, [m[0] for m in marks], [m[1] for m in marks]))
        tokens = text.split();lt = [len(t.strip('.,:;!?“”"')) or 1 for t in tokens];total = sum(lt);acc = 0;out = []
        for t, n in zip(tokens, lt):
            a = at(acc / total);acc += n;b = at(acc / total)
            out.append({'text': t, 'startMs': round((offset + a) * 1000), 'endMs': round((offset + max(b, a + .05)) * 1000)})
        return out
    return measure


def load(path, name):
    import importlib.util
    spec = importlib.util.spec_from_file_location(name, path);mod = importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);return mod


def clone_pieces(takes, order):
    """The user's cloned voice, as in episode 3 (pacing.json of the series): pauses inside a sentence cut to 0.3 s, breath
    at the edges trimmed (RMS 0.006), each sentence brought to the same loudness, then +2 semitones with the duration
    kept (voice-variants.py). No tempo change."""
    tools = ROOT / 'scripts/projects/book-hvtt-001-overview'
    asm, var = load(tools / 'assemble-clone.py', 'assemble_clone'), load(tools / 'voice-variants.py', 'voice_variants')
    import soxr
    # Per sentence, the take with the fewest tone/word flags from check-tones.py (tone-check.json); ties go to the later
    # take; a pick in voice-picks.json (user listening, {sentence id: "take/part-NN-clone.wav"}) wins over both.
    files, score = {}, {}
    for t in takes:
        d = ROOT / 'public/book-dnt-001-shorts/voice-auditions' / t
        m = json.loads((d / 'manifest.json').read_text())
        checks = {c['file']: len(c['toneDiffs']) + len(c['wordDiffs']) + 2 * len(c.get('stretched', [])) + 2 * len(c.get('repeats', [])) for c in json.loads((d / 'tone-check.json').read_text())} if (d / 'tone-check.json').exists() else {}
        for f in m['files']:
            key, sc = f['text'].strip(), checks.get(f['file'], 99)
            if key not in files or sc <= score[key]:
                files[key], score[key] = d / f['file'], sc
    picks_file = HERE / 'voice-picks.json'
    picks = json.loads(picks_file.read_text()) if picks_file.exists() else {}
    for s in order:
        if s['id'] in picks:
            files[s['text'].strip()] = ROOT / 'public/book-dnt-001-shorts/voice-auditions' / picks[s['id']]
    clone_pieces.used = {s['id']: str(files[s['text'].strip()].relative_to(ROOT / 'public/book-dnt-001-shorts/voice-auditions')) for s in order if s['text'].strip() in files}
    clone_pieces.flags = {s['id']: score.get(s['text'].strip()) for s in order}
    missing = [s['id'] for s in order if s['text'].strip() not in files]
    assert not missing, f'no clone yet for: {missing}'
    out = {}
    for s in order:
        a, sr = sf.read(files[s['text'].strip()], dtype='float64')
        a = a.mean(1) if a.ndim > 1 else a
        if sr != asm.SR: a = soxr.resample(a, sr, asm.SR)
        a = asm.trim_quiet_edges(asm.squeeze_pauses(a, .3), .006)
        a = asm.normalize_gain(a, active_only=True)
        out[s['id']] = var.shift(a, asm.SR, 2).astype('float32')
    return out, asm.SR


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--take')
    ap.add_argument('--final', action='store_true', help='with --clone: the user picked the clone; write it to the real shorts (short-N.wav, shorts.json, captions.json) with measured word times')
    ap.add_argument('--clone', nargs='+', help='VoiceStudio clone takes in public/book-dnt-001-shorts/voice-auditions/ (one WAV per sentence); a sentence comes from the last take that has its exact text')
    ap.add_argument('--voice', default='25-quoc-tuan')
    args = ap.parse_args()
    nar = json.loads((HERE / 'narration.json').read_text())
    order = [s for sh in nar['shorts'] for s in sh['sentences']] + [nar['cta']]
    if args.clone:
        piece, sr = clone_pieces(args.clone, order)
        args.take, args.voice = args.clone[-1], 'clone'
    else:
        take = ROOT / 'public/voice-auditions' / args.take
        manifest = json.loads((take / 'manifest.json').read_text())
        record = next(r for r in manifest['voices'] if r['file'] == f'{args.voice}.wav')
        audio, sr = sf.read(take / record['file'], dtype='float32')
        ranges = record['phraseRanges']
        assert len(ranges) == len(order) and all(r['text'] == s['text'] for r, s in zip(ranges, order)), 'take does not match narration.json: make a new take'
        piece = {s['id']: audio[max(0, round((r['startSeconds'] - EDGE) * sr)):round((r['endSeconds'] + EDGE) * sr)] for s, r in zip(order, ranges)}
    OUT.mkdir(parents=True, exist_ok=True)
    layout = json.loads((SRC / 'layout.json').read_text())
    shorts, captions = [], {}
    # A clone build goes to its own files (…-clone.wav, shorts-clone.json) and the …Clone compositions: the clone is
    # wired into the real shorts only after the user picks it (series rule).
    suffix = '-clone' if args.clone and not args.final else ''
    measure = word_timer() if args.final else None
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
            found = measure(p, sr, s['text'], at) if measure else None
            words += [{**w, 'sentence': s['id']} for w in (found or estimated_words(s['text'], start, end))]
            chunks += [p, np.zeros(round(rest * sr), dtype='float32')];at += len(p) / sr + rest
        out = OUT / f"{sh['id']}{suffix}.wav"
        sf.write(out, np.concatenate(chunks), sr, subtype='PCM_16')
        shorts.append({'id': sh['id'], 'title': sh['title'], 'file': str(out.relative_to(ROOT / 'public')), 'durationSeconds': round(at, 3),
                       'sentences': sentences, 'words': words})
        lead = layout['lead'];total = lead + at + layout['tail']
        captions[sh['id']] = {'title': f"Short {sh['id'][-1]} · {sh['title']}", 'composition': COMPOSITIONS[sh['id']], 'durationSeconds': round(total, 2),
                              'pages': [{'part': {'hook': 'Câu mở', 'body': 'Lời đọc', 'cta': 'Lời mời'}[x['role']], 'text': x['text'],
                                         'startMs': round(lead * 1000) + x['startMs'], 'endMs': round(lead * 1000) + x['endMs']} for x in sentences]}
    used = getattr(clone_pieces, 'used', None) if args.clone else None
    (SRC / f'shorts{suffix}.json').write_text(json.dumps({'take': args.take, 'voice': args.voice, 'placeholder': not args.clone, 'estimatedWords': not args.final, **({'sentenceTakes': used} if used else {}), 'shorts': shorts}, ensure_ascii=False, indent=1) + '\n')
    if not suffix:
        (SRC / 'captions.json').write_text(json.dumps({'shorts': captions}, ensure_ascii=False, indent=1) + '\n')
    for s in shorts:
        print(s['id'], f"{s['durationSeconds']:.1f} s narration", f"{captions[s['id']]['durationSeconds']:.1f} s video")


if __name__ == '__main__':
    main()
