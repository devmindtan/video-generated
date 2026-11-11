import type {FC, ReactNode} from 'react';
import {Chip, CodeCard, Counter, DiagramNode, DiagramPacket, DiagramWire, Label, MONO, Mark, grow} from '../../looks/diagram-kit';
import {FONT} from '../../looks/looks';
import {Stage, THEME, useBeat} from './common';
import type {Seg} from './common';

// Chapters 1 (tail) to 10 and the closing. One component per narration segment; each beat spans the sentences named
// in its comment (0-based, script.md order) and keeps moving while the voice talks: packets on wires, meters,
// counters. Examples and numbers are the book's (docs/projects/system-design-tong-quan/sources.md).

const t = THEME, p = t.palette, BAD = '#ff6b6b';
type Pt = [number, number];
const Card: FC<{x: number; y: number; w: number; h: number; o?: number; tone?: string; children?: ReactNode}> = ({x, y, w, h, o = 1, tone, children}) =>
  <g opacity={o}><rect x={x} y={y} width={w} height={h} rx={20} fill={p.surface} stroke={tone ?? p.accent2} strokeWidth={3} />{children}</g>;
const Bar: FC<{x: number; y: number; w: number; v: number; color?: string; h?: number}> = ({x, y, w, v, color, h = 22}) =>
  <g><rect x={x} y={y} width={w} height={h} rx={h / 2} fill={p.background} stroke={p.muted} strokeWidth={2} /><rect x={x} y={y} width={Math.max(h, w * Math.min(1, v))} height={h} rx={h / 2} fill={color ?? p.accent2} /></g>;
const Title: FC<{children: ReactNode; o: number; y?: number}> = ({children, o, y = 170}) => <Label t={t} x={960} y={y} size={56} opacity={o}>{children}</Label>;
// Looping 0..1 phase from frame `a`, one lap per `period` frames.
const loop = (f: number, a: number, period: number) => f < a ? 0 : ((f - a) / period) % 1;

// ---- 01 tail · the repeatable method (sentences 8–11) -------------------------------------------------------
export const PhuongPhap: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, pop} = useBeat(s);
  const steps = ['Hỏi rõ yêu cầu', 'Kiến trúc tổng quan', 'Đi sâu từng phần'], xs = [420, 960, 1500];
  const active = Math.floor(loop(f, at(9), 90) * 3);
  return <g opacity={span(8, 11)}>
    <Title o={pop(8)}>Một cách làm lặp lại được</Title>
    {xs.slice(0, 2).map((x, k) => <DiagramWire key={k} t={t} f={f} pts={[[x + 215, 460], [xs[k + 1] - 215, 460]]} at={at(9, .6 + k * .8)} />)}
    <DiagramWire t={t} f={f} pts={[[1500, 540], [1500, 640], [420, 640], [420, 548]]} at={at(9, 2.6)} dur={30} dashed />
    {steps.map((label, k) => <g key={k}>
      <DiagramNode t={t} f={f} x={xs[k]} y={460} w={410} h={150} kind="none" at={at(8, 1 + k * .7)} state={f < at(9, k * .8) ? 'dim' : f > at(9, 3) && active === k ? 'hot' : 'ok'} />
      <Label t={t} x={xs[k]} y={448} size={32} mono color={p.accent} opacity={pop(8, 1 + k * .7)}>{`0${k + 1}`}</Label>
      <Label t={t} x={xs[k]} y={500} size={36} opacity={pop(8, 1 + k * .7) * (f < at(9, k * .8) ? .5 : 1)}>{label}</Label>
    </g>)}
    <DiagramPacket t={t} f={f} pts={[[420, 380], [960, 380], [1500, 380]]} at={at(9, 3)} period={90} r={11} />
    <g opacity={pop(10)}>
      <Label t={t} x={640} y={770} size={38} color={p.accent}>cách đi tới đáp án</Label>
      <Bar x={420} y={790} w={440} v={.25 + .65 * grow(f, at(10, .4), at(10, 2.4))} color={p.accent} />
      <Label t={t} x={1280} y={770} size={38} color={p.muted}>đáp án</Label>
      <Bar x={1060} y={790} w={440} v={.3} color={p.muted} />
    </g>
    {[0, 1, 2].map((k) => {const ph = loop(f, at(11) + k * 16, 48);return f < at(11) ? null : <g key={k} opacity={Math.min(1, ph * 5, (1 - ph) * 3)}>
      <circle cx={1660 + k * 46} cy={250 - ph * 60 - k * 30} r={10 + k * 6} fill="none" stroke={p.accent2} strokeWidth={3} /></g>;})}
    <Chip t={t} f={f} x={1560} y={300} text="nghĩ thành tiếng" at={at(11, .4)} size={34} tone="accent2" />
  </g>;
};

