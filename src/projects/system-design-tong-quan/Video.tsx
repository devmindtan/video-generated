import type {FC, ReactNode} from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Img, Sequence, Track, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CalculateMetadataFunction} from 'remotion';
import {MusicFade} from '../../shared/MusicFade';
import {FONT, ThemeBackground, ThemeCaption} from '../../looks/looks';
import {Chip, CodeCard, DiagramNode, DiagramPacket, DiagramWire, Label, MONO, Mark, Timer, fade, grow} from '../../looks/diagram-kit';
import {Stage, THEME, useBeat} from './common';
import type {Seg} from './common';
import {BaoMat, ChiuLoi, DuLieu, GiamSat, GiaoTiep, Idempotency, KhepLai, MoRong, NenTang, NhatQuan, PhuongPhap} from './Chapters';
import captionsData from './captions.json';
import timingData from './timing.json';
import music from './music.json';

// System Design: tóm tắt cả cuốn sách. Theme "Bản vẽ kỹ thuật", style "Sơ đồ hệ thống động" (src/looks). Each
// narration segment is one audio file (make-voice, Minh Đức); picture beats start on sentence times from
// timing.json (scripts/projects/system-design-tong-quan/sentence-times.py), so re-voicing keeps them in place.
// The layout (title length, segment starts, any review cut) and the timeline captions come from sentence-times.py;
// chapters 1 (tail) to 10 and the closing live in Chapters.tsx.

type Page = {part: string; text: string; startMs: number; endMs: number};
const TIMING = timingData as {titleSeconds: number; endPadSeconds: number; segments: Record<string, Seg>};
const TITLE_SECONDS = TIMING.titleSeconds;
const CAPTIONS = (captionsData as {pages: Page[]}).pages;
// Segments in script order; a segment is shown once its narration exists in timing.json.
const SEGMENTS = [
  {id: '00-mo-dau', label: 'MỞ ĐẦU', node: (s: Seg) => <MoDau s={s} />},
  {id: '01-vong-phong-van-nay-cham-dieu-gi', label: 'CHƯƠNG 1 · VÒNG PHỎNG VẤN', node: (s: Seg) => <VongPhongVan s={s} />},
  {id: '02-nhung-vien-gach-nen', label: 'CHƯƠNG 2 · NỀN TẢNG', node: (s: Seg) => <NenTang s={s} />},
  {id: '03-nhat-quan-hay-kha-dung', label: 'CHƯƠNG 3 · NHẤT QUÁN VÀ KHẢ DỤNG', node: (s: Seg) => <NhatQuan s={s} />},
  {id: '04-chon-cho-luu-du-lieu', label: 'CHƯƠNG 4 · DỮ LIỆU', node: (s: Seg) => <DuLieu s={s} />},
  {id: '05-mo-rong-va-tang-toc', label: 'CHƯƠNG 5 · MỞ RỘNG', node: (s: Seg) => <MoRong s={s} />},
  {id: '06-gui-hai-lan-ma-chi-tinh-mot', label: 'CHƯƠNG 6 · IDEMPOTENCY VÀ KHÓA', node: (s: Seg) => <Idempotency s={s} />},
  {id: '07-cac-may-noi-chuyen-voi-nhau-the-nao', label: 'CHƯƠNG 7 · GIAO TIẾP VÀ API', node: (s: Seg) => <GiaoTiep s={s} />},
  {id: '08-khi-moi-thu-hong', label: 'CHƯƠNG 8 · CHỊU LỖI', node: (s: Seg) => <ChiuLoi s={s} />},
  {id: '09-bao-mat-nhieu-lop', label: 'CHƯƠNG 9 · BẢO MẬT', node: (s: Seg) => <BaoMat s={s} />},
  {id: '10-biet-chuyen-gi-dang-xay-ra', label: 'CHƯƠNG 10 · GIÁM SÁT', node: (s: Seg) => <GiamSat s={s} />},
  {id: '11-khep-lai', label: 'KHÉP LẠI', node: (s: Seg) => <KhepLai s={s} />},
].filter((x) => TIMING.segments[x.id]);
const KEYWORDS = ['System Design', 'đáp án đúng', 'mười chương', 'thiết kế hoàn hảo', 'ví dụ đời thường', 'lượng người dùng', 'bài toán mở', 'load balancer', 'Load balancer',
  'message queue', 'Message queue', 'replication', 'failover', 'Quorum', 'định lý CAP', 'sharding', 'consistent hashing', 'Index', 'cache-aside', 'Cache', 'backpressure',
  'Idempotency', 'idempotency key', 'Khóa bi quan', 'Khóa lạc quan', 'HTTP', 'TCP', 'UDP', 'gRPC', 'REST', 'circuit breaker', 'Health check', 'MTBF', 'JWT', 'OAuth2', 'RBAC',
  'Monitoring', 'Observability', 'Metrics', 'Logs', 'Traces', 'SQL', 'NoSQL', 'CDN', 'latency', 'throughput', 'cache', 'hàng đợi', 'đánh đổi'];

