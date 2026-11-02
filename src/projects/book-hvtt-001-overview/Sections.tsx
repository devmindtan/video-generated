import {interpolate} from 'remotion';
import {GOLD, IVORY, clamp, ease} from './Intro';
import {Draw, Figure, Glow, Word, appear, section, within} from './scene-kit';
import type {Beat, Ctx} from './scene-kit';

// Body sections 1–3F and the closing remark of book-hvtt-001 (image-prompts.md). Each beat names the sentence
// (0-based, from scripts/projects/book-hvtt-001-overview/lines-<segment>.txt) where its drawing starts.
const D = (c: Ctx, d: string, delay = 0, len = 28, width = 2.4, opacity = 1) => <Draw key={`${d}${delay}`} d={d} frame={c.frame} from={c.start + delay} to={c.start + delay + len} width={width} opacity={opacity} />;
const At = (c: Ctx, sentence: number, d: string, len = 24, width = 2.4, opacity = 1) => <Draw key={`${d}${sentence}`} d={d} frame={c.frame} from={c.at(sentence)} to={c.at(sentence) + len} width={width} opacity={opacity} />;

// ---- shared small drawings -------------------------------------------------------------------------
const book = (c: Ctx, y = 330) => <g>
  {D(c, `M960 ${y + 40} C860 ${y} 720 ${y} 600 ${y + 30} L600 ${y + 330} C720 ${y + 300} 860 ${y + 300} 960 ${y + 340} C1060 ${y + 300} 1200 ${y + 300} 1320 ${y + 330} L1320 ${y + 30} C1200 ${y} 1060 ${y} 960 ${y + 40} Z`, 0, 34, 2.8)}
  {D(c, `M960 ${y + 40} L960 ${y + 340}`, 10, 20)}
  {[0, 1, 2, 3, 4].map((l) => D(c, `M650 ${y + 90 + l * 44} C730 ${y + 74 + l * 44} 840 ${y + 76 + l * 44} 920 ${y + 96 + l * 44} M1000 ${y + 96 + l * 44} C1080 ${y + 76 + l * 44} 1190 ${y + 74 + l * 44} 1270 ${y + 90 + l * 44}`, 18 + l * 4, 22, 2, .7))}
</g>;
const heart = (cx: number, cy: number, s: number) => `M${cx} ${cy + 60 * s} C${cx - 110 * s} ${cy - 10 * s} ${cx - 80 * s} ${cy - 90 * s} ${cx} ${cy - 40 * s} C${cx + 80 * s} ${cy - 90 * s} ${cx + 110 * s} ${cy - 10 * s} ${cx} ${cy + 60 * s} Z`;
const table = (c: Ctx, delay = 0) => D(c, 'M440 700 L1480 700 M500 700 L470 820 M1420 700 L1450 820', delay, 26, 2.4, .9);

// ---- 03 Cuốn sách là gì (lines-03-cuon-sach.txt, script v4) -------------------------------------------------
// 0p how this episode works (before the episode card, so no book title yet): 0–1 a narrator beside a closed
// book, which opens as they start retelling, its lines flowing to them; 2 the running order as one bar: retelling
// the book, then the closing parts (what falls short, personal opinion)
export const CachLam = section("01b cách làm của tập", /(cách làm của tập này|người kể lại|đúng điều tác giả viết|chưa đạt|ý kiến riêng|các phần cuối)/gi, [
  {at: 0, draw: (c) => {const open = appear(c.frame, c.at(1), 24), flow = interpolate(c.frame, [c.at(1) + 20, within(c, 1, .6)], [0, 1], clamp);return <g>
    <g opacity={1 - open}>{D(c, 'M860 400 L1160 400 L1160 700 L860 700 Z M880 400 L880 700', 0, 30, 2.6)}</g>
    <g opacity={open}>{book(c)}</g>
    {[0, 1, 2].map((k) => <path key={k} d={`M1330 ${430 + k * 50} C1400 ${420 + k * 50} 1440 ${470 + k * 40} 1490 ${480 + k * 30}`} fill="none" stroke={GOLD} strokeWidth={2} strokeDasharray="6 12" strokeDashoffset={-c.frame * 1.5} opacity={flow * .8} />)}
    <g opacity={appear(c.frame, c.start + 14, 14)}><Figure frame={c.frame} from={c.start + 14} x={1560} y={780} s={1} facing={-1} /></g>
  </g>;}},
  {at: 2, draw: (c) => {const tail = appear(c.frame, within(c, 2, .45), 18);return <g>
    {D(c, 'M360 560 L1300 560', 0, 30, 10, .9)}
    <Word x={830} y={520} size={32} text="KỂ LẠI CUỐN SÁCH" opacity={appear(c.frame, c.start + 20, 14)} />
    <path d="M1340 560 L1560 560" stroke={IVORY} strokeWidth={10} strokeLinecap="round" opacity={tail} />
    <text x={1450} y={620} textAnchor="middle" fill={IVORY} fontSize={28} fontWeight={700} opacity={tail}>chưa đạt · ý kiến riêng</text>
    <text x={1450} y={660} textAnchor="middle" fill={GOLD} fontSize={24} fontWeight={700} opacity={tail * .9}>ở cuối video</text>
  </g>;}},
]);

const CHAPTERS = ['KHỔ ĐAU', 'TỨC GIẬN', 'GHEN TUÔNG', 'CÔ ĐƠN', 'LO LẮNG', 'THA THỨ', 'LẮNG NGHE', 'BIẾT ĐỦ', 'BÌNH YÊN'];
const teapot = (c: Ctx, delay = 0) => D(c, 'M900 690 C880 650 900 610 960 610 C1020 610 1040 650 1020 690 Z M930 610 C930 594 990 594 990 610 M1020 640 C1050 636 1064 620 1072 600 M900 650 C880 650 872 670 884 684', delay, 26, 2.4);
export const CuonSach = section("03 cuốn sách", /(mục lục|năm mươi chương|vui buồn|không cần đọc theo thứ tự|đạo Phật|văn hóa Việt|tâm tình)/gi, [
  // 0 a hand opens the cover onto the table of contents
  {at: 0, draw: (c) => {const t = interpolate(c.frame, [c.start + 26, c.start + 50], [1, -1], {...clamp, easing: ease});return <g>{book(c)}
    {Math.abs(t) < .999 ? <path transform={`translate(960 0) scale(${t} 1) translate(-960 0)`} d="M960 370 C1060 330 1200 330 1320 360 L1320 660 C1200 630 1060 630 960 670 Z" fill="#0d1411" stroke={GOLD} strokeWidth={2.6} /> : null}
    <Word x={1140} y={430} size={34} text="MỤC LỤC" opacity={appear(c.frame, within(c, 0, .55), 14)} /></g>;}},
  // 1 the chapter names appear one by one as they are read
  {at: 1, draw: (c) => <g>{book(c, 360)}
    {CHAPTERS.map((name, k) => <Word key={name} x={k < 5 ? 780 : 1140} y={450 + (k % 5) * 52} size={28} text={name} opacity={appear(c.frame, within(c, 1, .12 + k * .09), 8)} />)}
    {Array.from({length: 50}, (_, i) => {const a = (i / 50) * Math.PI * 2 - Math.PI / 2;return <line key={i} x1={960 + Math.cos(a) * 470} y1={540 + Math.sin(a) * 260} x2={960 + Math.cos(a) * 494} y2={540 + Math.sin(a) * 274} stroke={GOLD} strokeWidth={3} strokeLinecap="round" opacity={appear(c.frame, c.start + 6 + i * 1.2, 6)} />;})}
  </g>},
  // 2 the names become windows of days, some lit, some dark
  {at: 2, draw: (c) => <g>{CHAPTERS.map((name, k) => {const x = 620 + (k % 3) * 240, y = 300 + Math.floor(k / 3) * 160, lit = [0, 2, 4, 5, 8].includes(k);return <g key={name} opacity={appear(c.frame, c.start + k * 4, 10)}>
    {lit ? <Glow x={x + 90} y={y + 60} r={90} opacity={.7 + .3 * Math.sin((c.frame + k * 13) / 20)} /> : null}
    <rect x={x} y={y} width={180} height={120} rx={6} fill="none" stroke={lit ? IVORY : GOLD} strokeWidth={2.4} /><path d={`M${x + 90} ${y} L${x + 90} ${y + 120} M${x} ${y + 60} L${x + 180} ${y + 60}`} stroke={GOLD} strokeWidth={2} opacity={.7} />
    <text x={x + 90} y={y + 150} textAnchor="middle" fill={IVORY} fontSize={22} fontWeight={700} opacity={.85}>{name}</text></g>;})}</g>},
  // 3 a finger turns straight to Lo Lắng, then to Tức Giận
  {at: 3, draw: (c) => {const second = appear(c.frame, within(c, 3, .55), 10);return <g>{book(c)}
    <Word x={1140} y={470} size={46} text="LO LẮNG" opacity={appear(c.frame, within(c, 3, .2), 10) * (1 - second)} />
    <Word x={1140} y={470} size={46} text="TỨC GIẬN" opacity={second} />
    <g transform={`translate(${1330 - second * 40} ${560 - second * 20})`} opacity={appear(c.frame, c.start + 10, 10)}>
      {/* index finger out to the left, thumb on top, three curled fingers under the palm, wrist and cuff to the right */}
      {D(c, 'M10 -6 L-92 -30 C-104 -32 -108 -14 -96 -10 L8 14', 10, 16, 2.6)}
      {D(c, 'M10 -6 C24 -30 70 -40 104 -22 L210 -30 M14 14 C20 30 36 44 60 48 C80 52 100 44 110 30 L214 34 M210 -42 L218 46', 14, 20, 2.6)}
      {D(c, 'M30 -20 C14 -40 -20 -46 -30 -36 C-36 -28 -20 -20 6 -14 M14 14 C4 22 6 34 20 34 L40 30 M30 32 C22 42 26 52 40 52 L58 48 M52 48 C48 58 54 64 66 62 L82 56', 18, 20, 2.2)}
    </g></g>;}},
  // 4 Buddhism, Vietnamese culture and the author's own path flow into the book
  {at: 4, quote: true, draw: (c) => <g>
    {D(c, 'M520 360 C548 392 556 430 520 470 C484 430 492 392 520 360 Z M520 470 C480 462 452 432 452 396 C484 404 508 428 520 470 Z M520 470 C560 462 588 432 588 396 C556 404 532 428 520 470 Z M440 492 L600 492', 0, 34)}
    {D(c, 'M820 440 C860 410 900 398 960 396 C1020 398 1060 410 1100 440 C1110 432 1116 424 1118 414 M820 440 C810 432 804 424 802 414 M850 440 L850 500 L1070 500 L1070 440 M935 500 L935 456 L985 456 L985 500', within(c, 4, .3) - c.start, 30)}
    {[[1360, 470, 20, 1], [1440, 380, 20, -1], [1490, 280, 20, 1]].map(([x, y, a, side], k) => <g key={k} transform={`translate(${x} ${y}) rotate(${a}) scale(${side} 1)`} opacity={appear(c.frame, within(c, 4, .55) + k * 6, 10)}>
      <path d="M0 -40 C14 -40 18 -24 16 -8 C14 6 10 14 10 26 C10 38 4 44 -4 44 C-12 44 -16 36 -14 24 C-12 10 -16 -2 -16 -16 C-16 -32 -10 -40 0 -40 Z" fill="none" stroke={GOLD} strokeWidth={2.4} />
    </g>)}
    {D(c, 'M520 500 C580 600 740 650 880 668 M960 500 L960 662 M1400 500 C1340 600 1180 650 1040 668', within(c, 4, .7) - c.start, 30, 2, .75)}
    {D(c, 'M860 700 L1060 700 L1072 676 L872 676 Z M860 700 L860 726 L1060 726 L1060 700', within(c, 4, .75) - c.start, 24, 2.4)}
  </g>},
  // 5 two people talking over tea; a thick textbook fades behind them
  {at: 5, draw: (c) => <g>
    <g opacity={.6 * (1 - appear(c.frame, within(c, 5, .55), 24))}><rect x={1300} y={260} width={240} height={300} rx={8} fill="none" stroke={GOLD} strokeWidth={2.4} /><text x={1420} y={420} textAnchor="middle" fill={GOLD} fontSize={30} fontWeight={700}>GIÁO TRÌNH</text></g>
    {D(c, 'M760 700 L1160 700 M800 700 L790 790 M1120 700 L1130 790', 0, 24, 2.4, .9)}
    {teapot(c, 10)}
    <Figure frame={c.frame} from={c.start + 4} x={640} y={790} s={1.1} pose="sit" arm="reach" />
    <Figure frame={c.frame} from={c.start + 10} x={1280} y={790} s={1.1} pose="sit" facing={-1} />
    {[0, 1, 2].map((k) => <path key={k} d={`M${940 + k * 18} 596 C${930 + k * 18 + Math.sin((c.frame + k * 20) / 16) * 8} 570 ${950 + k * 18} 550 ${940 + k * 18} 524`} fill="none" stroke={IVORY} strokeWidth={2} strokeLinecap="round" opacity={appear(c.frame, c.start + 30, 12) * .7} />)}
  </g>},
]);

