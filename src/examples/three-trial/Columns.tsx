import type {FC} from 'react';
import {Shape} from 'three';
import {interpolate, useCurrentFrame} from 'remotion';
import {Draw, FPS, FRAMES, Shot, Svg, clamp, ease, progress} from './kit';
import {Ground, Lights, Rig, Stage} from './three-kit';

// Subject 1: a temple colonnade ("điều nằm trong tay ta"). Columns appear one by one, then the roof.
const caption = {before: 'Có những điều ', gold: 'nằm trong tay ta', after: ', và có những điều không.'};
const N = 6;
// Pediment: triangle in the x/y plane, extruded in depth.
const pediment = new Shape();pediment.moveTo(-4.6, 0);pediment.lineTo(0, 1.35);pediment.lineTo(4.6, 0);pediment.closePath();
const columnStart = (i: number) => (.3 + i * .38) * FPS; // same build order and timing in both versions
const roofStart = columnStart(N - 1) + .7 * FPS;

export const ColumnsBefore: FC = () => {
  const xs = Array.from({length: N}, (_, i) => 560 + i * 160);
  return <Shot tag="Trước · nét vẽ 2D" caption={caption}>
    <Svg>
      <Draw d="M440 760 H1480 M420 790 H1500 M400 820 H1520" from={0} to={.8 * FPS} width={3} />
      {xs.map((x, i) => {
        const s = columnStart(i), e = s + .9 * FPS;
        return <g key={i}>
          <Draw d={`M${x - 40} 760 V${740} H${x + 40} V760`} from={s} to={s + 6} />
          <Draw d={`M${x - 32} 740 V450 M${x + 32} 740 V450`} from={s + 4} to={e} />
          <Draw d={`M${x - 12} 735 V455 M${x + 12} 735 V455`} from={s + 8} to={e} width={1.8} opacity={.7} />
          <Draw d={`M${x - 46} 450 H${x + 46} V430 H${x - 46} Z`} from={e - 6} to={e + 6} />
        </g>;
      })}
      <Draw d="M440 430 V395 H1480 V430" from={roofStart} to={roofStart + .6 * FPS} />
      <Draw d="M420 395 L960 250 L1500 395" from={roofStart + .4 * FPS} to={roofStart + 1.4 * FPS} width={3.4} />
    </Svg>
  </Shot>;
};

const Column: FC<{x: number; frame: number; start: number}> = ({x, frame, start}) => {
  const rise = interpolate(frame, [start, start + .9 * FPS], [0, 1], {...clamp, easing: ease});
  if (rise <= 0) return null;
  return <group position={[x, 0.75, 0]} scale={[1, rise, 1]}>
    <mesh position={[0, .12, 0]} castShadow receiveShadow><boxGeometry args={[.95, .24, .95]} /><meshStandardMaterial color="#a8956c" roughness={.8} /></mesh>
    {/* 20 flat-shaded faces read as fluting under the raking light */}
    <mesh position={[0, 2.25, 0]} castShadow receiveShadow><cylinderGeometry args={[.33, .38, 4, 20]} /><meshStandardMaterial color="#b8a477" roughness={.75} flatShading /></mesh>
    <mesh position={[0, 4.36, 0]} castShadow><cylinderGeometry args={[.5, .36, .22, 20]} /><meshStandardMaterial color="#a8956c" roughness={.8} /></mesh>
    <mesh position={[0, 4.55, 0]} castShadow><boxGeometry args={[1.05, .16, 1.05]} /><meshStandardMaterial color="#a28e64" roughness={.8} /></mesh>
  </group>;
};

export const ColumnsAfter: FC = () => {
  const frame = useCurrentFrame();
  const roofDrop = interpolate(frame, [roofStart, roofStart + 1.1 * FPS], [3, 0], {...clamp, easing: ease});
  const roofIn = progress(frame, roofStart, roofStart + .4 * FPS);
  const t = frame / FRAMES; // slow dolly in with a gentle orbit
  const angle = interpolate(t, [0, 1], [-.32, .12]), dist = interpolate(t, [0, 1], [30, 24], {easing: ease});
  return <Shot tag="Sau · 3D" caption={caption}>
    <Stage fog={[10, 34]}>
      <Rig position={[Math.sin(angle) * dist, 3.6 + t * .8, Math.cos(angle) * dist]} target={[0, 2.2, 0]} fov={30} />
      <Lights keyLight={[-7, 10, 6]} />
      <Ground />
      {[0, 1, 2].map((i) => <mesh key={i} position={[0, .125 + i * .25, -i * .15]} receiveShadow castShadow>
        <boxGeometry args={[9.6 - i * .5, .25, 3.4 - i * .4]} /><meshStandardMaterial color="#8c7d5c" roughness={.9} />
      </mesh>)}
      {Array.from({length: N}, (_, i) => <Column key={i} x={-3.75 + i * 1.5} frame={frame} start={columnStart(i)} />)}
      {roofIn > 0 && <group position={[0, 5.42 + roofDrop, 0]}>
        <mesh castShadow receiveShadow><boxGeometry args={[9.2, .55, 1.4]} /><meshStandardMaterial color="#ad9a6f" roughness={.8} transparent opacity={roofIn} /></mesh>
        {/* pediment: a three-sided prism lying along x */}
        <mesh position={[0, .27, -.6]} castShadow>
          <extrudeGeometry args={[pediment, {depth: 1.2, bevelEnabled: false}]} /><meshStandardMaterial color="#b8a477" roughness={.8} transparent opacity={roofIn} />
        </mesh>
      </group>}
    </Stage>
  </Shot>;
};
