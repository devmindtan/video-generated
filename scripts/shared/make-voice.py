#!/usr/bin/env python3
"""Speak complete sentences, verify the recording, and align short caption pages.
Free local CPU tools: VieNeu for speech and faster-whisper for word timestamps.
"""
import argparse
from difflib import SequenceMatcher
import hashlib
import io
import json
import os
from pathlib import Path
import re
import shutil
import tempfile
import subprocess
import wave
import unicodedata

ROOT=Path(__file__).resolve().parents[2]
os.environ.setdefault('HF_HOME',str(ROOT/'.cache/huggingface'))
os.environ.setdefault('HF_HUB_DISABLE_XET','1')
import numpy as np
import soundfile as sf
from vieneu import Vieneu

OUT=ROOT/'public/stoic/audio'
CACHE=ROOT/'.cache/stoic-audio/full-sentences'
FF=ROOT/'node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg'
SR=24000


def trim_silence(audio,sr):
    active=np.flatnonzero(np.abs(audio)>.003)
    if not len(active):raise RuntimeError('Silent synthesis')
    return audio[max(0,active[0]-int(.07*sr)):min(len(audio),active[-1]+int(.09*sr))]


def timestamp(ms):
    ms=round(ms)
    return f'{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d},{ms%1000:03d}'


def normalized(word):
    # Ignore punctuation, accent-only ASR differences and spoken rule numbers.
    word=''.join(c for c in unicodedata.normalize('NFD',word.lower().replace('đ','d')) if unicodedata.category(c)!='Mn')
    word=re.sub(r'[^\w]','',word)
    return {'1':'mot','2':'hai','3':'ba'}.get(word,word)


def merge_short_pages(pages):
    merged=[]
    for page in pages:
        if (merged and len(page['text'].split())<=2
                and not merged[-1]['text'].endswith(('.', '!', '?'))
                and len(merged[-1]['text'])+len(page['text'])+1<=50):
            merged[-1]['text']+=' '+page['text']
            merged[-1]['endMs']=page['endMs']
        else:merged.append(dict(page))
    return merged


