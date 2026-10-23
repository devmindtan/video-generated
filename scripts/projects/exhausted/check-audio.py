#!/usr/bin/env python3
"""Build and validate the healing-video audio mix from its authored timeline."""
import json
from pathlib import Path
import wave
import numpy as np
import soundfile as sf
import soxr

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'out'
SR=24000

def read_voice(path):
    with wave.open(str(path),'rb') as wav:
        assert wav.getframerate()==SR
        values=np.frombuffer(wav.readframes(wav.getnframes()),'<i2').astype(np.float64)/32768
        values=values.reshape(-1,wav.getnchannels())
        return np.repeat(values,2,axis=1) if values.shape[1]==1 else values[:,:2]

def read_music(path):
    values,sample_rate=sf.read(str(path),dtype='float64',always_2d=True)
    if sample_rate!=SR:values=soxr.resample(values,sample_rate,SR)
    if values.shape[1]==1:values=np.repeat(values,2,axis=1)
    return values[:,:2]

def main():
    OUT.mkdir(exist_ok=True)
    story=json.loads((ROOT/'scripts/projects/exhausted/story.json').read_text())
    cursor=0
    for scene in story:
        assert scene['start']==cursor,'Scenes must be contiguous and ordered'
        cursor+=scene['duration']
    duration=cursor
    sample_count=duration*SR
    metadata=json.loads((ROOT/'public/exhausted/audio/voice-metadata.json').read_text())
    music_config=json.loads((ROOT/'src/projects/exhausted/music.json').read_text())
    assert music_config['videoStartSeconds']==0
    assert music_config['videoEndSeconds']==duration
    files={item['scene']:item['file'] for item in metadata}
    voice=np.zeros((sample_count,2))
    for scene in story:
        data=read_voice(ROOT/'public/exhausted/audio'/files[scene['id']])
        assert len(data)==scene['duration']*SR
        start=scene['start']*SR
        voice[start:start+len(data)]+=data
    seconds=np.arange(sample_count)/SR
    cfg=music_config
    captions=json.loads((ROOT/'src/projects/exhausted/captions.json').read_text())
    activity=np.zeros(sample_count)
    for scene,group in zip(story,captions):
        for caption in group:
            start=scene['start']+caption['startMs']/1000
            end=scene['start']+caption['endMs']/1000
            activity=np.maximum(activity,np.interp(seconds,[start-.12,start+.12,end-.12,end+.12],[0,1,1,0]))
    volume=cfg['pauseVolume']-(cfg['pauseVolume']-cfg['speechVolume'])*activity
    volume*=np.minimum(np.interp(seconds,[0,cfg['fadeInSeconds']],[0,1]),np.interp(seconds,[duration-cfg['fadeOutSeconds'],duration],[1,0]))
    source=read_music(ROOT/'public'/cfg['file'])
    source_start=round(cfg['sourceStartSeconds']*SR)
    selected=source[source_start:source_start+sample_count]
    assert len(selected)==sample_count
    music=selected*volume[:,None]
    mix=voice+music
    peak=float(np.max(np.abs(mix)))
    assert peak<.99,f'Clipping risk: {peak}'
    rms=lambda value:round(float(20*np.log10(np.sqrt(np.mean(value*value))+1e-12)),2)
    stats={
      'durationSeconds':duration,
      'sampleRate':SR,
      'musicFile':cfg['file'],
      'musicSourceStartSeconds':cfg['sourceStartSeconds'],
      'musicSpeechVolume':cfg['speechVolume'],
      'musicPauseVolume':cfg['pauseVolume'],
      'musicFadeInSeconds':cfg['fadeInSeconds'],
      'musicFadeOutSeconds':cfg['fadeOutSeconds'],
      'voiceRmsDbFS':rms(voice),
      'musicRmsDbFS':rms(music),
      'mixRmsDbFS':rms(mix),
      'peakDbFS':round(20*np.log10(peak),2),
      'musicVolumeAutomation':'frame-synced ducking under captions; +0.05 in reflective pauses',
      'clipping':False,
    }
    with wave.open(str(OUT/'exhausted-audio-review.wav'),'wb') as wav:
        wav.setnchannels(2);wav.setsampwidth(2);wav.setframerate(SR)
        wav.writeframes(np.round(mix*32767).astype('<i2').tobytes())
    report=json.dumps(stats,indent=2)+'\n'
    (OUT/'exhausted-audio-check.json').write_text(report)
    project_report=ROOT/'projects/StoicExhausted/exhausted-audio-check.json'
    project_report.parent.mkdir(parents=True,exist_ok=True)
    project_report.write_text(report)
    print(json.dumps(stats,indent=2))

if __name__=='__main__':main()