// ---- 02 · the building blocks --------------------------------------------------------------------------------
export const NenTang: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, pop} = useBeat(s);
  const cars = (speed: number, count: number, y: number, from: number) => Array.from({length: count}, (_, i) => {
    const ph = loop(f, from + i * (speed / count), speed), x = 360 + ph * 1200;
    return f < from ? null : <g key={i} transform={`translate(${x} ${y})`} opacity={Math.min(1, ph * 8, (1 - ph) * 8)}>
      <rect x={-40} y={-24} width={80} height={38} rx={9} fill={p.accent2} /><circle cx={-22} cy={16} r={9} fill={p.ink} /><circle cx={22} cy={16} r={9} fill={p.ink} /></g>;
  });
  const scaleUp = grow(f, at(5, .5), at(5, 3.5));
  const extra = [0, 1, 2].map((k) => grow(f, at(6, .6 + k * .8), at(6, 1.2 + k * .8)));
  const down = f > at(7, 1.6);
  const parts: {kind: 'server' | 'service' | 'db' | 'lb' | 'cache' | 'cdn' | 'queue'; label: string; sub: string; x: number; y: number; s: number; d: number}[] = [
    {kind: 'server', label: 'Web server', sub: 'lễ tân', x: 620, y: 480, s: 12, d: 0},
    {kind: 'service', label: 'App server', sub: 'gian bếp', x: 980, y: 480, s: 12, d: 1.6},
    {kind: 'db', label: 'Database', sub: 'bộ nhớ', x: 1340, y: 480, s: 12, d: 3.6},
    {kind: 'lb', label: 'Load balancer', sub: 'chia việc', x: 260, y: 480, s: 13, d: 0},
    {kind: 'cache', label: 'Cache', sub: 'bản sao nhanh', x: 980, y: 285, s: 14, d: 0},
    {kind: 'cdn', label: 'CDN', sub: 'gần người xem', x: 260, y: 720, s: 14, d: 2},
    {kind: 'queue', label: 'Message queue', sub: 'làm sau', x: 1340, y: 720, s: 14, d: 3.6},
  ];
  return <Stage>
    {/* A · sentences 0–3: the toll booth — latency is one car's wait, throughput is cars per minute */}
    <g opacity={span(0, 3)}>
      <Title o={pop(0)}>Độ trễ và thông lượng</Title>
      <path d="M300 520 H1620" stroke={p.muted} strokeWidth={4} strokeDasharray="22 16" />
      <rect x={920} y={330} width={80} height={170} rx={10} fill={p.surface} stroke={p.accent} strokeWidth={4} />
      <path d={`M1000 400 L${1000 + 190 * (1 - Math.abs(Math.sin(f / 16)))} 400`} stroke={p.accent} strokeWidth={8} strokeLinecap="round" />
      {cars(120, 3, 480, at(1))}
      <g opacity={pop(1)}><Label t={t} x={520} y={660} size={38} color={p.accent2}>Latency · độ trễ</Label>
        <Label t={t} x={520} y={730} size={54} mono>{`${Math.round(80 + 40 * Math.sin(f / 20))} ms`}</Label>
        <Label t={t} x={520} y={780} size={34} weight={400} color={p.muted}>thời gian một xe qua trạm</Label></g>
      <g opacity={pop(2)}><Label t={t} x={1400} y={660} size={38} color={p.accent}>Throughput · thông lượng</Label>
        <Counter t={t} f={f} x={1400} y={730} from={0} to={60} a={at(2, .3)} b={at(2, 2.6)} size={54} suffix=" xe/phút" />
        <Label t={t} x={1400} y={780} size={34} weight={400} color={p.muted}>số xe qua trạm mỗi phút</Label></g>
      <Chip t={t} f={f} x={960} y={850} text="nhanh từng xe ≠ phục vụ được nhiều xe" at={at(3, .6)} size={34} tone="accent" />
    </g>
    {/* B · sentences 4–7: scale up or scale out */}
    <g opacity={span(4, 7)}>
      <Title o={pop(4)}>Quán phở đông khách: hai cách mở rộng</Title>
      <Label t={t} x={500} y={280} size={40} color={p.accent2} opacity={pop(5)}>Chiều dọc · nâng cấp máy</Label>
      <DiagramNode t={t} f={f} x={500} y={540} w={200 + 150 * scaleUp} h={150 + 150 * scaleUp} kind="server" at={at(4, .6)} state={scaleUp > .98 ? 'hot' : 'ok'} />
      <path d="M260 345 H740" stroke={BAD} strokeWidth={4} strokeDasharray="14 10" opacity={pop(5, 3)} />
      <Label t={t} x={500} y={335} size={34} weight={400} color={BAD} opacity={pop(5, 3)}>giới hạn của một máy</Label>
      <Label t={t} x={1380} y={280} size={40} color={p.accent} opacity={pop(6)}>Chiều ngang · thêm máy</Label>
      <DiagramNode t={t} f={f} x={1140} y={540} w={170} h={140} kind="server" at={at(4, .6)} />
      {[0, 1, 2].map((k) => extra[k] > 0 ? <DiagramNode key={k} t={t} f={f} x={1330 + (k % 2) * 190 - (k === 2 ? 190 : 0)} y={k === 2 ? 720 : 540} w={170} h={140} kind="server"
        at={at(6, .6 + k * .8)} state={down && k === 0 ? 'down' : 'ok'} /> : null)}
      {[[1140, 540], [1330, 540], [1520, 540], [1140, 720]].map(([x, y], k) => k === 0 || extra[k - 1] > .9 ? (down && k === 1 ? null :
        <DiagramPacket key={k} t={t} f={f} pts={[[x, y - 190], [x, y - 80]]} at={at(6, 1 + k * .5)} period={32} />) : null)}
      <Chip t={t} f={f} x={1380} y={850} text="một quán đóng cửa, quán khác vẫn bán" at={at(7, 1.6)} size={34} tone="accent" />
    </g>
    {/* C · sentences 8–10: the nines, and reliability */}
    <g opacity={span(8, 10)}>
      <Title o={pop(8)}>Tính khả dụng đo bằng những con số chín</Title>
      <Label t={t} x={960} y={360} size={120} mono color={p.accent} opacity={pop(9)}>99,99%</Label>
      <g opacity={pop(9, .8)}>
        <rect x={360} y={450} width={1200} height={40} rx={8} fill={p.accent2} opacity={.85} />
        <rect x={1554} y={444} width={6} height={52} fill={BAD} opacity={.6 + .4 * Math.sin(f / 5)} />
        <Label t={t} x={360} y={545} size={34} weight={400} color={p.muted} anchor="start">10.000 phút hoạt động</Label>
        <Label t={t} x={1560} y={545} size={34} color={BAD} anchor="end">ngừng tối đa 1 phút</Label>
      </g>
      <g opacity={pop(10)}>
        <Label t={t} x={960} y={680} size={42} color={p.accent2}>Độ tin cậy = khả dụng + dữ liệu toàn vẹn</Label>
        {['giao dịch #1041', 'giao dịch #1042', 'giao dịch #1043'].map((x, k) => <g key={k}>
          <Label t={t} x={560 + k * 400} y={770} size={34} mono color={p.ink}>{x}</Label>
          <Mark t={t} f={f} x={560 + k * 400} y={820} ok at={at(10, 1 + k * .5)} size={40} /></g>)}
      </g>
    </g>
    {/* D · sentences 11–14: the high-level architecture and its usual parts */}
    <g opacity={span(11, 14)}>
      <Title o={pop(11)} y={165}>Kiến trúc cấp cao: bản thiết kế tổng thể</Title>
      {/* the blueprint of a house, before any room is detailed */}
      <g opacity={1 - grow(f, at(12) - 10, at(12))}>
        {['M660 620 V400 L960 250 L1260 400 V620 Z', 'M660 400 H1260 M960 400 V620 M660 510 H960', 'M1040 620 V500 H1140 V620'].map((d, k) =>
          <path key={k} d={d} pathLength={1} fill="none" stroke={k === 0 ? p.accent2 : p.muted} strokeWidth={k === 0 ? 5 : 3} strokeLinejoin="round" strokeDasharray="1 1" strokeDashoffset={1 - grow(f, at(11, .4 + k * 1.2), at(11, 1.8 + k * 1.2))} />)}
        <Label t={t} x={960} y={700} size={36} weight={400} color={p.muted} opacity={pop(11, 1)}>bản thiết kế ngôi nhà, trước khi lo từng phòng</Label>
      </g>
      <DiagramWire t={t} f={f} pts={[[380, 470], [500, 470]]} at={at(13, .4)} />
      <DiagramWire t={t} f={f} pts={[[740, 470], [860, 470]]} at={at(12, 1.2)} />
      <DiagramWire t={t} f={f} pts={[[1100, 470], [1220, 470]]} at={at(12, 3.2)} />
      <DiagramWire t={t} f={f} pts={[[980, 385], [980, 365]]} at={at(14, .4)} dashed arrow={false} />
      <DiagramWire t={t} f={f} pts={[[260, 645], [260, 545]]} at={at(14, 2.2)} dashed arrow={false} />
      <DiagramWire t={t} f={f} pts={[[1040, 545], [1280, 650]]} at={at(14, 3.8)} dashed />
      {parts.map((x, k) => <DiagramNode key={k} t={t} f={f} x={x.x} y={x.y} w={250} h={160} kind={x.kind} label={x.label} labelSize={28} sub={x.sub} at={at(x.s, x.d)} state={x.s === 13 ? 'key' : 'ok'} />)}
      <DiagramPacket t={t} f={f} pts={[[380, 470], [500, 470]]} at={at(13, 1)} period={28} />
      <DiagramPacket t={t} f={f} pts={[[740, 470], [860, 470]]} at={at(12, 2)} period={28} />
      <DiagramPacket t={t} f={f} pts={[[1100, 470], [1220, 470]]} at={at(12, 4)} period={36} />
      <DiagramPacket t={t} f={f} pts={[[1040, 545], [1280, 650]]} at={at(14, 4.4)} period={50} color={p.accent2} />
    </g>
  </Stage>;
};

