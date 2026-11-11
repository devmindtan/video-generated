import type {FC, ReactNode} from 'react';
import {Img, staticFile} from 'remotion';
import {Chip, CodeCard, DiagramNode, DiagramPacket, DiagramWire, Label, MONO, Mark, grow} from '../../looks/diagram-kit';
import {Stage, THEME, useBeat} from './common';
import type {Seg} from './common';

// Chapter scenes for Kiến trúc ứng dụng web: tóm tắt cả cuốn sách. Every picture beat starts at an authored
// sentence (timing.json -> sentences), and every position is in the 1920×1080 Stage space. The drawing language is
// the technical blueprint: components, interfaces, dependency arrows and working packets.

type BoxProps = {x: number; y: number; w: number; h: number; children?: ReactNode; accent?: boolean; dim?: boolean; opacity?: number};
const Box: FC<BoxProps> = ({x, y, w, h, children, accent, dim, opacity = 1}) => {
  const p = THEME.palette;
  return <g opacity={opacity}>
    <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={18} fill={p.surface} stroke={accent ? p.accent : p.accent2} strokeWidth={3} opacity={dim ? .45 : 1} />
    {children}
  </g>;
};
const Row: FC<{x: number; y: number; text: string; ok?: boolean; size?: number; color?: string; f?: number; at?: number}> = ({x, y, text, ok, size = 36, color, f = 0, at = 0}) =>
  <g>
    <Mark t={THEME} f={f} x={x - 40} y={y - size * .32} ok={ok ?? true} at={at} size={size * .72} />
    <Label t={THEME} x={x} y={y} anchor="start" size={size} color={color} weight={400}>{text}</Label>
  </g>;

// ---- 00 · opening -------------------------------------------------------------------------------------------
export const MoDau: FC<{s: Seg}> = ({s}) => {
  const {f, at, span} = useBeat(s), t = THEME, p = t.palette;
  const b1 = span(0, 2), b2 = span(3, 4), b3 = span(5, 6), b4 = span(7, 8), b5 = span(9, 9);
  const chapters = ['Trộn lẫn', 'Ranh giới', 'Domain + Repo', 'Đọc / ghi', 'Use case', 'Ba tầng', 'Ports'];
  return <Stage>
    <g opacity={b1}>
      <rect x={190} y={150} width={880} height={520} rx={18} fill={p.background} stroke={p.muted} strokeWidth={2} opacity={grow(f, at(0), at(0) + 12)} />
      <Label t={t} x={220} y={196} anchor="start" size={30} mono color={p.muted}>OrderController.php</Label>
      {['public function orderEbook(Request $req) {', "  $price = DB::table('ebooks')->value('price');", '  $amount = $quantity * $price;', "  DB::table('orders')->insert([...]);", "  session()->put('currentOrderId', $id);", '}'].map((line, i) =>
        <Label key={i} t={t} x={224} y={260 + i * 62} anchor="start" size={26} mono color={i === 1 || i === 3 ? p.accent : p.ink} opacity={grow(f, at(0, .5 + i * .18), at(0, .5 + i * .18) + 10)}>{line}</Label>)}
      <DiagramNode t={t} f={f} x={1250} y={300} w={210} h={140} kind="db" label="Database" at={at(1, .2)} />
      <DiagramNode t={t} f={f} x={1250} y={560} w={210} h={140} kind="box" label="Session" at={at(1, .8)} />
      <DiagramWire t={t} f={f} pts={[[1070, 300], [1145, 300]]} at={at(1, .3)} />
      <DiagramWire t={t} f={f} pts={[[1070, 560], [1145, 560]]} at={at(1, .9)} />
      <DiagramPacket t={t} f={f} pts={[[1070, 300], [1145, 300]]} at={at(1, 1.2)} period={30} count={2} />
      <Chip t={t} f={f} x={1640} y={300} text="giá" at={at(1, 1.4)} size={30} />
      <Chip t={t} f={f} x={1640} y={560} text="order id" at={at(1, 1.9)} size={30} />
      <g opacity={grow(f, at(2), at(2) + 12)}>
        <Mark t={t} f={f} x={620} y={755} ok at={at(2, .2)} size={48} />
        <Label t={t} x={670} y={768} anchor="start" size={44} color={p.accent2}>chạy đúng</Label>
      </g>
    </g>
    <g opacity={b2}>
      <Label t={t} x={960} y={240} size={54} opacity={grow(f, at(3), at(3) + 12)}>Nhưng sửa thì sửa ở đâu?</Label>
      {['đổi sang PostgreSQL', 'thêm job gửi mail', 'viết test tính tiền'].map((text, k) =>
        <g key={k} opacity={grow(f, at(4, k * .9), at(4, k * .9) + 12)}>
          <rect x={280 + k * 470} y={400} width={420} height={210} rx={20} fill={p.surface} stroke={p.accent} strokeWidth={3} />
          <Label t={t} x={490 + k * 470} y={505} size={38}>{text}</Label>
          <Label t={t} x={490 + k * 470} y={560} size={30} weight={400} color={p.muted}>sửa những file nào?</Label>
        </g>)}
      <DiagramWire t={t} f={f} pts={[[960, 640], [960, 720]]} at={at(4, 2.8)} />
      <Chip t={t} f={f} x={960} y={790} text="tách nghiệp vụ khỏi hạ tầng" at={at(4, 3.4)} size={34} tone="accent" />
    </g>
    <g opacity={b3}>
      <foreignObject x={420} y={150} width={420} height={610}>
        <Img src={staticFile('kien-truc-ung-dung-web-tong-quan/images/book-cover.jpg')} style={{width: '100%', height: '100%', objectFit: 'contain', borderRadius: 12,
          transform: `translateY(${(1 - grow(f, at(5), at(5) + 16)) * 30}px)`, opacity: grow(f, at(5), at(5) + 16)}} />
      </foreignObject>
      <Label t={t} x={880} y={330} anchor="start" size={66} opacity={grow(f, at(5, .3), at(5, .9))}>Kiến trúc ứng dụng web</Label>
      <Label t={t} x={880} y={420} anchor="start" size={40} weight={400} color={p.ink} opacity={grow(f, at(5, .9), at(5, 1.5))}>Từ controller trộn lẫn</Label>
      <Label t={t} x={880} y={474} anchor="start" size={40} weight={400} color={p.ink} opacity={grow(f, at(5, .9), at(5, 1.5))}>đến port và adapter</Label>
      <Label t={t} x={880} y={570} anchor="start" size={38} color={p.accent} opacity={grow(f, at(6, .2), at(6, .8))}>Nguyễn Thế Huy</Label>
      <Label t={t} x={880} y={630} anchor="start" size={34} weight={400} color={p.muted} opacity={grow(f, at(6, .6), at(6, 1.2))}>Ebook · 7 chương · 60 trang</Label>
    </g>
    <g opacity={b4}>
      <Label t={t} x={960} y={190} size={46} opacity={grow(f, at(7), at(7) + 12)}>Bảy chương, một ví dụ</Label>
      {chapters.map((c, k) => {
        const x = k < 4 ? 250 + k * 360 : 430 + (k - 4) * 360, y = k < 4 ? 390 : 610, lit = grow(f, at(7, 1 + k * .55), at(7, 1.6 + k * .55));
        return <g key={c} opacity={grow(f, at(7, .4 + k * .35), at(7, .8 + k * .35))}>
          <DiagramNode t={t} f={f} x={x} y={y} w={280} h={120} kind="none" state={lit > .5 ? 'key' : 'dim'} at={at(7, .4 + k * .35)} />
          <Label t={t} x={x} y={y - 8} size={28} mono color={lit > .5 ? p.accent : p.muted}>{String(k + 1).padStart(2, '0')}</Label>
          <Label t={t} x={x} y={y + 38} size={32} color={lit > .5 ? p.ink : p.muted}>{c}</Label>
        </g>;
      })}
      <DiagramPacket t={t} f={f} pts={[[250, 390], [1330, 390], [1330, 610], [790, 610]]} at={at(8)} until={at(9)} period={110} count={1} />
      <Chip t={t} f={f} x={960} y={800} text="cùng chức năng đặt hàng e-book" at={at(8, 1.2)} size={34} />
    </g>
    <g opacity={b5}>
      <Box x={960} y={470} w={1060} h={520} accent opacity={grow(f, at(9), at(9) + 14)}>
        <Label t={t} x={960} y={300} size={44} color={p.muted} opacity={grow(f, at(9, .2), at(9, .6))}>câu hỏi dùng mỗi ngày</Label>
        <Label t={t} x={960} y={430} size={50} opacity={grow(f, at(9, .5), at(9, 1))}>Chạy được một mình, trong bộ nhớ,</Label>
        <Label t={t} x={960} y={500} size={50} opacity={grow(f, at(9, .8), at(9, 1.3))}>không cần database, không cần framework?</Label>
      </Box>
      <Chip t={t} f={f} x={720} y={660} text="có → nghiệp vụ" at={at(9, 1.6)} size={36} tone="accent2" />
      <Chip t={t} f={f} x={1210} y={660} text="không → hạ tầng" at={at(9, 2.1)} size={36} tone="accent" />
    </g>
  </Stage>;
};

