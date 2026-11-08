import type {ReactNode} from 'react';
import {interpolate} from 'remotion';
import {GOLD, IVORY, clamp, ease} from '../book-hvtt-001-overview/Intro';
import {Draw, Figure, Glow, Word, appear, section, takesOf, within} from '../book-hvtt-001-overview/scene-kit';
import type {Ctx} from '../book-hvtt-001-overview/scene-kit';
import takes from './body-takes.json';

// Body parts of episode 3 (Đắc nhân tâm) on the series scene-kit (docs/projects/book-dnt-001-overview/image-prompts.md).
// Each beat names the sentence (0-based, scripts/projects/book-dnt-001-overview/lines-<segment>.txt) where its drawing
// starts. Series rules: one complete drawing per idea that grows inside its scene, nothing drawn over a figure, no
// weapons or fighting, text ≥ 34 px, no book line under quotes.
const options = {takes: takesOf(takes), quoteSource: ''};
const D = (c: Ctx, d: string, delay = 0, len = 28, width = 2.4, opacity = 1) => <Draw key={`${d}${delay}`} d={d} frame={c.frame} from={c.start + delay} to={c.start + delay + len} width={width} opacity={opacity} />;
// Same stroke, but from an absolute frame (a moment inside a later sentence of the same scene).
const DA = (c: Ctx, d: string, from: number, len = 24, width = 2.4, opacity = 1) => <Draw key={`${d}${from}`} d={d} frame={c.frame} from={from} to={from + len} width={width} opacity={opacity} />;

// ---- shared drawings of episode 3 -------------------------------------------------------------------------
// A closed envelope (flap drawn as a V), centred on (x, y).
const envelope = (x: number, y: number, w = 300, h = 190) => `M${x - w / 2} ${y - h / 2} L${x + w / 2} ${y - h / 2} L${x + w / 2} ${y + h / 2} L${x - w / 2} ${y + h / 2} Z M${x - w / 2} ${y - h / 2} L${x} ${y + h * .12} L${x + w / 2} ${y - h / 2}`;
// A sheet of writing paper, top-left at (x, y).
const sheet = (x: number, y: number, w = 260, h = 330) => `M${x} ${y} L${x + w} ${y} L${x + w} ${y + h} L${x} ${y + h} Z`;
// A desk top with two legs, top surface on y.
const desk = (x1: number, x2: number, y: number) => `M${x1} ${y} L${x2} ${y} M${x1 + 30} ${y} L${x1 + 30} ${y + 170} M${x2 - 30} ${y} L${x2 - 30} ${y + 170} M${x1} ${y + 18} L${x2} ${y + 18}`;
// A quill pen lying from (x, y) towards the upper right.
const quill = (x: number, y: number) => `M${x} ${y} L${x + 150} ${y - 60} M${x + 150} ${y - 60} C${x + 190} ${y - 90} ${x + 230} ${y - 96} ${x + 250} ${y - 92} C${x + 230} ${y - 70} ${x + 196} ${y - 58} ${x + 150} ${y - 60} M${x} ${y} L${x - 10} ${y + 6}`;
// A tall stovepipe hat sitting on a Figure's head (feet at x, y; s as the Figure's scale).
const hat = (x: number, y: number, s = 1) => {const top = y - 306 * s;return `M${x - 34 * s} ${top} L${x + 34 * s} ${top} M${x - 22 * s} ${top} L${x - 20 * s} ${top - 64 * s} L${x + 20 * s} ${top - 64 * s} L${x + 22 * s} ${top}`;};

