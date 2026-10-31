import type {FC} from 'react';
import type {Caption} from '@remotion/captions';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Easing, Sequence, Track, interpolate, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CalculateMetadataFunction} from 'remotion';
import '../../shared/stoic-fonts';
import {MusicFade} from '../../shared/MusicFade';
import music from './music.json';
import takes from './intro-takes.json';

// Series intro for "Đọc sách, hiểu mình": classic book-plate frame, paper grain and gold rules,
// with a modern voice visualizer whose bars follow the narration (bands precomputed per frame by
// scripts/projects/book-hvtt-001-overview/intro-bands.py). Voice is an audition take until the user picks one.

export type Voice = {id: string; name: string; file: string; durationSeconds: number; frames: number; captions: Caption[]; bands: number[][]; level: number[]};
export type BookIntroProps = {voice: string; channelLabel: string; episodeLabel: string; bookTitle: string; bookAuthor: string};

const voices = (takes as unknown as {voices: Voice[]}).voices;
const OUTRO_SECONDS = 3.2;
export const INK = '#0d1411';
export const GOLD = '#d9b56f';
export const IVORY = '#f2ede3';
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ease = Easing.bezier(.16, 1, .3, 1);
const emphasis = /(Đọc sách, hiểu mình|không có nhiều thời gian|dành cho bạn|niềm vui|hạnh phúc|bắt đầu)/gi;

const voiceOf = (id: string) => voices.find((v) => v.id === id) ?? voices[0];

// Caption-driven ducking: the score sits at pauseVolume between sentences and dips to speechVolume under speech.
// For the intro the user wants a steady bed (2026-10-30): both values are equal in music.json, so no dips.
const musicVolume = (captions: Caption[], frame: number, fps: number) => {
  const ms = frame * 1000 / fps;
  const activity = Math.max(0, ...captions.map((c) => interpolate(ms, [c.startMs - 120, c.startMs, c.endMs, c.endMs + 250], [0, 1, 1, 0], clamp)));
  const base = music.pauseVolume - (music.pauseVolume - music.speechVolume) * activity;
  // Louder opening, then a gradual glide down to a quieter bed (music.json lowerFrom/Over/ToVolume).
  const lowered = interpolate(frame, [music.lowerFromSeconds * fps, (music.lowerFromSeconds + music.lowerOverSeconds) * fps], [base, music.lowerToVolume], {...clamp, easing: Easing.inOut(Easing.sin)});
  return Math.min(base, lowered);
};

export const bookIntroMetadata: CalculateMetadataFunction<BookIntroProps> = ({props}) => {
  const voice = voiceOf(props.voice);
  return {durationInFrames: Math.ceil(((voice?.durationSeconds ?? 30) + OUTRO_SECONDS) * 30)};
};

// Film grain from one static noise tile, shifted every 3 frames. No per-frame SVG filter: Studio preview
// repainted feTurbulence only around moving text, which showed up as grey patches.
export const Grain: FC<{frame: number}> = ({frame}) => {
  const step = Math.floor(frame / 3);
  return <div style={{position: 'absolute', inset: 0, opacity: .06, backgroundImage: `url(${staticFile('book-hvtt-001-overview/images/film-grain.png')})`, backgroundSize: '512px 512px',
    backgroundPosition: `${Math.floor(random(`grain-x-${step}`) * 512)}px ${Math.floor(random(`grain-y-${step}`) * 512)}px`, pointerEvents: 'none'}} />;
};

export const Dust: FC<{frame: number}> = ({frame}) => <>{Array.from({length: 46}, (_, i) => {
  const x = random(`dust-x-${i}`) * 1920;
  const speed = 6 + random(`dust-s-${i}`) * 14;
  const y = 1080 - ((random(`dust-y-${i}`) * 1180 + frame * speed / 30) % 1180);
  const size = 1.5 + random(`dust-r-${i}`) * 3.2;
  return <div key={i} style={{position: 'absolute', left: x + Math.sin(frame / 40 + i) * 14, top: y, width: size, height: size, borderRadius: '50%', background: GOLD, opacity: .12 + random(`dust-o-${i}`) * .3, filter: 'blur(.6px)'}} />;
})}</>;

export const Frame: FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const draw = interpolate(frame, [.1 * fps, 1.8 * fps], [1, 0], {...clamp, easing: ease});
  const corner = interpolate(frame, [1.2 * fps, 2 * fps], [0, 1], {...clamp, easing: ease});
  const perimeter = 2 * (1920 - 112 + 1080 - 112);
  const Corner: FC<{x: number; y: number; r: number}> = ({x, y, r}) => <g transform={`translate(${x} ${y}) rotate(${r})`} opacity={corner}>
    <path d="M0 46 L0 0 L46 0" fill="none" stroke={GOLD} strokeWidth={2} />
    <path d="M14 46 Q14 14 46 14" fill="none" stroke={GOLD} strokeWidth={1} opacity={.8} />
    <rect x={-6} y={-6} width={12} height={12} transform="rotate(45)" fill={GOLD} />
  </g>;
  return <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
    <rect x={56} y={56} width={1808} height={968} fill="none" stroke={GOLD} strokeWidth={1.6} strokeDasharray={perimeter} strokeDashoffset={perimeter * draw} opacity={.85} />
    <rect x={70} y={70} width={1780} height={940} fill="none" stroke={GOLD} strokeWidth={.8} strokeDasharray={perimeter} strokeDashoffset={perimeter * draw} opacity={.45} />
    <Corner x={56} y={56} r={0} /><Corner x={1864} y={56} r={90} /><Corner x={1864} y={1024} r={180} /><Corner x={56} y={1024} r={270} />
  </svg>;
};

