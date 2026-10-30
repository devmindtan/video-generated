import assert from 'node:assert/strict';
import {musicEnvelope} from '../../../src/shared/music-envelope.ts';

const gain = (frame, start = 0, end = 1440) => musicEnvelope(frame, start, end, 30, 60);
assert.equal(gain(0), 0);
assert.equal(gain(15), .5);
assert.equal(gain(30), 1);
assert.equal(gain(1379), 1);
assert.equal(gain(1409), .5);
assert.equal(gain(1439), 0);
assert.equal(gain(1440), 0);
// Edited clip: delayed start and shortened end, no stale 48-second fade.
assert.equal(gain(90, 90, 900), 0);
assert.equal(gain(105, 90, 900), .5);
assert.equal(gain(869, 90, 900), .5);
assert.equal(gain(899, 90, 900), 0);
assert.equal(gain(1000, 90, 900), 0);
for (let f = -1; f <= 15; f++) {
  const value = gain(f, 0, 15);
  assert.ok(value >= 0 && value <= 1, 'Short clips must not create negative gains');
}
assert.equal(gain(0, 0, 0), 0);
console.log('Music fade checks passed: default, moved, trimmed, short and empty clips.');
