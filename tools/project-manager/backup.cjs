// Drive backup panel for the manager. Reads the state written by scripts/backup/drive-backup.cjs and starts
// that same command as a detached process, so a backup keeps running after the manager or the tab closes.
// Never runs rclone itself and never deletes anything on Drive (docs/backup-drive.md).
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const backup = require('../../scripts/backup/drive-backup.cjs');

const SCRIPT = path.join(__dirname, '..', '..', 'scripts', 'backup', 'drive-backup.cjs');
const LABELS = {
  public: 'Media dùng trong video',
  projects: 'Bản xuất của các tập',
  library: 'Thư viện: sách, giọng mẫu, stock',
  '.automation': 'Bản nháp và nhật ký automation',
  '.manager-trash': 'Thùng rác của trang quản lý',
};
const labelOf = relative => LABELS[relative]
  || (relative.endsWith('.manager-history') ? `Lịch sử chỉnh sửa của ${path.dirname(relative).split(path.sep).join('/')}` : relative);
const PENDING_TTL_MS = 8000;

function createBackupPanel(root, {env = {}} = {}) {
  const paths = backup.statePaths(root);
  const config = () => backup.loadConfig(env.VIDEO_BACKUP_CONFIG || process.env.VIDEO_BACKUP_CONFIG || undefined);
  let pendingCache = null;

  const pending = (fresh = false) => {
    if (!fresh && pendingCache && Date.now() - pendingCache.at < PENDING_TTL_MS) return pendingCache.value;
    const value = backup.buildPending(root, config());
    pendingCache = {at: Date.now(), value};
    return value;
  };

  const history = () => {
    let files = [];
    try {
      files = fs.readdirSync(paths.manifests).filter(name => name.endsWith('.json')).sort().reverse().slice(0, 8);
    } catch {}
    return files.map(name => {
      try {
        const m = JSON.parse(fs.readFileSync(path.join(paths.manifests, name), 'utf8'));
        return {runId: m.runId, completedAt: m.completedAt, totalFiles: m.totalFiles, totalBytes: m.totalBytes};
      } catch {
        return null;
      }
    }).filter(Boolean);
  };

  const logTail = (lines = 40) => {
    try {
      const text = fs.readFileSync(paths.log, 'utf8');
      return text.split('\n').filter(line => line.trim()).slice(-lines);
    } catch {
      return [];
    }
  };

  // Light view for the sidebar badge: no file walk.
  function summary() {
    const {status, running, untracked} = backup.readStatus(root);
    return {running, untracked, status: status && {
      action: status.action, phase: status.phase, percent: status.percent, result: status.result || null,
      error: status.error || null, startedAt: status.startedAt, finishedAt: status.finishedAt || null,
    }};
  }

  function overview() {
    const {status, running, untracked} = backup.readStatus(root);
    const p = pending(running);
    return {
      running,
      untracked,
      status,
      pending: {
        indexUpdatedAt: p.indexUpdatedAt,
        totalFiles: p.totalFiles, totalBytes: p.totalBytes,
        pendingFiles: p.pendingFiles, pendingBytes: p.pendingBytes,
        sources: p.sources.map(({pending: _list, ...source}) => ({...source, label: labelOf(source.relative)})),
      },
      history: history(),
      log: logTail(),
      configured: {remote: config().remote, folderId: config().destinationFolderId},
    };
  }

  function pendingFiles(relative, limit = 300) {
    const source = pending().sources.find(item => item.relative === relative);
    if (!source) throw Object.assign(new Error('Không có nguồn sao lưu này'), {status: 404});
    const items = [...source.pending].sort((a, b) => b.size - a.size || a.path.localeCompare(b.path));
    return {relative, label: labelOf(relative), total: items.length, items: items.slice(0, Math.min(Math.max(Number(limit) || 300, 1), 1000))};
  }

  // Spawns `drive-backup.cjs run` in its own session with output in run.log, then returns once the run has taken
  // the lock (or reports why it ended at once, e.g. another backup was already running). The separate "compare with
  // Drive" action was removed (user 2026-11-09): every run already compares checksums and verifies after copying.
  async function start(action) {
    if (action !== 'run') throw Object.assign(new Error('Thao tác không hợp lệ'), {status: 400});
    if (backup.readStatus(root).running) throw Object.assign(new Error('Một bản sao lưu đang chạy. Chờ xong hoặc dừng nó trước.'), {status: 409});
    fs.mkdirSync(paths.dir, {recursive: true});
    try {
      fs.renameSync(paths.log, path.join(paths.dir, 'run.prev.log'));
    } catch {}
    const log = fs.openSync(paths.log, 'a', 0o600);
    fs.writeSync(log, `# ${new Date().toISOString()} backup:drive ${action} (started from the project manager)\n`);
    const child = spawn(process.execPath, [SCRIPT, action], {
      cwd: root,
      detached: true,
      stdio: ['ignore', log, log],
      env: {...process.env, ...env, VIDEO_BACKUP_REPO_ROOT: root},
    });
    fs.closeSync(log);
    let exited = null;
    child.on('exit', code => {exited = code;});
    child.unref();
    pendingCache = null;
    for (let waited = 0; waited < 5000; waited += 100) {
      const status = readStatusFile();
      if (status && status.pid === child.pid) return {started: true, pid: child.pid, action};
      if (exited !== null) {
        const reason = logTail(5).filter(line => line.includes('backup:drive:')).pop();
        throw Object.assign(new Error(reason ? reason.replace(/^backup:drive:\s*/, '') : 'Bản sao lưu dừng ngay khi khởi động. Xem nhật ký.'), {status: 409});
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    // Still starting (e.g. a slow Drive check): it keeps running in the background either way.
    return {started: true, pid: child.pid, action};
  }

  function readStatusFile() {
    try {
      return JSON.parse(fs.readFileSync(paths.status, 'utf8'));
    } catch {
      return null;
    }
  }

  function stop() {
    const pids = backup.stopBackups(root);
    pendingCache = null;
    return {stopped: pids.length > 0, pids};
  }

  return {summary, overview, pendingFiles, start, stop};
}

module.exports = {createBackupPanel, labelOf};
