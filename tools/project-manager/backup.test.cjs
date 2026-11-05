/* Drive backup panel against a temporary workspace and a local rclone remote (no network, no real Drive). */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {spawnSync} = require('node:child_process');
const {createBackupPanel} = require('./backup.cjs');
const {createManager} = require('./server.cjs');

const rclone = [process.env.VIDEO_BACKUP_RCLONE, path.join(os.homedir(), '.local', 'bin', 'rclone'), 'rclone']
  .filter(Boolean).find(command => spawnSync(command, ['version']).status === 0);

function workspace() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'manager-backup-'));
  fs.mkdirSync(path.join(root, 'public', 'ep'), {recursive: true});
  fs.writeFileSync(path.join(root, 'public', 'ep', 'small.txt'), 'hello');
  // Big enough that a 1 MiB/s limit keeps the run alive for a few seconds.
  fs.writeFileSync(path.join(root, 'public', 'ep', 'video.bin'), Buffer.alloc(6 * 1024 * 1024, 7));
  fs.mkdirSync(path.join(root, 'library'), {recursive: true});
  fs.writeFileSync(path.join(root, 'library', 'book.txt'), 'page');
  const config = path.join(root, 'backup-config.json');
  fs.writeFileSync(config, JSON.stringify({
    schemaVersion: 1, remote: 'testremote', destinationFolderId: 'fixture',
    currentPrefix: 'drive/current', versionsPrefix: 'drive/versions', manifestPrefix: 'drive/manifests',
    sources: ['public', 'library'], discoverManagerHistoryIn: [],
  }));
  const env = {VIDEO_BACKUP_CONFIG: config, RCLONE_CONFIG_TESTREMOTE_TYPE: 'local', RCLONE_BWLIMIT: '1M'};
  if (rclone) env.VIDEO_BACKUP_RCLONE = rclone;
  return {root, env};
}

const until = async (check, ms = 30000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const value = check();
    if (value) return value;
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error('Timed out');
};

test('panel shows pending files, runs detached, refuses a second run, stops and resumes', {skip: !rclone && 'rclone not installed'}, async () => {
  const {root, env} = workspace();
  const panel = createBackupPanel(root, {env});
  try {
    let view = panel.overview();
    assert.equal(view.running, false);
    assert.equal(view.status, null);
    assert.equal(view.pending.pendingFiles, 3);
    assert.equal(view.pending.indexUpdatedAt, null);
    assert.equal(view.pending.sources.find(s => s.relative === 'public').label, 'Media dùng trong video');
    assert.deepEqual(panel.pendingFiles('public').items.map(f => f.path), ['public/ep/video.bin', 'public/ep/small.txt']);
    assert.throws(() => panel.pendingFiles('../etc'), /Không có nguồn/);

    const started = await panel.start('run');
    assert.equal(started.started, true);
    // The child is its own session: it does not die with the manager process group.
    const sid = Number(fs.readFileSync(`/proc/${started.pid}/stat`, 'utf8').split(') ')[1].split(' ')[3]);
    assert.equal(sid, started.pid);
    await until(() => panel.overview().status?.phase === 'copying');
    assert.equal(panel.summary().running, true);
    await assert.rejects(panel.start('run'), /đang chạy/);

    const stopped = panel.stop();
    assert.equal(stopped.stopped, true);
    await until(() => !panel.summary().running);
    view = panel.overview();
    assert.equal(view.status.phase, 'stopped');
    assert.ok(!fs.existsSync(path.join(root, '.cache', 'backup-drive', 'lock')));

    env.RCLONE_BWLIMIT = '0';
    await panel.start('run');
    await until(() => !panel.summary().running && panel.overview().status?.phase === 'done', 60000);
    view = panel.overview();
    assert.equal(view.status.result, 'verified');
    assert.equal(view.pending.pendingFiles, 0);
    assert.equal(view.history.length, 1);
    assert.ok(view.log.some(line => line.includes('completed and verified')));
    assert.ok(fs.existsSync(path.join(root, 'drive', 'current', 'public', 'ep', 'video.bin')));

    fs.writeFileSync(path.join(root, 'library', 'new.txt'), 'x');
    await panel.start('verify');
    await until(() => !panel.summary().running && panel.overview().status?.phase === 'done');
    view = panel.overview();
    assert.equal(view.status.result, 'differs');
    assert.equal(view.pending.pendingFiles, 1);
  } finally {
    panel.stop();
    await until(() => !panel.summary().running).catch(() => {});
    fs.rmSync(root, {recursive: true, force: true});
  }
});

test('manager routes need the session token to start or stop a backup', async () => {
  const calls = [];
  const fake = {
    summary: () => ({running: false, status: null}),
    overview: () => ({running: false, status: null, pending: {sources: []}, history: [], log: []}),
    pendingFiles: source => ({relative: source, items: []}),
    start: async action => {calls.push(action);return {started: true, action};},
    stop: () => {calls.push('stop');return {stopped: false, pids: []};},
  };
  const server = createManager({backupPanel: fake});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await (await fetch(`${base}/api/backup`)).json()).running, false);
    assert.equal((await (await fetch(`${base}/api/backup/pending?source=public`)).json()).relative, 'public');
    const denied = await fetch(`${base}/api/backup/start`, {method: 'POST', headers: {'Content-Type': 'application/json', Origin: base}, body: '{"action":"run"}'});
    assert.equal(denied.status, 403);
    const {token} = await (await fetch(`${base}/api/workspace`)).json();
    const headers = {'Content-Type': 'application/json', Origin: base, 'X-Workspace-Token': token};
    assert.equal((await fetch(`${base}/api/backup/start`, {method: 'POST', headers, body: '{"action":"run"}'})).status, 202);
    assert.equal((await fetch(`${base}/api/backup/stop`, {method: 'POST', headers, body: '{}'})).status, 200);
    assert.deepEqual(calls, ['run', 'stop']);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
