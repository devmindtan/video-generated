#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const DEFAULT_SPECS = [
  'src/projects/book-hvtt-001-overview/thumbnail-alternative.json',
  'src/projects/book-ah-001-overview/thumbnail-alternative.json',
];

const rgb = (hex) => {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
};

const luminance = (hex) => rgb(hex).map((channel) => {
  const value = channel / 255;
  return value <= .03928 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
}).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);

const contrast = (a, b) => {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + .05) / (darker + .05);
};

const score = (spec) => {
  const words = spec.messageLines.join(' ').trim().split(/\s+/).filter(Boolean).length;
  const contrastRatios = [spec.colors.primary, spec.colors.accent].map((color) => contrast(color, spec.colors.background));
  const checks = [
    {name: 'Tương phản chữ/nền ≥ 7:1', points: 20, pass: contrastRatios.every((ratio) => ratio >= 7)},
    {name: 'Có viền hoặc đổ bóng', points: 10, pass: spec.hasOutlineOrShadow === true},
    {name: 'Tối đa 6 từ, đúng 2 dòng', points: 20, pass: words <= 6 && spec.messageLines.length === 2 && spec.messageLines.every(Boolean)},
    {name: 'Khối chữ chiếm ≥ 40% chiều rộng', points: 15, pass: spec.textWidthRatio >= .4},
    {name: 'Thu còn 1/4 vẫn ≥ 24 px', points: 10, pass: spec.minFontSize / 4 >= 24},
    {name: 'Ảnh full-bleed 16:9', points: 10, pass: spec.fullBleed === true},
    {name: 'Có người/tình huống cụ thể', points: 15, pass: typeof spec.concreteSituation === 'string' && spec.concreteSituation.trim().length >= 12},
  ];
  return {total: checks.reduce((sum, check) => sum + (check.pass ? check.points : 0), 0), words, contrastRatios, checks};
};

let failed = false;
for (const relative of process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_SPECS) {
  const spec = JSON.parse(fs.readFileSync(path.resolve(ROOT, relative), 'utf8'));
  const result = score(spec);
  console.log(`${relative}: ${result.total}/100 — ${result.total >= 60 ? 'ĐẠT' : 'LÀM LẠI'}`);
  console.log(`  ${result.words} từ · tương phản ${result.contrastRatios.map((value) => value.toFixed(1)).join(' / ')}:1`);
  for (const check of result.checks) console.log(`  ${check.pass ? '✓' : '✗'} ${check.points}đ ${check.name}`);
  if (result.total < 60) failed = true;
}

process.exitCode = failed ? 1 : 0;