// 0b Mở chuyện: Lincoln's letter that was never sent (image-prompts.md 0b). Every drawing appears on the word it shows
// (moments are the phrase's position in its sentence; user review p1: animation a little off and not meaningful).
// 0      an envelope on a desk, flap not sealed
// 1–2    young Lincoln (stovepipe hat) holding a newspaper at "chế giễu / viết báo"; the politician appears at "chính
//        khách", an angry spark at "thách đấu kiếm", a third person steps in between at "được can kịp" (no swords);
//        sentence 2: the others leave, the paper fades, his arm comes down
// 3      Lincoln (named) sends an order to Meade (named, by his flag); Meade's attack arrow starts and stops as a dotted
//        line at "chần chừ", with an hourglass (the chance slipping by)
// 4–6    a desk: the letter written in heavy lines; slid to the edge with the pen down; then a box of his papers in the
//        middle of the frame, the letter rising above it at "tìm thấy"
// 7      "PHỎNG ĐOÁN" under a question mark (the author's guess); the letter flies to Meade at "gửi lá thư đi", Meade
//        raises his arm and a speech bubble flies back at "bào chữa"
// 8–9    an open book with bookmark 1 at "nguyên tắc đầu tiên", the principle in two lines on the words; then the text
//        is gone before two figures appear; at "lời chê trách" the left one points and a question mark grows between
const at = (c: Ctx, sentence: number, share: number) => within(c, sentence, share);
const Label = ({x, y, text, o}: {x: number; y: number; text: string; o: number}) => <Word x={x} y={y} size={36} text={text} opacity={o * .9} />;
const hourglass = (x: number, y: number) => `M${x - 40} ${y - 70} L${x + 40} ${y - 70} M${x - 40} ${y + 70} L${x + 40} ${y + 70} M${x - 32} ${y - 70} C${x - 32} ${y - 20} ${x - 5} ${y - 8} ${x - 5} ${y} C${x - 5} ${y + 8} ${x - 32} ${y + 20} ${x - 32} ${y + 70} M${x + 32} ${y - 70} C${x + 32} ${y - 20} ${x + 5} ${y - 8} ${x + 5} ${y} C${x + 5} ${y + 8} ${x + 32} ${y + 20} ${x + 32} ${y + 70}`;
const openBook = (x: number, y: number, s = 1) => `M${x} ${y + 100 * s} C${x - 70 * s} ${y + 70 * s} ${x - 160 * s} ${y + 68 * s} ${x - 230 * s} ${y + 86 * s} L${x - 230 * s} ${y} C${x - 160 * s} ${y - 18 * s} ${x - 70 * s} ${y - 16 * s} ${x} ${y + 14 * s} C${x + 70 * s} ${y - 16 * s} ${x + 160 * s} ${y - 18 * s} ${x + 230 * s} ${y} L${x + 230 * s} ${y + 86 * s} C${x + 160 * s} ${y + 68 * s} ${x + 70 * s} ${y + 70 * s} ${x} ${y + 100 * s} Z M${x} ${y + 14 * s} L${x} ${y + 100 * s}`;
export const MoChuyen = section('02 mở chuyện', /(lá thư chưa bao giờ được gửi đi|chế giễu|thách đấu kiếm|thôi hẳn chuyện chỉ trích|tướng Meade|trách móc rất nặng lời|không gửi|tìm thấy|đoán|hả giận|bào chữa|nguyên tắc đầu tiên|không chỉ trích, oán trách hay than phiền|lời chê trách)/gi, [
  {at: 0, draw: (c) => <g>
    {D(c, desk(560, 1360, 700), 0, 30, 2.4, .85)}
    {D(c, envelope(960, 600), 10, 30, 2.6)}
    <Glow x={960} y={600} r={200} opacity={appear(c.frame, c.start + 30, 24) * .45} />
  </g>},
  {at: 1, draw: (c) => {
    const paper = appear(c.frame, at(c, 1, .21), 14), headline = appear(c.frame, at(c, 1, .4), 16);
    const leave = appear(c.frame, c.at(2), 18), drop = appear(c.frame, at(c, 2, .4), 18);
    const rival = appear(c.frame, at(c, 1, .51), 16) * (1 - leave), angry = appear(c.frame, at(c, 1, .7), 10) * (1 - appear(c.frame, at(c, 1, .79), 8));
    const third = appear(c.frame, at(c, 1, .84), 14) * (1 - leave);
    const holding = paper * (1 - drop);
    return <g>
      {/* Lincoln: arm reaches while he holds the paper, comes down once it is gone. */}
      <g opacity={appear(c.frame, c.start + 4, 14) * (holding > .5 ? 0 : 1)}><Figure frame={c.frame} from={c.start + 4} x={560} y={800} s={1} /></g>
      <g opacity={holding > .5 ? 1 : 0}><Figure frame={c.frame} from={c.start - 30} x={560} y={800} s={1} arm="reach" /></g>
      {D(c, hat(560, 800), 14, 18, 2.6)}
      {/* The newspaper in his hand: frame first ("chế giễu"), then the caricature and headline lines ("viết báo"). */}
      <g opacity={holding}>
        <path d="M672 520 L812 520 L812 620 L672 620 Z" fill="none" stroke={IVORY} strokeWidth={2.4} strokeLinejoin="round" />
        <g opacity={headline}>
          <path d="M686 542 L798 542 M686 562 L760 562" fill="none" stroke={IVORY} strokeWidth={3} strokeLinecap="round" />
          <circle cx={710} cy={595} r={12} fill="none" stroke={GOLD} strokeWidth={2.2} />
          <path d="M704 592 L706 592 M714 592 L716 592 M702 602 C708 598 712 598 718 604 M732 588 L794 588 M732 604 L780 604" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" />
        </g>
      </g>
      <g opacity={rival}><Figure frame={c.frame} from={at(c, 1, .51)} x={1360} y={800} s={1} facing={-1} /></g>
      {/* "thách đấu kiếm": an angry spark between the two (no weapons). */}
      <path d="M1000 470 L960 520 L1000 530 L955 590" fill="none" stroke={GOLD} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" opacity={angry} />
      {/* "được can kịp": a third person steps in between them. */}
      <g opacity={third}><Figure frame={c.frame} from={at(c, 1, .84)} x={980} y={800} s={.9} arm="raise" color={IVORY} /></g>
      <Glow x={560} y={560} r={180} opacity={drop * .45} />
    </g>;
  }},
  {at: 3, draw: (c) => {
    const order = interpolate(c.frame, [at(c, 3, .3), at(c, 3, .46)], [0, 1], {...clamp, easing: ease});
    const attack = interpolate(c.frame, [at(c, 3, .47), at(c, 3, .66)], [0, 1], {...clamp, easing: ease});
    const stall = appear(c.frame, at(c, 3, .83), 14), late = appear(c.frame, at(c, 3, .83), 14);
    return <g>
      <g opacity={appear(c.frame, c.start + 4, 14)}><Figure frame={c.frame} from={c.start + 4} x={480} y={800} s={.95} arm="point" />{D(c, hat(480, 800, .95), 14, 16, 2.6)}</g>
      <Label x={480} y={380} text="LINCOLN" o={appear(c.frame, c.start + 16, 12)} />
      <g opacity={appear(c.frame, at(c, 3, .28), 14)}><Figure frame={c.frame} from={at(c, 3, .28)} x={1180} y={800} s={.95} facing={-1} /></g>
      <Label x={1180} y={440} text="MEADE" o={appear(c.frame, at(c, 3, .3), 12)} />
      <path d="M1290 800 L1290 600 M1290 600 L1390 626 L1290 652" fill="none" stroke={GOLD} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" opacity={appear(c.frame, at(c, 3, .3), 14)} />
      {/* The order travels from Lincoln to Meade ("ra lệnh"). */}
      <g opacity={appear(c.frame, at(c, 3, .3), 8) * (1 - appear(c.frame, at(c, 3, .48), 8))} transform={`translate(${620 + order * 420} 520)`}>
        <path d={envelope(0, 0, 90, 58)} fill="none" stroke={IVORY} strokeWidth={2.4} strokeLinejoin="round" />
      </g>
      {/* The attack arrow starts ("tấn công") and stops as a dotted line ("chần chừ"). */}
      <path d={`M1420 700 L${1420 + attack * 200} 700`} fill="none" stroke={GOLD} strokeWidth={3} strokeLinecap="round" strokeDasharray={stall > .5 ? '6 12' : undefined} opacity={attack > 0 ? 1 - stall * .5 : 0} />
      <path d={hourglass(1560, 520)} fill="none" stroke={IVORY} strokeWidth={2.4} strokeLinecap="round" opacity={late} />
      <path d="M1534 584 L1586 584 L1560 560 Z" fill={GOLD} opacity={late * .8} />
    </g>;
  }},
  {at: 4, draw: (c) => {
    const aside = interpolate(c.frame, [within(c, 5, .1), within(c, 5, .6)], [0, 1], {...clamp, easing: ease});
    const drawer = appear(c.frame, c.at(6), 20);
    // Heavy lines of the angry letter, written one after another during sentence 4 (no cross-out: it was not cancelled).
    const lines = [0, 1, 2, 3, 4, 5].map((k) => `M${850} ${340 + k * 40} L${1030 - (k % 3) * 30} ${340 + k * 40}`);
    return <g>
      <g opacity={1 - drawer}>{D(c, desk(520, 1400, 640), 0, 26, 2.4, .85)}</g>
      <g transform={`translate(${aside * 300} 0)`} opacity={1 - drawer}>
        {D(c, sheet(830, 300, 260, 320), 6, 22, 2.4)}
        {lines.map((d, k) => DA(c, d, within(c, 4, .15 + k * .12), 10, 3.4, .95))}
      </g>
      <g opacity={appear(c.frame, within(c, 5, .45), 14) * (1 - drawer)}><path d={quill(600, 626)} fill="none" stroke={IVORY} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /></g>
      {/* "Mãi đến khi Lincoln qua đời…": the desk gives way to a box of his papers, drawn upright in the middle (review p2:
          the flat drawer looked squeezed); at "tìm thấy" the letter rises above it and glows. */}
      <g opacity={drawer}>
        <path d="M660 540 L1260 540 L1260 790 L660 790 Z M660 540 L700 500 M1260 540 L1220 500 M860 630 L1060 630 L1060 690 L860 690 Z" fill="none" stroke={GOLD} strokeWidth={2.6} strokeLinejoin="round" />
        {[[720, 440], [870, 462], [1010, 432], [1140, 456]].map(([x, top], k) => <path key={k} d={`M${x} 540 L${x} ${top} L${x + 110} ${top} L${x + 110} 540 M${x + 18} ${top + 24} L${x + 88} ${top + 24} M${x + 18} ${top + 46} L${x + 70} ${top + 46}`} fill="none" stroke={IVORY} strokeWidth={2.2} strokeLinejoin="round" opacity={appear(c.frame, c.at(6) + 6 + k * 4, 12) * .85} />)}
      </g>
      <g opacity={appear(c.frame, within(c, 6, .53), 14)} transform={`translate(0 ${(1 - appear(c.frame, within(c, 6, .53), 24)) * 30})`}>
        <path d={envelope(960, 300, 240, 150)} fill="none" stroke={IVORY} strokeWidth={2.6} strokeLinejoin="round" />
        <Glow x={960} y={300} r={200} opacity={.55} />
      </g>
    </g>;
  }},
  {at: 7, draw: (c) => {
    const fly = interpolate(c.frame, [at(c, 7, .27), at(c, 7, .45)], [0, 1], {...clamp, easing: ease});
    const guard = appear(c.frame, at(c, 7, .59), 10);
    const back = interpolate(c.frame, [at(c, 7, .71), at(c, 7, .86)], [0, 1], {...clamp, easing: ease});
    return <g>
      <g opacity={appear(c.frame, c.start + 4, 14)}><Figure frame={c.frame} from={c.start + 4} x={520} y={800} s={.95} />{D(c, hat(520, 800, .95), 14, 16, 2.6)}</g>
      <Label x={520} y={380} text="LINCOLN" o={appear(c.frame, c.start + 14, 12)} />
      <g opacity={appear(c.frame, c.start + 8, 14) * (1 - guard)}><Figure frame={c.frame} from={c.start + 8} x={1400} y={800} s={.95} facing={-1} /></g>
      <g opacity={guard}><Figure frame={c.frame} from={c.start - 30} x={1400} y={800} s={.95} facing={-1} arm="raise" /></g>
      <Label x={1400} y={440} text="MEADE" o={appear(c.frame, c.start + 16, 12)} />
      {/* The author's guess, marked as one. */}
      <g opacity={appear(c.frame, at(c, 7, .03), 12)}>
        <path d="M940 210 C940 176 990 168 990 202 C990 228 960 228 960 252 M960 276 L960 280" fill="none" stroke={IVORY} strokeWidth={2.4} strokeLinecap="round" />
        <Word x={965} y={340} size={36} text="PHỎNG ĐOÁN" opacity={.85} />
      </g>
      {/* "gửi lá thư đi": the letter flies to Meade. */}
      <g opacity={appear(c.frame, at(c, 7, .27), 8) * (1 - appear(c.frame, at(c, 7, .48), 10))} transform={`translate(${650 + fly * 600} 560)`}>
        <path d={envelope(0, 0, 100, 64)} fill="none" stroke={IVORY} strokeWidth={2.4} strokeLinejoin="round" />
      </g>
      <Glow x={520} y={580} r={150} opacity={appear(c.frame, at(c, 7, .46), 14) * (1 - appear(c.frame, at(c, 7, .6), 14)) * .6} />
      {/* "bào chữa": a speech bubble with "!" flies back from Meade. */}
      <g opacity={appear(c.frame, at(c, 7, .71), 8) * (1 - appear(c.frame, at(c, 7, .92), 12))} transform={`translate(${1250 - back * 560} 520)`}>
        <path d="M-60 -36 L60 -36 L60 28 L-10 28 L-30 48 L-26 28 L-60 28 Z" fill="none" stroke={GOLD} strokeWidth={2.6} strokeLinejoin="round" />
        <path d="M0 -24 L0 4 M0 14 L0 16" fill="none" stroke={GOLD} strokeWidth={4} strokeLinecap="round" />
      </g>
    </g>;
  }},
  {at: 8, draw: (c) => {
    const textOut = 1 - appear(c.frame, c.at(9), 10), figures = appear(c.frame, c.at(9) + 10, 14);
    const point = appear(c.frame, at(c, 9, .65), 10);
    return <g>
      <g opacity={textOut}>
        <g opacity={appear(c.frame, at(c, 8, .27), 16)}>
          <path d={openBook(960, 640, 1)} fill="none" stroke={GOLD} strokeWidth={2.6} strokeLinejoin="round" />
          <path d="M1060 628 L1060 560 L1100 560 L1100 626" fill="none" stroke={GOLD} strokeWidth={2.4} strokeLinejoin="round" />
          <Word x={1080} y={600} size={34} text="1" opacity={1} />
        </g>
        <Word x={960} y={420} size={64} text="KHÔNG CHỈ TRÍCH," opacity={appear(c.frame, at(c, 8, .56), 10)} />
        <Word x={960} y={510} size={64} text="OÁN TRÁCH HAY THAN PHIỀN" opacity={appear(c.frame, at(c, 8, .71), 10)} />
      </g>
      <g opacity={figures}>
        <g opacity={1 - point}><Figure frame={c.frame} from={c.at(9) + 10} x={620} y={800} s={.95} /></g>
        <g opacity={point}><Figure frame={c.frame} from={c.at(9) - 30} x={620} y={800} s={.95} arm="point" /></g>
        <Figure frame={c.frame} from={c.at(9) + 14} x={1300} y={800} s={.95} facing={-1} />
        <g opacity={appear(c.frame, at(c, 9, .74), 16)}>
          <path d="M920 340 C920 270 1020 260 1020 330 C1020 380 960 390 960 450 M960 510 L960 516" fill="none" stroke={GOLD} strokeWidth={4} strokeLinecap="round" />
        </g>
        <Glow x={960} y={440} r={190} opacity={appear(c.frame, at(c, 9, .8), 24) * .5} />
      </g>
    </g>;
  }},
], options);

