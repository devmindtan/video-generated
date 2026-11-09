import type {CSSProperties, FC, ReactNode} from 'react';
import {useMemo} from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Img, Sequence, Track, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CalculateMetadataFunction} from 'remotion';
import '../../shared/stoic-fonts';
import {MusicFade} from '../../shared/MusicFade';
import {clamp, ease} from '../book-hvtt-001-overview/Intro';
import {Draw, appear} from '../book-hvtt-001-overview/scene-kit';
import {Captions, timelineWith} from '../book-hvtt-001-shorts/ShortFrame';
import type {ShortData, ShortProps} from '../book-hvtt-001-shorts/ShortFrame';
import {BookDntThumbnail} from '../book-dnt-001-overview/Thumbnail';
import music from './music.json';
import data from './shorts.json';
import layout from './layout.json';

// The four promo shorts of episode 3 (docs/projects/book-dnt-001-shorts): opening line → excerpt of episode 3's
// accepted clone voice → invitation. Own look, not the long episode's (user 2026-11-09): "paper and ink" from the
// thumbnail F family — light paper, slate ink, the cover's red, gold — straight to the point, no stories or examples.
// Shared with the series' shorts kit: timing (timelineWith) and word-lit captions (Captions). Layout keeps YouTube's
// buttons and title clear: drawings in y 460–1340, x 80–940; captions on a dark band in y 1370–1580. The opening line
// shows whole and fully lit from the first frame over a drawing of the short's own subject (series rule 2026-11-05),
// and that drawing repeats the chosen cover so the cover and the first second match.
// Placeholder phase: opening lines and invitation in the preset voice Quốc Tuấn (shorts.json "placeholder"); the clone
// replaces them after the user picks it (build-shorts.py), timings follow the new durations.
const SLATE = '#2b3a44', RED = '#a3241b', GOLD = '#c99a45', GOLD_HI = '#e9c77e', BROWN = '#7a5a22', IVORY = '#fbf6ea', BOARD = '#1f2a31', NOTE = '#f6e7b8';
const COVER = staticFile('book-dnt-001-overview/thumbnail/book-cover-source.webp');
const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .45 0 0 0 0 .38 0 0 0 0 .28 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";
const shorts = (data as unknown as {shorts: ShortData[]}).shorts;
const shortOf = (id: string) => shorts.find((s) => s.id === id) ?? shorts[0];
const timeline = timelineWith(layout);
export const dntShortMetadata: CalculateMetadataFunction<ShortProps> = ({props}) => ({durationInFrames: timeline(shortOf(props.short)).total});

// Drawing context: t(s) is the frame where the excerpt reaches s seconds; start is the beat's first frame.
type C = {frame: number; start: number; t: (s: number) => number};
type Beat = {at: number; draw: (c: C) => ReactNode};
const ink = (c: C, d: string, from: number, len = 18, width = 5, color = SLATE, opacity = 1) =>
  <Draw key={d + from} d={d} frame={c.frame} from={from} to={from + len} width={width} color={color} opacity={opacity} />;
const on = (c: C, sec: number, len = 12) => appear(c.frame, c.t(sec) - 4, len);
const between = (c: C, a: number, b: number) => interpolate(c.frame, [c.t(a), c.t(b)], [0, 1], {...clamp, easing: ease});
const T = (x: number, y: number, size: number, text: string, opacity = 1, color = SLATE, anchor: 'middle' | 'start' | 'end' = 'middle') =>
  <text x={x} y={y} textAnchor={anchor} fill={color} fontSize={size} fontWeight={700} opacity={opacity}>{text}</text>;
