"""Original score and source-timed underwater SFX from licensed water recordings.

No native Veo dialogue, MP4 exports or composition rendering.
"""
import argparse
import json
from pathlib import Path
import numpy as np
import soundfile as sf
from underwater import ambience, effect

ROOT = Path(__file__).resolve().parents[3]
PUBLIC = ROOT / 'public/glowing-whale/audio'
SR = 24000
DURATION = 60


def add(dest, value, at, gain=1., pan=0.):
    offset = round(at * SR)
    end = min(len(dest), offset + len(value))
    assert offset >= 0
    dest[offset:end, 0] += value[:end-offset] * gain * (1-pan*.4)
    dest[offset:end, 1] += value[:end-offset] * gain * (1+pan*.4)


def note(frequency, length, pad=False):
    t = np.arange(round(length * SR)) / SR
    envelope = np.minimum(t/(.35 if pad else .012), 1) * np.minimum((length-t)/.3, 1)
    if not pad:
        envelope *= np.exp(-t*3.7)
    return (np.sin(2*np.pi*frequency*t) + .17*np.sin(2*np.pi*frequency*2.01*t)) * envelope


def sound(kind, seed):
    rng = np.random.default_rng(seed)
    length = {'bubble': .45, 'swim': 1.1, 'glow': 1.5, 'splash': 1.5}[kind]
    t = np.arange(round(length * SR)) / SR
    if kind == 'bubble':
        frequency = 340 + 750*(t/length)**2
        value = np.sin(2*np.pi*np.cumsum(frequency)/SR) * np.exp(-t*11)
    elif kind == 'glow':
        value = sum(note(f, length) for f in [659.25, 987.77, 1318.51])/3
    else:
        noise = rng.normal(0, 1, len(t))
        frequencies = np.fft.rfftfreq(len(t), 1/SR)
        value = np.fft.irfft(np.fft.rfft(noise) * np.exp(-(frequencies/(2000 if kind == 'splash' else 1000))**2), n=len(t))
        value *= np.sin(np.pi*t/length)**2
        if kind == 'splash':
            value *= np.exp(-t*2)
    value *= np.minimum(t/.02, 1) * np.minimum((length-t)/.08, 1)
    return value / max(np.max(np.abs(value)), 1e-9)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sfx-only',action='store_true',help='Do not replace the existing score')
    args = parser.parse_args()
    PUBLIC.mkdir(parents=True, exist_ok=True)
    score = np.zeros((DURATION*SR, 2))
    sfx = np.zeros_like(score)
    roots = [130.81, 174.61, 146.83, 196.]
    melody = [523.25, 659.25, 783.99, 987.77, 783.99, 659.25]
    for step, at in enumerate(np.arange(0, 57, .625)):
        # Less busy while the fish are lost, then open into a hopeful rescue.
        quiet = 17 <= at < 26
        if not quiet or step % 3 == 0:
            add(score, note(melody[(step+step//12)%len(melody)], 1.7), at, .11 if not quiet else .055, (-1)**step*.45)
        if step % 4 == 0:
            add(score, note(roots[int(at//5)%4], 2.4), at, .08)
    for at in np.arange(0, 56, 5):
        root = roots[int(at//5)%4]
        for ratio in [1, 1.25, 1.5]:
            add(score, note(root*ratio, 5.5, True), at, .017)
    for f in [130.81, 164.81, 196., 523.25, 659.25]:
        add(score, note(f, 4., True), 56, .035)
    manifest = json.loads((ROOT/'src/projects/glowing-whale/footage.json').read_text())
    scenes = json.loads((ROOT/'src/projects/glowing-whale/scenes.json').read_text())
    takes = json.loads((ROOT/'src/projects/glowing-whale/takes.json').read_text())
    cues = json.loads((ROOT/'scripts/projects/glowing-whale/foley.json').read_text())
    mapped = []
    for index, cue in enumerate(cues):
        scene = next(s for s in scenes if s['id'] == cue['scene'])
        clip = manifest.get(takes.get(scene['id'], scene['id']))
        rate = clip['playbackRate'] if clip else min(1, 8/(scene['duration'] + (.3 if scene['start'] < 53 else 0)))
        at = scene['start'] + cue['sourceSecond'] / rate
        value = effect(cue['kind'],4260+index)
        # The recordings are stereo; preserve their water texture and width.
        offset = round(at*SR)
        end = min(len(sfx),offset+len(value))
        sfx[offset:end] += value[:end-offset]*cue['gain']*np.array([1-cue.get('pan',0)*.4,1+cue.get('pan',0)*.4])
        mapped.append(dict(cue, atSeconds=round(at, 4), playbackRate=rate))
    t = np.arange(len(score))/SR
    bed = ambience(DURATION)
    caps = json.loads((ROOT/'src/projects/glowing-whale/captions.json').read_text())
    activity = np.zeros(len(t))
    for scene, pages in zip(scenes, caps):
        for p in pages:
            start = scene['start'] + p['startMs']/1000
            end = scene['start'] + p['endMs']/1000
            activity = np.maximum(activity, np.interp(t, [start-.1, start+.06, end-.04, end+.16], [0,1,1,0]))
    # Modest ducking keeps water audible under narration, rather than removing it.
    sfx *= (1-.18*activity[:, None])
    bed *= (1-.15*activity[:, None])
    fade = np.minimum(1, np.minimum(t/.35, (DURATION-t)/.9))
    score *= fade[:, None]
    sfx *= fade[:, None]
    bed *= fade[:, None]
    score *= min(1, .46/max(np.max(np.abs(score)), 1e-9))
    # Tame isolated water transients, not the whole ambience bed: a single pop
    # must not turn down 60 seconds of underwater atmosphere.
    sfx = .23*np.tanh(sfx/.23)
    combined = sfx+bed
    master = min(1,.38/max(np.max(np.abs(combined)),1e-9))
    if not args.sfx_only:
        sf.write(PUBLIC/'ocean-wonder-score.wav', score, SR, subtype='PCM_16')
    sf.write(PUBLIC/'ocean-underwater-sfx-v2.wav',combined*master,SR,subtype='PCM_16')
    sf.write(PUBLIC/'ocean-underwater-ambience-v2.wav',bed*master,SR,subtype='PCM_16')
    sf.write(PUBLIC/'ocean-water-actions-v2.wav',sfx*master,SR,subtype='PCM_16')
    (PUBLIC/'foley-timing-v2.json').write_text(json.dumps(mapped, ensure_ascii=False, indent=2)+'\n')
    print(f'60s underwater SFX v2: field ambience + {len(mapped)} recorded water cues. No video rendered.')


if __name__ == '__main__':
    main()
