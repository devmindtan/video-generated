import type {FC, ReactNode} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {themeOf} from '../../looks/looks';
import {fade, grow} from '../../looks/diagram-kit';

// Shared by Video.tsx and Chapters.tsx (same beat helpers as kien-truc-ung-dung-web-tong-quan): the theme, the segment timing shape and the beat helpers.
export const THEME = themeOf('ban-ve-ky-thuat');
export type Seg = {file: string; start: number; length: number; duration: number; speechEndsAt: number; sentences: number[]; cut?: boolean};

export const Stage: FC<{children: ReactNode}> = ({children}) =>
  <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{position: 'absolute', inset: 0}}>{children}</svg>;

// Frames inside a segment. at(i, d): sentence i start + d seconds. span(i, j): opacity of a beat that runs from
// sentence i to the end of sentence j; the last beat holds to the segment end. Scene changes are sequential (user
// 2026-11-12, "còn nhiều chỗ đè lên nhau"): the old beat is gone by the next sentence's start (fades out over the 8
// frames before it) and only then does the new one fade in, so two diagrams never share the screen.
// only(i, j): the same for a single callout inside a beat.
export const useBeat = (s: Seg) => {
  const {fps} = useVideoConfig(), f = useCurrentFrame();
  const sec = (x: number) => Math.round(x * fps);
  const at = (i: number, d = 0) => Math.round(((s.sentences[i] ?? s.length) + d) * fps);
  const end = sec(s.length) + 30;
  const span = (i: number, j: number) => fade(f, i === 0 ? 0 : at(i), j + 1 < s.sentences.length ? at(j + 1) : end, 8);
  const only = (i: number, j = i) => fade(f, at(i), j + 1 < s.sentences.length ? at(j + 1) : end, 8);
  const pop = (i: number, d = 0, len = 12) => grow(f, at(i, d), at(i, d) + len);
  return {f, fps, sec, at, span, only, pop};
};
