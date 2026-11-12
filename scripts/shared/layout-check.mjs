#!/usr/bin/env node
// Layout check for code-drawn videos: finds text that overlaps other text, text crossed by a line or a box border,
// text outside the frame, and drawings running into the caption band — across the whole video, not just a few stills.
//
// User 2026-11-12 (kien-truc-ung-dung-web-tong-quan): "Tôi thấy còn nhiều chỗ đè lên nhau lắm". Mid-sentence review
// stills missed overlaps that happen between sentences (two beats cross-fading on the same spot). This tool renders the
// composition frame by frame in Chrome through @remotion/player's Thumbnail (no video render, nothing written to
// public/ or projects/), measures every visible SVG/HTML text box and every stroked SVG shape, and reports each problem
// once with the time range it is on screen.
//
// Usage: npm run layout-check -- <src/.../Video.tsx>#<ExportName> --frames <duration> [--fps 30] [--step 6]
//          [--from <s>] [--to <s>] [--caption-top 900] [--json <out.json>]
// Output: a readable list on stdout and JSON in .cache/layout-check/<export>.json. Exit code 1 when problems are found.
// Port 3101 (never 3000, Studio's port; 3100 is the render port). Temporary bundle in .cache/layout-check/, removed on exit.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {chromium} from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const argv = process.argv.slice(2);
const opt = (name, fallback = null) => {const i = argv.indexOf(name);return i >= 0 ? argv[i + 1] : fallback;};
const target = argv.find((a) => a.includes('#'));
if (!target || argv.includes('-h') || argv.includes('--help')) {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\nimport ')[0].replace(/^#!.*\n/, '').replace(/^\/\/ ?/gm, ''));
  process.exit(target ? 0 : 2);
}
const [file, exportName] = target.split('#');
const fps = Number(opt('--fps', '30')), frames = Number(opt('--frames')), step = Number(opt('--step', '6'));
if (!frames) {console.error('--frames <duration in frames> is required');process.exit(2);}
const from = Math.round(Number(opt('--from', '0')) * fps), to = Math.min(frames - 1, opt('--to') ? Math.round(Number(opt('--to')) * fps) : frames - 1);
const captionTop = Number(opt('--caption-top', '900'));
const work = path.join(ROOT, '.cache/layout-check', `${exportName}-${process.pid}`);
const report = opt('--json') ?? path.join(ROOT, '.cache/layout-check', `${exportName}.json`);

// Audio/video elements are not needed to measure layout; stub them so the page never decodes media.
const stubMedia = {name: 'stub-media', setup(b) {
  b.onResolve({filter: /^@remotion\/media$/}, () => ({path: 'stub', namespace: 'stub-media'}));
  b.onLoad({filter: /.*/, namespace: 'stub-media'}, () => ({contents: 'export const Audio = () => null; export const Video = () => null;', loader: 'js'}));
}};

