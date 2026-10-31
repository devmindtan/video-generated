import type {FC} from 'react';
import {interpolate} from 'remotion';
import {GOLD, IVORY, clamp, ease} from './Intro';
import {Draw, Glow, NarratedSection, Word, appear} from './scene-kit';
import type {Beat, Ctx} from './scene-kit';

// Body sections 1–3D and the closing remark of book-hvtt-001 (image-prompts.md). Each beat names the sentence
// (0-based, from scripts/projects/book-hvtt-001-overview/lines-<segment>.txt) where its drawing starts.
export type SectionProps = {voice: string; channelLabel: string};
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

// ---- 03 Cuốn sách là gì ------------------------------------------------------------------------------
export const CuonSach: FC<SectionProps> = (p) => <NarratedSection {...p} track="03 cuốn sách" highlight={/(năm mươi chương|đạo Phật|văn hóa Việt|tâm tình)/gi} beats={[
  {at: 0, draw: (c) => <g>{book(c)}<Word x={960} y={300} size={40} text="2010" opacity={appear(c.frame, c.start + 30) * .8} /></g>},
  {at: 1, draw: (c) => <g>{book(c, 360)}{Array.from({length: 50}, (_, i) => {
    const a = (i / 50) * Math.PI * 2 - Math.PI / 2, r1 = 410, r2 = 436;
    return <line key={i} x1={960 + Math.cos(a) * r1} y1={530 + Math.sin(a) * r1 * .56} x2={960 + Math.cos(a) * r2} y2={530 + Math.sin(a) * r2 * .56} stroke={GOLD} strokeWidth={3} strokeLinecap="round" opacity={appear(c.frame, c.start + 6 + i * 1.2, 6)} />;
  })}</g>},
  {at: 4, quote: true, draw: (c) => <g>
    {/* lotus (Buddhism), house with a tiled roof (Vietnamese culture), footprints (the author's own path) flowing into the book */}
    {D(c, 'M520 360 C548 392 556 430 520 470 C484 430 492 392 520 360 Z M520 470 C480 462 452 432 452 396 C484 404 508 428 520 470 Z M520 470 C560 462 588 432 588 396 C556 404 532 428 520 470 Z M520 470 C470 476 430 460 412 432 C450 428 494 442 520 470 Z M520 470 C570 476 610 460 628 432 C590 428 546 442 520 470 Z M440 492 L600 492', 0, 34)}
    {D(c, 'M820 440 C860 410 900 398 960 396 C1020 398 1060 410 1100 440 C1110 432 1116 424 1118 414 M820 440 C810 432 804 424 802 414 M850 440 L850 500 L1070 500 L1070 440 M935 500 L935 456 L985 456 L985 500', 8, 30)}
    {[[1360, 470, 20, 1], [1440, 380, 20, -1], [1490, 280, 20, 1]].map(([x, y, a, side], k) => <g key={k} transform={`translate(${x} ${y}) rotate(${a}) scale(${side} 1)`} opacity={appear(c.frame, c.start + 16 + k * 6, 10)}>
      <path d="M0 -40 C14 -40 18 -24 16 -8 C14 6 10 14 10 26 C10 38 4 44 -4 44 C-12 44 -16 36 -14 24 C-12 10 -16 -2 -16 -16 C-16 -32 -10 -40 0 -40 Z" fill="none" stroke={GOLD} strokeWidth={2.4} />
      {[[-12, -52], [-3, -56], [6, -54], [13, -48]].map(([tx, ty], t) => <circle key={t} cx={tx} cy={ty} r={4.5} fill={GOLD} />)}
    </g>)}
    {D(c, 'M520 500 C580 600 740 650 880 668 M960 500 L960 662 M1400 500 C1340 600 1180 650 1040 668', 30, 36, 2, .75)}
    {D(c, 'M860 700 L1060 700 L1072 676 L872 676 Z M860 700 L860 726 L1060 726 L1060 700 M1072 676 L1072 702 L1060 726', 50, 24, 2.4)}
  </g>},
]} />;