// ---- 01 · when business and infrastructure share one function ----------------------------------------------
export const TranLan: FC<{s: Seg}> = ({s}) => {
  const {f, at, span} = useBeat(s), t = THEME, p = t.palette;
  const b1 = span(0, 3), b2 = span(4, 6), b3 = span(7, 9), b4 = span(10, 15), b5 = span(16, 22);
  const problems = ['chỉ thấy công nghệ, không thấy nghiệp vụ', 'đổi công nghệ kéo theo sửa logic', 'test phải mang theo môi trường', 'dữ liệu không được bảo đảm hợp lệ', 'nhanh chóng thành legacy'];
  const benefits = ['đọc như một câu chuyện nghiệp vụ', 'test chạy trong bộ nhớ', 'đổi hạ tầng chỉ sửa hạ tầng', 'người mới đọc một file là hiểu'];
  return <Stage>
    <g opacity={b1}>
      <Label t={t} x={960} y={150} size={48} opacity={grow(f, at(0), at(0) + 12)}>Một hàm, bốn thứ khác nhau</Label>
      <CodeCard t={t} f={f} x={150} y={210} w={860} title="OrderController.php" at={at(1, .2)} cps={2.2} size={26}
        lines={["$price = DB::table('ebooks')", '  ->value(\'price\');', '$amount = $quantity * $price;', "$id = DB::table('orders')", '  ->insertGetId([...]);', "session()->put('currentOrderId', $id);"]}
        highlight={[0, 1, 3, 4, 5]} />
      <DiagramNode t={t} f={f} x={1280} y={250} w={220} h={120} kind="db" label="Database" labelSize={28} at={at(2, .2)} />
      <DiagramNode t={t} f={f} x={1280} y={410} w={220} h={120} kind="box" label="Session" labelSize={28} at={at(2, .5)} />
      <DiagramNode t={t} f={f} x={1280} y={570} w={220} h={120} kind="box" label="Framework" labelSize={28} at={at(2, .8)} />
      <DiagramNode t={t} f={f} x={1280} y={730} w={220} h={120} kind="box" label="Tính tiền" labelSize={28} at={at(3, .3)} state="key" />
      <DiagramWire t={t} f={f} pts={[[1030, 250], [1165, 250]]} at={at(2, .3)} />
      <DiagramWire t={t} f={f} pts={[[1030, 410], [1165, 410]]} at={at(2, .6)} />
      <DiagramWire t={t} f={f} pts={[[1030, 570], [1165, 570]]} at={at(2, .9)} />
      <DiagramWire t={t} f={f} pts={[[1030, 730], [1165, 730]]} at={at(3, .4)} color={p.accent} />
      <Label t={t} x={960} y={830} size={30} weight={400} color={p.muted} opacity={grow(f, at(3, 1), at(3, 1.6))}>một câu nghiệp vụ · ba thứ hạ tầng</Label>
    </g>
    <g opacity={b2}>
      <Label t={t} x={960} y={200} size={46}>Cái giá của việc dính chung</Label>
      {[['test', 'phải dựng database thật'], ['đổi lưu trữ', 'phải sửa chỗ không nói lưu trữ'], ['dữ liệu', 'email, số lượng: không ai kiểm']].map(([title, sub], k) =>
        <g key={k} opacity={grow(f, at(4 + k, 0), at(4 + k, 0) + 14)}>
          <Box x={380 + k * 580} y={450} w={480} h={280} accent>
            <Label t={t} x={380 + k * 580} y={390} size={42} color={p.accent}>{title}</Label>
            <Label t={t} x={380 + k * 580} y={470} size={28} weight={400}>{sub}</Label>
            <Mark t={t} f={f} x={380 + k * 580} y={560} ok={false} at={at(4 + k, .8)} size={54} />
          </Box>
        </g>)}
    </g>
    <g opacity={b3}>
      <Label t={t} x={960} y={180} size={48} opacity={grow(f, at(7), at(7) + 12)}>Sách gọi là code trộn lẫn</Label>
      <Box x={560} y={470} w={540} h={230} accent opacity={grow(f, at(8, .4), at(8, .4) + 12)}>
        <Label t={t} x={560} y={420} size={36} color={p.accent}>nghiệp vụ</Label>
        <Label t={t} x={560} y={480} size={30} weight={400}>đơn gồm gì, giá bao nhiêu</Label>
        <Label t={t} x={560} y={540} size={26} weight={400} color={p.muted}>một câu duy nhất</Label>
      </Box>
      <Box x={1330} y={470} w={560} h={230} opacity={grow(f, at(9), at(9) + 12)}>
        <Label t={t} x={1330} y={420} size={36} color={p.accent2}>hạ tầng</Label>
        <Label t={t} x={1330} y={480} size={30} weight={400}>database · session · framework</Label>
        <Label t={t} x={1330} y={540} size={26} weight={400} color={p.muted}>mọi thứ còn lại</Label>
      </Box>
      <DiagramWire t={t} f={f} pts={[[830, 470], [1050, 470]]} at={at(9, .4)} color="#ff6b6b" width={5} />
      <Mark t={t} f={f} x={940} y={470} ok={false} at={at(9, .8)} size={64} />
      <Chip t={t} f={f} x={960} y={700} text="hai thứ dính vào nhau" at={at(9, 1)} size={34} tone="bad" />
    </g>
    <g opacity={b4}>
      <Label t={t} x={960} y={170} size={48}>Khi dính chung, năm chuyện thường xảy ra</Label>
      {problems.map((text, k) => <g key={k} opacity={grow(f, at(11 + k), at(11 + k) + 12)}>
        <Row x={470} y={290 + k * 105} text={text} ok={false} size={40} f={f} at={at(11 + k, .2)} />
      </g>)}
    </g>
    <g opacity={b5}>
      <Label t={t} x={960} y={170} size={48} color={p.accent2}>Khi tách được, lợi ích rất cụ thể</Label>
      {benefits.map((text, k) => <g key={k} opacity={grow(f, at(17 + k), at(17 + k) + 12)}>
        <Row x={430} y={285 + k * 100} text={text} ok size={40} f={f} at={at(17 + k, .2)} />
      </g>)}
      <g opacity={grow(f, at(21), at(21) + 12)}>
        <rect x={1160} y={640} width={520} height={54} rx={27} fill={p.surface} stroke={p.accent} strokeWidth={3} />
        <rect x={1160} y={640} width={520 * grow(f, at(21, .6), at(21, 2))} height={54} rx={27} fill={p.accent} opacity={.6} />
        <Label t={t} x={1420} y={678} size={32} color={p.ink}>2 năm</Label>
        <Label t={t} x={1420} y={740} size={30} weight={400} color={p.muted} opacity={grow(f, at(22), at(22) + 12)}>nhận định của tác giả</Label>
      </g>
    </g>
  </Stage>;
};

