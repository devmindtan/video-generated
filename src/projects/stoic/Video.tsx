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
import captionData from './captions.json';
import musicConfig from './music.json';

const GOLD = '#dfbd78';
const IVORY = '#f4efe5';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const sceneStarts = [0, 7, 18, 30, 40];

type SceneProps = {
  readonly image: string;
  readonly seconds: number;
  readonly index: number;
  readonly children: React.ReactNode;
};

const Scene: React.FC<SceneProps> = ({image, seconds, index, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const last = seconds * fps - 1;
  const drift = index % 2 === 0 ? 1 : -1;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#030507',
        opacity: interpolate(frame, [0, 0.28 * fps, last - 0.22 * fps, last], [0, 1, 1, 0], clamp),
      }}
    >
      <CanvasImage
        src={staticFile(`stoic-control/images/${image}.png`)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          scale: interpolate(frame, [0, last], [1.01, 1.075], {...clamp, output: 'perceptual-scale'}),
          translate: `${interpolate(frame, [0, last], [0, drift * 18], clamp)}px 0px`,
          transformOrigin: index === 4 ? '50% 35%' : '50% 28%',
        }}
      />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(1,3,5,.08) 0%, rgba(1,3,5,.02) 38%, rgba(2,4,6,.68) 63%, #020405 91%)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 35%, transparent 24%, rgba(0,0,0,.46) 100%)'}} />
      <div
        style={{
          position: 'absolute',
          left: -520,
          top: 760,
          width: 2100,
          height: 430,
          opacity: 0.075,
          background: 'radial-gradient(ellipse, #d5cec0 0%, transparent 68%)',
          translate: `${Math.sin(frame / (fps * 4.8) + index) * 170}px ${Math.cos(frame / (fps * 5.2)) * 35}px`,
          rotate: '-12deg',
        }}
      />
      {Array.from({length: 22}, (_, i) => {
        const x = random(`control-x-${index}-${i}`) * 1080;
        const speed = 0.18 + random(`control-speed-${i}`) * 0.44;
        const y = (random(`control-y-${index}-${i}`) * 2050 - frame * speed + 2050) % 2050 - 70;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x + Math.sin(frame / 100 + i) * 13,
              top: y,
              width: i % 5 === 0 ? 4 : 2,
              height: i % 5 === 0 ? 4 : 2,
              borderRadius: '50%',
              background: GOLD,
              opacity: 0.1 + Math.sin(frame / 42 + i) ** 2 * 0.18,
            }}
          />
        );
      })}
      {children}
    </AbsoluteFill>
  );
};

const Eyebrow: React.FC<{readonly children: React.ReactNode}> = ({children}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 20, color: GOLD, fontSize: 25, letterSpacing: 5, marginBottom: 24}}>
    <span style={{width: 50, height: 2, background: GOLD}} />
    {children}
  </div>
);

const Heading: React.FC<{readonly label: string; readonly top?: number; readonly children: React.ReactNode}> = ({label, top = 1110, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div
      style={{
        position: 'absolute',
        left: 88,
        right: 96,
        top,
        opacity: interpolate(frame, [0.12 * fps, 0.72 * fps], [0, 1], clamp),
        translate: `0px ${interpolate(frame, [0, 1.05 * fps], [34, 0], {...clamp, easing: Easing.out(Easing.cubic)})}px`,
      }}
    >
      <Eyebrow>{label}</Eyebrow>
      <div style={{fontSize: 86, fontWeight: 700, lineHeight: 1.18, letterSpacing: -3.2, textShadow: '0 5px 30px rgba(0,0,0,.7)'}}>{children}</div>
    </div>
  );
};

const Captions: React.FC<{readonly index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const now = frame / fps * 1000;
  const captions = captionData[index] as Caption[];
  const caption = captions.find((item) => now >= item.startMs && now < item.endMs);
  if (!caption) return null;
  const highlighted = /khổ đau|không thể kiểm soát|buông bỏ|ý kiến|miệng đời|công nhận|phán xét|quá khứ|dằn vặt|bài học|bước tiếp|bản chất|phản ứng|phẩm chất|tiêu cực|bình yên|rèn tâm/gi;
  const parts = caption.text.split(highlighted);
  const matches = caption.text.match(highlighted) ?? [];
  return (
    <div
      style={{
        position: 'absolute',
        left: 88,
        right: 96,
        top: 1510,
        minHeight: 150,
        color: IVORY,
        fontSize: 45,
        fontWeight: 700,
        lineHeight: 1.42,
        textShadow: '0 3px 13px #000',
        opacity: interpolate(now - caption.startMs, [0, 110], [0.2, 1], clamp),
      }}
    >
      {parts.map((part, i) => <React.Fragment key={i}>{part}{matches[i] && <span style={{color: GOLD}}>{matches[i]}</span>}</React.Fragment>)}
    </div>
  );
};