// ---- 04 Sợi chỉ xuyên suốt ---------------------------------------------------------------------------
const threadY = (x: number) => 520 - Math.sin((x - 300) / 160 * Math.PI) * 40;
export const SoiChi: FC<SectionProps> = (p) => <NarratedSection {...p} track="04 sợi chỉ" highlight={/(đau và khổ|ba tầng|hạnh phúc chân thật|phải hiểu thì mới thương|bốn nhóm)/gi} beats={[
  {at: 0, draw: (c) => <g>
    {D(c, 'M' + Array.from({length: 67}, (_, i) => `${300 + i * 20} ${threadY(300 + i * 20)}`).join(' L'), 0, 50, 2.4)}
    {Array.from({length: 50}, (_, i) => {const x = 320 + i * 26, y = threadY(x);return <circle key={i} cx={x} cy={y} r={7} fill="none" stroke={GOLD} strokeWidth={2.2} opacity={appear(c.frame, c.start + 8 + i, 6)} />;})}
  </g>},
  {at: 1, quote: true, draw: (c) => <g>
    <Word x={640} y={560} size={150} text="ĐAU" opacity={appear(c.frame, c.start, 14)} />
    <Word x={1280} y={560} size={150} text="KHỔ" opacity={appear(c.frame, c.start + 10, 14)} />
    {D(c, 'M960 380 L960 640', 6, 20, 2.2, .8)}
    {At(c, 3, 'M640 300 L640 400 M610 370 L640 400 L670 370', 16, 3)}
    {At(c, 4, 'M1280 660 C1220 660 1210 720 1260 730 C1320 742 1340 680 1300 650 C1250 612 1170 640 1170 710 C1170 790 1290 800 1350 750 C1410 700 1380 600 1300 590', 40, 2.2)}
  </g>},
  {at: 5, draw: (c) => <g>
    {D(c, 'M520 760 L800 760 L800 640 L1080 640 L1080 520 L1360 520 L1360 400 L1440 400', 0, 40, 3)}
    {[6, 7, 8].map((s, k) => <g key={s}>
      <Glow x={660 + k * 280} y={[700, 580, 460][k]} r={110} opacity={interpolate(c.frame, [c.at(s), c.at(s) + 12], [0, 1], clamp)} />
      <Word x={660 + k * 280} y={[730, 610, 490][k]} size={64} text={String(k + 1)} opacity={.35 + .65 * appear(c.frame, c.at(s), 10)} />
    </g>)}
  </g>},
  {at: 9, quote: true, draw: (c) => <g>
    {D(c, heart(810, 500, 1.3), 0, 34, 2.6)}
    {D(c, heart(1110, 500, 1.3), 14, 34, 2.6)}
  </g>},
  {at: 11, draw: (c) => <g>{[0, 1, 2, 3].map((k) => {
    const x = 470 + k * 260;
    return <g key={k} opacity={appear(c.frame, c.start + k * 6, 10)}><rect x={x} y={420} width={200} height={240} rx={14} fill="none" stroke={GOLD} strokeWidth={2.2} /><Word x={x + 100} y={570} size={90} text={String(k + 1)} opacity={1} /></g>;
  })}</g>},
]} />;

// ---- 05 Nhóm 3A ----------------------------------------------------------------------------------------
const kettle = (c: Ctx) => <g>
  {D(c, 'M760 640 C740 560 780 470 960 470 C1140 470 1180 560 1160 640 Z M880 470 C880 440 1040 440 1040 470 M1160 560 C1220 560 1260 520 1290 480 M760 560 C720 560 700 600 720 640', 0, 34, 2.6)}
  {D(c, 'M700 640 L1220 640 M780 640 L760 700 M1140 640 L1160 700', 8, 24, 2.4, .9)}
  {[0, 1, 2].map((k) => <path key={k} d={`M${1290 + k * 10} ${470 - k * 6} C${1270 + k * 10} ${430 - k * 40} ${1320 + k * 10} ${400 - k * 40} ${1300 + k * 10} ${360 - k * 40}`} fill="none" stroke={IVORY} strokeWidth={2.4} strokeLinecap="round"
    opacity={interpolate(c.frame, [c.at(3) + k * 10, c.at(3) + k * 10 + 12, c.at(4), c.at(4) + 14], [0, .9, .9, 0], clamp)} />)}
