import type {FC, ReactNode} from 'react';
import {Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT, SampleFrame, strokeOf, themeOf} from './looks';
import type {Theme} from './looks';

// One short vertical sample per 2D animation style (animation-styles.json "sample"), 6 s at 30 fps. Each takes a
// theme id so Studio's props panel shows the same style in every theme. Everything derives from the frame.
export type SampleProps = {theme: string};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(.33, 0, .2, 1);
const grow = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {...clamp, easing: ease});
// A path drawn on over [a, b] frames (pathLength 1 so dash maths stays simple).
const Ink: FC<{d: string; f: number; a: number; b: number; color: string; w: number; fill?: string; o?: number}> = ({d, f, a, b, color, w, fill = 'none', o = 1}) =>
  <path d={d} pathLength={1} fill={fill} stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 1" strokeDashoffset={1 - grow(f, a, b)} opacity={o} />;
const make = (render: (t: Theme, f: number, fps: number) => ReactNode, label: string, caption = true): FC<SampleProps> => ({theme}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig(), t = themeOf(theme);
  return <SampleFrame theme={t} frame={f} label={label} caption={caption}>{render(t, f, fps)}</SampleFrame>;
};

// Nét vẽ tay: an open book drawn in one line, then a sprout growing out of it, its leaves and a soft glow.
export const NetVe = make((t, f) => {const c = strokeOf(t), w = t.stroke.width * 1.4;return <g>
  <circle cx={540} cy={860} r={60 + 150 * grow(f, 110, 170)} fill={t.palette.accent2} opacity={.16 * grow(f, 110, 150)} />
  <Ink d="M300 1150 C380 1110 470 1112 540 1150 C610 1112 700 1110 780 1150 L780 1260 C700 1222 610 1224 540 1260 C470 1224 380 1222 300 1260 Z M540 1150 L540 1260" f={f} a={10} b={70} color={c} w={w} />
  <Ink d="M540 1150 C530 1060 560 980 540 880 C530 830 545 790 560 760" f={f} a={60} b={100} color={c} w={w} />
  <Ink d="M542 1010 C470 1000 420 950 410 900 C470 900 530 940 542 1010 Z" f={f} a={90} b={120} color={c} w={w} />
  <Ink d="M548 930 C610 910 660 860 670 810 C610 810 556 850 548 930 Z" f={f} a={105} b={135} color={c} w={w} />
  <Ink d="M558 770 C590 740 620 730 650 735 C630 765 600 780 558 770 Z" f={f} a={120} b={145} color={c} w={w} />
</g>;}, 'NÉT VẼ TAY');

// Ảnh tĩnh chuyển động chậm: two existing still images without faces (people-pleasing) with a slow push and drift, a cross-fade and
// drifting dust; the theme gives the ground, dust and caption colours.
export const AnhTinh: FC<SampleProps> = ({theme}) => {const f = useCurrentFrame(), t = themeOf(theme), cross = interpolate(f, [80, 110], [0, 1], clamp);
  const shot = (file: string, a: number, o: number, dir: number) => <Img src={staticFile(file)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: o,
    transform: `scale(${1.06 + .08 * interpolate(f, [a, a + 180], [0, 1], clamp)}) translateX(${dir * interpolate(f, [a, a + 180], [-12, 12], clamp)}px)`}} />;
  return <SampleFrame theme={t} frame={f} label="ẢNH TĨNH CHUYỂN ĐỘNG CHẬM">
    <foreignObject x={0} y={0} width={1080} height={1920}><div style={{position: 'relative', width: 1080, height: 1920, overflow: 'hidden'}}>
      {shot('people-pleasing/images/03-silk.png', 0, 1 - cross, 1)}{shot('people-pleasing/images/04-gate.png', 80, cross, -1)}
      <div style={{position: 'absolute', inset: 0, background: `linear-gradient(transparent 55%, ${t.palette.background} 92%)`}} /></div></foreignObject>
    {Array.from({length: 30}, (_, i) => <circle key={i} cx={(random(`ax${i}`) * 1080 + f * (.3 + random(`as${i}`))) % 1080} cy={300 + random(`ay${i}`) * 1100} r={1.5 + random(`ar${i}`) * 2.5} fill={t.palette.accent} opacity={.25 + .35 * Math.sin((f + i * 11) / 20) ** 2} />)}
  </SampleFrame>;};

