import type {FC, ReactNode} from 'react';
import {Img, staticFile} from 'remotion';
import {Chip, DiagramPacket, DiagramWire, Label, Mark, grow} from '../../looks/diagram-kit';
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

// The one callout slot, above the captions.
const Say: FC<{o: number; text: string; tone?: 'accent' | 'accent2' | 'bad' | 'muted'}> = ({o, text, tone = 'accent'}) =>
  o > 0 ? <g opacity={o}><Chip t={t} f={12} x={960} y={826} text={text} at={0} size={38} tone={tone} /></g> : null;

// A row of numbered stops (days, steps); `state(k)`: 0 waiting (dim), 1 now (amber), 2 done.
const Track: FC<{items: string[]; y: number; w: number; o: number; state: (k: number) => number; size?: number}> = ({items, y, w, o, state, size = 36}) => {
  const step = Math.min(w + 40, 1680 / items.length), x0 = 960 - step * (items.length - 1) / 2;
  return <g opacity={o}>
    {items.map((x, k) => {const st = state(k);return <g key={k} opacity={st === 0 ? .35 : 1}>
      <rect x={x0 + k * step - w / 2} y={y - 42} width={w} height={84} rx={16} fill={p.surface} stroke={st === 1 ? SPEC : st === 2 ? AI : p.muted} strokeWidth={st === 1 ? 6 : 3} />
      <Label t={t} x={x0 + k * step} y={y + size * .36} size={size} color={st === 1 ? SPEC : p.ink}>{x}</Label></g>;})}
  </g>;
};

