import React from 'react';
import {Audio, Video} from '@remotion/media';
import type {Caption} from '@remotion/captions';
import {
  AbsoluteFill,
  Easing,
  Sequence,
  Track,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import '../../shared/stoic-fonts';
import captionsData from './captions.json';
import musicConfig from './music.json';

const GOLD = '#e1bd72';
const TEAL = '#6fb1ad';
const IVORY = '#f4f0e7';
const BG = '#020405';
const SCENE_STARTS = [0, 8, 18, 30, 39];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const SceneShell: React.FC<{
  readonly seconds: number;
  readonly children: React.ReactNode;
}> = ({seconds, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const last = seconds * fps - 1;
  const opacity = interpolate(
    frame,
    [0, 0.2 * fps, last - 0.18 * fps, last],
    [0, 1, 1, 0],
    clamp,
  );
  return <AbsoluteFill style={{background: BG, overflow: 'hidden', opacity}}>{children}</AbsoluteFill>;
};

const Grade: React.FC<{readonly warm?: boolean}> = ({warm = false}) => (
  <>
    <AbsoluteFill
      style={{
        background: warm
          ? 'linear-gradient(180deg, rgba(16,10,4,.08), rgba(7,5,3,.16) 42%, rgba(1,3,4,.86) 100%)'
          : 'linear-gradient(180deg, rgba(2,8,10,.13), rgba(1,6,8,.2) 42%, rgba(1,3,4,.88) 100%)',
      }}
    />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 31%, transparent 20%, rgba(0,0,0,.54) 100%)'}} />
  </>
);

const SceneHeading: React.FC<{
  readonly eyebrow: string;
  readonly line1: string;
  readonly line2: string;
  readonly color?: string;
}> = ({eyebrow, line1, line2, color = GOLD}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = interpolate(frame, [0.08 * fps, 0.5 * fps], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: 76,
        right: 72,
        top: 1015,
        opacity: reveal,
        transform: `translateY(${(1 - reveal) * 30}px)`,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 15, marginBottom: 19, color: GOLD, fontSize: 21, letterSpacing: 3.35}}>
        <span style={{width: 45, height: 3, background: TEAL}} />
        {eyebrow}
      </div>
      <div style={{color: IVORY, fontSize: 76, fontWeight: 700, lineHeight: 1.1, letterSpacing: -2.8, textShadow: '0 7px 34px rgba(0,0,0,.96)'}}>
        {line1}<br /><span style={{color}}>{line2}</span>
      </div>
    </div>
  );
};

const Captions: React.FC<{readonly index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const now = (frame / fps) * 1000;
  const caption = (captionsData[index] as Caption[]).find(
    (item) => now >= item.startMs && now < item.endMs,
  );
  if (!caption) return null;
  const highlighted = /quá nhiều người|không bao giờ hoàn thành|ý định bị lộ|lời bàn tán|mất tập trung|giữ kín kế hoạch|lừa dối|điều gì cần nói|nói với ai|lúc nào|hành động nhỏ|trong im lặng|kết quả|khán giả|điều quan trọng/gi;
  const parts = caption.text.split(highlighted);
  const matches = caption.text.match(highlighted) ?? [];
  return (
    <div
      style={{
        position: 'absolute',
        left: 68,
        right: 68,
        top: 1380,
        minHeight: 145,
        padding: '22px 25px 24px',
        borderRadius: 18,
        background: 'linear-gradient(90deg, rgba(2,5,6,.82), rgba(2,5,6,.52))',
        borderLeft: `4px solid ${TEAL}`,
        color: IVORY,
        fontSize: 42,
        fontWeight: 700,
        lineHeight: 1.42,
        textShadow: '0 3px 17px #000',
        opacity: interpolate(now - caption.startMs, [0, 100], [0.08, 1], clamp),
      }}
    >
      {parts.map((part, i) => (
        <React.Fragment key={`${caption.startMs}-${i}`}>
          {part}{matches[i] ? <span style={{color: GOLD}}>{matches[i]}</span> : null}
        </React.Fragment>
      ))}
    </div>
  );
};

const PlanScene = () => (
  <SceneShell seconds={8}>
    <Video
      src={staticFile('hidden-intentions/video/chess.mp4')}
      muted
      objectFit="cover"
      trimBefore={5.2 * 30}
      durationInFrames={8 * 30}
      style={{width: '100%', height: '100%'}}
    />
    <Grade warm />
    <SceneHeading eyebrow="QUY LUẬT CHE GIẤU Ý ĐỊNH" line1="Kế hoạch chưa làm" line2="đừng kể quá sớm." color={TEAL} />
    <Captions index={0} />
  </SceneShell>
);

const NoiseScene = () => (
  <SceneShell seconds={10}>
    <Video
      src={staticFile('hidden-intentions/video/water-snake.mp4')}
      muted
      objectFit="cover"
      playbackRate={0.99}
      durationInFrames={10 * 30}
      style={{width: '100%', height: '100%'}}
    />
    <Grade />
    <SceneHeading eyebrow="KHI Ý ĐỊNH LỘ RA" line1="Tiếng ồn" line2="bắt đầu chen vào." />
    <Captions index={1} />
  </SceneShell>
);