// ---- 03 · consistency or availability ------------------------------------------------------------------------
export const NhatQuan: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, pop} = useBeat(s);
  const sold = f > at(2, 2.2), synced = grow(f, at(3, 3), at(3, 5.5));
  const replicas: Pt[] = [[560, 420], [760, 420], [960, 420], [1160, 420], [1360, 420]];
  const cut = grow(f, at(10, 1.4), at(10, 2.2));
  return <Stage>
    {/* A · 0–3: one seat, two agents (strong); a new avatar that takes a few seconds (eventual) */}
    <g opacity={span(0, 3)}>
      <Title o={pop(0)}>Nhất quán ↔ Khả dụng</Title>
      <g opacity={pop(0, .8) * (1 - grow(f, at(2) - 8, at(2)))} transform="translate(960 560)">
        <path d="M0 -60 V110 M-110 110 H110" stroke={p.muted} strokeWidth={6} strokeLinecap="round" />
        <g transform={`rotate(${10 * Math.sin(f / 20)})`}><path d="M-330 -60 H330" stroke={p.ink} strokeWidth={8} strokeLinecap="round" />
          <circle cx={-330} cy={-60} r={18} fill={p.accent2} /><circle cx={330} cy={-60} r={18} fill={p.accent} /></g>
        <Label t={t} x={-330} y={200} size={44} color={p.accent2}>Nhất quán</Label><Label t={t} x={330} y={200} size={44} color={p.accent}>Khả dụng</Label>
      </g>
      <g opacity={1 - grow(f, at(3) - 8, at(3))}>
        <Label t={t} x={960} y={280} size={42} color={p.accent2} opacity={pop(2)}>Nhất quán mạnh: ghi xong, ai đọc cũng thấy</Label>
        <DiagramNode t={t} f={f} x={520} y={520} w={260} h={170} kind="client" label="Đại lý A" at={at(2)} />
        <DiagramNode t={t} f={f} x={1400} y={520} w={260} h={170} kind="client" label="Đại lý B" at={at(2)} />
        <DiagramNode t={t} f={f} x={960} y={520} w={280} h={190} kind="db" label={sold ? 'Ghế: 0' : 'Ghế: 1'} at={at(2, .3)} state={sold ? 'key' : 'ok'} />
        <DiagramWire t={t} f={f} pts={[[650, 520], [820, 520]]} at={at(2, 1.2)} />
        <DiagramWire t={t} f={f} pts={[[1100, 520], [1270, 520]]} at={at(2, 2.4)} />
        <DiagramPacket t={t} f={f} pts={[[650, 520], [820, 520]]} at={at(2, 1.4)} until={at(2, 2.6)} period={36} label="bán" />
        <Chip t={t} f={f} x={1400} y={690} text="đã hết ghế" at={at(2, 3.4)} size={36} tone="accent" />
      </g>
      <g opacity={pop(3)}>
        <Label t={t} x={960} y={280} size={42} color={p.accent}>Nhất quán cuối cùng: lệch một lúc rồi sẽ khớp</Label>
        {[0, 1, 2, 3].map((k) => {const fresh = k === 0 || synced > k / 3.2;return <g key={k}>
          <circle cx={480 + k * 320} cy={520} r={78} fill={p.surface} stroke={fresh ? p.accent : p.muted} strokeWidth={5} />
          <circle cx={480 + k * 320} cy={500} r={24} fill={fresh ? p.accent : p.muted} /><path d={`M${430 + k * 320} 566 a50 44 0 0 1 100 0`} fill={fresh ? p.accent : p.muted} />
          <Label t={t} x={480 + k * 320} y={660} size={34} weight={400} color={fresh ? p.ink : p.muted}>{k === 0 ? 'bạn' : fresh ? 'ảnh mới' : 'ảnh cũ'}</Label></g>;})}
        <Label t={t} x={960} y={770} size={38} mono color={p.muted}>{`+${(synced * 3).toFixed(1)} giây`}</Label>
      </g>
    </g>
    {/* B · 4–6: replication, sync vs async, failover */}
    <g opacity={span(4, 6)}>
      <Title o={pop(4)}>Replication và failover</Title>
      <DiagramNode t={t} f={f} x={520} y={470} w={260} h={170} kind="db" label="Máy chính" at={at(4, .4)} state={f > at(6, .4) ? 'down' : 'key'} />
      {[330, 610].map((y, k) => <g key={k}>
        <DiagramNode t={t} f={f} x={1320} y={y} w={260} h={170} kind="db" label={k === 0 && f > at(6, 1.4) ? 'Máy chính mới' : `Bản sao ${k + 1}`} labelSize={30} at={at(4, .9 + k * .4)} state={k === 0 && f > at(6, 1.4) ? 'key' : 'ok'} />
        <DiagramWire t={t} f={f} pts={[[650, 470], [1190, y]]} at={at(4, 1.4 + k * .3)} opacity={f > at(6, .4) ? .25 : 1} />
        <DiagramPacket t={t} f={f} pts={[[650, 470], [1190, y]]} at={at(4, 2)} until={at(6, .4)} period={k === 0 ? 30 : 70} />
      </g>)}
      <Chip t={t} f={f} x={900} y={300} text="đồng bộ chặt: chậm mà chắc" at={at(5, .3)} size={32} />
      <Chip t={t} f={f} x={900} y={650} text="bất đồng bộ: nhanh, có lúc lệch" at={at(5, 2)} size={32} tone="accent" />
      <Chip t={t} f={f} x={960} y={840} text="failover → chuyển sang máy dự phòng" at={at(6, 1.4)} size={36} tone="accent" />
    </g>
    {/* C · 7–9: quorum, W + R > N */}
    <g opacity={span(7, 9)}>
      <Title o={pop(7)}>Quorum: cân giữa hai bên</Title>
      {replicas.map(([x, y], k) => {const w = k < 3 && f > at(8, 1 + k * .3), r = k >= 2 && f > at(8, 3 + (k - 2) * .3);return <g key={k}>
        <DiagramNode t={t} f={f} x={x} y={y} w={170} h={150} kind="db" at={at(7, .5 + k * .15)} state={w && r ? 'hot' : w ? 'key' : 'ok'} />
        {w ? <Label t={t} x={x} y={300} size={36} mono color={p.accent}>W</Label> : null}
        {r ? <Label t={t} x={x} y={560} size={36} mono color={p.accent2}>R</Label> : null}</g>;})}
      <Label t={t} x={760} y={250} size={36} color={p.accent} opacity={pop(8, 1)}>ghi: 3 máy xác nhận</Label>
      <Label t={t} x={1160} y={615} size={36} color={p.accent2} opacity={pop(8, 3)}>đọc: hỏi 3 máy</Label>
      <Label t={t} x={960} y={760} size={84} mono color={p.ink} opacity={pop(9, .6)}>W + R &gt; N</Label>
      <Label t={t} x={960} y={830} size={36} weight={400} color={p.muted} opacity={pop(9, 2.4)}>3 + 3 &gt; 5 → luôn chạm một máy có dữ liệu mới</Label>
    </g>
    {/* D · 10–13: CAP — the link breaks, choose C or A */}
    <g opacity={span(10, 13)}>
      <Title o={pop(10)}>Định lý CAP</Title>
      <DiagramNode t={t} f={f} x={560} y={430} w={300} h={180} kind="server" label="Cửa hàng A" at={at(10, .3)} />
      <DiagramNode t={t} f={f} x={1360} y={430} w={300} h={180} kind="server" label="Cửa hàng B" at={at(10, .3)} />
      <path d="M710 430 H1210" stroke={cut > 0 ? BAD : p.accent2} strokeWidth={4} strokeDasharray={cut > 0 ? '14 14' : undefined} opacity={pop(10, .6)} />
      {cut > 0 ? <Mark t={t} f={f} x={960} y={430} ok={false} at={at(10, 1.4)} size={70} /> : <DiagramPacket t={t} f={f} pts={[[710, 430], [1210, 430]]} at={at(10, .8)} period={40} count={2} />}
      <g opacity={pop(11)}>
        <Card x={300} y={590} w={600} h={230} tone={p.accent2}><Label t={t} x={600} y={655} size={40} color={p.accent2}>Chọn C · nhất quán</Label>
          <Label t={t} x={600} y={715} size={34} weight={400}>ngừng bán một bên</Label><Label t={t} x={600} y={765} size={34} weight={400} color={p.muted}>ngân hàng</Label></Card>
        <Card x={1020} y={590} w={600} h={230} tone={p.accent}><Label t={t} x={1320} y={655} size={40} color={p.accent}>Chọn A · khả dụng</Label>
          <Label t={t} x={1320} y={715} size={34} weight={400}>cứ bán, có thể bán trùng</Label><Label t={t} x={1320} y={765} size={34} weight={400} color={p.muted}>mạng xã hội</Label></Card>
      </g>
      <g opacity={pop(13)}>{['hiểu nhu cầu', 'biết đánh đổi', 'giải thích mạch lạc'].map((x, k) => <Chip key={k} t={t} f={f} x={500 + k * 460} y={866} text={x} at={at(13, .5 + k * .7)} size={32} tone="accent" />)}</g>
    </g>
  </Stage>;
};

// ---- 04 · where the data lives -------------------------------------------------------------------------------
export const DuLieu: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, pop} = useBeat(s);
  const shardLoad = (k: number, mode: number) => mode === 0 ? [.95, .35, .2, .15][k] : [.5, .55, .45, .5][k];
  const mode = f > at(6) ? 1 : 0, hot = f > at(8);
  return <Stage>
    {/* A · 0–3: SQL tables vs NoSQL documents, and using both */}
    <g opacity={span(0, 3)}>
      <Title o={pop(0)}>SQL hay NoSQL</Title>
      <g opacity={1 - grow(f, at(1) - 8, at(1))}><DiagramNode t={t} f={f} x={960} y={500} w={320} h={220} kind="db" label="Dữ liệu" at={6} state="hot" /></g>
      <g opacity={pop(1)}>
        <Label t={t} x={520} y={270} size={44} color={p.accent2}>SQL</Label>
        {[0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={280 + c * 160} y={300 + r * 70} width={160} height={70} fill={r === 0 ? p.accent2 : p.surface} opacity={r === 0 ? .35 : 1} stroke={p.accent2} strokeWidth={2} />))}
        {['id', 'user', 'số dư'].map((x, c) => <Label key={c} t={t} x={360 + c * 160} y={348} size={34}>{x}</Label>)}
        <Chip t={t} f={f} x={520} y={650} text="JOIN · giao dịch" at={at(1, 2.2)} size={34} />
        <Chip t={t} f={f} x={520} y={740} text="khó mở rộng ngang" at={at(1, 3.6)} size={32} tone="bad" />
      </g>
      <g opacity={pop(2)}>
        <Label t={t} x={1400} y={270} size={44} color={p.accent}>NoSQL</Label>
        <CodeCard t={t} f={f} x={1100} y={300} w={600} at={at(2, .3)} cps={2.4} size={34} lines={['{ "user": "an",', '  "tags": ["a", "b"],', '  "log": { ... } }']} highlight={[1]} />
        <Chip t={t} f={f} x={1260} y={650} text="linh hoạt" at={at(2, 1.6)} size={34} tone="accent" />
        <Chip t={t} f={f} x={1540} y={650} text="thêm máy dễ" at={at(2, 2.4)} size={34} tone="accent" />
        <Chip t={t} f={f} x={1400} y={740} text="nhường bớt nhất quán tức thì" at={at(2, 3.8)} size={32} tone="bad" />
      </g>
      <Chip t={t} f={f} x={960} y={850} text="dùng cả hai: SQL cho số dư, NoSQL cho nhật ký" at={at(3, .6)} size={34} tone="accent2" />
    </g>
    {/* B · 4–8: sharding strategies and the hot shard */}
    <g opacity={span(4, 8)}>
      <Title o={pop(4)}>Sharding: chia dữ liệu ra nhiều máy</Title>
      <Label t={t} x={960} y={270} size={42} color={mode ? p.accent : p.accent2} opacity={pop(5)}>{f > at(7) ? 'theo bảng tra · theo vùng địa lý' : mode ? 'theo hàm băm: hash(id) mod 4' : 'theo khoảng giá trị: A–I, J–S, T–Z…'}</Label>
      {[0, 1, 2, 3].map((k) => {const v = shardLoad(k, mode), isHot = hot && k === 0;return <g key={k} opacity={pop(4, .6 + k * .2)}>
        <DiagramNode t={t} f={f} x={420 + k * 360} y={470} w={250} h={170} kind="db" label={f > at(7) ? ['US', 'EU', 'APAC', 'bảng tra'][k] : `Shard ${k + 1}`} at={at(4, .6 + k * .2)} state={isHot ? 'hot' : 'ok'} />
        <Bar x={310 + k * 360} y={600} w={220} v={isHot ? .98 : v} color={(isHot || (v > .8 && !mode)) ? BAD : p.accent2} />
        {v > .3 || isHot ? <DiagramPacket t={t} f={f} pts={[[420 + k * 360, 300], [420 + k * 360, 380]]} at={at(5)} period={isHot || (!mode && k === 0) ? 14 : 40} r={7} /> : null}
      </g>;})}
      <Chip t={t} f={f} x={960} y={720} text="consistent hashing: thêm máy không phải tính lại hết" at={at(6, 2.6)} size={32} tone="accent" />
      <Chip t={t} f={f} x={960} y={840} text="chọn sai khóa chia → một shard nóng rực" at={at(8, .4)} size={34} tone="bad" />
    </g>
    {/* C · 9–10: index */}
    <g opacity={span(9, 10)}>
      <Title o={pop(9)}>Index: mục lục của cuốn sách</Title>
      {Array.from({length: 9}, (_, k) => <rect key={k} x={300 + k * 62} y={330} width={52} height={300} rx={6} fill={p.surface} stroke={k === 6 ? p.accent : p.muted} strokeWidth={k === 6 ? 4 : 2} />)}
      <path d={`M${300 + 26} 300 L${300 + 26 + loop(f, at(9), 120) * 8 * 62} 300`} stroke={BAD} strokeWidth={5} strokeLinecap="round" opacity={pop(9)} />
      <Label t={t} x={580} y={690} size={34} weight={400} color={p.muted} opacity={pop(9)}>không index: lật từng trang</Label>
      <DiagramWire t={t} f={f} pts={[[1000, 480], [1000, 260], [698, 260], [698, 320]]} at={at(9, 1.6)} color={p.accent} />
      <CodeCard t={t} f={f} x={1000} y={400} w={720} title="index.sql" at={at(10, .2)} cps={2.2} size={34} lines={['CREATE INDEX ON users', '  (country, name);', '', 'WHERE country = ?   -- dùng', 'WHERE name = ?      -- không']} highlight={[1, 4]} />
      <Chip t={t} f={f} x={580} y={800} text="mỗi index làm việc ghi chậm đi" at={at(10, 1)} size={34} tone="bad" />
    </g>
    {/* D · 11: how to present it */}
    <g opacity={span(11, 11)}>
      <Title o={pop(11)}>Khi trình bày phần dữ liệu</Title>
      {['Yêu cầu dữ liệu', 'Chọn loại database', 'Kế hoạch khi ×10'].map((x, k) => <g key={k}>
        <DiagramNode t={t} f={f} x={420 + k * 540} y={480} w={420} h={170} kind="none" at={at(11, .4 + k * 1.3)} state={k === 2 ? 'key' : 'ok'} />
        <Label t={t} x={420 + k * 540} y={470} size={32} mono color={p.accent} opacity={pop(11, .4 + k * 1.3)}>{`0${k + 1}`}</Label>
        <Label t={t} x={420 + k * 540} y={525} size={38} opacity={pop(11, .4 + k * 1.3)}>{x}</Label>
        {k < 2 ? <DiagramWire t={t} f={f} pts={[[640 + k * 540, 480], [740 + k * 540, 480]]} at={at(11, 1 + k * 1.3)} /> : null}</g>)}
      <Chip t={t} f={f} x={1500} y={680} text="replica → shard" at={at(11, 3.6)} size={34} tone="accent" />
    </g>
  </Stage>;
};

