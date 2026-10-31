// Live updates for the manager: watches the workspace's data folders and tells open pages what changed, so the
// web view follows edits made by agents, CLIs or the user's editor without a reload. Read-only: it never
// writes; pages re-fetch through the normal APIs. Watchers run only while at least one page listens.
const fs = require('node:fs');
const path = require('node:path');

// Folder (relative to the workspace) -> how a changed path inside it maps to a project id.
const WATCHED = [
  {dir: 'series', project: () => null, catalog: true},
  {dir: 'docs/projects', project: rel => rel.split(path.sep)[0]},
  {dir: 'scripts/projects', project: rel => rel.split(path.sep)[0]},
  {dir: 'src/projects', project: rel => rel.split(path.sep)[0]},
  {dir: 'projects', project: rel => rel.split(path.sep)[0]},
  {dir: '.automation/progress', project: rel => rel.replace(/\.json$/, '').split(path.sep)[0]},
];
const IGNORED = /(^|[\\/])(\.manager-history|node_modules|\.git)([\\/]|$)|\.tmp$|~$|\.swp$/;

function createLive(root, {debounceMs = 400} = {}) {
  const clients = new Set();
  let watchers = [], timer = null, pending = {projects: new Set(), catalog: false};

  const flush = () => {
    timer = null;
    const event = {projects: [...pending.projects].filter(Boolean).sort(), catalog: pending.catalog, at: new Date().toISOString()};
    pending = {projects: new Set(), catalog: false};
    const line = `data: ${JSON.stringify(event)}\n\n`;
    for (const res of clients) res.write(line);
  };
  const changed = (spec, rel) => {
    if (!rel || IGNORED.test(rel)) return;
    const id = spec.project(rel);
    if (id) pending.projects.add(id);
    if (spec.catalog) pending.catalog = true;
    clearTimeout(timer);timer = setTimeout(flush, debounceMs);
  };
  const start = () => {
    for (const spec of WATCHED) {
      const dir = path.join(root, spec.dir);
      try {
        fs.mkdirSync(dir, {recursive: true});
        const w = fs.watch(dir, {recursive: true}, (_type, file) => changed(spec, file && String(file)));
        w.on('error', () => {});
        watchers.push(w);
      } catch {}
    }
  };
  const stop = () => {watchers.forEach(w => w.close());watchers = [];clearTimeout(timer);timer = null;};

  // Server-sent events: one long response per open page, a comment every 25 s keeps proxies and timers alive.
  function subscribe(req, res) {
    res.writeHead(200, {'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', Connection: 'keep-alive'});
    res.write('retry: 3000\n\n');
    if (!clients.size) start();
    clients.add(res);
    const ping = setInterval(() => res.write(': ping\n\n'), 25000);
    req.on('close', () => {clearInterval(ping);clients.delete(res);if (!clients.size) stop();});
  }
  return {subscribe, close: () => {for (const res of clients) res.end();clients.clear();stop();}, clientCount: () => clients.size};
}
module.exports = {createLive, WATCHED};
