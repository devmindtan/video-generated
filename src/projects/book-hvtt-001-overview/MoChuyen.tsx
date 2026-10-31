import type {FC, ReactNode} from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Easing, Track, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CalculateMetadataFunction} from 'remotion';
import '../../shared/stoic-fonts';
import {Backdrop, Captions, GOLD, INK, IVORY, clamp, ease} from './Intro';
import type {Voice} from './Intro';
import takes from './body-takes.json';

// Section 0b "Mở chuyện", first paragraph: the grandmother and the door threshold. Gold line drawings in the
// series look (user chose option B, 2026-10-31): no photos, no faces. One picture per sentence group, timed
// from the narration's phrase ranges; the drawings glow slightly with the voice.
export type MoChuyenProps = {voice: string; channelLabel: string};
type Take = Voice & {phraseRanges?: {startSeconds: number; endSeconds: number}[]};

const voices = (takes as unknown as {voices: Take[]}).voices;
const TAIL_SECONDS = .8;
const voiceOf = (id: string) => voices.find((v) => v.id === id) ?? voices[0];
export const moChuyenFrames = (voice: string, fps = 30) => Math.ceil(((voiceOf(voice)?.durationSeconds ?? 20) + TAIL_SECONDS) * fps);
export const moChuyenMetadata: CalculateMetadataFunction<MoChuyenProps> = ({props}) => ({durationInFrames: moChuyenFrames(props.voice)});

// Stroke that draws itself between two frames (same line style as scene-kit: width ≥ 2, opacity ≥ .7).
const Draw: FC<{d: string; from: number; to: number; frame: number; width?: number; opacity?: number; fill?: string}> = ({d, from, to, frame, width = 2.4, opacity = 1, fill = 'none'}) =>
  <path d={d} fill={fill} stroke={GOLD} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" opacity={opacity} pathLength={1} strokeDasharray={1} vectorEffect="non-scaling-stroke"
    strokeDashoffset={interpolate(frame, [from, to], [1, 0], {...clamp, easing: ease})} />;

const Sandal: FC<{x: number; y: number; rotate: number; scale?: number; frame: number; from: number}> = ({x, y, rotate, scale = 1, frame, from}) =>
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
    <Draw frame={frame} from={from} to={from + 14} d="M-46 0 C-46 -22 -20 -30 8 -28 C38 -26 52 -14 52 0 C52 14 38 26 8 28 C-20 30 -46 22 -46 0 Z" />
    <Draw frame={frame} from={from + 6} to={from + 20} d="M-8 -26 C-2 -6 -2 6 -8 26" width={2} opacity={.85} />
    <Draw frame={frame} from={from + 10} to={from + 24} d="M-30 -18 Q-14 0 -30 18" width={2} opacity={.75} />
  </g>;