// ---- 04 Sợi chỉ xuyên suốt (lines-04-soi-chi.txt) -------------------------------------------------------------
const threadY = (x: number) => 520 - Math.sin((x - 300) / 160 * Math.PI) * 40;
export const SoiChi = section("04 sợi chỉ", /(một ý|cách lòng mình phản ứng|đau và khổ|ba tầng|hạnh phúc chân thật|phải hiểu thì mới thương|bốn nhóm)/gi, [
  // 0 fifty beads gather on one thread · then a pebble drops in a pond and its rings spread (the heart's reaction)
  {at: 0, draw: (c) => {const pond = appear(c.frame, within(c, 0, .5), 18);return <g>
    <g opacity={1 - pond}>{D(c, 'M' + Array.from({length: 67}, (_, i) => `${300 + i * 20} ${threadY(300 + i * 20)}`).join(' L'), 0, 50, 2.4)}
      {Array.from({length: 50}, (_, i) => {const x = 320 + i * 26;return <circle key={i} cx={x} cy={threadY(x)} r={7} fill="none" stroke={GOLD} strokeWidth={2.2} opacity={appear(c.frame, c.start + 8 + i, 6)} />;})}</g>
    <g opacity={pond}>
      <circle cx={960} cy={interpolate(c.frame, [within(c, 0, .5), within(c, 0, .6)], [300, 620], clamp)} r={14} fill="none" stroke={IVORY} strokeWidth={2.6} opacity={1 - appear(c.frame, within(c, 0, .62), 6)} />
      {[0, 1, 2, 3].map((k) => {const t = interpolate(c.frame, [within(c, 0, .6) + k * 12, within(c, 0, .6) + k * 12 + 60], [0, 1], clamp);return <ellipse key={k} cx={960} cy={640} rx={30 + t * 380} ry={8 + t * 70} fill="none" stroke={GOLD} strokeWidth={2.2} opacity={t > 0 ? (1 - t) : 0} />;})}
      {D(c, 'M420 640 C600 620 800 660 960 640 C1120 620 1320 660 1500 640', within(c, 0, .5) - c.start, 30, 2, .6)}
    </g></g>;}},
  // 1 two words lift off the first page
  {at: 1, draw: (c) => {const lift = appear(c.frame, within(c, 1, .4), 24);return <g>{book(c, 420)}
    <Word x={780 - lift * 60} y={560 - lift * 160} size={60 + lift * 30} text="ĐAU" opacity={appear(c.frame, c.start + 20, 10)} />
    <Word x={1140 + lift * 60} y={560 - lift * 160} size={60 + lift * 30} text="KHỔ" opacity={appear(c.frame, c.start + 26, 10)} /></g>;}},
  // 2 the two words apart, with the quote
  {at: 2, quote: true, draw: (c) => <g>
    <Word x={640} y={560} size={150} text="ĐAU" opacity={appear(c.frame, c.start, 14)} />
    <Word x={1280} y={560} size={150} text="KHỔ" opacity={appear(c.frame, c.start + 10, 14)} />
    {D(c, 'M960 380 L960 640', 6, 20, 2.2, .8)}
  </g>},
  // 3 pain: a scratch on a hand · suffering: a person holding their head, thoughts circling round and round
  {at: 3, draw: (c) => {const spin = c.frame / 10, right = appear(c.frame, within(c, 3, .35), 14);return <g>
    <Word x={600} y={300} size={44} text="ĐAU" opacity={appear(c.frame, c.start, 10)} />
    {/* someone standing, forearm held out, looking at a small scratch on it (forearm ≈ (666,569)–(721,573)) */}
    <Figure frame={c.frame} from={c.start + 4} x={600} y={800} s={1.1} arm="reach" />
    {D(c, 'M684 560 L700 576 M696 556 L712 572', 22, 8, 3)}
    <g opacity={appear(c.frame, c.start + 30, 10) * (.6 + .4 * Math.sin(c.frame / 6))}>{D(c, 'M690 530 L686 512 M710 534 L720 518 M672 538 L658 526', 30, 8, 2.2)}</g>
    <g opacity={right}>
      <Word x={1320} y={300} size={44} text="KHỔ" opacity={1} />
      <Figure frame={c.frame} from={within(c, 3, .35)} x={1320} y={800} s={1.1} pose="headHold" />
      {[0, 1, 2].map((k) => <circle key={k} cx={1320 + Math.cos(spin + k * 2.1) * 120} cy={420 + Math.sin(spin + k * 2.1) * 40} r={14 - k * 3} fill="none" stroke={IVORY} strokeWidth={2.2} />)}
      <ellipse cx={1320} cy={420} rx={120} ry={40} fill="none" stroke={GOLD} strokeWidth={1.8} opacity={.5} strokeDasharray="6 10" />
    </g></g>;}},
  // 4 three steps of happiness, each lit as it is named: a dish and a word of praise · a flag at the top · a calm lamp
  {at: 4, draw: (c) => <g>
    {D(c, 'M420 800 L760 800 L760 670 L1100 670 L1100 540 L1440 540', 0, 34, 3)}
    {[.12, .45, .78].map((share, k) => <g key={k} opacity={appear(c.frame, within(c, 4, share), 12)}>
      <Glow x={590 + k * 340} y={[740, 610, 480][k]} r={120} opacity={.8} />
      <Word x={590 + k * 340} y={[790, 660, 530][k]} size={44} text={String(k + 1)} opacity={.9} />
    </g>)}
    <g opacity={appear(c.frame, within(c, 4, .12), 12)}><path d="M520 760 C520 730 660 730 660 760 Z M530 760 L650 760" fill="none" stroke={IVORY} strokeWidth={2.4} /><path d="M540 700 C560 680 600 680 620 700 C600 712 560 712 540 700 Z" fill="none" stroke={IVORY} strokeWidth={2.2} /></g>
    <g opacity={appear(c.frame, within(c, 4, .45), 12)}><path d={`M930 630 L930 540 L${1000 + Math.sin(c.frame / 8) * 6} 560 L930 580`} fill="none" stroke={IVORY} strokeWidth={2.4} /></g>
    <g opacity={appear(c.frame, within(c, 4, .78), 12)}><path d="M1270 500 L1270 420 M1230 420 L1310 420 L1290 380 L1250 380 Z" fill="none" stroke={IVORY} strokeWidth={2.4} /><Glow x={1270} y={400} r={70} opacity={.9} /></g>
  </g>},
  // 5 understanding before loving: an eye, then a heart
  {at: 5, draw: (c) => <g>
    {D(c, 'M720 520 C800 440 920 440 1000 520 C920 600 800 600 720 520 Z M860 520 m-34 0 a34 34 0 1 0 68 0 a34 34 0 1 0 -68 0', 0, 28, 2.6)}
    {D(c, heart(1200, 520, 1), within(c, 5, .55) - c.start, 30, 2.6)}
    {D(c, 'M1020 520 L1090 520 M1070 500 L1090 520 L1070 540', within(c, 5, .45) - c.start, 14, 2.4)}
  </g>},
  // 6 two hearts lock together, with the quote
  {at: 6, quote: true, draw: (c) => {const join = appear(c.frame, c.start + 10, 30);return <g>
    <path d={heart(810 + join * 90, 500, 1.3)} fill="none" stroke={GOLD} strokeWidth={2.6} />
    <path d={heart(1110 - join * 90, 500, 1.3)} fill="none" stroke={IVORY} strokeWidth={2.6} />
    <Glow x={960} y={500} r={200} opacity={join * .8} /></g>;}},
  // 7 four groups, one card each
  {at: 7, draw: (c) => <g>{[0, 1, 2, 3].map((k) => {const x = 470 + k * 260;return <g key={k} opacity={appear(c.frame, c.start + k * 6, 10)}><rect x={x} y={420} width={200} height={240} rx={14} fill="none" stroke={GOLD} strokeWidth={2.2} /><Word x={x + 100} y={570} size={90} text={String(k + 1)} opacity={1} /></g>;})}</g>},
]);

// ---- 05 Nhóm 3A (lines-05-nhom-3a.txt) ----------------------------------------------------------------------
const kettle = (c: Ctx) => <g>
  {D(c, 'M760 640 C740 560 780 470 960 470 C1140 470 1180 560 1160 640 Z M880 470 C880 440 1040 440 1040 470 M1160 560 C1220 560 1260 520 1290 480 M760 560 C720 560 700 600 720 640', 0, 34, 2.6)}
  {D(c, 'M700 640 L1220 640 M780 640 L760 700 M1140 640 L1160 700', 8, 24, 2.4, .9)}
