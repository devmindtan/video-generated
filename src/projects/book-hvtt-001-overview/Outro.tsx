import type {FC} from 'react';
import type {Caption} from '@remotion/captions';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Easing, Track, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CalculateMetadataFunction} from 'remotion';
import '../../shared/stoic-fonts';
import {MusicFade} from '../../shared/MusicFade';
import {Captions, Dust, Frame, GOLD, Grain, INK, IVORY, OpenBook, Visualizer, clamp, ease} from './Intro';
import type {Voice} from './Intro';
import music from './outro-music.json';
import takes from './outro-takes.json';

// Series outro for "Đọc sách, hiểu mình", same book-plate look as the intro. The comment and subscribe
// cards light up when the narration says "bình luận" / "đăng ký" (caption timing), then "Hẹn gặp lại".
export type BookOutroProps = {voice: string; channelLabel: string; withMusic?: boolean};

const voices = (takes as unknown as {voices: Voice[]}).voices;
const TAIL_SECONDS = 1.6;
const highlight = /(bình luận|đăng ký kênh|động lực|Hẹn gặp lại)/gi;
const voiceOf = (id: string) => voices.find((v) => v.id === id) ?? voices[0];

export const outroFrames = (voice: string, fps = 30) => Math.ceil(((voiceOf(voice)?.durationSeconds ?? 15) + TAIL_SECONDS) * fps);
export const bookOutroMetadata: CalculateMetadataFunction<BookOutroProps> = ({props}) => ({durationInFrames: outroFrames(props.voice)});

// Moment (ms) a word is spoken: start of the caption page that contains it.
const spokenAt = (captions: Caption[], word: RegExp) => captions.find((c) => word.test(c.text))?.startMs ?? Infinity;

const musicVolume = (captions: Caption[], frame: number, fps: number) => {
  const ms = frame * 1000 / fps;
  const activity = Math.max(0, ...captions.map((c) => interpolate(ms, [c.startMs - 120, c.startMs, c.endMs, c.endMs + 250], [0, 1, 1, 0], clamp)));
  const base = music.pauseVolume - (music.pauseVolume - music.speechVolume) * activity;
  // Louder opening, then a glide down to the quiet bed (outro-music.json lowerFrom/Over/ToVolume), like the intro.
  return Math.min(base, interpolate(frame, [music.lowerFromSeconds * fps, (music.lowerFromSeconds + music.lowerOverSeconds) * fps], [base, music.lowerToVolume], {...clamp, easing: Easing.inOut(Easing.sin)}));
};

const BubbleIcon: FC = () => <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16v11H9l-5 4z" /><path d="M8 9.5h8M8 12.5h5" /></svg>;
const BellIcon: FC = () => <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></svg>;

// Two identical pills: same size, one line, no scaling; lighting only changes fill and glow.
const CallCard: FC<{icon: FC; label: string; lit: number}> = ({icon: Icon, label, lit}) => <div style={{
  width: 560, height: 124, borderRadius: 62, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, whiteSpace: 'nowrap',
  border: `2px solid ${GOLD}`, color: lit > .5 ? INK : GOLD, background: `rgba(217,181,111,${lit * .95})`,
  boxShadow: `0 0 ${16 + lit * 40}px rgba(217,181,111,${.12 + lit * .35})`,
}}>
  <Icon /><span style={{fontSize: 38, fontWeight: 700, letterSpacing: 1}}>{label}</span>
</div>;

