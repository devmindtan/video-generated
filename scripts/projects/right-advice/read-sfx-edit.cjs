// Read actual native Audio timing and gains, never eval/execute TSX.
const {parse} = require('@babel/parser');
const fs = require('node:fs');

function number(node, fps) {
  if (node?.type === 'NumericLiteral') return node.value;
  if (node?.type === 'Identifier' && node.name === 'fps') return fps;
  if (node?.type === 'UnaryExpression' && node.operator === '-') return -number(node.argument, fps);
  if (node?.type === 'BinaryExpression') {
    const a = number(node.left, fps), b = number(node.right, fps);
    if (node.operator === '+') return a + b;
    if (node.operator === '-') return a - b;
    if (node.operator === '*') return a * b;
    if (node.operator === '/') return a / b;
  }
  throw new Error('Unsupported SFX timing expression; do not guess Edit values');
}

function readSfxEdit(source, config, fps = 30) {
  const masterVolume = config.masterVolume ?? 1;
  if (!Number.isFinite(masterVolume) || masterVolume < 0) throw new Error('Invalid SFX master volume');
  const ast = parse(source, {sourceType: 'module', plugins: ['typescript', 'jsx']});
  const cues = [];
  const configured = (node) => {
    if (node?.type === 'BinaryExpression' && node.operator === '*') return configured(node.left) * configured(node.right);
    if (node?.type === 'MemberExpression' && !node.computed && node.object.name === 'sfx' && Object.hasOwn(config, node.property.name) && typeof config[node.property.name] === 'number') return config[node.property.name];
    return number(node, fps);
  };
  function visit(node) {
    if (node.type === 'JSXOpeningElement' && node.name.name === 'Audio') {
      const attrs = Object.fromEntries(node.attributes.filter(a => a.type === 'JSXAttribute').map(a => [a.name.name, a.value]));
      const src = attrs.src?.expression;
      const value = src?.arguments?.[0]?.value;
      if (typeof value === 'string' && value.startsWith('right-advice/audio/sound-v2/')) {
        if (src.type !== 'CallExpression' || src.callee.name !== 'staticFile') throw new Error('SFX must use staticFile literal');
        const get = (key, fallback) => attrs[key] ? number(attrs[key].expression, fps) : fallback;
        const v = attrs.volume?.expression;
        const ducked = v?.type === 'CallExpression' && v.callee.name === 'rightAdviceSfxBedVolume' && v.arguments.length === 3 && v.arguments[0].name === 'frame' && v.arguments[1].name === 'fps';
        const volume = v ? configured(ducked ? v.arguments[2] : v) * (ducked ? masterVolume : 1) : 1;
        const cue = {name: attrs.name?.value, src: value, from: get('from', 0), trimBefore: get('trimBefore', 0), durationInFrames: get('durationInFrames', null), playbackRate: get('playbackRate', 1), volume, ducked};
        for (const [key, val] of Object.entries(cue)) if (['from', 'trimBefore', 'playbackRate', 'volume'].includes(key) || (key === 'durationInFrames' && val !== null)) {
          if (!Number.isFinite(val)) throw new Error(`Invalid SFX ${key}`);
        }
        if (cue.playbackRate <= 0 || cue.trimBefore < 0 || cue.volume < 0) throw new Error('Invalid SFX source/rate/gain');
        cues.push(cue);
      }
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value) if (child && typeof child.type === 'string') visit(child);
      } else if (value && typeof value.type === 'string') visit(value);
    }
  }
  visit(ast);
  if (!cues.length) throw new Error('No sound-v2 Audio clips found');
  return config.enabled ? cues : [];
}

module.exports = {readSfxEdit};
if (require.main === module) console.log(JSON.stringify(readSfxEdit(fs.readFileSync(process.argv[2], 'utf8'), JSON.parse(fs.readFileSync(process.argv[3], 'utf8')))));