// Old wooden doorway with a raised threshold (ngạch cửa), doors open inward, warm light inside.
const Doorway: FC<{frame: number; start: number; warmth: number}> = ({frame, start: s, warmth}) => <g>
  <defs>
    <radialGradient id="inside-glow" cx="50%" cy="60%" r="60%"><stop offset="0%" stopColor="#e8c27a" stopOpacity={.32 * warmth} /><stop offset="100%" stopColor="#e8c27a" stopOpacity={0} /></radialGradient>
  </defs>
  <rect x={690} y={230} width={540} height={510} fill="url(#inside-glow)" opacity={interpolate(frame, [s + 20, s + 50], [0, 1], clamp)} />
  {/* tiled roof eave of an old house, curling up at both ends */}
  <Draw frame={frame} from={s} to={s + 34} d="M470 150 C560 132 700 120 960 118 C1220 120 1360 132 1450 150 C1470 140 1486 126 1494 108 M470 150 C450 140 434 126 426 108" width={2.6} />
  <Draw frame={frame} from={s + 8} to={s + 40} d="M520 140 L512 110 M600 132 L594 100 M680 126 L676 94 M760 122 L758 90 M840 120 L840 88 M920 118 L920 86 M1000 118 L1000 86 M1080 120 L1080 88 M1160 122 L1162 90 M1240 126 L1244 94 M1320 132 L1326 100 M1400 140 L1408 110 M500 108 C700 86 1220 86 1420 108" width={2} opacity={.75} />
  {/* frame posts and lintel */}
  <Draw frame={frame} from={s} to={s + 30} d="M650 770 L650 196 L1270 196 L1270 770" width={3} />
  <Draw frame={frame} from={s + 6} to={s + 36} d="M622 196 L1298 196 M630 168 L1290 168 L1298 196 M622 196 L630 168" width={2} opacity={.8} />
  <Draw frame={frame} from={s + 10} to={s + 40} d="M690 770 L690 236 L1230 236 L1230 770" width={2} opacity={.75} />
  {/* doors swung open inward */}
  <Draw frame={frame} from={s + 18} to={s + 44} d="M690 236 L812 262 L812 724 L690 744 Z M712 300 L792 312 L792 470 L712 466 Z M712 520 L792 520 L792 690 L712 704 Z" width={2.2} opacity={.75} />
  <Draw frame={frame} from={s + 18} to={s + 44} d="M1230 236 L1108 262 L1108 724 L1230 744 Z M1208 300 L1128 312 L1128 470 L1208 466 Z M1208 520 L1128 520 L1128 690 L1208 704 Z" width={2.2} opacity={.75} />
  {/* the raised threshold beam and its wood grain */}
  <Draw frame={frame} from={s + 24} to={s + 52} d="M600 742 L1320 742 L1320 800 L600 800 Z" width={3} />
  <Draw frame={frame} from={s + 34} to={s + 60} d="M630 760 C760 754 880 766 1010 758 C1120 752 1220 762 1300 756 M640 782 C780 776 900 788 1040 780 C1150 774 1240 784 1296 780" width={2} opacity={.75} />
  {/* stone step and a potted plant beside the door */}
  <Draw frame={frame} from={s + 30} to={s + 58} d="M560 800 L1360 800 L1400 826 L520 826 Z" width={2} opacity={.75} />
  <Draw frame={frame} from={s + 40} to={s + 70} d="M1420 820 L1440 740 L1520 740 L1540 820 Z M1430 740 L1530 740" width={2.2} opacity={.8} />
  <Draw frame={frame} from={s + 48} to={s + 84} d="M1480 740 C1476 690 1470 650 1440 610 M1480 740 C1486 680 1500 640 1532 600 M1480 740 C1480 690 1484 660 1482 620 M1440 610 C1420 606 1412 620 1426 634 C1436 630 1442 620 1440 610 M1532 600 C1552 598 1558 614 1542 626 C1532 620 1528 610 1532 600 M1482 620 C1470 604 1478 588 1492 594 C1496 606 1490 616 1482 620" width={2} opacity={.75} />
  {/* floor tiles in perspective */}
  <Draw frame={frame} from={s + 36} to={s + 66} d="M420 860 L1500 860 M560 800 L470 860 M760 800 L720 860 M960 800 L960 860 M1160 800 L1200 860 M1360 800 L1450 860" width={2} opacity={.75} />
</g>;

// Close view: threshold beam across the frame and grandmother's walking stick tapping it.
const CaneTap: FC<{frame: number; start: number; taps: number[]}> = ({frame, start: s, taps}) => {
  const tap = Math.max(0, ...taps.map((t) => interpolate(frame, [t - 4, t, t + 6], [0, 1, 0], clamp)));
  return <g>
    {/* close view of the same doorway: door posts, the lit floor inside going back, so the beam reads as the sill */}
    <rect x={250} y={60} width={1420} height={540} fill="url(#sill-glow)" opacity={interpolate(frame, [s + 6, s + 30], [0, 1], clamp)} />
    <defs><radialGradient id="sill-glow" cx="50%" cy="90%" r="70%"><stop offset="0%" stopColor="#e8c27a" stopOpacity={.28} /><stop offset="100%" stopColor="#e8c27a" stopOpacity={0} /></radialGradient></defs>
    <Draw frame={frame} from={s} to={s + 30} d="M240 700 L240 60 M190 700 L190 60 M1680 700 L1680 60 M1730 700 L1730 60" width={3} />
    <Draw frame={frame} from={s + 12} to={s + 40} d="M560 470 L1360 470 M420 600 L560 470 M800 600 L840 470 M1120 600 L1080 470 M1500 600 L1360 470" width={2} opacity={.75} />
    <Draw frame={frame} from={s} to={s + 26} d="M240 600 L1680 600 L1680 700 L240 700 Z" width={3} />
    <Draw frame={frame} from={s + 8} to={s + 34} d="M270 628 C520 618 760 636 1000 626 C1240 616 1460 632 1650 622 M280 664 C540 656 800 672 1060 662 C1300 652 1500 668 1640 660" width={2} opacity={.75} />
    <Draw frame={frame} from={s + 10} to={s + 36} d="M180 770 L1740 770 M420 700 L330 770 M800 700 L780 770 M1180 700 L1200 770 M1560 700 L1620 770" width={2} opacity={.75} />
    {/* stick pivots at the hand end (top right) and comes down on the beam */}
    <g transform={`rotate(${-6 + tap * 6} 1310 150)`}>
      <Draw frame={frame} from={s + 14} to={s + 34} d="M1310 150 L1000 594" width={6} />
      <Draw frame={frame} from={s + 20} to={s + 38} d="M1310 150 C1330 112 1392 104 1414 140 C1426 160 1416 182 1396 186" width={6} />
    </g>
    {/* tap marks on the beam */}
    <g opacity={tap} transform={`translate(1000 598) scale(${.8 + tap * .4})`}>
      <path d="M-46 -24 L-70 -40 M0 -34 L0 -62 M46 -24 L70 -40" stroke={IVORY} strokeWidth={3} strokeLinecap="round" />
    </g>
  </g>;
};

