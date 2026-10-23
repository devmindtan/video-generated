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

const GOLD = '#dcb874';
const IVORY = '#f3efe6';
const BG = '#020508';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const SCENE_STARTS = [0, 8, 20, 32, 41];
const VIDEO_DURATION_SECONDS = 48;

type Motion = 'push' | 'pan' | 'rise' | 'pull' | 'still';
type SceneProps = {
  readonly image: string;
  readonly seconds: number;
  readonly index: number;
  readonly motion: Motion;
  readonly children: React.ReactNode;
};

const SceneEffect: React.FC<{readonly index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  if (index === 0) {
    return <AbsoluteFill style={{overflow: 'hidden'}}>{Array.from({length: 27}, (_, i) => {
      const x = random(`forgive-rain-x-${i}`) * 1160 - 40;
      const speed = 17 + random(`forgive-rain-speed-${i}`) * 18;
      const y = (random(`forgive-rain-y-${i}`) * 2150 + frame * speed) % 2150 - 130;
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: 2, height: 42 + random(`forgive-rain-h-${i}`) * 55, rotate: '8deg', opacity: 0.07 + random(`forgive-rain-o-${i}`) * 0.16, background: 'linear-gradient(transparent, #dbe9f6, transparent)', filter: 'blur(.3px)'}} />;
    })}</AbsoluteFill>;
  }

  if (index === 1) {
    const glow = 0.2 + (Math.sin(frame * 0.31) + Math.sin(frame * 0.17 + 2)) * 0.025;
    return <><div style={{position: 'absolute', left: 390, top: 310, width: 420, height: 520, borderRadius: '50%', background: `radial-gradient(circle, rgba(255,183,75,${glow}), transparent 67%)`, filter: 'blur(18px)'}} />{Array.from({length: 10}, (_, i) => <div key={i} style={{position: 'absolute', left: 460 + random(`ember-x-${i}`) * 260, top: 580 - ((frame * (0.28 + i * 0.012) + random(`ember-y-${i}`) * 300) % 330), width: 3, height: 3, borderRadius: '50%', background: GOLD, opacity: 0.15 + Math.sin(frame / 18 + i) ** 2 * 0.2}} />)}</>;
  }

  if (index === 2) {
    const pulse = 0.12 + Math.sin(frame / 25) * 0.025;
    return <><AbsoluteFill style={{background: `radial-gradient(ellipse at 53% 42%, rgba(240,178,70,${pulse}), transparent 46%)`}} />{Array.from({length: 16}, (_, i) => {
      const y = 1310 - ((frame * (0.35 + i * 0.018) + random(`gold-y-${i}`) * 760) % 850);
      return <div key={i} style={{position: 'absolute', left: 300 + random(`gold-x-${i}`) * 480 + Math.sin(frame / 35 + i) * 13, top: y, width: 3 + i % 3, height: 3 + i % 3, borderRadius: '50%', background: '#f2cb79', boxShadow: '0 0 12px #dca84e', opacity: 0.12 + Math.sin(frame / 24 + i) ** 2 * 0.3}} />;
    })}</>;
  }

  if (index === 3) {
    return <>{[0, 1, 2].map((i) => <div key={i} style={{position: 'absolute', left: -520 + i * 280 + Math.sin(frame / (70 + i * 8)) * 110, top: 650 + i * 100, width: 1450, height: 250, rotate: '-7deg', opacity: 0.08 - i * 0.014, background: 'radial-gradient(ellipse, #fff3d0 0%, transparent 68%)', filter: 'blur(25px)'}} />)}</>;
  }

  const rippleAge = (frame / fps) % 2.5;
  return <>{[0, 0.82, 1.64].map((offset, i) => {
    const age = (rippleAge + offset) % 2.5;
    const scale = interpolate(age, [0, 2.5], [0.25, 1.85]);
    return <div key={i} style={{position: 'absolute', left: 400, top: 706, width: 255, height: 74, borderRadius: '50%', border: '2px solid rgba(235,207,150,.65)', transform: `scale(${scale})`, opacity: interpolate(age, [0, 0.35, 2.5], [0, 0.45, 0], clamp), filter: 'blur(.4px)'}} />;
  })}</>;
};

