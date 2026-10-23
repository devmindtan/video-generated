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

const GOLD = '#e4bd72';
const AMBER = '#d68155';
const IVORY = '#f4f0e8';
const BG = '#030506';
const SCENE_STARTS = [0, 8, 17, 29, 42];
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

  return (
    <AbsoluteFill style={{background: BG, overflow: 'hidden', opacity}}>
      {children}
    </AbsoluteFill>
  );
};

const FilmGrade: React.FC<{readonly warm?: boolean}> = ({warm = false}) => (
  <>
    <AbsoluteFill
      style={{
        background: warm
          ? 'linear-gradient(180deg, rgba(19,12,6,.08), rgba(7,5,3,.12) 42%, rgba(2,3,4,.82) 100%)'
          : 'linear-gradient(180deg, rgba(3,8,12,.14), rgba(2,5,7,.18) 42%, rgba(2,3,4,.86) 100%)',
      }}
    />
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(ellipse at 50% 31%, transparent 22%, rgba(0,0,0,.5) 100%)',
      }}
    />
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
      <div style={{display: 'flex', alignItems: 'center', gap: 15, marginBottom: 19, color: GOLD, fontSize: 21, letterSpacing: 3.5}}>
        <span style={{width: 45, height: 3, background: AMBER}} />
        {eyebrow}
      </div>
      <div style={{color: IVORY, fontSize: 78, fontWeight: 700, lineHeight: 1.1, letterSpacing: -2.8, textShadow: '0 7px 34px rgba(0,0,0,.95)'}}>
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

  const highlighted = /mất kiểm soát|nổi nóng|người sai|đừng phản ứng ngay|thở chậm|giải quyết vấn đề|cảm xúc của họ|bình tĩnh|dừng lại|ranh giới|bị điều khiển|quyền kiểm soát/gi;
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
        background: 'linear-gradient(90deg, rgba(3,5,6,.78), rgba(3,5,6,.48))',
        borderLeft: `4px solid ${AMBER}`,
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
          {part}
          {matches[i] ? <span style={{color: GOLD}}>{matches[i]}</span> : null}
        </React.Fragment>
      ))}
    </div>
  );
};

const ProvocationScene = () => (
  <SceneShell seconds={8}>
    <Video
      src={staticFile('provocation-control/video/office-disagreement.mp4')}
      muted
      objectFit="cover"
      durationInFrames={8 * 30}
      style={{width: '100%', height: '100%'}}
    />
    <FilmGrade />
    <SceneHeading eyebrow="QUY LUẬT NGẦM SỐ 2" line1="Họ muốn bạn" line2="mất kiểm soát." color={AMBER} />
    <Captions index={0} />
  </SceneShell>
);

const TrapScene = () => (
  <SceneShell seconds={9}>
    <Video
      src={staticFile('provocation-control/video/clenched-fist.mp4')}
      muted
      objectFit="cover"
      trimBefore={0.5 * 30}
      durationInFrames={9 * 30}
      style={{width: '100%', height: '100%'}}
    />
    <FilmGrade />
    <SceneHeading eyebrow="CÁI BẪY CỦA PHẢN ỨNG" line1="Đừng để câu chuyện" line2="bị đổi hướng." color={AMBER} />
    <Captions index={1} />
  </SceneShell>
);

const PauseScene = () => (
  <SceneShell seconds={12}>
    <Video
      src={staticFile('provocation-control/video/breathing.mp4')}
      muted
      objectFit="cover"
      playbackRate={0.87}
      durationInFrames={12 * 30}
      style={{width: '100%', height: '100%', objectPosition: '66% 50%'}}
    />
    <FilmGrade warm />
    <SceneHeading eyebrow="TRƯỚC KHI TRẢ LỜI" line1="Dừng lại" line2="một nhịp." />
    <Captions index={2} />
  </SceneShell>
);

