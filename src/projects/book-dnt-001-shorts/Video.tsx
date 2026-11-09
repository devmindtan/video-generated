import type {CSSProperties, FC, ReactNode} from 'react';
import {useMemo} from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Img, Sequence, Track, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CalculateMetadataFunction} from 'remotion';
import '../../shared/stoic-fonts';
import {MusicFade} from '../../shared/MusicFade';
import {clamp, ease} from '../book-hvtt-001-overview/Intro';
import {Draw, appear} from '../book-hvtt-001-overview/scene-kit';
import {Captions} from '../book-hvtt-001-shorts/ShortFrame';
import type {ShortProps, Word} from '../book-hvtt-001-shorts/ShortFrame';
import {BookDntThumbnail} from '../book-dnt-001-overview/Thumbnail';
import music from './music.json';
import data from './shorts.json';
import layout from './layout.json';

// The four promo shorts of episode 3 (docs/projects/book-dnt-001-shorts). The words are written for the shorts (user
// 2026-11-09: "viết lại lời thoại… đừng lấy của video gốc"; narration.json): an opening line, a few sentences straight
// to the point, the shared invitation, one narration per short with a rest after every sentence so each drawing
// finishes before the next (user: the first build was too fast). Own look, not the long episode's: "paper and ink"
// from the thumbnail F family — light paper, slate ink, the cover's red, gold. Shared with the series' shorts kit: the
// word-lit captions (Captions). Layout keeps YouTube's buttons and title clear: drawings in y 460–1340, x 80–940;
// captions on a dark band in y 1370–1580. The opening line shows whole and fully lit from the first frame over the
// chosen cover's subject (series rule 2026-11-05). Drawings are tied to a sentence id and a word in it, so they follow
// whichever voice is built in (placeholder Quốc Tuấn now with estimated word times, the picked clone later).
const SLATE = '#2b3a44', RED = '#a3241b', GOLD = '#c99a45', GOLD_HI = '#e9c77e', BROWN = '#7a5a22', IVORY = '#fbf6ea', BOARD = '#1f2a31', NOTE = '#f6e7b8';
const COVER = staticFile('book-dnt-001-overview/thumbnail/book-cover-source.webp');
const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .45 0 0 0 0 .38 0 0 0 0 .28 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";
type Sentence = {id: string; text: string; role: 'hook' | 'body' | 'cta'; startMs: number; endMs: number};
type ShortVoice = {id: string; title: string; file: string; durationSeconds: number; sentences: Sentence[]; words: (Word & {sentence: string})[]};
const shorts = (data as unknown as {shorts: ShortVoice[]}).shorts;
const shortOf = (id: string) => shorts.find((s) => s.id === id) ?? shorts[0];
const F = (x: number, fps = 30) => Math.round(x * fps);
const timeline = (s: ShortVoice, fps = 30) => {
  const start = F(layout.lead, fps), at = (ms: number) => start + F(ms / 1000, fps);
  const sentence = (role: Sentence['role']) => s.sentences.find((x) => x.role === role)!;
  const body = s.sentences.find((x) => x.role === 'body')!;
  return {start, at, body: at(body.startMs), cta: at(sentence('cta').startMs), end: start + F(s.durationSeconds, fps), total: start + F(s.durationSeconds + layout.tail, fps)};
};
export const dntShortMetadata: CalculateMetadataFunction<ShortProps> = ({props}) => ({durationInFrames: timeline(shortOf(props.short)).total});

// Drawing context: s(id, f) is the frame at fraction f of sentence id; w(id, word, n) the frame where its n-th "word" starts.
type C = {frame: number; start: number; s: (id: string, f?: number) => number; w: (id: string, word: string, n?: number) => number};
type Beat = {at: string; f?: number; draw: (c: C) => ReactNode};
const ink = (c: C, d: string, from: number, len = 18, width = 5, color = SLATE, opacity = 1) =>
  <Draw key={d + from} d={d} frame={c.frame} from={from} to={from + len} width={width} color={color} opacity={opacity} />;
