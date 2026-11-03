import {interpolate} from 'remotion';
import {GOLD, IVORY, clamp, ease} from '../book-hvtt-001-overview/Intro';
import {Draw, Figure, Glow, Word, appear, section, takesOf, within} from '../book-hvtt-001-overview/scene-kit';
import type {Ctx} from '../book-hvtt-001-overview/scene-kit';
import takes from './body-takes.json';

// Body parts of episode 2 (Thay đổi tí hon hiệu quả bất ngờ) on the series scene-kit (image-prompts.md). Each beat
// names the sentence (0-based, scripts/projects/book-ah-001-overview/lines-<segment>.txt) where its drawing starts.
// Lessons from episode 1: one complete drawing per idea that grows inside its scene (few cuts), nothing drawn over
// a figure, no impact shown, quotes only where the line is a verified quote.
const options = {takes: takesOf(takes), quoteSource: ''};
const D = (c: Ctx, d: string, delay = 0, len = 28, width = 2.4, opacity = 1) => <Draw key={`${d}${delay}`} d={d} frame={c.frame} from={c.start + delay} to={c.start + delay + len} width={width} opacity={opacity} />;

// 0b Mở chuyện: one story in six stages, each drawing growing inside its scene.
// 0–1 a baseball field; the batter swings, the bat slips and arcs away, vanishing in a flash short of the boy
// 2–3 a hospital window at night (helicopter, coma); then the window seen double, the two images closing in while a
//     calendar counts the months to eight
// 4–6 the dream (a small boy, bat and a star) → the team stands in a row and he is the one left out → a car drawn
//     round him, rain on the glass
// 7–10 a dorm room: the messy half (scattered lines, a game pad) and his half (a made bed, the moon); his half warms;
//     the warmth runs on to a book and a dumbbell
// 11–12 a staircase he climbs; the steps light one by one, a long chain of small steps
// 13 one gold dot, rings spreading, the open book of the whole idea
export const MoChuyen = section('02 mở chuyện', /(bài học lớn nhất về thói quen|gậy bóng chày|hôn mê|tám tháng|giấc mơ|bị loại khỏi đội chính|khóc|sắp xếp lại cuộc sống|đi ngủ sớm|gọn gàng|làm chủ lại|sự tự tin|sáu năm sau|chuỗi dài những bước tiến rất nhỏ|kết quả đáng kinh ngạc)/gi, [
  {at: 0, draw: (c) => {const fly = interpolate(c.frame, [within(c, 1, .35), within(c, 1, .8)], [0, 1], {...clamp, easing: ease}), flash = interpolate(c.frame, [within(c, 1, .78), within(c, 1, .86), within(c, 1, 1)], [0, 1, 0], clamp);
    // The bat arcs high and vanishes in a flash well above and short of the boy: no contact is ever drawn.
    const bx = 600 + fly * 520, by = 520 - Math.sin(fly * Math.PI) * 200, rot = -40 + fly * 720;
    return <g>
      {D(c, 'M960 800 L1180 650 L960 500 L740 650 Z', 0, 30, 2.4, .9)}
      {D(c, 'M640 800 C700 420 1220 420 1280 800', 8, 34, 2.2, .75)}
      <g opacity={appear(c.frame, c.start + 16, 14)}><Figure frame={c.frame} from={c.start + 16} x={540} y={780} s={1} arm="raise" /></g>
      <g opacity={appear(c.frame, c.start + 22, 14)}><Figure frame={c.frame} from={c.start + 22} x={1420} y={780} s={.95} facing={-1} /></g>
      <g transform={`translate(${bx} ${by}) rotate(${rot})`} opacity={appear(c.frame, c.start + 20, 10) * (1 - flash * .9)}><path d="M-6 0 L70 -4 L74 4 L-6 6 Z" fill="none" stroke={IVORY} strokeWidth={2.4} strokeLinejoin="round" /></g>
      <Glow x={1120} y={500} r={160} opacity={flash} />
    </g>;}},
  {at: 2, draw: (c) => {const blur = interpolate(c.frame, [c.at(3), within(c, 3, .85)], [1, 0], clamp), seen = appear(c.frame, c.at(3), 12), months = Math.min(8, Math.floor(interpolate(c.frame, [within(c, 3, .1), within(c, 3, .85)], [1, 9], clamp)));
    const win = 'M600 300 L960 300 L960 620 L600 620 Z M780 300 L780 620 M600 460 L960 460';
    return <g>
      {D(c, win, 0, 30, 2.6)}
      <path d={win} transform={`translate(${36 * blur * seen} ${-14 * blur * seen})`} fill="none" stroke={IVORY} strokeWidth={2} opacity={seen * blur * .7} />
      {D(c, 'M880 360 C860 360 850 380 862 396 C846 384 852 352 880 360 Z', 14, 16, 2.2)}
      <Glow x={780} y={460} r={220} opacity={appear(c.frame, c.start + 20, 30) * .4} />
      <g opacity={seen}>
        <path d="M1180 330 L1400 330 L1400 560 L1180 560 Z M1180 380 L1400 380 M1230 310 L1230 350 M1350 310 L1350 350" fill="none" stroke={GOLD} strokeWidth={2.4} strokeLinejoin="round" />
        <text x={1290} y={368} textAnchor="middle" fill={IVORY} fontSize={32} fontWeight={700}>THÁNG</text>
        <text x={1290} y={500} textAnchor="middle" fill={GOLD} fontSize={96} fontWeight={700}>{months}</text>
      </g>
    </g>;}},
  {at: 4, draw: (c) => {const row = appear(c.frame, c.at(5), 18), out = interpolate(c.frame, [within(c, 5, .45), within(c, 5, .9)], [0, 1], {...clamp, easing: ease}), car = appear(c.frame, c.at(6), 18);
    // He stands at the end of the row (clear of the team) and walks off to the right on his own.
    const bx = 1040 + out * 340;
    return <g>
      <g opacity={1 - row}>
        <Figure frame={c.frame} from={c.start + 4} x={900} y={760} s={.7} arm="raise" />
        <path d="M940 560 L990 470" stroke={IVORY} strokeWidth={4} strokeLinecap="round" opacity={appear(c.frame, c.start + 14, 10)} />
        <path d="M1080 360 L1092 392 L1126 394 L1100 414 L1108 446 L1080 428 L1052 446 L1060 414 L1034 394 L1068 392 Z" fill="none" stroke={GOLD} strokeWidth={2.4} strokeLinejoin="round" opacity={appear(c.frame, c.start + 20, 12)} />
      </g>
      <g opacity={row}>
        {[0, 1, 2, 3].map((k) => <Figure key={k} frame={c.frame} from={c.at(5)} x={480 + k * 130} y={760} s={.8} />)}
        <g opacity={1 - car}><Figure frame={c.frame} from={c.at(5)} x={bx} y={760} s={.8} color={IVORY} pose={out > 0 && out < 1 ? 'walk' : 'stand'} /></g>
      </g>
      {/* The car: body, beltline, wheels, and the boy seated behind the glass (clipped to it, nothing drawn over him). */}
      <g opacity={car}>
        <defs><clipPath id="ah-car-glass"><path d={`M${bx - 160} 650 C${bx - 140} 585 ${bx - 80} 556 ${bx} 556 C${bx + 80} 556 ${bx + 140} 585 ${bx + 160} 650 Z`} /></clipPath></defs>
        <path d={`M${bx - 200} 740 L${bx - 200} 650 C${bx - 170} 560 ${bx - 90} 520 ${bx} 520 C${bx + 90} 520 ${bx + 170} 560 ${bx + 200} 650 L${bx + 200} 740 Z M${bx - 160} 650 C${bx - 140} 585 ${bx - 80} 556 ${bx} 556 C${bx + 80} 556 ${bx + 140} 585 ${bx + 160} 650 Z`} fill="none" stroke={GOLD} strokeWidth={2.4} strokeLinejoin="round" />
        <circle cx={bx - 120} cy={748} r={24} fill="#0d1411" stroke={GOLD} strokeWidth={2.4} /><circle cx={bx + 120} cy={748} r={24} fill="#0d1411" stroke={GOLD} strokeWidth={2.4} />
        <g clipPath="url(#ah-car-glass)"><Figure frame={c.frame} from={c.at(6)} x={bx} y={770} s={.7} color={IVORY} pose="sit" /></g>
        {[-130, -100, -72, 70, 98, 126].map((dx, k) => {const y = ((c.frame * 3 + k * 23) % 36);return <path key={k} d={`M${bx + dx} ${596 + y} l-4 12`} stroke={IVORY} strokeWidth={2} strokeLinecap="round" opacity={.75} />;})}
      </g>
    </g>;}},
  {at: 7, draw: (c) => {const halves = appear(c.frame, c.at(8), 16), warm = appear(c.frame, c.at(9), 30), spread = appear(c.frame, within(c, 10, .2), 24);return <g>
    {D(c, 'M520 360 L1400 360 L1400 760 L520 760 Z M960 360 L960 760', 0, 30, 2.4, .9)}
    <g opacity={halves}>
      {[[560, 520, 640, 500], [620, 640, 700, 690], [700, 420, 780, 460], [820, 560, 900, 600], [580, 720, 660, 700], [860, 680, 920, 730]].map(([x1, y1, x2, y2], k) => <path key={k} d={`M${x1} ${y1} L${x2} ${y2}`} stroke={IVORY} strokeWidth={2.2} strokeLinecap="round" opacity={.75} />)}
      <path d="M700 590 C700 570 790 570 790 590 L790 610 C790 630 700 630 700 610 Z M725 600 L745 600 M735 590 L735 610 M765 596 L768 596" fill="none" stroke={IVORY} strokeWidth={2.2} opacity={.8} />
      <path d="M1040 640 L1300 640 L1300 700 L1040 700 Z M1040 640 C1040 616 1100 616 1100 640 M1040 700 L1040 730 M1300 700 L1300 730" fill="none" stroke={GOLD} strokeWidth={2.6} strokeLinejoin="round" />
      <path d="M1290 430 C1260 430 1248 460 1262 482 C1240 458 1252 420 1290 430 Z" fill="none" stroke={GOLD} strokeWidth={2.2} />
    </g>
    <Glow x={1180} y={560} r={260} opacity={warm * .7} />
    <g opacity={spread}>
      <path d="M1400 520 C1480 500 1520 440 1560 400 M1400 620 C1490 640 1530 690 1560 720" fill="none" stroke={GOLD} strokeWidth={2} strokeDasharray="5 10" />
      <path d="M1560 380 C1580 370 1600 370 1620 380 L1620 425 C1600 415 1580 415 1560 425 Z M1590 380 L1590 420" fill="none" stroke={GOLD} strokeWidth={2.4} transform="translate(10 -10)" />
      <path d="M1560 740 L1640 740 M1560 724 L1560 756 M1640 724 L1640 756" fill="none" stroke={GOLD} strokeWidth={2.4} />
    </g>
  </g>;}},
  {at: 11, draw: (c) => {const climb = interpolate(c.frame, [within(c, 11, .1), within(c, 11, .85)], [0, 1], {...clamp, easing: ease}), step = 5 * climb;
    const steps = 'M520 800 L680 800 L680 720 L840 720 L840 640 L1000 640 L1000 560 L1160 560 L1160 480 L1320 480 L1320 400 L1480 400';
    return <g>
      {D(c, steps, 0, 34, 2.6)}
      {[0, 1, 2, 3, 4, 5].map((k) => <path key={k} d={`M${520 + k * 160} ${800 - k * 80} L${680 + k * 160} ${800 - k * 80}`} stroke={GOLD} strokeWidth={5} strokeLinecap="round" opacity={appear(c.frame, within(c, 12, .15 + k * .12), 10)} />)}
      <Figure frame={c.frame} from={c.start + 8} x={600 + step * 160} y={800 - step * 80} s={.75} pose={climb > 0 && climb < 1 ? 'walk' : 'stand'} />
      <Glow x={1400} y={330} r={170} opacity={appear(c.frame, within(c, 11, .85), 20) * .8} />
    </g>;}},
  {at: 13, draw: (c) => <g>
    <circle cx={960} cy={500} r={10} fill={GOLD} opacity={appear(c.frame, c.start + 4, 10)} />
    {[0, 1, 2, 3].map((k) => {const r = interpolate(c.frame, [c.start + 10 + k * 18, c.start + 110 + k * 18], [10, 90 + k * 70], {...clamp, easing: ease});
      return <circle key={k} cx={960} cy={500} r={r} fill="none" stroke={k % 2 ? IVORY : GOLD} strokeWidth={2} opacity={appear(c.frame, c.start + 10 + k * 18, 10) * (1 - k * .18)} />;})}
    <g opacity={appear(c.frame, within(c, 13, .55), 18)}>
      <path d="M960 800 C890 770 800 768 730 786 L730 700 C800 682 890 684 960 714 C1030 684 1120 682 1190 700 L1190 786 C1120 768 1030 770 960 800 Z M960 714 L960 800" fill="none" stroke={GOLD} strokeWidth={2.6} strokeLinejoin="round" />
    </g>
    <Word x={960} y={300} size={42} text="THAY ĐỔI NHỎ · KẾT QUẢ LỚN" opacity={appear(c.frame, within(c, 13, .7), 14) * .9} />
  </g>},
], options);