// ---- 02 · the core / infrastructure boundary ---------------------------------------------------------------
export const KhacPhuc: FC<{s: Seg}> = ({s}) => {
  const {f, at, span} = useBeat(s), t = THEME, p = t.palette;
  const b1 = span(0, 5), b2 = span(6, 9), b3 = span(10, 13), b4 = span(14, 16), b5 = span(17, 21);
  return <Stage>
    <g opacity={b1}>
      <Label t={t} x={960} y={160} size={54} opacity={grow(f, at(0), at(0) + 12)}>Core hay hạ tầng?</Label>
      <Box x={960} y={410} w={900} h={300} accent opacity={grow(f, at(1), at(1) + 14)}>
        <Label t={t} x={960} y={350} size={54} color={p.accent}>core code = bộ nhớ + CPU</Label>
        <Label t={t} x={960} y={430} size={34} weight={400}>chạy được một mình, không cần gì bên ngoài</Label>
        <Label t={t} x={960} y={490} size={30} weight={400} color={p.muted}>không database · không gọi mạng · không đọc file · không SMTP</Label>
      </Box>
      {[['quy tắc 1', 'không phụ thuộc trực tiếp hệ thống ngoài'], ['quy tắc 2', 'không cần môi trường đặc biệt']].map(([title, sub], k) =>
        <g key={k} opacity={grow(f, at(3 + k), at(3 + k) + 14)}>
          <Box x={480 + k * 960} y={700} w={760} h={180}>
            <Label t={t} x={480 + k * 960} y={660} size={38} color={p.accent2}>{title}</Label>
            <Label t={t} x={480 + k * 960} y={715} size={30} weight={400}>{sub}</Label>
            <Label t={t} x={480 + k * 960} y={760} size={28} weight={400} color={p.muted}>web server · CLI · framework · POST · session</Label>
          </Box>
        </g>)}
      <Chip t={t} f={f} x={960} y={870} text="thiếu một trong hai → hạ tầng" at={at(5)} size={36} tone="accent" />
    </g>
    <g opacity={b2}>
      <Label t={t} x={500} y={180} size={44} color={p.accent2}>core</Label>
      <Label t={t} x={1420} y={180} size={44} color={p.accent}>hạ tầng</Label>
      <rect x={120} y={220} width={800} height={640} rx={22} fill={p.surface} stroke={p.accent2} strokeWidth={3} opacity={grow(f, at(6), at(6) + 12)} />
      <rect x={1000} y={220} width={800} height={640} rx={22} fill={p.surface} stroke={p.accent} strokeWidth={3} opacity={grow(f, at(9), at(9) + 12)} />
      {['hàm tính VAT', 'Order.calculateTotalAmount()', 'OrderService.placeOrder()'].map((text, k) =>
        <g key={k} opacity={grow(f, at(6 + k, .4), at(6 + k, .4) + 12)}><Mark t={t} f={f} x={250} y={330 + k * 120} ok at={at(6 + k, .4)} size={40} /><Label t={t} x={300} y={342 + k * 120} anchor="start" size={36}>{text}</Label></g>)}
      {['câu SQL', 'lời gọi HTTP', 'đọc file', 'controller', 'Eloquent model'].map((text, k) =>
        <g key={k} opacity={grow(f, at(9, .3 + k * .3), at(9, .3 + k * .3) + 12)}><Mark t={t} f={f} x={1130} y={300 + k * 100} ok={false} at={at(9, .3 + k * .3)} size={38} /><Label t={t} x={1180} y={312 + k * 100} anchor="start" size={36}>{text}</Label></g>)}
      <Label t={t} x={500} y={800} size={30} weight={400} color={p.muted} opacity={grow(f, at(8, 1), at(8, 1.6))}>chỉ dùng entity và interface</Label>
    </g>
    <g opacity={b3}>
      <Label t={t} x={960} y={190} size={46} opacity={grow(f, at(10), at(10) + 12)}>hạ tầng = tổng code − core</Label>
      <Label t={t} x={650} y={360} size={40} color={p.muted}>tổng code</Label>
      <Label t={t} x={960} y={360} size={40} color={p.accent}>−</Label>
      <Label t={t} x={1140} y={360} size={40} color={p.accent2}>core</Label>
      <Label t={t} x={960} y={430} size={40} color={p.accent}>= hạ tầng</Label>
      <g opacity={grow(f, at(11), at(11) + 14)}>
        <rect x={420} y={520} width={1080} height={190} rx={18} fill={p.background} stroke={p.muted} strokeWidth={2} />
        <Label t={t} x={960} y={560} size={30} mono color={p.muted}>app/Services/</Label>
        {['PriceCalculator.php', 'OrderRepository.php'].map((text, k) =>
          <g key={text} opacity={grow(f, at(12, k * .5), at(12, k * .5) + 12)}>
            <rect x={480} y={600 + k * 50} width={960} height={42} rx={8} fill={k === 0 ? p.accent + '22' : p.accent2 + '22'} />
            <Label t={t} x={510} y={630 + k * 50} anchor="start" size={30} mono color={k === 0 ? p.accent2 : p.accent}>{text}</Label>
            <Label t={t} x={1360} y={630 + k * 50} anchor="end" size={28} weight={400} color={p.muted}>{k === 0 ? 'core' : 'hạ tầng'}</Label>
          </g>)}
      </g>
      <Label t={t} x={960} y={790} size={34} weight={400} color={p.muted} opacity={grow(f, at(13), at(13) + 12)}>cùng thư mục chưa nói được bản chất</Label>
    </g>
    <g opacity={b4}>
      <Label t={t} x={960} y={190} size={46} opacity={grow(f, at(14), at(14) + 12)}>Bẫy: interface không tự làm nó thành core</Label>
      <Box x={720} y={440} w={520} h={220} accent>
        <Label t={t} x={720} y={400} size={34} mono color={p.accent}>Connection</Label>
        <Label t={t} x={720} y={470} size={30} mono>insert(table, data)</Label>
      </Box>
      <DiagramWire t={t} f={f} pts={[[980, 440], [1240, 440]]} at={at(15)} />
      <DiagramNode t={t} f={f} x={1380} y={440} w={200} h={150} kind="db" label="Database" at={at(15, .5)} state="down" />
      <Chip t={t} f={f} x={1210} y={590} text="vẫn lộ khái niệm database" at={at(15, 1.2)} size={32} tone="bad" />
      <Label t={t} x={960} y={800} size={40} color={p.accent2} opacity={grow(f, at(16), at(16) + 12)}>Che bằng ý nghĩa nghiệp vụ</Label>
    </g>
    <g opacity={b5}>
      <Label t={t} x={960} y={170} size={46} opacity={grow(f, at(17), at(17) + 12)}>Đồng hồ: ví dụ nhỏ, hiệu quả rõ</Label>
      <Box x={380} y={430} w={420} h={200}>
        <Label t={t} x={380} y={380} size={32} mono>Carbon::now()</Label>
        <Label t={t} x={380} y={450} size={32} weight={400}>logic đọc giờ thật</Label>
        <Mark t={t} f={f} x={380} y={530} ok={false} at={at(18, .8)} size={52} />
      </Box>
      <DiagramWire t={t} f={f} pts={[[600, 430], [780, 430]]} at={at(19)} />
      <Box x={960} y={420} w={320} h={160} accent>
        <Label t={t} x={960} y={400} size={34} mono color={p.accent}>Clock</Label>
        <Label t={t} x={960} y={455} size={30} weight={400}>interface</Label>
      </Box>
      {[['SystemClock', 'chạy thật'], ['FakeClock', 'trong test']].map(([name, sub], k) =>
        <g key={name} opacity={grow(f, at(19, .8 + k * .5), at(19, .8 + k * .5) + 12)}>
          <DiagramWire t={t} f={f} pts={[[1120, 420], [1300, 420 + k * 140], [1390, 420 + k * 140]]} at={at(19, .9 + k * .5)} />
          <DiagramNode t={t} f={f} x={1500} y={420 + k * 140} w={240} h={110} kind="box" label={name} labelSize={28} at={at(19, .8 + k * .5)} />
          <Label t={t} x={1500} y={500 + k * 140} size={28} weight={400} color={p.muted}>{sub}</Label>
        </g>)}
      <Chip t={t} f={f} x={960} y={700} text="muốn test lúc nửa đêm: chỉnh FakeClock" at={at(20)} size={34} tone="accent2" />
    </g>
  </Stage>;
};