def align_captions(model,path,text,speech_end,min_coverage=.88):
    import soxr
    waveform,sample_rate=sf.read(path,dtype='float32')
    waveform=soxr.resample(waveform,sample_rate,16000)
    segments,_=model.transcribe(waveform,language='vi',beam_size=5,word_timestamps=True,condition_on_previous_text=False,vad_filter=False)
    observed=[]
    for segment in segments:
        for word in segment.words or []:
            tokens=word.word.strip().split()
            for i,token in enumerate(tokens):
                if normalized(token):
                    observed.append({'text':token,'start':word.start+(word.end-word.start)*i/len(tokens),'end':word.start+(word.end-word.start)*(i+1)/len(tokens),'confidence':word.probability})
    expected=text.split()
    matcher=SequenceMatcher(a=[normalized(x) for x in expected],b=[normalized(x['text']) for x in observed],autojunk=False)
    mapped={}
    for block in matcher.get_matching_blocks():
        for offset in range(block.size):mapped[block.a+offset]=observed[block.b+offset]
    coverage=len(mapped)/len(expected)
    transcript=' '.join(x['text'] for x in observed)
    (CACHE/(path.stem+'-recognition.json')).write_text(json.dumps({'expected':text,'recognized':transcript,'wordMatchRatio':coverage},ensure_ascii=False,indent=2))
    if coverage<min_coverage:
        raise RuntimeError(f'Audio content needs review ({coverage:.0%} exact word match): {path.name}\nExpected: {text}\nRecognized: {transcript}')
    # Keep authored spelling; interpolate rare recognition errors between matched words.
    for i in range(len(expected)):
        if i in mapped:continue
        prev=next((mapped[j] for j in range(i-1,-1,-1) if j in mapped),None)
        next_index=next((j for j in range(i+1,len(expected)) if j in mapped),None)
        start=prev['end'] if prev else .18
        end=mapped[next_index]['start'] if next_index is not None else speech_end
        count=(next_index-i) if next_index is not None else len(expected)-i
        mapped[i]={'start':start,'end':max(start+.02,start+(end-start)/max(1,count)),'confidence':None}
    pages=[]
    start=0
    for i,word in enumerate(expected):
        phrase=' '.join(expected[start:i+1])
        next_length=len(phrase)+1+(len(expected[i+1]) if i+1<len(expected) else 0)
        if i==len(expected)-1 or word.endswith(('.', '!', '?')) or i-start>=6 or next_length>38:
            begin=max(0,round(mapped[start]['start']*1000))
            end=min(round(speech_end*1000),round(mapped[i]['end']*1000))
            if pages:begin=max(begin,pages[-1]['endMs'])
            if end<=begin:raise RuntimeError('Invalid caption alignment')
            pages.append({'text':phrase,'startMs':begin,'endMs':end,'timestampMs':begin,'confidence':None})
            start=i+1
    return merge_short_pages(pages),{'wordMatchRatio':round(coverage,4),'recognizedText':transcript}


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--voice',default='Hải Đăng')
    parser.add_argument('--story',default='scripts/projects/stoic/story.json')
    parser.add_argument('--asset-dir',default='public/stoic/audio')
    parser.add_argument('--captions',default='src/projects/stoic/captions.json')
    parser.add_argument('--srt',default='public/stoic/captions.srt')
    parser.add_argument('--metadata',default='public/stoic/audio/voice-metadata.json')
    parser.add_argument('--docs',default='docs/projects/stoic/script.md')
    parser.add_argument('--title',default='3 thứ bạn nên ngừng bận tâm')
    parser.add_argument('--target-speed',type=float,default=.96)
    parser.add_argument('--temperature',type=float,default=.65)
    args=parser.parse_args()
    global OUT,CACHE
    OUT=ROOT/args.asset_dir
    CACHE=ROOT/'.cache/stoic-audio'/Path(args.story).stem
    OUT.mkdir(parents=True,exist_ok=True)
    scenes=json.loads((ROOT/args.story).read_text())
    CACHE.mkdir(parents=True,exist_ok=True)
    raw={};tts=None
    try:
        for si,scene in enumerate(scenes):
            sentence_texts=[item if isinstance(item,str) else item['text'] for item in scene['sentences']]
            assert ' '.join(sentence_texts)==scene['text']
            temperature=scene.get('temperature',args.temperature)
            for pi,sentence in enumerate(sentence_texts):
                digest=hashlib.sha256((args.voice+f'|complete-sentences-{temperature:.2f}|'+sentence).encode()).hexdigest()[:16]
                path=CACHE/f'{digest}.wav'
                if not path.exists():
                    if tts is None:tts=Vieneu(backend='onnx',device='cpu',threads=4)
                    audio=tts.infer(sentence,voice=args.voice,temperature=temperature)
                    sf.write(path,trim_silence(audio,tts.sample_rate),tts.sample_rate,subtype='PCM_16')
                    print(f'Scene {si+1}, sentence {pi+1}: {sentence}',flush=True)
                raw[si,pi]=(path,sf.info(path).duration)
    finally:
        if tts:tts.close()
    plans=[]
    for si,scene in enumerate(scenes):
        start=scene.get('leadIn',.18);tail=scene.get('tail',.28)
        pauses=[item.get('pauseAfter',.12) if isinstance(item,dict) else .12 for item in scene['sentences']]
        pauses[-1]=scene['sentences'][-1].get('pauseAfter',0) if isinstance(scene['sentences'][-1],dict) else 0
        total=sum(raw[si,pi][1] for pi in range(len(scene['sentences'])))
        available=scene['duration']-start-tail-sum(pauses)
        speed=max(scene.get('targetSpeed',args.target_speed),total/available)
        estimated_end=start+total/speed+sum(pauses)
        print(f'Scene {si+1}: raw {total:.2f}s; tempo {speed:.3f}x; estimated tail {scene["duration"]-estimated_end:.2f}s',flush=True)
        plans.append((pauses,start,speed))
        if speed>1.12:raise RuntimeError(f'Scene {si+1}: too much text for calm delivery; revise the script.')
    from faster_whisper import WhisperModel
    recognizer=WhisperModel('small',device='cpu',compute_type='int8',cpu_threads=4,download_root=str(ROOT/'.cache/whisper'))
    metadata=[];groups=[]
    with tempfile.TemporaryDirectory(prefix='full-',dir=CACHE) as stage:
        stage=Path(stage)
        for si,scene in enumerate(scenes):
            pauses,start,speed=plans[si]
            data=bytearray(b'\0\0'*round(start*SR))
            speech_end=start
            for pi,sentence in enumerate(scene['sentences']):
                encoded=subprocess.check_output([str(FF),'-v','error','-i',str(raw[si,pi][0]),'-af',f'atempo={speed:.8f}','-c:a','pcm_s16le','-f','wav','-ac','1','-ar',str(SR),'-'])
                with wave.open(io.BytesIO(encoded),'rb') as w:values=np.frombuffer(w.readframes(w.getnframes()),'<i2').astype(np.float64)/32768
                rms=np.sqrt(np.mean(values*values))
                authored=scene['sentences'][pi]
                gain_db=authored.get('gainDb',0) if isinstance(authored,dict) else 0
                target_rms_db=-17.5+gain_db
                values*=min(10**(target_rms_db/20)/max(rms,1e-9),.76/max(np.max(np.abs(values)),1e-9))
                edge=min(120,len(values)//2)
                values[:edge]*=np.linspace(0,1,edge);values[-edge:]*=np.linspace(1,0,edge)
                data.extend(np.round(values*32767).astype('<i2').tobytes())
                speech_end=len(data)/2/SR
                if pauses[pi]:data.extend(b'\0\0'*round(pauses[pi]*SR))
            end=len(data)/2/SR
            size=scene['duration']*SR*2
            if len(data)>size:raise RuntimeError('Speech would be clipped at scene end')
            if scene['duration']-end>scene.get('maxTail',2.5):raise RuntimeError('Excessive empty scene tail')
            data.extend(b'\0'*(size-len(data)))
            filename=scene['id']+'-voice-full.wav'
            with wave.open(str(stage/filename),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes(data)
            pages,qa=align_captions(recognizer,stage/filename,scene['text'],speech_end,scene.get('minWordMatchRatio',.88))
            groups.append(pages)
            metadata.append({'scene':scene['id'],'file':filename,'provider':'VieNeu-TTS v3 Turbo 3.8.3 (local CPU)','voice':args.voice,'gender':'male','style':'warm, connected, reflective; gentle emotional arc; one clear emphasis; softer scene endings','temperature':scene.get('temperature',args.temperature),'authoredSentenceDynamics':True,'source':'https://github.com/pnnbao97/VieNeu-TTS','generationUnit':'connected phrase groups','speed':round(speed,4),'speechStartsAt':start,'speechEndsAt':round(end,3),'tailSilenceSeconds':round(scene['duration']-end,3),'sceneDuration':scene['duration'],'alignment':'faster-whisper small; punctuation, accent-only differences and rule numbers normalized; authored spelling retained',**qa})
            print(f'Checked scene {si+1}: word match {qa["wordMatchRatio"]:.0%}, tail {scene["duration"]-end:.2f}s',flush=True)
        for item in metadata:shutil.copy2(stage/item['file'],OUT/item['file'])
        (ROOT/args.captions).write_text(json.dumps(groups,ensure_ascii=False,indent=2)+'\n')
        (ROOT/args.metadata).write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
        srt=[]
        for scene,group in zip(scenes,groups):
            for c in group:
                base=scene['start']*1000
                srt.append(f"{len(srt)+1}\n{timestamp(base+c['startMs'])} --> {timestamp(base+c['endMs'])}\n{c['text']}\n")
        (ROOT/args.srt).write_text('\n'.join(srt))
    lines=[f'# Kịch bản đầy đủ — {args.title}','',f'{sum(scene["duration"] for scene in scenes)} giây · 1080×1920 · giọng nam {args.voice} · phong cách Stoicism điện ảnh.','','Lời đọc theo cụm ý liền mạch; chỉ nhấn ở điểm then chốt và hạ nhẹ ở cuối mỗi cảnh; phụ đề căn theo bản thu.','']
    for index,scene in enumerate(scenes):
        lines.extend([f"## Cảnh {index+1} · {scene['start']:02d}–{scene['start']+scene['duration']:02d} giây",'',scene['text'],''])
    (ROOT/args.docs).write_text('\n'.join(lines))
    print('Published full narration, checked content and word-aligned captions.',flush=True)

if __name__=='__main__':main()
