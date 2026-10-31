#!/usr/bin/env python3
"""Audition every cached VieNeu preset, without editing project narration."""
import argparse
import hashlib
from importlib.metadata import version
import io
import json
import os
from pathlib import Path
import re
import runpy
import unicodedata

ROOT = Path(__file__).resolve().parents[2]
os.environ['HF_HUB_OFFLINE']='1'
os.environ['HF_HUB_DISABLE_TELEMETRY']='1'
os.environ.setdefault('HF_HOME',str(ROOT/'.cache/huggingface'))
os.environ.setdefault('HF_HUB_DISABLE_XET','1')

import numpy as np
import soundfile as sf
import subprocess
from vieneu import Vieneu
from voice_quality import PROFILES, cache_key, engine_identity, normalize_gain


def slug(value):
    text=unicodedata.normalize('NFD',value.lower().replace('đ','d'))
    text=''.join(c for c in text if unicodedata.category(c)!='Mn')
    return re.sub(r'[^a-z0-9]+','-',text).strip('-')


def publish(out,manifest):
    preferences=json.loads((ROOT/'scripts/shared/voice-playlists.json').read_text())
    data={**manifest,'playlists':preferences['playlists'],'preferredPlaylist':preferences['preferredPlaylist']}
    encoded=json.dumps(data,ensure_ascii=False,indent=2)
    (out/'manifest.json').write_text(encoded+'\n')
    template=(ROOT/'scripts/shared/templates/voice-catalog.html').read_text()
    (out/'index.html').write_text(template.replace('__CATALOG_DATA__',encoded.replace('<','\\u003c')))


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--take',required=True,help='New immutable take name')
    parser.add_argument('--resume',action='store_true',help='Explicitly continue an incomplete take; ready WAVs are kept')
    parser.add_argument('--config',default='scripts/shared/voice-catalog.json',help='Sample wording/pause config; default is the 25-voice comparison script')
    parser.add_argument('--voices',nargs='+',help='Optional preset names; omit to audition every installed preset')
    args=parser.parse_args()
    if not re.fullmatch(r'[a-z0-9][a-z0-9-]*',args.take):parser.error('Use a lowercase slug')
    out=ROOT/'public/voice-auditions'/args.take
    if out.exists() and not args.resume:raise RuntimeError('Take exists; choose another name or explicitly --resume')
    cfg=json.loads((ROOT/args.config).read_text())
    text=' '.join(s['text'] for s in cfg['sentences'])
    # No write targets inside any project. Record their checksums for audit.
    protected=[* (ROOT/'public').glob('*/audio/*-voice-full.wav'),
               * (ROOT/'src/projects').glob('*/captions.json'),
               * (ROOT/'src/projects').glob('*/music.json')]
    fingerprint=lambda: {str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in protected}
    before=fingerprint()
    out.mkdir(parents=True,exist_ok=True)
    (out/'recognition').mkdir(exist_ok=True)
    old=json.loads((out/'manifest.json').read_text()) if args.resume and (out/'manifest.json').exists() else None
    if old and old['config']!=cfg:raise RuntimeError('The sample changed; use a new take name')
    shared=runpy.run_path(str(ROOT/'scripts/shared/make-voice.py'))
    shared['align_captions'].__globals__['CACHE']=out/'recognition'
    identity=engine_identity(ROOT,version('vieneu'))
    cache=ROOT/'.cache/stoic-audio/story'
    cache.mkdir(parents=True,exist_ok=True)
    engine=Vieneu(mode='v3turbo',backend='onnx',device='cpu',precision='fp32',threads=4)
    recognizer=None
    presets=engine.list_preset_voices()
    if args.voices:
        unknown=set(args.voices)-{name for _,name in presets}
        if unknown:
            engine.close()
            raise RuntimeError(f'Unknown presets: {sorted(unknown)}')
    previous={r['id']:r for r in old['voices']} if old else {}
    records=[]
    for i,(label,name) in enumerate(presets,1):
        if args.voices and name not in args.voices:continue
        ident=f'{i:02d}-{slug(name)}'
        records.append(previous.get(ident,{'id':ident,'name':name,'label':label,
            'gender':'Nữ' if '— Nữ' in label else 'Nam',
            'region':label.split('·')[1].strip() if '·' in label else '',
            'file':ident+'.wav','status':'pending'}))
    manifest={'title':cfg['title'],'config':cfg,'text':text,'voices':records,'engine':identity,
        'sampleRateHz':24000,'pcmSubtype':'PCM_16','tempo':1,'qualityProfile':'legacy24',
        'paidApiCalls':0,'projectAssetsUnchanged':None,
        'listeningReview':'Pending user listening; ASR flags are not a perceived-quality rating'}
    publish(out,manifest)
    try:
        for i,record in enumerate(records,1):
            path=out/record['file']
            if record['status']=='ready' and path.exists():continue
            try:
                print(f'[{i}/{len(records)}] {record["name"]}',flush=True)
                chunks=[np.zeros(round(cfg['leadIn']*24000))]
                phrase_ranges=[]
                for sentence in cfg['sentences']:
                    # Optional per-config sampling override for A/B auditions; defaults keep existing cache keys.
                    sampling={'top_k':25,'top_p':.95,'repetition_penalty':1.2,**cfg.get('sampling',{})}
                    key=cache_key(record['name'],sentence['text'],cfg['temperature'],PROFILES['legacy24'],identity,sampling)
                    source=cache/(key+'.wav')
                    if not source.exists():
                        audio=engine.infer(sentence['text'],voice=record['name'],temperature=cfg['temperature'],**sampling)
                        sf.write(source,shared['trim_silence'](audio,engine.sample_rate),engine.sample_rate,subtype='PCM_16')
                    encoded=subprocess.check_output([str(shared['FF']),'-v','error','-i',str(source),
                        '-af','atempo=1.00000000','-c:a','pcm_s16le','-ar','24000','-ac','1','-f','wav','-'])
                    values,sr=sf.read(io.BytesIO(encoded),dtype='float64')
                    assert sr==24000
                    values=normalize_gain(values)
                    edge=min(120,len(values)//2)
                    values[:edge]*=np.linspace(0,1,edge);values[-edge:]*=np.linspace(1,0,edge)
                    at=sum(len(c) for c in chunks)/24000
                    chunks.append(values)
                    phrase_ranges.append({'text':sentence['text'],'startSeconds':round(at,4),'endSeconds':round(at+len(values)/24000,4)})
                    if sentence['pauseAfter']:chunks.append(np.zeros(round(sentence['pauseAfter']*24000)))
                speech_end=sum(len(c) for c in chunks)/24000
                chunks.append(np.zeros(round(cfg['tail']*24000)))
                audio=np.concatenate(chunks)
                assert np.all(np.isfinite(audio)) and np.max(np.abs(audio))<=.760001
                assert 1 < len(audio)/24000 < cfg.get('maxDurationSeconds',40)
                # Match existing narration's signed-16-bit quantization exactly.
                sf.write(path,np.round(audio*32767).astype('<i2'),24000,subtype='PCM_16')
                if recognizer is None:
                    from faster_whisper import WhisperModel
                    recognizer=WhisperModel('medium',device='cpu',compute_type='int8',cpu_threads=4,
                        download_root=str(ROOT/'.cache/whisper'))
                try:
                    pages,qa=shared['align_captions'](recognizer,path,text,speech_end,.88)
                    record.update(qa)
                    captions_file=record['id']+'-captions.json'
                    (out/captions_file).write_text(json.dumps(pages,ensure_ascii=False,indent=2)+'\n')
                    record['captionsFile']=captions_file
                    record['verification']='ASR passed; listening pending'
                except RuntimeError as error:
                    # Keep the sample for listening; no automatic regeneration.
                    record['verification']='Needs listening review'
                    record['recognitionWarning']=str(error)
                record.update(status='ready',durationSeconds=round(len(audio)/24000,3),phraseRanges=phrase_ranges,
                    peakDbFS=round(float(20*np.log10(np.max(np.abs(audio)))),2),
                    sha256=hashlib.sha256(path.read_bytes()).hexdigest())
                print(f'  Ready · {record["durationSeconds"]}s · {record["verification"]}',flush=True)
            except Exception as error:
                record.update(status='error',error=str(error))
                print(f'  Failed, no retry: {error}',flush=True)
            publish(out,manifest)
    finally:
        engine.close()
        manifest['projectAssetsUnchanged']=fingerprint()==before
        publish(out,manifest)
    if not manifest['projectAssetsUnchanged']:raise RuntimeError('Project assets changed during audition; inspect user edits')
    ready=sum(r['status']=='ready' for r in records)
    print(f'Ready {ready}/{len(records)} · {out / "index.html"}',flush=True)
    if ready != len(records):raise RuntimeError('Some presets failed; samples and audit retained, no silent fallback')


if __name__=='__main__':main()