// A faceless figure (head and shoulders), standing on y = base.
const figure = (x: number, base: number, s = 1, opacity = 1, arms: 'down' | 'crossed' | 'open' = 'down') => <g opacity={opacity}>
  <circle cx={x} cy={base - 300 * s} r={44 * s} fill={IVORY} stroke={SLATE} strokeWidth={5} />
  <path d={`M${x - 92 * s} ${base} C${x - 92 * s} ${base - 150 * s} ${x - 64 * s} ${base - 226 * s} ${x} ${base - 232 * s} C${x + 64 * s} ${base - 226 * s} ${x + 92 * s} ${base - 150 * s} ${x + 92 * s} ${base}`} fill={IVORY} stroke={SLATE} strokeWidth={5} strokeLinejoin="round" />
  {arms === 'crossed' ? <path d={`M${x - 70 * s} ${base - 120 * s} L${x + 50 * s} ${base - 150 * s} M${x + 70 * s} ${base - 120 * s} L${x - 50 * s} ${base - 150 * s}`} stroke={SLATE} strokeWidth={6} strokeLinecap="round" fill="none" /> : null}
  {arms === 'open' ? <path d={`M${x - 80 * s} ${base - 150 * s} C${x - 120 * s} ${base - 110 * s} ${x - 130 * s} ${base - 70 * s} ${x - 120 * s} ${base - 40 * s} M${x + 80 * s} ${base - 150 * s} C${x + 120 * s} ${base - 110 * s} ${x + 130 * s} ${base - 70 * s} ${x + 120 * s} ${base - 40 * s}`} stroke={SLATE} strokeWidth={6} strokeLinecap="round" fill="none" /> : null}
</g>;
// A split-flap tile (dark board, a seam across the middle); squash 0–1 folds it for a flip.
const tile = (x: number, y: number, w: number, h: number, letter: string, color: string, squash = 0, key?: string) =>
  <g key={key ?? `${x}${y}${letter}`} transform={`translate(${x + w / 2} ${y + h / 2}) scale(1 ${1 - .92 * squash}) translate(${-w / 2} ${-h / 2})`}>
    <rect width={w} height={h} rx={14} fill={BOARD} />
    <rect y={h / 2 - 2} width={w} height={4} fill="#0d1418" />
    <text x={w / 2} y={h * .72} textAnchor="middle" fill={color} fontSize={h * .62} fontWeight={700}>{letter}</text>
  </g>;
const block = (x: number, y: number, w: number, label: string, kind: 'khen' | 'nhung' | 've' | 'board', opacity = 1, key?: string) => {
  const fill = kind === 'khen' ? IVORY : kind === 'board' ? BOARD : kind === 'nhung' ? BOARD : IVORY;
  const stroke = kind === 'khen' ? GOLD : kind === 've' ? SLATE : 'none';
  const color = kind === 'nhung' ? '#e85a4a' : kind === 'board' ? GOLD_HI : SLATE;
  return <g key={key ?? label + y} opacity={opacity}><rect x={x} y={y} width={w} height={130} rx={18} fill={fill} stroke={stroke} strokeWidth={5} />
    {T(x + w / 2, y + 90, 68, label, 1, color)}</g>;
};
const note = (x: number, y: number, w: number, lines: [string, string], rot: number, opacity: number) =>
  <g opacity={opacity} transform={`rotate(${rot} ${x + w / 2} ${y + 90})`}>
    <rect x={x + 4} y={y + 10} width={w} height={170} fill="rgba(60,40,15,.18)" />
    <rect x={x} y={y} width={w} height={170} fill={NOTE} />
    <rect x={x + w / 2 - 60} y={y - 16} width={120} height={34} fill="rgba(220,210,190,.8)" />
    {T(x + w / 2, y + 72, 50, lines[0])}{T(x + w / 2, y + 136, 54, lines[1], 1, RED)}
  </g>;
const heartPath = (x: number, y: number, s: number) => `M${x} ${y + 60 * s} C${x - 70 * s} ${y + 14 * s} ${x - 86 * s} ${y - 40 * s} ${x - 50 * s} ${y - 58 * s} C${x - 26 * s} ${y - 70 * s} ${x - 6 * s} ${y - 56 * s} ${x} ${y - 36 * s} C${x + 6 * s} ${y - 56 * s} ${x + 26 * s} ${y - 70 * s} ${x + 50 * s} ${y - 58 * s} C${x + 86 * s} ${y - 40 * s} ${x + 70 * s} ${y + 14 * s} ${x} ${y + 60 * s} Z`;
const Cover: FC<{x: number; y: number; w: number; rot?: number; split?: boolean; opacity?: number}> = ({x, y, w, rot = 0, split = false, opacity = 1}) => {
  const h = w * 1600 / 1113;
  const img = (style: CSSProperties) => <Img src={COVER} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...style}} />;
  return <div style={{position: 'absolute', left: x, top: y, width: w, height: h, transform: `rotate(${rot}deg)`, opacity, borderRadius: 4, overflow: 'hidden', boxShadow: '0 3px 0 rgba(0,0,0,.08), 0 26px 40px rgba(60,40,15,.34), 0 50px 90px rgba(60,40,15,.2)'}}>
    {split ? <>{img({clipPath: 'inset(0 50% 0 0)', filter: 'grayscale(1) brightness(.7) contrast(1.05)'})}{img({clipPath: 'inset(0 0 0 50%)', filter: 'saturate(1.12) brightness(1.04)'})}
      <div style={{position: 'absolute', left: '50%', top: 0, bottom: 0, width: 6, marginLeft: -3, background: GOLD_HI, boxShadow: '0 0 14px rgba(233,199,126,.9)'}} /></> : img({filter: 'saturate(1.08)'})}
  </div>;
};

