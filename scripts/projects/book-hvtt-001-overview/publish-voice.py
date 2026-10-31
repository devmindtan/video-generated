"""Copy the voice takes the user picked into the project's audio folder under the channel's naming.

One voice for the whole episode (user 2026-10-31): every segment must come from the same source voice and
processing (here: clone of the user's own voice, +1 semitone). Files follow the existing convention
public/<slug>/audio/<NN-segment>-voice-full.wav with captions beside them and voice-metadata.json;
scripts/projects/<slug>/voice.json records the chosen voice. Audition takes are copied, never moved.
Usage: .venv/bin/python scripts/projects/book-hvtt-001-overview/publish-voice.py
"""
import hashlib, json, shutil, time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SLUG = 'book-hvtt-001-overview'
AUDIO = ROOT / 'public' / SLUG / 'audio'
# segment id -> (audition take folder under public/voice-auditions, voice id in that take)
SELECTED = {
    '00-intro': ('book-hvtt-intro-clone-v4a-sang1', 'clone-ban-v4a-sang1'),
    # The published take still says "comment". audition-outro.json contains the desired "bình luận" wording,
    # but do not point this publisher at a replacement until that take exists and the user has listened to it.
    '99-outro': ('book-hvtt-outro-clone-v1-sang1', 'outro-ban-sang1'),
}
VOICE = {'name': 'Giọng người dùng (clone) +1 bán cung', 'option': 2, 'engine': 'VoxCPM2 qua VoiceStudio (CPU, local)',
         'reference': '.voicestudio/data/references/f78fa36e61f957c5.wav', 'consent': 'self', 'pitchSemitones': 1,
         'processing': 'clone từng câu; ghép bằng assemble-clone.py; +1 bán cung giữ thời lượng (voice-variants.py)'}

sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()


def main():
    AUDIO.mkdir(parents=True, exist_ok=True)
    segments, catalog = [], []
    for seg, (take, vid) in SELECTED.items():
        folder = ROOT / 'public/voice-auditions' / take
        manifest = json.loads((folder / 'manifest.json').read_text())
        v = next(x for x in manifest['voices'] if x['id'] == vid)
        if v.get('pitchSemitones') != VOICE['pitchSemitones']:
            raise RuntimeError(f'{seg}: {vid} is not the episode voice (+{VOICE["pitchSemitones"]} semitone); keep one voice per episode')
        wav, caps = AUDIO / f'{seg}-voice-full.wav', AUDIO / f'{seg}-captions.json'
        for src, dest in [(folder / v['file'], wav), (folder / v['captionsFile'], caps)]:
            if dest.exists() and sha(dest) != sha(src):
                # Script changed for this segment: keep the previous file in audio/backups before replacing it.
                backup = AUDIO / 'backups' / f'{dest.stem}-{time.strftime("%Y%m%d-%H%M%S")}{dest.suffix}'
                backup.parent.mkdir(exist_ok=True)
                shutil.copy2(dest, backup)
                print(f'backup: {backup.relative_to(ROOT)}')
            shutil.copy2(src, dest)
        record = {'scene': seg, 'file': wav.name, 'captionsFile': caps.name, 'voice': VOICE['name'], 'sha256': sha(wav),
                  'durationSeconds': v['durationSeconds'], 'phraseRanges': v.get('phraseRanges'), 'sourceTake': f'voice-auditions/{take}/{v["file"]}'}
        segments.append(record)
        catalog.append({'id': seg, 'name': f"{VOICE['name']} · {seg}", 'file': wav.name, 'captionsFile': caps.name, 'status': 'ready',
                        'durationSeconds': v['durationSeconds'], 'phraseRanges': v.get('phraseRanges')})
    (AUDIO / 'voice-metadata.json').write_text(json.dumps(segments, ensure_ascii=False, indent=2) + '\n')
    # Catalog-shaped manifest so intro-bands.py can read the selected segments like an audition take.
    (AUDIO / 'manifest.json').write_text(json.dumps({'title': f'{SLUG} — giọng đã chọn', 'config': {'title': 'giọng đã chọn'}, 'voices': catalog},
                                                    ensure_ascii=False, indent=2) + '\n')
    (ROOT / 'scripts/projects' / SLUG / 'voice.json').write_text(json.dumps({'voice': VOICE['name'], **VOICE, 'selection': 'Người dùng chọn 2026-10-31: clone giọng của mình, +1 bán cung; dùng cho mọi đoạn của tập',
        'pending': 'Outro hiện vẫn nói “comment”; script đích đã đổi thành “bình luận”. Chỉ thay take sau khi người dùng nghe duyệt.',
        'segments': {s['scene']: {'file': f"{SLUG}/audio/{s['file']}", 'sha256': s['sha256'], 'sourceTake': s['sourceTake']} for s in segments}},
        ensure_ascii=False, indent=2) + '\n')
    print('\n'.join(f"{s['scene']}: {s['file']} ({s['durationSeconds']} s)" for s in segments))


if __name__ == '__main__':
    main()
