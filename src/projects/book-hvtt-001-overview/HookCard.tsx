import type {FC} from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Easing, Track, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
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

// After p9 (user 2026-11-08: "không có 1 tí mượt mà… ngắt ngang cái vào chào mọi người", "tăng nhạc lên tầm 15s đầu",
// "cuối Đắc nhân tâm tăng âm lượng nhạc to lên tầm 5 giây rồi chuyển nhẹ nhàng"): the music runs about 15 s, fades out
// slowly and leaves a clear quiet before the greeting (QUIET + VOICE_GAP); after the last sentence the body music
// swells for a few seconds (hookMusic) and settles again before the first body part.
// User 2026-11-09 after p13: "phần đầu chạy nhạc giảm 2s là ổn" → 13 s.
export const HOOK_LEAD_SECONDS = 13;
const MUSIC_OUT_SECONDS = 4, QUIET_SECONDS = 1.1, VOICE_GAP_SECONDS = .5;
const SWELL_DELAY = .4, SWELL_UP = 1.4, SWELL_HOLD = 3.2, SWELL_DOWN = 2.4, TAIL_SECONDS = SWELL_DELAY + SWELL_UP + SWELL_HOLD + SWELL_DOWN + .6;
const voiceOf = (id: string, list: Voice[]) => list.find((v) => v.id === id) ?? list[0];

export const hookLeadFrames = (fps = 30, lead = HOOK_LEAD_SECONDS) => Math.round(lead * fps);
const gapFrames = (fps: number) => Math.round(VOICE_GAP_SECONDS * fps);
const voiceLength = (voice: string, takes: Voice[], fps: number) => Math.round((voiceOf(voice, takes)?.durationSeconds ?? 20) * fps);
export const hookVoiceFrames = (voice: string, takes: Voice[], fps = 30) => gapFrames(fps) + voiceLength(voice, takes, fps) + Math.round(TAIL_SECONDS * fps);
export const hookFrames = (voice: string, takes: Voice[], fps = 30, lead = HOOK_LEAD_SECONDS) => hookLeadFrames(fps, lead) + hookVoiceFrames(voice, takes, fps);
// Caption pages of the voice section in its own time (the voice starts VOICE_GAP into the section).
export const hookCaptions = (voice: string, takes: Voice[], fps = 30) => {
  const shift = gapFrames(fps) * 1000 / fps;
  const move = <T extends {startMs: number; endMs: number}>(x: T): T => ({...x, startMs: x.startMs + shift, endMs: x.endMs + shift});
  return (voiceOf(voice, takes)?.captions ?? []).map((c) => ({...move(c), words: c.words?.map(move)}));
};
export const hookSpeaking = (voice: string, takes: Voice[], frame: number, fps: number) => {
  const ms = frame * 1000 / fps;
  return hookCaptions(voice, takes, fps).some((c) => ms >= c.startMs && ms < c.endMs);
};
// Body-music volume over the voice section's tail: up to swell, held, back down to the pause level; undefined
// elsewhere (the usual speech/pause levels apply).
export const hookMusic = (voice: string, takes: Voice[], frame: number, fps: number, m: {pauseVolume: number; speechVolume: number; hookSwellVolume?: number}) => {
  const t = (frame - gapFrames(fps) - voiceLength(voice, takes, fps)) / fps - SWELL_DELAY;
  if (t < 0) return undefined;
  const swell = m.hookSwellVolume ?? .3, s = (x: number) => .5 - Math.cos(Math.PI * Math.min(1, Math.max(0, x))) / 2;
  if (t < SWELL_UP) return m.speechVolume + (swell - m.speechVolume) * s(t / SWELL_UP);
  if (t < SWELL_UP + SWELL_HOLD) return swell;
  return swell + (m.pauseVolume - swell) * s((t - SWELL_UP - SWELL_HOLD) / SWELL_DOWN);
};

export const BookInsightsHookCard: FC<HookCardProps> = ({voice: voiceId, channelLabel, episodeLabel, bookTitle, bookAuthor, takes, leadSeconds = HOOK_LEAD_SECONDS, section}) => {
  const own = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const lead = hookLeadFrames(fps, leadSeconds);
  // Screen time: the voice section continues the lead's screen where it stopped.
  const frame = section === 'voice' ? own + lead : own;
  const voice = voiceOf(voiceId, takes);
  const voiceStart = lead + gapFrames(fps), local = frame - voiceStart, end = voiceStart + (voice?.frames ?? 0);
  const speaking = Boolean(voice) && local >= 0 && local < voice!.frames;
  const bands = speaking ? voice!.bands[local] : new Array(32).fill(0);
  const level = speaking ? voice!.level[local] / 100 : 0;
  // The screen builds slowly while only the music plays: label, then the title, the rule, the author.
  const labelIn = interpolate(frame, [1.2 * fps, 2.6 * fps], [0, 1], clamp);
  const titleIn = interpolate(frame, [2.2 * fps, 5 * fps], [0, 1], {...clamp, easing: ease});
  const ruleIn = interpolate(frame, [4.4 * fps, 5.6 * fps], [0, 1], {...clamp, easing: ease});
  const authorIn = interpolate(frame, [5.2 * fps, 6.8 * fps], [0, .85], clamp);
  const lower = interpolate(frame, [voiceStart - .8 * fps, voiceStart, end, end + .8 * fps], [0, 1, 1, 0], clamp);
  const fadeOut = section === 'lead' ? 1 : interpolate(own, [durationInFrames - 1.6 * fps, durationInFrames], [1, 0], {...clamp, easing: Easing.inOut(Easing.sin)});
  // Intro level while the screen builds, then a slow fade that ends in a clear quiet before the greeting.
  const musicEnd = lead - Math.round(QUIET_SECONDS * fps);
  const musicLevel = interpolate(own, [musicEnd - MUSIC_OUT_SECONDS * fps, musicEnd], [music.pauseVolume, 0], {...clamp, easing: Easing.inOut(Easing.sin)});
  return <AbsoluteFill style={{background: INK, fontFamily: 'Stoic Sans, sans-serif', overflow: 'hidden'}}>
    {/* The background stays; only the screen's text and voice meter fade, so the next part takes over without a dip. */}
    <Backdrop frame={frame} fps={fps} durationInFrames={hookFrames(voiceId, takes, fps, leadSeconds)} />
    <AbsoluteFill style={{opacity: fadeOut}}>
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
      <Audio src={staticFile(voice.file)} from={section === 'voice' ? gapFrames(fps) : voiceStart} />
    </Track> : null}
    {section !== 'voice' ? <Track name="Nhạc mở đầu · Pufino – Enlivening · chỉ phần chưa có lời">
      <MusicFade fadeInSeconds={music.fadeInSeconds} fadeOutSeconds={0}>
        <Audio name="Pufino – Enlivening (freetouse.com)" src={staticFile(music.file)} from={0} durationInFrames={musicEnd} volume={musicLevel} playbackRate={0.85} />
      </MusicFade>
    </Track> : null}
  </AbsoluteFill>;
};