</g>;
const flame = (c: Ctx, from: number, to: number) => {const k = interpolate(c.frame, [from, to], [1, .4], clamp), f = 1 + Math.sin(c.frame / 3) * .06 * k;return <path d={`M960 ${760 - 70 * k * f} C${930 - 10 * k} ${740 - 30 * k} 930 760 960 780 C990 760 ${990 + 10 * k} ${740 - 30 * k} 960 ${760 - 70 * k * f} Z`} fill="none" stroke={GOLD} strokeWidth={2.2} />;};
// the hand holding a glass (one outline: wrist, fingers up the glass's left side, palm under it, thumb up the right)
const glassHand = (c: Ctx, from: number) => D(c, 'M936 720 L932 530 C924 500 900 488 890 462 C884 444 884 410 888 396 C890 386 902 384 904 396 L906 432 C920 438 1000 438 1012 432 L1018 404 C1020 392 1032 390 1034 402 C1038 426 1036 452 1022 474 C1010 494 1002 506 1000 530 L1004 720', from - c.start, 34, 2.6);
const glass = (c: Ctx, from: number) => D(c, 'M900 300 L912 420 L1008 420 L1020 300 Z M906 340 L1014 340', from - c.start, 24, 2.6);
export const Nhom3A = section("05 nhóm 3A", /(giận, sợ và lo|bực bội nhỏ|hơi thở|hiểu được người kia|tình thương chính là khắc tinh của cơn giận|tai nạn|đã thật sự xảy ra chưa|cốc nước|quá lâu|viết ra|bớt lo lắng)/gi, [
  {at: 0, card: {kicker: 'NHÓM 1', title: 'Hiểu những cơn sóng trong lòng mình'}},
  // 1–2 a kettle; small bubbles pile up one by one ("rất nhiều bực bội nhỏ")
  {at: 1, label: 'Cơn giận', draw: (c) => <g>{kettle(c)}{flame(c, 1e9, 1e9 + 1)}
    {Array.from({length: 9}, (_, k) => <circle key={k} cx={880 + (k % 3) * 80 + Math.sin(c.frame / 6 + k) * 4} cy={600 - Math.floor(k / 3) * 40} r={10 + (k % 2) * 4} fill="none" stroke={IVORY} strokeWidth={2.2} opacity={appear(c.frame, within(c, 2, .1 + k * .08), 8)} />)}
    {[0, 1, 2].map((k) => <path key={k} d={`M${1290 + k * 10} ${470 - k * 6} C${1270 + k * 10} ${430 - k * 40} ${1320 + k * 10} ${400 - k * 40} ${1300 + k * 10} ${360 - k * 40}`} fill="none" stroke={IVORY} strokeWidth={2.4} strokeLinecap="round" opacity={appear(c.frame, within(c, 2, .8) + k * 8, 10)} />)}
  </g>},
  // 3 someone steps out onto the porch and breathes; the flame under the kettle sinks
  {at: 3, draw: (c) => {const out = interpolate(c.frame, [c.start, within(c, 3, .35)], [0, 1], {...clamp, easing: ease});return <g>
    <g transform="translate(-180 200) scale(.5)">{kettle(c)}{flame(c, c.start, within(c, 3, .9))}</g>
    {D(c, 'M760 800 L1560 800 M820 800 L820 360 L1100 360 L1100 800', 0, 26, 2.4, .8)}
    <Figure frame={c.frame} from={c.start} x={900 + out * 380} y={800} s={1.15} pose={out < 1 ? 'walk' : 'stand'} />
    <circle cx={1280} cy={560} r={46 + 22 * Math.sin((c.frame - c.start) / 20)} fill="none" stroke={IVORY} strokeWidth={2.4} opacity={appear(c.frame, within(c, 3, .4), 12) * .85} />
  </g>;}},
  // 4 two people sitting face to face; a heart between them, with the quote
  {at: 4, quote: true, draw: (c) => <g>
    <Figure frame={c.frame} from={c.start} x={700} y={790} s={1.1} pose="sit" />
    <Figure frame={c.frame} from={c.start + 8} x={1220} y={790} s={1.1} pose="sit" facing={-1} />
    {D(c, heart(960, 470, .8), within(c, 4, .45) - c.start, 26, 2.6)}
    <Glow x={960} y={470} r={130} opacity={appear(c.frame, within(c, 4, .5), 20)} />
  </g>},
  // 5 a phone face down on the table; the clock spins
  {at: 5, label: 'Trí tưởng tượng', draw: (c) => <g>{table(c)}
    {D(c, 'M760 700 L760 676 L900 676 L900 700', 6, 16, 2.4)}
    {D(c, 'M1180 610 m-56 0 a56 56 0 1 0 112 0 a56 56 0 1 0 -112 0', 10, 26, 2.4)}
    <path d={`M1180 610 L${1180 + Math.cos(c.frame / 4) * 40} ${610 + Math.sin(c.frame / 4) * 40} M1180 610 L${1180 + Math.cos(c.frame / 30) * 26} ${610 + Math.sin(c.frame / 30) * 26}`} stroke={IVORY} strokeWidth={2.6} strokeLinecap="round" opacity={appear(c.frame, c.start + 20, 10)} />
  </g>},
  // 6–7 a thought bubble swells with a picture of a crash; 8 it shrinks and the door opens, someone walks in
  {at: 6, quote: true, draw: (c) => {
    const grow = interpolate(c.frame, [within(c, 6, .3), within(c, 6, .9), c.at(8), c.at(8) + 30], [.3, 1, 1, .2], clamp), home = appear(c.frame, within(c, 8, .45), 20);
    return <g>{table(c)}
      {D(c, 'M760 700 L760 676 L900 676 L900 700', 0, 1, 2.4)}
      <g transform={`translate(830 430) scale(${grow})`} opacity={appear(c.frame, within(c, 6, .3), 12)}>
        <path d="M-180 -40 C-200 -120 -100 -170 -40 -140 C0 -200 120 -190 140 -120 C220 -120 230 -20 160 0 C170 60 60 80 20 40 C-40 80 -160 60 -140 0 C-200 0 -210 -40 -180 -40 Z" fill="none" stroke={IVORY} strokeWidth={2.2 / grow} />
        <path d="M-90 -40 L-40 -80 L40 -80 L80 -40 L80 0 L-90 0 Z M-60 0 m-16 0 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0 M50 0 m-16 0 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0 M100 -70 L130 -100 M110 -40 L150 -50" fill="none" stroke={GOLD} strokeWidth={2.2 / grow} opacity={appear(c.frame, within(c, 6, .6), 12)} />
      </g>
      <g opacity={home}>{D(c, 'M1300 800 L1300 380 L1500 380 L1500 800', within(c, 8, .45) - c.start, 20, 2.4)}<Figure frame={c.frame} from={within(c, 8, .5)} x={1400 - home * 160} y={800} s={1} pose="walk" facing={-1} /></g>
    </g>;
  }},
  // 9–10 a hand holds a glass up while the clock runs from minutes to hours to a whole day; the arm trembles
  {at: 9, label: 'Lo lắng', draw: (c) => {
    const tremble = interpolate(c.frame, [c.at(10), c.at(11)], [0, 7], clamp) * Math.sin(c.frame * 1.7);
    const words = ['VÀI PHÚT', 'MỘT GIỜ', 'CẢ NGÀY'], k = Math.min(2, Math.floor(interpolate(c.frame, [c.at(10), c.at(11)], [0, 3], clamp)));
    return <g>
      <g transform={`translate(${tremble} 0)`}>{glass(c, c.start + 6)}{glassHand(c, c.start + 14)}</g>
      {c.frame >= c.at(10) ? <Word x={1400} y={420} size={44} text={words[k]} opacity={appear(c.frame, c.at(10), 8)} /> : null}
    </g>;
  }},
  // 11 the glass becomes a heavy stone
  {at: 11, draw: (c) => {const stone = appear(c.frame, c.start + 10, 20), tremble = 7 * Math.sin(c.frame * 1.7);return <g transform={`translate(${tremble} 0)`}>
    <g opacity={1 - stone}>{glass(c, c.start - 40)}</g>
    {/* an angular rock with facets, the same size as the glass it replaces */}
    <path d="M892 424 L878 384 L900 336 L948 316 L1002 322 L1032 356 L1040 400 L1022 426 Z M900 336 L938 372 L1002 322 M938 372 L932 424 M938 372 L1032 356" fill="none" stroke={IVORY} strokeWidth={2.6} strokeLinejoin="round" opacity={stone} />
    {glassHand(c, c.start - 40)}</g>;}},
  // 12 a page; four lines written one after another: worry, worst case, do now, put down
  {at: 12, draw: (c) => <g>
    {D(c, 'M720 260 L1200 260 L1200 760 L720 760 Z', 0, 24, 2.4)}
    {['Điều đang lo', 'Kết quả xấu nhất', 'Việc làm ngay', 'Việc đặt xuống'].map((t, k) => <g key={t} opacity={appear(c.frame, within(c, 12, .15 + k * .2), 10)}>
      <circle cx={770} cy={350 + k * 100} r={8} fill={GOLD} /><text x={800} y={362 + k * 100} fill={IVORY} fontSize={36} fontWeight={700}>{t}</text></g>)}
  </g>},
  // 13 the glass is set down on the table, with the quote
  {at: 13, quote: true, draw: (c) => {const down = appear(c.frame, c.start + 4, 26);return <g>{table(c)}
    <g transform={`translate(0 ${down * 280})`}>{glass(c, c.start - 40)}</g>
    <g opacity={1 - down}>{glassHand(c, c.start - 40)}</g>
    <Glow x={960} y={640} r={120} opacity={down * .7} /></g>;}},
]);

// ---- 06 Nhóm 3B (lines-06-nhom-3b.txt) ----------------------------------------------------------------------
// Front view of a chair standing on y: backrest, seat, four legs.
const chair = (x: number, y: number) => `M${x - 40} ${y - 70} L${x - 40} ${y - 170} L${x + 40} ${y - 170} L${x + 40} ${y - 70} M${x - 40} ${y - 140} L${x + 40} ${y - 140} M${x - 40} ${y - 70} L${x + 40} ${y - 70} L${x + 50} ${y - 56} L${x - 50} ${y - 56} Z M${x - 50} ${y - 56} L${x - 50} ${y} M${x + 50} ${y - 56} L${x + 50} ${y} M${x - 34} ${y - 56} L${x - 34} ${y - 14} M${x + 34} ${y - 56} L${x + 34} ${y - 14}`;
const caltrop = (c: Ctx, horns: number) => <g>
  <path d="M960 380 C1080 380 1160 450 1160 520 C1160 600 1080 650 960 650 C840 650 760 600 760 520 C760 450 840 380 960 380 Z" fill="none" stroke={GOLD} strokeWidth={2.6} opacity={appear(c.frame, c.start, 16)} />
  {[-1, 1].map((k) => {const bx = 960 + k * 196, tx = 960 + k * (200 + 190 * horns), ty = 520 + 70 * horns;return <path key={k} d={`M${bx} 486 C${bx + k * 90} ${470 - 50 * horns} ${tx} ${ty - 110 * horns} ${tx} ${ty} C${tx - k * 30} ${ty - 70 * horns} ${bx + k * 60} 520 ${bx - k * 4} 556`} fill="none" stroke={GOLD} strokeWidth={2.6} strokeLinejoin="round" opacity={horns} />;})}