// Tranh vector tô màu: a painted valley at dusk built from gradient-filled shapes, a soft sun glow, drifting clouds and
// light rising on the water; colours come from the theme.
export const TranhVector = make((t, f) => {const p = t.palette, rise = grow(f, 0, 150), drift = f * .6;return <g>
  <defs><linearGradient id="tv-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.background} /><stop offset="1" stopColor={p.surface} /></linearGradient>
    <linearGradient id="tv-hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.muted} stopOpacity={.55} /><stop offset="1" stopColor={p.background} /></linearGradient>
    <linearGradient id="tv-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.accent} stopOpacity={.35} /><stop offset="1" stopColor={p.background} stopOpacity={.1} /></linearGradient>
    <radialGradient id="tv-sun"><stop offset="0" stopColor={p.accent2} stopOpacity={.9} /><stop offset="1" stopColor={p.accent} stopOpacity={0} /></radialGradient>
    <filter id="tv-soft"><feGaussianBlur stdDeviation="6" /></filter></defs>
  <rect x={60} y={380} width={960} height={940} rx={24} fill="url(#tv-sky)" />
  <circle cx={540} cy={860 - rise * 120} r={260} fill="url(#tv-sun)" />
  <circle cx={540} cy={860 - rise * 120} r={70} fill={p.accent} />
  {[0, 1].map((k) => <ellipse key={k} cx={((260 + k * 420 + drift * (k ? .7 : 1)) % 1100) - 20} cy={560 + k * 70} rx={130} ry={26} fill={p.ink} opacity={.18} filter="url(#tv-soft)" />)}
  <path d="M60 980 C220 860 360 900 480 960 C620 1030 760 880 1020 940 L1020 1320 L60 1320 Z" fill="url(#tv-hill)" />
  <path d="M60 1090 C260 1040 420 1100 600 1080 C780 1060 900 1100 1020 1080 L1020 1320 L60 1320 Z" fill={p.surface} />
  <rect x={160} y={1150} width={760} height={120} rx={60} fill="url(#tv-water)" />
  {[0, 1, 2].map((k) => <path key={k} d={`M${380 + k * 60} ${1180 + k * 26} l${120 - k * 30} 0`} stroke={p.accent} strokeWidth={6} strokeLinecap="round" opacity={(.3 + .5 * rise) * (.6 + .4 * Math.sin((f + k * 20) / 12))} />)}
</g>;}, 'TRANH VECTOR TÔ MÀU');

// Chữ chuyển động: the sample sentence word by word with springs, set as centred lines; the keyword larger, in the
// accent, and underlined once it is complete.
export const ChuChuyenDong = make((t, f, fps) => {
  const kw = t.sample.keyword, at = t.sample.caption.indexOf(kw), p = t.palette;
  // The keyword stays one token so it never breaks across lines.
  const words = at < 0 ? t.sample.caption.split(' ') : [...t.sample.caption.slice(0, at).split(' '), kw, ...t.sample.caption.slice(at + kw.length).split(' ')].filter(Boolean);
  const key = [kw], size = (w: string) => key.includes(w) ? 112 : 84;
  const width = (w: string) => w.length * size(w) * .6 + 34, lines: string[][] = [[]];
  for (const w of words) {const line = lines[lines.length - 1];if (line.length && line.reduce((a, x) => a + width(x), 0) + width(w) > 860) lines.push([w]);else line.push(w);}
  let n = 0, keyLine = 0;
  // Each line is one <text> so the browser spaces the words; each word pops in by size and opacity.
  const rows = lines.map((line, r) => <text key={r} x={540} y={700 + r * 150} textAnchor="middle" fontFamily={FONT} fontWeight={700}>
    {line.map((w, k) => {const i = n++, s = spring({frame: f - 8 - i * 5, fps, config: {damping: 12}});if (key.includes(w)) keyLine = r;
      return <tspan key={k} fontSize={size(w) * (.7 + .3 * s)} fill={key.includes(w) ? p.accent : p.ink} fillOpacity={s}>{(k ? ' ' : '') + w}</tspan>;})}
  </text>);
  return <g>{rows}<rect x={540 - 260 * grow(f, 90, 120)} y={700 + keyLine * 150 + 34} width={520 * grow(f, 90, 120)} height={10} rx={5} fill={p.accent} /></g>;}, 'CHỮ CHUYỂN ĐỘNG', false);

