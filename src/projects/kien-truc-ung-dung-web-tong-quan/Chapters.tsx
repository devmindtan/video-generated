import type {FC, ReactNode} from 'react';
import {Img, staticFile} from 'remotion';
import {Chip, CodeCard, DiagramNode, DiagramPacket, DiagramWire, Label, MONO, Mark, grow} from '../../looks/diagram-kit';
import {Stage, THEME, useBeat} from './common';
import type {Seg} from './common';

// Kiến trúc ứng dụng web: tóm tắt cả cuốn sách — one component per narration segment. A beat spans the sentences in its
// comment (0-based, script.md order); its first picture is on screen from its first sentence, and it keeps moving
// while the voice talks (packets on wires, lit steps, typed code). Layout rules (user review 2026-11-12): use the
// whole picture area y 110–870 above the captions, text ≥ 34 px (code ≥ 30 px), no text over borders or icons.
// Examples, class names and the order of ideas are the book's (docs/projects/kien-truc-ung-dung-web-tong-quan/sources.md).

const t = THEME, p = t.palette, BAD = '#ff6b6b';
type Pt = [number, number];
const loop = (f: number, a: number, period: number) => f < a ? 0 : ((f - a) / period) % 1;

const Title: FC<{children: ReactNode; o: number; y?: number; color?: string}> = ({children, o, y = 150, color}) =>
  <Label t={t} x={960} y={y} size={54} opacity={o} color={color}>{children}</Label>;
// A panel with an optional heading; children are drawn in Stage coordinates.
const Panel: FC<{x: number; y: number; w: number; h: number; o?: number; tone?: string; title?: string; titleColor?: string; children?: ReactNode}> =
  ({x, y, w, h, o = 1, tone, title, titleColor, children}) =>
    <g opacity={o}>
      <rect x={x} y={y} width={w} height={h} rx={22} fill={p.surface} stroke={tone ?? p.accent2} strokeWidth={3} />
      {title ? <Label t={t} x={x + w / 2} y={y + 62} size={42} color={titleColor ?? tone ?? p.accent2}>{title}</Label> : null}
      {children}
    </g>;
// One list row: mark + text; the mark draws when the row appears.
// `pre`: the row is already on screen, dimmed, from this frame, so a list never starts empty.
const Row: FC<{f: number; x: number; y: number; text: string; at: number; pre?: number; ok?: boolean; size?: number; color?: string; mono?: boolean}> =
  ({f, x, y, text, at, pre, ok = true, size = 38, color, mono}) =>
    <g opacity={Math.max(grow(f, at, at + 10), pre === undefined ? 0 : .32 * grow(f, pre, pre + 10))}>
      <Mark t={t} f={f} x={x + 20} y={y - size * .34} ok={ok} at={at + 2} size={size * .9} />
      <Label t={t} x={x + 64} y={y} anchor="start" size={size} weight={400} color={color ?? p.ink} mono={mono}>{text}</Label>
    </g>;
// A labelled box that is only a box (no icon), with an optional second line.
const Box: FC<{f: number; x: number; y: number; w: number; h: number; at: number; label: string; sub?: string; state?: 'ok' | 'key' | 'hot' | 'dim' | 'down'; size?: number; mono?: boolean}> =
  ({f, x, y, w, h, at, label, sub, state = 'ok', size = 38, mono}) =>
    <g>
      <DiagramNode t={t} f={f} x={x} y={y} w={w} h={h} kind="none" at={at} state={state} />
      <Label t={t} x={x} y={y + (sub ? -6 : size * .36)} size={size} mono={mono} opacity={grow(f, at, at + 14) * (state === 'dim' ? .5 : 1)}
        color={state === 'down' ? BAD : p.ink}>{label}</Label>
      {sub ? <Label t={t} x={x} y={y + 46} size={34} weight={400} color={p.muted} opacity={grow(f, at, at + 14)}>{sub}</Label> : null}
    </g>;

const CONTROLLER = ['public function orderEbook(Request $request)', '{', "  $price = DB::table('ebooks')", "      ->where('id', $ebookId)->value('price');",
  '  $amount = $quantity * $price;', "  $orderId = DB::table('orders')", '      ->insertGetId($record);', "  $request->session()", "      ->put('currentOrderId', $orderId);", '}'];

// ---- 00 · opening --------------------------------------------------------------------------------------------
export const MoDau: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, pop} = useBeat(s);
  const chapters = ['Trộn lẫn', 'Ranh giới', 'Domain + Repository', 'Đọc và ghi', 'Use case', 'Ba tầng', 'Ports & Adapters'];
  const changes = [['đổi sang PostgreSQL', [2, 3, 5, 6]], ['thêm API JSON', [0, 7, 8]], ['viết test tính tiền', [2, 4, 5, 7]]] as const;
  const lit = Math.min(2, Math.floor(loop(f, at(4, 1.4), 120) * 3));
  return <Stage>
    {/* A · 0–2: the mixed controller, wired to its database and session; it works */}
    <g opacity={span(0, 2)}>
      <CodeCard t={t} f={f} x={110} y={150} w={1060} title="OrderController.php" at={0} cps={3.2} size={32} lines={CONTROLLER} highlight={[2, 3, 5, 6, 7, 8]} />
      <DiagramNode t={t} f={f} x={1500} y={290} w={300} h={180} kind="db" label="Database" at={at(1, .3)} />
      <DiagramNode t={t} f={f} x={1500} y={620} w={300} h={180} kind="box" label="Session" at={at(1, 3.4)} />
      <DiagramWire t={t} f={f} pts={[[1180, 330], [1340, 290]]} at={at(1, .6)} />
      <DiagramWire t={t} f={f} pts={[[1180, 520], [1340, 330]]} at={at(1, 2.2)} />
      <DiagramWire t={t} f={f} pts={[[1180, 640], [1340, 620]]} at={at(1, 3.6)} />
      <DiagramPacket t={t} f={f} pts={[[1340, 290], [1180, 330]]} at={at(1, 1.2)} period={36} label="giá" labelSize={34} />
      <DiagramPacket t={t} f={f} pts={[[1180, 520], [1340, 330]]} at={at(1, 2.6)} period={40} label="đơn" labelSize={34} />
      <g opacity={pop(2)}><Mark t={t} f={f} x={1420} y={845} ok at={at(2, .1)} size={52} /><Label t={t} x={1470} y={860} anchor="start" size={46} color={p.accent2}>chạy đúng</Label></g>
    </g>
    {/* B · 3–4: where is the business rule, and what would a change touch */}
    <g opacity={span(3, 4)}>
      <Title o={pop(3)} y={140}>Nghiệp vụ tính tiền nằm ở đâu?</Title>
      <CodeCard t={t} f={f} x={110} y={190} w={1060} title="OrderController.php" at={at(3) - 30} cps={40} size={32} lines={CONTROLLER} highlight={[4]} />
      <rect x={130} y={262 + 4 * 48} width={1020} height={44} rx={10} fill="none" stroke={p.accent} strokeWidth={4} opacity={pop(3, .8) * (.6 + .4 * Math.sin(f / 6))} />
      {changes.map(([label, lines], k) => <g key={k} opacity={pop(4, .3 + k * 1.6)}>
        <rect x={1250} y={250 + k * 200} width={560} height={150} rx={20} fill={p.surface} stroke={lit === k ? p.accent : p.accent2} strokeWidth={3} />
        <Label t={t} x={1530} y={318 + k * 200} size={40}>{label}</Label>
        <Label t={t} x={1530} y={370 + k * 200} size={34} weight={400} color={BAD}>{`sửa ${lines.length} dòng trong cùng một hàm`}</Label>
        {lit === k && f > at(4, 1.4) ? lines.map((ln) => <rect key={ln} x={118} y={262 + ln * 48} width={1044} height={44} rx={8} fill={BAD} opacity={.16} />) : null}
      </g>)}
    </g>
    {/* C · 5–6: the book, and the three separations it walks through */}
    <g opacity={span(5, 6)}>
      <foreignObject x={300} y={170} width={460} height={660}>
        <Img src={staticFile('kien-truc-ung-dung-web-tong-quan/images/book-cover.jpg')} style={{width: '100%', height: '100%', objectFit: 'contain', borderRadius: 12,
          transform: `translateY(${(1 - grow(f, at(5), at(5) + 16)) * 30}px)`, opacity: grow(f, at(5), at(5) + 16)}} />
      </foreignObject>
      <Label t={t} x={860} y={300} anchor="start" size={72} opacity={pop(5, .3)}>Kiến trúc ứng dụng web</Label>
      <Label t={t} x={860} y={380} anchor="start" size={40} color={p.accent} opacity={pop(5, .8)}>Nguyễn Thế Huy · ebook · 7 chương</Label>
      {['nghiệp vụ ✕ database', 'nghiệp vụ ✕ framework', 'nghiệp vụ ✕ giao tiếp bên ngoài'].map((x, k) =>
        <Chip key={k} t={t} f={f} x={1180} y={520 + k * 110} text={`tách ${x.split(' ✕ ')[0]} khỏi ${x.split(' ✕ ')[1]}`} at={at(6, 1.6 + k * 1.1)} size={38} tone={k === 0 ? 'accent' : 'accent2'} />)}
    </g>
    {/* D · 7: seven chapters, one example travelling through them */}
    <g opacity={span(7, 7)}>
      <Title o={pop(7)}>Bảy chương, một ví dụ đặt hàng</Title>
      {chapters.map((c, k) => {const x = k < 4 ? 270 + k * 460 : 500 + (k - 4) * 460, y = k < 4 ? 380 : 640, on = f > at(7, 1 + k * .6);return <g key={c}>
         <DiagramNode t={t} f={f} x={x} y={y} w={420} h={170} kind="none" at={at(7, .2 + k * .2)} state={on ? 'key' : 'dim'} />
        <Label t={t} x={x} y={y - 14} size={34} mono color={on ? p.accent : p.muted} opacity={pop(7, .2 + k * .2)}>{String(k + 1).padStart(2, '0')}</Label>
        <Label t={t} x={x} y={y + 42} size={36} color={on ? p.ink : p.muted} opacity={pop(7, .2 + k * .2)}>{c}</Label></g>;})}
      <DiagramPacket t={t} f={f} pts={[[270, 380], [1650, 380], [1650, 520], [500, 520], [500, 640], [1420, 640]]} at={at(7, .8)} period={150} r={12} />
    </g>
    {/* E · 8: the one question to take away */}
    <g opacity={span(8, 8)}>
      <Panel x={360} y={180} w={1200} h={330} tone={p.accent} o={pop(8)}>
        <Label t={t} x={960} y={300} size={46}>Đoạn code này có chạy được một mình,</Label>
        <Label t={t} x={960} y={370} size={46}>trong bộ nhớ, không cần database, framework?</Label>
        <Label t={t} x={960} y={450} size={34} weight={400} color={p.muted}>câu hỏi dùng được mỗi ngày</Label>
      </Panel>
      <DiagramWire t={t} f={f} pts={[[760, 520], [560, 650]]} at={at(8, 3)} />
      <DiagramWire t={t} f={f} pts={[[1160, 520], [1360, 650]]} at={at(8, 3.6)} />
      <Box f={f} x={520} y={740} w={460} h={150} at={at(8, 3.4)} label="có → nghiệp vụ" state="key" size={42} />
      <Box f={f} x={1400} y={740} w={460} h={150} at={at(8, 4)} label="không → hạ tầng" size={42} />
    </g>
  </Stage>;
};