// ---- 05 · scaling and speed ----------------------------------------------------------------------------------
export const MoRong: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, pop} = useBeat(s);
  const ys = [300, 500, 700];
  const algo = f > at(2, 5.2) ? 2 : f > at(2, 2.2) ? 1 : 0;
  const target = algo === 0 ? Math.floor(loop(f, at(1), 72) * 3) : algo === 1 ? 2 : 0;
  const hit = f > at(7, 4.4), backlog = grow(f, at(13), at(13, 2.4)), relief = grow(f, at(13, 4), at(13, 6));
  const tickets = Math.round(3 + 7 * backlog - 6 * relief);
  return <Stage>
    {/* A · 0–4: load balancer, algorithms, layer 4 vs layer 7 */}
    <g opacity={span(0, 4)}>
      <Title o={pop(0)} y={150}>{f < at(1) ? 'Ba công cụ mở rộng' : 'Load balancer'}</Title>
      <g opacity={1 - grow(f, at(1) - 8, at(1))}>{(['lb', 'cache', 'queue'] as const).map((kind, k) =>
        <DiagramNode key={k} t={t} f={f} x={480 + k * 480} y={500} w={360} h={220} kind={kind} label={['Load balancer', 'Cache', 'Message queue'][k]} labelSize={32} at={10 + k * 14} state={k === 0 ? 'key' : 'ok'} />)}</g>
      <g opacity={1 - grow(f, at(3) - 8, at(3))}>
        <DiagramNode t={t} f={f} x={330} y={500} w={220} h={170} kind="phone" label="Khách" at={at(1)} />
        <DiagramNode t={t} f={f} x={800} y={500} w={240} h={150} kind="lb" at={at(1, .4)} state="key" />
        <DiagramWire t={t} f={f} pts={[[440, 500], [680, 500]]} at={at(1, .8)} />
        <DiagramPacket t={t} f={f} pts={[[440, 500], [680, 500]]} at={at(1, 1.2)} period={24} />
        {ys.map((y, k) => <g key={k}>
          <DiagramWire t={t} f={f} pts={[[920, 500], [1280, y]]} at={at(1, 1.2 + k * .2)} opacity={target === k ? 1 : .4} />
          <DiagramNode t={t} f={f} x={1400} y={y} w={220} h={150} kind="server" at={at(1, 1 + k * .2)} state={target === k ? 'key' : 'ok'} />
          {target === k ? <DiagramPacket t={t} f={f} pts={[[920, 500], [1280, y]]} at={at(1, 1.6)} period={24} /> : null}
          {algo === 1 ? <Bar x={1540} y={y - 11} w={160} v={[.9, .7, .2][k]} color={k === 2 ? p.accent2 : BAD} /> : null}
        </g>)}
        <Chip t={t} f={f} x={800} y={760} text={['Round robin · chia lần lượt', 'Least connections · máy rảnh nhất', 'IP hash · một người, một máy'][algo]} at={at(2)} size={36} tone="accent" />
      </g>
      <g opacity={pop(3)}>
        <Card x={220} y={260} w={700} h={520} tone={p.accent2}><Label t={t} x={570} y={340} size={46} color={p.accent2}>Tầng 4</Label>
          <CodeCard t={t} f={f} x={290} y={390} w={560} at={at(3, .4)} cps={2.4} size={36} lines={['IP   10.0.0.7', 'port 443']} />
          <Label t={t} x={570} y={670} size={38}>chỉ nhìn địa chỉ và cổng</Label><Label t={t} x={570} y={728} size={38} color={p.accent2}>→ rất nhanh</Label></Card>
        <Card x={1000} y={260} w={700} h={520} tone={p.accent} o={pop(4)}><Label t={t} x={1350} y={340} size={46} color={p.accent}>Tầng 7</Label>
          <CodeCard t={t} f={f} x={1070} y={390} w={560} at={at(4, .4)} cps={2.4} size={36} lines={['GET /video/720p', 'Cookie: session=…']} highlight={[0]} />
          <Label t={t} x={1350} y={670} size={38}>đọc được đường dẫn, cookie</Label><Label t={t} x={1350} y={728} size={38} color={p.accent}>→ chia việc thông minh hơn</Label></Card>
      </g>
    </g>
    {/* B · 5–9: cache */}
    <g opacity={span(5, 9)}>
      <Title o={pop(5)} y={150}>Cache</Title>
      <g opacity={1 - grow(f, at(7) - 8, at(7))}>
        <path d="M300 520 C520 300 760 700 1000 480 S1500 360 1620 520" fill="none" stroke={p.muted} strokeWidth={5} strokeDasharray="16 14" opacity={pop(5)} />
        <path d="M300 520 H1620" stroke={p.accent} strokeWidth={6} opacity={pop(5, 2.2)} />
        <Label t={t} x={960} y={330} size={36} weight={400} color={p.muted} opacity={pop(5)}>lần đầu: dò đường</Label>
        <Label t={t} x={960} y={600} size={38} color={p.accent} opacity={pop(5, 2.2)}>lần hai: đã nhớ đường</Label>
        {['Trình duyệt', 'CDN', 'Reverse proxy', 'Ứng dụng', 'Database'].map((x, k) => <Chip key={k} t={t} f={f} x={330 + k * 320} y={760} text={x} at={at(6, .5 + k * .8)} size={32} />)}
      </g>
      <g opacity={pop(7)}>
        <DiagramNode t={t} f={f} x={360} y={480} w={240} h={170} kind="service" label="Ứng dụng" at={at(7)} />
        <DiagramNode t={t} f={f} x={980} y={330} w={240} h={170} kind="cache" label="Cache" at={at(7, .3)} state={hit ? 'key' : 'ok'} />
        <DiagramNode t={t} f={f} x={980} y={650} w={240} h={170} kind="db" label="Database" at={at(7, .3)} />
        <DiagramWire t={t} f={f} pts={[[480, 450], [860, 340]]} at={at(7, .8)} />
        <DiagramWire t={t} f={f} pts={[[480, 510], [860, 640]]} at={at(7, 2.2)} dashed />
        <DiagramWire t={t} f={f} pts={[[980, 565], [980, 415]]} at={at(7, 3.4)} color={p.accent} />
        <DiagramPacket t={t} f={f} pts={[[480, 450], [860, 340]]} at={at(7, 1)} period={30} />
        <DiagramPacket t={t} f={f} pts={[[480, 510], [860, 640]]} at={at(7, 2.4)} until={at(7, 4.4)} period={40} color={p.accent2} />
        <Chip t={t} f={f} x={700} y={300} text={hit ? 'hit' : 'miss'} at={at(7, 1.2)} size={34} tone={hit ? 'accent' : 'bad'} mono />
        <Label t={t} x={1500} y={300} size={40} color={p.accent} opacity={pop(7)}>cache-aside</Label>
        <Label t={t} x={1500} y={440} size={36} color={p.ink} opacity={pop(8)}>write-through</Label>
        <Label t={t} x={1500} y={490} size={34} weight={400} color={p.muted} opacity={pop(8)}>ghi cả hai nơi</Label>
        <Label t={t} x={1500} y={600} size={36} color={p.ink} opacity={pop(8, 2.4)}>write-back</Label>
        <Label t={t} x={1500} y={650} size={34} weight={400} color={p.muted} opacity={pop(8, 2.4)}>ghi cache trước</Label>
        <Chip t={t} f={f} x={1500} y={800} text="khi nào xóa bản cũ?" at={at(9, .4)} size={34} tone="bad" />
      </g>
    </g>
    {/* C · 10–13: message queue, producer → queue → consumer, backpressure */}
    <g opacity={span(10, 13)}>
      <Title o={pop(10)} y={150}>Message queue</Title>
      <DiagramNode t={t} f={f} x={320} y={480} w={260} h={170} kind="service" label="Producer" at={at(11)} />
      <rect x={640} y={410} width={640} height={140} rx={18} fill={p.surface} stroke={backlog > .6 && relief < .5 ? BAD : p.accent2} strokeWidth={3} opacity={pop(10, .4)} />
      {Array.from({length: Math.max(0, Math.min(10, tickets))}, (_, k) => <rect key={k} x={1210 - k * 58} y={432} width={46} height={96} rx={8} fill={p.accent} opacity={pop(10, .6) * .9} />)}
      {[380, 580, 780].map((y, k) => k < 2 || relief > .1 ? <g key={k}>
        <DiagramNode t={t} f={f} x={1580} y={y} w={240} h={150} kind="server" label={`Worker ${k + 1}`} labelSize={28} at={k < 2 ? at(11, 2 + k * .3) : at(13, 4)} state={k === 2 ? 'key' : 'ok'} />
        <DiagramPacket t={t} f={f} pts={[[1280, 480], [1460, y]]} at={k < 2 ? at(11, 3) : at(13, 4.4)} period={46} /></g> : null)}
      <DiagramWire t={t} f={f} pts={[[450, 480], [630, 480]]} at={at(11, .6)} />
      <DiagramPacket t={t} f={f} pts={[[450, 480], [630, 480]]} at={at(11, 1)} period={backlog > .1 && relief < .9 ? 12 : 34} />
      <Chip t={t} f={f} x={420} y={640} text="tải video lên → trả lời ngay" at={at(12, .4)} size={32} tone="accent2" />
      <Chip t={t} f={f} x={520} y={730} text="worker chuyển định dạng phía sau" at={at(12, 2.6)} size={32} tone="accent2" />
      <Chip t={t} f={f} x={720} y={850} text="backpressure: chậm nhận lại, thêm người làm" at={at(13, 2.6)} size={34} tone="bad" />
    </g>
  </Stage>;
};