// ---- body parts (image-prompts.md 1–5). Moments are the phrase's position in its sentence (lines-<segment>.txt). --------
const card = (kicker: string, title: string, draw?: (c: Ctx) => ReactNode) => ({card: {kicker, title}, draw});
// A hard hat on a Figure's head (feet at x, y; s its scale).
const hardHat = (x: number, y: number, s = 1) => `M${x - 30 * s} ${y - 300 * s} C${x - 30 * s} ${y - 344 * s} ${x + 30 * s} ${y - 344 * s} ${x + 30 * s} ${y - 300 * s} M${x - 40 * s} ${y - 300 * s} L${x + 40 * s} ${y - 300 * s}`;
const heart = (x: number, y: number, s = 1) => `M${x} ${y + 34 * s} C${x - 70 * s} ${y - 10 * s} ${x - 36 * s} ${y - 66 * s} ${x} ${y - 30 * s} C${x + 36 * s} ${y - 66 * s} ${x + 70 * s} ${y - 10 * s} ${x} ${y + 34 * s} Z`;
const bubble = (x: number, y: number, w: number, h: number) => `M${x - w / 2} ${y - h / 2} L${x + w / 2} ${y - h / 2} L${x + w / 2} ${y + h / 2} L${x - w / 6} ${y + h / 2} L${x - w / 3} ${y + h / 2 + 26} L${x - w / 3} ${y + h / 2} L${x - w / 2} ${y + h / 2} Z`;
const star = (x: number, y: number, r = 40) => Array.from({length: 10}, (_, k) => {const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * .45 : r;return `${k ? 'L' : 'M'}${(x + Math.cos(a) * rr).toFixed(1)} ${(y + Math.sin(a) * rr).toFixed(1)}`;}).join(' ') + ' Z';
const closedBook = (x: number, y: number, w = 260, h = 340) => `M${x - w / 2} ${y - h / 2} L${x + w / 2} ${y - h / 2} L${x + w / 2} ${y + h / 2} L${x - w / 2} ${y + h / 2} Z M${x - w / 2 + 26} ${y - h / 2} L${x - w / 2 + 26} ${y + h / 2}`;
const ear = (x: number, y: number) => `M${x} ${y} C${x + 46} ${y - 4} ${x + 58} ${y + 46} ${x + 34} ${y + 76} C${x + 20} ${y + 96} ${x + 24} ${y + 116} ${x} ${y + 116} M${x + 10} ${y + 30} C${x + 30} ${y + 30} ${x + 30} ${y + 60} ${x + 14} ${y + 66}`;
const coin = (x: number, y: number) => `M${x - 46} ${y} a46 46 0 1 0 92 0 a46 46 0 1 0 -92 0 M${x - 30} ${y} a30 30 0 1 0 60 0 a30 30 0 1 0 -60 0`;
const Ink = ({d, o = 1, w = 2.4, color = GOLD}: {d: string; o?: number; w?: number; color?: string}) => <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={o} />;
const two = (c: Ctx, from: number, gap = 4) => <g><Figure frame={c.frame} from={from} x={600} y={800} s={.95} /><Figure frame={c.frame} from={from + gap} x={1320} y={800} s={.95} facing={-1} /></g>;

// 1 Cuốn sách là gì (lines-03-cuon-sach.txt).
// 0–1 a classroom: teacher at a lectern, three learners seated; "1912" at its word; two learners turn to each other at
//     "cách cư xử"
// 2–3 lecture notes become a book with "1936" at its word; a new ribbon at "cập nhật về sau"
// 4   an open book, four tabs 3 · 6 · 12 · 9 at "bốn phần", small speech bubbles of real people's stories
// 5–7 a question mark; scales with "SỐNG TỬ TẾ" / "LẤY LÒNG" tilting on the words, then level for "các bạn tự đánh giá"
export const CuonSach = section('03 cuốn sách', /(một lớp học|1912|nói trước đám đông|cách cư xử|bài giảng|1936|ba mươi nguyên tắc|bốn phần|người thật|gây tranh cãi|cẩm nang|lấy lòng|tự đánh giá)/gi, [
  {at: 0, draw: (c) => {const talk = appear(c.frame, at(c, 1, .82), 14);return <g>
    {D(c, 'M420 800 L420 600 L560 600 L560 800 M400 600 L580 600', 0, 24, 2.4)}
    <Figure frame={c.frame} from={c.start + 6} x={490} y={600} s={.75} arm="raise" />
    {[0, 1, 2].map((k) => <g key={k} opacity={appear(c.frame, c.start + 14 + k * 4, 12)}><Figure frame={c.frame} from={c.start + 14 + k * 4} x={980 + k * 230} y={800} s={.75} facing={k === 2 && talk > .5 ? -1 : 1} pose="sit" /></g>)}
    <Word x={1420} y={320} size={56} text="1912" opacity={appear(c.frame, at(c, 1, .14), 12)} />
    <g opacity={talk}><Ink d={bubble(1290, 430, 120, 64)} color={IVORY} /><Ink d="M1262 430 L1270 430 M1288 430 L1296 430 M1314 430 L1322 430" w={4} color={IVORY} /></g>
  </g>;}},
  {at: 2, draw: (c) => {const book = appear(c.frame, at(c, 2, .8), 16), ribbon = appear(c.frame, c.at(3) + 6, 14);return <g>
    <g opacity={1 - book}>{[0, 1, 2].map((k) => <g key={k} opacity={appear(c.frame, at(c, 2, .3 + k * .08), 10)}><Ink d={sheet(820 + k * 40, 300 + k * 30, 240, 320)} color={IVORY} /><Ink d={`M${850 + k * 40} ${360 + k * 30} L${1020 + k * 40} ${360 + k * 30} M${850 + k * 40} ${400 + k * 30} L${990 + k * 40} ${400 + k * 30}`} color={IVORY} o={.8} /></g>)}</g>
    <g opacity={book}>
      <Ink d={closedBook(960, 520)} w={2.8} />
      <Word x={973} y={470} size={44} text="ĐẮC NHÂN TÂM" opacity={.9} />
      <Word x={973} y={560} size={52} text="1936" opacity={1} />
      <Ink d="M1040 350 L1040 300 L1070 300 L1070 350" o={ribbon} w={2.6} />
    </g>
  </g>;}},
  {at: 4, draw: (c) => <g>
    {D(c, openBook(960, 600, 1.5), 0, 30, 2.6)}
    <defs><clipPath id="dnt-above-pages"><path d="M0 0 L1920 0 L1920 596 L1305 596 C1200 572 1065 575 960 621 C855 575 720 572 615 596 L0 596 Z" /></clipPath></defs>
    <g clipPath="url(#dnt-above-pages)">{['3', '6', '12', '9'].map((n, k) => {const up = appear(c.frame, at(c, 4, .22 + k * .05), 14) * 110, x = 740 + k * 150;return <g key={n}>
      <Ink d={`M${x} 620 L${x} ${620 - up} L${x + 80} ${620 - up} L${x + 80} 620`} w={2.6} />
      <Word x={x + 40} y={620 - up + 52} size={38} text={n} opacity={appear(c.frame, at(c, 4, .26 + k * .05), 10)} />
    </g>;})}</g>
    {[0, 1, 2].map((k) => <g key={k} opacity={appear(c.frame, at(c, 4, .82 + k * .04), 10) * .9}><Ink d={bubble(560 + k * 400, 300 - (k % 2) * 30, 150, 80)} color={IVORY} /></g>)}
  </g>},
  {at: 5, draw: (c) => {const scale = appear(c.frame, c.at(6), 16), left = appear(c.frame, at(c, 6, .16), 16), right = appear(c.frame, at(c, 6, .7), 16), level = appear(c.frame, c.at(7), 24);
    const tilt = (left * -10 + right * 20) * (1 - level) - (right > 0 ? 0 : 0);
    return <g>
      <g opacity={1 - scale}><path d="M900 320 C900 250 1020 240 1020 320 C1020 380 960 390 960 450 M960 520 L960 528" fill="none" stroke={GOLD} strokeWidth={4} strokeLinecap="round" /></g>
      <g opacity={scale}>
        <Ink d="M960 800 L960 380 M900 800 L1020 800" w={2.8} />
        <g transform={`rotate(${tilt} 960 380)`}>
          <Ink d="M620 380 L1300 380" w={2.8} />
          <Ink d="M620 380 L560 520 M620 380 L680 520 M520 520 L720 520 M1300 380 L1240 520 M1300 380 L1360 520 M1200 520 L1400 520" w={2.2} />
          <g transform={`rotate(${-tilt} 620 560)`}><Word x={620} y={590} size={36} text="SỐNG TỬ TẾ" opacity={left} /></g>
          <g transform={`rotate(${-tilt} 1300 560)`}><Word x={1300} y={590} size={36} text="LẤY LÒNG" opacity={right} /></g>
        </g>
      </g>
    </g>;}},
], options);

