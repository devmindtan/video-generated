import type {Caption} from '@remotion/captions';
import {Audio} from '@remotion/media';
import type {FC, ReactNode} from 'react';
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

const GOLD = '#e3bd77';
const IVORY = '#f5f0e6';
const MUTED = '#c8c1b5';
const BG = '#030507';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const SCENE_STARTS = [0, 8, 19, 31, 40];

const SceneFade: FC<{readonly seconds: number; readonly children: ReactNode}> = ({seconds, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const last = seconds * fps - 1;

  return (
    <AbsoluteFill
      style={{
        background: BG,
        overflow: 'hidden',
        opacity: interpolate(frame, [0, 0.22 * fps, last - 0.18 * fps, last], [0, 1, 1, 0], clamp),
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const CinematicGrade: FC<{readonly light?: string}> = ({light = '50% 28%'}) => (
  <>
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(1,3,5,.12) 0%, transparent 32%, rgba(2,4,6,.48) 58%, #030507 96%)'}} />
    <AbsoluteFill style={{background: `radial-gradient(ellipse at ${light}, transparent 14%, rgba(0,0,0,.58) 100%)`}} />
    <AbsoluteFill style={{background: 'linear-gradient(105deg, rgba(12,24,35,.22), transparent 46%, rgba(82,54,22,.10))'}} />
  </>
);

const Heading: FC<{
  readonly eyebrow: string;
  readonly children: ReactNode;
  readonly top?: number;
  readonly align?: 'left' | 'center';
}> = ({eyebrow, children, top = 1010, align = 'left'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <div
      style={{
        position: 'absolute',
        left: 82,
        right: 82,
        top,
        textAlign: align,
        opacity: interpolate(frame, [0.08 * fps, 0.58 * fps], [0, 1], clamp),
        translate: `0 ${interpolate(frame, [0, 0.65 * fps], [38, 0], {...clamp, easing: Easing.out(Easing.cubic)})}px`,
      }}
    >
      <div style={{display: 'flex', justifyContent: align === 'center' ? 'center' : 'flex-start', alignItems: 'center', gap: 16, marginBottom: 23, color: GOLD, fontSize: 21, letterSpacing: 4.2}}>
        <span style={{width: 46, height: 2, background: GOLD}} />
        {eyebrow}
      </div>
      <div style={{fontSize: 80, fontWeight: 700, lineHeight: 1.13, letterSpacing: -3.4, textShadow: '0 7px 34px rgba(0,0,0,.95)'}}>
        {children}
      </div>
    </div>
  );
};

const Captions: FC<{readonly index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const now = (frame / fps) * 1000;
  const caption = (captionsData[index] as Caption[]).find((item) => now >= item.startMs && now < item.endMs);
  if (!caption) return null;

  const emphasis = /thành công|chưa tới đâu|Dừng lại|hậu trường|sân khấu rực rỡ|bỏ cuộc|rễ âm thầm bám sâu|đứng vững|đúng múi giờ|bước chân hôm nay|Thở sâu|bước tiếp/gi;
  const parts = caption.text.split(emphasis);
  const matches = caption.text.match(emphasis) ?? [];

  return (
    <div
      style={{
        position: 'absolute',
        left: 82,
        right: 82,
        top: 1500,
        minHeight: 158,
        color: IVORY,
        fontSize: 43,
        fontWeight: 700,
        lineHeight: 1.42,
        textShadow: '0 3px 18px #000',
        opacity: interpolate(now - caption.startMs, [0, 110], [0.08, 1], clamp),
      }}
    >
      {parts.map((part, i) => (
        <span key={`${part}-${i}`}>
          {part}
          {matches[i] ? <span style={{color: GOLD}}>{matches[i]}</span> : null}
        </span>
      ))}
    </div>
  );
};

const HourglassScene: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <SceneFade seconds={8}>
      <CanvasImage
        src={staticFile('own-timeline/images/01-hourglass.png')}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          scale: interpolate(frame, [0, 8 * fps - 1], [1.02, 1.13], {...clamp, easing: Easing.inOut(Easing.cubic), output: 'perceptual-scale'}),
          transformOrigin: '50% 59%',
        }}
      />
      {Array.from({length: 24}, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 390 + random(`sand-x-${i}`) * 310,
            top: 790 + ((random(`sand-y-${i}`) * 180 + frame * (0.18 + (i % 5) * 0.025)) % 210),
            width: 2 + (i % 3),
            height: 2 + (i % 3),
            borderRadius: '50%',
            background: GOLD,
            boxShadow: '0 0 9px rgba(227,189,119,.9)',
            opacity: 0.18 + Math.sin(frame / 11 + i) ** 2 * 0.55,
          }}
        />
      ))}
      <CinematicGrade light="50% 35%" />
      <Heading eyebrow="LỜI NHẮC CHO CHÍNH BẠN" top={940}>
        Gửi bạn, người đang<br /><span style={{color: GOLD}}>cảm thấy mình tụt lại</span><br />phía sau...
      </Heading>
      <Captions index={0} />
    </SceneFade>
  );
};