// Cắt giấy: three paper hills and a sun slide in with soft shadows and a slight bob.
export const CatGiay = make((t, f, fps) => {const p = t.palette;const layer = (i: number) => spring({frame: f - i * 10, fps, config: {damping: 14}});
  const hill = (y: number, amp: number, color: string, i: number) => <g transform={`translate(0 ${(1 - layer(i)) * 500 + Math.sin((f + i * 20) / 30) * 4})`}>
    <path d={`M0 ${y + 30} C200 ${y - amp} 400 ${y + amp} 600 ${y} C780 ${y - amp} 900 ${y + amp / 2} 1080 ${y - 10} L1080 1340 L0 1340 Z`} fill="#000" opacity={.18} transform="translate(8 14)" />
    <path d={`M0 ${y + 30} C200 ${y - amp} 400 ${y + amp} 600 ${y} C780 ${y - amp} 900 ${y + amp / 2} 1080 ${y - 10} L1080 1340 L0 1340 Z`} fill={color} />
  </g>;
  return <g><circle cx={760} cy={700 - layer(0) * 80} r={110} fill={p.accent} opacity={layer(0)} />{hill(900, 90, p.surface, 1)}{hill(1040, 70, p.accent2, 2)}{hill(1180, 60, p.muted, 3)}</g>;}, 'CẮT GIẤY');

// Phấn trên bảng: a chalk circle and arrow with a jitter that changes every 4 frames, dust falling.
export const PhanBang = make((t, f) => {const p = t.palette, step = Math.floor(f / 4), j = (k: number) => (random(`${k}-${step}`) - .5) * 6;
  const wobble = Array.from({length: 33}, (_, i) => {const a = i / 32 * Math.PI * 2;return `${i ? 'L' : 'M'}${540 + Math.cos(a) * (220 + j(i))} ${900 + Math.sin(a) * (220 + j(i + 40))}`;}).join(' ');
  return <g>
    <Ink d={wobble} f={f} a={8} b={60} color={p.ink} w={7} o={.9} />
    <Ink d={`M300 ${1260 + j(1)} C420 ${1180 + j(2)} 560 ${1180 + j(3)} 690 ${1120 + j(4)} M650 1100 L700 1120 L660 1160`} f={f} a={60} b={100} color={p.accent} w={7} />
    <text x={540} y={930} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={96} fill={p.ink} opacity={grow(f, 60, 80)}>1%</text>
    {Array.from({length: 14}, (_, i) => {const y = 1150 + ((f * (1 + i % 3) + i * 50) % 220);return <circle key={i} cx={320 + i * 30} cy={y} r={3} fill={p.ink} opacity={.4} />;})}
  </g>;}, 'PHẤN TRÊN BẢNG');

