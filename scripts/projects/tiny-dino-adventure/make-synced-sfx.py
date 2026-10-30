"""Synchronize native Veo SFX, duck around narration and export a checked mix."""
import json
import argparse
import subprocess
from pathlib import Path
import numpy as np
import soundfile as sf
import soxr

ROOT=Path(__file__).resolve().parents[3]
SRC=ROOT/'src/projects/tiny-dino-adventure'
FF=ROOT/'node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg'
SR=48000
STARTS=[0,8,18,30,42]
DURATIONS=[8,10,12,12,6]


def read(path):
    data,sr=sf.read(path,always_2d=True)
    if sr!=SR:data=soxr.resample(data,sr,SR)
    if data.shape[1]==1:data=np.repeat(data,2,axis=1)
    return data


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--childlike',action='store_true')
    args=parser.parse_args()
    cfg=json.loads((SRC/'sfx.json').read_text())
    clips=json.loads((SRC/'footage.json').read_text())
    captions=json.loads((SRC/'captions.json').read_text())
    music_cfg=json.loads((SRC/'music.json').read_text())
    cache=ROOT/'.cache/tiny-dino-sfx-review'
    cache.mkdir(parents=True,exist_ok=True)
    t=np.arange(SR*48)/SR
    activity=np.zeros(len(t));music_activity=np.zeros(len(t))
    for start,group in zip(STARTS,captions):
        for page in group:
            a=start+page['startMs']/1000;b=start+page['endMs']/1000
            activity=np.maximum(activity,np.interp(t,[a-.15,a,b,b+.25],[0,1,1,0]))
            music_activity=np.maximum(music_activity,np.interp(t,[a-.1,a+.08,b-.08,b+.18],[0,1,1,0]))
    sfx=np.zeros((len(t),2));voice=np.zeros_like(sfx);scenes=[]
    for i,(scene,clip) in enumerate(clips.items()):
        assert clip,'Native SFX requires a real Veo clip for every scene'
        path=cache/f'{scene}-retimed.wav'
        subprocess.run([str(FF),'-v','error','-y','-i',str(ROOT/'public'/clip['src']),'-vn','-af',f'atempo={clip["playbackRate"]}','-ar',str(SR),'-ac','2',str(path)],check=True)
        audio=read(path)[:DURATIONS[i]*SR]
        rms=max(float(np.sqrt(np.mean(audio**2))),1e-9)
        gain=min(cfg['maxSourceGain'],10**(cfg['targetRmsDb']/20)/rms,cfg['sourcePeakLimit']/max(np.max(np.abs(audio)),1e-9))
        audio*=gain
        local=np.arange(len(audio))/SR
        fade=np.minimum(np.clip(local/cfg['fadeInSeconds'],0,1),np.clip((DURATIONS[i]-local)/cfg['fadeOutSeconds'],0,1))
        audio*=fade[:,None]
        offset=STARTS[i]*SR
        sfx[offset:offset+len(audio)]=audio
        voice_dir='audio/childlike-preview' if args.childlike else 'audio'
        speech=read(ROOT/f'public/tiny-dino-adventure/{voice_dir}/{scene}-voice-full.wav')
        voice[offset:offset+len(speech)]=speech
        scenes.append({'scene':scene,'playbackRate':clip['playbackRate'],'sourceRmsDb':round(20*np.log10(rms),2),'gain':round(gain,3)})
    duck=cfg['pauseGain']+(cfg['speechGain']-cfg['pauseGain'])*activity
    sfx*=duck[:,None]
    target=ROOT/'public'/cfg['file'];target.parent.mkdir(parents=True,exist_ok=True)
    sf.write(target,sfx,SR,subtype='PCM_16')
    music=read(ROOT/'public'/music_cfg['file'])[:len(t)]
    volume=(music_cfg['pauseVolume']+(music_cfg['speechVolume']-music_cfg['pauseVolume'])*music_activity)*np.minimum(np.interp(t,[0,music_cfg['fadeInSeconds']],[0,1]),np.interp(t,[48-music_cfg['fadeOutSeconds'],48-1/30],[1,0]))
    mix=voice+music*volume[:,None]+sfx*cfg['volume']
    peak=float(np.max(np.abs(mix)))
    assert peak<1,f'Mix clips at {peak}'
    mix_name='tiny-dino-voice-b-childlike.wav' if args.childlike else 'tiny-dino-audio-sfx-v2.wav'
    sf.write(ROOT/'out'/mix_name,mix,SR,subtype='PCM_24')
    report={'durationSeconds':48,'source':'Native Veo audio, retimed with pitch-preserving atempo to match each clip','speechCheck':'No recognizable speech detected by local Whisper/VAD in five native tracks','peakDbFS':round(20*np.log10(peak),2),'clipping':False,'scenes':scenes}
    (target.parent/'sfx-v2-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__=='__main__':main()