// ---- 06 · idempotency and locks ------------------------------------------------------------------------------
export const Idempotency: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, pop} = useBeat(s);
  const keyed = f > at(2), balance = keyed ? 900 : f > at(0, 3.6) ? 800 : f > at(0, 2) ? 900 : 1000;
  const version = f > at(6, 1.2) ? 4 : 3;
  return <Stage>
    {/* A · 0–2: the retry that charges twice, and the key that stops it */}
    <g opacity={span(0, 2)}>
      <Title o={pop(0)}>Gửi hai lần, chỉ tính một</Title>
      <DiagramNode t={t} f={f} x={380} y={470} w={260} h={180} kind="phone" label="Client" at={0} />
      <DiagramNode t={t} f={f} x={1500} y={470} w={300} h={200} kind="db" label="Tài khoản" at={6} state={!keyed && balance === 800 ? 'down' : 'ok'} />
      <DiagramWire t={t} f={f} pts={[[510, 430], [1350, 430]]} at={at(0, 1.2)} />
      <DiagramWire t={t} f={f} pts={[[510, 510], [1350, 510]]} at={at(0, 2.8)} dashed />
      <DiagramPacket t={t} f={f} pts={[[510, 430], [1350, 430]]} at={at(0, 1.4)} period={40} label={keyed ? 'key: a81f' : '-100k'} />
      <DiagramPacket t={t} f={f} pts={[[510, 510], [1350, 510]]} at={at(0, 3)} period={40} label={keyed ? 'key: a81f' : '-100k (gửi lại)'} color={keyed ? p.muted : BAD} />
      <Label t={t} x={1500} y={690} size={64} mono color={!keyed && balance === 800 ? BAD : p.ink}>{`${balance}k`}</Label>
      <Chip t={t} f={f} x={930} y={640} text="idempotency key: trùng khóa → bỏ qua" at={at(2, .4)} size={36} tone="accent" />
      <Label t={t} x={930} y={780} size={38} weight={400} color={p.muted} opacity={pop(1)}>gửi bao nhiêu lần, kết quả cũng như một lần</Label>
    </g>
    {/* B · 3–7: pessimistic vs optimistic locking */}
    <g opacity={span(3, 7)}>
      <Title o={pop(3)}>Hai người cùng sửa một bản ghi</Title>
      <Card x={200} y={250} w={720} h={560} tone={p.accent2} o={pop(4)}>
        <Label t={t} x={560} y={325} size={44} color={p.accent2}>Khóa bi quan</Label>
        <rect x={470} y={450} width={180} height={110} rx={14} fill={p.background} stroke={p.accent} strokeWidth={4} />
        <path d="M510 450 V420 a50 50 0 0 1 100 0 V450" fill="none" stroke={p.accent} strokeWidth={8} />
        {[0, 1, 2].map((k) => <circle key={k} cx={300 + k * 56 + 8 * Math.sin(f / 9 + k)} cy={505} r={20} fill={p.muted} opacity={pop(4, 1.4 + k * .4)} />)}
        <CodeCard t={t} f={f} x={260} y={600} w={600} at={at(4, 1)} cps={2.2} size={32} lines={['SELECT … FOR UPDATE']} />
        <Label t={t} x={560} y={770} size={34} weight={400} color={p.muted}>an toàn · người sau phải chờ</Label></Card>
      <Card x={1000} y={250} w={720} h={560} tone={p.accent} o={pop(5)}>
        <Label t={t} x={1360} y={325} size={44} color={p.accent}>Khóa lạc quan</Label>
        <Label t={t} x={1360} y={450} size={72} mono>{`version ${version}`}</Label>
        <Chip t={t} f={f} x={1200} y={540} text="A: lưu ✓" at={at(6, 1.2)} size={34} tone="accent2" />
        <Chip t={t} f={f} x={1520} y={540} text="B: làm lại" at={at(6, 2.4)} size={34} tone="bad" />
        <CodeCard t={t} f={f} x={1060} y={600} w={600} at={at(5, 1.6)} cps={2.2} size={30} lines={['UPDATE … WHERE version = 3']} />
        <Label t={t} x={1360} y={770} size={34} weight={400} color={p.muted}>nhanh khi ít xung đột</Label></Card>
      <Chip t={t} f={f} x={960} y={870} text="ít xung đột → lạc quan · tiền bạc → bi quan" at={at(7, .3)} size={32} tone="accent" />
    </g>
  </Stage>;
};