const on = (c: C, at: number, len = 12) => appear(c.frame, at - 4, len);
const between = (c: C, a: number, b: number) => interpolate(c.frame, [a, b], [0, 1], {...clamp, easing: ease});
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

// stage: one drawing kept in place from the first frame to the invitation (elements change state where they are).
type ShortDef = {hook: RegExp; highlight: RegExp; split?: boolean; hookArt: (frame: number) => ReactNode; hookCover?: (frame: number) => ReactNode; beats: Beat[]; stage?: (c: C) => ReactNode};

// ── Short 1 · Thắng cũng là thua. Cover A: the cracked trophy.
const cup = (frame: number, dy: number, crack: number) => <g transform={`translate(0 ${dy}) rotate(-9 540 560)`}>
  <path d="M396 352 H684 C684 516 628 604 540 614 C452 604 396 516 396 352 Z" fill="rgba(201,154,69,.28)" stroke={SLATE} strokeWidth={6} strokeLinejoin="round" />
  <path d="M396 394 C318 394 316 512 418 528 M684 394 C762 394 764 512 662 528 M540 614 V690 M500 690 H580 M462 752 L478 690 H602 L618 752 Z" fill="none" stroke={SLATE} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
  <Draw d="M566 352 L538 426 L572 470 L532 538 L556 606" frame={frame} from={crack} to={crack + 22} width={7} color={RED} />
</g>;
const chip = (x: number, y: number, label: string, color: string, o: number) => <g opacity={o}><rect x={x} y={y} width={330} height={150} rx={18} fill={BOARD} />
  <rect x={x} y={y + 73} width={330} height={4} fill="#0d1418" />{T(x + 165, y + 108, 92, label, 1, color)}</g>;