// ---- 03 · domain model -------------------------------------------------------------------------------------
export const DomainModel: FC<{s: Seg}> = ({s}) => {
  const {f, at, span} = useBeat(s), t = THEME, p = t.palette;
  const b1 = span(0, 2), b2 = span(3, 9), b3 = span(10, 13), b4 = span(14, 19), b5 = span(20, 22);
  return <Stage>
    <g opacity={b1}>
      <Label t={t} x={960} y={180} size={48} opacity={grow(f, at(0), at(0) + 12)}>Hai cách viết cùng một nghiệp vụ</Label>
      <Box x={480} y={460} w={760} h={380} dim>
        <Label t={t} x={480} y={330} size={36} color={p.muted}>Transaction Script</Label>
        {['lấy giá', 'nhân số lượng', 'insert đơn', 'lưu session'].map((text, k) =>
          <Label key={text} t={t} x={380} y={400 + k * 66} anchor="start" size={32} weight={400} opacity={grow(f, at(1, .4 + k * .3), at(1, .4 + k * .3) + 10)}>{k + 1}. {text}</Label>)}
        <Label t={t} x={480} y={700} size={28} weight={400} color={p.muted}>dữ liệu là mảng, không ai giữ luật</Label>
      </Box>
      <Box x={1440} y={460} w={760} h={380} accent opacity={grow(f, at(2), at(2) + 14)}>
        <Label t={t} x={1440} y={330} size={36} color={p.accent}>Domain Model</Label>
        <rect x={1180} y={400} width={520} height={180} rx={14} fill={p.background} stroke={p.accent} strokeWidth={2} />
        <Label t={t} x={1220} y={450} anchor="start" size={30} mono color={p.accent}>Order</Label>
        <Label t={t} x={1220} y={500} anchor="start" size={28} weight={400}>dữ liệu + hành vi</Label>
        <Label t={t} x={1220} y={545} anchor="start" size={28} weight={400}>tự giữ luật của mình</Label>
        <Mark t={t} f={f} x={1440} y={700} ok at={at(2, .8)} size={46} />
      </Box>
    </g>
    <g opacity={b2}>
      <Label t={t} x={960} y={150} size={46}>Entity Order tự bảo vệ</Label>
      <CodeCard t={t} f={f} x={160} y={220} w={820} title="Order.php" at={at(3, .2)} cps={2.6} size={30}
        lines={['new Order(ebookId, email,', '         quantity, pricePerUnit)', '// id <= 0      → lỗi', '// email sai    → lỗi', '// quantity <= 0 → lỗi', '// price < 0    → lỗi', 'totalAmount = quantity * pricePerUnit']} highlight={[2, 3, 4, 5, 6]} />
      <rect x={1080} y={230} width={680} height={480} rx={18} fill={p.surface} stroke={p.accent2} strokeWidth={3} opacity={grow(f, at(4), at(4) + 12)} />
      {[['id > 0', 5], ['email hợp lệ', 6], ['quantity > 0', 7], ['price ≥ 0', 8]].map(([text, sentence], k) =>
        <g key={text} opacity={grow(f, at(sentence as number), at(sentence as number) + 12)}>
          <Mark t={t} f={f} x={1140} y={300 + k * 95} ok at={at(sentence as number, .2)} size={40} />
          <Label t={t} x={1190} y={312 + k * 95} anchor="start" size={34}>{text}</Label>
        </g>)}
      <Chip t={t} f={f} x={1420} y={650} text="tổng tiền do Order tính" at={at(9, .4)} size={32} tone="accent" />
      <Label t={t} x={960} y={790} size={36} weight={400} color={p.muted} opacity={grow(f, at(9, 1.2), at(9, 1.8))}>không phải controller tính</Label>
    </g>
    <g opacity={b3}>
      <Label t={t} x={960} y={170} size={46}>Không có đường tắt để tạo Order sai</Label>
      {['Controller', 'Job', 'Seeder', 'Test'].map((text, k) =>
        <g key={text} opacity={grow(f, at(10, k * .25), at(10, k * .25) + 10)}>
          <DiagramNode t={t} f={f} x={310 + k * 230} y={330} w={190} h={100} kind="none" label={text} labelSize={30} at={at(10, k * .25)} />
          <DiagramWire t={t} f={f} pts={[[310 + k * 230, 380], [960, 520]]} at={at(11, .2 + k * .2)} />
        </g>)}
      <DiagramNode t={t} f={f} x={960} y={590} w={300} h={140} kind="service" label="constructor" labelSize={32} at={at(11)} state="key" />
      <DiagramWire t={t} f={f} pts={[[960, 660], [960, 740]]} at={at(11, 1)} />
      <Chip t={t} f={f} x={960} y={800} text="Order hợp lệ" at={at(11, 1.4)} size={34} tone="accent2" />
      <Label t={t} x={960} y={900} size={34} weight={400} color={p.muted} opacity={grow(f, at(13), at(13) + 12)}>luật nằm một chỗ, không rải ở controller, job, seeder</Label>
    </g>
    <g opacity={b4}>
      <Label t={t} x={960} y={170} size={46}>Entity và value object</Label>
      <Box x={480} y={470} w={720} h={360}>
        <Label t={t} x={480} y={350} size={36} color={p.accent2}>Entity</Label>
        <Label t={t} x={480} y={430} size={34} weight={400}>có danh tính</Label>
        <Label t={t} x={480} y={500} size={30} weight={400} color={p.muted}>hai đơn khác id là khác nhau,</Label>
        <Label t={t} x={480} y={545} size={30} weight={400} color={p.muted}>dù nội dung giống hệt</Label>
        <Label t={t} x={480} y={640} size={30} mono color={p.accent}>Order</Label>
      </Box>
      <Box x={1440} y={470} w={720} h={360} accent opacity={grow(f, at(16), at(16) + 14)}>
        <Label t={t} x={1440} y={350} size={36} color={p.accent}>Value object</Label>
        <Label t={t} x={1440} y={430} size={34} weight={400}>so bằng giá trị</Label>
        <Label t={t} x={1440} y={490} size={30} weight={400} color={p.muted}>tạo được là đã hợp lệ</Label>
      </Box>
      {['EmailAddress', 'Money'].map((text, k) =>
        <g key={text} opacity={grow(f, at(17 + k), at(17 + k) + 10)}>
          <Mark t={t} f={f} x={1170} y={560 + k * 62} ok at={at(17 + k, .3)} size={34} />
          <Label t={t} x={1210} y={572 + k * 62} anchor="start" size={28} mono color={p.accent}>{text} · không thể sai</Label>
        </g>)}
      <Label t={t} x={960} y={790} size={34} color={p.accent2} opacity={grow(f, at(19), at(19) + 12)}>đặt luật vào nơi sinh ra giá trị</Label>
    </g>
    <g opacity={b5}>
      <Label t={t} x={960} y={190} size={46}>Nhưng vẫn phải lưu</Label>
      <DiagramNode t={t} f={f} x={720} y={450} w={260} h={150} kind="service" label="Order" at={at(20)} state="key" />
      <DiagramNode t={t} f={f} x={1200} y={450} w={220} h={150} kind="db" label="Database" at={at(20, .5)} />
      <DiagramWire t={t} f={f} pts={[[850, 450], [1090, 450]]} at={at(21)} color="#ff6b6b" dashed />
      <Mark t={t} f={f} x={970} y={450} ok={false} at={at(21, .8)} size={60} />
      <Label t={t} x={960} y={620} size={34} weight={400} color={p.muted} opacity={grow(f, at(21, 1.2), at(21, 1.8))}>nhiều người dừng ở đây: entity gọi thẳng database</Label>
      <Chip t={t} f={f} x={960} y={740} text="sách đề nghị đi xa hơn một bước" at={at(22)} size={36} tone="accent" />
    </g>
  </Stage>;
};

// ---- 04 · repository ---------------------------------------------------------------------------------------
export const Repository: FC<{s: Seg}> = ({s}) => {
  const {f, at, span} = useBeat(s), t = THEME, p = t.palette;
  const b1 = span(0, 2), b2 = span(3, 6), b3 = span(7, 10), b4 = span(11, 19), b5 = span(20, 20);
  return <Stage>
    <g opacity={b1}>
      <Label t={t} x={960} y={180} size={48} opacity={grow(f, at(0), at(0) + 12)}>Repository: kho của đối tượng nghiệp vụ</Label>
      <Box x={960} y={470} w={720} h={330} accent opacity={grow(f, at(0, .4), at(0, .4) + 14)}>
        <Label t={t} x={960} y={400} size={36} mono color={p.accent}>OrderRepository</Label>
        <Label t={t} x={960} y={490} size={34} mono>save(Order): int</Label>
        <Label t={t} x={960} y={550} size={34} mono>getById(int): Order</Label>
        <Label t={t} x={960} y={615} size={30} weight={400} color={p.muted}>không bảng, không cột, không SQL</Label>
      </Box>
      <Label t={t} x={960} y={800} size={32} weight={400} color={p.muted} opacity={grow(f, at(2), at(2) + 12)}>interface đứng về phía nghiệp vụ</Label>
    </g>
    <g opacity={b2}>
      <Label t={t} x={960} y={170} size={46} opacity={grow(f, at(3), at(3) + 12)}>Giả định đã có, rồi định nghĩa nó</Label>
      <CodeCard t={t} f={f} x={260} y={260} w={900} title="PlaceOrderController.php" at={at(4)} cps={2.2} size={32}
        lines={['$order = new Order(...);', '$orderRepository->save($order);']} highlight={[1]} />
      <DiagramWire t={t} f={f} pts={[[1160, 360], [1340, 360]]} at={at(5)} />
      <Box x={1560} y={360} w={420} h={170} accent opacity={grow(f, at(5, .3), at(5, .3) + 12)}>
        <Label t={t} x={1560} y={330} size={32} mono color={p.accent}>OrderRepository</Label>
        <Label t={t} x={1560} y={400} size={30} weight={400}>viết đúng cách bạn muốn gọi</Label>
      </Box>
      <Label t={t} x={960} y={620} size={34} weight={400} color={p.muted} opacity={grow(f, at(6), at(6) + 12)}>phần cài đặt để sau</Label>
    </g>
    <g opacity={b3}>
      <Label t={t} x={960} y={160} size={46}>Ba cách cài đặt, một interface</Label>
      <Box x={960} y={360} w={520} h={150} accent>
        <Label t={t} x={960} y={340} size={32} mono color={p.accent}>OrderRepository</Label>
      </Box>
      {[['SqlOrderRepository', 'query builder · Eloquent'], ['MemoryOrderRepository', 'một mảng trong test'], ['RemoteOrderRepository', 'gọi API hệ thống khác']].map(([name, sub], k) =>
        <g key={name} opacity={grow(f, at(7 + k, .2), at(7 + k, .2) + 12)}>
          <DiagramWire t={t} f={f} pts={[[960, 435], [400 + k * 560, 575]]} at={at(7 + k, .1)} />
          <DiagramNode t={t} f={f} x={400 + k * 560} y={650} w={460} h={150} kind={k === 0 ? 'db' : k === 1 ? 'box' : 'server'} label={name} labelSize={28} at={at(7 + k, .2)} />
          <Label t={t} x={400 + k * 560} y={755} size={30} weight={400} color={p.muted}>{sub}</Label>
        </g>)}
      <Chip t={t} f={f} x={960} y={840} text="controller không cần biết đang dùng cái nào" at={at(10, .6)} size={32} tone="accent2" />
    </g>
    <g opacity={b4}>
      <Label t={t} x={960} y={160} size={46}>Controller sau khi tách</Label>
      {['lấy giá qua EbookRepository', 'tạo Order trong try / catch', 'gọi save', 'lưu id vào session', 'trả về trang tiếp theo'].map((text, k) =>
        <g key={text} opacity={grow(f, at(11 + k), at(11 + k) + 12)}>
          <Row x={430} y={290 + k * 95} text={text} size={38} f={f} at={at(11 + k * .8, .3)} />
        </g>)}
      <g opacity={grow(f, at(17), at(17) + 12)}>
        <Box x={1400} y={330} w={620} h={180} accent>
          <Label t={t} x={1400} y={290} size={34} color={p.accent}>SqlOrderRepository</Label>
          <Label t={t} x={1400} y={360} size={30} weight={400}>toàn bộ MySQL nằm trong một lớp</Label>
        </Box>
        <Box x={1400} y={620} w={620} h={180}>
          <Label t={t} x={1400} y={580} size={34} color={p.accent2}>Order</Label>
          <Label t={t} x={1400} y={650} size={30} weight={400}>PHP thuần, không framework</Label>
          <Label t={t} x={1400} y={700} size={30} weight={400}>không gọi database</Label>
        </Box>
      </g>
      <Label t={t} x={960} y={790} size={34} weight={400} color={p.muted} opacity={grow(f, at(19), at(19) + 12)}>mỗi phần test riêng</Label>
    </g>
    <g opacity={b5}>
      <Box x={960} y={470} w={1000} h={260} accent opacity={grow(f, at(20), at(20) + 14)}>
        <Label t={t} x={960} y={430} size={44} color={p.accent}>lần tách đầu tiên</Label>
        <Label t={t} x={960} y={500} size={36} weight={400}>và là lần tạo ra khác biệt lớn nhất</Label>
      </Box>
    </g>
  </Stage>;
};

