// Episode caption file for book-hvtt-001: every caption page as shown on screen, on the episode's own timeline.
// Writes src/projects/book-hvtt-001-overview/captions.json (parts timeline + pages; review/QA record) and
// docs/projects/book-hvtt-001-overview/captions.srt (upload as YouTube subtitles: on/off captions, search).
// Uses the video's own pacing code (Episode.tsx episodeCaptions) via esbuild, with the browser-only font loader and
// media player stubbed, and the BookHvttTap01 defaultProps from src/projects/registry.tsx. Run again after any change
// to narration or pacing.
// Usage: node scripts/projects/book-hvtt-001-overview/export-captions.mjs
import {build} from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const ID = 'book-hvtt-001-overview';

const registry = fs.readFileSync(path.join(ROOT, 'src/projects/registry.tsx'), 'utf8');
const line = registry.split('\n').find((l) => l.includes('id="BookHvttTap01"'));
const props = new Function(`return ${line.match(/defaultProps=\{(\{.*?\})\}\s*\/>/)[1]}`)();

const out = path.join(ROOT, '.cache', 'export-captions.mjs');
await build({
  stdin: {contents: `export {episodeCaptions, episodeTimeline} from './src/projects/${ID}/Episode';`, resolveDir: ROOT, loader: 'ts'},
  bundle: true, platform: 'node', format: 'esm', outfile: out, jsx: 'automatic', logLevel: 'error',
  plugins: [{name: 'browser-only', setup(b) {
    b.onResolve({filter: /stoic-fonts$/}, () => ({path: 'stub-fonts', namespace: 'stub'}));
    b.onResolve({filter: /^@remotion\/media$/}, () => ({path: 'stub-media', namespace: 'stub'}));
    b.onLoad({filter: /.*/, namespace: 'stub'}, (a) => ({contents: a.path === 'stub-media' ? 'export const Audio = () => null;' : '', loader: 'js'}));
  }}],
});
const {episodeCaptions, episodeTimeline} = await import(pathToFileURL(out).href);
const pages = episodeCaptions(props, 30);
let at = 0;
const timeline = episodeTimeline(props, 30).map((x) => {const start = at;at += x.frames;return {...x, startFrame: start};});

const clock = (ms) => {const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;};
// A page stays on screen until the next one begins when the gap is short (as in the video), never overlapping it.
const srt = pages.map((p, i) => {const next = pages[i + 1], end = next && next.startMs - p.endMs < 1200 ? next.startMs - 1 : p.endMs;
  return `${i + 1}\n${clock(p.startMs)} --> ${clock(Math.max(p.startMs + 300, end))}\n${p.text}\n`;}).join('\n');
fs.writeFileSync(path.join(ROOT, `src/projects/${ID}/captions.json`), JSON.stringify({source: 'Episode.tsx episodeCaptions, BookHvttTap01 defaultProps', fps: 30, totalFrames: at, parts: timeline, pages}, null, 2) + '\n');
fs.writeFileSync(path.join(ROOT, `docs/projects/${ID}/captions.srt`), srt);
console.log(`${pages.length} trang phụ đề, kết thúc ${clock(pages.at(-1).endMs)}`);
