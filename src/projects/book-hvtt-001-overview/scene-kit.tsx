import type {FC, ReactNode} from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Easing, Sequence, Track, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
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
// hold: [sentence, seconds] extra rest after that sentence, so a picture that fills up on the last words (a list) can
// be read before the next one takes over (user 2026-11-08).
export type Beat = {at: number; label?: string; card?: {kicker: string; title: string}; quote?: boolean; hold?: [number, number]; draw?: (c: Ctx) => ReactNode};

// Each episode passes its own narration takes (voice ids repeat across episodes); episode 1's are the default.
export const takesOf = (json: unknown) => (json as {voices: Take[]}).voices;
const voices = takesOf(takes);
export const takeOf = (id: string, list: Take[] = voices) => list.find((v) => v.id === id);

// Natural pacing (user 2026-11-01: "diễn giải tự nhiên, đừng quá bó buộc vào thời gian"): the narration is cut in
// the silence between sentences and played with added rests, a breath after every sentence and a longer rest
// where a new idea (a new drawing) starts, so each drawing finishes before the next one and the last one holds.
// User 2026-11-02 ("chậm chậm, khoảng nghỉ lâu"): the take already keeps ~0.5 s between sentences, so no extra
// breath is added there; only new ideas, cards and the section end get a short rest.
// Pictures, captions and the voice level all follow the paced timeline; the take itself is not changed.
// After p9 ("nghe không xem hình… chưa liền mạch"): shorter still; the takes' own pauses are scaled down too (build-body).
export const BREATH_SECONDS = 0, IDEA_SECONDS = .25, CARD_SECONDS = .2, TAIL_SECONDS = .6;
export type Pacing = {
  at: (sentence: number) => number; // frame where a sentence starts (one past the last = end of narration)
  end: (sentence: number) => number; // frame where a sentence's speech ends
  segments: {from: number; trimBefore: number; trimAfter: number}[];
  voiceFrame: (frame: number) => number | null; // take frame heard at this frame, null during a rest
  frames: number;
};
// Gentle part changes (user 2026-11-08, from episode 3: "chuyển cảnh phải từ từ và mượt mà"): a section may open
// with a quiet lead before its first word and keep a longer quiet tail; its pictures fade in/out over fadeSeconds while
// the background stays, and drawings hand over more slowly (beatFadeFrames). Unset = the episode 1–2 timing.
// ideaSeconds: the quiet added where a new drawing starts (default IDEA_SECONDS). After p9 (user 2026-11-08: "các phân
// cảnh… giống như bị ghép gấp vào… cần có 1 khoảng nghỉ nhẹ") about a second, so one drawing fades out and the next
// fades in while nobody speaks.
export type Transition = {leadSeconds: number; tailSeconds: number; fadeSeconds: number; beatFadeFrames: number; ideaSeconds?: number};
export const pace = (take: Take | undefined, ideaStarts: number[], fps: number, extra: Record<number, number> = {}, t?: Transition): Pacing => {
  const ranges = take?.phraseRanges ?? [];
  if (!take || !ranges.length) return {at: (i) => i * 3 * fps, end: (i) => (i * 3 + 2.5) * fps, segments: [], voiceFrame: () => null, frames: 5 * fps};
  const n = ranges.length, F = (sec: number) => Math.round(sec * fps), L = F(t?.leadSeconds ?? 0);
  const rest = ranges.map((_, i) => (i < n - 1 ? F(BREATH_SECONDS + (ideaStarts.includes(i + 1) ? t?.ideaSeconds ?? IDEA_SECONDS : 0) + (extra[i] ?? 0)) : 0));
  const added = rest.reduce<number[]>((acc, r, i) => [...acc, acc[i] + r], [0]); // rest frames before sentence i
  const cut = ranges.map((r, i) => (i === 0 ? 0 : F((ranges[i - 1].endSeconds + r.startSeconds) / 2))).concat(F(take.durationSeconds));
  const segments = ranges.map((_, i) => ({from: L + cut[i] + added[i], trimBefore: cut[i], trimAfter: cut[i + 1]}));
  const voiceFrame = (frame: number) => {
    const s = segments.find((g) => frame >= g.from && frame < g.from + g.trimAfter - g.trimBefore);
    return s ? s.trimBefore + frame - s.from : null;
  };
  return {
    at: (i) => L + (i >= n ? F(take.durationSeconds) + added[n - 1] : F(ranges[Math.max(0, i)].startSeconds) + added[Math.max(0, i)]),
    end: (i) => L + F(ranges[Math.min(i, n - 1)].endSeconds) + added[Math.min(i, n - 1)],
    segments, voiceFrame, frames: L + F(take.durationSeconds) + added[n - 1] + F(t?.tailSeconds ?? TAIL_SECONDS),
  };
};
// The take played piece by piece on the paced timeline.
export const PacedVoice: FC<{take: Take; pacing: Pacing; track: string}> = ({take, pacing, track}) => <Track name={`Giọng · ${track} · ${take.name}`}>
  {pacing.segments.map((g, i) => <Sequence key={i} from={g.from} durationInFrames={g.trimAfter - g.trimBefore} layout="none" name={`câu ${i + 1}`}>
    <Audio src={staticFile(take.file)} trimBefore={g.trimBefore} trimAfter={g.trimAfter} />
  </Sequence>)}