const BoundaryScene = () => (
  <SceneShell seconds={13}>
    <Video
      src={staticFile('provocation-control/video/office-disagreement.mp4')}
      muted
      objectFit="cover"
      trimBefore={8 * 30}
      playbackRate={0.9}
      durationInFrames={13 * 30}
      style={{width: '100%', height: '100%'}}
    />
    <FilmGrade />
    <SceneHeading eyebrow="ĐẶT GIỚI HẠN" line1="Nói ngắn." line2="Rồi dừng lại." />
    <Captions index={3} />
  </SceneShell>
);

const ControlScene = () => (
  <SceneShell seconds={7}>
    <Video
      src={staticFile('provocation-control/video/calm-window.mp4')}
      muted
      objectFit="cover"
      trimBefore={1.2 * 30}
      durationInFrames={7 * 30}
      style={{width: '100%', height: '100%'}}
    />
    <FilmGrade warm />
    <SceneHeading eyebrow="GIỮ QUYỀN KIỂM SOÁT" line1="Bình tĩnh" line2="không phải yếu đuối." />
    <Captions index={4} />
    <div style={{position: 'absolute', left: 76, top: 1740, color: GOLD, fontSize: 21, letterSpacing: 3.1}}>
      TÂM LÝ CUỘC SỐNG
    </div>
  </SceneShell>
);

export const provocationControlMusicVolume = (frame: number, fps: number): number => {
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
  const lifted = interpolate(
    seconds,
    [musicConfig.finalLiftStartSeconds, musicConfig.finalLiftPeakSeconds],
    [base, musicConfig.finalLiftVolume],
    clamp,
  );
  const fadeOut = interpolate(
    seconds,
    [musicConfig.videoEndSeconds - musicConfig.fadeOutSeconds, musicConfig.videoEndSeconds - 1 / fps],
    [1, 0],
    clamp,
  );
  return lifted * Math.min(fadeIn, fadeOut);
};

export const ProvocationControlVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{background: BG, color: IVORY, fontFamily: 'Stoic Sans, sans-serif'}}>
      <Track name="Footage chuyển động thật · 5 cảnh · 49 giây">
        <Sequence name="Nhận diện sự khiêu khích" from={0} durationInFrames={8 * fps}><ProvocationScene /></Sequence>
        <Sequence name="Cái bẫy của phản ứng" from={8 * fps} durationInFrames={9 * fps}><TrapScene /></Sequence>
        <Sequence name="Dừng lại một nhịp" from={17 * fps} durationInFrames={12 * fps}><PauseScene /></Sequence>
        <Sequence name="Đặt giới hạn" from={29 * fps} durationInFrames={13 * fps}><BoundaryScene /></Sequence>
        <Sequence name="Giữ quyền kiểm soát" from={42 * fps} durationInFrames={7 * fps}><ControlScene /></Sequence>
      </Track>

      <Track name="Lời đọc · Thiện Minh · 0,94×">
        <Audio from={0} durationInFrames={8 * fps} src={staticFile('provocation-control/audio/01-provocation-voice-full.wav')} />
        <Audio from={8 * fps} durationInFrames={9 * fps} src={staticFile('provocation-control/audio/02-trap-voice-full.wav')} />
        <Audio from={17 * fps} durationInFrames={12 * fps} src={staticFile('provocation-control/audio/03-pause-voice-full.wav')} />
        <Audio from={29 * fps} durationInFrames={13 * fps} src={staticFile('provocation-control/audio/04-boundary-voice-full.wav')} />
        <Audio from={42 * fps} durationInFrames={7 * fps} src={staticFile('provocation-control/audio/05-control-voice-full.wav')} />
      </Track>

      <Audio
        name="Past Lives · nền nhẹ · fade cuối"
        src={staticFile(musicConfig.file)}
        trimBefore={musicConfig.sourceStartSeconds * fps}
        durationInFrames={49 * fps}
        playbackRate={musicConfig.playbackRate}
        toneFrequency={musicConfig.toneFrequency}
        fallbackHtml5AudioProps={{preservePitch: musicConfig.preservePitch}}
        volume={provocationControlMusicVolume(frame, fps)}
      />
    </AbsoluteFill>
  );
};