</g>;
export const Nhom3B = section("06 nhóm 3B", /(tuy hai mà một|tuy một mà hai|cái bóng|bị bỏ rơi|nhờ người kia giúp|củ ấu|tình lẫn nghĩa|đừng vội quyết định|một gang rưỡi|vị tha|nói thật|thấy vậy chứ không phải vậy|lắng xuống)/gi, [
  {at: 0, card: {kicker: 'NHÓM 2', title: 'Thương và được thương'}},
  // 1–3 two people side by side; the folk verse, two circles as one, then the second half and the circles part
  {at: 1, label: 'Ghen tuông', draw: (c) => {const sep = interpolate(c.frame, [within(c, 3, .4), within(c, 3, .9)], [0, 1], {...clamp, easing: ease});return <g>
    <Figure frame={c.frame} from={c.start} x={880 - sep * 120} y={820} s={1} />
    <Figure frame={c.frame} from={c.start + 6} x={1040 + sep * 120} y={820} s={1} facing={-1} />
    <g transform={`translate(${-150 * sep} 0)`} opacity={appear(c.frame, c.at(2), 14)}><circle cx={880} cy={380} r={110} fill="none" stroke={GOLD} strokeWidth={2.4} /></g>
    <g transform={`translate(${150 * sep} 0)`} opacity={appear(c.frame, c.at(2) + 8, 14)}><circle cx={1040} cy={380} r={110} fill="none" stroke={IVORY} strokeWidth={2.4} /></g>
    <Word x={960} y={240} size={38} text={c.frame < c.at(3) ? 'TUY HAI MÀ MỘT' : 'TUY MỘT MÀ HAI'} opacity={appear(c.frame, c.at(2), 12)} />
  </g>;}},
  // 4 each on their own chair, with their own things: a guitar, a book, friends
  {at: 4, draw: (c) => <g>
    {D(c, `${chair(700, 790)} ${chair(1220, 790)} M500 790 L1420 790`, 0, 26, 2.4)}
    <Figure frame={c.frame} from={c.start + 6} x={700} y={790} s={1} pose="sit" />
    <Figure frame={c.frame} from={c.start + 10} x={1220} y={790} s={1} pose="sit" facing={-1} />
    {D(c, 'M520 600 C500 640 520 700 560 700 C600 700 610 650 590 610 C580 590 560 580 540 586 Z M560 610 L620 450 M610 460 L640 440', within(c, 4, .5) - c.start, 24, 2.2)}
    {D(c, 'M1360 640 L1460 620 L1470 700 L1370 720 Z M1415 630 L1420 710', within(c, 4, .6) - c.start, 20, 2.2)}
  </g>},
  // 5 someone sits alone, a long shadow beside them ("cảm giác bị bỏ rơi")
  {at: 5, draw: (c) => <g>
    <Figure frame={c.frame} from={c.start} x={960} y={790} s={1.15} pose="headHold" />
    <path d="M1000 792 L1500 820 L1500 840 L1000 800 Z" fill={GOLD} opacity={.12 * appear(c.frame, c.start + 16, 20)} />
    {D(c, 'M600 790 L1520 790', 4, 24, 2.2, .8)}
  </g>},
  // 6 one reaches out a hand to the other
  {at: 6, draw: (c) => <g>
    <Figure frame={c.frame} from={c.start} x={800} y={820} s={1.1} arm={c.frame > within(c, 6, .5) ? 'reach' : 'down'} />
    <Figure frame={c.frame} from={c.start + 6} x={1120} y={820} s={1.1} facing={-1} arm={c.frame > within(c, 6, .75) ? 'reach' : 'down'} />
    <Glow x={960} y={600} r={110} opacity={appear(c.frame, within(c, 6, .8), 16)} />
  </g>},
  // 7–8 a caltrop that looks round inside a heart, then its horns show
  {at: 7, label: 'Nhàm chán', quote: true, draw: (c) => <g>{caltrop(c, interpolate(c.frame, [within(c, 8, .55), within(c, 8, .9)], [0, 1], clamp))}
    <path d={heart(960, 520, 2.4)} fill="none" stroke={IVORY} strokeWidth={2} opacity={appear(c.frame, c.start + 6, 14) * (1 - appear(c.frame, within(c, 8, .55), 20))} /></g>},
  // 9 two people hold up a small roof together (love and duty)
  {at: 9, draw: (c) => <g>
    <Figure frame={c.frame} from={c.start} x={820} y={820} s={1.05} arm="raise" />
    <Figure frame={c.frame} from={c.start + 6} x={1100} y={820} s={1.05} arm="raise" facing={-1} />
    {D(c, 'M760 420 L960 300 L1160 420 Z M800 420 L1120 420', within(c, 9, .3) - c.start, 24, 2.6)}
  </g>},
  // 10 a pen stops above a paper and does not sign
  {at: 10, draw: (c) => {const hover = Math.sin(c.frame / 8) * 6;return <g>{table(c)}
    {D(c, 'M760 690 L1080 690 L1100 560 L780 560 Z M800 600 L1040 600 M800 630 L1000 630 M820 660 L900 660', 0, 24, 2.4)}
    <g transform={`translate(0 ${hover - interpolate(c.frame, [within(c, 10, .5), within(c, 10, .8)], [0, 60], clamp)})`}>{D(c, 'M960 640 L1120 420 L1140 434 L980 654 Z', 10, 18, 2.4)}</g></g>;}},
  // 11–12 a heart measured with a hand span, a smaller ache fits inside, then the heart widens
  {at: 11, label: 'Tha thứ', draw: (c) => {const w = interpolate(c.frame, [within(c, 12, .5), within(c, 12, .95)], [180, 300], clamp);return <g>
    <path d={`M${960 - w} 420 C${960 - w} 620 ${960 - w / 2} 680 960 680 C${960 + w / 2} 680 ${960 + w} 620 ${960 + w} 420`} fill="none" stroke={GOLD} strokeWidth={2.8} opacity={appear(c.frame, c.start, 14)} />
    <ellipse cx={960} cy={420} rx={w} ry={w * .14} fill="none" stroke={GOLD} strokeWidth={2.6} opacity={appear(c.frame, c.start + 8, 14)} />
    <path d="M900 600 L930 560 L960 600 L990 560 L1020 600" fill="none" stroke={IVORY} strokeWidth={2.4} opacity={appear(c.frame, within(c, 12, .3), 12)} />
    <path d={`M${960 - w} 360 L${960 + w} 360 M${960 - w} 350 L${960 - w} 370 M${960 + w} 350 L${960 + w} 370`} stroke={IVORY} strokeWidth={2.2} opacity={appear(c.frame, c.at(12), 10) * .8} /></g>;}},
  // 13 a closed fist (selfish) opens into a wide palm (generous), with the quote
  {at: 13, quote: true, draw: (c) => {const open = appear(c.frame, within(c, 13, .4), 20);return <g>
    <Word x={640} y={360} size={44} text="VỊ KỶ" opacity={appear(c.frame, c.start, 10) * (1 - open * .6)} />
    <Word x={1280} y={360} size={44} text="VỊ THA" opacity={open} />
    {/* a clenched fist: four knuckles on top, thumb across the front, wrist below */}
    <path d="M540 480 C540 456 580 456 584 480 C584 456 624 456 628 480 C628 456 668 456 672 480 C672 456 712 456 716 482 L720 600 C720 640 680 660 630 660 C580 660 540 640 540 600 Z M540 540 C580 520 650 524 690 548 M584 480 L586 520 M628 480 L630 520 M672 480 L674 520 M580 660 L584 760 M690 652 L686 760" fill="none" stroke={GOLD} strokeWidth={2.6} strokeLinejoin="round" opacity={1 - open * .6} />
    {/* an open palm: four fingers up, thumb out to the side, wrist below */}
    <path d="M1210 760 L1214 640 C1190 620 1150 580 1140 540 C1136 524 1156 516 1166 530 L1206 580 L1204 420 C1204 400 1232 400 1232 420 L1236 540 L1244 390 C1244 370 1272 370 1272 390 L1272 540 L1282 400 C1282 380 1310 380 1310 400 L1306 548 L1324 440 C1326 422 1352 424 1350 444 L1332 600 C1326 630 1310 640 1306 650 L1302 760" fill="none" stroke={IVORY} strokeWidth={2.6} strokeLinejoin="round" opacity={open} />
    <Glow x={1250} y={540} r={180} opacity={open * .6} /></g>;}},
  // 14 one speaks honestly, the other nods
  {at: 14, draw: (c) => <g>
    <Figure frame={c.frame} from={c.start} x={720} y={790} s={1.1} pose="sit" arm="reach" />
    <g transform={`rotate(${Math.sin(c.frame / 10) * 2} 1200 540)`}><Figure frame={c.frame} from={c.start + 6} x={1200} y={790} s={1.1} pose="sit" facing={-1} /></g>
    {[0, 1, 2].map((k) => <path key={k} d={`M${860 + k * 22} 470 C${880 + k * 22} 500 ${880 + k * 22} 540 ${860 + k * 22} 570`} fill="none" stroke={IVORY} strokeWidth={2.2} opacity={appear(c.frame, within(c, 14, .3) + k * 5, 8) * .8} />)}
  </g>},
  // 15–16 a frame closes round one person after one bad moment; 17 the frame dissolves, with the quote
  {at: 15, label: 'Lắng nghe và phán xét', quote: true, draw: (c) => {const frameGone = interpolate(c.frame, [within(c, 17, .4), within(c, 17, .7)], [1, 0], clamp);return <g>
    <Figure frame={c.frame} from={c.start} x={960} y={720} s={1.25} />
    <g opacity={appear(c.frame, within(c, 16, .5), 12) * frameGone}><rect x={760} y={240} width={400} height={500} fill="none" stroke={IVORY} strokeWidth={4} /></g></g>;}},
  // 18 the pond goes still; then one leans in to listen
  {at: 18, draw: (c) => {const still = appear(c.frame, c.start, 40);return <g>
    {[0, 1, 2].map((k) => <ellipse key={k} cx={960} cy={760} rx={120 + k * 120} ry={(24 + k * 18) * (1 - still * .6)} fill="none" stroke={GOLD} strokeWidth={2.2} opacity={(1 - k * .28) * (1 - still * .5)} />)}
    <g opacity={appear(c.frame, within(c, 18, .5), 16)}>
      <Figure frame={c.frame} from={within(c, 18, .5)} x={760} y={700} s={.9} pose="sit" arm="reach" />
      <g transform="rotate(-8 1160 600)"><Figure frame={c.frame} from={within(c, 18, .55)} x={1160} y={700} s={.9} pose="sit" facing={-1} /></g>
    </g></g>;}},
]);

