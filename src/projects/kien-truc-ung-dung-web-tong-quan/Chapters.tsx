import type {FC, ReactNode} from 'react';
import {Img, staticFile} from 'remotion';
import {Chip, DiagramPacket, DiagramWire, Label, Mark, grow} from '../../looks/diagram-kit';
import {Stage, THEME, useBeat} from './common';
import type {Seg} from './common';

// Kiến trúc ứng dụng web — the simple explanation (user 2026-11-12: "tóm tắt được cuốn sách sau đó làm ra 1 video giải
// thích 1 cách đơn giản nhất"; earlier build too dense and overlapping). One large diagram per idea, few words, almost no
// code. The same visual words recur: a yellow box is business rules (nghiệp vụ), a cyan box is machinery (hạ tầng), a
// white "socket" is a contract (interface), and devices plug into it. Callouts sit in one slot above the captions and
// show one at a time. Beats follow the sentence numbers in script.md (0-based per section); scene changes are sequential
// (common.tsx). Layout: drawings in y 120–870, words ≥ 34 px; checked with `npm run layout-check`.

const t = THEME, p = t.palette, BAD = '#ff6b6b', RULE = p.accent, INFRA = p.accent2;
type Pt = [number, number];
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const loop = (f: number, a: number, period: number) => f < a ? 0 : ((f - a) / period) % 1;

const Title: FC<{children: ReactNode; o: number; y?: number; color?: string}> = ({children, o, y = 150, color}) =>
  <Label t={t} x={960} y={y} size={52} opacity={o} color={color}>{children}</Label>;

// A centred box with a label and an optional second line.
const Card: FC<{x: number; y: number; w: number; h: number; o?: number; tone?: string; label?: string; sub?: string; size?: number; subSize?: number;
  labelColor?: string; subColor?: string; fill?: string; thick?: number}> =
  ({x, y, w, h, o = 1, tone = INFRA, label, sub, size = 42, subSize = 34, labelColor, subColor, fill, thick = 4}) =>
    <g opacity={o}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={22} fill={fill ?? p.surface} stroke={tone} strokeWidth={thick} />
      {label ? <Label t={t} x={x} y={sub ? y - 6 : y + size * .36} size={size} color={labelColor ?? p.ink}>{label}</Label> : null}
      {sub ? <Label t={t} x={x} y={y + subSize + 12} size={subSize} weight={400} color={subColor ?? p.muted}>{sub}</Label> : null}
    </g>;

// A contract (interface): a white socket with two slots on its right side.
const Socket: FC<{x: number; y: number; w?: number; h?: number; o?: number; label: string; sub?: string; subO?: number; size?: number}> =
  ({x, y, w = 300, h = 200, o = 1, label, sub, subO = 1, size = 42}) =>
    <g opacity={o}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={26} fill={p.background} stroke={p.ink} strokeWidth={4} />
      {[-1, 1].map((k) => <rect key={k} x={x + w / 2 - 30} y={y + k * 34 - 13} width={16} height={26} rx={4} fill={p.ink} opacity={.85} />)}
      <Label t={t} x={x - 10} y={sub ? y - 6 : y + size * .36} size={size}>{label}</Label>
      {sub ? <Label t={t} x={x - 10} y={y + 46} size={34} weight={400} color={p.muted} opacity={subO}>{sub}</Label> : null}
    </g>;

// The one callout slot, above the captions.
const Say: FC<{o: number; text: string; tone?: 'accent' | 'accent2' | 'bad' | 'muted'}> = ({o, text, tone = 'accent'}) =>
  o > 0 ? <g opacity={o}><Chip t={t} f={12} x={960} y={826} text={text} at={0} size={38} tone={tone} /></g> : null;

// A list row: a tick or cross and a few words.
const Row: FC<{f: number; x: number; y: number; text: string; at: number; ok?: boolean; size?: number; color?: string; pre?: number}> =
  ({f, x, y, text, at, ok = true, size = 40, color, pre}) =>
    <g opacity={Math.max(grow(f, at, at + 10), pre === undefined ? 0 : .3 * grow(f, pre, pre + 10))}>
      <Mark t={t} f={f} x={x + 20} y={y - size * .34} ok={ok} at={at + 2} size={size * .9} />
      <Label t={t} x={x + 64} y={y} anchor="start" size={size} weight={400} color={color ?? p.ink}>{text}</Label>
    </g>;

// Two words that swap in place without ever showing both: the first fades out, then the second fades in.
const swap = (f: number, a: number): [number, number] => [1 - grow(f, a, a + 8), grow(f, a + 8, a + 16)];

// Which device sits in a slot: `changes` lists [frame, device index]; returns 0..1 for device k (1 = plugged in).
const plugged = (f: number, changes: [number, number][], k: number) => {
  let v = 0;
  for (let i = 0; i < changes.length; i++) {
    const [a, idx] = changes[i];
    if (f < a) break;
    v = idx === k ? grow(f, a + 8, a + 22) : Math.min(v, 1 - grow(f, a, a + 12));
  }
  return v;
};
// After `start`, cycle through n devices every `period` frames.
const cycle = (start: number, n: number, period: number, until: number): [number, number][] =>
  Array.from({length: Math.max(0, Math.floor((until - start) / period))}, (_, i) => [start + i * period, i % n] as [number, number]);

