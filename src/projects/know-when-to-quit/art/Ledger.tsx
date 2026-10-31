import React from 'react';
import type {FC} from 'react';
import {Canvas, Grain, Motes, seeded, W, H, type ArtProps} from './common';

// Scene 1: a worn ledger under a desk lamp at night; the lamp breathes, dust floats in its cone.
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
type Pt = [number, number];
const at = (p: Pt, q: Pt, t: number): Pt => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];

// Handwritten rows on a page given its four corners (top-left, top-right, bottom-right, bottom-left).
const Writing: FC<{corners: [Pt, Pt, Pt, Pt]; seed: string; struck: number[]}> = ({corners: [tl, tr, br, bl], seed, struck}) => {
  const rows = 11;
  return <g strokeLinecap="round" fill="none">
    {Array.from({length: rows}, (_, r) => {
      const t = 0.1 + r * 0.075, left = at(tl, bl, t), right = at(tr, br, t);
      const marks = seeded(`${seed}-${r}`, 14);
      const words: string[] = [];
      let u = 0.05 + marks[0].a * 0.04;
      for (const m of marks) {
        const len = 0.03 + m.b * 0.07;
        if (u + len > (r % 3 === 1 ? 0.62 : 0.72)) break;
        const p = at(left, right, u), q = at(left, right, u + len);
        words.push(`M${p[0]},${p[1] + (m.c - 0.5) * 2} Q${(p[0] + q[0]) / 2},${(p[1] + q[1]) / 2 - 3 + m.d * 6} ${q[0]},${q[1] + (m.d - 0.5) * 2}`);
        u += len + 0.018 + m.c * 0.02;
      }
      // Right-hand column of figures, then a strike-through on the rows given up on.
      const n0 = at(left, right, 0.78), n1 = at(left, right, 0.93);
      const s0 = at(left, right, 0.03), s1 = at(left, right, 0.95);
      return <g key={r}>
        <path d={words.join(' ')} stroke="#3d2f22" strokeWidth={2.1} opacity={0.72} />
        <path d={`M${n0[0]},${n0[1]} L${n1[0]},${n1[1]}`} stroke="#3d2f22" strokeWidth={2.4} strokeDasharray="7 5" opacity={0.6} />
        {struck.includes(r) ? <path d={`M${s0[0]},${s0[1] - 1} L${s1[0]},${s1[1] + 2}`} stroke="#8c3a22" strokeWidth={2.6} opacity={0.8} /> : null}
      </g>;
    })}
  </g>;
};

