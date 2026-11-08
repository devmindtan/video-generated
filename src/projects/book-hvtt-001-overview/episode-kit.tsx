import {useMemo} from 'react';
import type {FC, ReactElement} from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Sequence, Track, staticFile, useCurrentFrame} from 'remotion';
import {MusicFade} from '../../shared/MusicFade';
import {BookInsightsIntro, GOLD, introCaptions, introFrames, mergeCaptions} from './Intro';
import type {Voice} from './Intro';
import {BookInsightsEpisodeCard, cardCaptions, cardFrames} from './EpisodeCard';
import {BookInsightsHookCard, hookCaptions, hookLeadFrames, hookSpeaking, hookVoiceFrames} from './HookCard';
import {BookInsightsOutro, outroCaptions, outroFrames} from './Outro';
import {CachLam} from './Sections';
import {pacedMs, takeOf} from './scene-kit';
import type {Pacing, Section, Take} from './scene-kit';
import seriesTakes from './body-takes.json';

// The series' long-episode frame (Đọc sách, hiểu mình; layout fixed by the user 2026-11-03): series intro → how this
// episode works → episode card → the episode's own parts → series outro, a very quiet music bed under the narrated
// parts, a progress line along the bottom, and every caption page on the episode timeline. Each episode builds only
// its card and body parts; intro, "Cách làm" and outro are episode 1's, reused as they are.
export type Page = {text: string; startMs: number; endMs: number};
// speaking: whether narration is heard at a local frame (the body music dips under it); unset for intro/outro.
// captions: the part's caption pages in its own milliseconds.
export type Part = {name: string; frames: number; node: ReactElement; speaking?: (frame: number) => boolean; captions?: () => Page[]};
export type BodyMusicConfig = {file: string; speechVolume: number; pauseVolume: number; fadeInSeconds: number; fadeOutSeconds: number; playbackRate: number; credit: {title: string; artists: string[]}};
export type SeriesVoices = {introVoice: string; outroVoice: string; channelLabel: string};

const series = (seriesTakes as unknown as {voices: Take[]}).voices;
// The picked take of a segment: the cloned voice (+2 semitones) first, else the take as assembled.
export const voiceFor = (seg: string, takes: Take[]) => [`${seg}-sang2`, seg].find((id) => takeOf(id, takes));

// A narrated part's caption pages (as shown on screen) moved from take time to its paced timeline.
export const pacedPages = (voice: string, pacing: Pacing, fps: number, takes: Take[]): Page[] => mergeCaptions(takeOf(voice, takes)?.captions ?? [])
  .map((c) => ({text: c.text, startMs: pacedMs(pacing, c.startMs, fps), endMs: pacedMs(pacing, c.endMs, fps)}));

// A body section part (scene-kit section) with its voice from the episode's takes.
export const sectionPart = (name: string, Section: Section, voice: string, channelLabel: string, fps: number, takes: Take[]): Part =>
  ({name, frames: Section.frames(voice, fps), node: <Section voice={voice} channelLabel={channelLabel} />, speaking: (f) => Section.speaking(voice, f, fps), captions: () => pacedPages(voice, Section.pacing(voice, fps), fps, takes)});

// Series intro and "Cách làm của tập" (both reused), then the episode card with this episode's card take.
export const openingParts = (p: SeriesVoices & {cardVoice: string; episodeLabel: string; bookTitle: string; bookAuthor: string; cardTakes?: Voice[]}, fps: number): Part[] => {
  const list: Part[] = [{name: 'Intro series', frames: introFrames(p.introVoice, fps), node: <BookInsightsIntro voice={p.introVoice} channelLabel={p.channelLabel} />, captions: () => mergeCaptions(introCaptions(p.introVoice))}];
  const how = voiceFor('01b-cach-lam', series);
  if (how) list.push(sectionPart('Cách làm của tập', CachLam, how, p.channelLabel, fps, series));
  list.push({name: 'Thẻ tập', frames: cardFrames(p.cardVoice, fps, p.cardTakes), node: <BookInsightsEpisodeCard voice={p.cardVoice} channelLabel={p.channelLabel} episodeLabel={p.episodeLabel} bookTitle={p.bookTitle} bookAuthor={p.bookAuthor} takes={p.cardTakes} />,
    speaking: () => true, captions: () => mergeCaptions(cardCaptions(p.cardVoice, p.cardTakes))});
  return list;
};
// From episode 3 on (user 2026-11-08): no series intro. The episode screen on the intro music alone ('Nhạc mở đầu'),
// then the voice's hook ('Mở đầu tập': greeting, why this book, a word for first-time viewers, the book named) under
// the quiet body music like every narrated part, then "Cách làm" (reused) and the body.
export const hookOpeningParts = (p: {channelLabel: string; cardVoice: string; episodeLabel: string; bookTitle: string; bookAuthor: string; cardTakes: Voice[]}, fps: number): Part[] => {
  const card = {voice: p.cardVoice, channelLabel: p.channelLabel, episodeLabel: p.episodeLabel, bookTitle: p.bookTitle, bookAuthor: p.bookAuthor, takes: p.cardTakes};
  const list: Part[] = [
    {name: 'Nhạc mở đầu', frames: hookLeadFrames(fps), node: <BookInsightsHookCard {...card} section="lead" />},
    {name: 'Mở đầu tập', frames: hookVoiceFrames(p.cardVoice, p.cardTakes, fps), node: <BookInsightsHookCard {...card} section="voice" />,
      speaking: (f) => hookSpeaking(p.cardVoice, p.cardTakes, f, fps), captions: () => mergeCaptions(hookCaptions(p.cardVoice, p.cardTakes))}];
  const how = voiceFor('01b-cach-lam', series);
  if (how) list.push(sectionPart('Cách làm của tập', CachLam, how, p.channelLabel, fps, series));
  return list;
};
export const outroPart =(p: SeriesVoices, fps: number): Part =>
  ({name: 'Outro series', frames: outroFrames(p.outroVoice, fps), node: <BookInsightsOutro voice={p.outroVoice} channelLabel={p.channelLabel} />, captions: () => mergeCaptions(outroCaptions(p.outroVoice))});

