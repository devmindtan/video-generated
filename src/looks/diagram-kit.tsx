import type {FC, ReactNode} from 'react';
import {Easing, interpolate} from 'remotion';
import {FONT} from './looks';
import type {Theme} from './looks';

// "Sơ đồ hệ thống động" (animation-styles.json so-do-he-thong): system diagrams that visibly work. Boxes for
// servers, databases, caches and queues, wires drawn on, data packets running along the wires, counters, timers and
// monospace code cards. Everything is SVG in the caller's coordinate space and derives from the frame `f`, so
// preview, seeking and rendering agree. Colours come from the theme palette, never hard-coded.

export const MONO = '"DejaVu Sans Mono", "Noto Sans Mono", monospace';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(.33, 0, .2, 1);
export const grow = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {...clamp, easing: ease});
export const fade = (f: number, a: number, b: number, len = 12) => Math.min(grow(f, a, a + len), 1 - grow(f, b - len, b));

type Pt = [number, number];
const segLengths = (pts: Pt[]) => pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
// Point at fraction t (0..1) of a polyline's length.
export const along = (pts: Pt[], t: number): Pt => {
  const lens = segLengths(pts), total = lens.reduce((a, b) => a + b, 0);
  let d = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {const k = lens[i] ? d / lens[i] : 0;return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];}
    d -= lens[i];
  }
  return pts[pts.length - 1];
};
const pathOf = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');

export type NodeKind = 'server' | 'db' | 'cache' | 'queue' | 'client' | 'lb' | 'cdn' | 'box' | 'phone' | 'service' | 'none';
export type NodeState = 'ok' | 'down' | 'hot' | 'key' | 'dim';

