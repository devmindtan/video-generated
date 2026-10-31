import React from 'react';
import type {FC, ReactNode} from 'react';
import type {Caption} from '@remotion/captions';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Sequence, Track, interpolate, staticFile, useCurrentFrame, useVideoConfig, type CalculateMetadataFunction} from 'remotion';
import '../../shared/stoic-fonts';
import {MusicFade} from '../../shared/MusicFade';
import type {ArtProps} from './art/common';
import {LedgerArt} from './art/Ledger';
import {HourglassArt} from './art/Hourglass';
import {DryWellArt} from './art/DryWell';
import {ForkArt} from './art/Fork';
import {ValleyArt} from './art/Valley';
import captionsData from './captions.json';
import music from './music.json';
import timeline from './timeline.json';

// Timing comes from the narration (timeline.json, written by scripts/projects/know-when-to-quit/build-voice.py):
// scene starts, lengths and the composition duration follow the voice, not fixed seconds.
const GOLD = '#dcb777';
const IVORY = '#f2ede3';
const BG = '#08070a';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const captions = captionsData as Caption[][];
const FADE = 0.45;

export const knowWhenToQuitMetadata: CalculateMetadataFunction<Record<string, unknown>> = () => ({durationInFrames: Math.round(timeline.totalSeconds * timeline.fps)});

export const knowWhenToQuitMusicVolume = (frame: number, fps: number) => {
  const seconds = frame / fps;
  const activity = Math.max(0, ...captions.flatMap((group, i) => group.map((c) => {
    const a = timeline.scenes[i].start + c.startMs / 1000;
    const b = timeline.scenes[i].start + c.endMs / 1000;
    return interpolate(seconds, [a - .1, a, b, b + .2], [0, 1, 1, 0], clamp);
  })));
  return music.pauseVolume - (music.pauseVolume - music.speechVolume) * activity;
};

// Per scene: the illustration, how far it sits up the frame so its subject clears the headline, and the copy.
const SCENES: {Art: FC<ArtProps>; shift: number; label: string; headline: ReactNode}[] = [
  {Art: LedgerArt, shift: -170, label: 'KIÊN TRÌ HAY TIẾC CÔNG?', headline: <>Tiếc công<br /><span style={{color: GOLD}}>không phải kiên trì.</span></>},
  {Art: HourglassArt, shift: -30, label: 'THỜI GIAN KHÔNG QUAY LẠI', headline: <>Đã bỏ ra.<br /><span style={{color: GOLD}}>Không lấy lại.</span></>},
  {Art: DryWellArt, shift: -90, label: 'ĐÚNG SỨC, SAI CHỖ', headline: <>Đào sâu hơn<br /><span style={{color: GOLD}}>vẫn không ra nước.</span></>},
  {Art: ForkArt, shift: -10, label: 'MỘT CÂU HỎI', headline: <>Chọn lại từ đầu,<br /><span style={{color: GOLD}}>bạn còn chọn nó?</span></>},
  {Art: ValleyArt, shift: -200, label: 'BIẾT DỪNG CŨNG LÀ DŨNG CẢM', headline: <>Đặt xẻng xuống.<br /><span style={{color: GOLD}}>Đi tìm chỗ khác.</span></>},
];

const Scene: FC<{index: number; duration: number}> = ({index, duration}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {Art, shift, label, headline} = SCENES[index];
  const last = index === SCENES.length - 1;
  const page = captions[index]?.find((c) => frame * 1000 / fps >= c.startMs && frame * 1000 / fps < c.endMs);
  const captionParts = page?.text.split(/(tiếc công|kiên trì|quán ăn lỗ|lỡ rồi|không lấy lại|sai chỗ|không ra nước|thêm mệt|bắt đầu|thông tin|thất bại|nhìn rõ|cái xẻng|chỗ khác)/gi) ?? [];
  const fadeIn = index === 0 ? 1 : interpolate(frame, [0, FADE * fps], [0, 1], clamp);
  const fadeOut = last ? interpolate(frame, [duration - 1.2 * fps, duration - 1], [1, 0], clamp) : 1;
  const copyIn = interpolate(frame, [0.2 * fps, 0.8 * fps], [0, 1], clamp);
  return <AbsoluteFill style={{background: BG, overflow: 'hidden', opacity: fadeIn * fadeOut}}>
    <div style={{position: 'absolute', top: shift, left: 0, width: 1080, height: 1300}}>
      <Art frame={frame} duration={duration} fps={fps} />
    </div>
    <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(8,7,10,.35) 0%, transparent 14%, transparent 44%, rgba(8,7,10,.9) 60%, ${BG} 70%)`}} />
    <div style={{position: 'absolute', top: 110, left: 84, fontSize: 24, letterSpacing: 4, color: GOLD, fontWeight: 700}}>STOIC · BIẾT DỪNG</div>
    <div style={{position: 'absolute', top: 1090, left: 84, right: 110, opacity: copyIn}}>
      <div style={{color: GOLD, fontSize: 24, letterSpacing: 3, marginBottom: 22, fontWeight: 700}}>{label}</div>
      <div style={{color: IVORY, fontSize: 84, fontWeight: 700, lineHeight: 1.14, letterSpacing: -2}}>{headline}</div>
      <div style={{marginTop: 30, width: 100, height: 3, background: GOLD}} />
    </div>
    <div data-testid="know-when-to-quit-caption" style={{position: 'absolute', top: 1520, left: 88, right: 128, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: IVORY, fontFamily: 'Stoic Sans, sans-serif', fontSize: 44, fontWeight: 700, lineHeight: 1.4, textAlign: 'center', textShadow: '0 3px 15px #000'}}>
      <div style={{width: '100%'}}>{captionParts.map((part, i) => <span key={i} style={{color: i % 2 === 1 ? GOLD : undefined}}>{part}</span>)}</div>
    </div>
  </AbsoluteFill>;
};

export const KnowWhenToQuitVideo: FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  return <AbsoluteFill style={{background: BG, fontFamily: 'Stoic Sans, sans-serif'}}>
    {/* Code-drawn illustrations (image-prompts.md); each scene overlaps the next by FADE seconds for a cross-dissolve. */}
    {timeline.scenes.map((s, i) => {
      const from = Math.round(s.start * fps), length = Math.round(s.duration * fps) + (i < timeline.scenes.length - 1 ? Math.round(FADE * fps) : 0);
      return <Sequence key={s.id} name={`${s.id} · cảnh ${s.scene}`} from={from} durationInFrames={Math.min(length, durationInFrames - from)}><Scene index={i} duration={length} /></Sequence>;
    })}
    <Track name="Clone mushashi +1 bán cung · tốc độ gốc 1×">
      {timeline.scenes.map((s) => <Audio key={s.id} name={s.id} from={Math.round(s.start * fps)} src={staticFile(s.audio)} volume={1} />)}
    </Track>
    <Track name="snowfall · Chỉnh đầu/cuối trong Edit">
      <MusicFade fadeInSeconds={music.fadeInSeconds} fadeOutSeconds={music.fadeOutSeconds}>
        <Audio
          name="snowfall · Chỉnh trực tiếp trong Edit"
          src={staticFile(music.file)}
          from={0}
          trimBefore={24.9 * fps}
          durationInFrames={durationInFrames}
          volume={knowWhenToQuitMusicVolume(frame, fps)}
        />
      </MusicFade>
    </Track>
  </AbsoluteFill>;
};
