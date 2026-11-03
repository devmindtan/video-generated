import type {FC, ReactNode} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CalculateMetadataFunction} from 'remotion';
import '../../shared/stoic-fonts';
import {Backdrop, Captions, GOLD, INK, IVORY, clamp} from './Intro';
import {CornerVoice, Draw, PacedVoice, captionMs, pace, takeOf, voiceLevel} from './scene-kit';

// Section 0b "Mở chuyện" (script v4, lock v1): the grandmother and the door threshold, told by the narrator.
// Gold line drawings in code (option B); people may be drawn (user 2026-10-31). One beat per spoken sentence,
// started from the narration's phrase ranges, with small motion inside every beat (image-prompts.md, 0b).
export type MoChuyenProps = {voice: string; channelLabel: string};
// Paced like the body sections (scene-kit pace): a longer rest before each new scene's sentence (review 1: "hơi nhanh").
const SCENE_SENTENCES = [1, 2, 3, 5, 6, 7];
const paced = new Map<string, ReturnType<typeof pace>>();
const pacingOf = (voice: string, fps: number) => {const key = `${voice}@${fps}`;if (!paced.has(key)) paced.set(key, pace(takeOf(voice), SCENE_SENTENCES, fps));return paced.get(key)!;};
export const moChuyenFrames = (voice: string, fps = 30) => pacingOf(voice, fps).frames;
export const moChuyenPacing = (voice: string, fps = 30) => pacingOf(voice, fps);
// Whether the narration is heard at a frame of this part (the episode's body music dips under speech).
export const moChuyenSpeaking = (voice: string, frame: number, fps = 30) => pacingOf(voice, fps).voiceFrame(frame) !== null;
export const moChuyenMetadata: CalculateMetadataFunction<MoChuyenProps> = ({props}) => ({durationInFrames: moChuyenFrames(props.voice)});

const ring = (cx: number, cy: number, r: number) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;
const Fade: FC<{opacity: number; children: ReactNode}> = ({opacity, children}) => opacity > .001 ? <g opacity={opacity}>{children}</g> : null;

