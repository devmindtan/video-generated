// Loudness button backend on a temporary workspace: a real (short, quiet) export is normalised by the real
// media-analyze.py into <ID>-upload.mp4, one job at a time, the export untouched, an old upload copy kept in backups/.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {createLoudness} = require('./loudness.cjs');

const REPO = path.resolve(__dirname, '../..');
const FFMPEG = path.join(REPO, 'node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg');
const until = async (fn, ms = 60000) => {for (const t0 = Date.now(); Date.now() - t0 < ms; await new Promise(r => setTimeout(r, 200))) if (fn()) return;throw new Error('timeout');};

test('normalises an export into an upload copy and reports progress', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'loudness-'));
  try {
    fs.mkdirSync(path.join(root, 'projects/ep'), {recursive: true});
    const exportFile = path.join(root, 'projects/ep/Ep.mp4');
    execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=20', '-af', 'volume=0.05', '-c:a', 'aac', exportFile]);
    const before = fs.readFileSync(exportFile);
    const project = {id: 'ep', registrations: [{id: 'Ep', kind: 'Composition'}, {id: 'EpPart', kind: 'Composition', part: true}]};
    const panel = createLoudness(root, {catalog: id => id === 'ep' ? project : null, python: path.join(REPO, '.venv/bin/python'),
      script: path.join(REPO, 'scripts/shared/media-analyze.py'), limited: '/nonexistent'});

    let v = panel.status('ep').videos;
    assert.deepEqual(v.map(x => x.composition), ['Ep'], 'parts are not offered');
    assert.equal(v[0].job, null);assert.equal(v[0].uploadCopy, null);
    panel.start('ep', 'Ep');
    assert.throws(() => panel.start('ep', 'Ep'), /Đang chuẩn hóa/, 'one job at a time');
    await until(() => panel.status('ep').videos[0].job?.phase === 'done');
    v = panel.status('ep').videos[0];
    assert.ok(v.uploadCopy?.fresh, 'upload copy written');
    assert.ok(Math.abs(v.job.report.fixed.integratedLufs + 14) <= 1, `upload at -14 LUFS (${v.job.report.fixed.integratedLufs})`);
    assert.ok(before.equals(fs.readFileSync(exportFile)), 'export untouched');
    assert.throws(() => panel.start('ep', 'Ep'), /không cần chạy lại/);

    // A new render: the old upload copy goes to backups/, the status no longer reports the old run.
    const earlier = new Date(Date.now() - 60000);fs.utimesSync(path.join(root, 'projects/ep/Ep-upload.mp4'), earlier, earlier);
    const now = new Date();fs.utimesSync(exportFile, now, now);
    v = panel.status('ep').videos[0];
    assert.equal(v.uploadCopy.fresh, false);assert.equal(v.job, null);
    panel.start('ep', 'Ep');
    assert.equal(fs.readdirSync(path.join(root, 'projects/ep/backups')).length, 1);
    await until(() => panel.status('ep').videos[0].job?.phase === 'done');
    assert.ok(panel.status('ep').videos[0].uploadCopy.fresh);
    assert.throws(() => panel.status('nope'), /Không có dự án/);
  } finally {
    fs.rmSync(root, {recursive: true, force: true});
  }
});
