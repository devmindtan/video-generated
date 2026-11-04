"""Build the body narration takes from every clone take that exists, then refresh body-takes.json.

For each segment (02–09, with 08e–08g): the sentences come from audition-<seg>.json; each sentence is taken from the newest
clone take that has exactly that text and passed check-tones.py (else simply the newest one), so repair
candidates can be cloned several times and the clean one wins; a pick in voice-picks.json (user listening) wins over both; assembled with the segment's pauses, raised +2
semitones (episode voice, duration preserved). Missing sentences are skipped until their take exists.
Never touches public/<slug>/audio/ (published voice) — publishing happens after the user listens.
Other episodes: --project <slug> (segments from scripts/projects/<slug>/segments.json, the card segment 01 is left out).
Usage: .venv/bin/python scripts/projects/book-hvtt-001-overview/build-body.py [--project <slug>]
"""
import json, re, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
TOOLS = Path(__file__).resolve().parent

def project_arg(default='book-hvtt-001-overview'):
    """Another episode of the series: --project <slug> (removed from argv before the script's own options)."""
    if '--project' in sys.argv:
        i = sys.argv.index('--project'); slug = sys.argv[i + 1]; del sys.argv[i:i + 2]; return slug
    return default


PROJECT = project_arg()
HERE = ROOT / 'scripts/projects' / PROJECT
PREFIX = '-'.join(PROJECT.split('-')[:2])  # book-hvtt, book-ah: names of the assembled takes
AUD = ROOT / 'public' / PROJECT / 'voice-auditions'
SEGMENTS = ['01b-cach-lam', '02-mo-chuyen', '03-cuon-sach', '04-soi-chi', '05-nhom-3a', '06-nhom-3b', '07-nhom-3c', '08-nhom-3d', '08e-diem-chua-dat', '08f-tong-ket', '08g-y-kien', '09-nhan-xet']
if (HERE / 'segments.json').exists():
    SEGMENTS = [s for s in json.loads((HERE / 'segments.json').read_text()).values() if not s.startswith('01-')]
py = str(ROOT / '.venv/bin/python')
MAX_PAUSE = .18  # pauses inside a sentence (user 2026-11-02: "chậm chậm, khoảng nghỉ lâu"; again after p9: "chưa liền mạch")
PAUSE_SCALE = .6  # lead-in, pauses between sentences and tail of each segment (audition-<seg>.json values × this)
# An episode may set its own pacing in scripts/projects/<slug>/pacing.json: maxPause, pauseScale, maxRate (slow
# sentences spoken faster than this, syllables per voiced second) and titlePause (seconds after short headings).
PACING = json.loads((HERE / 'pacing.json').read_text()) if (HERE / 'pacing.json').exists() else {}
MAX_PAUSE, PAUSE_SCALE = PACING.get('maxPause', MAX_PAUSE), PACING.get('pauseScale', PAUSE_SCALE)
MAX_RATE, TITLE_PAUSE = PACING.get('maxRate'), PACING.get('titlePause')
EDGE_RMS, MAX_SLOW = PACING.get('edgeRms'), PACING.get('maxSlow')  # trim near-silent breath at sentence edges (assemble-clone.py --edge-rms)


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
        own = PACING.get('segments', {}).get(seg, {})  # pacing.json "segments": {seg: {maxPause, maxRate, …}} for one part
        MAX_PAUSE, PAUSE_SCALE = own.get('maxPause', globals()['MAX_PAUSE']), own.get('pauseScale', globals()['PAUSE_SCALE'])
        MAX_RATE, TITLE_PAUSE = own.get('maxRate', globals()['MAX_RATE']), own.get('titlePause', globals()['TITLE_PAUSE'])
        EDGE_RMS, MAX_SLOW = own.get('edgeRms', globals()['EDGE_RMS']), own.get('maxSlow', globals()['MAX_SLOW'])
        choice = {t: texts[t] for t in need}
        choice['__maxPause'] = MAX_PAUSE  # part of the stamp, so a new setting rebuilds
        choice['__pauseScale'] = PAUSE_SCALE
        choice['__pauses'] = [x['pauseAfter'] for x in cfg['sentences']]  # a pause edit rebuilds too
        if MAX_RATE: choice['__maxRate'] = MAX_RATE
        if TITLE_PAUSE: choice['__titlePause'] = TITLE_PAUSE
        if EDGE_RMS: choice['__edgeRms'] = EDGE_RMS
        if MAX_SLOW: choice['__maxSlow'] = MAX_SLOW
        out = ROOT / 'public/voice-auditions' / f'{PREFIX}-{seg}-clone'  # 'clone' in the name keeps voice ids unsuffixed
        stamp = out / 'sources.json'
        if stamp.exists() and json.loads(stamp.read_text()) == choice:
            built.append(f'{PREFIX}-{seg}-clone-sang2'); print(f'{seg}: không đổi'); continue
        for d in [out, ROOT / 'public/voice-auditions' / f'{PREFIX}-{seg}-clone-sang2']:
            if d.exists(): shutil.rmtree(d)  # derived audio only; clone takes stay untouched
        pick = AUD.parent / f'.choice-{seg}.json'
        pick.write_text(json.dumps({k: v for k, v in choice.items() if not k.startswith('__')}, ensure_ascii=False))
        subprocess.run([py, str(TOOLS / 'assemble-clone.py'), '--project', PROJECT, '--config', f'audition-{seg}.json', '--clone', *used, '--choice', str(pick), '--out', out.name, '--id', seg, '--max-pause', str(MAX_PAUSE), '--pause-scale', str(PAUSE_SCALE), *(['--max-rate', str(MAX_RATE)] if MAX_RATE else []), *(['--title-pause', str(TITLE_PAUSE)] if TITLE_PAUSE else []), *(['--edge-rms', str(EDGE_RMS)] if EDGE_RMS else []), *(['--max-slow', str(MAX_SLOW)] if MAX_SLOW else [])], check=True)
        pick.unlink()
        subprocess.run([py, str(TOOLS / 'voice-variants.py'), '--source', out.name, '--semitones', '2'], check=True)
        stamp.write_text(json.dumps(choice, ensure_ascii=False, indent=1) + '\n')
        built.append(f'{PREFIX}-{seg}-clone-sang2'); print(f'{seg}: đã ghép từ {", ".join(used)}')
    if built:
        # Keep the other takes already listed (placeholder voices) so their voice ids stay available.
        listed = ROOT / 'src/projects' / PROJECT / 'body-takes.json'
        old = json.loads(listed.read_text())['takes'] if listed.exists() else []
        takes_out = old + [t for t in built if t not in old]
        subprocess.run([py, str(TOOLS / 'intro-bands.py'), '--take', *takes_out, '--out', f'src/projects/{PROJECT}/body-takes.json'], check=True)


if __name__ == '__main__':
    sys.exit(main())
