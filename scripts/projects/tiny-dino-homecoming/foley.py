"""Original restrained cartoon foley; deterministic and independent of the score."""
import numpy as np

SR=24000


def sound(kind, rng):
    lengths={'crack':.16,'shell':.3,'step':.18,'sparkle':1.1,'flutter':.65,'slide':1.4,'petals':.45,'bounce':.5,'landing':.3,'leaf':.7}
    length=lengths[kind]
    t=np.arange(round(length*SR))/SR
    noise=rng.normal(0,1,len(t))
    frequency=np.fft.rfftfreq(len(t),1/SR)
    cutoff={'crack':4500,'shell':3200,'step':700,'flutter':2200,'slide':2500,'petals':1800,'landing':550,'leaf':1800}.get(kind,2400)
    noise=np.fft.irfft(np.fft.rfft(noise)*np.exp(-(frequency/cutoff)**2),n=len(t))
    noise/=max(np.max(np.abs(noise)),1e-9)
    if kind=='sparkle':
        value=sum(np.sin(2*np.pi*f*t)*np.exp(-t*(5+i)) for i,f in enumerate([1046.5,1568,2093]))/3
    elif kind=='bounce':
        # Small elastic pitch bend, not a loud comedy spring.
        value=np.sin(2*np.pi*(220*t+150*(1-np.exp(-t*9))/9))*np.exp(-t*9)
        value+=noise*.12*np.exp(-t*18)
    elif kind in ('step','landing'):
        value=(noise*.65+np.sin(2*np.pi*110*t)*.35)*np.exp(-t*28)
    elif kind in ('crack','shell'):
        value=noise*np.exp(-t*34)*(1+.3*np.sin(t*170))
    elif kind=='flutter':
        value=noise*np.sin(2*np.pi*9*t)**8*np.sin(np.pi*t/length)**2
    else:
        value=noise*np.sin(np.pi*t/length)**2
    edge=min(round(.008*SR),len(value)//2)
    value[:edge]*=np.linspace(0,1,edge)
    value[-edge:]*=np.linspace(1,0,edge)
    return value/max(np.max(np.abs(value)),1e-9)