// ---- 07 Nhóm 3C (lines-07-nhom-3c.txt) ----------------------------------------------------------------------
const salt = (c: Ctx, x: number, y: number, from: number, spread = 1) => Array.from({length: 14}, (_, i) => {
  const fall = interpolate(c.frame, [from + i * 3, from + i * 3 + 16], [-110, 0], {...clamp, easing: ease});
  return <circle key={i} cx={x + Math.sin(i * 2.3) * 34 * spread} cy={y + fall + (i % 3) * 7} r={5} fill={IVORY} opacity={appear(c.frame, from + i * 3, 4)} />;
});
// A cow facing right, standing on the ground line at y: body, head with horns, four legs, tail.
const cow = (x: number, y: number, s: number) => {
  const P = (dx: number, dy: number) => `${x + dx * s} ${y + dy * s}`;
  return `M${P(0, -24)} L${P(0, -58)} Q${P(0, -66)} ${P(8, -66)} L${P(76, -66)} L${P(88, -72)} L${P(104, -70)} L${P(108, -54)} L${P(98, -48)} L${P(84, -52)} L${P(80, -24)} Z`
    + ` M${P(8, -24)} L${P(8, 0)} M${P(20, -24)} L${P(20, 0)} M${P(62, -24)} L${P(62, 0)} M${P(74, -24)} L${P(74, 0)}`
    + ` M${P(92, -72)} L${P(88, -82)} M${P(100, -71)} L${P(104, -81)} M${P(0, -56)} C${P(-10, -52)} ${P(-12, -38)} ${P(-8, -30)}`;
};
const wall = (c: Ctx, delay = 0) => <g>{[0, 1, 2, 3, 4].map((row) => Array.from({length: 6 - row}, (_, i) => {const x = 640 + i * 110 + (row % 2) * 55, y = 700 - row * 56;return <rect key={`${row}-${i}`} x={x} y={y} width={100} height={48} rx={4} fill="none" stroke={GOLD} strokeWidth={2.2} opacity={appear(c.frame, c.start + delay + row * 8 + i * 2, 8)} />;}))}</g>;
export const Nhom3C = section("07 nhóm 3C", /(chịu|đựng|vốc muối|dòng sông|lòng mình rộng ra|chưa thành công|nhìn lại|con bò|bỏ hết mọi thứ|bỏ bớt vài thùng hàng|nỗi lo|khó buông nhất|sợ bị chê|mùa thu|thảnh thơi|để mà đi)/gi, [
  {at: 0, card: {kicker: 'NHÓM 3', title: 'Đi qua những lúc thăng trầm'}},
  // 1–2 the two words, each with its meaning, with the quote
  {at: 1, label: 'Chịu đựng', quote: true, draw: (c) => <g>
    <Word x={660} y={500} size={120} text="CHỊU" opacity={appear(c.frame, c.start, 14)} />
    <Word x={1260} y={500} size={120} text="ĐỰNG" opacity={appear(c.frame, within(c, 2, .45), 14)} />
    <text x={660} y={580} textAnchor="middle" fill={GOLD} fontSize={34} fontWeight={700} opacity={appear(c.frame, within(c, 2, .1), 12)}>đồng ý chấp nhận</text>
    <text x={1260} y={580} textAnchor="middle" fill={GOLD} fontSize={34} fontWeight={700} opacity={appear(c.frame, within(c, 2, .6), 12)}>khả năng dung chứa</text>
  </g>},
  // 3 a handful of salt into a bowl (too salty), then into a river (still drinkable); 4 the river widens
  {at: 3, draw: (c) => {const river = appear(c.frame, within(c, 3, .55), 24), wide = interpolate(c.frame, [c.at(4), c.at(4) + 40], [0, 50], clamp);return <g>
    <g opacity={1 - river}>{D(c, 'M780 520 L1140 520 C1130 640 1060 700 960 700 C860 700 790 640 780 520 Z M800 560 L1120 560', 0, 30, 2.6)}{salt(c, 960, 640, within(c, 3, .15))}
      {D(c, 'M900 300 C900 380 1020 380 1020 300 M890 300 L1030 300', within(c, 3, .05) - c.start, 14, 2.4)}</g>
    {D(c, `M300 ${640 - wide} C460 ${600 - wide} 620 ${680 - wide} 780 ${640 - wide} C940 ${600 - wide} 1100 ${680 - wide} 1260 ${640 - wide} C1420 ${600 - wide} 1540 ${660 - wide} 1620 ${640 - wide} M300 ${720 + wide} C460 ${680 + wide} 620 ${760 + wide} 780 ${720 + wide} C940 ${680 + wide} 1100 ${760 + wide} 1260 ${720 + wide} C1420 ${680 + wide} 1540 ${740 + wide} 1620 ${720 + wide}`, within(c, 3, .55) - c.start, 36, 2.2)}
    <g opacity={river * (1 - appear(c.frame, c.at(4), 40))}>{salt(c, 960, 674, within(c, 3, .6), 5)}</g>
  </g>;}},
  // 5 a half-built wall, still standing
  {at: 5, label: 'Thất bại', draw: (c) => wall(c)},
  // 6 "thất bại" is crossed out, "chưa thành công" written in, with the quote
  {at: 6, quote: true, draw: (c) => {const cross = appear(c.frame, within(c, 6, .45), 12);return <g>
    <g transform="translate(480 330) scale(.5)" opacity={.6}>{wall(c, -60)}</g>
    <Word x={960} y={330} size={70} text="THẤT BẠI" opacity={appear(c.frame, c.start, 10) * (1 - cross * .5)} />
    <path d="M760 310 L1160 310" stroke={IVORY} strokeWidth={4} strokeLinecap="round" opacity={cross} />
    <Word x={960} y={430} size={70} text="CHƯA THÀNH CÔNG" opacity={appear(c.frame, within(c, 6, .55), 12)} /></g>;}},
  // 7 someone hurries from one door to the next
  {at: 7, draw: (c) => {const t = interpolate(c.frame, [c.start, c.at(8)], [0, 1], clamp);return <g>
    {D(c, 'M420 800 L1500 800 M500 800 L500 440 L640 440 L640 800 M1280 800 L1280 440 L1420 440 L1420 800', 0, 26, 2.4)}
    <Figure frame={c.frame} from={c.start} x={600 + t * 720} y={800} s={1} pose="walk" /></g>;}},
  // 8 they sit down on the step and look back at the wall
  {at: 8, draw: (c) => <g>{wall(c, -60)}
    {D(c, 'M1180 800 L1520 800 L1520 760 L1180 760', 0, 20, 2.4)}
    <Figure frame={c.frame} from={c.start} x={1300} y={760} s={1} pose="sit" facing={-1} /></g>},
  // 9–10 a field with twelve cows by a fence; 11 the farmer runs in pointing; 12 the cows wander off and he goes
  {at: 9, label: 'Buông xả', draw: (c) => {const away = interpolate(c.frame, [within(c, 12, .1), c.at(13) - 10], [0, 1], clamp), run = interpolate(c.frame, [c.at(11), within(c, 11, .8)], [0, 1], clamp);return <g>
    {D(c, 'M300 760 L1620 760 M360 760 L360 620 M480 760 L480 620 M600 760 L600 620 M300 660 L640 660 M300 710 L640 710', 0, 30, 2.4)}
    {Array.from({length: 12}, (_, i) => {
      const row = Math.floor(i / 6), s = (row ? 1.15 : .95) * (1 - away * .45), x = (row ? 700 : 775) + (i % 6) * 150 + away * (280 + i * 12), y = (row ? 760 : 640) - away * 90;
      return <path key={i} d={cow(x, y, s)} fill="none" stroke={GOLD} strokeWidth={2.4} strokeLinejoin="round" opacity={appear(c.frame, c.start + 6 + i * 2, 8) * (1 - away * .7)} />;
    })}
    <g opacity={appear(c.frame, c.at(11), 10) * (1 - appear(c.frame, c.at(13) - 22, 10))}><Figure frame={c.frame} from={c.at(11)} x={110 + run * 140} y={760} s={1} pose="walk" arm="point" /></g>
  </g>;}},
  // 13 a teacher and students sit under a tree, with the quote
  {at: 13, quote: true, draw: (c) => <g>
    {D(c, 'M1300 780 L1300 520 M1300 560 C1200 520 1180 420 1260 380 C1300 300 1420 320 1430 400 C1500 440 1480 540 1400 560 C1360 570 1320 560 1300 560', 0, 30, 2.6)}
    <Figure frame={c.frame} from={c.start + 6} x={1100} y={790} s={1} pose="sit" facing={-1} />
    {[0, 1, 2].map((k) => <Figure key={k} frame={c.frame} from={c.start + 10 + k * 4} x={560 + k * 150} y={790} s={.8} pose="sit" />)}
  </g>},
  // 14–15 a boat loaded with crates sits low; two crates go overboard and it rides higher (lighten, not empty)
  {at: 14, draw: (c) => {const drop = interpolate(c.frame, [within(c, 15, .6), within(c, 15, .95)], [0, 1], {...clamp, easing: ease}), lift = 24 * drop;return <g>
    {D(c, 'M300 690 C520 670 760 710 960 690 C1160 670 1400 710 1620 690', 0, 30, 2.2, .7)}
    <g transform={`translate(0 ${-lift})`}>
      {D(c, 'M700 640 L1220 640 L1150 720 L770 720 Z', 6, 26, 2.6)}
      {[[760, 0], [850, 0], [940, 0], [1030, 0], [1120, 0], [805, 1], [895, 1], [985, 1], [1075, 1]].map(([x, row], k) => {const off = k === 7 || k === 8;const fall = off ? drop : 0;
        return <rect key={k} x={x + fall * (k === 8 ? 260 : 180)} y={640 - 64 * (row + 1) + fall * (150 + lift)} width={80} height={60} rx={3} fill="none" stroke={off ? IVORY : GOLD} strokeWidth={2.2}
          opacity={appear(c.frame, c.start + 16 + k * 3, 8) * (1 - fall * .8)} transform={off ? `rotate(${fall * 40} ${x + 40} ${640 - 64 * (row + 1) + 30})` : undefined} />;})}
    </g>
  </g>;}},
  // 16 twelve cows, then all but one fade: twelve worries, one worry
  {at: 16, draw: (c) => {const fade = interpolate(c.frame, [within(c, 16, .5), within(c, 16, .85)], [0, 1], clamp);return <g>
    {Array.from({length: 12}, (_, i) => {const row = Math.floor(i / 6), x = 610 + (i % 6) * 130, y = row ? 700 : 560;
      return <path key={i} d={cow(x, y, 1)} fill="none" stroke={i === 0 ? IVORY : GOLD} strokeWidth={2.4} strokeLinejoin="round" opacity={appear(c.frame, c.start + 4 + i * 2, 8) * (i === 0 ? 1 : 1 - fade * .9)} />;})}
  </g>;}},
  // 17 things held like balloons (praise among them); 18 they slip away, a small cloud of criticism comes
  {at: 17, draw: (c) => {const go = appear(c.frame, within(c, 18, .2), 40);return <g>
    <Figure frame={c.frame} from={c.start} x={960} y={820} s={1.1} arm="raise" />
    {[0, 1, 2, 3].map((k) => {const bx = 840 + k * 80, by = 260 + (k % 2) * 50 - go * 200;return <g key={k} opacity={appear(c.frame, within(c, 17, .15 + k * .15), 10) * (1 - go)}>
      <ellipse cx={bx} cy={by} rx={34} ry={42} fill="none" stroke={k % 2 ? IVORY : GOLD} strokeWidth={2.4} /><path d={`M${bx} ${by + 42} C${bx + 10} ${by + 120} 1000 ${400 + go * 0} 1010 ${470}`} fill="none" stroke={GOLD} strokeWidth={1.6} opacity={(1 - go) * .8} /></g>;})}
    <path d="M1240 380 C1220 340 1260 310 1300 330 C1320 300 1380 310 1380 350 C1420 360 1410 410 1370 410 L1260 410 C1220 410 1220 380 1240 380 Z" fill="none" stroke={IVORY} strokeWidth={2.4} opacity={appear(c.frame, within(c, 18, .5), 14)} />
  </g>;}},
  // 19 a desk covered in papers, 20 autumn leaves fall on it (with the quote)
  {at: 19, label: 'Biết đủ và thảnh thơi', quote: true, draw: (c) => <g>{table(c)}{D(c, 'M800 700 L1120 700 L1096 680 L824 680 Z M846 680 L866 540 L1054 540 L1074 680 M884 560 L1036 560 L1052 664 L868 664 Z', 4, 26, 2.4)}
    {[0, 1, 2, 3].map((k) => {const fall = ((c.frame - c.at(20) + k * 40) % 160) / 160;return c.frame < c.at(20) ? null : <path key={k} d="M0 0 C16 -26 42 -28 48 0 C42 22 16 26 0 0 Z M0 0 L-12 10 M4 0 L40 0" transform={`translate(${[540, 680, 1240, 1380][k] + Math.sin(fall * 6 + k) * 30} ${260 + fall * 360}) rotate(${fall * 220})`} fill="none" stroke={GOLD} strokeWidth={2.4} opacity={interpolate(fall, [0, .1, .8, 1], [0, 1, 1, 0])} />;})}
  </g>},
  // 21 a stack of coins turns into a comfortable chair, with the quote
  {at: 21, quote: true, draw: (c) => {const turn = appear(c.frame, within(c, 21, .45), 24);return <g>
    <g opacity={1 - turn}>{[0, 1, 2, 3, 4, 5].map((k) => <ellipse key={k} cx={960} cy={700 - k * 34} rx={110} ry={26} fill="#0d1411" stroke={GOLD} strokeWidth={2.4} opacity={appear(c.frame, c.start + k * 4, 8)} />)}</g>
    <path d={chair(960, 780)} fill="none" stroke={IVORY} strokeWidth={2.6} opacity={turn} /></g>;}},
  // 22 a winding road and someone walking it at ease; 23 footprints, no finish line
  {at: 22, draw: (c) => {const t = interpolate(c.frame, [c.start, c.at(23) + 60], [0, 1], clamp);return <g>
    <path d="M700 820 C860 760 760 660 940 600 C1100 548 1040 460 1200 400 C1300 360 1340 300 1320 260" fill="none" stroke={IVORY} strokeWidth={3.4} strokeLinecap="round" strokeDasharray="2 14" opacity={appear(c.frame, c.start, 18)} />
    <Figure frame={c.frame} from={c.start + 10} x={720 + t * 300} y={810 - t * 200} s={.8 - t * .25} pose="walk" />
    {[0, 1, 2, 3, 4].map((k) => <ellipse key={k} cx={760 + k * 50} cy={800 - k * 36} rx={8} ry={14} fill={GOLD} opacity={appear(c.frame, c.at(23) + k * 8, 8) * .8} />)}
  </g>;}},
]);

// ---- 08 Nhóm 3D (lines-08-nhom-3d.txt) ----------------------------------------------------------------------
// A grey heron standing in the pond, facing right; legs down to the water surface (y 700).
const heron = (c: Ctx, from: number) => <g>
  {D(c, 'M860 520 C900 470 1010 460 1060 490 C1090 508 1084 540 1050 552 C1000 570 920 566 880 556 C850 548 800 560 780 572 C800 548 830 534 860 520 Z M900 520 C950 504 1010 504 1044 518', from - c.start, 30, 2.6)}
  {D(c, 'M1052 496 C1080 470 1076 430 1050 410 C1024 390 1030 350 1060 336 C1072 324 1092 324 1100 334 L1170 344 L1100 341 C1090 346 1074 348 1062 344 M1066 326 C1050 318 1036 320 1024 328', from - c.start + 10, 28, 2.4)}
  {D(c, 'M950 562 L946 630 L940 700 M992 562 L996 630 L1002 700', from - c.start + 18, 22, 2.4)}
