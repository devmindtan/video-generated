"""Publish the picked clone takes of know-when-to-quit as the video's narration, captions and timeline.

Takes stay untouched in public/know-when-to-quit/voice-auditions/; this writes pitch-shifted copies (duration
preserved, same method as book-hvtt voice B) to public/know-when-to-quit/audio/, caption pages aligned to the
script's own words (ASR only supplies timing), and src/projects/know-when-to-quit/timeline.json, which drives
every scene start and the composition length, plus scripts/projects/know-when-to-quit/scenes.json for review clips.
Usage: HF_HUB_OFFLINE=1 .venv/bin/python scripts/projects/know-when-to-quit/build-voice.py
"""
import difflib, hashlib, importlib.util, json, re, unicodedata
from pathlib import Path
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[3]
SLUG = 'know-when-to-quit'
TAKES = ROOT / 'public' / SLUG / 'voice-auditions'
AUDIO = ROOT / 'public' / SLUG / 'audio'
SRC = ROOT / 'src/projects' / SLUG
PITCH = 1  # user pick on patch p1 (2026-10-31): the +1 semitone sample
LEAD, GAP, TAIL = 0.25, 0.75, 1.7  # seconds: before scene 1, between scenes, after the last line
# Scene 1 (approved clip): one take. Scenes 2–5 (scene notes: pacing, clipped "mệt", rewritten lines): one clone
# per sentence from lines-v4.txt, joined with each sentence's pauseAfter from audition.json.
SINGLE = {1: ('clone-mushashi-v3-full', 'scene-01-clone.wav')}
LINES_TAKE = 'clone-mushashi-v4-lines'
NAMES = {1: '01-ledger', 2: '02-hourglass', 3: '03-dry-well', 4: '04-fork', 5: '05-valley'}

spec = importlib.util.spec_from_file_location('variants', ROOT / 'scripts/projects/book-hvtt-001-overview/voice-variants.py')
variants = importlib.util.module_from_spec(spec)
spec.loader.exec_module(variants)
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
fold = lambda w: unicodedata.normalize('NFD', w.lower()).encode('ascii', 'ignore').decode()


def norm(word):
    return re.sub(r'[^0-9a-z]', '', fold(word.replace('đ', 'd').replace('Đ', 'd')))