// Sentence 0 · an open book whose pages turn to the last chapter.
const Book: FC<{frame: number; start: number; turns: number}> = ({frame, start: s, turns}) => {
  const page = (k: number) => interpolate(frame, [s + 18 + k * 9, s + 30 + k * 9], [1, -1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return <g>
    <Draw frame={frame} from={s} to={s + 24} d="M560 760 C700 720 860 720 960 760 C1060 720 1220 720 1360 760 L1360 330 C1220 290 1060 290 960 330 C860 290 700 290 560 330 Z" width={3} />
    <Draw frame={frame} from={s + 10} to={s + 30} d="M960 330 L960 760" width={2.4} />
    <Draw frame={frame} from={s + 16} to={s + 40} d="M620 400 L900 400 M620 450 L880 450 M620 500 L900 500 M620 550 L860 550 M1020 400 L1300 400 M1020 450 L1280 450" width={2} opacity={.75} />
    {Array.from({length: turns}, (_, k) => {
      const t = page(k);
      return Math.abs(t) < .999 ? <g key={k} transform={`translate(960 0) scale(${t} 1) translate(-960 0)`} opacity={.85}>
        <path d="M960 330 C1060 290 1220 290 1360 330 L1360 760 C1220 720 1060 720 960 760 Z" fill={INK} stroke={GOLD} strokeWidth={2.4} vectorEffect="non-scaling-stroke" />
      </g> : null;
    })}
    {/* last chapter: its title page, where the drawing of the doorway begins */}
    <g opacity={interpolate(frame, [s + 18 + turns * 9, s + 34 + turns * 9], [0, 1], clamp)}>
      <text x={1160} y={470} textAnchor="middle" fill={IVORY} fontSize={34} fontWeight={700} letterSpacing={4}>NÂNG ĐỠ</text>
      <Draw frame={frame} from={s + 26 + turns * 9} to={s + 50 + turns * 9} d="M1060 650 L1060 540 L1260 540 L1260 650 M1040 650 L1280 650" width={2.2} opacity={.9} />
    </g>
  </g>;
};

// Old wooden doorway with a raised threshold (ngạch cửa), doors open inward, warm light inside.
const Doorway: FC<{frame: number; start: number; warmth: number}> = ({frame, start: s, warmth}) => <g>
  <defs><radialGradient id="inside-glow" cx="50%" cy="60%" r="60%"><stop offset="0%" stopColor="#e8c27a" stopOpacity={.32 * warmth} /><stop offset="100%" stopColor="#e8c27a" stopOpacity={0} /></radialGradient></defs>
  <rect x={690} y={230} width={540} height={510} fill="url(#inside-glow)" opacity={interpolate(frame, [s + 20, s + 50], [0, 1], clamp)} />
  <Draw frame={frame} from={s} to={s + 34} d="M470 150 C560 132 700 120 960 118 C1220 120 1360 132 1450 150 C1470 140 1486 126 1494 108 M470 150 C450 140 434 126 426 108" width={2.6} />
  <Draw frame={frame} from={s + 8} to={s + 40} d="M520 140 L512 110 M600 132 L594 100 M680 126 L676 94 M760 122 L758 90 M840 120 L840 88 M920 118 L920 86 M1000 118 L1000 86 M1080 120 L1080 88 M1160 122 L1162 90 M1240 126 L1244 94 M1320 132 L1326 100 M1400 140 L1408 110 M500 108 C700 86 1220 86 1420 108" width={2} opacity={.75} />
  <Draw frame={frame} from={s} to={s + 30} d="M650 770 L650 196 L1270 196 L1270 770" width={3} />
  <Draw frame={frame} from={s + 6} to={s + 36} d="M622 196 L1298 196 M630 168 L1290 168 L1298 196 M622 196 L630 168" width={2} opacity={.8} />
  <Draw frame={frame} from={s + 10} to={s + 40} d="M690 770 L690 236 L1230 236 L1230 770" width={2} opacity={.75} />
  <Draw frame={frame} from={s + 18} to={s + 44} d="M690 236 L812 262 L812 724 L690 744 Z M712 300 L792 312 L792 470 L712 466 Z M712 520 L792 520 L792 690 L712 704 Z" width={2.2} opacity={.75} />
  <Draw frame={frame} from={s + 18} to={s + 44} d="M1230 236 L1108 262 L1108 724 L1230 744 Z M1208 300 L1128 312 L1128 470 L1208 466 Z M1208 520 L1128 520 L1128 690 L1208 704 Z" width={2.2} opacity={.75} />
  <Draw frame={frame} from={s + 24} to={s + 52} d="M600 742 L1320 742 L1320 800 L600 800 Z" width={3} />
  <Draw frame={frame} from={s + 34} to={s + 60} d="M630 760 C760 754 880 766 1010 758 C1120 752 1220 762 1300 756 M640 782 C780 776 900 788 1040 780 C1150 774 1240 784 1296 780" width={2} opacity={.75} />
  <Draw frame={frame} from={s + 30} to={s + 58} d="M560 800 L1360 800 L1400 826 L520 826 Z" width={2} opacity={.75} />
  <Draw frame={frame} from={s + 40} to={s + 70} d="M1420 820 L1440 740 L1520 740 L1540 820 Z M1430 740 L1530 740" width={2.2} opacity={.8} />
  <Draw frame={frame} from={s + 48} to={s + 84} d="M1480 740 C1476 690 1470 650 1440 610 M1480 740 C1486 680 1500 640 1532 600 M1480 740 C1480 690 1484 660 1482 620" width={2} opacity={.75} />
  <Draw frame={frame} from={s + 36} to={s + 66} d="M420 860 L1500 860 M560 800 L470 860 M760 800 L720 860 M960 800 L960 860 M1160 800 L1200 860 M1360 800 L1450 860" width={2} opacity={.75} />
</g>;

// A small child, feet at the origin (about 200 units tall). Running legs swing with the frame; lean tips the
// whole body forward around the feet (falling); sit folds the legs.
const Child: FC<{frame: number; from: number; run?: number; lean?: number; sit?: boolean; lookUp?: number}> = ({frame, from, run = 0, lean = 0, sit = false, lookUp = 0}) => {
  const swing = Math.sin(frame * .55) * 28 * run;
  return <g transform={`rotate(${lean} 0 0)`}>
    <g transform={sit ? 'translate(0 40)' : undefined}>
      <Draw frame={frame} from={from} to={from + 12} d={ring(0, -186 - lookUp * 4, 24)} width={2.6} />
      <Draw frame={frame} from={from + 4} to={from + 14} d={`M-18 ${-204 - lookUp * 4} C-8 ${-222 - lookUp * 4} 12 ${-222 - lookUp * 4} 20 ${-206 - lookUp * 4}`} width={2.2} opacity={.85} />
      <Draw frame={frame} from={from + 6} to={from + 18} d="M-24 -156 C-28 -120 -26 -94 -22 -74 L22 -74 C26 -94 28 -120 24 -156 C12 -164 -12 -164 -24 -156 Z" width={2.4} />
      <Draw frame={frame} from={from + 10} to={from + 20} d="M-22 -74 L-26 -48 L-4 -48 L0 -62 L4 -48 L26 -48 L22 -74" width={2.2} opacity={.9} />
      <g transform={`rotate(${-swing * .8} -22 -148)`}><Draw frame={frame} from={from + 12} to={from + 22} d="M-22 -148 L-44 -112 L-36 -88" width={2.4} /></g>
      <g transform={`rotate(${swing * .8} 22 -148)`}><Draw frame={frame} from={from + 12} to={from + 22} d="M22 -148 L44 -112 L36 -88" width={2.4} /></g>
    </g>
    {sit ? <Draw frame={frame} from={from + 14} to={from + 26} d="M-16 -8 L-50 -4 L-58 2 M16 -8 L50 -4 L58 2" width={2.4} />
      : <>
        <g transform={`rotate(${swing} -14 -48)`}><Draw frame={frame} from={from + 14} to={from + 24} d="M-14 -48 L-16 -2 L-28 0" width={2.4} /></g>
        <g transform={`rotate(${-swing} 14 -48)`}><Draw frame={frame} from={from + 14} to={from + 24} d="M14 -48 L16 -2 L28 0" width={2.4} /></g>
      </>}
  </g>;
};

// The grandmother, slightly bent, hair in a bun, walking stick; feet at the origin (about 250 units tall).
const Grandma: FC<{frame: number; from: number; walk?: number; crouch?: boolean; reach?: number}> = ({frame, from, walk = 0, crouch = false, reach = 0}) => {
  const step = Math.sin(frame * .4) * 14 * walk, bob = Math.abs(Math.sin(frame * .4)) * 3 * walk;
  return <g transform={`translate(0 ${-bob + (crouch ? 60 : 0)})`}>
    <Draw frame={frame} from={from} to={from + 12} d={ring(30, -214, 25)} width={2.6} />
    <Draw frame={frame} from={from + 4} to={from + 14} d={ring(6, -228, 11)} width={2.2} />
    <Draw frame={frame} from={from + 6} to={from + 20} d="M12 -188 C-12 -160 -20 -112 -16 -62 L48 -62 C52 -112 54 -160 50 -188 C40 -198 22 -198 12 -188 Z" width={2.4} />
    <Draw frame={frame} from={from + 10} to={from + 22} d="M-4 -150 L40 -150 M-10 -110 L46 -110" width={2} opacity={.75} />
    {/* arm: holds the stick, or reaches out to the child's shoulder */}
    <Draw frame={frame} from={from + 12} to={from + 24} d={reach ? `M44 -168 C${70 + reach * 30} ${-150 + reach * 10} ${92 + reach * 50} ${-128 + reach * 20} ${100 + reach * 60} ${-120 + reach * 30}` : 'M44 -168 L74 -120 L84 -112'} width={2.4} />
    {reach ? null : <><Draw frame={frame} from={from + 16} to={from + 26} d="M84 -112 L98 0" width={3} /><Draw frame={frame} from={from + 16} to={from + 26} d="M84 -112 C80 -128 96 -134 100 -122" width={3} /></>}
    {crouch ? <Draw frame={frame} from={from + 14} to={from + 26} d="M-16 -62 L-40 -40 L-20 0 M48 -62 L60 -30 L44 0" width={2.4} />
      : <>
        <g transform={`rotate(${step} 0 -62)`}><Draw frame={frame} from={from + 14} to={from + 26} d="M0 -62 L-4 0 L-20 2" width={2.4} /></g>
        <g transform={`rotate(${-step} 34 -62)`}><Draw frame={frame} from={from + 14} to={from + 26} d="M34 -62 L38 0 L54 2" width={2.4} /></g>
      </>}
  </g>;
};

const Sandal: FC<{x: number; y: number; rotate: number; scale?: number; frame: number; from: number}> = ({x, y, rotate, scale = 1, frame, from}) =>
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
    <Draw frame={frame} from={from} to={from + 14} d="M-46 0 C-46 -22 -20 -30 8 -28 C38 -26 52 -14 52 0 C52 14 38 26 8 28 C-20 30 -46 22 -46 0 Z" />
    <Draw frame={frame} from={from + 6} to={from + 20} d="M-8 -26 C-2 -6 -2 6 -8 26" width={2} opacity={.85} />
  </g>;

// Close view: threshold beam across the frame and the grandmother's walking stick tapping it.
const CaneTap: FC<{frame: number; start: number; taps: number[]}> = ({frame, start: s, taps}) => {
  const tap = Math.max(0, ...taps.map((t) => interpolate(frame, [t - 4, t, t + 6], [0, 1, 0], clamp)));
  return <g>
    <defs><radialGradient id="sill-glow" cx="50%" cy="90%" r="70%"><stop offset="0%" stopColor="#e8c27a" stopOpacity={.28} /><stop offset="100%" stopColor="#e8c27a" stopOpacity={0} /></radialGradient></defs>
    <rect x={250} y={60} width={1420} height={540} fill="url(#sill-glow)" opacity={interpolate(frame, [s + 6, s + 30], [0, 1], clamp)} />
    <Draw frame={frame} from={s} to={s + 30} d="M240 700 L240 60 M190 700 L190 60 M1680 700 L1680 60 M1730 700 L1730 60" width={3} />
    <Draw frame={frame} from={s + 12} to={s + 40} d="M560 470 L1360 470 M420 600 L560 470 M800 600 L840 470 M1120 600 L1080 470 M1500 600 L1360 470" width={2} opacity={.75} />
    <Draw frame={frame} from={s} to={s + 26} d="M240 600 L1680 600 L1680 700 L240 700 Z" width={3} />
    <Draw frame={frame} from={s + 8} to={s + 34} d="M270 628 C520 618 760 636 1000 626 C1240 616 1460 632 1650 622 M280 664 C540 656 800 672 1060 662 C1300 652 1500 668 1640 660" width={2} opacity={.75} />
    <g transform={`rotate(${-6 + tap * 6} 1310 150)`}>
      <Draw frame={frame} from={s + 14} to={s + 34} d="M1310 150 L1000 594" width={6} />
      <Draw frame={frame} from={s + 20} to={s + 38} d="M1310 150 C1330 112 1392 104 1414 140 C1426 160 1416 182 1396 186" width={6} />
    </g>
    <g opacity={tap} transform={`translate(1000 598) scale(${.8 + tap * .4})`}><path d="M-46 -24 L-70 -40 M0 -34 L0 -62 M46 -24 L70 -40" stroke={IVORY} strokeWidth={3} strokeLinecap="round" /></g>
  </g>;
};

// Sentence 5 · growing up: height marks climb the door post, small sandals beside a grown-up's shoes.
const GrowthMarks: FC<{frame: number; start: number}> = ({frame, start: s}) => <g>
  <Draw frame={frame} from={s} to={s + 24} d="M820 820 L820 140 M780 820 L780 140" width={3} />
  <Draw frame={frame} from={s + 4} to={s + 26} d="M500 820 L1400 820" width={2.4} opacity={.85} />
  {[0, 1, 2, 3, 4].map((k) => <g key={k} opacity={interpolate(frame, [s + 16 + k * 10, s + 24 + k * 10], [0, 1], clamp)}>
    <path d={`M820 ${700 - k * 105} L880 ${700 - k * 105}`} stroke={IVORY} strokeWidth={2.6} strokeLinecap="round" />
  </g>)}
  <Sandal x={1000} y={790} rotate={-90} scale={.7} frame={frame} from={s + 30} />
  <Sandal x={1060} y={790} rotate={-90} scale={.7} frame={frame} from={s + 34} />
  <Draw frame={frame} from={s + 44} to={s + 64} d="M1160 812 C1160 770 1190 756 1230 760 L1300 772 C1330 778 1332 812 1300 814 Z M1240 812 C1240 776 1270 762 1310 766 L1380 778 C1410 784 1412 812 1380 816 Z" width={2.4} />
</g>;

// Sentence 6 · close view of hands: an old hand rubs a child's bent knee, lifts and points to the threshold.
const OldHand: FC<{frame: number; from: number}> = ({frame, from}) => <g>
  <Draw frame={frame} from={from} to={from + 16} d="M0 0 C30 -30 90 -40 130 -20 C150 -8 150 20 130 34 C90 54 30 50 0 30 Z" width={2.6} />
  <Draw frame={frame} from={from + 6} to={from + 20} d="M0 4 C-30 0 -60 8 -80 22 M2 14 C-28 14 -56 24 -74 40 M4 24 C-22 28 -46 40 -62 56 M8 32 C-12 40 -30 54 -42 70 M40 -26 C30 -50 10 -60 -12 -58" width={2.4} />
  <Draw frame={frame} from={from + 10} to={from + 24} d="M130 -20 L250 -80 M130 34 L262 -24 M250 -80 C270 -70 274 -40 262 -24" width={2.4} />
  <Draw frame={frame} from={from + 14} to={from + 26} d="M80 -14 C88 -6 90 6 84 16 M104 -12 C112 -4 114 8 108 18" width={2} opacity={.75} />
</g>;
const PointingHand: FC<{frame: number; from: number}> = ({frame, from}) => <g>
  <Draw frame={frame} from={from} to={from + 12} d="M0 0 C20 -30 80 -34 100 -10 C110 4 104 30 84 36 C50 44 10 36 0 20 Z" width={2.6} />
  <Draw frame={frame} from={from + 4} to={from + 16} d="M100 -8 L196 -34 C206 -36 210 -22 200 -18 L104 10" width={2.4} />
  <Draw frame={frame} from={from + 6} to={from + 18} d="M60 36 C64 50 60 60 50 64 M36 38 C40 52 36 62 26 66 M0 6 L-110 -40 M2 22 L-104 -16" width={2.2} />
</g>;
const Hands: FC<{frame: number; start: number; point: number}> = ({frame, start: s, point}) => {
  const rub = Math.sin(frame * .35) * 22 * (1 - point);
  return <g>
    {/* the child's bent leg in profile: thigh up to the knee, shin down to a small foot */}
    <Draw frame={frame} from={s} to={s + 22} d="M360 820 C480 740 600 650 700 610 C720 604 736 612 742 628 C760 700 790 790 810 840 L880 846" width={3} />
    <Draw frame={frame} from={s + 6} to={s + 26} d="M380 860 C500 790 620 700 712 664 C760 740 786 820 800 880" width={2.4} opacity={.8} />
    <g transform={`translate(${640 + rub} ${560})`} opacity={1 - point}><OldHand frame={frame} from={s + 10} /></g>
    {/* lifted to point at the threshold beam on the right */}
    <g opacity={point} transform={`translate(1000 ${480 - point * 20})`}><PointingHand frame={frame} from={s} /></g>
    <g opacity={point}><Draw frame={frame} from={s} to={s + 1} d="M1260 520 L1720 520 L1720 590 L1260 590 Z M1280 545 C1400 538 1560 552 1700 544" width={2.6} /></g>
  </g>;
};

// Sentence 7 · a grown-up at a desk under a lamp, a hand on an open book; a small heart appears on the page
// ("muốn thương ai, trước hết phải hiểu").
const Desk: FC<{frame: number; start: number; heart: number}> = ({frame, start: s, heart}) => {
  const lamp = interpolate(frame, [s + 20, s + 40], [0, 1], clamp);
  return <g>
    <path d="M1180 260 L1020 700 L1420 700 Z" fill="#e8c27a" opacity={.1 * lamp} />
    <Draw frame={frame} from={s} to={s + 22} d="M520 700 L1500 700 M560 700 L560 860 M1460 700 L1460 860" width={3} />
    <Draw frame={frame} from={s + 6} to={s + 28} d="M1300 700 L1300 520 L1180 300 M1140 270 L1240 270 L1210 310 L1170 310 Z" width={2.4} />
    <Draw frame={frame} from={s + 10} to={s + 32} d="M900 690 C960 670 1030 670 1080 690 C1130 670 1200 670 1260 690 L1260 640 C1200 620 1130 620 1080 640 C1030 620 960 620 900 640 Z M1080 640 L1080 690" width={2.4} />
    {/* the grown-up from behind: shoulders, head, an arm reaching to the book */}
    <Draw frame={frame} from={s + 14} to={s + 34} d={ring(760, 450, 40)} width={2.6} />
    <Draw frame={frame} from={s + 18} to={s + 40} d="M680 700 C670 600 690 530 760 512 C830 530 850 600 840 700" width={2.6} />
    <Draw frame={frame} from={s + 24} to={s + 46} d="M830 560 C900 600 960 640 1000 664" width={2.4} />
    <Draw frame={frame} from={s + 30} to={s + 50} d="M300 860 L300 380 L460 380 L460 860" width={2} opacity={.7} />
    <Draw frame={frame} from={heart} to={heart + 24} d="M1170 610 C1140 590 1130 570 1146 556 C1158 546 1170 552 1170 564 C1170 552 1182 546 1194 556 C1210 570 1200 590 1170 610 Z" width={2.4} />
  </g>;
};

export const BookHvttMoChuyen: FC<MoChuyenProps> = ({voice: voiceId, channelLabel}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const voice = takeOf(voiceId);
  const pacing = pacingOf(voiceId, fps);
  const at = pacing.at;
  const within = (i: number, share: number) => pacing.at(i) + Math.round((pacing.end(i) - pacing.at(i)) * share);
  // Scene windows (each starts in the rest before its sentence): book · doorway (child, grandmother) · cane ·
  // doorway again (sitting, looking up) · growth marks · hands · desk.
  const sBook = 0, sDoor = at(1) - 14, sCane = within(2, .42) - 6, sSit = at(3) - 14, sGrow = at(5) - 14, sHands = at(6) - 14, sDesk = at(7) - 14;
  const cuts = [sBook, sDoor, sCane, sSit, sGrow, sHands, sDesk, 1e9];
  // One scene fades out before the next fades in (no overlap, review 1).
  const show = (k: number) => interpolate(frame, [cuts[k], cuts[k] + 12, cuts[k + 1] - 12, cuts[k + 1]], [k === 0 ? 1 : 0, 1, 1, 0], clamp);
  const fall = within(1, .58), runIn = interpolate(frame, [sDoor + 10, fall], [0, 1], clamp);
  const tumble = interpolate(frame, [fall - 4, fall + 10], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.6))});
  const cry = frame > fall + 10 && frame < sCane ? (Math.sin(frame * .6) + 1) / 2 : 0;
  const granIn = interpolate(frame, [at(2), within(2, .4)], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const taps = [0, 1, 2].map((k) => within(2, .55) + Math.round(k * .8 * fps));
  const lookUp = interpolate(frame, [at(4), at(4) + 18], [0, 1], clamp);
  const point = interpolate(frame, [within(6, .55), within(6, .55) + 14], [0, 1], clamp);
  const level = voiceLevel(voice, pacing, frame);
  const fadeOut = interpolate(frame, [durationInFrames - .6 * fps, durationInFrames], [1, 0], clamp);
  return <AbsoluteFill style={{background: INK, fontFamily: 'Stoic Sans, sans-serif', overflow: 'hidden'}}>
    <AbsoluteFill style={{opacity: fadeOut}}>
      <Backdrop frame={frame} fps={fps} durationInFrames={durationInFrames} drawFrame={false} />
      <div style={{position: 'absolute', top: 104, left: 0, right: 0, textAlign: 'center', color: GOLD, fontSize: 22, fontWeight: 700, letterSpacing: 8}}>{channelLabel}</div>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute', inset: 0, filter: `drop-shadow(0 0 ${2 + level * 4}px rgba(217,181,111,${.14 + level * .2}))`}}>
        <g transform="translate(144 96) scale(.85)">
          <Fade opacity={show(0)}><Book frame={frame} start={sBook} turns={4} /></Fade>
          <Fade opacity={show(1)}>
            <Doorway frame={frame} start={sDoor} warmth={.6} />
            {/* the child runs in from the right and trips on the threshold */}
            <g transform={`translate(${1520 - runIn * 470 - tumble * 70} ${742 + tumble * 24}) scale(1.4)`}>
              <Child frame={frame} from={sDoor + 6} run={1 - tumble} lean={-tumble * 72} />
            </g>
            <g opacity={tumble}><Sandal x={980 - tumble * 160} y={826} rotate={-70 + tumble * 92} frame={frame} from={fall - 4} /></g>
            <g opacity={cry} transform="translate(960 640)"><path d="M-30 -40 L-52 -62 M0 -50 L0 -78 M30 -40 L52 -62" stroke={IVORY} strokeWidth={3} strokeLinecap="round" /></g>
            {/* the grandmother hurries in from the left */}
            <g opacity={granIn} transform={`translate(${260 + granIn * 330} 812) scale(1.5)`}><Grandma frame={frame} from={at(2)} walk={granIn < 1 ? 1 : 0} /></g>
          </Fade>
          <Fade opacity={show(2)}><CaneTap frame={frame} start={sCane} taps={taps} /></Fade>
          <Fade opacity={show(3)}>
            <Doorway frame={frame} start={sSit - 70} warmth={1.2 + interpolate(frame, [sSit, sSit + 40], [0, .8], clamp)} />
            <g transform="translate(1000 742) scale(1.4)"><Child frame={frame} from={sSit} sit lookUp={lookUp} /></g>
            <g transform="translate(790 742) scale(1.5)"><Grandma frame={frame} from={sSit + 4} crouch reach={1} /></g>
            <Sandal x={1150} y={834} rotate={-90} scale={.86} frame={frame} from={sSit + 12} />
            <Sandal x={1220} y={834} rotate={-90} scale={.86} frame={frame} from={sSit + 18} />
            {/* "lúc đó, đứa bé chỉ thấy hả dạ": the stick now rests against the door post */}
            <g opacity={lookUp}><Draw frame={frame} from={at(4)} to={at(4) + 16} d="M1250 740 L1210 470 M1210 470 C1204 452 1222 446 1228 458" width={3} /></g>
          </Fade>
          <Fade opacity={show(4)}><GrowthMarks frame={frame} start={sGrow} /></Fade>
          <Fade opacity={show(5)}><Hands frame={frame} start={sHands} point={point} /></Fade>
          <Fade opacity={show(6)}><Desk frame={frame} start={sDesk} heart={within(7, .6)} /></Fade>
        </g>
      </svg>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.55) 100%)', pointerEvents: 'none'}} />
      {voice ? <Captions captions={voice.captions} ms={captionMs(pacing, frame, fps)} highlight={/(chương cuối|ngạch cửa|người bà|cẩn thận|hả dạ|lớn lên|dỗ cho cháu yên|nhắc đi nhắc lại|phải hiểu)/gi} /> : null}
      <CornerVoice take={voice} pacing={pacing} frame={frame} />
    </AbsoluteFill>
    {voice ? <PacedVoice take={voice} pacing={pacing} track="02 mở chuyện" /> : null}
  </AbsoluteFill>;
};