// ---- title card -------------------------------------------------------------------------------------------
const TitleCard: FC = () => {
  const f = useCurrentFrame(), t = THEME, p = t.palette, out = 1 - grow(f, 170, 195);
  const xs = [560, 960, 1360];
  return <AbsoluteFill style={{opacity: out}}>
    <Stage>
      <g opacity={.35}>
        <DiagramWire t={t} f={f} pts={[[960, 150], [960, 250]]} at={6} />
        {xs.map((x, k) => <DiagramWire key={k} t={t} f={f} pts={[[960, 300], [x, 380]]} at={12 + k * 4} />)}
        <DiagramNode t={t} f={f} x={960} y={110} w={150} h={70} kind="phone" at={0} />
        <DiagramNode t={t} f={f} x={960} y={280} w={200} h={64} kind="lb" at={4} />
        {xs.map((x, k) => <DiagramNode key={k} t={t} f={f} x={x} y={430} w={150} h={90} kind="server" at={10 + k * 4} />)}
        {xs.map((x, k) => <DiagramPacket key={k} t={t} f={f} pts={[[960, 300], [x, 380]]} at={30} period={34} count={2} r={7} />)}
      </g>
      <Label t={t} x={960} y={640} size={132} opacity={grow(f, 18, 40)}>System Design</Label>
      <Label t={t} x={960} y={730} size={58} color={p.accent} opacity={grow(f, 34, 56)}>Tóm tắt cả cuốn sách</Label>
      <Label t={t} x={960} y={820} size={36} weight={400} color={p.muted} opacity={grow(f, 50, 72)}>Hướng dẫn cách tiếp cận phỏng vấn System Design · Nguyễn Thế Huy</Label>
    </Stage>
  </AbsoluteFill>;
};