// ---- 01 · when business logic and infrastructure live together ---------------------------------------------
export const TranLan: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, pop} = useBeat(s);
  const tags: [number, string, boolean][] = [[2, 'SQL', false], [4, 'tính tiền', true], [5, 'SQL', false], [7, 'session', false], [0, 'framework', false]];
  const problems = ['chỉ thấy công nghệ, không thấy nghiệp vụ', 'đổi công nghệ kéo theo sửa logic', 'test phải mang theo cả môi trường', 'dữ liệu sai lọt thẳng vào database', 'thành legacy: không ai dám sửa'];
  const gains: [string, string][] = [['đọc như một câu chuyện', 'tạo đơn → kiểm tra → lưu'], ['test chạy trong bộ nhớ', 'không cần dựng MySQL'], ['đổi hạ tầng', 'chỉ sửa đúng phần hạ tầng'], ['chung một quy ước', 'biết code nào đặt ở đâu']];
  const knot = Math.sin(f / 9) * 18;
  return <Stage>
    {/* A · 0–3: the same controller, each line tagged by what it really is */}
    <g opacity={span(0, 3)}>
      <Title o={pop(0)} y={140}>Một hàm, bốn thứ khác nhau</Title>
      <CodeCard t={t} f={f} x={110} y={190} w={1060} title="OrderController.php" at={4} cps={40} size={32} lines={CONTROLLER} highlight={[4]} />
      {tags.map(([line, text, core], k) => {const row = [0, 2, 4, 5, 7].indexOf(line), cy = 300 + row * 115;return <g key={k} opacity={pop(3, k * 1.1)}>
        <DiagramWire t={t} f={f} pts={[[1180, 290 + line * 48], [1310, cy]]} at={at(3, k * 1.1)} dur={10} color={core ? p.accent : p.accent2} />
        <Chip t={t} f={f} x={1560} y={cy} text={core ? `${text} = nghiệp vụ` : `${text} = hạ tầng`} at={at(3, .2 + k * 1.1)} size={36} tone={core ? 'accent' : 'accent2'} />
      </g>;})}
      <Label t={t} x={640} y={830} size={36} weight={400} color={p.muted} opacity={pop(1, 2)}>đặt hàng: lấy giá → tính tiền → lưu → session</Label>
    </g>
    {/* B · 4–6: three costs, each shown working */}
    <g opacity={span(4, 6)}>
      <Title o={pop(4)}>Cái giá của việc dính chung</Title>
      <Panel x={110} y={230} w={540} h={580} title="muốn test" o={pop(4)}>
        <DiagramNode t={t} f={f} x={380} y={420} w={260} h={130} kind="none" at={at(4, .3)} />
        <Label t={t} x={380} y={432} size={36} mono opacity={pop(4, .3)}>test tính tiền</Label>
        <DiagramWire t={t} f={f} pts={[[380, 490], [380, 580]]} at={at(4, .8)} color={BAD} />
        <DiagramNode t={t} f={f} x={380} y={670} w={260} h={150} kind="db" label="MySQL thật" at={at(4, 1)} state="hot" />
      </Panel>
      <Panel x={690} y={230} w={540} h={580} title="muốn đổi cách lưu" o={pop(5)}>
        <CodeCard t={t} f={f} x={730} y={340} w={460} at={at(5) - 40} cps={40} size={30} lines={['orderEbook()', '  giá, tiền,', '  INSERT orders', '  session']} highlight={[2]} />
        <Label t={t} x={960} y={660} size={36} weight={400} color={BAD} opacity={pop(5, 1.5)}>sửa giữa hàm đặt hàng</Label>
        <Label t={t} x={960} y={720} size={34} weight={400} color={p.muted} opacity={pop(5, 1.5)}>nơi không nói gì về lưu trữ</Label>
      </Panel>
      <Panel x={1270} y={230} w={540} h={580} title="không ai kiểm tra" o={pop(6)}>
        <DiagramNode t={t} f={f} x={1540} y={690} w={260} h={150} kind="db" label="orders" at={at(6)} state="down" />
        <DiagramWire t={t} f={f} pts={[[1540, 360], [1540, 600]]} at={at(6, .3)} color={BAD} />
        <DiagramPacket t={t} f={f} pts={[[1540, 360], [1540, 600]]} at={at(6, .6)} period={44} count={2} color={BAD} label="email: abc@" />
        <Label t={t} x={1540} y={340} size={34} mono color={BAD} opacity={pop(6, 1.6)}>quantity = 0</Label>
      </Panel>
    </g>
    {/* C · 7–9: mixed code — one business sentence tangled with infrastructure */}
    <g opacity={span(7, 9)}>
      <Title o={pop(7)}>Code trộn lẫn</Title>
      <Panel x={170} y={290} w={640} h={420} tone={p.accent} title="nghiệp vụ" o={pop(7, .3)}>
        <g opacity={pop(8)}><Label t={t} x={490} y={470} size={40}>đơn hàng gồm gì,</Label>
        <Label t={t} x={490} y={530} size={40}>giá bao nhiêu</Label>
        <Label t={t} x={490} y={630} size={34} weight={400} color={p.muted}>một câu duy nhất</Label></g>
      </Panel>
      <Panel x={1110} y={290} w={640} h={420} title="hạ tầng" o={pop(7, .9)}>
        {['database', 'session', 'framework', 'thư viện'].map((x, k) => <Label key={k} t={t} x={1430} y={430 + k * 66} size={38} weight={400} opacity={pop(9, .3 + k * .5)}>{x}</Label>)}
      </Panel>
      {[0, 1, 2].map((k) => <path key={k} d={`M810 ${420 + k * 90} C 900 ${360 + k * 90 + knot} 1020 ${480 + k * 90 - knot} 1110 ${420 + k * 90}`} fill="none" stroke={BAD} strokeWidth={4} opacity={pop(7, 1.4 + k * .3) * .8} />)}
      <Chip t={t} f={f} x={960} y={800} text="dính vào nhau trong cùng một hàm" at={at(9, 2.4)} size={36} tone="bad" />
    </g>
    {/* D · 10–15: five things that go wrong */}
    <g opacity={span(10, 15)}>
      <Title o={pop(10)}>Năm chuyện thường xảy ra</Title>
      {problems.map((x, k) => <Row key={k} f={f} x={420} y={290 + k * 115} text={x} at={at(11 + k)} pre={at(10, .4 + k * .25)} ok={false} size={42} />)}
    </g>
    {/* E · 16–20: what separating buys, one card per benefit */}
    <g opacity={span(16, 20)}>
      <Title o={pop(16)} color={p.accent2}>Khi tách được</Title>
      {gains.map(([head, line], k) => {const x = 140 + (k % 2) * 840, y = 230 + Math.floor(k / 2) * 300, a = at(17 + k), b = at(16, .4 + k * .25);return <g key={k} opacity={Math.max(grow(f, a, a + 12), .32 * grow(f, b, b + 10))}>
        <rect x={x} y={y} width={800} height={260} rx={22} fill={p.surface} stroke={p.accent2} strokeWidth={3} />
        <Mark t={t} f={f} x={x + 70} y={y + 80} ok at={a + 4} size={50} />
        <Label t={t} x={x + 130} y={y + 98} anchor="start" size={44}>{head}</Label>
        <Label t={t} x={x + 130} y={y + 178} anchor="start" size={36} weight={400} color={p.muted} mono={k === 0}>{line}</Label></g>;})}
    </g>
    {/* F · 21: the author's two-year rule of thumb — the parts around the business change faster */}
    <g opacity={span(21, 21)}>
      <Title o={pop(21)}>Theo tác giả: ứng dụng sống quá 2 năm</Title>
      <path d="M300 760 H1700" stroke={p.muted} strokeWidth={3} opacity={pop(21)} />
      {[0, 1, 2].map((y) => <Label key={y} t={t} x={300 + y * 700} y={810} size={34} mono color={p.muted} opacity={pop(21)}>{`năm ${y}`}</Label>)}
      {[['framework', 4], ['database', 3], ['dịch vụ ngoài', 5]].map(([name, n], k) => <g key={k}>
        <Label t={t} x={280} y={318 + k * 120} anchor="end" size={36} weight={400} opacity={pop(21, .4)}>{name as string}</Label>
        {Array.from({length: n as number}, (_, j) => <rect key={j} x={300 + j * 1400 / (n as number)} y={290 + k * 120} width={1400 / (n as number) - 16} height={44} rx={8}
          fill={j % 2 ? p.accent2 : p.surface} stroke={p.accent2} strokeWidth={2} opacity={grow(f, at(21, .6 + j * .5), at(21, .9 + j * .5))} />)}</g>)}
      <Label t={t} x={280} y={678} anchor="end" size={36} color={p.accent} opacity={pop(21, 1)}>nghiệp vụ</Label>
      <rect x={300} y={650} width={1400 * grow(f, at(21, 1), at(21, 5))} height={44} rx={8} fill={p.accent} opacity={.85} />
    </g>
  </Stage>;
};

