/* "Mới cập nhật" order from real work, in a temporary Git workspace (never the real one). */
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const {execFileSync} = require('node:child_process');
const {createStore} = require('./store.cjs');

test('a project dates from its own commits and uncommitted files, not from sweeps across many projects', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'manager-activity-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const write = (file, text) => { fs.mkdirSync(path.dirname(path.join(root, file)), {recursive: true}); fs.writeFileSync(path.join(root, file), text); };
  const commit = (date, message) => { execFileSync('git', ['add', '-A'], {cwd: root}); execFileSync('git', ['commit', '-qm', message], {cwd: root, env: {...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t', GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date}}); };
  const ids = ['a', 'b', 'c', 'd'];
  const paths = id => ({source: `src/projects/${id}`, scripts: `scripts/projects/${id}`, docs: `docs/projects/${id}`, assets: `public/${id}`});
  write('series/catalog.json', JSON.stringify({schemaVersion: 1, channels: [{id: 'tam-ly-cuoc-song', title: 'Kênh', studioFolder: 'K'}], series: [{id: 'demo', channel: 'tam-ly-cuoc-song', path: 'series/tam-ly-cuoc-song/demo/series.json'}]}));
  write('series/tam-ly-cuoc-song/demo/series.json', JSON.stringify({schemaVersion: 1, id: 'demo', channel: 'tam-ly-cuoc-song', title: 'Demo', studioFolder: 'Demo', formats: ['short'], projects: ids.map(id => ({id, title: id, status: 'existing', format: 'short', paths: paths(id), registrations: []}))}));
  write('src/projects/registry.tsx', 'export const Projects=()=> <></>;');
  execFileSync('git', ['init', '-q'], {cwd: root});
  for (const id of ids) write(`src/projects/${id}/Video.tsx`, id);
  commit('2026-10-01T10:00:00Z', 'add all four');
  write('docs/projects/a/script.md', 'a');
  commit('2026-10-05T10:00:00Z', 'work on a');
  write('docs/projects/b/script.md', 'b');write('docs/projects/c/script.md', 'c');
  commit('2026-10-07T10:00:00Z', 'work on b and c');
  for (const id of ids) write(`src/projects/${id}/music.json`, '{}');
  commit('2026-10-20T10:00:00Z', 'sweep over every project');
  const projects = Object.fromEntries(createStore(root).list().projects.map(p => [p.id, p.updatedAt]));
  assert.equal(projects.a, '2026-10-05T10:00:00.000Z');
  assert.equal(projects.b, '2026-10-07T10:00:00.000Z');
  assert.equal(projects.c, '2026-10-07T10:00:00.000Z');
  // Only ever swept: its file time (written just now) is capped at the commit that added it.
  assert.equal(projects.d, '2026-10-01T10:00:00.000Z');
  // An uncommitted edit counts as the newest work on its project.
  write('scripts/projects/d/lines.txt', 'new line');
  const after = Object.fromEntries(createStore(root).list().projects.map(p => [p.id, p.updatedAt]));
  assert.ok(after.d > '2026-11-01', after.d);
  assert.equal(after.a, projects.a);
});