const HookScene = () => (
  <Scene image="01-control" seconds={7} index={0}>
    <Heading label="VÒNG TRÒN KIỂM SOÁT" top={1050}>3 thứ bạn nên<br /><span style={{color: GOLD}}>ngừng bận tâm.</span></Heading>
    <Captions index={0} />
  </Scene>
);

const OpinionsScene = () => (
  <Scene image="02-opinions" seconds={11} index={1}>
    <Heading label="ĐIỀU 01">Ý kiến của<br /><span style={{color: GOLD}}>người khác.</span></Heading>
    <Captions index={1} />
  </Scene>
);

const PastScene = () => (
  <Scene image="03-past" seconds={12} index={2}>
    <Heading label="ĐIỀU 02">Sai lầm trong<br /><span style={{color: GOLD}}>quá khứ.</span></Heading>
    <Captions index={2} />
  </Scene>
);

const ResponseScene = () => (
  <Scene image="04-response" seconds={10} index={3}>
    <Heading label="ĐIỀU 03">Cách họ đối xử<br /><span style={{color: GOLD}}>với bạn.</span></Heading>
    <Captions index={3} />
  </Scene>
);

const ClosingScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <Scene image="05-peace" seconds={5} index={4}>
      <Heading label="ĐIỀU THUỘC VỀ BẠN" top={1070}>Tập trung vào điều<br /><span style={{color: GOLD}}>bạn kiểm soát.</span></Heading>
      <Captions index={4} />
      <div style={{position: 'absolute', left: 88, top: 1750, color: GOLD, fontSize: 25, letterSpacing: 3.5, opacity: interpolate(frame, [2.6 * fps, 3.15 * fps], [0, 1], clamp)}}>THEO DÕI · RÈN TÂM MỖI NGÀY</div>
    </Scene>
  );
};

export const musicVolume = (frame: number, fps: number): number => {
  const seconds = frame / fps;
  const fade = interpolate(seconds, [0, 0.8, 43.7, 45], [0, 1, 1, 0], clamp);
  let speech = 0;
  captionData.forEach((group, scene) => group.forEach((caption) => {
    const start = sceneStarts[scene] + caption.startMs / 1000;
    const end = sceneStarts[scene] + caption.endMs / 1000;
    speech = Math.max(speech, interpolate(seconds, [start - 0.18, start, end, end + 0.36], [0, 1, 1, 0], clamp));
  }));
  return interpolate(speech, [0, 1], [musicConfig.baseVolume, musicConfig.speechVolume], clamp) * fade;
};

export const StoicVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: '#020405', color: IVORY, fontFamily: 'Stoic Sans, sans-serif'}}>
      <Track name="Năm cảnh · Vòng tròn kiểm soát · 45 giây">
        <Sequence name="Hook · Ngừng bận tâm" from={0} durationInFrames={7 * fps}><HookScene /></Sequence>
        <Sequence name="01 · Ý kiến người khác" from={7 * fps} durationInFrames={11 * fps}><OpinionsScene /></Sequence>
        <Sequence name="02 · Quá khứ đã qua" from={18 * fps} durationInFrames={12 * fps}><PastScene /></Sequence>
        <Sequence name="03 · Cách họ đối xử" from={30 * fps} durationInFrames={10 * fps}><ResponseScene /></Sequence>
        <Sequence name="Kết · Điều bạn kiểm soát" from={40 * fps} durationInFrames={5 * fps}><ClosingScene /></Sequence>
      </Track>
      <Track name="Lời đọc · Nam tự nhiên · Hải Đăng">
        <Audio name="Lời đọc · Hook" from={0} durationInFrames={7 * fps} src={staticFile('stoic/audio/01-control-voice-full.wav')} />
        <Audio name="Lời đọc · Ý kiến" from={7 * fps} durationInFrames={11 * fps} src={staticFile('stoic/audio/02-opinions-voice-full.wav')} />
        <Audio name="Lời đọc · Quá khứ" from={18 * fps} durationInFrames={12 * fps} src={staticFile('stoic/audio/03-past-voice-full.wav')} />
        <Audio name="Lời đọc · Phản ứng" from={30 * fps} durationInFrames={10 * fps} src={staticFile('stoic/audio/04-response-voice-full.wav')} />
        <Audio name="Lời đọc · Bình yên" from={40 * fps} durationInFrames={5 * fps} src={staticFile('stoic/audio/05-peace-voice-full.wav')} />
      </Track>
      <Audio
        name="Nhạc nền · Experience"
        src={staticFile(musicConfig.file)}
        trimBefore={musicConfig.sourceStartSeconds * fps}
        durationInFrames={45 * fps}
        volume={musicVolume(frame, fps)}
      />
    </AbsoluteFill>
  );
};
