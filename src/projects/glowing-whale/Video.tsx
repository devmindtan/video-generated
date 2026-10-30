import type {Caption} from '@remotion/captions';
import {Audio, Video} from '@remotion/media';
import type {FC} from 'react';
import {AbsoluteFill, CanvasImage, Sequence, Track, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '../../shared/stoic-fonts';
import scenes from './scenes.json';
import captionsData from './captions.json';
import footageData from './footage.json';
import music from './music.json';
import sfx from './sfx.json';
import takesData from './takes.json';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
type Clip = {src: string; sourceDurationSeconds: number; playbackRate: number; model: string};
const footage = footageData as Record<string, Clip | null>;
const captions = captionsData as Caption[][];
const takes = takesData as Record<string, string>;

const WhaleScene: FC<{index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const scene = scenes[index];
  const take = takes[scene.id] ?? scene.id;
  const clip = footage[take];
  // Captions follow the authored narration clock, not muted native Veo audio.
  const now = frame / fps * 1000;
  const page = captions[index]?.find((c) => now >= c.startMs && now < c.endMs);
  return <AbsoluteFill style={{background: '#062e4a', overflow: 'hidden', opacity: index === 0 ? 1 : interpolate(frame, [0, .3 * fps], [0, 1], clamp)}}>
    {clip
      ? <Video name={`Veo · ${scene.id}`} src={staticFile(clip.src)} muted playbackRate={clip.playbackRate} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      : <CanvasImage src={staticFile(`glowing-whale/images/${take}.png`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />}
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,25,53,.68), transparent 31%, transparent 65%, rgba(3,25,53,.7))'}} />
    <div style={{position: 'absolute', top: 145, left: 90, right: 120, textAlign: 'center', color: '#fff', textShadow: '0 5px 20px #032640', opacity: interpolate(frame, [0, .28 * fps, 3.4 * fps, 4 * fps], [0, 1, 1, 0], clamp)}}>
      <div style={{fontSize: 24, fontWeight: 700, letterSpacing: 2.5, color: '#baf4ff', marginBottom: 16}}>{scene.kicker}</div>
      <div style={{fontSize: 84, lineHeight: 1.08, fontWeight: 700, letterSpacing: -2, color: '#ffe882'}}>{scene.title}</div>
    </div>
    {page ? <div style={{position: 'absolute', left: 85, right: 125, bottom: 255, padding: '20px 27px', borderRadius: 30, background: 'rgba(3,35,57,.84)', border: '2px solid rgba(167,235,255,.55)', textAlign: 'center', fontSize: 46, lineHeight: 1.28, fontWeight: 700, color: '#fff', textShadow: '0 2px 4px #03273e'}}>{page.text}</div> : null}
    {index === 6 ? <div style={{position: 'absolute', left: 150, right: 190, bottom: 175, borderRadius: 999, padding: '13px 20px', background: '#ffe37a', color: '#063c58', textAlign: 'center', fontSize: 28, fontWeight: 700, opacity: interpolate(frame, [2.5 * fps, 3 * fps], [0, 1], clamp)}}>CÙNG KHÁM PHÁ ĐẠI DƯƠNG</div> : null}
  </AbsoluteFill>;
};

export const whaleMusicVolume = (frame: number, fps: number): number => {
  const t = frame / fps;
  const activity = Math.max(0, ...captions.flatMap((group, index) => group.map((page) => interpolate(t, [scenes[index].start + page.startMs / 1000 - .1, scenes[index].start + page.startMs / 1000 + .06, scenes[index].start + page.endMs / 1000 - .04, scenes[index].start + page.endMs / 1000 + .16], [0, 1, 1, 0], clamp))));
  return (music.pauseVolume - (music.pauseVolume - music.speechVolume) * activity)
    * Math.min(interpolate(t, [0, music.fadeInSeconds], [0, 1], clamp), interpolate(t, [60 - music.fadeOutSeconds, 60 - 1 / fps], [1, 0], clamp));
};

export const GlowingWhaleVideo: FC<{voiceVariant?: 'childlike' | 'original'}> = ({voiceVariant = 'childlike'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const root = voiceVariant === 'childlike' ? 'glowing-whale/audio/childlike' : 'glowing-whale/audio';
  return <AbsoluteFill style={{background: '#062e4a', fontFamily: 'Stoic Sans, sans-serif'}}>
    {/* Incoming scene fades over the outgoing .3s handle; no fade through black. */}
    <Sequence name="01 · Chiếc bụng khác biệt" from={0} durationInFrames={Math.round(8.3 * fps)}><WhaleScene index={0} /></Sequence>
    <Sequence name="02 · Lời an ủi của Cụ Rùa" from={8 * fps} durationInFrames={Math.round(9.3 * fps)}><WhaleScene index={1} /></Sequence>
    <Sequence name="03 · Đàn cá bị lạc" from={17 * fps} durationInFrames={Math.round(9.3 * fps)}><WhaleScene index={2} /></Sequence>
    <Sequence name="04 · Quyết định dũng cảm" from={26 * fps} durationInFrames={Math.round(9.3 * fps)}><WhaleScene index={3} /></Sequence>
    <Sequence name="05 · Ngọn đèn dẫn đường" from={35 * fps} durationInFrames={Math.round(9.3 * fps)}><WhaleScene index={4} /></Sequence>
    <Sequence name="06 · Niềm vui đoàn tụ" from={44 * fps} durationInFrames={Math.round(9.3 * fps)}><WhaleScene index={5} /></Sequence>
    <Sequence name="07 · Tự tin tỏa sáng" from={53 * fps} durationInFrames={7 * fps}><WhaleScene index={6} /></Sequence>
    <Track name="Lời kể · Giọng B mặc định · giữ bản gốc A">
      <Audio from={0} durationInFrames={8 * fps} src={staticFile(`${root}/01-shy-voice-full.wav`)} />
      <Audio from={8 * fps} durationInFrames={9 * fps} src={staticFile(`${root}/02-turtle-voice-full.wav`)} />
      <Audio from={17 * fps} durationInFrames={9 * fps} src={staticFile(`${root}/03-lost-fish-voice-full.wav`)} />
      <Audio from={26 * fps} durationInFrames={9 * fps} src={staticFile(`${root}/04-brave-voice-full.wav`)} />
      <Audio from={35 * fps} durationInFrames={9 * fps} src={staticFile(`${root}/05-guide-voice-full.wav`)} />
      <Audio from={44 * fps} durationInFrames={9 * fps} src={staticFile(`${root}/06-reunion-voice-full.wav`)} />
      <Audio from={53 * fps} durationInFrames={7 * fps} src={staticFile(`${root}/07-shine-voice-full.wav`)} />
    </Track>
    <Audio name="Nhạc gốc · Celesta và đàn gảy dưới biển" src={staticFile(music.file)} durationInFrames={60 * fps} volume={whaleMusicVolume(frame, fps)} />
    <Audio name="SFX · Bọt nước, bơi, ánh sáng và nước bắn" src={staticFile(sfx.file)} durationInFrames={60 * fps} volume={sfx.volume} />
    <AbsoluteFill style={{pointerEvents: 'none', background: '#062e4a', opacity: interpolate(frame, [59.5 * fps, 60 * fps - 1], [0, 1], clamp)}} />
  </AbsoluteFill>;
};
