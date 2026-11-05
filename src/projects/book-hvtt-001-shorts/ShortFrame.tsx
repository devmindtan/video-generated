import type {FC, ReactNode} from 'react';
import {useMemo} from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Sequence, Track, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CalculateMetadataFunction} from 'remotion';
import '../../shared/stoic-fonts';
import {MusicFade} from '../../shared/MusicFade';
import {GOLD, Grain, INK, IVORY, clamp, ease} from '../book-hvtt-001-overview/Intro';
import {Draw, appear} from '../book-hvtt-001-overview/scene-kit';
import music from './music.json';
import data from './shorts.json';

// Vertical shorts that lead viewers to a long episode (user idea 2026-11-03): an opening question and a closing
// invitation in the cloned voice around an excerpt of the published episode, redrawn for 1080×1920 (user 2026-11-04).
// Layout keeps YouTube Shorts' buttons (right edge) and title area (bottom) clear: drawings in y 460–1340, x 80–940,
// captions in y 1380–1560. Captions light word by word with the voice (word times from shorts.json).
export type Word = {text: string; startMs: number; endMs: number};
export type Clip = {file: string; durationSeconds: number; words: Word[]};
export type Excerpt = Clip & {fromSeconds: number; toSeconds: number};
export type ShortData = {id: string; hook: Clip; excerpt: Excerpt; cta: Clip};
export type ShortProps = {short: string};
// Drawing context inside the excerpt: t(s) is the frame where the excerpt reaches s seconds (its own time).
export type SCtx = {frame: number; start: number; t: (seconds: number) => number};
export type SBeat = {at: number; draw: (c: SCtx) => ReactNode};

export type Music = typeof music;
// Gaps around the excerpt: GAP1 after the opening line, GAP2 before the invitation (a later episode may lengthen them).
export type Gaps = {lead: number; gap1: number; gap2: number; tail: number};
const F = (s: number, fps: number) => Math.round(s * fps);
// Start frames of the three clips and the total length.
const timelineWith = (g: Gaps) => (s: ShortData, fps = 30) => {
  const hook = F(g.lead, fps), excerpt = hook + F(s.hook.durationSeconds + g.gap1, fps), cta = excerpt + F(s.excerpt.toSeconds - s.excerpt.fromSeconds + g.gap2, fps);
  return {hook, excerpt, cta, end: cta + F(s.cta.durationSeconds, fps), total: cta + F(s.cta.durationSeconds + g.tail, fps)};
};
export const D = (c: SCtx, d: string, delay = 0, len = 24, width = 2.8, opacity = 1, color = GOLD) =>
  <Draw key={`${d}${delay}`} d={d} frame={c.frame} from={c.start + delay} to={c.start + delay + len} width={width} opacity={opacity} color={color} />;
export const W = (x: number, y: number, size: number, text: string, opacity: number, color = IVORY) =>
  <text x={x} y={y} textAnchor="middle" fill={color} fontSize={size} fontWeight={700} opacity={opacity}>{text}</text>;

