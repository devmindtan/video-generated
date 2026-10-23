import React from 'react';
import {Audio} from '@remotion/media';
import type {Caption} from '@remotion/captions';
import {
  AbsoluteFill,
  CanvasImage,
  Easing,
  Sequence,
  Track,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import '../../shared/stoic-fonts';
import captionsData from './captions.json';
import musicConfig from './music.json';

const GOLD = '#ddb66d';
const RED = '#cc7267';
const IVORY = '#f2eee6';
const BG = '#020304';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const SCENE_STARTS = [0, 8, 19, 31, 40];

const SceneFade: React.FC<{readonly seconds: number; readonly children: React.ReactNode}> = ({seconds, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const last = seconds * fps - 1;
  return <AbsoluteFill style={{overflow: 'hidden', background: BG, opacity: interpolate(frame, [0, .18 * fps, last - .16 * fps, last], [0, 1, 1, 0], clamp)}}>{children}</AbsoluteFill>;
};

const Grade = () => <>
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(1,2,3,.05), transparent 34%, rgba(1,2,3,.68) 64%, #020304 96%)'}} />
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 31%, transparent 18%, rgba(0,0,0,.48) 100%)'}} />
</>;

const Heading: React.FC<{readonly eyebrow: string; readonly top?: number; readonly children: React.ReactNode}> = ({eyebrow, top = 1060, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <div style={{position: 'absolute', left: 82, right: 78, top, opacity: interpolate(frame, [.05 * fps, .45 * fps], [0, 1], clamp), translate: `${interpolate(frame, [0, .52 * fps], [-44, 0], {...clamp, easing: Easing.out(Easing.cubic)})}px 0`}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 17, marginBottom: 22, color: GOLD, fontSize: 22, letterSpacing: 4.1, fontWeight: 400}}><span style={{width: 48, height: 3, background: RED}} />{eyebrow}</div>
    <div style={{fontSize: 83, fontWeight: 700, lineHeight: 1.12, letterSpacing: -3.3, textShadow: '0 7px 32px rgba(0,0,0,.95)'}}>{children}</div>
  </div>;
};

const Captions: React.FC<{readonly index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const now = frame / fps * 1000;
  const caption = (captionsData[index] as Caption[]).find((item) => now >= item.startMs && now < item.endMs);
  if (!caption) return null;
  const highlighted = /gác mọi việc|mặc định|luôn có sẵn|không có giới hạn|nghĩa vụ|món quà|khoảng trống|thao túng|đang bận|nhờ vả|tôn trọng|thời gian|ích kỷ|giới hạn|nói “có”|ranh giới|tâm lý cuộc sống/gi;
  const parts = caption.text.split(highlighted);
  const matches = caption.text.match(highlighted) ?? [];
  return <div style={{position: 'absolute', left: 82, right: 78, top: 1510, minHeight: 155, color: IVORY, fontSize: 43, fontWeight: 700, lineHeight: 1.42, textShadow: '0 3px 17px #000', opacity: interpolate(now - caption.startMs, [0, 105], [.1, 1], clamp)}}>{parts.map((part, i) => <React.Fragment key={i}>{part}{matches[i] && <span style={{color: GOLD}}>{matches[i]}</span>}</React.Fragment>)}</div>;
};

const CageScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const shut = interpolate(frame, [1.7 * fps, 4.4 * fps], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const impact = interpolate(frame, [4.25 * fps, 4.45 * fps, 4.8 * fps], [0, .34, 0], clamp);
  return <SceneFade seconds={8}>
    <CanvasImage src={staticFile('boundaries/images/01-cage-open.png')} style={{width: '100%', height: '100%', objectFit: 'cover', scale: 1.035}} />
    <AbsoluteFill style={{opacity: shut}}>
      <CanvasImage src={staticFile('boundaries/images/01-cage-closed.png')} style={{width: '100%', height: '100%', objectFit: 'cover', scale: 1.035}} />
    </AbsoluteFill>
    {Array.from({length: 26}, (_, i) => <div key={i} style={{position: 'absolute', left: 130 + random(`cage-dust-x-${i}`) * 820 + Math.sin(frame / 24 + i) * 32, top: 160 + ((random(`cage-dust-y-${i}`) * 950 + frame * (.28 + i * .009)) % 1050), width: 4 + i % 4, height: 4 + i % 4, borderRadius: '50%', background: '#d9e8f4', opacity: .16 + Math.sin(frame / 17 + i) ** 2 * .3, boxShadow: '0 0 8px rgba(220,235,246,.5)'}} />)}
    <AbsoluteFill style={{background: `rgba(210,225,237,${impact})`}} />
    <Grade /><Heading eyebrow="ĐỪNG ĐỂ LÒNG TỐT THÀNH MẶC ĐỊNH" top={1035}>Lòng tốt cần<br /><span style={{color: RED}}>có ranh giới.</span></Heading><Captions index={0} />
  </SceneFade>;
};

const WatchScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const lift = interpolate(frame, [.8 * fps, 5.2 * fps], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const handRotation = interpolate(frame, [0, 4.5 * fps], [-48, 42], clamp);
  const shards = [
    {x: 190, y: 345, w: 118, h: 96, dx: -84, dy: -88, r: -35},
    {x: 740, y: 520, w: 145, h: 112, dx: 96, dy: -62, r: 28},
    {x: 255, y: 665, w: 126, h: 95, dx: -72, dy: -108, r: 42},
    {x: 625, y: 272, w: 102, h: 120, dx: 55, dy: -94, r: -26},
    {x: 475, y: 760, w: 136, h: 82, dx: 12, dy: -125, r: 22},
  ];
  return <SceneFade seconds={11}>
    <CanvasImage src={staticFile('boundaries/images/02-watch.png')} style={{width: '100%', height: '100%', objectFit: 'cover', scale: interpolate(frame, [0, 11 * fps - 1], [1.03, 1.1], {...clamp, output: 'perceptual-scale'}), transformOrigin: '52% 31%'}} />
    {shards.map((s, i) => <div key={i} style={{position: 'absolute', left: s.x + s.dx * lift, top: s.y + s.dy * lift, width: s.w, height: s.h, clipPath: i % 2 ? 'polygon(8% 10%, 94% 0, 74% 100%, 0 72%)' : 'polygon(0 16%, 85% 0, 100% 83%, 23% 100%)', background: 'linear-gradient(135deg, rgba(240,248,255,.42), rgba(145,175,195,.08))', border: '2px solid rgba(225,240,250,.6)', rotate: `${s.r * lift}deg`, opacity: .12 + lift * .68, boxShadow: '0 0 18px rgba(210,230,242,.16)', backdropFilter: 'blur(1px)'}} />)}
    <div style={{position: 'absolute', left: 535, top: 395, width: 4, height: 177, background: '#d3a454', transformOrigin: '50% 100%', rotate: `${handRotation}deg`, boxShadow: '0 0 8px rgba(221,182,109,.65)', opacity: .88}} />
    <div style={{position: 'absolute', left: 524, top: 558, width: 26, height: 26, borderRadius: '50%', background: GOLD, boxShadow: '0 0 14px rgba(221,182,109,.7)'}} />
    <Grade /><Heading eyebrow="KHI NHIỆT TÌNH THÀNH NGHĨA VỤ">Có sẵn quá lâu<br /><span style={{color: RED}}>sẽ thành mặc định.</span></Heading><Captions index={1} />
  </SceneFade>;
};

const BoundaryScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const turn = interpolate(frame, [3.1 * fps, 6.3 * fps], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return <SceneFade seconds={12}>
    <AbsoluteFill style={{opacity: 1 - turn}}>
      <CanvasImage src={staticFile('boundaries/images/03-figure-front.png')} style={{width: '100%', height: '100%', objectFit: 'cover', scale: 1.035}} />
    </AbsoluteFill>
    <AbsoluteFill style={{opacity: turn, scale: 1.13 - turn * .115, translate: `0px ${72 - turn * 80}px`, transformOrigin: '50% 28%'}}>
      <CanvasImage src={staticFile('boundaries/images/03-figure-away.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
    {[0, 1, 2, 3].map((i) => <div key={i} style={{position: 'absolute', left: 55 + i * 288, top: 360 + (i % 2) * 215, width: 170, height: 300, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(246,157,60,.25), transparent 65%)', filter: 'blur(14px)', opacity: .34 + Math.sin(frame * (.19 + i * .015)) * .11, scale: `${1 + Math.sin(frame * .27 + i) * .09}`}} />)}
    <AbsoluteFill style={{background: `linear-gradient(90deg, transparent 28%, rgba(0,0,0,${turn * .2}) 58%, rgba(0,0,0,${turn * .5}) 100%)`}} />
    <Grade /><Heading eyebrow="QUY TẮC SỐ 1">Giữ lại<br /><span style={{color: GOLD}}>khoảng trống.</span></Heading><Captions index={2} />
  </SceneFade>;
};

const InkScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const spread = interpolate(frame, [.55 * fps, 6.6 * fps], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const paths = [
    'M605 680 C520 730 435 775 292 812 C215 831 142 860 66 905',
    'M598 688 C560 773 590 835 532 925 C500 973 456 1004 410 1054',
    'M603 688 C690 738 734 804 842 833 C905 850 965 899 1032 952',
    'M548 765 C472 798 420 851 362 893',
    'M704 770 C777 742 845 733 930 756',
  ];
  return <SceneFade seconds={9}>
    <CanvasImage src={staticFile('boundaries/images/04-ink.png')} style={{width: '100%', height: '100%', objectFit: 'cover', scale: 1.04, translate: `${interpolate(frame, [0, 9 * fps - 1], [-22, 18], clamp)}px 0`}} />
    <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>{paths.map((d, i) => <path key={d} d={d} fill="none" stroke="#050404" strokeWidth={16 - i * 1.8} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1250" strokeDashoffset={1250 * (1 - spread)} />)}</svg>
    {[{x: 545, y: 694, s: 180}, {x: 430, y: 835, s: 125}, {x: 720, y: 795, s: 150}].map((b, i) => <div key={i} style={{position: 'absolute', left: b.x - b.s / 2, top: b.y - b.s / 2, width: b.s, height: b.s * .56, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(3,2,2,.96), rgba(10,4,4,.78) 44%, transparent 73%)', scale: interpolate(spread, [0, 1], [.08, 1.55 - i * .1], {...clamp, output: 'perceptual-scale'}), opacity: spread}} />)}
    <Grade /><Heading eyebrow="HỌC CÁCH NÓI “KHÔNG”" top={1050}>Thời gian của bạn<br /><span style={{color: RED}}>có giá.</span></Heading><Captions index={3} />
  </SceneFade>;
};

const KingScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <SceneFade seconds={5}>
    <CanvasImage src={staticFile('boundaries/images/05-king.png')} style={{width: '100%', height: '100%', objectFit: 'cover', scale: interpolate(frame, [0, 5 * fps - 1], [1.01, 1.32], {...clamp, easing: Easing.in(Easing.cubic), output: 'perceptual-scale'}), translate: `0 ${interpolate(frame, [0, 5 * fps - 1], [70, -48], clamp)}px`, transformOrigin: '50% 27%'}} />
    {[0, 1, 2].map((i) => <div key={i} style={{position: 'absolute', left: -560 + i * 390 + frame * (1.5 + i * .3), top: 510 + i * 170, width: 1250, height: 280, rotate: '-8deg', opacity: .08 - i * .015, background: 'radial-gradient(ellipse, #d6e0e8 0%, transparent 67%)', filter: 'blur(28px)'}} />)}
    <Grade /><Heading eyebrow="BIẾT GIÁ TRỊ CỦA MÌNH" top={1045}>Tử tế.<br /><span style={{color: GOLD}}>Có ranh giới.</span></Heading><Captions index={4} />
    <div style={{position: 'absolute', left: 82, top: 1755, color: GOLD, fontSize: 22, letterSpacing: 3.1, opacity: interpolate(frame, [2.9 * fps, 3.5 * fps], [0, 1], clamp)}}>THEO DÕI · TÂM LÝ CUỘC SỐNG</div>
  </SceneFade>;
};

export const boundariesMusicVolume = (frame: number, fps: number): number => {
  const seconds = frame / fps;
  const activity = Math.max(0, ...captionsData.flatMap((group, sceneIndex) => group.map((caption) => {
    const start = SCENE_STARTS[sceneIndex] + caption.startMs / 1000;
    const end = SCENE_STARTS[sceneIndex] + caption.endMs / 1000;
    return interpolate(seconds, [start - .12, start + .1, end - .1, end + .22], [0, 1, 1, 0], clamp);
  })));
  const base = musicConfig.pauseVolume - (musicConfig.pauseVolume - musicConfig.speechVolume) * activity;
  const fadeIn = interpolate(seconds, [0, musicConfig.fadeInSeconds], [0, 1], clamp);
  const lifted = interpolate(seconds, [musicConfig.finalLiftStartSeconds, musicConfig.finalLiftPeakSeconds], [base, musicConfig.finalLiftVolume], clamp);
  const fadeOut = interpolate(seconds, [musicConfig.videoEndSeconds - musicConfig.fadeOutSeconds, musicConfig.videoEndSeconds - 1 / fps], [1, 0], clamp);
  return lifted * Math.min(fadeIn, fadeOut);
};

export const BoundariesVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: BG, color: IVORY, fontFamily: 'Stoic Sans, sans-serif'}}>
    <Track name="Năm cảnh · Lòng tốt và ranh giới · 45 giây">
      <Sequence name="Lồng chim khép lại" from={0} durationInFrames={8 * fps}><CageScene /></Sequence>
      <Sequence name="Sự nhiệt tình thành nghĩa vụ" from={8 * fps} durationInFrames={11 * fps}><WatchScene /></Sequence>
      <Sequence name="Giữ lại khoảng trống" from={19 * fps} durationInFrames={12 * fps}><BoundaryScene /></Sequence>
      <Sequence name="Học cách nói không" from={31 * fps} durationInFrames={9 * fps}><InkScene /></Sequence>
      <Sequence name="Biết giá trị của mình" from={40 * fps} durationInFrames={5 * fps}><KingScene /></Sequence>
    </Track>
    <Track name="Lời đọc · Thiện Minh · Sắc lạnh và dứt khoát">
      <Audio from={0} durationInFrames={8 * fps} src={staticFile('boundaries/audio/01-cage-voice-full.wav')} />
      <Audio from={8 * fps} durationInFrames={11 * fps} src={staticFile('boundaries/audio/02-watch-voice-full.wav')} />
      <Audio from={19 * fps} durationInFrames={12 * fps} src={staticFile('boundaries/audio/03-boundary-voice-full.wav')} />
      <Audio from={31 * fps} durationInFrames={9 * fps} src={staticFile('boundaries/audio/04-no-voice-full.wav')} />
      <Audio from={40 * fps} durationInFrames={5 * fps} src={staticFile('boundaries/audio/05-king-voice-full.wav')} />
    </Track>
    <Audio
      name="Night · 0,90× · Giữ nguyên cao độ"
      src={staticFile(musicConfig.file)}
      trimBefore={musicConfig.sourceStartSeconds * fps}
      durationInFrames={45 * fps}
      playbackRate={musicConfig.playbackRate}
      toneFrequency={musicConfig.toneFrequency}
      fallbackHtml5AudioProps={{preservePitch: musicConfig.preservePitch}}
      volume={boundariesMusicVolume(frame, fps)}
    />
  </AbsoluteFill>;
};