</g>;
const flame = (c: Ctx, s: number) => {const k = interpolate(c.frame, [c.at(s), c.at(s) + 30], [1, .45], clamp);return <path d={`M960 ${760 - 70 * k} C${930 - 10 * k} ${740 - 30 * k} 930 760 960 780 C990 760 ${990 + 10 * k} ${740 - 30 * k} 960 ${760 - 70 * k} Z`} fill="none" stroke={GOLD} strokeWidth={2.2} />;};
export const Nhom3A: FC<SectionProps> = (p) => <NarratedSection {...p} track="05 nhóm 3A" highlight={/(giận, sợ, lo|tình thương chính là khắc tinh của cơn giận|tưởng tượng|cốc nước|quá lâu|bớt lo lắng)/gi} beats={[
  {at: 0, card: {kicker: 'NHÓM 1', title: 'Hiểu những cơn sóng trong lòng mình'}},
  {at: 1, label: 'Cơn giận', draw: (c) => <g>{kettle(c)}{flame(c, 4)}
    {/* breathing circle when we step away */}
    <circle cx={960} cy={300} r={40 + 18 * Math.sin((c.frame - c.at(4)) / 18)} fill="none" stroke={IVORY} strokeWidth={2.4} opacity={interpolate(c.frame, [c.at(4), c.at(4) + 12, c.at(6), c.at(6) + 10], [0, .85, .85, 0], clamp)} />
    <path d={heart(960, 300, .7)} fill="none" stroke={GOLD} strokeWidth={2.4} opacity={appear(c.frame, c.at(6), 14)} />
  </g>},
  {at: 7, label: 'Trí tưởng tượng', quote: true, draw: (c) => {
    const grow = interpolate(c.frame, [c.at(9), c.at(9) + 40, c.at(11), c.at(11) + 30], [.3, 1, 1, .35], clamp);
    return <g>{table(c)}
      {D(c, 'M760 700 L760 676 L900 676 L900 700', 6, 16, 2.4)}
      {D(c, 'M1180 610 m-56 0 a56 56 0 1 0 112 0 a56 56 0 1 0 -112 0 M1180 610 L1180 574 M1180 610 L1204 624 M1146 654 L1136 700 M1214 654 L1224 700', 10, 26, 2.4)}
      <g transform={`translate(830 470) scale(${grow})`} opacity={appear(c.frame, c.at(9), 12)}>
        <path d="M-180 -40 C-200 -120 -100 -170 -40 -140 C0 -200 120 -190 140 -120 C220 -120 230 -20 160 0 C170 60 60 80 20 40 C-40 80 -160 60 -140 0 C-200 0 -210 -40 -180 -40 Z" fill="none" stroke={IVORY} strokeWidth={2.2 / grow} />
      </g>
      {[0, 1, 2].map((k) => <circle key={k} cx={800 + k * 14} cy={640 - k * 40} r={6 + k * 4} fill="none" stroke={IVORY} strokeWidth={2.2} opacity={appear(c.frame, c.at(9) + k * 4, 8) * (grow > .4 ? 1 : .4)} />)}
    </g>;
  }},
  {at: 12, label: 'Lo lắng', quote: true, draw: (c) => {
    const tremble = interpolate(c.frame, [c.at(14), c.at(14) + 60], [0, 6], clamp) * Math.sin(c.frame * 1.7);
    const down = interpolate(c.frame, [c.at(16), c.at(16) + 30], [0, 1], {...clamp, easing: ease});
    const arm = 1 - interpolate(c.frame, [c.at(16), c.at(16) + 14], [0, 1], clamp);
    return <g>
      <g opacity={appear(c.frame, c.at(16) + 10, 16)}>{table(c, c.at(16) + 10 - c.start)}</g>
      <g transform={`translate(${tremble * (1 - down)} ${down * 280})`}>
        {D(c, 'M900 300 L912 420 L1008 420 L1020 300 Z M906 340 L1014 340', 6, 24, 2.6)}
      </g>
      <g opacity={arm} transform={`translate(${tremble} 0)`}>
                {/* one outline: wrist, fingers up the glass's left side, palm under it, thumb up its right side (never crossing it) */}
        {D(c, 'M936 720 L932 530 C924 500 900 488 890 462 C884 444 884 410 888 396 C890 386 902 384 904 396 L906 432 C920 438 1000 438 1012 432 L1018 404 C1020 392 1032 390 1034 402 C1038 426 1036 452 1022 474 C1010 494 1002 506 1000 530 L1004 720', 14, 34, 2.6)}
      </g>
    </g>;
  }},
]} />;

