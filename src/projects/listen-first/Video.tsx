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

export const listenFirstMusicVolume = (frame: number, fps: number) => {
  const seconds = frame / fps;
  const activity = Math.max(0, ...captions.map((c) => interpolate(seconds,
    [c.startMs / 1000 - .1, c.startMs / 1000, c.endMs / 1000, c.endMs / 1000 + .2], [0, 1, 1, 0], clamp)));
  return music.pauseVolume - (music.pauseVolume - music.speechVolume) * activity;
};

const Scene: FC<{image: string; first?: boolean; label: string; children: ReactNode}> = ({image, first, label, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#06090d', overflow: 'hidden', opacity: first ? 1 : interpolate(frame, [0, .2 * fps], [0, 1], clamp)}}>
    <CanvasImage src={staticFile(`listen-first/images/${image}.png`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,6,10,.2) 10%, transparent 34%, rgba(3,6,10,.92) 65%, #06090d 96%)'}} />
    <div style={{position: 'absolute', top: 110, left: 84, color: GOLD, fontSize: 24, letterSpacing: 4}}>STOIC · LẮNG NGHE TRƯỚC</div>
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
  const captionParts = page?.text.split(/(rất mệt|vội|nên làm gì|muốn giúp|chưa nghe hết|nỗi buồn|bài toán|giải thích|bảo vệ|cảm xúc|an ủi|chấm điểm|biết|chưa đủ sức|không ổn|đã sai|lời khuyên|cùng tìm cách|ngồi nghe|thấu hiểu|đủ sức|giải quyết)/gi) ?? [];
  return <div data-testid="listen-first-caption" style={{position: 'absolute', top: 1520, left: 88, right: 128, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f2ede3', fontFamily: 'Stoic Sans, sans-serif', fontSize: 44, fontWeight: 700, lineHeight: 1.4, textAlign: 'center', textShadow: '0 3px 15px #000'}}>
    <div style={{width: '100%'}}>{captionParts.map((part, i) => <span key={i} style={{color: i % 2 === 1 ? '#dcb777' : undefined}}>{part}</span>)}</div>
  </div>;
};

export const ListenFirstVideo: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#06090d', fontFamily: 'Stoic Sans, sans-serif', fontWeight: 700}}>
    <Sequence name="01 · Chưa nghe đã khuyên" from={0} durationInFrames={196}><Scene first image="01-interrupted" label="NGƯỜI TA VỪA KỂ RẰNG MÌNH MỆT">Chưa nghe hết.<br /><span style={{color: GOLD}}>Đã vội khuyên.</span></Scene></Sequence>
    <Sequence name="02 · Nỗi buồn thành bài toán" from={190} durationInFrames={187}><Scene image="02-fixing" label="BẠN MUỐN GIÚP">Bạn muốn giúp.<br /><span style={{color: GOLD}}>Họ lại thấy áp lực.</span></Scene></Sequence>
    <Sequence name="03 · Cảm giác bị đánh giá" from={371} durationInFrames={253}><Scene image="03-judged" label="PHẢI TỰ BẢO VỆ CẢM XÚC">Cần an ủi.<br /><span style={{color: GOLD}}>Lại bị chấm điểm.</span></Scene></Sequence>
    <Sequence name="04 · Chưa đủ sức làm" from={618} durationInFrames={388}><Scene image="04-safe-space" label="MỘT NƠI ĐƯỢC NÓI THẬT">Họ biết phải làm.<br /><span style={{color: GOLD}}>Chỉ là chưa đủ sức.</span></Scene></Sequence>
    <Sequence name="05 · Hỏi trước khi khuyên" from={1000} durationInFrames={174}><Scene image="05-ask-first" label="TRƯỚC KHI ĐƯA LỜI KHUYÊN">Cùng tìm cách?<br /><span style={{color: GOLD}}>Hay chỉ ngồi nghe?</span></Scene></Sequence>
    <Sequence name="06 · Sức mạnh của thấu hiểu" from={1168} durationInFrames={182}><Scene image="06-strength" label="ĐƯỢC THẤU HIỂU">Có người hiểu.<br /><span style={{color: GOLD}}>Có thêm sức.</span></Scene></Sequence>
    <Sequence name="Quốc Tuấn + caption · Native 1x" from={0} durationInFrames={45 * fps}>
      <Audio name="Quốc Tuấn · Lắng nghe trước" src={staticFile('listen-first/audio/narration-quoc-tuan-v2-pacing.wav')} volume={1} />
      <NarrationCaptions />
    </Sequence>
    <Track name="Night · Chỉnh đầu/cuối trong Edit">
      <MusicFade fadeInSeconds={music.fadeInSeconds} fadeOutSeconds={music.fadeOutSeconds}>
        <Audio
          name="Night · Chỉnh trực tiếp trong Edit"
          src={staticFile('Ludovico Einaudi - Night (Official Video).mp3')}
          trimBefore={53.95399999999999 * fps}
          durationInFrames={45 * fps}
          volume={listenFirstMusicVolume(frame, fps)}
          playbackRate={0.79}
        />
      </MusicFade>
    </Track>
  </AbsoluteFill>;
};
