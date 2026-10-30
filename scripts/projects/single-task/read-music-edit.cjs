// Read native Studio timing from JSX without executing the composition or using eval.
const fs = require('node:fs');
const path = require('node:path');
const {parse} = require('@babel/parser');

function number(node, fps) {
  if (node?.type === 'NumericLiteral') return node.value;
  if (node?.type === 'Identifier' && node.name === 'fps') return fps;
  if (node?.type === 'ParenthesizedExpression') return number(node.expression, fps);
  if (node?.type === 'UnaryExpression' && node.operator === '-') return -number(node.argument, fps);
  if (node?.type === 'BinaryExpression') {
    const a = number(node.left, fps), b = number(node.right, fps);
    switch (node.operator) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return a / b;
    }
  }
  throw new Error('Unsupported music expression; QA must read the actual inline Edit values, not guess them.');
}

function readMusicEdit(source, fps = 30, duckingFunctionName = 'singleTaskMusicVolume', musicNamePrefix = 'Experience') {
  const file = parse(source, {sourceType: 'module', plugins: ['typescript', 'jsx']});
  const matches = [];
  function visit(node) {
    if (node.type === 'JSXOpeningElement' && node.name.type === 'JSXIdentifier' && node.name.name === 'Audio') {
      const attrs = Object.fromEntries(node.attributes.filter(a => a.type === 'JSXAttribute').map(a => [a.name.name, a.value]));
      if (attrs.name?.type === 'StringLiteral' && attrs.name.value.startsWith(musicNamePrefix)) {
        const get = (key, fallback) => {
          if (!attrs[key]) return fallback;
          if (attrs[key].type !== 'JSXExpressionContainer') throw new Error(`Expected inline numeric ${key}`);
          const value = number(attrs[key].expression, fps);
          if (!Number.isFinite(value)) throw new Error(`Invalid ${key}`);
          return value;
        };
        const src = attrs.src?.expression;
        if (src?.type !== 'CallExpression' || src.callee?.name !== 'staticFile' || src.arguments[0]?.type !== 'StringLiteral') throw new Error('Keep music source editable as staticFile with a literal path');
        const volumeExpression = attrs.volume?.expression;
        const captionDucking = volumeExpression?.type === 'CallExpression' && volumeExpression.callee?.name === duckingFunctionName && volumeExpression.arguments.length === 2 && volumeExpression.arguments[0]?.name === 'frame' && volumeExpression.arguments[1]?.name === 'fps';
        matches.push({src: src.arguments[0].value, from: get('from', 0), trimBefore: get('trimBefore', 0), durationInFrames: get('durationInFrames', null), playbackRate: get('playbackRate', 1), volume: captionDucking ? null : get('volume', 1)});
      }
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value) if (child && typeof child.type === 'string') visit(child);
      } else if (value && typeof value.type === 'string') visit(value);
    }
  }
  visit(file);
  if (matches.length !== 1) throw new Error(`Expected exactly one ${musicNamePrefix} music clip`);
  return matches[0];
}

module.exports = {readMusicEdit};
if (require.main === module) {
  const file = process.argv[2] || path.resolve(__dirname, '../../../src/projects/single-task/Video.tsx');
  console.log(JSON.stringify(readMusicEdit(fs.readFileSync(file, 'utf8'), 30, process.argv[3] || 'singleTaskMusicVolume', process.argv[4] || 'Experience')));
}