// ---- 05 · read model and view model ------------------------------------------------------------------------
export const DocVaGhi: FC<{s: Seg}> = ({s}) => {
  const {f, at, span} = useBeat(s), t = THEME, p = t.palette;
  const b1 = span(0, 4), b2 = span(5, 7), b3 = span(8, 10), b4 = span(11, 15), b5 = span(16, 17);
  return <Stage>
    <g opacity={b1}>
      <Label t={t} x={960} y={170} size={48} opacity={grow(f, at(0), at(0) + 12)}>Phần đọc cũng cần mô hình riêng</Label>
      <Box x={620} y={450} w={600} h={340}>
        <Label t={t} x={620} y={380} size={34} color={p.accent2}>entity dùng để ghi</Label>
        <Label t={t} x={620} y={450} size={30} mono>changePrice()</Label>
        <Label t={t} x={620} y={510} size={30} mono>hide()</Label>
        <Label t={t} x={620} y={570} size={30} mono>changeStatus()</Label>
      </Box>
      <DiagramWire t={t} f={f} pts={[[920, 450], [1150, 450]]} at={at(1, .4)} />
      <Box x={1400} y={450} w={460} h={260} accent opacity={grow(f, at(2), at(2) + 12)}>
        <Label t={t} x={1400} y={400} size={34} color={p.accent}>view</Label>
        <Label t={t} x={1400} y={470} size={30} weight={400}>chỉ cần hiển thị</Label>
        <Label t={t} x={1400} y={520} size={30} weight={400}>lại cầm object đổi được dữ liệu</Label>
      </Box>
      <Chip t={t} f={f} x={960} y={750} text="class phình to vì phục vụ cả hai việc" at={at(4)} size={34} tone="bad" />
    </g>
    <g opacity={b2}>
      <Label t={t} x={960} y={170} size={46}>Tách read model</Label>
      {[['EbookReadModel', 'EbookReadRepository', 'mô hình đọc riêng'], ['GetPrice', 'ofEbook(EbookId): int', 'chỉ trả con số cần'], ['CQRS', 'hai kho dữ liệu', 'nặng hơn, phải giữ nhất quán']].map(([name, sub, note], k) =>
        <g key={name} opacity={grow(f, at(5 + k, 0), at(5 + k, 0) + 14)}>
          <Box x={420 + k * 540} y={470} w={440} h={340} accent={k < 2}>
            <Label t={t} x={420 + k * 540} y={400} size={36} color={k < 2 ? p.accent : p.muted}>{name}</Label>
            <Label t={t} x={420 + k * 540} y={470} size={30} mono>{sub}</Label>
            <Label t={t} x={420 + k * 540} y={550} size={28} weight={400} color={p.muted}>{note}</Label>
          </Box>
        </g>)}
      <Label t={t} x={960} y={800} size={34} weight={400} color={p.muted} opacity={grow(f, at(7), at(7) + 12)}>sách chọn cách nhẹ: chung database, repository đọc riêng</Label>
    </g>
    <g opacity={b3}>
      <Label t={t} x={960} y={190} size={44}>CQRS: khi nào cần mới dùng</Label>
      <Box x={600} y={470} w={380} h={240} accent>
        <Label t={t} x={600} y={420} size={34} color={p.accent}>kho ghi</Label>
        <Label t={t} x={600} y={500} size={30} weight={400}>domain event</Label>
      </Box>
      <Box x={1320} y={470} w={380} h={240}>
        <Label t={t} x={1320} y={420} size={34} color={p.accent2}>kho đọc</Label>
        <Label t={t} x={1320} y={500} size={30} weight={400}>dữ liệu tối ưu cho đọc</Label>
      </Box>
      <DiagramWire t={t} f={f} pts={[[790, 470], [1130, 470]]} at={at(8)} dashed />
      <DiagramPacket t={t} f={f} pts={[[790, 470], [1130, 470]]} at={at(8, .4)} period={40} count={2} />
      <Chip t={t} f={f} x={960} y={680} text="phải giữ nhất quán giữa hai kho" at={at(9)} size={34} tone="accent" />
      <Label t={t} x={960} y={800} size={32} weight={400} color={p.muted} opacity={grow(f, at(10), at(10) + 12)}>đa số dự án: chỉ cần integration test cho phần đọc</Label>
    </g>
    <g opacity={b4}>
      <Label t={t} x={960} y={170} size={46}>View model: DTO đúng thứ màn hình cần</Label>
      <Box x={480} y={460} w={700} h={340} accent>
        <Label t={t} x={480} y={380} size={36} mono color={p.accent}>EbookViewModel</Label>
        <Label t={t} x={480} y={460} size={32} mono>formattedPrice</Label>
        <Label t={t} x={480} y={520} size={30} weight={400}>format sẵn cho màn hình</Label>
        <Label t={t} x={480} y={620} size={30} weight={400} color={p.muted}>không phải bọc cho đẹp</Label>
      </Box>
      <Box x={1440} y={460} w={700} h={340}>
        <Label t={t} x={1440} y={380} size={34} mono color={p.accent2}>OrderListViewModel</Label>
        <Label t={t} x={1440} y={460} size={32} mono>findRecentOrders(limit)</Label>
        <Label t={t} x={1440} y={520} size={32} mono>toArray / JsonSerializable</Label>
        <Label t={t} x={1440} y={620} size={30} weight={400} color={p.muted}>tầng hiển thị không biết cấu trúc bên trong</Label>
      </Box>
      <Label t={t} x={960} y={790} size={34} color={p.accent2} opacity={grow(f, at(15), at(15) + 12)}>đọc thì trả đúng thứ cần đọc</Label>
    </g>
    <g opacity={b5}>
      <Box x={960} y={470} w={1180} h={220} accent opacity={grow(f, at(16), at(16) + 14)}>
        <Label t={t} x={960} y={430} size={40}>Đừng dùng object mutable có logic phức tạp</Label>
        <Label t={t} x={960} y={500} size={40} color={p.accent}>cho việc chỉ đọc</Label>
      </Box>
    </g>
  </Stage>;
};

