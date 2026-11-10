import type {FC} from 'react';
import {Composition, Folder, registerRoot} from 'remotion';
import {HelloVideo} from './examples/HelloVideo';
import {ProjectCompositions} from './projects/registry';
import {ThreeTrial} from './examples/three-trial/Trial';
import {LooksLibrary} from './looks/LooksRoot';

const Root: FC = () => (
  <>
    <ProjectCompositions />
    <LooksLibrary />
    <Folder name="Examples">
      <Composition id="HelloVideo" component={HelloVideo} durationInFrames={150} fps={30} width={1920} height={1080} />
    </Folder>
    <ThreeTrial />
  </>
);

registerRoot(Root);
