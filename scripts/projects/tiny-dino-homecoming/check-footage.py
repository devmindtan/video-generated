"""Inspect source media without rendering the Remotion composition."""
import argparse
import io
import json
from pathlib import Path
import runpy
import subprocess
import numpy as np
import soundfile as sf
from PIL import Image

ROOT=Path(__file__).resolve().parents[3]
SRC=ROOT/'src/projects/tiny-dino-homecoming'
FF=ROOT/'node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg'


def frame(path,at):
    raw=subprocess.check_output([str(FF),'-v','error','-ss',str(at),'-i',str(path),'-frames:v','1','-c:v','png','-f','image2pipe','-'])
    return np.asarray(Image.open(io.BytesIO(raw)).convert('RGB'),dtype=np.float32)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--speech',action='store_true',help='Also scan native audio with local Whisper/VAD; manually review findings')
    parser.add_argument('--allow-missing',action='store_true',help='Incremental inspection only; final checks must run without this flag')
    parser.add_argument('--continuity',action='store_true',help='Inspect the staged continuity edit before activating it')
    args=parser.parse_args()
    probe=runpy.run_path(str(ROOT/'scripts/shared/make-veo.py'))['probe']
    chapters=json.loads((SRC/'chapters.json').read_text())
    clips=json.loads((SRC/'footage.json').read_text())
    edit=json.loads((SRC/'edit.json').read_text())
    if args.continuity:edit['continuityV3']=True
    cuts=json.loads((SRC/'cuts-v3.json').read_text())
    selected={s['key']:s for c in cuts for s in c['shots']}
    specs={s['scene']:s for s in json.loads((ROOT/'scripts/projects/tiny-dino-homecoming/veo-continuity.json').read_text())['shots']}
    recognizer=None
    if args.speech:
        from faster_whisper import WhisperModel
        recognizer=WhisperModel('small',device='cpu',compute_type='int8',cpu_threads=4,download_root=str(ROOT/'.cache/whisper'))
    report=[]
    missing=[]
    for index,chapter in enumerate(chapters):
        keys=[s['key'] for s in cuts[index]['shots']] if edit.get('continuityV3') else [chapter[angle+'Shot'] for angle in ['wide','close']]
        for key in keys:
            clip=clips.get(key)
            if not clip and args.allow_missing:
                missing.append(key)
                continue
            assert clip,f'{key}: source clip missing'
            path=ROOT/'public'/clip['src']
            info=probe(path)
            assert info['width']==1280 and info['height']==720
            assert abs(info['durationSeconds']-8)<.1
            source_end=selected[key]['duration']*selected[key]['rate'] if edit.get('continuityV3') else 8
            first=frame(path,.15)
            middle=frame(path,source_end/2)
            last=frame(path,source_end-.15)
            delta=[float(np.mean(np.abs(first-middle))),float(np.mean(np.abs(middle-last)))]
            assert min(delta)>.1, f'{key}: frozen-looking source, inspect manually'
            item={'shot':key,**info,'frameChangeMean':list(map(lambda x:round(x,3),delta)),'playbackRate':clip['playbackRate']}
            if edit.get('continuityV3'):
                item.update(playbackRate=selected[key]['rate'],selectedSourceSeconds=source_end)
                if key in specs:
                    reference=np.asarray(Image.open(ROOT/'public'/specs[key]['image']).convert('RGB'),dtype=np.float32)
                    item['firstFrameReferenceMeanDifference']=round(float(np.mean(np.abs(reference-frame(path,0)))),3)
            if recognizer:
                encoded=subprocess.check_output([str(FF),'-v','error','-i',str(path),'-t',str(source_end),'-vn','-ar','16000','-ac','1','-f','wav','-'])
                audio,_=sf.read(io.BytesIO(encoded),dtype='float32')
                segments,_=recognizer.transcribe(audio,language='vi',vad_filter=True,condition_on_previous_text=False,beam_size=5)
                item['nativeAudioRecognition']=' '.join(s.text.strip() for s in segments)
            report.append(item)
            print(key+': decoded, landscape and moving'+(' | '+item.get('nativeAudioRecognition','') if args.speech else ''),flush=True)
    output=ROOT/'public/tiny-dino-homecoming/video/footage-check.json'
    output.write_text(json.dumps({'clips':len(report),'missing':missing,'compositionRendered':False,'note':'Frame differences confirm changing frames, not anatomical correctness. Native audio ASR findings require review; this is not a listening pass.','shots':report},ensure_ascii=False,indent=2)+'\n')


if __name__=='__main__':main()