// Bóng đổ ngược sáng: a big sun, a faceless silhouette walking across a hill line.
export const BongDo = make((t, f) => {const p = t.palette, x = interpolate(f, [0, 180], [180, 820]), leg = Math.sin(f / 5) * 18;
  return <g>
    <circle cx={540} cy={980} r={330} fill={p.accent} opacity={.9} />
    <path d="M0 1180 C300 1120 700 1140 1080 1100 L1080 1340 L0 1340 Z" fill={p.ink} />
    <g transform={`translate(${x} ${1150 - Math.sin(f / 5) * 3})`} fill={p.ink} stroke={p.ink} strokeWidth={22} strokeLinecap="round">
      <circle cx={0} cy={-250} r={34} stroke="none" /><path d="M0 -215 L0 -90" /><path d={`M0 -90 L${leg} 0 M0 -90 L${-leg} 0`} /><path d={`M0 -190 L${-leg} -120 M0 -190 L${leg} -120`} />
    </g>
  </g>;}, 'BÓNG ĐỔ NGƯỢC SÁNG');

// Đồ họa thông tin: a percentage counting up in a ring, three bars growing.
export const Infographic = make((t, f) => {const p = t.palette, v = grow(f, 10, 90), r = 170, c = 2 * Math.PI * r;
  return <g>
    <circle cx={540} cy={760} r={r} fill="none" stroke={p.surface} strokeWidth={34} />
    <circle cx={540} cy={760} r={r} fill="none" stroke={p.accent} strokeWidth={34} strokeLinecap="round" strokeDasharray={`${c * .37 * v} ${c}`} transform="rotate(-90 540 760)" />
    <text x={540} y={790} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={110} fill={p.ink}>{Math.round(37 * v)}x</text>
    {[0, 1, 2].map((k) => {const h = [140, 230, 330][k] * grow(f, 60 + k * 12, 110 + k * 12);return <rect key={k} x={300 + k * 180} y={1300 - h} width={120} height={h} rx={14} fill={k === 2 ? p.accent : p.accent2} />;})}
  </g>;}, 'ĐỒ HỌA THÔNG TIN');

// Mực loang: ink blots spreading with a turbulent edge, a brush sweep and a red seal.
export const MucLoang = make((t, f) => {const p = t.palette;return <g>
  <defs><filter id="bleed"><feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves={3} seed={3} /><feDisplacementMap in="SourceGraphic" scale={46} /></filter>
    <clipPath id="brush"><rect x={160} y={1040} width={760 * grow(f, 70, 120)} height={140} /></clipPath></defs>
  <g filter="url(#bleed)">{[[420, 760, 170], [650, 860, 120], [520, 980, 80]].map(([x, y, r], k) => <circle key={k} cx={x} cy={y} r={r * grow(f, 4 + k * 14, 60 + k * 14)} fill={p.ink} opacity={.85 - k * .2} />)}</g>
  <path d="M170 1110 C330 1070 520 1150 700 1100 C800 1075 860 1090 910 1110" fill="none" stroke={p.ink} strokeWidth={46} strokeLinecap="round" clipPath="url(#brush)" filter="url(#bleed)" opacity={.85} />
  <rect x={800} y={600} width={90} height={90} rx={8} fill={p.accent} opacity={grow(f, 120, 132)} transform={`rotate(-6 845 645)`} />
</g>;}, 'MỰC LOANG');

// Hạt và ánh sáng: drifting particles and a breathing circle (4 s in, 4 s out feels calm; here one 6 s breath).
export const HatAnhSang = make((t, f) => {const p = t.palette, breath = .5 - .5 * Math.cos(f / 180 * Math.PI * 2);return <g>
  {[0, 1, 2].map((k) => <circle key={k} cx={540} cy={900} r={(140 + k * 70) * (.75 + .35 * breath)} fill={p.accent} opacity={.16 - k * .04} />)}
  <circle cx={540} cy={900} r={110 * (.8 + .3 * breath)} fill="none" stroke={p.accent} strokeWidth={4} />
  {Array.from({length: 40}, (_, i) => {const x = random(`px${i}`) * 1080, y = (random(`py${i}`) * 1300 + 300 - f * (0.6 + random(`ps${i}`))) % 1300 + 300;
    return <circle key={i} cx={x + Math.sin((f + i * 30) / 25) * 14} cy={y} r={2 + random(`pr${i}`) * 4} fill={p.accent2} opacity={.25 + .5 * random(`po${i}`)} />;})}
</g>;}, 'HẠT VÀ ÁNH SÁNG');

