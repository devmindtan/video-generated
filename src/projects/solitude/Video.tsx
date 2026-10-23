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

const GOLD = '#d8b46f';
const IVORY = '#f2eee5';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const SCENE_STARTS = [0, 9, 20, 34, 44];
const VIDEO_DURATION_SECONDS = 52;
const MUSIC_RESUME_SOURCE_SECONDS = musicConfig.sourceStartSeconds + musicConfig.resumeFromOriginalVideoSeconds - musicConfig.videoStartSeconds;
const MUSIC_END_SECONDS = Math.min(
  musicConfig.videoEndSeconds,
  VIDEO_DURATION_SECONDS,
  musicConfig.spliceAtVideoSeconds + musicConfig.sourceEndSeconds - MUSIC_RESUME_SOURCE_SECONDS,
);
const MUSIC_CROSSFADE_START_SECONDS = musicConfig.spliceAtVideoSeconds - musicConfig.spliceCrossfadeSeconds / 2;
const MUSIC_CROSSFADE_END_SECONDS = musicConfig.spliceAtVideoSeconds + musicConfig.spliceCrossfadeSeconds / 2;

type Motion = 'push' | 'diagonal' | 'rise' | 'track' | 'still';
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
  const scaleEnd = motion === 'push' ? 1.105 : motion === 'still' ? 1.025 : 1.07;
  const xEnd = motion === 'diagonal' ? -34 : motion === 'track' ? 28 : 0;
  const yStart = motion === 'rise' ? 32 : motion === 'diagonal' ? -16 : 0;
  const yEnd = motion === 'rise' ? -25 : motion === 'diagonal' ? 22 : 0;

  return (
    <AbsoluteFill style={{backgroundColor: '#020407', opacity: interpolate(frame, [0, 0.32 * fps, last - 0.28 * fps, last], [0, 1, 1, 0], clamp)}}>
      <CanvasImage
        src={staticFile(`solitude/images/${image}.png`)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          scale: interpolate(frame, [0, last], [1.01, scaleEnd], {...clamp, output: 'perceptual-scale'}),
          translate: `${interpolate(frame, [0, last], [-xEnd / 2, xEnd / 2], {...clamp, easing: Easing.inOut(Easing.sin)})}px ${interpolate(frame, [0, last], [yStart, yEnd], {...clamp, easing: Easing.inOut(Easing.sin)})}px`,
          transformOrigin: index === 4 ? '50% 26%' : index === 1 ? '54% 28%' : '50% 34%',
        }}
      />
      <AbsoluteFill style={{background: index >= 3 ? 'linear-gradient(180deg, rgba(1,3,5,.05), transparent 38%, rgba(2,4,7,.58) 66%, #020407 95%)' : 'linear-gradient(180deg, rgba(1,3,5,.14), transparent 34%, rgba(2,4,7,.68) 64%, #020407 94%)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 31%, transparent 22%, rgba(0,0,0,.42) 100%)'}} />
      <div style={{position: 'absolute', left: -560, top: 770, width: 2200, height: 420, opacity: index >= 3 ? 0.1 : 0.06, background: `radial-gradient(ellipse, ${index >= 3 ? '#e0aa57' : '#d5dce5'} 0%, transparent 68%)`, translate: `${Math.sin(frame / (fps * 5.4) + index) * 145}px ${Math.cos(frame / (fps * 6.1)) * 24}px`, rotate: '-9deg'}} />
      {Array.from({length: index === 1 ? 32 : 18}, (_, i) => {
        const x = random(`solitude-x-${index}-${i}`) * 1080;
        const speed = 0.14 + random(`solitude-speed-${i}`) * (index === 1 ? 0.7 : 0.28);
        const y = (random(`solitude-y-${index}-${i}`) * 2050 + frame * speed + 2050) % 2050 - 80;
        return <div key={i} style={{position: 'absolute', left: x + Math.sin(frame / 90 + i) * 10, top: y, width: index === 1 && i % 4 === 0 ? 4 : 2, height: index === 1 && i % 4 === 0 ? 4 : 2, borderRadius: '50%', background: index >= 1 ? GOLD : '#d6dde5', opacity: 0.08 + Math.sin(frame / 48 + i) ** 2 * 0.16}} />;
      })}
      {children}
    </AbsoluteFill>
  );
};

