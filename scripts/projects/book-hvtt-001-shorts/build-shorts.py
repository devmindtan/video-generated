"""Build src/projects/book-hvtt-001-shorts/shorts.json for the three shorts that lead to episode 1.

Opening questions and the invitation: the four sentences of a clone take (lines-clone.txt order: hooks 1–3, then the
invitation), silence trimmed, raised +2 semitones with the episode's method (voice-variants.py, duration preserved)
into a new take <take>-sang2 (never overwritten). Excerpts: the published clone takes of episode 1, cut at the times in
voice.json. Word times for every clip come from local faster-whisper, matched to the script's words (word-times.py).
A re-cloned invitation comes from its own take (--cta-take, its first sentence); variants already made are reused.
Another episode's shorts (user 2026-11-05: every long episode gets promo shorts): --project <shorts slug> --episode
<long episode slug>; hooks are all lines but the last, the invitation is the last line, shorts follow voice.json
"excerpts". Excerpt word times come from the episode's own karaoke words when its captions have them.
Usage: .venv/bin/python scripts/projects/book-hvtt-001-shorts/build-shorts.py --take clone-v1 [--cta-take cta-v2] [--project book-ah-001-shorts --episode book-ah-001-overview]
"""
import argparse, importlib.util, json, os
from pathlib import Path
os.environ['HF_HUB_OFFLINE'] = '1'
import numpy as np, soundfile as sf, soxr
from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parents[3]
EP1 = ROOT / 'scripts/projects/book-hvtt-001-overview'  # shared voice tools (voice-variants.py, word-times.py)


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


variants, wordtimes = load('voice_variants', EP1 / 'voice-variants.py'), load('word_times', EP1 / 'word-times.py')


def trim(data, sr, pad=.12, floor=.02):
    mono = np.abs(data if data.ndim == 1 else data.mean(axis=1))
    loud = np.where(mono > floor * mono.max())[0]
    a, b = max(0, loud[0] - int(pad * sr)), min(len(data), loud[-1] + int(pad * sr))
    return data[a:b]


def heard(model, data, sr):
    mono = data if data.ndim == 1 else data.mean(axis=1)
    segments, _ = model.transcribe(soxr.resample(mono.astype('float32'), sr, 16000), language='vi', beam_size=5, word_timestamps=True)
    return [(w.word.strip(), w.start * 1000, w.end * 1000) for s in segments for w in s.words if wordtimes.norm(w.word)]


def words_of(model, data, sr, captions):
    timed, matched, total = wordtimes.time_words(captions, heard(model, data, sr))
    print(f'  {matched}/{total} từ khớp nhận dạng')
    return [w for page in timed for w in page]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--take', required=True)
    parser.add_argument('--cta-take')
    parser.add_argument('--project', default='book-hvtt-001-shorts')
    parser.add_argument('--episode', default='book-hvtt-001-overview')
    args = parser.parse_args()
    global HERE, AUD
    HERE, AUD = ROOT / 'scripts/projects' / args.project, ROOT / 'public' / args.project / 'voice-auditions'
    OUT = ROOT / 'src/projects' / args.project / 'shorts.json'
    lines = [l.strip() for l in (HERE / 'lines-clone.txt').read_text().splitlines() if l.strip()]
    cta_at = len(lines) - 1
    model = WhisperModel('medium', device='cpu', compute_type='int8', cpu_threads=4, download_root=str(ROOT / '.cache/whisper'))
    clips = []
    for i, text in enumerate(lines):
        take, part = (args.cta_take, 1) if i == cta_at and args.cta_take else (args.take, i + 1)
        dst, name = AUD / f'{take}-sang2', f'part-{part:02d}-sang2.wav'
        dst.mkdir(exist_ok=True)
        if (dst / name).exists():
            data, sr = sf.read(dst / name)
        else:
            data, sr = sf.read(AUD / take / f'part-{part:02d}-clone.wav')
            data = variants.shift(trim(data, sr), sr, 2)
            sf.write(dst / name, data, sr, subtype='PCM_24')
            manifest = dst / 'manifest.json'
            done = json.loads(manifest.read_text())['lines'] if manifest.exists() else []
            manifest.write_text(json.dumps({'take': dst.name, 'derivedFrom': take, 'pitchSemitones': 2, 'durationPreserved': True,
                'status': 'audition — chờ người dùng nghe chọn', 'lines': done + [text]}, ensure_ascii=False, indent=2) + '\n')
        dur = len(data) / sr
        print(f'{dst.name}/{name}', f'{dur:.2f}s')
        clips.append({'file': f'{args.project}/voice-auditions/{dst.name}/{name}', 'durationSeconds': round(dur, 3),
                      'words': words_of(model, data, sr, [{'text': text, 'startMs': 0, 'endMs': round(dur * 1000)}])})
    voice = json.loads((HERE / 'voice.json').read_text())
    ep1 = {v['id']: v for v in json.loads((ROOT / 'src/projects' / args.episode / 'body-takes.json').read_text())['voices']}
    shorts = []
    for k, sid in enumerate(voice['excerpts']):
        ex = voice['excerpts'][sid]
        take = ep1[ex['take']]
        data, sr = sf.read(ROOT / 'public' / take['file'])
        a, b = ex['fromSeconds'], ex['toSeconds']
        caps = [{'text': c['text'], 'startMs': c['startMs'] - a * 1000, 'endMs': c['endMs'] - a * 1000} for c in take['captions']
                if c['startMs'] >= a * 1000 - 5 and c['endMs'] <= b * 1000 + 5]
        print(sid, ex['take'], f'{a}–{b}s', len(caps), 'trang')
        own = [c for c in take['captions'] if c['endMs'] > a * 1000 + 50 and c['startMs'] < b * 1000 - 50]  # pages may start a little before the cut
        if own and all(c.get('words') for c in own):  # the episode's karaoke words inside the excerpt, shifted to it
            words = [{'text': w['text'], 'startMs': max(0, round(w['startMs'] - a * 1000)), 'endMs': min(round((b - a) * 1000), round(w['endMs'] - a * 1000))} for c in own for w in c['words']
                     if a * 1000 - 300 <= w['startMs'] < b * 1000 - 40]
        else:
            words = words_of(model, data[int(a * sr):int(b * sr)], sr, caps)
        excerpt = {'file': take['file'], 'fromSeconds': a, 'toSeconds': b, 'durationSeconds': round(b - a, 3), 'words': words}
        shorts.append({'id': sid, 'hook': clips[k], 'excerpt': excerpt, 'cta': clips[cta_at]})
    OUT.write_text(json.dumps({'take': args.take, 'ctaTake': args.cta_take or args.take, 'shorts': shorts}, ensure_ascii=False, indent=1) + '\n')
    print(OUT.relative_to(ROOT))


if __name__ == '__main__':
    main()