// ---- shared drawings of episode 2 -------------------------------------------------------------------------
const STEPS = ['DẤU HIỆU', 'KHAO KHÁT', 'HÀNH ĐỘNG', 'PHẦN THƯỞNG'];
// The habit loop: four steps on a ring (top, right, bottom, left) joined by arrows. hi: the step to light (-1: none,
// 4: all); grow: 0..1 how much of the loop is drawn, step by step.
const loop = (x: number, y: number, s: number, hi: number, grow = 1, size = 38) => {
  const pts = [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([a, b]) => [x + a * 300 * s, y + b * 170 * s]);
  return <g>
    {pts.map(([px, py], k) => {const on = appear(grow * 4, k, .6);const lit = hi === 4 || hi === k;return <g key={k} opacity={on}>
      <rect x={px - 175 * s} y={py - 40 * s} width={350 * s} height={80 * s} rx={10 * s} fill={lit ? 'rgba(217,181,111,.16)' : 'none'} stroke={lit ? GOLD : IVORY} strokeWidth={lit ? 3 : 1.8} opacity={lit ? 1 : .65} />
      <text x={px} y={py + 13 * s} textAnchor="middle" fill={lit ? GOLD : IVORY} fontSize={size * s} fontWeight={700} opacity={lit ? 1 : .75}>{STEPS[k]}</text>
    </g>;})}
    {pts.map(([px, py], k) => {const [nx, ny] = pts[(k + 1) % 4], on = appear(grow * 4, k + .6, .4);
      const mx = (px + nx) / 2 + (k === 0 || k === 1 ? 1 : -1) * 60 * s * (k % 2 ? -1 : 1), my = (py + ny) / 2 + (k < 2 ? -1 : 1) * 30 * s;
      return <path key={`a${k}`} d={`M${px + (nx - px) * .32} ${py + (ny - py) * .32} Q${mx} ${my} ${px + (nx - px) * .68} ${py + (ny - py) * .68}`} fill="none" stroke={GOLD} strokeWidth={2} strokeDasharray="5 8" opacity={on * .8} />;})}
  </g>;
};
const openBook = (x: number, y: number, s = 1) => `M${x} ${y + 100 * s} C${x - 70 * s} ${y + 70 * s} ${x - 160 * s} ${y + 68 * s} ${x - 230 * s} ${y + 86 * s} L${x - 230 * s} ${y} C${x - 160 * s} ${y - 18 * s} ${x - 70 * s} ${y - 16 * s} ${x} ${y + 14 * s} C${x + 70 * s} ${y - 16 * s} ${x + 160 * s} ${y - 18 * s} ${x + 230 * s} ${y} L${x + 230 * s} ${y + 86 * s} C${x + 160 * s} ${y + 68 * s} ${x + 70 * s} ${y + 70 * s} ${x} ${y + 100 * s} Z M${x} ${y + 14 * s} L${x} ${y + 100 * s}`;
const hourglass = (x: number, y: number, s = 1) => `M${x - 50 * s} ${y - 80 * s} L${x + 50 * s} ${y - 80 * s} M${x - 50 * s} ${y + 80 * s} L${x + 50 * s} ${y + 80 * s} M${x - 40 * s} ${y - 80 * s} C${x - 40 * s} ${y - 20 * s} ${x - 6 * s} ${y - 10 * s} ${x - 6 * s} ${y} C${x - 6 * s} ${y + 10 * s} ${x - 40 * s} ${y + 20 * s} ${x - 40 * s} ${y + 80 * s} M${x + 40 * s} ${y - 80 * s} C${x + 40 * s} ${y - 20 * s} ${x + 6 * s} ${y - 10 * s} ${x + 6 * s} ${y} C${x + 6 * s} ${y + 10 * s} ${x + 40 * s} ${y + 20 * s} ${x + 40 * s} ${y + 80 * s}`;
// A running shoe seen from the side, toe to the right, sole on y.
const shoe = (x: number, y: number) => `M${x} ${y} L${x} ${y - 46} C${x + 14} ${y - 58} ${x + 40} ${y - 58} ${x + 56} ${y - 44} C${x + 86} ${y - 30} ${x + 128} ${y - 26} ${x + 144} ${y - 12} L${x + 144} ${y} Z M${x} ${y - 12} L${x + 144} ${y - 12} M${x + 50} ${y - 46} L${x + 62} ${y - 34} M${x + 66} ${y - 38} L${x + 78} ${y - 26}`;
const quoteLines = (c: Ctx) => D(c, 'M760 640 L1160 640 M820 680 L1100 680', 6, 20, 2, .5);
// Law title card: the four steps in one readable row under the title, this law's step lit.
const stepRow = (c: Ctx, hi: number) => <g>{STEPS.map((t, k) => {const x = 330 + k * 420, lit = hi === 4 || hi === k;return <g key={t} opacity={appear(c.frame, c.start + 16 + k * 5, 12)}>
  <text x={x} y={740} textAnchor="middle" fill={lit ? GOLD : IVORY} fontSize={40} fontWeight={700} opacity={lit ? 1 : .55}>{t}</text>
  {lit ? <path d={`M${x - 110} 762 L${x + 110} 762`} stroke={GOLD} strokeWidth={4} strokeLinecap="round" /> : null}
  {k < 3 ? <path d={`M${x + 160} 728 L${x + 240} 728 M${x + 226} 718 L${x + 240} 728 L${x + 226} 738`} fill="none" stroke={IVORY} strokeWidth={2.4} opacity={.75} /> : null}
</g>;})}</g>;
const card = (kicker: string, title: string, hi: number) => ({card: {kicker, title}, draw: (c: Ctx) => stepRow(c, hi)});