const DiscretionScene = () => (
  <SceneShell seconds={12}>
    <Video
      src={staticFile('hidden-intentions/video/fog-walker.mp4')}
      muted
      objectFit="cover"
      trimBefore={3 * 30}
      durationInFrames={12 * 30}
      style={{width: '100%', height: '100%'}}
    />
    <Grade warm />
    <SceneHeading eyebrow="GIỮ KÍN ≠ LỪA DỐI" line1="Đúng người." line2="Đúng thời điểm." color={TEAL} />
    <Captions index={2} />
  </SceneShell>
);

const ActionScene = () => (
  <SceneShell seconds={9}>
    <Video
      src={staticFile('hidden-intentions/video/archery.mp4')}
      muted
      objectFit="cover"
      trimBefore={2.5 * 30}
      playbackRate={0.96}
      durationInFrames={9 * 30}
      style={{width: '100%', height: '100%', objectPosition: '58% 50%'}}
    />
    <Grade />
    <SceneHeading eyebrow="HÀNH ĐỘNG TRONG IM LẶNG" line1="Để kết quả" line2="nói thay bạn." />
    <Captions index={3} />
  </SceneShell>
);

const ResultScene = () => (
  <SceneShell seconds={6}>
    <Video
      src={staticFile('hidden-intentions/video/metal-lock.mp4')}
      muted
      objectFit="cover"
      trimBefore={0.35 * 30}
      durationInFrames={6 * 30}
      style={{width: '100%', height: '100%', objectPosition: '36% 50%'}}
    />
    <Grade />
    <SceneHeading eyebrow="KHÔNG CẦN KHÁN GIẢ" line1="Giữ kín" line2="điều quan trọng." color={TEAL} />
    <Captions index={4} />
    <div style={{position: 'absolute', left: 76, top: 1740, color: GOLD, fontSize: 21, letterSpacing: 3.1}}>
      THEO DÕI · TÂM LÝ CUỘC SỐNG
    </div>
  </SceneShell>
);

export const hiddenIntentionsMusicVolume = (frame: number, fps: number): number => {
  const seconds = frame / fps;
  const speechActivity = Math.max(
    0,
    ...captionsData.flatMap((group, sceneIndex) =>
      group.map((caption) => {
        const start = SCENE_STARTS[sceneIndex] + caption.startMs / 1000;
        const end = SCENE_STARTS[sceneIndex] + caption.endMs / 1000;
        return interpolate(seconds, [start - 0.1, start + 0.1, end - 0.1, end + 0.22], [0, 1, 1, 0], clamp);
      }),
    ),
  );
  const base = musicConfig.pauseVolume -
    (musicConfig.pauseVolume - musicConfig.speechVolume) * speechActivity;
  const fadeIn = interpolate(seconds, [0, musicConfig.fadeInSeconds], [0, 1], clamp);
  const lifted = interpolate(seconds, [musicConfig.finalLiftStartSeconds, musicConfig.finalLiftPeakSeconds], [base, musicConfig.finalLiftVolume], clamp);
  const fadeOut = interpolate(
    seconds,
    [musicConfig.videoEndSeconds - musicConfig.fadeOutSeconds, musicConfig.videoEndSeconds - 1 / fps],
    [1, 0],
    clamp,
  );
  return lifted * Math.min(fadeIn, fadeOut);
};

export const HiddenIntentionsVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: BG, color: IVORY, fontFamily: 'Stoic Sans, sans-serif'}}>
      <Track name="Footage chuyển động thật · 5 cảnh · 45 giây">
        <Sequence name="Đừng kể kế hoạch quá sớm" from={0} durationInFrames={8 * fps}><PlanScene /></Sequence>
        <Sequence name="Tiếng ồn từ bên ngoài" from={8 * fps} durationInFrames={10 * fps}><NoiseScene /></Sequence>
        <Sequence name="Giữ kín không phải lừa dối" from={18 * fps} durationInFrames={12 * fps}><DiscretionScene /></Sequence>
        <Sequence name="Hành động trong im lặng" from={30 * fps} durationInFrames={9 * fps}><ActionScene /></Sequence>
        <Sequence name="Để kết quả lên tiếng" from={39 * fps} durationInFrames={6 * fps}><ResultScene /></Sequence>
      </Track>

      <Track name="Lời đọc · Thiện Minh · tự nhiên 0,96×">
        <Audio from={0} durationInFrames={8 * fps} src={staticFile('hidden-intentions/audio/01-plan-voice-full.wav')} />
        <Audio from={8 * fps} durationInFrames={10 * fps} src={staticFile('hidden-intentions/audio/02-noise-voice-full.wav')} />
        <Audio from={18 * fps} durationInFrames={12 * fps} src={staticFile('hidden-intentions/audio/03-discretion-voice-full.wav')} />
        <Audio from={30 * fps} durationInFrames={9 * fps} src={staticFile('hidden-intentions/audio/04-action-voice-full.wav')} />
        <Audio from={39 * fps} durationInFrames={6 * fps} src={staticFile('hidden-intentions/audio/05-result-voice-full.wav')} />
      </Track>

      <Audio
        name="Past Lives · nền nhẹ · fade cuối"
        src={staticFile(musicConfig.file)}
        trimBefore={musicConfig.sourceStartSeconds * fps}
        durationInFrames={45 * fps}
        playbackRate={musicConfig.playbackRate}
        toneFrequency={musicConfig.toneFrequency}
        fallbackHtml5AudioProps={{preservePitch: musicConfig.preservePitch}}
        volume={hiddenIntentionsMusicVolume(frame, fps)}
      />
    </AbsoluteFill>
  );
};
