const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const source = fs.readFileSync(path.join(root, 'src/projects/crystal-planet-awakening/Video.tsx'), 'utf8');
const registry = fs.readFileSync(path.join(root, 'src/projects/registry.tsx'), 'utf8');

assert.match(source, /<ThreeCanvas[\s\S]*width=\{width\}[\s\S]*height=\{height\}/, 'ThreeCanvas must have explicit composition dimensions');
assert.match(source, /<ambientLight\b/, '3D scene needs ambient light');
assert.match(source, /<directionalLight\b/, '3D scene needs a directional key light');
assert.match(source, /useCurrentFrame\(\)/, 'Motion must be driven by the Remotion frame');
assert.doesNotMatch(source, /\buseFrame\b/, 'React Three Fiber useFrame is not deterministic in Remotion');
assert.doesNotMatch(source, /animation\s*:/, 'CSS animations do not render deterministically');
assert.doesNotMatch(source, /<(Audio|Video)\b/, 'The silent experiment should not include media tracks');
assert.match(source, /fontSize: 94/, 'End title must remain readable in a vertical video');
assert.match(registry, /id="CrystalPlanetAwakening"[\s\S]*durationInFrames=\{360\}[\s\S]*fps=\{30\}[\s\S]*width=\{1080\}[\s\S]*height=\{1920\}/, 'Registry must keep the approved 12-second vertical composition');
assert.match(registry, /calculateMetadata=\{renderTo\('crystal-planet-awakening'\)\}/, 'Studio render output must stay scoped to the project');

console.log('Crystal planet QA passed: deterministic 3D, lit scene, silent track and 12-second vertical registration.');