// 2 Sợi chỉ xuyên suốt (lines-04-soi-chi.txt).
// 0   two people; a star of worth over the right one at "có giá trị"; the left one points at "bị chê trách" and the
//     right one raises a guard at "bào chữa"
// 1–2 ice cream and an apple at their word; a fishing rod, the worm on the hook at "con giun", a fish swims to it
// 3   two people: the right one's thought bubble lights at "điều họ muốn", the left one's dims at "điều mình muốn"
// 4–5 a heart between them at "sự chân thành"; then a figure with two lines: one from the chest ("TẤM LÒNG"), one
//     from the mouth ("CỬA MIỆNG"), each on its word
// 6–7 the left figure steps back half a step and the right one is lit at "người đối diện"
export const SoiChi = section('04 sợi chỉ', /(ba mươi nguyên tắc|có giá trị|bị chê trách|bào chữa|chuyện đi câu|kem và trái cây|con giun|điều họ muốn|sự chân thành|lời khen thật lòng|lời nịnh|tấm lòng|cửa miệng|cái tôi|người đối diện)/gi, [
  {at: 0, draw: (c) => {const point = appear(c.frame, at(c, 0, .64), 10), guard = appear(c.frame, at(c, 0, .9), 10);return <g>
    <g opacity={1 - point}><Figure frame={c.frame} from={c.start + 4} x={600} y={800} s={.95} /></g>
    <g opacity={point}><Figure frame={c.frame} from={c.start - 30} x={600} y={800} s={.95} arm="point" /></g>
    <g opacity={1 - guard}><Figure frame={c.frame} from={c.start + 8} x={1320} y={800} s={.95} facing={-1} /></g>
    <g opacity={guard}><Figure frame={c.frame} from={c.start - 30} x={1320} y={800} s={.95} facing={-1} arm="raise" /></g>
    <Ink d={star(1320, 400, 34)} o={appear(c.frame, at(c, 0, .55), 12)} />
  </g>;}},
  {at: 1, draw: (c) => {const swim = interpolate(c.frame, [at(c, 2, .86), at(c, 2, 1)], [0, 1], {...clamp, easing: ease});return <g>
    <g opacity={appear(c.frame, at(c, 2, .12), 12)}>
      <Ink d="M460 520 L500 640 L540 520 Z M460 520 C460 470 540 470 540 520" color={IVORY} />
      <Ink d="M640 560 C600 520 600 620 660 640 C720 620 720 520 680 560 C670 548 650 548 640 560 Z M660 552 L668 528" color={IVORY} />
    </g>
    {D(c, 'M820 800 L1200 360 M1200 360 L1200 640', 0, 30, 2.6)}
    {D(c, 'M760 700 C900 690 1300 690 1560 700', 6, 26, 2, .6)}
    <g opacity={appear(c.frame, at(c, 2, .76), 12)}><Ink d="M1200 640 C1200 668 1176 668 1176 652 M1186 654 C1196 664 1214 664 1222 650 C1228 640 1236 642 1236 654" w={3} /></g>
    <g transform={`translate(${1480 - swim * 210} 0)`} opacity={appear(c.frame, at(c, 2, .86), 10)}><Ink d="M0 740 C30 712 80 712 110 740 C80 768 30 768 0 740 Z M110 740 L140 718 L140 762 Z M24 734 L28 734" color={IVORY} /></g>
  </g>;}},
  {at: 3, draw: (c) => {const theirs = appear(c.frame, at(c, 3, .6), 14), mine = appear(c.frame, at(c, 3, .86), 14);return <g>
    {two(c, c.start + 4)}
    <g opacity={appear(c.frame, c.start + 10, 12) * (1 - mine * .7)}><Ink d={bubble(600, 360, 200, 110)} color={IVORY} /><Word x={600} y={374} size={34} text="MÌNH" opacity={1} /></g>
    <g opacity={theirs}><Ink d={bubble(1320, 360, 200, 110)} w={3} /><Word x={1320} y={374} size={34} text="HỌ" opacity={1} /><Glow x={1320} y={360} r={150} opacity={.5} /></g>
  </g>;}},
  {at: 4, draw: (c) => {const quote = appear(c.frame, c.at(5), 14);return <g>
    <g opacity={1 - quote}>{two(c, c.start + 4)}<Ink d={heart(960, 560, 1.4)} w={3} o={appear(c.frame, at(c, 4, .86), 14)} /><Glow x={960} y={560} r={160} opacity={appear(c.frame, at(c, 4, .88), 20) * .5} /></g>
    <g opacity={quote}>
      <Figure frame={c.frame} from={c.at(5)} x={960} y={800} s={1} />
      <Ink d="M984 640 C1100 640 1220 600 1320 560" o={appear(c.frame, at(c, 5, .66), 12)} w={3} />
      <Word x={1450} y={570} size={40} text="TẤM LÒNG" opacity={appear(c.frame, at(c, 5, .68), 12)} />
      <Ink d="M940 520 C840 520 720 480 620 440" o={appear(c.frame, at(c, 5, .88), 12)} color={IVORY} />
      <Word x={480} y={450} size={40} text="CỬA MIỆNG" opacity={appear(c.frame, at(c, 5, .9), 12) * .9} />
    </g>
  </g>;}},
  {at: 6, draw: (c) => {const back = interpolate(c.frame, [at(c, 6, .4), at(c, 6, .6)], [0, 1], {...clamp, easing: ease});return <g>
    <g transform={`translate(${-80 * back} 0)`}><Figure frame={c.frame} from={c.start + 4} x={680} y={800} s={.95} /></g>
    <Figure frame={c.frame} from={c.start + 8} x={1240} y={800} s={.95} facing={-1} />
    <Glow x={1240} y={600} r={220} opacity={appear(c.frame, at(c, 6, .78), 20) * .7} />
  </g>;}},
], options);

// 3A Phần một: Ba điều nền tảng (lines-05-phan-1.txt).
// 0       title card; two people with an envelope between them
// 1–2     a pigeon leaves a person at "chim bồ câu" and comes back at "quay về"
// 3–6     the safety officer and two workers: hats appear at "bắt họ đội" and come off at "quay lưng"; he holds a hat out
//         at "hỏi xem"; four workers in hats one by one ("số người chịu đội nón tăng lên")
// 7–8     a gift of a star from one person to another at "trân trọng"
// 9–11    a classroom desk, a mouse below at "con chuột", a boy listening with sound rings at "đôi tai rất thính";
//         piano and notes at "Stevie Wonder"; a cheap coin crossed out at "rẻ tiền"
// 12–15   two people push and pull a calf that will not move; a helper kneels, the calf walks into the barn; two
//         bubbles "ĐIỀU MÌNH MUỐN" / "ĐIỀU CON BÊ MUỐN" on their words
const calf = (x: number, y: number) => `M${x - 90} ${y - 110} C${x - 90} ${y - 150} ${x + 70} ${y - 150} ${x + 70} ${y - 110} C${x + 70} ${y - 80} ${x - 90} ${y - 80} ${x - 90} ${y - 110} Z M${x - 70} ${y - 88} L${x - 74} ${y} M${x - 40} ${y - 84} L${x - 40} ${y} M${x + 30} ${y - 84} L${x + 30} ${y} M${x + 55} ${y - 88} L${x + 58} ${y} M${x + 70} ${y - 120} C${x + 86} ${y - 152} ${x + 128} ${y - 150} ${x + 130} ${y - 126} C${x + 132} ${y - 104} ${x + 100} ${y - 98} ${x + 74} ${y - 106} M${x + 90} ${y - 146} L${x + 80} ${y - 166} L${x + 100} ${y - 150}`;
const barn = (x: number, y: number) => `M${x} ${y} L${x + 240} ${y} L${x + 240} ${y - 170} L${x + 120} ${y - 250} L${x} ${y - 170} Z M${x + 70} ${y} L${x + 70} ${y - 110} L${x + 170} ${y - 110} L${x + 170} ${y}`;
export const Phan1 = section('05 phần một', /(ba nguyên tắc|nền móng|chim bồ câu|quay về|nón bảo hộ|quay lưng|hỏi xem|khỏi bị thương|tăng lên|trân trọng|đôi tai rất thính|Stevie Wonder|bước ngoặt|rẻ tiền|giả dối|con bê|ngón tay|điều mình muốn|điều con bê muốn)/gi, [
  {at: 0, ...card('PHẦN MỘT', 'Ba điều nền tảng', (c) => <g>
    <Figure frame={c.frame} from={c.start + 10} x={640} y={840} s={.6} /><Figure frame={c.frame} from={c.start + 14} x={1280} y={840} s={.6} facing={-1} />
    <g opacity={appear(c.frame, c.start + 24, 14)}><Ink d={envelope(960, 740, 140, 90)} color={IVORY} /><Glow x={960} y={740} r={110} opacity={.5} /></g>
  </g>)},
  {at: 1, label: 'Không chỉ trích', draw: (c) => {const out = interpolate(c.frame, [at(c, 2, .18), at(c, 2, .4)], [0, 1], {...clamp, easing: ease}), back = interpolate(c.frame, [at(c, 2, .44), at(c, 2, .7)], [0, 1], {...clamp, easing: ease});
    const t = back > 0 ? 1 - back : out, bx = 700 + t * 700, by = 520 - Math.sin(t * Math.PI) * 180, flap = Math.sin(c.frame * .5) * 14;
    return <g>
      <Figure frame={c.frame} from={c.start + 4} x={560} y={800} s={1} arm="reach" />
      <g opacity={appear(c.frame, at(c, 2, .16), 10)} transform={`translate(${bx} ${by}) scale(${back > 0 ? -1 : 1} 1)`}>
        <Ink d={`M-46 0 C-24 ${-26 - flap} -8 -22 0 0 M46 0 C24 ${-26 - flap} 8 -22 0 0 M0 0 L-10 18 M0 0 L10 18`} w={2.8} color={IVORY} />
      </g>
    </g>;}},
  {at: 3, draw: (c) => {const hats = appear(c.frame, at(c, 4, .56), 12), turned = appear(c.frame, at(c, 4, .88), 10), off = appear(c.frame, at(c, 4, .93), 10), ask = appear(c.frame, at(c, 5, .2), 14), row = appear(c.frame, c.at(6), 16);
    return <g>
      <g opacity={1 - row}>
        <g opacity={turned > .5 ? 0 : 1}><Figure frame={c.frame} from={c.start + 4} x={560} y={800} s={.95} arm={ask > .5 ? 'reach' : 'point'} /></g>
        <g opacity={turned > .5 && ask < .5 ? 1 : 0}><Figure frame={c.frame} from={c.start - 30} x={560} y={800} s={.95} facing={-1} /></g>
        <Label x={560} y={420} text="NGƯỜI PHỤ TRÁCH" o={appear(c.frame, c.start + 14, 12)} />
        {[1160, 1380].map((x, k) => <g key={x}>
          <Figure frame={c.frame} from={c.start + 8 + k * 4} x={x} y={800} s={.95} facing={-1} />
          <Ink d={hardHat(x, 800, .95)} o={hats * (1 - off) + ask * 0} w={2.8} />
        </g>)}
        <g opacity={ask}><Ink d="M680 560 C680 520 760 520 760 560 M666 560 L774 560" w={2.8} /></g>
      </g>
      <g opacity={row}>{[0, 1, 2, 3].map((k) => {const x = 560 + k * 270;return <g key={k}>
        <Figure frame={c.frame} from={c.at(6)} x={x} y={800} s={.85} />
        <Ink d={hardHat(x, 800, .85)} o={appear(c.frame, at(c, 6, .15 + k * .14), 10)} w={2.8} />
      </g>;})}</g>
    </g>;}},
  {at: 7, label: 'Khen ngợi thật lòng', draw: (c) => {const give = interpolate(c.frame, [at(c, 8, .6), at(c, 8, .9)], [0, 1], {...clamp, easing: ease});return <g>
    {two(c, c.start + 4)}
    <g transform={`translate(${720 + give * 440} 520)`} opacity={appear(c.frame, at(c, 8, .55), 10)}><Ink d={star(0, 0, 40)} w={2.8} /></g>
    <Glow x={1320} y={520} r={150} opacity={appear(c.frame, at(c, 8, .92), 14) * .6} />
  </g>;}},
  {at: 9, draw: (c) => {const mouse = appear(c.frame, at(c, 9, .62), 12), ears = appear(c.frame, at(c, 9, .86), 12), piano = appear(c.frame, c.at(10), 16), cheap = appear(c.frame, c.at(11), 16);
    return <g>
      <g opacity={(1 - piano)}>
        {D(c, 'M760 600 L1160 600 M790 600 L790 760 M1130 600 L1130 760', 0, 24, 2.4, .85)}
        <Figure frame={c.frame} from={c.start + 6} x={600} y={800} s={.95} arm="point" />
        <Figure frame={c.frame} from={c.start + 10} x={1320} y={800} s={.8} facing={-1} />
        <g opacity={mouse}><Ink d="M900 790 C900 762 960 762 968 784 L984 788 L968 792 C960 800 900 800 900 790 Z M900 790 C880 790 872 776 864 770" color={IVORY} /></g>
        <g opacity={ears}>{[0, 1, 2].map((k) => <path key={k} d={`M${1290 - k * 20} ${500 - k * 14} C${1270 - k * 24} ${520} ${1270 - k * 24} ${556} ${1290 - k * 20} ${576 + k * 14}`} fill="none" stroke={GOLD} strokeWidth={2.4} opacity={1 - k * .25} />)}</g>
      </g>
      <g opacity={piano * (1 - cheap)}>
        <Ink d="M700 720 L1220 720 L1220 800 L700 800 Z M700 720 L760 560 L1160 560 L1220 720" w={2.6} />
        {Array.from({length: 12}, (_, k) => <Ink key={k} d={`M${740 + k * 40} 720 L${740 + k * 40} 800`} w={1.8} o={.8} />)}
        {[0, 1, 2].map((k) => {const y = 480 - ((c.frame - c.at(10)) * 1.2 + k * 50) % 160;return <Ink key={k} d={`M${900 + k * 80} ${y} L${900 + k * 80} ${y - 50} L${930 + k * 80} ${y - 60} M${900 + k * 80} ${y} a10 8 0 1 1 -1 0`} o={.85 * appear(c.frame, at(c, 10, .3), 14)} color={IVORY} />;})}
        <Glow x={960} y={600} r={200} opacity={appear(c.frame, at(c, 10, .74), 20) * .5} />
      </g>
      <g opacity={cheap}><Ink d={coin(960, 520)} w={2.8} /><Ink d="M880 600 L1040 440" o={appear(c.frame, at(c, 11, .46), 10)} w={4} color={IVORY} /></g>
    </g>;}},
  {at: 12, label: 'Gợi ý muốn', draw: (c) => {const helper = appear(c.frame, c.at(14), 16), walk = interpolate(c.frame, [at(c, 14, .5), at(c, 14, .78)], [0, 1], {...clamp, easing: ease}), bubbles = appear(c.frame, c.at(15), 14);
    return <g>
      <Ink d={barn(1460, 800)} o={appear(c.frame, c.start + 6, 14)} w={2.4} />
      <g opacity={1 - helper}>
        <Figure frame={c.frame} from={c.start + 4} x={560} y={800} s={.85} arm="reach" />
        <Figure frame={c.frame} from={c.start + 8} x={1240} y={800} s={.85} facing={-1} arm="reach" />
      </g>
      <g transform={`translate(${walk * 420} 0)`} opacity={1 - walk * .9}><Ink d={calf(840, 800)} w={2.6} color={IVORY} /></g>
      <g opacity={helper * (1 - bubbles)}><Figure frame={c.frame} from={c.at(14)} x={1060} y={800} s={.85} pose="kneel" facing={-1} /></g>
      <g opacity={bubbles}>
        <Figure frame={c.frame} from={c.at(15) - 30} x={560} y={800} s={.85} />
        <Figure frame={c.frame} from={c.at(15) - 30} x={1060} y={800} s={.85} />
        <g opacity={appear(c.frame, at(c, 15, .42), 12)}><Ink d={bubble(560, 380, 300, 100)} color={IVORY} /><Word x={560} y={394} size={34} text="ĐIỀU MÌNH MUỐN" opacity={1} /></g>
        <g opacity={appear(c.frame, at(c, 15, .82), 12)}><Ink d={bubble(1060, 380, 340, 100)} w={3} /><Word x={1060} y={394} size={34} text="ĐIỀU CON BÊ MUỐN" opacity={1} /></g>
      </g>
    </g>;}},
], options);