const Heading: React.FC<{readonly eyebrow: string; readonly top?: number; readonly children: React.ReactNode}> = ({eyebrow, top = 1090, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{position: 'absolute', left: 86, right: 90, top, opacity: interpolate(frame, [0.15 * fps, 0.85 * fps], [0, 1], clamp), translate: `0px ${interpolate(frame, [0, 1.15 * fps], [30, 0], {...clamp, easing: Easing.out(Easing.cubic)})}px`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24, color: GOLD, fontSize: 24, letterSpacing: 4.8, fontWeight: 400}}><span style={{width: 48, height: 2, background: GOLD}} />{eyebrow}</div>
      <div style={{fontSize: 84, fontWeight: 700, lineHeight: 1.16, letterSpacing: -3.1, textShadow: '0 6px 30px rgba(0,0,0,.78)'}}>{children}</div>
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
  const highlighted = /hiểu mình|một bóng người|đi sai|lớn lên|đứng vững|cô độc|khoảng lặng|điều mình tin|chính mình|bình yên|đám đông|ngọn lửa|thắp sáng|lối đi/gi;
  const parts = caption.text.split(highlighted);
  const matches = caption.text.match(highlighted) ?? [];
  return (
    <div style={{position: 'absolute', left: 86, right: 90, top: 1510, minHeight: 150, color: IVORY, fontSize: 44, fontWeight: 700, lineHeight: 1.44, textShadow: '0 3px 14px #000', opacity: interpolate(now - caption.startMs, [0, 150], [0.08, 1], clamp)}}>
      {parts.map((part, i) => <React.Fragment key={i}>{part}{matches[i] && <span style={{color: GOLD}}>{matches[i]}</span>}</React.Fragment>)}
    </div>
  );
};

const AloneScene = () => <Scene image="01-alone" seconds={9} index={0} motion="push"><Heading eyebrow="KHI MỌI THỨ DẦN IM LẶNG" top={1050}>Bạn không bị<br /><span style={{color: GOLD}}>bỏ lại phía sau.</span></Heading><Captions index={0} /></Scene>;
const FilterScene = () => <Scene image="02-filter" seconds={11} index={1} motion="diagonal"><Heading eyebrow="SỰ SÀNG LỌC CỦA TRƯỞNG THÀNH">Không phải ai cũng<br /><span style={{color: GOLD}}>đi cùng đến cuối.</span></Heading><Captions index={1} /></Scene>;
const SilenceScene = () => <Scene image="03-silence" seconds={14} index={2} motion="rise"><Heading eyebrow="SỨC MẠNH CỦA KHOẢNG LẶNG">Đứng vững khi<br /><span style={{color: GOLD}}>không ai xác nhận.</span></Heading><Captions index={2} /></Scene>;
const SelfScene = () => <Scene image="04-self" seconds={10} index={3} motion="track"><Heading eyebrow="TỰ CHỦ" top={1070}>Đừng trao bình yên<br /><span style={{color: GOLD}}>cho đám đông.</span></Heading><Captions index={3} /></Scene>;
const TorchScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <Scene image="05-torch" seconds={8} index={4} motion="still"><Heading eyebrow="CON ĐƯỜNG CỦA BẠN" top={1080}>Chính bạn là<br /><span style={{color: GOLD}}>ngọn lửa.</span></Heading><Captions index={4} /><div style={{position: 'absolute', left: 86, top: 1750, color: GOLD, fontSize: 23, letterSpacing: 3.2, opacity: interpolate(frame, [6.1 * fps, 6.8 * fps], [0, 1], clamp)}}>LƯU LẠI · KHI BẠN CẦN VỮNG TÂM</div></Scene>;
};

