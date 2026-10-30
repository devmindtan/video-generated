"""Read-only review of generated scene audio; extract and transcribe locally."""
import json
import subprocess
from pathlib import Path
import numpy as np
import soundfile as sf
from faster_whisper import WhisperModel

root=Path(__file__).resolve().parents[3]
ff=root/'node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg'
cache=root/'.cache/tiny-dino-sfx-review'
cache.mkdir(parents=True,exist_ok=True)
model=WhisperModel('small',device='cpu',compute_type='int8',cpu_threads=4,download_root=str(root/'.cache/whisper'))
report=[]
for scene,clip in json.loads((root/'src/projects/tiny-dino-adventure/footage.json').read_text()).items():
    target=cache/f'{scene}.wav'
    subprocess.run([str(ff),'-v','error','-y','-i',str(root/'public'/clip['src']),'-vn','-ac','1','-ar','16000',str(target)],check=True)
    data,sr=sf.read(target)
    segments,_=model.transcribe(data.astype('float32'),language='vi',vad_filter=True,condition_on_previous_text=False)
    report.append({'scene':scene,'rmsDb':round(20*np.log10(max(np.sqrt(np.mean(data*data)),1e-9)),1),'recognizedSpeech':' '.join(s.text for s in segments)})
print(json.dumps(report,ensure_ascii=False,indent=2))
(cache/'review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
