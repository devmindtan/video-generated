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

const GOLD = '#d9ae68';
const RED = '#bc5151';
const IVORY = '#f3efe7';
const BG = '#020304';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const SCENE_STARTS = [0, 8, 19, 31, 41];

const SceneFade: React.FC<{readonly seconds: number; readonly children: React.ReactNode}> = ({seconds, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const last = seconds * fps - 1;
  return <AbsoluteFill style={{overflow: 'hidden', background: BG, opacity: interpolate(frame, [0, .16 * fps, last - .14 * fps, last], [0, 1, 1, 0], clamp)}}>{children}</AbsoluteFill>;
};

const Grade = () => <>
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(2,3,4,.03), transparent 31%, rgba(2,3,4,.58) 61%, #020304 95%)'}} />
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 29%, transparent 18%, rgba(0,0,0,.46) 100%)'}} />
</>;

const Heading: React.FC<{readonly eyebrow: string; readonly top?: number; readonly children: React.ReactNode}> = ({eyebrow, top = 1060, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <div style={{position: 'absolute', left: 82, right: 76, top, opacity: interpolate(frame, [.04 * fps, .43 * fps], [0, 1], clamp), translate: `${interpolate(frame, [0, .55 * fps], [-48, 0], {...clamp, easing: Easing.out(Easing.cubic)})}px 0px`}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 17, marginBottom: 22, color: GOLD, fontSize: 22, letterSpacing: 3.8, fontWeight: 500}}><span style={{width: 48, height: 3, background: RED}} />{eyebrow}</div>
    <div style={{fontSize: 82, fontWeight: 750, lineHeight: 1.1, letterSpacing: -3.2, textShadow: '0 7px 34px rgba(0,0,0,.96)'}}>{children}</div>
  </div>;
};

const Captions: React.FC<{readonly index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const now = frame / fps * 1000;
  const caption = (captionsData[index] as Caption[]).find((item) => now >= item.startMs && now < item.endMs);
  if (!caption) return null;
  const highlighted = /sống tốt hơn|thất bại|tiến bộ|hạ thấp|cua trong rọ|đố kỵ|khoác áo quan tâm|lý do|giải pháp|sợ hãi|phủ nhận|thiện chí|âm thầm|kết quả|đồng thuận|bình tĩnh tiến lên|tâm lý con người/gi;
  const parts = caption.text.split(highlighted);
  const matches = caption.text.match(highlighted) ?? [];
  return <div style={{position: 'absolute', left: 82, right: 76, top: 1515, minHeight: 158, color: IVORY, fontSize: 43, fontWeight: 720, lineHeight: 1.42, textShadow: '0 3px 19px #000', opacity: interpolate(now - caption.startMs, [0, 105], [.08, 1], clamp)}}>{parts.map((part, i) => <React.Fragment key={`${part}-${i}`}>{part}{matches[i] && <span style={{color: GOLD}}>{matches[i]}</span>}</React.Fragment>)}</div>;
};

const MaskScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tear = interpolate(frame, [.7 * fps, 5.1 * fps], [.04, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return <SceneFade seconds={8}>
    <AbsoluteFill style={{scale: interpolate(frame, [0, 8 * fps - 1], [1.025, 1.12], {...clamp, output: 'perceptual-scale'}), translate: `0px ${interpolate(frame, [0, 8 * fps - 1], [10, -34], clamp)}px`, transformOrigin: '52% 28%'}}>
      <CanvasImage src={staticFile('crab-mentality/images/01-mask.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
    <div style={{position: 'absolute', left: 651, top: 425, width: 12, height: 158, borderRadius: '48% 48% 62% 62%', background: 'linear-gradient(180deg, #030303 0%, #080706 82%, rgba(0,0,0,0) 100%)', boxShadow: '0 0 7px rgba(0,0,0,.92)', scale: `1 ${tear}`, transformOrigin: '50% 0%'}} />
    <div style={{position: 'absolute', left: 644, top: 482 + tear * 105, width: 25, height: 34, borderRadius: '52% 52% 62% 62%', background: '#050505', boxShadow: '0 7px 13px rgba(0,0,0,.82)', opacity: interpolate(tear, [.26, 1], [0, .9], clamp)}} />
    {Array.from({length: 22}, (_, i) => <div key={i} style={{position: 'absolute', left: 95 + random(`mask-dust-x-${i}`) * 890 + Math.sin(frame / 23 + i) * 34, top: 120 + ((random(`mask-dust-y-${i}`) * 1080 + frame * (.25 + i * .009)) % 1140), width: 4 + i % 5, height: 4 + i % 5, borderRadius: '50%', background: '#f0d4a1', opacity: .08 + Math.sin(frame / 18 + i) ** 2 * .25, boxShadow: '0 0 8px rgba(237,193,120,.45)'}} />)}
    <Grade /><Heading eyebrow="SỰ THẬT KHÓ CHỊU" top={1040}>Không phải ai cũng vui<br /><span style={{color: RED}}>khi bạn tiến xa.</span></Heading><Captions index={0} />
  </SceneFade>;
};

const CrabsScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pulled = interpolate(frame, [2.1 * fps, 6.6 * fps], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const impact = interpolate(frame, [0, .18 * fps, .72 * fps], [.32, .12, 0], clamp);
  return <SceneFade seconds={11}>
    <AbsoluteFill style={{opacity: 1 - pulled, scale: 1.035 + pulled * .055, translate: `0px ${-pulled * 34}px`, transformOrigin: '50% 31%'}}>
      <CanvasImage src={staticFile('crab-mentality/images/02-crabs-near-rim.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
    <AbsoluteFill style={{opacity: pulled, scale: 1.105 - pulled * .045, translate: `0px ${-20 + pulled * 44}px`, transformOrigin: '50% 31%'}}>
      <CanvasImage src={staticFile('crab-mentality/images/02-crabs-pulled-down.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
    <AbsoluteFill style={{background: `rgba(172,205,224,${impact})`}} />
    <div style={{position: 'absolute', left: 180, top: 160, width: 720, height: 870, borderRadius: '42%', boxShadow: `inset 0 0 ${34 + pulled * 72}px rgba(151,194,217,${.08 + pulled * .13})`, opacity: .5}} />
    <Grade /><Heading eyebrow="ẨN DỤ “CUA TRONG RỌ”" top={1050}>Kéo người sắp thoát<br /><span style={{color: GOLD}}>quay trở lại.</span></Heading><Captions index={1} />
  </SceneFade>;
};

const DaggerScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = interpolate(frame, [4.2 * fps, 7.2 * fps], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const glint = interpolate(frame, [5.4 * fps, 6.1 * fps, 7 * fps], [0, 1, 0], clamp);
  return <SceneFade seconds={12}>
    <AbsoluteFill style={{opacity: 1 - reveal, scale: 1.035}}>
      <CanvasImage src={staticFile('crab-mentality/images/03-dagger-sheathed.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
    <AbsoluteFill style={{opacity: reveal, scale: 1.085 - reveal * .035, translate: `${-24 + reveal * 18}px ${22 - reveal * 20}px`, transformOrigin: '48% 26%'}}>
      <CanvasImage src={staticFile('crab-mentality/images/03-dagger-unsheathed.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
    <div style={{position: 'absolute', left: 235 + reveal * 300, top: 325 + reveal * 55, width: 10, height: 430, rotate: '-49deg', background: 'linear-gradient(90deg, transparent, white, transparent)', filter: 'blur(2px)', opacity: glint, boxShadow: '0 0 28px rgba(205,229,242,.9)'}} />
    <Grade /><Heading eyebrow="ĐỐ KỴ KHÔNG TỰ NHẬN TÊN" top={1040}>Lời quan tâm<br /><span style={{color: RED}}>cũng có thể là vỏ bọc.</span></Heading><Captions index={2} />
  </SceneFade>;
};

const QueenScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const hit = 4.7 * fps;
  const settle = interpolate(frame, [0, hit], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const ring = interpolate(frame, [hit, hit + 1.4 * fps], [0, 1], clamp);
  return <SceneFade seconds={10}>
    <AbsoluteFill style={{scale: interpolate(frame, [0, 10 * fps - 1], [1.01, 1.19], {...clamp, easing: Easing.inOut(Easing.cubic), output: 'perceptual-scale'}), translate: `0px ${interpolate(frame, [0, 10 * fps - 1], [38, -42], clamp)}px`, transformOrigin: '50% 30%'}}>
      <CanvasImage src={staticFile('crab-mentality/images/04-queen.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
    {[0, 1].map((i) => <div key={i} style={{position: 'absolute', left: 540 - (110 + ring * (510 + i * 130)) / 2, top: 865 - (42 + ring * (210 + i * 48)) / 2, width: 110 + ring * (510 + i * 130), height: 42 + ring * (210 + i * 48), border: `${6 - i * 2}px solid rgba(218,174,104,${(1 - ring) * (.72 - i * .18)})`, borderRadius: '50%', boxShadow: `0 0 26px rgba(218,174,104,${(1 - ring) * .35})`, opacity: frame >= hit + i * 5 ? 1 : 0}} />)}
    {[0, 1, 2].map((i) => <div key={i} style={{position: 'absolute', left: -520 + i * 430 + frame * (1.2 + i * .22), top: 480 + i * 155, width: 1180, height: 260, rotate: '-8deg', opacity: (.1 - i * .02) * (1 - settle * .58), background: 'radial-gradient(ellipse, #d6dce1 0%, transparent 68%)', filter: 'blur(29px)'}} />)}
    <Grade /><Heading eyebrow="CHIẾN LƯỢC LÀNH MẠNH" top={1045}>Chọn đúng người<br /><span style={{color: GOLD}}>để chia sẻ.</span></Heading><Captions index={3} />
  </SceneFade>;
};

const PantherScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const push = interpolate(frame, [0, 7 * fps - 1], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const eyePulse = .5 + Math.sin(frame * .18) * .18;
  return <SceneFade seconds={7}>
    <AbsoluteFill style={{scale: 1.035 + push * .24, translate: `0px ${42 - push * 115}px`, transformOrigin: '50% 27%'}}>
      <CanvasImage src={staticFile('crab-mentality/images/05-panther.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      {[458, 625].map((x) => <div key={x} style={{position: 'absolute', left: x - 24, top: 407, width: 48, height: 29, borderRadius: '50%', background: `radial-gradient(ellipse, rgba(255,206,95,${eyePulse}) 0%, rgba(220,147,43,.18) 42%, transparent 72%)`, filter: 'blur(3px)', opacity: .35 + push * .4}} />)}
    </AbsoluteFill>
    {[0, 1, 2].map((i) => <div key={i} style={{position: 'absolute', left: -690 + i * 470 + frame * (1.9 + i * .28), top: 760 + i * 110, width: 1300, height: 230, background: 'radial-gradient(ellipse, rgba(209,224,234,.46), transparent 70%)', filter: 'blur(34px)', opacity: .1 - i * .018}} />)}
    <Grade /><Heading eyebrow="KHÔNG CẦN TẤT CẢ ĐỒNG THUẬN" top={1060}>Bình tĩnh.<br /><span style={{color: GOLD}}>Tiếp tục tiến lên.</span></Heading><Captions index={4} />
    <div style={{position: 'absolute', left: 82, top: 1757, color: GOLD, fontSize: 22, letterSpacing: 3, opacity: interpolate(frame, [4.25 * fps, 4.85 * fps], [0, 1], clamp)}}>THEO DÕI · TÂM LÝ CUỘC SỐNG</div>
  </SceneFade>;
};

export const crabMentalityMusicVolume = (frame: number, fps: number): number => {
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

export const CrabMentalityVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: BG, color: IVORY, fontFamily: 'Stoic Sans, sans-serif'}}>
    <Track name="Năm cảnh · Hiệu ứng cua trong rọ · 48 giây">
      <Sequence name="Mặt nạ và giọt dầu" from={0} durationInFrames={8 * fps}><MaskScene /></Sequence>
      <Sequence name="Cua bị kéo khỏi mép lọ" from={8 * fps} durationInFrames={11 * fps}><CrabsScene /></Sequence>
      <Sequence name="Lưỡi dao dưới lời quan tâm" from={19 * fps} durationInFrames={12 * fps}><DaggerScene /></Sequence>
      <Sequence name="Chọn đúng người để chia sẻ" from={31 * fps} durationInFrames={10 * fps}><QueenScene /></Sequence>
      <Sequence name="Bình tĩnh tiến lên" from={41 * fps} durationInFrames={7 * fps}><PantherScene /></Sequence>
    </Track>
    <Track name="Lời đọc · Thiện Minh · Sắc lạnh và dứt khoát">
      <Audio from={0} durationInFrames={8 * fps} src={staticFile('crab-mentality/audio/01-mask-voice-full.wav')} />
      <Audio from={8 * fps} durationInFrames={11 * fps} src={staticFile('crab-mentality/audio/02-crabs-voice-full.wav')} />
      <Audio from={19 * fps} durationInFrames={12 * fps} src={staticFile('crab-mentality/audio/03-dagger-voice-full.wav')} />
      <Audio from={31 * fps} durationInFrames={10 * fps} src={staticFile('crab-mentality/audio/04-queen-voice-full.wav')} />
      <Audio from={41 * fps} durationInFrames={7 * fps} src={staticFile('crab-mentality/audio/05-panther-voice-full.wav')} />
    </Track>
    <Track name="SFX · Chuyển cảnh mềm và tự nhiên">
      <Audio from={7.35 * fps} durationInFrames={2.2 * fps} volume={0.16} src={staticFile('crab-mentality/sfx/soft-scene-swell.wav')} />
      <Audio from={24.45 * fps} durationInFrames={1.8 * fps} volume={0.12} src={staticFile('crab-mentality/sfx/soft-metal-glide.wav')} />
    </Track>
    <Audio
      name="Night · 0,80× · Giữ nguyên cao độ"
      src={staticFile(musicConfig.file)}
      trimBefore={musicConfig.sourceStartSeconds * fps}
      durationInFrames={48 * fps}
      playbackRate={musicConfig.playbackRate}
      toneFrequency={musicConfig.toneFrequency}
      fallbackHtml5AudioProps={{preservePitch: musicConfig.preservePitch}}
      volume={crabMentalityMusicVolume(frame, fps)}
    />
  </AbsoluteFill>;
};