// ---- 06 · application service and command ------------------------------------------------------------------
export const ApplicationService: FC<{s: Seg}> = ({s}) => {
  const {f, at, span} = useBeat(s), t = THEME, p = t.palette;
  const b1 = span(0, 1), b2 = span(2, 3), b3 = span(4, 6), b4 = span(7, 13), b5 = span(14, 18), b6 = span(19, 23);
  return <Stage>
    <g opacity={b1}>
      <Label t={t} x={960} y={170} size={48} opacity={grow(f, at(0), at(0) + 12)}>Controller phình vì chứa use case</Label>
      <Box x={960} y={480} w={600} h={460} accent opacity={grow(f, at(1), at(1) + 14)}>
        <Label t={t} x={960} y={300} size={34} mono color={p.accent}>OrderController</Label>
        {['validate', 'lấy sản phẩm', 'kiểm tồn kho', 'tính tiền', 'tạo Order', 'gửi mail', 'trả response'].map((text, k) =>
          <Label key={text} t={t} x={960} y={360 + k * 46} size={30} weight={400} opacity={grow(f, at(1, .4 + k * .18), at(1, .4 + k * .18) + 10)}>{text}</Label>)}
      </Box>
      <Label t={t} x={960} y={800} size={34} weight={400} color={p.muted} opacity={grow(f, at(1, 1.8), at(1, 2.2))}>nơi duy nhất ai cũng nhét việc vào</Label>
    </g>
    <g opacity={b2}>
      <Label t={t} x={960} y={170} size={46} opacity={grow(f, at(2), at(2) + 12)}>Application Service: một use case, gọi từ mọi nơi</Label>
      <Box x={960} y={560} w={620} h={210} accent>
        <Label t={t} x={960} y={530} size={36} color={p.accent}>PlaceOrderService</Label>
        <Label t={t} x={960} y={595} size={30} weight={400}>điều phối đúng một use case</Label>
      </Box>
      {['Web', 'CLI', 'Job', 'Test'].map((text, k) =>
        <g key={text} opacity={grow(f, at(3, k * .3), at(3, k * .3) + 12)}>
          <DiagramWire t={t} f={f} pts={[[540 + k * 280, 335], [960, 453]]} at={at(3, .1 + k * .25)} />
          <DiagramNode t={t} f={f} x={540 + k * 280} y={290} w={170} h={90} kind="none" label={text} labelSize={30} at={at(3, k * .3)} />
        </g>)}
      <Label t={t} x={960} y={790} size={34} weight={400} color={p.muted} opacity={grow(f, at(3, 1.6), at(3, 2))}>một chỗ, bốn lối vào</Label>
    </g>
    <g opacity={b3}>
      <Label t={t} x={960} y={160} size={44}>Command gói đầu vào</Label>
      <CodeCard t={t} f={f} x={260} y={240} w={860} title="PlaceOrderCommand" at={at(4)} cps={2} size={32}
        lines={['customerId', 'items[]', 'email']} highlight={[0, 1, 2]} />
      <DiagramWire t={t} f={f} pts={[[1120, 360], [1300, 360]]} at={at(5)} />
      <Box x={1540} y={360} w={440} h={170} accent>
        <Label t={t} x={1540} y={330} size={32} mono color={p.accent}>PlaceOrderService</Label>
        <Label t={t} x={1540} y={400} size={30} mono>handle(cmd): OrderId</Label>
      </Box>
      <Label t={t} x={960} y={620} size={34} weight={400} color={p.muted} opacity={grow(f, at(6), at(6) + 12)}>controller chỉ đổi request thành command</Label>
    </g>
    <g opacity={b4}>
      <Label t={t} x={960} y={160} size={46}>Bên trong service: các bước nghiệp vụ</Label>
      {['lấy sản phẩm', 'kiểm tra tồn kho', 'tính tiền', 'lấy id mới', 'tạo Order', 'lưu'].map((text, k) =>
        <g key={text} opacity={grow(f, at(8 + k), at(8 + k) + 10)}>
          <Row x={500} y={280 + k * 88} text={text} size={38} f={f} at={at(8 + k, .3)} />
        </g>)}
      <g opacity={grow(f, at(9, .5), at(9, .5) + 12)}>
        <DiagramWire t={t} f={f} pts={[[930, 370], [1270, 370]]} at={at(9, .6)} color="#ff6b6b" />
        <Chip t={t} f={f} x={1470} y={370} text="OutOfStockException" at={at(9, 1)} size={32} tone="bad" />
      </g>
      <Label t={t} x={960} y={830} size={32} weight={400} color={p.muted} opacity={grow(f, at(13), at(13) + 12)}>không còn quyết định nào nằm trong controller</Label>
    </g>
    <g opacity={b5}>
      <Label t={t} x={960} y={160} size={44}>Nối dependency bằng constructor</Label>
      <Box x={540} y={450} w={620} h={280} accent>
        <Label t={t} x={540} y={380} size={34} mono color={p.accent}>__construct(OrderRepository,</Label>
        <Label t={t} x={540} y={440} size={34} mono color={p.accent}>            Mailer)</Label>
        <Label t={t} x={540} y={540} size={30} weight={400}>nhìn constructor là biết class cần gì</Label>
      </Box>
      <Box x={1380} y={450} w={620} h={280} dim>
        <Label t={t} x={1380} y={380} size={34} mono color={p.muted}>app()-&gt;make(...)</Label>
        <Label t={t} x={1380} y={540} size={30} weight={400}>giấu dependency bên trong</Label>
        <Mark t={t} f={f} x={1600} y={560} ok={false} at={at(18, .5)} size={44} />
      </Box>
    </g>
    <g opacity={b6}>
      <Label t={t} x={960} y={170} size={46}>Test use case không cần framework</Label>
      <Box x={620} y={450} w={520} h={260}>
        <Label t={t} x={620} y={390} size={34} color={p.accent2}>MemoryOrderRepository</Label>
        <Label t={t} x={620} y={490} size={30} weight={400}>đơn hàng trong một mảng</Label>
      </Box>
      <Box x={1300} y={450} w={520} h={260}>
        <Label t={t} x={1300} y={390} size={34} color={p.accent2}>StubMailer</Label>
        <Label t={t} x={1300} y={490} size={30} weight={400}>ghi lại lời gọi</Label>
      </Box>
      <DiagramWire t={t} f={f} pts={[[880, 450], [1040, 450]]} at={at(20)} />
      <DiagramPacket t={t} f={f} pts={[[880, 450], [1040, 450]]} at={at(20, .4)} period={36} count={2} />
      <Chip t={t} f={f} x={960} y={680} text="không database · không mạng · vài mili giây" at={at(21)} size={34} tone="accent" />
      <Label t={t} x={960} y={800} size={36} color={p.accent2} opacity={grow(f, at(23), at(23) + 12)}>đó là thứ khiến người ta dám sửa code</Label>
    </g>
  </Stage>;
};

