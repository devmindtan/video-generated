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

/** Frame-driven illustration accents, not generated motion footage. */
const Sediment: FC<{index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (index > 2) return null;
  return <div style={{position: 'absolute', left: 300, top: 490, width: 480, height: 470, overflow: 'hidden', borderRadius: '12%'}}>
    {Array.from({length: 22}, (_, i) => {
      const phase = random(`settle-phase-${i}`) * Math.PI * 2;
      const settling = index === 2;
      const drift = settling ? Math.min(t / 8, 1) : 0;
      return <div key={i} style={{position: 'absolute', left: 225 + Math.sin(t * (settling ? .15 : .6) + phase) * (110 + i * 2), top: settling ? 40 + random(`settle-y-${i}`) * 300 + drift * 170 : 235 + Math.cos(t * .7 + phase) * 180, width: 2 + i % 3, height: 2 + i % 3, borderRadius: '50%', background: '#bea17a', opacity: (settling ? .13 * (1 - drift) : .14)}} />;
    })}
  </div>;
};

const Scene: FC<{index: number; image: string; label: string; children: ReactNode}> = ({index, image, label, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ms = frame * 1000 / fps;
  const page = captions[index]?.find((c) => ms >= c.startMs && ms < c.endMs);
  return <AbsoluteFill style={{background: '#030609', overflow: 'hidden', opacity: interpolate(frame, [0, .45 * fps], [0, 1], clamp)}}>
    <CanvasImage src={staticFile(`let-it-settle/images/${image}.png`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    {index === 2 ? <CanvasImage src={staticFile('let-it-settle/images/04-clear.png')} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: interpolate(frame, [2 * fps, 9 * fps], [0, .9], clamp)}} /> : null}
    <Sediment index={index} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(2,5,8,.03) 15%, transparent 34%, rgba(2,5,8,.78) 63%, #030609 96%)'}} />
    <div style={{position: 'absolute', left: 84, top: 112, color: GOLD, fontSize: 24, letterSpacing: 5}}>STOIC · LỜI NHẮC CHO MÌNH</div>
    <div style={{position: 'absolute', left: 84, right: 120, top: 1060, opacity: interpolate(frame, [.35 * fps, 1 * fps], [0, 1], clamp)}}>
      <div style={{fontSize: 23, letterSpacing: 4, color: GOLD, marginBottom: 22}}>{label}</div>
      <div style={{fontSize: 86, lineHeight: 1.17, fontWeight: 700, letterSpacing: -2}}>{children}</div>
      <div style={{width: 90, height: 2, background: GOLD, marginTop: 30, opacity: .7}} />
    </div>
    <div style={{position: 'absolute', left: 88, right: 128, top: 1510, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: 44, fontWeight: 500, lineHeight: 1.4, textShadow: '0 3px 18px #000'}}>{page?.text}</div>
    {index === 4 ? <div style={{position: 'absolute', left: 84, top: 1750, color: GOLD, fontSize: 23, letterSpacing: 2, opacity: interpolate(frame, [4 * fps, 5 * fps], [0, 1], clamp)}}>THEO DÕI · NHỮNG LỜI NHẮC DỊU DÀNG</div> : null}
  </AbsoluteFill>;
};

export const settleMusicVolume = (frame: number, fps: number) => {
  const seconds = frame / fps;
  const activity = Math.max(0, ...captions.flatMap((group, i) => group.map((c) => {
    const a = starts[i] + c.startMs / 1000;
    const b = starts[i] + c.endMs / 1000;
    return interpolate(seconds, [a - .15, a, b, b + .25], [0, 1, 1, 0], clamp);
  })));
  return (music.pauseVolume - (music.pauseVolume - music.speechVolume) * activity) * Math.min(
    interpolate(seconds, [0, music.fadeInSeconds], [0, 1], clamp),
    interpolate(seconds, [48 - music.fadeOutSeconds, 48 - 1 / fps], [1, 0], clamp),
  );
};

export const LetItSettleVideo: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#030609', color: IVORY, fontFamily: 'Stoic Sans, sans-serif'}}>
    {/* Overlap only the images. Caption/voice clocks retain the authored 0/8/18/28/40s beat starts. */}
    <Sequence name="01 · Một giờ sáng" from={0} durationInFrames={Math.round(8.45 * fps)}><Scene index={0} image="01-storm" label="MỘT GIỜ SÁNG">Người nằm im.<br /><span style={{color: GOLD}}>Đầu vẫn tranh luận.</span></Scene></Sequence>
    <Sequence name="02 · Nghĩ thêm chắc sẽ ra" from={8 * fps} durationInFrames={Math.round(10.45 * fps)}><Scene index={1} image="02-stir" label="NGHĨ THÊM MỘT CHÚT NỮA?">Chuyện nhỏ<br /><span style={{color: GOLD}}>bỗng thành lớn.</span></Scene></Sequence>
    <Sequence name="03 · Đọc lại lần thứ mười" from={18 * fps} durationInFrames={Math.round(10.45 * fps)}><Scene index={2} image="03-pause" label="VẪN NHỮNG DÒNG CHỮ ẤY">Đang giải quyết,<br /><span style={{color: GOLD}}>hay đang đoán?</span></Scene></Sequence>
    <Sequence name="04 · Ghi một dòng" from={28 * fps} durationInFrames={Math.round(12.45 * fps)}><Scene index={3} image="04-clear" label="CHUYỆN CHƯA GẤP">Viết xuống.<br /><span style={{color: GOLD}}>Rồi gấp lại.</span></Scene></Sequence>
    <Sequence name="05 · Ngủ đã" from={40 * fps} durationInFrames={8 * fps}><Scene index={4} image="05-sleep" label="KHÔNG THÊM MỘT ĐÊM TRẮNG">Đặt xuống thôi.<br /><span style={{color: GOLD}}>Ngủ đã.</span></Scene></Sequence>
    <Track name="Giọng Hải Đăng · Tốc độ gốc 1×">
      <Audio from={0} durationInFrames={8 * fps} src={staticFile('let-it-settle/audio/01-storm-voice-full.wav')} />
      <Audio from={8 * fps} durationInFrames={10 * fps} src={staticFile('let-it-settle/audio/02-stir-voice-full.wav')} />
      <Audio from={18 * fps} durationInFrames={10 * fps} src={staticFile('let-it-settle/audio/03-pause-voice-full.wav')} />
      <Audio from={28 * fps} durationInFrames={12 * fps} src={staticFile('let-it-settle/audio/04-clear-voice-full.wav')} />
      <Audio from={40 * fps} durationInFrames={8 * fps} src={staticFile('let-it-settle/audio/05-sleep-voice-full.wav')} />
    </Track>
    <Audio name="Snowfall · Øneheart và reidenshi" src={staticFile(music.file)} trimBefore={Math.round(music.sourceStartSeconds * fps)} playbackRate={music.playbackRate} durationInFrames={48 * fps} volume={settleMusicVolume(frame, fps)} />
    <AbsoluteFill style={{background: '#030609', pointerEvents: 'none', opacity: interpolate(frame, [47.2 * fps, 48 * fps - 1], [0, 1], clamp)}} />
  </AbsoluteFill>;
};
