import type {FC} from 'react';
import {interpolate} from 'remotion';
import {GOLD, IVORY, clamp, ease} from '../book-hvtt-001-overview/Intro';
import {Figure, appear} from '../book-hvtt-001-overview/scene-kit';
import {D, ShortFrame, W, shortMetadata} from './ShortFrame';
import type {SBeat, ShortProps} from './ShortFrame';

// The three shorts of episode 1, redrawn for the vertical frame with episode 1's content (image-prompts.md). Beat
// times are seconds inside each excerpt (sentence starts of the published take).
const SERIES = {seriesLabel: 'ĐỌC SÁCH, HIỂU MÌNH', bookLine: 'Hiểu về trái tim · Minh Niệm', episodeLabel: 'TẬP 01', bookTitle: 'Hiểu về trái tim', bookAuthor: 'Minh Niệm'};

// Short 1 · Vốc muối và dòng sông (take 07-nhom-3c-sang2, 4.48–21.12 s).
// 0 CHỊU over its meaning, ĐỰNG under it · 5.0 salt falls into a bowl, "mặn chát" · 10.4 salt falls into a river
// below, "vẫn uống được" · 13.9 the banks open wide.
const grains = (from: number, x: number, y0: number, y1: number, frame: number) => Array.from({length: 12}, (_, i) => {
  const fall = interpolate(frame, [from + i * 3, from + i * 3 + 16], [0, 1], {...clamp, easing: ease});
  return <circle key={i} cx={x + Math.sin(i * 2.3) * 30} cy={y0 + (y1 - y0) * fall + (i % 3) * 6} r={6} fill={IVORY} opacity={appear(frame, from + i * 3, 4) * (1 - appear(frame, from + i * 3 + 18, 10) * .7)} />;
});
const SALT: SBeat[] = [
  {at: 0, draw: (c) => <g>
    {W(520, 680, 140, 'CHỊU', appear(c.frame, c.start + 6, 14))}
    {W(520, 770, 52, 'đồng ý chấp nhận', appear(c.frame, c.t(1), 12), GOLD)}
    {D(c, 'M360 850 L680 850', 10, 16, 2.4, .8)}
    {W(520, 1030, 140, 'ĐỰNG', appear(c.frame, c.t(2.4), 14))}
    {W(520, 1120, 52, 'khả năng dung chứa', appear(c.frame, c.t(3.6), 12), GOLD)}
  </g>},
  {at: 5.02, draw: (c) => {const wide = interpolate(c.frame, [c.t(13.86), c.t(13.86) + 40], [0, 1], {...clamp, easing: ease}), w = 220 + wide * 130;
    const bank = (dir: number) => `M${520 + dir * w} 900 C${520 + dir * (w + 60)} 1000 ${520 + dir * (w - 60)} 1120 ${520 + dir * w} 1200 C${520 + dir * (w + 50)} 1260 ${520 + dir * w} 1300 ${520 + dir * (w + 20)} 1330`;
    return <g>
      {D(c, 'M330 600 C330 800 710 800 710 600 Z M352 650 C420 638 470 662 520 650 C570 638 620 662 688 650', 6, 26, 2.8)}
      {grains(c.t(6.2), 520, 470, 640, c.frame)}
      {W(520, 830, 50, 'mặn chát', appear(c.frame, c.t(8.4), 12))}
      <g opacity={appear(c.frame, c.t(10.2), 16)}>
        <path d={`${bank(-1)} ${bank(1)}`} fill="none" stroke={GOLD} strokeWidth={2.8} strokeLinecap="round" />
        {[0, 1, 2, 3].map((k) => {const y = 930 + ((c.frame * 2 + k * 37) % 120);return <path key={k} d={`M${k % 2 ? 610 : 430} ${y} l0 26`} stroke={IVORY} strokeWidth={2.4} strokeLinecap="round" opacity={.75} />;})}
      </g>
      {grains(c.t(10.6), 520, 860, 1000, c.frame)}
      {W(520, 1275, 48, 'vẫn uống được', appear(c.frame, c.t(12.3), 12), GOLD)}
      <circle cx={520} cy={1150} r={200 + wide * 160} fill="url(#short-glow)" opacity={wide * .8} />
    </g>;}},
];

