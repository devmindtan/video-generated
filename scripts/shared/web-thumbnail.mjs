#!/usr/bin/env node
// Thumbnails designed as web pages (user 2026-11-09): variants live in src/projects/<slug>/thumbnail-web/ with a
// thumbnails.json manifest; the user compares and picks them in the manager's Thumbnail tab (no comparison page).
// This tool serves one page and the repo's public/ files on loopback for an agent's QA capture:
//   npm run thumbnail:web -- <page.html>                 preview in the browser (Ctrl+C to stop)
//   npm run thumbnail:web -- <page.html> --out <file.png> capture the page's #thumb element (1280×720) and exit
//   npm run thumbnail:web -- <page.html> --check <file.png> capture a QA copy (same as --out; meant for .cache/)
// Capturing writes a thumbnail: run --out only when the user asks for the export. Read-only server: GET of files
// inside the page's folder or public/, nothing else (no .env, no library/, no listing). Port 3100 (never Studio's
// 3000); Chrome headless from /usr/bin/google-chrome (CHROME_PATH), no browser download.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const page = args.find(a => !a.startsWith('--') && !['--out', '--check'].includes(args[args.indexOf(a) - 1]));
const outArg = args.includes('--out') ? args[args.indexOf('--out') + 1] : args.includes('--check') ? args[args.indexOf('--check') + 1] : null;
if (!page) {
  console.error('Dùng: npm run thumbnail:web -- <trang.html> [--out ảnh.png]');
  process.exit(2);
}
const pageFile = path.resolve(ROOT, page);
if (!pageFile.startsWith(ROOT + path.sep) || !fs.existsSync(pageFile)) {
  console.error(`Không thấy trang ${page} trong repo.`);
  process.exit(2);
}
const pageDir = path.dirname(pageFile), PUBLIC = path.join(ROOT, 'public');
const TYPES = {'.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2'};

const server = http.createServer((req, res) => {
  if (req.method !== 'GET') return res.writeHead(405).end();
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = url === '/' ? pageFile : url.startsWith('/public/') ? path.join(ROOT, url) : path.join(pageDir, url);
  const allowed = [pageDir, PUBLIC].some(dir => file === dir || file.startsWith(dir + path.sep));
  if (!allowed || !TYPES[path.extname(file).toLowerCase()] || !fs.existsSync(file) || !fs.statSync(file).isFile()) return res.writeHead(404).end('Not found');
  res.writeHead(200, {'Content-Type': TYPES[path.extname(file).toLowerCase()], 'Cache-Control': 'no-store'});
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve, reject) => server.once('error', reject).listen(3100, '127.0.0.1', resolve)).catch(error => {
  console.error(error.code === 'EADDRINUSE' ? 'Cổng 3100 đang bận (một lượt render/chụp khác?). Chờ xong rồi chạy lại.' : error.message);
  process.exit(1);
});
const base = 'http://127.0.0.1:3100/';

if (!outArg) {
  console.log(`Xem trước: ${base}  (Ctrl+C để dừng)`);
  spawn('xdg-open', [base], {detached: true, stdio: 'ignore'}).on('error', () => {}).unref();
} else {
  const require = createRequire(import.meta.url);
  const {chromium} = require(path.join(ROOT, 'node_modules/playwright-core'));
  const out = path.resolve(ROOT, outArg);
  const browser = await chromium.launch({headless: true, executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome'});
  try {
    const tab = await browser.newPage({viewport: {width: 1280, height: 720}, deviceScaleFactor: 1});
    const errors = [];
    tab.on('pageerror', e => errors.push(e.message));
    tab.on('requestfailed', r => errors.push(`${r.url()} ${r.failure()?.errorText}`));
    tab.on('response', r => r.status() >= 400 && errors.push(`${r.url()} ${r.status()}`));
    await tab.goto(base + '?capture', {waitUntil: 'networkidle'});
    await tab.evaluate(() => document.fonts.ready);
    const fonts = await tab.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family));
    if (errors.length) throw new Error('Trang lỗi khi tải:\n' + errors.join('\n'));
    if (!fonts.length) throw new Error('Font chưa tải được; không chụp.');
    const box = await tab.locator('#thumb').boundingBox();
    if (!box || Math.round(box.width) !== 1280 || Math.round(box.height) !== 720) throw new Error(`#thumb phải đúng 1280×720 (đang ${box?.width}×${box?.height}).`);
    fs.mkdirSync(path.dirname(out), {recursive: true});
    await tab.locator('#thumb').screenshot({path: out});
    console.log(`Đã chụp ${path.relative(ROOT, out)} (1280×720, font: ${[...new Set(fonts)].join(', ')})`);
  } finally {
    await browser.close();
    server.close();
  }
}
