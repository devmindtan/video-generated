import type {FC} from 'react';
import {interpolate} from 'remotion';
import {Canvas, Grain, Motes, seeded, W, H, type ArtProps} from './common';

// Scene 3: a dry hand-dug well at dusk, a shovel standing in the spoil heap, dust blowing in a low sun.
const HORIZON = 640;
const PIT = {cx: 520, cy: 960, rx: 200, ry: 64};

// Cracked ground: short random walks, longer and thicker towards the viewer.
const Cracks: FC = () => <g fill="none" stroke="#140b05" strokeLinecap="round" strokeLinejoin="round">
  {seeded('cracks', 70).map((p, i) => {
    const y0 = HORIZON + 40 + p.a ** 0.8 * (H - HORIZON - 40), depth = (y0 - HORIZON) / (H - HORIZON);
    let x = p.b * W, y = y0, angle = p.c * Math.PI * 2;
    const pts = [`M${x.toFixed(1)},${y.toFixed(1)}`];
    for (let k = 0; k < 6; k++) {
      angle += (seeded(`crack-${i}`, 6)[k].a - 0.5) * 1.6;
      x += Math.cos(angle) * 46 * depth;y += Math.sin(angle) * 14 * depth;
      pts.push(`L${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return <path key={i} d={pts.join(' ')} strokeWidth={0.6 + depth * 3.2} opacity={0.35 + depth * 0.45} />;
  })}
</g>;

// Stones around the rim of the pit, lit from the left.
const Rim: FC<{front: boolean}> = ({front}) => <g>
  {seeded('rim', 30).map((p, i) => {
    const a = (i / 30) * Math.PI * 2 + p.a * 0.15, sy = Math.sin(a);
    if (front !== sy > 0) return null;
    const x = PIT.cx + Math.cos(a) * (PIT.rx + 8), y = PIT.cy + sy * (PIT.ry + 6), r = 16 + p.b * 12;
    return <ellipse key={i} cx={x} cy={y} rx={r} ry={r * (0.55 + p.c * 0.2)} fill={`url(#w-stone-${i % 3})`} transform={`rotate(${(p.d - 0.5) * 30} ${x} ${y})`} />;
  })}
</g>;

export const DryWellArt: FC<ArtProps> = ({frame, duration}) => {
  const t = Math.min(1, frame / Math.max(1, duration));
  const sunY = interpolate(t, [0, 1], [536, 566]);
  const sunGlow = interpolate(t, [0, 1], [1, 0.82]);
  return <Canvas>
    <defs>
      <linearGradient id="w-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#141127" /><stop offset="0.35" stopColor="#3b2440" /><stop offset="0.7" stopColor="#a4502f" /><stop offset="0.92" stopColor="#e98d47" /><stop offset="1" stopColor="#f7b46a" /></linearGradient>
      <radialGradient id="w-sun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#ffe6b0" /><stop offset="0.25" stopColor="#ffbe6e" stopOpacity="0.9" /><stop offset="1" stopColor="#ff8a3c" stopOpacity="0" /></radialGradient>
      <linearGradient id="w-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8a5434" /><stop offset="0.25" stopColor="#5e3a22" /><stop offset="1" stopColor="#24160c" /></linearGradient>
      <linearGradient id="w-sunlit" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ffb36a" stopOpacity="0.45" /><stop offset="0.6" stopColor="#ffb36a" stopOpacity="0.05" /><stop offset="1" stopColor="#ffb36a" stopOpacity="0" /></linearGradient>
      <filter id="w-soil" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.02 0.06" numOctaves={4} seed={3} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.2  0 0 0 0 0.12  0 0 0 0 0.06  0 0 0 0.9 -0.3" />
      </filter>
      <radialGradient id="w-hole" cx="0.5" cy="0.62" r="0.62"><stop offset="0" stopColor="#000" /><stop offset="0.7" stopColor="#0b0603" /><stop offset="1" stopColor="#2a170b" /></radialGradient>
      <linearGradient id="w-inner" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6e4428" /><stop offset="1" stopColor="#0a0603" /></linearGradient>
      {['#8f7a68', '#6f5c4c', '#a08770'].map((c, i) => <radialGradient key={c} id={`w-stone-${i}`} cx="0.3" cy="0.3" r="0.9"><stop offset="0" stopColor={c} /><stop offset="0.6" stopColor="#4a3a2e" /><stop offset="1" stopColor="#1f1712" /></radialGradient>)}
      <linearGradient id="w-heap" x1="0" y1="0" x2="1" y2="0.4"><stop offset="0" stopColor="#c07d4a" /><stop offset="0.45" stopColor="#7a4b2a" /><stop offset="1" stopColor="#2d1b0e" /></linearGradient>
      <linearGradient id="w-handle" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#f0b070" /><stop offset="0.35" stopColor="#8a5530" /><stop offset="1" stopColor="#2e1a0c" /></linearGradient>
      <linearGradient id="w-blade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#e3c3a0" /><stop offset="0.3" stopColor="#7d7068" /><stop offset="1" stopColor="#2b2725" /></linearGradient>
      <linearGradient id="w-bucket" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#d9b48a" /><stop offset="0.35" stopColor="#7b6a5c" /><stop offset="1" stopColor="#2c2622" /></linearGradient>
      <filter id="w-blur4"><feGaussianBlur stdDeviation="4" /></filter>
      <filter id="w-blur12"><feGaussianBlur stdDeviation="12" /></filter>
      <clipPath id="w-mouth"><ellipse cx={PIT.cx} cy={PIT.cy} rx={PIT.rx} ry={PIT.ry} /></clipPath>
    </defs>
    {/* Sky, low sun, layered hills in haze */}
    <rect width={W} height={HORIZON + 20} fill="url(#w-sky)" />
    <circle cx={290} cy={sunY} r={300} fill="url(#w-sun)" opacity={0.55 * sunGlow} />
    <circle cx={290} cy={sunY} r={54} fill="#ffe9bf" opacity={0.95 * sunGlow} />
    <path d={`M0,${HORIZON - 70} C140,${HORIZON - 120} 260,${HORIZON - 60} 420,${HORIZON - 96} S760,${HORIZON - 150} 1080,${HORIZON - 88} L1080,${HORIZON + 10} L0,${HORIZON + 10} Z`} fill="#8b4a3c" opacity={0.92} />
    <path d={`M0,${HORIZON - 30} C200,${HORIZON - 64} 380,${HORIZON - 20} 560,${HORIZON - 52} S900,${HORIZON - 40} 1080,${HORIZON - 70} L1080,${HORIZON + 10} L0,${HORIZON + 10} Z`} fill="#5a2f2b" opacity={0.85} />
    <rect y={HORIZON - 60} width={W} height={90} fill="#f0955a" opacity={0.18} filter="url(#w-blur12)" />
    {/* Ground */}
    <rect y={HORIZON} width={W} height={H - HORIZON} fill="url(#w-ground)" />
    <rect y={HORIZON} width={W} height={H - HORIZON} filter="url(#w-soil)" opacity={0.75} />
    <rect y={HORIZON} width={W} height={H - HORIZON} fill="url(#w-sunlit)" style={{mixBlendMode: 'screen'}} />
    <Cracks />
    {/* Long shadows cast to the right */}
    <path d={`M${PIT.cx + 90},${PIT.cy + 30} L${W + 60},${PIT.cy + 4} L${W + 60},${PIT.cy + 70} Z`} fill="#000" opacity={0.35} filter="url(#w-blur12)" />
    <path d="M846,1000 L1100,986 L1100,1012 L860,1014 Z" fill="#000" opacity={0.55} filter="url(#w-blur4)" />
    {/* Pit: back rim, mouth, inner wall, front rim */}
    <Rim front={false} />
    <ellipse cx={PIT.cx} cy={PIT.cy} rx={PIT.rx} ry={PIT.ry} fill="url(#w-hole)" />
    <g clipPath="url(#w-mouth)">
      <path d={`M${PIT.cx - PIT.rx},${PIT.cy} A${PIT.rx},${PIT.ry} 0 0 1 ${PIT.cx + PIT.rx},${PIT.cy} L${PIT.cx + PIT.rx - 26},${PIT.cy + 40} A${PIT.rx - 26},${PIT.ry - 20} 0 0 0 ${PIT.cx - PIT.rx + 26},${PIT.cy + 40} Z`} fill="url(#w-inner)" />
      {Array.from({length: 7}, (_, i) => <path key={i} d={`M${PIT.cx - PIT.rx + 30 + i * 52},${PIT.cy - PIT.ry + 10 + Math.abs(i - 3) * 6} l${(i - 3) * 3},44`} stroke="#2a170b" strokeWidth={3} opacity={0.6} />)}
    </g>
    <Rim front />
    {/* Spoil heap and the shovel standing in it */}
    <path d="M700,1004 C730,930 790,880 860,872 C930,866 990,910 1030,1006 Z" fill="url(#w-heap)" />
    {seeded('clods', 18).map((p, i) => <ellipse key={i} cx={720 + p.a * 300} cy={950 + p.b * 54} rx={6 + p.c * 10} ry={4 + p.c * 6} fill={p.d > 0.5 ? '#9b6238' : '#4b2d18'} />)}
    <g transform="rotate(-5 862 900)">
      <rect x={850} y={520} width={24} height={400} rx={10} fill="url(#w-handle)" />
      <path d="M838,522 q24,-46 48,0 l-8,4 q-16,-26 -32,0 z" fill="url(#w-handle)" />
      <rect x={834} y={518} width={56} height={12} rx={6} fill="#5e3a1d" />
      <path d="M836,912 L888,912 L896,958 Q862,984 828,958 Z" fill="url(#w-blade)" />
      <path d="M836,912 L846,912 L838,960 L828,958 Z" fill="#f6dcbc" opacity={0.6} />
    </g>
    {/* Empty bucket on a frayed rope */}
    <path d="M250,1006 C300,1060 380,1040 420,1000 C460,960 430,930 470,912" fill="none" stroke="#a7865c" strokeWidth={5} strokeDasharray="10 3" />
    <ellipse cx={232} cy={1040} rx={70} ry={14} fill="#000" opacity={0.45} filter="url(#w-blur4)" />
    <path d="M178,930 L190,1030 Q232,1046 274,1030 L286,930 Z" fill="url(#w-bucket)" />
    {[960, 1000].map(y => <path key={y} d={`M${182 + (y - 930) * 0.12},${y} Q232,${y + 12} ${282 - (y - 930) * 0.12},${y}`} fill="none" stroke="#3a322c" strokeWidth={4} />)}
    <ellipse cx={232} cy={930} rx={54} ry={13} fill="#1b1714" stroke="#cdb08c" strokeWidth={3} />
    <path d="M180,930 Q232,860 284,930" fill="none" stroke="#3f3732" strokeWidth={4} />
    {/* Wind-blown dust, lit by the low sun */}
    <Motes seed="well-dust" n={70} frame={frame} box={[0, 520, 1080, 520]} color="#ffc98c" drift={[1.6, -0.1]} size={[1, 3]} opacity={0.5} />
    <Grain id="w-grain" frame={frame} />
  </Canvas>;
};
