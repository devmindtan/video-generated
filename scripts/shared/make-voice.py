#!/usr/bin/env python3
"""Speak complete sentences, verify the recording, and align short caption pages.
Free local CPU tools: VieNeu for speech and faster-whisper for word timestamps.
"""
import argparse
from difflib import SequenceMatcher
from importlib.metadata import version
import io
import json
import os
from pathlib import Path
import re
import shutil
import tempfile
import subprocess
import sys
import wave
import unicodedata

ROOT=Path(__file__).resolve().parents[2]
os.environ.setdefault('HF_HOME',str(ROOT/'.cache/huggingface'))
os.environ.setdefault('HF_HUB_DISABLE_XET','1')
import numpy as np
import soundfile as sf
from vieneu import Vieneu
sys.path.insert(0,str(Path(__file__).resolve().parent))  # Also support legacy runpy callers.
from voice_quality import PROFILES, cache_key, engine_identity, normalize_gain, require_native_tempo

OUT=ROOT/'public/stoic/audio'
CACHE=ROOT/'.cache/stoic-audio/full-sentences'
FF=ROOT/'node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg'
SR=24000


def trim_silence(audio,sr,head=.07,tail=.09):
    active=np.flatnonzero(np.abs(audio)>.003)
    if not len(active):raise RuntimeError('Silent synthesis')
    return audio[max(0,active[0]-int(head*sr)):min(len(audio),active[-1]+int(tail*sr))]


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