</Track>;
// Inverse of captionMs: where a moment of the take (ms) is heard on the paced timeline (ms), for caption files.
export const pacedMs = (pacing: Pacing, takeMs: number, fps: number) => {
  const f = takeMs * fps / 1000, g = pacing.segments.find((s) => f >= s.trimBefore && f <= s.trimAfter) ?? pacing.segments.find((s) => f < s.trimBefore);
  return g ? (g.from + Math.max(0, f - g.trimBefore)) * 1000 / fps : takeMs;
};
// Caption time (take milliseconds) for a paced frame; during a rest it stays at the end of the sentence before.
export const captionMs = (pacing: Pacing, frame: number, fps: number) => {
  const v = pacing.voiceFrame(frame);
  if (v !== null) return v * 1000 / fps;
  const before = [...pacing.segments].reverse().find((g) => g.from <= frame);
  return before ? before.trimAfter * 1000 / fps : -1e6; // before the first word (a section's lead): no caption
};
export const voiceLevel = (take: Take | undefined, pacing: Pacing, frame: number) => {
  const v = pacing.voiceFrame(frame);
  return take && v !== null && v < take.frames ? take.level[Math.max(0, v)] / 100 : 0;
};
// Small voice meter in the top-right corner of narrated sections (user 2026-11-02; the intro and outro keep their
// large visualizer): bars follow the voice's frequency bands on the paced timeline and settle during rests.
const METER_BANDS = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];
export const CornerVoice: FC<{take: Take | undefined; pacing: Pacing; frame: number}> = ({take, pacing, frame}) => {
  const v = pacing.voiceFrame(frame), bands = take && v !== null && v < take.frames ? take.bands[Math.max(0, v)] : null;
  return <div style={{position: 'absolute', right: 130, top: 88, height: 64, display: 'flex', alignItems: 'center', gap: 6, opacity: .95}}>
    {METER_BANDS.map((b, i) => {
      const edge = 1 - Math.abs(i - (METER_BANDS.length - 1) / 2) / (METER_BANDS.length / 2);
      return <div key={b} style={{width: 7, height: 6 + (bands ? bands[b] / 100 : 0) * 58 * (.5 + edge * .5), borderRadius: 4, background: GOLD, opacity: .45 + (bands ? bands[b] / 100 : 0) * .55}} />;
    })}
  </div>;
};
const ideaStartsOf = (beats: Beat[]) => beats.map((b) => b.at).filter((a) => a > 0);
const cardRestOf = (beats: Beat[]) => {
  const rest: Record<number, number> = Object.fromEntries(beats.filter((b) => b.card).map((b) => [b.at, CARD_SECONDS]));
  for (const b of beats) if (b.hold) rest[b.hold[0]] = (rest[b.hold[0]] ?? 0) + b.hold[1];
  return rest;
};
// Pacing is pure for a (voice, beats, fps): cached, since the body music asks it for every frame of the episode.
const paceCache = new WeakMap<Beat[], Map<string, Pacing>>();
export const sectionPacing = (voice: string, beats: Beat[], fps = 30, list: Take[] = voices, t?: Transition) => {
  const byKey = paceCache.get(beats) ?? new Map<string, Pacing>();paceCache.set(beats, byKey);
  const key = `${voice}@${fps}`, hit = byKey.get(key);
  if (hit) return hit;
  const made = pace(takeOf(voice, list), ideaStartsOf(beats), fps, cardRestOf(beats), t);byKey.set(key, made);
  return made;
};