type ShortDef = {hook: RegExp; highlight: RegExp; split?: boolean; hookArt: (frame: number, fps: number) => ReactNode; hookCover?: (frame: number) => ReactNode; beats: Beat[]; covers?: (c: C, tl: {excerpt: number}) => ReactNode};

// ── Short 1 · Thắng cũng là thua (07-phan-3 32.20–46.60). Cover A: the cracked trophy.
const cup = (frame: number, dy: number, crack: number) => <g transform={`translate(0 ${dy}) rotate(-9 540 560)`}>
  <path d="M396 352 H684 C684 516 628 604 540 614 C452 604 396 516 396 352 Z" fill="rgba(201,154,69,.28)" stroke={SLATE} strokeWidth={6} strokeLinejoin="round" />
  <path d="M396 394 C318 394 316 512 418 528 M684 394 C762 394 764 512 662 528 M540 614 V690 M500 690 H580 M462 752 L478 690 H602 L618 752 Z" fill="none" stroke={SLATE} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
  <Draw d="M566 352 L538 426 L572 470 L532 538 L556 606" frame={frame} from={crack} to={crack + 22} width={7} color={RED} />
</g>;
const chip = (x: number, y: number, label: string, color: string, o: number) => <g opacity={o}><rect x={x} y={y} width={330} height={150} rx={18} fill={BOARD} />
  <rect x={x} y={y + 73} width={330} height={4} fill="#0d1418" />{T(x + 165, y + 108, 92, label, 1, color)}</g>;
const S1: ShortDef = {
  hook: /người thua/i, highlight: /thua|thắng|sai rồi/i,
  hookArt: (frame) => cup(frame, 470, 14),
  beats: [
    {at: 0, draw: (c) => <g>
      {figure(300, 1300, 1, appear(c.frame, c.start, 12))}{figure(780, 1300, 1, appear(c.frame, c.start + 4, 12))}
      {ink(c, 'M380 900 C420 820 520 800 580 840 L560 870 Z', c.t(1.7), 12, 5, SLATE)}{T(480, 860, 56, '!', on(c, 1.9), RED)}
      {ink(c, 'M700 880 C660 800 560 780 500 820 L520 850 Z', c.t(2.0), 12, 5, SLATE)}{T(600, 830, 56, '!', on(c, 2.2), RED)}
    </g>},
    {at: 2.6, draw: (c) => <g>
      {T(540, 700, 44, 'TRONG MỘT CUỘC TRANH CÃI', 1, BROWN)}
      {chip(110, 760, 'THUA', '#e85a4a', on(c, 2.82))}{ink(c, 'M470 835 H600 M570 805 L604 835 L570 865', c.t(3.2), 10, 6, SLATE)}{chip(640, 760, 'THUA', '#e85a4a', on(c, 3.56))}
      {chip(110, 990, 'THẮNG', GOLD_HI, on(c, 4.26))}{ink(c, 'M470 1065 H600 M570 1035 L604 1065 L570 1095', c.t(4.6), 10, 6, SLATE)}{chip(640, 990, 'THUA', '#e85a4a', on(c, 5.04))}
    </g>},
    {at: 5.42, draw: (c) => {const grip = between(c, 6.6, 7.4), apart = between(c, 6.2, 7.6);return <g>
      {figure(300 - 40 * apart, 1300, 1)}{figure(780 + 30 * apart, 1300, 1)}
      <rect x={720 + 30 * apart} y={1000} width={120} height={110} rx={10} fill={IVORY} stroke={RED} strokeWidth={5 + 7 * grip} />
      {T(780 + 30 * apart, 1074, 44, 'Ý', 1, RED)}
      <path d={`M${700 + 30 * apart} 1080 C${720 + 30 * apart} 1130 ${840 + 30 * apart} 1130 ${860 + 30 * apart} 1080`} fill="none" stroke={SLATE} strokeWidth={8} strokeLinecap="round" opacity={grip} />
      <path d={`M${420 - 40 * apart} 1180 H${640 + 30 * apart} M${450 - 40 * apart} 1150 L${418 - 40 * apart} 1180 L${450 - 40 * apart} 1210 M${610 + 30 * apart} 1150 L${642 + 30 * apart} 1180 L${610 + 30 * apart} 1210`} fill="none" stroke={BROWN} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={apart} />
      {T(540, 760, 56, 'càng giữ chặt ý mình', on(c, 6.7), BROWN)}
    </g>;}},
    {at: 8.2, draw: (c) => <g>
      <path d="M110 640 H970 V1180 L930 1200 L890 1176 L840 1204 L790 1178 L740 1200 L690 1176 L640 1204 L590 1178 L540 1200 L490 1176 L440 1204 L390 1178 L340 1200 L290 1176 L240 1204 L190 1178 L150 1200 L110 1180 Z" fill={IVORY} stroke="rgba(43,58,68,.25)" strokeWidth={2} />
      {T(540, 730, 40, 'NGUYÊN TẮC', on(c, 8.2), BROWN)}
      {T(540, 830, 64, '“Tôn trọng ý kiến', on(c, 9.3))}{T(540, 910, 64, 'của người khác.', on(c, 10.2))}
      {T(540, 1020, 58, 'Đừng bao giờ nói:', on(c, 11.24))}{T(540, 1110, 70, '‘Anh/Chị sai rồi!’”', on(c, 12.2), RED)}
      {ink(c, 'M190 1088 C400 1072 680 1074 890 1086', c.t(13.6), 14, 9, RED)}
    </g>},
  ],
};