// ---- 00 · opening -----------------------------------------------------------------------------------------
const MoDau: FC<{s: Seg}> = ({s}) => {
  const {f, fps, at, sec} = useBeat(s), t = THEME, p = t.palette;
  const b1 = fade(f, 0, at(2) + 6), b2 = fade(f, at(2) - 6, at(3) + 6), b3 = fade(f, at(3) - 6, at(4) + 6), b4 = fade(f, at(4) - 6, at(5) + 6), b5 = fade(f, at(5) - 6, sec(s.duration) + 30);
  const servers = [800, 1000, 1200];
  return <Stage>
    {/* 1 · a whiteboard, a 45-minute clock and one prompt; then what is missing */}
    <g opacity={b1}>
      <rect x={300} y={130} width={1320} height={700} rx={26} fill={p.surface} stroke={p.muted} strokeWidth={3} opacity={.9} />
      <Timer t={t} f={f} fps={fps} x={1450} y={230} seconds={45 * 60} at={sec(.4)} size={80} />
      <CodeCard t={t} f={f} x={380} y={190} w={860} title="de-bai.txt" at={sec(1.2)} cps={1.8} size={40} prose
        lines={['Thiết kế một ứng dụng', 'chia sẻ ảnh.']} highlight={[1]} />
      {[['Yêu cầu chi tiết', 0], ['Viết code', 1.5], ['Đáp án đúng', 3.1]].map(([text, d], k) => <g key={k} opacity={grow(f, at(1, d as number), at(1, d as number) + 10)}>
        <Label t={t} x={560} y={530 + k * 92} anchor="start" size={46} color={p.ink}>{text as string}</Label>
        <Mark t={t} f={f} x={490} y={515 + k * 92} ok={false} at={at(1, (d as number) + .2)} size={44} />
      </g>)}
    </g>
    {/* 2 · the round itself: a sketch of a photo app that starts working */}
    <g opacity={b2}>
      <Chip t={t} f={f} x={960} y={150} text="System Design Interview" at={at(2)} size={40} tone="accent" />
      <DiagramWire t={t} f={f} pts={[[330, 520], [520, 520]]} at={at(2, 1)} />
      {servers.map((x, k) => <DiagramWire key={k} t={t} f={f} pts={[[680, 520], [x - 90, 380 + k * 140]]} at={at(2, 1.6) + k * 4} />)}
      {servers.map((x, k) => <DiagramWire key={`d${k}`} t={t} f={f} pts={[[x + 90, 380 + k * 140], [1440, 450]]} at={at(2, 2.6) + k * 4} arrow={false} />)}
      {servers.map((x, k) => <DiagramWire key={`s${k}`} t={t} f={f} pts={[[x + 90, 380 + k * 140], [1440, 690]]} at={at(2, 2.9) + k * 4} arrow={false} dashed />)}
      <DiagramNode t={t} f={f} x={250} y={520} w={150} h={150} kind="phone" label="App" at={at(2, .4)} />
      <DiagramNode t={t} f={f} x={600} y={520} w={160} h={110} kind="lb" at={at(2, .8)} state="key" />
      {servers.map((x, k) => <DiagramNode key={k} t={t} f={f} x={x} y={380 + k * 140} w={180} h={110} kind="server" at={at(2, 1.2) + k * 4} />)}
      <DiagramNode t={t} f={f} x={1540} y={450} w={200} h={150} kind="db" label="Database" at={at(2, 2.2)} />
      <DiagramNode t={t} f={f} x={1540} y={690} w={200} h={150} kind="cdn" label="Kho ảnh" at={at(2, 2.6)} />
      <DiagramPacket t={t} f={f} pts={[[330, 520], [520, 520]]} at={at(2, 2.4)} period={26} count={2} />
      {servers.map((x, k) => <DiagramPacket key={k} t={t} f={f} pts={[[680, 520], [x - 90, 380 + k * 140]]} at={at(2, 2.8)} period={30} count={2} />)}
      <Chip t={t} f={f} x={720} y={830} text="được nhận" at={at(2, 5.2)} size={36} tone="accent" />
      <Chip t={t} f={f} x={1080} y={830} text="mức đãi ngộ" at={at(2, 6.2)} size={36} tone="accent" />
    </g>
    {/* 3 · the book */}
    <g opacity={b3}>
      <foreignObject x={420} y={170} width={430} height={610}>
        <Img src={staticFile('system-design-tong-quan/images/book-cover.jpg')} style={{width: '100%', height: '100%', objectFit: 'contain', borderRadius: 12,
          transform: `translateY(${(1 - grow(f, at(3), at(3) + 16)) * 30}px)`, opacity: grow(f, at(3), at(3) + 16)}} />
      </foreignObject>
      <Label t={t} x={940} y={360} anchor="start" size={84} opacity={grow(f, at(3, .3), at(3, .9))}>System Design</Label>
      <Label t={t} x={940} y={440} anchor="start" size={40} weight={400} color={p.ink} opacity={grow(f, at(3, .8), at(3, 1.4))}>Hướng dẫn cách tiếp cận</Label>
      <Label t={t} x={940} y={492} anchor="start" size={40} weight={400} color={p.ink} opacity={grow(f, at(3, .8), at(3, 1.4))}>phỏng vấn System Design</Label>
      <Label t={t} x={940} y={590} anchor="start" size={38} color={p.accent} opacity={grow(f, at(3, 1.4), at(3, 2))}>Nguyễn Thế Huy</Label>
      <Label t={t} x={940} y={650} anchor="start" size={34} weight={400} color={p.muted} opacity={grow(f, at(3, 1.8), at(3, 2.4))}>Ebook · 10 chương · 94 trang</Label>
    </g>
    {/* 4 · ten chapters as a route a request travels */}
    <g opacity={b4}><ChapterRoute f={f} start={at(4)} len={at(5) - at(4)} /></g>
    {/* 5 · what every part brings: an everyday example and a line for the interview */}
    <g opacity={b5}>
      <rect x={250} y={220} width={640} height={500} rx={22} fill={p.surface} stroke={p.accent2} strokeWidth={3} opacity={grow(f, at(5), at(5) + 12)} />
      <Label t={t} x={570} y={300} size={44} color={p.accent2} opacity={grow(f, at(5), at(5) + 12)}>Ví dụ đời thường</Label>
      <TollBooth f={f} x={570} y={500} at={at(5, .6)} />
      <CodeCard t={t} f={f} x={1010} y={220} w={680} title="phong-van.md" at={at(5, 2.4)} cps={3} size={38} prose
        lines={['"Em sẽ đặt load balancer', ' trước các server, và dùng', ' cache cho dữ liệu đọc', ' nhiều…"']} highlight={[0]} />
    </g>
  </Stage>;
};

