import type {FC} from 'react';
import type {Caption} from '@remotion/captions';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Easing, Track, interpolate, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CalculateMetadataFunction} from 'remotion';
import '../../shared/stoic-fonts';
import {MusicFade} from '../../shared/MusicFade';
import music from './music.json';
import takes from './intro-takes.json';

// Series intro for "Đọc sách, hiểu mình": classic book-plate frame, paper grain and gold rules,
// with a modern voice visualizer whose bars follow the narration (bands precomputed per frame by
// scripts/projects/book-hvtt-001-overview/intro-bands.py). Voice is an audition take until the user picks one.

// words: per-word times of the final voice (word-times.py), for captions that light up with the voice (user 2026-11-03).
export type Word = {text: string; startMs: number; endMs: number};
export type TimedCaption = Caption & {words?: Word[]};
export type Voice = {id: string; name: string; file: string; durationSeconds: number; frames: number; captions: TimedCaption[]; bands: number[][]; level: number[]};
// Series intro: identical for every episode. The per-episode book card lives in EpisodeCard.tsx (user 2026-10-31).
export type BookIntroProps = {voice: string; channelLabel: string; withMusic?: boolean};

const voices = (takes as unknown as {voices: Voice[]}).voices;
const TAIL_SECONDS = 1.6;
export const INK = '#0d1411';
export const GOLD = '#d9b56f';
export const IVORY = '#f2ede3';
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ease = Easing.bezier(.16, 1, .3, 1);
const emphasis = /(Đọc sách, hiểu mình|không có nhiều thời gian|dành cho bạn|niềm vui|hạnh phúc|bắt đầu)/gi;

const voiceOf = (id: string) => voices.find((v) => v.id === id) ?? voices[0];
const toOutroOf = (frame: number, speechEnd: number, fps: number) => interpolate(frame, [speechEnd - .2 * fps, speechEnd + .6 * fps], [1, 0], {...clamp, easing: ease});

// Caption-driven ducking: the score sits at pauseVolume between sentences and dips to speechVolume under speech.
// For the intro the user wants a steady bed (2026-10-30): both values are equal in music.json, so no dips.
export const musicVolume = (captions: Caption[], frame: number, fps: number) => {
  const ms = frame * 1000 / fps;
  const activity = Math.max(0, ...captions.map((c) => interpolate(ms, [c.startMs - 120, c.startMs, c.endMs, c.endMs + 250], [0, 1, 1, 0], clamp)));
  const base = music.pauseVolume - (music.pauseVolume - music.speechVolume) * activity;
  // Louder opening, then a gradual glide down to a quieter bed (music.json lowerFrom/Over/ToVolume).
  const lowered = interpolate(frame, [music.lowerFromSeconds * fps, (music.lowerFromSeconds + music.lowerOverSeconds) * fps], [base, music.lowerToVolume], {...clamp, easing: Easing.inOut(Easing.sin)});
  return Math.min(base, lowered);
};

export const introFrames = (voice: string, fps = 30) => Math.ceil(((voiceOf(voice)?.durationSeconds ?? 30) + TAIL_SECONDS) * fps);
export const introCaptions = (voice: string) => voiceOf(voice)?.captions ?? [];
export const bookIntroMetadata: CalculateMetadataFunction<BookIntroProps> = ({props}) => ({durationInFrames: introFrames(props.voice)});

// Background shared by the intro, the episode card and the outro.
export const Backdrop: FC<{frame: number; fps: number; durationInFrames: number; drawFrame?: boolean}> = ({frame, fps, durationInFrames, drawFrame = true}) => <>
  <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 60% at 50% 42%, #22302a 0%, ${INK} 62%, #070b09 100%)`}} />
  <AbsoluteFill style={{background: 'linear-gradient(115deg, transparent 30%, rgba(217,181,111,.07) 48%, transparent 62%)', translate: `${interpolate(frame, [0, durationInFrames], [-700, 700])}px 0`}} />
  <Dust frame={frame} />
  <Grain frame={frame} />
  <Frame frame={drawFrame ? frame : 10 * fps} fps={fps} />
</>;

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

