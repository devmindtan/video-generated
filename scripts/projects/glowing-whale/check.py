"""Verify assets and estimate the same linear audio mix as Studio, without rendering."""
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import numpy as np
import soundfile as sf
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT/'src/projects/glowing-whale'
PUBLIC = ROOT/'public/glowing-whale'
SR = 24000


def load(path):
    return json.loads(path.read_text())


def main():
    spec = importlib.util.spec_from_file_location('veo', ROOT/'scripts/shared/make-veo.py')
    veo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(veo)
    scenes = load(SRC/'scenes.json')
    story = load(ROOT/'scripts/projects/glowing-whale/story.json')
    clips = load(SRC/'footage.json')
    takes = load(SRC/'takes.json')
    captions = load(SRC/'captions.json')
    metadata = load(PUBLIC/'audio/voice-metadata.json')
    assert len(scenes) == len(story) == len(captions) == len(metadata) == 7
    voice = np.zeros((60*SR, 2))
    activity = np.zeros(len(voice))
    t = np.arange(len(voice))/SR
    clock = np.floor(t*30)/30
    probes = []
    for index, (scene, authored, pages, meta) in enumerate(zip(scenes, story, captions, metadata)):
        assert scene['start'] == authored['start']
        assert scene['duration'] == authored['duration']
        assert scene['start'] == (0 if index == 0 else scenes[index-1]['start']+scenes[index-1]['duration'])
        assert ' '.join(c['text'] for c in pages) == authored['text']
        assert meta['wordMatchRatio'] >= .88
        assert meta['tailSilenceSeconds'] >= .25
        take = takes.get(scene['id'],scene['id'])
        with Image.open(PUBLIC/'images'/f'{take}.png') as image:
            assert abs(image.width/image.height - 9/16) < .02
        clip = clips.get(take)
        assert clip, f"Missing real-motion footage: {scene['id']}"
        path = ROOT/'public'/clip['src']
        probe = veo.probe(path)
        handle = .3 if index < 6 else 0
        assert (scene['duration']+handle)*clip['playbackRate'] <= probe['durationSeconds']+.001
        assert .85 <= clip['playbackRate'] <= 1
        assert abs(probe['width']/probe['height']-9/16) < .02
        # Decode original source frames only; never render composition stills.
        frames = []
        for second in [1, 4, 6.8]:
            png = subprocess.check_output([str(veo.FFMPEG), '-v', 'error', '-ss', str(second), '-i', str(path), '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'])
            with Image.open(io.BytesIO(png)) as frame:
                frames.append(np.asarray(frame.resize((180,320)).convert('RGB'),dtype=np.float32))
        delta = [float(np.mean(np.abs(a-b))) for a,b in zip(frames,frames[1:])]
        assert min(delta) > .25, f"Potential frozen footage: {scene['id']}"
        probes.append(dict(scene=scene['id'], motionMeanDelta=[round(d,2) for d in delta], **probe))
        filename = scene['id']+'-voice-full.wav'
        original, sample_rate = sf.read(PUBLIC/'audio'/filename)
        child, child_sr = sf.read(PUBLIC/'audio/childlike'/filename)
        assert sample_rate == child_sr == SR and len(original) == len(child) == scene['duration']*SR
        offset = scene['start']*SR
        voice[offset:offset+len(child)] = child[:, None]
        previous = 0
        for page in pages:
            assert previous <= page['startMs'] < page['endMs'] <= scene['duration']*1000
            previous = page['endMs']
            start = scene['start'] + page['startMs']/1000
            end = scene['start'] + page['endMs']/1000
            activity = np.maximum(activity, np.interp(clock, [start-.1, start+.06, end-.04, end+.16], [0,1,1,0]))
    assert scenes[-1]['start']+scenes[-1]['duration'] == 60
    music = load(SRC/'music.json')
    sfx_config = load(SRC/'sfx.json')
    score, sr = sf.read(ROOT/'public'/music['file'])
    foley, fsr = sf.read(ROOT/'public'/sfx_config['file'])
    assert sr == fsr == SR and score.shape == foley.shape == voice.shape
    fade = np.minimum(np.interp(clock,[0,music['fadeInSeconds']],[0,1]),np.interp(clock,[60-music['fadeOutSeconds'],60-1/30],[1,0]))
    score *= ((music['pauseVolume']-(music['pauseVolume']-music['speechVolume'])*activity)*fade)[:, None]
    foley *= sfx_config['volume']
    peak = float(np.max(np.abs(voice+score+foley)))
    assert peak < .95, f'Mix needs headroom: {peak}'
    mask = np.max(np.abs(voice), axis=1) > .01
    vrms = np.sqrt(np.mean(voice[mask]**2))
    mrms = np.sqrt(np.mean(score[mask]**2))
    margin = float(20*np.log10(vrms/max(mrms,1e-9)))
    assert margin > 15, f'Music obscures speech: {margin:.2f}dB'
    sfx_rms=np.sqrt(np.mean(foley[mask]**2))
    sfx_margin=float(20*np.log10(vrms/max(sfx_rms,1e-9)))
    assert 5 < sfx_margin < 16, f'Water SFX too quiet or obscures voice: {sfx_margin:.2f}dB'
    bed,bed_sr=sf.read(ROOT/'public'/sfx_config['ambienceFile'])
    assert bed_sr==SR and bed.shape==voice.shape
    bed_levels=[]
    for scene in scenes[:6]:
        chunk=bed[(scene['start']+1)*SR:(scene['start']+scene['duration']-1)*SR]
        level=float(20*np.log10(max(np.sqrt(np.mean(chunk**2)),1e-9)))
        assert level > -38, f'Underwater ambience inaudible in {scene["id"]}: {level:.2f}dBFS'
        bed_levels.append(round(level,2))
    report = {'durationSeconds':60,'compositionSize':[1080,1920],'footage':probes,'voice':'B — Trúc Ly +2.5 semitones','minimumWordMatch':min(m['wordMatchRatio'] for m in metadata),'estimatedMixPeakDbfs':round(20*np.log10(peak),2),'musicBelowVoiceDb':round(margin,2),'sfxBelowVoiceDb':round(sfx_margin,2),'underwaterBedRmsDbfsByScene':bed_levels,'sfxCues':len(load(ROOT/'public'/sfx_config['timingFile'])),'nativeVeoAudioMuted':True,'compositionRendered':False}
    (PUBLIC/'audio/check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__ == '__main__':
    main()
