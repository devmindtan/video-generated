import type {FC} from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Track, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '../../shared/stoic-fonts';
import {MusicFade} from '../../shared/MusicFade';
import {Backdrop, Captions, GOLD, INK, IVORY, Visualizer, clamp, ease} from './Intro';
import type {Voice} from './Intro';
import music from './music.json';

// Episode opening from episode 3 on (user 2026-11-08): no series intro. The episode's own screen ("TẬP NN · book ·
// author") runs on the series intro music alone for a few seconds; the music fades out as the voice comes in with the
// episode's hook, and under the voice only the quiet body music plays, as in every other narrated part (user
// 2026-11-08: "chỉ cần phát nhạc khúc mở thôi, khúc nói thì giảm nhạc nền như cũ").
// In the episode the opening is two parts: 'lead' (music only) and 'voice' (hook, under the body music); the
// standalone Studio composition shows both.
export type HookSection = 'lead' | 'voice';
export type HookCardProps = {voice: string; channelLabel: string; episodeLabel: string; bookTitle: string; bookAuthor: string; takes: Voice[]; leadSeconds?: number; section?: HookSection};

export const HOOK_LEAD_SECONDS = 7;
const TAIL_SECONDS = 1.2, MUSIC_OUT_SECONDS = 1.8;
const voiceOf = (id: string, list: Voice[]) => list.find((v) => v.id === id) ?? list[0];

export const hookLeadFrames = (fps = 30, lead = HOOK_LEAD_SECONDS) => Math.round(lead * fps);
export const hookVoiceFrames = (voice: string, takes: Voice[], fps = 30) => Math.ceil(((voiceOf(voice, takes)?.durationSeconds ?? 20) + TAIL_SECONDS) * fps);
export const hookFrames = (voice: string, takes: Voice[], fps = 30, lead = HOOK_LEAD_SECONDS) => hookLeadFrames(fps, lead) + hookVoiceFrames(voice, takes, fps);
// Caption pages of the voice section in its own time.
export const hookCaptions = (voice: string, takes: Voice[]) => voiceOf(voice, takes)?.captions ?? [];
export const hookSpeaking = (voice: string, takes: Voice[], frame: number, fps: number) => {
  const ms = frame * 1000 / fps;
  return hookCaptions(voice, takes).some((c) => ms >= c.startMs && ms < c.endMs);
};

export const BookInsightsHookCard: FC<HookCardProps> = ({voice: voiceId, channelLabel, episodeLabel, bookTitle, bookAuthor, takes, leadSeconds = HOOK_LEAD_SECONDS, section}) => {
  const own = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const lead = hookLeadFrames(fps, leadSeconds);
  // Screen time: the voice section continues the lead's screen where it stopped.
  const frame = section === 'voice' ? own + lead : own;
  const voice = voiceOf(voiceId, takes);
  const local = frame - lead, end = lead + (voice?.frames ?? 0);
  const speaking = Boolean(voice) && local >= 0 && local < voice!.frames;
  const bands = speaking ? voice!.bands[local] : new Array(32).fill(0);
  const level = speaking ? voice!.level[local] / 100 : 0;
  // The screen builds slowly while only the music plays: label, then the title, the rule, the author.
  const labelIn = interpolate(frame, [.8 * fps, 1.8 * fps], [0, 1], clamp);
  const titleIn = interpolate(frame, [1.4 * fps, 3.4 * fps], [0, 1], {...clamp, easing: ease});
  const ruleIn = interpolate(frame, [2.8 * fps, 3.8 * fps], [0, 1], {...clamp, easing: ease});
  const authorIn = interpolate(frame, [3.4 * fps, 4.6 * fps], [0, .85], clamp);
  const lower = interpolate(frame, [lead - .6 * fps, lead, end, end + .5 * fps], [0, 1, 1, 0], clamp);
  const fadeOut = section === 'lead' ? 1 : interpolate(own, [durationInFrames - .8 * fps, durationInFrames], [1, 0], clamp);
  // Intro level while the screen builds, gone by the first word.
  const musicLevel = interpolate(own, [lead - MUSIC_OUT_SECONDS * fps, lead], [music.pauseVolume, 0], clamp);
  return <AbsoluteFill style={{background: INK, fontFamily: 'Stoic Sans, sans-serif', overflow: 'hidden'}}>
    <AbsoluteFill style={{opacity: fadeOut}}>
      <Backdrop frame={frame} fps={fps} durationInFrames={hookFrames(voiceId, takes, fps, leadSeconds)} />
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
    {voice && section !== 'lead' ? <Track name={`Mở đầu tập · ${voice.name}`}>
      <Audio src={staticFile(voice.file)} from={section === 'voice' ? 0 : lead} />
    </Track> : null}
    {section !== 'voice' ? <Track name="Nhạc mở đầu · Pufino – Enlivening · chỉ phần chưa có lời">
      <MusicFade fadeInSeconds={music.fadeInSeconds} fadeOutSeconds={0}>
        <Audio name="Pufino – Enlivening (freetouse.com)" src={staticFile(music.file)} from={0} durationInFrames={Math.round(lead * .85)} volume={musicLevel} playbackRate={0.85} />
      </MusicFade>
    </Track> : null}
  </AbsoluteFill>;
};