// ---- 06 Nhóm 3B ----------------------------------------------------------------------------------------
// Front view of a chair standing on y: backrest, seat, four legs.
const chair = (x: number, y: number) => `M${x - 40} ${y - 70} L${x - 40} ${y - 170} L${x + 40} ${y - 170} L${x + 40} ${y - 70} M${x - 40} ${y - 140} L${x + 40} ${y - 140} M${x - 40} ${y - 70} L${x + 40} ${y - 70} L${x + 50} ${y - 56} L${x - 50} ${y - 56} Z M${x - 50} ${y - 56} L${x - 50} ${y} M${x + 50} ${y - 56} L${x + 50} ${y} M${x - 34} ${y - 56} L${x - 34} ${y - 14} M${x + 34} ${y - 56} L${x + 34} ${y - 14}`;
export const Nhom3B: FC<SectionProps> = (p) => <NarratedSection {...p} track="06 nhóm 3B" highlight={/(tuy hai mà một|tuy một mà hai|bị bỏ rơi|củ ấu|tình lẫn nghĩa|đừng quyết định|một gang rưỡi|vị tha|thấy vậy chứ không phải vậy|có chắc không|lắng xuống)/gi} beats={[
  {at: 0, card: {kicker: 'NHÓM 2', title: 'Thương và được thương'}},
  {at: 1, label: 'Ghen tuông', draw: (c) => {
    // "khoảng trời riêng": the two circles ease apart, each over its own small chair.
    const sep = interpolate(c.frame, [c.at(4), c.at(4) + 30], [0, 1], {...clamp, easing: ease});
    return <g>
      <g transform={`translate(${-150 * sep} ${-60 * sep})`}>{D(c, 'M880 470 m-150 0 a150 150 0 1 0 300 0 a150 150 0 1 0 -300 0', 0, 30, 2.4)}</g>
      <g transform={`translate(${150 * sep} ${-60 * sep})`}>{D(c, 'M1040 470 m-150 0 a150 150 0 1 0 300 0 a150 150 0 1 0 -300 0', 12, 30, 2.4)}</g>
      <Glow x={960} y={470} r={90} opacity={appear(c.frame, c.at(2), 14) * (1 - sep)} />
      {D(c, `${chair(730, 790)} ${chair(1190, 790)} M560 790 L1360 790`, c.at(4) + 14 - c.start, 26, 2.4)}
    </g>;
  }},
  {at: 8, label: 'Nhàm chán', quote: true, draw: (c) => {
    const horns = interpolate(c.frame, [c.at(11), c.at(11) + 30], [0, 1], clamp);
    return <g>
      <path d={`M960 380 C1080 380 1160 450 1160 520 C1160 600 1080 650 960 650 C840 650 760 600 760 520 C760 450 840 380 960 380 Z`} fill="none" stroke={GOLD} strokeWidth={2.6} opacity={appear(c.frame, c.start, 16)} />
      {[-1, 1].map((k) => {const bx = 960 + k * 196, tx = 960 + k * (200 + 190 * horns), ty = 520 + 70 * horns;return <path key={k} d={`M${bx} 486 C${bx + k * 90} ${470 - 50 * horns} ${tx} ${ty - 110 * horns} ${tx} ${ty} C${tx - k * 30} ${ty - 70 * horns} ${bx + k * 60} 520 ${bx - k * 4} 556`} fill="none" stroke={GOLD} strokeWidth={2.6} strokeLinejoin="round" opacity={horns} />;})}
      <path d={`M960 650 L960 ${660 + 40 * horns}`} fill="none" stroke={GOLD} strokeWidth={2.6} opacity={horns} />
      <path d={heart(960, 530, .5)} fill="none" stroke={IVORY} strokeWidth={2} opacity={appear(c.frame, c.at(12), 14)} />
    </g>;
  }},
  {at: 14, label: 'Tha thứ', quote: true, draw: (c) => {
    const w = interpolate(c.frame, [c.at(16), c.at(16) + 40], [180, 300], clamp);
    return <g>
      <path d={`M${960 - w} 420 C${960 - w} 620 ${960 - w / 2} 680 960 680 C${960 + w / 2} 680 ${960 + w} 620 ${960 + w} 420`} fill="none" stroke={GOLD} strokeWidth={2.8} opacity={appear(c.frame, c.start, 14)} />
      <ellipse cx={960} cy={420} rx={w} ry={w * .14} fill="none" stroke={GOLD} strokeWidth={2.6} opacity={appear(c.frame, c.start + 8, 14)} />
      <circle cx={960} cy={590} r={56} fill="none" stroke={IVORY} strokeWidth={2.4} opacity={appear(c.frame, c.at(15), 12)} />
    </g>;
  }},
  {at: 20, label: 'Lắng nghe và phán xét', quote: true, draw: (c) => {
    const frameGone = interpolate(c.frame, [c.at(23), c.at(23) + 24], [1, 0], clamp), ripples = appear(c.frame, c.at(24), 20);
    return <g>
      {D(c, 'M960 330 m-70 0 a70 70 0 1 0 140 0 a70 70 0 1 0 -140 0 M820 680 C820 520 1100 520 1100 680', 0, 30, 2.4)}
      <g opacity={appear(c.frame, c.at(21), 12) * frameGone}><rect x={740} y={230} width={440} height={480} fill="none" stroke={IVORY} strokeWidth={4} /></g>
      {[0, 1, 2].map((k) => <ellipse key={k} cx={960} cy={760} rx={120 + k * 120} ry={24 + k * 18} fill="none" stroke={GOLD} strokeWidth={2.2} opacity={ripples * (1 - k * .28)} />)}
    </g>;
  }},
]} />;