// ---- 07 · how machines talk ----------------------------------------------------------------------------------
export const GiaoTiep: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, pop} = useBeat(s);
  const hs = ['SYN', 'SYN-ACK', 'ACK'];
  return <Stage>
    {/* A · 0–1: HTTP request/response, stateless */}
    <g opacity={span(0, 1)}>
      <Title o={pop(0)}>HTTP: hỏi và đáp</Title>
      <DiagramNode t={t} f={f} x={400} y={480} w={260} h={180} kind="client" label="Client" at={0} />
      {[330, 480, 630].map((y, k) => k === 1 || f > at(1) ? <DiagramNode key={k} t={t} f={f} x={1480} y={y} w={240} h={130} kind="server" at={k === 1 ? 4 : at(1, k * .2)} /> : null)}
      <DiagramWire t={t} f={f} pts={[[530, 450], [1350, 450]]} at={10} />
      <DiagramWire t={t} f={f} pts={[[1350, 520], [530, 520]]} at={24} color={p.accent} />
      <DiagramPacket t={t} f={f} pts={[[530, 450], [1350, [330, 480, 630][f > at(1) ? Math.floor(loop(f, at(1), 150) * 3) : 1] - 30]]} at={20} period={50} label="GET /" />
      <DiagramPacket t={t} f={f} pts={[[1350, 520], [530, 520]]} at={46} period={50} label="200 OK" color={p.accent2} />
      <Chip t={t} f={f} x={940} y={720} text="stateless: không nhớ bạn là ai" at={at(0, 2.6)} size={36} tone="accent" />
      <Chip t={t} f={f} x={940} y={830} text="→ thêm máy chủ rất dễ" at={at(1, .6)} size={34} />
    </g>
    {/* B · 2–4: TCP vs UDP */}
    <g opacity={span(2, 4)}>
      <Card x={200} y={170} w={720} h={640} tone={p.accent2} o={pop(2)}>
        <Label t={t} x={560} y={245} size={48} color={p.accent2}>TCP</Label>
        <path d="M330 290 V640 M790 290 V640" stroke={p.muted} strokeWidth={3} />
        {hs.map((x, k) => <g key={k} opacity={pop(2, .5 + k * .7)}>
          <DiagramWire t={t} f={f} pts={k === 1 ? [[790, 350 + k * 90], [330, 380 + k * 90]] : [[330, 350 + k * 90], [790, 380 + k * 90]]} at={at(2, .5 + k * .7)} />
          <Label t={t} x={560} y={345 + k * 90} size={34} mono color={p.accent}>{x}</Label></g>)}
        {[1, 2, 3].map((k) => <Chip key={k} t={t} f={f} x={380 + (k - 1) * 180} y={690} text={`#${k}`} at={at(2, 3 + k * .3)} size={32} mono tone={k === 2 && f < at(2, 5.4) ? 'bad' : 'accent2'} />)}
        <Label t={t} x={560} y={775} size={34} weight={400} color={p.muted}>mất gói nào, gửi lại gói đó</Label></Card>
      <Card x={1000} y={170} w={720} h={640} tone={p.accent} o={pop(3)}>
        <Label t={t} x={1360} y={245} size={48} color={p.accent}>UDP</Label>
        <DiagramPacket t={t} f={f} pts={[[1080, 420], [1640, 420]]} at={at(3, .3)} period={36} count={5} />
        {[0, 1].map((k) => <Mark key={k} t={t} f={f} x={1260 + k * 200} y={500} ok={false} at={at(3, 1.6 + k * .6)} size={36} />)}
        <Label t={t} x={1360} y={590} size={38}>gửi là quên</Label>
        <Chip t={t} f={f} x={1230} y={690} text="gọi video" at={at(4, .2)} size={34} tone="accent" />
        <Chip t={t} f={f} x={1500} y={690} text="game" at={at(4, 1)} size={34} tone="accent" />
        <Label t={t} x={1360} y={775} size={34} weight={400} color={p.muted}>mất một khung hình còn hơn trễ hình</Label></Card>
    </g>
    {/* C · 5–6: RPC */}
    <g opacity={span(5, 6)}>
      <Title o={pop(5)}>RPC: gọi hàm ở máy khác</Title>
      <DiagramNode t={t} f={f} x={420} y={520} w={300} h={190} kind="service" label="Service A" at={at(5)} />
      <DiagramNode t={t} f={f} x={1500} y={520} w={300} h={190} kind="service" label="Service B" at={at(5, .3)} />
      <DiagramWire t={t} f={f} pts={[[570, 520], [1350, 520]]} at={at(5, .8)} />
      <DiagramPacket t={t} f={f} pts={[[570, 520], [1350, 520]]} at={at(5, 1.2)} period={22} count={2} />
      <CodeCard t={t} f={f} x={620} y={290} w={680} title="service-a" at={at(5, 1.6)} cps={2} size={34} lines={['getUserInfo(userId)']} highlight={[0]} />
      <Chip t={t} f={f} x={500} y={740} text="nhanh" at={at(6, .2)} size={36} tone="accent" />
      <Chip t={t} f={f} x={1120} y={740} text="hai bên dính chặt một giao diện" at={at(6, 1)} size={34} tone="bad" />
    </g>
    {/* D · 7–8: REST */}
    <g opacity={span(7, 8)}>
      <Title o={pop(7)}>REST: API mở ra bên ngoài</Title>
      {[['GET', '/tasks', 'lấy danh sách'], ['POST', '/tasks', 'tạo mới'], ['DELETE', '/tasks/123', 'xóa']].map(([verb, path, note], k) => <g key={k} opacity={pop(8, .3 + k * 1.3)}>
        <rect x={380} y={300 + k * 150} width={1160} height={116} rx={16} fill={p.surface} stroke={p.accent2} strokeWidth={3} />
        <text x={430} y={374 + k * 150} fontFamily={MONO} fontWeight={700} fontSize={44} fill={k === 2 ? BAD : p.accent}>{verb}</text>
        <text x={690} y={374 + k * 150} fontFamily={MONO} fontSize={44} fill={p.ink}>{path}</text>
        <Label t={t} x={1490} y={372 + k * 150} size={36} weight={400} color={p.muted} anchor="end">{note}</Label></g>)}
      <Chip t={t} f={f} x={960} y={250} text="mỗi tài nguyên một đường dẫn · mỗi thao tác một động từ" at={at(7, 2.4)} size={32} tone="accent2" />
    </g>
  </Stage>;
};

// ---- 08 · when things break ----------------------------------------------------------------------------------
export const ChiuLoi: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, pop} = useBeat(s);
  const fails = ['Ổ cứng chết', 'Phần mềm lỗi', 'Mạng chia cắt', 'Gõ nhầm lệnh', 'Quá tải'];
  const dead = f > at(3, 2.4), tries = [0, 2, 6, 14];
  const open = f > at(5, .8);
  return <Stage>
    {/* A · 0–1: everything that can fail */}
    <g opacity={span(0, 1)}>
      <Label t={t} x={960} y={300} size={72} opacity={pop(0)}>Mọi thứ có thể hỏng thì sẽ hỏng</Label>
      {fails.map((x, k) => <g key={k} opacity={pop(1, k * 1.25)}>
        <DiagramNode t={t} f={f} x={300 + k * 330} y={600} w={290} h={200} kind={(['db', 'service', 'cdn', 'client', 'server'] as const)[k]} label={x} labelSize={30} at={at(1, k * 1.25)} state="down" /></g>)}
    </g>
    {/* B · 2–3: redundancy, health check, failover */}
    <g opacity={span(2, 3)}>
      <Title o={pop(2)}>Không để trứng vào một giỏ</Title>
      <DiagramNode t={t} f={f} x={400} y={520} w={260} h={170} kind="lb" label="Health check" labelSize={28} at={at(2, .3)} state="key" />
      {[360, 680].map((y, k) => <g key={k}>
        <DiagramNode t={t} f={f} x={1400} y={y} w={280} h={180} kind="server" label={k ? 'Dự phòng' : 'Máy chính'} at={at(2, .8 + k * 1.2)} state={k === 0 && dead ? 'down' : k === 1 && dead ? 'key' : 'ok'} />
        <DiagramWire t={t} f={f} pts={[[530, 520], [1260, y]]} at={at(2, 1.2 + k * 1.2)} opacity={k === 0 && dead ? .25 : 1} />
        {(k === 0) !== dead ? <DiagramPacket t={t} f={f} pts={[[530, 520], [1260, y]]} at={at(2, 2)} period={30} /> : null}
        <DiagramPacket t={t} f={f} pts={[[1260, y], [530, 520]]} at={at(3, .2)} until={k === 0 ? at(3, 2.4) : Infinity} period={60} color={p.accent2} r={6} label="ping" /></g>)}
      <Chip t={t} f={f} x={900} y={850} text="máy không trả lời → failover" at={at(3, 2.6)} size={36} tone="accent" />
    </g>
    {/* C · 4–6: retry with backoff, circuit breaker, graceful degradation */}
    <g opacity={span(4, 6)}>
      <Title o={pop(4)} y={150}>Thử lại, ngắt mạch, hạ tính năng</Title>
      <path d="M260 330 H1660" stroke={p.muted} strokeWidth={3} opacity={pop(4)} />
      {tries.map((x, k) => <g key={k} opacity={pop(4, .6 + k * .9)}>
        <circle cx={300 + x * 92} cy={330} r={16} fill={k === 3 ? p.accent2 : BAD} />
        <Label t={t} x={300 + x * 92} y={290} size={34} mono color={p.muted}>{k === 0 ? 'lỗi' : `+${[0, 2, 4, 8][k]}s`}</Label></g>)}
      <Label t={t} x={960} y={410} size={36} weight={400} color={p.muted} opacity={pop(4, 3)}>mỗi lần chờ lâu gấp đôi</Label>
      <g opacity={pop(5)}>
        <DiagramNode t={t} f={f} x={420} y={600} w={240} h={150} kind="service" label="A" at={at(5)} />
        <DiagramNode t={t} f={f} x={1000} y={600} w={240} h={150} kind="service" label="B" at={at(5)} state="down" />
        <path d={`M540 600 H700 ${open ? 'L760 560 M790 600' : 'L790 600'} H880`} fill="none" stroke={open ? BAD : p.accent2} strokeWidth={5} strokeLinecap="round" />
        <Label t={t} x={710} y={690} size={34} color={BAD} opacity={pop(5, .8)}>circuit breaker</Label>
      </g>
      <g opacity={pop(6)}>
        <Card x={1250} y={500} w={460} h={300} tone={p.accent}>
          <Label t={t} x={1480} y={570} size={36} color={p.accent}>giữ phần cốt lõi</Label>
          <Label t={t} x={1480} y={650} size={56} mono>{f > at(6, 3) ? '480p' : 'HD'}</Label>
          <Label t={t} x={1480} y={730} size={34} weight={400} color={f > at(6, 1.6) ? BAD : p.ink}>{f > at(6, 1.6) ? 'bình luận: tạm tắt' : 'bình luận: bật'}</Label></Card>
      </g>
    </g>
    {/* D · 7–9: high availability vs fault tolerance */}
    <g opacity={span(7, 9)}>
      <Title o={pop(7)}>Hai mức chịu đựng</Title>
      <Card x={200} y={260} w={720} h={520} tone={p.accent2} o={pop(8)}>
        <Label t={t} x={560} y={335} size={44} color={p.accent2}>Sẵn sàng cao (HA)</Label>
        <rect x={280} y={440} width={560} height={36} rx={8} fill={p.accent2} /><rect x={560} y={434} width={26} height={48} fill={BAD} />
        <Label t={t} x={573} y={540} size={34} mono color={BAD}>~30 giây</Label>
        <Label t={t} x={560} y={650} size={36}>gián đoạn ngắn</Label><Label t={t} x={560} y={710} size={34} weight={400} color={p.muted}>đơn giản, rẻ hơn</Label></Card>
      <Card x={1000} y={260} w={720} h={520} tone={p.accent} o={pop(9)}>
        <Label t={t} x={1360} y={335} size={44} color={p.accent}>Chịu lỗi hoàn toàn (FT)</Label>
        <g transform={`translate(1360 ${470 + 6 * Math.sin(f / 14)})`}>
          <path d="M-190 0 C-120 -34 120 -34 190 0 C120 30 -120 30 -190 0 Z M-30 -20 L-120 -110 H-80 L40 -24 M-30 20 L-120 110 H-80 L40 24" fill={p.surface} stroke={p.ink} strokeWidth={4} strokeLinejoin="round" />
          <circle cx={-70} cy={-64} r={20} fill={f > at(9, 1.6) ? BAD : p.accent2} /><circle cx={-70} cy={64} r={20} fill={p.accent2} />
        </g>
        <Label t={t} x={1360} y={650} size={36}>hỏng một động cơ vẫn bay</Label><Label t={t} x={1360} y={710} size={34} weight={400} color={p.muted}>chi phí cao hơn nhiều</Label></Card>
    </g>
    {/* E · 10–11: MTBF and MTTR */}
    <g opacity={span(10, 11)}>
      <Title o={pop(10)}>Đo độ tin cậy</Title>
      <path d="M260 480 H1660" stroke={p.accent2} strokeWidth={10} strokeLinecap="round" opacity={pop(10)} />
      {[560, 1300].map((x, k) => <rect key={k} x={x} y={462} width={70} height={36} fill={BAD} opacity={pop(10, .4)} />)}
      <g opacity={pop(10, 1)}><path d="M630 400 H1300" stroke={p.accent} strokeWidth={4} /><path d="M630 385 V415 M1300 385 V415" stroke={p.accent} strokeWidth={4} />
        <Label t={t} x={965} y={370} size={44} mono color={p.accent}>MTBF</Label><Label t={t} x={965} y={320} size={34} weight={400} color={p.muted}>thời gian giữa hai lần hỏng</Label></g>
      <g opacity={pop(10, 3.4)}><path d="M1300 560 H1370" stroke={BAD} strokeWidth={4} /><path d="M1300 545 V575 M1370 545 V575" stroke={BAD} strokeWidth={4} />
        <Label t={t} x={1335} y={640} size={44} mono color={BAD}>MTTR</Label><Label t={t} x={1335} y={690} size={34} weight={400} color={p.muted}>thời gian hồi phục</Label></g>
      <Chip t={t} f={f} x={960} y={820} text="lâu mới hỏng · hỏng thì dậy nhanh" at={at(11, .3)} size={36} tone="accent" />
    </g>
  </Stage>;
};

