import type {FC} from 'react';
import {Composition, Folder} from 'remotion';
import {CairnAfter, CairnBefore} from './Cairn';
import {ColumnsAfter, ColumnsBefore} from './Columns';
import {HourglassAfter, HourglassBefore} from './Hourglass';
import {FPS, FRAMES, SideBySide} from './kit';

// Trial compositions only (not a project): review in Studio, nothing is rendered automatically.
const subjects: [string, string, FC, FC][] = [
  ['Columns', 'Cột đền', ColumnsBefore, ColumnsAfter],
  ['Cairn', 'Chồng đá', CairnBefore, CairnAfter],
  ['Hourglass', 'Đồng hồ cát', HourglassBefore, HourglassAfter],
];

export const ThreeTrial: FC = () => <Folder name="Thu-Nghiem-3D">
  {subjects.map(([id, , Before, After]) => <Folder key={id} name={id}>
    <Composition id={`Trial3D-${id}-SoSanh`} component={() => <SideBySide left={<Before />} right={<After />} />} durationInFrames={FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id={`Trial3D-${id}-Truoc`} component={Before} durationInFrames={FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id={`Trial3D-${id}-Sau`} component={After} durationInFrames={FRAMES} fps={FPS} width={1920} height={1080} />
  </Folder>)}
</Folder>;
