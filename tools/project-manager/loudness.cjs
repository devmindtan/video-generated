// "Chuẩn hóa âm lượng cho YouTube" (user 2026-11-09: "Tôi đâu có dùng dòng lệnh, tôi render trên ứng dụng"): after the
// user exports a video with Studio's Render button, the manager's video dialog offers one button that writes the upload
// copy <ID>-upload.mp4 at -14 LUFS, true peak ≤ -1 dBTP (scripts/shared/media-analyze.py loudness --fix). The export is
// never touched. The job runs detached (it keeps going if the page or the manager closes), through ~/.local/bin/limited
// when present (machine rule: leave 10 % of CPU/RAM free), one job at a time, with phase/percent in a status file.
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const os = require('node:os');

function createLoudness(root, {catalog, python = path.join(root, '.venv/bin/python'), script = path.join(root, 'scripts/shared/media-analyze.py'),
  limited = path.join(os.homedir(), '.local/bin/limited')} = {}) {
  const dir = path.join(root, '.cache/project-manager/loudness');
  const SCRIPT = script;
  const alive = pid => {if (!(pid > 0)) return false;try {process.kill(pid, 0);return true;} catch {return false;}};
  const read = file => {try {return JSON.parse(fs.readFileSync(file, 'utf8'));} catch {return null;}};
  const statusFile = (slug, id) => path.join(dir, `${slug}__${id}.json`);
  // Written by the manager when a job starts (the script owns the status file and rewrites it on every update).
  const metaFile = (slug, id) => path.join(dir, `${slug}__${id}.meta`);
  // Still starting: the script has not written its pid yet (a few seconds at most).
  const starting = (s, meta) => s.phase === 'starting' && meta && Date.now() - Date.parse(meta.startedAt) < 15000;

  // Main videos of the project (not its part compositions), with their export and upload copy.
  function videos(slug) {
    const project = catalog(slug);
    if (!project) throw Object.assign(new Error('Không có dự án này'), {status: 404});
    return (project.registrations || []).filter(r => r.kind === 'Composition' && !r.part).map(r => {
      const folder = path.join(root, 'projects', slug), exportFile = path.join(folder, `${r.id}.mp4`), upload = path.join(folder, `${r.id}-upload.mp4`);
      const ex = fs.existsSync(exportFile) ? fs.statSync(exportFile) : null, up = fs.existsSync(upload) ? fs.statSync(upload) : null;
      return {composition: r.id, title: r.title || r.id, exportFile, upload, exported: ex ? {at: ex.mtime.toISOString(), bytes: ex.size} : null,
        uploadCopy: up ? {at: up.mtime.toISOString(), bytes: up.size, fresh: Boolean(ex && up.mtimeMs >= ex.mtimeMs)} : null};
    });
  }

  function jobOf(slug, id, exported) {
    const s = read(statusFile(slug, id)), meta = read(metaFile(slug, id));
    if (!s) return null;
    const running = !['done', 'failed'].includes(s.phase) && (alive(s.pid) || starting(s, meta));
    const stale = exported && meta?.exportAt && meta.exportAt !== exported.at; // a newer export since that run
    if (!running && stale) return null;
    return {phase: running ? s.phase : (['done', 'failed'].includes(s.phase) ? s.phase : 'interrupted'), percent: s.percent ?? 0, running,
      error: s.error || null, report: s.report || null, startedAt: meta?.startedAt || null, updatedAt: s.updatedAt || null};
  }

  function status(slug) {
    return {videos: videos(slug).map(v => ({composition: v.composition, title: v.title, exported: v.exported, uploadCopy: v.uploadCopy,
      uploadName: path.basename(v.upload), job: jobOf(slug, v.composition, v.exported)}))};
  }

  function anyRunning() {
    try {
      return fs.readdirSync(dir).filter(n => n.endsWith('.json')).some(n => {const s = read(path.join(dir, n)), meta = read(path.join(dir, n.replace(/\.json$/, '.meta')));
        return s && !['done', 'failed'].includes(s.phase) && (alive(s.pid) || starting(s, meta));});
    } catch {return false;}
  }

  function start(slug, id) {
    const v = videos(slug).find(x => x.composition === id);
    if (!v) throw Object.assign(new Error('Không có video này trong dự án'), {status: 404});
    if (!v.exported) throw Object.assign(new Error('Chưa có bản xuất. Render trong Studio trước.'), {status: 409});
    if (anyRunning()) throw Object.assign(new Error('Đang chuẩn hóa âm lượng một video khác. Chờ xong rồi bấm lại.'), {status: 409});
    if (!fs.existsSync(python)) throw Object.assign(new Error('Thiếu môi trường Python .venv của dự án.'), {status: 500});
    fs.mkdirSync(dir, {recursive: true});
    // An upload copy older than the export belongs to a previous render: keep it in backups/, never delete it.
    if (v.uploadCopy && !v.uploadCopy.fresh) {
      const backups = path.join(root, 'projects', slug, 'backups');
      fs.mkdirSync(backups, {recursive: true});
      fs.renameSync(v.upload, path.join(backups, `${id}-upload-${new Date().toISOString().replace(/[:.]/g, '-')}.mp4`));
    } else if (v.uploadCopy) {
      throw Object.assign(new Error('Bản đăng đã chuẩn hóa từ bản xuất hiện tại; không cần chạy lại.'), {status: 409});
    }
    const file = statusFile(slug, id), log = path.join(dir, `${slug}__${id}.log`);
    const args = [python, SCRIPT, 'loudness', v.exportFile, '--fix', '--json', '--progress', file];
    const cmd = fs.existsSync(limited) ? [limited, ...args] : ['nice', '-n', '10', ...args];
    fs.writeFileSync(metaFile(slug, id), JSON.stringify({startedAt: new Date().toISOString(), exportAt: v.exported.at, file: path.relative(root, v.exportFile)}));
    fs.writeFileSync(file, JSON.stringify({phase: 'starting', percent: 0, pid: 0}));
    const out = fs.openSync(log, 'w', 0o600);
    const child = spawn(cmd[0], cmd.slice(1), {cwd: root, detached: true, stdio: ['ignore', out, out]});
    fs.closeSync(out);
    child.unref();
    child.on('exit', code => {
      const s = read(file);
      if (code && s && !['done', 'failed'].includes(s.phase)) {
        const tail = (() => {try {return fs.readFileSync(log, 'utf8').trim().split('\n').slice(-1)[0];} catch {return '';}})();
        fs.writeFileSync(file, JSON.stringify({...s, phase: 'failed', error: code === 75 ? 'Máy còn ít hơn 10% RAM trống; đóng bớt ứng dụng rồi bấm lại.' : tail || `Dừng với mã ${code}`}));
      }
    });
    return {started: true, pid: child.pid};
  }

  return {status, start};
}

module.exports = {createLoudness};