// Caption pages from timed words: each sentence on as few pages of at most two lines (about 46 characters) as it
// needs, cut at the word nearest an even split so no page is left with a stray last word.
const MAX = 46;
const pagesOf = (words: Word[]) => {
  const pages: Word[][] = [], sentences: Word[][] = [];let cur: Word[] = [];
  for (const w of words) {cur.push(w);if (/[.?!…]["”]?$/.test(w.text)) {sentences.push(cur);cur = [];}}
  if (cur.length) sentences.push(cur);
  for (const ws of sentences) {
    const ends: number[] = [];let at = -1;
    for (const w of ws) {at += w.text.length + 1;ends.push(at);}
    const total = ends[ends.length - 1];
    for (let n = Math.ceil(total / MAX); ; n++) {
      const cuts = Array.from({length: n - 1}, (_, k) => ends.reduce((best, e, i) => Math.abs(e - total * (k + 1) / n) < Math.abs(ends[best] - total * (k + 1) / n) ? i : best, 0));
      const bounds = [-1, ...new Set(cuts)].sort((x, y) => x - y).concat(ws.length - 1), split = bounds.slice(1).map((e, i) => ws.slice(bounds[i] + 1, e + 1)).filter((p) => p.length);
      if (split.every((p) => p.map((w) => w.text).join(' ').length <= MAX + 4) || n >= ws.length) {pages.push(...split);break;}
    }
  }
  return pages;
};
const Captions: FC<{words: Word[]; ms: number; highlight: RegExp; top?: number; size?: number}> = ({words, ms, highlight, top = 1390, size = 58}) => {
  const pages = useMemo(() => pagesOf(words), [words]);
  const n = pages.findIndex((p, i) => ms >= p[0].startMs - 80 && ms < (pages[i + 1]?.[0].startMs ?? p[p.length - 1].endMs + 500) - 80);
  if (n < 0) return null;
  const page = pages[n], text = page.map((w) => w.text).join(' ');
  const gold: [number, number][] = [...text.matchAll(new RegExp(highlight.source, 'gi'))].map((m) => [m.index ?? 0, (m.index ?? 0) + m[0].length]);
  let at = 0;
  return <div style={{position: 'absolute', left: 80, width: 860, top, minHeight: 170, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: IVORY, fontSize: size, fontWeight: 700, lineHeight: 1.3, textShadow: '0 3px 14px #000', textWrap: 'balance'}}>
    <div>{page.map((w, i) => {const offset = text.indexOf(w.text, at);at = offset + w.text.length;
      return <span key={i} style={{color: gold.some(([a, b]) => offset >= a && offset < b) ? GOLD : undefined, opacity: interpolate(ms, [w.startMs - 40, w.startMs + 80], [.38, 1], clamp)}}>{w.text}{i < page.length - 1 ? ' ' : ''}</span>;})}</div>
  </div>;
};

// An open book drawn in from its spine.
const book = (c: SCtx, x: number, y: number, s: number, delay = 0) => D(c, `M${x} ${y + 100 * s} C${x - 70 * s} ${y + 70 * s} ${x - 160 * s} ${y + 68 * s} ${x - 230 * s} ${y + 86 * s} L${x - 230 * s} ${y} C${x - 160 * s} ${y - 18 * s} ${x - 70 * s} ${y - 16 * s} ${x} ${y + 14 * s} C${x + 70 * s} ${y - 16 * s} ${x + 160 * s} ${y - 18 * s} ${x + 230 * s} ${y} L${x + 230 * s} ${y + 86 * s} C${x + 160 * s} ${y + 68 * s} ${x + 70 * s} ${y + 70 * s} ${x} ${y + 100 * s} Z M${x} ${y + 14 * s} L${x} ${y + 100 * s}`, delay, 30, 2.8);

// One kit per promo-shorts project (user 2026-11-05: every long episode gets its shorts; the frame is shared, never
// copied): its shorts.json, music and gaps. Episode 1's kit is the default export below.
export const createShortKit = (raw: unknown, music: Music, g: Gaps = {lead: .3, gap1: .35, gap2: .5, tail: 1.4}, excerptTrack = 'Giọng · đoạn trích tập 1') => {
const shorts = (raw as {shorts: ShortData[]}).shorts;
const shortOf = (id: string) => shorts.find((s) => s.id === id) ?? shorts[0];
const timeline = timelineWith(g);
const GAP2 = g.gap2;
const shortMetadata: CalculateMetadataFunction<ShortProps> = ({props}) => ({durationInFrames: timeline(shortOf(props.short)).total});
const ShortFrame: FC<ShortProps & {beats: SBeat[]; highlight: RegExp; seriesLabel: string; bookLine: string; bookLineSize?: number; episodeLabel: string; bookTitle: string; bookAuthor: string}> = ({short: id, beats, highlight, seriesLabel, bookLine, bookLineSize = 44, episodeLabel, bookTitle, bookAuthor}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const s = shortOf(id), tl = timeline(s, fps);
  const ms = (from: number) => (frame - from) * 1000 / fps;
  // Excerpt beats: each drawing fades in over 12 frames before its moment and out as the next one comes.
  const t = (sec: number) => tl.excerpt + F(sec, fps);
  const starts = beats.map((b, i) => (i === 0 ? tl.excerpt - 6 : t(b.at) - 12));
  const opacityOf = (i: number) => interpolate(frame, [starts[i], starts[i] + 12, (starts[i + 1] ?? tl.cta - 6) - 12, starts[i + 1] ?? tl.cta + 6], [0, 1, 1, 0], clamp);
  const hookIn = interpolate(frame, [0, 10, tl.excerpt - 14, tl.excerpt - 2], [0, 1, 1, 0], clamp);
  const ctaIn = interpolate(frame, [tl.cta - 8, tl.cta + 10], [0, 1], {...clamp, easing: ease});
  const fadeOut = interpolate(frame, [durationInFrames - .7 * fps, durationInFrames], [1, 0], clamp);
  const hc: SCtx = {frame, start: 4, t: (x) => F(x, fps)}, cc: SCtx = {frame, start: tl.cta, t: (x) => tl.cta + F(x, fps)};
  // Body music: lower under speech, a little up in the gaps.
  const speech = Math.max(...[[tl.hook, tl.hook + F(s.hook.durationSeconds, fps)], [tl.excerpt, tl.cta - F(GAP2, fps)], [tl.cta, tl.end]].map(([a, b]) => interpolate(frame, [a - 10, a, b, b + 12], [0, 1, 1, 0], clamp)));
  const musicLevel = music.pauseVolume - (music.pauseVolume - music.speechVolume) * speech;
  const hookWords = s.hook.words.map((w) => ({...w}));
  const pageWords = (clip: Word[], from: number) => clip.map((w) => ({...w, startMs: w.startMs + from * 1000 / fps, endMs: w.endMs + from * 1000 / fps}));
  const bodyWords = useMemo(() => [...pageWords(s.excerpt.words, tl.excerpt), ...pageWords(s.cta.words, tl.cta)], [id]); // eslint-disable-line react-hooks/exhaustive-deps
  return <AbsoluteFill style={{background: INK, fontFamily: 'Stoic Sans, sans-serif', overflow: 'hidden'}}>
    <AbsoluteFill style={{opacity: fadeOut}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 55% at 50% 45%, #22302a 0%, ${INK} 65%, #070b09 100%)`}} />
      <Grain frame={frame} />
      <div style={{position: 'absolute', inset: 36, border: `1.5px solid ${GOLD}`, opacity: .35, borderRadius: 6}} />
      <div style={{position: 'absolute', top: 220, left: 0, right: 0, textAlign: 'center', color: GOLD, fontSize: 32, fontWeight: 700, letterSpacing: 8}}>{seriesLabel}</div>
      <div style={{position: 'absolute', top: 280, left: 0, right: 0, textAlign: 'center', color: IVORY, fontSize: bookLineSize, fontWeight: 700, opacity: .92}}>{bookLine}</div>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0, filter: 'drop-shadow(0 0 3px rgba(217,181,111,.18))'}}>
        <defs><radialGradient id="short-glow"><stop offset="0%" stopColor="#e8c27a" stopOpacity={.35} /><stop offset="100%" stopColor="#e8c27a" stopOpacity={0} /></radialGradient></defs>
        {/* Opening: the question itself is the caption, lit with the voice; a book opens under it. */}
        <g opacity={hookIn}>{book(hc, 520, 1080, 1.3, 6)}<circle cx={520} cy={1080} r={260} fill="url(#short-glow)" opacity={appear(frame, 20, 30) * .6} /></g>
        {beats.map((b, i) => {const o = opacityOf(i);return o > .001 ? <g key={i} opacity={o}>{b.draw({frame, start: starts[i], t})}</g> : null;})}
        {/* Invitation card. */}
        <g opacity={ctaIn}>
          {W(520, 600, 34, episodeLabel, 1, GOLD)}
          {W(520, 720, 92, bookTitle, 1)}
          <path d="M460 780 L580 780" stroke={GOLD} strokeWidth={2.4} />
          {W(520, 850, 44, bookAuthor, .9)}
          {W(520, 975, 56, 'Xem trọn tập', appear(frame, tl.cta + 20, 14), GOLD)}
          {/* A comment bubble: the full-episode link is pinned in the comments (user 2026-11-04). */}
          {D(cc, 'M400 1030 L640 1030 C660 1030 670 1040 670 1060 L670 1150 C670 1170 660 1180 640 1180 L500 1180 L450 1230 L455 1180 L400 1180 C380 1180 370 1170 370 1150 L370 1060 C370 1040 380 1030 400 1030 Z M420 1080 L620 1080 M420 1125 L570 1125', 30, 24, 3)}
          {W(520, 1290, 46, 'Link ở phần bình luận', appear(frame, tl.cta + 50, 14))}
        </g>
      </svg>
      {frame < tl.excerpt ? <div style={{opacity: hookIn}}><Captions words={hookWords} ms={ms(tl.hook)} highlight={highlight} top={520} size={72} /></div>
        : <Captions words={bodyWords} ms={frame * 1000 / fps} highlight={highlight} />}
    </AbsoluteFill>
    <Track name="Giọng · câu mở"><Sequence from={tl.hook} durationInFrames={F(s.hook.durationSeconds, fps) + 2}><Audio src={staticFile(s.hook.file)} /></Sequence></Track>
    <Track name={excerptTrack}><Sequence from={tl.excerpt} durationInFrames={tl.cta - tl.excerpt}><Audio src={staticFile(s.excerpt.file)} trimBefore={F(s.excerpt.fromSeconds, fps)} trimAfter={F(s.excerpt.toSeconds + .15, fps)} /></Sequence></Track>
    <Track name="Giọng · lời mời"><Sequence from={tl.cta} durationInFrames={F(s.cta.durationSeconds, fps) + 2}><Audio src={staticFile(s.cta.file)} /></Sequence></Track>
    <Track name={`Nhạc nền · ${music.credit.artists.join(', ')} – ${music.credit.title} · chỉnh đầu/cuối trong Edit`}>
      <MusicFade fadeInSeconds={music.fadeInSeconds} fadeOutSeconds={music.fadeOutSeconds}>
        <Audio name={`${music.credit.artists.join(', ')} – ${music.credit.title}`} src={staticFile(music.file)} from={0} durationInFrames={durationInFrames} volume={musicLevel} playbackRate={music.playbackRate} loop />
      </MusicFade>
    </Track>
  </AbsoluteFill>;
};
return {shortOf, timeline, shortMetadata, ShortFrame};
};

const episode1 = createShortKit(data, music);
export const {shortOf, timeline, shortMetadata, ShortFrame} = episode1;