// ── Short 2 · Chữ "nhưng" thành chữ "và" (08-phan-4 24.08–37.64 + 08g-y-kien 49.33–57.40). Cover C: the flip board.
const NHUNG = ['N', 'H', 'Ư', 'N', 'G'], SCRAMBLE = 'ABCDĐEGHKLMNOPQRSTUVXY';
const flapRow = (frame: number, x0: number, y: number, settleAt: number | null) => NHUNG.map((l, i) => {
  const settled = settleAt !== null && frame >= settleAt + i * 3;
  const letter = settled ? l : SCRAMBLE[(Math.floor(frame / 3) * 7 + i * 11) % SCRAMBLE.length];
  const squash = settled ? 0 : (frame % 3) / 6;
  return tile(x0 + i * 164, y, 150, 210, letter, '#e85a4a', squash, `f${i}`);
});
const S2: ShortDef = {
  hook: /một chữ/i, highlight: /"nhưng"|"và"/i,
  hookArt: (frame) => <g>{block(330, 820, 420, 'KHEN', 'khen')}{flapRow(frame, 133, 1020, null)}</g>,
  beats: [
    {at: 0, draw: (c) => <g>
      {flapRow(c.frame, 133, 700, c.t(1.2))}
      {ink(c, 'M540 940 V1010 M510 985 L540 1012 L570 985', c.t(2.4), 10, 6, SLATE)}
      <g opacity={on(c, 3.0)}>{tile(370, 1040, 160, 220, 'V', GOLD_HI)}{tile(550, 1040, 160, 220, 'À', GOLD_HI)}</g>
    </g>},
    {at: 3.3, draw: (c) => {const doubt = between(c, 11.0, 11.6);return <g>
      {block(280, 640, 520, 'KHEN', 'khen', on(c, 5.38) * (1 - .62 * doubt))}
      {block(280, 820, 520, 'NHƯNG', 'nhung', on(c, 7.22))}
      {block(280, 1000, 520, 'CHÊ', 've', on(c, 8.22))}
      {T(880, 760, 150, '?', doubt, RED)}
    </g>;}},
    {at: 14.08, draw: (c) => {const flip = between(c, 19.3, 19.7), back = between(c, 19.7, 20.1), calm = between(c, 20.5, 21.3);
      return <g>
        <circle cx={360} cy={725} r={220} fill="rgba(233,199,126,.35)" opacity={on(c, 17.4, 20)} />
        {block(110, 660, 500, 'KHEN', 'khen')}
        <g transform={`translate(360 915) scale(1 ${1 - .95 * Math.min(flip, 1 - back)}) translate(-360 -915)`} opacity={on(c, 18.32)}>
          {back > 0 ? block(110, 850, 500, 'VÀ', 'board', 1, 'va') : block(110, 850, 500, 'NHƯNG', 'nhung', 1, 'nh')}
        </g>
        {block(110, 1040, 500, 'GÓP Ý', 've', on(c, 18.78))}
        {figure(800, 1320, .95, on(c, 20.44), calm > .5 ? 'open' : 'crossed')}
        <path d={heartPath(880, 1110, .5)} fill={RED} stroke={GOLD_HI} strokeWidth={3} opacity={between(c, 21.2, 21.6)} />
      </g>;}},
  ],
};

