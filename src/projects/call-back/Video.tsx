import type {FC, ReactNode} from 'react';
import type {Caption} from '@remotion/captions';
import {Audio} from '@remotion/media';
import {AbsoluteFill, CanvasImage, Sequence, Track, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '../../shared/stoic-fonts';
import {MusicFade} from '../../shared/MusicFade';
import captionsData from './captions.json';
import music from './music.json';

const GOLD = '#dcb777';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const captions = captionsData as Caption[];

export const callBackMusicVolume = (frame: number, fps: number) => {
  const seconds = frame / fps;
  const activity = Math.max(0, ...captions.map((c) => interpolate(seconds,
    [c.startMs / 1000 - .1, c.startMs / 1000, c.endMs / 1000, c.endMs / 1000 + .2], [0, 1, 1, 0], clamp)));
  const quiet = interpolate(seconds,
    [music.quietBeat.startSeconds, music.quietBeat.lowStartSeconds, music.quietBeat.lowEndSeconds, music.quietBeat.endSeconds],
    [1, music.quietBeatVolume, music.quietBeatVolume, 1], clamp);
  return (music.pauseVolume - (music.pauseVolume - music.speechVolume) * activity) * quiet;
};

const Scene: FC<{image: string; first?: boolean; label: string; children: ReactNode}> = ({image, first, label, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#06090d', overflow: 'hidden', opacity: first ? 1 : interpolate(frame, [0, .2 * fps], [0, 1], clamp)}}>
    <CanvasImage src={staticFile(`call-back/images/${image}.png`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,6,10,.2) 10%, transparent 34%, rgba(3,6,10,.92) 65%, #06090d 96%)'}} />
    <div style={{position: 'absolute', top: 110, left: 84, color: GOLD, fontSize: 24, letterSpacing: 4}}>STOIC · ĐỪNG ĐỂ SAU</div>
    <div style={{position: 'absolute', top: 1060, left: 84, right: 120, opacity: interpolate(frame, [.1 * fps, .45 * fps], [0, 1], clamp)}}>
      <div style={{color: GOLD, fontSize: 24, letterSpacing: 3, marginBottom: 22}}>{label}</div>
      <div style={{fontSize: 88, fontWeight: 700, lineHeight: 1.14, letterSpacing: -2, color: '#f2ede3'}}>{children}</div>
      <div style={{height: 3, marginTop: 30, background: GOLD, width: interpolate(frame, [0, .7 * fps], [0, 100], clamp)}} />
    </div>
  </AbsoluteFill>;
};

const NarrationCaptions: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const page = captions.find((c) => frame * 1000 / fps >= c.startMs && frame * 1000 / fps < c.endMs);
  const captionParts = page?.text.split(/(tên mẹ|gọi lại|đang bận|hạn chót|bữa cơm|để sau|người thân|nghe lại|Ăn cơm chưa con|không thể gọi nữa|tiếc|quà đắt tiền|ngồi lại|câu chuyện|vội đi|người để gọi|nơi để về|lời thương|giá như)/gi) ?? [];
  return <div data-testid="call-back-caption" style={{position: 'absolute', top: 1520, left: 88, right: 128, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f2ede3', fontFamily: 'Stoic Sans, sans-serif', fontSize: 44, fontWeight: 700, lineHeight: 1.4, textAlign: 'center', textShadow: '0 3px 15px #000'}}>
    <div style={{width: '100%'}}>{captionParts.map((part, i) => <span key={i} style={{color: i % 2 === 1 ? '#dcb777' : undefined}}>{part}</span>)}</div>
  </div>;
};

export const CallBackVideo: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#06090d', fontFamily: 'Stoic Sans, sans-serif', fontWeight: 700}}>
    <Sequence name="01 · Để lát gọi lại" from={0} durationInFrames={282}><Scene first image="01-later" label="MỘT CUỘC GỌI QUEN THUỘC">Để lát<br /><span style={{color: GOLD}}>gọi lại.</span></Scene></Sequence>
    <Sequence name="02 · Tưởng vẫn còn kịp" from={276} durationInFrames={326}><Scene image="02-dinner" label="NHỮNG ĐIỀU CỨ ĐỂ SAU">Vì nghĩ lúc nào<br /><span style={{color: GOLD}}>cũng còn kịp.</span></Scene></Sequence>
    <Sequence name="03 · Chỉ mong nghe thêm một lần" from={596} durationInFrames={319}><Scene image="03-absence" label="KHI ĐIỀU QUEN THUỘC BIẾN MẤT">Chỉ mong nghe<br /><span style={{color: GOLD}}>thêm một lần.</span></Scene></Sequence>
    <Sequence name="04 · Từng có thời gian" from={909} durationInFrames={294}><Scene image="04-chair" label="ĐIỀU KHIẾN MÌNH TIẾC">Từng có thời gian.<br /><span style={{color: GOLD}}>Nhưng cứ để sau.</span></Scene></Sequence>
    <Sequence name="05 · Khi vẫn còn có thể" from={1197} durationInFrames={243}><Scene image="05-call" label="CÒN NGƯỜI ĐỂ GỌI, CÒN NƠI ĐỂ VỀ">Còn có thể,<br /><span style={{color: GOLD}}>đừng để sau.</span></Scene></Sequence>
    <Sequence name="Quốc Tuấn + caption · Native 1x" from={0} durationInFrames={48 * fps}>
      <Audio name="Quốc Tuấn · Đừng để sau" src={staticFile('call-back/audio/narration-quoc-tuan-v1-pauses.wav')} volume={1} />
      <NarrationCaptions />
    </Sequence>
    <Track name="Night · Chỉnh đầu/cuối trong Edit">
      <MusicFade fadeInSeconds={music.fadeInSeconds} fadeOutSeconds={music.fadeOutSeconds}>
        <Audio
          name="Night · Chỉnh trực tiếp trong Edit"
          src={staticFile('Ludovico Einaudi - Night (Official Video).mp3')}
          trimBefore={51.9 * fps}
          durationInFrames={38.4 * fps}
          volume={callBackMusicVolume(frame, fps)}
          playbackRate={0.79}
        />
      </MusicFade>
    </Track>
  </AbsoluteFill>;
};