const hexPath = (cx: number, cy: number, r: number) => Array.from({length: 6}, (_, k) => {const a = Math.PI / 3 * k;return `${k ? 'L' : 'M'}${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;}).join(' ') + ' Z';
const Hex: FC<{x: number; y: number; r: number; o?: number; label?: string; size?: number}> = ({x, y, r, o = 1, label, size = 44}) =>
  <g opacity={o}>
    <path d={hexPath(x, y, r)} fill={p.surface} stroke={RULE} strokeWidth={5} />
    {label ? <Label t={t} x={x} y={y + size * .36} size={size} color={RULE}>{label}</Label> : null}
  </g>;

// ---- 00 · opening ------------------------------------------------------------------------------------------------
export const MoDau: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, only, pop} = useBeat(s);
  const stripes: [string, string][] = [['hỏi giá', INFRA], ['tính tiền', RULE], ['ghi đơn', INFRA], ['nhớ mã đơn', INFRA]];
  const asks = ['đổi database', 'thêm một API', 'viết test tính tiền'];
  const shake = f > at(7) && f < at(8) ? Math.sin(f * 1.7) * 7 * (1 - grow(f, at(7) + 24, at(8))) : 0;
  const tech = ['MySQL', 'PostgreSQL', 'Laravel 9', 'Laravel 11'][Math.floor(loop(f, at(11), 120) * 4)];
  return <Stage>
    {/* A · 0–7: one function doing four things; three changes all land on it */}
    <g opacity={span(0, 7)}>
      <g transform={`translate(${shake} 0)`}>
        <rect x={160} y={190} width={860} height={600} rx={28} fill={p.surface} stroke={f > at(7) ? BAD : p.ink} strokeWidth={4} opacity={pop(0, .2)} />
        <Label t={t} x={590} y={272} size={50} opacity={pop(0, .2)}>Hàm đặt hàng</Label>
        <Label t={t} x={590} y={330} size={36} weight={400} color={p.muted} opacity={pop(1)}>khoảng 30 dòng</Label>
        {stripes.map(([x, c], k) => <g key={k} opacity={pop(2, .3 + k * 1.1)}>
          <rect x={220} y={380 + k * 95} width={740} height={75} rx={14} fill={c} fillOpacity={.16} stroke={c} strokeWidth={3} />
          <Label t={t} x={590} y={432 + k * 95} size={40}>{x}</Label></g>)}
      </g>
      <g opacity={only(3)}><Mark t={t} f={f} x={1330} y={470} ok at={at(3, .1)} size={64} /><Label t={t} x={1390} y={490} anchor="start" size={54} color={INFRA}>chạy đúng</Label></g>
      {asks.map((x, k) => {const y = 270 + k * 230, a = at(4 + k);return <g key={k} opacity={grow(f, a, a + 12)}>
        <rect x={1240} y={y - 70} width={560} height={140} rx={20} fill={p.surface} stroke={f > at(7) ? BAD : p.accent} strokeWidth={4} />
        <Label t={t} x={1520} y={y + 14} size={40}>{x}</Label>
        <DiagramWire t={t} f={f} pts={[[1236, y], [1032, y]]} at={a + 6} color={f > at(7) ? BAD : p.accent} /></g>;})}
    </g>
    {/* B · 8–12: the book, and the whole book in one idea */}
    <g opacity={span(8, 12)}>
      <foreignObject x={140} y={220} width={380} height={540}>
        <Img src={staticFile('kien-truc-ung-dung-web-tong-quan/images/book-cover.jpg')} style={{width: '100%', height: '100%', objectFit: 'contain', borderRadius: 12,
          opacity: grow(f, at(8), at(8) + 16)}} />
      </foreignObject>
      <Label t={t} x={1180} y={280} size={60} opacity={pop(8, .3)}>Kiến trúc ứng dụng web</Label>
      <Label t={t} x={1180} y={340} size={36} weight={400} color={p.muted} opacity={pop(8, .6)}>Nguyễn Thế Huy</Label>
      <Label t={t} x={1180} y={428} size={40} color={p.accent} opacity={pop(9)}>cả cuốn sách, một ý:</Label>
      <Card x={880} y={570} w={480} h={220} o={pop(10)} tone={RULE} label="luật kinh doanh" sub="nghiệp vụ" />
      <Card x={1480} y={570} w={480} h={220} o={pop(10, .8)} tone={INFRA} label="máy móc chạy nó" sub="hạ tầng" />
      <Label t={t} x={880} y={735} size={40} color={RULE} opacity={pop(11)}>sống lâu</Label>
      <Label t={t} x={1480} y={735} size={40} color={INFRA} opacity={pop(11, 1)}>{`thay liên tục: ${tech}`}</Label>
      <Say o={only(12)} text="ví dụ xuyên suốt: đặt mua một cuốn e-book" tone="accent2" />
    </g>
  </Stage>;
};

// ---- 01 · one function doing everything -------------------------------------------------------------------------
export const MotHam: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, only, pop} = useBeat(s);
  const tasks: [string, string][] = [['hỏi giá', 'database'], ['tính tiền', ''], ['ghi đơn', 'database'], ['nhớ mã đơn', 'session']];
  const g = grow(f, at(5), at(5) + 24);
  const db = swap(f, at(11));
  const k13 = 1 - .45 * grow(f, at(14), at(14) + 12);
  return <Stage>
    {/* A · 0–8: four jobs; the one that is the shop's own (business) moves left, the tools (infrastructure) right */}
    <g opacity={span(0, 8)}>
      {tasks.map(([name, sub], k) => {
        const rule = k === 1, j = [0, -1, 1, 2][k];
        const x = lerp(300 + k * 440, rule ? 470 : 1360, g), y = lerp(430, rule ? 500 : 330 + j * 175, g);
        const w = lerp(380, rule ? 460 : 480, g), h = lerp(150, rule ? 200 : 140, g);
        const o = Math.max(.3 * pop(0, .3), pop(1 + k));
        return <Card key={k} x={x} y={y} w={w} h={h} o={o} tone={rule ? RULE : INFRA} label={name} sub={!rule && f > at(7) ? sub : undefined} />;})}
      <Label t={t} x={470} y={350} size={50} color={RULE} opacity={pop(6)}>NGHIỆP VỤ</Label>
      <Label t={t} x={470} y={660} size={36} weight={400} color={p.muted} opacity={pop(5, 1)}>đơn gồm gì, giá, tổng</Label>
      <Label t={t} x={1360} y={205} size={50} color={INFRA} opacity={pop(8)}>HẠ TẦNG</Label>
      <Say o={only(7)} text="đồ nghề để chạy nó: database, session, framework" tone="accent2" />
    </g>
    {/* B · 9–14: tangled together, trouble comes fast */}
    <g opacity={span(9, 14)}>
      <g opacity={k13}>
        <Card x={700} y={470} w={440} h={200} tone={RULE} label="tính tiền" o={pop(9)} />
        <Card x={1400} y={470} w={400} h={200} tone={INFRA} o={pop(9, .3)} />
        <Label t={t} x={1400} y={485} size={42} opacity={pop(9, .3) * db[0]}>MySQL</Label>
        <Label t={t} x={1400} y={485} size={42} opacity={db[1]}>PostgreSQL</Label>
        {[0, 1, 2].map((k) => <path key={k} d={`M920 ${430 + k * 40} C 1010 ${380 + k * 40 + Math.sin(f / 9) * 16} 1110 ${480 + k * 40 - Math.sin(f / 9) * 16} 1200 ${430 + k * 40}`}
          fill="none" stroke={BAD} strokeWidth={4} opacity={pop(9, .6 + k * .2) * .8} />)}
        <g opacity={only(10)}>
          <Card x={220} y={470} w={260} h={140} tone={p.ink} label="bài test" size={40} />
          <DiagramWire t={t} f={f} pts={[[350, 470], [478, 470]]} at={at(10, .3)} />
          <path d="M700 360 C 760 250 1340 250 1400 360" fill="none" stroke={BAD} strokeWidth={4} strokeDasharray="12 10" opacity={pop(10, .8)} />
        </g>
        {[0, 1, 2].map((k) => <path key={k} d={`M${600 + k * 70} ${585} l 40 -40`} stroke={BAD} strokeWidth={6} strokeLinecap="round" opacity={pop(11, .8 + k * .2)} />)}
        <DiagramPacket t={t} f={f} pts={[[140, 660], [700, 660], [1400, 660]]} at={at(12, .2)} until={at(13)} period={80} color={BAD} r={12} label="số lượng = 0" labelSize={34} />
      </g>
      <Say o={only(10)} text="muốn test phép tính, phải bật cả database" tone="bad" />
      <Say o={only(11)} text="đổi database → sửa ngay giữa chỗ tính tiền" tone="bad" />
      <Say o={only(12)} text="không có chỗ nào chặn đơn sai" tone="bad" />
      <Say o={only(13)} text="đọc code chỉ thấy công nghệ" tone="bad" />
      <Say o={only(14)} text="không ai dám sửa" tone="bad" />
    </g>
    {/* C · 15–16: the author's two-year rule — tools change, the shop's rules stay */}
    <g opacity={span(15, 16)}>
      <Title o={pop(15)}>Ứng dụng sống quá 2 năm</Title>
      {[['framework', 4], ['database', 3], ['dịch vụ ngoài', 5]].map(([name, n], k) => <g key={k}>
        <Label t={t} x={340} y={318 + k * 120} anchor="end" size={40} weight={400} opacity={pop(15, .4)}>{name as string}</Label>
        {Array.from({length: n as number}, (_, j) => <rect key={j} x={370 + j * 1380 / (n as number)} y={286 + k * 120} width={1380 / (n as number) - 18} height={48} rx={10}
          fill={j % 2 ? INFRA : p.surface} stroke={INFRA} strokeWidth={2} opacity={grow(f, at(15, .6 + j * .5), at(15, .9 + j * .5))} />)}</g>)}
      <Label t={t} x={340} y={678} anchor="end" size={40} color={RULE} opacity={pop(15, 1)}>nghiệp vụ</Label>
      <rect x={370} y={646} width={1380 * grow(f, at(15, 1), at(16, 1))} height={48} rx={10} fill={RULE} opacity={.85} />
      <path d="M370 770 H1750" stroke={p.muted} strokeWidth={3} opacity={pop(15)} />
      {[0, 1, 2].map((y) => <Label key={y} t={t} x={370 + y * 690} y={822} size={36} color={p.muted} opacity={pop(15)}>{`năm ${y}`}</Label>)}
    </g>
  </Stage>;
};

// ---- 02 · the test: can it run on its own? ------------------------------------------------------------------------
export const PhepThu: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, only, pop} = useBeat(s);
  const outside: [string, number][] = [['database', 397], ['mạng', 647], ['file', 837], ['giờ hệ thống', 997], ['framework', 1317]];
  const drop = (a: number, to: Pt): Pt => {const k = grow(f, a, a + 14);return [lerp(to[0] - 70, to[0], k), to[1]];};
  const infra: [string, number][] = [['câu lệnh SQL', 650], ['gọi API khác', 710], ['controller', 770]];
  const real = plugged(f, [[at(14), 0], [at(15), 1]], 0), fake = plugged(f, [[at(14), 0], [at(15), 1]], 1);
  const dev = (k: number, rest: Pt, label: string, sub: string, v: number) =>
    <Card key={k} x={lerp(rest[0], 1310, v)} y={lerp(rest[1], 480, v)} w={340} h={150} tone={k ? RULE : INFRA} label={label} sub={sub} size={38} o={pop(12, .6 + k * .4)} />;
  return <Stage>
    {/* A · 0–7: the test machine — memory and CPU only; what runs goes to core, what needs the outside to infrastructure */}
    <g opacity={span(0, 7)}>
      <Title o={pop(0)}>Phép thử của sách</Title>
      <Card x={960} y={300} w={700} h={160} o={pop(1)} tone={p.ink} label="chỉ có bộ nhớ + CPU" sub={f > at(2) ? 'chạy được không?' : undefined} size={44} />
      {outside.map(([x, xx], k) => <g key={k} opacity={pop(3, k * .5)}>
        <Mark t={t} f={f} x={xx + 14} y={458} ok={false} at={at(3, k * .5)} size={30} />
        <Label t={t} x={xx + 40} y={470} anchor="start" size={36} weight={400} color={BAD}>{x}</Label></g>)}
      <Card x={560} y={690} w={560} h={300} o={pop(4)} tone={RULE} thick={f > at(4) && f < at(5) ? 7 : 4} />
      <Label t={t} x={560} y={590} size={44} color={RULE} opacity={pop(4)}>CORE</Label>
      <Card x={1360} y={690} w={560} h={300} o={pop(5)} tone={INFRA} thick={f > at(5) && f < at(6) ? 7 : 4} />
      <Label t={t} x={1360} y={590} size={44} color={INFRA} opacity={pop(5)}>HẠ TẦNG</Label>
      {(() => {const [x, y] = drop(at(6, .4), [560, 710]);return <Label t={t} x={x} y={y} size={40} opacity={pop(6, .2)}>hàm tính VAT</Label>;})()}
      {infra.map(([name, ty], k) => {const [x, y] = drop(at(7, .3 + k * .9), [1360, ty]);return <Label key={k} t={t} x={x} y={y} size={38} opacity={pop(7, .1 + k * .9)}>{name}</Label>;})}
    </g>
    {/* B · 8–9: the folder does not decide */}
    <g opacity={span(8, 9)}>
      <Title o={pop(8)}>Nhìn việc code làm, không nhìn thư mục</Title>
      <rect x={240} y={250} width={940} height={540} rx={24} fill={p.surface} stroke={p.muted} strokeWidth={3} opacity={pop(8, .3)} />
      <Label t={t} x={710} y={320} size={38} color={p.muted} opacity={pop(8, .3)}>cùng một thư mục</Label>
      <Card x={710} y={470} w={760} h={130} o={pop(8, .6)} tone={f > at(9) ? RULE : p.muted} label="tính giá" />
      <Card x={710} y={650} w={760} h={130} o={pop(8, .9)} tone={f > at(9) ? INFRA : p.muted} label="gọi API tỷ giá" />
      <Chip t={t} f={f} x={1330} y={470} text="core" at={at(9, .4)} size={40} tone="accent" />
      <DiagramWire t={t} f={f} pts={[[1094, 650], [1446, 650]]} at={at(9, .8)} />
      <Card x={1600} y={650} w={300} h={130} o={pop(9, 1)} tone={INFRA} label="API ngoài" size={40} />
      <Chip t={t} f={f} x={1600} y={775} text="hạ tầng" at={at(9, 1.4)} size={38} tone="accent2" />
    </g>
    {/* C · 10–17: the clock — rules ask a contract for the time; a real or a fake clock plugs in */}
    <g opacity={span(10, 17)}>
      <Title o={pop(10)}>Ví dụ: giờ hiện tại</Title>
      <Card x={380} y={480} w={420} h={200} o={pop(10, .4)} tone={RULE} label="luật bán hàng" />
      <g opacity={only(11)}>
        <Card x={1650} y={300} w={340} h={150} tone={INFRA} label="đồng hồ máy" sub="giờ thật" size={38} />
        <DiagramWire t={t} f={f} pts={[[594, 440], [1476, 310]]} at={at(11, .3)} color={BAD} />
      </g>
      <Socket x={900} y={480} o={pop(12)} label="Clock" sub="hợp đồng" subO={pop(13)} />
      <DiagramWire t={t} f={f} pts={[[594, 480], [746, 480]]} at={at(12, .3)} />
      <g opacity={f > at(12) ? 1 : 0}>
        {dev(0, [1650, 300], 'đồng hồ máy', 'giờ thật', real)}
        {dev(1, [1650, 680], 'đồng hồ giả', '23:59', fake)}
      </g>
      <path d="M1052 480 H1138" stroke={p.ink} strokeWidth={6} strokeLinecap="round" opacity={Math.max(real, fake)} />
      <Say o={only(11)} text="mọi bài test phụ thuộc giờ thật" tone="bad" />
      <Say o={only(13)} text="hợp đồng: chỉ nói cần gì, không nói lấy từ đâu" tone="muted" />
      <Say o={only(16, 17)} text="hợp đồng ở giữa, đồ thật cắm vào sau" />
    </g>
  </Stage>;
};

// ---- 03 · the order keeps its own rules -------------------------------------------------------------------------
export const TuGiuLuat: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, only, pop} = useBeat(s);
  const steps = ['lấy giá', 'tính tiền', 'gom vào mảng', 'lưu'];
  const rules = ['mã e-book hợp lệ', 'email đúng định dạng', 'số lượng > 0', 'giá không âm'];
  const b = loop(f, at(7, .2), 70), slipX = 200 + 480 * Math.sin(Math.min(1, b * 1.4) * Math.PI);
  const sources = ['trang web', 'API', 'bài test'];
  return <Stage>
    {/* A · 0–3: Transaction Script — steps in a row, the data is a bare array */}
    <g opacity={span(0, 3)}>
      <Title o={pop(0)}>Viết phần nghiệp vụ thế nào?</Title>
      <Label t={t} x={960} y={250} size={44} color={INFRA} opacity={pop(2)}>Transaction Script</Label>
      {steps.map((x, k) => <g key={k}>
        <Card x={300 + k * 440} y={380} w={360} h={130} o={pop(1, k * .7)} tone={INFRA} label={x} size={40} />
        {k < 3 ? <DiagramWire t={t} f={f} pts={[[484 + k * 440, 380], [516 + k * 440, 380]]} at={at(1, .3 + k * .7)} dur={8} /> : null}</g>)}
      <Card x={960} y={640} w={640} h={200} o={pop(3)} tone={BAD} />
      <Label t={t} x={960} y={620} size={38} mono color={p.ink} opacity={pop(3)}>email: "abc@"</Label>
      <Label t={t} x={960} y={680} size={38} mono color={BAD} opacity={pop(3, .3)}>số lượng: 0</Label>
      <Say o={only(3)} text="chỉ là một cái mảng, chẳng ai giữ luật" tone="bad" />
    </g>
    {/* B · 4–8: the Order checks itself when it is made; a wrong order is refused */}
    <g opacity={span(4, 8)}>
      <Title o={pop(4)}>Đơn hàng tự giữ luật</Title>
      <Card x={1240} y={500} w={760} h={560} o={pop(4, .3)} tone={RULE} />
      <Label t={t} x={1240} y={290} size={50} color={RULE} opacity={pop(5)}>Order</Label>
      <Label t={t} x={1240} y={335} size={34} weight={400} color={p.muted} opacity={pop(5, .4)}>entity</Label>
      {rules.map((x, k) => <Row key={k} f={f} x={920} y={420 + k * 70} text={x} at={at(6, .4 + k * .9)} size={38} />)}
      <Label t={t} x={1240} y={720} size={40} color={RULE} opacity={pop(8)}>tổng tiền: tự tính</Label>
      <g opacity={only(7)}>
        <rect x={slipX - 140} y={440} width={280} height={120} rx={16} fill={p.surface} stroke={BAD} strokeWidth={4} />
        <Label t={t} x={slipX} y={512} size={34} color={BAD}>số lượng: 0</Label>
        <Mark t={t} f={f} x={760} y={370} ok={false} at={at(7, .6)} size={60} />
      </g>
      <Say o={only(7)} text="sai một điều, nó từ chối ra đời" tone="bad" />
    </g>
    {/* C · 9–11: one door for every caller */}
    <g opacity={span(9, 11)}>
      <Title o={pop(9)}>Chỉ có một cửa</Title>
      {sources.map((x, k) => <g key={k}>
        <Card x={300} y={300 + k * 180} w={300} h={120} o={pop(10, k * .5)} tone={INFRA} label={x} size={40} />
        <DiagramWire t={t} f={f} pts={[[454, 300 + k * 180], [806, 420 + k * 60]]} at={at(10, .3 + k * .5)} />
        <DiagramPacket t={t} f={f} pts={[[454, 300 + k * 180], [806, 420 + k * 60]]} at={at(10, .8 + k * .5)} period={50} /></g>)}
      <Card x={960} y={480} w={300} h={220} o={pop(9, .3)} tone={RULE} label="Order" sub="kiểm tra" size={46} />
      <DiagramWire t={t} f={f} pts={[[1114, 480], [1346, 480]]} at={at(9, .8)} />
      <Card x={1550} y={480} w={380} h={140} o={pop(9, 1)} tone={RULE} label="đơn hợp lệ" />
      <Say o={only(9)} text="không còn cách nào tạo ra một đơn sai" />
      <Say o={only(11)} text="luật nằm một chỗ" />
    </g>
    {/* D · 12–17: entity vs value object */}
    <g opacity={span(12, 17)}>
      <Title o={pop(12)}>Hai loại đối tượng</Title>
      <Card x={525} y={505} w={810} h={550} o={pop(13)} tone={INFRA} />
      <Label t={t} x={525} y={295} size={40} color={INFRA} opacity={pop(13)}>Entity · có danh tính</Label>
      {[0, 1].map((k) => <Card key={k} x={330 + k * 390} y={450} w={320} h={180} o={pop(13, .4 + k * .4)} tone={p.ink} label={`Đơn #${41 + k}`} sub="2 × e-book A" />)}
      <Label t={t} x={525} y={472} size={64} color={BAD} opacity={pop(13, 1.2)}>≠</Label>
      <Label t={t} x={525} y={650} size={38} opacity={pop(13, 1.6)}>khác mã → hai đơn</Label>
      <Card x={1395} y={505} w={810} h={550} o={pop(14)} tone={RULE} />
      <Label t={t} x={1395} y={295} size={40} color={RULE} opacity={pop(14)}>Value object · là giá trị</Label>
      <Label t={t} x={1395} y={410} size={36} mono opacity={pop(14, .4)}>an@shop.vn = an@shop.vn</Label>
      <Label t={t} x={1395} y={470} size={38} opacity={pop(14, .8)}>giống nhau → là một</Label>
      <Row f={f} x={1050} y={590} text="email: kiểm tra lúc tạo" at={at(15)} size={38} />
      <Row f={f} x={1050} y={680} text="tiền kèm đơn vị: 120.000 VND" at={at(16)} size={38} />
      <Say o={only(17)} text="đặt luật ở đúng nơi giá trị sinh ra" />
    </g>
  </Stage>;
};

// ---- 04 · a warehouse for orders: Repository --------------------------------------------------------------------------
export const NhaKho: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, only, pop} = useBeat(s);
  const stores = ['kho MySQL', 'kho bộ nhớ', 'kho qua API'];
  const changes: [number, number][] = [[at(9), 0], [at(10), 1], [at(11), 2], ...cycle(at(12), 3, 75, at(13))];
  const steps = ['lấy giá', 'tạo Order', 'cất vào kho', 'nhớ mã đơn', 'chuyển trang'];
  const anyIn = Math.max(...stores.map((_, k) => plugged(f, changes, k)));
  return <Stage>
    {/* A · 0–12: the order talks to a warehouse contract; real warehouses plug in behind it */}
    <g opacity={span(0, 12)}>
      <Card x={330} y={480} w={380} h={200} o={pop(0, .3)} tone={RULE} label="Order" sub="đã giữ luật" size={46} />
      <g opacity={only(1)}>
        <Card x={1600} y={480} w={340} h={180} tone={INFRA} label="database" />
        <DiagramWire t={t} f={f} pts={[[524, 480], [1426, 480]]} at={at(1, .3)} color={BAD} />
        <Mark t={t} f={f} x={975} y={480} ok={false} at={at(1, 1)} size={90} />
      </g>
      <Socket x={960} y={480} o={pop(2)} label="Repository" sub="nhà kho" subO={pop(3)} size={40} />
      <DiagramWire t={t} f={f} pts={[[524, 480], [806, 480]]} at={at(2, .3)} />
      <Chip t={t} f={f} x={665} y={330} text="cất đơn này" at={at(4, .2)} size={36} tone="accent" />
      <Chip t={t} f={f} x={665} y={630} text="đưa tôi đơn số 42" at={at(4, 1.6)} size={36} tone="accent" />
      {stores.map((x, k) => {const v = plugged(f, changes, k);return <Card key={k} x={lerp(1700, 1340, v)} y={lerp(250 + k * 230, 480, v)} w={300} h={130}
        o={pop(8, .2 + k * .4)} tone={INFRA} label={x} size={38} />;})}
      <path d="M1112 480 H1188" stroke={p.ink} strokeWidth={6} strokeLinecap="round" opacity={anyIn} />
      <DiagramPacket t={t} f={f} pts={[[524, 480], [806, 480]]} at={at(9, .5)} period={60} r={11} />
      <Say o={only(5)} text="không nói bảng nào, cột nào, câu SQL nào" tone="muted" />
      <Say o={only(6)} text="interface = một bản hợp đồng" />
      <Say o={only(7)} text="viết dòng mình muốn gọi trước" tone="accent2" />
      <Say o={only(12)} text="phía nghiệp vụ không cần biết đang dùng kho nào" />
    </g>
    {/* B · 13–17: the original function after the split */}
    <g opacity={span(13, 17)}>
      <Title o={pop(13)}>Hàm đặt hàng sau khi tách</Title>
      {steps.map((x, k) => <g key={k}>
        <Card x={240 + k * 360} y={330} w={320} h={120} o={pop(13, .3 + k * .4)} tone={k === 1 ? RULE : INFRA} label={x} size={36} />
        {k < 4 ? <DiagramWire t={t} f={f} pts={[[402 + k * 360, 330], [438 + k * 360, 330]]} at={at(13, .5 + k * .4)} dur={8} /> : null}</g>)}
      <Card x={560} y={600} w={560} h={180} o={pop(14)} tone={INFRA} label="MySQL" sub="mọi câu SQL ở đây" />
      <Card x={1360} y={600} w={560} h={180} o={pop(15)} tone={RULE} label="Order" sub="code thuần" />
      <Chip t={t} f={f} x={560} y={760} text="test riêng" at={at(16)} size={36} tone="accent2" />
      <Chip t={t} f={f} x={1360} y={760} text="test riêng" at={at(16, .4)} size={36} tone="accent2" />
    </g>
  </Stage>;
};