let server, browser;
const cleanup = () => fs.rmSync(work, {recursive: true, force: true});
try {
  fs.mkdirSync(work, {recursive: true});
  const entry = path.join(work, 'entry.tsx');
  fs.writeFileSync(entry, `import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Thumbnail} from '@remotion/player';
import {${exportName} as C} from ${JSON.stringify(path.resolve(ROOT, file))};
const App = () => {
  const [f, setF] = useState(0);
  (window as any).setFrame = (n: number) => new Promise((r) => {setF(n); requestAnimationFrame(() => requestAnimationFrame(() => r(null)));});
  return <Thumbnail component={C} compositionWidth={1920} compositionHeight={1080} frameToDisplay={f} durationInFrames={${frames}} fps={${fps}} style={{width: 1920, height: 1080}} />;
};
createRoot(document.getElementById('root')!).render(<App />);
`);
  await build({entryPoints: [entry], bundle: true, outfile: path.join(work, 'bundle.js'), format: 'iife', jsx: 'automatic', loader: {'.json': 'json'},
    define: {'process.env.NODE_ENV': '"production"'}, plugins: [stubMedia], logLevel: 'error', nodePaths: [path.join(ROOT, 'node_modules')]});
  fs.writeFileSync(path.join(work, 'index.html'), `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#000}</style>
<script>window.remotion_staticBase='/static';</script><div id="root"></div><script src="/bundle.js"></script>`);

  const types = {'.js': 'text/javascript', '.html': 'text/html', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml'};
  server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    const p = url.startsWith('/static/') ? path.join(ROOT, 'public', url.slice(8)) : path.join(work, url === '/' ? 'index.html' : url);
    const base = url.startsWith('/static/') ? path.join(ROOT, 'public') : work;
    if (!p.startsWith(base) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {res.writeHead(404);res.end();return;}
    res.writeHead(200, {'content-type': types[path.extname(p)] ?? 'application/octet-stream'});
    fs.createReadStream(p).pipe(res);
  });
  await new Promise((r) => server.listen(3101, '127.0.0.1', r));
  browser = await chromium.launch({headless: true, executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome'});
  const page = await browser.newPage({viewport: {width: 1920, height: 1080}});
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('http://127.0.0.1:3101/');
  await page.waitForFunction(() => typeof window.setFrame === 'function', null, {timeout: 30000});
  await page.evaluate(() => document.fonts.ready);
  if (errors.length) console.error('Page errors:', errors.slice(0, 3).join('\n'));

  const found = new Map();
  for (let f = from; f <= to; f += step) {
    await page.evaluate((n) => window.setFrame(n), f);
    const issues = await page.evaluate(({captionTop}) => {
      const op = (el) => {let o = 1;for (let e = el; e && e.nodeType === 1; e = e.parentElement) {const cs = getComputedStyle(e);if (cs.display === 'none' || cs.visibility === 'hidden') return 0;o *= parseFloat(cs.opacity);}return o;};
      const texts = [];
      for (const el of document.querySelectorAll('svg text')) {
        const o = op(el), s = el.textContent.trim();
        if (o < .35 || !s) continue;
        const r = el.getBoundingClientRect(), fs = parseFloat(getComputedStyle(el).fontSize) || r.height;
        if (r.width < 2) continue;
        // getBoundingClientRect covers the font's full line box; keep roughly the ink (cap height to baseline + descenders).
        texts.push({s, svg: true, x0: r.left + 2, x1: r.right - 2, y0: r.top + fs * .2, y1: r.bottom - fs * .12});
      }
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const el = n.parentElement;
        if (!n.textContent.trim() || el.closest('svg')) continue;
        if (op(el) < .35) continue;
        const range = document.createRange();range.selectNodeContents(n);
        for (const r of range.getClientRects()) if (r.width > 2) texts.push({s: n.textContent.trim(), svg: false, caption: r.top > captionTop - 40, x0: r.left + 2, x1: r.right - 2, y0: r.top + r.height * .18, y1: r.bottom - r.height * .1});
      }
      const out = [];
      const hit = (a, b) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
      for (let i = 0; i < texts.length; i++) {
        const a = texts[i];
        if (a.x0 < 16 || a.x1 > 1904 || a.y0 < 0 || a.y1 > 1074) out.push({kind: 'ra ngoài khung hình', a: a.s});
        if (a.svg && a.y1 > captionTop) out.push({kind: 'chạm vùng phụ đề', a: a.s});
        for (let j = i + 1; j < texts.length; j++) {
          const b = texts[j], area = hit(a, b), min = Math.min((a.x1 - a.x0) * (a.y1 - a.y0), (b.x1 - b.x0) * (b.y1 - b.y0));
          if (area > min * .08 && area > 30) out.push({kind: 'chữ đè chữ', a: a.s, b: b.s});
        }
      }
      // Stroked outlines (box borders, wires, arrows, icons) passing through a text's ink box.
      for (const el of document.querySelectorAll('svg path, svg rect, svg line, svg polyline, svg circle, svg ellipse')) {
        const cs = getComputedStyle(el);
        if (cs.stroke === 'none' || parseFloat(cs.strokeWidth) <= 0 || op(el) < .35) continue;
        if (el.tagName === 'circle' && el.r.baseVal.value < 16) continue;
        let len;try {len = el.getTotalLength();} catch {continue;}
        if (!len) continue;
        const m = el.getScreenCTM(), pts = [];
        for (let d = 0; d <= len; d += 4) {const p = el.getPointAtLength(d);pts.push([m.a * p.x + m.c * p.y + m.e, m.b * p.x + m.d * p.y + m.f]);}
        for (const t of texts) {
          const inside = pts.filter(([x, y]) => x > t.x0 + 3 && x < t.x1 - 3 && y > t.y0 + 2 && y < t.y1 - 2).length;
          if (inside >= 2) out.push({kind: el.tagName === 'rect' ? 'chữ đè viền khung' : 'đường/viền cắt qua chữ', a: t.s, b: `<${el.tagName}>`});
        }
      }
      return out;
    }, {captionTop});
    for (const x of issues) {
      const key = `${x.kind}|${x.a}|${x.b ?? ''}`;
      const g = found.get(key) ?? {...x, frames: []};
      g.frames.push(f);found.set(key, g);
    }
    if ((f - from) % (step * 300) === 0) process.stderr.write(`  ${(f / fps).toFixed(0)} s / ${(to / fps).toFixed(0)} s, ${found.size} problems so far\n`);
  }
  const t = (fr) => {const s = fr / fps;return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;};
  const list = [...found.values()].map((g) => ({...g, start: t(g.frames[0]), end: t(g.frames[g.frames.length - 1]), seconds: +(g.frames.length * step / fps).toFixed(1)}))
    .sort((a, b) => a.frames[0] - b.frames[0]);
  fs.mkdirSync(path.dirname(report), {recursive: true});
  fs.writeFileSync(report, JSON.stringify({target, from, to, step, problems: list.map(({frames: fr, ...x}) => ({...x, firstFrame: fr[0], lastFrame: fr[fr.length - 1]}))}, null, 1));
  for (const g of list) console.log(`${g.start}–${g.end} (${g.seconds}s) ${g.kind}: «${g.a}»${g.b ? ` × «${g.b}»` : ''}`);
  console.log(`${list.length} problems in ${((to - from) / fps).toFixed(0)} s checked every ${step} frames; report ${path.relative(ROOT, report)}`);
  process.exitCode = list.length ? 1 : 0;
} finally {
  await browser?.close();
  server?.close();
  cleanup();
}
