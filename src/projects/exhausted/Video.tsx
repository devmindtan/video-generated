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

const GOLD = '#d9bd86';
const IVORY = '#f1eee7';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const SCENE_STARTS = [0, 8, 20, 32, 42];

type Motion = 'zoom' | 'pan-left' | 'pan-right' | 'float';
type SceneProps = {
  readonly image: string;
  readonly seconds: number;
  readonly index: number;
  readonly motion: Motion;
  readonly children: React.ReactNode;
};

const Scene: React.FC<SceneProps> = ({image, seconds, index, motion, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const last = seconds * fps - 1;
  const pan = motion === 'pan-left' ? -32 : motion === 'pan-right' ? 32 : 0;
  const scaleEnd = motion === 'zoom' ? 1.085 : 1.045;
  return (
    <AbsoluteFill style={{backgroundColor: '#030609', opacity: interpolate(frame, [0, 0.35 * fps, last - 0.3 * fps, last], [0, 1, 1, 0], clamp)}}>
      <CanvasImage
        src={staticFile(`exhausted/images/${image}.png`)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          scale: interpolate(frame, [0, last], [1.015, scaleEnd], {...clamp, output: 'perceptual-scale'}),
          translate: `${interpolate(frame, [0, last], [-pan / 2, pan / 2], {...clamp, easing: Easing.inOut(Easing.sin)})}px ${motion === 'float' ? interpolate(frame, [0, last], [-7, 9], clamp) : 0}px`,
          transformOrigin: index === 0 ? '48% 28%' : index === 2 ? '50% 35%' : '50% 31%',
        }}
      />
      <AbsoluteFill style={{background: index >= 3 ? 'linear-gradient(180deg, rgba(2,5,8,.04) 0%, transparent 38%, rgba(3,6,9,.58) 64%, #030609 93%)' : 'linear-gradient(180deg, rgba(2,5,8,.16) 0%, transparent 35%, rgba(3,6,9,.7) 62%, #030609 92%)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 34%, transparent 28%, rgba(0,0,0,.38) 100%)'}} />
      <div style={{position: 'absolute', left: -520, top: 760, width: 2100, height: 420, opacity: 0.065, background: 'radial-gradient(ellipse, #d7dde0 0%, transparent 68%)', translate: `${Math.sin(frame / (fps * 6) + index) * 135}px ${Math.cos(frame / (fps * 5)) * 26}px`, rotate: '-10deg'}} />
      {Array.from({length: 16}, (_, i) => {
        const x = random(`healing-x-${index}-${i}`) * 1080;
        const y = (random(`healing-y-${index}-${i}`) * 2050 - frame * (0.1 + random(`healing-s-${i}`) * 0.2) + 2050) % 2050 - 60;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: 2, height: 2, borderRadius: '50%', background: index >= 2 ? GOLD : '#dce6ed', opacity: 0.09 + Math.sin(frame / 55 + i) ** 2 * 0.12}} />;
      })}
      {children}
    </AbsoluteFill>
  );
};

const Heading: React.FC<{readonly eyebrow: string; readonly top?: number; readonly children: React.ReactNode}> = ({eyebrow, top = 1115, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{position: 'absolute', left: 86, right: 92, top, opacity: interpolate(frame, [0.18 * fps, 0.9 * fps], [0, 1], clamp), translate: `0px ${interpolate(frame, [0, 1.25 * fps], [22, 0], {...clamp, easing: Easing.out(Easing.cubic)})}px`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, marginBottom: 25, color: GOLD, fontSize: 24, letterSpacing: 4.6, fontWeight: 400}}><span style={{width: 46, height: 1.5, background: GOLD}} />{eyebrow}</div>
      <div style={{fontSize: 82, fontWeight: 700, lineHeight: 1.2, letterSpacing: -2.8, textShadow: '0 5px 28px rgba(0,0,0,.65)'}}>{children}</div>
    </div>
  );
};

const Captions: React.FC<{readonly index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const now = frame / fps * 1000;
  const captions = captionsData[index] as Caption[];
  const caption = captions.find((item) => now >= item.startMs && now < item.endMs);
  if (!caption) return null;
  const highlighted = /kiệt sức|dừng lại|hơi thật sâu|sóng lặng|nghỉ ngơi|áp lực|sức bền|lớn lên|đi chậm|đừng bỏ cuộc|giông bão|bước tiếp|ngủ ngon|ngày mai|ổn thôi/gi;
  const parts = caption.text.split(highlighted);
  const matches = caption.text.match(highlighted) ?? [];
  return (
    <div style={{position: 'absolute', left: 86, right: 92, top: 1515, minHeight: 150, color: IVORY, fontSize: 44, fontWeight: 700, lineHeight: 1.45, textShadow: '0 3px 13px #000', opacity: interpolate(now - caption.startMs, [0, 160], [0.08, 1], clamp)}}>
      {parts.map((part, i) => <React.Fragment key={i}>{part}{matches[i] && <span style={{color: GOLD}}>{matches[i]}</span>}</React.Fragment>)}
    </div>
  );
};