// Music fades follow this composition's edges, which inside the episode's Sequence are the outro's own edges.
export const BookInsightsOutro: FC<BookOutroProps> = ({voice: voiceId, channelLabel, withMusic = true}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const voice = voiceOf(voiceId);
  const captions = voice?.captions ?? [];
  const ms = frame * 1000 / fps;
  const i = Math.min(frame, (voice?.frames ?? 1) - 1);
  const bands = voice && frame < voice.frames ? voice.bands[i] : new Array(32).fill(0);
  const level = voice && frame < voice.frames ? voice.level[i] / 100 : 0;
  // The selected take still says “comment”; the approved script now says “bình luận”. Keep both takes visual-safe
  // until the replacement narration has passed listening review.
  const comment = spokenAt(captions, /bình luận|comment/i), subscribe = spokenAt(captions, /đăng ký/i), goodbye = spokenAt(captions, /Hẹn gặp lại/i);
  const cardsIn = interpolate(ms, [comment - 700, comment - 100], [0, 1], {...clamp, easing: ease}) * interpolate(ms, [goodbye - 500, goodbye - 100], [1, 0], clamp);
  // Each card lights when its word is spoken and stays lit, so both end the same.
  const commentLit = interpolate(ms, [comment, comment + 300], [0, 1], clamp);
  const subscribeLit = interpolate(ms, [subscribe, subscribe + 300], [0, 1], clamp);
  const titleIn = interpolate(frame, [.4 * fps, 1.8 * fps], [0, 1], {...clamp, easing: ease}) * interpolate(ms, [comment - 900, comment - 300], [1, 0], clamp);
  const bye = interpolate(ms, [goodbye - 100, goodbye + 700], [0, 1], {...clamp, easing: ease});
  const fadeOut = interpolate(frame, [durationInFrames - .9 * fps, durationInFrames], [1, 0], clamp);
  return <AbsoluteFill style={{background: INK, fontFamily: 'Stoic Sans, sans-serif', overflow: 'hidden'}}>
    <AbsoluteFill style={{opacity: fadeOut}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 60% at 50% 42%, #22302a 0%, ${INK} 62%, #070b09 100%)`}} />
      <AbsoluteFill style={{background: 'linear-gradient(115deg, transparent 30%, rgba(217,181,111,.07) 48%, transparent 62%)', translate: `${interpolate(frame, [0, durationInFrames], [-700, 700])}px 0`}} />
      <Dust frame={frame} />
      <Grain frame={frame} />
      <Frame frame={frame} fps={fps} />
      <div style={{position: 'absolute', top: 104, left: 0, right: 0, textAlign: 'center', color: GOLD, fontSize: 22, fontWeight: 700, letterSpacing: 8, opacity: interpolate(frame, [.6 * fps, 1.4 * fps], [0, 1], clamp)}}>{channelLabel}</div>
      {titleIn > .001 ? <div style={{position: 'absolute', top: 190, left: 0, right: 0, opacity: titleIn}}>
        <OpenBook frame={frame} fps={fps} glow={level} />
        <div style={{marginTop: 30, textAlign: 'center', color: IVORY, fontSize: 92, fontWeight: 700, letterSpacing: interpolate(titleIn, [0, 1], [22, 8]), textShadow: '0 6px 30px rgba(0,0,0,.6)'}}>ĐỌC SÁCH, HIỂU MÌNH</div>
      </div> : null}
      {/* Blocks that share the upper area are unmounted when invisible, so nothing half-faded overlaps. */}
      {cardsIn > .001 ? <div style={{position: 'absolute', top: 360, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 48, opacity: cardsIn, translate: `0 ${(1 - cardsIn) * 24}px`}}>
        <CallCard icon={BubbleIcon} label="Bình luận bên dưới" lit={commentLit} />
        <CallCard icon={BellIcon} label="Đăng ký kênh" lit={subscribeLit} />
      </div> : null}
      {bye > .001 ? <div style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', opacity: bye, translate: `0 ${(1 - bye) * 18}px`}}>
        <div style={{color: IVORY, fontSize: 120, fontWeight: 700, letterSpacing: interpolate(bye, [0, 1], [30, 10]), textShadow: '0 6px 30px rgba(0,0,0,.6)'}}>HẸN GẶP LẠI</div>
        <div style={{margin: '30px auto 0', width: 560, display: 'flex', alignItems: 'center', gap: 18}}>
          <div style={{flex: 1, height: 1.5, background: `linear-gradient(90deg, transparent, ${GOLD})`}} />
          <div style={{width: 12, height: 12, rotate: '45deg', background: GOLD}} />
          <div style={{flex: 1, height: 1.5, background: `linear-gradient(90deg, ${GOLD}, transparent)`}} />
        </div>
        <div style={{marginTop: 26, color: GOLD, fontSize: 30, fontWeight: 700, letterSpacing: 8}}>ĐỌC SÁCH, HIỂU MÌNH</div>
      </div> : null}
      <div style={{opacity: interpolate(ms, [goodbye + 1200, goodbye + 2000], [1, .35], clamp)}}>
        <Visualizer bands={bands} level={level} appear={interpolate(frame, [.3 * fps, 1 * fps], [0, 1], clamp)} />
        <Captions captions={captions} ms={ms} highlight={highlight} />
      </div>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.55) 100%)', pointerEvents: 'none'}} />
    </AbsoluteFill>
    {voice ? <Track name={`Giọng · ${voice.name}`}>
      <Audio src={staticFile(voice.file)} from={0} />
    </Track> : null}
    {withMusic ? <Track name="Nhạc outro · Pufino – Enlivening · chỉnh đầu/cuối trong Edit">
      <MusicFade fadeInSeconds={music.fadeInSeconds} fadeOutSeconds={music.fadeOutSeconds}>
        <Audio
          name="Pufino – Enlivening (freetouse.com)"
          src={staticFile(music.file)}
          from={0}
          durationInFrames={durationInFrames}
          volume={musicVolume(captions, frame, fps)}
          playbackRate={0.85}
        />
      </MusicFade>
    </Track> : null}
  </AbsoluteFill>;
};
