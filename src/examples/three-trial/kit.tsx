import type {FC, ReactNode} from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import '../../shared/stoic-fonts';

// 3D trial (user request 2026-11-04): the same subject drawn two ways, "Trước" = today's gold line drawing in SVG,
// "Sau" = the same subject in three.js through @remotion/three. Both share this backdrop, caption and timing so the
// only difference is how the subject is rendered. Palette copied from the book-insights episodes (not imported:
// projects are not imported from elsewhere). Everything is driven by useCurrentFrame(); nothing animates by itself.
export const INK = '#0d1411';
export const GOLD = '#d9b56f';
export const IVORY = '#f2ede3';
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ease = Easing.bezier(.16, 1, .3, 1);
export const FPS = 30, SECONDS = 8, FRAMES = FPS * SECONDS;
export const progress = (frame: number, from: number, to: number, easing = ease) => interpolate(frame, [from, to], [0, 1], {...clamp, easing});

const Dust: FC<{frame: number}> = ({frame}) => <>{Array.from({length: 40}, (_, i) => {
  const x = random(`trial-dust-x-${i}`) * 1920, speed = 6 + random(`trial-dust-s-${i}`) * 14;
  const y = 1080 - ((random(`trial-dust-y-${i}`) * 1180 + frame * speed / 30) % 1180), size = 1.5 + random(`trial-dust-r-${i}`) * 3;
  return <div key={i} style={{position: 'absolute', left: x + Math.sin(frame / 40 + i) * 14, top: y, width: size, height: size, borderRadius: '50%', background: GOLD, opacity: .1 + random(`trial-dust-o-${i}`) * .25}} />;
})}</>;

export const Backdrop: FC = () => {
  const frame = useCurrentFrame(), {durationInFrames} = useVideoConfig();
  return <>
    <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 60% at 50% 42%, #22302a 0%, ${INK} 62%, #070b09 100%)`}} />
    <AbsoluteFill style={{background: 'linear-gradient(115deg, transparent 30%, rgba(217,181,111,.07) 48%, transparent 62%)', translate: `${interpolate(frame, [0, durationInFrames], [-700, 700])}px 0`}} />
    <Dust frame={frame} />
  </>;
};

// One caption line in the channel's caption style (Stoic Sans 700, ivory, gold keyword).
export const Caption: FC<{before: string; gold: string; after?: string}> = ({before, gold, after = ''}) => {
  const frame = useCurrentFrame();
  const o = progress(frame, 1.2 * FPS, 1.8 * FPS) * (1 - progress(frame, FRAMES - 12, FRAMES - 1));
  return <div style={{position: 'absolute', left: 260, right: 260, top: 900, textAlign: 'center', color: IVORY, fontFamily: 'Stoic Sans', fontWeight: 700, fontSize: 48, lineHeight: 1.3, opacity: o, textShadow: '0 2px 18px rgba(0,0,0,.6)'}}>
    {before}<span style={{color: GOLD}}>{gold}</span>{after}
  </div>;
};

// Small corner tag so the two versions are never confused while reviewing.
export const Tag: FC<{text: string}> = ({text}) => <div style={{position: 'absolute', left: 80, top: 64, fontFamily: 'Stoic Sans', fontWeight: 700, fontSize: 34, color: GOLD, opacity: .85, letterSpacing: 1}}>{text}</div>;

export const Shot: FC<{tag: string; caption: {before: string; gold: string; after?: string}; children: ReactNode}> = ({tag, caption, children}) =>
  <AbsoluteFill style={{background: INK, overflow: 'hidden'}}>
    <Backdrop />
    {children}
    <Caption {...caption} />
    <Tag text={tag} />
  </AbsoluteFill>;

// Side by side: both versions at half size, same frame, for a direct look.
export const SideBySide: FC<{left: ReactNode; right: ReactNode}> = ({left, right}) => <AbsoluteFill style={{background: '#050806'}}>
  {[left, right].map((node, i) => <div key={i} style={{position: 'absolute', top: 270, left: i * 960, width: 1920, height: 1080, transform: 'scale(.5)', transformOrigin: '0 0', overflow: 'hidden'}}>{node}</div>)}
  <div style={{position: 'absolute', left: 959, top: 270, width: 2, height: 540, background: '#2b3a33'}} />
  {['Trước: nét vẽ 2D', 'Sau: 3D (three.js)'].map((t, i) => <div key={t} style={{position: 'absolute', top: 170, left: i * 960, width: 960, textAlign: 'center', fontFamily: 'Stoic Sans', fontWeight: 700, fontSize: 44, color: i ? GOLD : IVORY}}>{t}</div>)}
</AbsoluteFill>;

// Gold stroke that draws itself between two frames (same idea as the episodes' scene kit).
export const Draw: FC<{d: string; from: number; to: number; width?: number; opacity?: number}> = ({d, from, to, width = 3, opacity = 1}) => {
  const p = progress(useCurrentFrame(), from, to);
  return p <= 0 ? null : <path d={d} fill="none" stroke={GOLD} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" opacity={opacity} pathLength={1} strokeDasharray={p >= 1 ? undefined : `${p} 2`} />;
};
export const Svg: FC<{children: ReactNode}> = ({children}) => <svg viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, filter: 'drop-shadow(0 0 6px rgba(217,181,111,.35))'}}>{children}</svg>;
