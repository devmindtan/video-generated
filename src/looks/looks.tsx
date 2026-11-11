import type {FC, ReactNode} from 'react';
import {AbsoluteFill, interpolate, random} from 'remotion';
import '../shared/stoic-fonts';
import themesData from './themes.json';
import stylesData from './animation-styles.json';

// Visual themes and 2D animation styles shared by every video (user 2026-11-10): a project picks one of each
// (series.json project "look": {"theme", "style"}), the manager's Chủ đề hình ảnh / Phong cách animation pages edit
// and preview them, and compositions read the tokens here instead of hard-coding colours.
export type Palette = {background: string; surface: string; ink: string; muted: string; accent: string; accent2: string};
export type Theme = {id: string; name: string; mood: string; description: string; topics: string[]; formats: string[]; palette: Palette;
  texture: 'grain' | 'paper' | 'chalk' | 'glow' | 'marble' | 'grid' | 'none'; stroke: {color: keyof Palette; width: number};
  caption: {text: keyof Palette; keyword: keyof Palette; box: boolean}; music: string; styles: string[]; sample: {caption: string; keyword: string}};
export type AnimationStyle = {id: string; name: string; summary: string; bestFor: string[]; techniques: string[]; pace: string; effort: number; sample: string};

export const themes = themesData.themes as Theme[];
export const animationStyles = stylesData.styles as AnimationStyle[];
export const themeOf = (id: string) => themes.find((t) => t.id === id) ?? themes[0];
export const strokeOf = (t: Theme) => t.palette[t.stroke.color];
export const FONT = 'Stoic Sans, sans-serif';

// The theme's ground: colour plus its texture, drawn from the frame so preview and render agree.
export const ThemeBackground: FC<{theme: Theme; frame: number}> = ({theme: t, frame}) => {
  const p = t.palette;
  return <AbsoluteFill style={{background: p.background}}>
    {t.texture === 'grain' ? <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 55% at 50% 42%, ${p.surface} 0%, ${p.background} 70%)`}} /> : null}
    {t.texture === 'glow' ? <AbsoluteFill style={{background: `radial-gradient(circle at 50% ${40 + Math.sin(frame / 40) * 3}%, ${p.surface} 0%, ${p.background} 62%)`}} /> : null}
    {t.texture === 'paper' ? <AbsoluteFill style={{background: `repeating-linear-gradient(8deg, transparent 0 7px, ${p.surface}55 7px 8px), radial-gradient(ellipse at 50% 40%, transparent 40%, ${p.surface} 100%)`}} /> : null}
    {t.texture === 'chalk' ? <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 70% at 50% 45%, ${p.surface} 0%, ${p.background} 80%)`}} /> : null}
    {t.texture === 'grid' ? <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 60% at 50% 45%, ${p.surface} 0%, ${p.background} 75%)`}}>
      <AbsoluteFill style={{backgroundImage: `linear-gradient(${p.accent2}14 1px, transparent 1px), linear-gradient(90deg, ${p.accent2}14 1px, transparent 1px), linear-gradient(${p.accent2}0a 1px, transparent 1px), linear-gradient(90deg, ${p.accent2}0a 1px, transparent 1px)`,
        backgroundSize: '120px 120px, 120px 120px, 24px 24px, 24px 24px'}} />
    </AbsoluteFill> : null}
    {t.texture === 'marble' ? <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 22% at 30% 28%, ${p.surface}99, transparent 70%), radial-gradient(ellipse 50% 18% at 72% 66%, ${p.surface}88, transparent 70%), radial-gradient(ellipse at 40% 30%, #ffffff44, transparent 60%)`}} /> : null}
    {t.texture === 'grain' || t.texture === 'chalk' || t.texture === 'paper' ? <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: .5}}>
      {Array.from({length: 90}, (_, i) => <circle key={i} cx={`${random(`x${i}`) * 100}%`} cy={`${random(`y${i}`) * 100}%`} r={1 + random(`r${i}`) * 1.4} fill={p.muted} opacity={.18 + .12 * Math.sin((frame + i * 7) / 9)} />)}
    </svg> : null}
  </AbsoluteFill>;
};

// One caption line in the theme's caption style; keyword in its colour (box: a solid strip behind the keyword).
export const ThemeCaption: FC<{theme: Theme; text: string; keyword?: string; top?: number; size?: number; opacity?: number}> = ({theme: t, text, keyword = '', top = 1400, size = 64, opacity = 1}) => {
  const p = t.palette, i = keyword ? text.indexOf(keyword) : -1;
  const parts = i < 0 ? [text] : [text.slice(0, i), keyword, text.slice(i + keyword.length)];
  return <div style={{position: 'absolute', left: 90, right: 90, top, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: size, lineHeight: 1.3, color: p[t.caption.text], opacity, textWrap: 'balance'}}>
    {parts.map((s, k) => k === 1 ? <span key={k} style={{color: t.caption.box ? p.background : p[t.caption.keyword], background: t.caption.box ? p[t.caption.keyword] : undefined, padding: t.caption.box ? '0 .18em' : undefined}}>{s}</span> : <span key={k}>{s}</span>)}
  </div>;
};

// Vertical sample frame for the style library: theme ground, a title, the drawing area and a caption.
export const SampleFrame: FC<{theme: Theme; frame: number; label: string; children: ReactNode; caption?: boolean}> = ({theme: t, frame, label, children, caption = true}) =>
  <AbsoluteFill style={{fontFamily: FONT, overflow: 'hidden'}}>
    <ThemeBackground theme={t} frame={frame} />
    <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0}}>{children}</svg>
    <div style={{position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center', color: t.palette.accent, fontSize: 34, fontWeight: 700, letterSpacing: 6, textShadow: `0 2px 12px ${t.palette.background}`}}>{label}</div>
    {caption ? <ThemeCaption theme={t} text={t.sample.caption} keyword={t.sample.keyword} opacity={interpolate(frame, [20, 34], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} /> : null}
  </AbsoluteFill>;
