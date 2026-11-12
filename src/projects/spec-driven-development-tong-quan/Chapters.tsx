import type {FC, ReactNode} from 'react';
import {Img, staticFile} from 'remotion';
import {DiagramWire, Label, Mark, grow} from '../../looks/diagram-kit';
import {Stage, THEME, useBeat} from './common';
import type {Seg} from './common';

// Spec Driven Development — summary of the whole book, explained simply (user 2026-11-12 on the previous technical book:
// "tóm tắt được cuốn sách sau đó làm ra 1 video giải thích 1 cách đơn giản nhất"). Script and scene plan:
// docs/projects/spec-driven-development-tong-quan/{script,image-prompts}.md (OpenCode design, 2026-11-12).
// One large diagram per idea, few words, no code text. Recurring pictures: an amber document card is a spec (what we
// want, written down), a cyan box is the AI, a grey card with bars is code, red is a bug or a guess. The core chain
// người → spec → AI → code comes back in every chapter. Beats follow sentence numbers in script.md (0-based per
// section); scene changes are sequential (common.tsx). Layout: drawings in y 120–870, words ≥ 34 px; checked with
// `npm run layout-check`.

const t = THEME, p = t.palette, BAD = '#ff6b6b', SPEC = p.accent, AI = p.accent2;

const Title: FC<{children: ReactNode; o: number; y?: number; color?: string}> = ({children, o, y = 150, color}) =>
  <Label t={t} x={960} y={y} size={52} opacity={o} color={color}>{children}</Label>;

// A centred box with a label and an optional second line.
const Card: FC<{x: number; y: number; w: number; h: number; o?: number; tone?: string; label?: string; sub?: string; size?: number; subSize?: number;
  labelColor?: string; dash?: boolean; thick?: number}> =
  ({x, y, w, h, o = 1, tone = AI, label, sub, size = 42, subSize = 34, labelColor, dash, thick = 4}) =>
    <g opacity={o}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={22} fill={p.surface} stroke={tone} strokeWidth={thick} strokeDasharray={dash ? '16 12' : undefined} />
      {label ? <Label t={t} x={x} y={sub ? y - 6 : y + size * .36} size={size} color={labelColor ?? p.ink}>{label}</Label> : null}
      {sub ? <Label t={t} x={x} y={y + subSize + 12} size={subSize} weight={400} color={p.muted}>{sub}</Label> : null}
    </g>;

// Code without code text: a card with grey bars that appear one by one from `at` (frames).
const CodeCard: FC<{f: number; x: number; y: number; w: number; h: number; at: number; o?: number; lines?: number; tone?: string}> =
  ({f, x, y, w, h, at, o = 1, lines = 7, tone = p.muted}) => {
    const gap = (h - 60) / lines;
    return <g opacity={o}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={18} fill={p.background} stroke={tone} strokeWidth={4} />
      {Array.from({length: lines}, (_, k) => <rect key={k} x={x - w / 2 + 34 + (k % 3 === 1 ? 40 : 0)} y={y - h / 2 + 34 + k * gap}
        width={(w - 100) * [0.8, 0.6, 0.7, 0.9, 0.5, 0.75, 0.65, 0.85][k % 8] * grow(f, at + k * 4, at + k * 4 + 10)} height={gap * .42} rx={6} fill={p.muted} opacity={.55} />)}
    </g>;
  };

// A spec: an amber document with a folded corner.
const SpecDoc: FC<{x: number; y: number; w?: number; h?: number; o?: number; label?: string; sub?: string}> = ({x, y, w = 300, h = 220, o = 1, label = 'spec', sub}) =>
  <g opacity={o}>
    <path d={`M${x - w / 2} ${y - h / 2} H${x + w / 2 - 44} L${x + w / 2} ${y - h / 2 + 44} V${y + h / 2} H${x - w / 2} Z`} fill={p.surface} stroke={SPEC} strokeWidth={4} strokeLinejoin="round" />
    <path d={`M${x + w / 2 - 44} ${y - h / 2} V${y - h / 2 + 44} H${x + w / 2}`} fill="none" stroke={SPEC} strokeWidth={3} />
    <Label t={t} x={x} y={sub ? y - 8 : y + 15} size={42} color={SPEC}>{label}</Label>
    {sub ? <Label t={t} x={x} y={y + 46} size={34} weight={400} color={p.ink}>{sub}</Label> : null}
  </g>;

