#!/usr/bin/env node
// Drive backup of non-Git data (docs/backup-drive.md). Copy-only: never sync/delete/purge on Drive.
// State for the project manager lives in ignored .cache/backup-drive/: status.json (live progress),
// index.json (files last confirmed on Drive by checksum), lock (one backup at a time), run.log.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawn, spawnSync} = require('node:child_process');

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
const BACKUP_SKIP_NAMES = new Set([
  ...FORBIDDEN_NAMES,
  '.cache',
  '.remotion',
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
const ACTIVE_PHASES = new Set(['starting', 'checking-remote', 'copying', 'verifying', 'manifest']);
// Share of a source's progress spent uploading vs. confirming checksums afterwards.
const COPY_WEIGHT = 0.85;

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

function shouldSkipBackupEntry(name) {
  return BACKUP_SKIP_NAMES.has(name) || name.startsWith('.env');
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

// Every file rclone would transfer for one source, with the stat used to tell later whether it changed.
// Paths are relative to the repository and use '/' so they match index.json on every platform.
function walkSource(root, relative) {
  const files = [];
  let symlinks = 0;
  const visit = (absolute, rel, isRoot) => {
    let stat;
    try {
      stat = fs.lstatSync(absolute);
    } catch {
      return;
    }
    if (stat.isSymbolicLink()) {
      symlinks += 1;
      return;
    }
    if (!isRoot && shouldSkipBackupEntry(path.basename(absolute))) return;
    if (stat.isFile()) {
      files.push({path: rel.split(path.sep).join('/'), size: stat.size, mtimeMs: Math.round(stat.mtimeMs)});
      return;
    }
    if (!stat.isDirectory()) return;
    for (const entry of fs.readdirSync(absolute)) visit(path.join(absolute, entry), path.join(rel, entry), false);
  };
  visit(path.join(root, relative), relative, true);
  return {files, symlinks};
}

function measureTree(absolute, isRoot = true) {
  const stat = fs.lstatSync(absolute);
  if (stat.isSymbolicLink()) return {files: 0, bytes: 0, symlinks: 1};
  if (!isRoot && shouldSkipBackupEntry(path.basename(absolute))) {
    return {files: 0, bytes: 0, symlinks: 0};
  }
  if (stat.isFile()) return {files: 1, bytes: stat.size, symlinks: 0};
  const total = {files: 0, bytes: 0, symlinks: 0};
  for (const entry of fs.readdirSync(absolute)) {
    const measured = measureTree(path.join(absolute, entry), false);
    total.files += measured.files;
    total.bytes += measured.bytes;
    total.symlinks += measured.symlinks;
  }
  return total;
}

function backupFilterArgs() {
  const args = [];
  for (const name of [...BACKUP_SKIP_NAMES].sort()) {
    args.push('--exclude', `${name}/**`, '--exclude', `**/${name}/**`);
  }
  args.push('--exclude', '.env*', '--exclude', '**/.env*');
  return args;
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

// --- Local state ---------------------------------------------------------------------------------

function stateDir(root) {
  return path.join(root, '.cache', 'backup-drive');
}

function statePaths(root) {
  const dir = stateDir(root);
  return {
    dir,
    status: path.join(dir, 'status.json'),
    index: path.join(dir, 'index.json'),
    lock: path.join(dir, 'lock'),
    log: path.join(dir, 'run.log'),
    manifests: path.join(dir, 'manifests'),
  };
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJsonAtomic(file, value) {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  const temporary = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value)}\n`, {mode: 0o600});
  fs.renameSync(temporary, file);
}

function readIndex(root) {
  const index = readJson(statePaths(root).index, null);
  return index && index.schemaVersion === 1 && index.files ? index : {schemaVersion: 1, updatedAt: null, files: {}};
}

// A file is pending when Drive has never confirmed it, or its size/mtime changed since it was confirmed.
function pendingFor(walk, index) {
  const items = [];
  for (const file of walk.files) {
    const known = index.files[file.path];
    if (!known) items.push({...file, reason: 'new'});
    else if (known[0] !== file.size || known[1] !== file.mtimeMs) items.push({...file, reason: 'changed'});
  }
  return items;
}

function buildPending(root, config, index = readIndex(root)) {
  const sources = collectSources(root, config).map((relative) => {
    const walk = walkSource(root, relative);
    const pending = pendingFor(walk, index);
    return {
      relative,
      files: walk.files.length,
      bytes: walk.files.reduce((sum, file) => sum + file.size, 0),
      symlinks: walk.symlinks,
      pendingFiles: pending.length,
      pendingBytes: pending.reduce((sum, file) => sum + file.size, 0),
      pending,
    };
  });
  return {
    indexUpdatedAt: index.updatedAt,
    totalFiles: sources.reduce((sum, item) => sum + item.files, 0),
    totalBytes: sources.reduce((sum, item) => sum + item.bytes, 0),
    pendingFiles: sources.reduce((sum, item) => sum + item.pendingFiles, 0),
    pendingBytes: sources.reduce((sum, item) => sum + item.pendingBytes, 0),
    sources,
  };
}

// Record files rclone check reported identical on Drive, but only if they did not change meanwhile.
function confirmInIndex(root, relative, snapshot, matchedPaths) {
  const index = readIndex(root);
  const prefix = `${relative.split(path.sep).join('/')}/`;
  const present = new Set(snapshot.files.map((file) => file.path));
  for (const key of Object.keys(index.files)) {
    if (key.startsWith(prefix) && !present.has(key)) delete index.files[key];
  }
  let confirmed = 0;
  for (const file of snapshot.files) {
    if (!matchedPaths.has(file.path.slice(prefix.length))) continue;
    let stat;
    try {
      stat = fs.lstatSync(path.join(root, file.path));
    } catch {
      continue;
    }
    if (stat.size !== file.size || Math.round(stat.mtimeMs) !== file.mtimeMs) continue;
    index.files[file.path] = [file.size, file.mtimeMs];
    confirmed += 1;
  }
  index.updatedAt = new Date().toISOString();
  writeJsonAtomic(statePaths(root).index, index);
  return confirmed;
}

function processCommand(pid) {
  try {
    return fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0').filter(Boolean);
  } catch {
    return null;
  }
}

function isBackupCommand(argv) {
  if (!argv || !argv.length || !/(^|\/)node(js)?$/.test(argv[0])) return false;
  const scriptIndex = argv.findIndex((arg) => arg.endsWith('drive-backup.cjs'));
  return scriptIndex > 0 && ['run', 'verify'].includes(argv[scriptIndex + 1]);
}

function isAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
}

// Repository a backup process works on: VIDEO_BACKUP_REPO_ROOT, else the repo holding its script.
function processRoot(pid, argv) {
  try {
    const env = fs.readFileSync(`/proc/${pid}/environ`, 'utf8').split('\0');
    const override = env.find((item) => item.startsWith('VIDEO_BACKUP_REPO_ROOT='));
    const cwd = fs.readlinkSync(`/proc/${pid}/cwd`);
    if (override) return path.resolve(cwd, override.slice('VIDEO_BACKUP_REPO_ROOT='.length));
    const script = argv.find((arg) => arg.endsWith('drive-backup.cjs'));
    return path.resolve(cwd, script, '..', '..', '..');
  } catch {
    return null;
  }
}

// Backup processes for this repository, including ones started before status tracking existed.
function findBackupProcesses(root, {exclude = process.pid} = {}) {
  let entries = [];
  try {
    entries = fs.readdirSync('/proc');
  } catch {
    return [];
  }
  const target = path.resolve(root);
  return entries
    .filter((name) => /^\d+$/.test(name) && Number(name) !== exclude)
    .map(Number)
    .filter((pid) => {
      const argv = processCommand(pid);
      return isBackupCommand(argv) && processRoot(pid, argv) === target;
    });
}

function acquireLock(root) {
  const {lock, dir} = statePaths(root);
  fs.mkdirSync(dir, {recursive: true});
  const others = findBackupProcesses(root);
  if (others.length) fail(`Another backup is running (pid ${others.join(', ')}); never run backups concurrently`);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const fd = fs.openSync(lock, 'wx', 0o600);
      fs.writeSync(fd, String(process.pid));
      fs.closeSync(fd);
      return () => {
        try {
          if (fs.readFileSync(lock, 'utf8').trim() === String(process.pid)) fs.unlinkSync(lock);
        } catch {}
      };
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const owner = Number(fs.readFileSync(lock, 'utf8').trim());
      if (isAlive(owner) && isBackupCommand(processCommand(owner))) {
        fail(`Another backup is running (pid ${owner}); never run backups concurrently`);
      }
      fs.unlinkSync(lock);
    }
  }
  fail('Could not take the backup lock');
}

// --- rclone --------------------------------------------------------------------------------------

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

function progressArgs() {
  return ['--use-json-log', '--stats', '2s', '--stats-log-level', 'NOTICE', '--log-level', 'NOTICE'];
}

function commonTransferArgs() {
  return [
    '--checksum',
    '--checkers', '8',
    '--transfers', '4',
    '--drive-chunk-size', '64M',
    ...progressArgs(),
  ];
}

// The single running rclone child, so a stop request can end it with the backup.
let activeChild = null;

// Runs rclone with JSON logs: stats go to onStats, errors and a periodic summary go to the log.
function runRclone(rclone, args, {cwd, onStats, okCodes = [0]}) {
  return new Promise((resolve, reject) => {
    const child = spawn(rclone, args, {cwd, stdio: ['ignore', 'pipe', 'pipe']});
    activeChild = child;
    let buffer = '';
    let lastPrint = 0;
    const errors = [];
    const handle = (line) => {
      if (!line.trim()) return;
      let entry;
      try {
        entry = JSON.parse(line);
      } catch {
        console.error(line);
        return;
      }
      if (entry.stats) {
        onStats?.(entry.stats);
        if (Date.now() - lastPrint > 30000) {
          lastPrint = Date.now();
          console.log(String(entry.msg || '').trim().split('\n').slice(0, 2).join(' | '));
        }
      } else if (entry.level === 'error' || entry.level === 'critical') {
        if (errors.length < 50) errors.push(entry.msg);
        console.error(`rclone: ${entry.object ? `${entry.object}: ` : ''}${entry.msg}`);
      } else if (entry.msg) {
        console.log(`rclone: ${entry.msg}`);
      }
    };
    const onData = (chunk) => {
      buffer += chunk;
      let newline;
      while ((newline = buffer.indexOf('\n')) >= 0) {
        handle(buffer.slice(0, newline));
        buffer = buffer.slice(newline + 1);
      }
    };
    child.stdout.setEncoding('utf8').on('data', onData);
    child.stderr.setEncoding('utf8').on('data', onData);
    child.on('error', (error) => {
      activeChild = null;
      reject(new Error(`${rclone} is unavailable: ${error.message}`));
    });
    child.on('close', (code, signal) => {
      activeChild = null;
      handle(buffer);
      if (signal) return reject(new Error(`rclone stopped by ${signal}`));
      if (!okCodes.includes(code)) {
        return reject(new Error(`rclone exited with status ${code}${errors.length ? `: ${errors.slice(-3).join('; ')}` : ''}`));
      }
      resolve({code, errors});
    });
  });
}

function copySource(rclone, root, config, relative, runId, onStats) {
  const local = path.join(root, relative);
  const destination = `${config.remote}:${config.currentPrefix}/${relative}`;
  const versionDestination = `${config.remote}:${config.versionsPrefix}/${runId}/${relative}`;
  return runRclone(rclone, [
    'copy', local, destination,
    '--backup-dir', versionDestination,
    '--create-empty-src-dirs',
    ...backupFilterArgs(),
    ...commonTransferArgs(),
  ], {cwd: root, onStats});
}

// rclone check exits 1 when files differ or are missing; the match list still tells what is safe on Drive.
async function verifySource(rclone, root, config, relative, onStats) {
  const {dir} = statePaths(root);
  fs.mkdirSync(dir, {recursive: true});
  const matchFile = path.join(dir, `match-${process.pid}.txt`);
  const differFile = path.join(dir, `differ-${process.pid}.txt`);
  try {
    const {code} = await runRclone(rclone, [
      'check',
      path.join(root, relative),
      `${config.remote}:${config.currentPrefix}/${relative}`,
      '--one-way',
      '--checksum',
      '--checkers', '8',
      '--match', matchFile,
      '--missing-on-dst', differFile,
      '--differ', `${differFile}.differ`,
      ...backupFilterArgs(),
      ...progressArgs(),
    ], {cwd: root, onStats, okCodes: [0, 1]});
    const read = (file) => {
      try {
        return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
      } catch {
        return [];
      }
    };
    const matched = new Set(read(matchFile));
    const differing = [...read(differFile), ...read(`${differFile}.differ`)];
    return {ok: code === 0 && differing.length === 0, matched, differing};
  } finally {
    for (const file of [matchFile, differFile, `${differFile}.differ`]) fs.rmSync(file, {force: true});
  }
}

function gitCommit(root) {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'});
  return result.status === 0 ? result.stdout.trim() : null;
}

function writeManifest(root, config, plan, runId) {
  const directory = statePaths(root).manifests;
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
    verification: 'rclone check --one-way --checksum passed for every source',
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

// --- Status --------------------------------------------------------------------------------------

function overallPercent(status) {
  const total = status.sources.reduce((sum, source) => sum + Math.max(source.bytes, 1), 0);
  let done = 0;
  for (const source of status.sources) {
    const weight = Math.max(source.bytes, 1);
    const copyShare = status.action === 'verify' ? 0 : COPY_WEIGHT;
    const fraction = (stats) => {
      if (!stats) return 0;
      if (stats.totalBytes > 0) return Math.min(1, stats.bytes / stats.totalBytes);
      if (stats.totalChecks > 0) return Math.min(1, stats.checks / stats.totalChecks);
      return 0;
    };
    if (source.state === 'verified' || source.state === 'differs') done += weight;
    else if (source.state === 'copying') done += weight * copyShare * fraction(source.stats);
    else if (source.state === 'verifying') done += weight * (copyShare + (1 - copyShare) * fraction(source.stats));
  }
  return Math.min(100, Math.floor((done / total) * 1000) / 10);
}

function createStatusWriter(root, initial) {
  const file = statePaths(root).status;
  const status = {schemaVersion: 1, pid: process.pid, ...initial};
  let lastWrite = 0;
  const write = (force = false) => {
    if (!force && Date.now() - lastWrite < 1000) return;
    lastWrite = Date.now();
    status.updatedAt = new Date().toISOString();
    status.percent = status.sources?.length ? overallPercent(status) : 0;
    writeJsonAtomic(file, status);
  };
  return {status, write};
}

function compactStats(stats) {
  return {
    bytes: stats.bytes || 0,
    totalBytes: stats.totalBytes || 0,
    transfers: stats.transfers || 0,
    totalTransfers: stats.totalTransfers || 0,
    checks: stats.checks || 0,
    totalChecks: stats.totalChecks || 0,
    errors: stats.errors || 0,
    speed: stats.speed || 0,
    eta: stats.eta ?? null,
    transferring: (stats.transferring || []).slice(0, 4).map((item) => ({
      name: item.name,
      size: item.size,
      percentage: item.percentage,
    })),
  };
}

async function execute(action, root, config) {
  const rclone = resolveRclone();
  const releaseLock = acquireLock(root);
  const runId = timestamp();
  const {status, write} = createStatusWriter(root, {
    action,
    runId,
    phase: 'starting',
    startedAt: new Date().toISOString(),
    sources: [],
  });
  let stopping = false;
  const stop = (signal) => {
    if (stopping) return;
    stopping = true;
    status.phase = 'stopped';
    status.finishedAt = new Date().toISOString();
    status.error = `Stopped (${signal})`;
    write(true);
    activeChild?.kill('SIGTERM');
    releaseLock();
    console.error(`backup:drive: stopped by ${signal}; run again to continue (copy resumes, nothing on Drive is deleted).`);
    process.exit(130);
  };
  process.on('SIGTERM', () => stop('SIGTERM'));
  process.on('SIGINT', () => stop('SIGINT'));
  process.on('SIGHUP', () => stop('SIGHUP'));

  try {
    write(true);
    status.phase = 'checking-remote';
    write(true);
    ensureRemote(rclone, config, root);

    const index = readIndex(root);
    const snapshots = new Map();
    for (const relative of collectSources(root, config)) {
      const walk = walkSource(root, relative);
      snapshots.set(relative, walk);
      const pending = pendingFor(walk, index);
      status.sources.push({
        relative,
        files: walk.files.length,
        bytes: walk.files.reduce((sum, file) => sum + file.size, 0),
        symlinks: walk.symlinks,
        pendingFiles: pending.length,
        pendingBytes: pending.reduce((sum, file) => sum + file.size, 0),
        state: 'waiting',
      });
    }
    const plan = {
      destinationFolderId: config.destinationFolderId,
      remote: config.remote,
      sources: status.sources.map(({relative, files, bytes, symlinks}) => ({relative, files, bytes, symlinks})),
      totalFiles: status.sources.reduce((sum, item) => sum + item.files, 0),
      totalBytes: status.sources.reduce((sum, item) => sum + item.bytes, 0),
      totalSymlinksSkipped: status.sources.reduce((sum, item) => sum + item.symlinks, 0),
    };
    status.totalFiles = plan.totalFiles;
    status.totalBytes = plan.totalBytes;
    printPlan(plan);

    const missing = [];
    for (const source of status.sources) {
      const track = (stats) => {
        source.stats = compactStats(stats);
        write();
      };
      if (action === 'run') {
        status.phase = 'copying';
        status.current = source.relative;
        source.state = 'copying';
        source.stats = null;
        write(true);
        console.log(`Copying ${source.relative} …`);
        await copySource(rclone, root, config, source.relative, runId, track);
      }
      status.phase = 'verifying';
      status.current = source.relative;
      source.state = 'verifying';
      source.stats = null;
      write(true);
      console.log(`Verifying ${source.relative} …`);
      const result = await verifySource(rclone, root, config, source.relative, track);
      source.confirmed = confirmInIndex(root, source.relative, snapshots.get(source.relative), result.matched);
      source.differing = result.differing.length;
      source.state = result.ok ? 'verified' : 'differs';
      write(true);
      if (!result.ok) {
        missing.push(`${source.relative} (${result.differing.length} files)`);
        console.error(`${source.relative}: ${result.differing.length} files missing or different on Drive`);
      }
    }
    status.current = null;

    if (action === 'verify') {
      status.phase = 'done';
      status.result = missing.length ? 'differs' : 'verified';
      status.finishedAt = new Date().toISOString();
      write(true);
      console.log(missing.length
        ? `Not yet on Drive: ${missing.join(', ')}. Run a backup to upload them.`
        : `Verified ${plan.totalFiles} files (${formatBytes(plan.totalBytes)}).`);
      if (missing.length) process.exitCode = 1;
      return;
    }
    if (missing.length) fail(`Verification failed after copy: ${missing.join(', ')}`);

    status.phase = 'manifest';
    write(true);
    const manifest = writeManifest(root, config, plan, runId);
    await runRclone(rclone, [
      'copyto',
      manifest,
      `${config.remote}:${config.manifestPrefix}/${runId}.json`,
      '--checksum',
      ...progressArgs(),
    ], {cwd: root});
    status.phase = 'done';
    status.result = 'verified';
    status.manifest = `${config.manifestPrefix}/${runId}.json`;
    status.finishedAt = new Date().toISOString();
    write(true);
    console.log(`Backup ${runId} completed and verified.`);
  } catch (error) {
    if (!stopping) {
      status.phase = 'failed';
      status.error = error.message;
      status.finishedAt = new Date().toISOString();
      write(true);
    }
    throw error;
  } finally {
    if (!stopping) releaseLock();
  }
}

// Read-only view of the last/ongoing run. A run whose process is gone without finishing was interrupted.
function readStatus(root) {
  const status = readJson(statePaths(root).status, null);
  const processes = findBackupProcesses(root);
  if (!status) return {status: null, running: processes.length > 0, untracked: processes};
  const active = ACTIVE_PHASES.has(status.phase);
  const alive = active && isAlive(status.pid) && isBackupCommand(processCommand(status.pid));
  return {
    status: active && !alive ? {...status, phase: 'interrupted'} : status,
    running: alive || processes.length > 0,
    untracked: processes.filter((pid) => pid !== status.pid),
  };
}

// Ends every backup process on this machine (tracked or older untracked runs). Copy resumes on the next run.
function stopBackups(root) {
  const pids = findBackupProcesses(root);
  for (const pid of pids) {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {}
  }
  return pids;
}

function main(argv = process.argv.slice(2)) {
  const action = argv[0] || 'plan';
  const json = argv.includes('--json');
  const root = process.env.VIDEO_BACKUP_REPO_ROOT
    ? path.resolve(process.env.VIDEO_BACKUP_REPO_ROOT)
    : DEFAULT_ROOT;
  const config = loadConfig(process.env.VIDEO_BACKUP_CONFIG || DEFAULT_CONFIG);

  if (action === 'plan') {
    printPlan(buildPlan(root, config));
    return null;
  }
  if (action === 'pending') {
    const pending = buildPending(root, config);
    if (json) {
      console.log(JSON.stringify(pending, null, 2));
      return null;
    }
    console.log(`Last confirmed on Drive: ${pending.indexUpdatedAt || 'never'}`);
    for (const source of pending.sources) {
      console.log(`- ${source.relative}: ${source.pendingFiles}/${source.files} files pending, ${formatBytes(source.pendingBytes)}`);
    }
    console.log(`Pending: ${pending.pendingFiles} files, ${formatBytes(pending.pendingBytes)}`);
    return null;
  }
  if (action === 'status') {
    console.log(JSON.stringify(readStatus(root), null, 2));
    return null;
  }
  if (action === 'stop') {
    const pids = stopBackups(root);
    console.log(pids.length ? `Stopping backup pid ${pids.join(', ')}.` : 'No backup is running.');
    return null;
  }
  if (action === 'doctor') {
    const rclone = resolveRclone();
    console.log(run(rclone, ['version'], {cwd: root, capture: true}).split('\n')[0]);
    ensureRemote(rclone, config, root);
    console.log(`Remote ${config.remote}: is reachable.`);
    return null;
  }
  if (!['run', 'verify'].includes(action)) {
    fail('Usage: backup:drive -- plan|pending|status|doctor|run|verify|stop');
  }
  return execute(action, root, config);
}

if (require.main === module) {
  Promise.resolve()
    .then(() => main())
    .catch((error) => {
      console.error(`backup:drive: ${error.message}`);
      process.exitCode = 1;
    });
}

module.exports = {
  ACTIVE_PHASES,
  backupFilterArgs,
  buildPending,
  buildPlan,
  collectSources,
  confirmInIndex,
  discoverManagerHistory,
  findBackupProcesses,
  formatBytes,
  isBackupCommand,
  loadConfig,
  overallPercent,
  processRoot,
  pendingFor,
  readIndex,
  readStatus,
  shouldSkipBackupEntry,
  statePaths,
  stopBackups,
  validateRelative,
  walkSource,
};
