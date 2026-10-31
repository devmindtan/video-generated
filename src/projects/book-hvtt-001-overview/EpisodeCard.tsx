import type {FC} from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Track, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CalculateMetadataFunction} from 'remotion';
import '../../shared/stoic-fonts';
import {Backdrop, Captions, GOLD, INK, IVORY, Visualizer, clamp, ease} from './Intro';
import type {Voice} from './Intro';
import takes from './episode-takes.json';

// Per-episode card that follows the series intro: "TẬP NN · book · author" while the narration says which
// book this episode reads. The series intro and outro stay the same for every episode (user 2026-10-31).
export type EpisodeCardProps = {voice: string; channelLabel: string; episodeLabel: string; bookTitle: string; bookAuthor: string};

const voices = (takes as unknown as {voices: Voice[]}).voices;
const LEAD_SECONDS = .5, TAIL_SECONDS = 1.4;
const voiceOf = (id: string) => voices.find((v) => v.id === id) ?? voices[0];

export const cardFrames = (voice: string, fps = 30) => Math.ceil((LEAD_SECONDS + (voiceOf(voice)?.durationSeconds ?? 8) + TAIL_SECONDS) * fps);
export const episodeCardMetadata: CalculateMetadataFunction<EpisodeCardProps> = ({props}) => ({durationInFrames: cardFrames(props.voice)});

export const BookInsightsEpisodeCard: FC<EpisodeCardProps> = ({voice: voiceId, channelLabel, episodeLabel, bookTitle, bookAuthor}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const voice = voiceOf(voiceId);
  const start = Math.round(LEAD_SECONDS * fps), local = frame - start, end = start + (voice?.frames ?? 0);
  const speaking = Boolean(voice) && local >= 0 && local < voice!.frames;
  const bands = speaking ? voice!.bands[local] : new Array(32).fill(0);
  const level = speaking ? voice!.level[local] / 100 : 0;
  const cardIn = interpolate(frame, [0, .9 * fps], [0, 1], {...clamp, easing: ease});
  const lower = interpolate(frame, [.2 * fps, .7 * fps, end, end + .5 * fps], [0, 1, 1, 0], clamp);
  const fadeIn = interpolate(frame, [0, .4 * fps], [0, 1], clamp);
  const fadeOut = interpolate(frame, [durationInFrames - .8 * fps, durationInFrames], [1, 0], clamp);
  return <AbsoluteFill style={{background: INK, fontFamily: 'Stoic Sans, sans-serif', overflow: 'hidden'}}>
    <AbsoluteFill style={{opacity: Math.min(fadeIn, fadeOut)}}>
      {/* The frame is already drawn: this card follows the intro without re-animating the border. */}
      <Backdrop frame={frame} fps={fps} durationInFrames={durationInFrames} drawFrame={false} />
      <div style={{position: 'absolute', top: 104, left: 0, right: 0, textAlign: 'center', color: GOLD, fontSize: 22, fontWeight: 700, letterSpacing: 8}}>{channelLabel}</div>
      <div style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', opacity: cardIn, translate: `0 ${(1 - cardIn) * 18}px`}}>
        <div style={{color: GOLD, fontSize: 28, fontWeight: 700, letterSpacing: 10}}>{episodeLabel}</div>
        <div style={{marginTop: 26, color: IVORY, fontSize: 112, fontWeight: 700, letterSpacing: 1, textShadow: '0 6px 30px rgba(0,0,0,.6)'}}>{bookTitle}</div>
        <div style={{margin: '26px auto', width: 120, height: 2, background: GOLD}} />
        <div style={{color: IVORY, fontSize: 38, fontWeight: 400, letterSpacing: 4, opacity: .85}}>{bookAuthor}</div>
      </div>
      <div style={{opacity: lower}}>
        <Visualizer bands={bands} level={level} appear={1} />
        {voice ? <Captions captions={voice.captions} ms={local * 1000 / fps} highlight={new RegExp(`(${bookTitle}|${bookAuthor})`, 'gi')} /> : null}
      </div>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.55) 100%)', pointerEvents: 'none'}} />
    </AbsoluteFill>
    {voice ? <Track name={`Giới thiệu tập · ${voice.name}`}>
      <Audio src={staticFile(voice.file)} from={start} />
    </Track> : null}
  </AbsoluteFill>;
};