// ---- 02 · the boundary: core or infrastructure -------------------------------------------------------------
export const KhacPhuc: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, pop} = useBeat(s);
  const outside: ['db' | 'cdn' | 'box' | 'service' | 'queue', string][] = [['db', 'database'], ['cdn', 'gọi mạng'], ['box', 'đọc file'], ['service', 'đồng hồ'], ['queue', 'SMTP']];
  const core = ['hàm tính VAT', 'Order tự tính tổng tiền', 'OrderService chỉ dùng interface'], infra = ['câu SQL', 'lời gọi HTTP', 'đọc file', 'controller', 'Eloquent model'];
  const clockHour = f > at(20, 1.2) ? 23 + 59 / 60 : 9 + f / 900;
  const hand = (v: number, len: number, w: number, c: string) => <path d={`M0 0 L${len * Math.sin(v * Math.PI * 2)} ${-len * Math.cos(v * Math.PI * 2)}`} stroke={c} strokeWidth={w} strokeLinecap="round" />;
  return <Stage>
    {/* A · 0–2: core code needs only memory and CPU */}
    <g opacity={span(0, 2)}>
      <Title o={pop(0)}>Core hay hạ tầng?</Title>
      <Panel x={460} y={210} w={1000} h={260} tone={p.accent} o={pop(0, .8)}>
        <Label t={t} x={960} y={320} size={56} color={p.accent}>core code = bộ nhớ + CPU</Label>
        <Label t={t} x={960} y={400} size={38} weight={400}>chạy được một mình, không cần gì bên ngoài</Label>
      </Panel>
      {outside.map(([kind, label], k) => <g key={k}>
        <DiagramNode t={t} f={f} x={300 + k * 330} y={680} w={280} h={190} kind={kind} label={label} at={at(2, k * .7)} state="dim" />
        <Mark t={t} f={f} x={300 + k * 330} y={640} ok={false} at={at(2, .3 + k * .7)} size={90} /></g>)}
    </g>
    {/* B · 3–5: two rules; fail either and it is infrastructure */}
    <g opacity={span(3, 5)}>
      <Title o={pop(3)}>Hai quy tắc</Title>
      <Panel x={130} y={230} w={800} h={430} title="1 · không phụ thuộc hệ thống ngoài" o={pop(3)}>
        {['database', 'API', 'file', 'đồng hồ hệ thống'].map((x, k) => <Row key={k} f={f} x={210} y={370 + k * 72} text={x} at={at(3, .8 + k * .5)} ok={false} />)}
      </Panel>
      <Panel x={990} y={230} w={800} h={430} title="2 · không cần môi trường đặc biệt" o={pop(4)}>
        {['web server', 'CLI', 'framework', 'biến POST, session'].map((x, k) => <Row key={k} f={f} x={1070} y={370 + k * 72} text={x} at={at(4, 2 + k * .6)} ok={false} />)}
      </Panel>
      <Chip t={t} f={f} x={960} y={770} text="thiếu một trong hai → hạ tầng" at={at(5)} size={42} tone="accent" />
    </g>
    {/* C · 6–10: sorting real examples; infrastructure is what is left */}
    <g opacity={span(6, 10)}>
      <Panel x={130} y={190} w={780} h={600} tone={p.accent} title="core" titleColor={p.accent} o={pop(6)}>
        {core.map((x, k) => <Row key={k} f={f} x={180} y={340 + k * 100} text={x} at={at(6 + k)} size={38} />)}
      </Panel>
      <Panel x={1010} y={190} w={780} h={600} title="hạ tầng" o={pop(9)}>
        {infra.map((x, k) => <Row key={k} f={f} x={1060} y={320 + k * 90} text={x} at={at(9, k * .7)} ok={false} size={38} />)}
      </Panel>
      <g opacity={pop(10)}>
        <rect x={430} y={810} width={1060} height={70} rx={14} fill={p.background} stroke={p.accent} strokeWidth={3} />
        <Label t={t} x={960} y={858} size={40} color={p.accent}>hạ tầng = toàn bộ code − core</Label>
      </g>
    </g>
    {/* D · 11–13: same folder, two natures */}
    <g opacity={span(11, 13)}>
      <Title o={pop(11)}>Đừng nhầm thư mục với bản chất</Title>
      <Panel x={260} y={230} w={900} h={560} title="app/Services/" o={pop(11, .4)}>
        <Box f={f} x={710} y={430} w={760} h={130} at={at(11, .8)} label="PriceCalculator.php" sub="chỉ tính toán" state={f > at(12, .5) ? 'key' : 'ok'} size={38} mono />
        <Box f={f} x={710} y={640} w={760} h={130} at={at(11, 1.2)} label="RateClient.php" sub="gọi API tỷ giá" size={38} mono />
      </Panel>
      <DiagramNode t={t} f={f} x={1560} y={640} w={300} h={190} kind="cdn" label="API ngoài" at={at(13)} />
      <DiagramWire t={t} f={f} pts={[[1090, 640], [1410, 640]]} at={at(13, .3)} color={BAD} />
      <DiagramPacket t={t} f={f} pts={[[1090, 640], [1410, 640]]} at={at(13, .8)} period={34} color={BAD} />
      <Chip t={t} f={f} x={1290} y={430} text="core" at={at(12, .6)} size={40} tone="accent" />
      <Chip t={t} f={f} x={1560} y={800} text="hạ tầng" at={at(13, 1)} size={40} />
    </g>
    {/* E · 14–16: an interface over infrastructure is still infrastructure */}
    <g opacity={span(14, 16)}>
      <Title o={pop(14)}>Interface chưa chắc là core</Title>
      <CodeCard t={t} f={f} x={140} y={240} w={800} title="Connection.php" at={at(14, .8)} cps={2.6} size={34} lines={['interface Connection', '{', '  insert($table, $data);', '}']} highlight={[2]} />
      <Chip t={t} f={f} x={540} y={640} text="vẫn lộ: bảng, dòng dữ liệu" at={at(15, 1)} size={36} tone="bad" />
      <CodeCard t={t} f={f} x={980} y={240} w={800} title="OrderRepository.php" at={at(16, .4)} cps={2.6} size={34} lines={['interface OrderRepository', '{', '  save(Order $order);', '}']} highlight={[2]} />
      <Chip t={t} f={f} x={1380} y={640} text="nói bằng nghiệp vụ: lưu đơn hàng" at={at(16, 1.6)} size={36} tone="accent" />
    </g>
    {/* F · 17–21: the clock — logic asks an interface, a fake clock can jump to midnight */}
    <g opacity={span(17, 21)}>
      <Title o={pop(17)}>Ví dụ: đồng hồ</Title>
      <Box f={f} x={420} y={480} w={420} h={170} at={at(17, .3)} label="logic đặt hàng" state="key" size={40} />
      <g opacity={1 - grow(f, at(19), at(19) + 10)}>
        <DiagramWire t={t} f={f} pts={[[630, 440], [1380, 340]]} at={at(18, .2)} color={BAD} />
        <Label t={t} x={1000} y={330} size={34} weight={400} color={BAD} opacity={pop(18, .6)}>gọi thẳng giờ thật</Label></g>
      <DiagramWire t={t} f={f} pts={[[630, 480], [800, 480]]} at={at(19, .2)} />
      <Box f={f} x={1000} y={480} w={380} h={170} at={at(19)} label="interface Clock" size={38} mono />
      <DiagramWire t={t} f={f} pts={[[1190, 440], [1380, 330]]} at={at(19, 1.4)} arrow={false} />
      <DiagramWire t={t} f={f} pts={[[1190, 520], [1458, 664]]} at={at(20)} arrow={false} />
      <Box f={f} x={1580} y={330} w={400} h={150} at={at(17, .8)} label="giờ hệ thống" sub="hạ tầng" size={38} />
      <g transform="translate(1580 680)" opacity={pop(20)}>
        <circle r={120} fill={p.surface} stroke={p.accent} strokeWidth={4} />
        {hand(clockHour / 12, 60, 8, p.ink)}{hand(clockHour % 1, 95, 5, p.accent)}
        <Label t={t} x={0} y={170} size={34} color={p.accent}>{f > at(20, 1.2) ? 'đồng hồ giả · 23:59' : 'đồng hồ giả'}</Label>
      </g>
      <Chip t={t} f={f} x={420} y={760} text="ranh giới nhỏ, giữ được lâu" at={at(21, .5)} size={36} tone="accent2" />
    </g>
  </Stage>;
};