// User 2026-11-02 ("chữ thưa thớt, ngắt ngắt"): the aligner cuts a page at every comma, so the pages of one
// sentence are joined and re-split into balanced pages of at most two lines, cut after a comma where possible
// (times shared out by character position); a page stays up through a short pause until the next one, and only
// the first page after a real silence fades in.
const MAX_CHARS = 84, HOLD_MS = 1200;
const merged = new WeakMap<Caption[], TimedCaption[]>();
const tokens = (text: string) => text.split(/\s+/).filter(Boolean);
const splitSentence = (pieces: TimedCaption[]): TimedCaption[] => {
  const text = pieces.map((p) => p.text.trim()).join(' ');
  // Time at a character offset, linear inside the aligner page that holds it.
  const timeAt = (offset: number) => {
    let pos = 0;
    for (const p of pieces) {
      const len = p.text.trim().length + 1;
      if (offset <= pos + len) return p.startMs + (p.endMs - p.startMs) * Math.min(1, (offset - pos) / len);
      pos += len;
    }
    return pieces[pieces.length - 1].endMs;
  };
  // An aligner page can run across a sentence end: cut there first, then split long sentences.
  const bounds = [0, ...[...text.matchAll(/[.?!…]["”]?(?= )/g)].map((m) => (m.index ?? 0) + m[0].length + 1), text.length + 1];
  const cuts: number[] = [];
  // Cuts of one sentence into count pages, or null when some page cannot fit.
  const split = (from: number, to: number, count: number) => {
    const len = to - from, out = [from];
    for (let k = 1; k < count; k++) {
      const ideal = from + (len * k) / count, prev = out[out.length - 1];
      let best = -1, score = Infinity;
      for (let i = prev + 10; i < to - 10; i++) {
        // Every page fits: this one, and what is left for the remaining pages of the sentence.
        if (text[i] !== ' ' || i - prev > MAX_CHARS || to - i > MAX_CHARS * (count - k)) continue;
        const s = Math.abs(i - ideal) - (/[,;:]$/.test(text.slice(0, i)) ? 18 : 0);
        if (s < score) {score = s; best = i;}
      }
      if (best < 0) return null;
      out.push(best + 1);
    }
    return out;
  };
  for (let b = 0; b < bounds.length - 1; b++) {
    const from = bounds[b], to = bounds[b + 1] - 1;
    // A sentence just under a multiple of MAX_CHARS may not split evenly at a space: one more page then.
    let count = Math.ceil((to - from) / MAX_CHARS), got = split(from, to, count);
    while (!got && count < 8) got = split(from, to, ++count);
    cuts.push(...(got ?? [from]));
  }
  cuts.push(text.length + 1);
  // Word times follow the words onto their page (one entry per word of the caption text).
  const words = pieces.every((p) => p.words?.length === tokens(p.text).length) ? pieces.flatMap((p) => p.words ?? []) : undefined;
  return cuts.slice(0, -1).map((from, k) => {
    const page = text.slice(from, cuts[k + 1] - 1).trim(), first = tokens(text.slice(0, from)).length;
    return {...pieces[0], text: page, startMs: timeAt(from), endMs: k === cuts.length - 2 ? pieces[pieces.length - 1].endMs : timeAt(cuts[k + 1] - 1), timestampMs: timeAt(from), words: words?.slice(first, first + tokens(page).length)};
  }).filter((p) => p.text);
};
export const mergeCaptions = (captions: TimedCaption[]) => {
  const cached = merged.get(captions);
  if (cached) return cached;
  const out: TimedCaption[] = [];
  let group: TimedCaption[] = [];
  const flush = () => {if (group.length) out.push(...splitSentence(group)); group = [];};
  for (const c of captions) {
    const last = group[group.length - 1];
    if (last && (/[.?!…]["”]?$/.test(last.text.trim()) || c.startMs - last.endMs >= HOLD_MS)) flush();
    group.push(c);
  }
  flush();
  merged.set(captions, out);
  return out;
};
export const Captions: FC<{captions: TimedCaption[]; ms: number; highlight?: RegExp}> = ({captions: raw, ms, highlight = emphasis}) => {
  const captions = mergeCaptions(raw);
  const n = captions.findIndex((c, i) => ms >= c.startMs && ms < Math.max(c.endMs + 250, captions[i + 1] && captions[i + 1].startMs - c.endMs < HOLD_MS ? captions[i + 1].startMs : 0));
  if (n < 0) return null;
  const page = captions[n];
  const follows = n > 0 && page.startMs - captions[n - 1].endMs < HOLD_MS;
  const fade = follows ? 1 : interpolate(ms, [page.startMs - 60, page.startMs + 140], [0, 1], clamp);
  // With word times the page lights up word by word with the voice: words still to come are dimmed, each brightens
  // as it is spoken (gold keywords stay gold). Without them (placeholder voices) the page shows as before.
  const words = page.words;
  const gold: [number, number][] = words ? [...page.text.matchAll(new RegExp(highlight.source, highlight.flags.includes('g') ? highlight.flags : highlight.flags + 'g'))].map((m) => [m.index ?? 0, (m.index ?? 0) + m[0].length]) : [];
  let at = 0;
  const lit = words ? tokens(page.text).map((t, i) => {
    const offset = page.text.indexOf(t, at);at = offset + t.length;
    const on = interpolate(ms, [words[i].startMs - 40, words[i].startMs + 80], [.38, 1], clamp);
    return <span key={i} style={{color: gold.some(([a, b]) => offset >= a && offset < b) ? GOLD : undefined, opacity: on}}>{t}{i < words.length - 1 ? ' ' : ''}</span>;
  }) : null;
  const parts = page.text.split(highlight);
  return <div data-testid="book-intro-caption" style={{position: 'absolute', left: 260, right: 260, top: 880, minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: IVORY, fontSize: 44, fontWeight: 700, lineHeight: 1.4, textShadow: '0 3px 14px #000', opacity: fade, translate: `0 ${(1 - fade) * 8}px`}}>
    <div>{lit ?? parts.map((p, i) => <span key={i} style={{color: i % 2 === 1 ? GOLD : undefined}}>{p}</span>)}</div>
  </div>;
};

// Music fades follow this composition's edges, which inside the episode's Sequence are the intro's own edges.
export const BookInsightsIntro: FC<BookIntroProps> = ({voice: voiceId, channelLabel, withMusic = true}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const voice = voiceOf(voiceId);
  const speechEnd = voice ? voice.frames : durationInFrames - TAIL_SECONDS * fps;
  const i = Math.min(frame, (voice?.frames ?? 1) - 1);
  const bands = voice && frame < voice.frames ? voice.bands[i] : new Array(32).fill(0);
  const level = voice && frame < voice.frames ? voice.level[i] / 100 : 0;
  const ms = frame * 1000 / fps;
  const titleIn = interpolate(frame, [1.1 * fps, 2.6 * fps], [0, 1], {...clamp, easing: ease});
  const lowerOpacity = toOutroOf(frame, speechEnd, fps);
  const fadeOut = interpolate(frame, [durationInFrames - .9 * fps, durationInFrames], [1, 0], clamp);
  return <AbsoluteFill style={{background: INK, fontFamily: 'Stoic Sans, sans-serif', overflow: 'hidden'}}>
    <AbsoluteFill style={{opacity: fadeOut}}>
      <Backdrop frame={frame} fps={fps} durationInFrames={durationInFrames} />
      <div style={{position: 'absolute', top: 104, left: 0, right: 0, textAlign: 'center', color: GOLD, fontSize: 22, fontWeight: 700, letterSpacing: 8, opacity: interpolate(frame, [.8 * fps, 1.8 * fps], [0, 1], clamp)}}>{channelLabel}</div>
      <div style={{position: 'absolute', top: 170, left: 0, right: 0}}>
        <OpenBook frame={frame} fps={fps} glow={level} />
        <div style={{marginTop: 26, textAlign: 'center', color: IVORY, fontSize: 104, fontWeight: 700, letterSpacing: interpolate(titleIn, [0, 1], [26, 8]), opacity: titleIn, clipPath: `inset(0 ${(1 - titleIn) * 50}% 0 ${(1 - titleIn) * 50}%)`, textShadow: '0 6px 30px rgba(0,0,0,.6)'}}>ĐỌC SÁCH, HIỂU MÌNH</div>
        <div style={{margin: '22px auto 0', width: 560, display: 'flex', alignItems: 'center', gap: 18, opacity: titleIn}}>
          <div style={{flex: 1, height: 1.5, background: `linear-gradient(90deg, transparent, ${GOLD})`, scale: `${interpolate(frame, [1.8 * fps, 2.8 * fps], [0, 1], {...clamp, easing: ease})} 1`, transformOrigin: 'right'}} />
          <div style={{width: 12, height: 12, rotate: '45deg', background: GOLD}} />
          <div style={{flex: 1, height: 1.5, background: `linear-gradient(90deg, ${GOLD}, transparent)`, scale: `${interpolate(frame, [1.8 * fps, 2.8 * fps], [0, 1], {...clamp, easing: ease})} 1`, transformOrigin: 'left'}} />
        </div>
        <div style={{marginTop: 22, textAlign: 'center', color: IVORY, fontSize: 30, fontWeight: 400, letterSpacing: 3, opacity: interpolate(frame, [2.4 * fps, 3.2 * fps], [0, .78], clamp)}}>Đọc trọn một cuốn sách · Giữ lại điều đáng giữ</div>
      </div>
      <div style={{opacity: lowerOpacity}}>
        <Visualizer bands={bands} level={level} appear={interpolate(frame, [.6 * fps, 1.4 * fps], [0, 1], clamp)} />
        {voice ? <Captions captions={voice.captions} ms={ms} /> : null}
      </div>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.55) 100%)', pointerEvents: 'none'}} />
    </AbsoluteFill>
    {voice ? <Track name={`Giọng · ${voice.name}`}>
      <Audio src={staticFile(voice.file)} from={0} />
    </Track> : null}
    {withMusic ? <Track name="Nhạc intro · Pufino – Enlivening · chỉnh đầu/cuối trong Edit">
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
    </Track> : null}
  </AbsoluteFill>;
};