const BookScene: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <SceneFade seconds={11}>
      <CanvasImage
        src={staticFile('own-timeline/images/02-book.png')}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          scale: 1.12,
          translate: `${interpolate(frame, [0, 11 * fps - 1], [-28, 26], clamp)}px ${interpolate(frame, [0, 11 * fps - 1], [-22, 28], clamp)}px`,
        }}
      />
      {Array.from({length: 7}, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 120 + random(`page-x-${i}`) * 820 + Math.sin(frame / (17 + i) + i) * 20,
            top: 190 + random(`page-y-${i}`) * 610 + Math.cos(frame / (19 + i) + i) * 26,
            width: 48 + (i % 3) * 17,
            height: 65 + (i % 2) * 24,
            rotate: `${-25 + random(`page-r-${i}`) * 60 + Math.sin(frame / 14 + i) * 7}deg`,
            opacity: 0.12 + (i % 3) * 0.08,
            background: 'linear-gradient(145deg, rgba(241,223,183,.62), rgba(94,74,48,.16))',
            clipPath: 'polygon(8% 0, 100% 9%, 88% 100%, 0 83%)',
            filter: 'blur(.4px)',
          }}
        />
      ))}
      <CinematicGrade light="39% 35%" />
      <Heading eyebrow="MẠNG XÃ HỘI CHỈ CHO BẠN THẤY ĐIỂM SÁNG" top={930}>
        Đừng so sánh<br /><span style={{color: GOLD}}>chương đầu</span> của bạn<br />với chương giữa của họ.
      </Heading>
      <Captions index={1} />
    </SceneFade>
  );
};

const TreesScene: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <SceneFade seconds={12}>
      <CanvasImage
        src={staticFile('own-timeline/images/03-trees.png')}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          scale: 1.12,
          translate: `0 ${interpolate(frame, [0, 12 * fps - 1], [78, -64], {...clamp, easing: Easing.inOut(Easing.cubic)})}px`,
          transformOrigin: '50% 50%',
        }}
      />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: -460 + i * 390 + frame * (0.72 + i * 0.14),
            top: 630 + i * 160,
            width: 1100,
            height: 230,
            rotate: '-7deg',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(211,224,231,.42), transparent 68%)',
            filter: 'blur(30px)',
            opacity: 0.13 - i * 0.02,
          }}
        />
      ))}
      <CinematicGrade light="64% 28%" />
      <Heading eyebrow="KHÔNG CÓ MỘT LỊCH TRÌNH CHUNG" top={1020}>
        Mỗi hạt giống đều có<br /><span style={{color: GOLD}}>mùa nở riêng.</span>
      </Heading>
      <Captions index={2} />
    </SceneFade>
  );
};

const WandererScene: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <SceneFade seconds={9}>
      <CanvasImage
        src={staticFile('own-timeline/images/04-wanderer.png')}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          scale: interpolate(frame, [0, 9 * fps - 1], [1.17, 1.025], {...clamp, easing: Easing.out(Easing.cubic), output: 'perceptual-scale'}),
          translate: `0 ${interpolate(frame, [0, 9 * fps - 1], [45, -10], clamp)}px`,
          transformOrigin: '47% 58%',
        }}
      />
      <div style={{position: 'absolute', left: 410, top: 820, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(239,187,93,.30), transparent 69%)', filter: 'blur(12px)', opacity: 0.65 + Math.sin(frame / 8) * 0.08}} />
      <CinematicGrade light="62% 22%" />
      <Heading eyebrow="BẠN KHÔNG HỀ CHẬM TRỄ" top={1015}>
        Đi theo nhịp độ<br /><span style={{color: GOLD}}>của chính bạn.</span>
      </Heading>
      <Captions index={3} />
    </SceneFade>
  );
};

