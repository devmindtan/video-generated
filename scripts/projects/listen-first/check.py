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
SR, FPS = 24000, 30
read = lambda p: json.loads((ROOT/p).read_text())


def main():
    cfg = read('scripts/projects/listen-first/audition.json')
    meta = read('scripts/projects/listen-first/voice.json')
    SECONDS = meta['durationSeconds']
    assert SECONDS == 45, 'User requested a 45-second editorial cut'
    pages = read('src/projects/listen-first/captions.json')
    music = read('src/projects/listen-first/music.json')
    source = ROOT/'src/projects/listen-first/Video.tsx'
    markup = source.read_text()
    registry = (ROOT/'src/projects/registry.tsx').read_text()
    assert f'id="StoicListenFirst" component={{ListenFirstVideo}} durationInFrames={{{SECONDS*FPS}}} fps={{30}} width={{1080}} height={{1920}}' in registry
    assert 'scale:' not in markup and 'translate:' not in markup
    assert len(re.findall(r'<Audio\b', markup)) == 2
    assert ' '.join(p['text'] for p in pages) == ' '.join(s['text'] for s in cfg['sentences'])
    original = ROOT/'public'/meta['source']
    active = ROOT/'public'/meta['activeSource']
    for path, key in [(original, 'sourceSha256'), (active, 'activeSha256')]:
        assert hashlib.sha256(path.read_bytes()).hexdigest() == meta[key]
    a, rate = sf.read(original, dtype='int16')
    if meta.get('sourceAssembly'):
        assembly = read('public/'+meta['sourceAssembly'])
        for span in assembly['copyMap']:
            input_path = ROOT/'public'/span['source']
            assert hashlib.sha256(input_path.read_bytes()).hexdigest() == span['sha256']
            values, input_rate = sf.read(input_path, dtype='int16')
            assert input_rate == SR
            assert np.array_equal(a[span['outputStart']:span['outputEnd']], values[span['sourceStart']:span['sourceEnd']])
        # Gaps introduced while removing clauses must contain silence, not a
        # clipped remainder of a discarded sentence.
        cursor = 0
        for span in assembly['copyMap']:
            assert np.all(a[cursor:span['outputStart']] == 0)
            cursor = span['outputEnd']
        assert np.all(a[cursor:] == 0)
    b, sr = sf.read(active, dtype='int16')
    assert rate == sr == SR and len(b) == SECONDS*SR
    paced = b
    if meta.get('pacingEdit'):
        # All copied samples must match. Only digital silence may be removed
        # from source gaps or inserted into output gaps.
        source_cursor = output_cursor = 0
        for span in meta['copySpans']:
            assert np.all(a[source_cursor:span['sourceStart']] == 0)
            assert np.all(b[output_cursor:span['outputStart']] == 0)
            assert np.array_equal(a[span['sourceStart']:span['sourceEnd']], b[span['outputStart']:span['outputEnd']])
            source_cursor, output_cursor = span['sourceEnd'], span['outputEnd']
        assert np.all(a[source_cursor:] == 0) and np.all(b[output_cursor:] == 0)
        assert np.array_equal(a[a!=0], b[b!=0]), 'Do not change speech PCM to adjust pacing'
        outside = np.ones(len(a), dtype=bool)
        for region in meta['pacingEdit']['regions']:
            outside[region['startSample']:region['endSample']] = False
        assert np.array_equal(a[outside], b[outside]), 'Keep timing outside edited regions'
    else:
        assert np.array_equal(a, np.concatenate([paced[s['outputStart']:s['outputEnd']] for s in meta['copySpans']]))
    for left, right in zip(meta['copySpans'], meta['copySpans'][1:]):
        assert np.all(paced[left['outputEnd']:right['outputStart']] == 0)

    def native(prefix):
        return json.loads(subprocess.check_output(['node', str(ROOT/'scripts/projects/single-task/read-music-edit.cjs'), str(source), 'listenFirstMusicVolume', prefix], text=True))
    speech_edit, music_edit = native('Quốc Tuấn'), native(music['credit']['title'])
    assert speech_edit['src'] == meta['activeSource'] and speech_edit['playbackRate'] == 1
    assert speech_edit['from'] == speech_edit['trimBefore'] == 0
    assert speech_edit['durationInFrames'] is None
    assert f'durationInFrames={{{SECONDS} * fps}}' in markup
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
    for text, size in [('LẮNG NGHE…',100), ('HAY ĐANG',100), ('CHẤM ĐIỂM?',112)]:
        assert ImageFont.truetype(font_path,size).getlength(text) <= 896
    for text in ['Chưa nghe hết.', 'Đã vội khuyên.', 'Bạn muốn giúp.', 'Họ lại thấy áp lực.', 'Cần an ủi.', 'Lại bị chấm điểm.', 'Họ biết phải làm.', 'Chỉ là chưa đủ sức.', 'Cùng tìm cách?', 'Hay chỉ ngồi nghe?', 'Có người hiểu.', 'Có thêm sức.']:
        assert ImageFont.truetype(font_path,88).getlength(text) - 2*(len(text)-1) <= 876
    shots = re.findall(r'<Sequence name="(\d{2})[^"\n]*" from=\{(\d+)\} durationInFrames=\{(\d+)\}><Scene(?: first)? image="([^"]+)"', markup)
    assert len(shots) == 6
    for i, (_, start, length, image) in enumerate(shots):
        start, length = int(start), int(length)
        chapter = meta['chapters'][i]
        assert start <= chapter['startSeconds']*FPS < chapter['endSeconds']*FPS <= start+length
        if i:
            assert meta['chapters'][i-1]['endSeconds']*FPS <= start
            assert int(shots[i-1][1])+int(shots[i-1][2])-start == 6
        with Image.open(ROOT/'public/listen-first/images'/f'{image}.png') as im:
            w,h = im.size
            assert w >= 720 and h >= 1280 and abs(w/h-9/16) < .03
    assert int(shots[-1][1])+int(shots[-1][2]) == SECONDS*FPS
    with Image.open(ROOT/'public/listen-first/images/03-judged.png') as im:
        w,h = im.size
        assert w >= 720 and h >= 1280 and abs(w/h-9/16) < .03

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
    report = {'composition':'StoicListenFirst','durationSeconds':SECONDS,'voice':'Quốc Tuấn', 'tempo':1,
        'sourcePcmPreserved':not bool(meta.get('pacingEdit')),'speechPcmPreserved':True,
        'redistributedSilenceSeconds':meta.get('pacingEdit',{}).get('redistributedSilenceSeconds',0),
        'sourceDurationSeconds':meta['sourceDurationSeconds'],'addedSilenceSeconds':meta['addedSilenceSeconds'],
        'captionPages':len(pages),'captionTextUnchanged':True,'sceneStartsFrames':[int(s[1]) for s in shots],
        'imageAssetsVisuallyInspected':6,'musicEdit':music_edit,'speechEdit':speech_edit,
        'mixPeakDbFS':round(20*np.log10(mix_peak),2),'musicBelowVoiceDb':round(margin,2),
        'fadeInSeconds':music['fadeInSeconds'],'fadeOutSeconds':music['fadeOutSeconds'],
        'paidApiCalls':0,'sfxEnabled':False,'videoRendered':False,'thumbnailRendered':False,
        'listeningReview':'Pending user listening; automated checks do not approve perceived quality',
        'recognitionNote':meta.get('recognitionNote', 'Raw Vietnamese ASR reviewed separately; word-match does not establish tone accuracy; listening review pending.')}
    (ROOT/'docs/projects/listen-first/qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2))
    assert mix_peak < 1, 'Mix clips at current native Edit levels'
    assert margin >= 10, 'Music may obscure speech; rebalance this new project'


if __name__ == '__main__':
    main()