</g>;
// The nylon bag full of water over its head; the dark fill hides the head behind it.
const bag = () => <g>
  <path d="M1052 292 C1040 304 1028 324 1024 354 C1018 396 1040 420 1072 422 C1106 424 1128 400 1122 362 C1118 330 1102 304 1088 292 C1076 298 1064 298 1052 292 Z" fill="#101915" stroke={IVORY} strokeWidth={2.4} strokeLinejoin="round" />
  <path d="M1026 376 C1050 366 1092 384 1123 372" fill="none" stroke={IVORY} strokeWidth={2.2} strokeLinecap="round" />
</g>;
const brickWall = (c: Ctx, open: number) => <g>
  {[0, 1, 2, 3, 4, 5, 6].map((row) => Array.from({length: 9}, (_, i) => {const x = 500 + i * 100 + (row % 2) * 50, y = 300 + row * 60, inWindow = x + 92 > 850 && x < 1070 && y + 52 > 390 && y < 580;return inWindow ? null : <rect key={`${row}-${i}`} x={x} y={y} width={92} height={52} rx={3} fill="none" stroke={GOLD} strokeWidth={2.2} opacity={appear(c.frame, c.start + row * 4 + i, 8) * .9} />;}))}
  <rect x={850} y={390} width={220} height={190} fill="none" stroke={IVORY} strokeWidth={2.4} opacity={appear(c.frame, c.start + 20, 10)} />
  <Glow x={960} y={485} r={140} opacity={open} />
  <path d={`M850 390 L${850 + 110 * (1 - open)} ${390 + 14 * open} L${850 + 110 * (1 - open)} ${580 - 14 * open} L850 580 M1070 390 L${1070 - 110 * (1 - open)} ${390 + 14 * open} L${1070 - 110 * (1 - open)} ${580 - 14 * open} L1070 580`} fill="none" stroke={IVORY} strokeWidth={2} />
</g>;
export const Nhom3D = section("08 nhóm 3D", /(bức tường vô hình|người bạn tốt|lành lại|trái cam|biết ơn thật|tô canh chua|tổ tiên|kiêu ngạo|đặt mình vào chỗ của họ|tôn trọng|từng là một đứa trẻ)/gi, [
  {at: 0, card: {kicker: 'NHÓM 4', title: 'Sống giữa mọi người'}},
  // 1 a full dinner table, one person a little apart; 2 a wall builds between them and the rest
  {at: 1, label: 'Cô đơn', draw: (c) => {const w = appear(c.frame, c.at(2), 30);return <g>{table(c)}
    {[0, 1, 2].map((k) => <Figure key={k} frame={c.frame} from={c.start + k * 4} x={600 + k * 170} y={790} s={.85} pose="sit" />)}
    <Figure frame={c.frame} from={c.start + 14} x={1340} y={790} s={.85} pose="headHold" facing={-1} />
    <g opacity={w}>{[0, 1, 2, 3, 4].map((row) => Array.from({length: 2}, (_, i) => <rect key={`${row}-${i}`} x={1050 + i * 60 + (row % 2) * 30} y={440 + row * 56} width={54} height={48} rx={3} fill="none" stroke={GOLD} strokeWidth={2.2} opacity={appear(c.frame, c.at(2) + row * 6 + i * 3, 8)} />))}</g>
  </g>;}},
  // 3 a window opens in the wall, with the quote; 4 someone sits quietly by it in the morning light
  {at: 3, quote: true, draw: (c) => {const open = appear(c.frame, within(c, 3, .3), 24), sit = appear(c.frame, c.at(4), 20);return <g>{brickWall(c, open)}
    <g opacity={sit}><Figure frame={c.frame} from={c.at(4)} x={1520} y={760} s={.9} pose="sit" facing={-1} /></g>
    {D(c, 'M1420 760 L1660 760', c.at(4) - c.start, 16, 2.2, .8)}</g>;}},
  // 5–6 an orange; seed, water, wind and sun appear around it as they are named
  {at: 5, label: 'Biết ơn', draw: (c) => <g>
    {D(c, 'M960 520 m-110 0 a110 110 0 1 0 220 0 a110 110 0 1 0 -220 0 M960 410 C956 392 962 380 972 372 M966 392 C990 370 1024 376 1036 396 C1012 408 984 404 966 392 Z', 0, 30, 2.6)}
    {D(c, 'M500 520 C560 500 620 520 660 500 C690 484 680 456 656 462', within(c, 6, .2) - c.start, 22, 2.4, .9)}
    {[0, 1, 2, 3].map((k) => <path key={k} d={`M${1300 + k * 40} ${260 + (k % 2) * 30} l-14 40`} stroke={IVORY} strokeWidth={2.4} strokeLinecap="round" opacity={appear(c.frame, within(c, 6, .32) + k * 3, 8)} />)}
    {D(c, 'M520 570 C590 556 650 574 700 556 M540 610 C610 596 670 614 720 596', within(c, 6, .44) - c.start, 22, 2.4, .9)}
    {D(c, 'M600 300 m-50 0 a50 50 0 1 0 100 0 a50 50 0 1 0 -100 0 M600 220 L600 200 M600 380 L600 400 M520 300 L500 300 M680 300 L700 300', within(c, 6, .56) - c.start, 22, 2.4)}
    <g opacity={appear(c.frame, within(c, 6, .7), 12)}><Figure frame={c.frame} from={within(c, 6, .7)} x={1360} y={800} s={.9} arm="reach" facing={-1} /></g>
    <g opacity={appear(c.frame, within(c, 6, .85), 20) * .8}><path d="M660 330 L852 470 M700 540 L836 530 M1290 330 L1072 470 M1300 620 L1076 556" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeDasharray="4 12" /></g>
  </g>},
  // 7 two hands pressed together
  {at: 7, draw: (c) => <g>
    {/* two palms pressed together: fingertips meet at the top, finger grooves on the outer edges, thumbs, wrists and forearms apart */}
    {D(c, 'M960 290 C930 296 906 330 898 380 C890 430 888 480 896 540 C900 566 906 584 912 600 L800 800 M960 290 C990 296 1014 330 1022 380 C1030 430 1032 480 1024 540 C1020 566 1014 584 1008 600 L1120 800 M960 290 L960 600', 0, 36, 2.6)}
    {D(c, 'M900 360 L928 356 M894 410 L926 404 M892 460 L926 452 M1020 360 L992 356 M1026 410 L994 404 M1028 460 L994 452 M926 500 C912 530 920 570 950 590 M994 500 C1008 530 1000 570 970 590 M960 600 L880 800 M960 600 L1040 800', 16, 26, 2.2, .85)}
    <Glow x={960} y={460} r={160} opacity={appear(c.frame, c.start + 30, 20)} />
  </g>},
  // 8–9 a bowl of sour soup steaming on the kitchen table; 10–11 generations appear behind it (quote); 12 someone bows
  {at: 8, label: 'Ta làm từ những thứ không phải ta', quote: true, draw: (c) => {const bow = interpolate(c.frame, [within(c, 12, .3), within(c, 12, .6)], [0, 18], clamp);return <g>{table(c)}
    {D(c, 'M760 560 L1160 560 C1150 650 1080 700 960 700 C840 700 770 650 760 560 Z M780 600 L1140 600', 4, 30, 2.6)}
    {[0, 1, 2].map((k) => <path key={k} d={`M${880 + k * 80} 540 C${860 + k * 80 + Math.sin((c.frame + k * 20) / 18) * 12} 500 ${910 + k * 80 - Math.sin((c.frame + k * 20) / 22) * 12} 470 ${885 + k * 80 + Math.sin((c.frame + k * 20) / 15) * 10} 430`} fill="none" stroke={IVORY} strokeWidth={2.4} strokeLinecap="round" opacity={appear(c.frame, c.start + 20 + k * 6, 12) * .85} />)}
    <Glow x={960} y={600} r={200} opacity={appear(c.frame, c.at(9), 20) * .7} />
    {[0, 1, 2, 3, 4].map((k) => <g key={k} opacity={appear(c.frame, within(c, 10, .2 + k * .12), 14) * (.35 + k * .1)}><Figure frame={c.frame} from={within(c, 10, .2 + k * .12)} x={480 + k * 240} y={520} s={.6} /></g>)}
    <g transform={`rotate(${bow} 1450 800)`} opacity={appear(c.frame, c.at(12), 12)}><Figure frame={c.frame} from={c.at(12)} x={1450} y={800} s={.9} facing={-1} /></g>
  </g>;}},
  // 13–14 a heron in the pond, a bag over its head; 15 a girl splashes in and it flies off;
  // 16 the author comes slowly, it stays, the bag comes off
  {at: 13, label: 'Nâng đỡ', quote: true, draw: (c) => {
    const fly = interpolate(c.frame, [within(c, 15, .5), within(c, 15, .9)], [0, 1], {...clamp, easing: ease});
    const back = appear(c.frame, c.at(16), 24), away = fly * (1 - back);
    const freed = appear(c.frame, within(c, 16, .6), 30);
    const girl = interpolate(c.frame, [c.at(15), within(c, 15, .5)], [0, 1], clamp), walk = interpolate(c.frame, [c.at(16), within(c, 16, .55)], [0, 1], clamp);
    return <g>
      {D(c, 'M300 700 C500 690 700 712 960 700 C1220 688 1420 712 1620 700 M380 750 C560 738 760 762 960 750 C1160 738 1360 762 1540 750', 0, 30, 2.4, .85)}
      <g opacity={(c.frame >= c.at(15) ? 1 : 0) * (1 - back)}><Figure frame={c.frame} from={c.at(15)} x={300 + girl * 300} y={720} s={.9} pose="walk" /></g>
      <g opacity={interpolate(c.frame, [within(c, 15, .45), within(c, 15, .5), c.at(16) - 12, c.at(16)], [0, 1, 1, 0], clamp)}><path d="M620 690 L590 640 M650 686 L650 626 M680 690 L710 640" fill="none" stroke={IVORY} strokeWidth={2.4} strokeLinecap="round" /></g>
      <g opacity={back}><Figure frame={c.frame} from={c.at(16)} x={420 + walk * 300} y={720} s={.9} pose={walk < 1 ? 'walk' : 'stand'} arm={walk >= 1 ? 'reach' : 'down'} /></g>
      <Glow x={1000} y={460} r={180} opacity={freed * .8} />
      <g transform={`translate(${away * 260} ${away * -200})`} opacity={1 - away}>
        {heron(c, c.start + 6)}
        <g opacity={appear(c.frame, c.at(14), 10) * (1 - freed)} transform={`translate(${freed * -140} ${freed * -150})`}>{bag()}</g>
      </g>
    </g>;
  }},
  // 17 one kneels to the other's height
  {at: 17, draw: (c) => <g>
    <Figure frame={c.frame} from={c.start} x={820} y={800} s={1.05} pose="kneel" arm="reach" />
    <Figure frame={c.frame} from={c.start + 6} x={1080} y={800} s={.75} facing={-1} />
    <Glow x={950} y={600} r={140} opacity={appear(c.frame, c.start + 30, 20)} />
  </g>},
  // 18 back at the old doorway: the grandmother holds the child
  {at: 18, draw: (c) => <g>
    {D(c, 'M650 800 L650 260 L1270 260 L1270 800 M600 800 L1320 800 M600 840 L1320 840', 0, 26, 2.6)}
    <Glow x={960} y={560} r={260} opacity={appear(c.frame, c.start + 16, 30) * .8} />
    <Figure frame={c.frame} from={c.start + 6} x={900} y={800} s={1} pose="kneel" arm="reach" />
    <Figure frame={c.frame} from={c.start + 10} x={1060} y={800} s={.6} facing={-1} />
  </g>},
]);

// ---- 08e Những điểm chưa đạt (lines-08e-diem-chua-dat.txt) ------------------------------------------------------
// A page seen flat, with a small heart sketch and text lines; used for flipping pages and the unsourced page.
const page = (x: number, y: number, w = 300, h = 400) => `M${x} ${y} L${x + w} ${y} L${x + w} ${y + h} L${x} ${y + h} Z`;
const notebook = (c: Ctx, x: number, from: number, shut = 0) => <g transform={`translate(${x} 0)`}>
  {D(c, `M-150 ${420 + shut * 30} L150 ${420 + shut * 30} L150 680 L-150 680 Z`, from - c.start, 22, 2.6)}
  {D(c, 'M-150 680 L150 680 L170 700 L-130 700 Z', from - c.start + 8, 14, 2.2, .8)}
