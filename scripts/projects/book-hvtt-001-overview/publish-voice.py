"""Publish the picked body narration (user's cloned voice, +2 semitones) next to the intro/card/outro voices.

The user listened to the clone takes in Studio and accepted the patches (2026-11-03), so the body segments in
body-takes.json (`<segment>-sang2`) are copied to public/book-hvtt-001-overview/audio/<segment>-voice-full.wav
with their captions, and recorded in audio/voice-metadata.json and scripts/projects/.../voice.json `segments`
(same naming as 00-intro / 01-gioi-thieu-tap / 99-outro). A file that already exists with other content is moved
to audio/backups/ first. The video itself keeps reading body-takes.json; this is the published record the final
review lists. Run again after a segment is re-cloned and picked.
Usage: .venv/bin/python scripts/projects/book-hvtt-001-overview/publish-voice.py [--project <slug>]
"""
import hashlib, json, shutil, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]

def project_arg(default='book-hvtt-001-overview'):
    """Another episode of the series: --project <slug> (removed from argv before the script's own options)."""
    if '--project' in sys.argv:
        i = sys.argv.index('--project'); slug = sys.argv[i + 1]; del sys.argv[i:i + 2]; return slug
    return default


PROJECT = project_arg()
HERE = ROOT / 'scripts/projects' / PROJECT
AUDIO = ROOT / 'public' / PROJECT / 'audio'
VOICE = 'Giọng người dùng (clone) +2 bán cung'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    # Body segments, plus the episode-card hook voice from episode 3 on (card-takes.json, `01-gioi-thieu-tap-sang2`).
    takes = [t for name in ('body-takes.json', 'card-takes.json') if (ROOT / 'src/projects' / PROJECT / name).exists()
             for t in json.loads((ROOT / 'src/projects' / PROJECT / name).read_text())['voices']]
    AUDIO.mkdir(parents=True, exist_ok=True)
    meta_file, voice_file = AUDIO / 'voice-metadata.json', HERE / 'voice.json'
    meta, voice = (json.loads(meta_file.read_text()) if meta_file.exists() else []), json.loads(voice_file.read_text())
    for t in takes:
        if not t['id'].endswith('-sang2') or t['id'].startswith('25-'):
            continue
        seg = t['id'][:-len('-sang2')]
        src = ROOT / 'public' / t['file']
        out, caps = AUDIO / f'{seg}-voice-full.wav', AUDIO / f'{seg}-captions.json'
        if out.exists() and sha(out) != sha(src):
            (AUDIO / 'backups').mkdir(exist_ok=True)
            shutil.move(out, AUDIO / 'backups' / f'{seg}-voice-full-{time.strftime("%Y%m%dT%H%M%S")}.wav')
        shutil.copyfile(src, out)
        caps.write_text(json.dumps(t['captions'], ensure_ascii=False, indent=2) + '\n')
        digest = sha(out)
        entry = {'scene': seg, 'file': out.name, 'captionsFile': caps.name, 'voice': VOICE, 'sha256': digest,
                 'durationSeconds': round(t['durationSeconds'], 3), 'phraseRanges': t.get('phraseRanges', []), 'sourceTake': t['file']}
        meta = [m for m in meta if m.get('scene') != seg] + [entry]
        voice.setdefault('segments', {})[seg] = {'file': f'{PROJECT}/audio/{out.name}', 'sha256': digest, 'sourceTake': t['file']}
        print(f'{seg}: {entry["durationSeconds"]} s')
    meta.sort(key=lambda m: m['scene'])
    voice['segments'] = dict(sorted(voice['segments'].items()))
    meta_file.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + '\n')
    voice_file.write_text(json.dumps(voice, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
