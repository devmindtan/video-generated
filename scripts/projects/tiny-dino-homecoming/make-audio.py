#!/usr/bin/env python3
"""Original 180s score and SFX; no external samples. Cues follow voice timings."""
from pathlib import Path
import json
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'public/tiny-dino-homecoming/audio'
SR = 24000
DURATION = 180
RNG = np.random.default_rng(819)


def add(dest, sound, start, gain=1., pan=0.):
    offset = round(start * SR)
    stop = min(len(dest), offset + len(sound))
    if offset < 0 or stop <= offset:
        return
    values = sound[:stop-offset] * gain
    dest[offset:stop, 0] += values * (1-pan*.35)
    dest[offset:stop, 1] += values * (1+pan*.35)


def note(freq, length, kind='mallet'):
    t = np.arange(round(length*SR))/SR
    if kind == 'strings':
        env = np.minimum(t/.65,1)*np.minimum((length-t)/.9,1)
        wave = np.sin(2*np.pi*freq*t)+.17*np.sin(2*np.pi*2.002*freq*t)+.06*np.sin(2*np.pi*3*freq*t)
    else:
        decay = 2.1 if kind == 'piano' else 5.5
        env = np.minimum(t/.008,1)*np.exp(-t*decay)*np.minimum((length-t)/.1,1)
        wave = np.sin(2*np.pi*freq*t)+.25*np.sin(2*np.pi*freq*2.01*t)+.08*np.sin(2*np.pi*freq*3.98*t)
    return wave*np.maximum(env,0)


def soft_noise(length, cutoff):
    size = round(length*SR)
    spectrum = np.fft.rfft(RNG.normal(0,1,size))
    frequencies = np.fft.rfftfreq(size,1/SR)
    sound = np.fft.irfft(spectrum*np.exp(-(frequencies/cutoff)**2), n=size)
    return sound/max(np.max(np.abs(sound)),1e-9)


def save(name, data, peak):
    data *= min(1,peak/max(np.max(np.abs(data)),1e-9))
    with wave.open(str(OUT/name),'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(np.round(data*32767).astype('<i2').tobytes())


def main():
    OUT.mkdir(parents=True,exist_ok=True)
    score = np.zeros((DURATION*SR,2))
    sfx = np.zeros_like(score)
    melody=[523.25,659.25,783.99,659.25,587.33,698.46,880,783.99]
    roots=[130.81,174.61,146.83,196]
    # Discovery and journey (chapters 1–6): playful wooden mallets.
    for step, start in enumerate(np.arange(0,130,.55)):
        root=roots[int(start//8)%4]
        if step%8<6:
            add(score,note(melody[(step+int(start//16))%8],1.2),start,.13,(-1)**step*.4)
        if step%2==0:
            add(score,note(root,.7),start,.1)
        t=np.arange(round(.075*SR))/SR
        add(score,soft_noise(.075,5000)*np.exp(-t*55),start,.015)
    # Rain chapter: spacious gentle piano with a warm string bed.
    for step,start in enumerate(np.arange(129.5,154,1.5)):
        add(score,note(melody[(step//2+2)%8]/2,3,'piano'),start,.11,(-1)**step*.35)
    for start in np.arange(130,154,7):
        for f in [130.81,164.81,196]:
            add(score,note(f,7.5,'strings'),start,.025)
    # Reunion: rising strings, sparkling mallets and a sustained final major chord.
    for step,start in enumerate(np.arange(154,177,.6)):
        add(score,note(melody[step%8],1.8),start,.10)
    for bar,start in enumerate(np.arange(154,174,6)):
        root=roots[bar%4]
        for ratio in [1,1.25,1.5,2]:
            add(score,note(root*ratio,6.8,'strings'),start,.055+bar*.009)
    for f in [130.81,164.81,196,261.63,523.25]:
        add(score,note(f,7,'strings'),173,.06)
    # Voice-bound cues; timing is regenerated whenever the story changes.
    story=json.loads((ROOT/'scripts/projects/tiny-dino-homecoming/story.json').read_text())
    captions=json.loads((ROOT/'src/projects/tiny-dino-homecoming/captions.json').read_text())
    def cue(index, phrase, fallback):
        for page in captions[index]:
            if phrase in page['text']:
                return story[index]['start']+page['endMs']/1000+.12
        return fallback
    def chime(at):
        for i,f in enumerate([1046.5,1318.5,1568]):
            add(sfx,note(f,1.5),at+i*.14,.2,(-1)**i*.4)
    for start in np.arange(2,33,.6):
        add(sfx,note(125,.13),start,.18,(-1)**int(start*10)*.2)
    chime(3)
    chime(78)
    chime(151)
    stream=soft_noise(40,2300)
    add(sfx,stream,35,.07)
    bounce_at=cue(4,'Búng lên',91)
    for i in range(3):
        t=np.arange(round(.65*SR))/SR
        bounce=np.sin(2*np.pi*(300*t-160*t*t))*np.exp(-t*5)
        add(sfx,bounce,bounce_at+i*1.2,.32)
    rain=soft_noise(24,6000)
    rain_t=np.arange(len(rain))/SR
    rain*=np.minimum(rain_t/2,1)*np.minimum((24-rain_t)/3,1)
    add(sfx,rain,130,.13)
    thunder=soft_noise(2.8,95)*np.sin(np.linspace(0,np.pi,round(2.8*SR)))**2
    add(sfx,thunder,130.2,.12)
    for at in np.arange(131,152,.28):
        add(sfx,note(900+RNG.uniform(0,500),.07),at,.025)
    running_at=cue(7,'chạy tới',164)
    for at in np.arange(running_at,min(176,running_at+2.5),.23):
        add(sfx,note(150,.12),at,.17)
    # A soft two-note cartoon coo for mother, rather than a frightening roar.
    for at,f in [(169,300),(169.3,380)]:
        add(sfx,note(f,.6,'piano'),at,.18)
    fade=np.ones(len(score)); fade[:SR]=np.linspace(0,1,SR);fade[-3*SR:]=np.linspace(1,0,3*SR)
    score*=fade[:,None];sfx*=fade[:,None]
    save('homecoming-score.wav',score,.62)
    save('homecoming-sfx.wav',sfx,.45)
    (OUT/'credits.json').write_text(json.dumps({'durationSeconds':180,'sampleRate':SR,'music':'Original procedural mallets, piano and strings; no external samples','sfx':'Original procedural footsteps, bounce, stream, rain, thunder, sparkle and coo','generator':'scripts/projects/tiny-dino-homecoming/make-audio.py'},indent=2)+'\n')
    print('Created original 180-second music and SFX stems.')


if __name__=='__main__':
    main()