const S1: ShortDef = {
  hook: /người thua/i, highlight: /thua|thắng|sai|đường lùi|tôn trọng/i,
  hookArt: (frame) => cup(frame, 470, 14),
  beats: [
    // "Vì khi bị nói là sai, người ta hiếm khi đổi ý."
    {at: '1-2', draw: (c) => {const crossed = between(c, c.w('1-2', 'đổi'), c.w('1-2', 'đổi') + 10);return <g>
      {figure(300, 1300, 1, appear(c.frame, c.start, 14))}{figure(780, 1300, 1, appear(c.frame, c.start + 4, 14), crossed > .5 ? 'crossed' : 'down')}
      {ink(c, 'M380 1110 L560 1060', c.w('1-2', 'nói'), 10, 6, SLATE)}
      <g opacity={on(c, c.w('1-2', 'sai,'))}><rect x={430} y={860} width={220} height={110} rx={22} fill={IVORY} stroke={RED} strokeWidth={5} />{T(540, 940, 64, 'SAI!', 1, RED)}</g>
      {T(780, 880, 52, 'không đổi ý', on(c, c.w('1-2', 'đổi')), BROWN)}
    </g>;}},
    // "Họ lo giữ thể diện, và càng bám chặt điều mình đã nói."
    {at: '1-3', draw: (c) => {const grip = between(c, c.w('1-3', 'bám'), c.w('1-3', 'nói.')), apart = between(c, c.w('1-3', 'càng'), c.w('1-3', 'nói.') + 8);return <g>
      {figure(300 - 40 * apart, 1300, 1)}{figure(780 + 30 * apart, 1300, 1)}
      <rect x={720 + 30 * apart} y={1130} width={120} height={110} rx={10} fill={IVORY} stroke={RED} strokeWidth={5 + 7 * grip} />
      {T(780 + 30 * apart, 1204, 44, 'Ý', 1, RED)}
      <path d={`M${700 + 30 * apart} 1210 C${720 + 30 * apart} 1260 ${840 + 30 * apart} 1260 ${860 + 30 * apart} 1210`} fill="none" stroke={SLATE} strokeWidth={8} strokeLinecap="round" opacity={grip} />
      <path d={`M${420 - 40 * apart} 900 H${640 + 30 * apart} M${450 - 40 * apart} 870 L${418 - 40 * apart} 900 L${450 - 40 * apart} 930 M${610 + 30 * apart} 870 L${642 + 30 * apart} 900 L${610 + 30 * apart} 930`} fill="none" stroke={BROWN} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={apart} />
      {T(540, 800, 52, 'giữ thể diện', on(c, c.w('1-3', 'thể')), BROWN)}
    </g>;}},
    // "…tranh cãi mà thua thì mình thua, còn thắng thì mình cũng thua."
    {at: '1-4', draw: (c) => <g>
      {T(540, 700, 44, 'KHI TRANH CÃI', on(c, c.w('1-4', 'tranh')), BROWN)}
      {chip(110, 760, 'THUA', '#e85a4a', on(c, c.w('1-4', 'thua'))) }{ink(c, 'M470 835 H600 M570 805 L604 835 L570 865', c.w('1-4', 'thì'), 10, 6, SLATE)}{chip(640, 760, 'THUA', '#e85a4a', on(c, c.w('1-4', 'thua', 2)))}
      {chip(110, 990, 'THẮNG', GOLD_HI, on(c, c.w('1-4', 'thắng')))}{ink(c, 'M470 1065 H600 M570 1035 L604 1065 L570 1095', c.w('1-4', 'thì', 2), 10, 6, SLATE)}{chip(640, 990, 'THUA', '#e85a4a', on(c, c.w('1-4', 'thua', 3)))}
    </g>},
    // "Lời khuyên của sách rất ngắn: tôn trọng ý kiến của người khác, và đừng bao giờ nói thẳng rằng họ sai."
    {at: '1-5', draw: (c) => <g>
      <path d="M110 640 H970 V1180 L930 1200 L890 1176 L840 1204 L790 1178 L740 1200 L690 1176 L640 1204 L590 1178 L540 1200 L490 1176 L440 1204 L390 1178 L340 1200 L290 1176 L240 1204 L190 1178 L150 1200 L110 1180 Z" fill={IVORY} stroke="rgba(43,58,68,.25)" strokeWidth={2} />
      {T(540, 730, 40, 'LỜI KHUYÊN CỦA SÁCH', on(c, c.start + 6), BROWN)}
      {T(540, 840, 64, 'Tôn trọng ý kiến', on(c, c.w('1-5', 'tôn')))}{T(540, 920, 64, 'của người khác', on(c, c.w('1-5', 'người')))}
      {T(540, 1030, 58, 'Đừng nói thẳng:', on(c, c.w('1-5', 'đừng')))}{T(540, 1120, 70, '“Bạn sai rồi”', on(c, c.w('1-5', 'rằng')), RED)}
      {ink(c, 'M310 1098 C430 1086 640 1088 770 1096', c.w('1-5', 'sai.') + 4, 12, 9, RED)}
    </g>},
    // "Muốn người kia nghĩ lại, mình nên chừa cho họ một đường lùi."
    {at: '1-6', draw: (c) => <g>
      {figure(320, 1300, 1)}{figure(720, 1300, 1)}
      {ink(c, 'M760 1200 C860 1180 920 1080 900 960 M872 990 L900 952 L930 992', c.w('1-6', 'đường'), 18, 7, GOLD)}
      {T(780, 880, 60, 'ĐƯỜNG LÙI', on(c, c.w('1-6', 'lùi.')), GOLD)}
      {T(320, 880, 52, 'nghĩ lại?', on(c, c.w('1-6', 'nghĩ')), BROWN)}
    </g>},
  ],
};