// 3B Phần hai: Sáu cách tạo thiện cảm (lines-06-phan-2.txt).
// 0       title card; a hand reaching between two people
// 1       six signs, each on its word: heart, smile, name tag, ear, speech bubble, star
// 2–5     a dinner table: Carnegie (named) beside the botanist, leaves growing from the botanist's words at "cây cỏ";
//         Carnegie only listens; "NGƯỜI NÓI CHUYỆN HAY NHẤT" at its words
// 6       an ear joined to a heart
// 7       Roosevelt (named) at a lamp with books and a late clock at "thức khuya"
// 8–9     a smile with a coin beside it at "bán được hàng" (the coin fades); "THẬT LÒNG" lit at its word
const smileSign = (x: number, y: number) => `M${x - 46} ${y} a46 46 0 1 0 92 0 a46 46 0 1 0 -92 0 M${x - 24} ${y + 10} C${x - 10} ${y + 30} ${x + 10} ${y + 30} ${x + 24} ${y + 10} M${x - 16} ${y - 14} L${x - 14} ${y - 14} M${x + 14} ${y - 14} L${x + 16} ${y - 14}`;
const tagSign = (x: number, y: number) => `M${x - 56} ${y - 34} L${x + 56} ${y - 34} L${x + 56} ${y + 34} L${x - 56} ${y + 34} Z M${x - 36} ${y - 6} L${x + 36} ${y - 6} M${x - 36} ${y + 14} L${x + 16} ${y + 14} M${x - 10} ${y - 34} L${x - 10} ${y - 50} L${x + 10} ${y - 50} L${x + 10} ${y - 34}`;
export const Phan2 = section('06 phần hai', /(muốn gần mình|thật lòng quan tâm|mỉm cười|nhớ tên|lắng nghe|điều người kia quan tâm|thấy mình quan trọng|bữa tiệc tối|nhà thực vật học|cây cỏ|không nói gì|người nói chuyện hay nhất|cách trân trọng nhất|Theodore Roosevelt|thức khuya|kỹ thuật lấy lòng|thật lòng)/gi, [
  {at: 0, ...card('PHẦN HAI', 'Sáu cách tạo thiện cảm', (c) => <g>
    <Figure frame={c.frame} from={c.start + 10} x={640} y={840} s={.6} arm="reach" /><Figure frame={c.frame} from={c.start + 14} x={1280} y={840} s={.6} facing={-1} />
    <Glow x={760} y={700} r={90} opacity={appear(c.frame, c.start + 26, 14) * .6} />
  </g>)},
  {at: 1, draw: (c) => {const signs = [(x: number) => heart(x, 520, 1.1), (x: number) => smileSign(x, 520), (x: number) => tagSign(x, 520), (x: number) => ear(x - 24, 462), (x: number) => bubble(x, 515, 120, 80), (x: number) => star(x, 520, 52)];
    const when = [.15, .33, .38, .53, .59, .93];
    return <g>{signs.map((s, k) => <g key={k} opacity={appear(c.frame, at(c, 1, when[k]), 12)}><Ink d={s(460 + k * 200)} w={2.8} color={k === 5 ? GOLD : IVORY} /></g>)}</g>;}},
  {at: 2, draw: (c) => {const leaves = appear(c.frame, at(c, 3, .62), 18), title = appear(c.frame, at(c, 5, .7), 14);return <g>
    {D(c, 'M560 640 L1360 640 M600 640 L600 780 M1320 640 L1320 780', 0, 24, 2.4, .85)}
    <Figure frame={c.frame} from={c.start + 6} x={820} y={800} s={.8} pose="sit" />
    <Figure frame={c.frame} from={c.start + 10} x={1140} y={800} s={.8} pose="sit" facing={-1} />
    <Label x={760} y={440} text="CARNEGIE" o={appear(c.frame, c.at(3), 12)} />
    <Label x={1200} y={440} text="NHÀ THỰC VẬT HỌC" o={appear(c.frame, at(c, 3, .2), 12)} />
    <g opacity={leaves * (1 - title)}>{[0, 1, 2, 3].map((k) => {const x = 1060 - k * 70, y = 330 - (k % 2) * 30;return <Ink key={k} d={`M${x} ${y + 40} C${x - 30} ${y + 10} ${x - 10} ${y - 30} ${x + 20} ${y - 30} C${x + 30} ${y} ${x + 20} ${y + 30} ${x} ${y + 40} Z M${x} ${y + 40} L${x + 14} ${y - 18}`} o={appear(c.frame, at(c, 3, .62 + k * .06), 10)} />;})}</g>
    <Word x={960} y={300} size={44} text="NGƯỜI NÓI CHUYỆN HAY NHẤT" opacity={title} />
  </g>;}},
  {at: 6, draw: (c) => <g>
    {D(c, ear(700, 420), 0, 24, 2.8)}
    {D(c, 'M780 480 C900 440 1020 440 1140 500', 12, 20, 2.2, .7)}
    <Ink d={heart(1230, 520, 1.4)} w={3} o={appear(c.frame, c.start + 26, 14)} />
    <Glow x={1230} y={510} r={160} opacity={appear(c.frame, c.start + 36, 20) * .5} />
  </g>},
  {at: 7, draw: (c) => {const late = appear(c.frame, at(c, 7, .42), 14);return <g>
    <Figure frame={c.frame} from={c.start + 4} x={600} y={800} s={.95} pose="sit" />
    <Label x={600} y={440} text="ROOSEVELT" o={appear(c.frame, at(c, 7, .2), 12)} />
    {D(c, 'M720 700 L1260 700 M760 700 L760 800 M1220 700 L1220 800', 4, 22, 2.4, .85)}
    <Ink d="M820 700 L820 560 L790 560 L880 470 L970 560 L940 560 M940 560 L820 560" w={2.6} o={appear(c.frame, c.start + 14, 12)} />
    <Glow x={880} y={560} r={150} opacity={late * .6} />
    {[0, 1, 2].map((k) => <Ink key={k} d={`M${1000} ${688 - k * 34} L${1180} ${688 - k * 34} L${1180} ${660 - k * 34} L${1000} ${660 - k * 34} Z`} o={appear(c.frame, c.start + 18 + k * 4, 10)} color={IVORY} />)}
    <g opacity={late}><Ink d="M1380 380 a70 70 0 1 0 140 0 a70 70 0 1 0 -140 0 M1450 380 L1450 326 M1450 380 L1478 360" w={2.6} color={IVORY} /></g>
  </g>;}},
  {at: 8, draw: (c) => {const coinIn = appear(c.frame, at(c, 8, .68), 12), honest = appear(c.frame, c.at(9), 14);return <g>
    <Ink d={smileSign(860, 520)} w={2.8} o={appear(c.frame, c.start + 6, 14)} color={IVORY} />
    <g opacity={coinIn * (1 - honest)}><Ink d={coin(1080, 520)} w={2.6} /></g>
    <Word x={960} y={330} size={52} text="THẬT LÒNG" opacity={appear(c.frame, at(c, 9, .1), 12)} />
    <Glow x={960} y={320} r={200} opacity={honest * .45} />
  </g>;}},
], options);

