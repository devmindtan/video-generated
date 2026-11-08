import type {FC} from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Easing, Track, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CalculateMetadataFunction} from 'remotion';
import '../../shared/stoic-fonts';
import {MusicFade} from '../../shared/MusicFade';
import {Backdrop, Captions, GOLD, INK, IVORY, Visualizer, clamp, ease} from './Intro';
import type {Voice} from './Intro';
import music from './music.json';

// Episode opening from episode 3 on (user 2026-11-08): no series intro. The episode's own screen ("TẬP NN · book ·
// author") runs on the series intro music for a few seconds, then the voice comes in with a hook for the episode.
// The music sits at the intro level during the lead, glides down under the voice as it starts and fades out at the
// part's end; "Cách làm" and the body follow with the quiet body music.
export type HookCardProps = {voice: string; channelLabel: string; episodeLabel: string; bookTitle: string; bookAuthor: string; takes: Voice[]; leadSeconds?: number};

export const HOOK_LEAD_SECONDS = 7;
const TAIL_SECONDS = 1.2, GLIDE_SECONDS = 2.5;
const voiceOf = (id: string, list: Voice[]) => list.find((v) => v.id === id) ?? list[0];

export const hookFrames = (voice: string, takes: Voice[], fps = 30, lead = HOOK_LEAD_SECONDS) => Math.ceil((lead + (voiceOf(voice, takes)?.durationSeconds ?? 20) + TAIL_SECONDS) * fps);
export const hookCaptions = (voice: string, takes: Voice[], lead = HOOK_LEAD_SECONDS) => (voiceOf(voice, takes)?.captions ?? []).map((c) => ({...c, startMs: c.startMs + lead * 1000, endMs: c.endMs + lead * 1000}));
export const hookCardMetadata: CalculateMetadataFunction<HookCardProps> = ({props}) => ({durationInFrames: hookFrames(props.voice, props.takes, 30, props.leadSeconds)});

export const BookInsightsHookCard: FC<HookCardProps> = ({voice: voiceId, channelLabel, episodeLabel, bookTitle, bookAuthor, takes, leadSeconds = HOOK_LEAD_SECONDS}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const voice = voiceOf(voiceId, takes);
  const start = Math.round(leadSeconds * fps), local = frame - start, end = start + (voice?.frames ?? 0);
  const speaking = Boolean(voice) && local >= 0 && local < voice!.frames;
  const bands = speaking ? voice!.bands[local] : new Array(32).fill(0);
  const level = speaking ? voice!.level[local] / 100 : 0;
  // The screen builds slowly while only the music plays: label, then the title, the rule, the author.
  const labelIn = interpolate(frame, [.8 * fps, 1.8 * fps], [0, 1], clamp);
  const titleIn = interpolate(frame, [1.4 * fps, 3.4 * fps], [0, 1], {...clamp, easing: ease});
  const ruleIn = interpolate(frame, [2.8 * fps, 3.8 * fps], [0, 1], {...clamp, easing: ease});
  const authorIn = interpolate(frame, [3.4 * fps, 4.6 * fps], [0, .85], clamp);
  const lower = interpolate(frame, [start - .6 * fps, start, end, end + .5 * fps], [0, 1, 1, 0], clamp);
  const fadeOut = interpolate(frame, [durationInFrames - .8 * fps, durationInFrames], [1, 0], clamp);
  // Intro level during the lead, then down to the intro's quiet bed just before the first word.
  const musicLevel = interpolate(frame, [start - GLIDE_SECONDS * fps, start], [music.pauseVolume, music.lowerToVolume], {...clamp, easing: Easing.inOut(Easing.sin)});
  return <AbsoluteFill style={{background: INK, fontFamily: 'Stoic Sans, sans-serif', overflow: 'hidden'}}>
    <AbsoluteFill style={{opacity: fadeOut}}>
      <Backdrop frame={frame} fps={fps} durationInFrames={durationInFrames} />
      <div style={{position: 'absolute', top: 104, left: 0, right: 0, textAlign: 'center', color: GOLD, fontSize: 22, fontWeight: 700, letterSpacing: 8, opacity: labelIn}}>{channelLabel}</div>
      <div style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center'}}>
        <div style={{color: GOLD, fontSize: 28, fontWeight: 700, letterSpacing: 10, opacity: labelIn}}>{episodeLabel}</div>
        <div style={{margin: '26px auto 0', maxWidth: 1400, color: IVORY, fontSize: bookTitle.length > 22 ? 92 : 112, lineHeight: 1.12, fontWeight: 700, letterSpacing: interpolate(titleIn, [0, 1], [18, 1]), opacity: titleIn, textWrap: 'balance', textShadow: '0 6px 30px rgba(0,0,0,.6)'}}>{bookTitle}</div>
        <div style={{margin: '26px auto', width: 120, height: 2, background: GOLD, scale: `${ruleIn} 1`}} />
        <div style={{color: IVORY, fontSize: 38, fontWeight: 400, letterSpacing: 4, opacity: authorIn}}>{bookAuthor}</div>
      </div>
      <div style={{opacity: lower}}>
        <Visualizer bands={bands} level={level} appear={1} />
        {voice ? <Captions captions={voice.captions} ms={local * 1000 / fps} highlight={new RegExp(`(${bookTitle}|${bookAuthor})`, 'gi')} /> : null}
      </div>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.55) 100%)', pointerEvents: 'none'}} />
    </AbsoluteFill>
    {voice ? <Track name={`Mở đầu tập · ${voice.name}`}>
      <Audio src={staticFile(voice.file)} from={start} />
    </Track> : null}
    <Track name="Nhạc mở đầu · Pufino – Enlivening · chỉnh đầu/cuối trong Edit">
      <MusicFade fadeInSeconds={music.fadeInSeconds} fadeOutSeconds={music.fadeOutSeconds}>
        <Audio name="Pufino – Enlivening (freetouse.com)" src={staticFile(music.file)} from={0} durationInFrames={durationInFrames} volume={musicLevel} playbackRate={0.85} />
      </MusicFade>
    </Track>
  </AbsoluteFill>;
};
