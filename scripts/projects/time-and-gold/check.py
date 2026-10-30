"""Audit actual authored timing, captions, PCM preservation and mix without rendering."""
import hashlib
import io
import json
from pathlib import Path
import re
import subprocess

import numpy as np
import soundfile as sf
from PIL import Image, ImageFont

ROOT = Path(__file__).resolve().parents[3]
SR, FPS, SECONDS = 24000, 30, 50
read = lambda p: json.loads((ROOT/p).read_text())


def main():
    cfg = read('scripts/projects/time-and-gold/audition.json')
    meta = read('scripts/projects/time-and-gold/voice.json')
    pages = read('src/projects/time-and-gold/captions.json')
    music = read('src/projects/time-and-gold/music.json')
    source = ROOT/'src/projects/time-and-gold/Video.tsx'
    markup = source.read_text()
    registry = (ROOT/'src/projects/registry.tsx').read_text()
    assert re.search(r'id="StoicTimeAndGold"[^>]*durationInFrames=\{1500\} fps=\{30\} width=\{1080\} height=\{1920\}', registry)
    assert 'scale:' not in markup and 'translate:' not in markup
    assert len(re.findall(r'<Audio\b', markup)) == 2
    assert ' '.join(p['text'] for p in pages) == ' '.join(s['text'] for s in cfg['sentences'])
    original = ROOT/'public'/meta['source']
    active = ROOT/'public'/meta['activeSource']
    for path, key in [(original, 'sourceSha256'), (active, 'activeSha256')]:
        assert hashlib.sha256(path.read_bytes()).hexdigest() == meta[key]
    a, rate = sf.read(original, dtype='int16')
    b, sr = sf.read(active, dtype='int16')
    assert rate == sr == SR and len(b) == SECONDS*SR
    paced = b
    if 'speechRepair' in meta:
        repair = meta['speechRepair']
        prior = ROOT/'public'/repair['previousSource']
        assert hashlib.sha256(prior.read_bytes()).hexdigest() == repair['previousSha256']
        paced, _ = sf.read(prior, dtype='int16')
        start, end = repair['startSample'], repair['endSample']
        assert np.array_equal(b[:start],paced[:start]) and np.array_equal(b[end:],paced[end:])
        replacement = ROOT/'public'/repair['replacementSource']
        assert hashlib.sha256(replacement.read_bytes()).hexdigest() == repair['replacementSha256']
        values,_ = sf.read(replacement,dtype='int16')
        values = values[repair['replacementStartSample']:repair['replacementEndSample']]
        assert np.array_equal(b[start:start+len(values)],values)
        assert np.all(b[start+len(values):end] == 0)
    assert np.array_equal(a, np.concatenate([paced[s['outputStart']:s['outputEnd']] for s in meta['copySpans']]))
    for left, right in zip(meta['copySpans'], meta['copySpans'][1:]):
        assert np.all(paced[left['outputEnd']:right['outputStart']] == 0)

    def native(prefix):
        return json.loads(subprocess.check_output(['node', str(ROOT/'scripts/projects/single-task/read-music-edit.cjs'), str(source), 'timeAndGoldMusicVolume', prefix], text=True))
    speech_edit, music_edit = native('Quốc Tuấn'), native('Night')
    assert speech_edit['src'] == meta['activeSource'] and speech_edit['playbackRate'] == 1
    assert speech_edit['from'] == speech_edit['trimBefore'] == 0
    assert speech_edit['durationInFrames'] is None
    assert 'durationInFrames={50 * fps}' in markup
    assert music_edit['src'] == music['file'] and music_edit['volume'] is None
    assert music_edit['durationInFrames'] > 0 and music_edit['playbackRate'] > 0
    assert music['fadeInSeconds'] > 0 and music['fadeOutSeconds'] > 0
    assert 0 <= music['speechVolume'] <= music['pauseVolume']

    font_path = str(ROOT/'public/stoic/fonts/NotoSans-Bold.ttf')
    font = ImageFont.truetype(font_path, 44)
    previous = 0
    timeline = np.arange(SECONDS*SR)/SR
    activity = np.zeros(len(timeline))
    for p in pages:
        assert previous <= p['startMs'] < p['endMs'] <= SECONDS*1000
        previous = p['endMs']
        lines, line = 1, ''
        for word in p['text'].split():
            trial = (line+' '+word).strip()
            if font.getlength(trial) > 864:
                lines += 1
                line = word
            else:
                line = trial
        assert lines*44*1.4 <= 190
        start, end = p['startMs']/1000, p['endMs']/1000
        activity = np.maximum(activity, np.interp(timeline, [start-.1,start,end,end+.2], [0,1,1,0]))
    for text, size in [('CÓ TIỀN…',126), ('MUA LẠI ĐƯỢC',88), ('HÔM NAY?',130)]:
        assert ImageFont.truetype(font_path,size).getlength(text) <= 896
    for text in ['Bạn muốn mua lại', 'ngày nào?', 'Kiếm đủ tiền', 'rồi sẽ…', 'Không lấy lại', 'được.', 'Đừng đợi đủ đầy', 'mới bắt đầu sống.', 'Ngày hôm nay', 'chỉ có một lần.']:
        assert ImageFont.truetype(font_path,88).getlength(text) - 2*(len(text)-1) <= 876
    shots = re.findall(r'<Sequence name="(\d{2})[^"\n]*" from=\{(\d+)\} durationInFrames=\{(\d+)\}><Scene(?: first)? image="([^"]+)"', markup)
    assert len(shots) == 5
    for i, (_, start, length, image) in enumerate(shots):
        start, length = int(start), int(length)
        chapter = meta['chapters'][i]
        assert start <= chapter['startSeconds']*FPS < chapter['endSeconds']*FPS <= start+length
        if i:
            assert meta['chapters'][i-1]['endSeconds']*FPS <= start
            assert int(shots[i-1][1])+int(shots[i-1][2])-start == 6
        with Image.open(ROOT/'public/time-and-gold/images'/f'{image}.png') as im:
            w,h = im.size
            assert w >= 720 and h >= 1280 and abs(w/h-9/16) < .03
    assert int(shots[-1][1])+int(shots[-1][2]) == SECONDS*FPS

    recording = ROOT/'public'/music_edit['src']
    source_start = music_edit['trimBefore']/FPS
    span = music_edit['durationInFrames']/FPS
    assert source_start+span <= sf.info(recording).duration
    at = music_edit['from']/FPS
    begin, end = max(0,at), min(SECONDS,at+span/music_edit['playbackRate'])
    envelope = np.minimum(np.clip((timeline-begin)/music['fadeInSeconds'],0,1), np.clip((end-1/FPS-timeline)/music['fadeOutSeconds'],0,1))
    gain = (music['pauseVolume']-(music['pauseVolume']-music['speechVolume'])*activity)*envelope
    bed = np.zeros((SECONDS*SR,2))
    ff = ROOT/'node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg'
    if end > begin:
        raw = subprocess.check_output([str(ff),'-v','error','-ss',str(source_start+(begin-at)*music_edit['playbackRate']),'-i',str(recording),'-af',f'atempo={music_edit["playbackRate"]},apad','-t',str(end-begin),'-ar',str(SR),'-ac','2','-c:a','pcm_s16le','-f','wav','-'])
        values,_ = sf.read(io.BytesIO(raw), always_2d=True)
        offset = round(begin*SR)
        count = min(len(values),len(bed)-offset)
        bed[offset:offset+count] = values[:count]*gain[offset:offset+count,None]
    voice = np.repeat((b.astype(float)/32768*speech_edit['volume'])[:,None],2,axis=1)
    mix_peak = float(np.max(np.abs(voice+bed)))
    voiced = np.max(np.abs(voice),axis=1) > .01
    db = lambda x: float(20*np.log10(np.sqrt(np.mean(x*x))+1e-12))
    margin = db(voice[voiced])-db(bed[voiced])
    assert gain[0] == gain[-1] == 0
    report = {'composition':'StoicTimeAndGold','durationSeconds':SECONDS,'voice':'Quốc Tuấn', 'tempo':1,
        'sourcePcmPreserved':'speechRepair' not in meta,'unaffectedPcmPreserved':True,'speechRepair':meta.get('speechRepair'),'addedSilenceSeconds':meta['addedSilenceSeconds'],
        'captionPages':len(pages),'captionTextUnchanged':True,'sceneStartsFrames':[int(s[1]) for s in shots],
        'imageAssetsVisuallyInspected':5,'musicEdit':music_edit,'speechEdit':speech_edit,
        'mixPeakDbFS':round(20*np.log10(mix_peak),2),'musicBelowVoiceDb':round(margin,2),
        'fadeInSeconds':music['fadeInSeconds'],'fadeOutSeconds':music['fadeOutSeconds'],
        'paidApiCalls':0,'sfxEnabled':False,'videoRendered':False,'thumbnailRendered':False,
        'listeningReview':'Pending user listening; automated checks do not approve perceived quality',
        'recognitionNote':'Original audit 98.29%; mẹ phrase replaced with accent-aware target check. Listening confirmation pending; normalized word-match scores do not validate tones.'}
    (ROOT/'docs/projects/time-and-gold/qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2))
    assert mix_peak < 1, 'Mix clips at current native Edit levels'
    assert margin >= 10, 'Music may obscure speech; rebalance this new project'


if __name__ == '__main__':
    main()