const RippleScene: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <SceneFade seconds={5}>
      <CanvasImage
        src={staticFile('own-timeline/images/05-ripple.png')}
        style={{width: '100%', height: '100%', objectFit: 'cover', scale: interpolate(frame, [0, 5 * fps - 1], [1.045, 1.095], {...clamp, output: 'perceptual-scale'})}}
      />
      {[0, 1, 2].map((i) => {
        const progress = interpolate(frame, [i * 18, i * 18 + 90], [0, 1], clamp);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 540 - 230,
              top: 920 - 90,
              width: 460,
              height: 180,
              borderRadius: '50%',
              border: '2px solid rgba(230,196,134,.58)',
              scale: 0.2 + progress * 2.25,
              opacity: (1 - progress) * 0.45,
              boxShadow: '0 0 14px rgba(230,196,134,.18)',
            }}
          />
        );
      })}
      <CinematicGrade light="50% 50%" />
      <Heading eyebrow="MỘT BƯỚC NHỎ CŨNG LÀ ĐANG ĐI" top={1070} align="center">
        Kiên nhẫn<br /><span style={{color: GOLD}}>với chính mình.</span>
      </Heading>
      <Captions index={4} />
      <div
        style={{
          position: 'absolute',
          left: 82,
          right: 82,
          top: 1750,
          textAlign: 'center',
          color: MUTED,
          fontSize: 22,
          letterSpacing: 4,
          opacity: interpolate(frame, [2.7 * fps, 3.25 * fps], [0, 1], clamp),
        }}
      >
        ĐĂNG KÝ KÊNH
      </div>
    </SceneFade>
  );
};

export const ownTimelineMusicVolume = (frame: number, fps: number): number => {
  const seconds = frame / fps;
  const activity = Math.max(0, ...captionsData.flatMap((group, sceneIndex) => group.map((caption) => {
    const start = SCENE_STARTS[sceneIndex] + caption.startMs / 1000;
    const end = SCENE_STARTS[sceneIndex] + caption.endMs / 1000;
    return interpolate(seconds, [start - 0.12, start + 0.1, end - 0.1, end + 0.22], [0, 1, 1, 0], clamp);
  })));
  const base = musicConfig.pauseVolume - (musicConfig.pauseVolume - musicConfig.speechVolume) * activity;
  const fadeIn = interpolate(seconds, [0, musicConfig.fadeInSeconds], [0, 1], clamp);
  const lifted = interpolate(seconds, [musicConfig.finalLiftStartSeconds, musicConfig.finalLiftPeakSeconds], [base, musicConfig.finalLiftVolume], clamp);
  const fadeOut = interpolate(seconds, [musicConfig.videoEndSeconds - musicConfig.fadeOutSeconds, musicConfig.videoEndSeconds - 1 / fps], [1, 0], clamp);
  return lifted * Math.min(fadeIn, fadeOut);
};

export const OwnTimelineVideo: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{background: BG, color: IVORY, fontFamily: 'Stoic Sans, sans-serif'}}>
      <Track name="Năm cảnh · Múi giờ của riêng mình · 45 giây">
        <Sequence name="Cơn sốt ruột vô hình" from={0} durationInFrames={8 * fps}><HourglassScene /></Sequence>
        <Sequence name="Ảo ảnh của mạng xã hội" from={8 * fps} durationInFrames={11 * fps}><BookScene /></Sequence>
        <Sequence name="Mỗi hạt giống có một mùa" from={19 * fps} durationInFrames={12 * fps}><TreesScene /></Sequence>
        <Sequence name="Múi giờ của riêng mình" from={31 * fps} durationInFrames={9 * fps}><WandererScene /></Sequence>
        <Sequence name="Kiên nhẫn và bước tiếp" from={40 * fps} durationInFrames={5 * fps}><RippleScene /></Sequence>
      </Track>

      <Track name="Lời đọc · Hải Đăng · Nam tự nhiên">
        <Audio from={0} durationInFrames={8 * fps} src={staticFile('own-timeline/audio/01-hourglass-voice-full.wav')} />
        <Audio from={8 * fps} durationInFrames={11 * fps} src={staticFile('own-timeline/audio/02-book-voice-full.wav')} />
        <Audio from={19 * fps} durationInFrames={12 * fps} src={staticFile('own-timeline/audio/03-trees-voice-full.wav')} />
        <Audio from={31 * fps} durationInFrames={9 * fps} src={staticFile('own-timeline/audio/04-wanderer-voice-full.wav')} />
        <Audio from={40 * fps} durationInFrames={5 * fps} src={staticFile('own-timeline/audio/05-ripple-voice-full.wav')} />
      </Track>

      <Audio
        name="Snowfall · Øneheart và reidenshi"
        src={staticFile(musicConfig.file)}
        durationInFrames={45 * fps}
        volume={ownTimelineMusicVolume(frame, fps)}
        trimBefore={747}
        playbackRate={0.8}
      />
    </AbsoluteFill>
  );
};
