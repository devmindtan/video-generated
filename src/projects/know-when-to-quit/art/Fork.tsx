import type {FC} from 'react';
import {interpolate} from 'remotion';
import {Canvas, Grain, seeded, W, H, type ArtProps} from './common';

// Scene 4: a dirt path splits in two at dawn; a weathered signpost with blank boards, mist drifting.
const FORK: [number, number] = [548, 846];

// A band of mist drifting sideways, wrapping so it never runs out.
const Mist: FC<{y: number; frame: number; speed: number; opacity: number; seed: string}> = ({y, frame, speed, opacity, seed}) => <g opacity={opacity}>
  {seeded(seed, 6).map((p, i) => {
    const x = ((p.a * 1500 + frame * speed * (0.7 + p.b * 0.6)) % 1500) - 250;
    return <ellipse key={i} cx={x} cy={y + (p.c - 0.5) * 40} rx={220 + p.d * 160} ry={26 + p.c * 22} fill="#e8eef0" filter="url(#f-blur20)" />;
  })}
</g>;

// A tapering ribbon along a cubic curve: the path narrows with distance.
type P = [number, number];
const cubic = (a: P, b: P, c: P, d: P, t: number): P => {
  const u = 1 - t;
  return [u ** 3 * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t ** 3 * d[0], u ** 3 * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t ** 3 * d[1]];
};
const ribbon = (pts: [P, P, P, P], w0: number, w1: number, offset = 0) => {
  const n = 40, left: string[] = [], right: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, [x, y] = cubic(...pts, t), [x2, y2] = cubic(...pts, Math.min(1, t + 0.01)), [x1, y1] = cubic(...pts, Math.max(0, t - 0.01));
    const len = Math.hypot(x2 - x1, y2 - y1) || 1, nx = -(y2 - y1) / len, ny = (x2 - x1) / len, w = (w0 + (w1 - w0) * t) / 2;
    left.push(`${(x + nx * (w + offset)).toFixed(1)},${(y + ny * (w + offset)).toFixed(1)}`);
    right.unshift(`${(x - nx * (w - offset)).toFixed(1)},${(y - ny * (w - offset)).toFixed(1)}`);
  }
  return `M${left.join(' L')} L${right.join(' L')} Z`;
};
const MAIN: [P, P, P, P] = [[580, 1330], [530, 1140], [575, 970], FORK];
const LEFT: [P, P, P, P] = [FORK, [450, 812], [330, 770], [170, 742]];
const RIGHT: [P, P, P, P] = [FORK, [660, 816], [800, 774], [950, 746]];

const Board: FC<{y: number; dir: 1 | -1; tilt: number}> = ({y, dir, tilt}) => {
  const x0 = FORK[0], len = 210, tip = 34;
  const d = dir === 1 ? `M${x0 - 14},${y} L${x0 + len - tip},${y} L${x0 + len},${y + 30} L${x0 + len - tip},${y + 60} L${x0 - 14},${y + 60} Z`
    : `M${x0 + 32},${y} L${x0 - len + tip + 18},${y} L${x0 - len + 18},${y + 30} L${x0 - len + tip + 18},${y + 60} L${x0 + 32},${y + 60} Z`;
  return <g transform={`rotate(${tilt} ${x0} ${y + 30})`}>
    <path d={d} fill="url(#f-wood)" stroke="#20160e" strokeWidth={3} />
    {[16, 30, 44].map(k => <path key={k} d={`M${dir === 1 ? x0 : x0 - len + 50},${y + k} q60,${(k % 3) * 2 - 2} ${len - 70},0`} stroke="#3c2a1a" strokeWidth={1.6} opacity={0.5} fill="none" />)}
    <path d={d} fill="url(#f-rim)" opacity={0.5} />
    <circle cx={dir === 1 ? x0 + 6 : x0 + 12} cy={y + 30} r={4} fill="#2a2420" />
  </g>;
};