export const LedgerArt: FC<ArtProps> = ({frame}) => {
  const flicker = 1 + Math.sin(frame / 7) * 0.025 + Math.sin(frame / 2.3 + 1) * 0.012;
  const left: [Pt, Pt, Pt, Pt] = [[236, 812], [520, 786], [524, 1022], [196, 1060]];
  const right: [Pt, Pt, Pt, Pt] = [[530, 786], [826, 814], [868, 1062], [532, 1022]];
  return <Canvas>
    <defs>
      <linearGradient id="l-room" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0d0907" /><stop offset="0.55" stopColor="#140d08" /><stop offset="1" stopColor="#090605" /></linearGradient>
      <radialGradient id="l-wall" cx="0.68" cy="0.3" r="0.6"><stop offset="0" stopColor="#4a3018" stopOpacity="0.75" /><stop offset="1" stopColor="#4a3018" stopOpacity="0" /></radialGradient>
      <linearGradient id="l-desk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3b2412" /><stop offset="0.35" stopColor="#4a2e17" /><stop offset="1" stopColor="#1e1209" /></linearGradient>
      <filter id="l-wood" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.0025 0.11" numOctaves={3} seed={4} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.12  0 0 0 0 0.07  0 0 0 0 0.03  0 0 0 1.1 -0.35" />
      </filter>
      <radialGradient id="l-pool" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#ffcf8a" stopOpacity="0.62" /><stop offset="0.55" stopColor="#f0a85a" stopOpacity="0.2" /><stop offset="1" stopColor="#f0a85a" stopOpacity="0" /></radialGradient>
      <linearGradient id="l-cone" x1="0.75" y1="0.2" x2="0.4" y2="1"><stop offset="0" stopColor="#ffe2ad" stopOpacity="0.32" /><stop offset="1" stopColor="#ffcf8a" stopOpacity="0" /></linearGradient>
      <filter id="l-blur18"><feGaussianBlur stdDeviation="18" /></filter>
      <filter id="l-blur8"><feGaussianBlur stdDeviation="8" /></filter>
      <linearGradient id="l-page-l" x1="0" y1="0" x2="1" y2="0.3"><stop offset="0" stopColor="#c9b28a" /><stop offset="0.7" stopColor="#ecdcb8" /><stop offset="1" stopColor="#b9a17a" /></linearGradient>
      <linearGradient id="l-page-r" x1="0" y1="0.3" x2="1" y2="0"><stop offset="0" stopColor="#b59d76" /><stop offset="0.25" stopColor="#f3e5c4" /><stop offset="1" stopColor="#d6c29c" /></linearGradient>
      <linearGradient id="l-metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5a5149" /><stop offset="0.4" stopColor="#2a2622" /><stop offset="1" stopColor="#141210" /></linearGradient>
      <linearGradient id="l-cup" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#f2e6d2" /><stop offset="0.55" stopColor="#c9b9a2" /><stop offset="1" stopColor="#6f655a" /></linearGradient>
      <radialGradient id="l-tea" cx="0.4" cy="0.4" r="0.7"><stop offset="0" stopColor="#7a4518" /><stop offset="1" stopColor="#3a1d08" /></radialGradient>
    </defs>
    <rect width={W} height={H} fill="url(#l-room)" />
    <rect width={W} height={700} fill="url(#l-wall)" opacity={flicker} />
    {/* Desk: planks receding, grain, edge highlight */}
    <rect y={640} width={W} height={H - 640} fill="url(#l-desk)" />
    <rect y={640} width={W} height={H - 640} filter="url(#l-wood)" opacity={0.85} />
    {[690, 760, 860, 1000, 1190].map((y, i) => <line key={y} x1={0} x2={W} y1={y} y2={y} stroke="#120a05" strokeWidth={1.5 + i * 0.6} opacity={0.6} />)}
    <rect y={636} width={W} height={6} fill="#6e4524" opacity={0.7} />
    <ellipse cx={560} cy={930} rx={560} ry={270} fill="url(#l-pool)" opacity={flicker} style={{mixBlendMode: 'screen'}} />
    {/* Receipts held by a clip */}
    <g transform="rotate(-8 170 820)">
      {[0, 1, 2, 3].map(i => <rect key={i} x={70 + i * 5} y={760 - i * 7} width={190} height={250} rx={3} fill={['#cfc3ad', '#ddd2bb', '#c4b79f', '#e6dcc6'][i]} transform={`rotate(${(i - 1.5) * 3} 165 880)`} opacity={0.92} />)}
      {Array.from({length: 9}, (_, i) => <line key={i} x1={100} x2={240 - (i % 3) * 30} y1={760 + i * 22} y2={760 + i * 22} stroke="#6b5d4a" strokeWidth={2} strokeDasharray="5 4" opacity={0.5} />)}
      <path d="M128,722 h76 l-6,34 h-64 z" fill="#18171a" /><path d="M140,722 q26,-46 52,0" fill="none" stroke="#7d7a80" strokeWidth={5} />
    </g>
    {/* Ledger: shadow, pages, spine, writing */}
    <ellipse cx={530} cy={1060} rx={370} ry={36} fill="#000" opacity={0.55} filter="url(#l-blur8)" />
    <path d={`M${left[0]} Q378,770 ${left[1]} L${left[2]} Q360,1030 ${left[3]} Z`} fill="url(#l-page-l)" />
    <path d={`M${right[0]} Q680,770 ${right[1]} L${right[2]} Q700,1030 ${right[3]} Z`} fill="url(#l-page-r)" />
    <path d="M500,790 Q526,900 512,1024 L546,1024 Q532,900 552,790 Z" fill="#5b4630" opacity={0.35} />
    <Writing corners={left} seed="ledger-l" struck={[2, 5, 6]} />
    <Writing corners={right} seed="ledger-r" struck={[1, 4, 8, 9]} />
    <path d="M196,1060 Q360,1034 524,1022 L532,1022 Q700,1034 868,1062 L870,1072 Q700,1046 528,1036 Q360,1046 194,1070 Z" fill="#7d6a52" />
    {/* Pen across the right page */}
    <g transform="rotate(24 700 930)"><rect x={600} y={924} width={230} height={12} rx={6} fill="#1d1a19" /><rect x={600} y={924} width={230} height={4} rx={2} fill="#6d6560" opacity={0.6} /><path d="M830,924 l26,6 l-26,6 z" fill="#b9975a" /></g>
    {/* Cold tea */}
    <ellipse cx={930} cy={1018} rx={118} ry={30} fill="#000" opacity={0.5} filter="url(#l-blur8)" />
    <ellipse cx={928} cy={1004} rx={104} ry={26} fill="#d9cdb9" /><ellipse cx={928} cy={1000} rx={92} ry={20} fill="#b9ad99" />
    <path d="M866,904 L878,992 Q928,1012 978,992 L990,904 Z" fill="url(#l-cup)" />
    <path d="M988,922 q44,4 34,38 q-10,26 -40,22" fill="none" stroke="#c4b49c" strokeWidth={10} />
    <ellipse cx={928} cy={904} rx={62} ry={15} fill="#efe4d1" /><ellipse cx={928} cy={907} rx={55} ry={11} fill="url(#l-tea)" />
    {/* Lamp: base, arm, shade, cone of light */}
    <ellipse cx={968} cy={700} rx={92} ry={20} fill="url(#l-metal)" />
    <path d="M966,690 L1010,430 L838,268" fill="none" stroke="#2b2724" strokeWidth={13} strokeLinejoin="round" />
    <path d="M966,690 L1010,430 L838,268" fill="none" stroke="#7a6d60" strokeWidth={3} opacity={0.5} />
    <circle cx={1010} cy={430} r={14} fill="#1c1a18" /><circle cx={838} cy={268} r={12} fill="#1c1a18" />
    <polygon points="660,880 330,1080 900,1100 760,880" fill="url(#l-cone)" filter="url(#l-blur18)" opacity={flicker} style={{mixBlendMode: 'screen'}} />
    <polygon points="700,330 160,1060 980,1090 790,350" fill="url(#l-cone)" filter="url(#l-blur18)" opacity={0.75 * flicker} style={{mixBlendMode: 'screen'}} />
    <path d="M880,214 L700,318 Q724,372 790,356 L928,262 Z" fill="url(#l-metal)" />
    <ellipse cx={745} cy={338} rx={52} ry={18} transform="rotate(-30 745 338)" fill="#ffe8bd" opacity={0.95 * flicker} />
    <ellipse cx={745} cy={338} rx={90} ry={44} transform="rotate(-30 745 338)" fill="#ffd08a" opacity={0.28 * flicker} filter="url(#l-blur18)" />
    <Motes seed="ledger-dust" n={46} frame={frame} box={[260, 380, 560, 640]} color="#ffe2b0" drift={[0.08, -0.12]} size={[1, 2.8]} opacity={0.7} />
    <Grain id="l-grain" frame={frame} />
  </Canvas>;
};