// ---- 07 Nhóm 3C ----------------------------------------------------------------------------------------
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
export const Nhom3C: FC<SectionProps> = (p) => <NarratedSection {...p} track="07 nhóm 3C" highlight={/(chịu|đựng|vốc muối|dòng sông|lòng ta rộng ra|chưa thành công|thời gian nhìn lại|con bò|sợ bị chê|mùa thu|thảnh thơi|để mà đi)/gi} beats={[
  {at: 0, card: {kicker: 'NHÓM 3', title: 'Đi qua những lúc thăng trầm'}},
  {at: 1, label: 'Chịu đựng', quote: true, draw: (c) => {
    const river = appear(c.frame, c.at(5), 24);
    return <g>
      <g opacity={1 - appear(c.frame, c.at(5) - 14, 14)}>{D(c, 'M780 520 L1140 520 C1130 640 1060 700 960 700 C860 700 790 640 780 520 Z M800 560 L1120 560', 0, 30, 2.6)}{salt(c, 960, 640, c.at(3))}</g>
      {D(c, 'M300 640 C460 600 620 680 780 640 C940 600 1100 680 1260 640 C1420 600 1540 660 1620 640 M300 720 C460 680 620 760 780 720 C940 680 1100 760 1260 720 C1420 680 1540 740 1620 720', c.at(5) - c.start, 36, 2.2)}
      <g opacity={river * (1 - appear(c.frame, c.at(6), 40))}>{salt(c, 960, 674, c.at(5), 5)}</g>
    </g>;
  }},
  {at: 7, label: 'Thất bại', quote: true, draw: (c) => <g>
    {[0, 1, 2, 3, 4].map((row) => Array.from({length: 6 - row}, (_, i) => {const x = 640 + i * 110 + (row % 2) * 55, y = 700 - row * 56;return <rect key={`${row}-${i}`} x={x} y={y} width={100} height={48} rx={4} fill="none" stroke={GOLD} strokeWidth={2.2} opacity={appear(c.frame, c.start + row * 8 + i * 2, 8)} />;}))}
  </g>},
  {at: 12, label: 'Buông xả', quote: true, draw: (c) => {
    const away = interpolate(c.frame, [c.at(14), c.at(17) + 60], [0, 1], clamp);
    return <g>
      {D(c, 'M300 760 L1620 760 M360 760 L360 620 M480 760 L480 620 M600 760 L600 620 M300 660 L640 660 M300 710 L640 710', 0, 30, 2.4)}
      {Array.from({length: 12}, (_, i) => {
        const row = Math.floor(i / 6), s = (row ? 1.15 : .95) * (1 - away * .45), x = (row ? 700 : 775) + (i % 6) * 150 + away * (280 + i * 12), y = (row ? 760 : 640) - away * 90;
        return <path key={i} d={cow(x, y, s)} fill="none" stroke={GOLD} strokeWidth={2.4} strokeLinejoin="round" opacity={appear(c.frame, c.at(13) + i * 2, 8) * (1 - away * .7)} />;
      })}
    </g>;
  }},
  {at: 18, label: 'Biết đủ và thảnh thơi', quote: true, draw: (c) => {
    const road = appear(c.frame, c.at(22), 18);
    return <g>
      <g opacity={1 - road}>{table(c)}{D(c, 'M800 700 L1120 700 L1096 680 L824 680 Z M846 680 L866 540 L1054 540 L1074 680 M884 560 L1036 560 L1052 664 L868 664 Z', 4, 26, 2.4)}</g>
      {[0, 1, 2, 3].map((k) => {const fall = ((c.frame - c.start + k * 40) % 160) / 160;return <path key={k} d="M0 0 C16 -26 42 -28 48 0 C42 22 16 26 0 0 Z M0 0 L-12 10 M4 0 L40 0" transform={`translate(${[540, 680, 1240, 1380][k] + Math.sin(fall * 6 + k) * 30} ${260 + fall * 360}) rotate(${fall * 220})`} fill="none" stroke={GOLD} strokeWidth={2.4} opacity={appear(c.frame, c.start + k * 6) * interpolate(fall, [0, .1, .8, 1], [0, 1, 1, 0]) * (1 - road)} />;})}
      <g opacity={road}><path d="M700 820 C860 760 760 660 940 600 C1100 548 1040 460 1200 400 C1300 360 1340 300 1320 260" fill="none" stroke={IVORY} strokeWidth={3.4} strokeLinecap="round" strokeDasharray="2 14" /></g>
    </g>;
  }},
]} />;

