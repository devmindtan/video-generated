const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {spawnSync} = require('node:child_process');

const {
  backupFilterArgs,
  buildPending,
  buildPlan,
  collectSources,
  confirmInIndex,
  formatBytes,
  isBackupCommand,
  overallPercent,
  readIndex,
  readStatus,
  shouldSkipBackupEntry,
  validateRelative,
  walkSource,
} = require('./drive-backup.cjs');

const SCRIPT = path.join(__dirname, 'drive-backup.cjs');

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'video-backup-test-'));
  fs.mkdirSync(path.join(root, 'public', 'episode'), {recursive: true});
  fs.writeFileSync(path.join(root, 'public', 'episode', 'voice.wav'), Buffer.alloc(12));
  fs.mkdirSync(path.join(root, 'series', 'channel', '.manager-history'), {recursive: true});
  fs.writeFileSync(path.join(root, 'series', 'channel', '.manager-history', 'notes.json'), 'abc');
  fs.mkdirSync(path.join(root, 'series', 'channel', 'nested'), {recursive: true});
  return root;
}

const config = {
  schemaVersion: 1,
  remote: 'video-playground-drive',
  destinationFolderId: 'folder-id',
  currentPrefix: 'current',
  versionsPrefix: 'versions',
  manifestPrefix: '_manifests',
  sources: ['public', 'missing'],
  discoverManagerHistoryIn: ['series'],
};

test('collectSources keeps configured data and discovers manager history', () => {
  const root = fixture();
  assert.deepEqual(collectSources(root, config), [
    'public',
    path.join('series', 'channel', '.manager-history'),
  ]);
});

test('buildPlan counts files and bytes without following symlinks', () => {
  const root = fixture();
  fs.symlinkSync('/tmp', path.join(root, 'public', 'episode', 'external'));
  fs.mkdirSync(path.join(root, 'public', 'episode', '.git', 'hooks'), {recursive: true});
  fs.writeFileSync(path.join(root, 'public', 'episode', '.git', 'hooks', 'pre-push'), 'secret');
  fs.mkdirSync(path.join(root, 'public', 'episode', '.cache'), {recursive: true});
  fs.writeFileSync(path.join(root, 'public', 'episode', '.cache', 'preview.png'), 'cache');
  fs.writeFileSync(path.join(root, 'public', 'episode', '.env.local'), 'token=secret');
  const plan = buildPlan(root, config);
  assert.equal(plan.totalFiles, 2);
  assert.equal(plan.totalBytes, 15);
  assert.equal(plan.totalSymlinksSkipped, 1);
});

test('nested forbidden data is excluded from planning and rclone transfers', () => {
  assert.equal(shouldSkipBackupEntry('.git'), true);
  assert.equal(shouldSkipBackupEntry('.env.production'), true);
  assert.equal(shouldSkipBackupEntry('.cache'), true);
  assert.equal(shouldSkipBackupEntry('voice.wav'), false);

  const filters = backupFilterArgs();
  assert.ok(filters.includes('**/.git/**'));
  assert.ok(filters.includes('**/.cache/**'));
  assert.ok(filters.includes('**/.env*'));
});

test('unsafe and forbidden paths are rejected', () => {
  assert.throws(() => validateRelative('../secret'));
  assert.throws(() => validateRelative('.env'));
  assert.throws(() => validateRelative('.env.local'));
  assert.throws(() => validateRelative(path.join('x', '.voicestudio', 'model')));
});

test('formatBytes is readable', () => {
  assert.equal(formatBytes(1024), '1.0 KiB');
  assert.equal(formatBytes(1024 ** 3), '1.0 GiB');
});

test('pending lists new and changed files until Drive confirms them', () => {
  const root = fixture();
  let pending = buildPending(root, config);
  assert.equal(pending.pendingFiles, 2);
  assert.equal(pending.indexUpdatedAt, null);

  const snapshot = walkSource(root, 'public');
  assert.equal(confirmInIndex(root, 'public', snapshot, new Set(['episode/voice.wav'])), 1);
  pending = buildPending(root, config);
  assert.equal(pending.sources.find((s) => s.relative === 'public').pendingFiles, 0);
  assert.equal(pending.pendingFiles, 1);

  const file = path.join(root, 'public', 'episode', 'voice.wav');
  fs.writeFileSync(file, Buffer.alloc(20));
  fs.utimesSync(file, new Date(), new Date(Date.now() + 5000));
  const changed = buildPending(root, config).sources.find((s) => s.relative === 'public');
  assert.equal(changed.pendingFiles, 1);
  assert.equal(changed.pending[0].reason, 'changed');
});

