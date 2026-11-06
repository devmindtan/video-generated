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

// 0b Mở chuyện: Lincoln's letter that was never sent, in six growing scenes (image-prompts.md 0b).
// 0      an envelope on a desk, flap not sealed
// 1–2    young Lincoln (stovepipe hat) with a newspaper flying from his hand; the challenger appears far off and a third
//        hand rises between them (no swords); then the challenger fades and Lincoln lays his pen down
// 3      a plain map: a river, an arrow slipping across it, a small flag that stays put
// 4–6    a desk: the letter written in heavy lines; slid to the edge with the pen down; a drawer opens with the
//        letter lying in it, dim light
// 7      "the author guesses": an arrow flies off and turns back; a thin question mark marks it as a guess
// 8–9    the first principle in large letters; then two figures face each other with a large question mark between
export const MoChuyen = section('02 mở chuyện', /(lá thư chưa bao giờ được gửi đi|chế giễu|thách đấu kiếm|thôi hẳn chuyện chỉ trích|tướng Meade|trách móc rất nặng lời|không gửi|tìm thấy|đoán|hả giận|bào chữa|nguyên tắc đầu tiên|không chỉ trích, oán trách hay than phiền|lời chê trách)/gi, [
  {at: 0, draw: (c) => <g>
    {D(c, desk(560, 1360, 700), 0, 30, 2.4, .85)}
    {D(c, envelope(960, 600), 10, 30, 2.6)}
    <Glow x={960} y={600} r={200} opacity={appear(c.frame, c.start + 30, 24) * .45} />
  </g>},
  {at: 1, draw: (c) => {
    const paper = interpolate(c.frame, [within(c, 1, .12), within(c, 1, .4)], [0, 1], {...clamp, easing: ease});
    const rival = appear(c.frame, within(c, 1, .45), 16) * (1 - appear(c.frame, c.at(2), 16));
    const stop = appear(c.frame, within(c, 1, .78), 14) * (1 - appear(c.frame, c.at(2), 16));
    const calm = appear(c.frame, c.at(2), 18);
    return <g>
      <g opacity={appear(c.frame, c.start + 4, 14)}>
        <Figure frame={c.frame} from={c.start + 4} x={620} y={800} s={1} arm={calm > .5 ? 'down' : 'reach'} />
        {D(c, hat(620, 800), 16, 18, 2.6)}
      </g>
      {/* The newspaper leaves his hand and drifts right; it fades when the challenge comes. */}
      <g transform={`translate(${760 + paper * 220} ${520 - paper * 120}) rotate(${-8 + paper * 22})`} opacity={paper * (1 - rival * .8) * (1 - calm)}>
        <path d="M-70 -50 L70 -50 L70 50 L-70 50 Z M-50 -26 L50 -26 M-50 -4 L50 -4 M-50 18 L20 18" fill="none" stroke={IVORY} strokeWidth={2.4} strokeLinejoin="round" />
      </g>
      <g opacity={rival}><Figure frame={c.frame} from={within(c, 1, .45)} x={1360} y={800} s={1} facing={-1} arm="point" /></g>
      {/* A third person's raised open hand between the two: the quarrel is stopped. */}
      <g opacity={stop}>
        <path d="M990 760 L990 560 M990 560 C990 530 1000 520 1012 520 C1024 520 1030 530 1030 548 L1030 470 C1030 456 1048 456 1048 470 L1048 540 M1048 470 L1048 452 C1048 438 1066 438 1066 452 L1066 540 M1066 460 C1066 446 1084 446 1084 460 L1084 548 M1084 476 C1084 464 1100 464 1100 476 L1100 580 C1100 640 1070 680 1030 690 L990 700" fill="none" stroke={GOLD} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* "Sau lần đó…": the pen is laid down on a small table beside him. */}
      <g opacity={calm}>
        <path d="M720 690 L980 690 M745 690 L745 800 M955 690 L955 800" fill="none" stroke={GOLD} strokeWidth={2.4} strokeLinecap="round" />
        <path d={quill(760, 676)} fill="none" stroke={IVORY} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>;
  }},
  {at: 3, draw: (c) => {
    const slip = interpolate(c.frame, [within(c, 3, .45), within(c, 3, .95)], [0, 1], {...clamp, easing: ease});
    return <g>
      {D(c, 'M560 300 L1360 300 L1360 800 L560 800 Z', 0, 26, 2.2, .7)}
      {D(c, 'M900 300 C860 420 980 520 930 620 C890 700 960 760 940 800', 8, 30, 3.2)}
      {D(c, 'M916 300 C876 420 996 520 946 620 C906 700 976 760 956 800', 12, 30, 1.8, .6)}
      {/* The flag that stays on this side of the river. */}
      <g opacity={appear(c.frame, within(c, 3, .2), 14)}>
        <path d="M680 640 L680 480 M680 480 L780 506 L680 532" fill="none" stroke={GOLD} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* The arrow that slips across the river and away. */}
      <g opacity={appear(c.frame, within(c, 3, .4), 12)} transform={`translate(${slip * 260} 0)`}>
        <path d="M820 560 L1040 560 M1010 534 L1040 560 L1010 586" fill="none" stroke={IVORY} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>;
  }},
  {at: 4, draw: (c) => {
    const aside = interpolate(c.frame, [within(c, 5, .1), within(c, 5, .6)], [0, 1], {...clamp, easing: ease});
    const drawer = appear(c.frame, c.at(6), 20);
    // Heavy lines of the angry letter, written one after another during sentence 4 (no cross-out: it was not cancelled).
    const lines = [0, 1, 2, 3, 4, 5].map((k) => `M${850} ${340 + k * 40} L${1030 - (k % 3) * 30} ${340 + k * 40}`);
    return <g>
      {D(c, desk(520, 1400, 640), 0, 26, 2.4, .85)}
      <g transform={`translate(${aside * 300} 0)`} opacity={1 - drawer}>
        {D(c, sheet(830, 300, 260, 320), 6, 22, 2.4)}
        {lines.map((d, k) => DA(c, d, within(c, 4, .15 + k * .12), 10, 3.4, .95))}
      </g>
      <g opacity={appear(c.frame, within(c, 5, .45), 14) * (1 - drawer)}><path d={quill(600, 626)} fill="none" stroke={IVORY} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /></g>
      {/* The drawer under the desk opens: the letter lies in it, folded. */}
      <g opacity={drawer}>
        <path d="M760 672 L1160 672 L1160 760 L760 760 Z M760 760 L720 800 L1120 800 L1160 760 M920 730 L1000 730" fill="none" stroke={GOLD} strokeWidth={2.6} strokeLinejoin="round" />
        <path d="M800 690 L1000 690 L1000 720 L800 720 Z M800 690 L900 708 L1000 690" fill="none" stroke={IVORY} strokeWidth={2.4} strokeLinejoin="round" />
        <Glow x={900} y={705} r={160} opacity={drawer * .4} />
      </g>
    </g>;
  }},
  {at: 7, draw: (c) => {
    const go = interpolate(c.frame, [within(c, 7, .25), within(c, 7, .6)], [0, 1], {...clamp, easing: ease});
    const back = interpolate(c.frame, [within(c, 7, .65), within(c, 7, .95)], [0, 1], {...clamp, easing: ease});
    const x = 760 + go * 380 - back * 380, flip = back > 0 ? -1 : 1;
    return <g>
      <g opacity={appear(c.frame, c.start + 4, 14)}><Figure frame={c.frame} from={c.start + 4} x={560} y={800} s={.95} />{D(c, hat(560, 800, .95), 14, 16, 2.6)}</g>
      <g opacity={appear(c.frame, c.start + 10, 14)}><Figure frame={c.frame} from={c.start + 10} x={1360} y={800} s={.95} facing={-1} /></g>
      {/* The guess is marked as a guess: a thin question mark over the scene. */}
      <g opacity={appear(c.frame, c.start + 18, 16) * .9}>
        <path d="M940 300 C940 260 1000 250 1000 290 C1000 320 960 320 960 350 M960 380 L960 384" fill="none" stroke={IVORY} strokeWidth={2.2} strokeLinecap="round" />
      </g>
      <g opacity={appear(c.frame, within(c, 7, .2), 10)} transform={`translate(${x} 540) scale(${flip} 1)`}>
        <path d="M-60 0 L60 0 M34 -22 L60 0 L34 22" fill="none" stroke={back > 0 ? IVORY : GOLD} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>;
  }},
  {at: 8, draw: (c) => {
    const question = appear(c.frame, c.at(9), 18);
    return <g>
      <g opacity={1 - question}>
        {D(c, 'M640 360 L1280 360', 0, 20, 2, .6)}
        <Word x={960} y={470} size={64} text="KHÔNG CHỈ TRÍCH," opacity={appear(c.frame, within(c, 8, .64), 12)} />
        <Word x={960} y={570} size={64} text="OÁN TRÁCH HAY THAN PHIỀN" opacity={appear(c.frame, within(c, 8, .8), 12)} />
        {D(c, 'M640 640 L1280 640', 6, 20, 2, .6)}
      </g>
      <g opacity={question}>
        <Figure frame={c.frame} from={c.at(9)} x={600} y={800} s={.95} />
        <Figure frame={c.frame} from={c.at(9) + 4} x={1320} y={800} s={.95} facing={-1} />
        <g opacity={appear(c.frame, within(c, 9, .55), 18)}>
          <path d="M920 360 C920 290 1020 280 1020 350 C1020 400 960 410 960 470 M960 530 L960 536" fill="none" stroke={GOLD} strokeWidth={4} strokeLinecap="round" />
        </g>
        <Glow x={960} y={460} r={190} opacity={appear(c.frame, within(c, 9, .6), 24) * .5} />
      </g>
    </g>;
  }},
], options);