// 3C Phần ba: Khi hai người nghĩ khác nhau (lines-07-phan-3.txt).
// 0       title card; two speech bubbles meeting in the middle
// 1–6     a London dinner: the guest's bubble with a thick book (the Bible) at "Kinh thánh"; Carnegie's bubble with a
//         scroll (Shakespeare) and "!" at "người kia sai"; the friend's foot nudges his under the table at "đá nhẹ chân";
//         on the way home two figures walk under a street lamp
// 7–8     a scale whose two pans both carry a minus at "thua"; the principle's words
// 9–12    a park: Rex runs; the mounted policeman appears at "viên cảnh sát"; Carnegie raises a hand to his chest at
//         "mình sai"; the policeman turns away and Rex runs up the hill at "bỏ qua"
// 13–15   a list of the principles, each line on its word
// 16–18   a curtain drawn back to show the paper with "ĐIỀU MÌNH MUỐN" in the open
const Lines = ({c, items, s, y0 = 300, size = 38}: {c: Ctx; items: [string, number][]; s: number; y0?: number; size?: number}) => <g>{items.map(([t, when], k) => <g key={t} opacity={appear(c.frame, at(c, s, when), 10)}>
  <circle cx={560} cy={y0 + k * 74 - size * .32} r={7} fill={GOLD} />
  <text x={590} y={y0 + k * 74} fill={IVORY} fontSize={size} fontWeight={700}>{t}</text>
</g>)}</g>;
const scroll = (x: number, y: number) => `M${x - 50} ${y - 40} L${x + 50} ${y - 40} L${x + 50} ${y + 40} L${x - 50} ${y + 40} Z M${x - 50} ${y - 40} C${x - 66} ${y - 40} ${x - 66} ${y - 20} ${x - 50} ${y - 20} M${x + 50} ${y + 40} C${x + 66} ${y + 40} ${x + 66} ${y + 20} ${x + 50} ${y + 20} M${x - 30} ${y - 12} L${x + 30} ${y - 12} M${x - 30} ${y + 10} L${x + 20} ${y + 10}`;
export const Phan3 = section('07 phần ba', /(mười hai nguyên tắc|không cùng ý kiến|tránh tranh cãi|Luân Đôn|Kinh thánh|Shakespeare|người kia sai|đá nhẹ chân|là khách|thua thì mình thua|thắng thì mình cũng thua|giữ chặt|nhận lỗi trước|Rex|viên cảnh sát|mình sai|dịu giọng|bỏ qua|vâng|ý tưởng là của chính họ|quan điểm của họ|đồng cảm|cao thượng|sinh động|thử thách|dễ gây tranh cãi nhất|che giấu mục đích|biết rõ mình đang muốn gì)/gi, [
  {at: 0, ...card('PHẦN BA', 'Khi hai người nghĩ khác nhau', (c) => <g>
    <g opacity={appear(c.frame, c.start + 14, 14)}><Ink d={bubble(860, 730, 160, 80)} color={IVORY} /></g>
    <g opacity={appear(c.frame, c.start + 22, 14)}><Ink d={bubble(1060, 730, 160, 80)} w={2.8} /></g>
  </g>)},
  {at: 1, label: 'Tránh tranh cãi', draw: (c) => {const bible = appear(c.frame, at(c, 3, .82), 12), wrong = appear(c.frame, at(c, 4, .82), 12), kick = appear(c.frame, at(c, 5, .5), 10), home = appear(c.frame, c.at(6), 18);
    return <g>
      <g opacity={1 - home}>
        {D(c, 'M520 640 L1400 640 M560 640 L560 780 M1360 640 L1360 780', 0, 24, 2.4, .85)}
        <Figure frame={c.frame} from={c.start + 4} x={700} y={800} s={.8} pose="sit" />
        <Figure frame={c.frame} from={c.start + 8} x={960} y={800} s={.8} pose="sit" />
        <Figure frame={c.frame} from={c.start + 12} x={1220} y={800} s={.8} pose="sit" facing={-1} />
        <Label x={960} y={460} text="CARNEGIE" o={appear(c.frame, c.at(2), 12)} />
        <g opacity={bible}><Ink d={bubble(1220, 330, 220, 120)} color={IVORY} /><Ink d={closedBook(1220, 330, 70, 90)} w={2.6} /><Word x={1226} y={340} size={34} text="+" opacity={1} /></g>
        <g opacity={appear(c.frame, at(c, 4, .24), 12)}><Ink d={bubble(900, 300, 240, 120)} w={2.8} /><Ink d={scroll(880, 300)} w={2.4} /><Word x={980} y={316} size={52} text="!" opacity={wrong} /></g>
        <g opacity={kick * (1 - appear(c.frame, at(c, 5, .9), 10))}><Ink d="M720 790 L800 770 M800 770 L780 756 M800 770 L784 786" w={3.2} /><Glow x={780} y={780} r={70} opacity={.6} /></g>
      </g>
      <g opacity={home}>
        <Ink d="M1500 800 L1500 400 C1500 360 1460 350 1430 370 M1410 370 L1450 370 L1440 400 L1420 400 Z" w={2.6} />
        <Glow x={1430} y={410} r={180} opacity={.4} />
        <Figure frame={c.frame} from={c.at(6)} x={900} y={800} s={.9} pose="walk" />
        <Figure frame={c.frame} from={c.at(6) + 4} x={1100} y={800} s={.9} pose="walk" />
      </g>
    </g>;}},
  {at: 7, draw: (c) => <g>
    {D(c, 'M960 800 L960 400 M900 800 L1020 800 M640 400 L1280 400', 0, 24, 2.8)}
    <Ink d="M640 400 L580 540 M640 400 L700 540 M540 540 L740 540 M1280 400 L1220 540 M1280 400 L1340 540 M1180 540 L1380 540" o={appear(c.frame, c.start + 14, 12)} w={2.2} />
    <Word x={640} y={620} size={64} text="−" opacity={appear(c.frame, at(c, 7, .43), 10)} />
    <Word x={1280} y={620} size={64} text="−" opacity={appear(c.frame, at(c, 7, .58), 10)} />
    <g opacity={appear(c.frame, c.at(8), 14)}><Word x={960} y={300} size={44} text="ĐỪNG NÓI: “ANH SAI RỒI!”" opacity={appear(c.frame, at(c, 8, .62), 12)} /></g>
  </g>},
  {at: 9, label: 'Nhận lỗi trước', draw: (c) => {const run = (c.frame % 90) / 90, cop = appear(c.frame, at(c, 10, .82), 14), sorry = appear(c.frame, at(c, 11, .76), 12), letgo = appear(c.frame, at(c, 12, .78), 16);
    const dogX = 980 + Math.sin(run * Math.PI * 2) * 30 + letgo * 300, dogY = 790 - letgo * 140;
    return <g>
      {D(c, 'M500 800 L1100 800 C1240 800 1320 660 1460 650 L1560 650', 0, 30, 2.2, .7)}
      {D(c, 'M560 800 L560 640 M520 660 C520 600 600 600 600 660 C600 700 520 700 520 660', 4, 20, 2.2, .7)}
      <g opacity={1 - sorry}><Figure frame={c.frame} from={c.start + 6} x={760} y={800} s={.9} /></g>
      <g opacity={sorry}><Figure frame={c.frame} from={c.start - 30} x={760} y={800} s={.9} arm="reach" facing={1} /></g>
      <Label x={760} y={460} text="CARNEGIE" o={appear(c.frame, c.start + 12, 12)} />
      <g transform={`translate(${dogX} ${dogY})`} opacity={appear(c.frame, at(c, 10, .3), 12)}><Ink d="M-40 -30 C-40 -50 30 -50 30 -30 C30 -16 -40 -16 -40 -30 Z M-30 -20 L-32 0 M20 -20 L22 0 M30 -36 C40 -56 64 -50 60 -32 C58 -22 44 -22 32 -26 M-40 -34 L-56 -46" w={2.4} color={IVORY} /></g>
      <g opacity={cop * (1 - letgo * .3)} transform={`translate(${1280 + letgo * 120} 0)`}>
        <Ink d="M-90 800 L-80 700 M60 800 L50 700 M-110 700 C-110 640 90 640 90 700 L-110 700 M90 680 C120 640 140 610 120 590" w={2.6} />
        <Figure frame={c.frame} from={at(c, 10, .82)} x={-10} y={660} s={.6} facing={-1} />
      </g>
      <Label x={1280} y={420} text="CẢNH SÁT" o={cop * (1 - letgo)} />
    </g>;}},
  {at: 13, label: 'Để người kia nói', draw: (c) => {const second = appear(c.frame, c.at(15), 14);return <g>
    <g opacity={1 - second}><Lines c={c} s={14} y0={300} items={[['Thái độ thân thiện', .24], ['Câu hỏi để người kia nói "vâng"', .48], ['Để họ nói nhiều hơn', .56], ['Để ý tưởng là của họ', .67], ['Nhìn từ quan điểm của họ', .92]]} /></g>
    <g opacity={second}><Lines c={c} s={15} y0={340} items={[['Đồng cảm với mong muốn', .2], ['Khơi gợi sự cao thượng', .49], ['Trình bày sinh động', .7], ['Khơi gợi tinh thần vượt thử thách', .93]]} /></g>
  </g>;}},
  {at: 16, draw: (c) => {const open = interpolate(c.frame, [at(c, 17, .62), at(c, 17, .9)], [0, 1], {...clamp, easing: ease}), told = appear(c.frame, at(c, 18, .7), 16);return <g>
    {two(c, c.start + 4)}
    <g opacity={appear(c.frame, c.at(17), 14)}>
      <Ink d="M820 300 L1100 300 L1100 560 L820 560 Z M850 360 L1070 360 M850 400 L1030 400" color={IVORY} />
      <Word x={960} y={470} size={34} text="ĐIỀU MÌNH MUỐN" opacity={told > .5 ? 1 : open} />
      <g transform={`translate(${open * 300} 0)`} opacity={1 - open * .4}><Ink d="M800 280 L1120 280 L1120 580 L800 580 Z M840 280 L840 580 M880 280 L880 580 M920 280 L920 580" w={2.6} /></g>
    </g>
    <Glow x={960} y={430} r={200} opacity={told * .5} />
  </g>;}},
], options);

