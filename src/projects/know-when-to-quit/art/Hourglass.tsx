import React from 'react';
import type {FC} from 'react';
import {interpolate} from 'remotion';
import {Canvas, Grain, Motes, seeded, W, H, type ArtProps} from './common';

// Scene 2: a brass hourglass on a stone ledge; the last grains keep falling and the top empties.
const CX = 540, TOP = 300, BOT = 900, NECK = 600;
// One glass bulb outline (top half mirrored for the bottom).
const bulb = `M${CX - 170},${TOP + 40} C${CX - 180},${TOP + 190} ${CX - 30},${NECK - 60} ${CX - 12},${NECK}
  C${CX - 30},${NECK + 60} ${CX - 180},${BOT - 190} ${CX - 170},${BOT - 40} L${CX + 170},${BOT - 40}
  C${CX + 180},${BOT - 190} ${CX + 30},${NECK + 60} ${CX + 12},${NECK} C${CX + 30},${NECK - 60} ${CX + 180},${TOP + 190} ${CX + 170},${TOP + 40} Z`;

// A brass disc seen from slightly above: lower rim, side band, then the lit top face.
const Cap: FC<{y: number}> = ({y}) => <g>
  <ellipse cx={CX} cy={y + 34} rx={225} ry={30} fill="url(#h-brass-side)" />
  <rect x={CX - 225} y={y} width={450} height={34} fill="url(#h-brass-side)" />
  <ellipse cx={CX} cy={y} rx={225} ry={30} fill="url(#h-brass-top)" />
  <ellipse cx={CX - 60} cy={y - 6} rx={110} ry={9} fill="#fff4cf" opacity={0.25} />
</g>;

const Post: FC<{x: number; back?: boolean}> = ({x, back}) => <g opacity={back ? 0.55 : 1}>
  <rect x={x - (back ? 9 : 13)} y={TOP} width={back ? 18 : 26} height={BOT - TOP} fill="url(#h-post)" />
  {[TOP + 30, NECK, BOT - 30].map(y => <rect key={y} x={x - (back ? 13 : 19)} y={y - 9} width={back ? 26 : 38} height={18} rx={8} fill="url(#h-post)" />)}
</g>;