// Short 2 · Đau và khổ khác nhau (take 04-soi-chi-sang2, 0–24.16 s).
// 0 fifty beads strung down one thread · 3.4 a pebble drops into a pond, rings spread (the heart's reaction)
// 9.3 two words rise from an open book, 13.3 ĐAU above KHỔ, split by a line · 18.1 pain: a scratched palm;
// 19.7 suffering: a seated figure holding their head, thoughts circling.
const threadX = (y: number) => 520 + Math.sin((y - 480) / 150 * Math.PI) * 34;
const PAIN: SBeat[] = [
  {at: 0, draw: (c) => <g>
    {D(c, 'M' + Array.from({length: 43}, (_, i) => `${threadX(480 + i * 20)} ${480 + i * 20}`).join(' L'), 0, 40, 2.6)}
    {Array.from({length: 50}, (_, i) => {const y = 500 + i * 16.4;return <circle key={i} cx={threadX(y)} cy={y} r={7} fill="none" stroke={GOLD} strokeWidth={2.4} opacity={appear(c.frame, c.start + 8 + i, 6)} />;})}
  </g>},
  {at: 3.44, draw: (c) => {const drop = interpolate(c.frame, [c.t(5.4), c.t(6.6)], [0, 1], {...clamp, easing: (x) => x * x});return <g>
    {D(c, 'M160 1100 C160 1000 880 1000 880 1100 C880 1200 160 1200 160 1100 Z', 0, 26, 2.8)}
    <circle cx={520} cy={520 + drop * 560} r={20} fill="none" stroke={IVORY} strokeWidth={2.8} opacity={appear(c.frame, c.start + 14, 10) * (1 - appear(c.frame, c.t(6.6), 6))} />
    {[0, 1, 2, 3].map((k) => {const r = interpolate(c.frame, [c.t(6.6) + k * 10, c.t(6.6) + 70 + k * 10], [10, 90 + k * 70], {...clamp, easing: ease});
      return <ellipse key={k} cx={520} cy={1100} rx={r} ry={r * .28} fill="none" stroke={k % 2 ? IVORY : GOLD} strokeWidth={2.4} opacity={appear(c.frame, c.t(6.6) + k * 10, 6) * (1 - k * .15)} />;})}
  </g>;}},
  {at: 9.32, draw: (c) => {const rise = interpolate(c.frame, [c.t(9.8), c.t(11.4)], [0, 1], {...clamp, easing: ease}), split = interpolate(c.frame, [c.t(13.34), c.t(13.34) + 30], [0, 1], {...clamp, easing: ease});
    return <g>
      <g opacity={1 - split}>{D(c, 'M520 1300 C450 1270 360 1268 290 1286 L290 1200 C360 1182 450 1184 520 1214 C590 1184 680 1182 750 1200 L750 1286 C680 1268 590 1270 520 1300 Z M520 1214 L520 1300', 0, 26, 2.8)}</g>
      {W(320 + split * 200, 1180 - rise * 260 - split * 120, 110 + split * 30, 'ĐAU', appear(c.frame, c.t(9.8), 10))}
      {W(720 - split * 200, 1180 - rise * 260 + split * 220, 110 + split * 30, 'KHỔ', appear(c.frame, c.t(10.2), 10))}
      <path d="M340 860 L700 860" stroke={GOLD} strokeWidth={2.6} opacity={split} />
    </g>;}},
  {at: 18.14, draw: (c) => {const think = appear(c.frame, c.t(19.74), 16), spin = (c.frame - c.t(19.74)) / 14;return <g>
    {D(c, 'M440 800 L440 640 C440 620 470 620 470 640 L470 590 C470 570 500 570 500 590 L500 580 C500 560 530 560 530 580 L530 595 C530 575 560 575 560 595 L560 700 C590 660 625 668 606 710 L560 800 Z', 0, 26, 2.8)}
    {D(c, 'M478 700 L516 666 M488 716 L526 682', 18, 10, 3, 1, IVORY)}
    {W(520, 880, 48, 'đau: điều xảy đến', appear(c.frame, c.start + 20, 12), GOLD)}
    <g opacity={think}>
      <Figure frame={c.frame} from={c.t(19.74)} x={500} y={1330} s={1} pose="headHold" />
      {[0, 1, 2].map((k) => {const a = spin + k * 2.1;return <circle key={k} cx={500 + Math.cos(a) * 90} cy={1080 + Math.sin(a) * 40} r={14} fill="none" stroke={IVORY} strokeWidth={2.4} opacity={.85} />;})}
    </g>
    {W(520, 990, 48, 'khổ: nghĩ đi nghĩ lại', think, GOLD)}
  </g>;}},
];