// ---- 05 · reading is not writing ---------------------------------------------------------------------------------
export const DocGhi: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, only, pop} = useBeat(s);
  const buttons = ['đổi giá', 'ẩn sản phẩm', 'đổi trạng thái'];
  return <Stage>
    {/* A · 0–4: the page only shows, yet gets the whole writable e-book */}
    <g opacity={span(0, 4)}>
      <Title o={pop(0)}>Khi chỉ cần đọc</Title>
      <Card x={500} y={500} w={640} h={520} o={pop(2)} tone={f > at(4) ? BAD : RULE} />
      <Label t={t} x={500} y={310} size={42} opacity={pop(2)}>e-book đầy đủ</Label>
      <Label t={t} x={500} y={385} size={38} weight={400} opacity={pop(2, .3)}>mã · tên · giá</Label>
      {buttons.map((x, k) => <Chip key={k} t={t} f={f} x={500} y={470 + k * 85} text={x} at={at(2, .8 + k * .6)} size={36} tone="bad" />)}
      <DiagramWire t={t} f={f} pts={[[824, 500], [1136, 500]]} at={at(2, 2)} />
      <Card x={1450} y={500} w={600} h={420} o={pop(1)} tone={INFRA} />
      <Label t={t} x={1450} y={350} size={42} color={INFRA} opacity={pop(1)}>trang e-book</Label>
      <Label t={t} x={1450} y={460} size={38} weight={400} opacity={pop(1, .4)}>cần: mã · tên · giá</Label>
      <Say o={only(3)} text="chỉ cần nhìn, lại cầm cả quyền sửa" tone="bad" />
      <Say o={only(4)} text="class phình dần vì phục vụ cả hai việc" tone="bad" />
    </g>
    {/* B · 5–6: a read-only model from a read-only store */}
    <g opacity={span(5, 6)}>
      <Title o={pop(5)}>Tách phần đọc ra riêng</Title>
      <Card x={330} y={500} w={400} h={180} o={pop(5, .3)} tone={INFRA} label="kho chỉ để đọc" size={40} />
      <DiagramWire t={t} f={f} pts={[[534, 500], [686, 500]]} at={at(5, .8)} />
      <Card x={900} y={500} w={420} h={280} o={pop(5, 1)} tone={RULE} />
      <Label t={t} x={900} y={430} size={40} color={RULE} opacity={pop(5, 1)}>chỉ để đọc</Label>
      <Label t={t} x={900} y={505} size={38} weight={400} opacity={pop(5, 1.3)}>mã · tên · giá</Label>
      <Label t={t} x={900} y={585} size={44} color={RULE} opacity={pop(6)}>120.000 ₫</Label>
      <DiagramWire t={t} f={f} pts={[[1114, 500], [1266, 500]]} at={at(5, 1.6)} />
      <Card x={1520} y={500} w={480} h={300} o={pop(5, 1.8)} tone={INFRA} />
      <Label t={t} x={1520} y={440} size={40} color={INFRA} opacity={pop(5, 1.8)}>trang e-book</Label>
      <Label t={t} x={1520} y={540} size={44} opacity={pop(6, .4)}>120.000 ₫</Label>
    </g>
    {/* C · 7–10: CQRS exists; the book takes the light way */}
    <g opacity={span(7, 10)}>
      <Title o={pop(7)}>CQRS, hay cách nhẹ hơn</Title>
      <g opacity={1 - .7 * grow(f, at(9), at(9) + 12)}>
        <Card x={520} y={330} w={360} h={130} o={pop(7, .3)} tone={INFRA} label="kho ghi" />
        <Card x={1400} y={330} w={360} h={130} o={pop(7, .6)} tone={INFRA} label="kho đọc" />
        <DiagramWire t={t} f={f} pts={[[704, 330], [1216, 330]]} at={at(7, 1)} />
        <DiagramPacket t={t} f={f} pts={[[704, 330], [1216, 330]]} at={at(7, 1.4)} period={60} />
      </g>
      <Chip t={t} f={f} x={960} y={445} text="giữ hai kho khớp nhau là cả một việc" at={at(8, .3)} size={34} tone="bad" />
      <g opacity={pop(9)}>
        <Card x={960} y={650} w={360} h={160} tone={RULE} label="một database" />
        <Card x={440} y={650} w={380} h={120} tone={INFRA} label="đường ghi" size={40} />
        <Card x={1480} y={650} w={380} h={120} tone={INFRA} label="đường đọc" size={40} />
        <DiagramWire t={t} f={f} pts={[[634, 650], [776, 650]]} at={at(9, .4)} />
        <DiagramWire t={t} f={f} pts={[[1286, 650], [1144, 650]]} at={at(9, .7)} />
      </g>
      <Say o={only(10)} text="đọc thì trả đúng thứ cần đọc" />
    </g>
  </Stage>;
};

