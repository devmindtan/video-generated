import type {FC, ReactNode} from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Track, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CalculateMetadataFunction} from 'remotion';
import '../../shared/stoic-fonts';
import {Backdrop, Captions, GOLD, INK, IVORY, clamp, ease} from './Intro';
import type {Voice} from './Intro';
import takes from './body-takes.json';

// Shared frame for the narrated body sections (option B: gold line drawings in code, no photos, no faces).
// A section is a list of beats; each beat starts at a sentence of the narration (phrase ranges of the voice),
// shows one drawing, an optional item label ("CƠN GIẬN") or a group title card, and crossfades to the next.
export type Take = Voice & {phraseRanges?: {startSeconds: number; endSeconds: number}[]};
export type Ctx = {frame: number; start: number; at: (sentence: number) => number; level: number};
export type Beat = {at: number; label?: string; card?: {kicker: string; title: string}; quote?: boolean; draw?: (c: Ctx) => ReactNode};

const voices = (takes as unknown as {voices: Take[]}).voices;
export const takeOf = (id: string) => voices.find((v) => v.id === id);
const TAIL_SECONDS = .8;
export const sectionFrames = (voice: string, fps = 30) => Math.ceil(((takeOf(voice)?.durationSeconds ?? 5) + TAIL_SECONDS) * fps);
export const sectionMetadata: CalculateMetadataFunction<{voice: string; channelLabel: string}> = ({props}) => ({durationInFrames: sectionFrames(props.voice)});

// Stroke that draws itself between two frames. Line style for every drawing: width ≥ 2 and opacity ≥ .7 so lines
// stay crisp at 1080p, a small glow only (a wide drop-shadow blurs thin lines), width unaffected by scale().
export const Draw: FC<{d: string; from: number; to: number; frame: number; width?: number; opacity?: number; color?: string}> = ({d, from, to, frame, width = 2.4, opacity = 1, color = GOLD}) =>
  <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" opacity={opacity} pathLength={1} strokeDasharray={1} vectorEffect="non-scaling-stroke"
    strokeDashoffset={interpolate(frame, [from, to], [1, 0], {...clamp, easing: ease})} />;
export const Glow: FC<{x: number; y: number; r: number; opacity: number}> = ({x, y, r, opacity}) =>
  <circle cx={x} cy={y} r={r} fill="url(#kit-glow)" opacity={opacity} />;
// Large gold outline text drawn as part of the illustration (Stoic Sans 700).
export const Word: FC<{x: number; y: number; size: number; text: string; opacity: number; anchor?: 'start' | 'middle' | 'end'}> = ({x, y, size, text, opacity, anchor = 'middle'}) =>
  <text x={x} y={y} fontSize={size} fontWeight={700} textAnchor={anchor} fill={IVORY} opacity={opacity} style={{letterSpacing: size * .06}}>{text}</text>;
export const appear = (frame: number, from: number, len = 12) => interpolate(frame, [from, from + len], [0, 1], {...clamp, easing: ease});

export const NarratedSection: FC<{voice: string; channelLabel: string; beats: Beat[]; highlight?: RegExp; track: string}> = ({voice: voiceId, channelLabel, beats, highlight, track}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const voice = takeOf(voiceId);
  const ranges = voice?.phraseRanges ?? [];
  const at = (i: number) => Math.round((ranges[Math.min(i, ranges.length - 1)]?.startSeconds ?? i * 3) * fps);
  const level = voice && frame < voice.frames ? voice.level[Math.min(frame, voice.frames - 1)] / 100 : 0;
  const starts = beats.map((b, i) => (i === 0 ? 0 : at(b.at) - 6));
  const opacityOf = (i: number) => interpolate(frame, [starts[i] - 8, starts[i] + 8, (starts[i + 1] ?? 1e9) - 8, (starts[i + 1] ?? 1e9) + 8], [i === 0 ? 1 : 0, 1, 1, 0], clamp);
  const current = starts.reduce((n, s, i) => (frame >= s ? i : n), 0);
  // Item label of the current beat, or of the last beat before it that set one.
  const label = [...beats.slice(0, current + 1)].reverse().find((b) => b.label !== undefined)?.label;
  const fadeOut = interpolate(frame, [durationInFrames - .6 * fps, durationInFrames], [1, 0], clamp);
  return <AbsoluteFill style={{background: INK, fontFamily: 'Stoic Sans, sans-serif', overflow: 'hidden'}}>
    <AbsoluteFill style={{opacity: fadeOut}}>
      <Backdrop frame={frame} fps={fps} durationInFrames={durationInFrames} drawFrame={false} />
      <div style={{position: 'absolute', top: 104, left: 0, right: 0, textAlign: 'center', color: GOLD, fontSize: 22, fontWeight: 700, letterSpacing: 8}}>{channelLabel}</div>
      {label ? <div style={{position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center', color: IVORY, fontSize: 30, fontWeight: 700, letterSpacing: 6, opacity: .9}}>{label.toUpperCase()}</div> : null}
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute', inset: 0, filter: `drop-shadow(0 0 ${2 + level * 4}px rgba(217,181,111,${.14 + level * .2}))`}}>
        <defs><radialGradient id="kit-glow"><stop offset="0%" stopColor="#e8c27a" stopOpacity={.35} /><stop offset="100%" stopColor="#e8c27a" stopOpacity={0} /></radialGradient></defs>
        {beats.map((b, i) => {
          const o = opacityOf(i);
          return o > .001 && b.draw ? <g key={i} opacity={o}>{b.draw({frame, start: starts[i], at, level})}</g> : null;
        })}
      </svg>
      {beats.map((b, i) => {
        const o = opacityOf(i);
        return o > .001 && b.card ? <div key={i} style={{position: 'absolute', top: 330, left: 0, right: 0, textAlign: 'center', opacity: o * appear(frame, starts[i], 18), translate: `0 ${(1 - appear(frame, starts[i], 18)) * 16}px`}}>
          <div style={{color: GOLD, fontSize: 28, fontWeight: 700, letterSpacing: 10}}>{b.card.kicker}</div>
          <div style={{marginTop: 22, color: IVORY, fontSize: 86, fontWeight: 700, lineHeight: 1.2, padding: '0 220px', textWrap: 'balance',textShadow: '0 6px 30px rgba(0,0,0,.6)'}}>{b.card.title}</div>
          <div style={{margin: '28px auto 0', width: 120, height: 2, background: GOLD}} />
        </div> : null;
      })}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.55) 100%)', pointerEvents: 'none'}} />
      {voice ? <Captions captions={voice.captions} ms={frame * 1000 / fps} highlight={highlight} /> : null}
      {beats[current]?.quote ? <div style={{position: 'absolute', top: 852, left: 0, right: 0, textAlign: 'center', color: GOLD, fontSize: 24, fontWeight: 700, letterSpacing: 2, opacity: opacityOf(current) * .85}}>— Hiểu về trái tim, Minh Niệm</div> : null}
    </AbsoluteFill>
    {voice ? <Track name={`Giọng · ${track} · ${voice.name}`}>
      <Audio src={staticFile(voice.file)} from={0} />
    </Track> : null}
  </AbsoluteFill>;
};
