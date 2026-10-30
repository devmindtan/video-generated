#!/usr/bin/env python3
"""Isolated local A/B/C audition. Never changes a project's selected narration."""
import argparse
import copy
import hashlib
import html
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[2]


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def fingerprint(paths):
    return {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project',required=True)
    parser.add_argument('--scene',type=int,default=4,help='One-based scene number')
    parser.add_argument('--take',required=True,help='New take directory; existing takes are never overwritten')
    args=parser.parse_args()
    if not all(re.fullmatch(r'[a-z0-9][a-z0-9-]*',value) for value in [args.project,args.take]):
        parser.error('Use lowercase slug names for project/take')
    story_path=ROOT/'scripts/projects'/args.project/'story.json'
    story=json.loads(story_path.read_text())
    if not 1 <= args.scene <= len(story):parser.error('Scene index is outside story')
    scene=copy.deepcopy(story[args.scene-1])
    selected=ROOT/'public'/args.project/'audio'
    metadata=json.loads((selected/'voice-metadata.json').read_text())
    base_meta=metadata[args.scene-1]
    if base_meta['scene'] != scene['id']:raise RuntimeError('Story and baseline voice do not match')
    voice=base_meta['voice']
    src=ROOT/'src/projects'/args.project
    protected=[story_path,*selected.glob('*.wav'),selected/'voice-metadata.json',
               src/'Video.tsx',src/'captions.json',src/'music.json']
    before=fingerprint(protected)
    out=ROOT/'public'/args.project/'voice-auditions'/args.take
    if out.exists():raise RuntimeError('Take already exists; choose a new --take. No automatic retry/overwrite.')
    out.mkdir(parents=True)
    records=[]
    # Offline even if the user's ambient shell enables network model fetching.
    env={**os.environ,'HF_HUB_OFFLINE':'1','HF_HUB_DISABLE_TELEMETRY':'1'}
    shutil.copy2(selected/base_meta['file'],out/'A-current.wav')
    records.append({'key':'A','label':'Bản đang dùng','file':'A-current.wav','metadata':base_meta})
    scene['start']=0
    scene['targetSpeed']=1
    cases=[('B','Cùng giọng, cụm ý hiện tại · 48 kHz',.5,False),
           ('C','Cùng giọng, đọc liền đoạn · 48 kHz',.8,True)]
    try:
        for key,label,temperature,connected in cases:
            case=out/key
            case.mkdir()
            spec=copy.deepcopy(scene)
            spec['temperature']=temperature
            if connected:
                if any(isinstance(s,dict) and 'at' in s for s in spec['sentences']):
                    raise RuntimeError('Connected audition cannot discard authored action-beat anchors')
                spec['sentences']=[{'text':spec['text'],'pauseAfter':0}]
            write_json(case/'story.json',[spec])
            command=[sys.executable,str(ROOT/'scripts/shared/make-voice.py'),
                     '--voice',voice,'--gender',base_meta.get('gender','male'),
                     '--story',str(case/'story.json'),'--asset-dir',str(case),
                     '--captions',str(case/'captions.json'),'--srt',str(case/'captions.srt'),
                     '--metadata',str(case/'voice-metadata.json'),'--docs',str(case/'script.md'),
                     '--quality-profile','natural48','--target-speed','1',
                     '--temperature',str(temperature),'--alignment-model','medium',
                     '--title',f'Nghe thử {key} — {voice}',
                     '--voice-style','Editorial audition only; model style comes from the preset voice']
            print(f'Creating local audition {key}; no remote TTS/API, no automatic retries.',flush=True)
            subprocess.run(command,check=True,cwd=ROOT,env=env)
            meta=json.loads((case/'voice-metadata.json').read_text())[0]
            info=sf.info(case/meta['file'])
            assert info.samplerate==48000 and info.subtype=='PCM_24' and meta['speed']==1
            records.append({'key':key,'label':label,'file':f'{key}/{meta["file"]}','metadata':meta})
    finally:
        if fingerprint(protected)!=before:raise RuntimeError('Selected project assets unexpectedly changed')
        write_json(out/'manifest.json',{
            'project':args.project,'scene':args.scene,'voice':voice,'text':scene['text'],
            'takes':records,'selectedProjectAssetsUnchanged':True,'paidApiCalls':0,
            'listeningReview':'Pending user comparison; 48 kHz alone does not establish better perceived voice',
        })
    cards=[]
    for record in records:
        data,rate=sf.read(out/record['file'])
        if not np.all(np.isfinite(data)):raise RuntimeError('Non-finite audition')
        cards.append(f'<section><h2>{record["key"]} · {html.escape(record["label"])}</h2>'
                     f'<p>{rate//1000} kHz · {record["metadata"]["speed"]}× · '
                     f'Word match {record["metadata"]["wordMatchRatio"]:.0%}</p>'
                     f'<audio controls preload="none" src="{html.escape(record["file"],quote=True)}"></audio></section>')
    (out/'index.html').write_text('<!doctype html><html lang="vi"><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<title>Nghe thử VieNeu</title><style>body{font:18px system-ui;background:#101319;color:#f5f0e8;'
        'max-width:820px;margin:40px auto;padding:0 20px}section{background:#202630;padding:20px;'
        'border-radius:12px;margin:20px 0}h1,h2{color:#dcb777}audio{width:100%}p{line-height:1.6}</style>'
        f'<h1>Nghe thử {html.escape(voice)} · Cảnh {args.scene}</h1>'
        '<p>A là bản đang dùng. B giữ cách chia cụm ý; C thử đọc liền đoạn. B/C là các lần tổng hợp mới '
        'nên không phải phép đo riêng tác động của sample rate. Chọn bằng nghe thực tế: phát âm, nhịp, '
        'cảm xúc và độ ổn định; không chỉ độ sáng/lớn của âm thanh. Chưa bản nào được áp dụng vào video.</p>'
        f'<blockquote>{html.escape(scene["text"])}</blockquote>'+''.join(cards)+'</html>')
    print(f'Listen (local HTML): {out / "index.html"}',flush=True)


if __name__=='__main__':main()