// ---- 06 · one job, one service ------------------------------------------------------------------------------------
export const MoiViec: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, only, pop} = useBeat(s);
  const blocks = ['nhận request', 'kiểm tra', 'tính tiền', 'trừ kho', 'lưu', 'gửi mail'];
  const grown = Math.min(blocks.length, Math.floor(grow(f, at(0, .4), at(1, 3)) * blocks.length + .5));
  const callers = ['trang web', 'API', 'lệnh chạy nền', 'bài test'];
  const steps = ['lấy sản phẩm', 'kiểm tra còn hàng', 'tính tiền', 'tạo đơn', 'cất vào kho'];
  const [store0, store1] = swap(f, at(10)), [mail0, mail1] = swap(f, at(10, .5));
  return <Stage>
    {/* A · 0–1: the controller keeps swallowing jobs */}
    <g opacity={span(0, 1)}>
      <Title o={pop(0)}>Controller phình to</Title>
      <rect x={610} y={220} width={700} height={110 + grown * 76} rx={22} fill={p.surface} stroke={grown > 4 ? BAD : INFRA} strokeWidth={4} opacity={pop(0, .2)} />
      <Label t={t} x={960} y={290} size={42} opacity={pop(0, .2)}>Controller</Label>
      {blocks.slice(0, grown).map((x, k) => <g key={k}><rect x={660} y={318 + k * 76} width={600} height={62} rx={12} fill={p.background} stroke={p.muted} strokeWidth={2} />
        <Label t={t} x={960} y={362 + k * 76} size={36} weight={400}>{x}</Label></g>)}
    </g>
    {/* B · 2–3: one Application Service per job, callable from anywhere */}
    <g opacity={span(2, 3)}>
      <Title o={pop(2)}>Mỗi việc một service</Title>
      <Card x={1320} y={480} w={600} h={220} o={pop(2, .3)} tone={RULE} label="Đặt hàng" sub="Application Service" size={48} />
      {callers.map((x, k) => <g key={k}>
        <Card x={400} y={270 + k * 140} w={340} h={110} o={pop(3, k * .5)} tone={INFRA} label={x} size={38} />
        <DiagramWire t={t} f={f} pts={[[574, 270 + k * 140], [1014, 440 + k * 27]]} at={at(3, .3 + k * .5)} /></g>)}
    </g>
    {/* C · 4–8: a request slip goes in, the steps run, an order number comes out */}
    <g opacity={span(4, 8)}>
      <Title o={pop(4)}>Phiếu yêu cầu vào, mã đơn ra</Title>
      <Card x={330} y={480} w={400} h={340} o={pop(4, .3)} tone={INFRA} />
      <Label t={t} x={330} y={365} size={40} color={INFRA} opacity={pop(4, .3)}>phiếu yêu cầu</Label>
      <Label t={t} x={330} y={410} size={34} weight={400} color={p.muted} opacity={pop(4, .3)}>command</Label>
      {['mã khách', 'sản phẩm', 'email'].map((x, k) => <Label key={k} t={t} x={330} y={480 + k * 60} size={38} weight={400} opacity={pop(4, .8 + k * .4)}>{x}</Label>)}
      <DiagramWire t={t} f={f} pts={[[534, 480], [756, 480]]} at={at(4, 1.6)} />
      <Card x={1060} y={480} w={600} h={560} o={pop(4, .6)} tone={RULE} />
      <Label t={t} x={1060} y={260} size={44} color={RULE} opacity={pop(4, .6)}>Đặt hàng</Label>
      {steps.map((x, k) => {const a = at(5, .3 + k * .9), bad = k === 1 && only(6) > 0;return <g key={k}
        opacity={Math.max(.3 * pop(4, 1), grow(f, a, a + 10))}>
        <Label t={t} x={1060} y={360 + k * 78} size={38} color={bad ? BAD : p.ink}>{x}</Label></g>;})}
      <DiagramWire t={t} f={f} pts={[[1364, 480], [1476, 480]]} at={at(7)} />
      <Card x={1640} y={480} w={320} h={150} o={pop(7, .3)} tone={RULE} label="mã đơn" sub="#42" />
      <Say o={only(6)} text="hết hàng → báo lỗi" tone="bad" />
      <Say o={only(8)} text="controller: đổi yêu cầu thành phiếu, trả kết quả" tone="accent2" />
    </g>
    {/* D · 9–12: what the service needs is handed in from outside — real at run time, fakes in a test */}
    <g opacity={span(9, 12)}>
      <Title o={pop(9)}>Đưa đồ nghề vào từ bên ngoài</Title>
      <Card x={300} y={480} w={320} h={200} o={pop(10)} tone={p.ink} label="bài test" sub={f > at(11) ? 'PASS' : undefined} subColor={INFRA} />
      <DiagramWire t={t} f={f} pts={[[464, 480], [636, 480]]} at={at(10, .3)} />
      <Card x={900} y={480} w={520} h={240} o={pop(9, .3)} tone={RULE} label="Đặt hàng" size={46} />
      <Card x={1520} y={340} w={460} h={130} o={pop(9, .6)} tone={INFRA} />
      <Label t={t} x={1520} y={354} size={40} opacity={pop(9, .6) * store0}>kho MySQL</Label>
      <Label t={t} x={1520} y={354} size={40} opacity={store1}>kho bộ nhớ</Label>
      <Card x={1520} y={620} w={460} h={130} o={pop(9, .9)} tone={INFRA} />
      <Label t={t} x={1520} y={634} size={40} opacity={pop(9, .9) * mail0}>gửi mail thật</Label>
      <Label t={t} x={1520} y={634} size={40} opacity={mail1}>bộ gửi mail giả</Label>
      <DiagramWire t={t} f={f} pts={[[1286, 340], [1164, 420]]} at={at(9, 1)} />
      <DiagramWire t={t} f={f} pts={[[1286, 620], [1164, 540]]} at={at(9, 1.3)} />
      <Say o={only(11)} text="không framework · không database · không mạng" tone="accent2" />
      <Say o={only(12)} text="test dễ viết thì người ta mới dám sửa code" />
    </g>
  </Stage>;
};

