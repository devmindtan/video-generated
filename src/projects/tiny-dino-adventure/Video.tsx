import type {Caption} from '@remotion/captions';
import {Audio, Video} from '@remotion/media';
import type {FC, ReactNode} from 'react';
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
import footageConfig from './footage.json';
import sfxConfig from './sfx.json';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const SCENE_STARTS = [0, 8, 18, 30, 42];
const SKY = '#eafaff';
const INK = '#183449';
const YELLOW = '#ffd64d';
const CORAL = '#ff755f';

type Clip = {src: string; sourceDurationSeconds: number; playbackRate: number; model: string};
const footage = footageConfig as Record<string, Clip | null>;
const SceneFootage: FC<{scene: string; children: ReactNode}> = ({scene, children}) => {
  const clip = footage[scene];
  if (!clip) return <>{children}</>;
  return <Video name={`Veo · ${scene}`} src={staticFile(clip.src)} muted playbackRate={clip.playbackRate} style={{width: '100%', height: '100%', objectFit: 'cover'}} />;
};

const Scene: FC<{readonly seconds: number; readonly children: ReactNode; readonly tint?: string}> = ({seconds, children, tint = 'rgba(19,86,77,.12)'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const last = seconds * fps - 1;
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#54b985', opacity: interpolate(frame, [0, .18 * fps, last - .15 * fps, last], [0, 1, 1, 0], clamp)}}>
      {children}
      <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(8,55,67,.06), transparent 34%, ${tint} 67%, rgba(7,35,43,.6) 100%)`}} />
    </AbsoluteFill>
  );
};

const Sparkles: FC<{readonly count?: number; readonly color?: string}> = ({count = 18, color = '#fff0a5'}) => {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({length: count}, (_, i) => {
        const drift = (frame * (.45 + random(`dino-speed-${i}`) * .45) + random(`dino-start-${i}`) * 700) % 760;
        return <div key={i} style={{position: 'absolute', left: 70 + random(`dino-x-${i}`) * 940, top: 280 + drift, width: 5 + random(`dino-s-${i}`) * 9, height: 5 + random(`dino-s-${i}`) * 9, borderRadius: '50%', background: color, boxShadow: `0 0 15px ${color}`, opacity: .18 + .62 * Math.sin(frame / 13 + i) ** 2}} />;
      })}
    </>
  );
};

const TitleCard: FC<{readonly kicker: string; readonly title: string; readonly accent?: string}> = ({kicker, title, accent = YELLOW}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{position: 'absolute', zIndex: 2, top: 118, left: 64, right: 64, textAlign: 'center', color: SKY, opacity: interpolate(frame, [0, .28 * fps], [0, 1], clamp), translate: `0 ${interpolate(frame, [0, .4 * fps], [-24, 0], {...clamp, easing: Easing.out(Easing.cubic)})}px`, textShadow: '0 4px 18px rgba(5,43,55,.7)'}}>
      <div style={{display: 'inline-block', padding: '10px 24px', borderRadius: 999, background: 'rgba(14,77,83,.72)', border: '2px solid rgba(255,255,255,.54)', fontSize: 23, fontWeight: 700, letterSpacing: 2.2}}>{kicker}</div>
      <div style={{marginTop: 16, fontSize: 66, lineHeight: 1.04, fontWeight: 700, color: accent, WebkitTextStroke: '2px rgba(18,67,71,.44)'}}>{title}</div>
    </div>
  );
};

const Captions: FC<{readonly index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const now = frame / fps * 1000;
  const group = (captionsData as Caption[][])[index] ?? [];
  const caption = group.find((item) => now >= item.startMs && now < item.endMs);
  if (!caption) return null;
  const emphasis = /Tí Hon|dũng cảm|bướm phát sáng|tìm thấy nhau|đi lạc|điều kỳ diệu|phiêu lưu/gi;
  const parts = caption.text.split(emphasis);
  const matches = caption.text.match(emphasis) ?? [];
  return (
    <div style={{position: 'absolute', zIndex: 2, left: 58, right: 58, bottom: 112, padding: '22px 30px 25px', borderRadius: 34, background: 'rgba(11,52,61,.82)', border: '2px solid rgba(255,255,255,.4)', boxShadow: '0 12px 34px rgba(0,0,0,.25)', color: '#fff', textAlign: 'center', fontSize: 43, fontWeight: 700, lineHeight: 1.34, opacity: interpolate(now - caption.startMs, [0, 100], [.08, 1], clamp)}}>
      {parts.map((part, i) => <span key={`${part}-${i}`}>{part}{matches[i] ? <span style={{color: YELLOW}}>{matches[i]}</span> : null}</span>)}
    </div>
  );
};

const HatchScene: FC = () => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig();
  return <Scene seconds={8} tint="rgba(45,122,91,.15)">
    <SceneFootage scene="01-hatch">
    <CanvasImage src={staticFile('tiny-dino-adventure/images/01-hatch.png')} style={{width: '100%', height: '100%', objectFit: 'cover', scale: interpolate(frame, [0, 8 * fps], [1.035, 1.13], {...clamp, easing: Easing.inOut(Easing.cubic), output: 'perceptual-scale'}), transformOrigin: '52% 58%'}} />
    </SceneFootage>
    <Sparkles count={24} />
    <TitleCard kicker="MỘT NGƯỜI BẠN MỚI" title="Chào mừng bé Tí Hon!" />
    <Captions index={0} />
  </Scene>;
};

const LogScene: FC = () => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig();
  const wobble = Math.sin(frame / 6) * interpolate(frame, [0, 4 * fps, 7 * fps], [0, 1.4, .2], clamp);
  return <Scene seconds={10} tint="rgba(10,86,91,.1)">
    <SceneFootage scene="02-log">
    <CanvasImage src={staticFile('tiny-dino-adventure/images/02-log.png')} style={{width: '100%', height: '100%', objectFit: 'cover', scale: 1.095, translate: `${interpolate(frame, [0, 10 * fps], [-16, 14], clamp)}px ${interpolate(frame, [0, 10 * fps], [22, -20], clamp)}px`, rotate: `${wobble}deg`, transformOrigin: '52% 61%'}} />
    </SceneFootage>
    <TitleCard kicker="BƯỚC ĐẦU TIÊN" title="Cẩn thận từng bước nhé!" accent="#fff3a0" />
    <Captions index={1} />
  </Scene>;
};

const ButterflyScene: FC = () => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig();
  return <Scene seconds={12} tint="rgba(65,58,145,.13)">
    <SceneFootage scene="03-butterfly">
    <CanvasImage src={staticFile('tiny-dino-adventure/images/03-butterfly.png')} style={{width: '100%', height: '100%', objectFit: 'cover', scale: interpolate(frame, [0, 12 * fps], [1.09, 1.16], {...clamp, output: 'perceptual-scale'}), translate: `${interpolate(frame, [0, 12 * fps], [12, -14], clamp)}px 0px`, transformOrigin: '53% 51%'}} />
    </SceneFootage>
    <div style={{position: 'absolute', left: 570, top: 420, width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, rgba(87,220,255,.38), rgba(136,83,255,.12) 42%, transparent 70%)', filter: 'blur(7px)', scale: 1 + Math.sin(frame / 8) * .06}} />
    <Sparkles count={28} color="#9eeaff" />
    <TitleCard kicker="ÁNH SÁNG GIỮA RỪNG" title="Bạn mới xuất hiện!" accent="#a9f2ff" />
    <Captions index={2} />
  </Scene>;
};

const SlideScene: FC = () => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig();
  return <Scene seconds={12} tint="rgba(115,47,83,.09)">
    <SceneFootage scene="04-slide">
    <CanvasImage src={staticFile('tiny-dino-adventure/images/04-slide.png')} style={{width: '100%', height: '100%', objectFit: 'cover', scale: interpolate(frame, [0, 1.2 * fps, 12 * fps], [1.2, 1.07, 1.14], {...clamp, easing: Easing.out(Easing.cubic), output: 'perceptual-scale'}), translate: `${interpolate(frame, [0, 1.4 * fps, 12 * fps], [-38, 12, -12], clamp)}px ${interpolate(frame, [0, 1.4 * fps, 12 * fps], [-64, 28, -16], clamp)}px`, transformOrigin: '52% 57%'}} />
    </SceneFootage>
    {Array.from({length: 15}, (_, i) => <div key={i} style={{position: 'absolute', left: ((random(`petal-x-${i}`) * 1180 + frame * (2.1 + i % 3)) % 1220) - 70, top: 430 + ((random(`petal-y-${i}`) * 760 + frame * (1.2 + i % 4 * .2)) % 900), width: 18 + i % 4 * 5, height: 10 + i % 3 * 4, borderRadius: '80% 15% 80% 15%', background: i % 3 === 0 ? CORAL : i % 3 === 1 ? YELLOW : '#ed7cff', rotate: `${frame * (1 + i % 3) + i * 27}deg`, opacity: .58}} />)}
    <TitleCard kicker="DŨNG CẢM BƯỚC TIẾP" title="Vui quá đi thôi!" />
    <Captions index={3} />
  </Scene>;
};

const GoodbyeScene: FC = () => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig();
  return <Scene seconds={6} tint="rgba(116,57,28,.16)">
    <SceneFootage scene="05-goodbye">
    <CanvasImage src={staticFile('tiny-dino-adventure/images/05-goodbye.png')} style={{width: '100%', height: '100%', objectFit: 'cover', scale: interpolate(frame, [0, 6 * fps], [1.07, 1.13], {...clamp, output: 'perceptual-scale'}), transformOrigin: '50% 57%'}} />
    </SceneFootage>
    <Sparkles count={18} color="#ffeaa0" />
    <TitleCard kicker="CHUYẾN ĐI CÒN TIẾP…" title="Khám phá trọn hành trình!" />
    <Captions index={4} />
    <div style={{position: 'absolute', zIndex: 2, left: 170, right: 170, bottom: 48, textAlign: 'center', padding: '10px 18px', borderRadius: 999, background: CORAL, color: '#fff', fontSize: 24, fontWeight: 700, letterSpacing: 1.4, opacity: interpolate(frame, [3.7 * fps, 4.2 * fps], [0, 1], clamp)}}>XEM TẬP ĐẦY ĐỦ TRÊN KÊNH</div>
  </Scene>;
};

export const tinyDinoMusicVolume = (frame: number, fps: number): number => {
  const seconds = frame / fps;
  const activity = Math.max(0, ...(captionsData as Caption[][]).flatMap((group, index) => group.map((caption) => interpolate(seconds, [SCENE_STARTS[index] + caption.startMs / 1000 - .1, SCENE_STARTS[index] + caption.startMs / 1000 + .08, SCENE_STARTS[index] + caption.endMs / 1000 - .08, SCENE_STARTS[index] + caption.endMs / 1000 + .18], [0, 1, 1, 0], clamp))));
  const base = musicConfig.pauseVolume - (musicConfig.pauseVolume - musicConfig.speechVolume) * activity;
  const fadeIn = interpolate(seconds, [0, musicConfig.fadeInSeconds], [0, 1], clamp);
  const fadeOut = interpolate(seconds, [musicConfig.videoEndSeconds - musicConfig.fadeOutSeconds, musicConfig.videoEndSeconds - 1 / fps], [1, 0], clamp);
  return base * Math.min(fadeIn, fadeOut);
};

export const TinyDinoAdventureVideo: FC<{voiceVariant?: 'original' | 'childlike'}> = ({voiceVariant = 'childlike'}) => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig();
  const voiceRoot = voiceVariant === 'childlike' ? 'tiny-dino-adventure/audio/childlike-preview' : 'tiny-dino-adventure/audio';
  return <AbsoluteFill style={{background: '#174f4e', color: SKY, fontFamily: 'Stoic Sans, sans-serif'}}>
    <Track name="Năm cảnh · Chuyến phiêu lưu của Tí Hon · 48 giây">
      <Sequence name="Tí Hon chào đời" from={0} durationInFrames={8 * fps}><HatchScene /></Sequence>
      <Sequence name="Những bước đầu tiên" from={8 * fps} durationInFrames={10 * fps}><LogScene /></Sequence>
      <Sequence name="Gặp người bạn mới" from={18 * fps} durationInFrames={12 * fps}><ButterflyScene /></Sequence>
      <Sequence name="Dũng cảm bước tiếp" from={30 * fps} durationInFrames={12 * fps}><SlideScene /></Sequence>
      <Sequence name="Lời mời xem tập đầy đủ" from={42 * fps} durationInFrames={6 * fps}><GoodbyeScene /></Sequence>
    </Track>
    <Track name="Lời kể · Giọng B mặc định / Bản A gốc">
      <Audio from={0} durationInFrames={8 * fps} src={staticFile(`${voiceRoot}/01-hatch-voice-full.wav`)} />
      <Audio from={8 * fps} durationInFrames={10 * fps} src={staticFile(`${voiceRoot}/02-log-voice-full.wav`)} />
      <Audio from={18 * fps} durationInFrames={12 * fps} src={staticFile(`${voiceRoot}/03-butterfly-voice-full.wav`)} />
      <Audio from={30 * fps} durationInFrames={12 * fps} src={staticFile(`${voiceRoot}/04-slide-voice-full.wav`)} />
      <Audio from={42 * fps} durationInFrames={6 * fps} src={staticFile(`${voiceRoot}/05-goodbye-voice-full.wav`)} />
    </Track>
    <Audio name="SFX Veo · Khớp chuyển động · Hạ dưới lời kể" src={staticFile(sfxConfig.file)} durationInFrames={48 * fps} volume={sfxConfig.volume} />
    <Audio name="Nhạc gốc · Marimba và xylophone vui nhộn" src={staticFile(musicConfig.file)} durationInFrames={48 * fps} volume={tinyDinoMusicVolume(frame, fps)} />
  </AbsoluteFill>;
};