def speech_span(data, sr):
    level = np.abs(data if data.ndim == 1 else data.mean(1))
    frames = level[: len(level) // 480 * 480].reshape(-1, 480).max(1)
    on = np.where(frames > frames.max() * 0.06)[0]
    return on[0] * 480 / sr, (on[-1] + 1) * 480 / sr


def trimmed(data, sr):
    """One sentence without the clone's leading/trailing silence; a generous tail keeps soft word endings."""
    level = np.abs(data if data.ndim == 1 else data.mean(1))
    on = np.where(level > level.max() * 0.025)[0]
    a, b = max(0, on[0] - int(0.04 * sr)), min(len(data), on[-1] + int(0.22 * sr))
    out = data[a:b].copy()
    ramp = int(0.015 * sr)
    out[:ramp] *= np.linspace(0, 1, ramp)[:, None] if out.ndim > 1 else np.linspace(0, 1, ramp)
    out[-ramp:] *= np.linspace(1, 0, ramp)[:, None] if out.ndim > 1 else np.linspace(1, 0, ramp)
    return out


def scene_audio(n, sentences):
    """(audio, sample rate, source takes) for a scene: the single take, or its sentences joined with authored pauses."""
    if n in SINGLE:
        take, name = SINGLE[n]
        data, sr = sf.read(TAKES / take / name, always_2d=False)
        return data, sr, [f'voice-auditions/{take}/{name}']
    # Sentence files are found by their text in the take's manifest, so dropping a line never shifts the others.
    files = {f['text']: f['file'] for f in json.loads((TAKES / LINES_TAKE / 'manifest.json').read_text())['files']}
    parts, sources, sr = [], [], None
    mine = [x for x in sentences if x['scene'] == n]
    for k, x in enumerate(mine):
        name = files[x['text']]
        data, sr = sf.read(TAKES / LINES_TAKE / name, always_2d=False)
        parts.append(trimmed(data, sr))
        if k < len(mine) - 1:
            parts.append(np.zeros((int(x['pauseAfter'] * sr),) + data.shape[1:]))
        sources.append(f'voice-auditions/{LINES_TAKE}/{name}')
    return np.concatenate(parts), sr, sources


def captions_for(text, words):
    """Author's words with ASR word times (sequence-matched on accent-free forms), grouped into pages."""
    tokens = text.split()
    asr = [(norm(w.word), w.start, w.end) for w in words if norm(w.word)]
    times = [None] * len(tokens)
    sm = difflib.SequenceMatcher(a=[norm(t) for t in tokens], b=[a[0] for a in asr], autojunk=False)
    for a, b, n in sm.get_matching_blocks():
        for k in range(n):
            times[a + k] = asr[b + k][1:]
    # Unmatched words (number spelling, misheard tones) take the gap between matched neighbours.
    for i, t in enumerate(times):
        if t is None:
            prev = next((times[j][1] for j in range(i - 1, -1, -1) if times[j]), asr[0][1])
            nxt = next((times[j][0] for j in range(i + 1, len(times)) if times[j]), asr[-1][2])
            run = [j for j in range(i, len(times)) if times[j] is None]
            run = run[: next((k for k, j in enumerate(run) if j != i + k), len(run))]
            step = (nxt - prev) / len(run)
            for k, j in enumerate(run):
                times[j] = (prev + k * step, prev + (k + 1) * step)
    # Pages follow the clauses: break at punctuation, split a long clause in the middle, join short neighbours.
    clauses, cur = [], []
    for i, tok in enumerate(tokens):
        cur.append(i)
        if re.search(r'[.,:?!]$', tok) or i == len(tokens) - 1:
            clauses.append(cur)
            cur = []
    width = lambda idx: len(' '.join(tokens[j] for j in idx))
    split = []
    for c in clauses:
        if width(c) <= 34:
            split.append(c)
            continue
        cut = min(range(1, len(c)), key=lambda k: abs(width(c[:k]) - width(c[k:])))
        split += [c[:cut], c[cut:]]
    pages = []
    for c in split:
        if pages and not tokens[pages[-1][-1]].endswith(':') and (width(pages[-1]) < 14 or width(c) < 10) and width(pages[-1] + c) <= 34:
            pages[-1] = pages[-1] + c
        else:
            pages.append(c)
    out = []
    for k, page in enumerate(pages):
        start = times[page[0]][0]
        end = times[pages[k + 1][0]][0] if k + 1 < len(pages) else times[page[-1]][1] + 0.35
        out.append({'text': ' '.join(tokens[j] for j in page), 'startMs': round(start * 1000), 'endMs': round(end * 1000),
                    'timestampMs': round(start * 1000), 'confidence': None})
    return out


def main():
    from faster_whisper import WhisperModel
    model = WhisperModel('medium', device='cpu', compute_type='int8', cpu_threads=4, download_root=str(ROOT / '.cache/whisper'))
    audition = json.loads((ROOT / 'scripts/projects' / SLUG / 'audition.json').read_text())
    AUDIO.mkdir(parents=True, exist_ok=True)
    scenes, captions, meta, t = [], [], [], LEAD
    for n in NAMES:
        data, sr, sources = scene_audio(n, audition['sentences'])
        shifted = variants.shift(data, sr, PITCH)
        wav = AUDIO / f'{NAMES[n]}-voice-full.wav'
        sf.write(wav, shifted, sr, subtype='PCM_24')
        text = ' '.join(s['text'] for s in audition['sentences'] if s['scene'] == n)
        mono = shifted if shifted.ndim == 1 else shifted.mean(1)
        audio16 = np.interp(np.arange(0, len(mono), sr / 16000), np.arange(len(mono)), mono).astype('float32')
        segs, _ = model.transcribe(audio16, language='vi', beam_size=5, word_timestamps=True)
        segs = list(segs)
        words = [w for s in segs for w in s.words]
        heard = ' '.join(s.text.strip() for s in segs)
        dur = len(mono) / sr
        s0, s1 = speech_span(shifted, sr)
        length = dur + (TAIL if n == len(NAMES) else GAP)
        scenes.append({'id': NAMES[n], 'scene': n, 'start': round(t, 3), 'duration': round(length, 3), 'audio': f'{SLUG}/audio/{wav.name}',
                       'audioSeconds': round(dur, 3), 'speechStart': round(s0, 3), 'speechEnd': round(s1, 3)})
        captions.append(captions_for(text, words))
        ratio = difflib.SequenceMatcher(a=[norm(w) for w in text.split()], b=[norm(w.word) for w in words]).ratio()
        meta.append({'scene': NAMES[n], 'file': wav.name, 'sha256': sha(wav), 'durationSeconds': round(dur, 3), 'pitchSemitones': PITCH,
                     'durationPreserved': True, 'sourceTakes': sources, 'text': text, 'asrTranscript': heard,
                     'accentFreeWordMatch': round(ratio, 3), 'listeningReview': 'chưa nghe duyệt'})
        print(f'{NAMES[n]}: {dur:.2f}s, khớp chữ (bỏ dấu) {ratio:.2f} | ASR: {heard}')
        t += length
    total = round(t, 3)
    (SRC / 'timeline.json').write_text(json.dumps({'fps': 30, 'totalSeconds': total, 'scenes': scenes}, ensure_ascii=False, indent=2) + '\n')
    # Scene list for per-scene review clips (`npm run automation -- scene-clip know-when-to-quit <id>`).
    titles = {1: 'Sổ chi tiêu', 2: 'Đồng hồ cát', 3: 'Giếng khô', 4: 'Ngã ba', 5: 'Đặt xẻng xuống'}
    (ROOT / 'scripts/projects' / SLUG / 'scenes.json').write_text(json.dumps([{'id': s['id'], 'title': f"Cảnh {s['scene']}: {titles[s['scene']]}", 'composition': 'StoicKnowWhenToQuit',
        'frames': [round(s['start'] * 30), round((s['start'] + s['duration']) * 30) - 1]} for s in scenes], ensure_ascii=False, indent=2) + '\n')
    (SRC / 'captions.json').write_text(json.dumps(captions, ensure_ascii=False, indent=2) + '\n')
    (AUDIO / 'voice-metadata.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2) + '\n')
    print(f'Tổng {total}s (dao động cho phép 42–48s)')


if __name__ == '__main__':
    main()