// ── Short 3 · Tấm lòng hay cửa miệng (04-soi-chi 26.92–47.40). Cover C: hollow bubble and red heart.
const PROFILE = 'M300 1300 C300 1150 360 1080 430 1050 C400 1010 380 960 382 900 C386 790 470 720 560 726 C650 732 712 800 712 880 C712 906 724 920 740 946 C748 960 738 970 722 972 C724 990 720 1004 712 1010 C716 1026 706 1040 690 1040 C680 1060 650 1070 620 1068 L612 1092 C680 1120 740 1180 760 1300 Z';
const S3: ShortDef = {
  hook: /khéo miệng|thật lòng/i, highlight: /chân thành|tấm lòng|cửa miệng/i, split: true,
  hookArt: (frame) => <g>
    <path d="M150 840 H490 C520 840 532 856 532 884 V1040 C532 1068 520 1084 490 1084 H300 L240 1130 L252 1084 H150 C120 1084 108 1068 108 1040 V884 C108 856 120 840 150 840 Z" fill="rgba(251,246,234,.55)" stroke={SLATE} strokeWidth={7} strokeDasharray="22 14" />
    <path d={heartPath(780, 990, 1.9 + .04 * Math.sin(frame / 8))} fill={RED} stroke={GOLD_HI} strokeWidth={5} />
  </g>,
  covers: (c) => c.frame < c.t(5.4) ? <div style={{opacity: interpolate(c.frame, [c.t(5.0), c.t(5.4)], [1, 0], clamp) * appear(c.frame, c.t(0) - 6, 12)}}><Cover x={400} y={640} w={280} split /></div> : null,
  beats: [
    {at: 0, draw: (c) => <g>
      {T(840, 860, 64, 'THÍCH', on(c, 3.4), GOLD)}{T(240, 860, 64, 'CHÊ', on(c, 4.1), SLATE)}
      {T(540, 1180, 52, 'đều nên nhớ', on(c, 4.8), BROWN)}
    </g>},
    {at: 5.62, draw: (c) => <g>
      {figure(290, 1300, 1)}{figure(790, 1300, 1)}
      <path d={heartPath(540, 1010, 1.2)} fill={RED} stroke={GOLD_HI} strokeWidth={4} opacity={on(c, 7.0)} />
      {T(540, 760, 60, 'CHÂN THÀNH', on(c, 7.1), RED)}
    </g>},
    {at: 7.96, draw: (c) => <g>
      <g transform="translate(-80 60) scale(.8)"><path d={PROFILE} fill={SLATE} opacity={appear(c.frame, c.start, 12)} /></g>
      <path d={heartPath(344, 980, .55)} fill={RED} stroke={GOLD_HI} strokeWidth={3} opacity={on(c, 11.7)} />
      {ink(c, 'M380 990 C470 1030 560 1050 640 1060', c.t(11.8), 14, 7, GOLD)}{T(790, 1084, 60, 'TẤM LÒNG', on(c, 12.0), RED)}
      <g opacity={1 - between(c, 14.3, 14.8) * .85}>
        <path d="M515 857 C580 830 640 790 700 760" fill="none" stroke={SLATE} strokeWidth={4} strokeDasharray="12 14" opacity={on(c, 13.5)} />
        {T(790, 730, 60, 'CỬA MIỆNG', on(c, 13.7), SLATE)}
      </g>
    </g>},
    {at: 14.84, draw: (c) => {const shrink = between(c, 17.3, 18.3), other = on(c, 19.0, 16);return <g>
      <circle cx={760} cy={1040} r={300} fill="rgba(233,199,126,.32)" opacity={other} />
      <text x={540 - 260 * shrink} y={980 - 40 * shrink} textAnchor="middle" fill={SLATE} fontSize={260 - 160 * shrink} fontWeight={700} opacity={appear(c.frame, c.start, 12)}>TÔI</text>
      {figure(280, 1300, .8, shrink)}{figure(760, 1300, 1.05, other)}
    </g>;}},
  ],
};