// 3D Phần bốn: Góp ý mà không làm tổn thương (lines-08-phan-4.txt).
// 0       title card; a hand on a shoulder
// 1–4     a shop: the owner (named) walks the floor at "đi một vòng"; a customer waits at the counter at "vị khách", two
//         staff chat in the far corner at "nhân viên"; the owner serves at "tự phục vụ" and passes the parcel at "gói lại"
// 5–8     three boxes: praise · "nhưng" · criticism, each on its word; "nhưng" turns doubtful at "nghi"; then "và" takes
//         its place and the last box becomes encouragement at "và nếu con"
// 9–10    a list of the remaining principles, each line on its word
// 11–12   a hand on a shoulder with a small tick on a sheet: say it, in a way that can be heard
export const Phan4 = section('08 phần bốn', /(chỉ ra lỗi|người quản lý|nhắc khéo|Philadelphia|đi một vòng|vị khách|nhân viên|tự phục vụ|không trách một lời nào|nhưng|và|khen trước|lời chê|nghi|xét mình|gợi ý|giữ thể diện|tiến bộ nhỏ nhất|tiếng tốt|dễ sửa|im lặng trước cái sai|còn muốn sửa)/gi, [
  {at: 0, ...card('PHẦN BỐN', 'Góp ý mà không làm tổn thương', (c) => <g>
    <Figure frame={c.frame} from={c.start + 10} x={860} y={840} s={.6} arm="reach" /><Figure frame={c.frame} from={c.start + 14} x={1000} y={840} s={.6} facing={-1} />
  </g>)},
  {at: 1, label: 'Nhắc khéo', draw: (c) => {const walk = interpolate(c.frame, [at(c, 2, .6), at(c, 2, 1)], [0, 1], clamp), guest = appear(c.frame, at(c, 3, .18), 12), staff = appear(c.frame, at(c, 3, .6), 12), serve = appear(c.frame, at(c, 4, .22), 12), pass = interpolate(c.frame, [at(c, 4, .6), at(c, 4, .85)], [0, 1], {...clamp, easing: ease});
    const ownerX = serve > .5 ? 900 : 560 + walk * 200;
    return <g>
      {D(c, 'M760 640 L1080 640 L1080 800 L760 800 Z', 0, 22, 2.4, .9)}
      {D(c, 'M460 360 L700 360 M460 440 L700 440 M460 520 L700 520', 6, 20, 2, .5)}
      <g opacity={serve > .5 ? 0 : 1}><Figure frame={c.frame} from={c.start + 4} x={ownerX} y={800} s={.85} pose={walk > 0 && walk < 1 ? 'walk' : 'stand'} /></g>
      <g opacity={serve}><Figure frame={c.frame} from={c.start - 30} x={900} y={640} s={.6} arm="reach" /></g>
      <Label x={serve > .5 ? 900 : ownerX} y={serve > .5 ? 400 : 480} text="ÔNG CHỦ" o={appear(c.frame, at(c, 2, .3), 12)} />
      <g opacity={guest}><Figure frame={c.frame} from={at(c, 3, .18)} x={1200} y={800} s={.85} facing={-1} /></g>
      <g opacity={staff}><Figure frame={c.frame} from={at(c, 3, .6)} x={1500} y={800} s={.7} /><Figure frame={c.frame} from={at(c, 3, .6) + 4} x={1640} y={800} s={.7} facing={-1} /><Ink d={bubble(1570, 420, 120, 60)} color={IVORY} o={.8} /></g>
      <g opacity={appear(c.frame, at(c, 4, .55), 10)} transform={`translate(${980 + pass * 520} ${560 - pass * 30})`}><Ink d="M-34 -24 L34 -24 L34 24 L-34 24 Z M0 -24 L0 24 M-34 0 L34 0" w={2.4} color={IVORY} /></g>
    </g>;}},
  {at: 5, label: 'Nhưng → và', draw: (c) => {const praise = appear(c.frame, at(c, 6, .4), 12), but = appear(c.frame, at(c, 6, .72), 10), crit = appear(c.frame, at(c, 6, .88), 10), doubt = appear(c.frame, at(c, 7, .5), 12), swap = appear(c.frame, at(c, 8, .66), 14);
    return <g>
      <g opacity={praise}><Ink d="M420 420 L760 420 L760 560 L420 560 Z" color={IVORY} /><Word x={590} y={505} size={38} text="LỜI KHEN" opacity={1} /></g>
      <g opacity={but * (1 - swap)}><Word x={960} y={505} size={48} text="NHƯNG" opacity={1} />{doubt > 0 ? <Word x={960} y={420} size={44} text="?" opacity={doubt} /> : null}</g>
      <g opacity={swap}><Word x={960} y={505} size={48} text="VÀ" opacity={1} /><Glow x={960} y={490} r={120} opacity={.5} /></g>
      <g opacity={crit}><Ink d="M1160 420 L1500 420 L1500 560 L1160 560 Z" color={swap > .5 ? GOLD : IVORY} /><Word x={1330} y={505} size={38} text={swap > .5 ? 'KHÍCH LỆ' : 'LỜI CHÊ'} opacity={1} /></g>
    </g>;}},
  {at: 9, label: 'Giữ thể diện', draw: (c) => <Lines c={c} s={10} y0={290} size={36} items={[['Xét mình trước', .13], ['Gợi ý thay vì ra lệnh', .28], ['Giữ thể diện cho người mắc lỗi', .39], ['Khen cả tiến bộ nhỏ nhất', .55], ['Trao một tiếng tốt', .7], ['Làm lỗi trông dễ sửa', .95]]} />},
  {at: 11, draw: (c) => <g>
    <Figure frame={c.frame} from={c.start + 4} x={820} y={800} s={.95} arm="reach" />
    <Figure frame={c.frame} from={c.start + 8} x={1000} y={800} s={.95} facing={-1} />
    <g opacity={appear(c.frame, at(c, 12, .5), 14)}><Ink d={sheet(1200, 380, 200, 260)} color={IVORY} /><Ink d="M1250 520 L1290 560 L1360 470" w={4} /></g>
  </g>},
], options);