// A toll booth with cars passing: latency is one car's wait, throughput is cars per minute (book, PDF 12).
const TollBooth: FC<{f: number; x: number; y: number; at: number}> = ({f, x, y, at}) => {
  const t = THEME, p = t.palette, k = grow(f, at, at + 14);
  return <g transform={`translate(${x} ${y})`} opacity={k}>
    <path d="M-260 60 H260" stroke={p.muted} strokeWidth={3} strokeDasharray="18 14" />
    <rect x={-30} y={-90} width={60} height={110} rx={8} fill={p.background} stroke={p.accent} strokeWidth={3} />
    <path d={`M30 -40 L${30 + 150 * (1 - Math.abs(Math.sin((f - at) / 18)))} -40`} stroke={p.accent} strokeWidth={6} strokeLinecap="round" />
    {[0, 1, 2].map((i) => {const ph = (((f - at) / 70 + i / 3) % 1), cx = -260 + ph * 520;return <g key={i} transform={`translate(${cx} 30)`} opacity={Math.min(1, ph * 6, (1 - ph) * 6)}>
      <rect x={-34} y={-22} width={68} height={34} rx={8} fill={p.accent2} /><circle cx={-18} cy={14} r={8} fill={p.ink} /><circle cx={18} cy={14} r={8} fill={p.ink} /></g>;})}
    <Label t={t} x={0} y={140} size={34} weight={400} color={p.muted}>trạm thu phí · chương 2</Label>
  </g>;
};

// Ten chapters laid out as a route; a packet travels it and lights each stop.
const CHAPTERS = ['Phỏng vấn', 'Nền tảng', 'Nhất quán', 'Dữ liệu', 'Mở rộng', 'Idempotency', 'Giao tiếp', 'Chịu lỗi', 'Bảo mật', 'Giám sát'];
const ChapterRoute: FC<{f: number; start: number; len: number}> = ({f, start, len}) => {
  const t = THEME, p = t.palette;
  const pos = CHAPTERS.map((_, i) => [i < 5 ? 260 + i * 350 : 260 + (9 - i) * 350, i < 5 ? 330 : 640] as [number, number]);
  const route: [number, number][] = [...pos.slice(0, 5), [1660, 485], ...pos.slice(5)];
  const travel = grow(f, start + 6, start + len - 10);
  return <g>
    <DiagramWire t={t} f={f} pts={route} at={start} dur={Math.max(20, len - 20)} dashed arrow={false} />
    {pos.map(([x, y], i) => {const lit = travel >= (i < 5 ? i / 10.5 : (i + .5) / 10.5);return <g key={i}>
      <DiagramNode t={t} f={f} x={x} y={y} w={250} h={120} kind="none" at={start + i * 3} state={lit ? 'key' : 'dim'} />
      <Label t={t} x={x} y={y - 6} size={30} mono color={lit ? p.accent : p.muted}>{String(i + 1).padStart(2, '0')}</Label>
      <Label t={t} x={x} y={y + 36} size={34} color={lit ? p.ink : p.muted}>{CHAPTERS[i]}</Label>
    </g>;})}
    <DiagramPacket t={t} f={f} pts={route} at={start + 6} until={start + len + 40} period={Math.max(30, len - 16)} count={1} r={12} />
  </g>;
};

