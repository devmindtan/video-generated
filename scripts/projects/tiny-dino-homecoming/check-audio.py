#!/usr/bin/env python3
"""Validate runtime assets, captions and the complete 180s audio mix."""
import json
import runpy
from pathlib import Path
import numpy as np
import soundfile as sf

ROOT=Path(__file__).resolve().parents[3]
SR=24000
FPS=30
N=180*SR
ASSETS=ROOT/'public/tiny-dino-homecoming'


def read(path):
    data,sr=sf.read(path,always_2d=True)
    assert sr==SR,(path,sr)
    if data.shape[1]==1:
        data=np.repeat(data,2,axis=1)
    return data


def main():
    story=json.loads((ROOT/'scripts/projects/tiny-dino-homecoming/story.json').read_text())
    groups=json.loads((ROOT/'src/projects/tiny-dino-homecoming/captions.json').read_text())
    metadata=json.loads((ASSETS/'audio/voice-metadata.json').read_text())
    music_config=json.loads((ROOT/'src/projects/tiny-dino-homecoming/music.json').read_text())
    assert len(story)==len(groups)==len(metadata)==8
    chapters=json.loads((ROOT/'src/projects/tiny-dino-homecoming/chapters.json').read_text())
    assert [(s['id'],s['start'],s['duration']) for s in story]==[(s['id'],s['start'],s['duration']) for s in chapters]
    assert [s['start'] for s in story]==[sum(c['duration'] for c in story[:i]) for i in range(len(story))]
    assert sum(s['duration'] for s in story)==180
    voice=np.zeros((N,2))
    activity=np.zeros(180*FPS)
    times=np.arange(180*FPS)/FPS
    for scene,group,item in zip(story,groups,metadata):
        assert item['voice']=='Trúc Ly' and item['gender']=='female'
        assert item['wordMatchRatio']>=.88
        assert (ASSETS/'images'/f"{scene['id']}.png").exists()
        expected=' '.join(c['text'] for c in group)
        assert expected==scene['text'],(scene['id'],'caption text differs')
        last=0
        for caption in group:
            assert last<=caption['startMs']<caption['endMs']<=scene['duration']*1000
            last=caption['endMs']
            start=scene['start']+caption['startMs']/1000
            end=scene['start']+caption['endMs']/1000
            activity=np.maximum(activity,np.interp(times,[start-.12,start,end,end+.25],[0,1,1,0]))
        original=read(ASSETS/'audio'/item['file'])
        data=read(ASSETS/'audio/childlike'/item['file'])
        assert len(data)==len(original), 'Voice B must retain original timing'
        assert len(data)==scene['duration']*SR
        offset=scene['start']*SR
        voice[offset:offset+len(data)]=data
    score=read(ROOT/'public'/music_config['file'])
    edit=json.loads((ROOT/'src/projects/tiny-dino-homecoming/edit.json').read_text())
    sfx=read(ROOT/'public'/edit['sfxFile'])
    assert len(score)==len(sfx)==N
    base=music_config['pauseVolume']+(music_config['speechVolume']-music_config['pauseVolume'])*activity
    volume=base*np.minimum(np.interp(times,[0,music_config['fadeInSeconds']],[0,1]),np.interp(times,[180-music_config['fadeOutSeconds'],180-1/FPS],[1,0]))
    music=score*np.repeat(volume,SR//FPS)[:,None]
    mix=voice+music+sfx*edit['sfxVolume']
    peak=float(np.max(np.abs(mix)))
    assert peak<1, f'Audio clipping: peak {peak}'
    speech=np.abs(voice).max(axis=1)>.015
    voice_rms=float(np.sqrt(np.mean(voice[speech]**2)))
    music_rms=float(np.sqrt(np.mean(music[speech]**2)))
    assert music_rms<voice_rms*.5,'Music competes with narration'
    footage=json.loads((ROOT/'src/projects/tiny-dino-homecoming/footage.json').read_text())
    video_count=0
    selected_cuts=json.loads((ROOT/'src/projects/tiny-dino-homecoming/cuts-v3.json').read_text())
    for index,chapter in enumerate(chapters):
        keys=[s['key'] for s in selected_cuts[index]['shots']] if edit.get('continuityV3') else [chapter[angle+'Shot'] for angle in ['wide','close']]
        for key in keys:
            entry=footage[key]
            assert entry, f"Missing footage: {key}"
            assert (ROOT/'public'/entry['src']).is_file()
            if not edit.get('continuityV3'):
                assert abs(entry['sourceDurationSeconds']/entry['playbackRate']-chapter['duration']/2)<.04
            video_count+=1
    child_meta=json.loads((ASSETS/'audio/childlike/voice-metadata.json').read_text())
    assert child_meta['pitchSemitones']==2.5 and child_meta['durationPreserved']
    plan=runpy.run_path(str(Path(__file__).with_name('edit-timing.py')))['shot_plan'](chapters,footage,edit)
    assert abs(plan[-1]['start']+plan[-1]['duration']-180)<1e-8
    for previous,current in zip(plan,plan[1:]):
        overlap=previous['start']+previous['duration']-current['start']
        expected_overlap=edit['sceneDissolveSeconds'] if current['angle']=='wide' else edit['shotDissolveSeconds']
        assert abs(overlap-expected_overlap)<1e-8, (previous['shot'],current['shot'],overlap)
    for shot in plan:
        assert shot['playbackRate']*shot['duration']<=8+1e-8
    foley=read(ASSETS/'audio'/('homecoming-foley-v3.wav' if edit.get('continuityV3') else 'homecoming-foley-v2.wav'))
    assert len(foley)==N and np.max(np.abs(foley))>.05
    if edit.get('continuityV3'):
        sfx_report=json.loads((ASSETS/'audio/sfx-v3-check.json').read_text())
        gains={s['shot']:s['gain'] for s in sfx_report['shots']}
        for key in edit.get('muteNativeShots',[]):
            assert gains[key]==0, f'Quarantined native audio must stay muted: {key}'
    expected_clips=sum(len(c['shots']) for c in selected_cuts) if edit.get('continuityV3') else 16
    assert video_count==expected_clips
    report={'durationSeconds':180,'width':1920,'height':1080,'voice':'Tí Hon B — Trúc Ly +2.5 semitones','sampleRate':SR,'peakDbFS':round(20*np.log10(peak),2),'musicBelowVoiceDb':round(20*np.log10(voice_rms/music_rms),2),'captionTextMatches':True,'wordMatchRatios':[i['wordMatchRatio'] for i in metadata],'trueMotionClips':video_count,'requiredTrueMotionClips':expected_clips,'visualStatus':'Continuation edit with no software zoom; unchanged chapter starts' if edit.get('continuityV3') else 'Two-angle edit; unchanged chapter starts','sfx':edit['sfxFile'],'foleyPresent':True,'clipping':False}
    (ASSETS/'audio/audio-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__=='__main__':
    main()