// ---- 08 Nhóm 3D ----------------------------------------------------------------------------------------
// A grey heron standing in the pond, facing right: tilted body with the tail low, S-shaped neck, crest, long beak,
// legs down to the water surface (y 700) so the water lines never cross them.
const heron = (c: Ctx, from: number) => <g>
  {D(c, 'M860 520 C900 470 1010 460 1060 490 C1090 508 1084 540 1050 552 C1000 570 920 566 880 556 C850 548 800 560 780 572 C800 548 830 534 860 520 Z M900 520 C950 504 1010 504 1044 518', from - c.start, 30, 2.6)}
  {D(c, 'M1052 496 C1080 470 1076 430 1050 410 C1024 390 1030 350 1060 336 C1072 324 1092 324 1100 334 L1170 344 L1100 341 C1090 346 1074 348 1062 344 M1066 326 C1050 318 1036 320 1024 328', from - c.start + 10, 28, 2.4)}
  {D(c, 'M950 562 L946 630 L940 700 M992 562 L996 630 L1002 700', from - c.start + 18, 22, 2.4)}
</g>;
// The nylon bag full of water over its head; the dark fill hides the head behind it, the beak pokes out.
const bag = () => <g>
  <path d="M1052 292 C1040 304 1028 324 1024 354 C1018 396 1040 420 1072 422 C1106 424 1128 400 1122 362 C1118 330 1102 304 1088 292 C1076 298 1064 298 1052 292 Z" fill="#101915" stroke={IVORY} strokeWidth={2.4} strokeLinejoin="round" />
  <path d="M1026 376 C1050 366 1092 384 1123 372 M1052 292 C1040 272 1060 266 1068 288 M1088 292 C1096 272 1114 278 1100 294" fill="none" stroke={IVORY} strokeWidth={2.2} strokeLinecap="round" />