// ---- 01 · what the round checks (review build: up to the list of pitfalls) ---------------------------------
const VongPhongVan: FC<{s: Seg}> = ({s}) => {
  const {f, fps, at} = useBeat(s), t = THEME, p = t.palette;
  const b1 = fade(f, 0, at(2) + 6), b2 = fade(f, at(2) - 6, at(3) + 6), b3 = fade(f, at(3) - 6, s.sentences[8] === undefined ? Math.round(s.length * fps) + 60 : at(8) + 6);
  const users = grow(f, at(2, 4.5), at(2, 7.5));
  const pitfalls: {title: string; sentence: number; draw: (x: number, y: number, a: number) => ReactNode}[] = [
    {title: 'Câu hỏi\nquá mở', sentence: 4, draw: (x, y, a) => <g>
      {[-1, 0, 1].map((k) => <DiagramWire key={k} t={t} f={f} pts={[[x, y + 50], [x + k * 90, y - 40]]} at={a + 6 + Math.abs(k) * 3} dur={14} />)}
      <Label t={t} x={x} y={y + 110} size={64} mono color={p.accent}>?</Label></g>},
    {title: 'Chưa làm\nhệ thống lớn', sentence: 5, draw: (x, y, a) => <g>
      <DiagramNode t={t} f={f} x={x - 62} y={y} w={104} h={96} kind="cache" at={a + 4} state="dim" />
      <DiagramNode t={t} f={f} x={x + 62} y={y} w={104} h={96} kind="queue" at={a + 8} state="dim" />
      <Label t={t} x={x} y={y + 110} size={52} color={p.accent} opacity={grow(f, a + 14, a + 22)}>?  ?</Label></g>},
    {title: '45–60 phút', sentence: 6, draw: (x, y, a) => <g>
      <circle cx={x} cy={y + 20} r={70} fill="none" stroke={p.muted} strokeWidth={6} opacity={grow(f, a, a + 10)} />
      <circle cx={x} cy={y + 20} r={70} fill="none" stroke={p.accent} strokeWidth={8} pathLength={1} strokeDasharray={`${grow(f, a + 6, a + 6 + 5 * fps)} 1`} transform={`rotate(-90 ${x} ${y + 20})`} />
      <Timer t={t} f={f} fps={fps} x={x} y={y + 36} seconds={45 * 60} at={a + 6} size={40} /></g>},
    {title: 'Thiết kế\nhoàn hảo', sentence: 7, draw: (x, y, a) => <g>
      <path d={`M${x} ${y - 60} L${x + 22} ${y - 10} L${x + 76} ${y - 6} L${x + 34} ${y + 30} L${x + 48} ${y + 84} L${x} ${y + 54} L${x - 48} ${y + 84} L${x - 34} ${y + 30} L${x - 76} ${y - 6} L${x - 22} ${y - 10} Z`}
        fill="none" stroke={p.accent} strokeWidth={5} strokeLinejoin="round" opacity={grow(f, a, a + 10)} />
      <Mark t={t} f={f} x={x} y={y + 14} ok={false} at={a + 14} size={120} /></g>},
  ];
  return <Stage>
    {/* 1 · the question, then the kind of prompt you get */}
    <g opacity={b1}>
      <Label t={t} x={960} y={380} size={80} opacity={grow(f, 4, 20)}>Người phỏng vấn muốn thấy gì?</Label>
      <Chip t={t} f={f} x={700} y={580} text="Dịch vụ nhắn tin" at={at(1, 1.4)} size={44} />
      <Chip t={t} f={f} x={1220} y={580} text="Nền tảng xem phim" at={at(1, 3)} size={44} />
      <Label t={t} x={960} y={720} size={36} weight={400} color={p.muted} opacity={grow(f, at(1, 3.6), at(1, 4.2))}>bài toán mở · không có đáp án cố định</Label>
    </g>
    {/* 2 · components, how they talk, and whether it holds the users */}
    <g opacity={b2}>
      <DiagramWire t={t} f={f} pts={[[330, 470], [560, 470]]} at={at(2, .8)} />
      <DiagramWire t={t} f={f} pts={[[800, 470], [1060, 470]]} at={at(2, 1.2)} />
      <DiagramWire t={t} f={f} pts={[[1300, 470], [1530, 470]]} at={at(2, 1.6)} />
      <DiagramWire t={t} f={f} pts={[[1180, 540], [1180, 640], [330, 640], [330, 560]]} at={at(2, 2.2)} dur={26} dashed />
      <DiagramNode t={t} f={f} x={230} y={470} w={170} h={150} kind="phone" label="Người gửi" labelSize={30} at={at(2)} />
      <DiagramNode t={t} f={f} x={680} y={470} w={220} h={150} kind="service" label="Chat" at={at(2, .4)} state="key" />
      <DiagramNode t={t} f={f} x={1180} y={470} w={220} h={150} kind="queue" label="Hàng đợi" labelSize={30} at={at(2, .8)} />
      <DiagramNode t={t} f={f} x={1640} y={470} w={190} h={150} kind="db" label="Lưu tin" labelSize={30} at={at(2, 1.2)} />
      {[[[330, 470], [560, 470]], [[800, 470], [1060, 470]], [[1300, 470], [1530, 470]]].map((pts, k) =>
        <DiagramPacket key={k} t={t} f={f} pts={pts as [number, number][]} at={at(2, 2.6)} period={Math.round(40 - 22 * users)} count={1 + Math.round(3 * users)} />)}
      <Chip t={t} f={f} x={430} y={250} text="thành phần" at={at(2, 1)} size={34} />
      <Chip t={t} f={f} x={930} y={250} text="giao tiếp" at={at(2, 2.4)} size={34} />
      <Chip t={t} f={f} x={1430} y={250} text="chịu tải" at={at(2, 4.4)} size={34} tone="accent" />
      <Label t={t} x={960} y={790} size={36} weight={400} color={p.muted} opacity={grow(f, at(2, 4.5), at(2, 5))}>người dùng</Label>
      <rect x={560} y={820} width={800} height={22} rx={11} fill={p.surface} opacity={grow(f, at(2, 4.5), at(2, 5))} />
      <rect x={560} y={820} width={800 * (.06 + .94 * users)} height={22} rx={11} fill={users > .8 ? p.accent : p.accent2} opacity={grow(f, at(2, 4.5), at(2, 5))} />
      <text x={1390} y={840} fontFamily={MONO} fontWeight={700} fontSize={36} fill={p.ink} opacity={grow(f, at(2, 4.5), at(2, 5))}>{users < .5 ? '1 nghìn' : users < 1 ? '…' : '1 triệu'}</text>
    </g>
    {/* 3 · where newcomers trip */}
    <g opacity={b3}>
      <Label t={t} x={960} y={190} size={60} opacity={grow(f, at(3), at(3) + 12)}>Người mới hay vấp ở đâu</Label>
      {pitfalls.map(({title, sentence, draw}, k) => {const x = 330 + k * 420, a = at(sentence), y = 520;return <g key={k} opacity={grow(f, a, a + 12)}>
        <rect x={x - 180} y={300} width={360} height={470} rx={22} fill={p.surface} stroke={p.accent2} strokeWidth={3} />
        {draw(x, y - 70, a)}
        {title.split('\n').map((line, i, all) => <Label key={i} t={t} x={x} y={712 - (all.length - 1 - i) * 42} size={36}>{line}</Label>)}
      </g>;})}
    </g>
    {/* 4 · the repeatable method (Chapters.tsx) */}
    {s.sentences[8] === undefined ? null : <PhuongPhap s={s} />}
  </Stage>;
};