const hexPath = (cx: number, cy: number, r: number) => Array.from({length: 6}, (_, k) => {const a = Math.PI / 3 * k;return `${k ? 'L' : 'M'}${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;}).join(' ') + ' Z';
const swap = (f: number, a: number): [number, number] => [1 - grow(f, a, a + 8), grow(f, a + 8, a + 16)];

// useBeat plus mid(i, k): a point k (0..1) of the way through sentence i.
const useB = (s: Seg) => {
  const b = useBeat(s);
  return {...b, mid: (i: number, k: number) => Math.round(b.at(i) + (b.at(i + 1) - b.at(i)) * k)};
};

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

// ---- 01 · vibe coding and the speed trap -------------------------------------------------------------------------
export const VibeCoding: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, only, pop, mid} = useB(s);
  const outputs = ['lớp', 'test', 'tài liệu'];
  return <Stage>
    {/* A · 0–3: Nam ships in twenty minutes; weeks later one status means three things */}
    <g opacity={span(0, 3)}>
      <Title o={pop(0)}>Nam và Linh · sản phẩm cho vay</Title>
      <g opacity={1 - grow(f, at(2), at(2) + 8)}>
        <Card x={330} y={450} w={300} h={180} o={pop(1)} tone={AI} label="AI" sub="một câu nhắc" />
        <Label t={t} x={330} y={620} size={44} color={SPEC} opacity={pop(1, 1.5)}>20 phút</Label>
        <DiagramWire t={t} f={f} pts={[[484, 450], [736, 450]]} at={at(1, .6)} />
        {outputs.map((x, k) => <Card key={k} x={900} y={310 + k * 140} w={300} h={110} o={pop(1, 1 + k * .5)} tone={p.muted} label={x} size={40} />)}
        <Row f={f} x={1180} y={465} text="giao đúng hạn" at={mid(1, .8)} />
      </g>
      <g opacity={grow(f, at(2) + 8, at(2) + 20)}>
        <Label t={t} x={960} y={250} size={44} color={p.muted}>vài tuần sau: "trạng thái xác minh khách hàng"</Label>
        {[0, 1, 2].map((k) => <g key={k}>
          <CodeCard f={f} x={420 + k * 540} y={450} w={380} h={240} at={at(2, .3 + k * .3)} lines={5} tone={BAD} />
          <Chip t={t} f={f} x={420 + k * 540} y={630} text={`cách hiểu ${k + 1}`} at={at(2, 1 + k * .5)} size={36} tone="bad" /></g>)}
        <g opacity={pop(3)}>
          <Row f={f} x={170} y={760} text="không ghi chú" at={at(3)} ok={false} size={38} />
          <Row f={f} x={680} y={760} text="không đặc tả" at={at(3, .6)} ok={false} size={38} />
          <Row f={f} x={1180} y={760} text="AI chỉ đọc lại code" at={mid(3, .55)} ok={false} size={38} />
        </g>
      </g>
    </g>
    {/* B · 4: three days became eleven */}
    <g opacity={span(4, 4)}>
      <Title o={pop(4)}>Thêm một tính năng mới</Title>
      <Label t={t} x={470} y={400} anchor="end" size={42} color={p.muted} opacity={pop(4, .3)}>dự tính</Label>
      <rect x={500} y={360} width={300 * grow(f, at(4, .4), at(4, 1.2))} height={60} rx={10} fill={AI} opacity={.85} />
      <Label t={t} x={830} y={404} anchor="start" size={42} opacity={pop(4, 1.2)}>3 ngày</Label>
      <Label t={t} x={470} y={560} anchor="end" size={42} color={p.muted} opacity={pop(4, 1.4)}>thực tế</Label>
      <rect x={500} y={520} width={1100 * grow(f, mid(4, .4), mid(4, .75))} height={60} rx={10} fill={BAD} opacity={.85} />
      <Label t={t} x={1630} y={564} anchor="start" size={42} color={BAD} opacity={grow(f, mid(4, .75), mid(4, .75) + 12)}>11 ngày</Label>
      <Label t={t} x={960} y={720} size={42} color={SPEC} opacity={grow(f, mid(4, .8), mid(4, .8) + 12)}>vì ai cũng phải đoán lại</Label>
    </g>
    {/* C · 5–6: vibe coding fills the gaps with guesses */}
    <g opacity={span(5, 6)}>
      <Title o={pop(5)}>Vibe coding</Title>
      {['thử nhanh', 'sửa nhanh', 'gộp nhanh'].map((x, k) => <g key={k}>
        <Card x={480 + k * 480} y={300} w={340} h={110} o={pop(5, .6 + k * .4)} tone={AI} label={x} size={40} />
        {k ? <DiagramWire t={t} f={f} pts={[[480 + (k - 1) * 480 + 174, 300], [480 + k * 480 - 174, 300]]} at={at(5, .5 + k * .4)} /> : null}</g>)}
      <g opacity={pop(6)}>
        <rect x={360} y={440} width={600} height={210} rx={18} fill={p.surface} stroke={SPEC} strokeWidth={4} />
        <Label t={t} x={660} y={500} size={40} color={SPEC}>yêu cầu</Label>
        {[0, 1, 2].map((k) => <rect key={k} x={400 + k * 180} y={545} width={150} height={60} rx={10} fill="none" stroke={SPEC} strokeWidth={3} strokeDasharray="10 8" />)}
        <DiagramWire t={t} f={f} pts={[[1180, 545], [968, 545]]} at={at(6, .6)} color={BAD} />
        <Card x={1360} y={545} w={340} h={130} tone={BAD} label="AI đoán" sub="trông hợp lý" o={pop(6, .5)} />
      </g>
      {['tiền', 'quyền truy cập', 'dữ liệu khách hàng'].map((x, k) => <Chip key={k} t={t} f={f} x={520 + k * 440} y={760} text={x} at={mid(6, .5 + k * .1)} size={36} tone="bad" />)}
    </g>
    {/* D · 7: tests generated from the code only prove the code does what the code does */}
    <g opacity={span(7, 7)}>
      <Title o={pop(7)}>An toàn giả</Title>
      <CodeCard f={f} x={640} y={460} w={380} h={280} at={at(7)} />
      <Card x={1280} y={460} w={340} h={200} tone={AI} label="test do AI sinh" size={38} o={pop(7, .4)} />
      <path d="M840 400 C 960 300 1000 300 1100 380" fill="none" stroke={AI} strokeWidth={4} opacity={pop(7, .8)} />
      <path d="M1100 540 C 1000 620 960 620 840 520" fill="none" stroke={AI} strokeWidth={4} opacity={pop(7, 1.1)} />
      <Label t={t} x={960} y={720} size={46} color={SPEC} opacity={grow(f, mid(7, .7), mid(7, .7) + 12)}>chứng minh code làm đúng… code</Label>
    </g>
    {/* E · 8–10: SDD puts a spec in the middle */}
    <g opacity={span(8, 10)}>
      <Title o={pop(8)}>SDD: tấm spec ở giữa</Title>
      <Card x={240} y={460} w={260} h={150} tone={p.ink} label="người" o={pop(8, .3)} />
      <SpecDoc x={700} y={460} w={400} h={240} sub="ý định đã thống nhất" o={pop(8, 1)} />
      <Card x={1170} y={460} w={240} h={150} tone={AI} label="AI" o={pop(8, 1.8)} />
      <DiagramWire t={t} f={f} pts={[[374, 460], [496, 460]]} at={at(8, .9)} color={SPEC} />
      <DiagramWire t={t} f={f} pts={[[904, 460], [1046, 460]]} at={at(8, 1.9)} />
      {['code', 'test', 'tài liệu'].map((x, k) => <g key={k}>
        <Card x={1620} y={300 + k * 160} w={280} h={110} tone={p.muted} label={x} size={40} o={grow(f, mid(8, .65 + k * .1), mid(8, .65 + k * .1) + 12)} />
        <DiagramWire t={t} f={f} pts={[[1294, 460], [1476, 300 + k * 160]]} at={mid(8, .62 + k * .1)} /></g>)}
      <g opacity={only(9)}>
        <path d="M1620 680 C 1600 800 800 800 720 600" fill="none" stroke={BAD} strokeWidth={5} strokeDasharray="14 10" />
        <Label t={t} x={1160} y={700} size={42} color={BAD}>sai thì sửa spec trước</Label>
      </g>
      <g opacity={only(10)}>
        <Row f={f} x={170} y={720} text="tuần đầu: chậm hơn một chút" at={at(10)} ok={false} size={38} />
        <Row f={f} x={980} y={720} text="về sau: đọc, sửa, bàn giao đỡ đoán" at={mid(10, .45)} size={38} />
      </g>
    </g>
    {/* F · 11–12: not waterfall */}
    <g opacity={span(11, 12)}>
      <Title o={pop(11)}>Không phải waterfall</Title>
      <g opacity={pop(11, .3)}>
        {[2, 1, 0].map((k) => <rect key={k} x={250 + k * 24} y={270 + k * 24} width={380} height={460} rx={10} fill={p.surface} stroke={p.muted} strokeWidth={3} />)}
        <Label t={t} x={440} y={360} size={40} color={p.muted}>hồ sơ dày</Label>
        <Label t={t} x={440} y={430} size={40} color={p.muted}>chờ chữ ký</Label>
        <Mark t={t} f={f} x={460} y={600} ok={false} at={at(11, .6)} size={150} />
      </g>
      <SpecDoc x={900} y={330} w={260} h={170} o={pop(12)} label="spec.md" />
      {['file văn bản trong kho mã', 'ngắn, vừa đủ để bắt đầu', 'sai thì sửa', 'kiểm bằng tiêu chí nghiệm thu'].map((x, k) =>
        <Row key={k} f={f} x={1080} y={340 + k * 110} text={x} at={mid(12, .1 + k * .2)} size={38} />)}
    </g>
    {/* G · 13: three questions to keep in mind */}
    <g opacity={span(13, 13)}>
      <Title o={pop(13)}>Ba câu hỏi</Title>
      {['người mới hiểu logic quan trọng bằng cách nào?', 'sửa code AI viết dựa vào đâu?', 'yêu cầu đổi thì phải đụng file nào?'].map((x, k) =>
        <Card key={k} x={960} y={330 + k * 170} w={1300} h={130} tone={SPEC} label={x} size={42} o={grow(f, mid(13, .2 + k * .27), mid(13, .2 + k * .27) + 12)} />)}
    </g>
  </Stage>;
};

// ---- 02 · what a spec is ---------------------------------------------------------------------------------------------
export const SpecLaGi: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, only, pop, mid} = useB(s);
  const layers: [string, string][] = [['yêu cầu nghiệp vụ', 'vì sao làm · đo thành công bằng gì'], ['use case', 'ai làm gì · luồng chính, luồng khác, ngoại lệ'],
    ['mô hình thực thể', 'Đơn hàng · Thanh toán · Phiên mã'], ['tiêu chí nghiệm thu', 'cho trước… khi… thì…']];
  const ui = swap(f, mid(12, .3));
  return <Stage>
    {/* A · 0–1: a three-line story is not a spec; the gaps get filled by the AI */}
    <g opacity={span(0, 1)}>
      <Card x={520} y={430} w={600} h={320} tone={p.muted} o={pop(0, .2)} />
      <Label t={t} x={520} y={330} size={40} opacity={pop(0, .2)}>câu chuyện người dùng</Label>
      {[0, 1, 2].map((k) => <rect key={k} x={290} y={390 + k * 60} width={[420, 360, 300][k] * grow(f, at(0, .5 + k * .2), at(0, .8 + k * .2))} height={26} rx={8} fill={p.muted} opacity={.55} />)}
      <Label t={t} x={520} y={660} size={40} color={BAD} opacity={pop(0, 1.5)}>chưa phải spec</Label>
      <Card x={1360} y={300} w={640} h={120} tone={SPEC} dash label="mã hết hạn: 5 hay 15 phút?" size={40} o={grow(f, mid(1, .15), mid(1, .15) + 12)} />
      <Card x={1360} y={470} w={640} h={120} tone={SPEC} dash label="tiền về chậm thì sao?" size={40} o={grow(f, mid(1, .45), mid(1, .45) + 12)} />
      <Card x={1360} y={650} w={420} h={120} tone={BAD} label="AI tự điền" size={42} o={grow(f, mid(1, .75), mid(1, .75) + 12)} />
    </g>
    {/* B · 2–7: four layers of requirements */}
    <g opacity={span(2, 7)}>
      <Title o={pop(2)}>Bốn tầng yêu cầu</Title>
      {layers.map(([label, sub], k) => {const on = grow(f, at(3 + k), at(3 + k) + 12);return <g key={k} opacity={.3 * pop(2, .3) + .7 * on}>
        <Card x={900} y={290 + k * 150} w={1100} h={124} tone={f > at(3 + k) ? SPEC : p.muted} label={label} sub={on > 0 ? sub : undefined} size={40} subSize={32} />
        <Label t={t} x={300} y={304 + k * 150} size={44} color={SPEC}>{k + 1}</Label></g>;})}
      <DiagramWire t={t} f={f} pts={[[1520, 240], [1520, 760]]} at={at(7, .3)} dur={40} color={SPEC} width={5} />
      <Label t={t} x={1720} y={270} size={36} color={p.muted} opacity={pop(7, .3)}>người làm</Label>
      <Label t={t} x={1720} y={315} size={36} color={p.muted} opacity={pop(7, .3)}>sản phẩm</Label>
      <Label t={t} x={1720} y={740} size={36} color={SPEC} opacity={pop(7, 1.4)}>kiểm thử</Label>
      <Label t={t} x={1720} y={785} size={36} color={SPEC} opacity={pop(7, 1.4)}>được</Label>
    </g>
    {/* C · 8–9: the spec of what runs today, and the spec of a change */}
    <g opacity={span(8, 9)}>
      <Title o={pop(8)}>Hai loại spec</Title>
      <SpecDoc x={560} y={470} w={560} h={300} label="hệ thống đang chạy" o={pop(8, .5)} sub={f > at(9) ? 'sự thật hiện tại' : undefined} />
      <g opacity={pop(8, 2.2)}>
        <path d={`M1080 320 H1556 L1600 364 V620 H1080 Z`} fill={p.surface} stroke={SPEC} strokeWidth={4} strokeDasharray="16 12" />
        <Label t={t} x={1340} y={462} size={42} color={SPEC}>thay đổi sắp làm</Label>
        <Label t={t} x={1340} y={516} size={34} weight={400} opacity={grow(f, at(9, .6), at(9, .6) + 12)}>đề xuất đang bàn</Label>
      </g>
      <Say o={only(9)} text="không trộn sự thật hiện tại với đề xuất" tone="accent2" />
    </g>
    {/* D · 10: one language with the business; one word, two meanings, two contexts */}
    <g opacity={span(10, 10)}>
      <Title o={pop(10)}>Cùng ngôn ngữ với nghiệp vụ</Title>
      {[0, 1].map((k) => <g key={k} opacity={grow(f, mid(10, .45 + k * .15), mid(10, .45 + k * .15) + 12)}>
        <rect x={180 + k * 820} y={260} width={740} height={460} rx={30} fill="none" stroke={k ? SPEC : AI} strokeWidth={4} strokeDasharray="18 12" />
        <Label t={t} x={550 + k * 820} y={330} size={40} color={k ? SPEC : AI}>{k ? 'ngữ cảnh B' : 'ngữ cảnh A'}</Label>
        <Card x={550 + k * 820} y={500} w={420} h={170} tone={k ? SPEC : AI} label="Đơn hàng" sub={k ? 'nghĩa khác' : 'nghĩa này'} /></g>)}
      <Label t={t} x={960} y={790} size={40} color={p.muted} opacity={grow(f, mid(10, .75), mid(10, .75) + 12)}>chia ranh giới khi một từ mang hai nghĩa</Label>
    </g>
    {/* E · 11–12: hexagonal — the core in the middle, adapters plug in around it */}
    <g opacity={span(11, 12)}>
      <path d={hexPath(960, 480, 180)} fill={p.surface} stroke={SPEC} strokeWidth={5} opacity={pop(11, .3)} />
      <Label t={t} x={960} y={472} size={40} color={SPEC} opacity={pop(11, .3)}>lõi</Label>
      <Label t={t} x={960} y={522} size={40} color={SPEC} opacity={pop(11, .3)}>nghiệp vụ</Label>
      <g opacity={grow(f, mid(11, .45), mid(11, .45) + 12)}>
        <rect x={190} y={410} width={400} height={140} rx={22} fill={p.surface} stroke={f > mid(12, .3) ? SPEC : AI} strokeWidth={f > mid(12, .3) ? 6 : 4} />
        <Label t={t} x={390} y={495} size={40} opacity={ui[0]}>giao diện web</Label>
        <Label t={t} x={390} y={495} size={40} color={SPEC} opacity={ui[1]}>giao diện mới</Label>
        <DiagramWire t={t} f={f} pts={[[594, 480], [776, 480]]} at={mid(11, .5)} />
      </g>
      <Card x={1560} y={300} w={420} h={130} tone={AI} label="cơ sở dữ liệu" size={40} o={grow(f, mid(11, .58), mid(11, .58) + 12)} />
      <DiagramWire t={t} f={f} pts={[[1346, 320], [1100, 400]]} at={mid(11, .62)} />
      <Card x={1560} y={660} w={420} h={130} tone={AI} label="cổng thanh toán" size={40} o={grow(f, mid(11, .7), mid(11, .7) + 12)} />
      <DiagramWire t={t} f={f} pts={[[1346, 640], [1100, 560]]} at={mid(11, .74)} />
      <Label t={t} x={1560} y={490} size={36} color={p.muted} opacity={grow(f, mid(11, .8), mid(11, .8) + 12)}>adapter bên ngoài</Label>
      <Say o={only(12)} text="thay một đầu nối, lõi ít bị kéo theo" />
    </g>
    {/* F · 13: not every job needs every layer */}
    <g opacity={span(13, 13)}>
      <Title o={pop(13)}>Chưa cần đủ mọi tầng</Title>
      {([['script', 'chạy một lần'], ['trang quản trị', 'đơn giản'], ['bản thử nghiệm', 'làm nhanh để thử']] as [string, string][]).map(([label, sub], k) =>
        <Card key={k} x={400 + k * 560} y={450} w={480} h={190} tone={p.muted} label={label} sub={sub} o={grow(f, mid(13, .2 + k * .2), mid(13, .2 + k * .2) + 12)} />)}
    </g>
  </Stage>;
};

// ---- 03 · six principles: the list on the left, one picture for the current one on the right ----------------------
export const SauNguyenTac: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, only, pop, mid} = useB(s);
  const names = ['yêu cầu dẫn dắt', 'AI hỗ trợ, người quyết', 'cải tiến theo vòng lặp', 'kiểm thử bảo vệ', 'người liên quan', 'truy vết được'];
  const now = (k: number) => f >= at(1 + 2 * k) && (k === 5 || f < at(3 + 2 * k));
  const cx = 1330;
  const loopPts: [string, number, number][] = [['viết vừa đủ', cx, 290], ['thử', cx + 330, 470], ['nhận phản hồi', cx, 650], ['sửa', cx - 330, 470]];
  return <Stage>
    <g opacity={span(0, 12)}>
      <Title o={pop(0)}>Sáu nguyên tắc</Title>
      {names.map((x, k) => <g key={k} opacity={.3 * pop(0, .4) + .7 * grow(f, at(1 + 2 * k), at(1 + 2 * k) + 10)}>
        <rect x={90} y={232 + k * 100} width={600} height={80} rx={14} fill={p.surface} stroke={now(k) ? SPEC : p.muted} strokeWidth={now(k) ? 5 : 2} />
        <Label t={t} x={120} y={285 + k * 100} anchor="start" size={36} color={now(k) ? SPEC : p.ink}>{`${k + 1} · ${x}`}</Label></g>)}
      {/* 1 · requirements lead: a rule only in code gets scattered; in a spec, people and AI know where to change it */}
      <g opacity={only(1, 2)}>
        <g opacity={1 - grow(f, mid(2, .5), mid(2, .5) + 8)}>
          {[0, 1, 2].map((k) => <g key={k}>
            <CodeCard f={f} x={1000 + k * 330} y={460} w={280} h={220} at={at(1, k * .3)} lines={5} />
            <circle cx={1000 + k * 330 + 80} cy={420 + k * 30} r={16} fill={BAD} opacity={grow(f, at(2, .3 + k * .3), at(2, .5 + k * .3))} /></g>)}
          <Label t={t} x={cx} y={660} size={40} color={BAD} opacity={grow(f, at(2, .8), at(2, 1.1))}>quy tắc rải nhiều chỗ</Label>
        </g>
        <g opacity={grow(f, mid(2, .5) + 8, mid(2, .5) + 20)}>
          <SpecDoc x={cx} y={360} w={340} h={200} label="quy tắc" sub="một chỗ" />
          <Card x={cx - 230} y={650} w={260} h={120} tone={p.ink} label="người" />
          <Card x={cx + 230} y={650} w={260} h={120} tone={AI} label="AI" />
          <DiagramWire t={t} f={f} pts={[[cx - 60, 464], [cx - 200, 586]]} at={mid(2, .6)} color={SPEC} />
          <DiagramWire t={t} f={f} pts={[[cx + 60, 464], [cx + 200, 586]]} at={mid(2, .65)} color={SPEC} />
        </g>
      </g>
      {/* 2 · AI helps, people decide */}
      <g opacity={only(3, 4)}>
        <Card x={1060} y={300} w={380} h={120} tone={AI} label="AI làm" />
        <Card x={1590} y={300} w={380} h={120} tone={SPEC} label="người quyết" labelColor={SPEC} o={pop(3, 1)} />
        {['lặp lại', 'tạo khung', 'viết test theo tiêu chí'].map((x, k) => <Row key={k} f={f} x={880} y={450 + k * 90} text={x} at={mid(4, .05 + k * .1)} size={36} />)}
        {['tiền', 'quyền truy cập', 'pháp lý', 'kiến trúc lớn'].map((x, k) => <Row key={k} f={f} x={1440} y={450 + k * 90} text={x} at={mid(4, .5 + k * .1)} size={36} />)}
      </g>
      {/* 3 · improve in loops */}
      <g opacity={only(5, 6)}>
        {loopPts.map(([x, px, py], k) => {const [nx, ny] = [loopPts[(k + 1) % 4][1], loopPts[(k + 1) % 4][2]];return <g key={k}>
          <Card x={px} y={py} w={k === 2 ? 320 : 260} h={100} tone={k === 3 ? SPEC : AI} label={x} size={36} o={grow(f, mid(6, .1 + k * .12), mid(6, .1 + k * .12) + 12)} />
          <DiagramWire t={t} f={f} pts={[[px + (nx > px ? 140 : nx < px ? -140 : 0), py + (ny > py ? 54 : ny < py ? -54 : 0)], [nx + (nx > px ? -134 : nx < px ? 134 : 0), ny + (ny > py ? -54 : ny < py ? 54 : 0)]]} at={mid(6, .15 + k * .12)} /></g>;})}
        <Label t={t} x={cx} y={480} size={36} color={p.muted} opacity={grow(f, mid(6, .1), mid(6, .1) + 12)}>spec</Label>
        <Label t={t} x={cx} y={800} size={36} color={SPEC} opacity={grow(f, mid(6, .75), mid(6, .75) + 12)}>giữ lịch sử thay đổi</Label>
      </g>
      {/* 4 · protected by tests that follow business behaviour */}
      <g opacity={only(7, 8)}>
        <rect x={cx - 400} y={300} width={800} height={380} rx={30} fill="none" stroke={SPEC} strokeWidth={5} strokeDasharray="20 12" opacity={grow(f, mid(8, .3), mid(8, .3) + 12)} />
        <Label t={t} x={cx} y={280} size={36} color={SPEC} opacity={grow(f, mid(8, .3), mid(8, .3) + 12)}>test theo tiêu chí nghiệm thu</Label>
        <Card x={cx} y={490} w={480} h={150} tone={AI} label="hành vi nghiệp vụ" o={pop(7, .5)} />
        <Label t={t} x={cx} y={760} size={36} color={p.muted} opacity={grow(f, mid(8, .7), mid(8, .7) + 12)}>sửa hay viết lại vẫn có hàng rào</Label>
      </g>
      {/* 5 · centred on the people affected */}
      <g opacity={only(9, 10)}>
        <SpecDoc x={1070} y={380} w={320} h={200} sub="đọc được" />
        <Card x={1600} y={380} w={420} h={130} tone={p.ink} label="người chịu hậu quả" size={36} o={pop(9, .5)} />
        <DiagramWire t={t} f={f} pts={[[1386, 380], [1236, 380]]} at={at(9, .8)} />
        <Card x={cx} y={640} w={760} h={150} tone={BAD} dash label="“đương nhiên là như vậy”" sub="không ai viết ra: bug hay trú" o={grow(f, mid(10, .4), mid(10, .4) + 12)} />
      </g>
      {/* 6 · traceable: from code back to the spec and to the reason */}
      <g opacity={only(11, 12)}>
        {([['code', p.muted], ['spec', SPEC], ['lý do', p.ink]] as [string, string][]).map(([x, c], k) => <g key={k}>
          <Card x={940 + k * 390} y={460} w={280} h={140} tone={c} label={x} labelColor={k === 1 ? SPEC : undefined} o={grow(f, mid(12, .3 + k * .15), mid(12, .3 + k * .15) + 12)} />
          {k ? <DiagramWire t={t} f={f} pts={[[940 + (k - 1) * 390 + 144, 460], [940 + k * 390 - 144, 460]]} at={mid(12, .3 + k * .15)} color={SPEC} /> : null}</g>)}
        <Chip t={t} f={f} x={1330} y={330} text="mã yêu cầu" at={mid(12, .1)} size={34} tone="accent" />
        <Label t={t} x={cx} y={680} size={38} color={p.muted} opacity={grow(f, mid(12, .8), mid(12, .8) + 12)}>thay vì đoán trong đêm</Label>
      </g>
    </g>
  </Stage>;
};

// ---- 04 · greenfield: a five-day HR tool ---------------------------------------------------------------------------
export const Greenfield: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, only, pop, mid} = useB(s);
  const day = f < at(1) ? -1 : f < at(3) ? 0 : f < at(4) ? 1 : f < at(7) ? 2 : f < at(8) ? 3 : 4;
  const days = ['ngày 1', 'ngày 2', 'ngày 3–4', 'ngày 5'];
  const dayIdx = day < 0 ? -1 : day === 4 ? 4 : Math.min(day, 3);
  return <Stage>
    <g opacity={span(0, 8)}>
      <Title o={pop(0)}>Dự án mới: chấm công và nghỉ phép</Title>
      <Track items={days} y={270} w={300} o={pop(0, .6)} state={(k) => dayIdx === 4 || k < dayIdx ? 2 : k === dayIdx ? 1 : 0} />
      <g opacity={only(0)}>
        <Card x={700} y={520} w={380} h={150} tone={p.ink} label="3 người" />
        <Card x={1220} y={520} w={380} h={150} tone={SPEC} label="1 tuần" labelColor={SPEC} />
      </g>
      {/* day 1: listen to HR first, then write the business requirement and five use cases */}
      <g opacity={only(1, 2)}>
        <Card x={300} y={480} w={330} h={130} tone={p.ink} label="nhân sự" />
        <Card x={300} y={680} w={330} h={130} tone={AI} label="đội" />
        {['việc hằng ngày đau ở đâu', 'mục tiêu đo được', 'ngoài phạm vi'].map((x, k) => <Row key={k} f={f} x={520} y={490 + k * 95} text={x} at={mid(1, .2 + k * .25)} size={36} />)}
        <SpecDoc x={1460} y={480} w={480} h={200} label="yêu cầu nghiệp vụ" o={grow(f, mid(2, .4), mid(2, .4) + 12)} />
        {[0, 1, 2, 3, 4].map((k) => <Chip key={k} t={t} f={f} x={1220 + k * 120} y={680} text={`UC${k + 1}`} at={mid(2, .6 + k * .06)} size={34} tone="accent2" />)}
      </g>
      {/* day 2: actors, entity model, and the small question about public holidays */}
      <g opacity={only(3)}>
        <Card x={620} y={460} w={500} h={150} tone={AI} label="sơ đồ tác nhân" o={pop(3, .3)} />
        <Card x={1300} y={460} w={500} h={150} tone={AI} label="mô hình thực thể" o={grow(f, mid(3, .3), mid(3, .3) + 12)} />
        <Card x={960} y={680} w={720} h={140} tone={SPEC} dash label="ngày lễ xử lý thế nào?" sub="ghi rõ: chưa làm ở bản đầu" size={40} o={grow(f, mid(3, .6), mid(3, .6) + 12)} />
      </g>
      {/* days 3–4: one detailed use case; the spec corrects the AI's plan; failing tests lead back to the spec */}
      <g opacity={only(4, 6)}>
        <SpecDoc x={480} y={520} w={480} h={280} label="use case mẫu" sub="spec chi tiết" o={pop(4, .3)} />
        <g opacity={only(5)}>
          <Card x={1330} y={420} w={680} h={140} tone={BAD} dash label="AI: trừ phép khi gửi đơn" size={40} o={pop(5, .3)} />
          <Mark t={t} f={f} x={1700} y={420} ok={false} at={mid(5, .45)} size={70} />
          <Card x={1330} y={640} w={680} h={140} tone={SPEC} label="spec: chỉ trừ khi quản lý duyệt" size={38} o={grow(f, mid(5, .4), mid(5, .4) + 12)} />
          <DiagramWire t={t} f={f} pts={[[724, 600], [986, 640]]} at={mid(5, .4)} color={SPEC} />
        </g>
        <g opacity={only(6)}>
          {[0, 1].map((k) => <Card key={k} x={1460} y={400 + k * 170} w={360} h={120} tone={BAD} label="test lỗi" o={pop(6, k * .4)} />)}
          <path d="M1270 480 C 1100 400 900 400 730 450" fill="none" stroke={SPEC} strokeWidth={5} opacity={pop(6, 1.2)} />
          <Label t={t} x={1000} y={740} size={40} color={SPEC} opacity={grow(f, mid(6, .55), mid(6, .55) + 12)}>bổ sung tiêu chí, không vá lặng</Label>
        </g>
      </g>
      {/* day 5: feedback sorted into the next version or into the criteria */}
      <g opacity={only(7)}>
        <Card x={960} y={420} w={400} h={130} tone={p.ink} label="phản hồi" />
        <Card x={560} y={660} w={560} h={150} tone={p.muted} label="ngoài phạm vi" sub="ghi vào phiên bản sau" o={grow(f, mid(7, .35), mid(7, .35) + 12)} />
        <Card x={1360} y={660} w={560} h={150} tone={SPEC} label="thiếu trong tiêu chí" sub="bổ sung rồi mới chỉnh" o={grow(f, mid(7, .65), mid(7, .65) + 12)} />
        <DiagramWire t={t} f={f} pts={[[860, 490], [660, 580]]} at={mid(7, .35)} />
        <DiagramWire t={t} f={f} pts={[[1060, 490], [1260, 580]]} at={mid(7, .65)} color={SPEC} />
      </g>
      <g opacity={only(8)}>
        {['một bộ spec', 'bộ test bám theo', 'biết sửa yêu cầu mới ở đâu'].map((x, k) => <Row key={k} f={f} x={600} y={460 + k * 110} text={x} at={mid(8, .2 + k * .25)} size={44} />)}
      </g>
    </g>
    {/* the usual mistakes */}
    <g opacity={span(9, 9)}>
      <Title o={pop(9)}>Lỗi hay gặp</Title>
      {['viết spec quá chi tiết từ ngày một', 'quên tiêu chí nghiệm thu', 'AI viết code trước, spec bổ sung sau', 'người viết tự duyệt'].map((x, k) =>
        <Row key={k} f={f} x={520} y={330 + k * 120} text={x} at={mid(9, .1 + k * .22)} ok={false} size={44} />)}
    </g>
  </Stage>;
};

// ---- 05 · brownfield: an old billing codebase ------------------------------------------------------------------------
export const Brownfield: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, only, pop, mid} = useB(s);
  const steps = ['1 · thực thể', '2 · use case', '3 · kiểm chứng', '4 · test đặc tả', '5 · tái cấu trúc'];
  const cur = f < at(6) ? -1 : Math.min(4, [6, 7, 8, 9, 10].filter((i) => f >= at(i)).length - 1);
  const piece = f < at(10, .5) ? -1 : Math.floor(((f - at(10, .5)) / 40) % 5);
  return <Stage>
    {/* A · 0–1: the old system */}
    <g opacity={span(0, 1)}>
      <Title o={pop(0)}>Hệ thống cũ</Title>
      <Label t={t} x={960} y={260} size={42} color={p.muted} opacity={pop(1)}>kho mã tính phí lớn</Label>
      {[0, 1, 2, 3].map((k) => <CodeCard key={k} f={f} x={540 + k * 280} y={460} w={300} h={260} at={at(0, .3 + k * .2)} lines={6} o={pop(0, .3)} />)}
      {['tài liệu gần như trống', 'người viết đã nghỉ', 'mọi thay đổi đều đáng sợ'].map((x, k) =>
        <Chip key={k} t={t} f={f} x={400 + k * 560} y={720} text={x} at={mid(1, .3 + k * .22)} size={36} tone="bad" />)}
    </g>
    {/* B · 2–4: two mistakes */}
    <g opacity={span(2, 4)}>
      <Title o={pop(2)}>Hai sai lầm</Title>
      <Card x={540} y={430} w={680} h={200} tone={BAD} label="đập đi, viết lại bằng AI" sub="khi chưa hiểu hệ thống" o={pop(3)} />
      <Mark t={t} f={f} x={540} y={600} ok={false} at={mid(3, .6)} size={70} />
      <Card x={1380} y={430} w={680} h={200} tone={BAD} label="AI đọc code → sinh spec" sub="rồi tin đó là sự thật" o={pop(4)} />
      <Mark t={t} f={f} x={1380} y={600} ok={false} at={mid(4, .5)} size={70} />
      <Label t={t} x={1380} y={740} size={40} color={BAD} opacity={grow(f, mid(4, .7), mid(4, .7) + 12)}>lỗi sống ba năm vẫn là lỗi</Label>
    </g>
    {/* C · 5–10: five steps */}
    <g opacity={span(5, 10)}>
      <Title o={pop(5)}>Năm bước</Title>
      <Track items={steps} y={270} w={320} size={34} o={pop(5, .4)} state={(k) => k < cur ? 2 : k === cur ? 1 : 0} />
      <g opacity={only(6)}>
        <Card x={440} y={540} w={380} h={150} tone={AI} label="cơ sở dữ liệu" />
        <Card x={960} y={540} w={420} h={150} tone={SPEC} label="mô hình thực thể" labelColor={SPEC} o={pop(6, .6)} />
        <Card x={1480} y={540} w={380} h={150} tone={p.ink} label="người vận hành" o={grow(f, mid(6, .5), mid(6, .5) + 12)} />
        <DiagramWire t={t} f={f} pts={[[634, 540], [746, 540]]} at={at(6, .5)} />
        <DiagramWire t={t} f={f} pts={[[1286, 540], [1174, 540]]} at={mid(6, .55)} />
        <Label t={t} x={960} y={740} size={40} color={p.muted} opacity={grow(f, mid(6, .7), mid(6, .7) + 12)}>từng trường thực sự nghĩa là gì?</Label>
      </g>
      <g opacity={only(7)}>
        {['code', 'nhật ký', 'giao diện'].map((x, k) => <g key={k}>
          <Card x={400} y={430 + k * 130} w={300} h={100} tone={p.muted} label={x} size={38} o={pop(7, k * .3)} />
          <DiagramWire t={t} f={f} pts={[[554, 430 + k * 130], [796, 560]]} at={at(7, .5 + k * .3)} /></g>)}
        <Card x={960} y={560} w={320} h={130} tone={SPEC} label="use case" labelColor={SPEC} o={pop(7, .8)} />
        <Card x={1490} y={560} w={520} h={150} tone={BAD} dash label="luồng chưa ai giải thích" size={38} sub="đánh dấu tạm" o={grow(f, mid(7, .6), mid(7, .6) + 12)} />
      </g>
      <g opacity={only(8)}>
        <Card x={960} y={450} w={360} h={120} tone={p.ink} label="hành vi" />
        <Card x={560} y={650} w={500} h={130} tone={AI} label="đúng hiện tại" o={grow(f, mid(8, .35), mid(8, .35) + 12)} />
        <Card x={1360} y={650} w={500} h={130} tone={SPEC} dash label="thay đổi cần bàn" labelColor={SPEC} o={grow(f, mid(8, .55), mid(8, .55) + 12)} />
        <DiagramWire t={t} f={f} pts={[[860, 512], [700, 584]]} at={mid(8, .35)} />
        <DiagramWire t={t} f={f} pts={[[1060, 512], [1220, 584]]} at={mid(8, .55)} color={SPEC} />
      </g>
      <g opacity={only(9)}>
        <rect x={560} y={400} width={800} height={340} rx={30} fill="none" stroke={SPEC} strokeWidth={5} strokeDasharray="20 12" opacity={pop(9, .5)} />
        <Card x={960} y={570} w={480} h={150} tone={AI} label="hành vi hiện tại" />
        <Label t={t} x={960} y={380} size={36} color={SPEC} opacity={pop(9, .5)}>test đặc tả · dữ liệu thật đã ẩn danh</Label>
        <Label t={t} x={960} y={800} size={38} color={p.muted} opacity={grow(f, mid(9, .6), mid(9, .6) + 12)}>refactor không làm lệch những gì đang chạy</Label>
      </g>
      <g opacity={only(10)}>
        {[0, 1, 2, 3, 4].map((k) => <rect key={k} x={420 + k * 220} y={440} width={190} height={190} rx={18} fill={p.surface} stroke={piece === k ? SPEC : AI} strokeWidth={piece === k ? 7 : 3} opacity={pop(10, .2 + k * .1)} />)}
        <Label t={t} x={960} y={400} size={36} color={p.muted} opacity={pop(10, .2)}>mỗi lần một phần</Label>
        <g opacity={grow(f, mid(10, .35), mid(10, .35) + 12)}>
          <rect x={1560} y={490} width={120} height={60} rx={30} fill={p.surface} stroke={SPEC} strokeWidth={4} />
          <circle cx={(f / 30) % 2 < 1 ? 1590 : 1650} cy={520} r={22} fill={SPEC} />
          <Label t={t} x={1620} y={610} size={36} color={SPEC}>cờ bật tắt</Label>
        </g>
        <Label t={t} x={960} y={760} size={38} color={BAD} opacity={grow(f, mid(10, .7), mid(10, .7) + 12)}>không vừa refactor lớn vừa đổi quy tắc</Label>
      </g>
    </g>
    {/* D · 11–13: hot spots first; stop borrowing */}
    <g opacity={span(11, 13)}>
      <Title o={pop(11)}>Không cần spec cho cả kho mã</Title>
      {Array.from({length: 24}, (_, k) => {const hot = [3, 9, 10, 17].includes(k), x = 440 + (k % 8) * 135, y = 270 + Math.floor(k / 8) * 125;
        return <rect key={k} x={x} y={y} width={110} height={100} rx={14} fill={hot && f > at(12) ? BAD : p.surface} fillOpacity={hot && f > at(12) ? .35 + .15 * Math.sin(f / 6) : 1}
          stroke={hot && f > at(12) ? BAD : p.muted} strokeWidth={3} opacity={(hot || f < at(12, 1.2) ? 1 : .35) * pop(11, k * .03)} />;})}
      <g opacity={only(12)}>
        <Label t={t} x={600} y={720} size={40} color={BAD}>chỗ nóng, hay đổi: viết spec</Label>
        <Label t={t} x={1380} y={720} size={40} color={p.muted}>chỗ lạnh: để yên</Label>
      </g>
      <Say o={only(13)} text="không trả hết nợ kỹ thuật, chỉ dừng vay thêm" />
    </g>
  </Stage>;
};

// ---- 06 · the team, day to day --------------------------------------------------------------------------------------
export const VanHanh: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, pop, mid} = useB(s);
  const roles: [string, string, number, number, number][] = [['sản phẩm', 'giữ mục tiêu', 400, 290, 1], ['kỹ sư dẫn dắt', 'giữ kiến trúc', 1520, 290, 2],
    ['lập trình viên', 'phát hiện khoảng hở', 400, 670, 3], ['quản lý', 'giữ nhịp', 1520, 670, 4], ['kiểm thử', 'soi ca biên từ đầu', 960, 790, 4]];
  const metrics: [string, number][] = [['use case có spec', .7], ['tiêu chí có test', .6], ['viết lại an toàn', .5], ['thay đổi truy vết được', .8]];
  return <Stage>
    {/* A · 0–4: roles around the spec */}
    <g opacity={span(0, 4)}>
      <SpecDoc x={960} y={470} w={380} h={240} label="spec" sub="cách đội làm việc" o={pop(0, .3)} />
      {roles.map(([label, sub, x, y, i], k) => {const a = k === 4 ? mid(4, .5) : at(i, .2);return <g key={k}>
        <Card x={x} y={y} w={k === 4 ? 520 : 460} h={140} tone={k === 0 ? SPEC : AI} label={label} sub={sub} o={grow(f, a, a + 12)} />
        <DiagramWire t={t} f={f} pts={k === 4 ? [[960, 718], [960, 598]] : [[x + (x < 960 ? 234 : -234), y], [x < 960 ? 766 : 1154, y < 470 ? 400 : 540]]} at={a + 6} color={SPEC} /></g>;})}
    </g>
    {/* B · 5: spec, source and tests line up by use case */}
    <g opacity={span(5, 5)}>
      <Title o={pop(5)}>Spec, mã nguồn, test soi vào nhau</Title>
      {(['spec', 'mã nguồn', 'test'] as const).map((x, k) => <g key={k} opacity={pop(5, .3 + k * .3)}>
        <Label t={t} x={480 + k * 480} y={280} size={42} color={k === 0 ? SPEC : p.ink}>{x}</Label>
        {[0, 1, 2].map((r) => <rect key={r} x={480 + k * 480 - 150} y={330 + r * 130} width={300} height={90} rx={14} fill={p.surface} stroke={k === 0 ? SPEC : p.muted} strokeWidth={3} />)}</g>)}
      {[0, 1, 2].map((r) => <g key={r} opacity={grow(f, at(5, 1.2 + r * .4), at(5, 1.5 + r * .4))}>
        <path d={`M630 ${375 + r * 130} H810 M1110 ${375 + r * 130} H1290`} stroke={AI} strokeWidth={4} />
        <Label t={t} x={480} y={388 + r * 130} size={36} color={SPEC}>{`UC${r + 1}`}</Label></g>)}
      <Label t={t} x={960} y={760} size={40} color={p.muted} opacity={grow(f, mid(5, .6), mid(5, .6) + 12)}>mỗi bình luận sửa code dẫn về một yêu cầu</Label>
    </g>
    {/* C · 6: a few numbers */}
    <g opacity={span(6, 6)}>
      <Title o={pop(6)}>Vài chỉ số</Title>
      {metrics.map(([x, v], k) => {const a = mid(6, .15 + k * .2);return <g key={k} opacity={grow(f, a, a + 12)}>
        <Label t={t} x={760} y={320 + k * 130} anchor="end" size={40}>{x}</Label>
        <rect x={800} y={285 + k * 130} width={800} height={50} rx={12} fill={p.surface} stroke={p.muted} strokeWidth={2} />
        <rect x={800} y={285 + k * 130} width={800 * v * grow(f, a, a + 30)} height={50} rx={12} fill={AI} opacity={.8} /></g>;})}
    </g>
    {/* D · 7: 30 / 60 / 90 days */}
    <g opacity={span(7, 7)}>
      <Title o={pop(7)}>Đi dần</Title>
      {([['30 ngày', 'thử một use case nhỏ'], ['60 ngày', 'mở rộng và đo'], ['90 ngày', 'nhìn lại: tiếp hay dừng']] as [string, string][]).map(([label, sub], k) => {
        const a = mid(7, .1 + k * .3);return <g key={k}>
          <Card x={400 + k * 560} y={470} w={480} h={200} tone={k === 2 ? SPEC : AI} label={label} sub={sub} size={48} o={grow(f, a, a + 12)} />
          {k ? <DiagramWire t={t} f={f} pts={[[400 + (k - 1) * 560 + 244, 470], [400 + k * 560 - 244, 470]]} at={a} /> : null}</g>;})}
    </g>
  </Stage>;
};

// ---- 07 · when to use it, and starting small ------------------------------------------------------------------------
export const BatDauNho: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, pop, mid} = useB(s);
  const chain: [string, number, string][] = [['người', 260, p.ink], ['AI', 1180, AI], ['code', 1620, p.muted]];
  return <Stage>
    {/* A · 0–2: not for everything */}
    <g opacity={span(0, 2)}>
      <Title o={pop(0)}>Khi nào nên dùng SDD</Title>
      <Label t={t} x={460} y={290} size={42} color={p.muted} opacity={pop(1)}>thường không cần</Label>
      {['bản thử nghiệm ném đi', 'script chạy một lần', 'dự án một người'].map((x, k) => <Row key={k} f={f} x={160} y={400 + k * 100} text={x} at={mid(1, .1 + k * .3)} ok={false} size={38} />)}
      <Label t={t} x={1340} y={290} size={42} color={SPEC} opacity={pop(2)}>nên dùng</Label>
      {['hệ thống sống lâu', 'nhiều người cùng chạm', 'quy tắc nghiệp vụ quan trọng', 'AI sinh phần lớn mã'].map((x, k) =>
        <Row key={k} f={f} x={1000} y={400 + k * 100} text={x} at={mid(2, .1 + k * .2)} size={38} />)}
    </g>
    {/* B · 3: myths */}
    <g opacity={span(3, 3)}>
      <Title o={pop(3)}>Vài hiểu nhầm</Title>
      <Row f={f} x={440} y={340} text="spec là quay về làm việc chậm" at={mid(3, .2)} ok={false} size={44} />
      <Row f={f} x={440} y={470} text="chỉ dành cho doanh nghiệp lớn" at={mid(3, .4)} ok={false} size={44} />
      <Row f={f} x={440} y={600} text="AI càng giỏi, “viết đúng thứ gì” càng đáng tiền" at={mid(3, .65)} size={44} />
    </g>
    {/* C · 4–5: three small things to start next week */}
    <g opacity={span(4, 5)}>
      <Title o={pop(4)}>Bắt đầu nhỏ</Title>
      {([['chọn một use case', ''], ['làm trọn một vòng', 'một người kỹ thuật + một người hiểu nghiệp vụ'], ['cho spec sống trong kho mã', 'đo: bao nhiêu thay đổi gắn với một yêu cầu']] as [string, string][])
        .map(([label, sub], k) => {const a = k === 2 ? at(5) : mid(4, .2 + k * .3);return <g key={k} opacity={grow(f, a, a + 12)}>
          <Card x={1000} y={300 + k * 190} w={1240} h={150} tone={SPEC} label={label} sub={sub || undefined} size={42} subSize={34} />
          <Label t={t} x={270} y={318 + k * 190} size={56} color={SPEC}>{k + 1}</Label></g>;})}
    </g>
    {/* D · 6–7: the chain again, fast, landing in the right place */}
    <g opacity={span(6, 7)}>
      {chain.map(([label, x, c], k) => <Card key={k} x={x} y={430} w={240} h={140} tone={c} label={label} o={pop(6, k * .2)} />)}
      <SpecDoc x={720} y={430} w={360} h={220} o={pop(6, .1)} />
      <DiagramWire t={t} f={f} pts={[[384, 430], [536, 430]]} at={at(6, .2)} color={SPEC} />
      <DiagramWire t={t} f={f} pts={[[904, 430], [1056, 430]]} at={at(6, .3)} />
      <DiagramWire t={t} f={f} pts={[[1304, 430], [1496, 430]]} at={at(6, .4)} />
      <DiagramPacket t={t} f={f} pts={[[384, 430], [536, 430]]} at={at(6, .8)} period={24} count={2} />
      <DiagramPacket t={t} f={f} pts={[[1304, 430], [1496, 430]]} at={at(6, .9)} period={24} count={2} color={AI} />
      <g opacity={grow(f, at(7, .3), at(7, .3) + 12)}>
        {[90, 60, 30].map((r, k) => <circle key={k} cx={1620} cy={430} r={r + 70} fill="none" stroke={SPEC} strokeWidth={4} opacity={.35 + k * .25} />)}
      </g>
      <Label t={t} x={960} y={740} size={48} opacity={grow(f, at(6, .5), at(6, .5) + 12) * (1 - grow(f, at(7) - 8, at(7)))}>spec không làm AI chậm đi</Label>
      <Label t={t} x={960} y={740} size={48} color={SPEC} opacity={grow(f, at(7, .2), at(7, .2) + 12)}>chỉ giúp tốc độ đi về đúng chỗ</Label>
    </g>
  </Stage>;
};