// ---- 07 · arrows point inward ----------------------------------------------------------------------------------------
export const VaoTrong: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, only, pop} = useBeat(s);
  const tiers = ['Giao diện', 'Nghiệp vụ', 'Dữ liệu'];
  const cx = 1180, cy = 500;
  const notes: [number, number, string, string, string?][] = [[6, 7, 'Domain', 'đơn hàng · giá trị', 'luật bán hàng'], [8, 8, 'Application', 'service cho từng việc', 'lớp keo nối mọi thứ'],
    [9, 9, 'Infrastructure', 'framework · database', 'gửi mail · các nhà kho'], [10, 10, 'Dependency Rule', 'mũi tên phụ thuộc', 'chỉ hướng vào trong'],
    [11, 11, 'Vòng ngoài', 'biết vòng trong', ''], [12, 12, 'Vòng trong', 'không biết vòng ngoài', ''], [13, 13, 'Kho MySQL', 'làm theo hợp đồng', 'của Domain'],
    [14, 14, 'Hollywood Principle', 'đừng gọi chúng tôi,', 'chúng tôi sẽ gọi bạn']];
  const real = f < at(16) ? 0 : Math.floor(loop(f, at(16), 90) * 2);
  const lasagna = grow(f, at(4), at(4) + 8);
  return <Stage>
    {/* A · 0–4: three stacked tiers; logic leaks; too many layers become lasagna */}
    <g opacity={span(0, 4)}>
      <Title o={pop(0)}>Cách chia quen thuộc: ba tầng</Title>
      <g opacity={1 - lasagna}>
        {tiers.map((x, k) => <Card key={k} x={960} y={320 + k * 190} w={1000} h={150} o={pop(1, k * .5)} tone={k === 1 ? RULE : INFRA} label={x} size={44} />)}
        <path d="M440 330 C 260 500 260 650 440 700" fill="none" stroke={BAD} strokeWidth={6} strokeDasharray="14 10" opacity={pop(3)} />
        <Label t={t} x={250} y={530} size={38} color={BAD} opacity={pop(3, .4)}>rò rỉ</Label>
      </g>
      {Array.from({length: 11}, (_, k) => <rect key={k} x={560} y={250 + k * 52} width={800} height={38} rx={6} fill={k % 2 ? RULE : p.surface} stroke={p.muted}
        opacity={grow(f, at(4, .4 + k * .1), at(4, .6 + k * .1)) * .9} />)}
      <Say o={only(2)} text="giúp biết đặt code ở đâu" tone="accent2" />
      <Say o={only(4)} text="quá nhiều lớp: mã lasagna" tone="bad" />
    </g>
    {/* B · 5–14: three rings, business in the middle; every arrow points inward */}
    <g opacity={span(5, 14)}>
      <circle cx={cx} cy={cy} r={350} fill={p.surface} stroke={p.muted} strokeWidth={4} opacity={pop(5, .2)} />
      <circle cx={cx} cy={cy} r={240} fill={p.background} stroke={INFRA} strokeWidth={4} opacity={pop(5, .5)} />
      <circle cx={cx} cy={cy} r={130} fill={p.surface} stroke={RULE} strokeWidth={5} opacity={pop(5, .8)} />
      <Label t={t} x={cx} y={cy + 16} size={44} color={RULE} opacity={pop(5, .8)}>Domain</Label>
      <Label t={t} x={cx} y={318} size={38} color={INFRA} opacity={pop(5, .5)}>Application</Label>
      <Label t={t} x={cx} y={208} size={38} color={p.muted} opacity={pop(5, .2)}>Infrastructure</Label>
      <rect x={70} y={250} width={680} height={460} rx={24} fill={p.surface} stroke={p.muted} strokeWidth={3} opacity={pop(6)} />
      {notes.map(([a, b, head, l1, l2], k) => {const o = only(a, b);return o > 0 ? <g key={k} opacity={o}>
        <Label t={t} x={410} y={380} size={46} color={k === 0 ? RULE : k === 1 ? INFRA : k === 2 ? p.muted : p.ink}>{head}</Label>
        <Label t={t} x={410} y={480} size={40} weight={400}>{l1}</Label>
        {l2 ? <Label t={t} x={410} y={550} size={40} weight={400}>{l2}</Label> : null}
        {a === 6 && f > at(7) ? <Row f={f} x={170} y={640} text="không dùng framework" at={at(7)} size={38} /> : null}</g> : null;})}
      {[[cx + 350, cx + 240], [cx + 240, cx + 130], [cx - 350, cx - 240], [cx - 240, cx - 130]].map(([a, b], k) =>
        <DiagramWire key={k} t={t} f={f} pts={[[a + (a > cx ? 6 : -6), cy], [b + (b > cx ? 8 : -8), cy]]} at={at(10, .3 + (k % 2) * .4)} width={5} color={p.accent} />)}
      <g opacity={only(12)}>
        <path d={`M${cx} ${cy + 136} V${cy + 300}`} stroke={BAD} strokeWidth={5} strokeDasharray="12 10" />
        <Mark t={t} f={f} x={cx} y={cy + 220} ok={false} at={at(12, .5)} size={70} />
      </g>
      <g opacity={only(13, 14)}>
        <Card x={1720} y={620} w={260} h={90} tone={INFRA} label="kho MySQL" size={36} />
        <DiagramWire t={t} f={f} pts={[[1588, 610], [cx + 136, cy + 30]]} at={at(13, .4)} width={5} color={p.accent} />
      </g>
    </g>
    {/* C · 15–16: one place wires it all — real store at run time, memory in tests */}
    <g opacity={span(15, 16)}>
      <Title o={pop(15)}>Ráp ở một chỗ duy nhất</Title>
      <Card x={700} y={480} w={440} h={200} o={pop(15, .3)} tone={p.ink} label="chỗ khai báo" />
      {['kho MySQL · chạy thật', 'kho bộ nhớ · chạy test'].map((x, k) => {const on = real === k && f > at(15, 1);return <g key={k}>
        <Card x={1420} y={350 + k * 260} w={520} h={130} o={pop(15, .6 + k * .3) * (on || f < at(15, 1) ? 1 : .5)} tone={on ? p.accent : INFRA} label={x} size={38} />
        <DiagramWire t={t} f={f} pts={[[924, 480], [1156, 350 + k * 260]]} at={at(15, 1 + k * .2)} opacity={on ? 1 : .35} /></g>;})}
    </g>
    {/* D · 17–18: not everything needs three rings */}
    <g opacity={span(17, 18)}>
      <Title o={pop(17)}>Không phải việc gì cũng cần đủ ba vòng</Title>
      <Card x={510} y={520} w={760} h={520} o={pop(17, .4)} tone={INFRA} />
      <Label t={t} x={510} y={330} size={42} color={INFRA} opacity={pop(17, .4)}>việc đơn giản</Label>
      <Card x={510} y={540} w={420} h={150} o={pop(18)} tone={INFRA} label="gộp lại" />
      <Card x={1410} y={520} w={760} h={520} o={pop(17, .8)} tone={RULE} />
      <Label t={t} x={1410} y={330} size={42} color={RULE} opacity={pop(17, .8)}>phần lõi phức tạp</Label>
      {[170, 115, 60].map((r, k) => <circle key={k} cx={1410} cy={560} r={r} fill={k === 2 ? p.surface : 'none'} stroke={[p.muted, INFRA, RULE][k]} strokeWidth={4} opacity={pop(18, .6 + k * .3)} />)}
    </g>
  </Stage>;
};

