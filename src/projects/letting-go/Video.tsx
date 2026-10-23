import React from 'react';
import {Audio} from '@remotion/media';
import type {Caption} from '@remotion/captions';
import {
  AbsoluteFill,
  CanvasImage,
  Easing,
  Sequence,
  Track,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import '../../shared/stoic-fonts';
import captionsData from './captions.json';
import musicConfig from './music.json';

const GOLD = '#ddb970';
const IVORY = '#f2eee5';
const BG = '#020407';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const SCENE_STARTS = [0, 8, 20, 32, 42];

const Fade: React.FC<{readonly seconds: number; readonly children: React.ReactNode}> = ({seconds, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const last = seconds * fps - 1;
  return <AbsoluteFill style={{overflow: 'hidden', background: BG, opacity: interpolate(frame, [0, .25 * fps, last - .22 * fps, last], [0, 1, 1, 0], clamp)}}>{children}</AbsoluteFill>;
};

const Grade: React.FC<{readonly warm?: boolean}> = ({warm = false}) => <>
  <AbsoluteFill style={{background: warm ? 'linear-gradient(180deg, rgba(2,4,7,.02), transparent 36%, rgba(2,4,7,.6) 67%, #020407 96%)' : 'linear-gradient(180deg, rgba(2,4,7,.12), transparent 32%, rgba(2,4,7,.7) 65%, #020407 96%)'}} />
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 31%, transparent 20%, rgba(0,0,0,.42) 100%)'}} />
</>;

const Heading: React.FC<{readonly eyebrow: string; readonly top?: number; readonly children: React.ReactNode}> = ({eyebrow, top = 1070, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <div style={{position: 'absolute', left: 82, right: 80, top, opacity: interpolate(frame, [.12 * fps, .8 * fps], [0, 1], clamp), translate: `0 ${interpolate(frame, [0, 1.05 * fps], [30, 0], {...clamp, easing: Easing.out(Easing.cubic)})}px`}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 17, marginBottom: 22, color: GOLD, fontSize: 23, letterSpacing: 4.4}}><span style={{width: 46, height: 2, background: GOLD}} />{eyebrow}</div>
    <div style={{fontSize: 82, fontWeight: 700, lineHeight: 1.13, letterSpacing: -3.2, textShadow: '0 7px 31px rgba(0,0,0,.92)'}}>{children}</div>
  </div>;
};

const Captions: React.FC<{readonly index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const now = frame / fps * 1000;
  const caption = (captionsData[index] as Caption[]).find((item) => now >= item.startMs && now < item.endMs);
  if (!caption) return null;
  const highlighted = /nắm chặt|kiệt sức|không nỡ buông|tổn thương|không còn phù hợp|níu giữ|dũng khí|sáng suốt|mở bàn tay|thế giới mới|quá khứ|bình yên|đáng giữ|cho qua|thả lỏng|tự do/gi;
  const parts = caption.text.split(highlighted);
  const matches = caption.text.match(highlighted) ?? [];
  return <div style={{position: 'absolute', left: 82, right: 80, top: 1510, minHeight: 155, color: IVORY, fontSize: 43, fontWeight: 700, lineHeight: 1.43, textShadow: '0 3px 16px #000', opacity: interpolate(now - caption.startMs, [0, 150], [.08, 1], clamp)}}>{parts.map((part, i) => <React.Fragment key={i}>{part}{matches[i] && <span style={{color: GOLD}}>{matches[i]}</span>}</React.Fragment>)}</div>;
};

const RainScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <Fade seconds={8}>
    <CanvasImage src={staticFile('letting-go/images/01-rain.png')} style={{width: '100%', height: '100%', objectFit: 'cover', scale: interpolate(frame, [0, 8 * fps - 1], [1.02, 1.1], {...clamp, output: 'perceptual-scale'}), transformOrigin: '52% 31%'}} />
    {Array.from({length: 44}, (_, i) => {
      const x = random(`letting-rain-x-${i}`) * 1180 - 50;
      const speed = 20 + random(`letting-rain-speed-${i}`) * 26;
      const y = (random(`letting-rain-y-${i}`) * 2160 + frame * speed) % 2160 - 150;
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: i % 5 === 0 ? 3 : 2, height: 48 + random(`letting-rain-h-${i}`) * 70, rotate: '7deg', opacity: .08 + random(`letting-rain-o-${i}`) * .2, background: 'linear-gradient(transparent, #dceafa, transparent)', filter: 'blur(.3px)'}} />;
    })}
    <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: .36}}><path d="M568 267 C563 337 555 388 544 445" fill="none" stroke="#dceafa" strokeWidth="4" strokeLinecap="round" strokeDasharray="18 14" strokeDashoffset={-frame * 1.7} /></svg>
    <Grade /><Heading eyebrow="CÁI GIÁ CỦA SỰ NÍU GIỮ" top={1050}>Bạn kiệt sức<br /><span style={{color: GOLD}}>vì chưa buông.</span></Heading><Captions index={0} />
  </Fade>;
};

const ChainsScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const release = interpolate(frame, [4.4 * fps, 8.3 * fps], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return <Fade seconds={12}>
    <CanvasImage src={staticFile('letting-go/images/02-chains-tight.png')} style={{width: '100%', height: '100%', objectFit: 'cover', scale: 1.035}} />
    <CanvasImage src={staticFile('letting-go/images/02-chains-loose.png')} style={{width: '100%', height: '100%', objectFit: 'cover', scale: 1.035, opacity: release, translate: `0 ${interpolate(release, [0, 1], [-14, 0])}px`}} />
    {Array.from({length: 22}, (_, i) => {
      const y = 1180 - ((frame * (.45 + i * .018) + random(`chain-ember-y-${i}`) * 930) % 1020);
      return <div key={i} style={{position: 'absolute', left: 150 + random(`chain-ember-x-${i}`) * 780 + Math.sin(frame / 34 + i) * 15, top: y, width: 3 + i % 3, height: 3 + i % 3, borderRadius: '50%', background: '#f4a94f', boxShadow: '0 0 11px #e48935', opacity: .12 + Math.sin(frame / 22 + i) ** 2 * .3}} />;
    })}
    <Grade /><Heading eyebrow="NỖI SỢ MẤT MÁT">Níu giữ không luôn<br /><span style={{color: GOLD}}>là mạnh mẽ.</span></Heading><Captions index={1} />
  </Fade>;
};

const FlameScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sway = Math.sin(frame * .19) * 5 + Math.sin(frame * .07) * 3;
  const glow = .2 + Math.sin(frame * .28) * .035;
  return <Fade seconds={12}>
    <CanvasImage src={staticFile('letting-go/images/03-flame.png')} style={{width: '100%', height: '100%', objectFit: 'cover', scale: interpolate(frame, [0, 12 * fps - 1], [1.02, 1.075], {...clamp, output: 'perceptual-scale'}), transformOrigin: '52% 31%'}} />
    <div style={{position: 'absolute', left: 350 + sway, top: 205, width: 390, height: 510, borderRadius: '50%', background: `radial-gradient(circle, rgba(255,174,58,${glow}), transparent 66%)`, filter: 'blur(18px)'}} />
    <div style={{position: 'absolute', left: 491 + sway * .5, top: 326, width: 100, height: 215, borderRadius: '55% 48% 55% 52%', background: 'linear-gradient(180deg, rgba(255,235,161,.15), rgba(255,155,31,.38), transparent)', filter: `blur(${2 + Math.sin(frame * .24)}px)`, rotate: `${sway * .22}deg`, scale: `${1 + Math.sin(frame * .31) * .04} ${1 + Math.sin(frame * .23) * .07}`, transformOrigin: '50% 100%'}} />
    <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: .18}}><path d={`M540 335 C${520 + sway} 265, ${585 - sway} 205, ${548 + sway} 120`} fill="none" stroke="#d5c1a2" strokeWidth="9" strokeLinecap="round" /></svg>
    <Grade /><Heading eyebrow="BẢN CHẤT CỦA TỰ DO">Mở bàn tay<br /><span style={{color: GOLD}}>để được tự do.</span></Heading><Captions index={2} />
  </Fade>;
};

const CloudsScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const scale = interpolate(frame, [0, 10 * fps - 1], [1.08, 1.025], {...clamp, output: 'perceptual-scale'});
  return <Fade seconds={10}>
    <CanvasImage src={staticFile('letting-go/images/04-clouds.png')} style={{width: '100%', height: '100%', objectFit: 'cover', scale, transformOrigin: '42% 25%'}} />
    <CanvasImage src={staticFile('letting-go/images/04-clouds.png')} style={{width: '100%', height: '100%', objectFit: 'cover', scale, transformOrigin: '39% 18%', clipPath: 'polygon(26% 13%, 47% 13%, 52% 39%, 24% 41%)', rotate: `${Math.sin(frame / 30) * .38}deg`, translate: `${Math.sin(frame / 38) * 3}px ${Math.cos(frame / 43) * 2}px`}} />
    {[0, 1, 2].map((i) => <div key={i} style={{position: 'absolute', left: -620 + i * 310 + frame * (.34 + i * .08), top: 570 + i * 122, width: 1540, height: 310, rotate: '-6deg', opacity: .06 - i * .008, background: 'radial-gradient(ellipse, #f3e6dd 0%, transparent 67%)', filter: 'blur(30px)'}} />)}
    <Grade warm /><Heading eyebrow="SỰ BÌNH THẢN" top={1060}>Biết điều gì<br /><span style={{color: GOLD}}>nên cho qua.</span></Heading><Captions index={3} />
  </Fade>;
};

const WaterScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const age = interpolate(frame, [.7 * fps, 5.7 * fps], [0, 1], clamp);
  return <Fade seconds={6}>
    <CanvasImage src={staticFile('letting-go/images/05-water.png')} style={{width: '100%', height: '100%', objectFit: 'cover', scale: 1.025}} />
    <div style={{position: 'absolute', left: 350, top: 730, width: 380, height: 105, borderRadius: '50%', border: '2px solid rgba(215,225,234,.72)', scale: interpolate(age, [0, 1], [.18, 2.15]), opacity: interpolate(age, [0, .18, 1], [0, .5, 0], clamp), filter: 'blur(.5px)'}} />
    <Grade /><Heading eyebrow="TRẢ LẠI TỰ DO" top={1060}>Thả lỏng<br /><span style={{color: GOLD}}>đôi vai.</span></Heading><Captions index={4} />
  </Fade>;
};

export const lettingGoMusicVolume = (frame: number, fps: number): number => {
  const seconds = frame / fps;
  const activity = Math.max(0, ...captionsData.flatMap((group, sceneIndex) => group.map((caption) => {
    const start = SCENE_STARTS[sceneIndex] + caption.startMs / 1000;
    const end = SCENE_STARTS[sceneIndex] + caption.endMs / 1000;
    return interpolate(seconds, [start - .15, start + .12, end - .12, end + .25], [0, 1, 1, 0], clamp);
  })));
  const base = musicConfig.pauseVolume - (musicConfig.pauseVolume - musicConfig.speechVolume) * activity;
  const fadeIn = interpolate(seconds, [0, musicConfig.fadeInSeconds], [0, 1], clamp);
  const lifted = interpolate(seconds, [musicConfig.finalLiftStartSeconds, musicConfig.finalLiftPeakSeconds], [base, musicConfig.finalLiftVolume], clamp);
  const fadeOut = interpolate(seconds, [musicConfig.videoEndSeconds - musicConfig.fadeOutSeconds, musicConfig.videoEndSeconds - 1 / fps], [1, 0], clamp);
  return lifted * Math.min(fadeIn, fadeOut);
};

export const LettingGoVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: BG, color: IVORY, fontFamily: 'Stoic Sans, sans-serif'}}>
    <Track name="Năm cảnh · Học cách buông tay · 48 giây">
      <Sequence name="Chiếc bẫy níu giữ" from={0} durationInFrames={8 * fps}><RainScene /></Sequence>
      <Sequence name="Nỗi sợ mất mát" from={8 * fps} durationInFrames={12 * fps}><ChainsScene /></Sequence>
      <Sequence name="Bản chất tự do" from={20 * fps} durationInFrames={12 * fps}><FlameScene /></Sequence>
      <Sequence name="Tâm thế bình thản" from={32 * fps} durationInFrames={10 * fps}><CloudsScene /></Sequence>
      <Sequence name="Trả tự do cho tâm trí" from={42 * fps} durationInFrames={6 * fps}><WaterScene /></Sequence>
    </Track>
    <Track name="Lời đọc · Nam trầm ấm · Thiện Minh">
      <Audio from={0} durationInFrames={8 * fps} src={staticFile('letting-go/audio/01-rain-voice-full.wav')} />
      <Audio from={8 * fps} durationInFrames={12 * fps} src={staticFile('letting-go/audio/02-chains-voice-full.wav')} />
      <Audio from={20 * fps} durationInFrames={12 * fps} src={staticFile('letting-go/audio/03-flame-voice-full.wav')} />
      <Audio from={32 * fps} durationInFrames={10 * fps} src={staticFile('letting-go/audio/04-clouds-voice-full.wav')} />
      <Audio from={42 * fps} durationInFrames={6 * fps} src={staticFile('letting-go/audio/05-water-voice-full.wav')} />
    </Track>
    <Audio name="Past Lives · Slow & Reverb · Liền mạch" src={staticFile(musicConfig.file)} trimBefore={musicConfig.sourceStartSeconds * fps} durationInFrames={48 * fps} volume={lettingGoMusicVolume(frame, fps)} />
  </AbsoluteFill>;
};
