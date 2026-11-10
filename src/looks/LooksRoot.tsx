import type {FC} from 'react';
import {Composition, Folder} from 'remotion';
import {z} from 'zod';
import {animationStyles, themes} from './looks';
import {SAMPLES} from './StyleSamples';

// Style library samples (user 2026-11-10): one composition per 2D animation style, vertical 6 s, outside the
// project catalog (not a video to publish). The theme is a dropdown in Studio's props panel.
const schema = z.object({theme: z.enum(themes.map((t) => t.id) as [string, ...string[]])});

export const LooksLibrary: FC = () => (
  <Folder name="Thu-Vien-Phong-Cach">
    {animationStyles.map((s) => <Composition key={s.id} id={s.sample} component={SAMPLES[s.sample]} schema={schema} durationInFrames={180} fps={30} width={1080} height={1920}
      defaultProps={{theme: themes.find((t) => t.styles.includes(s.id))?.id ?? themes[0].id}} />)}
  </Folder>
);