// ---- 08 · a USB port: Ports and Adapters --------------------------------------------------------------------------
export const OCam: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, only, pop} = useBeat(s);
  const devices = ['chuột', 'bàn phím', 'ổ cứng'];
  const usb: [number, number][] = [[at(4), 0], ...cycle(at(4, 1.6), 3, 50, at(6))].map(([a, k], i) => [a, i === 0 ? 0 : (k + 1) % 3] as [number, number]);
  const ins = ['trang web', 'API', 'dòng lệnh', 'bài test'], outs = ['lưu đơn', 'gửi thông báo', 'dịch vụ ngoài'];
  const flip = (row: number) => {const a = at(11 + row), on = f > a && f < at(13);return on ? Math.floor(loop(f, a + 20, 80) * 2) : f >= at(13) ? 1 : 0;};
  const pairs: [string, string, string][] = [['lưu đơn', 'MySQL', 'bộ nhớ'], ['gửi xác nhận', 'email thật', 'chỉ ghi log']];
  const fourSteps = ['tìm các port', 'viết hợp đồng', 'viết adapter', 'ráp ở một chỗ'];
  return <Stage>
    {/* A · 0–5: Hexagonal Architecture; a computer only knows the USB standard */}
    <g opacity={span(0, 5)}>
      <Title o={pop(0)}>Hexagonal Architecture</Title>
      <Label t={t} x={960} y={215} size={36} weight={400} color={p.muted} opacity={pop(1)}>Alistair Cockburn · 2005</Label>
      <Hex x={500} y={500} r={210} o={pop(0, .5)} label="lõi" />
      <Card x={1100} y={500} w={460} h={300} o={pop(3)} tone={p.ink} label="máy tính" />
      <rect x={1312} y={470} width={30} height={60} rx={6} fill={p.background} stroke={INFRA} strokeWidth={4} opacity={pop(3, .4)} />
      {devices.map((x, k) => {const v = plugged(f, usb, k);return <Card key={k} x={lerp(1740, 1470, v)} y={lerp(300 + k * 200, 500, v)} w={240} h={120}
        o={pop(4, k * .4)} tone={v > .5 ? p.accent : INFRA} label={x} size={38} />;})}
      <Say o={only(2)} text="lục giác chỉ là cách vẽ" tone="muted" />
      <Say o={only(5)} text="nó chỉ biết một chuẩn cắm" />
    </g>
    {/* B · 6–10: business in the middle; ports for the world to call in, ports for the core to call out */}
    <g opacity={span(6, 10)}>
      <Hex x={960} y={500} r={220} o={pop(6)} label="nghiệp vụ" size={46} />
      {ins.map((x, k) => <g key={k}>
        <Card x={330} y={290 + k * 140} w={360} h={100} o={pop(9, k * .4)} tone={INFRA} label={x} size={38} />
        <DiagramWire t={t} f={f} pts={[[514, 290 + k * 140], [736, 470 + k * 20]]} at={at(9, .2 + k * .4)} /></g>)}
      {outs.map((x, k) => <g key={k}>
        <Card x={1600} y={330 + k * 170} w={380} h={110} o={pop(10, k * .5)} tone={INFRA} label={x} size={38} />
        <DiagramWire t={t} f={f} pts={[[1184, 480 + k * 20], [1406, 330 + k * 170]]} at={at(10, .2 + k * .5)} /></g>)}
      <Label t={t} x={330} y={200} size={40} color={INFRA} opacity={pop(9)}>gọi vào</Label>
      <Label t={t} x={1600} y={225} size={40} color={INFRA} opacity={pop(10)}>gọi ra</Label>
      <Say o={only(7)} text="port = chuẩn cắm" tone="accent2" />
      <Say o={only(8)} text="adapter = thiết bị cắm vào" />
    </g>
    {/* C · 11–14: the book's example — two ports, a real and a fake adapter for each */}
    <g opacity={span(11, 14)}>
      <Title o={pop(11)}>Ví dụ trong sách</Title>
      <Hex x={420} y={490} r={190} o={pop(11, .2)} label="đặt hàng" size={40} />
      {pairs.map(([port, real, fake], k) => {const y = 340 + k * 300, side = flip(k), on = pop(11 + k);const [a0, a1] = side ? [0, 1] : [1, 0];return <g key={k}>
        <DiagramWire t={t} f={f} pts={[[612, 490], [756, y]]} at={at(11 + k, .2)} />
        <Socket x={900} y={y} w={280} h={150} o={on} label={port} size={36} />
        <path d={`M1040 ${y} H1226`} stroke={p.ink} strokeWidth={6} strokeLinecap="round" opacity={pop(11 + k, .6)} />
        <Card x={1440} y={y} w={420} h={140} o={pop(11 + k, .5)} tone={side ? p.accent : INFRA} />
        <Label t={t} x={1440} y={y + 15} size={40} opacity={pop(11 + k, .5) * a0}>{real}</Label>
        <Label t={t} x={1440} y={y + 15} size={40} opacity={a1}>{fake}</Label></g>;})}
      <Say o={only(13)} text="test: hai adapter giả, không khởi động Laravel" tone="accent2" />
      <Say o={only(14)} text="Cockburn: trước hết để test cho dễ" />
    </g>
    {/* D · 15–18: extending without touching the core */}
    <g opacity={span(15, 18)}>
      <Title o={pop(15)}>Mở rộng, lõi giữ nguyên</Title>
      <Hex x={960} y={480} r={200} o={pop(15, .3)} label="đặt hàng" size={42} />
      <Card x={330} y={480} w={380} h={150} o={pop(16)} tone={p.accent} label="đọc file CSV" sub="adapter mới" size={40} />
      <DiagramWire t={t} f={f} pts={[[524, 480], [756, 480]]} at={at(16, .4)} />
      {[0, 1].map((k) => <g key={k}>
        <Card x={1600} y={300 + k * 200} w={340} h={120} o={pop(17, k * .5)} tone={INFRA} label={`database ${'AB'[k]}`} size={38} />
        <DiagramWire t={t} f={f} pts={[[1164, 470 + k * 20], [1426, 300 + k * 200]]} at={at(17, .3 + k * .5)} /></g>)}
      <Card x={1600} y={720} w={380} h={130} o={pop(18)} tone={INFRA} label="phần khách hàng" sub="qua một port" size={38} />
      <DiagramWire t={t} f={f} pts={[[1070, 650], [1406, 720]]} at={at(18, .4)} dashed />
    </g>
    {/* E · 19: four steps */}
    <g opacity={span(19, 19)}>
      <Title o={pop(19)}>Áp dụng trong bốn bước</Title>
      {fourSteps.map((x, k) => <g key={k}>
        <Label t={t} x={300 + k * 440} y={370} size={60} mono color={RULE} opacity={pop(19, .3 + k * 1.1)}>{k + 1}</Label>
        <Card x={300 + k * 440} y={520} w={400} h={170} o={Math.max(.3 * pop(19, .2), pop(19, .3 + k * 1.1))} tone={RULE} label={x} size={38} />
        {k < 3 ? <DiagramWire t={t} f={f} pts={[[504 + k * 440, 520], [536 + k * 440, 520]]} at={at(19, .9 + k * 1.1)} dur={8} /> : null}</g>)}
    </g>
  </Stage>;
};