// A small line icon for each kind, drawn inside a 56×56 box centred at (0, 0).
const Glyph: FC<{kind: NodeKind; c: string; w: number}> = ({kind, c, w}) => {
  const s = {fill: 'none', stroke: c, strokeWidth: w, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  switch (kind) {
    case 'server': return <g {...s}><rect x={-22} y={-24} width={44} height={20} rx={4} /><rect x={-22} y={4} width={44} height={20} rx={4} /><circle cx={-12} cy={-14} r={2} fill={c} /><circle cx={-12} cy={14} r={2} fill={c} /></g>;
    case 'db': return <g {...s}><ellipse cx={0} cy={-18} rx={22} ry={8} /><path d="M-22 -18 V18 A22 8 0 0 0 22 18 V-18" /><path d="M-22 0 A22 8 0 0 0 22 0" /></g>;
    case 'cache': return <g {...s}><path d="M4 -26 L-14 4 H2 L-4 26 L16 -6 H0 Z" /></g>;
    case 'queue': return <g {...s}><rect x={-26} y={-12} width={14} height={24} rx={3} /><rect x={-7} y={-12} width={14} height={24} rx={3} /><rect x={12} y={-12} width={14} height={24} rx={3} /></g>;
    case 'client': return <g {...s}><rect x={-26} y={-20} width={52} height={32} rx={4} /><path d="M-10 22 H10 M0 12 V22" /></g>;
    case 'phone': return <g {...s}><rect x={-14} y={-26} width={28} height={52} rx={6} /><path d="M-4 18 H4" /></g>;
    case 'lb': return <g {...s}><circle cx={-16} cy={0} r={6} /><path d="M-10 0 H6 M6 0 L20 -16 M6 0 L20 0 M6 0 L20 16" /><circle cx={22} cy={-16} r={3} fill={c} /><circle cx={22} cy={0} r={3} fill={c} /><circle cx={22} cy={16} r={3} fill={c} /></g>;
    case 'cdn': return <g {...s}><circle r={22} /><path d="M-22 0 H22 M0 -22 C-12 -10 -12 10 0 22 M0 -22 C12 -10 12 10 0 22" /></g>;
    case 'none': return null;
    case 'service': return <g {...s}><path d="M0 -24 L21 -12 V12 L0 24 L-21 12 V-12 Z" /><circle r={7} /></g>;
    default: return <g {...s}><rect x={-20} y={-20} width={40} height={40} rx={6} /></g>;
  }
};

// A component box: icon, label and optional sub-label. `at` is the frame it pops in; `state` recolours it.
export const DiagramNode: FC<{t: Theme; f: number; x: number; y: number; w?: number; h?: number; kind?: NodeKind; label?: string; sub?: string;
  at?: number; state?: NodeState; scale?: number; labelSize?: number}> = ({t, f, x, y, w = 240, h = 132, kind = 'box', label, sub, at = 0, state = 'ok', scale = 1, labelSize = 34}) => {
  const p = t.palette, k = grow(f, at, at + 14);
  if (k <= 0) return null;
  const edge = state === 'down' ? '#ff6b6b' : state === 'hot' || state === 'key' ? p.accent : state === 'dim' ? p.muted : p.accent2;
  const pulse = state === 'hot' ? .5 + .5 * Math.sin(f / 4) : 0;
  const icon = label ? -h / 2 + 44 : 0;
  return <g transform={`translate(${x} ${y}) scale(${scale * (.86 + .14 * k)})`} opacity={k * (state === 'dim' ? .45 : 1)}>
    {state === 'hot' ? <rect x={-w / 2 - 10} y={-h / 2 - 10} width={w + 20} height={h + 20} rx={22} fill={p.accent} opacity={.12 + .14 * pulse} /> : null}
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={16} fill={p.surface} stroke={edge} strokeWidth={3} />
    <g transform={`translate(0 ${icon})`}><Glyph kind={kind} c={edge} w={3} /></g>
    {label ? <text y={h / 2 - (sub ? 44 : 22)} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={labelSize} fill={p.ink}>{label}</text> : null}
    {sub ? <text y={h / 2 - 16} textAnchor="middle" fontFamily={FONT} fontSize={30} fill={p.muted}>{sub}</text> : null}
    {state === 'down' ? <path d={`M${-w / 2 + 18} ${-h / 2 + 18} L${w / 2 - 18} ${h / 2 - 18} M${w / 2 - 18} ${-h / 2 + 18} L${-w / 2 + 18} ${h / 2 - 18}`} stroke="#ff6b6b" strokeWidth={5} strokeLinecap="round" opacity={.8} /> : null}
  </g>;
};

// A wire between points, drawn on over [at, at + dur] frames.
export const DiagramWire: FC<{t: Theme; f: number; pts: Pt[]; at?: number; dur?: number; color?: string; dashed?: boolean; width?: number; arrow?: boolean; opacity?: number}> =
  ({t, f, pts, at = 0, dur = 18, color, dashed = false, width = 3, arrow = true, opacity = 1}) => {
    const k = grow(f, at, at + dur), c = color ?? t.palette.accent2;
    if (k <= 0) return null;
    const end = along(pts, k), before = along(pts, Math.max(0, k - .02)), ang = Math.atan2(end[1] - before[1], end[0] - before[0]) * 180 / Math.PI;
    return <g opacity={opacity}>
      <path d={pathOf(pts)} pathLength={1} fill="none" stroke={c} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={dashed ? undefined : '1 1'} strokeDashoffset={dashed ? undefined : 1 - k} style={dashed ? {strokeDasharray: '10 10'} : undefined} opacity={dashed ? k * .8 : .85} />
      {arrow && k > .95 ? <path d="M-14 -8 L0 0 L-14 8" transform={`translate(${end[0]} ${end[1]}) rotate(${ang})`} fill="none" stroke={c} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" /> : null}
    </g>;
  };

// Data packets running along a wire: `count` evenly spaced dots, one lap per `period` frames, from frame `at`.
export const DiagramPacket: FC<{t: Theme; f: number; pts: Pt[]; at?: number; until?: number; period?: number; count?: number; color?: string; r?: number; label?: string}> =
  ({t, f, pts, at = 0, until = Infinity, period = 45, count = 1, color, r = 9, label}) => {
    if (f < at || f > until) return null;
    const c = color ?? t.palette.accent, life = fade(f, at, until === Infinity ? 1e9 : until, 8);
    return <g opacity={life}>{Array.from({length: count}, (_, i) => {
      const phase = ((f - at) / period + i / count) % 1, [x, y] = along(pts, phase), o = Math.min(1, phase * 8, (1 - phase) * 8);
      return <g key={i} opacity={o}><circle cx={x} cy={y} r={r * 1.9} fill={c} opacity={.18} /><circle cx={x} cy={y} r={r} fill={c} />
        {label ? <text x={x} y={y - r - 10} textAnchor="middle" fontFamily={MONO} fontSize={28} fill={c}>{label}</text> : null}</g>;
    })}</g>;
  };

// A pill tag ("REST", "TTL 60s"); pops in at `at`.
export const Chip: FC<{t: Theme; f: number; x: number; y: number; text: string; at?: number; tone?: 'accent' | 'accent2' | 'muted' | 'bad'; size?: number; mono?: boolean}> =
  ({t, f, x, y, text, at = 0, tone = 'accent2', size = 30, mono = false}) => {
    const k = grow(f, at, at + 12), p = t.palette, c = tone === 'bad' ? '#ff6b6b' : p[tone];
    if (k <= 0) return null;
    const w = text.length * size * (mono ? .62 : .56) + size * 1.4;
    return <g transform={`translate(${x} ${y + (1 - k) * 14})`} opacity={k}>
      <rect x={-w / 2} y={-size * .95} width={w} height={size * 1.9} rx={size * .95} fill={p.background} stroke={c} strokeWidth={2.5} />
      <text y={size * .36} textAnchor="middle" fontFamily={mono ? MONO : FONT} fontWeight={700} fontSize={size} fill={c}>{text}</text>
    </g>;
  };

// A number that counts from `from` to `to` over [a, b] frames.
export const Counter: FC<{t: Theme; f: number; x: number; y: number; from: number; to: number; a: number; b: number; size?: number; suffix?: string; format?: (n: number) => string; color?: string}> =
  ({t, f, x, y, from, to, a, b, size = 72, suffix = '', format, color}) => {
    const v = from + (to - from) * grow(f, a, b), text = format ? format(v) : Math.round(v).toLocaleString('vi-VN');
    return <text x={x} y={y} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={size} fill={color ?? t.palette.ink} opacity={grow(f, a - 10, a)}>{text}{suffix}</text>;
  };

// A monospace card whose lines type in one after another from `at`.
// `prose`: the lines are Vietnamese text, set in the theme font (monospace fonts space Vietnamese accents badly).
export const CodeCard: FC<{t: Theme; f: number; x: number; y: number; w: number; lines: string[]; at?: number; cps?: number; title?: string; size?: number; highlight?: number[]; prose?: boolean}> =
  ({t, f, x, y, w, lines, at = 0, cps = 1.6, title, size = 30, highlight = [], prose = false}) => {
    const p = t.palette, k = grow(f, at, at + 12), lh = size * 1.5, h = lines.length * lh + (title ? 64 : 34) + 22;
    if (k <= 0) return null;
    let budget = Math.max(0, (f - at - 8) * cps);
    return <g transform={`translate(${x} ${y})`} opacity={k}>
      <rect width={w} height={h} rx={14} fill={p.background} stroke={p.muted} strokeWidth={2} opacity={.96} />
      {title ? <g><circle cx={28} cy={28} r={7} fill="#ff6b6b" opacity={.8} /><circle cx={52} cy={28} r={7} fill={p.accent} opacity={.8} /><circle cx={76} cy={28} r={7} fill={p.accent2} opacity={.8} />
        <text x={104} y={38} fontFamily={MONO} fontSize={28} fill={p.muted}>{title}</text></g> : null}
      {lines.map((line, i) => {const shown = line.slice(0, Math.floor(budget));budget -= line.length;
        return <text key={i} x={28} y={(title ? 64 : 34) + (i + .8) * lh} fontFamily={prose ? FONT : MONO} fontSize={size} fill={highlight.includes(i) ? p.accent : p.ink} style={{whiteSpace: 'pre'}}>{shown}</text>;})}
    </g>;
  };

// mm:ss countdown from `seconds`, ticking in real time from frame `at`.
export const Timer: FC<{t: Theme; f: number; fps: number; x: number; y: number; seconds: number; at?: number; size?: number}> = ({t, f, fps, x, y, seconds, at = 0, size = 96}) => {
  const left = Math.max(0, seconds - Math.max(0, f - at) / fps), m = Math.floor(left / 60), s = Math.floor(left % 60);
  return <text x={x} y={y} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={size} fill={t.palette.accent} opacity={grow(f, at - 12, at)}>{`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`}</text>;
};

// A tick or cross mark drawn on at `at`.
export const Mark: FC<{t: Theme; f: number; x: number; y: number; ok: boolean; at?: number; size?: number}> = ({t, f, x, y, ok, at = 0, size = 40}) => {
  const k = grow(f, at, at + 10), c = ok ? t.palette.accent2 : '#ff6b6b', s = size / 2;
  return <path d={ok ? `M${x - s} ${y} L${x - s / 3} ${y + s * .7} L${x + s} ${y - s * .7}` : `M${x - s} ${y - s} L${x + s} ${y + s} M${x + s} ${y - s} L${x - s} ${y + s}`}
    pathLength={1} fill="none" stroke={c} strokeWidth={size / 7} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 1" strokeDashoffset={1 - k} />;
};

// SVG text helper in the theme font.
export const Label: FC<{t: Theme; x: number; y: number; children: ReactNode; size?: number; color?: string; weight?: 400 | 700; anchor?: 'start' | 'middle' | 'end'; opacity?: number; mono?: boolean}> =
  ({t, x, y, children, size = 34, color, weight = 700, anchor = 'middle', opacity = 1, mono = false}) =>
    <text x={x} y={y} textAnchor={anchor} fontFamily={mono ? MONO : FONT} fontWeight={weight} fontSize={size} fill={color ?? t.palette.ink} opacity={opacity}>{children}</text>;