test('a file edited while its check ran is not marked as backed up', () => {
  const root = fixture();
  const snapshot = walkSource(root, 'public');
  const file = path.join(root, 'public', 'episode', 'voice.wav');
  fs.writeFileSync(file, Buffer.alloc(30));
  assert.equal(confirmInIndex(root, 'public', snapshot, new Set(['episode/voice.wav'])), 0);
  assert.deepEqual(readIndex(root).files, {});
});

test('backup processes are recognised only by node running the backup script', () => {
  assert.equal(isBackupCommand(['node', 'scripts/backup/drive-backup.cjs', 'run']), true);
  assert.equal(isBackupCommand(['/usr/bin/node', '/x/drive-backup.cjs', 'verify']), true);
  assert.equal(isBackupCommand(['node', 'scripts/backup/drive-backup.cjs', 'plan']), false);
  assert.equal(isBackupCommand(['sh', '-c', 'node scripts/backup/drive-backup.cjs run']), false);
});

test('overall progress weights sources by size and copy vs. check', () => {
  const status = {action: 'run', sources: [
    {bytes: 300, state: 'verified'},
    {bytes: 100, state: 'copying', stats: {bytes: 50, totalBytes: 100}},
  ]};
  assert.equal(overallPercent(status), Math.floor((300 + 100 * 0.85 * 0.5) / 400 * 1000) / 10);
  assert.equal(overallPercent({action: 'verify', sources: [{bytes: 10, state: 'verifying', stats: {checks: 1, totalChecks: 2}}]}), 50);
});

function runCli(root, configPath, args) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: 'utf8',
    env: {
      ...process.env,
      VIDEO_BACKUP_REPO_ROOT: root,
      VIDEO_BACKUP_CONFIG: configPath,
      RCLONE_CONFIG_TESTREMOTE_TYPE: 'local',
    },
    cwd: root,
  });
}

const rcloneAvailable = spawnSync(process.env.VIDEO_BACKUP_RCLONE || path.join(os.homedir(), '.local', 'bin', 'rclone'), ['version']).status === 0
  || spawnSync('rclone', ['version']).status === 0;

test('run copies, verifies, records status and index against a local rclone remote', {skip: !rcloneAvailable && 'rclone not installed'}, () => {
  const root = fixture();
  const configPath = path.join(root, 'backup-config.json');
  // loadConfig rejects absolute prefixes, so the fixture remote is rooted in the fixture itself.
  fs.writeFileSync(configPath, JSON.stringify({...config, remote: 'testremote', currentPrefix: 'drive/current',
    versionsPrefix: 'drive/versions', manifestPrefix: 'drive/manifests'}));
  fs.writeFileSync(path.join(root, 'public', 'episode', '.env.local'), 'token=secret');

  const result = runCli(root, configPath, ['run']);
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.ok(fs.existsSync(path.join(root, 'drive', 'current', 'public', 'episode', 'voice.wav')));
  assert.ok(!fs.existsSync(path.join(root, 'drive', 'current', 'public', 'episode', '.env.local')));
  assert.equal(fs.readdirSync(path.join(root, 'drive', 'manifests')).length, 1);

  const {status, running} = readStatus(root);
  assert.equal(running, false);
  assert.equal(status.phase, 'done');
  assert.equal(status.result, 'verified');
  assert.equal(status.percent, 100);
  assert.ok(status.sources.every((source) => source.state === 'verified'));
  assert.equal(buildPending(root, config).pendingFiles, 0);
  assert.ok(!fs.existsSync(path.join(root, '.cache', 'backup-drive', 'lock')));

  // A file missing on Drive shows up in verify without failing the tool, and stays pending.
  fs.writeFileSync(path.join(root, 'public', 'episode', 'new.png'), 'png');
  const verify = runCli(root, configPath, ['verify']);
  assert.equal(verify.status, 1);
  assert.match(verify.stdout, /Not yet on Drive: public/);
  assert.equal(readStatus(root).status.result, 'differs');
  assert.deepEqual(buildPending(root, config).sources.find((s) => s.relative === 'public').pending.map((f) => f.path), ['public/episode/new.png']);
  fs.rmSync(root, {recursive: true, force: true});
});
