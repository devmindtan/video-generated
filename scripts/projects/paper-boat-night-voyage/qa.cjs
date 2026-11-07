const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const scene = fs.readFileSync(path.join(root, 'src/projects/paper-boat-night-voyage/Scene.tsx'), 'utf8');
const video = fs.readFileSync(path.join(root, 'src/projects/paper-boat-night-voyage/Video.tsx'), 'utf8');
const registry = fs.readFileSync(path.join(root, 'src/projects/registry.tsx'), 'utf8');

assert.match(video, /<ThreeCanvas[\s\S]*width=\{width\}[\s\S]*height=\{height\}/);
assert.match(scene, /vertexShader=\{oceanVertexShader\}/);
assert.match(scene, /<PaperBoat\b/);
assert.match(scene, /<Lighthouse\b/);
assert.match(scene, /<Bloom\b/);
assert.match(scene, /useCurrentFrame\(\)/);
assert.doesNotMatch(scene + video, /\buseFrame\b/);
assert.doesNotMatch(scene + video, /<(Audio|Video)\b/);
assert.doesNotMatch(scene + video, /animation\s*:/);
assert.match(video, /fontSize: 96/);
assert.match(video, /fontSize: 86/);
assert.match(registry, /id="PaperBoatNightVoyage"[\s\S]*durationInFrames=\{900\}[\s\S]*fps=\{30\}[\s\S]*width=\{1920\}[\s\S]*height=\{1080\}/);
assert.match(registry, /calculateMetadata=\{renderTo\('paper-boat-night-voyage'\)\}/);

console.log('Paper boat QA passed: 30-second deterministic Three.js voyage, shader ocean, lighthouse and silent track.');