// ---- 03 · Domain Model: the object protects itself --------------------------------------------------------------
export const DomainModel: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, pop} = useBeat(s);
  const rules = ['mã e-book > 0', 'email hợp lệ', 'số lượng > 0', 'giá ≥ 0'];
  const sources = ['Controller', 'API', 'CLI', 'Test'];
  const bad = loop(f, at(10, .6), 70);
  const passed = [5, 6, 7, 8].filter((i) => f > at(i)).length, ruleLines = passed ? [3 + passed] : [];
  return <Stage>
    {/* A · 0–2: Transaction Script vs Domain Model */}
    <g opacity={span(0, 2)}>
      <Title o={pop(0)}>Hai cách viết cùng một nghiệp vụ</Title>
      <Panel x={120} y={230} w={820} h={580} title="Transaction Script" o={pop(0, .5)}>
        {['1 · lấy giá', '2 · tính tiền', '3 · tạo mảng $record', '4 · INSERT', '5 · session'].map((x, k) => <Label key={k} t={t} x={210} y={370 + k * 76} anchor="start" size={38} weight={400} mono={k > 1} opacity={pop(1, .6 + k * .5)}>{x}</Label>)}
        <Label t={t} x={530} y={780} size={34} weight={400} color={BAD} opacity={pop(1, 3.4)}>dữ liệu là mảng, không ai giữ luật</Label>
      </Panel>
      <Panel x={980} y={230} w={820} h={580} tone={p.accent} title="Domain Model" o={pop(0, 1)}>
        <rect x={1100} y={340} width={580} height={360} rx={18} fill={p.background} stroke={p.accent} strokeWidth={3} opacity={pop(2, .4)} />
        <Label t={t} x={1390} y={400} size={40} mono color={p.accent} opacity={pop(2, .4)}>Order</Label>
        <Label t={t} x={1150} y={480} anchor="start" size={34} weight={400} opacity={pop(2, .8)}>dữ liệu: email, số lượng, giá</Label>
        <Label t={t} x={1150} y={560} anchor="start" size={34} weight={400} opacity={pop(2, 1.4)}>hành vi: tự kiểm tra, tự tính</Label>
        <Label t={t} x={1390} y={660} size={34} weight={400} color={p.accent2} opacity={pop(2, 2)}>ở chung một đối tượng</Label>
      </Panel>
    </g>
    {/* B · 3–9: entity Order — every rule checked in the constructor, total computed inside */}
    <g opacity={span(3, 9)}>
      <Title o={pop(3)}>Entity Order</Title>
      <CodeCard t={t} f={f} x={100} y={220} w={1020} title="Order.php" at={at(3, .3)} cps={3} size={32}
        lines={['public function __construct(', '  int $ebookId, string $email,', '  int $quantity, int $pricePerUnit', ') {', '  if ($ebookId <= 0) throw ...', '  if (!valid($email)) throw ...',
          '  if ($quantity <= 0) throw ...', '  if ($pricePerUnit < 0) throw ...', '  $this->total = $quantity * $pricePerUnit;', '}']} highlight={f > at(9) ? [8] : ruleLines} />
      {rules.map((x, k) => <Row key={k} f={f} x={1220} y={330 + k * 100} text={x} at={at(5 + k)} size={42} />)}
      <Chip t={t} f={f} x={1500} y={780} text="tổng tiền do Order tính" at={at(9, .3)} size={40} tone="accent" />
    </g>
    {/* C · 10–12: one door — every source goes through the constructor; a bad order bounces */}
    <g opacity={span(10, 12)}>
      <Title o={pop(10)}>Không có đường tắt để tạo Order sai</Title>
      {sources.map((x, k) => <g key={k}>
        <Box f={f} x={330 + k * 420} y={300} w={340} h={110} at={at(11, k * .3)} label={x} size={38} />
        <DiagramWire t={t} f={f} pts={[[330 + k * 420, 355], [960, 520]]} at={at(11, .4 + k * .3)} /></g>)}
      <Box f={f} x={960} y={580} w={460} h={130} at={at(10, .2)} label="constructor" state="key" size={42} mono />
      <DiagramWire t={t} f={f} pts={[[960, 645], [960, 760]]} at={at(10, .5)} />
      <Chip t={t} f={f} x={960} y={810} text="Order hợp lệ" at={at(10, .8)} size={40} tone="accent2" />
      {f > at(10, .6) ? <g opacity={Math.min(1, bad * 6, (1 - bad) * 6)}>
        <circle cx={1500} cy={520 + 60 * Math.sin(bad * Math.PI)} r={14} fill={BAD} />
        <Label t={t} x={1500} y={480 + 60 * Math.sin(bad * Math.PI)} size={34} mono color={BAD}>quantity = 0</Label></g> : null}
      <Label t={t} x={1500} y={700} size={36} weight={400} color={p.muted} opacity={pop(12)}>luật chỉ nằm một chỗ</Label>
    </g>
    {/* D · 13–18: entity vs value object */}
    <g opacity={span(13, 18)}>
      <Title o={pop(13)}>Entity và value object</Title>
      <Panel x={120} y={220} w={820} h={600} title="Entity · có danh tính" o={pop(13, .3)}>
        {[0, 1].map((k) => <Box key={k} f={f} x={330 + k * 400} y={430} w={320} h={170} at={at(14, .5 + k * .4)} label={`Order #${101 + k}`} sub="2 × e-book A" size={38} mono />)}
        <Label t={t} x={530} y={445} size={64} color={BAD} opacity={pop(14, 1.4)}>≠</Label>
        <Label t={t} x={530} y={640} size={36} weight={400} opacity={pop(14, 1.8)}>khác id thì khác nhau</Label>
        <Label t={t} x={530} y={700} size={34} weight={400} color={p.muted} opacity={pop(14, 1.8)}>dù nội dung giống hệt</Label>
      </Panel>
      <Panel x={980} y={220} w={820} h={600} tone={p.accent} title="Value object · so bằng giá trị" titleColor={p.accent} o={pop(13, .8)}>
        <Label t={t} x={1390} y={400} size={34} mono opacity={pop(15, .3)}>Email("an@shop.vn") ==</Label>
        <Label t={t} x={1390} y={450} size={34} mono opacity={pop(15, .3)}>Email("an@shop.vn")</Label>
        <Row f={f} x={1050} y={560} text="định dạng kiểm tra lúc tạo" at={at(16)} size={36} />
        <Label t={t} x={1390} y={660} size={34} mono opacity={pop(17)}>Money(120000, "VND")</Label>
        <Row f={f} x={1050} y={740} text="đi kèm đơn vị tiền tệ" at={at(17, .4)} size={36} />
      </Panel>
      <Chip t={t} f={f} x={960} y={870} text="đặt luật vào nơi sinh ra giá trị" at={at(18)} size={34} tone="accent" />
    </g>
    {/* E · 19–20: saving is someone else's job */}
    <g opacity={span(19, 20)}>
      <Title o={pop(19)}>Nhưng Order vẫn cần được lưu</Title>
      <Box f={f} x={420} y={520} w={420} h={190} at={at(19)} label="Order" sub="PHP thuần" state="key" size={46} mono />
      <DiagramNode t={t} f={f} x={1500} y={520} w={340} h={220} kind="db" label="Database" at={at(19, .4)} />
      <DiagramWire t={t} f={f} pts={[[630, 420], [1330, 420]]} at={at(20)} color={BAD} />
      <Mark t={t} f={f} x={980} y={420} ok={false} at={at(20, .6)} size={80} />
      <Label t={t} x={980} y={360} size={34} weight={400} color={BAD} opacity={pop(20, .6)}>entity không tự gọi database</Label>
      <Box f={f} x={980} y={680} w={420} h={130} at={at(20, 1.6)} label="Repository ?" state="hot" size={42} />
      <DiagramWire t={t} f={f} pts={[[630, 600], [770, 680]]} at={at(20, 2)} />
      <DiagramWire t={t} f={f} pts={[[1190, 680], [1330, 600]]} at={at(20, 2.4)} />
    </g>
  </Stage>;
};

// ---- 04 · Repository ----------------------------------------------------------------------------------------
export const Repository: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, pop} = useBeat(s);
  const impls: [string, string][] = [['SqlOrderRepository', 'query builder / Eloquent'], ['MemoryOrderRepository', 'mảng trong bộ nhớ · test'], ['RemoteOrderRepository', 'gọi API hệ thống khác']];
  const active = f > at(9) ? Math.floor(loop(f, at(9), 210) * 3) : f > at(8) ? 1 : 0;
  const steps = ['lấy giá e-book qua repository khác', 'tạo Order, bắt lỗi nếu dữ liệu sai', 'lưu đơn qua repository', 'ghi mã đơn vào session', 'trả về trang tiếp theo'];
  return <Stage>
    {/* A · 0–2: the interface speaks business, not tables */}
    <g opacity={span(0, 2)}>
      <Title o={pop(0)}>Repository: một interface phía nghiệp vụ</Title>
      <CodeCard t={t} f={f} x={360} y={230} w={1200} title="OrderRepository.php" at={at(0, .6)} cps={3} size={38}
        lines={['interface OrderRepository', '{', '  public function save(Order $order): int;', '  public function getById(int $id): Order;', '}']} highlight={f > at(2) ? [2, 3] : []} />
      {['bảng nào?', 'cột nào?', 'SQL ra sao?'].map((x, k) => <g key={k} opacity={pop(1, k * .6)}>
        <Label t={t} x={560 + k * 400} y={700} size={40} color={p.muted}>{x}</Label>
        <path d={`M${470 + k * 400} 690 H${650 + k * 400}`} stroke={BAD} strokeWidth={5} opacity={pop(1, .4 + k * .6)} /></g>)}
      <Chip t={t} f={f} x={960} y={810} text="lưu → nhận mã đơn · đưa mã → nhận Order" at={at(2, .8)} size={38} tone="accent" />
    </g>
    {/* B · 3–6: write the call you wish you had, then the interface */}
    <g opacity={span(3, 6)}>
      <Title o={pop(3)}>Viết dòng mình muốn gọi trước</Title>
      <CodeCard t={t} f={f} x={240} y={230} w={1440} title="OrderController.php" at={at(3, .4)} cps={2} size={40} lines={['$this->orders->save($order);']} highlight={[0]} />
      <DiagramWire t={t} f={f} pts={[[960, 400], [960, 520]]} at={at(5)} />
      <CodeCard t={t} f={f} x={420} y={540} w={1080} title="OrderRepository.php" at={at(5, .5)} cps={2.4} size={36} lines={['interface OrderRepository {', '  save(Order $order): int;', '}']} highlight={[1]} />
      <Chip t={t} f={f} x={960} y={850} text="phần cài đặt để sau" at={at(6)} size={38} tone="accent2" />
    </g>
    {/* C · 7–10: one interface, several implementations; the controller never knows which */}
    <g opacity={span(7, 10)}>
      <Box f={f} x={960} y={200} w={420} h={120} at={at(7) - 10} label="Controller" size={40} />
      <DiagramWire t={t} f={f} pts={[[960, 260], [960, 360]]} at={at(7)} />
      <Box f={f} x={960} y={420} w={620} h={120} at={at(7) - 6} label="OrderRepository" state="key" size={40} mono />
      {impls.map(([name, sub], k) => {const x = 340 + k * 620, on = active === k, a = at(7 + k, .2);return <g key={k}>
        <DiagramWire t={t} f={f} pts={[[960, 480], [x, 640]]} at={a} dashed={!on} opacity={on ? 1 : .5} />
        <Box f={f} x={x} y={720} w={560} h={170} at={a} label={name} sub={sub} state={on ? 'key' : 'ok'} size={34} mono /></g>;})}
      <DiagramPacket t={t} f={f} pts={[[960, 260], [960, 480], [340 + active * 620, 640]]} at={at(7, .6)} period={50} r={11} />
      <Chip t={t} f={f} x={1560} y={250} text="controller không biết bản nào" at={at(10)} size={34} tone="accent2" />
    </g>
    {/* D · 11–16: the controller after the split — every step ticks */}
    <g opacity={span(11, 16)}>
      <Title o={pop(11)}>Controller sau khi tách</Title>
      {steps.map((x, k) => <Row key={k} f={f} x={360} y={300 + k * 110} text={x} at={at(12 + k)} pre={at(11, .4 + k * .2)} size={44} />)}
    </g>
    {/* E · 17–20: MySQL lives in one class, the business object is plain PHP; each tested alone */}
    <g opacity={span(17, 20)}>
      <Panel x={140} y={210} w={780} h={520} title="SqlOrderRepository" o={pop(17)}>
        <DiagramNode t={t} f={f} x={530} y={470} w={300} h={190} kind="db" label="MySQL" at={at(17, .4)} />
        <Label t={t} x={530} y={660} size={36} weight={400} opacity={pop(17, .8)}>mọi câu SQL ở đây</Label>
      </Panel>
      <Panel x={1000} y={210} w={780} h={520} tone={p.accent} title="Order" titleColor={p.accent} o={pop(18)}>
        {['PHP thuần', 'không kế thừa framework', 'không gọi database'].map((x, k) => <Row key={k} f={f} x={1060} y={390 + k * 90} text={x} at={at(18, .3 + k * .9)} size={40} />)}
      </Panel>
      {[530, 1390].map((x, k) => <Chip key={k} t={t} f={f} x={x} y={800} text={k ? 'unit test' : 'integration test'} at={at(19, k * .6)} size={38} tone="accent2" />)}
      <Label t={t} x={960} y={880} size={34} weight={400} color={p.muted} opacity={pop(20)}>lần tách đầu tiên, các chương sau xây tiếp</Label>
    </g>
  </Stage>;
};