export const OpenBook: FC<{frame: number; fps: number; glow: number}> = ({frame, fps, glow}) => {
  const draw = interpolate(frame, [.5 * fps, 2.4 * fps], [1, 0], {...clamp, easing: ease});
  const page = 'M0 18 C-70 0 -150 2 -210 22 L-210 132 C-150 112 -70 110 0 128 Z';
  return <svg width={460} height={170} viewBox="-230 -10 460 170" style={{display: 'block', margin: '0 auto', filter: `drop-shadow(0 0 ${8 + glow * 18}px rgba(217,181,111,${.18 + glow * .35}))`}}>
    {[1, -1].map((side) => <g key={side} transform={`scale(${side} 1)`}>
      <path d={page} fill="none" stroke={GOLD} strokeWidth={2.2} pathLength={1} strokeDasharray={1} strokeDashoffset={draw} />
      {[0, 1, 2, 3].map((l) => <path key={l} d={`M-28 ${46 + l * 18} C-80 ${34 + l * 18} -140 ${35 + l * 18} -182 ${48 + l * 18}`} fill="none" stroke={GOLD} strokeWidth={1} opacity={.55} pathLength={1} strokeDasharray={1} strokeDashoffset={interpolate(frame, [(1.1 + l * .15) * fps, (2.2 + l * .15) * fps], [1, 0], {...clamp, easing: ease})} />)}
    </g>)}
    <path d="M0 18 L0 128" stroke={GOLD} strokeWidth={2} pathLength={1} strokeDasharray={1} strokeDashoffset={draw} />
  </svg>;
};

// Mirrored spectrum: lowest band in the centre, bars rise and fall with the speaking voice.
export const Visualizer: FC<{bands: number[]; level: number; appear: number}> = ({bands, level, appear}) => {
  const bars = [...[...bands].reverse(), ...bands];
  return <div style={{position: 'absolute', left: 360, right: 360, top: 700, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: appear}}>
    <div style={{position: 'absolute', left: '50%', top: '50%', width: 900, height: 170, translate: '-50% -50%', background: `radial-gradient(ellipse, rgba(217,181,111,${.06 + level * .16}), transparent 70%)`}} />
    <div style={{position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: `linear-gradient(90deg, transparent, ${GOLD}66, transparent)`}} />
    {bars.map((v, i) => {
      const edge = 1 - Math.abs(i - (bars.length - 1) / 2) / (bars.length / 2);
      const h = 4 + (v / 100) * 132 * (.45 + edge * .55);
      return <div key={i} style={{width: 8, height: h, borderRadius: 4, background: `linear-gradient(180deg, ${IVORY}, ${GOLD} 35%, ${GOLD} 65%, ${IVORY})`, opacity: .35 + (v / 100) * .65}} />;
    })}
  </div>;
};

export const Captions: FC<{captions: Caption[]; ms: number; highlight?: RegExp}> = ({captions, ms, highlight = emphasis}) => {
  const page = captions.find((c) => ms >= c.startMs && ms < c.endMs + 250);
  if (!page) return null;
  const fade = interpolate(ms, [page.startMs - 60, page.startMs + 140], [0, 1], clamp);
  const parts = page.text.split(highlight);
  return <div data-testid="book-intro-caption" style={{position: 'absolute', left: 260, right: 260, top: 880, minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: IVORY, fontSize: 44, fontWeight: 700, lineHeight: 1.4, textShadow: '0 3px 14px #000', opacity: fade, translate: `0 ${(1 - fade) * 8}px`}}>
    <div>{parts.map((p, i) => <span key={i} style={{color: i % 2 === 1 ? GOLD : undefined}}>{p}</span>)}</div>
  </div>;
};