// Hình khối biến đổi: one 4-point shape morphing circle → square → triangle-like, spinning on springs.
const shape = (k: number) => Array.from({length: 24}, (_, i) => {const a = i / 24 * Math.PI * 2 - Math.PI / 2;
  const circle = 1, square = 1 / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a))) * .8, tri = .6 / Math.cos(((a + Math.PI / 2) % (Math.PI * 2 / 3)) - Math.PI / 3);
  const r = k < 1 ? circle + (square - circle) * k : square + (tri - square) * (k - 1);return [Math.cos(a) * r * 230, Math.sin(a) * r * 230];});
export const HinhKhoi = make((t, f, fps) => {const p = t.palette, k = spring({frame: f - 30, fps, config: {damping: 14}}) + spring({frame: f - 100, fps, config: {damping: 14}}), pts = shape(Math.min(2, k));
  return <g>
    {Array.from({length: 9}, (_, i) => <path key={i} d={`M${i * 135} 300 L${i * 135} 1340`} stroke={p.surface} strokeWidth={2} transform={`translate(${(f * 1.2) % 135} 0)`} />)}
    <path d={'M' + pts.map(([x, y]) => `${540 + x} ${900 + y}`).join(' L') + ' Z'} fill={p.accent} transform={`rotate(${k * 60} 540 900)`} />
    <circle cx={540 + Math.cos(f / 15) * 320} cy={900 + Math.sin(f / 15) * 320} r={22} fill={p.accent2} />
  </g>;}, 'HÌNH KHỐI BIẾN ĐỔI');

// Trang sổ tay: ruled lines, a highlighter sweep over a line of text, a sticky note dropping in, a hand arrow.
export const SoTay = make((t, f, fps) => {const p = t.palette, drop = spring({frame: f - 70, fps, config: {damping: 11}});return <g>
  <rect x={130} y={420} width={820} height={920} rx={16} fill={p.surface} opacity={.6} />
  {Array.from({length: 10}, (_, i) => <path key={i} d={`M170 ${500 + i * 84} L910 ${500 + i * 84}`} stroke={p.muted} strokeWidth={2} opacity={.5} />)}
  <rect x={190} y={622} width={560 * grow(f, 20, 55)} height={64} fill={p.accent} opacity={.45} rx={6} />
  <text x={200} y={672} fontFamily={FONT} fontWeight={700} fontSize={54} fill={p.ink}>Làm thử 2 phút</text>
  <text x={200} y={840} fontFamily={FONT} fontWeight={700} fontSize={54} fill={p.ink} opacity={grow(f, 40, 55)}>Viết ra một câu</text>
  <g transform={`translate(${600} ${1000 - (1 - drop) * 500}) rotate(${(1 - drop) * 20 - 4})`}><rect x={0} y={0} width={260} height={220} fill={p.accent2} opacity={.9} /><text x={130} y={125} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={46} fill={p.background}>Sáng mai</text></g>
  <Ink d="M300 1000 C340 1120 460 1150 560 1100 M530 1078 L566 1100 L540 1134" f={f} a={100} b={140} color={p.ink} w={6} />
</g>;}, 'TRANG SỔ TAY', false);

export const SAMPLES: Record<string, FC<SampleProps>> = {PhongCachNetVe: NetVe, PhongCachAnhTinh: AnhTinh, PhongCachTranhVector: TranhVector, PhongCachChuChuyenDong: ChuChuyenDong, PhongCachCatGiay: CatGiay, PhongCachPhanBang: PhanBang,
  PhongCachBongDo: BongDo, PhongCachInfographic: Infographic, PhongCachMucLoang: MucLoang, PhongCachHatAnhSang: HatAnhSang, PhongCachHinhKhoi: HinhKhoi, PhongCachSoTay: SoTay};