// ── Short 4 · Vì sao có người không thích cuốn sách (08e 31.30–39.80 + 40.62–61.30). Cover A: sticky notes.
const S4: ShortDef = {
  hook: /đáng chê/i, highlight: /thao túng|dừng ở đâu|nói thẳng|giới hạn|dạy nịnh/i,
  hookArt: () => null,
  hookCover: (frame) => <>
    <Cover x={380} y={800} w={320} rot={-3} />
    <div style={{position: 'absolute', left: 640, top: 790, opacity: appear(frame, 34, 10), transform: `rotate(6deg) scale(${interpolate(frame, [34, 44], [1.25, 1], {...clamp, easing: ease})})`}}>
      <div style={{width: 260, padding: '18px 16px', background: NOTE, color: RED, fontSize: 56, fontWeight: 700, textAlign: 'center', boxShadow: '0 14px 22px rgba(60,40,15,.28)'}}>CHÊ?</div>
    </div>
  </>,
  beats: [
    {at: 0, draw: (c) => {const cut = between(c, 3.7, 4.1);return <g>
      {note(330, 600, 420, ['dễ thành', 'thao túng?'], -3, on(c, 0.4))}
      {ink(c, 'M380 870 C440 840 640 840 700 870 M430 870 V840 M540 860 V826 M650 870 V840', c.t(1.0), 16, 6, SLATE)}
      <path d={`M430 880 V${1010 - 60 * cut} M540 870 V${1000 - 60 * cut} M650 880 V${1010 - 60 * cut}`} stroke={BROWN} strokeWidth={3} opacity={on(c, 1.5)} />
      <path d="M430 1060 V1090 M540 1050 V1080 M650 1060 V1090" stroke={BROWN} strokeWidth={3} opacity={on(c, 1.5) * (1 - cut)} />
      {figure(540, 1320, .75, on(c, 1.2))}
    </g>;}},
    {at: 4.48, draw: (c) => <g>
      {note(330, 600, 420, ['dừng', 'ở đâu?'], 3, on(c, 4.6))}
      {ink(c, 'M130 1260 H950', c.t(5.0), 18, 5, SLATE)}
      {figure(300, 1250, .7, on(c, 5.3))}
      <path d="M720 940 V1260" stroke={RED} strokeWidth={7} strokeDasharray="20 16" opacity={on(c, 7.5)} />
      {T(800, 960, 90, '?', on(c, 7.8), RED)}
    </g>},
    {at: 9.09, draw: (c) => <g>
      {note(330, 600, 420, ['lúc cần', 'nói thẳng?'], -2, on(c, 9.2))}
      {figure(290, 1300, .9)}{figure(790, 1300, .9)}
      {ink(c, 'M380 950 C410 900 470 890 500 910 L486 934 Z', c.t(13.9), 10, 5, SLATE)}{T(450, 935, 44, '!', on(c, 14.0), RED)}
      {ink(c, 'M540 900 V1310', c.t(14.95), 14, 8, RED)}
      {T(540, 1350, 40, 'GIỚI HẠN', on(c, 15.2), RED)}
    </g>},
    {at: 19.45, draw: (c) => {const tilt = 8 * between(c, 22.4, 23.0) * (1 - between(c, 26.9, 28.6));
      const pan = (x: number, y: number, label: string, color: string) => <g>
        <path d={`M${x} ${y - 300} V${y}`} stroke={SLATE} strokeWidth={4} />
        <path d={`M${x - 140} ${y} H${x + 140} C${x + 130} ${y + 40} ${x + 70} ${y + 56} ${x} ${y + 56} C${x - 70} ${y + 56} ${x - 130} ${y + 40} ${x - 140} ${y} Z`} fill={IVORY} stroke={SLATE} strokeWidth={5} />
        {T(x, y + 120, 56, label, 1, color)}
      </g>;
      const r = (tilt * Math.PI) / 180, lx = 540 - 250 * Math.cos(r), ly = 760 - 250 * Math.sin(r), rx = 540 + 250 * Math.cos(r), ry = 760 + 250 * Math.sin(r);
      return <g opacity={appear(c.frame, c.start, 12)}>
        <path d="M540 760 V1330 M440 1330 H640" stroke={SLATE} strokeWidth={6} strokeLinecap="round" />
        <circle cx={540} cy={760} r={14} fill={GOLD} />
        <path d={`M${lx} ${ly} L${rx} ${ry}`} stroke={SLATE} strokeWidth={8} strokeLinecap="round" />
        {pan(lx, ly + 300, 'THÍCH', GOLD)}{pan(rx, ry + 300, 'CHÊ', RED)}
        <g opacity={on(c, 22.4)} transform={`rotate(4 ${rx} ${ry + 260})`}><rect x={rx - 130} y={ry + 214} width={260} height={84} fill={NOTE} stroke="rgba(60,40,15,.15)" />{T(rx, ry + 272, 44, 'dạy nịnh?', 1, RED)}</g>
        {ink(c, `M${rx - 116} ${ry + 258} H${rx + 116}`, c.t(23.6), 12, 5, GOLD)}
        {T(540, 680, 52, 'đều có phần đúng', on(c, 27.3), BROWN)}
      </g>;}},
  ],
};