// Stroke that draws itself between two frames: a dash that grows along the path (pathLength 1), nothing at all
// before it starts. Line style for every drawing: width ≥ 2 and opacity ≥ .7 so lines stay crisp at 1080p, a small
// glow only. Inside a scale(k) group pass scale={k} so the line keeps its width on screen (non-scaling-stroke is
// not used: with pathLength it splits strokes into dashes inside scaled groups — the broken lines of review 1).
export const Draw: FC<{d: string; from: number; to: number; frame: number; width?: number; opacity?: number; color?: string; scale?: number}> = ({d, from, to, frame, width = 2.4, opacity = 1, color = GOLD, scale = 1}) => {
  const p = interpolate(frame, [from, to], [0, 1], {...clamp, easing: ease});
  return p <= 0 ? null : <path d={d} fill="none" stroke={color} strokeWidth={width / Math.abs(scale)} strokeLinecap="round" strokeLinejoin="round" opacity={opacity} pathLength={1}
    strokeDasharray={p >= 1 ? undefined : `${p} 2`} />;
};
export const Glow: FC<{x: number; y: number; r: number; opacity: number}> = ({x, y, r, opacity}) =>
  <circle cx={x} cy={y} r={r} fill="url(#kit-glow)" opacity={opacity} />;
// Large gold outline text drawn as part of the illustration (Stoic Sans 700).
export const Word: FC<{x: number; y: number; size: number; text: string; opacity: number; anchor?: 'start' | 'middle' | 'end'}> = ({x, y, size, text, opacity, anchor = 'middle'}) =>
  <text x={x} y={y} fontSize={size} fontWeight={700} textAnchor={anchor} fill={IVORY} opacity={opacity} style={{letterSpacing: size * .06}}>{text}</text>;
export const appear = (frame: number, from: number, len = 12) => interpolate(frame, [from, from + len], [0, 1], {...clamp, easing: ease});

export const NarratedSection: FC<{voice: string; channelLabel: string; beats: Beat[]; highlight?: RegExp; track: string; takes?: Take[]; quoteSource?: string; transition?: Transition}> = ({voice: voiceId, channelLabel, beats, highlight, track, takes: list = voices, quoteSource = 'Hiểu về trái tim, Minh Niệm', transition}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const voice = takeOf(voiceId, list);
  const pacing = sectionPacing(voiceId, beats, fps, list, transition);
  const at = pacing.at, hand = transition?.beatFadeFrames ?? 12;
  const level = voiceLevel(voice, pacing, frame);
  // A drawing starts in the rest before its sentence; the one before has faded out by then (no overlap).
  const starts = beats.map((b, i) => (i === 0 ? 0 : at(b.at) - hand));
  const opacityOf = (i: number) => interpolate(frame, [starts[i], starts[i] + hand, (starts[i + 1] ?? 1e9) - hand, starts[i + 1] ?? 1e9], [i === 0 ? 1 : 0, 1, 1, 0], clamp);
  const current = starts.reduce((n, s, i) => (frame >= s ? i : n), 0);
  // Item label of the current beat, or of the last beat before it that set one.
  const label = [...beats.slice(0, current + 1)].reverse().find((b) => b.label !== undefined)?.label;
  // Without a transition the whole part fades to black at its end (episodes 1–2); with one, only the pictures,
  // labels and captions fade in and out, over the steady background.
  const fade = transition ? transition.fadeSeconds * fps : 0;
  const fadeOut = transition ? 1 : interpolate(frame, [durationInFrames - .6 * fps, durationInFrames], [1, 0], clamp);
  const content = transition ? Math.min(interpolate(frame, [0, fade], [0, 1], {...clamp, easing: Easing.inOut(Easing.sin)}), interpolate(frame, [durationInFrames - fade, durationInFrames], [1, 0], {...clamp, easing: Easing.inOut(Easing.sin)})) : 1;
  return <AbsoluteFill style={{background: INK, fontFamily: 'Stoic Sans, sans-serif', overflow: 'hidden'}}>
    <AbsoluteFill style={{opacity: fadeOut}}>
      <Backdrop frame={frame} fps={fps} durationInFrames={durationInFrames} drawFrame={false} />
      <AbsoluteFill style={{opacity: content}}>
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
      {voice ? <Captions captions={voice.captions} ms={captionMs(pacing, frame, fps)} highlight={highlight} /> : null}
      <CornerVoice take={voice} pacing={pacing} frame={frame} />
      {beats[current]?.quote && quoteSource ? <div style={{position: 'absolute', top: 852, left: 0, right: 0, textAlign: 'center', color: GOLD, fontSize: 24, fontWeight: 700, letterSpacing: 2, opacity: opacityOf(current) * .85}}>— {quoteSource}</div> : null}
      </AbsoluteFill>
    </AbsoluteFill>
    {voice ? <PacedVoice take={voice} pacing={pacing} track={track} /> : null}
  </AbsoluteFill>;
};

