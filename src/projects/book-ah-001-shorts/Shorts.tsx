import type {FC} from 'react';
import {interpolate} from 'remotion';
import {GOLD, IVORY, clamp, ease} from '../book-hvtt-001-overview/Intro';
import {appear} from '../book-hvtt-001-overview/scene-kit';
import {D, W, createShortKit} from '../book-hvtt-001-shorts/ShortFrame';
import type {SBeat, SCtx, ShortProps} from '../book-hvtt-001-shorts/ShortFrame';
import music from './music.json';
import data from './shorts.json';
import layout from './layout.json';

// The four shorts of episode 2 (Thay đổi tí hon hiệu quả bất ngờ), redrawn for the vertical frame with episode 2's
// content (image-prompts.md). The frame is episode 1's shorts kit (shared, not copied). Beat times are seconds inside
// each excerpt, from the sentence starts and the karaoke word times of the picked clone voice. Series rules: a drawing
// or word appears as it is spoken, no overlapping strokes, text in drawings at least 44px, drawings in y 460–1340.
// Rests (layout.json, also read by qa.py): 0.5 s after the opening line, 0.8 s before the invitation.
const kit = createShortKit(data, music, layout, 'Giọng · đoạn trích tập 2');
const SERIES = {seriesLabel: 'ĐỌC SÁCH, HIỂU MÌNH', bookLine: 'Thay đổi tí hon hiệu quả bất ngờ · James Clear', bookLineSize: 36, episodeLabel: 'TẬP 02', bookTitle: 'Thay đổi tí hon', bookAuthor: 'James Clear'};
const grow = (c: SCtx, a: number, b: number) => interpolate(c.frame, [c.t(a), c.t(b)], [0, 1], {...clamp, easing: ease});

// Short 1 · 1% mỗi ngày và cục nước đá (04-soi-chi-sang2, 7.23–30.46 s).
// 0 two curves leave one point: +1% climbs (with "tốt hơn"), −1% sinks (with "tệ đi") · 9.6 LÃI KÉP over the chart
// 12.1 an ice cube and a thermometer that creeps up; at "mới tan" the cube melts to drops · 20.4 a glow: "chưa hiện ra".
const curve = (sign: 1 | -1, t: number) => Array.from({length: 41}, (_, i) => {const x = i / 40;
  const y = sign > 0 ? -(Math.pow(1.01, x * 365) - 1) / 36.8 * 340 : (1 - Math.pow(.99, x * 365)) * 260;
  return `${i ? 'L' : 'M'}${180 + x * 700 * t} ${980 + y * t}`;}).join(' ');
const ICE: SBeat[] = [
  {at: 0, draw: (c) => {const up = grow(c, 1.6, 4.2), down = grow(c, 5.6, 7.2);return <g>
    <circle cx={180} cy={980} r={10} fill={GOLD} opacity={appear(c.frame, c.start + 6, 10)} />
    <path d={curve(1, up)} fill="none" stroke={GOLD} strokeWidth={3.4} strokeLinecap="round" opacity={up > 0 ? 1 : 0} />
    <path d={curve(-1, down)} fill="none" stroke={IVORY} strokeWidth={2.8} strokeLinecap="round" opacity={down > 0 ? .8 : 0} />
    <text x={860} y={590} textAnchor="end" fill={GOLD} fontSize={48} fontWeight={700} opacity={up}>+1% mỗi ngày</text>
    <text x={860} y={1320} textAnchor="end" fill={IVORY} fontSize={48} fontWeight={700} opacity={down * .85}>−1% mỗi ngày</text>
    {W(520, 500, 76, 'LÃI KÉP', appear(c.frame, c.t(9.6), 14), GOLD)}
  </g>;}},
  {at: 12.09, draw: (c) => {const heat = grow(c, 14.4, 19.6), melt = grow(c, 19.7, 20.6);return <g>
    <g opacity={1 - melt}>{D(c, 'M300 640 L560 640 L560 900 L300 900 Z M300 640 L360 580 L620 580 L560 640 M620 580 L620 840 L560 900', 0, 30, 3)}</g>
    {[0, 1, 2].map((k) => <path key={k} d={`M${380 + k * 60} ${930 + melt * 80} c-10 18 -10 28 0 32 c10 -4 10 -14 0 -32 Z`} fill="none" stroke={GOLD} strokeWidth={2.8} opacity={melt} />)}
    <path d="M790 560 L790 1040 C762 1054 762 1106 800 1118 C838 1106 838 1054 810 1040 L810 560 C810 540 790 540 790 560 Z" fill="none" stroke={IVORY} strokeWidth={2.8} opacity={appear(c.frame, c.start + 12, 12)} />
    <path d={`M800 1090 L800 ${1040 - heat * 440}`} stroke={GOLD} strokeWidth={10} strokeLinecap="round" opacity={appear(c.frame, c.start + 12, 12)} />
    <circle cx={440} cy={800} r={240} fill="url(#short-glow)" opacity={appear(c.frame, c.t(20.4), 24) * .9} />
    {W(520, 1260, 52, 'chưa hiện ra', appear(c.frame, c.t(22.4), 14), GOLD)}
  </g>;}},
];