const Scene: React.FC<SceneProps> = ({image, seconds, index, motion, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const last = seconds * fps - 1;
  const scaleStart = motion === 'pull' ? 1.105 : 1.02;
  const scaleEnd = motion === 'push' ? 1.105 : motion === 'pull' ? 1.025 : motion === 'still' ? 1.035 : 1.075;
  const xStart = motion === 'pan' ? -44 : 0;
  const xEnd = motion === 'pan' ? 38 : 0;
  const yStart = motion === 'rise' ? 38 : 0;
  const yEnd = motion === 'rise' ? -36 : 0;
  const sceneOpacity = interpolate(frame, [0, 0.28 * fps, last - 0.24 * fps, last], [0, 1, 1, 0], clamp);

  return <AbsoluteFill style={{background: BG, overflow: 'hidden', opacity: sceneOpacity}}>
    <CanvasImage src={staticFile(`forgiveness/images/${image}.png`)} style={{width: '100%', height: '100%', objectFit: 'cover', scale: interpolate(frame, [0, last], [scaleStart, scaleEnd], {...clamp, output: 'perceptual-scale'}), translate: `${interpolate(frame, [0, last], [xStart, xEnd], {...clamp, easing: Easing.inOut(Easing.sin)})}px ${interpolate(frame, [0, last], [yStart, yEnd], {...clamp, easing: Easing.inOut(Easing.sin)})}px`, transformOrigin: index === 0 ? '49% 36%' : index === 1 ? '58% 35%' : index === 4 ? '48% 39%' : '50% 37%'}} />
    <SceneEffect index={index} />
    <AbsoluteFill style={{background: index >= 3 ? 'linear-gradient(180deg, rgba(2,5,8,.03), transparent 39%, rgba(2,5,8,.55) 65%, #020508 95%)' : 'linear-gradient(180deg, rgba(2,5,8,.12), transparent 32%, rgba(2,5,8,.69) 64%, #020508 95%)'}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 33%, transparent 19%, rgba(0,0,0,.47) 100%)'}} />
    {children}
  </AbsoluteFill>;
};

const Heading: React.FC<{readonly eyebrow: string; readonly top?: number; readonly children: React.ReactNode}> = ({eyebrow, top = 1075, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <div style={{position: 'absolute', left: 82, right: 80, top, opacity: interpolate(frame, [0.12 * fps, 0.78 * fps], [0, 1], clamp), translate: `0 ${interpolate(frame, [0, 1.05 * fps], [32, 0], {...clamp, easing: Easing.out(Easing.cubic)})}px`}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 17, marginBottom: 22, color: GOLD, fontSize: 23, letterSpacing: 4.3, fontWeight: 400}}><span style={{width: 46, height: 2, background: GOLD}} />{eyebrow}</div>
    <div style={{fontSize: 82, fontWeight: 700, lineHeight: 1.13, letterSpacing: -3.2, textShadow: '0 7px 31px rgba(0,0,0,.92)'}}>{children}</div>
  </div>;
};

const Captions: React.FC<{readonly index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const now = frame / fps * 1000;
  const captions = captionsData[index] as Caption[];
  const caption = captions.find((item) => now >= item.startMs && now < item.endMs);
  if (!caption) return null;
  const highlighted = /tự trách mình|kỳ vọng|hiểu biết hôm nay|hôm qua|tốt nhất|vết nứt|kém giá trị|can đảm đứng dậy|bước tiếp|tha thứ|phiên tòa|tàn nhẫn nhất|không hề muộn|kiên nhẫn/gi;
  const parts = caption.text.split(highlighted);
  const matches = caption.text.match(highlighted) ?? [];
  return <div style={{position: 'absolute', left: 82, right: 80, top: 1515, minHeight: 150, color: IVORY, fontSize: 43, fontWeight: 700, lineHeight: 1.43, textShadow: '0 3px 16px #000', opacity: interpolate(now - caption.startMs, [0, 150], [0.08, 1], clamp)}}>{parts.map((part, i) => <React.Fragment key={i}>{part}{matches[i] && <span style={{color: GOLD}}>{matches[i]}</span>}</React.Fragment>)}</div>;
};

const RemorseScene = () => <Scene image="01-remorse" seconds={8} index={0} motion="push"><Heading eyebrow="GỬI NGƯỜI ĐANG QUÁ KHẮT KHE" top={1050}>Bạn không cần<br /><span style={{color: GOLD}}>phải hoàn hảo.</span></Heading><Captions index={0} /></Scene>;
const MirrorScene = () => <Scene image="02-mirror" seconds={12} index={1} motion="pan"><Heading eyebrow="ĐỪNG KẾT TỘI QUÁ KHỨ">Khi ấy, bạn đã làm<br /><span style={{color: GOLD}}>điều mình có thể.</span></Heading><Captions index={1} /></Scene>;
const KintsugiScene = () => <Scene image="03-kintsugi" seconds={12} index={2} motion="rise"><Heading eyebrow="GIÁ TRỊ KHÔNG BIẾN MẤT">Vết nứt cũng kể<br /><span style={{color: GOLD}}>chuyện đứng dậy.</span></Heading><Captions index={2} /></Scene>;
const ForgiveScene = () => <Scene image="04-forgive-v2" seconds={9} index={3} motion="pull"><Heading eyebrow="THA THỨ CHO CHÍNH MÌNH" top={1055}>Đừng biến tâm trí<br /><span style={{color: GOLD}}>thành phiên tòa.</span></Heading><Captions index={3} /></Scene>;
const BreatheScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <Scene image="05-breathe" seconds={7} index={4} motion="still"><Heading eyebrow="HÃY KIÊN NHẪN" top={1065}>Bạn không<br /><span style={{color: GOLD}}>hề muộn.</span></Heading><Captions index={4} /><div style={{position: 'absolute', left: 82, top: 1750, color: GOLD, fontSize: 22, letterSpacing: 3.1, opacity: interpolate(frame, [4.25 * fps, 5.05 * fps], [0, 1], clamp)}}>LƯU LẠI · KHI BẠN CẦN BAO DUNG VỚI MÌNH</div></Scene>;
};

