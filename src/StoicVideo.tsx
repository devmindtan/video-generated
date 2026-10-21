import React from 'react';
import {Audio} from '@remotion/media';
import './stoic-fonts';
import type {Caption} from '@remotion/captions';
import {AbsoluteFill, CanvasImage, Easing, Sequence, Track, interpolate, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import captionData from './stoic-captions.json';
import musicConfig from '../scripts/stoic-music.json';

const GOLD = '#d8b77b';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;



type SceneProps = {image: string; seconds: number; index: number; children: React.ReactNode};
const Scene: React.FC<SceneProps> = ({image, seconds, index, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const last = seconds * fps - 1;
  return (
    <AbsoluteFill style={{opacity: interpolate(frame, [0, 0.3 * fps, last - 0.25 * fps, last], [0, 1, 1, 0], clamp)}}>
      <CanvasImage src={staticFile(`stoic/images/${image}.png`)} style={{width: '100%', height: '100%', objectFit: 'cover', scale: interpolate(frame, [0, last], [1.01, 1.085], {...clamp, output: 'perceptual-scale'}), transformOrigin: index === 3 ? '50% 48%' : '50% 32%'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,.3) 0%, transparent 24%, transparent 44%, rgba(4,5,7,.42) 58%, rgba(4,5,7,.93) 78%, #040507 100%)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, transparent 25%, rgba(0,0,0,.35) 100%)'}} />
      {/* Broad translucent haze drifts deterministically with the frame. */}
      <div style={{position: 'absolute', top: 750, left: -500, width: 2100, height: 440, opacity: 0.09, background: 'radial-gradient(ellipse, #b9b6ac 0%, transparent 67%)', translate: `${Math.sin(frame / (fps * 5) + index) * 190}px ${Math.cos(frame / (fps * 4)) * 50}px`, rotate: '-15deg'}} />
      {Array.from({length: 24}, (_, i) => {
        const x = random(`x-${index}-${i}`) * 1080;
        const y = (random(`y-${i}`) * 2100 - frame * (0.25 + random(i) * 0.65) + 2200) % 2100 - 90;
        return <div key={i} style={{position: 'absolute', left: x + Math.sin(frame / 110 + i) * 18, top: y, width: i % 4 === 0 ? 4 : 2, height: i % 4 === 0 ? 4 : 2, borderRadius: '50%', background: GOLD, opacity: 0.12 + Math.sin(frame / 45 + i) ** 2 * 0.2}} />;
      })}
      {children}
    </AbsoluteFill>
  );
};

const Eyebrow: React.FC<{children: React.ReactNode}> = ({children}) => <div style={{display: 'flex', alignItems: 'center', gap: 20, fontSize: 25, color: GOLD, letterSpacing: 5, fontWeight: 400, marginBottom: 26}}><span style={{width: 48, height: 2, background: GOLD}} />{children}</div>;

const Heading: React.FC<{index: number; children: React.ReactNode; top?: number}> = ({index, children, top = 1120}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <div style={{position: 'absolute', left: 90, right: 150, top, opacity: interpolate(frame, [0.15 * fps, 0.85 * fps], [0, 1], clamp), translate: `0px ${interpolate(frame, [0, 1.2 * fps], [28, 0], {...clamp, easing: Easing.out(Easing.cubic)})}px`}}>
    <Eyebrow>{index === 0 ? 'NGHỆ THUẬT IM LẶNG' : index === 4 ? 'MỘT ĐIỀU ĐỂ NHỚ' : `QUY TẮC 0${index}`}</Eyebrow>
    <div style={{fontWeight: 700, fontSize: 86, lineHeight: 1.25, letterSpacing: -3, textShadow: '0 4px 28px rgba(0,0,0,.55)'}}>{children}</div>
  </div>;
};

const Captions: React.FC<{index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const now = frame / fps * 1000;
  const captions: Caption[] = captionData[index];
  const caption = captions.find(c => now >= c.startMs && now < c.endMs);
  if (!caption) return null;
  const highlighted = /bản lĩnh|nóng giận|vết thương|tức giận|nóng đầu|bình tĩnh|sự thật|suy đoán|kết luận|thành quả|hành động|lắng nghe|phán xét|giúp bạn|dành sức|kết quả|mỗi ngày|im lặng/gi;
  const parts = caption.text.split(highlighted);
  const matches = caption.text.match(highlighted) ?? [];
  return <div style={{position: 'absolute', left: 90, right: 150, top: 1510, minHeight: 140, fontSize: 46, lineHeight: 1.4, fontWeight: 700, textShadow: '0 3px 10px #000', opacity: interpolate(now - caption.startMs, [0, 100], [0.25, 1], clamp)}}>
    {parts.map((part, i) => <React.Fragment key={i}>{part}{matches[i] && <span style={{color: GOLD}}>{matches[i]}</span>}</React.Fragment>)}
  </div>;
};

const HookScene = () => <Scene image="01-philosopher" seconds={7} index={0}><Heading index={0} top={1050}>3 lúc người<br />thông minh<br /><span style={{color: GOLD}}>chọn im lặng.</span></Heading><Captions index={0} /></Scene>;
const AngerScene = () => <Scene image="02-warrior" seconds={11} index={1}><Heading index={1}>Khi đang<br /><span style={{color: GOLD}}>giận dữ.</span></Heading><Captions index={1} /></Scene>;
const TruthScene = () => <Scene image="03-thinker" seconds={12} index={2}><Heading index={2}>Khi chưa rõ<br /><span style={{color: GOLD}}>sự thật.</span></Heading><Captions index={2} /></Scene>;
const PlanScene = () => <Scene image="04-ascent" seconds={10} index={3}><Heading index={3}>Khi kế hoạch<br /><span style={{color: GOLD}}>chưa thành hình.</span></Heading><Captions index={3} /></Scene>;
const ClosingScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <Scene image="05-flame" seconds={5} index={4}><Heading index={4} top={1090}>Im lặng đúng lúc<br />là <span style={{color: GOLD}}>bản lĩnh.</span></Heading><Captions index={4} /><div style={{position: 'absolute', top: 1740, left: 90, right: 150, color: GOLD, fontSize: 24, letterSpacing: 3, opacity: interpolate(frame, [2.5 * fps, 3 * fps], [0, 1], clamp)}}>LƯU LẠI · RÈN LUYỆN MỖI NGÀY</div></Scene>;
};

export const musicVolume = (frame: number, fps: number): number => {
  const nowSeconds = frame / fps;
  const now = nowSeconds * 1000;
  const sceneStarts = [0, 7000, 18000, 30000, 40000];
  let speech = 0;
  captionData.forEach((group, scene) => group.forEach(caption => {
    const start = sceneStarts[scene] + caption.startMs;
    const end = sceneStarts[scene] + caption.endMs;
    speech = Math.max(speech, interpolate(now, [start - 180, start, end, end + 420], [0, 1, 1, 0], clamp));
  }));
  const fade = interpolate(
    nowSeconds,
    [
      musicConfig.videoStartSeconds,
      musicConfig.videoStartSeconds + musicConfig.fadeInSeconds,
      musicConfig.videoEndSeconds - musicConfig.fadeOutSeconds,
      musicConfig.videoEndSeconds,
    ],
    [0, 1, 1, 0],
    clamp,
  );
  const duckedVolume = interpolate(
    speech,
    [0, 1],
    [musicConfig.baseVolume, musicConfig.speechVolume],
    clamp,
  );
  return duckedVolume * fade;
};

export const StoicVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#040507', color: '#f6f1e7', fontFamily: 'Stoic Sans, sans-serif'}}>
    <Track name="Năm cảnh · 45 giây">
      <Sequence name="Mở đầu · Chọn im lặng" from={0} durationInFrames={7 * fps}><HookScene /></Sequence>
      <Sequence name="01 · Khi đang giận dữ" from={7 * fps} durationInFrames={11 * fps}><AngerScene /></Sequence>
      <Sequence name="02 · Khi chưa rõ sự thật" from={18 * fps} durationInFrames={12 * fps}><TruthScene /></Sequence>
      <Sequence name="03 · Khi kế hoạch chưa thành hình" from={30 * fps} durationInFrames={10 * fps}><PlanScene /></Sequence>
      <Sequence name="Kết · Im lặng đúng lúc" from={40 * fps} durationInFrames={5 * fps}><ClosingScene /></Sequence>
    </Track>
    <Track name="Lời đọc · Nam tự nhiên · Hải Đăng">
      <Audio name="Lời đọc · Mở đầu" from={0} durationInFrames={7 * fps} src={staticFile('stoic/audio/01-philosopher-voice-full.wav')} />
      <Audio name="Lời đọc · Giận dữ" from={7 * fps} durationInFrames={11 * fps} src={staticFile('stoic/audio/02-warrior-voice-full.wav')} />
      <Audio name="Lời đọc · Sự thật" from={18 * fps} durationInFrames={12 * fps} src={staticFile('stoic/audio/03-thinker-voice-full.wav')} />
      <Audio name="Lời đọc · Kế hoạch" from={30 * fps} durationInFrames={10 * fps} src={staticFile('stoic/audio/04-ascent-voice-full.wav')} />
      <Audio name="Lời đọc · Kết" from={40 * fps} durationInFrames={5 * fps} src={staticFile('stoic/audio/05-flame-voice-full.wav')} />
    </Track>
    <Audio
      name="Nhạc nền · Experience · Slowed + Cello"
      src={staticFile(musicConfig.file)}
      from={musicConfig.videoStartSeconds * fps}
      trimBefore={musicConfig.sourceStartSeconds * fps}
      durationInFrames={(musicConfig.videoEndSeconds - musicConfig.videoStartSeconds) * fps}
      volume={musicVolume(frame, fps)}
    />
  </AbsoluteFill>;
};
