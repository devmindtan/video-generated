#!/usr/bin/env node

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

const DEFAULT_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_CONFIG = path.join(__dirname, 'drive-config.json');
const FORBIDDEN_NAMES = new Set([
  '.env',
  '.git',
  '.gpu',
  '.manager-staging',
  '.venv',
  '.venv-agents',
  '.venv-graph',
  '.venv-pdf',
  '.venv-web',
  '.voicestudio',
  'graphify-out',
  'node_modules',
  'repos',
]);
const DISCOVERY_SKIP = new Set([
  ...FORBIDDEN_NAMES,
  '.automation',
  '.cache',
  '.remotion',
  'library',
  'out',
  'projects',
  'public',
]);

function fail(message) {
  throw new Error(message);
}

function loadConfig(configPath = DEFAULT_CONFIG) {
  const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (parsed.schemaVersion !== 1) fail('Unsupported backup config schema');
  if (!/^[a-zA-Z0-9_-]+$/.test(parsed.remote || '')) fail('Invalid rclone remote name');
  if (!/^[a-zA-Z0-9_-]+$/.test(parsed.destinationFolderId || '')) fail('Invalid Drive folder ID');
  for (const key of ['currentPrefix', 'versionsPrefix', 'manifestPrefix']) {
    if (!parsed[key] || path.isAbsolute(parsed[key]) || parsed[key].includes('..')) {
      fail(`Invalid ${key}`);
    }
  }
  if (!Array.isArray(parsed.sources) || !Array.isArray(parsed.discoverManagerHistoryIn)) {
    fail('Backup sources must be arrays');
  }
  return parsed;
}

function validateRelative(relative) {
  if (!relative || path.isAbsolute(relative)) fail(`Unsafe backup path: ${relative}`);
  const normalized = path.normalize(relative);
  if (normalized === '..' || normalized.startsWith(`..${path.sep}`)) {
    fail(`Backup path leaves repository: ${relative}`);
  }
  for (const part of normalized.split(path.sep)) {
    if (FORBIDDEN_NAMES.has(part) || part.startsWith('.env')) {
      fail(`Forbidden backup path: ${relative}`);
    }
  }
  return normalized;
}

function discoverManagerHistory(root, startRelative) {
  const start = path.join(root, validateRelative(startRelative));
  if (!fs.existsSync(start)) return [];
  const found = [];
  const visit = (absolute, relative) => {
    for (const entry of fs.readdirSync(absolute, {withFileTypes: true})) {
      if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
      if (DISCOVERY_SKIP.has(entry.name)) continue;
      const childRelative = path.join(relative, entry.name);
      if (entry.name === '.manager-history') {
        found.push(childRelative);
        continue;
      }
      visit(path.join(absolute, entry.name), childRelative);
    }
  };
  visit(start, validateRelative(startRelative));
  return found;
}

function isNestedUnder(candidate, parent) {
  return candidate !== parent && candidate.startsWith(`${parent}${path.sep}`);
}

function collectSources(root, config) {
  const configured = config.sources.map(validateRelative).filter((relative) =>
    fs.existsSync(path.join(root, relative)),
  );
  const discovered = config.discoverManagerHistoryIn.flatMap((relative) =>
    discoverManagerHistory(root, relative),
  );
  return [...new Set([...configured, ...discovered])]
    .filter((candidate, _index, all) => !all.some((parent) => isNestedUnder(candidate, parent)))
    .sort();
}

function measureTree(absolute) {
  const stat = fs.lstatSync(absolute);
  if (stat.isSymbolicLink()) return {files: 0, bytes: 0, symlinks: 1};
  if (stat.isFile()) return {files: 1, bytes: stat.size, symlinks: 0};
  const total = {files: 0, bytes: 0, symlinks: 0};
  for (const entry of fs.readdirSync(absolute)) {
    const measured = measureTree(path.join(absolute, entry));
    total.files += measured.files;
    total.bytes += measured.bytes;
    total.symlinks += measured.symlinks;
  }
  return total;
}

function buildPlan(root, config) {
  const sources = collectSources(root, config).map((relative) => ({
    relative,
    ...measureTree(path.join(root, relative)),
  }));
  return {
    destinationFolderId: config.destinationFolderId,
    remote: config.remote,
    sources,
    totalFiles: sources.reduce((sum, item) => sum + item.files, 0),
    totalBytes: sources.reduce((sum, item) => sum + item.bytes, 0),
    totalSymlinksSkipped: sources.reduce((sum, item) => sum + item.symlinks, 0),
  };
}

function formatBytes(bytes) {
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function resolveRclone() {
  if (process.env.VIDEO_BACKUP_RCLONE) return process.env.VIDEO_BACKUP_RCLONE;
  const local = path.join(os.homedir(), '.local', 'bin', 'rclone');
  if (fs.existsSync(local)) return local;
  return 'rclone';
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || DEFAULT_ROOT,
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
  });
  if (result.error) fail(`${command} is unavailable: ${result.error.message}`);
  if (result.status !== 0) {
    const detail = options.capture ? `\n${result.stderr || result.stdout}` : '';
    fail(`${command} exited with status ${result.status}${detail}`);
  }
  return options.capture ? (result.stdout || '').trim() : '';
}

