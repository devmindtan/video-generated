import type {FC, ReactNode} from 'react';
import type {Caption} from '@remotion/captions';
import {Audio} from '@remotion/media';
import {AbsoluteFill, CanvasImage, Sequence, Track, interpolate, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '../../shared/stoic-fonts';
import captionsData from './captions.json';
import music from './music.json';
import sfx from './sfx.json';
import {MusicFade} from '../../shared/MusicFade';

const GOLD = '#dcb777';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const captions = captionsData as Caption[][];
const starts = [0, 8, 18, 28, 38];

export const disciplinePurposeMusicVolume = (frame: number, fps: number) => {
  const seconds = frame / fps;
  const activity = Math.max(0, ...captions.flatMap((group, i) => group.map((c) => {
    const a = starts[i] + c.startMs / 1000;
    const b = starts[i] + c.endMs / 1000;
    return interpolate(seconds, [a - .1, a, b, b + .2], [0, 1, 1, 0], clamp);
  })));
  return music.pauseVolume - (music.pauseVolume - music.speechVolume) * activity;
};

const Atmosphere: FC<{index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (index === 0) return <>{Array.from({length: 16}, (_, i) => <div key={i} style={{position: 'absolute', left: 170 + ((random(`wheel-dust-${i}`) * 700 + t * 12) % 700), top: 800 + random(`wheel-height-${i}`) * 180 - Math.sin(t + i) * 12, width: 2 + i % 3, height: 2 + i % 3, borderRadius: '50%', background: '#c9bb9f', opacity: .12}} />)}</>;
  if (index === 2) return <div style={{position: 'absolute', left: 170, top: 320, width: 740, height: 630, background: 'radial-gradient(ellipse, rgba(71,158,216,.16), transparent 68%)', opacity: .65 + Math.sin(t * 1.4) * .08}} />;
  return null;
};

const Scene: FC<{index: number; image: string; label: string; children: ReactNode}> = ({index, image, label, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const page = captions[index]?.find((c) => frame * 1000 / fps >= c.startMs && frame * 1000 / fps < c.endMs);
  return <AbsoluteFill style={{background: '#050709', overflow: 'hidden', opacity: index === 0 ? 1 : interpolate(frame, [0, .2 * fps], [0, 1], clamp)}}>
    <CanvasImage src={staticFile(`discipline-purpose/images/${image}.png`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    <Atmosphere index={index} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(2,5,8,.05) 15%, transparent 33%, rgba(2,5,8,.83) 63%, #050709 96%)'}} />
    <div style={{position: 'absolute', top: 110, left: 84, fontSize: 24, letterSpacing: 4, color: GOLD}}>STOIC · GÓC NHÌN KHÁC</div>
    <div style={{position: 'absolute', top: 1060, left: 84, right: 120}}>
      <div style={{color: GOLD, fontSize: 24, letterSpacing: 3, marginBottom: 22}}>{label}</div>
      <div style={{color: '#f2ede3', fontSize: 88, fontWeight: 750, lineHeight: 1.14, letterSpacing: -2}}>{children}</div>
      <div style={{marginTop: 30, width: 100, height: 3, background: GOLD}} />
    </div>
    <div style={{position: 'absolute', top: 1520, left: 88, right: 128, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f2ede3', fontSize: 44, fontWeight: 500, lineHeight: 1.4, textAlign: 'center', textShadow: '0 3px 15px #000'}}>{page?.text}</div>
    {index === 4 ? <div style={{position: 'absolute', top: 1750, left: 84, fontSize: 23, letterSpacing: 2, color: GOLD, opacity: interpolate(frame, [5 * fps, 6 * fps], [0, 1], clamp)}}>LƯU LẠI · NHỚ LÝ DO BẮT ĐẦU</div> : null}
  </AbsoluteFill>;
};

export const DisciplinePurposeVideo: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#050709', fontFamily: 'Stoic Sans, sans-serif'}}>
    {/* Short image overlaps; authored narration beats remain unchanged. */}
    <Sequence name="01 · Chỉ kỷ luật đã đủ?" from={0} durationInFrames={Math.round(8.2 * fps)}><Scene index={0} image="01-wheel" label="MỘT CÂU HỎI KHÁC">Chỉ kỷ luật…<br /><span style={{color: GOLD}}>đã đủ chưa?</span></Scene></Sequence>
    <Sequence name="02 · Giữ nhịp, quên mục tiêu" from={8 * fps} durationInFrames={Math.round(10.2 * fps)}><Scene index={1} image="02-gears" label="KHI CHỈ CÒN VIỆC ĐẠT CHỈ TIÊU">Đúng lịch.<br />Đúng việc.<br /><span style={{color: GOLD}}>Nhưng để làm gì?</span></Scene></Sequence>
    <Sequence name="03 · Lý do theo đuổi" from={18 * fps} durationInFrames={Math.round(10.2 * fps)}><Scene index={2} image="03-fire" label="KHÔNG CHỈ LÀ MỘT CƠN HỨNG">Điều gì khiến bạn<br /><span style={{color: GOLD}}>vẫn muốn làm?</span></Scene></Sequence>
    <Sequence name="04 · Đích đến, nhiên liệu, tay lái" from={28 * fps} durationInFrames={Math.round(10.2 * fps)}><Scene index={3} image="04-engine" label="HAI THỨ BỔ TRỢ CHO NHAU">Động lực tiếp sức.<br /><span style={{color: GOLD}}>Kỷ luật giữ nhịp.</span></Scene></Sequence>
    <Sequence name="05 · Giữ lý do" from={38 * fps} durationInFrames={10 * fps}><Scene index={4} image="05-horizon" label="TRƯỚC KHI TỰ SIẾT THÊM MỘT NGUYÊN TẮC">Giữ thói quen.<br /><span style={{color: GOLD}}>Đừng quên lý do.</span></Scene></Sequence>
    <Track name="Hải Đăng · Phân tích · Tốc độ gốc 1×">
      <Audio from={0} durationInFrames={8 * fps} src={staticFile('discipline-purpose/audio/01-wheel-voice-full.wav')} />
      <Audio from={8 * fps} durationInFrames={10 * fps} src={staticFile('discipline-purpose/audio/02-gears-voice-full.wav')} />
      <Audio from={18 * fps} durationInFrames={10 * fps} src={staticFile('discipline-purpose/audio/03-fire-voice-full.wav')} />
      <Audio from={28 * fps} durationInFrames={10 * fps} src={staticFile('discipline-purpose/audio/04-engine-voice-full.wav')} />
      <Audio from={38 * fps} durationInFrames={10 * fps} src={staticFile('discipline-purpose/audio/05-horizon-voice-full.wav')} />
    </Track>
    <Track name="SFX · Kim loại và động cơ">
      <Audio name="Kim loại ma sát" from={8 * fps} durationInFrames={2 * fps} src={staticFile('discipline-purpose/audio/metal-friction.wav')} volume={sfx.metalVolume} />
      <Audio name="Động cơ trầm" from={29 * fps} durationInFrames={4 * fps} src={staticFile('discipline-purpose/audio/engine-rumble.wav')} volume={sfx.engineVolume} />
    </Track>
    <Track name="Nhạc nền · Chỉnh đầu/cuối trong Edit">
      <MusicFade fadeInSeconds={music.fadeInSeconds} fadeOutSeconds={music.fadeOutSeconds}>
      <Audio
        name="Experience · Reverb · Chỉnh trực tiếp trong Edit"
        src={staticFile('single-task/audio/experience-reverb-full.wav')}
        trimBefore={86.19 * fps}
        durationInFrames={46.809999999999995 * fps}
        playbackRate={0.85}
        volume={disciplinePurposeMusicVolume(frame, fps)}
      />
      </MusicFade>
    </Track>
  </AbsoluteFill>;
};
