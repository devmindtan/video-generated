const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  backupFilterArgs,
  buildPlan,
  collectSources,
  formatBytes,
  shouldSkipBackupEntry,
  validateRelative,
} = require('./drive-backup.cjs');

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