function ensureRemote(rclone, config, root) {
  const remotes = run(rclone, ['listremotes'], {cwd: root, capture: true})
    .split('\n')
    .filter(Boolean);
  if (!remotes.includes(`${config.remote}:`)) {
    fail(`Missing rclone remote ${config.remote}:; follow docs/backup-drive.md`);
  }
  run(rclone, ['lsd', `${config.remote}:`], {cwd: root, capture: true});
}

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function commonTransferArgs() {
  return [
    '--checksum',
    '--checkers', '8',
    '--transfers', '4',
    '--drive-chunk-size', '64M',
    '--stats', '30s',
    '--log-level', 'NOTICE',
  ];
}

function copySource(rclone, root, config, relative, runId) {
  const local = path.join(root, relative);
  const destination = `${config.remote}:${config.currentPrefix}/${relative}`;
  const versionDestination = `${config.remote}:${config.versionsPrefix}/${runId}/${relative}`;
  run(rclone, [
    'copy', local, destination,
    '--backup-dir', versionDestination,
    '--create-empty-src-dirs',
    ...commonTransferArgs(),
  ], {cwd: root});
}

function verifySource(rclone, root, config, relative) {
  run(rclone, [
    'check',
    path.join(root, relative),
    `${config.remote}:${config.currentPrefix}/${relative}`,
    '--one-way',
    '--checksum',
    '--checkers', '8',
  ], {cwd: root});
}

function gitCommit(root) {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'});
  return result.status === 0 ? result.stdout.trim() : null;
}

function writeManifest(root, config, plan, runId) {
  const directory = path.join(root, '.cache', 'backup-drive', 'manifests');
  fs.mkdirSync(directory, {recursive: true});
  const manifest = {
    schemaVersion: 1,
    runId,
    completedAt: new Date().toISOString(),
    gitCommit: gitCommit(root),
    destinationFolderId: config.destinationFolderId,
    remote: config.remote,
    totalFiles: plan.totalFiles,
    totalBytes: plan.totalBytes,
    symlinksSkipped: plan.totalSymlinksSkipped,
    sources: plan.sources,
    verification: 'rclone check --one-way --checksum --download passed for every source',
  };
  const output = path.join(directory, `${runId}.json`);
  fs.writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`, {mode: 0o600});
  return output;
}

function printPlan(plan) {
  console.log(`Drive folder: ${plan.destinationFolderId}`);
  console.log(`Remote: ${plan.remote}:`);
  for (const source of plan.sources) {
    console.log(`- ${source.relative}: ${source.files} files, ${formatBytes(source.bytes)}`);
  }
  console.log(`Total: ${plan.totalFiles} files, ${formatBytes(plan.totalBytes)}`);
  if (plan.totalSymlinksSkipped) console.log(`Skipped symlinks: ${plan.totalSymlinksSkipped}`);
}

function main(argv = process.argv.slice(2)) {
  const action = argv[0] || 'plan';
  const root = process.env.VIDEO_BACKUP_REPO_ROOT
    ? path.resolve(process.env.VIDEO_BACKUP_REPO_ROOT)
    : DEFAULT_ROOT;
  const config = loadConfig(process.env.VIDEO_BACKUP_CONFIG || DEFAULT_CONFIG);
  const plan = buildPlan(root, config);
  const rclone = resolveRclone();

  if (action === 'plan') {
    printPlan(plan);
    return;
  }
  if (action === 'doctor') {
    console.log(run(rclone, ['version'], {cwd: root, capture: true}).split('\n')[0]);
    ensureRemote(rclone, config, root);
    console.log(`Remote ${config.remote}: is reachable.`);
    return;
  }
  if (!['run', 'verify'].includes(action)) {
    fail('Usage: backup:drive -- plan|doctor|run|verify');
  }

  ensureRemote(rclone, config, root);
  if (action === 'verify') {
    for (const source of plan.sources) verifySource(rclone, root, config, source.relative);
    console.log(`Verified ${plan.totalFiles} files (${formatBytes(plan.totalBytes)}).`);
    return;
  }

  const runId = timestamp();
  printPlan(plan);
  for (const source of plan.sources) copySource(rclone, root, config, source.relative, runId);
  for (const source of plan.sources) verifySource(rclone, root, config, source.relative);
  const manifest = writeManifest(root, config, plan, runId);
  run(rclone, [
    'copyto',
    manifest,
    `${config.remote}:${config.manifestPrefix}/${runId}.json`,
    '--checksum',
  ], {cwd: root});
  console.log(`Backup ${runId} completed and verified.`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`backup:drive: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  buildPlan,
  collectSources,
  discoverManagerHistory,
  formatBytes,
  loadConfig,
  validateRelative,
};