const StopScene = () => <Scene image="01-stop" seconds={8} index={0} motion="zoom"><Heading eyebrow="DÀNH CHO BẠN" top={1070}>Nếu hôm nay<br />bạn thấy <span style={{color: GOLD}}>kiệt sức…</span></Heading><Captions index={0} /></Scene>;
const RestScene = () => <Scene image="02-rest" seconds={12} index={1} motion="float"><Heading eyebrow="BẠN ĐƯỢC PHÉP">Không cần phải<br /><span style={{color: GOLD}}>luôn mạnh mẽ.</span></Heading><Captions index={1} /></Scene>;
const GrowScene = () => <Scene image="03-grow" seconds={12} index={2} motion="zoom"><Heading eyebrow="TRONG THẦM LẶNG">Thử thách đang<br /><span style={{color: GOLD}}>tôi luyện bạn.</span></Heading><Captions index={2} /></Scene>;
const RiseScene = () => <Scene image="04-rise" seconds={10} index={3} motion="pan-right"><Heading eyebrow="ĐỪNG TỰ ÉP MÌNH">Nghỉ ngơi…<br /><span style={{color: GOLD}}>nhưng đừng bỏ cuộc.</span></Heading><Captions index={3} /></Scene>;
const TomorrowScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <Scene image="05-tomorrow" seconds={6} index={4} motion="pan-left"><Heading eyebrow="NGÀY MAI" top={1080}>Mặt trời<br /><span style={{color: GOLD}}>sẽ lại mọc.</span></Heading><Captions index={4} /><div style={{position: 'absolute', left: 86, top: 1752, color: GOLD, fontSize: 23, letterSpacing: 3.1, opacity: interpolate(frame, [3.8 * fps, 4.5 * fps], [0, 1], clamp)}}>LƯU LẠI · KHI BẠN CẦN NGHỈ MỘT CHÚT</div></Scene>;
};

export const exhaustedMusicVolume = (frame: number, fps: number): number => {
  const seconds = frame / fps;
  const voiceActivity = Math.max(0, ...captionsData.flatMap((group, sceneIndex) => group.map((caption) => {
    const start = SCENE_STARTS[sceneIndex] + caption.startMs / 1000;
    const end = SCENE_STARTS[sceneIndex] + caption.endMs / 1000;
    return interpolate(seconds, [start - 0.12, start + 0.12, end - 0.12, end + 0.12], [0, 1, 1, 0], clamp);
  })));
  const ducked = musicConfig.pauseVolume - (musicConfig.pauseVolume - musicConfig.speechVolume) * voiceActivity;
  const fadeIn = interpolate(seconds, [0, musicConfig.fadeInSeconds], [0, 1], clamp);
  const fadeOut = interpolate(seconds, [musicConfig.videoEndSeconds - musicConfig.fadeOutSeconds, musicConfig.videoEndSeconds], [1, 0], clamp);
  return ducked * Math.min(fadeIn, fadeOut);
};

export const ExhaustedVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#030609', color: IVORY, fontFamily: 'Stoic Sans, sans-serif'}}>
    <Track name="Năm cảnh · Kiệt sức · 48 giây">
      <Sequence name="Dừng lại" from={0} durationInFrames={8 * fps}><StopScene /></Sequence>
      <Sequence name="Được phép nghỉ" from={8 * fps} durationInFrames={12 * fps}><RestScene /></Sequence>
      <Sequence name="Đang lớn lên" from={20 * fps} durationInFrames={12 * fps}><GrowScene /></Sequence>
      <Sequence name="Đừng bỏ cuộc" from={32 * fps} durationInFrames={10 * fps}><RiseScene /></Sequence>
      <Sequence name="Ngày mai" from={42 * fps} durationInFrames={6 * fps}><TomorrowScene /></Sequence>
    </Track>
    <Track name="Lời đọc · Nam trầm ấm · Hải Đăng">
      <Audio name="Lời đọc · Dừng lại" from={0} durationInFrames={8 * fps} src={staticFile('exhausted/audio/01-stop-voice-full.wav')} />
      <Audio
        name="Lời đọc · Nghỉ ngơi"
        from={8 * fps}
        durationInFrames={12 * fps}
        src={staticFile('exhausted/audio/02-rest-voice-full.wav')}
      />
      <Audio
        name="Lời đọc · Tôi luyện"
        from={20 * fps}
        durationInFrames={12 * fps}
        src={staticFile('exhausted/audio/03-grow-voice-full.wav')}
      />
      <Audio
        name="Lời đọc · Bước tiếp"
        from={32 * fps}
        durationInFrames={10 * fps}
        src={staticFile('exhausted/audio/04-rise-voice-full.wav')}
      />
      <Audio
        name="Lời đọc · Ngày mai"
        from={42 * fps}
        durationInFrames={6 * fps}
        src={staticFile('exhausted/audio/05-tomorrow-voice-full.wav')}
      />
    </Track>
    <Audio
      name="Nhạc nền · Snowfall"
      src={staticFile(musicConfig.file)}
      trimBefore={musicConfig.sourceStartSeconds * fps}
      durationInFrames={48 * fps}
      volume={exhaustedMusicVolume(frame, fps)}
    />
  </AbsoluteFill>;
};
