import React from 'react';
import type {FC, ReactNode} from 'react';
import {random} from 'remotion';

// Shared pieces of the code-drawn illustrations (docs/projects/know-when-to-quit/image-prompts.md).
// Every scene draws into a 1080×1300 canvas at the top of the 1080×1920 frame; motion comes only from
// the frame number passed in, so preview, seeking and rendering agree.
export const W = 1080;
export const H = 1300;

export type ArtProps = {frame: number; duration: number; fps: number};

export const Canvas: FC<{children: ReactNode}> = ({children}) => (
  <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{position: 'absolute', top: 0, left: 0}}>
    {children}
  </svg>
);

// Deterministic points for dust, sand and cracks.
export const seeded = (key: string, n: number) => Array.from({length: n}, (_, i) => ({
  a: random(`${key}-a-${i}`), b: random(`${key}-b-${i}`), c: random(`${key}-c-${i}`), d: random(`${key}-d-${i}`),
}));

// Soft film grain over the whole canvas; the seed steps every few frames like real grain.
export const Grain: FC<{id: string; frame: number; opacity?: number}> = ({id, frame, opacity = 0.07}) => (
  <>
    <defs>
      <filter id={id} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={Math.floor(frame / 3) % 7} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
    </defs>
    <rect width={W} height={H} filter={`url(#${id})`} opacity={opacity} style={{mixBlendMode: 'overlay'}} />
  </>
);

// Floating motes inside a box: slow drift plus a gentle sway, wrapping around the box.
export const Motes: FC<{seed: string; n: number; frame: number; box: [number, number, number, number]; color: string; drift?: [number, number]; size?: [number, number]; opacity?: number}> = (
  {seed, n, frame, box: [x, y, w, h], color, drift = [0.15, -0.25], size = [1.2, 3.4], opacity = 0.75},
) => <g>{seeded(seed, n).map((p, i) => {
  const px = x + ((p.a * w + frame * drift[0] * (0.5 + p.c)) % w + w) % w + Math.sin(frame / 40 + p.d * 6) * 6;
  const py = y + ((p.b * h + frame * drift[1] * (0.5 + p.d)) % h + h) % h;
  const twinkle = 0.45 + 0.55 * Math.sin(frame / 18 + p.c * 9) ** 2;
  return <circle key={i} cx={px} cy={py} r={size[0] + p.c * (size[1] - size[0])} fill={color} opacity={opacity * twinkle} />;
})}</g>;

// Fade a value in over the first part of a scene.
export const ease = (t: number) => t * t * (3 - 2 * t);