// Short 3 · Gọi mãi không nghe máy (take 05-nhom-3a-sang2, 26.84–45.30 s).
// 0 a clock spinning fast above a phone calling with no answer · 5.0 a seated figure, a thought bubble swelling above
// with two cars heading for each other (no crash drawn); dims for the quote · 13.8 the bubble shrinks to a question
// mark and fades; 17.2 the door opens and the one they waited for walks in.
const car = (x: number, dir: number) => `M${x - 70 * dir} 820 L${x - 70 * dir} 790 L${x - 40 * dir} 760 L${x + 30 * dir} 760 L${x + 60 * dir} 790 L${x + 75 * dir} 795 L${x + 75 * dir} 820 Z`;
const PHONE: SBeat[] = [
  {at: 0, draw: (c) => {const spin = (c.frame - c.start) * .35;return <g>
    {D(c, 'M640 620 m-110 0 a110 110 0 1 0 220 0 a110 110 0 1 0 -220 0', 0, 22, 2.8)}
    {Array.from({length: 12}, (_, k) => {const a = k / 12 * Math.PI * 2;return <path key={k} d={`M${640 + Math.cos(a) * 92} ${620 + Math.sin(a) * 92} L${640 + Math.cos(a) * (k % 3 ? 100 : 84)} ${620 + Math.sin(a) * (k % 3 ? 100 : 84)}`} stroke={GOLD} strokeWidth={2.6} strokeLinecap="round" opacity={appear(c.frame, c.start + 10 + k, 6)} />;})}
    <circle cx={640} cy={620} r={6} fill={GOLD} opacity={appear(c.frame, c.start + 14, 10)} />
    <path d={`M640 620 L${640 + Math.cos(spin) * 80} ${620 + Math.sin(spin) * 80} M640 620 L${640 + Math.cos(spin / 12) * 55} ${620 + Math.sin(spin / 12) * 55}`} stroke={IVORY} strokeWidth={3} strokeLinecap="round" opacity={appear(c.frame, c.start + 14, 10)} />
    {D(c, 'M340 820 L340 1260 C340 1290 360 1300 380 1300 L620 1300 C640 1300 660 1290 660 1260 L660 820 C660 790 640 780 620 780 L380 780 C360 780 340 790 340 820 Z M470 1270 L530 1270', 8, 26, 2.8)}
    {W(500, 960, 44, 'Đang gọi…', appear(c.frame, c.t(1.6), 10) * (1 - appear(c.frame, c.t(2.9), 10)))}
    {W(500, 960, 44, 'Không trả lời', appear(c.frame, c.t(2.9), 10), GOLD)}
    {[0, 1].map((k) => <path key={k} d={`M${700 + k * 30} ${980 - k * 10} C${730 + k * 30} ${1010} ${730 + k * 30} ${1050} ${700 + k * 30} ${1080 + k * 10}`} fill="none" stroke={GOLD} strokeWidth={2.4} strokeLinecap="round" opacity={appear(c.frame, c.t(1.6), 10) * (1 - appear(c.frame, c.t(2.9), 10)) * (.5 + .5 * Math.sin(c.frame / 4))} />)}
  </g>;}},
  {at: 4.98, draw: (c) => {const swell = interpolate(c.frame, [c.start + 6, c.t(6.6)], [.3, 1], {...clamp, easing: ease}), drive = interpolate(c.frame, [c.t(6), c.t(7.6)], [0, 1], {...clamp, easing: ease});
    const dim = 1 - appear(c.frame, c.t(7.62), 20) * .3, shrink = interpolate(c.frame, [c.t(15.4), c.t(16.6)], [1, .25], {...clamp, easing: ease}), gone = appear(c.frame, c.t(16.9), 12);
    const door = interpolate(c.frame, [c.t(17.2), c.t(17.2) + 24], [0, 1], {...clamp, easing: ease}), enter = interpolate(c.frame, [c.t(17.5), c.t(18.4)], [0, 1], {...clamp, easing: ease});
    return <g>
      <Figure frame={c.frame} from={c.start + 4} x={260} y={1330} s={1} pose="sit" />
      {[0, 1, 2].map((k) => <circle key={k} cx={330 + k * 40} cy={1030 - k * 50} r={8 + k * 5} fill="none" stroke={IVORY} strokeWidth={2.4} opacity={appear(c.frame, c.start + 10 + k * 5, 8) * dim * (1 - gone)} />)}
      <g transform={`translate(520 780) scale(${swell * shrink}) translate(-520 -780)`} opacity={dim * (1 - gone)}>
        <ellipse cx={520} cy={780} rx={340} ry={220} fill="rgba(13,20,17,.6)" stroke={GOLD} strokeWidth={2.8 / (swell * shrink)} />
        <g opacity={1 - appear(c.frame, c.t(15.2), 10)}>
          <path d={`${car(300 + drive * 110, 1)} ${car(740 - drive * 110, -1)}`} fill="none" stroke={IVORY} strokeWidth={2.6 / swell} strokeLinejoin="round" opacity={appear(c.frame, c.t(5.8), 10)} />
          <path d="M520 700 L520 730 M500 680 L486 660 M540 680 L554 660" stroke={GOLD} strokeWidth={3 / swell} strokeLinecap="round" opacity={appear(c.frame, c.t(7.4), 8)} />
        </g>
        {W(520, 840, 200, '?', appear(c.frame, c.t(15.2), 12), GOLD)}
      </g>
      <g opacity={appear(c.frame, c.t(16.8), 14)}>
        <path d="M640 1330 L640 860 L860 860 L860 1330" fill="none" stroke={GOLD} strokeWidth={2.8} strokeLinejoin="round" />
        <path d={`M640 860 L${640 + 220 * (1 - door * .8)} ${880} L${640 + 220 * (1 - door * .8)} 1310 L640 1330`} fill="rgba(13,20,17,.4)" stroke={GOLD} strokeWidth={2.4} strokeLinejoin="round" />
        <g opacity={enter}><Figure frame={c.frame} from={c.t(17.5)} x={830 - enter * 60} y={1330} s={.95} facing={-1} pose={enter > 0 && enter < 1 ? 'walk' : 'stand'} color={IVORY} /></g>
      </g>
    </g>;}},
];

const make = (beats: SBeat[], highlight: RegExp): FC<ShortProps> => (p) => <ShortFrame {...p} {...SERIES} beats={beats} highlight={highlight} />;
export const ShortSalt = Object.assign(make(SALT, /(chịu đựng|chịu|đựng|vốc muối|dòng sông|lòng mình rộng ra|nhấn chìm|phần bình luận|Hiểu về trái tim)/gi), {metadata: shortMetadata});
export const ShortPain = Object.assign(make(PAIN, /(khổ mãi|một ý|cách lòng mình phản ứng|đau và khổ|chống lại|nghĩ đi nghĩ lại|phần bình luận|Hiểu về trái tim)/gi), {metadata: shortMetadata});
export const ShortPhone = Object.assign(make(PHONE, /(chưa hề xảy ra|gọi mãi|tai nạn|trí tưởng tượng sai lầm|đã thật sự xảy ra chưa|phần bình luận|Hiểu về trái tim)/gi), {metadata: shortMetadata});