</g>;
export const Nhom3D: FC<SectionProps> = (p) => <NarratedSection {...p} track="08 nhóm 3D" highlight={/(bức tường vô hình|người bạn tốt|lành lại|trái cam|biết ơn thật|tô canh chua|tổ tiên|đặt mình vào chỗ của họ|tôn trọng|từng là một đứa trẻ)/gi} beats={[
  {at: 0, card: {kicker: 'NHÓM 4', title: 'Sống giữa mọi người'}},
  {at: 1, label: 'Cô đơn', quote: true, draw: (c) => {
    const open = appear(c.frame, c.at(3), 24);
    return <g>
      {[0, 1, 2, 3, 4, 5, 6].map((row) => Array.from({length: 9}, (_, i) => {const x = 500 + i * 100 + (row % 2) * 50, y = 300 + row * 60, inWindow = x + 92 > 850 && x < 1070 && y + 52 > 390 && y < 580;return inWindow ? null : <rect key={`${row}-${i}`} x={x} y={y} width={92} height={52} rx={3} fill="none" stroke={GOLD} strokeWidth={2.2} opacity={appear(c.frame, c.start + row * 4 + i, 8) * .9} />;}))}
      <rect x={850} y={390} width={220} height={190} fill="none" stroke={IVORY} strokeWidth={2.4} opacity={appear(c.frame, c.start + 20, 10)} />
      <Glow x={960} y={485} r={140} opacity={open} />
      <path d={`M850 390 L${850 + 110 * (1 - open)} ${390 + 14 * open} L${850 + 110 * (1 - open)} ${580 - 14 * open} L850 580 M1070 390 L${1070 - 110 * (1 - open)} ${390 + 14 * open} L${1070 - 110 * (1 - open)} ${580 - 14 * open} L1070 580`} fill="none" stroke={IVORY} strokeWidth={2} />
    </g>;
  }},
  {at: 5, label: 'Biết ơn', draw: (c) => <g>
    {/* the orange is the result of seed, water, wind and sun: each one around it, a faint line toward it */}
    {D(c, 'M960 520 m-110 0 a110 110 0 1 0 220 0 a110 110 0 1 0 -220 0 M960 410 C956 392 962 380 972 372 M966 392 C990 370 1024 376 1036 396 C1012 408 984 404 966 392 Z', 0, 30, 2.6)}
    <g opacity={appear(c.frame, c.start + 34, 20) * .8}><path d="M660 330 L852 470 M700 540 L836 530 M1290 330 L1072 470 M1300 620 L1076 556" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeDasharray="4 12" /></g>
    {D(c, 'M600 300 m-50 0 a50 50 0 1 0 100 0 a50 50 0 1 0 -100 0 M600 220 L600 200 M600 380 L600 400 M520 300 L500 300 M680 300 L700 300', 12, 26, 2.4)}
    {[0, 1, 2, 3].map((k) => <path key={k} d={`M${1300 + k * 40} ${260 + (k % 2) * 30} l-14 40`} stroke={IVORY} strokeWidth={2.4} strokeLinecap="round" opacity={appear(c.frame, c.start + 16 + k * 3, 8)} />)}
    {D(c, 'M500 520 C560 500 620 520 660 500 C690 484 680 456 656 462 M520 570 C590 556 650 574 700 556', 18, 26, 2.4, .9)}
    {D(c, 'M1300 640 C1290 620 1300 600 1320 604 C1336 610 1334 636 1316 646 C1308 650 1300 648 1300 640 Z M1316 604 C1314 580 1322 564 1340 556 M1330 570 C1350 560 1370 566 1374 580 C1356 586 1338 582 1330 570 Z', 22, 26, 2.4)}
  </g>},
  {at: 8, label: 'Ta làm từ những thứ không phải ta', quote: true, draw: (c) => <g>
    {table(c)}
    {D(c, 'M760 560 L1160 560 C1150 650 1080 700 960 700 C840 700 770 650 760 560 Z M780 600 L1140 600', 4, 30, 2.6)}
    {D(c, 'M1120 560 L1260 420 M1240 400 C1270 380 1300 400 1290 430 C1280 450 1250 450 1240 430 Z', 12, 24, 2.2)}
    {[0, 1, 2].map((k) => <path key={k} d={`M${880 + k * 80} 540 C${860 + k * 80 + Math.sin((c.frame + k * 20) / 18) * 12} 500 ${910 + k * 80 - Math.sin((c.frame + k * 20) / 22) * 12} 470 ${885 + k * 80 + Math.sin((c.frame + k * 20) / 15) * 10} 430`} fill="none" stroke={IVORY} strokeWidth={2.4} strokeLinecap="round" opacity={appear(c.frame, c.start + 20 + k * 6, 12) * .85} />)}
  </g>},
  {at: 13, label: 'Nâng đỡ', quote: true, draw: (c) => {
    // 14 bag over its head · 15 a girl splashes in, the heron flies off · 16 the author comes slowly, it stays, the bag comes off
    const fly = interpolate(c.frame, [c.at(15) + 12, c.at(15) + 42], [0, 1], {...clamp, easing: ease});
    const back = appear(c.frame, c.at(16), 24), away = fly * (1 - back);
    const freed = appear(c.frame, c.at(16) + 50, 30);
    const splash = interpolate(c.frame, [c.at(15), c.at(15) + 8, c.at(16) - 12, c.at(16)], [0, 1, 1, 0], clamp);
    return <g>
      {D(c, 'M300 700 C500 690 700 712 960 700 C1220 688 1420 712 1620 700 M380 750 C560 738 760 762 960 750 C1160 738 1360 762 1540 750', 0, 30, 2.4, .85)}
      <g opacity={splash}><path d="M560 690 L530 640 M590 686 L590 626 M620 690 L650 640 M480 716 C520 704 560 728 600 716 C640 704 680 728 720 716" fill="none" stroke={IVORY} strokeWidth={2.4} strokeLinecap="round" /></g>
      {[0, 1, 2].map((k) => {const t = interpolate(c.frame, [c.at(16) + k * 20, c.at(16) + k * 20 + 70], [0, 1], clamp);return <ellipse key={k} cx={640} cy={724} rx={40 + t * 160} ry={8 + t * 22} fill="none" stroke={GOLD} strokeWidth={2.2} opacity={t > 0 && t < 1 ? (1 - t) * .9 : 0} />;})}
      <Glow x={1000} y={460} r={180} opacity={freed * .8} />
      <g transform={`translate(${away * 260} ${away * -200})`} opacity={1 - away}>
        {heron(c, c.start + 6)}
        <path d="M940 510 C900 440 920 380 980 350 C990 410 1010 460 1030 500" fill="none" stroke={GOLD} strokeWidth={2.6} strokeLinejoin="round" opacity={fly * (1 - back)} />
        <g opacity={appear(c.frame, c.start + 30, 10) * (1 - freed)} transform={`translate(${freed * -140} ${freed * -150})`}>{bag()}</g>
      </g>
    </g>;
  }},
]} />;

// ---- 09 Nhận xét chung -----------------------------------------------------------------------------------
export const NhanXet: FC<SectionProps> = (p) => <NarratedSection {...p} track="09 nhận xét chung" highlight={/(cuốn sách hay|đọc qua)/gi} beats={[
  {at: 0, draw: (c) => <g>
    <Glow x={960} y={520} r={320} opacity={appear(c.frame, c.start + 10, 30)} />
    {D(c, 'M640 640 L1280 640 L1300 600 L660 600 Z M640 640 L640 690 L1280 690 L1280 640 M1300 600 L1300 650 L1280 690', 0, 34, 2.6)}
    {D(c, 'M680 620 L1260 620', 16, 20, 2, .75)}
    {[0, 1, 2, 3, 4].map((k) => {const a = -Math.PI / 2 + (k - 2) * .35;return <path key={k} d={`M${960 + Math.cos(a) * 120} ${560 + Math.sin(a) * 120} L${960 + Math.cos(a) * 260} ${560 + Math.sin(a) * 260}`} stroke={GOLD} strokeWidth={2.6} strokeLinecap="round" opacity={appear(c.frame, c.start + 24 + k * 4, 12) * .9} />;})}
  </g>},
]} />;