export const forgivenessMusicVolume = (frame: number, fps: number): number => {
  const seconds = frame / fps;
  const voiceActivity = Math.max(0, ...captionsData.flatMap((group, sceneIndex) => group.map((caption) => {
    const start = SCENE_STARTS[sceneIndex] + caption.startMs / 1000;
    const end = SCENE_STARTS[sceneIndex] + caption.endMs / 1000;
    return interpolate(seconds, [start - 0.15, start + 0.12, end - 0.12, end + 0.25], [0, 1, 1, 0], clamp);
  })));
  const base = musicConfig.pauseVolume - (musicConfig.pauseVolume - musicConfig.speechVolume) * voiceActivity;
  const fadeIn = interpolate(seconds, [musicConfig.videoStartSeconds, musicConfig.videoStartSeconds + musicConfig.fadeInSeconds], [0, 1], clamp);
  const lifted = interpolate(seconds, [musicConfig.finalLiftStartSeconds, musicConfig.finalLiftPeakSeconds], [base, musicConfig.finalLiftVolume], clamp);
  const fadeOut = interpolate(seconds, [musicConfig.videoEndSeconds - musicConfig.fadeOutSeconds, musicConfig.videoEndSeconds - 1 / fps], [1, 0], clamp);
  return lifted * Math.min(fadeIn, fadeOut);
};

export const ForgivenessVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: BG, color: IVORY, fontFamily: 'Stoic Sans, sans-serif'}}>
    <Track name="Năm cảnh · Bao dung với chính mình · 48 giây">
      <Sequence name="Dừng tự trách" from={0} durationInFrames={8 * fps}><RemorseScene /></Sequence>
      <Sequence name="Thấu hiểu quá khứ" from={8 * fps} durationInFrames={12 * fps}><MirrorScene /></Sequence>
      <Sequence name="Vết nứt Kintsugi" from={20 * fps} durationInFrames={12 * fps}><KintsugiScene /></Sequence>
      <Sequence name="Tha thứ cho mình" from={32 * fps} durationInFrames={9 * fps}><ForgiveScene /></Sequence>
      <Sequence name="Thở sâu" from={41 * fps} durationInFrames={7 * fps}><BreatheScene /></Sequence>
    </Track>
    <Track name="Lời đọc · Nam trầm ấm · Thiện Minh">
      <Audio from={0} durationInFrames={8 * fps} src={staticFile('forgiveness/audio/01-remorse-voice-full.wav')} />
      <Audio from={8 * fps} durationInFrames={12 * fps} src={staticFile('forgiveness/audio/02-mirror-voice-full.wav')} />
      <Audio from={20 * fps} durationInFrames={12 * fps} src={staticFile('forgiveness/audio/03-kintsugi-voice-full.wav')} />
      <Audio from={32 * fps} durationInFrames={9 * fps} src={staticFile('forgiveness/audio/04-forgive-voice-full.wav')} />
      <Audio from={41 * fps} durationInFrames={7 * fps} src={staticFile('forgiveness/audio/05-breathe-voice-full.wav')} />
    </Track>
    <Audio name="Past Lives · Liền mạch · Không cắt" src={staticFile(musicConfig.file)} trimBefore={Math.round(musicConfig.sourceStartSeconds * fps)} durationInFrames={VIDEO_DURATION_SECONDS * fps} volume={forgivenessMusicVolume(frame, fps)} />
  </AbsoluteFill>;
};