export const BookInsightsIntro: FC<BookIntroProps> = ({voice: voiceId, channelLabel, episodeLabel, bookTitle, bookAuthor}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const voice = voiceOf(voiceId);
  const speechEnd = voice ? voice.frames : durationInFrames - OUTRO_SECONDS * fps;
  const i = Math.min(frame, (voice?.frames ?? 1) - 1);
  const bands = voice && frame < voice.frames ? voice.bands[i] : new Array(32).fill(0);
  const level = voice && frame < voice.frames ? voice.level[i] / 100 : 0;
  const ms = frame * 1000 / fps;
  const titleIn = interpolate(frame, [1.1 * fps, 2.6 * fps], [0, 1], {...clamp, easing: ease});
  const toOutro = interpolate(frame, [speechEnd - .2 * fps, speechEnd + .6 * fps], [1, 0], {...clamp, easing: ease});
  const outro = interpolate(frame, [speechEnd + .3 * fps, speechEnd + 1.2 * fps], [0, 1], {...clamp, easing: ease});
  const fadeOut = interpolate(frame, [durationInFrames - .7 * fps, durationInFrames], [1, 0], clamp);
  return <AbsoluteFill style={{background: INK, fontFamily: 'Stoic Sans, sans-serif', overflow: 'hidden'}}>
    <AbsoluteFill style={{opacity: fadeOut}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 60% at 50% 42%, #22302a 0%, ${INK} 62%, #070b09 100%)`}} />
      <AbsoluteFill style={{background: 'linear-gradient(115deg, transparent 30%, rgba(217,181,111,.07) 48%, transparent 62%)', translate: `${interpolate(frame, [0, durationInFrames], [-700, 700])}px 0`}} />
      <Dust frame={frame} />
      <Grain frame={frame} />
      <Frame frame={frame} fps={fps} />
      <div style={{position: 'absolute', top: 104, left: 0, right: 0, textAlign: 'center', color: GOLD, fontSize: 22, fontWeight: 700, letterSpacing: 8, opacity: interpolate(frame, [.8 * fps, 1.8 * fps], [0, 1], clamp)}}>{channelLabel}</div>
      <div style={{position: 'absolute', top: 170, left: 0, right: 0, opacity: toOutro}}>
        <OpenBook frame={frame} fps={fps} glow={level} />
        <div style={{marginTop: 26, textAlign: 'center', color: IVORY, fontSize: 104, fontWeight: 700, letterSpacing: interpolate(titleIn, [0, 1], [26, 8]), opacity: titleIn, clipPath: `inset(0 ${(1 - titleIn) * 50}% 0 ${(1 - titleIn) * 50}%)`, textShadow: '0 6px 30px rgba(0,0,0,.6)'}}>ĐỌC SÁCH, HIỂU MÌNH</div>
        <div style={{margin: '22px auto 0', width: 560, display: 'flex', alignItems: 'center', gap: 18, opacity: titleIn}}>
          <div style={{flex: 1, height: 1.5, background: `linear-gradient(90deg, transparent, ${GOLD})`, scale: `${interpolate(frame, [1.8 * fps, 2.8 * fps], [0, 1], {...clamp, easing: ease})} 1`, transformOrigin: 'right'}} />
          <div style={{width: 12, height: 12, rotate: '45deg', background: GOLD}} />
          <div style={{flex: 1, height: 1.5, background: `linear-gradient(90deg, ${GOLD}, transparent)`, scale: `${interpolate(frame, [1.8 * fps, 2.8 * fps], [0, 1], {...clamp, easing: ease})} 1`, transformOrigin: 'left'}} />
        </div>
        <div style={{marginTop: 22, textAlign: 'center', color: IVORY, fontSize: 30, fontWeight: 400, letterSpacing: 3, opacity: interpolate(frame, [2.4 * fps, 3.2 * fps], [0, .78], clamp)}}>Đọc trọn một cuốn sách · Giữ lại điều đáng giữ</div>
      </div>
      <div style={{opacity: toOutro}}>
        <Visualizer bands={bands} level={level} appear={interpolate(frame, [.6 * fps, 1.4 * fps], [0, 1], clamp)} />
        {voice ? <Captions captions={voice.captions} ms={ms} /> : null}
      </div>
      <Sequence name="Thẻ sách của tập" from={Math.round(speechEnd)} layout="none">
        <div style={{position: 'absolute', top: 330, left: 0, right: 0, textAlign: 'center', opacity: outro, translate: `0 ${(1 - outro) * 18}px`}}>
          <div style={{color: GOLD, fontSize: 26, fontWeight: 700, letterSpacing: 10}}>{episodeLabel}</div>
          <div style={{marginTop: 26, color: IVORY, fontSize: 112, fontWeight: 700, letterSpacing: 1}}>{bookTitle}</div>
          <div style={{margin: '26px auto', width: 120, height: 2, background: GOLD}} />
          <div style={{color: IVORY, fontSize: 38, fontWeight: 400, letterSpacing: 4, opacity: .85}}>{bookAuthor}</div>
        </div>
      </Sequence>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.55) 100%)', pointerEvents: 'none'}} />
    </AbsoluteFill>
    {voice ? <Track name={`Giọng · ${voice.name}`}>
      <Audio src={staticFile(voice.file)} from={0} />
    </Track> : null}
    <Track name="Nhạc intro · Pufino – Enlivening · chỉnh đầu/cuối trong Edit">
      <MusicFade fadeInSeconds={music.fadeInSeconds} fadeOutSeconds={music.fadeOutSeconds}>
        <Audio
          name="Pufino – Enlivening (freetouse.com)"
          src={staticFile(music.file)}
          from={0}
          durationInFrames={durationInFrames}
          volume={musicVolume(voice?.captions ?? [], frame, fps)}
          playbackRate={0.85}
        />
      </MusicFade>
    </Track>
  </AbsoluteFill>;
};
