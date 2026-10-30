// Timeline frames, not source-media frames: speed and source trim must not
// change the audible fade length. End at the clip or composition, whichever is first.
export const musicEnvelope = (frame: number, start: number, end: number, fadeIn: number, fadeOut: number) => {
  if (end <= start || frame < start || frame >= end) return 0;
  const enter = fadeIn > 0 ? Math.min(1, (frame - start) / fadeIn) : 1;
  const leave = fadeOut > 0 ? Math.min(1, (end - 1 - frame) / fadeOut) : 1;
  return Math.max(0, Math.min(enter, leave));
};