</g>;
export const DiemChuaDat = section("08e điểm chưa đạt", /(chưa đạt|dễ thấy lặp|vài chương|không ghi nguồn|hỏi bác sĩ|điều hiển nhiên|phần thực hành)/gi, [
  {at: 0, card: {kicker: 'NÓI CHO CÔNG BẰNG', title: 'Những điểm chưa đạt'}},
  // 1 pages flip one after another, the same heart sketch on each; a circular arrow returns to its start
  {at: 1, label: 'Lặp ý', draw: (c) => {const flips = Math.max(0, Math.floor((c.frame - c.start) / 22)), t = ((c.frame - c.start) % 22) / 22, arrow = appear(c.frame, within(c, 1, .55), 30);return <g>
    {D(c, page(810, 300), 0, 20, 2.6)}
    <path d={heart(960, 470, 1)} fill="none" stroke={GOLD} strokeWidth={2.4} opacity={appear(c.frame, c.start + 10, 10)} />
    {[0, 1, 2].map((l) => <path key={l} d={`M850 ${590 + l * 32} L1070 ${590 + l * 32}`} stroke={IVORY} strokeWidth={2} opacity={appear(c.frame, c.start + 14, 10) * .7} />)}
    {flips > 0 && c.frame < within(c, 1, .55) ? <g transform={`translate(810 0) scale(${Math.cos(t * Math.PI)} 1) translate(-810 0)`}><path d={page(810, 300)} fill="#0d1411" stroke={GOLD} strokeWidth={2.4} /><path d={heart(960, 470, 1)} fill="none" stroke={GOLD} strokeWidth={2.2} opacity={.8} /></g> : null}
    <text x={960} y={260} textAnchor="middle" fill={GOLD} fontSize={28} fontWeight={700} opacity={appear(c.frame, c.start + 30, 12)}>{`CHƯƠNG ${Math.min(50, 1 + flips * 7)}`}</text>
    <g opacity={arrow}><path d="M1220 500 A120 120 0 1 1 1219 499.5" fill="none" stroke={IVORY} strokeWidth={3} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - arrow} transform="translate(0 0)" /><path d="M1210 480 L1222 500 L1240 486" fill="none" stroke={IVORY} strokeWidth={3} strokeLinecap="round" opacity={arrow > .95 ? 1 : 0} /></g>
  </g>;}},
  // 2 a small calendar, one chapter ticked each day
  {at: 2, draw: (c) => <g>
    {D(c, 'M700 320 L1220 320 L1220 760 L700 760 Z M700 400 L1220 400 M800 290 L800 350 M1120 290 L1120 350', 0, 26, 2.6)}
    {Array.from({length: 14}, (_, i) => {const x = 760 + (i % 7) * 66, y = 460 + Math.floor(i / 7) * 130, on = appear(c.frame, c.start + 16 + i * 5, 8);return <g key={i}>
      <rect x={x - 24} y={y - 24} width={48} height={48} rx={6} fill="none" stroke={GOLD} strokeWidth={2} opacity={.7} />
      <path d={`M${x - 12} ${y} L${x - 2} ${y + 12} L${x + 14} ${y - 12}`} fill="none" stroke={IVORY} strokeWidth={3} strokeLinecap="round" opacity={on} /></g>;})}
  </g>},
  // 3 a page whose source note is empty, a gold question mark in the margin; the figures on it fade
  {at: 3, label: 'Thiếu nguồn', draw: (c) => {const fade = 1 - appear(c.frame, within(c, 3, .6), 40) * .8;return <g>
    {D(c, page(760, 260, 400, 520), 0, 24, 2.6)}
    {[0, 1, 2, 3].map((l) => D(c, `M800 ${330 + l * 44} L${1110 - (l % 2) * 60} ${330 + l * 44}`, 10 + l * 3, 16, 2, .7))}
    <g opacity={fade}><Word x={960} y={560} size={70} text="73%" opacity={appear(c.frame, c.start + 20, 12)} /></g>
    {D(c, 'M800 680 L1120 680 L1120 740 L800 740 Z', 24, 16, 2, .8)}
    <text x={820} y={720} fill={GOLD} fontSize={22} fontWeight={700} opacity={appear(c.frame, c.start + 30, 10) * .8}>Nguồn:</text>
    {D(c, 'M1230 380 C1230 330 1310 330 1310 380 C1310 420 1270 420 1270 460 M1270 500 L1270 504', within(c, 3, .35) - c.start, 22, 3.2)}
  </g>;}},
  // 4 a stethoscope is laid beside the book
  {at: 4, draw: (c) => <g>{book(c, 380)}
    {D(c, 'M1380 420 C1380 520 1440 560 1480 560 C1520 560 1580 520 1580 420 M1480 560 L1480 640 C1480 720 1420 740 1400 700', within(c, 4, .45) - c.start, 30, 2.8)}
    <circle cx={1394} cy={690} r={24} fill="none" stroke={IVORY} strokeWidth={2.6} opacity={appear(c.frame, within(c, 4, .45) + 26, 10)} />
    <Glow x={1480} y={560} r={140} opacity={appear(c.frame, within(c, 4, .6), 20) * .6} />
  </g>},
  // 5 two notebooks on the desk; 6 a hand copies the practice lines into the small one, the other is set aside half shut
  {at: 5, label: 'Niềm tin và thực hành', draw: (c) => {const aside = interpolate(c.frame, [within(c, 6, .55), within(c, 6, .85)], [0, 1], {...clamp, easing: ease}), write = interpolate(c.frame, [c.at(6), within(c, 6, .55)], [0, 1], clamp);return <g>{table(c)}
    <g transform={`translate(${aside * 260} ${aside * 20})`} opacity={1 - aside * .45}>{notebook(c, 720, c.start + 4, aside)}</g>
    {notebook(c, 1180, c.start + 10)}
    {[0, 1, 2].map((l) => <path key={l} d={`M1060 ${470 + l * 50} L${1060 + 240 * Math.max(0, Math.min(1, write * 3 - l))} ${470 + l * 50}`} stroke={IVORY} strokeWidth={2.6} strokeLinecap="round" opacity={c.frame >= c.at(6) ? 1 : 0} />)}
    <text x={1180} y={410} textAnchor="middle" fill={GOLD} fontSize={26} fontWeight={700} opacity={appear(c.frame, c.at(6), 12)}>THỰC HÀNH</text>
    <g opacity={appear(c.frame, c.at(6), 12)} transform={`translate(${1060 + 240 * Math.min(1, write * 3 % 1.0001)} ${470 + 50 * Math.min(2, Math.floor(write * 3))})`}>
      <path d="M0 0 L60 -90 L80 -80 L20 10 Z M60 -90 C70 -110 100 -100 80 -80" fill="none" stroke={GOLD} strokeWidth={2.4} strokeLinejoin="round" /></g>
  </g>;}},
]);