// Short 2 · Bốn bước của một thói quen (04-soi-chi-sang2, 67.18–87.25 s).
// One drawing: the four steps as numbered boxes down the frame (each with its word), the good law in gold under each
// box (with its word), then at "Muốn bỏ thói quen xấu…" the opposite in ivory beside it, row by row as read.
const STEPS = ['DẤU HIỆU', 'KHAO KHÁT', 'HÀNH ĐỘNG', 'PHẦN THƯỞNG'];
const GOOD = ['HIỂN NHIÊN', 'HẤP DẪN', 'DỄ DÀNG', 'THỎA MÃN'];
const BAD = ['KHÓ THẤY', 'KÉM HẤP DẪN', 'KHÓ LÀM', 'KHÔNG THỎA MÃN'];
const STEP_AT = [3.54, 4.66, 5.54, 6.66], GOOD_AT = [10.68, 11.44, 12.2, 12.74], BAD_AT = [16.58, 17.46, 18.38, 19.32];
const LOOP: SBeat[] = [
  {at: 0, draw: (c) => {const table = appear(c.frame, c.t(13.6), 16);return <g>
    {W(520, 500, 46, 'BỐN BƯỚC CỦA MỘT THÓI QUEN', appear(c.frame, c.start + 8, 14) * (1 - table))}
    <text x={440} y={500} textAnchor="end" fill={GOLD} fontSize={38} fontWeight={700} opacity={table}>XÂY THÓI QUEN TỐT</text>
    <text x={600} y={500} textAnchor="start" fill={IVORY} fontSize={38} fontWeight={700} opacity={table}>BỎ THÓI QUEN XẤU</text>
    {STEPS.map((step, k) => {const y = 560 + k * 190, on = appear(c.frame, c.t(STEP_AT[k]) - 6, 12);return <g key={step}>
      <g opacity={on}>
        <rect x={330} y={y} width={380} height={72} rx={12} fill="rgba(217,181,111,.10)" stroke={GOLD} strokeWidth={2.6} />
        {W(520, y + 50, 40, `${k + 1} · ${step}`, 1)}
      </g>
      <text x={440} y={y + 138} textAnchor="end" fill={GOLD} fontSize={44} fontWeight={700} opacity={appear(c.frame, c.t(GOOD_AT[k]) - 4, 10)}>{GOOD[k]}</text>
      <g opacity={appear(c.frame, c.t(BAD_AT[k]) - 4, 10)}>
        <path d={`M462 ${y + 124} L578 ${y + 124} M562 ${y + 112} L578 ${y + 124} L562 ${y + 136}`} fill="none" stroke={IVORY} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
        <text x={600} y={y + 138} textAnchor="start" fill={IVORY} fontSize={38} fontWeight={700}>{BAD[k]}</text>
      </g>
    </g>;})}
  </g>;}},
];