// 1 Cuốn sách là gì. 0 the book with four numbered bookmarks rising, two faint ones before and after; 1–3 a handbook
// whose boxes get ticked, then a pen ticks one more ("đọc một chương, thử một việc").
export const CuonSach = section('03 cuốn sách', /(hai mươi chương|bốn quy luật|bản hướng dẫn thao tác|tâm lý học hành vi|cuốn sổ tay|thử một việc)/gi, [
  {at: 0, draw: (c) => <g>
    {D(c, openBook(960, 560, 1.4), 0, 34, 2.6)}
    <defs><clipPath id="ah-above-pages"><path d="M0 0 L1920 0 L1920 554 L1282 554 C1184 529 1058 532 960 572 C862 532 736 529 638 554 L0 554 Z" /></clipPath></defs>
    <g clipPath="url(#ah-above-pages)">{[0, 1, 2, 3, 4, 5].map((k) => {const main = k > 0 && k < 5, up = appear(c.frame, within(c, 0, .25 + k * .1), 14) * (main ? 100 : 56), x = 690 + k * 100;
      return <g key={k} opacity={appear(c.frame, within(c, 0, .25 + k * .1), 10) * (main ? 1 : .45)}>
        <path d={`M${x} ${560} L${x} ${560 - up} L${x + 52} ${560 - up} L${x + 52} ${560} `} fill="none" stroke={main ? GOLD : IVORY} strokeWidth={2.4} />
        {main ? <text x={x + 26} y={560 - up + 40} textAnchor="middle" fill={GOLD} fontSize={34} fontWeight={700}>{k}</text> : null}
      </g>;})}</g>
  </g>},
  {at: 1, quote: true, draw: (c) => <g>
    {D(c, 'M720 320 L1200 320 L1200 780 L720 780 Z M760 320 L760 780', 0, 30, 2.6)}
    {[0, 1, 2, 3, 4].map((k) => <g key={k} opacity={appear(c.frame, c.start + 20 + k * 4, 10)}>
      <rect x={810} y={380 + k * 76} width={36} height={36} rx={4} fill="none" stroke={IVORY} strokeWidth={2} />
      <path d={`M870 ${398 + k * 76} L${1120 - k * 30} ${398 + k * 76}`} stroke={IVORY} strokeWidth={2.2} opacity={.8} />
      <path d={`M816 ${398 + k * 76} L826 ${408 + k * 76} L842 ${386 + k * 76}`} fill="none" stroke={GOLD} strokeWidth={3} opacity={appear(c.frame, within(c, 2, .2 + k * .14), 8) * (k < 4 ? 1 : appear(c.frame, within(c, 3, .45), 8))} />
    </g>)}
    <path d="M1320 700 L1420 480 L1440 490 L1340 710 Z M1320 700 L1316 724 L1340 710" fill="none" stroke={GOLD} strokeWidth={2.4} strokeLinejoin="round" opacity={appear(c.frame, c.at(3), 14)} />
  </g>},
], options);

// 2 Sợi chỉ xuyên suốt.
// 0 small bricks building a wall · 1–2 two curves leaving one point (up ever steeper / down to the floor), the quote
// 3–5 an ice cube and a thermometer creeping up; at the last mark the cube melts to drops; the work was not lost
// 6–8 two runners toward one flag, one on an even brick road, one on a broken path; the flag fades, the road shines
// 9–11 two figures offered a cigarette: "tôi đang cố bỏ" / "tôi không hút thuốc", the second bubble lights
// 12 votes dropping into a ballot box (quote) · 13–15 the habit loop building step by step, then the four laws around it
export const SoiChi = section('04 sợi chỉ', /(thói quen nhỏ lặp lại mỗi ngày|một phần trăm|lãi kép|đến muộn|cục nước đá|chưa hiện ra|hệ thống|con người mình muốn trở thành|tôi không hút thuốc|lá phiếu|bốn bước|bốn quy luật)/gi, [
  {at: 0, draw: (c) => <g>{Array.from({length: 24}, (_, i) => {const row = Math.floor(i / 6), col = i % 6, x = 700 + col * 90 + (row % 2) * 45, y = 720 - row * 56;
    return <rect key={i} x={x} y={y} width={84} height={48} rx={3} fill="none" stroke={GOLD} strokeWidth={2.2} opacity={appear(c.frame, c.start + 6 + i * 4, 8)} />;})}</g>},
  {at: 1, quote: true, draw: (c) => {const t = interpolate(c.frame, [c.start + 6, within(c, 1, .9)], [0, 1], clamp);
    const up = Array.from({length: 41}, (_, i) => {const x = i / 40;return `${i ? 'L' : 'M'}${600 + x * 760 * t} ${560 - (Math.pow(1.01, x * 365) - 1) / 36.8 * 300 * t}`;}).join(' ');
    const down = Array.from({length: 41}, (_, i) => {const x = i / 40;return `${i ? 'L' : 'M'}${600 + x * 760 * t} ${560 + (1 - Math.pow(.99, x * 365)) * 220 * t}`;}).join(' ');
    return <g><circle cx={600} cy={560} r={8} fill={GOLD} /><path d={up} fill="none" stroke={GOLD} strokeWidth={3} /><path d={down} fill="none" stroke={IVORY} strokeWidth={2.2} opacity={.7} />
      <text x={1320} y={240} fill={GOLD} fontSize={40} fontWeight={700} opacity={t}>+1% mỗi ngày</text><text x={1320} y={800} fill={IVORY} fontSize={40} fontWeight={700} opacity={t * .8}>−1% mỗi ngày</text></g>;}},
  {at: 3, draw: (c) => {const heat = interpolate(c.frame, [within(c, 4, .1), within(c, 4, .85)], [0, 1], clamp), melt = interpolate(c.frame, [within(c, 4, .85), c.at(5) + 30], [0, 1], clamp);
    return <g>
      <g opacity={1 - melt}>{D(c, 'M820 460 L1000 460 L1000 640 L820 640 Z M820 460 L860 420 L1040 420 L1000 460 M1040 420 L1040 600 L1000 640', 0, 30, 2.6)}</g>
      {[0, 1, 2].map((k) => <path key={k} d={`M${870 + k * 50} ${660 + melt * 60} c-8 14 -8 22 0 26 c8 -4 8 -12 0 -26 Z`} fill="none" stroke={GOLD} strokeWidth={2.2} opacity={melt} />)}
      <path d="M1180 360 L1180 640 C1160 650 1160 690 1180 700 C1200 710 1220 690 1220 670 C1220 650 1200 640 1200 640 L1200 360 C1200 345 1180 345 1180 360 Z" fill="none" stroke={IVORY} strokeWidth={2.2} opacity={appear(c.frame, c.start + 14, 12)} />
      <path d={`M1190 680 L1190 ${640 - heat * 260}`} stroke={GOLD} strokeWidth={8} strokeLinecap="round" opacity={appear(c.frame, c.start + 14, 12)} />
      <Glow x={910} y={560} r={200} opacity={appear(c.frame, c.at(5), 24) * .6} />
    </g>;}},
  {at: 6, quote: true, draw: (c) => {const fade = appear(c.frame, c.at(8), 24), run = interpolate(c.frame, [c.start + 10, c.at(8)], [0, 1], clamp);return <g>
    <g opacity={1 - fade * .7}>{D(c, 'M1500 300 L1500 760 M1500 300 L1600 330 L1500 360', 0, 20, 2.6)}</g>
    {Array.from({length: 9}, (_, i) => <rect key={i} x={460 + i * 110} y={700} width={100} height={22} rx={3} fill="none" stroke={GOLD} strokeWidth={2.2 + fade} opacity={appear(c.frame, c.start + 8 + i * 3, 8)} />)}
    {Array.from({length: 9}, (_, i) => i % 3 === 1 ? null : <path key={i} d={`M${460 + i * 110} 560 L${545 + i * 110} 560`} stroke={IVORY} strokeWidth={2.4} opacity={appear(c.frame, c.start + 8 + i * 3, 8) * .85} />)}
    <Figure frame={c.frame} from={c.start + 10} x={520 + run * 700} y={690} s={.55} pose="walk" />
    <Figure frame={c.frame} from={c.start + 10} x={520 + run * 520} y={550} s={.55} pose="walk" color={IVORY} />
    <Glow x={900} y={710} r={240} opacity={fade * .6} />
  </g>;}},
  {at: 9, draw: (c) => {const bubbles = appear(c.frame, c.at(10), 14), second = appear(c.frame, c.at(11), 20);return <g>
    <Figure frame={c.frame} from={c.start + 6} x={720} y={780} s={1} />
    <Figure frame={c.frame} from={c.start + 6} x={1200} y={780} s={1} />
    <g opacity={bubbles}>
      <path d="M500 290 L940 290 L940 410 L760 410 L730 450 L730 410 L500 410 Z" fill="none" stroke={IVORY} strokeWidth={2.2} opacity={.7} />
      <text x={720} y={366} textAnchor="middle" fill={IVORY} fontSize={40} fontWeight={700} opacity={.8}>tôi đang cố bỏ</text>
      <path d="M960 290 L1440 290 L1440 410 L1230 410 L1200 450 L1200 410 L960 410 Z" fill={second ? 'rgba(217,181,111,.12)' : 'none'} stroke={GOLD} strokeWidth={2.2 + second} />
      <text x={1200} y={366} textAnchor="middle" fill={GOLD} fontSize={40} fontWeight={700}>tôi không hút thuốc</text>
    </g>
    <Glow x={1200} y={350} r={200} opacity={second * .6} />
  </g>;}},
  {at: 12, quote: true, draw: (c) => <g>
    {D(c, 'M800 620 L1080 620 L1080 790 L800 790 Z M800 620 L860 570 L1140 570 L1080 620 M1140 570 L1140 740 L1080 790', 0, 28, 2.6)}
    {D(c, 'M920 596 L1030 596', 18, 10, 4)}
    <text x={940} y={722} textAnchor="middle" fill={GOLD} fontSize={36} fontWeight={700} opacity={appear(c.frame, c.start + 24, 10)}>PHIẾU</text>
    {[0, 1, 2, 3].map((k) => {const fall = interpolate(c.frame, [c.start + 20 + k * 22, c.start + 44 + k * 22], [0, 1], {...clamp, easing: ease});
      return <path key={k} d={`M${946 + (k % 2) * 16} ${300 + fall * 250} l50 0 l0 40 l-50 0 Z`} fill="none" stroke={GOLD} strokeWidth={2.2} opacity={appear(c.frame, c.start + 20 + k * 22, 6) * (1 - appear(c.frame, c.start + 44 + k * 22, 6))} />;})}
  </g>},
  {at: 13, draw: (c) => {const laws = appear(c.frame, c.at(14), 20);return <g>
    {loop(960, 520, 1, -1, interpolate(c.frame, [within(c, 13, .25), within(c, 13, .95)], [0, 1], clamp))}
    {['HIỂN NHIÊN', 'HẤP DẪN', 'DỄ DÀNG', 'THỎA MÃN'].map((t, k) => {const [x, y] = [[960, 286], [1460, 520], [960, 758], [460, 520]][k];
      return <text key={t} x={x + (k === 1 ? 60 : k === 3 ? -60 : 0)} y={y + (k === 0 ? -14 : k === 2 ? 34 : 10)} textAnchor={k === 1 ? 'start' : k === 3 ? 'end' : 'middle'} fill={GOLD} fontSize={38} fontWeight={700} opacity={appear(c.frame, within(c, 14, .3 + k * .14), 10) * laws}>{`${k + 1} · ${t}`}</text>;})}
  </g>;}},
], options);

