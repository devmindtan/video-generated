"""Offline QA for know-when-to-quit: timeline vs narration files, captions vs script, duration window, music config.
Reads files only; renders nothing. Passing is technical, not a listening approval.
Usage: .venv/bin/python scripts/projects/know-when-to-quit/check.py [--write]   (--write records docs/projects/know-when-to-quit/qa.json)
"""
import json, sys
import numpy as np
from pathlib import Path
import soundfile as sf

ROOT = Path(__file__).resolve().parents[3]
SLUG = 'know-when-to-quit'
read = lambda rel: json.loads((ROOT / rel).read_text())


def main():
    timeline = read(f'src/projects/{SLUG}/timeline.json')
    captions = read(f'src/projects/{SLUG}/captions.json')
    audition = read(f'scripts/projects/{SLUG}/audition.json')
    scenes = read(f'scripts/projects/{SLUG}/scenes.json')
    meta = read(f'public/{SLUG}/audio/voice-metadata.json')
    music = read(f'src/projects/{SLUG}/music.json')
    s = timeline['scenes']
    assert len(s) == len(captions) == len(meta) == len(scenes) == 5
    assert 42 <= timeline['totalSeconds'] <= 48, f"{timeline['totalSeconds']}s is outside 42–48 s (production-spec.md)"
    t = s[0]['start']
    for scene, pages, m, clip in zip(s, captions, meta, scenes):
        assert abs(scene['start'] - t) < 0.01, 'scenes are back to back'
        t += scene['duration']
        info = sf.info(ROOT / 'public' / scene['audio'])
        assert abs(info.duration - scene['audioSeconds']) < 0.01 and scene['audioSeconds'] < scene['duration'], scene['id']
        assert m['pitchSemitones'] == 1 and m['durationPreserved'], 'one voice for the whole video'
        text = ' '.join(x['text'] for x in audition['sentences'] if x['scene'] == scene['scene'])
        assert ' '.join(p['text'] for p in pages) == text, f"{scene['id']}: captions must keep the script's words"
        assert all(0 <= p['startMs'] < p['endMs'] <= scene['duration'] * 1000 for p in pages), scene['id']
        assert all(a['endMs'] <= b['startMs'] for a, b in zip(pages, pages[1:])), scene['id']
        assert all(len(p['text']) <= 36 for p in pages), scene['id']
        assert clip['frames'] == [round(scene['start'] * 30), round((scene['start'] + scene['duration']) * 30) - 1]
    assert abs(t - timeline['totalSeconds']) < 0.01
    for key in ('speechVolume', 'pauseVolume', 'fadeInSeconds', 'fadeOutSeconds'):
        assert isinstance(music[key], (int, float)), f'music.json keeps {key}'
    assert (ROOT / 'public' / music['file']).exists()
    flagged = [m['scene'] for m in meta if m['accentFreeWordMatch'] < 0.98]
    if '--write' in sys.argv:
        peaks = [float(np.max(np.abs(sf.read(ROOT / 'public' / x['audio'])[0]))) for x in s]
        approvals = read(f'docs/projects/{SLUG}/approvals.json')
        clips = {k: v['clips'][-1] for k, v in approvals.get('scenes', {}).items() if v.get('clips')}
        qa = {'durationSeconds': timeline['totalSeconds'], 'allowedSeconds': [42, 48], 'dimensions': [1080, 1920], 'fps': timeline['fps'],
              'voice': 'Clone mushashi (VoxCPM2, máy GPU desktop-kndgm60) +1 bán cung, giữ thời lượng', 'narrationTempo': 1,
              'sceneSeconds': [x['duration'] for x in s], 'sceneTailSeconds': [round(x['duration'] - x['audioSeconds'], 3) for x in s],
              'voicePeakDbFS': round(20 * np.log10(max(peaks)), 2), 'accentFreeWordMatch': {m['scene']: m['accentFreeWordMatch'] for m in meta},
              'asrToneFlags': 'tiếc→tiết (1), giếng→diễn (3), xẻng→sẻng, rảnh→dành (5): ASR only, user heard the clips',
              'captionPages': sum(map(len, captions)), 'captionsKeepScriptWords': True,
              'music': {'file': music['file'], 'title': music['credit']['title'], 'artists': music['credit']['artists'], 'speechVolume': music['speechVolume'],
                        'pauseVolume': music['pauseVolume'], 'fadeInSeconds': music['fadeInSeconds'], 'fadeOutSeconds': music['fadeOutSeconds'], 'playbackRate': 1},
              'sfxEnabled': False, 'images': 'code-drawn SVG illustrations (5), no AI images', 'paidServiceCalls': 0,
              'sceneReview': {k: {'status': v['status'], 'decidedAt': v.get('decidedAt')} for k, v in clips.items()},
              'compositionRendered': False, 'reviewClipsRendered': sum(len(v['clips']) for v in approvals.get('scenes', {}).values()),
              'listeningReview': 'User marked every scene clip Đạt (voice, pictures, captions); the full composition is still to be watched in Studio (review-preview)'}
        (ROOT / f'docs/projects/{SLUG}/qa.json').write_text(json.dumps(qa, ensure_ascii=False, indent=2) + '\n')
    print(f"OK: {timeline['totalSeconds']} s, 5 cảnh, {sum(map(len, captions))} trang phụ đề. "
          f"Chưa nghe duyệt; cần nghe kỹ thanh điệu: {', '.join(flagged) or 'không có'}.")


if __name__ == '__main__':
    main()
