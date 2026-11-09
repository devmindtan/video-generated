#!/usr/bin/env node
// Visual sync sheet: one still at the middle of every narrated sentence, with that sentence printed under it, so a
// patch can be checked for pictures that run ahead of or behind the voice before it is sent (book-insights workflow
// rule, user 2026-11-05). Sentences come from src/projects/<slug>/captions.json (the video's own caption timing).
// Writes only to .cache/visual-sync/<slug>/; review stills, never an export or a thumbnail.
//
// Usage: npm run visual-sync -- <slug> [--composition <ID>] [--part <text>] [--from <s>] [--to <s>]
//        [--props '<json>'] [--scale 0.4] [--moment end]
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import os from 'node:os';
import {bundle} from '@remotion/bundler';
import {assertFreeSpace} from './temp-files.mjs';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const option = (name, fallback = null) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const slug = args[0];
if (!slug || slug.startsWith('--') || !/^[a-z0-9-]+$/.test(slug)) {
  console.error('Usage: npm run visual-sync -- <slug> [--composition <ID>] [--part <text>] [--from <s>] [--to <s>]');
  process.exit(2);
}

const fold = (text) => String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase();
const captionsFile = path.join(ROOT, 'src/projects', slug, 'captions.json');
if (!fs.existsSync(captionsFile)) {
  console.error(`${path.relative(ROOT, captionsFile)} not found: run the project's caption export first`);
  process.exit(1);
}
const captions = JSON.parse(fs.readFileSync(captionsFile, 'utf8'));

// Which composition and pages: a long episode has one page list; a shorts project has one per short.
let composition = option('--composition');
let pages;
if (captions.shorts) {
  const shorts = Object.values(captions.shorts);
  const chosen = composition ? shorts.find((s) => s.composition === composition) : shorts[0];
  if (!chosen) {
    console.error(`No short with composition ${composition}; choose one of ${shorts.map((s) => s.composition).join(', ')}`);
    process.exit(1);
  }
  composition = chosen.composition;
  pages = chosen.pages;
} else {
  pages = captions.pages;
  if (!composition) {
    const source = String(captions.source || '');
    composition = source.match(/\b([A-Z][A-Za-z0-9]+) defaultProps/)?.[1] || null;
  }
  if (!composition) {
    console.error('Pass --composition <ID> (captions.json does not name its composition)');
    process.exit(1);
  }
}

// Caption pages → sentences: pages of one part join until the text ends a sentence.
const sentences = [];
let open = null;
for (const page of pages) {
  if (open && open.part !== page.part) {
    sentences.push(open);
    open = null;
  }
  if (!open) open = {part: page.part, text: page.text, startMs: page.startMs, endMs: page.endMs};
  else {
    open.text += ` ${page.text}`;
    open.endMs = page.endMs;
  }
  if (/[.?!…]["”’»)]?$/.test(page.text.trim())) {
    sentences.push(open);
    open = null;
  }
}
if (open) sentences.push(open);

const part = option('--part');
const from = Number(option('--from', '0')) * 1000;
const to = option('--to') === null ? Infinity : Number(option('--to')) * 1000;
const picked = sentences.filter((s) => s.endMs > from && s.startMs < to && (!part || fold(s.part).includes(fold(part))));
if (!picked.length) {
  console.error('No sentence matches; parts: ' + [...new Set(sentences.map((s) => s.part))].join(' | '));
  process.exit(1);
}
if (picked.length > 120) {
  console.error(`${picked.length} sentences: narrow with --part or --from/--to (a patch usually covers one part)`);
  process.exit(1);
}

const outDir = path.join(ROOT, '.cache/visual-sync', slug, composition);
fs.rmSync(outDir, {recursive: true, force: true});
fs.mkdirSync(outDir, {recursive: true});
const inputProps = option('--props') ? JSON.parse(option('--props')) : {};
const scale = Number(option('--scale', '0.4'));

assertFreeSpace(); // a bundle copies public/ (several GB) into the temp folder
console.log(`Bundling for ${composition} (${picked.length} sentences)…`);
const serveUrl = await bundle({entryPoint: path.join(ROOT, 'src/index.tsx'), onProgress: () => {}});
const browser = await openBrowser('chrome');
try {
  // Port 3100, never 3000 (Studio's port): the manager took a render's bundle server for Studio and opened a 404.
  const comp = await selectComposition({serveUrl, id: composition, inputProps, puppeteerInstance: browser, port: 3100});
  const frames = [];
  for (const [index, sentence] of picked.entries()) {
    // --moment end: just after the sentence ends (its drawing should be complete and still on screen), else the middle.
    const mid = option('--moment') === 'end' ? sentence.endMs + 300 : (sentence.startMs + sentence.endMs) / 2;
    const frame = Math.min(comp.durationInFrames - 1, Math.round((mid / 1000) * comp.fps));
    const file = path.join(outDir, `${String(index + 1).padStart(3, '0')}-f${frame}.png`);
    await renderStill({serveUrl, composition: comp, frame, output: file, inputProps, scale, imageFormat: 'png', puppeteerInstance: browser, port: 3100});
    frames.push({file, frame, seconds: frame / comp.fps, part: sentence.part, text: sentence.text});
    process.stdout.write(`\r  ${index + 1}/${picked.length}`);
  }
  process.stdout.write('\n');
  const manifest = path.join(outDir, 'frames.json');
  fs.writeFileSync(manifest, JSON.stringify({slug, composition, frames}, null, 1));
  const sheet = spawnSync(path.join(ROOT, '.venv/bin/python'), ['-I', path.join(ROOT, 'scripts/shared/visual-sync-tile.py'), manifest], {stdio: 'inherit'});
  process.exitCode = sheet.status ?? 1;
} finally {
  await browser.close({silent: true});
  // bundle() copies the whole public/ folder (several GB) into a temp folder; remove it, or every check run leaks one
  // (29 copies filled the disk on 2026-11-08).
  if (serveUrl.startsWith(os.tmpdir())) fs.rmSync(serveUrl, {recursive: true, force: true});
}
