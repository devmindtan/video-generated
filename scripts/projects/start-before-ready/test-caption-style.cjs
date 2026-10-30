const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {parse} = require('@babel/parser');
const root = path.resolve(__dirname, '../../..');
const source = fs.readFileSync(path.join(root, 'src/projects/start-before-ready/Video.tsx'), 'utf8');
const ast = parse(source, {sourceType: 'module', plugins: ['typescript', 'jsx']});
let captionStyle, thumbnailStyle, pattern;
function visit(node) {
  if (node.type === 'VariableDeclarator' && node.id.name === 'captionParts') {
    pattern = node.init.left.arguments[0];
  }
  if (node.type === 'JSXOpeningElement' && node.attributes?.some(a => a.name?.name === 'data-testid' && a.value.value === 'start-before-ready-caption')) {
    captionStyle = Object.fromEntries(node.attributes.find(a => a.name?.name === 'style').value.expression.properties.map(p => [p.key.name, p.value.value]));
  }
  if (node.type === 'JSXOpeningElement' && node.attributes?.some(a => a.name?.name === 'data-testid' && a.value.value === 'start-before-ready-thumbnail')) {
    thumbnailStyle = Object.fromEntries(node.attributes.find(a => a.name?.name === 'style').value.expression.properties.map(p => [p.key.name, p.value.value]));
  }
  if (node.type === 'ObjectProperty' && node.key.name === 'fontWeight') assert.ok([400, 700].includes(node.value.value), 'Use installed font weights, not 500/750/800');
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(v => {if (v && typeof v.type === 'string') visit(v);});
    else if (value && typeof value.type === 'string') visit(value);
  }
}
visit(ast);
const thumbnail = fs.readFileSync(path.join(root, 'src/projects/start-before-ready/Thumbnail.tsx'), 'utf8');
visit(parse(thumbnail, {sourceType: 'module', plugins: ['typescript', 'jsx']}));
assert.equal(thumbnailStyle.fontFamily, 'Stoic Sans, sans-serif');
assert.equal(thumbnailStyle.fontWeight, 700, 'Supporting copy must inherit Bold, not Regular');
assert.match(thumbnail, /color: '#dcb777'/, 'Keep gold brand emphasis');
assert.equal((thumbnail.match(/<CanvasImage\b/g)||[]).length, 1, 'Thumbnail uses one clear hero, not split panels');
assert.match(thumbnail, /start-before-ready\/images\/01-threshold\.png/);
assert.match(thumbnail, /ĐỢI HẾT SỢ…/);
assert.match(thumbnail, /ĐẾN BAO GIỜ/);
assert.match(thumbnail, /MỚI LÀM\?/);
assert.doesNotMatch(thumbnail, /NGÃ XUỐNG|CHƯA PHẢI HẾT/);
assert.equal(captionStyle.fontWeight, 700);
assert.equal(captionStyle.fontFamily, 'Stoic Sans, sans-serif');
assert.equal(captionStyle.fontSize, 44);
assert.equal(pattern.type, 'RegExpLiteral');
const highlight = new RegExp(pattern.pattern, pattern.flags);
const pages = JSON.parse(fs.readFileSync(path.join(root, 'src/projects/start-before-ready/captions.json'), 'utf8')).flat();
for (const page of pages) assert.equal(page.text.split(highlight).join(''), page.text, 'Highlighting must preserve original text and spaces');
assert.equal('Bạn có thể bắt đầu.'.split(highlight)[1], 'bắt đầu');
assert.ok(fs.statSync(path.join(root, 'public/stoic/fonts/NotoSans-Bold.ttf')).size > 0);
console.log(`Caption and thumbnail checked: local Bold 700, installed weights and gold emphasis; all ${pages.length} caption pages preserved.`);