// ---- 05 · reading and writing need not share one model ----------------------------------------------------------
export const DocVaGhi: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, pop} = useBeat(s);
  const json = ['{ "orderId": 1042,', '  "orderDate": "2026-11-12",', '  "customerName": "An",', '  "totalAmount": 240000 }'];
  return <Stage>
    {/* A · 0–4: handing the write entity to the view */}
    <g opacity={span(0, 4)}>
      <Title o={pop(0)}>Phần đọc hay bị bỏ qua</Title>
      <Panel x={160} y={230} w={760} h={560} tone={p.accent} title="Ebook (entity ghi)" titleColor={p.accent} o={pop(0, .5)}>
        {['title, price', 'changePrice()', 'hide()', 'changeStatus()'].map((x, k) => <Label key={k} t={t} x={220} y={380 + k * 80} anchor="start" size={38} mono
          color={k ? BAD : p.ink} opacity={pop(k ? 2 : 1, k ? (k - 1) * .6 : .4)}>{x}</Label>)}
        <Label t={t} x={540} y={740} size={34} weight={400} color={p.muted} opacity={pop(4)}>class phình to vì làm cả hai việc</Label>
      </Panel>
      <DiagramWire t={t} f={f} pts={[[920, 510], [1190, 510]]} at={at(1, 1)} />
      <DiagramPacket t={t} f={f} pts={[[920, 510], [1190, 510]]} at={at(1, 1.4)} period={40} />
      <Box f={f} x={1460} y={510} w={500} h={190} at={at(1, 1.2)} label="View" sub="chỉ cần hiển thị" size={44} />
      <Chip t={t} f={f} x={1460} y={720} text="cầm cả quyền sửa dữ liệu" at={at(3, .4)} size={36} tone="bad" />
    </g>
    {/* B · 5–7: a read model, or just one function */}
    <g opacity={span(5, 7)}>
      <Title o={pop(5)}>Tách read model</Title>
      <CodeCard t={t} f={f} x={140} y={240} w={800} title="EbookReadModel" at={at(5, .3)} cps={2.4} size={36} lines={['id', 'title', 'price']} />
      <Box f={f} x={540} y={680} w={720} h={130} at={at(6, 2)} label="EbookReadRepository" sub="chỉ để đọc" size={38} mono />
      <CodeCard t={t} f={f} x={1000} y={240} w={800} title="nhẹ hơn" at={at(7)} cps={2.4} size={36} lines={['interface GetPrice {', '  ofEbook($id): int;', '}']} highlight={[1]} />
    </g>
    {/* C · 8–10: CQRS exists; the book picks the simple way */}
    <g opacity={span(8, 10)}>
      <Title o={pop(8)}>CQRS hay cách đơn giản</Title>
      <g opacity={1 - .6 * grow(f, at(10) - 6, at(10) + 6)}>
        <Box f={f} x={360} y={360} w={420} h={150} at={at(8, .3)} label="kho ghi" size={42} />
        <Box f={f} x={1560} y={360} w={420} h={150} at={at(8, .6)} label="kho đọc" size={42} />
        <DiagramWire t={t} f={f} pts={[[570, 360], [1350, 360]]} at={at(8, 1.2)} />
        <DiagramPacket t={t} f={f} pts={[[570, 360], [1350, 360]]} at={at(8, 1.6)} period={60} label="domain event" />
        <Chip t={t} f={f} x={960} y={480} text="phải giữ nhất quán giữa hai kho" at={at(9, .4)} size={34} tone="bad" />
      </g>
      <g opacity={pop(10)}>
        <DiagramNode t={t} f={f} x={960} y={720} w={360} h={190} kind="db" label="một database" at={at(10)} state="key" />
        <Box f={f} x={420} y={720} w={480} h={130} at={at(10, .6)} label="repository ghi" size={38} />
        <Box f={f} x={1500} y={720} w={480} h={130} at={at(10, .9)} label="repository đọc" size={38} />
        <DiagramWire t={t} f={f} pts={[[660, 720], [780, 720]]} at={at(10, .8)} />
        <DiagramWire t={t} f={f} pts={[[1260, 720], [1140, 720]]} at={at(10, 1.1)} />
        <Chip t={t} f={f} x={1500} y={850} text="+ integration test" at={at(10, 2.4)} size={34} tone="accent2" />
      </g>
    </g>
    {/* D · 11–15: view models shaped for the screen and the API */}
    <g opacity={span(11, 15)}>
      <Title o={pop(11)}>View model: đúng thứ màn hình cần</Title>
      <Panel x={120} y={230} w={760} h={560} tone={p.accent} title="trang e-book" titleColor={p.accent} o={pop(11, .3)}>
        <Label t={t} x={500} y={420} size={38} mono opacity={pop(13, .4)}>price: 120000</Label>
        <DiagramWire t={t} f={f} pts={[[500, 450], [500, 540]]} at={at(13, .8)} />
        <Label t={t} x={500} y={610} size={52} color={p.accent} opacity={pop(13, 1.2)}>120.000 ₫</Label>
        <Label t={t} x={500} y={700} size={34} weight={400} color={p.muted} opacity={pop(13, 1.2)}>formattedPrice, định dạng sẵn</Label>
      </Panel>
      <Panel x={920} y={230} w={880} h={560} title="API danh sách đơn" o={pop(11, .8)}>
        <CodeCard t={t} f={f} x={960} y={300} w={800} at={at(14, .6)} cps={3} size={32} lines={json} />
        <Label t={t} x={1360} y={640} size={34} mono opacity={pop(14, 3)}>OrderListViewRepository</Label>
        <Label t={t} x={1360} y={690} size={34} mono color={p.muted} opacity={pop(14, 3.4)}>findRecentOrders($limit)</Label>
      </Panel>
      <Chip t={t} f={f} x={960} y={860} text="không lộ cấu trúc bên trong của domain" at={at(15)} size={36} tone="accent2" />
    </g>
    {/* E · 16–17: the rule */}
    <g opacity={span(16, 17)}>
      <Panel x={260} y={300} w={1400} h={380} tone={p.accent} o={pop(16)}>
        <Label t={t} x={960} y={430} size={48}>Đừng dùng đối tượng thay đổi được,</Label>
        <Label t={t} x={960} y={500} size={48}>có logic phức tạp, cho việc chỉ đọc</Label>
        <Label t={t} x={960} y={610} size={44} color={p.accent} opacity={pop(17)}>đọc thì trả đúng thứ cần đọc</Label>
      </Panel>
    </g>
  </Stage>;
};