// ---- 09 · security in layers ---------------------------------------------------------------------------------
export const BaoMat: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, pop} = useBeat(s);
  const layers = ['Rate limit', 'Kiểm tra đầu vào', 'HTTPS', 'Cookie an toàn'];
  return <Stage>
    {/* A · 0–3: who are you — passwords, OTP, session vs JWT */}
    <g opacity={span(0, 3)}>
      <Label t={t} x={560} y={170} size={54} color={p.accent2} opacity={pop(0, .8)}>Bạn là ai?</Label>
      <Label t={t} x={1360} y={170} size={54} color={p.muted} opacity={pop(0, 2)}>Bạn được làm gì?</Label>
      <g opacity={pop(1) * (1 - grow(f, at(2) - 8, at(2)))}>
        <CodeCard t={t} f={f} x={300} y={280} w={1320} title="users" at={at(1, .2)} cps={3} size={36} lines={['password: "matkhau123"        ✗', 'hash:     argon2(salt + pw)   ✓']} highlight={[1]} />
        <Chip t={t} f={f} x={700} y={640} text="băm + muối" at={at(1, 1.6)} size={38} tone="accent" />
        <Chip t={t} f={f} x={1180} y={640} text={`OTP ${String(Math.floor(100000 + (Math.floor(f / 45) * 7919) % 899999))}`} at={at(1, 3.6)} size={38} mono tone="accent2" />
      </g>
      <g opacity={pop(2)}>
        <Card x={200} y={260} w={720} h={520} tone={p.accent2}><Label t={t} x={560} y={335} size={46} color={p.accent2}>Session</Label>
          <DiagramNode t={t} f={f} x={560} y={480} w={260} h={150} kind="server" at={at(2, .3)} />
          <Label t={t} x={560} y={640} size={36}>trạng thái nằm trên máy chủ</Label><Label t={t} x={560} y={700} size={34} weight={400} color={p.muted}>dễ thu hồi</Label></Card>
        <Card x={1000} y={260} w={720} h={520} tone={p.accent} o={pop(3)}><Label t={t} x={1360} y={335} size={46} color={p.accent}>JWT</Label>
          {['header', 'payload', 'signature'].map((x, k) => <g key={k}><rect x={1022 + k * 226} y={420} width={216} height={90} rx={12} fill={p.background} stroke={k === 1 ? BAD : p.accent} strokeWidth={3} />
            <Label t={t} x={1130 + k * 226} y={477} size={34} mono color={k === 1 ? BAD : p.ink}>{x}</Label></g>)}
          <Label t={t} x={1360} y={640} size={36}>payload ai cũng đọc được</Label><Label t={t} x={1360} y={700} size={34} weight={400} color={p.muted}>bị lộ thì khó thu hồi</Label></Card>
      </g>
    </g>
    {/* B · 4–5: what may you do — RBAC, ABAC, OAuth2 */}
    <g opacity={span(4, 5)}>
      <Title o={pop(4)}>Bạn được làm gì?</Title>
      <Card x={200} y={250} w={480} h={420} tone={p.accent2} o={pop(4, .6)}><Label t={t} x={440} y={320} size={44} color={p.accent2}>RBAC</Label>
        {['admin', 'editor', 'viewer'].map((x, k) => <Chip key={k} t={t} f={f} x={440} y={410 + k * 84} text={x} at={at(4, 1 + k * .3)} size={34} mono />)}</Card>
      <Card x={720} y={250} w={480} h={420} tone={p.accent} o={pop(4, 2.6)}><Label t={t} x={960} y={320} size={44} color={p.accent}>ABAC</Label>
        <Label t={t} x={960} y={420} size={36}>phòng ban = kế toán</Label><Label t={t} x={960} y={490} size={36}>giờ = 8:00–17:00</Label>
        <Mark t={t} f={f} x={960} y={580} ok at={at(4, 3.8)} size={50} /></Card>
      <Card x={1240} y={250} w={480} h={420} tone={p.ink} o={pop(5)}><Label t={t} x={1480} y={320} size={44}>OAuth2</Label>
        <Label t={t} x={1480} y={420} size={36} color={BAD}>mật khẩu ✗</Label>
        <Chip t={t} f={f} x={1480} y={520} text="access token" at={at(5, 1.4)} size={36} mono tone="accent" /></Card>
    </g>
    {/* C · 6–8: defence in depth */}
    <g opacity={span(6, 8)}>
      <Title o={pop(6)}>Phòng thủ nhiều lớp</Title>
      {layers.map((x, k) => {const a = k < 2 ? at(6, .6 + k * 2.2) : at(7, .4 + (k - 2) * 2);return <g key={k} opacity={grow(f, a, a + 12)}>
        <rect x={560 + k * 190} y={280} width={150} height={470} rx={18} fill={p.surface} stroke={p.accent2} strokeWidth={4} />
        <text x={635 + k * 190} y={515} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={36} fill={p.ink} transform={`rotate(-90 ${635 + k * 190} 515)`}>{x}</text></g>;})}
      {[0, 1, 2].map((k) => {const ph = loop(f, at(6) + k * 24, 72), stop = 560 + Math.min(3, k + 1) * 190 - 30;return <circle key={k} cx={Math.min(stop, 240 + ph * 1100)} cy={360 + k * 150} r={16} fill={BAD} opacity={Math.min(1, ph * 6) * (240 + ph * 1100 > stop ? .25 : 1)} />;})}
      <DiagramNode t={t} f={f} x={1560} y={515} w={260} h={190} kind="db" label="Dữ liệu" at={at(6, .2)} state="key" />
      <Chip t={t} f={f} x={960} y={840} text="Secure · HttpOnly · SameSite → chặn XSS, CSRF" at={at(7, 3)} size={32} mono tone="accent" />
    </g>
  </Stage>;
};