// ---- captions, chapter label, progress --------------------------------------------------------------------
// Timeline caption pages (absolute ms), shown at the root so they never restart with a segment.
const Captions: FC = () => {
  const f = useCurrentFrame(), {fps} = useVideoConfig(), ms = f / fps * 1000;
  const page = CAPTIONS.find((x) => ms >= x.startMs && ms < x.endMs + 120);
  if (!page) return null;
  const kw = KEYWORDS.find((k) => page.text.includes(k)) ?? '';
  return <ThemeCaption theme={THEME} text={page.text} keyword={kw} top={930} size={52} />;
};
const ChapterTag: FC<{label: string}> = ({label}) => {
  const f = useCurrentFrame(), p = THEME.palette;
  return <div style={{position: 'absolute', left: 64, top: 44, fontFamily: FONT, fontWeight: 700, fontSize: 34, letterSpacing: 3, color: p.accent2, opacity: grow(f, 4, 20)}}>{label}</div>;
};

// ---- the whole review build -------------------------------------------------------------------------------
const plan = (fps: number) => SEGMENTS.map((seg) => {
  const s = TIMING.segments[seg.id];
  return {...seg, s, from: Math.round(s.start * fps), frames: Math.round((s.start + s.length) * fps) - Math.round(s.start * fps)};
});
export const totalFrames = (fps: number) => {const p = plan(fps), last = p[p.length - 1];return last.from + last.frames + Math.round(TIMING.endPadSeconds * fps);};
export const metadata: CalculateMetadataFunction<Record<string, unknown>> = ({props}) => ({durationInFrames: totalFrames(30), props});