const Fade: FC<{opacity: number; children: ReactNode}> = ({opacity, children}) => opacity > .001 ? <g opacity={opacity}>{children}</g> : null;

export const BookHvttMoChuyen: FC<MoChuyenProps> = ({voice: voiceId, channelLabel}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const voice = voiceOf(voiceId);
  const ranges = voice?.phraseRanges ?? [];
  const at = (i: number, fallback: number) => Math.round((ranges[i]?.startSeconds ?? fallback) * fps);
  // Sentences: 1 stumble at the threshold · 2–3 grandmother scolds the threshold · 4 "đi đứng cẩn thận".
  const sceneB = at(1, 6) - 6, sceneC = at(3, 14) - 6;
  const fall = at(0, 0) + Math.round(((ranges[0]?.endSeconds ?? 6) - (ranges[0]?.startSeconds ?? 0)) * .62 * fps);
  const taps = [0, 1, 2].map((k) => at(2, 9) + Math.round((.6 + k * .9) * fps));
  const level = voice && frame < voice.frames ? voice.level[Math.min(frame, voice.frames - 1)] / 100 : 0;
  const a = interpolate(frame, [sceneB - 8, sceneB + 8], [1, 0], clamp);
  const b = interpolate(frame, [sceneB - 8, sceneB + 8, sceneC - 8, sceneC + 8], [0, 1, 1, 0], clamp);
  const c = interpolate(frame, [sceneC - 8, sceneC + 8], [0, 1], clamp);
  const tumble = interpolate(frame, [fall - 6, fall + 10], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.6))});
  const fadeOut = interpolate(frame, [durationInFrames - .6 * fps, durationInFrames], [1, 0], clamp);
  return <AbsoluteFill style={{background: INK, fontFamily: 'Stoic Sans, sans-serif', overflow: 'hidden'}}>
    <AbsoluteFill style={{opacity: fadeOut}}>
      <Backdrop frame={frame} fps={fps} durationInFrames={durationInFrames} drawFrame={false} />
      <div style={{position: 'absolute', top: 104, left: 0, right: 0, textAlign: 'center', color: GOLD, fontSize: 22, fontWeight: 700, letterSpacing: 8}}>{channelLabel}</div>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute', inset: 0, filter: `drop-shadow(0 0 ${2 + level * 4}px rgba(217,181,111,${.14 + level * .2}))`}}>
        {/* scaled into the space between the channel label and the captions */}
        <g transform="translate(144 96) scale(.85)">
          <Fade opacity={a}>
            <Doorway frame={frame} start={0} warmth={.6} />
            <g opacity={tumble}><Sandal x={1380 - (1 - tumble) * 160} y={826} rotate={-70 + tumble * 92} frame={frame} from={fall - 6} /></g>
          </Fade>
          <Fade opacity={b}><CaneTap frame={frame} start={sceneB} taps={taps} /></Fade>
          <Fade opacity={c}>
            <Doorway frame={frame} start={sceneC - 70} warmth={1.2 + interpolate(frame, [at(4, 20), at(4, 20) + 40], [0, .8], clamp)} />
            <Sandal x={918} y={834} rotate={-90} scale={.86} frame={frame} from={sceneC + 6} />
            <Sandal x={1002} y={834} rotate={-90} scale={.86} frame={frame} from={sceneC + 12} />
            {/* paragraph 2: "hiểu lòng mình, và hiểu lòng người" — two hearts in the lit doorway */}
            {ranges.length > 4 ? <g opacity={interpolate(frame, [at(6, 26), at(6, 26) + 18], [0, 1], clamp)}>
              <path d="M890 520 C808 468 830 408 890 445 C950 408 972 468 890 520 Z" fill="none" stroke={IVORY} strokeWidth={2.6} />
              <path d="M1030 520 C948 468 970 408 1030 445 C1090 408 1112 468 1030 520 Z" fill="none" stroke={IVORY} strokeWidth={2.6} />
            </g> : null}
          </Fade>
        </g>
      </svg>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.55) 100%)', pointerEvents: 'none'}} />
      {voice ? <Captions captions={voice.captions} ms={frame * 1000 / fps} highlight={/(ngạch cửa|Bà chạy tới|mắng cái ngạch cửa|cẩn thận|hiểu lòng mình|hiểu lòng người)/gi} /> : null}
    </AbsoluteFill>
    {voice ? <Track name={`Giọng · 02 mở chuyện · ${voice.name}`}>
      <Audio src={staticFile(voice.file)} from={0} />
    </Track> : null}
  </AbsoluteFill>;
};
