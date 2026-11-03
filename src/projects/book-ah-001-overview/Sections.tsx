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

// 0b Mở chuyện.
// 0–1 a baseball field; the batter swings, the bat slips and spins away toward the boy at right (a flash, no impact)
// 2 a hospital window, a wall calendar turning month after month
// 3–4 a staircase: four small habits appear over the first steps (moon, made bed, book, dumbbell), then the boy climbs
// 5–6 one gold dot with rings spreading wider and wider, an open book under it for "cả cuốn sách"
export const MoChuyen = section('02 mở chuyện', /(chuyện của chính tác giả|gậy bóng chày|hồi phục|những việc rất nhỏ|sáu năm sau|không ngờ|làm được điều đó)/gi, [
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
  {at: 2, draw: (c) => {const months = Math.min(6, Math.floor(interpolate(c.frame, [within(c, 2, .45), c.at(3) - 14], [1, 7], clamp)));return <g>
    {D(c, 'M640 300 L1040 300 L1040 640 L640 640 Z M840 300 L840 640 M640 470 L1040 470', 0, 30, 2.6)}
    <Glow x={840} y={470} r={240} opacity={appear(c.frame, c.start + 20, 30) * .5} />
    {D(c, 'M1220 330 L1440 330 L1440 560 L1220 560 Z M1220 380 L1440 380 M1270 310 L1270 350 M1390 310 L1390 350', 10, 24, 2.4)}
    <text x={1330} y={500} textAnchor="middle" fill={GOLD} fontSize={96} fontWeight={700} opacity={appear(c.frame, within(c, 2, .45), 10)}>{months}</text>
    <text x={1330} y={366} textAnchor="middle" fill={IVORY} fontSize={24} fontWeight={700} opacity={appear(c.frame, c.start + 30, 10)}>THÁNG</text>
  </g>;}},
  {at: 3, draw: (c) => {const climb = interpolate(c.frame, [within(c, 4, .15), within(c, 4, .75)], [0, 1], {...clamp, easing: ease}), step = 4 * climb;
    const steps = 'M520 800 L680 800 L680 720 L840 720 L840 640 L1000 640 L1000 560 L1160 560 L1160 480 L1320 480 L1320 400 L1480 400';
    // Drawn around (0, 0); each sits high above its step so the climbing figure never crosses it.
    const icons = [
      'M8 -26 C-22 -26 -34 4 -18 24 C-38 0 -24 -40 14 -30 Z',
      'M-40 -6 L40 -6 L40 22 L-40 22 Z M-40 -6 C-40 -22 -12 -22 -12 -6 M-40 22 L-40 32 M40 22 L40 32',
      'M-32 -18 C-12 -28 0 -28 0 -16 C0 -28 12 -28 32 -18 L32 22 C12 12 0 12 0 24 C0 12 -12 12 -32 22 Z M0 -16 L0 24',
      'M-30 0 L30 0 M-30 -16 L-30 16 M30 -16 L30 16 M-40 -9 L-40 9 M40 -9 L40 9',
    ];
    return <g>
      {D(c, steps, 0, 34, 2.6)}
      {icons.map((d, k) => <path key={k} d={d} transform={`translate(${600 + k * 160} ${520 - k * 80})`} fill="none" stroke={GOLD} strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" opacity={appear(c.frame, within(c, 3, .3 + k * .15), 10)} />)}
      <g opacity={appear(c.frame, within(c, 4, .05), 12)}><Figure frame={c.frame} from={within(c, 4, .05)} x={600 + step * 160} y={800 - step * 80} s={.75} pose={climb > 0 && climb < 1 ? 'walk' : 'stand'} /></g>
      <Glow x={1400} y={360} r={170} opacity={appear(c.frame, within(c, 4, .8), 20) * .8} />
    </g>;}},
  {at: 5, draw: (c) => <g>
    <circle cx={960} cy={500} r={10} fill={GOLD} opacity={appear(c.frame, c.start + 4, 10)} />
    {[0, 1, 2, 3].map((k) => {const r = interpolate(c.frame, [c.start + 10 + k * 18, c.start + 110 + k * 18], [10, 90 + k * 70], {...clamp, easing: ease});
      return <circle key={k} cx={960} cy={500} r={r} fill="none" stroke={k % 2 ? IVORY : GOLD} strokeWidth={2} opacity={appear(c.frame, c.start + 10 + k * 18, 10) * (1 - k * .18)} />;})}
    <g opacity={appear(c.frame, c.at(6), 18)}>
      <path d="M960 800 C890 770 800 768 730 786 L730 700 C800 682 890 684 960 714 C1030 684 1120 682 1190 700 L1190 786 C1120 768 1030 770 960 800 Z M960 714 L960 800" fill="none" stroke={GOLD} strokeWidth={2.6} strokeLinejoin="round" />
    </g>
    <Word x={960} y={300} size={30} text="THAY ĐỔI NHỎ · KẾT QUẢ LỚN" opacity={appear(c.frame, within(c, 5, .6), 14) * .9} />
  </g>},
], options);