// Short 3 · Làm nhiều hơn nghĩ (07-quy-luat-3-sang2, 5.18–28.23 s).
// 1.6 the class in two: a pile of photos grows ("chấm điểm theo số lượng"), a lone empty frame ("một tấm thật hoàn hảo")
// 8.5 the best print rises from the pile and glows · 14.2 a plan board, a pair of shoes that run off ("không phải là đi
// tập") · 18.9 tally marks day after day ("tần suất").
const shoe = (x: number, y: number) => `M${x} ${y} L${x} ${y - 46} C${x + 14} ${y - 58} ${x + 40} ${y - 58} ${x + 56} ${y - 44} C${x + 86} ${y - 30} ${x + 128} ${y - 26} ${x + 144} ${y - 12} L${x + 144} ${y} Z M${x} ${y - 12} L${x + 144} ${y - 12}`;
const ACT: SBeat[] = [
  {at: 0, draw: (c) => {const rise = grow(c, 9.2, 10.6);return <g>
    {Array.from({length: 9}, (_, k) => <rect key={k} x={230 + (k % 2) * 8} y={760 - k * 24} width={240} height={160} rx={6} fill="#0d1411" stroke={GOLD} strokeWidth={2.4} opacity={appear(c.frame, c.t(2.6 + k * .3), 8)} transform={`rotate(${(k % 3 - 1) * 3} 350 ${840 - k * 24})`} />)}
    {W(350, 990, 44, 'chụp nhiều', appear(c.frame, c.t(4.4), 12))}
    {D(c, 'M610 600 L850 600 L850 760 L610 760 Z', c.t(5.8) - c.start, 20, 2.6, .8)}
    {W(730, 830, 44, 'một tấm', appear(c.frame, c.t(6.4), 12))}
    {W(730, 886, 44, 'hoàn hảo', appear(c.frame, c.t(6.4), 12))}
    <g transform={`translate(${rise * 170} ${rise * 520})`} opacity={rise}>
      <rect x={230} y={570} width={240} height={160} rx={6} fill="#0d1411" stroke={GOLD} strokeWidth={3.4} />
      <path d="M252 708 L320 640 L364 684 L410 632 L450 708 Z" fill="none" stroke={GOLD} strokeWidth={2.6} strokeLinejoin="round" />
    </g>
    <circle cx={520} cy={1170} r={220} fill="url(#short-glow)" opacity={rise * .9} />
    {W(520, 1330, 48, 'đẹp nhất', appear(c.frame, c.t(10.2), 12), GOLD)}
  </g>;}},
  {at: 14.17, draw: (c) => {const go = grow(c, 17.4, 18.7), marks = appear(c.frame, c.t(18.9), 14);return <g>
    <g opacity={1 - marks * .7}>
      {D(c, 'M300 520 L740 520 L740 880 L300 880 Z', 0, 26, 2.8)}
      {W(520, 590, 46, 'KẾ HOẠCH', appear(c.frame, c.start + 12, 12), GOLD)}
      {D(c, 'M350 840 C430 830 410 730 500 730 C590 730 570 660 680 650', 16, 24, 2.6, .9)}
    </g>
    <g transform={`translate(${go * 520} 0)`} opacity={appear(c.frame, c.t(15.6), 12) * (1 - marks)}>{D(c, `${shoe(300, 1140)} ${shoe(480, 1140)}`, c.t(15.6) - c.start, 18, 2.8)}</g>
    {Array.from({length: 21}, (_, k) => {const row = Math.floor(k / 7), col = k % 7, x = 250 + col * 90, y = 980 + row * 110;
      return <path key={k} d={`M${x} ${y} L${x + 14} ${y + 80}`} stroke={GOLD} strokeWidth={4} strokeLinecap="round" opacity={appear(c.frame, c.t(19.6) + k * 3, 6)} />;})}
    {W(520, 950, 52, 'tần suất', appear(c.frame, c.t(21.4), 12), GOLD)}
  </g>;}},
];