// A grown-up drawn in the same gold line (people may be drawn, user 2026-10-31), feet at (x, y), about 300 units
// tall at s = 1. Poses: stand, walk (legs swing with the frame), sit (on a seat at feet level − 90), headHold
// (sitting, hands to the head), kneel. arm: down, reach (toward facing), point, raise. facing: 1 right, −1 left.
export type Pose = 'stand' | 'walk' | 'sit' | 'headHold' | 'kneel';
export const Figure: FC<{frame: number; from: number; x: number; y: number; s?: number; pose?: Pose; arm?: 'down' | 'reach' | 'point' | 'raise'; facing?: 1 | -1; color?: string}> = ({frame, from, x, y, s = 1, pose = 'stand', arm = 'down', facing = 1, color = GOLD}) => {
  const swing = pose === 'walk' ? Math.sin(frame * .4) * 22 : 0;
  const seated = pose === 'sit' || pose === 'headHold', hip = seated ? -90 : pose === 'kneel' ? -70 : -130;
  const sh = hip - 120, head = sh - 34;
  const L = (d: string, k: number, w = 2.4) => <Draw frame={frame} from={from + k} to={from + k + 14} d={d} width={w} color={color} scale={s} />;
  const armPath = pose === 'headHold' ? `M0 ${sh + 6} C30 ${sh + 30} 40 ${head + 20} 18 ${head + 4} M0 ${sh + 6} C-26 ${sh + 30} -34 ${head + 20} -16 ${head + 4}`
    : arm === 'reach' ? `M0 ${sh + 6} L60 ${sh + 40} L110 ${sh + 44}`
    : arm === 'point' ? `M0 ${sh + 6} L70 ${sh + 10} L130 ${sh - 4}`
    : arm === 'raise' ? `M0 ${sh + 6} L40 ${sh - 50} L50 ${sh - 100}`
    : `M0 ${sh + 6} L12 ${sh + 70} L14 ${hip + 14}`;
  const legs = seated ? `M-10 ${hip} L60 ${hip} L64 0 M10 ${hip} L76 ${hip + 4} L84 0`
    : pose === 'kneel' ? `M-6 ${hip} L-8 -6 L40 0 M10 ${hip} L60 -40 L70 0`
    : null;
  return <g transform={`translate(${x} ${y}) scale(${s * facing} ${s})`}>
    {L(`M-22 ${head} a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0`, 0, 2.6)}
    {L(`M0 ${head + 22} L0 ${sh} M-34 ${sh + 6} C-30 ${sh - 6} 30 ${sh - 6} 34 ${sh + 6} C30 ${sh + 50} 26 ${hip - 20} 20 ${hip} L-20 ${hip} C-26 ${hip - 20} -30 ${sh + 50} -34 ${sh + 6} Z`, 4, 2.4)}
    {L(armPath, 8)}
    {pose !== 'headHold' && arm !== 'down' ? L(`M0 ${sh + 6} L-12 ${sh + 70} L-14 ${hip + 14}`, 8) : null}
    {legs ? L(legs, 10) : <>
      <g transform={`rotate(${swing} -10 ${hip})`}>{L(`M-10 ${hip} L-14 -4 L-30 0`, 10)}</g>
      <g transform={`rotate(${-swing} 10 ${hip})`}>{L(`M10 ${hip} L14 -4 L30 0`, 10)}</g>
    </>}
  </g>;
};
// Moment inside a sentence: share 0 = its start, 1 = the next sentence's start.
export const within = (c: Ctx, sentence: number, share: number) => Math.round(c.at(sentence) + (c.at(sentence + 1) - c.at(sentence)) * share);

// A body section: its component plus the frame count of its paced timeline (registry metadata and the episode).
export type SectionProps = {voice: string; channelLabel: string};
export type Section = FC<SectionProps> & {frames: (voice: string, fps?: number) => number; pacing: (voice: string, fps?: number) => Pacing; speaking: (voice: string, frame: number, fps?: number) => boolean; metadata: CalculateMetadataFunction<SectionProps>};
// takes/quoteSource: the episode's narration and the book named under on-screen quotes (episode 1 by default; '' for
// none: from episode 2 the user dropped it, it crowded the captions).
export const section = (track: string, highlight: RegExp, beats: Beat[], options: {takes?: Take[]; quoteSource?: string; transition?: Transition} = {}): Section => {
  const list = options.takes ?? voices, t = options.transition;
  const C: FC<SectionProps> = (p) => <NarratedSection {...p} track={track} highlight={highlight} beats={beats} takes={list} quoteSource={options.quoteSource} transition={t} />;
  const frames = (voice: string, fps = 30) => sectionPacing(voice, beats, fps, list, t).frames;
  const speaking = (voice: string, frame: number, fps = 30) => sectionPacing(voice, beats, fps, list, t).voiceFrame(frame) !== null;
  const pacing = (voice: string, fps = 30) => sectionPacing(voice, beats, fps, list, t);
  return Object.assign(C, {frames, pacing, speaking, metadata: (({props}) => ({durationInFrames: frames(props.voice)})) as CalculateMetadataFunction<SectionProps>});
};
