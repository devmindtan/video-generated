// Live updates over SSE against a temporary workspace: changed files map to project ids, bursts are batched,
// history folders are ignored, watchers stop when the last page leaves.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const {createLive} = require('./live.cjs');

const listen = (live) => new Promise(resolve => {
  const server = http.createServer((req, res) => live.subscribe(req, res));
  server.listen(0, '127.0.0.1', () => resolve(server));
});
// Collects SSE data events from one connection.
const connect = (port) => new Promise(resolve => {
  const events = [];
  const req = http.get({host: '127.0.0.1', port, path: '/'}, res => {
    let buffer = '';
    res.on('data', chunk => {
      buffer += chunk;
      let at;
      while ((at = buffer.indexOf('\n\n')) >= 0) {
        const block = buffer.slice(0, at);buffer = buffer.slice(at + 2);
        const data = block.split('\n').find(l => l.startsWith('data: '));
        if (data) events.push(JSON.parse(data.slice(6)));
      }
    });
    resolve({events, close: () => req.destroy()});
  });
});
const until = async (fn, ms = 3000) => {const end = Date.now() + ms;while (Date.now() < end) {if (fn()) return;await new Promise(r => setTimeout(r, 30));}throw new Error('timed out');};

test('changed files reach open pages as project ids, batched; history ignored; watchers stop with the last page', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'live-'));
  const write = (rel, text = 'x') => {fs.mkdirSync(path.dirname(path.join(root, rel)), {recursive: true});fs.writeFileSync(path.join(root, rel), text);};
  write('docs/projects/demo/script.md');write('series/a/b/series.json', '{}');
  const live = createLive(root, {debounceMs: 120}), server = await listen(live);
  try {
    const page = await connect(server.address().port);
    await until(() => live.clientCount() === 1);
    write('docs/projects/demo/script.md', 'new');write('docs/projects/demo/approvals.json', '{}');write('.automation/progress/other.json', '{}');
    await until(() => page.events.length >= 1);
    await new Promise(r => setTimeout(r, 250));
    assert.equal(page.events.length, 1, 'a burst of writes is one event');
    assert.deepEqual(page.events[0].projects, ['demo', 'other']);
    assert.equal(page.events[0].catalog, false);
    write('docs/projects/demo/.manager-history/notes-1.md');
    await new Promise(r => setTimeout(r, 300));
    assert.equal(page.events.length, 1, 'manager history writes are not changes');
    write('series/a/b/series.json', '{"x":1}');
    await until(() => page.events.length === 2);
    assert.equal(page.events[1].catalog, true);
    page.close();
    await until(() => live.clientCount() === 0);
  } finally {live.close();server.close();fs.rmSync(root, {recursive: true, force: true});}
});
