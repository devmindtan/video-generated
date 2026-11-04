import type {FC} from 'react';
import {Vector2} from 'three';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {Draw, FPS, FRAMES, GOLD, Shot, Svg, clamp, progress} from './kit';
import {Ground, Lights, Rig, Stage} from './three-kit';

// Subject 3: an hourglass ("thời gian không chờ ai"). Sand runs from top to bottom over the same seconds in both.
const caption = {before: '', gold: 'Thời gian', after: ' không chờ ai cả.'};
const flowOf = (frame: number) => interpolate(frame, [1 * FPS, 7.4 * FPS], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});

export const HourglassBefore: FC = () => {
  const frame = useCurrentFrame(), p = flowOf(frame), show = progress(frame, .9 * FPS, 1.2 * FPS);
  const top = 470 - 140 * (1 - p), heap = 140 * p; // sand surface in the top bulb, heap height in the bottom bulb
  return <Shot tag="Trước · nét vẽ 2D" caption={caption}>
    <Svg>
      <Draw d="M820 250 H1100 M820 830 H1100" from={0} to={.5 * FPS} width={4} />
      <Draw d="M850 262 C850 420 940 470 952 540 C940 610 850 660 850 818 M1070 262 C1070 420 980 470 968 540 C980 610 1070 660 1070 818" from={.2 * FPS} to={1 * FPS} />
      <g opacity={show}>
        {p < 1 && <path d={`M${960 - (1 - p) * 95} ${top} Q960 ${top + 8} ${960 + (1 - p) * 95} ${top} L962 535 L958 535 Z`} fill={GOLD} opacity={.55} />}
        {p > 0 && p < 1 && <line x1={960} y1={540} x2={960} y2={812 - heap} stroke={GOLD} strokeWidth={3} opacity={.8} />}
        {p > 0 && <path d={`M${960 - 30 - p * 80} 814 Q960 ${814 - heap * 1.5} ${960 + 30 + p * 80} 814 Z`} fill={GOLD} opacity={.55} />}
      </g>
    </Svg>
  </Shot>;
};

// Glass bulb profile (radius, height) revolved around y: narrow neck at 0, rounded bulbs, open at both ends.
const profile = Array.from({length: 41}, (_, i) => {
  const y = -1.6 + i * .08, a = Math.abs(y);
  return new Vector2(.1 + .88 * Math.sin(Math.min(a / 1.6, 1) * Math.PI * .62) ** 1.4, y);
});

export const HourglassAfter: FC = () => {
  const frame = useCurrentFrame(), p = flowOf(frame), t = frame / FRAMES;
  const turn = interpolate(t, [0, 1], [-.5, .5]), dist = 12.5;
  const topH = 1.15 * (1 - p), heapH = .9 * Math.sqrt(p);
  return <Shot tag="Sau · 3D" caption={caption}>
    <Stage fog={[8, 22]}>
      <Rig position={[Math.sin(turn) * dist, 1.4, Math.cos(turn) * dist]} target={[0, -.3, 0]} fov={30} />
      <Lights keyLight={[-4, 7, 5]} intensity={2.2} />
      <Ground y={-1.95} />
      {/* wooden caps and three posts */}
      {[-1.75, 1.75].map((y) => <mesh key={y} position={[0, y, 0]} castShadow receiveShadow><cylinderGeometry args={[1.25, 1.25, .28, 48]} /><meshStandardMaterial color="#5a3d26" roughness={.6} /></mesh>)}
      {[0, 1, 2].map((i) => <mesh key={i} position={[Math.cos(i * 2.094) * 1.08, 0, Math.sin(i * 2.094) * 1.08]} castShadow><cylinderGeometry args={[.06, .06, 3.3, 12]} /><meshStandardMaterial color="#6b4a2f" roughness={.55} /></mesh>)}
      {/* sand: top cone shrinking toward the neck, falling stream, heap growing in the bottom bulb */}
      {topH > .02 && <mesh position={[0, .06 + topH / 2, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[.82 * topH / 1.15 + .05, topH, 48]} /><meshStandardMaterial color="#d9b56f" roughness={.9} /></mesh>}
      {p > 0 && p < 1 && <mesh position={[0, (-1.58 + heapH + .06) / 2, 0]}><cylinderGeometry args={[.025, .025, .06 - (-1.58 + heapH), 8]} /><meshStandardMaterial color="#e3c27c" emissive="#6b4f1d" roughness={.8} /></mesh>}
      {heapH > .02 && <mesh position={[0, -1.6 + heapH / 2, 0]} castShadow><coneGeometry args={[.25 + .6 * Math.sqrt(p), heapH, 48]} /><meshStandardMaterial color="#d9b56f" roughness={.9} /></mesh>}
      <mesh castShadow>
        <latheGeometry args={[profile, 64]} />
        <meshPhysicalMaterial color="#dfe9e3" roughness={.08} metalness={.1} clearcoat={1} transparent opacity={.2} depthWrite={false} side={2} />
      </mesh>
    </Stage>
  </Shot>;
};
