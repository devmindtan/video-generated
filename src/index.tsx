import type {FC} from 'react';
import {Composition, registerRoot} from 'remotion';
import {HelloVideo} from './examples/HelloVideo';
import {ProjectCompositions} from './projects/registry';

const Root: FC = () => (
  <>
    <ProjectCompositions />
    <Composition id="HelloVideo" component={HelloVideo} durationInFrames={150} fps={30} width={1920} height={1080} />
  </>
);

registerRoot(Root);
