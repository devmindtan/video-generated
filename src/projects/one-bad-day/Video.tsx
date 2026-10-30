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

export const oneBadDayMusicVolume = (frame: number, fps: number) => {
  const seconds = frame / fps;
  const activity = Math.max(0, ...captions.map((c) => interpolate(seconds,
    [c.startMs / 1000 - .1, c.startMs / 1000, c.endMs / 1000, c.endMs / 1000 + .2], [0, 1, 1, 0], clamp)));
  return music.pauseVolume - (music.pauseVolume - music.speechVolume) * activity;
};

const Scene: FC<{image: string; first?: boolean; label: string; children: ReactNode}> = ({image, first, label, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#06090d', overflow: 'hidden', opacity: first ? 1 : interpolate(frame, [0, .2 * fps], [0, 1], clamp)}}>
    <CanvasImage src={staticFile(`one-bad-day/images/${image}.png`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,6,10,.2) 10%, transparent 34%, rgba(3,6,10,.92) 65%, #06090d 96%)'}} />
    <div style={{position: 'absolute', top: 110, left: 84, color: GOLD, fontSize: 24, letterSpacing: 4}}>STOIC · MỘT NGÀY CHƯA TỐT</div>
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
  const captionParts = page?.text.split(/(đến cùng|đã cố gắng|hôm nay|chưa tốt|hy vọng|kế hoạch|thay đổi|muốn bỏ|thất vọng|một ngày|kết luận|quá mệt|quá sức|đổi cách làm|hiểu|dừng lại|tự trách|vừa sức|giá trị|mong đợi)/gi) ?? [];
  return <div data-testid="one-bad-day-caption" style={{position: 'absolute', top: 1520, left: 88, right: 128, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f2ede3', fontFamily: 'Stoic Sans, sans-serif', fontSize: 44, fontWeight: 700, lineHeight: 1.4, textAlign: 'center', textShadow: '0 3px 15px #000'}}>
    <div style={{width: '100%'}}>{captionParts.map((part, i) => <span key={i} style={{color: i % 2 === 1 ? '#dcb777' : undefined}}>{part}</span>)}</div>
  </div>;
};

export const OneBadDayVideo: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#06090d', fontFamily: 'Stoic Sans, sans-serif', fontWeight: 700}}>
    <Sequence name="01 · Một ngày không xóa mọi ngày" from={0} durationInFrames={233}><Scene first image="01-one-fall" label="BẠN CÓ ĐANG QUÊN?">Một ngày chưa tốt.<br /><span style={{color: GOLD}}>Đâu xóa tất cả.</span></Scene></Sequence>
    <Sequence name="02 · Sợ lại thất vọng" from={227} durationInFrames={266}><Scene image="02-expectations" label="ĐÃ ĐẶT NHIỀU HY VỌNG">Bạn sợ lần này<br /><span style={{color: GOLD}}>vẫn không thay đổi.</span></Scene></Sequence>
    <Sequence name="03 · Đừng kết luận về chính mình" from={487} durationInFrames={296}><Scene image="03-not-the-whole" label="CỐ TIẾP CŨNG CẦN CAN ĐẢM">Đừng lấy một ngày<br /><span style={{color: GOLD}}>kết luận về mình.</span></Scene></Sequence>
    <Sequence name="04 · Tìm điều đang vướng" from={777} durationInFrames={174}><Scene image="04-too-heavy" label="HÔM NAY VƯỚNG Ở ĐÂU?">Bạn quá mệt?<br /><span style={{color: GOLD}}>Hay việc quá sức?</span></Scene></Sequence>
    <Sequence name="05 · Hiểu để điều chỉnh" from={945} durationInFrames={174}><Scene image="05-adjust" label="HIỂU ĐIỀU KHIẾN MÌNH DỪNG">Tìm chỗ cần sửa.<br /><span style={{color: GOLD}}>Đừng chỉ tự trách.</span></Scene></Sequence>
    <Sequence name="06 · Trở lại từ phần vừa sức" from={1113} durationInFrames={237}><Scene image="06-return" label="NHỮNG NGÀY CỐ GẮNG VẪN CÓ GIÁ TRỊ">Làm lại từ phần<br /><span style={{color: GOLD}}>vừa sức với mình.</span></Scene></Sequence>
    <Sequence name="Quốc Tuấn + caption · Native 1x" from={0} durationInFrames={45 * fps}>
      <Audio name="Quốc Tuấn · Một ngày chưa tốt" src={staticFile('one-bad-day/audio/narration-quoc-tuan-v2-pauses.wav')} volume={1} />
      <NarrationCaptions />
    </Sequence>
    <Track name="Night · Chỉnh đầu/cuối trong Edit">
      <MusicFade fadeInSeconds={music.fadeInSeconds} fadeOutSeconds={music.fadeOutSeconds}>
        <Audio
          name="Night · Chỉnh trực tiếp trong Edit"
          src={staticFile('Ludovico Einaudi - Night (Official Video).mp3')}
          trimBefore={53.95399999999999 * fps}
          durationInFrames={45 * fps}
          volume={oneBadDayMusicVolume(frame, fps)}
          playbackRate={0.79}
        />
      </MusicFade>
    </Track>
  </AbsoluteFill>;
};