// 3A Quy luật 1: làm cho hiển nhiên (loop: DẤU HIỆU).
// 1–2 a worker beside the rails points ahead · 3–4 a scorecard with + − = marks (quote) · 5–7 a page that fills in
// day, time and place · 8 a coffee cup with a cushion stacked on it (stacking formula) · 9–10 a shelf where water
// bottles appear on every row and the soda cans fade · 11–12 a room plan: an apple bowl on the counter, then zones
// (bed · desk · table) · 13–16 a phone set behind a door that closes (quote)
export const QuyLuat1 = section('05 quy luật 1', /(hiển nhiên|dấu hiệu|chỉ tay|phiếu đánh giá thói quen|sự nhận biết|khi nào, ở đâu|sự rõ ràng|xếp chồng thói quen|môi trường|nước lọc|táo|một việc|khó thấy|ở phòng khác|cám dỗ)/gi, [
  {at: 0, ...card('QUY LUẬT 1', 'Làm cho hiển nhiên', 0)},
  {at: 1, label: 'Nhận ra thói quen', draw: (c) => <g>
    {D(c, 'M300 760 L1620 760 M300 800 L1620 800', 0, 30, 2.2, .7)}
    {Array.from({length: 12}, (_, i) => <path key={i} d={`M${340 + i * 110} 750 L${360 + i * 110} 810`} stroke={GOLD} strokeWidth={2.2} opacity={appear(c.frame, c.start + 8 + i * 2, 6) * .85} />)}
    {D(c, 'M1380 760 L1380 420 M1350 420 L1410 420 L1410 520 L1350 520 Z', 14, 22, 2.4)}
    <circle cx={1380} cy={450} r={12} fill={GOLD} opacity={appear(c.frame, within(c, 2, .3), 10)} />
    <Figure frame={c.frame} from={c.start + 10} x={700} y={740} s={1} arm="point" />
    <path d="M820 450 L1300 450" stroke={GOLD} strokeWidth={2} strokeDasharray="6 10" opacity={appear(c.frame, within(c, 2, .4), 14) * .8} />
  </g>},
  {at: 3, quote: true, draw: (c) => <g>
    {D(c, 'M600 270 L1320 270 L1320 790 L600 790 Z', 0, 24, 2.6)}
    {['Dậy, cầm điện thoại', 'Đánh răng', 'Pha cà phê', 'Lướt mạng 30 phút', 'Đi bộ đi làm'].map((t, k) => <g key={t} opacity={appear(c.frame, c.start + 16 + k * 6, 8)}>
      <text x={650} y={360 + k * 90} fill={IVORY} fontSize={40} fontWeight={700}>{t}</text>
      <text x={1270} y={362 + k * 90} textAnchor="end" fill={GOLD} fontSize={52} fontWeight={700} opacity={appear(c.frame, within(c, 3, .35 + k * .1), 8)}>{['−', '+', '=', '−', '+'][k]}</text>
    </g>)}
  </g>},
  {at: 5, label: 'Nói rõ khi nào, ở đâu', draw: (c) => <g>
    {D(c, 'M560 280 L1360 280 L1360 780 L560 780 Z M560 370 L1360 370', 0, 28, 2.6)}
    <text x={960} y={340} textAnchor="middle" fill={GOLD} fontSize={40} fontWeight={700} opacity={appear(c.frame, c.start + 16, 10)}>TUẦN TỚI, TÔI SẼ TẬP</text>
    {[['Ngày', 'Thứ Hai, Tư, Sáu'], ['Giờ', '6 giờ sáng'], ['Ở đâu', 'Công viên gần nhà']].map(([k, v], i) => <g key={k} opacity={appear(c.frame, within(c, 5, .35 + i * .18), 10)}>
      <text x={610} y={460 + i * 110} fill={IVORY} fontSize={40} fontWeight={700}>{k}</text>
      <path d={`M820 ${474 + i * 110} L1320 ${474 + i * 110}`} stroke={IVORY} strokeWidth={1.6} opacity={.5} />
      <text x={830} y={460 + i * 110} fill={GOLD} fontSize={42} fontWeight={700} opacity={appear(c.frame, within(c, 6, .1 + i * .2), 10)}>{v}</text>
    </g>)}
  </g>},
  {at: 8, quote: true, draw: (c) => <g>
    {/* A mug wider at the rim, its handle joined to the side, on a saucer; the cushion of the new habit above it. */}
    {D(c, 'M620 600 L780 600 L762 750 L638 750 Z M776 632 C846 632 846 716 766 716', 0, 26, 2.6)}
    {D(c, 'M590 768 L810 768', 10, 14, 2.4, .85)}
    {[0, 1, 2].map((k) => <path key={k} d={`M${670 + k * 30} 580 c-10 -18 10 -28 0 -46`} fill="none" stroke={IVORY} strokeWidth={2.2} strokeLinecap="round" opacity={appear(c.frame, c.start + 20, 10) * .75} />)}
    <g opacity={appear(c.frame, within(c, 8, .45), 18)}><path d="M580 450 C580 400 820 400 820 450 C820 492 580 492 580 450 Z M588 452 C660 470 740 470 812 452" fill="rgba(217,181,111,.14)" stroke={GOLD} strokeWidth={2.6} strokeLinejoin="round" /></g>
    <text x={920} y={700} fill={IVORY} fontSize={42} fontWeight={700} opacity={appear(c.frame, within(c, 8, .2), 10)}>Sau khi pha cà phê,</text>
    <path d="M900 652 C872 600 872 540 900 488 M884 506 L900 488 L912 510" fill="none" stroke={GOLD} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" opacity={appear(c.frame, within(c, 8, .45), 14)} />
    <text x={920} y={466} fill={GOLD} fontSize={42} fontWeight={700} opacity={appear(c.frame, within(c, 8, .5), 10)}>tôi ngồi thiền một phút</text>
  </g>},
  {at: 9, label: 'Thay đổi môi trường', draw: (c) => {const swap = appear(c.frame, within(c, 9, .45), 24);return <g>
    {D(c, 'M640 340 L1280 340 M640 480 L1280 480 M640 620 L1280 620 M640 760 L1280 760 M640 340 L640 760 M1280 340 L1280 760', 0, 30, 2.4, .9)}
    {[0, 1, 2].map((row) => Array.from({length: 7}, (_, i) => {const x = 690 + i * 84, y = 470 + row * 140;
      return <g key={`${row}-${i}`}>
        <path d={`M${x} ${y} L${x} ${y - 70} L${x + 10} ${y - 90} L${x + 26} ${y - 90} L${x + 36} ${y - 70} L${x + 36} ${y} Z`} fill="none" stroke={GOLD} strokeWidth={2} opacity={swap * appear(c.frame, within(c, 9, .45) + i * 2 + row * 4, 8)} />
        <rect x={x + 2} y={y - 60} width={34} height={60} rx={4} fill="none" stroke={IVORY} strokeWidth={1.8} opacity={(1 - swap) * .7} />
      </g>;}))}
  </g>;}},
  {at: 11, draw: (c) => {const zones = appear(c.frame, c.at(12), 20);return <g>
    {D(c, 'M560 320 L1360 320 L1360 780 L560 780 Z', 0, 28, 2.4, .9)}
    {D(c, 'M600 360 L860 360 L860 420 L600 420 Z', 10, 16, 2.2)}
    <path d="M690 380 C690 410 770 410 770 380 Z" fill="none" stroke={GOLD} strokeWidth={2.4} opacity={appear(c.frame, c.start + 24, 10)} />
    {[0, 1, 2].map((k) => <circle key={k} cx={708 + k * 22} cy={372} r={10} fill="none" stroke={GOLD} strokeWidth={2} opacity={appear(c.frame, c.start + 30 + k * 4, 8)} />)}
    <Glow x={730} y={385} r={120} opacity={appear(c.frame, c.start + 34, 20) * .6} />
    <g opacity={zones}>
      <path d="M960 320 L960 780 M960 560 L1360 560" stroke={IVORY} strokeWidth={1.8} strokeDasharray="6 10" opacity={.7} />
      <path d="M620 640 L880 640 L880 720 L620 720 Z M620 640 C620 610 680 610 680 640" fill="none" stroke={GOLD} strokeWidth={2.4} />
      <path d="M1040 440 L1280 440 M1080 440 L1080 520 M1240 440 L1240 520 M1140 410 L1180 410 L1180 440" fill="none" stroke={GOLD} strokeWidth={2.4} />
      <path d="M1040 660 C1040 700 1280 700 1280 660 C1280 640 1040 640 1040 660 Z M1160 690 L1160 750" fill="none" stroke={GOLD} strokeWidth={2.4} />
      {['NGỦ', 'LÀM VIỆC', 'ĂN'].map((t, k) => <text key={t} x={[750, 1160, 1160][k]} y={[620, 390, 630][k]} textAnchor="middle" fill={IVORY} fontSize={36} fontWeight={700}>{t}</text>)}
    </g>
  </g>;}},
  {at: 13, label: 'Đảo ngược: làm cho khó thấy', quote: true, draw: (c) => {const shut = interpolate(c.frame, [within(c, 14, .4), within(c, 14, .9)], [0, 1], {...clamp, easing: ease});return <g>
    {D(c, 'M1020 300 L1260 300 L1260 760 L1020 760', 0, 26, 2.6)}
    <path d={`M1020 300 L${1020 + 220 * (1 - shut)} ${320 + 0 * shut} L${1020 + 220 * (1 - shut)} ${740} L1020 760`} fill="none" stroke={GOLD} strokeWidth={2.6} strokeLinejoin="round" opacity={appear(c.frame, c.start + 16, 10)} />
    <g opacity={appear(c.frame, c.at(14), 12) * (1 - shut * .85)}><rect x={1100} y={520} width={60} height={110} rx={10} fill="none" stroke={IVORY} strokeWidth={2.4} /></g>
    <Figure frame={c.frame} from={c.start + 8} x={680} y={760} s={1} pose="sit" />
    {D(c, 'M590 676 L720 676 M594 676 L594 760 M716 676 L716 760', 8, 16, 2.4, .9)}
  </g>;}},
], options);