const Music: FC = () => {
  const {fps, durationInFrames} = useVideoConfig(), m = music as typeof music;
  const voiceIn = Math.round(TITLE_SECONDS * fps);
  // Loud on the title card, down to the steady bed by the time the voice starts; flat under narration.
  const volume = (f: number) => f < voiceIn - 30 ? m.titleVolume : f < voiceIn + 20 ? m.titleVolume + (m.speechVolume - m.titleVolume) * (f - voiceIn + 30) / 50 : m.speechVolume;
  const title = `${m.credit.artists.join(', ')} – ${m.credit.title}`;
  return <Track name={`Nhạc nền · ${title} · chỉnh đầu/cuối trong Edit`}>
    <MusicFade fadeInSeconds={m.fadeInSeconds} fadeOutSeconds={m.fadeOutSeconds}>
      <Audio name={title} src={staticFile(m.file)} from={0} durationInFrames={durationInFrames} volume={volume} loop />
    </MusicFade>
  </Track>;
};

const Progress: FC<{total: number}> = ({total}) => {
  const f = useCurrentFrame(), p = THEME.palette;
  return <div style={{position: 'absolute', left: 0, bottom: 0, height: 6, width: `${100 * f / total}%`, background: p.accent2, opacity: .7}} />;
};

export const SystemDesignVideo: FC = () => {
  const {fps} = useVideoConfig(), parts = plan(fps), total = totalFrames(fps), f = useCurrentFrame();
  return <AbsoluteFill style={{background: THEME.palette.background, fontFamily: FONT}}>
    <ThemeBackground theme={THEME} frame={f} />
    <Sequence name="Màn tên video" durationInFrames={Math.round(TITLE_SECONDS * fps) + 10}><TitleCard /></Sequence>
    {parts.map((x) => <Sequence key={x.id} name={x.id} from={x.from} durationInFrames={x.frames}>
      <AbsoluteFill>{x.node(x.s)}</AbsoluteFill>
      <ChapterTag label={x.label} />
      <Audio name={`Giọng · ${x.id}`} src={staticFile(`system-design-tong-quan/audio/${x.s.file}`)} />
    </Sequence>)}
    <Captions />
    <Music />
    <Progress total={total} />
  </AbsoluteFill>;
};