def align_captions(model,path,text,speech_end,min_coverage=.88,vad_filter=False):
    import soxr
    waveform,sample_rate=sf.read(path,dtype='float32')
    waveform=soxr.resample(waveform,sample_rate,16000)
    waveform=waveform[:round((speech_end+.1)*16000)]
    segments,_=model.transcribe(waveform,language='vi',beam_size=5,word_timestamps=True,condition_on_previous_text=False,vad_filter=vad_filter)
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
    parser.add_argument('--gender',default='male')
    parser.add_argument('--voice-style',default='warm, connected, reflective; gentle emotional arc; one clear emphasis; softer scene endings',help='Editorial note only: v3 Turbo does not apply style prompts')
    parser.add_argument('--project-style',default='phong cách Stoicism điện ảnh')
    parser.add_argument('--delivery-note',default='Lời đọc theo cụm ý liền mạch; chỉ nhấn ở điểm then chốt và hạ nhẹ ở cuối mỗi cảnh; phụ đề căn theo bản thu.')
    parser.add_argument('--quality-profile',choices=PROFILES,default='legacy24',help='natural48 is opt-in: 48k PCM24, native 1x, scene-level gain; audition before switching')
    parser.add_argument('--target-speed',type=float)
    parser.add_argument('--temperature',type=float)
    parser.add_argument('--top-k',type=int,default=25)
    parser.add_argument('--top-p',type=float,default=.95)
    parser.add_argument('--repetition-penalty',type=float,default=1.2)
    parser.add_argument('--width',type=int,default=1080)
    parser.add_argument('--height',type=int,default=1920)
    parser.add_argument('--vad-filter',action='store_true',help='Filter long action gaps during caption recognition')
    parser.add_argument('--alignment-model',default='small',choices=['small','medium'],help='Use medium for difficult Vietnamese narration; model must be downloaded locally')
    args=parser.parse_args()
    global OUT,CACHE,SR
    quality=PROFILES[args.quality_profile]
    SR=quality.sample_rate
    args.target_speed=args.target_speed if args.target_speed is not None else (1 if quality.native_tempo else .96)
    args.temperature=args.temperature if args.temperature is not None else quality.temperature
    if not (0 < args.temperature <= 2 and 0 < args.top_p <= 1 and args.top_k > 0 and args.repetition_penalty > 0):
        parser.error('Invalid sampling parameters')
    require_native_tempo(quality,args.target_speed)
    identity=engine_identity(ROOT,version('vieneu'))
    sampling={'top_k':args.top_k,'top_p':args.top_p,'repetition_penalty':args.repetition_penalty}
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
                digest=cache_key(args.voice,sentence,temperature,quality,identity,sampling)
                path=CACHE/f'{digest}.wav'
                if not path.exists():
                    if tts is None:tts=Vieneu(mode='v3turbo',backend='onnx',device='cpu',precision='fp32',threads=4)
                    audio=tts.infer(sentence,voice=args.voice,temperature=temperature,**sampling)
                    if quality.native_tempo and tts.sample_rate != 48000:raise RuntimeError('natural48 requires a native 48k model; do not upsample a 24k model')
                    sf.write(path,trim_silence(audio,tts.sample_rate,quality.trim_head,quality.trim_tail),tts.sample_rate,subtype=quality.subtype)
                    print(f'Scene {si+1}, sentence {pi+1}: {sentence}',flush=True)
                info=sf.info(path)
                if quality.native_tempo and (info.samplerate != 48000 or info.subtype != 'PCM_24'):
                    raise RuntimeError('natural48 cache must contain original 48k PCM24 audio')
                raw[si,pi]=(path,info.duration)
    finally:
        if tts:tts.close()
    plans=[]
    for si,scene in enumerate(scenes):
        start=scene.get('leadIn',.18);tail=scene.get('tail',.28)
        pauses=[item.get('pauseAfter',.12) if isinstance(item,dict) else .12 for item in scene['sentences']]
        pauses[-1]=scene['sentences'][-1].get('pauseAfter',0) if isinstance(scene['sentences'][-1],dict) else 0
        total=sum(raw[si,pi][1] for pi in range(len(scene['sentences'])))
        available=scene['duration']-start-tail-sum(pauses)
        if available <= 0:raise RuntimeError('Scene has no available speech time')
        requested_speed=scene.get('targetSpeed',args.target_speed)
        require_native_tempo(quality,requested_speed)
        speed=max(requested_speed,total/available)
        anchored=all(isinstance(item,dict) and 'at' in item for item in scene['sentences'])
        if any(isinstance(item,dict) and 'at' in item for item in scene['sentences']) and not anchored:
            raise RuntimeError('Picture-beat starts must be supplied for every sentence in an anchored scene')
        if anchored:
            # Authored picture beats: retain their starts, not proportional pauses.
            items=scene['sentences']
            for pi,item in enumerate(items):
                limit=items[pi+1]['at'] if pi+1<len(items) else scene['duration']-tail
                if item['at']<0 or limit-item['at']<=.08:
                    raise RuntimeError('Invalid or unordered picture-beat starts')
                speed=max(speed,raw[si,pi][1]/(limit-item['at']-.08))
            start=items[0]['at']
            pauses=[max(0,items[pi+1]['at']-item['at']-raw[si,pi][1]/speed) if pi+1<len(items) else 0 for pi,item in enumerate(items)]
        if scene.get('distributePauses') and sum(pauses)>0 and not anchored:
            # Optional story beats: leave action/SFX gaps without stretching the voice.
            pause_budget=max(sum(pauses),scene['duration']-start-tail-total/speed)
            pauses=[p*pause_budget/sum(pauses) for p in pauses]
        estimated_end=start+total/speed+sum(pauses)
        print(f'Scene {si+1}: raw {total:.2f}s; tempo {speed:.3f}x; estimated tail {scene["duration"]-estimated_end:.2f}s',flush=True)
        require_native_tempo(quality,speed)
        plans.append((pauses,start,speed))
        if speed>1.12:raise RuntimeError(f'Scene {si+1}: too much text for calm delivery; revise the script.')
    from faster_whisper import WhisperModel
    recognizer=WhisperModel(args.alignment_model,device='cpu',compute_type='int8',cpu_threads=4,download_root=str(ROOT/'.cache/whisper'))
    metadata=[];groups=[]
    sample_bytes=8 if quality.native_tempo else 2
    silence=b'\0'*sample_bytes
    with tempfile.TemporaryDirectory(prefix='full-',dir=CACHE) as stage:
        stage=Path(stage)
        for si,scene in enumerate(scenes):
            pauses,start,speed=plans[si]
            data=bytearray(silence*round(start*SR))
            speech_end=start
            for pi,sentence in enumerate(scene['sentences']):
                if isinstance(sentence,dict) and 'at' in sentence:
                    desired=round(sentence['at']*SR)*sample_bytes
                    if len(data)>desired+round(.08*SR)*sample_bytes:
                        raise RuntimeError(f"{scene['id']}: sentence overlaps authored picture beat {pi+1}")
                    data=data[:desired] if len(data)>desired else data+b'\0'*(desired-len(data))
                if quality.native_tempo:
                    # No atempo=1 round-trip, 24k conversion or 16-bit intermediate.
                    values,source_sr=sf.read(raw[si,pi][0],dtype='float64')
                    assert source_sr == SR and values.ndim == 1
                else:
                    encoded=subprocess.check_output([str(FF),'-v','error','-i',str(raw[si,pi][0]),'-af',f'atempo={speed:.8f}','-c:a','pcm_s16le','-f','wav','-ac','1','-ar',str(SR),'-'])
                    with wave.open(io.BytesIO(encoded),'rb') as w:values=np.frombuffer(w.readframes(w.getnframes()),'<i2').astype(np.float64)/32768
                authored=scene['sentences'][pi]
                gain_db=authored.get('gainDb',0) if isinstance(authored,dict) else 0
                if quality.normalize_per_phrase:values=normalize_gain(values,gain_db)
                else:values*=10**(gain_db/20)
                edge=min(round(.005*SR),len(values)//2)
                values[:edge]*=np.linspace(0,1,edge);values[-edge:]*=np.linspace(1,0,edge)
                # Float staging for natural48; legacy bytes remain bit-compatible.
                data.extend(np.round(values*32767).astype('<i2').tobytes() if not quality.native_tempo else values.astype('<f8').tobytes())
                speech_end=len(data)/sample_bytes/SR
                if pauses[pi]:data.extend(silence*round(pauses[pi]*SR))
            end=len(data)/sample_bytes/SR
            size=round(scene['duration']*SR)*sample_bytes
            if len(data)>size:raise RuntimeError('Speech would be clipped at scene end')
            if scene['duration']-end>scene.get('maxTail',2.5):raise RuntimeError('Excessive empty scene tail')
            data.extend(b'\0'*(size-len(data)))
            filename=scene['id']+'-voice-full.wav'
            if quality.native_tempo:
                values=normalize_gain(np.frombuffer(data,dtype='<f8'),active_only=True)
                sf.write(stage/filename,values,SR,subtype=quality.subtype)
            else:
                with wave.open(str(stage/filename),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes(data)
            pages,qa=align_captions(recognizer,stage/filename,scene['text'],speech_end,scene.get('minWordMatchRatio',.88),args.vad_filter or scene.get('distributePauses',False) or all(isinstance(item,dict) and 'at' in item for item in scene['sentences']))
            if all(isinstance(item,dict) and 'at' in item for item in scene['sentences']):
                # ASR can anticipate speech across a quiet action gap. Keep pages
                # within the actual authored sentence windows, without retyping text.
                boundaries=[];word_offset=0
                for pi,item in enumerate(scene['sentences']):
                    boundaries.append((word_offset,len(item['text'].split()),round(item['at']*1000),round(scene['sentences'][pi+1]['at']*1000) if pi+1<len(scene['sentences']) else round(speech_end*1000)))
                    word_offset+=len(item['text'].split())
                cursor=0
                for page in pages:
                    boundary=next(b for b in boundaries if b[0]<=cursor<b[0]+b[1])
                    page['startMs']=max(page['startMs'],boundary[2])
                    page['endMs']=min(page['endMs'],boundary[3])
                    page['timestampMs']=page['startMs']
                    if page['endMs']<=page['startMs']:
                        raise RuntimeError('Caption alignment falls outside its authored picture beat; review required')
                    cursor+=len(page['text'].split())
            groups.append(pages)
            metadata.append({'scene':scene['id'],'file':filename,'provider':f'VieNeu-TTS v3 Turbo {identity["package"]} (local CPU)','voice':args.voice,'gender':args.gender,'style':args.voice_style,'styleAppliedByModel':False,'qualityProfile':quality.name,'sampleRateHz':SR,'pcmSubtype':quality.subtype,'gainScope':'phrase' if quality.normalize_per_phrase else 'scene','engine':identity,'sampling':sampling,'temperature':scene.get('temperature',args.temperature),'authoredSentenceDynamics':True,'source':'https://github.com/pnnbao97/VieNeu-TTS','generationUnit':'connected phrase groups','speed':round(speed,4),'speechStartsAt':start,'speechEndsAt':round(end,3),'tailSilenceSeconds':round(scene['duration']-end,3),'sceneDuration':scene['duration'],'alignment':f'faster-whisper {args.alignment_model}; punctuation, accent-only differences and rule numbers normalized; authored spelling retained',**qa})
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
    gender_label={'female':'nữ','male':'nam'}.get(args.gender,args.gender)
    lines=[f'# Kịch bản đầy đủ — {args.title}','',f'{sum(scene["duration"] for scene in scenes)} giây · {args.width}×{args.height} · giọng {gender_label} {args.voice} · {args.project_style}.','',args.delivery_note,'']
    for index,scene in enumerate(scenes):
        lines.extend([f"## Cảnh {index+1} · {scene['start']:02d}–{scene['start']+scene['duration']:02d} giây",'',scene['text'],''])
    (ROOT/args.docs).write_text('\n'.join(lines))
    print('Published full narration, checked content and word-aligned captions.',flush=True)

if __name__=='__main__':main()
