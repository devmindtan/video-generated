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