// ---- 07 · three layers and the dependency rule -------------------------------------------------------------
export const BaTang: FC<{s: Seg}> = ({s}) => {
  const {f, at, span} = useBeat(s), t = THEME, p = t.palette;
  const b1 = span(0, 5), b2 = span(6, 11), b3 = span(12, 16), b4 = span(17, 20), b5 = span(21, 22), b6 = span(23, 25);
  return <Stage>
    <g opacity={b1}>
      <Label t={t} x={960} y={170} size={48} opacity={grow(f, at(0), at(0) + 12)}>Ba tầng cũ: giao diện · nghiệp vụ · dữ liệu</Label>
      {['Presentation', 'Business Logic', 'Data Access'].map((text, k) =>
        <g key={text} opacity={grow(f, at(1, k * .4), at(1, k * .4) + 12)}>
          <Box x={960} y={300 + k * 150} w={760} h={110}>
            <Label t={t} x={960} y={340 + k * 150} size={34} weight={400}>{text}</Label>
          </Box>
          {k < 2 ? <DiagramWire t={t} f={f} pts={[[960, 355 + k * 150], [960, 375 + k * 150]]} at={at(1, .5 + k * .3)} /> : null}
        </g>)}
      <Label t={t} x={960} y={790} size={34} weight={400} color={p.muted} opacity={grow(f, at(2), at(2) + 12)}>biết đặt code ở đâu · đổi một tầng ít đụng tầng khác</Label>
      <g opacity={grow(f, at(4), at(4) + 12)}>
        <Chip t={t} f={f} x={620} y={870} text="logic rò rỉ giữa tầng" at={at(4, .2)} size={32} tone="bad" />
        <Chip t={t} f={f} x={1310} y={870} text="lasagna: bảy lớp tới câu SQL" at={at(5)} size={32} tone="bad" />
      </g>
    </g>
    <g opacity={b2}>
      <Label t={t} x={960} y={160} size={46}>Ba tầng theo hướng nghiệp vụ đứng giữa</Label>
      {[['Domain', 'entity · aggregate · value object', 'domain service · domain event', 'repository interface · factory'], ['Application', 'use case handler · command · query', 'transaction', 'lớp keo'], ['Infrastructure', 'framework · ORM', 'adapter gọi dịch vụ ngoài', 'cài đặt interface']].map(([name, ...lines], k) =>
        <g key={name} opacity={grow(f, at(6 + k), at(6 + k) + 14)}>
          <Box x={960} y={320 + k * 200} w={980} h={170} accent={k === 0}>
            <Label t={t} x={520} y={272 + k * 200} anchor="start" size={36} color={k === 0 ? p.accent : p.accent2}>{name}</Label>
            {lines.map((line, i) => <Label key={line} t={t} x={520} y={314 + k * 200 + i * 36} anchor="start" size={28} weight={400}>{line}</Label>)}
          </Box>
        </g>)}
      <Label t={t} x={960} y={890} size={32} weight={400} color={p.muted} opacity={grow(f, at(8), at(8) + 12)}>Domain không import framework</Label>
    </g>
    <g opacity={b3}>
      <Label t={t} x={960} y={150} size={46}>Dependency Rule: chỉ hướng vào trong</Label>
      <rect x={400} y={215} width={1120} height={545} rx={24} fill="none" stroke={p.muted} strokeWidth={3} opacity={grow(f, at(12), at(12) + 14)} />
      <rect x={600} y={310} width={720} height={370} rx={20} fill="none" stroke={p.accent2} strokeWidth={3} opacity={grow(f, at(12, .6), at(12, .6) + 14)} />
      <rect x={790} y={415} width={340} height={175} rx={16} fill={p.surface} stroke={p.accent} strokeWidth={3} opacity={grow(f, at(13), at(13) + 14)} />
      <Label t={t} x={470} y={268} anchor="start" size={32} color={p.muted} opacity={grow(f, at(13, .2), at(13, .6))}>Infrastructure</Label>
      <Label t={t} x={660} y={362} anchor="start" size={32} color={p.accent2} opacity={grow(f, at(13, .4), at(13, .8))}>Application</Label>
      <Label t={t} x={960} y={470} size={38} color={p.accent} opacity={grow(f, at(13, .6), at(13, 1))}>Domain</Label>
      <Label t={t} x={960} y={515} size={28} weight={400} color={p.muted} opacity={grow(f, at(13, .8), at(13, 1.2))}>entity · rule</Label>
      <DiagramWire t={t} f={f} pts={[[740, 248], [740, 305]]} at={at(14)} color={p.accent2} width={4} />
      <DiagramWire t={t} f={f} pts={[[880, 348], [880, 410]]} at={at(14, .5)} color={p.accent2} width={4} />
      <DiagramWire t={t} f={f} pts={[[1250, 690], [1250, 640], [1136, 640], [1136, 520]]} at={at(15)} color={p.accent} dashed width={4} />
      <Label t={t} x={1250} y={728} size={27} weight={400} color={p.accent} opacity={grow(f, at(15, .5), at(15, .9))}>hạ tầng cũng trỏ vào Domain</Label>
      <Label t={t} x={960} y={815} size={34} color={p.accent2} opacity={grow(f, at(15, .6), at(15, 1.2))}>"Đừng gọi tôi, tôi sẽ gọi bạn"</Label>
      <Chip t={t} f={f} x={960} y={862} text="Hollywood Principle" at={at(16, .2)} size={30} />
    </g>
    <g opacity={b4}>
      <Label t={t} x={960} y={170} size={44}>Service provider nối interface với cài đặt</Label>
      <Box x={620} y={430} w={560} h={220} accent>
        <Label t={t} x={620} y={380} size={30} mono color={p.accent}>OrderServiceProvider</Label>
        <Label t={t} x={620} y={460} size={30} weight={400}>bind(OrderRepository::class,</Label>
        <Label t={t} x={620} y={510} size={30} weight={400}>EloquentOrderRepository::class)</Label>
      </Box>
      {[['chạy thật', 'Eloquent', at(19)], ['test', 'trong bộ nhớ', at(20)]].map(([when, what, a], k) =>
        <g key={k} opacity={grow(f, a as number, (a as number) + 12)}>
          <DiagramWire t={t} f={f} pts={[[900, 430], [1120, 360 + k * 180]]} at={a as number} />
          <DiagramNode t={t} f={f} x={1300} y={360 + k * 180} w={280} h={120} kind="box" label={what as string} labelSize={30} at={a as number} />
          <Label t={t} x={1300} y={440 + k * 180} size={28} weight={400} color={p.muted}>{when as string}</Label>
        </g>)}
    </g>
    <g opacity={b5}>
      <Label t={t} x={960} y={180} size={44}>Luồng đặt hàng đi vào trong</Label>
      {['/orders/place', 'Controller', 'PlaceOrderHandler', 'OrderRepository'].map((text, k) =>
        <g key={text} opacity={grow(f, at(21, k * .5), at(21, k * .5) + 12)}>
          <DiagramNode t={t} f={f} x={280 + k * 380} y={420} w={280} h={130} kind={k === 0 ? 'client' : k === 3 ? 'db' : 'service'} label={text} labelSize={26} at={at(21, k * .5)} />
          {k < 3 ? <DiagramWire t={t} f={f} pts={[[420 + k * 380, 420], [520 + k * 380, 420]]} at={at(21, .3 + k * .5)} /> : null}
        </g>)}
      <DiagramWire t={t} f={f} pts={[[1580, 420], [1700, 420], [1700, 650], [960, 650]]} at={at(21, 2.2)} dashed />
      <Chip t={t} f={f} x={960} y={720} text="OrderPlaced → listener gửi email" at={at(21, 2.6)} size={32} tone="accent" />
      <Label t={t} x={960} y={820} size={34} color={p.accent2} opacity={grow(f, at(22), at(22) + 12)}>không có mũi tên nào từ Domain trỏ ra database</Label>
    </g>
    <g opacity={b6}>
      <Label t={t} x={960} y={190} size={46}>Nhưng đừng bắt mọi thứ đi đủ bốn tầng</Label>
      <Box x={620} y={470} w={620} h={260} dim>
        <Label t={t} x={620} y={410} size={34} color={p.muted}>CRUD đơn giản</Label>
        <Label t={t} x={620} y={480} size={30} weight={400}>controller → database</Label>
      </Box>
      <Box x={1360} y={470} w={620} h={260} accent>
        <Label t={t} x={1360} y={410} size={34} color={p.accent}>Quy tắc</Label>
        <Label t={t} x={1360} y={480} size={30} weight={400}>kiến trúc để giảm chi phí thay đổi</Label>
      </Box>
      <Label t={t} x={960} y={800} size={38} color={p.accent2} opacity={grow(f, at(25), at(25) + 12)}>không phải để trông chuyên nghiệp</Label>
    </g>
  </Stage>;
};