// ---- 10 · knowing what is going on ---------------------------------------------------------------------------
export const GiamSat: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, pop} = useBeat(s);
  const spike = grow(f, at(1, 3), at(1, 4.2));
  const chart = (x0: number, y0: number, w: number, h: number, jump: number) => Array.from({length: 40}, (_, i) => {
    const base = .22 + .05 * Math.sin(i * 1.7) + .04 * Math.sin(i * .6), v = i > 26 ? base + jump * .6 : base;
    return `${i ? 'L' : 'M'}${x0 + i * w / 39} ${y0 + h - v * h}`;}).join(' ');
  const spans = [['A · cổng API', 0, .18], ['B · đơn hàng', .16, .3], ['C · thanh toán', .28, 1]] as const;
  return <Stage>
    {/* A · 0–2: monitoring says what, observability says why */}
    <g opacity={span(0, 2)}>
      <Title o={pop(0)}>Monitoring và Observability</Title>
      {[['CPU', .55 + .4 * spike], ['Độ trễ', .3 + .6 * spike], ['Tỷ lệ lỗi', .08 + .5 * spike]].map(([name, v], k) => <g key={k} opacity={pop(1, .3 + k * .7)}>
        <Card x={260 + k * 480} y={270} w={440} h={300} tone={(v as number) > .8 ? BAD : p.accent2}>
          <Label t={t} x={480 + k * 480} y={340} size={40}>{name as string}</Label>
          <Label t={t} x={480 + k * 480} y={440} size={72} mono color={(v as number) > .8 ? BAD : p.ink}>{k === 1 ? `${Math.round(100 + 400 * spike)}ms` : `${Math.round((v as number) * 100)}%`}</Label>
          <Bar x={310 + k * 480} y={490} w={340} v={v as number} color={(v as number) > .8 ? BAD : p.accent2} /></Card></g>)}
      <Chip t={t} f={f} x={620} y={680} text="Monitoring: chuyện gì đang xảy ra?" at={at(1, .2)} size={36} tone="accent2" />
      <Chip t={t} f={f} x={1300} y={680} text="Observability: vì sao?" at={at(2, .2)} size={36} tone="accent" />
      {spike > .9 ? <circle cx={1660} cy={170} r={22} fill={BAD} opacity={.5 + .5 * Math.sin(f / 4)} /> : null}
    </g>
    {/* B · 3–6: metrics, logs, traces */}
    <g opacity={span(3, 6)}>
      <Title o={pop(3)} y={150}>Ba trụ cột</Title>
      <Card x={140} y={220} w={520} h={560} tone={p.accent2} o={pop(3, .4)}><Label t={t} x={400} y={290} size={44} color={p.accent2}>Metrics</Label>
        <path d={chart(190, 340, 420, 260, grow(f, at(4, 2.4), at(4, 3.4)))} fill="none" stroke={p.accent} strokeWidth={5} strokeLinejoin="round" />
        <Label t={t} x={400} y={680} size={36} mono>{`100 → ${Math.round(100 + 400 * grow(f, at(4, 2.4), at(4, 3.4)))} ms`}</Label>
        <Label t={t} x={400} y={735} size={34} weight={400} color={p.muted}>10:00 sáng</Label></Card>
      <Card x={700} y={220} w={520} h={560} tone={p.ink} o={pop(3, .8)}><Label t={t} x={960} y={290} size={44}>Logs</Label>
        <CodeCard t={t} f={f} x={730} y={340} w={460} at={at(5, .3)} cps={2.6} size={30} lines={['10:00:01 INFO  order', '10:00:02 WARN  retry', '10:00:03 ERROR timeout', '  at Pay.java:88']} highlight={[2, 3]} />
        <Label t={t} x={960} y={735} size={34} weight={400} color={p.muted}>lỗi ở dòng nào</Label></Card>
      <Card x={1260} y={220} w={520} h={560} tone={p.accent} o={pop(3, 1.2)}><Label t={t} x={1520} y={290} size={44} color={p.accent}>Traces</Label>
        {spans.map(([name, a, b], k) => <g key={k} opacity={pop(6, .4 + k * .7)}>
          <Label t={t} x={1300} y={390 + k * 110} size={32} anchor="start" weight={400}>{name}</Label>
          <rect x={1300 + a * 440} y={405 + k * 110} width={(b - a) * 440 * grow(f, at(6, .6 + k * .7), at(6, 1.6 + k * .7))} height={30} rx={8} fill={k === 2 ? BAD : p.accent2} /></g>)}
        <Label t={t} x={1520} y={735} size={34} weight={400} color={p.muted}>chỗ nào làm chậm cả chuỗi</Label></Card>
    </g>
    {/* C · 7: the warning light and the diagnostic tool */}
    <g opacity={span(7, 7)}>
      <Card x={240} y={240} w={640} h={520} tone={BAD} o={pop(7)}>
        <circle cx={560} cy={440} r={90} fill="none" stroke={BAD} strokeWidth={8} opacity={.5 + .5 * Math.sin(f / 5)} />
        <path d="M560 390 V455 M560 482 V492" stroke={BAD} strokeWidth={14} strokeLinecap="round" />
        <Label t={t} x={560} y={640} size={42}>Monitoring</Label><Label t={t} x={560} y={700} size={36} weight={400} color={p.muted}>đèn cảnh báo trên xe</Label></Card>
      <Card x={1040} y={240} w={640} h={520} tone={p.accent} o={pop(7, 2.2)}>
        <path d="M1200 500 H1520 L1480 420 H1240 Z" fill={p.background} stroke={p.ink} strokeWidth={5} strokeLinejoin="round" />
        <path d={`M1240 420 L${1240 + 30} ${420 - 90 * grow(f, at(7, 2.6), at(7, 3.6))} H${1480 + 30} L1480 420`} fill="none" stroke={p.accent} strokeWidth={5} strokeLinejoin="round" />
        <DiagramPacket t={t} f={f} pts={[[1360, 470], [1560, 330]]} at={at(7, 3.6)} period={30} r={7} />
        <Label t={t} x={1360} y={640} size={42}>Observability</Label><Label t={t} x={1360} y={700} size={36} weight={400} color={p.muted}>mở nắp capo, cắm máy chẩn đoán</Label></Card>
    </g>
  </Stage>;
};

// ---- 11 · closing --------------------------------------------------------------------------------------------
export const KhepLai: FC<{s: Seg}> = ({s}) => {
  const {f, at, span, pop} = useBeat(s);
  const pairs = [['Nhanh', 'Chính xác'], ['Đơn giản', 'Không bao giờ ngừng'], ['Tiện', 'An toàn']];
  return <Stage>
    {/* A · 0–1: the question behind every chapter, three trade-offs */}
    <g opacity={span(0, 1)}>
      <Label t={t} x={960} y={220} size={54} opacity={pop(0, 2)}>Hệ thống này thật sự cần gì,</Label>
      <Label t={t} x={960} y={295} size={54} color={p.accent} opacity={pop(0, 4.4)}>và mình trả giá nào để có nó?</Label>
      {pairs.map(([a, b], k) => {const tilt = 9 * Math.sin(f / 22 + k * 2);return <g key={k} opacity={pop(1, k * 1.5)} transform={`translate(${420 + k * 540} 600)`}>
        <path d="M0 -70 V110 M-90 110 H90" stroke={p.muted} strokeWidth={6} strokeLinecap="round" />
        <g transform={`rotate(${tilt})`}><path d="M-190 -70 H190" stroke={p.accent2} strokeWidth={8} strokeLinecap="round" />
          <circle cx={-190} cy={-70} r={14} fill={p.accent2} /><circle cx={190} cy={-70} r={14} fill={p.accent} /></g>
        <Label t={t} x={-150} y={190} size={34} color={p.accent2}>{a}</Label><Label t={t} x={150} y={190} size={34} color={p.accent}>{b}</Label></g>;})}
    </g>
    {/* B · 2: not a perfect design, a way of thinking */}
    <g opacity={span(2, 2)}>
      <Label t={t} x={960} y={360} size={60} color={p.muted} opacity={pop(2)}>Thiết kế hoàn hảo</Label>
      <path d={`M640 345 H${640 + 640 * grow(f, at(2, 1.2), at(2, 2))}`} stroke={BAD} strokeWidth={8} strokeLinecap="round" />
      <Label t={t} x={960} y={560} size={84} color={p.accent} opacity={pop(2, 3)}>Cách bạn suy nghĩ</Label>
    </g>
    {/* C · 3–4: try it yourself, thanks */}
    <g opacity={span(3, 4)}>
      <Title o={pop(3)}>Thử với một ứng dụng quen thuộc</Title>
      {['Nhắn tin', 'Xem phim', 'Chia sẻ ảnh'].map((x, k) => <Chip key={k} t={t} f={f} x={560 + k * 400} y={290} text={x} at={at(3, 1.6 + k * .7)} size={36} />)}
      {['Hỏi yêu cầu', 'Vẽ khung', 'Đi sâu từng phần'].map((x, k) => <g key={k}>
        <DiagramNode t={t} f={f} x={420 + k * 540} y={470} w={400} h={170} kind="none" at={at(3, 4.6 + k * .9)} state={k === Math.floor(loop(f, at(3, 7.4), 90) * 3) && f > at(3, 7.4) ? 'hot' : 'ok'} />
        <Label t={t} x={420 + k * 540} y={458} size={32} mono color={p.accent} opacity={pop(3, 4.6 + k * .9)}>{`0${k + 1}`}</Label>
        <Label t={t} x={420 + k * 540} y={512} size={38} opacity={pop(3, 4.6 + k * .9)}>{x}</Label>
        {k < 2 ? <DiagramWire t={t} f={f} pts={[[630 + k * 540, 470], [750 + k * 540, 470]]} at={at(3, 5.2 + k * .9)} /> : null}</g>)}
      <Label t={t} x={960} y={760} size={64} opacity={pop(4)}>Cảm ơn bạn đã nghe đến đây</Label>
      <Label t={t} x={960} y={830} size={36} weight={400} color={p.muted} opacity={pop(4, .6)}>System Design · Nguyễn Thế Huy</Label>
    </g>
  </Stage>;
};
