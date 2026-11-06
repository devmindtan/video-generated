const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {workflow, MODEL, LOCKED, assertUnlocked} = require('./cli.cjs');

test('local image generation stays locked until the user explicitly re-enables it', () => {
  assert.equal(LOCKED, true);
  assert.throws(() => assertUnlocked(), /tạm khóa/);
});

test('SDXL workflow is local, reproducible and saves one image', () => {
  const o = {project: 'book-hvtt-001-overview', name: 'test', width: 1216, height: 704, steps: 30, cfg: 7, seed: 42};
  const graph = workflow(o, 'cinematic room', 'text, face');
  assert.equal(graph['1'].inputs.ckpt_name, MODEL);
  assert.equal(graph['2'].inputs.width, 1216);assert.equal(graph['2'].inputs.height, 704);
  assert.equal(graph['5'].inputs.seed, 42);assert.equal(graph['5'].inputs.sampler_name, 'dpmpp_2m');
  assert.match(graph['7'].inputs.filename_prefix, /book-hvtt-001-overview\/test-42$/);
  assert.equal(Object.values(graph).filter(node => node.class_type === 'SaveImage').length, 1);
});

test('workflow accepts prompts as data and never adds a remote provider node', () => {
  const graph = workflow({project: 'x', name: 'x', width: 1024, height: 1024, steps: 20, cfg: 6, seed: 1}, 'one person', 'logo');
  assert.equal(graph['3'].inputs.text, 'one person');assert.equal(graph['4'].inputs.text, 'logo');
  assert.ok(Object.values(graph).every(node => !/api|partner|cloud/i.test(node.class_type)));
});