// ── Short 2 · Chữ "nhưng" thành chữ "và". Cover C: the flip board.
const NHUNG = ['N', 'H', 'Ư', 'N', 'G'];
// Blank tiles that flip once, one after another, into NHƯNG as the word is read (user 2026-11-09: no running letters).
const flapRow = (frame: number, x0: number, y: number, settleAt: number | null, w = 150, h = 210, step = 164) => NHUNG.map((l, i) => {
  const at = settleAt === null ? Number.MAX_SAFE_INTEGER : settleAt + i * 4;
  const squash = settleAt === null ? 0 : interpolate(frame, [at - 4, at, at + 4], [0, 1, 0], clamp);
  return tile(x0 + i * step, y, w, h, frame >= at ? l : '', '#e85a4a', squash, `f${i}`);
});
const flip = (c: C, at: number) => Math.min(between(c, at, at + 5), 1 - between(c, at + 5, at + 10));
// One fixed stage (user 2026-11-09: KHEN jumped around between sentences): KHEN on top, the flip row in the middle,
// GÓP Ý at the bottom, from the opening line to the invitation; each element changes state in place.
const S2: ShortDef = {
  hook: /một chữ/i, highlight: /nhưng|chữ và|bằng chữ và|động viên/i,
  hookArt: () => null,
  beats: [],
  stage: (c) => {
    const nhung = c.w('2-2', 'nhưng'), toVa = c.w('2-5', 'và') - 6, doubt = between(c, c.w('2-4', 'nghi'), c.w('2-4', 'nghi') + 12);
    const relit = between(c, c.w('2-6', 'trọn'), c.w('2-6', 'trọn') + 14), cheer = between(c, c.w('2-7', 'động'), c.w('2-7', 'viên') + 8);
    const dim = doubt * (1 - relit), f = flip(c, toVa);
    return <g>
      <circle cx={540} cy={865} r={250} fill="rgba(233,199,126,.35)" opacity={relit} />
      {block(280, 800, 520, 'KHEN', 'khen', 1 - .62 * dim)}
      {T(890, 890, 140, '?', dim, RED)}
      <g transform={`translate(540 1070) scale(1 ${1 - .95 * f}) translate(-540 -1070)`}>
        {c.frame < toVa + 5 ? <>{flapRow(c.frame, 197, 985, nhung, 126, 170, 140)}{c.frame < nhung ? T(540, 1108, 96, '?', appear(c.frame, 30, 12), RED) : null}</>
          : [tile(390, 980, 140, 180, 'V', GOLD_HI, 0, 'v'), tile(550, 980, 140, 180, 'À', GOLD_HI, 0, 'a')]}
      </g>
      <g opacity={on(c, c.w('2-3', 'góp'))}>
        <rect x={280} y={1196} width={520} height={110} rx={18} fill={IVORY} stroke={cheer > .5 ? GOLD : SLATE} strokeWidth={5} />
        {T(540, 1272, 62, cheer > .5 ? 'ĐỘNG VIÊN' : 'GÓP Ý', 1, cheer > .5 ? BROWN : SLATE)}
      </g>
      <path d={heartPath(870, 1250, .45)} fill={RED} stroke={GOLD_HI} strokeWidth={3} opacity={cheer} />
    </g>;
  },
};

