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
const captions = captionsData as Caption[][];
const starts = [0, 8, 18, 28, 38];

export const takeStockMusicVolume = (frame: number, fps: number) => {
  const seconds = frame / fps;
  const activity = Math.max(0, ...captions.flatMap((group, i) => group.map((c) => {
    const a = starts[i] + c.startMs / 1000;
    const b = starts[i] + c.endMs / 1000;
    return interpolate(seconds, [a - .1, a, b, b + .2], [0, 1, 1, 0], clamp);
  })));
  return music.pauseVolume - (music.pauseVolume - music.speechVolume) * activity;
};

const Scene: FC<{index: number; image: string; label: string; children: ReactNode}> = ({index, image, label, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const page = captions[index]?.find((c) => frame * 1000 / fps >= c.startMs && frame * 1000 / fps < c.endMs);
  const captionParts = page?.text.split(/(không có giày|không có chân|bình thường|mong mỏi|đôi chân|còn thiếu|đang có|khổ hơn|nỗi buồn|che khuất|nâng đỡ|trân trọng|biết ơn|mất đi|giá trị)/gi) ?? [];
  return <AbsoluteFill style={{background: '#06090d', overflow: 'hidden', opacity: index === 0 ? 1 : interpolate(frame, [0, .16 * fps], [0, 1], clamp)}}>
    <CanvasImage src={staticFile(`take-stock/images/${image}.png`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,6,10,.08) 20%, transparent 35%, rgba(3,6,10,.9) 65%, #06090d 96%)'}} />
    <div style={{position: 'absolute', top: 110, left: 84, fontSize: 24, letterSpacing: 4, color: GOLD}}>STOIC · ĐỪNG ĐỢI ĐẾN KHI MẤT ĐI</div>
    <div style={{position: 'absolute', top: 1060, left: 84, right: 120}}>
      <div style={{color: GOLD, fontSize: 24, letterSpacing: 3, marginBottom: 22}}>{label}</div>
      <div style={{color: '#f2ede3', fontSize: 88, fontWeight: 700, lineHeight: 1.14, letterSpacing: -2}}>{children}</div>
      <div style={{marginTop: 30, width: 100, height: 3, background: GOLD}} />
    </div>
    <div data-testid="take-stock-caption" style={{position: 'absolute', top: 1520, left: 88, right: 128, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f2ede3', fontFamily: 'Stoic Sans, sans-serif', fontSize: 44, fontWeight: 700, lineHeight: 1.4, textAlign: 'center', textShadow: '0 3px 15px #000'}}>
      <div style={{width: '100%'}}>{captionParts.map((part, i) => <span key={i} style={{color: i % 2 === 1 ? '#dcb777' : undefined}}>{part}</span>)}</div>
    </div>
    {index === 4 ? <div style={{position: 'absolute', top: 1750, left: 84, fontSize: 23, letterSpacing: 2, color: GOLD, opacity: interpolate(frame, [5 * fps, 6 * fps], [0, 1], clamp)}}>TRÂN TRỌNG KHI MÌNH VẪN CÒN CÓ</div> : null}
  </AbsoluteFill>;
};

export const TakeStockVideo: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#06090d', fontFamily: 'Stoic Sans, sans-serif'}}>
    {/* Stable source stills and short overlaps, not AI motion footage. */}
    <Sequence name="01 · Câu nói về đôi giày" from={0} durationInFrames={Math.round(8.2 * fps)}><Scene index={0} image="01-shoes-v2" label="TÔI ĐÃ KHÓC...">Không có giày.<br /><span style={{color: GOLD}}>Để rồi nhận ra...</span></Scene></Sequence>
    <Sequence name="02 · Điều bình thường đáng quý" from={8 * fps} durationInFrames={Math.round(10.2 * fps)}><Scene index={1} image="02-cage" label="ĐIỀU MÌNH VẪN XEM LÀ BÌNH THƯỜNG">Điều quen thuộc.<br /><span style={{color: GOLD}}>Vẫn rất đáng quý.</span></Scene></Sequence>
    <Sequence name="03 · Nhìn lại đôi chân" from={18 * fps} durationInFrames={Math.round(10.2 * fps)}><Scene index={2} image="03-perspective" label="MẢI NHÌN ĐÔI GIÀY CÒN THIẾU">Quên đôi chân<br /><span style={{color: GOLD}}>vẫn đưa mình đi.</span></Scene></Sequence>
    <Sequence name="04 · Trân trọng điều quen thuộc" from={28 * fps} durationInFrames={Math.round(10.2 * fps)}><Scene index={3} image="04-ground" label="ĐÔI CHÂN VẪN ĐƯA MÌNH ĐI MỖI NGÀY">Khi vẫn còn có.<br /><span style={{color: GOLD}}>Đã biết quý chưa?</span></Scene></Sequence>
    <Sequence name="05 · Trân trọng trước khi mất" from={38 * fps} durationInFrames={10 * fps}><Scene index={4} image="05-pillar" label="BIẾT ƠN KHÔNG PHẢI THÔI MONG MUỐN">Đừng đợi mất đi.<br /><span style={{color: GOLD}}>Mới trân trọng.</span></Scene></Sequence>
    <Track name="Hải Đăng · Đanh, gọn · Tốc độ gốc 1×">
      <Audio name="Hải Đăng · 01" from={0} durationInFrames={8 * fps} src={staticFile('take-stock/audio/01-shoes-voice-full.wav')} volume={1} />
      <Audio name="Hải Đăng · 02" from={8 * fps} durationInFrames={10 * fps} src={staticFile('take-stock/audio/02-cage-voice-full.wav')} volume={1} />
      <Audio name="Hải Đăng · 03" from={18 * fps} durationInFrames={10 * fps} src={staticFile('take-stock/audio/03-perspective-voice-full.wav')} volume={1} />
      <Audio name="Hải Đăng · 04" from={28 * fps} durationInFrames={10 * fps} src={staticFile('take-stock/audio/04-ground-voice-full.wav')} volume={1} />
      <Audio name="Hải Đăng · 05" from={38 * fps} durationInFrames={10 * fps} src={staticFile('take-stock/audio/05-pillar-voice-full.wav')} volume={1} />
    </Track>
    <Track name="Snowfall · Chỉnh đầu/cuối trong Edit">
      <MusicFade fadeInSeconds={music.fadeInSeconds} fadeOutSeconds={music.fadeOutSeconds}>
        <Audio
          name="Snowfall · Chỉnh trực tiếp trong Edit"
          src={staticFile('own-timeline/audio/snowfall.mp3')}
          from={0}
          trimBefore={24.9 * fps}
          durationInFrames={48 * fps}
          playbackRate={0.85}
          volume={takeStockMusicVolume(frame, fps)}
        />
      </MusicFade>
    </Track>
  </AbsoluteFill>;
};
