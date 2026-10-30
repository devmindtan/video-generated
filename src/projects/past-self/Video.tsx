import type {FC, ReactNode} from 'react';
import type {Caption} from '@remotion/captions';
import {Audio} from '@remotion/media';
import {AbsoluteFill, CanvasImage, Sequence, Track, interpolate, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '../../shared/stoic-fonts';
import captionsData from './captions.json';
import music from './music.json';

const GOLD = '#dfbc7b';
const IVORY = '#f4eee4';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const starts = [0, 8, 18, 28, 40];
const captions = captionsData as Caption[][];

/** Decorative motion only: this philosophy film intentionally uses still photographs. */
const Atmosphere: FC<{index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (index === 0 || index === 4) return <>{[0, 1, 2].map((i) => {
    const p = ((t + i * 1.8) % 6) / 6;
    return <div key={i} style={{position: 'absolute', left: 210, top: 740, width: 660, height: 170, borderRadius: '50%', border: '1px solid #d8bc86', scale: 0.3 + p * 1.6, opacity: (1 - p) * (index === 4 ? 0.09 : 0.14)}} />;
  })}</>;
  if (index === 2) return <div style={{position: 'absolute', top: 260, left: 190, width: 700, height: 730, background: 'radial-gradient(ellipse, rgba(241,174,66,.15), transparent 64%)', opacity: .55 + Math.sin(t * 3.6) * .12 + Math.sin(t * 7.4) * .04}} />;
  if (index === 3) return <>{Array.from({length: 28}, (_, i) => {
    const p = ((t + random(`ash-time-${i}`) * 10) % 10) / 10;
    return <div key={i} style={{position: 'absolute', left: 360 + p * 450 + random(`ash-x-${i}`) * 180, top: 860 - p * 440 + Math.sin(t + i) * 20, width: 2 + i % 3, height: 2 + i % 3, background: '#c0b8ad', borderRadius: '50%', opacity: Math.sin(p * Math.PI) * .26}} />;
  })}</>;
  return <div style={{position: 'absolute', top: 140, left: 140, width: 800, height: 850, background: 'radial-gradient(ellipse, rgba(213,229,236,.08), transparent 65%)', opacity: .6 + Math.sin(t * .7) * .15}} />;
};

const Scene: FC<{index: number; image: string; label: string; children: ReactNode}> = ({index, image, label, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const page = captions[index]?.find((c) => frame * 1000 / fps >= c.startMs && frame * 1000 / fps < c.endMs);
  return <AbsoluteFill style={{background: '#030609', overflow: 'hidden', opacity: interpolate(frame, [0, .45 * fps], [0, 1], clamp)}}>
    <CanvasImage src={staticFile(`past-self/images/${image}.png`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    <Atmosphere index={index} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(2,5,8,.06) 15%, transparent 33%, rgba(2,5,8,.76) 62%, #030609 95%)'}} />
    <div style={{position: 'absolute', left: 84, top: 112, color: GOLD, fontSize: 24, letterSpacing: 5}}>STOIC · LỜI NHẮC CHO MÌNH</div>
    <div style={{position: 'absolute', left: 84, right: 110, top: 1040, opacity: interpolate(frame, [.35 * fps, 1.05 * fps], [0, 1], clamp)}}>
      <div style={{color: GOLD, fontSize: 23, letterSpacing: 4, marginBottom: 24}}>{label}</div>
      <div style={{fontSize: 86, fontWeight: 700, lineHeight: 1.16, letterSpacing: -2}}>{children}</div>
      <div style={{marginTop: 30, width: 90, height: 2, background: GOLD, opacity: .7}} />
    </div>
    <div style={{position: 'absolute', left: 88, right: 128, top: 1510, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: 44, lineHeight: 1.4, fontWeight: 500, textShadow: '0 3px 18px #000'}}>{page?.text}</div>
    {index === 4 ? <div style={{position: 'absolute', left: 84, top: 1750, color: GOLD, fontSize: 24, letterSpacing: 3, opacity: interpolate(frame, [5 * fps, 6 * fps], [0, 1], clamp)}}>THEO DÕI · NHỮNG LỜI NHẮC DỊU DÀNG</div> : null}
  </AbsoluteFill>;
};

export const pastSelfMusicVolume = (frame: number, fps: number) => {
  const seconds = frame / fps;
  const activity = Math.max(0, ...captions.flatMap((group, i) => group.map((c) => {
    const a = starts[i] + c.startMs / 1000;
    const b = starts[i] + c.endMs / 1000;
    return interpolate(seconds, [a - .15, a, b, b + .25], [0, 1, 1, 0], clamp);
  })));
  const base = music.pauseVolume - (music.pauseVolume - music.speechVolume) * activity;
  return base * Math.min(interpolate(seconds, [0, music.fadeInSeconds], [0, 1], clamp), interpolate(seconds, [50 - music.fadeOutSeconds, 50 - 1 / fps], [1, 0], clamp));
};

export const PastSelfVideo: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#030609', color: IVORY, fontFamily: 'Stoic Sans, sans-serif'}}>
    {/* Separate sequences intentionally overlap by 0.45s; incoming fades over an opaque outgoing image. */}
    <Sequence name="01 · Quyết định cũ" from={0} durationInFrames={Math.round(8.45 * fps)}><Scene index={0} image="01-mask" label="NHỮNG ĐIỀU VẪN DAY DỨT">Bạn vẫn tự trách mình<br /><span style={{color: GOLD}}>vì chuyện cũ?</span></Scene></Sequence>
    <Sequence name="02 · Hiểu mình ngày ấy" from={8 * fps} durationInFrames={Math.round(10.45 * fps)}><Scene index={1} image="02-petal" label="HIỂU CHO MÌNH NGÀY ẤY">Ngày ấy, bạn<br />chưa hiểu được<br /><span style={{color: GOLD}}>như bây giờ.</span></Scene></Sequence>
    <Sequence name="03 · Trách nhiệm và cơ hội" from={18 * fps} durationInFrames={Math.round(10.45 * fps)}><Scene index={2} image="03-lantern" label="THA THỨ KHÔNG PHẢI LÀ QUÊN">Nhận lỗi.<br /><span style={{color: GOLD}}>Đừng mãi<br />trừng phạt mình.</span></Scene></Sequence>
    <Sequence name="04 · Buông dằn vặt" from={28 * fps} durationInFrames={Math.round(12.45 * fps)}><Scene index={3} image="04-ashes" label="BUÔNG SỰ DẰN VẶT">Hiểu mình hơn.<br /><span style={{color: GOLD}}>Đừng trách mình<br />ngày ấy.</span></Scene></Sequence>
    <Sequence name="05 · Bình yên" from={40 * fps} durationInFrames={10 * fps}><Scene index={4} image="05-pond" label="MỘT KHỞI ĐẦU DỊU DÀNG">Bạn được phép<br /><span style={{color: GOLD}}>bước tiếp.</span></Scene></Sequence>
    <Track name="Lời đọc · Hải Đăng · Giọng Stoic Control">
      <Audio from={0} durationInFrames={8 * fps} src={staticFile('past-self/audio/01-mask-voice-full.wav')} />
      <Audio from={8 * fps} durationInFrames={10 * fps} src={staticFile('past-self/audio/02-petal-voice-full.wav')} />
      <Audio from={18 * fps} durationInFrames={10 * fps} src={staticFile('past-self/audio/03-lantern-voice-full.wav')} />
      <Audio from={28 * fps} durationInFrames={12 * fps} src={staticFile('past-self/audio/04-ashes-voice-full.wav')} />
      <Audio from={40 * fps} durationInFrames={10 * fps} src={staticFile('past-self/audio/05-pond-voice-full.wav')} />
    </Track>
    <Audio
      name="Snowfall · Øneheart và reidenshi"
      src={staticFile(music.file)}
      trimBefore={Math.round(music.sourceStartSeconds * fps)}
      durationInFrames={50 * fps}
      volume={pastSelfMusicVolume(frame, fps)}
      playbackRate={0.8}
    />
    <AbsoluteFill style={{background: '#030609', pointerEvents: 'none', opacity: interpolate(frame, [49.2 * fps, 50 * fps - 1], [0, 1], clamp)}} />
  </AbsoluteFill>;
};
