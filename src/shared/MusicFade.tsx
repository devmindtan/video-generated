import {cloneElement, type ReactElement} from 'react';
import type {Audio} from '@remotion/media';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import type {ComponentProps} from 'react';
import {musicEnvelope} from './music-envelope';

// No extra Sequence/timeline item: keep timing on the native editable Audio.
export const MusicFade = ({children, fadeInSeconds, fadeOutSeconds}: {
  children: ReactElement<ComponentProps<typeof Audio>>;
  fadeInSeconds: number;
  fadeOutSeconds: number;
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const props = children.props;
  const start = Math.max(0, props.from ?? 0);
  const end = Math.min(durationInFrames, (props.from ?? 0) + (props.durationInFrames ?? Infinity) / (props.playbackRate ?? 1));
  const envelope = musicEnvelope(frame, start, end, fadeInSeconds * fps, fadeOutSeconds * fps);
  const volume = props.volume ?? 1;
  return cloneElement(children, {volume: typeof volume === 'function' ? (f: number) => volume(f) * envelope : volume * envelope});
};
