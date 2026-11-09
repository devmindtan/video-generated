// Thumbnail tab backend on a temporary workspace: list, choose with history and revision check, scoped file serving.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {createThumbnails} = require('./thumbnails.cjs');

test('lists designs, records the pick, serves only the design folder and public fonts/images', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'thumbs-'));
  try {
    const dir = path.join(root, 'src/projects/ep/thumbnail-web');
    fs.mkdirSync(dir, {recursive: true});fs.mkdirSync(path.join(root, 'projects/ep'), {recursive: true});fs.mkdirSync(path.join(root, 'public/fonts'), {recursive: true});
    for (const f of ['a.html', 'b.html', 'base.css']) fs.writeFileSync(path.join(dir, f), 'x');
    fs.writeFileSync(path.join(root, 'public/fonts/x.ttf'), 'f');fs.writeFileSync(path.join(root, 'public/secret.json'), '{}');
    fs.writeFileSync(path.join(dir, 'thumbnails.json'), JSON.stringify({studioStill: 'EpThumb', studioVariant: 'a', chosen: 'a', variants: [
      {id: 'a', file: 'a.html', title: 'A'}, {id: 'b', file: 'b.html', title: 'B'}, {id: 'gone', file: 'missing.html', title: 'X'}]}));
    const projects = {ep: {id: 'ep', paths: {source: 'src/projects/ep'}, registrations: [{id: 'EpThumb', kind: 'Still'}]}, old: {id: 'old', registrations: []}};
    const t = createThumbnails(root, {catalog: id => projects[id]});

    assert.equal(t.list('old').available, false, 'older episodes have no tab');
    let d = t.list('ep');
    assert.deepEqual(d.variants.map(v => v.id), ['a', 'b'], 'missing files are skipped');
    assert.equal(d.studioStill, 'EpThumb');assert.equal(d.exported, null);
    fs.writeFileSync(path.join(root, 'projects/ep/EpThumb.png'), 'p');
    assert.equal(t.list('ep').exported.name, 'EpThumb.png');

    assert.throws(() => t.choose({id: 'ep', variant: 'b', revision: 'stale'}), /vừa thay đổi/);
    assert.throws(() => t.choose({id: 'ep', variant: 'zzz', revision: d.revision}), /Không có phương án/);
    d = t.choose({id: 'ep', variant: 'b', revision: d.revision});
    assert.equal(d.chosen, 'b');assert.equal(d.studioVariant, 'a', 'the Studio Still is not changed by a pick');
    assert.equal(fs.readdirSync(path.join(dir, '.manager-history')).length, 1, 'previous manifest kept');

    assert.ok(t.resolve('/thumb/ep/a.html'));assert.ok(t.resolve('/thumb/ep/base.css'));assert.ok(t.resolve('/public/fonts/x.ttf'));
    for (const bad of ['/thumb/ep/thumbnails.json', '/thumb/ep/..%2F..%2Fx.html', '/thumb/ep/.manager-history', '/public/secret.json', '/public/..%2F.env', '/thumb/nope/a.html'])
      assert.equal(t.resolve(bad), null, bad);
  } finally {
    fs.rmSync(root, {recursive: true, force: true});
  }
});

test('a shorts project keeps one design set per short, each with its own pick and portrait size', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'thumbs-sets-'));
  try {
    const dir = path.join(root, 'src/projects/sh/thumbnail-web');
    fs.mkdirSync(dir, {recursive: true});
    for (const f of ['1a.html', '1b.html', '2a.html']) fs.writeFileSync(path.join(dir, f), 'x');
    fs.writeFileSync(path.join(dir, 'thumbnails.json'), JSON.stringify({sets: [
      {id: 'short-1', title: 'Short 1', width: 1080, height: 1920, studioStill: 'Sh1Cover', variants: [{id: '1a', file: '1a.html', title: '1A'}, {id: '1b', file: '1b.html', title: '1B'}]},
      {id: 'short-2', title: 'Short 2', width: 1080, height: 1920, studioStill: 'Sh2Cover', chosen: '2a', variants: [{id: '2a', file: '2a.html', title: '2A'}]}]}));
    const t = createThumbnails(root, {catalog: () => ({id: 'sh', paths: {source: 'src/projects/sh'}, registrations: [{id: 'Sh2Cover', kind: 'Still'}]})});
    let d = t.list('sh');
    assert.deepEqual(d.sets.map(s => [s.id, s.width, s.height, s.variants.length, s.chosen]), [['short-1', 1080, 1920, 2, null], ['short-2', 1080, 1920, 1, '2a']]);
    assert.equal(d.sets[0].studioStill, null, 'a planned Still that is not registered yet');
    assert.equal(d.sets[0].plannedStill, 'Sh1Cover');
    assert.equal(d.sets[1].studioStill, 'Sh2Cover');
    assert.throws(() => t.choose({id: 'sh', set: 'short-9', variant: '1a', revision: d.revision}), /nhóm/);
    assert.throws(() => t.choose({id: 'sh', set: 'short-2', variant: '1a', revision: d.revision}), /Không có phương án/, 'a variant of another short');
    d = t.choose({id: 'sh', set: 'short-1', variant: '1b', revision: d.revision});
    assert.equal(d.sets[0].chosen, '1b');assert.equal(d.sets[1].chosen, '2a', 'the other short keeps its pick');
  } finally {
    fs.rmSync(root, {recursive: true, force: true});
  }
});