// 3B Quy luật 2: làm cho hấp dẫn (loop: KHAO KHÁT).
// 1–2 a wrapped gift whose glow is strongest just before it opens · 4–5 a rider on an exercise bike, the screen lit
// only while the wheel spins fast · 7–8 a house with three small players round a chessboard · 9–10 a crowd looking one
// way, one more head turning with them (quote) · 11–14 PHẢI struck through, ĐƯỢC written in, an alarm clock (quote)
export const QuyLuat2 = section('06 quy luật 2', /(hấp dẫn|mong chờ|giản lược|gói cám dỗ|đạp đủ nhanh|việc mình thích|thiên tài|bình thường ở nơi mình sống|đúng một mình|khát khao nguyên thủy|"phải"|"được"|điều mình cần)/gi, [
  {at: 0, ...card('QUY LUẬT 2', 'Làm cho hấp dẫn', 1)},
  {at: 1, label: 'Muốn trước khi làm', draw: (c) => {const glow = interpolate(c.frame, [c.start + 10, within(c, 1, .8)], [0, 1], clamp);return <g>
    <Glow x={960} y={520} r={140 + glow * 200} opacity={glow * .8} />
    {D(c, 'M820 480 L1100 480 L1100 720 L820 720 Z M800 420 L1120 420 L1120 480 L800 480 Z M960 420 L960 720', 0, 30, 2.6)}
    {D(c, 'M960 420 C900 340 860 380 900 420 M960 420 C1020 340 1060 380 1020 420', 14, 18, 2.4)}
    {Array.from({length: 8}, (_, k) => {const a = k / 8 * Math.PI * 2;return <path key={k} d={`M${960 + Math.cos(a) * 200} ${560 + Math.sin(a) * 200} L${960 + Math.cos(a) * (230 + glow * 40)} ${560 + Math.sin(a) * (230 + glow * 40)}`} stroke={GOLD} strokeWidth={2.4} strokeLinecap="round" opacity={glow} />;})}
  </g>;}},
  {at: 4, label: 'Gói cám dỗ', draw: (c) => {const fast = interpolate(c.frame, [within(c, 4, .4), within(c, 4, .7)], [0, 1], clamp), spin = c.frame * (2 + fast * 10);return <g>
    {D(c, 'M640 760 L980 760 M676 640 L736 640 M706 640 L724 744 L900 690 M724 744 L696 760 M724 744 L752 760 M900 740 L880 760 M900 740 L920 760 M900 690 L840 572 L796 572 M751 710 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 M754 716 L724 744', 0, 26, 2.4)}
    <g transform={`translate(900 690) rotate(${spin})`}><circle r={50} fill="none" stroke={GOLD} strokeWidth={2.4} />{[0, 1, 2].map((k) => <path key={k} d={`M0 0 L${Math.cos(k * 2.09) * 50} ${Math.sin(k * 2.09) * 50}`} stroke={GOLD} strokeWidth={1.8} />)}</g>
    <Figure frame={c.frame} from={c.start + 8} x={700} y={700} s={.8} pose="sit" arm="reach" />
    {D(c, 'M1080 380 L1460 380 L1460 620 L1080 620 Z M1240 620 L1220 680 L1320 680 L1300 620', 10, 24, 2.4)}
    <rect x={1100} y={400} width={340} height={200} fill="rgba(217,181,111,.18)" opacity={fast} />
    <path d="M1240 460 L1310 500 L1240 540 Z" fill="none" stroke={GOLD} strokeWidth={2.4} opacity={fast} />
  </g>;}},
  {at: 7, label: 'Người xung quanh', draw: (c) => <g>
    {D(c, 'M640 780 L640 480 L960 300 L1280 480 L1280 780 Z', 0, 30, 2.6)}
    {D(c, 'M860 700 L1060 700 L1080 740 L840 740 Z', 12, 18, 2.4)}
    {[0, 1, 2, 3].map((k) => <path key={k} d={`M${880 + k * 40} 680 L${880 + k * 40} 700 M${876 + k * 40} 680 L${884 + k * 40} 680`} stroke={GOLD} strokeWidth={2} opacity={appear(c.frame, c.start + 26 + k * 3, 8)} />)}
    {[0, 1, 2].map((k) => <g key={k} opacity={appear(c.frame, c.start + 20 + k * 6, 12)}><Figure frame={c.frame} from={c.start + 20 + k * 6} x={[770, 1150, 1240][k]} y={780} s={.55} pose={k === 2 ? 'stand' : 'sit'} facing={k === 0 ? 1 : -1} /></g>)}
  </g>},
  {at: 9, quote: true, draw: (c) => {const turn = appear(c.frame, within(c, 9, .4), 18);return <g>
    {[0, 1, 2, 3, 4].map((k) => <Figure key={k} frame={c.frame} from={c.start + 6} x={560 + k * 150} y={780} s={.8} facing={1} />)}
    <g opacity={appear(c.frame, c.start + 10, 12)}><Figure frame={c.frame} from={c.start + 10} x={1400} y={780} s={.8} facing={turn > .5 ? 1 : -1} color={IVORY} /></g>
    <path d="M1300 480 L1560 480" stroke={GOLD} strokeWidth={2} strokeDasharray="6 10" opacity={turn * .7} />
    <path d="M1560 480 L1540 470 M1560 480 L1540 490" stroke={GOLD} strokeWidth={2} opacity={turn * .7} />
  </g>;}},
  {at: 11, label: 'Đổi cách nói với chính mình', quote: true, draw: (c) => {const strike = appear(c.frame, within(c, 12, .35), 14), better = appear(c.frame, within(c, 12, .55), 14);return <g>
    <text x={680} y={500} textAnchor="middle" fill={IVORY} fontSize={110} fontWeight={700} opacity={appear(c.frame, c.at(12), 12) * (1 - better * .5)}>PHẢI</text>
    <path d="M520 462 L840 462" stroke={GOLD} strokeWidth={6} strokeLinecap="round" opacity={strike} />
    <text x={1260} y={500} textAnchor="middle" fill={GOLD} fontSize={110} fontWeight={700} opacity={better}>ĐƯỢC</text>
    {D(c, 'M960 690 m-60 0 a60 60 0 1 0 120 0 a60 60 0 1 0 -120 0 M960 690 L960 655 M960 690 L985 705 M915 625 L895 605 M1005 625 L1025 605', 6, 24, 2.4)}
  </g>;}},
], options);