// 3E Những điểm chưa đạt (lines-08e-diem-chua-dat.txt).
// 0   an open book under a magnifying glass
// 1–2 story bubbles at "giai thoại", a faint "%" with a question mark at "tỉ lệ phần trăm"
// 3   an old office front and a shop counter at "doanh nhân" / "bán hàng"
// 4–5 a string from one hand to another's shoulder, cut at "thao túng"
// 6   a dashed line between two people that turns solid at "giới hạn"
// 7–8 a scale settling level
export const ChuaDat = section('08e chưa đạt', /(không thích cuốn sách này|còn thiếu|giai thoại|tỉ lệ phần trăm|ví dụ minh họa|gần một trăm năm trước|sách dạy bán hàng|thao túng|dừng ở đâu|nói thẳng|đặt giới hạn|dạy nịnh|đều có phần đúng)/gi, [
  {at: 0, draw: (c) => {const x = interpolate(c.frame, [c.start + 20, c.start + 80], [-140, 140], {...clamp, easing: ease});return <g>
    {D(c, openBook(960, 600, 1.4), 0, 30, 2.6)}
    <g transform={`translate(${x} 0)`} opacity={appear(c.frame, c.start + 18, 12)}><Ink d="M900 460 a70 70 0 1 0 140 0 a70 70 0 1 0 -140 0 M1020 510 L1090 580" w={3} color={IVORY} /></g>
  </g>;}},
  {at: 1, draw: (c) => <g>
    {[0, 1, 2].map((k) => <g key={k} opacity={appear(c.frame, at(c, 1, .2 + k * .06), 10)}><Ink d={bubble(560 + k * 260, 360 + (k % 2) * 60, 200, 100)} color={IVORY} /><Ink d={star(560 + k * 260, 360 + (k % 2) * 60, 26)} w={2} /></g>)}
    <g opacity={appear(c.frame, at(c, 1, .7), 12) * .9}><Word x={1420} y={460} size={110} text="%" opacity={.55} /><path d="M1500 300 C1500 270 1540 266 1540 296 C1540 316 1516 318 1516 340 M1516 360 L1516 362" fill="none" stroke={IVORY} strokeWidth={2.4} strokeLinecap="round" /></g>
    <Glow x={960} y={600} r={200} opacity={appear(c.frame, c.at(2), 20) * .35} />
  </g>},
  {at: 3, draw: (c) => <g>
    <g opacity={appear(c.frame, at(c, 3, .13), 14)}><Ink d="M480 800 L480 380 L800 380 L800 800 M520 440 L580 440 L580 520 L520 520 Z M700 440 L760 440 L760 520 L700 520 Z M520 600 L580 600 L580 680 L520 680 Z M700 600 L760 600 L760 680 L700 680 Z M600 800 L600 700 L680 700 L680 800" w={2.4} /></g>
    <g opacity={appear(c.frame, at(c, 3, .32), 14)}><Ink d="M1080 640 L1440 640 L1440 800 L1080 800 Z M1060 480 L1460 480 L1440 400 L1080 400 Z M1100 480 L1100 640 M1420 480 L1420 640" w={2.4} /><Word x={1260} y={455} size={34} text="CỬA HÀNG" opacity={.9} /></g>
  </g>},
  {at: 4, draw: (c) => {const cut = appear(c.frame, at(c, 4, .86), 10);return <g>
    {two(c, c.start + 4)}
    <path d={`M700 560 C820 ${480 + cut * 80} 1100 ${480 + cut * 80} 1230 520`} fill="none" stroke={IVORY} strokeWidth={2.2} strokeDasharray={cut > .5 ? '4 18' : undefined} opacity={appear(c.frame, at(c, 4, .4), 12) * (1 - cut * .6)} />
    <Glow x={960} y={500} r={120} opacity={cut * .5} />
    <g opacity={appear(c.frame, c.at(5), 14)}><path d="M960 330 C960 300 1000 296 1000 326 C1000 346 976 348 976 370 M976 392 L976 394" fill="none" stroke={GOLD} strokeWidth={2.6} strokeLinecap="round" /></g>
  </g>;}},
  {at: 6, draw: (c) => {const solid = appear(c.frame, at(c, 6, .6), 12);return <g>
    {two(c, c.start + 4)}
    <path d="M960 340 L960 800" fill="none" stroke={GOLD} strokeWidth={solid > .5 ? 4 : 2.2} strokeDasharray={solid > .5 ? undefined : '8 14'} opacity={appear(c.frame, c.start + 14, 12)} />
    <Word x={960} y={300} size={38} text="GIỚI HẠN" opacity={solid} />
  </g>;}},
  {at: 7, draw: (c) => {const level = appear(c.frame, c.at(8), 30), tilt = 14 * (1 - level);return <g>
    {D(c, 'M960 800 L960 400 M900 800 L1020 800', 0, 20, 2.8)}
    <g transform={`rotate(${tilt} 960 400)`}><Ink d="M640 400 L1280 400 M640 400 L580 540 M640 400 L700 540 M540 540 L740 540 M1280 400 L1220 540 M1280 400 L1340 540 M1180 540 L1380 540" w={2.4} o={appear(c.frame, c.start + 10, 14)} /></g>
  </g>;}},
], options);

// 3F Tổng kết (lines-08f-tong-ket.txt): two people, the left one bows slightly; the four tabs 3 · 6 · 12 · 9 light on
// their words; a heart between two people for "phải thật lòng".
export const TongKet = section('08f tổng kết', /(trong một hơi|được tôn trọng|bị chê trách|ba điều nền tảng|sáu cách|mười hai cách|chín cách|phải thật lòng)/gi, [
  {at: 0, draw: (c) => <g>{two(c, c.start + 4)}<Glow x={1320} y={560} r={180} opacity={appear(c.frame, at(c, 0, .55), 20) * .55} /></g>},
  {at: 1, draw: (c) => <g>
    {D(c, openBook(960, 620, 1.4), 0, 26, 2.6)}
    {['3', '6', '12', '9'].map((n, k) => {const on = appear(c.frame, at(c, 1, [.12, .47, .57, .79][k]), 10), x = 740 + k * 150;return <g key={n} opacity={on}>
      <Ink d={`M${x} 640 L${x} 520 L${x + 80} 520 L${x + 80} 640`} w={2.6} /><Word x={x + 40} y={576} size={38} text={n} opacity={1} />
    </g>;})}
  </g>},
  {at: 2, draw: (c) => <g>{two(c, c.start + 2)}<Ink d={heart(960, 560, 1.4)} w={3} o={appear(c.frame, at(c, 2, .7), 14)} /><Glow x={960} y={555} r={170} opacity={appear(c.frame, at(c, 2, .75), 20) * .55} /></g>},
], options);

// 4 Ý kiến cá nhân (lines-08g-y-kien.txt).
// 0–1 a hand holding a pen stops above the page; the letter in its box from the opening comes back, "CHƯA GỬI"
// 2–3 a name tag and a smile; then two people facing each other at "một con người"
// 4–5 a window that shows only part of a landscape at "một góc nhìn"; a person standing beside an open book
// 6–7 the box "VÀ" lit (from part four)
export const YKien = section('08g ý kiến', /(dừng lại một nhịp|lá thư Lincoln không gửi đi|chưa vội gửi|mỉm cười|nhớ tên|một con người|một góc nhìn|chính kiến|đổi lấy sự thật|chữ "nhưng"|chữ "và")/gi, [
  {at: 0, draw: (c) => {const stop = appear(c.frame, at(c, 0, .7), 10), letter = appear(c.frame, c.at(1), 16);return <g>
    <g opacity={1 - letter}>
      {D(c, sheet(760, 300, 400, 460), 0, 24, 2.4)}
      <g transform={`translate(0 ${-30 * stop})`}><Ink d={quill(1040, 600)} w={2.8} color={IVORY} /></g>
    </g>
    <g opacity={letter}>
      <Ink d="M660 560 L1260 560 L1260 790 L660 790 Z M660 560 L700 520 M1260 560 L1220 520" w={2.6} />
      <Ink d={envelope(960, 400, 240, 150)} color={IVORY} w={2.6} />
      <Word x={960} y={290} size={42} text="CHƯA GỬI" opacity={appear(c.frame, at(c, 1, .86), 12)} />
    </g>
  </g>;}},
  {at: 2, draw: (c) => {const person = appear(c.frame, c.at(3), 16);return <g>
    <g opacity={1 - person}><Ink d={smileSign(800, 520)} w={2.8} o={appear(c.frame, at(c, 2, .64), 12)} color={IVORY} /><Ink d={tagSign(1120, 520)} w={2.8} o={appear(c.frame, at(c, 2, .78), 12)} color={IVORY} /></g>
    <g opacity={person}>{two(c, c.at(3))}<Glow x={960} y={560} r={220} opacity={appear(c.frame, at(c, 3, .6), 20) * .45} /></g>
  </g>;}},
  {at: 4, draw: (c) => {const own = appear(c.frame, c.at(5), 16);return <g>
    <g opacity={1 - own}>
      {D(c, 'M720 300 L1200 300 L1200 700 L720 700 Z M960 300 L960 700 M720 500 L1200 500', 0, 24, 2.6)}
      <Ink d="M740 480 C820 420 880 440 940 470 M980 480 C1040 430 1120 420 1180 470 M760 680 C860 620 1000 640 1180 600" o={appear(c.frame, at(c, 4, .34), 16) * .8} color={IVORY} />
    </g>
    <g opacity={own}><Figure frame={c.frame} from={c.at(5)} x={760} y={800} s={1} />{D(c, openBook(1180, 640, .9), 6, 20, 2.4)}</g>
  </g>;}},
  {at: 6, draw: (c) => <g>
    <g opacity={appear(c.frame, c.start + 6, 12)}><Ink d="M420 420 L760 420 L760 560 L420 560 Z" color={IVORY} /><Word x={590} y={505} size={38} text="LỜI KHEN" opacity={1} /></g>
    <g opacity={appear(c.frame, at(c, 6, .9), 12)}><Word x={960} y={505} size={48} text="VÀ" opacity={1} /><Glow x={960} y={490} r={120} opacity={.55} /></g>
    <g opacity={appear(c.frame, at(c, 7, .5), 12)}><Ink d="M1160 420 L1500 420 L1500 560 L1160 560 Z" /><Word x={1330} y={505} size={38} text="GÓP Ý" opacity={1} /></g>
  </g>},
], options);

// 5 Nhận xét chung (lines-09-nhan-xet.txt): the book closes; two people facing each other; the book lies on a table
// with a bookmark sticking out.
export const NhanXet = section('09 nhận xét', /(khéo léo|lời nhắc|chú ý đến người khác|giữ lại được vài điều|đọc chậm|đáng giữ)/gi, [
  {at: 0, draw: (c) => {const shut = interpolate(c.frame, [c.start + 20, c.start + 60], [1, .08], {...clamp, easing: ease});return <g transform={`translate(960 600) scale(${shut} 1) translate(-960 -600)`}><Ink d={openBook(960, 560, 1.4)} w={2.6} o={appear(c.frame, c.start, 12)} /></g>;}},
  {at: 1, draw: (c) => <g>{two(c, c.start + 4)}<Glow x={960} y={560} r={220} opacity={appear(c.frame, at(c, 1, .3), 20) * .4} /></g>},
  {at: 2, draw: (c) => <g>
    {D(c, 'M560 700 L1360 700 M600 700 L600 800 M1320 700 L1320 800', 0, 22, 2.4, .85)}
    <Ink d={closedBook(960, 640, 300, 110)} w={2.6} o={appear(c.frame, c.start + 10, 12)} />
    <Ink d="M1060 590 L1060 540 L1090 540 L1090 590" w={2.4} o={appear(c.frame, at(c, 2, .7), 12)} />
  </g>},
], options);
