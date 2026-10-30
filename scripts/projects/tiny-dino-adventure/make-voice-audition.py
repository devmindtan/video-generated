"""Keep original narrator; create a duration-matched childlike pitch audition."""
import hashlib
import io
import json
from pathlib import Path
import runpy
import subprocess
import numpy as np
import soundfile as sf
import soxr

ROOT=Path(__file__).resolve().parents[3]
FF=ROOT/'node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg'
OUT=ROOT/'public/tiny-dino-adventure/audio'
CACHE=ROOT/'.cache/tiny-dino-voice-audition'


def main():
    CACHE.mkdir(parents=True,exist_ok=True)
    shared=runpy.run_path(str(ROOT/'scripts/shared/make-voice.py'))
    story=json.loads((ROOT/'scripts/projects/tiny-dino-adventure/story.json').read_text())
    scene=story[-1]
    pieces=[];tts=None
    try:
        for sentence in scene['sentences']:
            key=hashlib.sha256(sentence['text'].encode()).hexdigest()[:16]
            path=CACHE/f'cta-{key}.wav'
            if not path.exists():
                if tts is None:tts=shared['Vieneu'](backend='onnx',device='cpu',threads=4)
                audio=tts.infer(sentence['text'],voice='Trúc Ly',temperature=.58)
                sf.write(path,shared['trim_silence'](audio,tts.sample_rate),tts.sample_rate)
            encoded=subprocess.check_output([str(FF),'-v','error','-i',str(path),'-af','atempo=0.9','-ar','24000','-ac','1','-f','wav','-'])
            audio,_=sf.read(io.BytesIO(encoded))
            audio*=min(.76/max(np.max(np.abs(audio)),1e-9),10**(-17.2/20)/max(np.sqrt(np.mean(audio**2)),1e-9))
            pieces.extend([audio,np.zeros(round(sentence['pauseAfter']*24000))])
    finally:
        if tts:tts.close()
    voice=np.concatenate([np.zeros(1920),*pieces])
    speech_end=len(voice)/24000
    assert speech_end<5.8,'CTA too long'
    voice=np.pad(voice,(0,6*24000-len(voice)))
    cta=CACHE/'cta-reviewed.wav';sf.write(cta,voice,24000)
    from faster_whisper import WhisperModel
    model=WhisperModel('small',device='cpu',compute_type='int8',cpu_threads=4,download_root=str(ROOT/'.cache/whisper'))
    align=shared['align_captions'];align.__globals__['CACHE']=CACHE
    pages,qa=align(model,cta,scene['text'],speech_end,.85,True)
    print('CTA:',qa,flush=True)
    # Only publish after CTA validation; earlier narrator files remain untouched.
    sf.write(OUT/'05-goodbye-voice-full.wav',voice,24000,subtype='PCM_16')
    caption_path=ROOT/'src/projects/tiny-dino-adventure/captions.json'
    groups=json.loads(caption_path.read_text());groups[-1]=pages
    caption_path.write_text(json.dumps(groups,ensure_ascii=False,indent=2)+'\n')
    metadata=json.loads((OUT/'voice-metadata.json').read_text())
    metadata[-1].update(qa,speechEndsAt=round(speech_end,3),tailSilenceSeconds=round(6-speech_end,3),speed=.9)
    (OUT/'voice-metadata.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
    srt=[]
    for s,g in zip(story,groups):
        for c in g:srt.append(f"{len(srt)+1}\n{shared['timestamp'](s['start']*1000+c['startMs'])} --> {shared['timestamp'](s['start']*1000+c['endMs'])}\n{c['text']}\n")
    (ROOT/'public/tiny-dino-adventure/captions.srt').write_text('\n'.join(srt))
    child=OUT/'childlike-preview';child.mkdir(exist_ok=True)
    ratio=2**(2.5/12)
    for s in story:
        filename=s['id']+'-voice-full.wav'
        data,sr=sf.read(OUT/filename)
        raised=soxr.resample(data,sr*ratio,sr)
        temp=CACHE/filename;sf.write(temp,raised,sr,subtype='PCM_16')
        encoded=subprocess.check_output([str(FF),'-v','error','-i',str(temp),'-af',f'atempo={1/ratio}','-f','wav','-'])
        processed,_=sf.read(io.BytesIO(encoded))
        processed=np.pad(processed[:len(data)],(0,max(0,len(data)-len(processed))))
        processed*=min(1.5,np.sqrt(np.mean(data**2))/max(np.sqrt(np.mean(processed**2)),1e-9),.76/max(np.max(np.abs(processed)),1e-9))
        sf.write(child/filename,processed,sr,subtype='PCM_16')
    (child/'voice-metadata.json').write_text(json.dumps({'baseVoice':'Trúc Ly','type':'stylized childlike audition, not a real child voice','pitchSemitones':2.5,'durationPreserved':True,'scenes':metadata},ensure_ascii=False,indent=2)+'\n')
    print('Original narrator + childlike audition ready; original backup preserved.')


if __name__=='__main__':main()