// ── Short 3 · Tấm lòng hay cửa miệng. Cover C: hollow bubble and red heart.
const PROFILE = 'M300 1300 C300 1150 360 1080 430 1050 C400 1010 380 960 382 900 C386 790 470 720 560 726 C650 732 712 800 712 880 C712 906 724 920 740 946 C748 960 738 970 722 972 C724 990 720 1004 712 1010 C716 1026 706 1040 690 1040 C680 1060 650 1070 620 1068 L612 1092 C680 1120 740 1180 760 1300 Z';
const S3: ShortDef = {
  hook: /khéo miệng|thật lòng/i, highlight: /dạy nịnh|tấm lòng|cửa miệng|chân thành|kỹ thuật/i, split: true,
  hookArt: (frame) => <g>
    <path d="M150 840 H490 C520 840 532 856 532 884 V1040 C532 1068 520 1084 490 1084 H300 L240 1130 L252 1084 H150 C120 1084 108 1068 108 1040 V884 C108 856 120 840 150 840 Z" fill="rgba(251,246,234,.55)" stroke={SLATE} strokeWidth={7} strokeDasharray="22 14" />
    <path d={heartPath(780, 990, 1.9 + .04 * Math.sin(frame / 8))} fill={RED} stroke={GOLD_HI} strokeWidth={5} />
  </g>,
  beats: [
    // "Có người đọc xong thì thấy đây là sách dạy nịnh."
    {at: '3-2', draw: (c) => <g>
      <foreignObject x={400} y={640} width={290} height={420}><Cover x={0} y={0} w={280} /></foreignObject>
      <g opacity={on(c, c.w('3-2', 'dạy'))} transform="rotate(-8 540 1000)"><rect x={330} y={930} width={420} height={120} rx={16} fill="rgba(251,246,234,.85)" stroke={RED} strokeWidth={10} />{T(540, 1014, 72, 'DẠY NỊNH?', 1, RED)}</g>
    </g>},
    // "Nhưng chính tác giả lại vạch ranh giới rất rõ."
    {at: '3-3', draw: (c) => <g>
      <foreignObject x={400} y={640} width={290} height={420}><Cover x={0} y={0} w={280} split /></foreignObject>
      {ink(c, 'M540 560 V1320', c.w('3-3', 'vạch'), 20, 6, GOLD)}
      {T(250, 880, 56, 'NỊNH', on(c, c.w('3-3', 'ranh')), SLATE)}{T(830, 880, 56, 'THẬT LÒNG', on(c, c.w('3-3', 'rõ.')), RED)}
    </g>},
    // "…một điều xuất phát từ tấm lòng, một điều chỉ từ cửa miệng."
    {at: '3-4', draw: (c) => <g>
      <g transform="translate(-80 60) scale(.8)"><path d={PROFILE} fill={SLATE} opacity={appear(c.frame, c.start, 12)} /></g>
      <path d={heartPath(344, 980, .55)} fill={RED} stroke={GOLD_HI} strokeWidth={3} opacity={on(c, c.w('3-4', 'tấm'))} />
      {ink(c, 'M380 990 C470 1030 560 1050 640 1060', c.w('3-4', 'tấm'), 14, 7, GOLD)}{T(790, 1084, 60, 'TẤM LÒNG', on(c, c.w('3-4', 'lòng', 2)), RED)}
      <path d="M515 857 C580 830 640 790 700 760" fill="none" stroke={SLATE} strokeWidth={4} strokeDasharray="12 14" opacity={on(c, c.w('3-4', 'cửa'))} />
      {T(790, 730, 60, 'CỬA MIỆNG', on(c, c.w('3-4', 'miệng.')), SLATE)}
    </g>},
    // "Vì vậy, mọi nguyên tắc trong sách đều phải đi kèm sự chân thành."
    {at: '3-5', draw: (c) => <g>
      {figure(290, 1300, 1)}{figure(790, 1300, 1)}
      <path d={heartPath(540, 1010, 1.2)} fill={RED} stroke={GOLD_HI} strokeWidth={4} opacity={on(c, c.w('3-5', 'chân'))} />
      {T(540, 760, 60, 'CHÂN THÀNH', on(c, c.w('3-5', 'thành.')), RED)}
    </g>},
    // "Mình thấy, thiếu điều đó thì nụ cười hay việc nhớ tên người khác cũng chỉ còn là kỹ thuật."
    {at: '3-6', draw: (c) => {const cold = between(c, c.w('3-6', 'kỹ'), c.w('3-6', 'thuật.') + 6);return <g>
      <g opacity={on(c, c.w('3-6', 'nụ'))}><circle cx={330} cy={900} r={130} fill={IVORY} stroke={cold > .5 ? '#8a969c' : SLATE} strokeWidth={6} /><path d="M265 930 Q330 985 395 930" fill="none" stroke={cold > .5 ? '#8a969c' : RED} strokeWidth={7} strokeLinecap="round" /></g>
      <g opacity={on(c, c.w('3-6', 'nhớ'))}><rect x={600} y={820} width={300} height={170} rx={16} fill={IVORY} stroke={cold > .5 ? '#8a969c' : SLATE} strokeWidth={6} />{T(750, 885, 40, 'XIN CHÀO', 1, BROWN)}{T(750, 950, 50, 'TÊN', 1, cold > .5 ? '#8a969c' : SLATE)}</g>
      {T(540, 1180, 64, 'chỉ còn là kỹ thuật?', cold, SLATE)}
      <circle cx={540} cy={1020} r={36} fill="none" stroke="#8a969c" strokeWidth={10} strokeDasharray="14 10" opacity={cold} />
    </g>;}},
  ],
};