// 3C Quy luật 3: làm cho dễ dàng (loop: HÀNH ĐỘNG).
// 1–3 a stack of photos growing on the left, one lone print on the right; the best print rises from the stack
// 4–5 a planning map beside a pair of running shoes that walk off (quote) · 6–8 a kinked hose dripping, the kink
// undone and water running; a gym bag ready by the door · 9–10 an hourglass, a single open page, a yoga mat rolling out
// 11–12 a figure at the kerb raising a hand, a car stops (quote) · 13–15 a locked chest, a lone shawl on the chair,
// a desk and quill · 16 a bell crossed out, an app dragged off a phone
export const QuyLuat3 = section('07 quy luật 3', /(dễ dàng|làm nhiều hơn nghĩ|nhóm chụp nhiều|làm thật|tần suất|ma sát|gỡ chỗ gập|hai phút|một trang|trải thảm|gọi xe|chuẩn hóa|làm cho khó|Victor Hugo|thiết bị cam kết|một lần quyết định)/gi, [
  {at: 0, ...card('QUY LUẬT 3', 'Làm cho dễ dàng', 2)},
  {at: 1, label: 'Làm nhiều hơn nghĩ', draw: (c) => {const rise = appear(c.frame, c.at(3), 24);return <g>
    {Array.from({length: 9}, (_, k) => <rect key={k} x={620 + (k % 2) * 8} y={720 - k * 26} width={220} height={150} rx={4} fill="#0d1411" stroke={GOLD} strokeWidth={2} opacity={appear(c.frame, c.start + 10 + k * 5, 8)} transform={`rotate(${(k % 3 - 1) * 3} 730 ${790 - k * 26})`} />)}
    {D(c, 'M1180 560 L1400 560 L1400 710 L1180 710 Z', 10, 20, 2.2, .7)}
    <g transform={`translate(${rise * 260} ${-rise * 150})`} opacity={rise}><rect x={620} y={460} width={220} height={150} rx={4} fill="#0d1411" stroke={GOLD} strokeWidth={3} /><path d="M640 590 L700 530 L740 570 L780 520 L820 590 Z" fill="none" stroke={GOLD} strokeWidth={2} /></g>
    <Glow x={990} y={385} r={160} opacity={rise * .7} />
  </g>;}},
  {at: 4, quote: true, draw: (c) => {const go = interpolate(c.frame, [within(c, 4, .5), c.at(5) + 30], [0, 1], {...clamp, easing: ease});return <g>
    {D(c, 'M560 340 L900 340 L900 660 L560 660 Z', 0, 24, 2.6)}
    <text x={730} y={398} textAnchor="middle" fill={GOLD} fontSize={36} fontWeight={700} opacity={appear(c.frame, c.start + 12, 10)}>KẾ HOẠCH</text>
    {D(c, 'M610 610 C680 600 660 520 740 520 C810 520 790 460 850 450', 16, 24, 2.4, .9)}
    <circle cx={610} cy={610} r={9} fill={GOLD} opacity={appear(c.frame, c.start + 16, 8)} />
    {D(c, 'M836 436 L864 464 M864 436 L836 464', 36, 8, 2.6)}
    <g transform={`translate(${go * 380} 0)`} opacity={appear(c.frame, within(c, 4, .35), 12)}>
      {D(c, `${shoe(1000, 740)} ${shoe(1170, 740)}`, within(c, 4, .35) - c.start, 18, 2.4)}
    </g>
  </g>;}},
  {at: 6, label: 'Bớt ma sát', draw: (c) => {const fix = interpolate(c.frame, [within(c, 7, .45), within(c, 7, .85)], [0, 1], {...clamp, easing: ease}), bag = appear(c.frame, c.at(8), 16);return <g>
    {D(c, 'M450 396 L520 396 L520 444 L450 444 Z M486 396 L486 372 M466 372 L506 372', 0, 14, 2.4)}
    <path d={`M520 420 L760 420 C${840 - fix * 40} ${420 + (1 - fix) * 120} ${840 + fix * 40} ${420 + (1 - fix) * 120} ${920 + fix * 0} 420 L1100 420`} fill="none" stroke={GOLD} strokeWidth={6} strokeLinecap="round" opacity={appear(c.frame, c.start + 6, 14)} />
    <path d="M1100 420 C1130 420 1150 460 1156 540" fill="none" stroke={IVORY} strokeWidth={3} strokeLinecap="round" opacity={fix * .85} />
    {[0, 1, 2].map((k) => <path key={k} d={`M${1108 + k * 16} ${436 + ((c.frame * (2 + fix * 6) + k * 20) % 70)} l0 ${10 + fix * 12}`} stroke={IVORY} strokeWidth={2.4} strokeLinecap="round" opacity={appear(c.frame, c.start + 10, 10) * (.75 - fix * .4)} />)}
    <g opacity={bag}>
      {D(c, 'M1300 760 L1300 360 L1460 360 L1460 760', c.at(8) - c.start, 18, 2.4, .9)}
      <path d="M1180 700 L1280 700 L1270 760 L1190 760 Z M1200 700 C1200 670 1260 670 1260 700" fill="none" stroke={GOLD} strokeWidth={2.4} />
    </g>
  </g>;}},
  {at: 9, label: 'Quy luật hai phút', draw: (c) => <g>
    {D(c, hourglass(700, 520, 1.3), 0, 26, 2.6)}
    <path d="M700 520 L700 600" stroke={GOLD} strokeWidth={2} strokeDasharray="3 6" opacity={appear(c.frame, c.start + 20, 10)} />
    <g opacity={appear(c.frame, within(c, 10, .45), 14)}>{D(c, openBook(1120, 420, .7), within(c, 10, .45) - c.start, 20, 2.4)}<text x={1120} y={392} textAnchor="middle" fill={IVORY} fontSize={38} fontWeight={700}>1 trang</text></g>
    <g opacity={appear(c.frame, within(c, 10, .75), 14)}><path d={`M960 700 L${960 + interpolate(c.frame, [within(c, 10, .75), within(c, 10, 1)], [40, 360], clamp)} 700`} stroke={GOLD} strokeWidth={14} strokeLinecap="round" opacity={.7} /><circle cx={950} cy={694} r={20} fill="none" stroke={GOLD} strokeWidth={2.4} /></g>
  </g>},
  {at: 11, quote: true, draw: (c) => {const car = interpolate(c.frame, [within(c, 11, .4), within(c, 11, .85)], [0, 1], {...clamp, easing: ease});return <g>
    {D(c, 'M300 760 L1620 760 M300 780 L1620 780', 0, 26, 2, .6)}
    <Figure frame={c.frame} from={c.start + 8} x={760} y={750} s={1} arm="raise" />
    <g transform={`translate(${1700 - car * 640} 0)`} opacity={appear(c.frame, within(c, 11, .35), 10)}>
      <path d="M0 740 L0 680 L40 640 L180 640 L220 680 L260 690 L260 740 Z M40 680 L200 680" fill="none" stroke={GOLD} strokeWidth={2.4} strokeLinejoin="round" />
      <circle cx={60} cy={745} r={18} fill="none" stroke={GOLD} strokeWidth={2.4} /><circle cx={210} cy={745} r={18} fill="none" stroke={GOLD} strokeWidth={2.4} />
    </g>
  </g>;}},
  {at: 13, label: 'Đảo ngược: làm cho khó', draw: (c) => {const lock = appear(c.frame, within(c, 14, .4), 12), word = appear(c.frame, c.at(15), 16);return <g>
    {D(c, 'M560 600 L860 600 L860 760 L560 760 Z M560 600 C560 540 860 540 860 600', 0, 26, 2.6)}
    <g opacity={lock}><rect x={690} y={630} width={40} height={36} rx={4} fill="none" stroke={GOLD} strokeWidth={2.4} /><path d="M698 630 C698 606 722 606 722 630" fill="none" stroke={GOLD} strokeWidth={2.4} /></g>
    {D(c, 'M1110 500 L1110 760 M1000 660 L1110 660 M1004 660 L1004 760 M1080 500 L1110 500', 12, 20, 2.4, .9)}
    <path d="M1096 504 C1136 520 1146 590 1124 646 M1110 520 C1080 560 1086 610 1100 640" fill="none" stroke={IVORY} strokeWidth={2.4} strokeLinecap="round" opacity={appear(c.frame, within(c, 14, .6), 12)} />
    {D(c, 'M1220 640 L1460 640 M1260 640 L1250 760 M1420 640 L1430 760 M1400 560 L1360 630', 16, 20, 2.4)}
    <Word x={960} y={380} size={48} text="THIẾT BỊ CAM KẾT" opacity={word} />
  </g>;}},
  {at: 16, draw: (c) => <g>
    {D(c, 'M860 320 L1060 320 L1060 760 L860 760 Z M930 730 L990 730', 0, 26, 2.6)}
    <g opacity={appear(c.frame, c.start + 18, 12)}><path d="M940 420 C940 380 980 380 980 420 L986 450 L934 450 Z M950 460 C950 470 970 470 970 460" fill="none" stroke={IVORY} strokeWidth={2.2} /><path d="M920 400 L1000 470" stroke={GOLD} strokeWidth={3.6} strokeLinecap="round" opacity={appear(c.frame, c.start + 30, 10)} /></g>
    {(() => {const drag = interpolate(c.frame, [within(c, 16, .55), within(c, 16, .9)], [0, 1], {...clamp, easing: ease});return <rect x={900 + drag * 400} y={560 - drag * 80} width={56} height={56} rx={12} fill="none" stroke={GOLD} strokeWidth={2.4} opacity={appear(c.frame, c.start + 24, 10) * (1 - drag * .8)} />;})()}
  </g>},
], options);