// ---- 08f Tổng kết (lines-08f-tong-ket.txt) ------------------------------------------------------------------
const MOTIFS: {x: number; y: number; d: string}[] = [
  {x: 560, y: 360, d: 'M-60 40 C-70 -10 -40 -40 0 -40 C40 -40 70 -10 60 40 Z M-20 -40 C-20 -56 20 -56 20 -40 M60 0 C90 -6 100 -30 106 -50'},
  {x: 1360, y: 360, d: 'M-50 60 L-50 -10 M-50 -40 m-14 0 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 M50 60 L50 -10 M50 -40 m-14 0 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 M-50 10 L50 10'},
  {x: 560, y: 720, d: 'M-90 20 C-50 0 -20 30 20 10 C50 -6 80 20 100 10 M-90 50 C-50 30 -20 60 20 40 C50 24 80 50 100 40 M-10 -60 L-10 -30 M10 -70 L10 -40'},
  {x: 1360, y: 720, d: 'M-80 -10 L80 -10 C74 40 40 60 0 60 C-40 60 -74 40 -80 -10 Z M-30 -30 C-40 -50 -20 -60 -30 -80 M10 -30 C0 -50 20 -60 10 -80'},
];
export const TongKet = section("08f tổng kết", /(tóm lại|cách lòng mình phản ứng|phải hiểu trước|bốn mảng|mỗi tối mở ra một chương|nói đúng chuyện của mình)/gi, [
  // 0 the gold thread of part 2 returns and ties two hearts
  {at: 0, label: 'Tóm lại', draw: (c) => <g>
    <path d={heart(700, 520, 1.1)} fill="none" stroke={IVORY} strokeWidth={2.6} opacity={appear(c.frame, c.start, 14)} />
    <path d={heart(1220, 520, 1.1)} fill="none" stroke={IVORY} strokeWidth={2.6} opacity={appear(c.frame, c.start + 8, 14)} />
    {D(c, 'M300 520 C420 470 520 560 700 520 C860 480 1060 560 1220 520 C1380 480 1500 560 1620 520', 16, 60, 3)}
    <Glow x={960} y={520} r={200} opacity={appear(c.frame, within(c, 0, .6), 24) * .8} />
  </g>},
  // 1 four motifs appear as each strand is read (kettle, two people, salt over a river, sour soup), then gather in
  {at: 1, draw: (c) => {const gather = appear(c.frame, within(c, 1, .85), 30);return <g>{book(c, 360)}
    {MOTIFS.map((m, k) => {const x = m.x + (960 - m.x) * gather * .6, y = m.y + (520 - m.y) * gather * .6;return <g key={k} transform={`translate(${x} ${y}) scale(${1 - gather * .4})`} opacity={appear(c.frame, within(c, 1, .2 + k * .17), 12) * (1 - gather * .5)}>
      <path d={m.d} fill="none" stroke={GOLD} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" /></g>;})}
    <Glow x={960} y={520} r={260} opacity={gather * .7} />
  </g>;}},
  // 2 a bedside lamp turns on, the book open on one chapter; the window darkens outside
  {at: 2, draw: (c) => {const on = appear(c.frame, within(c, 2, .2), 18), dusk = appear(c.frame, c.start, 90);return <g>
    {D(c, 'M1260 300 L1560 300 L1560 560 L1260 560 Z M1410 300 L1410 560 M1260 430 L1560 430', 0, 26, 2.4)}
    <rect x={1262} y={302} width={296} height={256} fill="#05080a" opacity={dusk * .8} />
    {[0, 1, 2].map((k) => <circle key={k} cx={1300 + k * 90} cy={340 + (k % 2) * 40} r={3} fill={IVORY} opacity={dusk * .9} />)}
    {table(c)}
    {D(c, 'M560 700 L640 700 L620 680 L580 680 Z M600 680 L600 520 M540 520 L660 520 L630 440 L570 440 Z', 6, 24, 2.4)}
    <Glow x={600} y={540} r={260} opacity={on} />
    {D(c, 'M960 640 C900 610 820 610 760 630 L760 690 C820 670 900 670 960 700 C1020 670 1100 670 1160 690 L1160 630 C1100 610 1020 610 960 640 Z M960 640 L960 700', 18, 24, 2.6)}
  </g>;}},
  // 3 three pages open one after another: Tức Giận, Lo Lắng, Cô Đơn
  {at: 3, draw: (c) => <g>{['TỨC GIẬN', 'LO LẮNG', 'CÔ ĐƠN'].map((name, k) => {const from = within(c, 3, .1 + k * .2), o = appear(c.frame, from, 16);return <g key={name} opacity={o} transform={`translate(${560 + k * 400} ${540 + (1 - o) * 20})`}>
    <path d="M-150 -170 L150 -170 L150 170 L-150 170 Z" fill="#0d1411" stroke={GOLD} strokeWidth={2.6} />
    {k === 2 ? <Glow x={0} y={0} r={180} opacity={appear(c.frame, from + 30, 30) * .6} /> : null}
    <Word x={0} y={-90} size={36} text={name} opacity={1} />
    {[0, 1, 2, 3].map((l) => <path key={l} d={`M-110 ${-20 + l * 40} L${110 - (l % 2) * 50} ${-20 + l * 40}`} stroke={IVORY} strokeWidth={2} opacity={.6} />)}
  </g>;})}</g>},
]);

// ---- 08g Ý kiến cá nhân (lines-08g-y-kien.txt; channel draft 2026-11-01, follows the user's wording when it changes) --
export const YKien = section("08g ý kiến cá nhân", /(riêng mình|một người khác|tách đau với khổ|bắt đầu từ đâu|tô canh chua|chưa bao giờ gặp|lặp lại|hiểu rồi mới thương|chương Lo Lắng|đặt xuống)/gi, [
  // 0 a figure stands still; a dashed outline of "someone else" appears beside it, then fades
  {at: 0, label: 'Ý kiến của mình', draw: (c) => {const ghost = interpolate(c.frame, [within(c, 0, .45), within(c, 0, .6), within(c, 0, .85), within(c, 0, 1)], [0, .6, .6, 0], clamp);return <g>
    <Figure frame={c.frame} from={c.start} x={860} y={800} s={1.2} />
    <g opacity={ghost} transform="translate(1100 800) scale(1.2)"><path d="M0 -300 m-28 0 a28 28 0 1 0 56 0 a28 28 0 1 0 -56 0 M0 -270 L0 -130 M0 -240 L-50 -150 M0 -240 L50 -150 M0 -130 L-30 0 M0 -130 L30 0" fill="none" stroke={IVORY} strokeWidth={2.2} strokeDasharray="10 12" strokeLinecap="round" vectorEffect="non-scaling-stroke" /></g>
    <Glow x={860} y={600} r={180} opacity={appear(c.frame, within(c, 0, .9), 20) * .6} />
  </g>;}},
  // 1 the kettle on a small flame (anger) on the left, a hand holding a glass (worry) on the right
  {at: 1, draw: (c) => <g>
    <g transform="translate(-380 60)">{kettle(c)}{flame(c, 1e9, 1e9 + 1)}</g>
    <g transform="translate(420 40)">{glass(c, c.at(1) + 30)}{glassHand(c, c.at(1) + 38)}</g>
  </g>},
  // 2 ĐAU | KHỔ on either side of a line; 3 a coil winds round KHỔ (thinking it over); 4 a gold dot lights under ĐAU
  {at: 2, label: 'Đau và khổ', draw: (c) => {const coil = interpolate(c.frame, [within(c, 3, .35), within(c, 3, .95)], [0, 1], clamp);return <g>
    <Word x={640} y={560} size={110} text="ĐAU" opacity={appear(c.frame, c.start + 6, 14)} />
    <Word x={1280} y={560} size={110} text="KHỔ" opacity={appear(c.frame, c.start + 16, 14)} />
    {D(c, 'M960 320 L960 760', 24, 24, 2.4, .8)}
    {coil > 0 ? <path d={Array.from({length: 61}, (_, i) => {const a = i / 60 * Math.PI * 6, r = 130 + i * 1.4;return `${i ? 'L' : 'M'}${(1280 + Math.cos(a) * r).toFixed(1)} ${(525 + Math.sin(a) * r * .55).toFixed(1)}`;}).join(' ')} fill="none" stroke={GOLD} strokeWidth={2.2} strokeLinecap="round" pathLength={1} strokeDasharray={`${coil} 2`} opacity={.85} /> : null}
    <circle cx={640} cy={660} r={12} fill={GOLD} opacity={appear(c.frame, within(c, 4, .55), 12)} />
    <Glow x={640} y={660} r={90} opacity={appear(c.frame, within(c, 4, .6), 20) * .8} />
  </g>;}},
  // 5 a bowl of sour soup steaming on the table; 6 faint figures appear behind it, the people never met
  {at: 5, label: 'Tô canh chua', draw: (c) => <g>{table(c)}
    {D(c, 'M760 560 L1160 560 C1150 650 1080 700 960 700 C840 700 770 650 760 560 Z M780 600 L1140 600', 4, 30, 2.6)}
    {[0, 1, 2].map((k) => <path key={k} d={`M${880 + k * 80} 540 C${860 + k * 80 + Math.sin((c.frame + k * 20) / 18) * 12} 500 ${910 + k * 80 - Math.sin((c.frame + k * 20) / 22) * 12} 470 ${885 + k * 80 + Math.sin((c.frame + k * 20) / 15) * 10} 430`} fill="none" stroke={IVORY} strokeWidth={2.4} strokeLinecap="round" opacity={appear(c.frame, c.start + 20 + k * 6, 12) * .85} />)}
    {[440, 620, 1300, 1480].map((x, k) => <g key={x} opacity={appear(c.frame, within(c, 6, .3 + k * .12), 14) * .4}><Figure frame={c.frame} from={within(c, 6, .3 + k * .12)} x={x} y={640} s={.6} facing={k < 2 ? 1 : -1} /></g>)}
    <Glow x={960} y={600} r={220} opacity={appear(c.frame, within(c, 6, .8), 20) * .7} />
  </g>},
  // 7 the open book; 8 DỪNG LẠI · HIỂU · THƯƠNG appear as they are read; 9 soft light
  {at: 7, label: 'Lời nhắc', draw: (c) => <g>{book(c, 420)}
    {['DỪNG LẠI', 'HIỂU', 'THƯƠNG'].map((t, k) => <Word key={t} x={560 + k * 400} y={330} size={56} text={t} opacity={appear(c.frame, within(c, 8, .5 + k * .14), 12)} />)}
    <Glow x={960} y={560} r={300} opacity={appear(c.frame, c.at(9), 24) * .7} />
  </g>},
  // 10 the chapter page LO LẮNG with the glass; 11 a sheet, three lines written one after another
  {at: 10, label: 'Bắt đầu từ chương Lo Lắng', draw: (c) => {const sheet = appear(c.frame, c.at(11), 16);return <g>
    <g opacity={1 - sheet * .7}>
      {D(c, page(560, 260, 380, 500), 0, 24, 2.6)}
      <Word x={750} y={340} size={40} text="LO LẮNG" opacity={appear(c.frame, c.start + 14, 12)} />
      <g transform="translate(-210 120)">{glass(c, c.start + 24)}</g>
    </g>
    {D(c, page(1040, 300, 440, 440), c.at(11) - c.start, 22, 2.6)}
    {['Điều đang lo', 'Việc làm được', 'Việc đặt xuống'].map((t, k) => <g key={t} opacity={appear(c.frame, within(c, 11, .35 + k * .18), 10)}>
      <circle cx={1090} cy={400 + k * 110} r={8} fill={GOLD} /><text x={1120} y={412 + k * 110} fill={IVORY} fontSize={36} fontWeight={700}>{t}</text></g>)}
  </g>;}},
]);

// ---- 09 Nhận xét chung -----------------------------------------------------------------------------------
// 0 an open book with rays; 1 a scale with the book tipping against a heavier textbook; 2 a tangled line that
// smooths out, 3 then a lamp lights up beside it with a thin book and the moon; 4 a glow spreading to people around
export const NhanXet = section("09 nhận xét chung", /(cuốn sách hay|chưa đủ|lòng dịu xuống|trước khi ngủ|đọc qua|hiểu mình trước|những người quanh mình)/gi, [
  {at: 0, draw: (c) => <g>
    <Glow x={960} y={520} r={320} opacity={appear(c.frame, c.start + 10, 30)} />
    {D(c, 'M640 640 L1280 640 L1300 600 L660 600 Z M640 640 L640 690 L1280 690 L1280 640 M1300 600 L1300 650 L1280 690', 0, 34, 2.6)}
    {D(c, 'M680 620 L1260 620', 16, 20, 2, .75)}
    {[0, 1, 2, 3, 4].map((k) => {const a = -Math.PI / 2 + (k - 2) * .35;return <path key={k} d={`M${960 + Math.cos(a) * 120} ${560 + Math.sin(a) * 120} L${960 + Math.cos(a) * 260} ${560 + Math.sin(a) * 260}`} stroke={GOLD} strokeWidth={2.6} strokeLinecap="round" opacity={appear(c.frame, c.start + 24 + k * 4, 12) * .9} />;})}
  </g>},
  {at: 1, draw: (c) => {const tip = interpolate(c.frame, [within(c, 1, .55), within(c, 1, .8)], [0, 1], {...clamp, easing: ease}), a = -8 * tip;return <g>
    {D(c, 'M960 820 L960 440 M900 820 L1020 820', 0, 22, 2.6)}
    <g transform={`rotate(${a} 960 440)`}>
      {D(c, 'M700 440 L1220 440', 10, 20, 2.6)}
      <g transform={`rotate(${-a} 700 440)`}>{D(c, 'M700 440 L640 560 M700 440 L760 560 M610 560 L790 560 C780 600 620 600 610 560', 18, 22, 2.2)}
        {D(c, 'M650 548 L700 520 L750 548 M700 520 L700 548', 30, 14, 2.4)}</g>
      <g transform={`rotate(${-a} 1220 440)`}>{D(c, 'M1220 440 L1160 560 M1220 440 L1280 560 M1130 560 L1310 560 C1300 600 1140 600 1130 560', 18, 22, 2.2, .7)}
        <g opacity={appear(c.frame, within(c, 1, .45), 14)}>{[0, 1, 2].map((k) => <rect key={k} x={1170} y={530 - k * 22} width={100} height={20} rx={2} fill="none" stroke={IVORY} strokeWidth={2} />)}</g></g>
    </g>
  </g>;}},
  {at: 2, draw: (c) => {const calm = interpolate(c.frame, [within(c, 2, .55), c.at(3) - 14], [0, 1], {...clamp, easing: ease});
    const d = Array.from({length: 61}, (_, i) => {const x = 520 + i * 15, y = 560 + (1 - calm) * (Math.sin(i * .9) * 70 + Math.sin(i * 2.3) * 40);return `${i ? 'L' : 'M'}${x} ${y.toFixed(1)}`;}).join(' ');
    // 3 the calm line becomes a bedside table: a lamp lights up, a thin book, the moon outside
    const night = appear(c.frame, c.at(3), 24);
    return <g><path d={d} fill="none" stroke={calm > .9 ? GOLD : IVORY} strokeWidth={2.6} strokeLinejoin="round" opacity={appear(c.frame, c.start, 16)} /><Glow x={960} y={560} r={260} opacity={calm * .8 * (1 - night * .6)} />
      <g opacity={night}>
        <path d="M640 560 L640 380 M600 380 L680 380 L660 300 L620 300 Z" fill="none" stroke={GOLD} strokeWidth={2.4} strokeLinejoin="round" />
        <Glow x={640} y={400} r={200} opacity={night * .9} />
        <path d="M860 550 L960 530 L1060 550 M960 530 L960 550" fill="none" stroke={IVORY} strokeWidth={2.4} strokeLinejoin="round" />
        <path d="M1420 260 C1360 280 1350 360 1400 400 C1340 400 1310 320 1350 280 C1370 262 1400 258 1420 260 Z" fill="none" stroke={GOLD} strokeWidth={2.2} opacity={.85} />
      </g></g>;}},
  {at: 4, draw: (c) => {const spread = interpolate(c.frame, [within(c, 4, .5), c.at(5) + 20], [0, 1], {...clamp, easing: ease});return <g>
    <Glow x={960} y={600} r={140 + spread * 520} opacity={appear(c.frame, c.start + 10, 20) * .9} />
    <Figure frame={c.frame} from={c.start + 6} x={960} y={780} s={1} />
    {[[520, .8, 1], [720, .85, 1], [1200, .85, -1], [1400, .8, -1]].map(([x, s, f], k) => <g key={k} opacity={appear(c.frame, within(c, 4, .55) + k * 6, 14) * .85}><Figure frame={c.frame} from={within(c, 4, .55)} x={x} y={780} s={s} facing={f as 1 | -1} color={IVORY} /></g>)}
  </g>;}},
]);