// ── Short 4 · Vì sao có người không thích cuốn sách. Cover A: sticky notes.
const scale = (c: C, tiltDeg: number, extra?: ReactNode) => {
  const pan = (x: number, y: number, label: string, color: string) => <g>
    <path d={`M${x} ${y - 300} V${y}`} stroke={SLATE} strokeWidth={4} />
    <path d={`M${x - 140} ${y} H${x + 140} C${x + 130} ${y + 40} ${x + 70} ${y + 56} ${x} ${y + 56} C${x - 70} ${y + 56} ${x - 130} ${y + 40} ${x - 140} ${y} Z`} fill={IVORY} stroke={SLATE} strokeWidth={5} />
    {T(x, y + 120, 56, label, 1, color)}
  </g>;
  const r = (tiltDeg * Math.PI) / 180, lx = 540 - 250 * Math.cos(r), ly = 760 - 250 * Math.sin(r), rx = 540 + 250 * Math.cos(r), ry = 760 + 250 * Math.sin(r);
  return <g>
    <path d="M540 760 V1330 M440 1330 H640" stroke={SLATE} strokeWidth={6} strokeLinecap="round" />
    <circle cx={540} cy={760} r={14} fill={GOLD} />
    <path d={`M${lx} ${ly} L${rx} ${ry}`} stroke={SLATE} strokeWidth={8} strokeLinecap="round" />
    {pan(lx, ly + 300, 'THÍCH', GOLD)}{pan(rx, ry + 300, 'CHÊ', RED)}
    {extra ? <g transform={`translate(${rx - 790} ${ry - 760})`}>{extra}</g> : null}
  </g>;
};
const S4: ShortDef = {
  hook: /đáng chê/i, highlight: /thao túng|dừng ở đâu|nói thẳng|giới hạn|dạy nịnh|chưa công bằng|đều có phần đúng/i,
  hookArt: () => null,
  hookCover: (frame) => <>
    <Cover x={380} y={800} w={320} rot={-3} />
    <div style={{position: 'absolute', left: 640, top: 790, opacity: appear(frame, 34, 10), transform: `rotate(6deg) scale(${interpolate(frame, [34, 44], [1.25, 1], {...clamp, easing: ease})})`}}>
      <div style={{width: 260, padding: '18px 16px', background: NOTE, color: RED, fontSize: 56, fontWeight: 700, textAlign: 'center', boxShadow: '0 14px 22px rgba(60,40,15,.28)'}}>CHÊ?</div>
    </div>
  </>,
  beats: [
    // "…nếu tách khỏi sự chân thành, rất dễ thành thao túng."
    {at: '4-2', draw: (c) => {const cut = between(c, c.w('4-2', 'túng.'), c.w('4-2', 'túng.') + 10);return <g>
      {note(330, 600, 420, ['dễ thành', 'thao túng?'], -3, on(c, c.start + 6))}
      {ink(c, 'M380 870 C440 840 640 840 700 870 M430 870 V840 M540 860 V826 M650 870 V840', c.w('4-2', 'tách'), 16, 6, SLATE)}
      <path d={`M430 880 V${1010 - 60 * cut} M540 870 V${1000 - 60 * cut} M650 880 V${1010 - 60 * cut}`} stroke={BROWN} strokeWidth={3} opacity={on(c, c.w('4-2', 'chân'))} />
      <path d="M430 1060 V1090 M540 1050 V1080 M650 1060 V1090" stroke={BROWN} strokeWidth={3} opacity={on(c, c.w('4-2', 'chân')) * (1 - cut)} />
      {figure(540, 1320, .75, on(c, c.w('4-2', 'cách')))}
    </g>;}},
    // "Sách có cảnh báo chuyện nịnh hót, nhưng chưa nói nhiều về việc dừng ở đâu."
    {at: '4-3', draw: (c) => <g>
      {note(330, 600, 420, ['dừng', 'ở đâu?'], 3, on(c, c.start + 6))}
      {ink(c, 'M130 1260 H950', c.w('4-3', 'cảnh'), 18, 5, SLATE)}
      {figure(300, 1250, .7, on(c, c.w('4-3', 'nịnh')))}
      <path d="M720 940 V1260" stroke={RED} strokeWidth={7} strokeDasharray="20 16" opacity={on(c, c.w('4-3', 'dừng'))} />
      {T(800, 960, 90, '?', on(c, c.w('4-3', 'đâu.')), RED)}
    </g>},
    // "Còn khi khuyên tránh tranh cãi, sách gần như không bàn tới lúc cần nói thẳng, hay cần đặt giới hạn."
    {at: '4-4', draw: (c) => <g>
      {note(330, 600, 420, ['lúc cần', 'nói thẳng?'], -2, on(c, c.start + 6))}
      {figure(290, 1300, .9)}{figure(790, 1300, .9)}
      {ink(c, 'M380 950 C410 900 470 890 500 910 L486 934 Z', c.w('4-4', 'nói'), 10, 5, SLATE)}{T(450, 935, 44, '!', on(c, c.w('4-4', 'thẳng,')), RED)}
      {ink(c, 'M540 900 V1310', c.w('4-4', 'giới'), 14, 8, RED)}
      {T(540, 1350, 40, 'GIỚI HẠN', on(c, c.w('4-4', 'hạn.')), RED)}
    </g>},
    // "Ngược lại, gọi cả cuốn là sách dạy nịnh thì cũng chưa công bằng."
    {at: '4-5', draw: (c) => {const tilt = 8 * between(c, c.w('4-5', 'dạy'), c.w('4-5', 'nịnh') + 8);return <g>
      {scale(c, tilt, <g opacity={on(c, c.w('4-5', 'dạy'))} transform="rotate(4 790 1020)"><rect x={660} y={974} width={260} height={84} fill={NOTE} stroke="rgba(60,40,15,.15)" />{T(790, 1032, 44, 'dạy nịnh?', 1, RED)}</g>)}
      {T(540, 680, 52, 'chưa công bằng', on(c, c.w('4-5', 'công')), BROWN)}
    </g>;}},
    // "Hai cách nhìn ấy, mình nghĩ đều có phần đúng."
    {at: '4-6', draw: (c) => {const level = 8 * (1 - between(c, c.w('4-6', 'đều'), c.w('4-6', 'đúng.') + 10));return <g>
      {scale(c, level, <g transform="rotate(4 790 1020)"><rect x={660} y={974} width={260} height={84} fill={NOTE} stroke="rgba(60,40,15,.15)" />{T(790, 1032, 44, 'dạy nịnh?', 1, RED)}</g>)}
      {T(540, 680, 52, 'đều có phần đúng', on(c, c.w('4-6', 'đều')), BROWN)}
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
const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

export const DntShort: FC<ShortProps> = ({short: id}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const s = shortOf(id), tl = timeline(s, fps), def = DEFS[s.id] ?? S1;
  const sentence = (sid: string) => s.sentences.find((x) => x.id === sid) ?? s.sentences[0];
  const at = (sid: string, f = 0) => {const x = sentence(sid);return tl.at(x.startMs + (x.endMs - x.startMs) * f);};
  // Frame where the n-th occurrence of a word (compared without punctuation and case) starts in sentence sid.
  const w = (sid: string, word: string, n = 1) => {const hits = s.words.filter((x) => x.sentence === sid && norm(x.text) === norm(word));
    const hit = hits[Math.min(n, hits.length) - 1];return hit ? tl.at(hit.startMs) : at(sid);};
  // The old drawing stays until the next sentence starts; the new one fades in over its first 16 frames.
  const starts = def.beats.map((b) => at(b.at, b.f ?? 0) - 4);
  const opacityOf = (i: number) => interpolate(frame, [starts[i], starts[i] + 16, starts[i + 1] ?? tl.cta - 8, (starts[i + 1] ?? tl.cta - 8) + 14], [0, 1, 1, 0], clamp);
  const hookIn = interpolate(frame, [tl.body - 22, tl.body - 6], [1, 0], clamp);
  const ctaIn = interpolate(frame, [tl.cta - 8, tl.cta + 10], [0, 1], {...clamp, easing: ease});
  const band = interpolate(frame, [tl.body - 12, tl.body], [0, 1], clamp);
  const fadeOut = interpolate(frame, [durationInFrames - .7 * fps, durationInFrames], [1, 0], clamp);
  const hookText = s.sentences[0].text;
  const bodyWords = useMemo(() => s.words.filter((x) => x.sentence !== s.sentences[0].id).map((x) => ({...x, startMs: x.startMs + layout.lead * 1000, endMs: x.endMs + layout.lead * 1000})), [id]); // eslint-disable-line react-hooks/exhaustive-deps
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
        <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0}}>{def.hookArt(frame)}</svg>
      </div>
      {def.stage ? <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 1 - ctaIn}}>{def.stage({frame, start: 0, s: at, w})}</svg> : null}
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        {def.beats.map((b, i) => {const o = opacityOf(i);return o > .001 ? <g key={i} opacity={o}>{b.draw({frame, start: starts[i] + 16, s: at, w})}</g> : null;})}
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
      {/* Caption band (after the opening line), the channel's caption type on dark ink. */}
      <div style={{position: 'absolute', left: 60, width: 960, top: 1370, height: 210, borderRadius: 26, background: 'rgba(31,42,49,.92)', opacity: band}} />
      {frame >= tl.body - 2 ? <Captions words={bodyWords} ms={frame * 1000 / fps} highlight={def.highlight} /> : null}
      <AbsoluteFill style={{opacity: .34, mixBlendMode: 'multiply', backgroundImage: GRAIN, pointerEvents: 'none'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 95% 80% at 50% 50%, transparent 60%, rgba(70,55,30,.26) 100%)', pointerEvents: 'none'}} />
    </AbsoluteFill>
    <Track name="Giọng · lời đọc (tạm: Quốc Tuấn)"><Sequence from={tl.start} durationInFrames={tl.end - tl.start + 2}><Audio src={staticFile(s.file)} /></Sequence></Track>
    <Track name={`Nhạc nền · ${music.credit.artists.join(', ')} – ${music.credit.title} · chỉnh đầu/cuối trong Edit`}>
      <MusicFade fadeInSeconds={music.fadeInSeconds} fadeOutSeconds={music.fadeOutSeconds}>
        <Audio name={`${music.credit.artists.join(', ')} – ${music.credit.title}`} src={staticFile(music.file)} from={0} durationInFrames={durationInFrames} volume={music.speechVolume} playbackRate={music.playbackRate} loop />
      </MusicFade>
    </Track>
  </AbsoluteFill>;
};