const DEFS: Record<string, ShortDef> = {'short-1': S1, 'short-2': S2, 'short-3': S3, 'short-4': S4};

// Headline text with its keywords in the cover's red.
const marked = (text: string, re: RegExp) => {
  const out: ReactNode[] = [];let at = 0;
  for (const m of text.matchAll(new RegExp(re.source, 'gi'))) {out.push(text.slice(at, m.index));out.push(<span key={m.index} style={{color: RED}}>{m[0]}</span>);at = (m.index ?? 0) + m[0].length;}
  out.push(text.slice(at));return out;
};

export const DntShort: FC<ShortProps> = ({short: id}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const s = shortOf(id), tl = timeline(s, fps), def = DEFS[s.id] ?? S1;
  const F = (x: number) => Math.round(x * fps);
  const t = (sec: number) => tl.excerpt + F(sec);
  const starts = def.beats.map((b, i) => (i === 0 ? tl.excerpt - 6 : t(b.at) - 12));
  const opacityOf = (i: number) => interpolate(frame, [starts[i], starts[i] + 12, (starts[i + 1] ?? tl.cta - 6) - 12, starts[i + 1] ?? tl.cta + 6], [0, 1, 1, 0], clamp);
  const hookIn = interpolate(frame, [tl.excerpt - 14, tl.excerpt - 2], [1, 0], clamp);
  const ctaIn = interpolate(frame, [tl.cta - 8, tl.cta + 10], [0, 1], {...clamp, easing: ease});
  const band = interpolate(frame, [tl.excerpt - 10, tl.excerpt + 2], [0, 1], clamp);
  const fadeOut = interpolate(frame, [durationInFrames - .7 * fps, durationInFrames], [1, 0], clamp);
  const hookText = s.hook.words.map((w) => w.text).join(' ');
  const pageWords = (clip: typeof s.excerpt.words, from: number) => clip.map((w) => ({...w, startMs: w.startMs + from * 1000 / fps, endMs: w.endMs + from * 1000 / fps}));
  const bodyWords = useMemo(() => [...pageWords(s.excerpt.words, tl.excerpt), ...pageWords(s.cta.words, tl.cta)], [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const c0: C = {frame, start: 0, t};
  const paper = def.split
    ? 'radial-gradient(ellipse 34% 40% at 50% 50%, rgba(255,250,238,.9), rgba(255,250,238,0) 70%), linear-gradient(90deg, #d9dddd 0%, #e5e6e2 32%, #efe9dc 50%, #f5e9cf 68%, #f0dbb3 100%)'
    : 'radial-gradient(ellipse 60% 34% at 50% 50%, rgba(255,251,240,.85), rgba(255,251,240,0) 72%), linear-gradient(180deg, #dcdfdf 0%, #e8e8e3 30%, #efe8da 55%, #f4e6c9 80%, #f0dcb6 100%)';
  return <AbsoluteFill style={{background: '#efe8da', fontFamily: 'Stoic Sans, sans-serif', overflow: 'hidden'}}>
    <AbsoluteFill style={{opacity: fadeOut}}>
      <AbsoluteFill style={{background: paper}} />
      {def.split ? null : <><AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 30% at 30% 22%, rgba(140,165,185,.22), transparent 70%)'}} /><AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 30% at 70% 80%, rgba(222,168,80,.24), transparent 70%)'}} /></>}
      <div style={{position: 'absolute', left: 0, right: 0, top: 206, textAlign: 'center', fontSize: 30, letterSpacing: '.24em', color: BROWN, fontWeight: 700}}>ĐỌC SÁCH, HIỂU MÌNH · <span style={{color: RED}}>TẬP 03</span></div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 262, textAlign: 'center', fontSize: 40, color: SLATE, fontWeight: 700, opacity: .9}}>Đắc nhân tâm · Dale Carnegie</div>
      {/* Opening: the whole line, fully lit, over the cover's subject. */}
      <div style={{opacity: hookIn}}>
        <div style={{position: 'absolute', left: 70, width: 940, top: 400, minHeight: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: SLATE, fontSize: 78, lineHeight: 1.22, fontWeight: 700, textWrap: 'balance', textShadow: '0 2px 0 rgba(255,255,255,.55), 0 14px 30px rgba(80,60,25,.18)'}}>
          <div>{marked(hookText, def.hook)}</div>
        </div>
        {def.hookCover?.(frame)}
        <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0}}>{def.hookArt(frame, fps)}</svg>
      </div>
      {def.covers?.(c0, tl)}
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        {def.beats.map((b, i) => {const o = opacityOf(i);return o > .001 ? <g key={i} opacity={o}>{b.draw({frame, start: starts[i], t})}</g> : null;})}
      </svg>
      {/* Invitation: episode 3's own thumbnail, the comment link. */}
      <div style={{opacity: ctaIn}}>
        <div style={{position: 'absolute', left: 110, top: 520, width: 1280, height: 720, transform: 'scale(.67) rotate(-2deg)', transformOrigin: 'top left', boxShadow: '0 30px 60px rgba(60,40,15,.35)', borderRadius: 8, overflow: 'hidden'}}><BookDntThumbnail /></div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 1030, textAlign: 'center', fontSize: 66, color: RED, fontWeight: 700}}>Xem trọn tập 03</div>
        <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <Draw d="M250 1150 L830 1150 C850 1150 860 1160 860 1180 L860 1250 C860 1270 850 1280 830 1280 L430 1280 L380 1325 L388 1280 L250 1280 C230 1280 220 1270 220 1250 L220 1180 C220 1160 230 1150 250 1150 Z" frame={frame} from={tl.cta + 20} to={tl.cta + 40} width={5} color={SLATE} />
          {T(540, 1232, 46, 'Link ở phần bình luận', appear(frame, tl.cta + 34, 12))}
        </svg>
      </div>
      {/* Caption band (excerpt and invitation), the channel's caption type on dark ink. */}
      <div style={{position: 'absolute', left: 60, width: 960, top: 1370, height: 210, borderRadius: 26, background: 'rgba(31,42,49,.92)', opacity: band}} />
      {frame >= tl.excerpt - 2 ? <Captions words={bodyWords} ms={frame * 1000 / fps} highlight={def.highlight} /> : null}
      <AbsoluteFill style={{opacity: .34, mixBlendMode: 'multiply', backgroundImage: GRAIN, pointerEvents: 'none'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 95% 80% at 50% 50%, transparent 60%, rgba(70,55,30,.26) 100%)', pointerEvents: 'none'}} />
    </AbsoluteFill>
    <Track name="Giọng · câu mở (tạm: Quốc Tuấn)"><Sequence from={tl.hook} durationInFrames={F(s.hook.durationSeconds) + 2}><Audio src={staticFile(s.hook.file)} /></Sequence></Track>
    <Track name="Giọng · đoạn trích tập 3"><Sequence from={tl.excerpt} durationInFrames={tl.cta - tl.excerpt}><Audio src={staticFile(s.excerpt.file)} /></Sequence></Track>
    <Track name="Giọng · lời mời (tạm: Quốc Tuấn)"><Sequence from={tl.cta} durationInFrames={F(s.cta.durationSeconds) + 2}><Audio src={staticFile(s.cta.file)} /></Sequence></Track>
    <Track name={`Nhạc nền · ${music.credit.artists.join(', ')} – ${music.credit.title} · chỉnh đầu/cuối trong Edit`}>
      <MusicFade fadeInSeconds={music.fadeInSeconds} fadeOutSeconds={music.fadeOutSeconds}>
        <Audio name={`${music.credit.artists.join(', ')} – ${music.credit.title}`} src={staticFile(music.file)} from={0} durationInFrames={durationInFrames} volume={music.speechVolume} playbackRate={music.playbackRate} loop />
      </MusicFade>
    </Track>
  </AbsoluteFill>;
};