// ---- 06 · Application Service and Command -------------------------------------------------------------------
export const ApplicationService: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, pop} = useBeat(s);
  const blocks = ['xử lý HTTP', 'kiểm tra input', 'tính tiền', 'trừ tồn kho', 'lưu DB', 'gửi mail'];
  const grown = Math.min(blocks.length, Math.floor(grow(f, at(0, .4), at(1, 4)) * blocks.length + .5));
  const entries = ['web', 'CLI', 'job', 'test'];
  const steps = ['lấy sản phẩm', 'kiểm tồn kho', 'tính tiền', 'mã đơn mới', 'tạo Order', 'lưu'];
  const stepAt = (k: number) => at(8 + k);
  return <Stage>
    {/* A · 0–1: the controller keeps swallowing use cases */}
    <g opacity={span(0, 1)}>
      <Title o={pop(0)}>Controller phình to</Title>
      <rect x={560} y={230} width={800} height={110 + grown * 92} rx={22} fill={p.surface} stroke={grown > 4 ? BAD : p.accent2} strokeWidth={3} />
      <Label t={t} x={960} y={300} size={40} mono>OrderController</Label>
      {blocks.slice(0, grown).map((x, k) => <g key={k}><rect x={610} y={330 + k * 92} width={700} height={76} rx={12} fill={p.background} stroke={p.muted} strokeWidth={2} />
        <Label t={t} x={960} y={380 + k * 92} size={36} weight={400}>{x}</Label></g>)}
    </g>
    {/* B · 2–3: one Application Service per use case, called from anywhere */}
    <g opacity={span(2, 3)}>
      <Title o={pop(2)}>Application Service</Title>
      <Box f={f} x={1300} y={520} w={560} h={190} at={at(2, .3)} label="PlaceOrderService" sub="một use case" state="key" size={40} mono />
      {entries.map((x, k) => <g key={k}>
        <Box f={f} x={420} y={280 + k * 160} w={320} h={120} at={at(3, k * .9)} label={x} size={42} />
        <DiagramWire t={t} f={f} pts={[[580, 280 + k * 160], [1020, 520]]} at={at(3, .3 + k * .9)} />
        <DiagramPacket t={t} f={f} pts={[[580, 280 + k * 160], [1020, 520]]} at={at(3, .6 + k * .9)} period={46} /></g>)}
    </g>
    {/* C · 4–6: input packed into a Command; one handle method returns an id */}
    <g opacity={span(4, 6)}>
      <Title o={pop(4)}>Đầu vào gói thành Command</Title>
      <CodeCard t={t} f={f} x={120} y={240} w={760} title="PlaceOrderCommand" at={at(4, .3)} cps={2.4} size={36} lines={['customerId', 'items', 'email']} />
      <DiagramWire t={t} f={f} pts={[[880, 420], [1020, 420]]} at={at(6)} />
      <Box f={f} x={1360} y={420} w={660} h={170} at={at(6, .2)} label="handle($command)" sub="PlaceOrderService" state="key" size={40} mono />
      <DiagramWire t={t} f={f} pts={[[1360, 505], [1360, 640]]} at={at(6, 1.2)} />
      <Chip t={t} f={f} x={1360} y={700} text="OrderId" at={at(6, 1.6)} size={42} mono tone="accent" />
      <DiagramPacket t={t} f={f} pts={[[880, 420], [1030, 420]]} at={at(6, .6)} period={36} />
    </g>
    {/* D · 7–13: inside the service, step by step */}
    <g opacity={span(7, 13)}>
      <Title o={pop(7)}>Bên trong service</Title>
      {steps.map((x, k) => {const xx = 210 + k * 300, on = f > stepAt(k);return <g key={k}>
        <Box f={f} x={xx} y={480} w={270} h={170} at={at(7, .3 + k * .15)} label={x} state={on ? (k === 1 && f < stepAt(1) + 45 ? 'hot' : 'key') : 'dim'} size={34} />
        {k < 5 ? <DiagramWire t={t} f={f} pts={[[xx + 135, 480], [xx + 165, 480]]} at={at(7, .4 + k * .15)} dur={8} /> : null}</g>;})}
      <DiagramPacket t={t} f={f} pts={[[210, 400], [210 + 300 * Math.max(0, steps.filter((_, k) => f > stepAt(k)).length - 1), 400]]} at={at(8)} period={60} r={12} />
      <Chip t={t} f={f} x={510} y={680} text="hết hàng → OutOfStockException" at={at(9, .6)} size={34} mono tone="bad" />
    </g>
    {/* E · 14: a thin controller */}
    <g opacity={span(14, 14)}>
      <Title o={pop(14)}>Controller còn hai việc</Title>
      {['request', 'command', 'service', 'response'].map((x, k) => <g key={k}>
        <Box f={f} x={300 + k * 440} y={500} w={340} h={150} at={at(14, k * .6)} label={x} state={k === 2 ? 'key' : 'ok'} size={42} />
        {k < 3 ? <DiagramWire t={t} f={f} pts={[[470 + k * 440, 500], [570 + k * 440, 500]]} at={at(14, .3 + k * .6)} /> : null}</g>)}
      <DiagramPacket t={t} f={f} pts={[[300, 400], [1620, 400]]} at={at(14, 2)} period={90} r={11} />
    </g>
    {/* F · 15–18: dependencies come in through the constructor */}
    <g opacity={span(15, 18)}>
      <Title o={pop(15)}>Phụ thuộc đi vào qua constructor</Title>
      <CodeCard t={t} f={f} x={120} y={230} w={1000} title="PlaceOrderService.php" at={at(15, .3)} cps={2.6} size={34}
        lines={['public function __construct(', '  OrderRepository $orders,', '  ProductRepository $products,', '  Mailer $mailer', ') {}']} highlight={[1, 2, 3]} />
      <CodeCard t={t} f={f} x={1180} y={230} w={620} title="service locator" at={at(16, 1.6)} cps={2.6} size={34} lines={["app()->make(...)"]} />
      <path d="M1220 340 L1760 380" stroke={BAD} strokeWidth={6} opacity={pop(16, 2.4)} />
      <Chip t={t} f={f} x={1490} y={480} text="không dính container toàn cục" at={at(17)} size={34} tone="accent2" />
      {['InMemoryOrderRepository', 'FakeMailer'].map((x, k) => <Chip key={k} t={t} f={f} x={420 + k * 560} y={720} text={x} at={at(18, .4 + k * .5)} size={34} mono tone="accent" />)}
      <Label t={t} x={700} y={820} size={34} weight={400} color={p.muted} opacity={pop(18, 1)}>khi test: truyền thẳng bản giả</Label>
    </g>
    {/* G · 19–22: a test that needs nothing outside */}
    <g opacity={span(19, 22)}>
      <Title o={pop(19)}>Lợi ích nằm ở test</Title>
      <Panel x={160} y={230} w={980} h={580} title="PlaceOrderServiceTest" o={pop(19, .3)}>
        {['repository trong bộ nhớ', 'bản giả của phần gửi mail', 'đặt 2 e-book → đơn được lưu'].map((x, k) => <Row key={k} f={f} x={220} y={380 + k * 110} text={x} at={at(20, .4 + k * 1.2)} size={40} />)}
        <Label t={t} x={650} y={760} size={40} color={p.accent2} opacity={pop(20, 4)}>PASS</Label>
      </Panel>
      {['framework', 'database', 'mạng'].map((x, k) => <g key={k} opacity={pop(21, k * .5)}>
        <Label t={t} x={1500} y={360 + k * 130} size={42} color={p.muted}>{x}</Label>
        <path d={`M1360 ${348 + k * 130} H1640`} stroke={BAD} strokeWidth={5} /></g>)}
      <Chip t={t} f={f} x={1500} y={800} text="dễ test → dám sửa code" at={at(22)} size={36} tone="accent" />
    </g>
  </Stage>;
};

