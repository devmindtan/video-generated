import type {FC} from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {Draw, FPS, FRAMES, Shot, Svg, clamp, progress} from './kit';
import {Ground, Lights, Rig, Stage} from './three-kit';

// Subject 2: a cairn of balanced stones ("cân bằng không đến từ đứng yên"). Stones land one by one with a small settle.
const caption = {before: '', gold: 'Cân bằng', after: ' không đến từ việc đứng yên.'};
// [width, height, depth, x offset, tilt] per stone, bottom to top; same order and timing in both versions.
const stones: [number, number, number, number, number][] = [[2.6, .9, 2.0, 0, 0], [2.0, .75, 1.6, .12, .05], [1.55, .62, 1.25, -.1, -.06], [1.1, .5, .9, .06, .07], [.72, .4, .6, -.03, -.04]];
const landAt = (i: number) => (.4 + i * .95) * FPS;
const settle = Easing.out(Easing.back(2.2));
const yOf = (i: number) => stones.slice(0, i).reduce((y, s) => y + s[1] * .82, 0) + stones[i][1] / 2;

export const CairnBefore: FC = () => {
  const frame = useCurrentFrame(), scale = 150, base = 800;
  return <Shot tag="Trước · nét vẽ 2D" caption={caption}>
    <Svg>
      <Draw d="M560 800 C760 790 1160 790 1360 800" from={0} to={.6 * FPS} />
      {stones.map(([w, h, , dx, tilt], i) => {
        const s = landAt(i), drop = interpolate(frame, [s - .5 * FPS, s], [-380, 0], {...clamp, easing: settle});
        const cx = 960 + dx * scale, cy = base - yOf(i) * scale, rx = w * scale / 2, ry = h * scale / 2;
        return frame < s - .5 * FPS ? null : <g key={i} transform={`translate(0 ${drop}) rotate(${tilt * 57} ${cx} ${cy})`}>
          <Draw d={`M${cx - rx} ${cy} C${cx - rx} ${cy - ry * 1.35} ${cx + rx} ${cy - ry * 1.35} ${cx + rx} ${cy} C${cx + rx} ${cy + ry * 1.3} ${cx - rx} ${cy + ry * 1.3} ${cx - rx} ${cy}`} from={s - .5 * FPS} to={s + .1 * FPS} />
          <Draw d={`M${cx - rx * .5} ${cy - ry * .45} C${cx - rx * .15} ${cy - ry * .7} ${cx + rx * .2} ${cy - ry * .7} ${cx + rx * .45} ${cy - ry * .5}`} from={s} to={s + .4 * FPS} width={1.8} opacity={.7} />
        </g>;
      })}
    </Svg>
  </Shot>;
};

export const CairnAfter: FC = () => {
  const frame = useCurrentFrame(), t = frame / FRAMES;
  const angle = interpolate(t, [0, 1], [.5, -.25]), dist = interpolate(t, [0, 1], [9.5, 8]);
  const top = yOf(stones.length - 1);
  return <Shot tag="Sau · 3D" caption={caption}>
    <Stage fog={[8, 24]}>
      <Rig position={[Math.sin(angle) * dist, 2.4 + t * .6, Math.cos(angle) * dist]} target={[0, 1.55, 0]} fov={32} />
      <Lights keyLight={[-5, 8, 4]} intensity={2.6} />
      <Ground />
      {stones.map(([w, h, d, dx, tilt], i) => {
        const s = landAt(i), drop = interpolate(frame, [s - .5 * FPS, s], [5, 0], {...clamp, easing: settle});
        const shown = progress(frame, s - .5 * FPS, s - .3 * FPS);
        if (shown <= 0) return null;
        return <mesh key={i} position={[dx, yOf(i) + drop, 0]} rotation={[0, i * .9, tilt]} scale={[w / 2, h / 2, d / 2]} castShadow receiveShadow>
          {/* low-poly sphere squashed into a pebble; flat shading gives the worn facets */}
          <icosahedronGeometry args={[1, 3]} />
          <meshStandardMaterial color={['#6d756c', '#7b8077', '#5f6862', '#858a80', '#6a716a'][i]} roughness={.88} flatShading />
        </mesh>;
      })}
      {/* faint gold glow above the finished stack */}
      <pointLight position={[0, top + 1.2, 1]} intensity={6 * progress(frame, landAt(stones.length - 1), landAt(stones.length - 1) + FPS)} distance={6} color="#d9b56f" />
    </Stage>
  </Shot>;
};
