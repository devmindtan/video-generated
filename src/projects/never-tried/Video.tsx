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

export const neverTriedMusicVolume = (frame: number, fps: number) => {
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
  const captionParts = page?.text.split(/(chưa từng thất bại|chưa từng thua|một phần nhỏ|chưa tốt|chưa biết|chuẩn bị|tự tin|né tránh|kết quả|thất bại|sửa sai|giỏi hơn|không thử|thành tích|bắt đầu)/gi) ?? [];
  return <AbsoluteFill style={{background: '#06090d', overflow: 'hidden', opacity: index === 0 ? 1 : interpolate(frame, [0, .16 * fps], [0, 1], clamp)}}>
    <CanvasImage src={staticFile(`never-tried/images/${image}.png`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    {index === 2 ? <div style={{position: 'absolute', top: 300, left: 180, width: 700, height: 580, background: 'radial-gradient(ellipse, rgba(216,145,64,.10), transparent 68%)', opacity: .65 + Math.sin(frame / fps * .9) * .05}} /> : null}
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,6,10,.08) 20%, transparent 35%, rgba(3,6,10,.9) 65%, #06090d 96%)'}} />
    <div style={{position: 'absolute', top: 110, left: 84, fontSize: 24, letterSpacing: 4, color: GOLD}}>STOIC · THỬ RỒI MỚI BIẾT</div>
    <div style={{position: 'absolute', top: 1060, left: 84, right: 120}}>
      <div style={{color: GOLD, fontSize: 24, letterSpacing: 3, marginBottom: 22}}>{label}</div>
      <div style={{color: '#f2ede3', fontSize: 88, fontWeight: 700, lineHeight: 1.14, letterSpacing: -2}}>{children}</div>
      <div style={{marginTop: 30, width: 100, height: 3, background: GOLD}} />
    </div>
    <div data-testid="never-tried-caption" style={{position: 'absolute', top: 1520, left: 88, right: 128, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f2ede3', fontFamily: 'Stoic Sans, sans-serif', fontSize: 44, fontWeight: 700, lineHeight: 1.4, textAlign: 'center', textShadow: '0 3px 15px #000'}}>
      <div style={{width: '100%'}}>{captionParts.map((part, i) => <span key={i} style={{color: i % 2 === 1 ? '#dcb777' : undefined}}>{part}</span>)}</div>
    </div>
    {index === 4 ? <div style={{position: 'absolute', top: 1750, left: 84, fontSize: 23, letterSpacing: 2, color: GOLD, opacity: interpolate(frame, [5 * fps, 6 * fps], [0, 1], clamp)}}>CHỌN MỘT VIỆC · THỬ NGAY HÔM NAY</div> : null}
  </AbsoluteFill>;
};

export const NeverTriedVideo: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#06090d', fontFamily: 'Stoic Sans, sans-serif'}}>
    {/* Stable source stills and short overlaps, not AI motion footage. */}
    <Sequence name="01 · Chưa thua hay chưa thử?" from={0} durationInFrames={Math.round(8.2 * fps)}><Scene index={0} image="01-sword" label="CHƯA THUA KHÔNG CÓ NGHĨA LÀ ĐÃ THẮNG">Chưa từng thua.<br /><span style={{color: GOLD}}>Đã thử lần nào?</span></Scene></Sequence>
    <Sequence name="02 · Cái giá của trì hoãn" from={8 * fps} durationInFrames={Math.round(10.2 * fps)}><Scene index={1} image="02-anchor" label="THỜI GIAN VẪN ĐANG TRÔI">Cứ hẹn “để mai”.<br /><span style={{color: GOLD}}>Bao giờ mới thử?</span></Scene></Sequence>
    <Sequence name="03 · Kết quả để sửa" from={18 * fps} durationInFrames={Math.round(10.2 * fps)}><Scene index={2} image="03-shield" label="BÀI HỌC KHÔNG TỰ ĐẾN">Thử. Xem lại.<br /><span style={{color: GOLD}}>Rồi sửa cách làm.</span></Scene></Sequence>
    <Sequence name="04 · Thời gian trôi, kế hoạch vẫn đó" from={28 * fps} durationInFrames={Math.round(10.2 * fps)}><Scene index={3} image="04-chair" label="THỜI GIAN TRÔI QUA…">Thời gian trôi.<br /><span style={{color: GOLD}}>Kế hoạch vẫn đó.</span></Scene></Sequence>
    <Sequence name="05 · Làm một phần nhỏ hôm nay" from={38 * fps} durationInFrames={10 * fps}><Scene index={4} image="05-runner" label="KHÔNG CẦN ĐÁNH CƯỢC TẤT CẢ">Một việc.<br />Một phần nhỏ.<br /><span style={{color: GOLD}}>Ngay hôm nay.</span></Scene></Sequence>
    <Track name="Hải Đăng · Đanh, gọn · Tốc độ gốc 1×">
      <Audio name="Hải Đăng · 01" from={0} durationInFrames={8 * fps} src={staticFile('never-tried/audio/01-sword-voice-full.wav')} volume={1} />
      <Audio name="Hải Đăng · 02" from={8 * fps} durationInFrames={10 * fps} src={staticFile('never-tried/audio/02-anchor-voice-full.wav')} volume={1} />
      <Audio name="Hải Đăng · 03" from={18 * fps} durationInFrames={10 * fps} src={staticFile('never-tried/audio/03-shield-voice-full.wav')} volume={1} />
      <Audio name="Hải Đăng · 04" from={28 * fps} durationInFrames={10 * fps} src={staticFile('never-tried/audio/04-chair-voice-full.wav')} volume={1} />
      <Audio name="Hải Đăng · 05" from={38 * fps} durationInFrames={10 * fps} src={staticFile('never-tried/audio/05-runner-voice-full.wav')} volume={1} />
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
          volume={neverTriedMusicVolume(frame, fps)}
        />
      </MusicFade>
    </Track>
  </AbsoluteFill>;
};