export const HourglassArt: FC<ArtProps> = ({frame, duration}) => {
  const t = Math.min(1, frame / Math.max(1, duration));
  const topLevel = interpolate(t, [0, 1], [NECK - 62, NECK - 26]);
  const peak = interpolate(t, [0, 1], [705, 690]);
  return <Canvas>
    <defs>
      <linearGradient id="h-wall" x1="0" y1="0" x2="1" y2="0.3"><stop offset="0" stopColor="#2a1d12" /><stop offset="0.5" stopColor="#140e0a" /><stop offset="1" stopColor="#0a0807" /></linearGradient>
      <filter id="h-stone" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.045 0.06" numOctaves={4} seed={11} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.18  0 0 0 0 0.12  0 0 0 0 0.07  0 0 0 0.9 -0.3" />
      </filter>
      <radialGradient id="h-sun" cx="0.05" cy="0.38" r="0.75"><stop offset="0" stopColor="#ffb45e" stopOpacity="0.55" /><stop offset="0.5" stopColor="#c86e2c" stopOpacity="0.16" /><stop offset="1" stopColor="#c86e2c" stopOpacity="0" /></radialGradient>
      <linearGradient id="h-ledge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6b4f37" /><stop offset="1" stopColor="#3a2a1d" /></linearGradient>
      <linearGradient id="h-ledge-front" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a1e15" /><stop offset="1" stopColor="#0b0806" /></linearGradient>
      <linearGradient id="h-brass-top" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#f2c46e" /><stop offset="0.35" stopColor="#c08a3c" /><stop offset="1" stopColor="#4b3214" /></linearGradient>
      <linearGradient id="h-brass-side" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ffd88c" /><stop offset="0.18" stopColor="#b47c32" /><stop offset="0.6" stopColor="#5e3f17" /><stop offset="1" stopColor="#2a1b09" /></linearGradient>
      <linearGradient id="h-post" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ffe0a0" /><stop offset="0.3" stopColor="#b9853a" /><stop offset="1" stopColor="#3e290f" /></linearGradient>
      <linearGradient id="h-glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff3dd" stopOpacity="0.2" /><stop offset="0.3" stopColor="#fff3dd" stopOpacity="0.05" /><stop offset="0.85" stopColor="#fff3dd" stopOpacity="0.03" /><stop offset="1" stopColor="#fff3dd" stopOpacity="0.12" /></linearGradient>
      <linearGradient id="h-sand" x1="0" y1="0" x2="1" y2="0.6"><stop offset="0" stopColor="#f3c27a" /><stop offset="0.5" stopColor="#c98d4a" /><stop offset="1" stopColor="#7a4f24" /></linearGradient>
      <clipPath id="h-clip"><path d={bulb} /></clipPath>
      <filter id="h-blur10"><feGaussianBlur stdDeviation="10" /></filter>
      <filter id="h-blur24"><feGaussianBlur stdDeviation="24" /></filter>
    </defs>
    <rect width={W} height={H} fill="url(#h-wall)" />
    <rect width={W} height={H} filter="url(#h-stone)" opacity={0.6} />
    {/* Stone courses and joints */}
    {[150, 390, 640, 880].map((y, r) => <g key={y} stroke="#050403" strokeWidth={3} opacity={0.55}>
      <line x1={0} x2={W} y1={y} y2={y} />
      {[0, 1, 2, 3].map(k => <line key={k} x1={((k * 330 + (r % 2) * 165) % 1150) - 20} x2={((k * 330 + (r % 2) * 165) % 1150) - 20} y1={y - 240} y2={y} />)}
    </g>)}
    <rect width={W} height={H} fill="url(#h-sun)" style={{mixBlendMode: 'screen'}} />
    {/* Ledge */}
    <polygon points={`0,${BOT + 20} ${W},${BOT + 20} ${W},${BOT + 90} 0,${BOT + 90}`} fill="url(#h-ledge)" />
    <rect y={BOT + 90} width={W} height={H - BOT - 90} fill="url(#h-ledge-front)" />
    <rect y={BOT + 86} width={W} height={5} fill="#9a7550" opacity={0.6} />
    {/* Cast shadow to the right, away from the low sun */}
    <path d={`M${CX - 160},${BOT + 40} L${CX + 230},${BOT + 40} L${W + 80},${BOT + 70} L${CX + 420},${BOT + 84} Z`} fill="#000" opacity={0.6} filter="url(#h-blur10)" />
    <Post x={CX} back />
    <Cap y={BOT} />
    {/* Glass and sand */}
    <path d={bulb} fill="#0c0806" opacity={0.25} />
    <g clipPath="url(#h-clip)">
      <rect x={CX - 200} y={topLevel} width={400} height={NECK - topLevel} fill="url(#h-sand)" />
      <path d={`M${CX - 200},${topLevel + 2} Q${CX},${topLevel + 18} ${CX + 200},${topLevel + 2}`} fill="none" stroke="#ffd79c" strokeWidth={3} opacity={0.6} />
      <path d={`M${CX - 230},${BOT - 130} C${CX - 150},${BOT - 128} ${CX - 60},${peak + 34} ${CX},${peak} C${CX + 60},${peak + 34} ${CX + 150},${BOT - 128} ${CX + 230},${BOT - 130} L${CX + 230},${BOT} L${CX - 230},${BOT} Z`} fill="url(#h-sand)" />
      <path d={`M${CX - 150},${BOT - 118} C${CX - 90},${BOT - 124} ${CX - 40},${peak + 40} ${CX},${peak + 4}`} fill="none" stroke="#ffe0ad" strokeWidth={2.5} opacity={0.5} />
      <rect x={CX - 1.6} y={NECK} width={3.2} height={peak - NECK} fill="#e9b46d" opacity={0.85} />
      {seeded('grain-fall', 26).map((p, i) => {
        const y = NECK + ((p.a * (peak - NECK) + frame * (7 + p.b * 5)) % (peak - NECK));
        return <circle key={i} cx={CX + (p.c - 0.5) * 5} cy={y} r={1.3 + p.d} fill="#ffd9a0" opacity={0.9} />;
      })}
      {seeded('grain-splash', 10).map((p, i) => {
        const phase = ((frame + p.a * 30) % 30) / 30;
        return <circle key={i} cx={CX + (p.b - 0.5) * 40 * phase} cy={peak - 8 * Math.sin(Math.PI * phase)} r={1.4} fill="#f5c582" opacity={1 - phase} />;
      })}
    </g>
    <path d={bulb} fill="url(#h-glass)" stroke="#fff1d8" strokeOpacity={0.35} strokeWidth={2.5} />
    <path d={`M${CX - 140},${TOP + 70} C${CX - 150},${TOP + 170} ${CX - 70},${NECK - 90} ${CX - 30},${NECK - 30}`} fill="none" stroke="#fff" strokeOpacity={0.45} strokeWidth={5} strokeLinecap="round" />
    <path d={`M${CX - 140},${BOT - 70} C${CX - 150},${BOT - 170} ${CX - 80},${NECK + 100} ${CX - 40},${NECK + 50}`} fill="none" stroke="#fff" strokeOpacity={0.28} strokeWidth={4} strokeLinecap="round" />
    <path d={`M${CX + 120},${TOP + 90} C${CX + 128},${TOP + 160} ${CX + 70},${NECK - 100} ${CX + 40},${NECK - 50}`} fill="none" stroke="#ffcf8a" strokeOpacity={0.18} strokeWidth={3} />
    <Post x={CX - 205} />
    <Post x={CX + 205} />
    <Cap y={TOP - 34} />
    {/* Warm sidelight glow on the brass and floating dust */}
    <ellipse cx={CX - 220} cy={NECK} rx={60} ry={300} fill="#ffcf8a" opacity={0.12} filter="url(#h-blur24)" style={{mixBlendMode: 'screen'}} />
    <Motes seed="hour-dust" n={40} frame={frame} box={[0, 150, 1080, 760]} color="#ffd8a2" drift={[0.22, -0.05]} size={[1, 2.6]} opacity={0.55} />
    <Grain id="h-grain" frame={frame} />
  </Canvas>;
};