// ---- 07 · three layers and the one-way dependency rule ---------------------------------------------------------
export const BaTang: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, pop} = useBeat(s);
  const tiers = ['Giao diện', 'Nghiệp vụ', 'Truy cập dữ liệu'];
  const layers: [string, string, string[]][] = [['Domain', p.accent, ['entity, value object', 'domain service, event', 'interface repository']],
    ['Application', p.accent2, ['use case handler', 'command, query', 'transaction · "lớp keo"']], ['Infrastructure', p.muted, ['framework, ORM', 'adapter dịch vụ ngoài', 'test kiểu integration']]];
  const flow: [string, number, number][] = [['Request', 260, 330], ['Controller', 610, 330], ['Handler', 960, 330], ['Repository', 1310, 330], ['MySQL', 1660, 330], ['OrderPlaced', 960, 640], ['Listener', 1310, 640], ['Email', 1660, 640]];
  const step = Math.floor(loop(f, at(21, .4), 240) * 8);
  return <Stage>
    {/* A · 0–5: the classic three tiers, a leak, and lasagna */}
    <g opacity={span(0, 5)}>
      <Title o={pop(0)}>Cách chia cũ: ba tầng</Title>
      {tiers.map((x, k) => <g key={k} opacity={pop(0, .4 + k * .4) * (f > at(5) ? 1 - grow(f, at(5), at(5) + 15) * .7 : 1)}>
        <rect x={460} y={240 + k * 190} width={1000} height={150} rx={18} fill={p.surface} stroke={p.accent2} strokeWidth={3} />
        <Label t={t} x={960} y={330 + k * 190} size={44}>{x}</Label></g>)}
      <Chip t={t} f={f} x={1700} y={330} text="biết đặt code ở đâu" at={at(2)} size={34} tone="accent2" />
      <path d="M520 300 C 300 480 300 640 520 760" fill="none" stroke={BAD} strokeWidth={6} strokeDasharray="14 10" opacity={pop(4)} />
      <Label t={t} x={250} y={540} size={36} color={BAD} opacity={pop(4, .4)}>rò rỉ</Label>
      {Array.from({length: 12}, (_, k) => <rect key={k} x={560} y={250 + k * 50} width={800} height={36} rx={6} fill={k % 2 ? p.accent : p.surface} stroke={p.muted}
        opacity={grow(f, at(5, .4 + k * .12), at(5, .6 + k * .12)) * .9} />)}
      <Chip t={t} f={f} x={960} y={880} text="quá nhiều tầng: mã lasagna" at={at(5, 2)} size={36} tone="bad" />
    </g>
    {/* B · 6–11: Domain, Application, Infrastructure and what each holds */}
    <g opacity={span(6, 11)}>
      <Title o={pop(6)}>Ba tầng, nghiệp vụ ở giữa</Title>
      {layers.map(([name, color, items], k) => {const a = at([7, 9, 10][k]), b = at(6, .4 + k * .3);return <g key={k} opacity={Math.max(grow(f, a, a + 12), .32 * grow(f, b, b + 10))}>
        <rect x={120 + k * 600} y={230} width={560} height={580} rx={22} fill={p.surface} stroke={color} strokeWidth={4} />
        <Label t={t} x={400 + k * 600} y={300} size={46} color={color}>{name}</Label>
        {items.map((x, j) => <Label key={j} t={t} x={400 + k * 600} y={420 + j * 100} size={36} weight={400} opacity={grow(f, a + 10 + j * 12, a + 22 + j * 12)}>{x}</Label>)}</g>;})}
      <Chip t={t} f={f} x={400} y={760} text="không import framework" at={at(8)} size={32} tone="accent" />
    </g>
    {/* C · 12–16: dependency rule — every arrow points inward, Domain points nowhere */}
    <g opacity={span(12, 16)}>
      <Title o={pop(12)}>Dependency Rule: chỉ hướng vào trong</Title>
      <rect x={210} y={220} width={1500} height={640} rx={30} fill="none" stroke={p.muted} strokeWidth={3} opacity={pop(12, .3)} />
      <Label t={t} x={260} y={280} anchor="start" size={36} color={p.muted} opacity={pop(12, .3)}>Giao diện · Infrastructure</Label>
      <rect x={510} y={330} width={900} height={440} rx={26} fill={p.surface} stroke={p.accent2} strokeWidth={3} opacity={pop(12, .6)} />
      <Label t={t} x={560} y={390} anchor="start" size={38} color={p.accent2} opacity={pop(12, .6)}>Application</Label>
      <rect x={760} y={450} width={400} height={240} rx={22} fill={p.background} stroke={p.accent} strokeWidth={4} opacity={pop(12, .9)} />
      <Label t={t} x={960} y={565} size={46} color={p.accent} opacity={pop(12, .9)}>Domain</Label>
      <Label t={t} x={960} y={620} size={32} weight={400} color={p.muted} opacity={pop(12, .9)}>không biết ai bên ngoài</Label>
      <DiagramWire t={t} f={f} pts={[[360, 420], [500, 420]]} at={at(13)} width={5} />
      <Label t={t} x={330} y={480} size={34} opacity={pop(13)}>Controller</Label>
      <DiagramWire t={t} f={f} pts={[[960, 400], [960, 440]]} at={at(14)} width={5} />
      <DiagramWire t={t} f={f} pts={[[1460, 790], [1460, 740], [1170, 640]]} at={at(15)} width={5} color={p.accent} />
      <Label t={t} x={1460} y={838} size={34} mono opacity={pop(15)}>EloquentOrderRepository</Label>
      <Chip t={t} f={f} x={800} y={815} text="Hollywood Principle: đừng gọi chúng tôi" at={at(16, 1.2)} size={34} tone="accent" />
    </g>
    {/* D · 17–20: a service provider binds the interface; real vs test */}
    <g opacity={span(17, 20)}>
      <Title o={pop(17)}>Nối các tầng bằng service provider</Title>
      <CodeCard t={t} f={f} x={120} y={240} w={1040} title="OrderServiceProvider.php" at={at(18) - 6} cps={2.8} size={34}
        lines={['$this->app->bind(', '  OrderRepository::class,', '  EloquentOrderRepository::class', ');']} highlight={[2]} />
      <Box f={f} x={1500} y={330} w={520} h={150} at={at(19)} label="Eloquent · MySQL" sub="chạy thật" state={f < at(20) ? 'key' : 'dim'} size={38} />
      <Box f={f} x={1500} y={620} w={520} h={150} at={at(20)} label="InMemory" sub="khi test" state={f > at(20) ? 'key' : 'dim'} size={38} />
      <DiagramWire t={t} f={f} pts={[[1160, 400], [1240, 330]]} at={at(19, .2)} opacity={f < at(20) ? 1 : .4} />
      <DiagramWire t={t} f={f} pts={[[1160, 420], [1240, 620]]} at={at(20, .2)} opacity={f > at(20) ? 1 : .4} />
    </g>
    {/* E · 21–22: the order flow, every arrow inward */}
    <g opacity={span(21, 22)}>
      <Title o={pop(21)}>Luồng đặt hàng</Title>
      {flow.map(([name, x, y], k) => <Box key={k} f={f} x={x} y={y} w={300} h={140} at={at(21, k * .35)} label={name} state={step === k ? 'key' : 'ok'} size={36} mono={k > 0} />)}
      {[[0, 1], [1, 2], [2, 3], [3, 4]].map(([a, b], k) => <DiagramWire key={k} t={t} f={f} pts={[[flow[a][1] + 150, 330], [flow[b][1] - 150, 330]]} at={at(21, .2 + k * .35)} />)}
      <DiagramWire t={t} f={f} pts={[[960, 400], [960, 570]]} at={at(21, 2)} />
      <DiagramWire t={t} f={f} pts={[[1110, 640], [1160, 640]]} at={at(21, 2.3)} />
      <DiagramWire t={t} f={f} pts={[[1460, 640], [1510, 640]]} at={at(21, 2.6)} />
      <DiagramPacket t={t} f={f} pts={[[flow[Math.min(step, 7)][1], flow[Math.min(step, 7)][2] - 90], [flow[Math.min(step, 7)][1], flow[Math.min(step, 7)][2] - 82]]} at={at(21, .4)} period={30} r={12} />
      <Chip t={t} f={f} x={960} y={830} text="Domain không trỏ ra database" at={at(22)} size={36} tone="accent" />
    </g>
    {/* F · 23–25: not every feature needs every layer */}
    <g opacity={span(23, 25)}>
      <Title o={pop(23)}>Không phải việc gì cũng cần nhiều lớp</Title>
      <Panel x={160} y={250} w={760} h={520} title="việc đơn giản" o={pop(23, .4)}>
        <Box f={f} x={540} y={520} w={480} h={170} at={at(24, .4)} label="một lớp là đủ" size={40} />
      </Panel>
      <Panel x={1000} y={250} w={760} h={520} tone={p.accent} title="module lõi, phức tạp" titleColor={p.accent} o={pop(23, .9)}>
        {['Domain', 'Application', 'Infrastructure'].map((x, k) => <Box key={k} f={f} x={1380} y={400 + k * 120} w={480} h={100} at={at(25, .3 + k * .4)} label={x} state={k ? 'ok' : 'key'} size={36} />)}
      </Panel>
    </g>
  </Stage>;
};