// ---- 08 · ports and adapters -------------------------------------------------------------------------------
export const PortsAdapters: FC<{s: Seg}> = ({s}) => {
  const {f, at, span} = useBeat(s), t = THEME, p = t.palette;
  const b1 = span(0, 6), b2 = span(7, 11), b3 = span(12, 18), b4 = span(19, 23), b5 = span(24, 28), b6 = span(29, 32), b7 = span(33, 38);
  const hex = 'M960 340 L1139 420 L1139 600 L960 680 L781 600 L781 420 Z';
  return <Stage>
    <g opacity={b1}>
      <Label t={t} x={960} y={150} size={48} opacity={grow(f, at(0), at(0) + 12)}>Hexagonal: lõi ở giữa, mọi thứ cắm vào</Label>
      <path d={hex} fill={p.surface} stroke={p.accent} strokeWidth={4} opacity={grow(f, at(2), at(2) + 18)} />
      <Label t={t} x={960} y={500} size={40} color={p.accent} opacity={grow(f, at(2, .6), at(2, 1))}>Domain</Label>
      <Label t={t} x={960} y={550} size={30} weight={400} color={p.muted} opacity={grow(f, at(2, .8), at(2, 1.2))}>use case · entity · rule</Label>
      {([['USB', 300, 480], ['Database', 1620, 400], ['API', 1620, 620], ['CLI', 420, 700]] as [string, number, number][]).map(([text, x, y], k) =>
        <g key={text} opacity={grow(f, at(3 + k), at(3 + k) + 12)}>
          <DiagramWire t={t} f={f} pts={[[x < 960 ? 800 : 1120, y < 500 ? 430 : 580], [x, y]]} at={at(3 + k, .2)} />
          <DiagramNode t={t} f={f} x={x} y={y} w={220} h={110} kind={k === 1 ? 'db' : k === 0 ? 'box' : 'service'} label={text} labelSize={28} at={at(3 + k)} />
        </g>)}
      <Label t={t} x={960} y={760} size={34} weight={400} opacity={grow(f, at(5), at(5) + 12)}>lõi chỉ biết một chuẩn cắm</Label>
      <Chip t={t} f={f} x={960} y={825} text="port = chuẩn · adapter = thiết bị cụ thể" at={at(6)} size={32} tone="accent2" />
    </g>
    <g opacity={b2}>
      <Label t={t} x={960} y={170} size={46} opacity={grow(f, at(7), at(7) + 12)}>Phân lớp còn chưa giải quyết</Label>
      {['phụ thuộc vẫn nằm ngầm', 'thêm kênh mới phải sửa nhiều', 'test application vẫn chậm', 'tích hợp ngoài làm bẩn domain'].map((text, k) =>
        <g key={text} opacity={grow(f, at(8 + k), at(8 + k) + 12)}>
          <Box x={960} y={300 + k * 120} w={840} h={92} dim>
            <Label t={t} x={960} y={335 + k * 120} size={32} weight={400}>{text}</Label>
          </Box>
          <Mark t={t} f={f} x={1460} y={300 + k * 120} ok={false} at={at(8 + k, .3)} size={38} />
        </g>)}
    </g>
    <g opacity={b3}>
      <Label t={t} x={960} y={160} size={46}>Hai loại port</Label>
      <Box x={540} y={450} w={620} h={330}>
        <Label t={t} x={540} y={380} size={34} color={p.accent2}>Port đầu vào</Label>
        <Label t={t} x={540} y={450} size={30} weight={400}>thế giới gọi vào lõi</Label>
        <Label t={t} x={540} y={520} size={30} mono>UI · API · CLI · test</Label>
      </Box>
      <Box x={1380} y={450} w={620} h={330} accent>
        <Label t={t} x={1380} y={380} size={34} color={p.accent}>Port đầu ra</Label>
        <Label t={t} x={1380} y={450} size={30} weight={400}>lõi gọi ra ngoài</Label>
        <Label t={t} x={1380} y={520} size={30} mono>lưu trữ · thông báo · dịch vụ</Label>
      </Box>
      <DiagramWire t={t} f={f} pts={[[850, 450], [1070, 450]]} at={at(15)} />
      <Label t={t} x={960} y={650} size={32} weight={400} color={p.muted} opacity={grow(f, at(15, .4), at(15, .8))}>cả hai là interface trong core</Label>
      <Chip t={t} f={f} x={960} y={735} text="adapter là code cụ thể ở Infrastructure" at={at(16)} size={32} tone="accent2" />
      <Label t={t} x={960} y={810} size={30} weight={400} color={p.muted} opacity={grow(f, at(17), at(17) + 12)}>mỗi port: một adapter thật + một adapter giả</Label>
      <Label t={t} x={960} y={855} size={30} weight={400} color={p.muted} opacity={grow(f, at(17, .4), at(17, .8))}>Cockburn chủ yếu vì testing</Label>
    </g>
    <g opacity={b4}>
      <Label t={t} x={960} y={180} size={46} opacity={grow(f, at(19), at(19) + 12)}>Bốn bước áp dụng</Label>
      {['xác định port', 'định nghĩa interface trong core', 'viết adapter', 'nối bằng dependency injection'].map((text, k) =>
        <g key={text} opacity={grow(f, at(20 + k), at(20 + k) + 12)}>
          <Box x={960} y={300 + k * 135} w={760} h={100} accent={k === 3}>
            <Label t={t} x={700} y={335 + k * 135} anchor="start" size={38} color={p.accent}>{k + 1}</Label>
            <Label t={t} x={760} y={335 + k * 135} anchor="start" size={34} weight={400}>{text}</Label>
          </Box>
        </g>)}
      <Label t={t} x={960} y={870} size={34} color={p.accent2} opacity={grow(f, at(23), at(23) + 12)}>port trước, cài đặt sau</Label>
    </g>
    <g opacity={b5}>
      <Label t={t} x={960} y={160} size={46} opacity={grow(f, at(24), at(24) + 12)}>Ví dụ trong sách</Label>
      <Box x={700} y={390} w={520} h={150} accent>
        <Label t={t} x={700} y={340} size={32} mono color={p.accent}>OrderRepository</Label>
      </Box>
      <Box x={700} y={620} w={520} h={150} accent>
        <Label t={t} x={700} y={570} size={32} mono color={p.accent}>OrderNotification</Label>
      </Box>
      {([['Eloquent', 1320, 300], ['InMemory', 1320, 420], ['Email', 1320, 620], ['Log', 1320, 740]] as [string, number, number][]).map(([text, wx, y], k) => {
        const a = at(25 + Math.floor(k / 2), k % 2 ? .5 : 0);
        return <g key={text} opacity={grow(f, a, a + 10)}>
          <DiagramWire t={t} f={f} pts={[[960, k < 2 ? 390 : 620], [wx, y]]} at={a} />
          <DiagramNode t={t} f={f} x={1460} y={y} w={280} h={100} kind="box" label={text} labelSize={28} at={a} />
        </g>;
      })}
      <Chip t={t} f={f} x={960} y={850} text="HexagonBindings nối tất cả lại" at={at(27)} size={32} />
      <Label t={t} x={960} y={920} size={30} weight={400} color={p.muted} opacity={grow(f, at(28), at(28) + 12)}>test PlaceOrderHandler: hai adapter giả, không mở Laravel</Label>
    </g>
    <g opacity={b6}>
      <Label t={t} x={960} y={180} size={46}>Mở rộng mà không đụng vào lõi</Label>
      {[['ImportOrderCommand', 'CSV là adapter, xử lý đơn vẫn là core'], ['hai database', 'hai adapter cùng một port'], ['CustomerContext', 'port giữa hai bounded context']].map(([name, sub], k) =>
        <g key={name} opacity={grow(f, at(29 + k, 0), at(29 + k, 0) + 12)}>
          <Box x={960} y={330 + k * 155} w={920} h={120}>
            <Label t={t} x={560} y={380 + k * 155} anchor="start" size={34} color={p.accent2}>{name}</Label>
            <Label t={t} x={560} y={418 + k * 155} anchor="start" size={28} weight={400} color={p.muted}>{sub}</Label>
          </Box>
        </g>)}
      <Label t={t} x={960} y={850} size={32} weight={400} color={p.muted} opacity={grow(f, at(32), at(32) + 12)}>thay vì gọi thẳng vào database của nhau</Label>
    </g>
    <g opacity={b7}>
      <Label t={t} x={960} y={180} size={46} opacity={grow(f, at(33), at(33) + 12)}>Cái giá</Label>
      {['nhiều interface và class hơn', 'cần quy ước đặt tên', 'đừng trừu tượng hóa mọi thứ'].map((text, k) =>
        <g key={text} opacity={grow(f, at(34 + k), at(34 + k) + 12)}>
          <Row x={620} y={300 + k * 95} text={text} ok={false} size={38} f={f} at={at(34 + k, .2)} />
        </g>)}
      <Chip t={t} f={f} x={960} y={680} text="chỉ tách ở chỗ dễ đổi hoặc khó test" at={at(37)} size={34} tone="accent" />
      <Label t={t} x={960} y={810} size={40} color={p.accent2} opacity={grow(f, at(38), at(38) + 12)}>kiến trúc là công cụ, không phải tôn giáo</Label>
    </g>
  </Stage>;
};

// ---- 09 · closing ------------------------------------------------------------------------------------------
export const KhepLai: FC<{s: Seg}> = ({s}) => {
  const {f, at, span} = useBeat(s), t = THEME, p = t.palette;
  const b1 = span(0, 3), b2 = span(4, 8), b3 = span(9, 12);
  return <Stage>
    <g opacity={b1}>
      <Label t={t} x={960} y={200} size={54} opacity={grow(f, at(0), at(0) + 12)}>Câu hỏi quay lại rất đơn giản</Label>
      <Box x={960} y={430} w={1200} h={220} accent opacity={grow(f, at(1), at(1) + 14)}>
        <Label t={t} x={960} y={420} size={42}>Chạy được một mình, trong bộ nhớ,</Label>
        <Label t={t} x={960} y={490} size={42}>không cần gì bên ngoài?</Label>
      </Box>
      <Chip t={t} f={f} x={720} y={640} text="có → giữ sạch" at={at(2)} size={36} tone="accent2" />
      <Chip t={t} f={f} x={1220} y={640} text="không → đẩy ra rìa" at={at(3)} size={36} tone="accent" />
      <DiagramWire t={t} f={f} pts={[[960, 560], [720, 620]]} at={at(2, .4)} />
      <DiagramWire t={t} f={f} pts={[[960, 560], [1220, 620]]} at={at(3, .4)} />
    </g>
    <g opacity={b2}>
      <Label t={t} x={960} y={180} size={46}>Bắt đầu nhỏ</Label>
      {['chọn một use case thật', 'tách một phụ thuộc khó test nhất', 'viết một test không cần database'].map((text, k) =>
        <g key={text} opacity={grow(f, at(5 + k, 0), at(5 + k, 0) + 12)}>
          <Box x={960} y={330 + k * 150} w={900} h={110} accent={k === 0}>
            <Label t={t} x={600} y={370 + k * 150} anchor="start" size={38} color={p.accent}>{k + 1}</Label>
            <Label t={t} x={660} y={370 + k * 150} anchor="start" size={34} weight={400}>{text}</Label>
          </Box>
        </g>)}
      <Chip t={t} f={f} x={960} y={800} text="rồi lặp lại" at={at(8)} size={38} tone="accent2" />
    </g>
    <g opacity={b3}>
      <Label t={t} x={960} y={250} size={48} opacity={grow(f, at(9), at(9) + 12)}>Không hứa code chạy nhanh hơn</Label>
      <Label t={t} x={960} y={400} size={54} color={p.accent} opacity={grow(f, at(10), at(10) + 14)}>mà biết phải sửa ở đâu</Label>
      <Label t={t} x={960} y={520} size={36} weight={400} color={p.muted} opacity={grow(f, at(11), at(11) + 12)}>thứ đắt nhất trong một hệ thống sống đủ lâu</Label>
      <DiagramWire t={t} f={f} pts={[[960, 600], [960, 700]]} at={at(12)} />
      <Label t={t} x={960} y={800} size={44} opacity={grow(f, at(12, .4), at(12, .4) + 12)}>Cảm ơn bạn đã nghe đến đây</Label>
    </g>
  </Stage>;
};
