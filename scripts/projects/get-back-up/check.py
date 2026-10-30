"""Verify accepted narration, native Edit values, typography and an in-RAM mix.
No frame, thumbnail, MP4 or mix WAV is exported.
"""
import hashlib
import io
import json
from pathlib import Path
import re
import subprocess
import wave

import numpy as np
import soundfile as sf
from PIL import Image, ImageFont

ROOT=Path(__file__).resolve().parents[3]
SR,FPS,SECONDS=24000,30,41


def read(path):
    return json.loads((ROOT/path).read_text())


def main():
    voice_cfg=read('scripts/projects/get-back-up/voice.json')
    pacing=read('public/'+voice_cfg['pacingMetadata'])
    script=read('scripts/projects/get-back-up/audition.json')
    captions=read('src/projects/get-back-up/captions.json')
    music_cfg=read('src/projects/get-back-up/music.json')
    source=ROOT/'src/projects/get-back-up/Video.tsx'
    markup=source.read_text()
    registry=(ROOT/'src/projects/registry.tsx').read_text()
    assert re.search(r'id="StoicGetBackUp"[^>]*durationInFrames=\{1230\} fps=\{30\} width=\{1080\} height=\{1920\}',registry)
    assert re.search(r'<Sequence name="Quốc Tuấn \+ caption[^"\n]*" from=\{0\} durationInFrames=\{41 \* fps\}>',markup), 'Voice/caption group changed: audit picture sync'
    assert len(re.findall(r'<Audio\b',markup))==2, 'Only the approved voice and background music'
    assert 'scale:' not in markup and 'translate:' not in markup, 'Stable still-image framing, no habitual zoom'
    assert voice_cfg['voice']=='Quốc Tuấn' and voice_cfg['playbackRate']==1
    original=ROOT/'public'/voice_cfg['source']
    assert hashlib.sha256(original.read_bytes()).hexdigest()==voice_cfg['sha256'], 'Do not alter the accepted original'
    assert original.read_bytes()==(ROOT/'public'/voice_cfg['auditionSource']).read_bytes()
    path=ROOT/'public'/voice_cfg['activeSource']
    assert hashlib.sha256(path.read_bytes()).hexdigest()==pacing['outputSha256']
    base_pcm,_=sf.read(original,dtype='int16')
    paced_pcm,_=sf.read(path,dtype='int16')
    restored=np.concatenate([paced_pcm[s['outputStart']:s['outputEnd']] for s in pacing['copySpans']])
    assert np.array_equal(restored,base_pcm), 'Speech samples must remain unchanged'
    for left,right in zip(pacing['copySpans'],pacing['copySpans'][1:]):
        assert np.all(paced_pcm[left['outputEnd']:right['outputStart']]==0)
    assert captions==read('public/get-back-up/audio/pacing-v2-captions.json'), 'Keep captions synced to the paced source and .99x edit'
    assert ' '.join(p['text'] for p in captions)==' '.join(s['text'] for s in script['sentences'])

    def native(prefix):
        return json.loads(subprocess.check_output(['node',str(ROOT/'scripts/projects/single-task/read-music-edit.cjs'),str(source),'getBackUpMusicVolume',prefix],text=True))
    speech_edit=native('Quốc Tuấn')
    assert speech_edit['src']==voice_cfg['activeSource']
    assert speech_edit['from']==speech_edit['trimBefore']==0 and speech_edit['playbackRate']==voice_cfg['activePlaybackRate']
    assert speech_edit['durationInFrames'] is None, 'The full accepted WAV is grouped with captions'
    assert speech_edit['volume'] is not None and speech_edit['volume']>=0
    samples,rate=sf.read(path,always_2d=True)
    assert rate==SR and sf.info(path).subtype=='PCM_16'
    assert len(samples)/SR/speech_edit['playbackRate']<=SECONDS
    encoded=subprocess.check_output([str(ROOT/'node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg'),'-v','error','-i',str(path),'-af',f'atempo={speech_edit["playbackRate"]}','-ar',str(SR),'-ac','1','-c:a','pcm_s16le','-f','wav','-'])
    with wave.open(io.BytesIO(encoded),'rb') as wav:
        played=np.frombuffer(wav.readframes(wav.getnframes()),'<i2').astype(float)/32768
    voice=np.zeros((SECONDS*SR,2))
    voice[:len(played)]=played[:,None]*speech_edit['volume']
    timeline=np.arange(len(voice))/SR
    activity=np.zeros(len(voice))
    previous=0
    font=ImageFont.truetype(str(ROOT/'public/stoic/fonts/NotoSans-Bold.ttf'),44)
    for page in captions:
        assert previous<=page['startMs']<page['endMs']<=len(samples)/SR/speech_edit['playbackRate']*1000
        previous=page['endMs']
        line='';lines=1
        for word in page['text'].split():
            trial=(line+' '+word).strip()
            if font.getlength(trial)>864:lines+=1;line=word
            else:line=trial
        assert lines*44*1.4<=190, 'Caption overflows safe box'
        a,b=page['startMs']/1000,page['endMs']/1000
        activity=np.maximum(activity,np.interp(timeline,[a-.1,a,b,b+.2],[0,1,1,0]))

    shots=re.findall(r'<Sequence name="(\d{2})[^"\n]*" from=\{(\d+)\} durationInFrames=\{(\d+)\}><Scene(?: first)? image="([^"]+)"',markup)
    assert len(shots)==5
    phrases=pacing['phraseRanges']
    for i,(_,start,length,image_id) in enumerate(shots):
        start,length=int(start),int(length)
        assert start<=phrases[i]['startSeconds']*FPS
        assert start+length>=phrases[i]['endSeconds']*FPS
        if i:
            assert phrases[i-1]['endSeconds']*FPS<=start<=phrases[i]['startSeconds']*FPS
            assert int(shots[i-1][1])+int(shots[i-1][2])-start==6
        with Image.open(ROOT/'public/get-back-up/images'/f'{image_id}.png') as image:
            w,h=image.size
            assert w>=720 and h>=1280 and abs(w/h-9/16)<.03
    assert int(shots[0][1])==0 and int(shots[-1][1])+int(shots[-1][2])==SECONDS*FPS

    edit=native('Past Lives')
    assert edit['src']==music_cfg['file'] and edit['volume'] is None, 'Keep caption ducking/config volume'
    assert edit['playbackRate']>0 and edit['trimBefore']>=0
    assert 0<=music_cfg['speechVolume']<=music_cfg['pauseVolume']
    assert music_cfg['fadeInSeconds']>0 and music_cfg['fadeOutSeconds']>0
    recording=ROOT/'public'/edit['src']
    source_start=edit['trimBefore']/FPS
    source_span=edit['durationInFrames']/FPS if edit['durationInFrames'] is not None else sf.info(recording).duration-source_start
    assert source_span>0 and source_start+source_span<=sf.info(recording).duration+1/FPS
    at=edit['from']/FPS
    begin,end=max(0,at),min(SECONDS,at+source_span/edit['playbackRate'])
    frame=timeline*FPS
    envelope=np.minimum(np.clip((frame-begin*FPS)/(music_cfg['fadeInSeconds']*FPS),0,1),np.clip((end*FPS-1-frame)/(music_cfg['fadeOutSeconds']*FPS),0,1))
    volume=(music_cfg['pauseVolume']-(music_cfg['pauseVolume']-music_cfg['speechVolume'])*activity)*envelope
    assert volume[0]==0 and volume[-1]==0
    bed=np.zeros_like(voice)
    if end>begin:
        seek=source_start+(begin-at)*edit['playbackRate']
        raw=subprocess.check_output([str(ROOT/'node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg'),'-v','error','-ss',str(seek),'-i',str(recording),'-af',f'atempo={edit["playbackRate"]},apad','-t',str(end-begin),'-ar',str(SR),'-ac','2','-c:a','pcm_s16le','-f','wav','-'])
        with wave.open(io.BytesIO(raw),'rb') as wav:
            values=np.frombuffer(wav.readframes(wav.getnframes()),'<i2').reshape(-1,2).astype(float)/32768
        offset=round(begin*SR);count=min(len(values),len(bed)-offset)
        bed[offset:offset+count]=values[:count]*volume[offset:offset+count,None]
    peak=float(np.max(np.abs(voice+bed)))
    voiced=np.max(np.abs(voice),axis=1)>.01
    rms=lambda x:float(20*np.log10(np.sqrt(np.mean(x*x))+1e-12))
    margin=rms(voice[voiced])-rms(bed[voiced])
    warnings=[]
    if peak>=1:warnings.append('Mix exceeds0dBFS with current user gain/music settings; reduce levels before export')
    if margin<10:warnings.append('Music less than10dB below voice; user listening review needed')
    report={'composition':'StoicGetBackUp','durationSeconds':SECONDS,'dimensions':[1080,1920],
        'voice':'Quốc Tuấn','originalTakeUnchanged':True,'allOriginalPcmSamplesPreserved':True,
        'narrationTempo':speech_edit['playbackRate'],'additionalSlowdown':False,
        'addedSilenceSourceSeconds':pacing['addedSilenceSeconds'],
        'narrationDurationSeconds':round(len(samples)/SR/speech_edit['playbackRate'],5),'captionPages':len(captions),
        'captionTextUnchanged':True,'captionTimingRebasedForPausesAndUserRate':True,'sceneStartsSeconds':[round(int(s[1])/FPS,4) for s in shots],
        'imagesChecked':5,'musicEdit':edit,'voiceEdit':speech_edit,
        'speechVolume':music_cfg['speechVolume'],'pauseVolume':music_cfg['pauseVolume'],
        'fadeInSeconds':music_cfg['fadeInSeconds'],'fadeOutSeconds':music_cfg['fadeOutSeconds'],
        'mixPeakDbFS':round(float(20*np.log10(peak)),2),'musicBelowVoiceDuringSpeechDb':round(margin,2),
        'sfxEnabled':False,'geminiVeoCalls':0,'compositionRendered':False,
        'mixWarnings':warnings,
        'listeningReview':'Original voice selected; new pauses and final music mix pending user review'}
    (ROOT/'docs/projects/get-back-up/qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2))
    assert peak<1, 'Current user gain/music settings may clip: inspect before export'
    if margin<10:print(f'Listening warning: user-selected music is only {margin:.2f}dB below speech; volumes preserved, not automatically changed.')


if __name__=='__main__':main()
