"""Build the 180s native Veo SFX stem, following the exact wide/close edit."""
import io
import json
from pathlib import Path
import subprocess
import runpy
import argparse
import numpy as np
import soundfile as sf

ROOT=Path(__file__).resolve().parents[3]
SRC=ROOT/'src/projects/tiny-dino-homecoming'
FF=ROOT/'node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg'
SR=24000


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--continuity',action='store_true',help='Build staged v3 stems without activating the runtime edit')
    args=parser.parse_args()
    chapters=json.loads((SRC/'chapters.json').read_text())
    clips=json.loads((SRC/'footage.json').read_text())
    captions=json.loads((SRC/'captions.json').read_text())
    edit=json.loads((SRC/'edit.json').read_text())
    if args.continuity:
        edit.update(continuityV3=True,sfxFile='tiny-dino-homecoming/audio/homecoming-continuity-sfx-v3.wav')
    plan=runpy.run_path(str(Path(__file__).with_name('edit-timing.py')))['shot_plan'](chapters,clips,edit)
    foley_sound=runpy.run_path(str(Path(__file__).with_name('foley.py')))['sound']
    cues=json.loads(Path(__file__).with_name('foley-v3.json' if edit.get('continuityV3') else 'foley.json').read_text())
    rng=np.random.default_rng(2048)
    mix=np.zeros((180*SR,2))
    times=np.arange(len(mix))/SR
    activity=np.zeros(len(mix))
    report=[]
    for chapter,group in zip(chapters,captions):
        for page in group:
            start=chapter['start']+page['startMs']/1000
            end=chapter['start']+page['endMs']/1000
            activity=np.maximum(activity,np.interp(times,[start-.15,start,end,end+.25],[0,1,1,0]))
    for shot in plan:
        key=shot['shot'];clip=clips[key];length=shot['duration'];rate=shot['playbackRate']
        assert clip, f'{key}: generate footage before SFX'
        filters=[]
        while rate<.5:
            filters.append('atempo=0.5');rate/=.5
        filters.append(f'atempo={rate}')
        encoded=subprocess.check_output([str(FF),'-v','error','-i',str(ROOT/'public'/clip['src']),'-vn','-af',','.join(filters),'-ar',str(SR),'-ac','2','-f','wav','-'])
        audio,_=sf.read(io.BytesIO(encoded),always_2d=True)
        count=round(length*SR)
        audio=np.pad(audio[:count],((0,max(0,count-len(audio))),(0,0)))
        rms=max(float(np.sqrt(np.mean(audio**2))),1e-9)
        gain=min(8,10**(edit['nativeTargetRmsDb']/20)/rms,edit['nativePeakLimit']/max(np.max(np.abs(audio)),1e-9))
        if key in edit.get('muteNativeShots',[]):gain=0
        local=np.arange(count)/SR
        fade=np.sin(np.pi/2*np.minimum(np.clip(local/shot['fadeIn'],0,1),np.clip((length-local)/shot['fadeOut'],0,1)))
        audio*=gain*fade[:,None]
        offset=round(shot['start']*SR)
        mix[offset:offset+count]+=audio[:len(mix)-offset]
        report.append({**shot,'sourceRmsDb':round(20*np.log10(rms),2),'gain':round(gain,3),'nativeMuted':bool(gain==0)})
    mix*=(edit['nativePauseGain']+(edit['nativeSpeechGain']-edit['nativePauseGain'])*activity)[:,None]
    foley=np.zeros_like(mix)
    events=[]
    by_key={shot['shot']:shot for shot in plan}
    for cue in cues:
        shot=by_key[cue['shot']]
        assert 0<=cue['sourceSecond']<clips[cue['shot']]['sourceDurationSeconds']
        at=shot['start']+cue['sourceSecond']/shot['playbackRate']
        sound=foley_sound(cue['kind'],rng)*cue['gain']
        offset=round(at*SR);count=min(len(sound),len(foley)-offset)
        pan=cue.get('pan',0)
        foley[offset:offset+count]+=sound[:count,None]*np.array([1-pan*.3,1+pan*.3])
        events.append({**cue,'timelineSecond':round(at,3)})
    # Gentle continuous texture bridges native ambience changes; no thunder sting.
    for start,length,level,cutoff,label in [(70,32,.01,1900,'stream'),(130,24,.021,4300,'rain')]:
        count=round(length*SR);local=np.arange(count)/SR
        freq=np.fft.rfftfreq(count,1/SR)
        noise=np.fft.irfft(np.fft.rfft(rng.normal(0,1,count))*np.exp(-(freq/cutoff)**2),n=count)
        noise*=level/max(np.sqrt(np.mean(noise**2)),1e-9)
        fade=np.minimum(np.clip(local/1.3,0,1),np.clip((length-local)/1.3,0,1))
        offset=round(start*SR)
        foley[offset:offset+count]+=noise[:,None]*fade[:,None]
        events.append({'kind':label,'timelineSecond':start,'duration':length})
    foley*=(edit['foleyPauseGain']+(edit['foleySpeechGain']-edit['foleyPauseGain'])*activity)[:,None]
    combined=mix+foley
    headroom_gain=min(1,.55/max(np.max(np.abs(combined)),1e-9))
    combined*=headroom_gain
    output=ROOT/'public/tiny-dino-homecoming/audio'
    sf.write(ROOT/'public'/edit['sfxFile'],combined,SR,subtype='PCM_16')
    sf.write(output/('homecoming-foley-v3.wav' if edit.get('continuityV3') else 'homecoming-foley-v2.wav'),foley*headroom_gain,SR,subtype='PCM_16')
    (output/('sfx-v3-check.json' if edit.get('continuityV3') else 'sfx-v2-check.json')).write_text(json.dumps({'source':'Native Veo ambience with equal-power audio overlaps + original action foley','durationSeconds':180,'peakDbFS':round(20*np.log10(max(np.max(np.abs(combined)),1e-9)),2),'headroomGain':headroom_gain,'shots':report,'events':events},ensure_ascii=False,indent=2)+'\n')
    credits=json.loads((output/'credits.json').read_text()) if (output/'credits.json').exists() else {}
    credits.update(sfx='Native generated clip audio plus original locally synthesized action foley; equal-power overlaps and narration ducking',runtimeSfx=edit['sfxFile'],legacySfx='homecoming-veo-sfx.wav and homecoming-sfx.wav retained; not used by the composition')
    (output/'credits.json').write_text(json.dumps(credits,ensure_ascii=False,indent=2)+'\n')
    print(f'{len(plan)} native tracks crossfaded; {len(events)} action/ambience cues; 180s SFX ready.')


if __name__=='__main__':main()
