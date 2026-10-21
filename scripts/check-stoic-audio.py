#!/usr/bin/env python3
"""Build a listening copy of the current Remotion audio mix and check headroom."""
import json
from pathlib import Path
import wave
import numpy as np
import soundfile as sf
import soxr

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'out'
SR=24000
N=45*SR


def read(name):
    with wave.open(str(ROOT/'public/stoic/audio'/name),'rb') as w:
        assert w.getframerate()==SR
        values=np.frombuffer(w.readframes(w.getnframes()),'<i2').astype(np.float64)/32768
        return values.reshape(-1,w.getnchannels())


def read_music(path):
    values, sample_rate = sf.read(str(ROOT/'public'/path), dtype='float64', always_2d=True)
    if sample_rate != SR:
        values = soxr.resample(values, sample_rate, SR)
    if values.shape[1] == 1:
        values = np.repeat(values, 2, axis=1)
    return values[:, :2]


def main():
    OUT.mkdir(exist_ok=True)
    captions=json.loads((ROOT/'src/stoic-captions.json').read_text())
    story=json.loads((ROOT/'scripts/stoic-story.json').read_text())
    metadata=json.loads((ROOT/'public/stoic/audio/voice-metadata.json').read_text())
    music_config=json.loads((ROOT/'scripts/stoic-music.json').read_text())
    voice_files={item['scene']:item['file'] for item in metadata}
    voice=np.zeros((N,2))
    for scene in story:
        name=voice_files[scene['id']]
        data=read(name)
        assert len(data)==scene['duration']*SR, f'{name}: wrong duration'
        start=scene['start']*SR
        voice[start:start+len(data)]+=data
    ms=np.arange(N)/SR*1000
    speech=np.zeros(N)
    for scene,group in zip(story,captions):
        for caption in group:
            start=scene['start']*1000+caption['startMs']
            end=scene['start']*1000+caption['endMs']
            speech=np.maximum(speech,np.interp(ms,[start-180,start,end,end+420],[0,1,1,0]))
    video_start=music_config['videoStartSeconds']
    video_end=music_config['videoEndSeconds']
    fade=np.interp(
        ms/1000,
        [video_start,video_start+music_config['fadeInSeconds'],video_end-music_config['fadeOutSeconds'],video_end],
        [0,1,1,0],
    )
    volume=music_config['baseVolume']+(music_config['speechVolume']-music_config['baseVolume'])*speech
    source=read_music(music_config['file'])
    source_start=round(music_config['sourceStartSeconds']*SR)
    wanted=round((video_end-video_start)*SR)
    selected=source[source_start:source_start+wanted]
    assert len(selected)==wanted, 'Selected music range exceeds source duration'
    music=np.zeros((N,2))
    offset=round(video_start*SR)
    music[offset:offset+wanted]=selected
    music*= (fade*volume)[:,None]
    mix=voice+music
    peak=float(np.max(np.abs(mix)))
    assert peak<.99, f'Clipping risk: {peak}'
    rms=lambda x:round(float(20*np.log10(np.sqrt(np.mean(x*x))+1e-12)),2)
    frame_size=480
    mono=voice.mean(axis=1)
    frame_rms=np.sqrt(np.mean(mono[:len(mono)//frame_size*frame_size].reshape(-1,frame_size)**2,axis=1))
    longest=run=0
    for silent in frame_rms<.003:
        run=run+1 if silent else 0
        longest=max(longest,run)
    longest_gap=round(longest*frame_size/SR,3)
    assert longest_gap<1.0, f'Excessive voice gap: {longest_gap}s'
    stats={'durationSeconds':45,'sampleRate':SR,'musicFile':music_config['file'],'musicSourceStartSeconds':music_config['sourceStartSeconds'],'musicVideoRangeSeconds':[video_start,video_end],'peakDbFS':round(20*np.log10(peak),2),'voiceRmsDbFS':rms(voice),'musicRmsDbFS':rms(music),'mixRmsDbFS':rms(mix),'clipping':False,'longestLowLevelVoiceGapSeconds':longest_gap}
    with wave.open(str(OUT/'stoic-audio-review.wav'),'wb') as w:
        w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR)
        w.writeframes(np.round(mix*32767).astype('<i2').tobytes())
    (OUT/'stoic-audio-check.json').write_text(json.dumps(stats,indent=2)+'\n')
    print(json.dumps(stats,indent=2))

if __name__=='__main__':main()