// 3D Quy luật 4: làm cho thỏa mãn (loop: PHẦN THƯỞNG).
// 1–3 two hands under a tap, soap bubbles rising · 4–5 a balance: "bây giờ" and "về sau" tipping opposite ways
// 6–8 a coffee cup fades, a coin drops into a piggy bank tagged with a jacket (quote) · 9–10 two glass jars, paper clips
// moving one by one · 11–12 a calendar of X marks with one empty day and the next X (quote) · 13–15 a contract with two
// signatures and two figures standing side by side
export const QuyLuat4 = section('08 quy luật 4', /(thỏa mãn|phần thưởng|xà phòng|thưởng ngay|hiện tại|tương lai|không làm|áo khoác da|duy trì một thói quen|tiến bộ|kẹp giấy|bỏ lỡ hai lần|ngày tệ|giữ lời|hợp đồng thói quen|dõi theo)/gi, [
  {at: 0, ...card('QUY LUẬT 4', 'Làm cho thỏa mãn', 3)},
  {at: 1, label: 'Phần thưởng ngay lúc làm', draw: (c) => <g>
    {D(c, 'M820 280 L820 330 M820 306 L1010 306 C1036 306 1044 320 1044 344 L1044 372 M1024 372 L1064 372', 0, 20, 2.6)}
    {[0, 1, 2].map((k) => <path key={k} d={`M1044 ${392 + ((c.frame * 4 + k * 30) % 110)} l0 16`} stroke={IVORY} strokeWidth={2.2} strokeLinecap="round" opacity={appear(c.frame, c.start + 12, 10) * .8} />)}
    {D(c, 'M920 540 C930 620 1000 648 1034 634 M1168 540 C1158 620 1088 648 1054 634 M920 540 C914 524 930 514 940 528 M1168 540 C1174 524 1158 514 1148 528', 10, 26, 2.6)}
    {Array.from({length: 7}, (_, k) => {const rise = ((c.frame - c.start - 20 - k * 9) % 80) / 80;return c.frame < c.start + 20 + k * 9 ? null : <circle key={k} cx={960 + (k * 37) % 170} cy={560 - rise * 200} r={10 + (k % 3) * 6} fill="none" stroke={GOLD} strokeWidth={2} opacity={appear(c.frame, within(c, 3, .1), 14) * (1 - rise)} />;})}
  </g>},
  {at: 4, draw: (c) => {const tilt = interpolate(c.frame, [within(c, 5, .1), within(c, 5, .5), within(c, 5, .6), within(c, 5, 1)], [0, -10, -10, 10], clamp);return <g>
    {D(c, 'M960 780 L960 420 M880 780 L1040 780', 0, 22, 2.6)}
    <g transform={`rotate(${tilt} 960 420)`}>
      {D(c, 'M680 420 L1240 420', 8, 18, 2.6)}
      <g transform={`rotate(${-tilt} 680 420)`}><path d="M680 420 L620 540 M680 420 L740 540 M590 540 L770 540 C760 580 600 580 590 540" fill="none" stroke={GOLD} strokeWidth={2.2} /><text x={680} y={624} textAnchor="middle" fill={IVORY} fontSize={40} fontWeight={700}>BÂY GIỜ</text></g>
      <g transform={`rotate(${-tilt} 1240 420)`}><path d="M1240 420 L1180 540 M1240 420 L1300 540 M1150 540 L1330 540 C1320 580 1160 580 1150 540" fill="none" stroke={GOLD} strokeWidth={2.2} /><text x={1240} y={624} textAnchor="middle" fill={IVORY} fontSize={40} fontWeight={700}>VỀ SAU</text></g>
    </g>
  </g>;}},
  {at: 6, label: 'Cho việc "không làm" một phần thưởng', quote: true, draw: (c) => {const coin = interpolate(c.frame, [within(c, 7, .45), within(c, 7, .8)], [0, 1], {...clamp, easing: ease});return <g>
    <g opacity={appear(c.frame, c.start + 6, 12) * (1 - appear(c.frame, within(c, 7, .35), 16) * .65)}>{D(c, 'M620 700 L760 700 L740 560 L640 560 Z M760 600 C800 600 800 660 750 660', 0, 22, 2.4)}</g>
    {D(c, 'M1040 620 C1040 520 1300 520 1300 620 C1300 700 1260 740 1200 740 L1100 740 C1060 740 1040 700 1040 620 Z M1090 740 L1090 770 M1250 740 L1250 770 M1150 536 L1196 536', 10, 30, 2.6)}
    {D(c, 'M1300 592 C1330 588 1334 628 1300 630 M1240 548 L1258 512 L1274 552 M1040 616 C1014 606 1018 584 1032 592', 24, 18, 2.4)}
    <circle cx={1262} cy={584} r={5} fill={GOLD} opacity={appear(c.frame, c.start + 34, 8)} />
    <circle cx={1170} cy={360 + coin * 160} r={20} fill="none" stroke={GOLD} strokeWidth={2.6} opacity={appear(c.frame, within(c, 7, .45), 8) * (1 - appear(c.frame, within(c, 7, .8), 6))} />
    <g opacity={appear(c.frame, within(c, 7, .6), 14)}><path d="M1340 650 L1600 650 L1600 730 L1340 730 Z" fill="none" stroke={IVORY} strokeWidth={2} /><text x={1470} y={703} textAnchor="middle" fill={IVORY} fontSize={36} fontWeight={700}>áo khoác da</text></g>
  </g>;}},
  {at: 9, label: 'Nhìn thấy tiến bộ', draw: (c) => {const moved = Math.floor(interpolate(c.frame, [within(c, 10, .3), within(c, 10, 1)], [0, 8], clamp));return <g>
    {D(c, 'M640 460 L640 760 L880 760 L880 460 M1040 460 L1040 760 L1280 760 L1280 460', 0, 26, 2.6)}
    {Array.from({length: 8}, (_, k) => {const right = k < moved, x = (right ? 1056 : 656) + (k % 4) * 54, y = 736 - Math.floor(k / 4) * 34;
      // A paper clip: two nested rounded loops.
      return <path key={k} d={`M${x} ${y} L${x + 40} ${y} A9 9 0 0 0 ${x + 40} ${y - 18} L${x + 6} ${y - 18} A6 6 0 0 0 ${x + 6} ${y - 6} L${x + 34} ${y - 6}`} fill="none" stroke={right ? GOLD : IVORY} strokeWidth={2.4} strokeLinecap="round" opacity={appear(c.frame, c.start + 14, 10)} />;})}
  </g>;}},
  {at: 11, quote: true, draw: (c) => <g>
    {D(c, 'M620 300 L1300 300 L1300 760 L620 760 Z M620 380 L1300 380', 0, 28, 2.6)}
    {Array.from({length: 21}, (_, k) => {const x = 660 + (k % 7) * 92, y = 420 + Math.floor(k / 7) * 110, gap = k === 10, show = appear(c.frame, c.start + 20 + k * 3, 6);
      return <g key={k}><rect x={x} y={y} width={70} height={80} fill="none" stroke={IVORY} strokeWidth={1.8} opacity={.65} />
        {gap ? null : <path d={`M${x + 18} ${y + 22} L${x + 52} ${y + 58} M${x + 52} ${y + 22} L${x + 18} ${y + 58}`} stroke={k === 11 ? GOLD : GOLD} strokeWidth={k === 11 ? 4 : 2.6} opacity={show} />}</g>;})}
    <Glow x={1035} y={570} r={90} opacity={appear(c.frame, c.at(12), 20) * .8} />
  </g>},
  {at: 13, label: 'Đảo ngược: có người cùng giữ lời', draw: (c) => <g>
    {D(c, 'M820 300 L1100 300 L1100 660 L820 660 Z', 0, 24, 2.6)}
    {[0, 1, 2, 3].map((k) => <path key={k} d={`M860 ${360 + k * 50} L${1060 - (k % 2) * 60} ${360 + k * 50}`} stroke={IVORY} strokeWidth={2.2} opacity={appear(c.frame, c.start + 14 + k * 4, 8) * .8} />)}
    {D(c, 'M860 610 C880 590 900 630 930 600 M990 610 C1010 580 1030 640 1060 600', within(c, 14, .5) - c.start, 20, 2.4)}
    <Figure frame={c.frame} from={c.start + 10} x={640} y={780} s={.9} />
    <Figure frame={c.frame} from={c.start + 14} x={1280} y={780} s={.9} facing={-1} />
  </g>},
], options);

// 3E Khi thói quen đã thành nếp (the whole loop turns).
// 1–3 a swimmer by a pool and a runner on a track; then many arrows one way and one bending off on its own (quote)
// 4–5 a rope between "quá dễ" and "quá khó" with the middle lit · 6–7 a figure repeating the same move, tally marks
// running on (quote) · 8–11 a year-end notebook opening, a soft branch bending in the wind (quote)
export const ThanhNep = section('08b thành nếp', /(thành nếp|sân chơi|lợi thế|khác biệt|vừa sức|buồn chán|vẫn làm|quán tính|tổng kết mỗi cuối năm|mềm dẻo|thuốc giải)/gi, [
  {at: 0, card: {kicker: 'PHẦN CUỐI', title: 'Khi thói quen đã thành nếp'}, draw: (c) => stepRow(c, 4)},
  {at: 1, label: 'Chọn đúng sân chơi', quote: true, draw: (c) => {const arrows = appear(c.frame, c.at(3), 18);return <g>
    <g opacity={1 - arrows}>
      {D(c, 'M420 700 L860 700 L860 760 L420 760 Z M440 720 C480 710 520 730 560 720 C600 710 640 730 680 720 C720 710 760 730 800 720', 0, 26, 2.2, .8)}
      <Figure frame={c.frame} from={c.start + 10} x={640} y={690} s={.8} arm="raise" />
      {D(c, 'M1060 760 L1500 760 M1060 720 L1500 720', 8, 22, 2.2, .7)}
      <Figure frame={c.frame} from={c.start + 14} x={1280} y={710} s={.8} pose="walk" />
    </g>
    <g opacity={arrows}>{[0, 1, 2, 3, 4].map((k) => <path key={k} d={k === 4 ? 'M640 690 L880 690 C1000 690 1080 716 1200 772 M1176 774 L1200 772 L1188 752' : `M640 ${400 + k * 70} L1240 ${400 + k * 70} M1220 ${390 + k * 70} L1240 ${400 + k * 70} L1220 ${410 + k * 70}`} fill="none" stroke={k === 4 ? GOLD : IVORY} strokeWidth={k === 4 ? 3.4 : 2.2} strokeLinecap="round" strokeLinejoin="round" opacity={k === 4 ? 1 : .75} />)}<Glow x={1200} y={772} r={120} opacity={arrows * .7} /></g>
  </g>;}},
  {at: 4, label: 'Vừa sức và chịu được nhàm chán', draw: (c) => <g>
    {D(c, 'M560 560 C760 600 1160 600 1360 560', 0, 26, 2.6)}
    <text x={540} y={520} textAnchor="end" fill={IVORY} fontSize={42} fontWeight={700} opacity={appear(c.frame, c.start + 16, 10)}>quá dễ</text>
    <text x={1380} y={520} fill={IVORY} fontSize={42} fontWeight={700} opacity={appear(c.frame, c.start + 16, 10)}>quá khó</text>
    <circle cx={960} cy={590} r={14} fill={GOLD} opacity={appear(c.frame, within(c, 5, .4), 12)} />
    <Glow x={960} y={590} r={160} opacity={appear(c.frame, within(c, 5, .45), 20) * .8} />
    <text x={960} y={680} textAnchor="middle" fill={GOLD} fontSize={46} fontWeight={700} opacity={appear(c.frame, within(c, 5, .5), 12)}>vừa sức</text>
  </g>},
  {at: 6, quote: true, draw: (c) => {const bob = Math.abs(Math.sin((c.frame - c.start) / 10)) * 20;return <g>
    <Figure frame={c.frame} from={c.start + 6} x={700} y={760 - bob * 0} s={.95} arm={bob > 10 ? 'raise' : 'down'} />
    {Array.from({length: 20}, (_, k) => <path key={k} d={`M${940 + (k % 10) * 46} ${560 + Math.floor(k / 10) * 90} l0 60`} stroke={k % 5 === 4 ? GOLD : IVORY} strokeWidth={2.4} opacity={appear(c.frame, c.start + 14 + k * 5, 6) * (k % 5 === 4 ? 1 : .7)} />)}
  </g>;}},
  {at: 8, label: 'Xem lại và giữ mình mềm dẻo', quote: true, draw: (c) => {const sway = Math.sin((c.frame - c.start) / 22) * 8;return <g>
    {D(c, openBook(760, 580, .9), 0, 28, 2.6)}
    {['Điều gì tốt?', 'Điều gì chưa tốt?', 'Mình học được gì?'].map((t, k) => <text key={t} x={760} y={340 + k * 62} textAnchor="middle" fill={GOLD} fontSize={42} fontWeight={700} opacity={appear(c.frame, within(c, 10, .3 + k * .15), 10)}>{t}</text>)}
    <g transform={`rotate(${sway} 1300 780)`}><g opacity={appear(c.frame, within(c, 10, .7), 16)}><path d="M1300 780 C1290 680 1310 600 1360 520 M1318 652 C1356 640 1384 612 1398 582 M1334 594 C1306 572 1296 544 1296 514" fill="none" stroke={GOLD} strokeWidth={2.6} strokeLinecap="round" />
      {[[1360, 520, -30], [1398, 582, 20], [1296, 514, -60], [1352, 640, 40], [1310, 700, -40]].map(([x, y, a], k) => <ellipse key={k} cx={x} cy={y} rx={22} ry={10} transform={`rotate(${a} ${x} ${y})`} fill="rgba(217,181,111,.14)" stroke={GOLD} strokeWidth={2.2} />)}</g></g>
  </g>;}},
], options);