// ---- 08 · Ports and Adapters ----------------------------------------------------------------------------------
const hexPath = (cx: number, cy: number, r: number) => Array.from({length: 6}, (_, k) => {const a = Math.PI / 3 * k;return `${k ? 'L' : 'M'}${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;}).join(' ') + ' Z';
export const PortsAdapters: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, pop} = useBeat(s);
  const devices = ['chuột', 'bàn phím', 'ổ cứng'];
  const dev = Math.floor(loop(f, at(4), 90) * 3);
  const issues = ['phụ thuộc vẫn nằm ngầm', 'thêm kênh CLI vẫn phải sửa nhiều', 'test application chậm vì khởi động framework', 'tích hợp hệ thống khác làm bẩn domain'];
  const inPorts = ['UI', 'API', 'CLI', 'test'], outPorts = ['lưu trữ', 'thông báo', 'bên thứ ba'];
  const fourSteps = ['xác định port', 'interface trong core', 'viết adapter', 'nối bằng DI'];
  return <Stage>
    {/* A · 0–6: a hexagon is a metaphor; ports are standards, adapters are devices */}
    <g opacity={span(0, 6)}>
      <Title o={pop(0)}>Hexagonal Architecture</Title>
      <path d={hexPath(700, 520, 260)} fill={p.surface} stroke={p.accent} strokeWidth={5} opacity={pop(0, .5)} />
      <Label t={t} x={700} y={535} size={48} color={p.accent} opacity={pop(0, .5)}>lõi ứng dụng</Label>
      <Label t={t} x={700} y={850} size={36} weight={400} color={p.muted} opacity={pop(1)}>Alistair Cockburn · 2005</Label>
      <Label t={t} x={700} y={230} size={34} weight={400} color={p.muted} opacity={pop(2)}>sáu cạnh chỉ là ẩn dụ</Label>
      <rect x={1180} y={470} width={120} height={100} rx={12} fill={p.background} stroke={p.accent2} strokeWidth={5} opacity={pop(3)} />
      <Label t={t} x={1240} y={630} size={36} color={p.accent2} opacity={pop(3)}>cổng USB = port</Label>
      <path d={`M ${960} 520 H 1180`} stroke={p.accent2} strokeWidth={4} opacity={pop(3)} />
      {devices.map((x, k) => <g key={k} opacity={pop(4, k * .5) * (dev === k ? 1 : .45)}>
        <rect x={1460} y={300 + k * 170} width={360} height={130} rx={18} fill={p.surface} stroke={dev === k ? p.accent : p.muted} strokeWidth={3} />
        <Label t={t} x={1640} y={378 + k * 170} size={40}>{x}</Label></g>)}
      <DiagramWire t={t} f={f} pts={[[1460, 365 + dev * 170], [1300, 520]]} at={at(4, .4)} color={p.accent} />
      <Chip t={t} f={f} x={1640} y={830} text="adapter = từng thiết bị" at={at(6, 1)} size={36} tone="accent" />
    </g>
    {/* B · 7–11: what layering still leaves open */}
    <g opacity={span(7, 11)}>
      <Title o={pop(7)}>Phân lớp còn để ngỏ</Title>
      {issues.map((x, k) => <Row key={k} f={f} x={300} y={320 + k * 130} text={x} at={at(8 + k)} pre={at(7, .4 + k * .25)} ok={false} size={44} />)}
    </g>
    {/* C · 12–18: input ports, output ports, real and fake adapters */}
    <g opacity={span(12, 18)}>
      <path d={hexPath(960, 520, 230)} fill={p.surface} stroke={p.accent} strokeWidth={5} opacity={pop(12)} />
      <Label t={t} x={960} y={510} size={44} color={p.accent} opacity={pop(12)}>core</Label>
      <Label t={t} x={960} y={565} size={32} weight={400} color={p.muted} opacity={pop(15)}>port = interface</Label>
      <Label t={t} x={260} y={190} size={38} color={p.accent2} opacity={pop(13)}>port đầu vào</Label>
      <Label t={t} x={1660} y={190} size={38} color={p.accent2} opacity={pop(14)}>port đầu ra</Label>
      {inPorts.map((x, k) => <g key={k}>
        <Box f={f} x={260} y={290 + k * 160} w={300} h={110} at={at(13, k * .5)} label={x} size={38} />
        <DiagramWire t={t} f={f} pts={[[410, 290 + k * 160], [760, 420 + k * 40]]} at={at(13, .3 + k * .5)} />
        <DiagramPacket t={t} f={f} pts={[[410, 290 + k * 160], [760, 420 + k * 40]]} at={at(13, .8 + k * .5)} period={50} /></g>)}
      {outPorts.map((x, k) => <g key={k}>
        <Box f={f} x={1660} y={330 + k * 190} w={340} h={120} at={at(14, k * .6)} label={x} size={38} />
        <DiagramWire t={t} f={f} pts={[[1160, 440 + k * 60], [1490, 330 + k * 190]]} at={at(14, .3 + k * .6)} />
        <DiagramPacket t={t} f={f} pts={[[1160, 440 + k * 60], [1490, 330 + k * 190]]} at={at(14, .8 + k * .6)} period={56} /></g>)}
      <Chip t={t} f={f} x={1600} y={870} text="adapter ở Infrastructure" at={at(16)} size={34} tone="accent2" />
      <Chip t={t} f={f} x={860} y={870} text="mỗi port: một adapter thật + một adapter giả" at={at(17)} size={34} tone="accent" />
    </g>
    {/* D · 19–23: four steps */}
    <g opacity={span(19, 23)}>
      <Title o={pop(19)}>Bốn bước áp dụng</Title>
      {fourSteps.map((x, k) => <g key={k}>
        <Box f={f} x={300 + k * 440} y={500} w={400} h={200} at={at(19, .3 + k * .2)} label={x} state={f > at(20 + k) ? 'key' : 'dim'} size={34} />
        <Label t={t} x={300 + k * 440} y={360} size={56} mono color={f > at(20 + k) ? p.accent : p.muted} opacity={pop(19, .3 + k * .2)}>{k + 1}</Label>
        {k < 3 ? <DiagramWire t={t} f={f} pts={[[500 + k * 440, 500], [540 + k * 440, 500]]} at={at(21 + k)} dur={10} /> : null}</g>)}
    </g>
    {/* E · 24–28: the book's example — two ports, real and fake adapters, a provider, a fast test */}
    <g opacity={span(24, 28)}>
      <Title o={pop(24)}>Ví dụ trong sách</Title>
      {[['OrderRepository', 'Eloquent', 'InMemory', 25], ['OrderNotification', 'Email', 'Log', 26]].map(([port, real, fake, sen], k) => {const y = 360 + k * 290, a = at(sen as number);return <g key={k}>
        <Box f={f} x={560} y={y} w={560} h={150} at={k ? a : at(24, .3)} label={port as string} sub="port" state="key" size={38} mono />
        <DiagramWire t={t} f={f} pts={[[840, y - 30], [1200, y - 60]]} at={a + 12} />
        <DiagramWire t={t} f={f} pts={[[840, y + 30], [1200, y + 60]]} at={a + 20} />
        <Box f={f} x={1440} y={y - 60} w={440} h={100} at={a + 14} label={`${real} · thật`} size={36} />
        <Box f={f} x={1440} y={y + 60} w={440} h={100} at={a + 22} label={`${fake} · test`} size={36} state={f > at(28) ? 'key' : 'ok'} /></g>;})}
      <Chip t={t} f={f} x={560} y={830} text="service provider nối port ↔ adapter" at={at(27)} size={34} tone="accent2" />
      <Chip t={t} f={f} x={1440} y={830} text="test: không khởi động Laravel" at={at(28)} size={34} tone="accent" />
    </g>
    {/* F · 29–32: extending without touching the core */}
    <g opacity={span(29, 32)}>
      <Title o={pop(29)}>Mở rộng mà không đụng vào lõi</Title>
      <path d={hexPath(960, 540, 200)} fill={p.surface} stroke={p.accent} strokeWidth={5} opacity={pop(29)} />
      <Label t={t} x={960} y={555} size={42} color={p.accent} opacity={pop(29)}>lõi đặt hàng</Label>
      <Box f={f} x={300} y={540} w={420} h={150} at={at(30)} label="nhập đơn từ CSV" sub="adapter mới" state="key" size={36} />
      <DiagramWire t={t} f={f} pts={[[510, 540], [760, 540]]} at={at(30, .5)} />
      <DiagramPacket t={t} f={f} pts={[[510, 540], [760, 540]]} at={at(30, 1)} period={40} label="dòng CSV" labelSize={34} />
      {[0, 1].map((k) => <g key={k}><DiagramNode t={t} f={f} x={1560} y={330 + k * 230} w={300} h={170} kind="db" label={k ? 'database B' : 'database A'} at={at(31, k * .5)} />
        <DiagramWire t={t} f={f} pts={[[1160, 500 + k * 80], [1410, 330 + k * 230]]} at={at(31, .3 + k * .5)} /></g>)}
      <Box f={f} x={1560} y={810} w={420} h={110} at={at(32)} label="phân hệ khách hàng" size={34} />
      <DiagramWire t={t} f={f} pts={[[1110, 680], [1350, 800]]} at={at(32, .4)} dashed />
      <Label t={t} x={1180} y={830} size={32} weight={400} color={p.muted} opacity={pop(32, .8)}>qua một port</Label>
    </g>
    {/* G · 33–37: the price */}
    <g opacity={span(33, 37)}>
      <Title o={pop(33)}>Cái giá</Title>
      <Panel x={160} y={240} w={760} h={420} title="nhiều interface và class hơn" o={pop(33, .3)}>
        {Array.from({length: 15}, (_, k) => <rect key={k} x={220 + (k % 5) * 130} y={350 + Math.floor(k / 5) * 90} width={110} height={70} rx={10}
          fill={k % 3 ? p.background : p.surface} stroke={k % 3 ? p.accent2 : p.accent} strokeWidth={2} opacity={grow(f, at(34, k * .15), at(34, .3 + k * .15))} />)}
      </Panel>
      <Panel x={1000} y={240} w={760} h={420} tone={p.accent} o={pop(33, .7)}>
        <Row f={f} x={1050} y={360} text="quy ước đặt tên" at={at(35)} size={40} />
        <Row f={f} x={1050} y={460} text="đừng trừu tượng hóa mọi thứ" at={at(36)} ok={false} size={40} />
        <Row f={f} x={1050} y={560} text="tách chỗ dễ đổi, khó test" at={at(37)} size={40} />
      </Panel>
    </g>
  </Stage>;
};

// ---- 09 · closing ---------------------------------------------------------------------------------------------
export const KhepLai: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, pop} = useBeat(s);
  const loopSteps = ['chọn một use case', 'tách phụ thuộc khó test', 'viết test không cần DB', 'lặp lại'];
  const lit = Math.floor(loop(f, at(8), 120) * 4);
  const pts: Pt[] = [[600, 380], [1320, 380], [1320, 720], [600, 720], [600, 380]];
  return <Stage>
    {/* A · 0–3: the question sorts code into two places */}
    <g opacity={span(0, 3)}>
      <Panel x={360} y={170} w={1200} h={260} tone={p.accent} o={pop(0, .4)}>
        <Label t={t} x={960} y={280} size={44}>Chạy được một mình, trong bộ nhớ,</Label>
        <Label t={t} x={960} y={350} size={44}>không cần gì bên ngoài?</Label>
      </Panel>
      <DiagramWire t={t} f={f} pts={[[760, 440], [560, 560]]} at={at(2)} />
      <DiagramWire t={t} f={f} pts={[[1160, 440], [1360, 560]]} at={at(3)} />
      <Box f={f} x={520} y={680} w={560} h={190} at={at(2, .2)} label="có → nghiệp vụ" sub="giữ sạch" state="key" size={42} />
      <Box f={f} x={1400} y={680} w={560} h={190} at={at(3, .2)} label="không → hạ tầng" sub="đẩy ra rìa, sau interface" size={42} />
    </g>
    {/* B · 4–8: one use case at a time, on repeat */}
    <g opacity={span(4, 8)}>
      <Title o={pop(4)}>Không cần làm hết trong một tuần</Title>
      {loopSteps.map((x, k) => {const [x0, y0] = pts[k];return <Box key={k} f={f} x={x0} y={y0} w={520} h={150} at={at(5 + k)} label={x} state={f > at(8) && lit === k ? 'key' : 'ok'} size={36} />;})}
      {[0, 1, 2, 3].map((k) => {const [ax, ay] = pts[k], [bx, by] = pts[k + 1], sx = Math.sign(bx - ax), sy = Math.sign(by - ay);
        return <DiagramWire key={k} t={t} f={f} pts={[[ax + sx * 260, ay + sy * 75], [bx - sx * 260, by - sy * 75]]} at={k < 3 ? at(6 + k, .3) : at(8, .8)} />;})}
      <DiagramPacket t={t} f={f} pts={pts} at={at(8)} period={120} r={12} />
    </g>
    {/* C · 9–12: knowing where to change */}
    <g opacity={span(9, 12)}>
      <Label t={t} x={960} y={190} size={44} color={p.muted} opacity={pop(9)}>không hứa code chạy nhanh hơn</Label>
      <path d={hexPath(960, 520, 200)} fill={p.surface} stroke={p.accent} strokeWidth={5} opacity={pop(9, .4)} />
      <Label t={t} x={960} y={535} size={40} color={p.accent} opacity={pop(9, .4)}>nghiệp vụ</Label>
      {['web', 'database', 'email', 'API'].map((x, k) => {const pos: Pt = [[400, 360], [1520, 360], [1520, 680], [400, 680]][k] as Pt, on = k === 1;return <g key={k}>
        <Box f={f} x={pos[0]} y={pos[1]} w={380} h={120} at={at(10, .3 + k * .2)} label={x} state={on && f > at(10, 1.6) ? 'hot' : 'ok'} size={38} />
        <DiagramWire t={t} f={f} pts={[[pos[0] + (k % 3 ? -190 : 190), pos[1]], [960 + (k % 3 ? 170 : -170), 520 + (k > 1 ? 60 : -60)]]} at={at(10, .5 + k * .2)} /></g>;})}
      <Chip t={t} f={f} x={1520} y={490} text="đổi database: sửa đúng chỗ này" at={at(10, 1.8)} size={34} tone="accent" />
    </g>
  </Stage>;
};