// ---- 09 · don't overdo it, start small ------------------------------------------------------------------------------
export const BatDauNho: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, only, pop} = useBeat(s);
  const keep = [9, 22];
  const loopSteps = ['chọn một việc thật', 'tách phụ thuộc khó test', 'viết test không cần DB', 'làm tiếp việc sau'];
  const lp: Pt[] = [[600, 360], [1320, 360], [1320, 690], [600, 690], [600, 360]];
  const lit = Math.floor(loop(f, at(12, .5), 120) * 4);
  const ends: [string, Pt][] = [['web', [400, 340]], ['database', [1520, 340]], ['email', [1520, 660]], ['API', [400, 660]]];
  return <Stage>
    {/* A · 0–3: the price — many interfaces; keep only the useful ones */}
    <g opacity={span(0, 3)}>
      <Title o={pop(0)}>Cái giá</Title>
      {Array.from({length: 32}, (_, k) => {const x = 480 + (k % 8) * 130, y = 290 + Math.floor(k / 8) * 110, kept = keep.includes(k);
        return <rect key={k} x={x} y={y} width={110} height={76} rx={12} fill={p.background} stroke={kept ? RULE : INFRA} strokeWidth={3}
          opacity={grow(f, at(0, .8 + k * .04), at(0, 1.1 + k * .04)) * (kept ? 1 : 1 - .8 * grow(f, at(3, .5), at(3, 1)))} />;})}
      <Say o={only(1)} text="nhiều interface hơn, nhiều class hơn" tone="accent2" />
      <Say o={only(2)} text="cần quy ước đặt tên" tone="muted" />
      <Say o={only(3)} text="chỉ tách chỗ hay thay đổi hoặc khó test" />
    </g>
    {/* B · 4–7: the one question to keep */}
    <g opacity={span(4, 7)}>
      <Card x={960} y={300} w={1200} h={240} o={pop(4, .3)} tone={RULE} />
      <Label t={t} x={960} y={285} size={46} opacity={pop(4, .5)}>Chạy được một mình, trong bộ nhớ,</Label>
      <Label t={t} x={960} y={350} size={46} opacity={pop(4, .9)}>không cần gì bên ngoài?</Label>
      <DiagramWire t={t} f={f} pts={[[760, 424], [560, 560]]} at={at(6)} />
      <DiagramWire t={t} f={f} pts={[[1160, 424], [1360, 560]]} at={at(7)} />
      <Card x={520} y={680} w={560} h={190} o={pop(6, .2)} tone={RULE} label="có → nghiệp vụ" sub="giữ sạch ở giữa" />
      <Card x={1400} y={680} w={560} h={190} o={pop(7, .2)} tone={INFRA} label="không → hạ tầng" sub="ra rìa, sau hợp đồng" />
    </g>
    {/* C · 8–12: start small, one job at a time, on repeat */}
    <g opacity={span(8, 12)}>
      <Title o={pop(8)}>Không cần đập đi làm lại</Title>
      {loopSteps.map((x, k) => {const [x0, y0] = lp[k];return <Card key={k} x={x0} y={y0} w={540} h={150} o={Math.max(.3 * pop(8, .5), pop(9 + k))} tone={f > at(12, .5) && lit === k ? RULE : INFRA} label={x} size={38} />;})}
      {[0, 1, 2, 3].map((k) => {const [ax, ay] = lp[k], [bx, by] = lp[k + 1], sx = Math.sign(bx - ax), sy = Math.sign(by - ay);
        return <DiagramWire key={k} t={t} f={f} pts={[[ax + sx * 274, ay + sy * 79], [bx - sx * 274, by - sy * 79]]} at={at(10 + Math.min(k, 2), .2)} />;})}
    </g>
    {/* D · 13–15: what the book promises — knowing where to change */}
    <g opacity={span(13, 15)}>
      <Title o={pop(13)} color={p.muted}>Sách không hứa code chạy nhanh hơn</Title>
      <Hex x={960} y={500} r={190} o={pop(13, .5)} label="nghiệp vụ" size={42} />
      {ends.map(([x, pos], k) => {const hot = k === 1 && f > at(14, 1.6);return <g key={k}>
        <Card x={pos[0]} y={pos[1]} w={380} h={120} o={pop(14, .3 + k * .2)} tone={hot ? p.accent : INFRA} label={x} size={40} thick={hot ? 6 : 4} />
        <DiagramWire t={t} f={f} pts={[[pos[0] + (k % 3 ? -194 : 194), pos[1]], [960 + (k % 3 ? 160 : -160), 500 + (k > 1 ? 70 : -70)]]} at={at(14, .5 + k * .2)} /></g>;})}
      <Say o={only(14)} text="khi yêu cầu đổi, biết phải sửa ở đâu" />
    </g>
  </Stage>;
};