// 3F Những điểm chưa đạt. 0–2 a handbook with numbers floating round it and fading; the handbook stays sharp
// 3–4 two pages side by side, a few lines circled with a dashed ring · 5–6 a figure before a high wall, another hand
// reaching out to help
export const ChuaDat = section('08e điểm chưa đạt', /(chưa đạt|nghiên cứu|minh họa|cách làm|bản dịch|đối chiếu|bản gốc|hoàn cảnh quá khó|chuyên gia)/gi, [
  {at: 0, draw: (c) => {const fade = appear(c.frame, c.at(2), 30);return <g>
    {D(c, 'M820 360 L1100 360 L1100 740 L820 740 Z M850 360 L850 740', 0, 26, 2.6)}
    {['37×', '91%', '25,8%', '85%', '2 phút', '1%'].map((t, k) => <text key={t} x={[640, 1240, 700, 1300, 660, 1260][k]} y={[400, 420, 560, 580, 700, 720][k]} textAnchor="middle" fill={IVORY} fontSize={48} fontWeight={700} opacity={appear(c.frame, within(c, 1, .2 + k * .1), 10) * (1 - fade)}>{t}</text>)}
    <Glow x={960} y={550} r={200} opacity={fade * .5} />
  </g>;}},
  {at: 3, draw: (c) => <g>
    {D(c, 'M560 340 L900 340 L900 760 L560 760 Z M1020 340 L1360 340 L1360 760 L1020 760 Z', 0, 26, 2.4)}
    {Array.from({length: 7}, (_, k) => <g key={k}><path d={`M600 ${390 + k * 50} L860 ${390 + k * 50}`} stroke={IVORY} strokeWidth={2.2} opacity={appear(c.frame, c.start + 12, 10) * .75} /><path d={`M1060 ${390 + k * 50} L1320 ${390 + k * 50}`} stroke={IVORY} strokeWidth={2.2} opacity={appear(c.frame, c.start + 12, 10) * .75} /></g>)}
    {[[730, 490], [1190, 490], [730, 640], [1190, 640]].map(([x, y], k) => <ellipse key={k} cx={x} cy={y} rx={150} ry={26} fill="none" stroke={GOLD} strokeWidth={2.2} strokeDasharray="6 8" opacity={appear(c.frame, within(c, 3, .4 + (k % 2) * .1 + Math.floor(k / 2) * .25), 10)} />)}
  </g>},
  {at: 5, draw: (c) => <g>
    {D(c, 'M1000 780 L1000 300 L1400 300 L1400 780', 0, 26, 2.6)}
    {Array.from({length: 8}, (_, r) => <path key={r} d={`M1000 ${360 + r * 60} L1400 ${360 + r * 60} ${Array.from({length: 4}, (_, k) => `M${1050 + k * 100 + (r % 2) * 50} ${300 + r * 60} L${1050 + k * 100 + (r % 2) * 50} ${360 + r * 60}`).join(' ')}`} fill="none" stroke={GOLD} strokeWidth={2} opacity={appear(c.frame, c.start + 14 + r * 3, 8) * .75} />)}
    <Figure frame={c.frame} from={c.start + 8} x={800} y={780} s={1} pose="headHold" />
    <g opacity={appear(c.frame, c.at(6), 16)}><Figure frame={c.frame} from={c.at(6)} x={560} y={780} s={.95} arm="reach" color={IVORY} /></g>
    <Glow x={680} y={560} r={150} opacity={appear(c.frame, within(c, 6, .4), 20) * .6} />
  </g>},
], options);

// 3G Tổng kết. 0 a seed becoming a sapling, growing as the line is read · 1–2 the full habit loop, each step lighting
// in turn then all together · 3 the closing quote over a faint loop
export const TongKet = section('08f tổng kết', /(tóm lại|nhân lên|con người mình muốn trở thành|bốn quy luật|đọc chậm|làm thử từng chương|hợp thành)/gi, [
  {at: 0, draw: (c) => {const g = interpolate(c.frame, [c.start + 10, within(c, 0, 1)], [0, 1], {...clamp, easing: ease});return <g>
    {D(c, 'M760 760 L1160 760', 0, 20, 2.2, .7)}
    <path d={`M960 760 L960 ${760 - g * 300}`} stroke={GOLD} strokeWidth={3} strokeLinecap="round" />
    {[0, 1, 2, 3].map((k) => {const show = appear(g * 4, k, .8), y = 700 - k * 70, dir = k % 2 ? 1 : -1;return <path key={k} d={`M960 ${y} C${960 + dir * 40} ${y - 30} ${960 + dir * 90} ${y - 20} ${960 + dir * 110} ${y - 50} C${960 + dir * 70} ${y - 60} ${960 + dir * 30} ${y - 40} 960 ${y}`} fill="none" stroke={GOLD} strokeWidth={2.4} opacity={show} />;})}
  </g>;}},
  {at: 1, draw: (c) => {const k = Math.floor(interpolate(c.frame, [within(c, 1, .2), within(c, 1, .9)], [0, 4], clamp)), all = appear(c.frame, c.at(2), 20);return <g>{loop(960, 520, 1, all > .5 ? 4 : Math.min(3, k))}</g>;}},
  {at: 3, quote: true, draw: (c) => <g opacity={.75}>{loop(960, 520, 1, 4)}</g>},
], options);

// 5 Nhận xét chung. 0 the book open with rays · 1 an hourglass beside a pair of tied shoes · 2 a path of small
// footprints leading toward the light
export const NhanXet = section('09 nhận xét chung', /(cuốn sách hay|bỏ dở giữa chừng|chưa tới hai phút|đọc qua|bỏ cuộc|thật nhỏ)/gi, [
  {at: 0, draw: (c) => <g>
    <Glow x={960} y={500} r={300} opacity={appear(c.frame, c.start + 10, 30)} />
    {D(c, openBook(960, 560, 1.2), 0, 30, 2.6)}
    {[0, 1, 2, 3, 4].map((k) => {const a = -Math.PI / 2 + (k - 2) * .35;return <path key={k} d={`M${960 + Math.cos(a) * 120} ${520 + Math.sin(a) * 120} L${960 + Math.cos(a) * 250} ${520 + Math.sin(a) * 250}`} stroke={GOLD} strokeWidth={2.6} strokeLinecap="round" opacity={appear(c.frame, c.start + 24 + k * 4, 12) * .9} />;})}
  </g>},
  {at: 1, draw: (c) => <g>
    {D(c, hourglass(760, 560, 1.2), 0, 26, 2.6)}
    {D(c, `${shoe(1000, 720)} ${shoe(1170, 720)}`, 12, 24, 2.4)}
  </g>},
  {at: 2, draw: (c) => <g>
    <Glow x={1400} y={420} r={220} opacity={appear(c.frame, c.start + 30, 30)} />
    {Array.from({length: 9}, (_, k) => <ellipse key={k} cx={560 + k * 100} cy={780 - k * 40 + (k % 2) * 20} rx={9} ry={16} fill={GOLD} opacity={appear(c.frame, c.start + 8 + k * 7, 8) * .8} />)}
  </g>},
], options);