// Every caption page on the episode timeline (captions.json, .srt for upload) and the parts with their length.
export const captionsOf = (list: Part[], fps = 30) => {
  let at = 0;
  return list.flatMap((part) => {
    const start = at * 1000 / fps;at += part.frames;
    return (part.captions?.() ?? []).map((c) => ({part: part.name, text: c.text, startMs: Math.round(start + c.startMs), endMs: Math.round(start + c.endMs)}));
  });
};
export const timelineOf = (list: Part[]) => list.map(({name, frames}) => ({name, frames}));
export const lengthOf = (list: Part[]) => list.reduce((n, x) => n + x.frames, 0);

// Progress of the whole episode along the bottom edge (user 2026-11-02): a thin gold line with a tick at every
// part boundary. Drawn outside the zoomed stage so the zoom never crops it.
const Progress: FC<{starts: number[]; total: number}> = ({starts, total}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{pointerEvents: 'none'}}>
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 5, background: 'rgba(241,231,210,.14)'}}>
      <div style={{height: '100%', width: `${Math.min(1, frame / total) * 100}%`, background: GOLD}} />
      {starts.slice(1).map((s) => <div key={s} style={{position: 'absolute', left: `${s / total * 100}%`, bottom: 0, width: 2, height: 11, translate: '-1px 0', background: frame >= s ? GOLD : 'rgba(241,231,210,.45)'}} />)}
    </div>
  </AbsoluteFill>;
};

// Very quiet music under the narrated parts (user 2026-11-02), from the first part after the series intro to the end
// of the last body part. Volume follows the narration, averaged over ±8 frames, computed once and passed as a number
// for the current frame: a volume callback is a new prop on every render and sent the Studio player into
// "Maximum update depth exceeded".
const BodyMusic: FC<{list: Part[]; starts: number[]; music: BodyMusicConfig}> = ({list, starts, music}) => {
  const body = list.map((x, i) => ({...x, start: starts[i]})).filter((x) => x.speaking);
  const from = body.length ? body[0].start : 0, to = body.length ? body[body.length - 1].start + body[body.length - 1].frames : 0;
  const frame = useCurrentFrame();
  const key = body.map((b) => `${b.name}:${b.start}:${b.frames}`).join('|');
  const volumes = useMemo(() => {
    const n = Math.max(0, to - from), on = new Float32Array(n);
    for (const b of body) for (let f = 0; f < b.frames; f++) if (b.speaking?.(f)) on[b.start - from + f] = 1;
    const out = new Float32Array(n);let sum = 0;
    for (let i = -8; i < n; i++) {
      if (i + 8 < n) sum += on[i + 8];
      if (i - 9 >= 0) sum -= on[i - 9];
      if (i >= 0) out[i] = music.pauseVolume - (music.pauseVolume - music.speechVolume) * (sum / 17);
    }
    return out;
  }, [key, music.pauseVolume, music.speechVolume]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!body.length) return null;
  const title = `${music.credit.artists.join(', ')} – ${music.credit.title}`;
  return <Track name={`Nhạc nền nội dung · ${title} · rất nhỏ, chỉnh đầu/cuối trong Edit`}>
    <MusicFade fadeInSeconds={music.fadeInSeconds} fadeOutSeconds={music.fadeOutSeconds}>
      <Audio name={`${title} (nhạc nền nội dung)`} src={staticFile(music.file)} from={from} durationInFrames={to - from}
        volume={volumes[Math.min(volumes.length - 1, Math.max(0, frame - from))] ?? music.pauseVolume} playbackRate={music.playbackRate} loop />
    </MusicFade>
  </Track>;
};

// The episode on screen: parts in order on a slightly zoomed stage, the body music and the progress line.
export const EpisodeStage: FC<{list: Part[]; music: BodyMusicConfig}> = ({list, music}) => {
  const starts = list.reduce<number[]>((acc, x) => [...acc, acc[acc.length - 1] + x.frames], [0]);
  return <AbsoluteFill>
    <AbsoluteFill
      style={{
        background: '#0d1411',
        scale: 1.045
      }}
    >
      {list.map((part, i) => <Sequence key={part.name} name={part.name} from={starts[i]} durationInFrames={part.frames}>{part.node}</Sequence>)}
    </AbsoluteFill>
    <BodyMusic list={list} starts={starts} music={music} />
    <Progress starts={starts.slice(0, -1)} total={starts[starts.length - 1]} />
  </AbsoluteFill>;
};
