import type {FC} from 'react';
import {interpolate} from 'remotion';
import {Canvas, Grain, Motes, seeded, W, H, type ArtProps} from './common';

// Scene 5: the shovel laid down beside a pair of work gloves at the edge of a hill; below, a green valley
// with a stream catching the sunrise. The background sits slightly out of focus; the sun climbs.
export const ValleyArt: FC<ArtProps> = ({frame, duration}) => {
  const t = Math.min(1, frame / Math.max(1, duration));
  const rise = interpolate(t, [0, 1], [0, 1]);
  const sunY = 560 - rise * 46;
  return <Canvas>
    <defs>
      <linearGradient id="v-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5d86a8" /><stop offset="0.5" stopColor="#a9bfc6" /><stop offset="0.82" stopColor="#f2d29c" /><stop offset="1" stopColor="#f7c27a" /></linearGradient>
      <radialGradient id="v-sun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#fff7df" /><stop offset="0.2" stopColor="#ffe3a6" stopOpacity="0.9" /><stop offset="1" stopColor="#ffc46e" stopOpacity="0" /></radialGradient>
      <linearGradient id="v-far" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8fa58e" /><stop offset="1" stopColor="#6f8a6c" /></linearGradient>
      <linearGradient id="v-mid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6c9156" /><stop offset="1" stopColor="#3e6438" /></linearGradient>
      <linearGradient id="v-near" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4d7a3f" /><stop offset="1" stopColor="#24401f" /></linearGradient>
      <linearGradient id="v-stream" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#d9eef2" /><stop offset="0.5" stopColor="#fff3d4" /><stop offset="1" stopColor="#bcdde6" /></linearGradient>
      <linearGradient id="v-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9a7350" /><stop offset="0.4" stopColor="#6e4c30" /><stop offset="1" stopColor="#2e1e12" /></linearGradient>
      <filter id="v-soil" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.03 0.08" numOctaves={4} seed={21} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.24  0 0 0 0 0.16  0 0 0 0 0.08  0 0 0 0.9 -0.32" />
      </filter>
      <linearGradient id="v-handle" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f2b875" /><stop offset="0.45" stopColor="#8f5a32" /><stop offset="1" stopColor="#3a2312" /></linearGradient>
      <linearGradient id="v-blade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f3dfc4" /><stop offset="0.35" stopColor="#8d837a" /><stop offset="1" stopColor="#35302c" /></linearGradient>
      <linearGradient id="v-glove" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ead1a4" /><stop offset="0.55" stopColor="#b48f5e" /><stop offset="1" stopColor="#6e5333" /></linearGradient>
      <filter id="v-focus"><feGaussianBlur stdDeviation="2.6" /></filter>
      <filter id="v-blur6"><feGaussianBlur stdDeviation="6" /></filter>
      <filter id="v-blur30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30" /></filter>
    </defs>
    {/* Background valley, slightly out of focus */}
    <g filter="url(#v-focus)">
      <rect width={W} height={760} fill="url(#v-sky)" />
      <g opacity={0.35 + rise * 0.3}>{Array.from({length: 9}, (_, i) => {
        const a = (-70 + i * 17.5 + frame * 0.03) * Math.PI / 180;
        return <path key={i} d={`M760,${sunY} L${760 + Math.cos(a - 0.04) * 1400},${sunY + Math.sin(a - 0.04) * 1400} L${760 + Math.cos(a + 0.04) * 1400},${sunY + Math.sin(a + 0.04) * 1400} Z`} fill="#fff1cf" opacity={0.18} />;
      })}</g>
      <circle cx={760} cy={sunY} r={330} fill="url(#v-sun)" opacity={0.75 + rise * 0.2} />
      <circle cx={760} cy={sunY} r={52} fill="#fffbee" />
      <path d="M0,600 C180,560 320,590 480,566 S820,560 1080,590 L1080,760 L0,760 Z" fill="url(#v-far)" opacity={0.85} />
      <path d="M0,680 C200,630 380,690 560,650 S900,640 1080,680 L1080,860 L0,860 Z" fill="url(#v-mid)" />
      {seeded('trees', 26).map((p, i) => {
        // Small canopies: three lobes, shaded away from the sun (right), sitting on a soft shadow.
        const x = p.a * W, y = 660 + p.b * 110, r = 7 + p.c * 9 * (0.6 + (y - 660) / 200);
        if (Math.abs(x - (600 + Math.sin(y / 40) * 80)) < 60) return null;
        return <g key={i}>
          <ellipse cx={x + r * 0.6} cy={y + r * 0.9} rx={r * 1.6} ry={r * 0.35} fill="#1f3a1d" opacity={0.5} />
          {[[-0.6, 0.1], [0.55, 0.15], [0, -0.45]].map(([dx, dy], k) => <circle key={k} cx={x + dx * r} cy={y + dy * r} r={r * (k === 2 ? 0.95 : 0.8)} fill={p.d > 0.5 ? '#2c5228' : '#365f2f'} />)}
          <circle cx={x + r * 0.35} cy={y - r * 0.55} r={r * 0.5} fill="#9cc06a" opacity={0.55} />
        </g>;
      })}
      <path d="M0,780 C220,730 420,790 620,750 S940,760 1080,790 L1080,980 L0,980 Z" fill="url(#v-near)" />
      {/* Stream winding towards the sun */}
      {[['M712,668 C690,690 740,712 690,736', 5], ['M690,736 C640,766 560,790 560,830', 11], ['M560,830 C560,872 700,890 660,936 S600,990 640,1010', 22]].map(([d, w]) => <g key={d as string}>
        <path d={d as string} fill="none" stroke="#5f8fa0" strokeWidth={(w as number) + 4} strokeLinecap="round" opacity={0.6} />
        <path d={d as string} fill="none" stroke="url(#v-stream)" strokeWidth={w as number} strokeLinecap="round" />
      </g>)}
      {seeded('glints', 18).map((p, i) => {
        // Points on the stream's centre line, nearer ones larger.
        const pts = [[708, 690], [700, 724], [664, 752], [606, 786], [566, 826], [590, 864], [652, 898], [646, 948], [628, 996]];
        const [x, y] = pts[i % pts.length].map((v, k) => v + (k === 0 ? (p.b - 0.5) * 8 : (p.a - 0.5) * 10));
        const on = Math.max(0, Math.sin(frame / 6 + p.c * 20)) ** 6;
        return <circle key={i} cx={x} cy={y} r={2 + p.d * 3} fill="#fff" opacity={on * (0.5 + rise * 0.5)} />;
      })}
      <rect y={560} width={W} height={260} fill="#fff1d0" opacity={0.16 + rise * 0.1} filter="url(#v-blur30)" />
    </g>
    {/* Foreground: dry hilltop, sharp */}
    <path d="M0,900 C260,880 520,930 760,910 S1000,900 1080,920 L1080,1300 L0,1300 Z" fill="url(#v-ground)" />
    <path d="M0,900 C260,880 520,930 760,910 S1000,900 1080,920 L1080,1300 L0,1300 Z" filter="url(#v-soil)" opacity={0.7} />
    <path d="M0,900 C260,880 520,930 760,910 S1000,900 1080,920" fill="none" stroke="#ffd9a0" strokeWidth={4} opacity={0.5 + rise * 0.3} />
    <path d="M610,1300 C600,1150 660,1020 700,912 L760,912 C740,1020 760,1150 860,1300 Z" fill="#b7936a" opacity={0.45} />
    {seeded('dry-grass', 60).map((p, i) => {
      const x = p.a * W, y = 930 + p.b * 360, h = 14 + p.c * 34;
      return <path key={i} d={`M${x},${y} q-4,${-h * 0.6} -8,${-h} M${x},${y} q3,${-h * 0.7} 8,${-h * 0.95}`} stroke={p.d > 0.5 ? '#c9a16a' : '#7d5f3c'} strokeWidth={2} fill="none" />;
    })}
    {/* The shovel laid flat, with its shadow */}
    <path d="M150,1150 L640,1040 L700,1064 L180,1186 Z" fill="#000" opacity={0.4} filter="url(#v-blur6)" />
    <g transform="rotate(-12 420 1100)">
      <rect x={120} y={1088} width={460} height={22} rx={10} fill="url(#v-handle)" />
      <path d="M96,1074 h40 v50 h-40 a10,10 0 0 1 -10,-10 v-30 a10,10 0 0 1 10,-10 z" fill="url(#v-handle)" />
      <rect x={570} y={1084} width={44} height={30} rx={4} fill="#4a4440" />
      <path d="M612,1068 L720,1062 Q760,1099 720,1136 L612,1130 Z" fill="url(#v-blade)" />
      <path d="M612,1068 L720,1062 L716,1072 L612,1076 Z" fill="#fff4dc" opacity={0.7} />
    </g>
    {/* Work gloves, just taken off */}
    <ellipse cx={850} cy={1150} rx={130} ry={22} fill="#000" opacity={0.35} filter="url(#v-blur6)" />
    {[[790, 1130, -100], [900, 1144, -68]].map(([x, y, r], i) => <g key={i} transform={`translate(${x} ${y}) scale(1 0.5) rotate(${r}) translate(${-x} ${-y})`}>
      <path d={`M${x - 46},${y + 40} L${x - 50},${y - 6} Q${x - 48},${y - 34} ${x - 30},${y - 36} L${x - 28},${y - 70} Q${x - 22},${y - 82} ${x - 14},${y - 70} L${x - 12},${y - 40} L${x - 8},${y - 80} Q${x},${y - 92} ${x + 8},${y - 80} L${x + 8},${y - 40} L${x + 14},${y - 74} Q${x + 22},${y - 84} ${x + 28},${y - 72} L${x + 26},${y - 30} L${x + 38},${y - 50} Q${x + 50},${y - 56} ${x + 50},${y - 40} L${x + 36},${y} Q${x + 34},${y + 30} ${x + 30},${y + 40} Z`} fill="url(#v-glove)" stroke="#5b4429" strokeWidth={2} />
      <rect x={x - 50} y={y + 34} width={84} height={22} rx={6} fill="#3d5a72" />
      <path d={`M${x - 28},${y - 36} L${x - 26},${y + 10} M${x - 8},${y - 40} L${x - 8},${y + 10} M${x + 10},${y - 38} L${x + 8},${y + 10}`} stroke="#7a5d39" strokeWidth={1.6} opacity={0.6} />
    </g>)}
    <Motes seed="valley-pollen" n={34} frame={frame} box={[0, 500, 1080, 560]} color="#fff3cf" drift={[0.25, -0.2]} size={[1, 2.6]} opacity={0.6} />
    <Grain id="v-grain" frame={frame} opacity={0.05} />
  </Canvas>;
};
