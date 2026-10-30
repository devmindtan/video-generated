"""Layer licensed water recordings, with separate underwater/surface perspective.

Only the effects are filtered. Narration remains dry and intelligible.
Source provenance is in docs/projects/glowing-whale/sound-v2.md.
"""
from functools import lru_cache
from pathlib import Path
import numpy as np
import soundfile as sf
import soxr

ROOT = Path(__file__).resolve().parents[3]
SOURCES = ROOT/'public/glowing-whale/audio/sources'
SR = 24000


def rms(value):
    return float(np.sqrt(np.mean(value**2)))


def level(value, target, peak=.8):
    return value * min(target/max(rms(value),1e-9), peak/max(np.max(np.abs(value)),1e-9))


def edges(value, seconds=.025):
    value = value.copy()
    size = min(round(seconds*SR), len(value)//2)
    ramp = np.linspace(0,1,size)[:,None] if value.ndim == 2 else np.linspace(0,1,size)
    value[:size] *= ramp
    value[-size:] *= ramp[::-1]
    return value


def water_filter(value, cutoff=2300, highpass=65):
    frequencies = np.fft.rfftfreq(len(value),1/SR)
    response = (1-np.exp(-(frequencies/highpass)**2))*np.exp(-(frequencies/cutoff)**2)
    if value.ndim == 2:
        response = response[:,None]
    return np.fft.irfft(np.fft.rfft(value,axis=0)*response,n=len(value),axis=0)


@lru_cache(maxsize=12)
def recording(name):
    data, sr = sf.read(SOURCES/name, always_2d=True)
    data = soxr.resample(data,sr,SR)
    if data.shape[1] == 1:
        data = np.repeat(data,2,axis=1)
    assert np.isfinite(data).all() and len(data)>0
    return data


def put(dest, value, at, gain=1., pan=0.):
    offset = round(at*SR)
    end = min(len(dest), offset+len(value))
    assert offset >= 0
    weights = np.array([1-pan*.45,1+pan*.45])
    dest[offset:end] += value[:end-offset]*gain*weights


def effect(kind, seed):
    rng = np.random.default_rng(seed)
    if kind == 'bubble':
        # Several irregular real blubs; no single rising sine/beep.
        value = np.zeros((round(1.15*SR),2))
        for i, at in enumerate([0,.19,.43,.72]):
            name = f'bubbles-single{1+(seed+i)%3}.wav'
            sample = recording(name)
            speed = rng.uniform(.85,1.12)
            sample = soxr.resample(sample,SR*speed,SR)
            sample = edges(level(water_filter(sample,2700),.20,.75))
            put(value,sample,at,float(rng.uniform(.65,1)),float(rng.uniform(-.4,.4)))
        return level(value,.18,.85)
    if kind == 'swim':
        value = edges(level(water_filter(recording('swim.wav'),1800),.18,.8))
        # A small trail of air/water follows the fin stroke.
        tail = recording('bubbles-loop1-amp.wav')[:round(.9*SR)]
        tail = edges(level(water_filter(tail,2200),.05,.2),.08)
        put(value,tail,.42)
        return level(value,.17,.85)
    if kind == 'ripple':
        # Open-water ending: less muffled, small ripples rather than a big splash.
        value = np.zeros((round(1.3*SR),2))
        sample = edges(level(water_filter(recording('water.wav'),5500,100),.19,.75))
        put(value,sample,0,.8,-.2)
        put(value,sample,.32,.45,.25)
        put(value,sample,.72,.22,-.1)
        return level(value,.13,.75)
    if kind == 'glow':
        t = np.arange(round(1.3*SR))/SR
        tone = sum(np.sin(2*np.pi*f*t)*np.exp(-t*(3+i)) for i,f in enumerate([659.25,987.77,1318.51]))/3
        return np.repeat(edges(tone)[:,None],2,axis=1)
    raise ValueError(f'Unknown underwater effect: {kind}')


def ambience(seconds=60):
    length = round(seconds*SR)
    source = recording('kinoton-underwater-excerpt-60s.wav')
    assert len(source) >= length, 'Ambience source must contain all 60 seconds'
    filtered = water_filter(source[:length],1900,75)
    # A few loud field-recording transients must not dictate the entire bed's
    # level. Set a useful RMS, then gently control only those peaks.
    bed = filtered*(.038/max(rms(filtered),1e-9))
    bed = .14*np.tanh(bed/.14)
    t = np.arange(length)/SR
    # Slightly tighter/darker in the rocky passage; no dramatic sub-bass drone.
    passage = np.interp(t,[0,17,18,25,26,60],[1,1,.88,.88,1,1])
    # The final image is above water: cross out of the submerged sound field.
    perspective = np.interp(t,[0,52.8,53.6,60],[1,1,.3,.3])
    bed *= (passage*perspective)[:,None]
    # Sparse distant bubble trails fill action gaps without continuous boiling.
    for i, at in enumerate([1.6,10.6,19.2,28.2,37.6,46.5]):
        source = recording(f'bubbles-loop{1+i%2}-amp.wav')
        take = source[:round(2.5*SR)]
        take = edges(level(water_filter(take,1700),.012,.07),.24)
        put(bed,take,at,.85,(-1)**i*.35)
    return bed