export const ForkArt: FC<ArtProps> = ({frame, duration}) => {
  const t = Math.min(1, frame / Math.max(1, duration));
  const dawn = interpolate(t, [0, 1], [0, 1]);
  return <Canvas>
    <defs>
      <linearGradient id="f-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#16202d" /><stop offset="0.45" stopColor="#3e5163" /><stop offset="0.8" stopColor="#8e9aa0" /><stop offset="1" stopColor="#d9c3a2" /></linearGradient>
      <linearGradient id="f-dawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f6d6a6" stopOpacity="0" /><stop offset="1" stopColor="#f6d6a6" stopOpacity="0.7" /></linearGradient>
      <linearGradient id="f-hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3b4a3f" /><stop offset="1" stopColor="#151d17" /></linearGradient>
      <linearGradient id="f-path" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a39177" /><stop offset="0.5" stopColor="#7a6650" /><stop offset="1" stopColor="#4a3a2a" /></linearGradient>
      <linearGradient id="f-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8c6c4c" /><stop offset="0.5" stopColor="#6a4f36" /><stop offset="1" stopColor="#3e2d1e" /></linearGradient>
      <linearGradient id="f-rim" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stopColor="#ffe2b4" stopOpacity="0.55" /><stop offset="0.3" stopColor="#ffe2b4" stopOpacity="0" /></linearGradient>
      <linearGradient id="f-post" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#3a2b1d" /><stop offset="0.6" stopColor="#6e5338" /><stop offset="1" stopColor="#c9a57a" /></linearGradient>
      <filter id="f-blur20" x="-60%" y="-300%" width="220%" height="700%"><feGaussianBlur stdDeviation="22" /></filter>
      <filter id="f-blur40" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="40" /></filter>
      <filter id="f-blur6"><feGaussianBlur stdDeviation="6" /></filter>
      <filter id="f-grass" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.03 0.2" numOctaves={3} seed={8} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.12  0 0 0 0 0.17  0 0 0 0 0.11  0 0 0 1 -0.4" />
      </filter>
    </defs>
    <rect width={W} height={760} fill="url(#f-sky)" />
    <rect width={W} height={760} fill="url(#f-dawn)" opacity={0.35 + dawn * 0.45} />
    <ellipse cx={720} cy={590} rx={520} ry={110} fill="#ffd9a0" opacity={0.3 + dawn * 0.35} filter="url(#f-blur40)" />
    {seeded('clouds', 5).map((p, i) => <ellipse key={i} cx={((p.a * 1300 + frame * 0.12) % 1300) - 110} cy={160 + p.b * 300} rx={200 + p.c * 180} ry={22 + p.d * 20} fill="#0f1822" opacity={0.35} filter="url(#f-blur20)" />)}
    {/* Distant ridges fading into haze */}
    <path d="M0,590 C160,540 300,560 460,530 S820,520 1080,560 L1080,700 L0,700 Z" fill="#5c6c74" opacity={0.6} />
    <Mist y={600} frame={frame} speed={0.35} opacity={0.5} seed="mist-far" />
    <path d="M0,650 C200,600 380,640 560,610 S900,600 1080,640 L1080,760 L0,760 Z" fill="#3c4c4e" opacity={0.85} />
    <Mist y={680} frame={frame} speed={0.55} opacity={0.6} seed="mist-mid" />
    {/* Near hill and the forking path */}
    <path d="M0,740 C220,700 420,730 600,712 S940,700 1080,730 L1080,1300 L0,1300 Z" fill="url(#f-hill)" />
    <path d="M0,740 C220,700 420,730 600,712 S940,700 1080,730 L1080,1300 L0,1300 Z" filter="url(#f-grass)" opacity={0.7} />
    <path d={ribbon(LEFT, 70, 8)} fill="url(#f-path)" opacity={0.9} />
    <path d={ribbon(RIGHT, 70, 8)} fill="url(#f-path)" opacity={0.9} />
    <path d={ribbon(MAIN, 340, 64)} fill="url(#f-path)" />
    <path d={ribbon(MAIN, 340, 64)} fill="none" stroke="#1c2419" strokeWidth={10} opacity={0.5} filter="url(#f-blur6)" />
    {[-0.24, 0.24].map(k => <path key={k} d={ribbon(MAIN, 26, 4, k * 300)} fill="#4a3b2b" opacity={0.45} />)}
    {seeded('pebbles', 30).map((p, i) => {
      const [x, y] = cubic(...MAIN, p.a * 0.85), w = (400 - 330 * p.a * 0.85) / 2;
      return <ellipse key={i} cx={x + (p.b - 0.5) * w * 1.6} cy={y + (p.c - 0.5) * 8} rx={2 + p.d * 5 * (1 - p.a)} ry={1.5 + p.d * 3 * (1 - p.a)} fill={p.d > 0.5 ? '#bfae92' : '#5a4836'} />;
    })}
    <Mist y={760} frame={frame} speed={0.8} opacity={0.4} seed="mist-near" />
    {/* Signpost at the fork */}
    <ellipse cx={FORK[0] + 40} cy={FORK[1] + 2} rx={80} ry={10} fill="#000" opacity={0.45} filter="url(#f-blur6)" />
    <rect x={FORK[0] - 10} y={600} width={20} height={250} fill="url(#f-post)" />
    <rect x={FORK[0] + 6} y={600} width={4} height={250} fill="#ffe2b4" opacity={0.35} />
    <path d={`M${FORK[0] - 10},600 L${FORK[0]},588 L${FORK[0] + 10},600 Z`} fill="#4a3826" />
    <Board y={616} dir={-1} tilt={-4} />
    <Board y={700} dir={1} tilt={3} />
    {/* Foreground grass tufts */}
    {seeded('tufts', 140).map((p, i) => {
      const y = 800 + p.b ** 0.7 * 500, [cx] = cubic(...MAIN, Math.min(1, Math.max(0, (1330 - y) / 480))), half = 200 - (1330 - y) * 0.3;
      const x = p.a * W, h = (10 + p.c * 40) * ((y - 700) / 600);
      if (Math.abs(x - cx) < half + 10) return null;
      return <path key={i} d={`M${x},${y} q${-6 + p.d * 4},${-h * 0.6} ${-10 + p.d * 6},${-h} M${x},${y} q2,${-h * 0.7} ${4 + p.c * 6},${-h * 0.9} M${x},${y} q8,${-h * 0.4} ${16},${-h * 0.7}`} stroke={p.d > 0.66 ? '#6d8a5c' : p.d > 0.33 ? '#3e5638' : '#22311f'} strokeWidth={1.4 + (y - 800) / 250} fill="none" />;
    })}
    <Grain id="f-grain" frame={frame} />
  </Canvas>;
};