export const solitudeMusicVolume = (frame: number, fps: number): number => {
  const seconds = frame / fps;
  const voiceActivity = Math.max(0, ...captionsData.flatMap((group, sceneIndex) => group.map((caption) => {
    const start = SCENE_STARTS[sceneIndex] + caption.startMs / 1000;
    const end = SCENE_STARTS[sceneIndex] + caption.endMs / 1000;
    return interpolate(seconds, [start - 0.15, start + 0.12, end - 0.12, end + 0.25], [0, 1, 1, 0], clamp);
  })));
  const ducked = musicConfig.pauseVolume - (musicConfig.pauseVolume - musicConfig.speechVolume) * voiceActivity;
  const fadeIn = musicConfig.fadeInSeconds === 0 ? 1 : interpolate(seconds, [musicConfig.videoStartSeconds, musicConfig.videoStartSeconds + musicConfig.fadeInSeconds], [0, 1], clamp);
  const fadeOut = musicConfig.fadeOutSeconds === 0 ? 1 : interpolate(seconds, [MUSIC_END_SECONDS - musicConfig.fadeOutSeconds, MUSIC_END_SECONDS - 1 / fps], [1, 0], clamp);
  return ducked * Math.min(fadeIn, fadeOut);
};

const musicBeforeSpliceVolume = (frame: number, fps: number): number => solitudeMusicVolume(frame, fps) * interpolate(
  frame / fps,
  [MUSIC_CROSSFADE_START_SECONDS, MUSIC_CROSSFADE_END_SECONDS],
  [1, 0],
  clamp,
);

const musicAfterSpliceVolume = (frame: number, fps: number): number => solitudeMusicVolume(frame, fps) * interpolate(
  frame / fps,
  [MUSIC_CROSSFADE_START_SECONDS, MUSIC_CROSSFADE_END_SECONDS],
  [0, 1],
  clamp,
);

export const SolitudeVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#020407', color: IVORY, fontFamily: 'Stoic Sans, sans-serif'}}>
    <Track name="Năm cảnh · Bước đi một mình · 52 giây">
      <Sequence name="Một bóng người" from={0} durationInFrames={9 * fps}><AloneScene /></Sequence>
      <Sequence name="Sự sàng lọc" from={9 * fps} durationInFrames={11 * fps}><FilterScene /></Sequence>
      <Sequence name="Khoảng lặng" from={20 * fps} durationInFrames={14 * fps}><SilenceScene /></Sequence>
      <Sequence name="Tự chủ" from={34 * fps} durationInFrames={10 * fps}><SelfScene /></Sequence>
      <Sequence name="Ngọn lửa" from={44 * fps} durationInFrames={8 * fps}><TorchScene /></Sequence>
    </Track>
    <Track name="Lời đọc · Nam trầm kể chuyện · Thiện Minh">
      <Audio name="Lời đọc · Một bóng người" from={0} durationInFrames={9 * fps} src={staticFile('solitude/audio/01-alone-voice-full.wav')} />
      <Audio name="Lời đọc · Sàng lọc" from={9 * fps} durationInFrames={11 * fps} src={staticFile('solitude/audio/02-filter-voice-full.wav')} />
      <Audio
        name="Lời đọc · Khoảng lặng"
        from={20 * fps}
        durationInFrames={14 * fps}
        src={staticFile('solitude/audio/03-silence-voice-full.wav')}
      />
      <Audio name="Lời đọc · Chính mình" from={34 * fps} durationInFrames={10 * fps} src={staticFile('solitude/audio/04-self-voice-full.wav')} />
      <Audio name="Lời đọc · Ngọn lửa" from={44 * fps} durationInFrames={8 * fps} src={staticFile('solitude/audio/05-torch-voice-full.wav')} />
    </Track>
    <Audio
      name="Past Live · Trước điểm cắt"
      src={staticFile(musicConfig.file)}
      from={Math.round(musicConfig.videoStartSeconds * fps)}
      trimBefore={Math.round(musicConfig.sourceStartSeconds * fps)}
      durationInFrames={Math.max(1, Math.round((MUSIC_CROSSFADE_END_SECONDS - musicConfig.videoStartSeconds) * fps))}
      volume={musicBeforeSpliceVolume(frame, fps)}
    />
    <Audio
      name="Past Live · Beat từ giây 42"
      src={staticFile(musicConfig.file)}
      from={Math.round(MUSIC_CROSSFADE_START_SECONDS * fps)}
      trimBefore={Math.round((MUSIC_RESUME_SOURCE_SECONDS - musicConfig.spliceCrossfadeSeconds / 2) * fps)}
      durationInFrames={Math.max(1, Math.round((MUSIC_END_SECONDS - MUSIC_CROSSFADE_START_SECONDS) * fps))}
      volume={musicAfterSpliceVolume(frame, fps)}
    />
  </AbsoluteFill>;
};
