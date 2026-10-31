"""Build the body narration takes from every clone take that exists, then refresh body-takes.json.

For each segment (02–09): the sentences come from audition-<seg>.json; each sentence is taken from the newest
clone take that has exactly that text and passed check-tones.py (else simply the newest one), so repair
candidates can be cloned several times and the clean one wins; a pick in voice-picks.json (user listening) wins over both; assembled with the segment's pauses, raised +2
semitones (episode voice, duration preserved). Missing sentences are skipped until their take exists.
Never touches public/<slug>/audio/ (published voice) — publishing happens after the user listens.
Usage: .venv/bin/python scripts/projects/book-hvtt-001-overview/build-body.py
"""
import json, re, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
AUD = ROOT / 'public/book-hvtt-001-overview/voice-auditions'
SEGMENTS = ['02-mo-chuyen', '03-cuon-sach', '04-soi-chi', '05-nhom-3a', '06-nhom-3b', '07-nhom-3c', '08-nhom-3d', '09-nhan-xet']
py = str(ROOT / '.venv/bin/python')


def clone_takes():
    takes = []
    for d in AUD.iterdir():
        m = d / 'manifest.json'
        if m.exists() and json.loads(m.read_text()).get('files'):
            takes.append((m.stat().st_mtime, d.name))
    return [name for _, name in sorted(takes)]


def clean(row):
    # Tone-check verdict for one sentence; numerals the ASR writes as digits ("năm mươi" → "50") are not errors.
    return not row['toneDiffs'] and all(re.fullmatch(r'[\d\s]*', got) for _, got in row['wordDiffs'])


def main():
    takes = clone_takes()
    texts, passed = {}, {}  # text → newest take; text → newest take whose tone check passed (repairs: several candidates)
    for t in takes:
        check = AUD / t / 'tone-check.json'
        verdict = {r['text'].strip(): clean(r) for r in json.loads(check.read_text())} if check.exists() else {}
        for f in json.loads((AUD / t / 'manifest.json').read_text())['files']:
            texts[f['text'].strip()] = t
            if verdict.get(f['text'].strip()): passed[f['text'].strip()] = t
    texts.update(passed)
    picks = HERE / 'voice-picks.json'  # the user's listening picks win over the tone check (review-page.py)
    if picks.exists():
        texts.update({k.strip(): v for k, v in json.loads(picks.read_text()).items() if (AUD / v / 'manifest.json').exists()})
    built = []
    for seg in SEGMENTS:
        cfg = json.loads((HERE / f'audition-{seg}.json').read_text())
        need = [s['text'].strip() for s in cfg['sentences']]
        if not all(t in texts for t in need):
            print(f'{seg}: chờ {sum(t not in texts for t in need)}/{len(need)} câu'); continue
        used = sorted({texts[t] for t in need}, key=takes.index)
        choice = {t: texts[t] for t in need}
        out = ROOT / 'public/voice-auditions' / f'book-hvtt-{seg}-clone'  # 'clone' in the name keeps voice ids unsuffixed
        stamp = out / 'sources.json'
        if stamp.exists() and json.loads(stamp.read_text()) == choice:
            built.append(f'book-hvtt-{seg}-clone-sang2'); print(f'{seg}: không đổi'); continue
        for d in [out, ROOT / 'public/voice-auditions' / f'book-hvtt-{seg}-clone-sang2']:
            if d.exists(): shutil.rmtree(d)  # derived audio only; clone takes stay untouched
        pick = AUD.parent / f'.choice-{seg}.json'
        pick.write_text(json.dumps(choice, ensure_ascii=False))
        subprocess.run([py, str(HERE / 'assemble-clone.py'), '--config', f'audition-{seg}.json', '--clone', *used, '--choice', str(pick), '--out', out.name, '--id', seg], check=True)
        pick.unlink()
        subprocess.run([py, str(HERE / 'voice-variants.py'), '--source', out.name, '--semitones', '2'], check=True)
        stamp.write_text(json.dumps(choice, ensure_ascii=False, indent=1) + '\n')
        built.append(f'book-hvtt-{seg}-clone-sang2'); print(f'{seg}: đã ghép từ {", ".join(used)}')
    if built:
        subprocess.run([py, str(HERE / 'intro-bands.py'), '--take', *built, '--out', 'src/projects/book-hvtt-001-overview/body-takes.json'], check=True)


if __name__ == '__main__':
    sys.exit(main())