// Short 4 · Làm cho thỏa mãn (08-quy-luat-4-sang2, 5.26–29.00 s).
// 0 a tap and two cupped hands under it · 6.6 soap bubbles rise ("xà phòng thơm và nhiều bọt") · 12.9 the core rule:
// a gold tick with "thưởng ngay → lặp lại", an ivory cross with "khó chịu ngay → tránh" · 19.0 a balance "BÂY GIỜ" /
// "VỀ SAU" tipping toward now as "trả giá ở hiện tại" is read.
const SOAP: SBeat[] = [
  {at: 0, draw: (c) => <g>
    {D(c, 'M260 560 L260 620 M260 590 L620 590 C660 590 680 610 680 650 L680 700 M650 700 L710 700', 0, 22, 3)}
    {[0, 1, 2].map((k) => <path key={k} d={`M680 ${730 + ((c.frame * 4 + k * 40) % 150)} l0 22`} stroke={IVORY} strokeWidth={2.6} strokeLinecap="round" opacity={appear(c.frame, c.start + 14, 10) * .8} />)}
    {D(c, 'M520 960 C530 1080 640 1120 670 1100 M840 960 C830 1080 720 1120 690 1100 M520 960 C512 936 534 922 546 942 M840 960 C848 936 826 922 814 942', 12, 26, 3)}
    {Array.from({length: 8}, (_, k) => {const from = c.t(7.1) + k * 9, rise = ((c.frame - from) % 90) / 90;return c.frame < from ? null : <circle key={k} cx={560 + (k * 47) % 240} cy={960 - rise * 300} r={12 + (k % 3) * 8} fill="none" stroke={GOLD} strokeWidth={2.4} opacity={1 - rise} />;})}
    {W(680, 1260, 50, 'dễ chịu', appear(c.frame, c.t(9.5), 12), GOLD)}
  </g>},
  {at: 12.85, draw: (c) => <g>
    <g opacity={appear(c.frame, c.t(15.6), 12)}>
      <path d="M150 690 L180 724 L236 650" fill="none" stroke={GOLD} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      <text x={280} y={712} fill={GOLD} fontSize={50} fontWeight={700}>thưởng ngay → lặp lại</text>
    </g>
    <g opacity={appear(c.frame, c.t(17.4), 12)}>
      <path d="M156 900 L230 974 M230 900 L156 974" stroke={IVORY} strokeWidth={5} strokeLinecap="round" />
      <text x={280} y={956} fill={IVORY} fontSize={50} fontWeight={700}>khó chịu ngay → tránh</text>
    </g>
  </g>},
  {at: 18.98, draw: (c) => {const tilt = interpolate(c.frame, [c.t(20.4), c.t(21.2)], [0, -12], {...clamp, easing: ease});return <g>
    {D(c, 'M520 1240 L520 680 M420 1240 L620 1240', 0, 22, 3)}
    <g transform={`rotate(${tilt} 520 680)`}>
      {D(c, 'M220 680 L820 680', 8, 18, 3)}
      <g transform={`rotate(${-tilt} 220 680)`}><path d="M220 680 L160 820 M220 680 L280 820 M130 820 L310 820 C300 866 140 866 130 820" fill="none" stroke={GOLD} strokeWidth={2.6} /><text x={220} y={930} textAnchor="middle" fill={IVORY} fontSize={44} fontWeight={700}>BÂY GIỜ</text></g>
      <g transform={`rotate(${-tilt} 820 680)`}><path d="M820 680 L760 820 M820 680 L880 820 M730 820 L910 820 C900 866 740 866 730 820" fill="none" stroke={GOLD} strokeWidth={2.6} /><text x={820} y={930} textAnchor="middle" fill={IVORY} fontSize={44} fontWeight={700}>VỀ SAU</text></g>
    </g>
  </g>;}},
];

const make = (beats: SBeat[], highlight: RegExp): FC<ShortProps> => (p) => <kit.ShortFrame {...p} {...SERIES} beats={beats} highlight={highlight} />;
const END = 'phần bình luận|Thay đổi tí hon, hiệu quả bất ngờ';
export const ShortIce = Object.assign(make(ICE, new RegExp(`(chưa thấy gì thay đổi|một phần trăm|lãi kép|đến muộn|cục nước đá|chưa hiện ra|${END})`, 'gi')), {metadata: kit.shortMetadata});
export const ShortLoop = Object.assign(make(LOOP, new RegExp(`(thói quen xấu|bốn bước|bốn quy luật|làm ngược lại|${END})`, 'gi')), {metadata: kit.shortMetadata});
export const ShortAct = Object.assign(make(ACT, new RegExp(`(bắt tay vào làm|làm nhiều hơn nghĩ|nhóm chụp nhiều|làm thật|tần suất|${END})`, 'gi')), {metadata: kit.shortMetadata});
export const ShortSoap = Object.assign(make(SOAP, new RegExp(`(khó giữ|phần thưởng ngay lúc làm|xà phòng|thưởng ngay|hiện tại|tương lai|${END})`, 'gi')), {metadata: kit.shortMetadata});
export const {shortOf, timeline} = kit;
