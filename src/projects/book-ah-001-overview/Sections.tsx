import {interpolate} from 'remotion';
import {GOLD, IVORY, clamp, ease} from '../book-hvtt-001-overview/Intro';
import {Draw, Figure, Glow, Word, appear, section, takesOf, within} from '../book-hvtt-001-overview/scene-kit';
import type {Ctx} from '../book-hvtt-001-overview/scene-kit';
import takes from './body-takes.json';

// Body parts of episode 2 (Thay đổi tí hon hiệu quả bất ngờ) on the series scene-kit (image-prompts.md). Each beat
// names the sentence (0-based, scripts/projects/book-ah-001-overview/lines-<segment>.txt) where its drawing starts.
// Lessons from episode 1: one complete drawing per idea that grows inside its scene (few cuts), nothing drawn over
// a figure, no impact shown, quotes only where the line is a verified quote.
const options = {takes: takesOf(takes), quoteSource: 'Thay đổi tí hon hiệu quả bất ngờ, James Clear'};
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
      {D(c, 'M960 800 L1180 650 L960 500 L740 650 Z', 0, 30, 2, .6)}
      {D(c, 'M640 800 C700 420 1220 420 1280 800', 8, 34, 2, .45)}
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
        <text x={1290} y={366} textAnchor="middle" fill={IVORY} fontSize={24} fontWeight={700}>THÁNG</text>
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
        <g opacity={1 - car * .2}><Figure frame={c.frame} from={c.at(5)} x={bx} y={760} s={.8} color={IVORY} pose={car > .5 ? 'sit' : out > 0 && out < 1 ? 'walk' : 'stand'} /></g>
      </g>
      <g opacity={car}>
        <path d={`M${bx - 150} 760 L${bx - 150} 640 C${bx - 120} 580 ${bx - 60} 560 ${bx} 560 C${bx + 70} 560 ${bx + 120} 590 ${bx + 150} 640 L${bx + 150} 760 Z`} fill="none" stroke={GOLD} strokeWidth={2.4} strokeLinejoin="round" />
        {[0, 1, 2, 3, 4].map((k) => {const y = ((c.frame * 4 + k * 37) % 70);return <path key={k} d={`M${bx - 80 + k * 38} ${572 + y} l-6 18`} stroke={IVORY} strokeWidth={1.6} opacity={.55} />;})}
      </g>
    </g>;}},
  {at: 7, draw: (c) => {const halves = appear(c.frame, c.at(8), 16), warm = appear(c.frame, c.at(9), 30), spread = appear(c.frame, within(c, 10, .2), 24);return <g>
    {D(c, 'M520 360 L1400 360 L1400 760 L520 760 Z M960 360 L960 760', 0, 30, 2.4, .9)}
    <g opacity={halves}>
      {[[560, 520, 640, 500], [620, 640, 700, 690], [700, 420, 780, 460], [820, 560, 900, 600], [580, 720, 660, 700], [860, 680, 920, 730]].map(([x1, y1, x2, y2], k) => <path key={k} d={`M${x1} ${y1} L${x2} ${y2}`} stroke={IVORY} strokeWidth={2} opacity={.5} />)}
      <path d="M700 590 C700 570 790 570 790 590 L790 610 C790 630 700 630 700 610 Z M725 600 L745 600 M735 590 L735 610 M765 596 L768 596" fill="none" stroke={IVORY} strokeWidth={2} opacity={.6} />
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
    <Word x={960} y={300} size={30} text="THAY ĐỔI NHỎ · KẾT QUẢ LỚN" opacity={appear(c.frame, within(c, 13, .7), 14) * .9} />
  </g>},
], options);
