"""Word timings for karaoke captions (user 2026-11-03): each caption page lights up word by word with the voice.
Local faster-whisper (medium, CPU) gives word times; the caption text stays the script's words, ASR words are only
used for their times (matched accent-insensitively, unmatched words spread between their neighbours, everything kept
inside the caption's own start/end). Adds `words: [{text, startMs, endMs}]` to every caption of the chosen voices.
Only for the final voice (cloned and locked): a placeholder's word times are thrown away with it.
Usage: .venv/bin/python scripts/projects/book-hvtt-001-overview/word-times.py <takes.json> <voice-id> [<voice-id>...]"""
import json, os, re, sys, unicodedata
from difflib import SequenceMatcher
from pathlib import Path
os.environ['HF_HUB_OFFLINE'] = '1'
import soundfile as sf, soxr
from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parents[3]


def norm(word):
    word = unicodedata.normalize('NFD', word.lower().replace('đ', 'd'))
    return re.sub(r'[^a-z0-9]', '', ''.join(c for c in word if unicodedata.category(c) != 'Mn'))


def asr_words(model, path):
    audio, sr = sf.read(path, dtype='float32')
    audio = audio.mean(axis=1) if audio.ndim > 1 else audio
    segments, _ = model.transcribe(soxr.resample(audio, sr, 16000), language='vi', beam_size=5, word_timestamps=True)
    return [(w.word.strip(), w.start * 1000, w.end * 1000) for s in segments for w in s.words if norm(w.word)]


def time_words(captions, heard):
    tokens = [(ci, t) for ci, c in enumerate(captions) for t in c['text'].split()]
    times = [None] * len(tokens)
    matcher = SequenceMatcher(None, [norm(t) for _, t in tokens], [norm(w) for w, _, _ in heard], autojunk=False)
    for a, b, n in matcher.get_matching_blocks():
        for k in range(n):
            times[a + k] = [heard[b + k][1], heard[b + k][2]]
    matched = sum(t is not None for t in times)
    # Unmatched words: spread evenly over the gap between the matched neighbours (or their caption's edges).
    i = 0
    while i < len(tokens):
        if times[i] is not None:
            i += 1; continue
        j = i
        while j < len(tokens) and times[j] is None: j += 1
        left = times[i - 1][1] if i > 0 else captions[tokens[i][0]]['startMs']
        right = times[j][0] if j < len(tokens) else captions[tokens[j - 1][0]]['endMs']
        right = max(right, left)
        for k in range(i, j):
            times[k] = [left + (right - left) * (k - i) / (j - i), left + (right - left) * (k - i + 1) / (j - i)]
        i = j
    # The caption page bounds come from the forced alignment of the whole take: words stay inside them, in order.
    out = [[] for _ in captions]
    for (ci, text), (start, end) in zip(tokens, times):
        c = captions[ci]
        start = min(max(start, c['startMs']), c['endMs'])
        end = min(max(end, start), c['endMs'])
        if out[ci]: start = max(start, out[ci][-1]['startMs'])
        out[ci].append({'text': text, 'startMs': round(start), 'endMs': round(end)})
    return out, matched, len(tokens)


def main():
    takes_path, ids = Path(sys.argv[1]), sys.argv[2:]
    data = json.loads(takes_path.read_text())
    model = WhisperModel('medium', device='cpu', compute_type='int8', cpu_threads=4, download_root=str(ROOT / '.cache/whisper'))
    heard_by_file = {}
    for voice in data['voices']:
        if voice['id'] not in ids: continue
        if voice['file'] not in heard_by_file:
            heard_by_file[voice['file']] = asr_words(model, ROOT / 'public' / voice['file'])
        words, matched, total = time_words(voice['captions'], heard_by_file[voice['file']])
        for caption, w in zip(voice['captions'], words): caption['words'] = w
        voice['wordTimes'] = {'source': 'faster-whisper medium (local)', 'matched': matched, 'words': total}
        print(f"{voice['id']}: {matched}/{total} từ khớp nhận dạng, phần còn lại nội suy")
    takes_path.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n')


if __name__ == '__main__':
    main()