// A list row: a tick or cross and a few words.
const Row: FC<{f: number; x: number; y: number; text: string; at: number; ok?: boolean; size?: number; o?: number}> =
  ({f, x, y, text, at, ok = true, size = 42, o = 1}) =>
    <g opacity={grow(f, at, at + 10) * o}>
      <Mark t={t} f={f} x={x + 20} y={y - size * .34} ok={ok} at={at + 2} size={size * .9} />
      <Label t={t} x={x + 64} y={y} anchor="start" size={size} weight={400} color={p.ink}>{text}</Label>
    </g>;

// ---- 00 · opening ------------------------------------------------------------------------------------------------
export const MoDau: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, pop} = useBeat(s);
  // A point k (0..1) of the way through sentence i, for sentences long enough to carry two pictures.
  const mid = (i: number, k: number) => Math.round(at(i) + (at(i + 1) - at(i)) * k);
  const later = grow(f, mid(2, .05), mid(2, .05) + 12);
  const intent = f < mid(4, .62) ? 1 : 1 - .65 * grow(f, mid(4, .62), mid(4, .62) + 40) + .08 * Math.sin(f / 7);
  const stack = 1 - grow(f, mid(6, .42), mid(6, .42) + 8);
  const chain: [string, number, number][] = [['người', 230, 240], ['AI', 1290, 240], ['code', 1690, 260]];
  return <Stage>
    {/* A · 0–3: AI writes a feature in ten minutes; two weeks later nobody knows why the code does what it does */}
    <g opacity={span(0, 3)}>
      <Title o={later}>Hai tuần sau</Title>
      <Card x={330} y={430} w={300} h={180} o={pop(0, .2)} tone={AI} label="AI" sub="viết code" />
      <Label t={t} x={330} y={600} size={44} color={SPEC} opacity={pop(0, 1.4)}>10 phút</Label>
      <DiagramWire t={t} f={f} pts={[[484, 430], [736, 430]]} at={at(0, .8)} />
      <CodeCard f={f} x={960} y={430} w={420} h={300} at={at(0, 1)} o={pop(0, .9)} tone={f > mid(2, .05) ? BAD : p.muted} />
      <g opacity={1 - .6 * later}>
        <Row f={f} x={1240} y={390} text="code chạy" at={at(1)} />
        <Row f={f} x={1240} y={480} text="test xanh" at={at(1, .7)} />
      </g>
      <g opacity={later}>
        <circle cx={1150} cy={360} r={34} fill={p.background} stroke={BAD} strokeWidth={5} />
        <Label t={t} x={1150} y={375} size={40} color={BAD}>!</Label>
      </g>
      <DiagramWire t={t} f={f} pts={[[860, 584], [700, 690]]} at={mid(2, .45)} color={SPEC} />
      <DiagramWire t={t} f={f} pts={[[1060, 584], [1220, 690]]} at={mid(2, .6)} color={BAD} />
      <Card x={620} y={750} w={440} h={110} o={grow(f, mid(2, .45), mid(2, .45) + 12)} tone={SPEC} label="đúng nghiệp vụ?" size={40} />
      <Card x={1300} y={750} w={440} h={110} o={grow(f, mid(2, .6), mid(2, .6) + 12)} tone={BAD} label="AI đoán bừa?" size={40} />
    </g>
    {/* B · 4: the book — code stays, the intent behind it gets lost */}
    <g opacity={span(4, 4)}>
      <foreignObject x={120} y={200} width={380} height={560}>
        <Img src={staticFile('spec-driven-development-tong-quan/images/book-cover.jpg')} style={{width: '100%', height: '100%', objectFit: 'contain', borderRadius: 12,
          opacity: grow(f, at(4), at(4) + 16)}} />
      </foreignObject>
      <Label t={t} x={1210} y={270} size={60} opacity={pop(4, .3)}>Spec Driven Development</Label>
      <Label t={t} x={1210} y={330} size={36} weight={400} color={p.muted} opacity={pop(4, .6)}>Nguyễn Thế Huy</Label>
      <Card x={920} y={570} w={420} h={190} o={grow(f, mid(4, .45), mid(4, .45) + 12)} tone={p.muted} label="code" sub="vẫn còn đó" />
      <Card x={1500} y={570} w={500} h={190} o={grow(f, mid(4, .62), mid(4, .62) + 12) * intent} tone={SPEC} dash label="ý định phía sau" sub="dễ mất" labelColor={SPEC} />
    </g>
    {/* C · 5: where the video goes */}
    <g opacity={span(5, 5)}>
      <Title o={pop(5)}>Video đi qua</Title>
      {([['cái bẫy', 'của tốc độ', BAD], ['viết spec', 'bốn tầng', SPEC], ['6 nguyên tắc', 'vận hành', SPEC], ['áp dụng', 'dự án mới · mã cũ', AI]] as [string, string, string][])
        .map(([label, sub, tone], k) => {const a = mid(5, .22 + k * .17);return <g key={k}>
          <Card x={270 + k * 460} y={480} w={380} h={190} o={grow(f, a, a + 12)} tone={tone} label={label} sub={sub} size={44} subSize={32} />
          {k ? <DiagramWire t={t} f={f} pts={[[270 + (k - 1) * 460 + 194, 480], [270 + k * 460 - 194, 480]]} at={a - 4} /> : null}</g>;})}
    </g>
    {/* D · 6: no heavy paperwork — just say clearly what you want before the AI writes */}
    <g opacity={span(6, 6)}>
      <g opacity={stack * pop(6)}>
        {[2, 1, 0].map((k) => <g key={k}>
          <rect x={790 + k * 26} y={250 + k * 26} width={300} height={400} rx={10} fill={p.surface} stroke={p.muted} strokeWidth={3} />
          {k === 0 ? Array.from({length: 9}, (_, j) => <rect key={j} x={830} y={300 + j * 38} width={220 - (j % 3) * 40} height={14} rx={5} fill={p.muted} opacity={.5} />) : null}
        </g>)}
        <Mark t={t} f={f} x={960} y={470} ok={false} at={mid(6, .15)} size={160} />
        <Label t={t} x={960} y={770} size={44} color={BAD} opacity={grow(f, mid(6, .15), mid(6, .15) + 12)}>giấy tờ nặng nề</Label>
      </g>
      <g opacity={grow(f, mid(6, .45), mid(6, .45) + 12)}>
        {chain.map(([label, x, w], k) => <Card key={k} x={x} y={470} w={w} h={150} tone={k === 0 ? p.ink : k === 1 ? AI : p.muted} label={label} />)}
        <SpecDoc x={760} y={470} w={480} h={230} sub="nói rõ mình muốn gì" o={grow(f, mid(6, .62), mid(6, .62) + 12)} />
        <DiagramWire t={t} f={f} pts={[[354, 470], [516, 470]]} at={mid(6, .62)} color={SPEC} />
        <DiagramWire t={t} f={f} pts={[[1004, 470], [1166, 470]]} at={mid(6, .75)} />
        <DiagramWire t={t} f={f} pts={[[1414, 470], [1556, 470]]} at={mid(6, .85)} />
        <Label t={t} x={760} y={680} size={40} color={SPEC} opacity={grow(f, mid(6, .7), mid(6, .7) + 12)}>trước khi bảo AI viết</Label>
      </g>
    </g>
  </Stage>;
};
