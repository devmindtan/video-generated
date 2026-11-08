// Temporary files of renders (user rule 2026-11-08: keep temp files under control so the disk never fills mid-work).
//
//   npm run temp -- status            free space, Remotion temp bundles and repo caches (read-only)
//   npm run temp -- clean             delete Remotion temp bundles that no process is using and that are older than
//                                     30 minutes (each holds a full copy of public/, several GB)
//
// Renders call assertFreeSpace() first: below MIN_FREE_GB they stop with a hint instead of filling the disk.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const MIN_FREE_GB = 12;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const GB = 1024 ** 3;

export const freeGb = (dir = os.tmpdir()) => {
  const s = fs.statfsSync(dir);
  return (s.bavail * s.bsize) / GB;
};

export const assertFreeSpace = (needGb = MIN_FREE_GB) => {
  const free = freeGb();
  if (free < needGb) {
    throw new Error(`Ổ còn ${free.toFixed(1)} GB (< ${needGb} GB). Chạy "npm run temp -- status" rồi "npm run temp -- clean" trước khi render.`);
  }
  return free;
};

const sizeOf = (p) => {
  let total = 0;
  const walk = (q) => {
    let st;
    try { st = fs.lstatSync(q); } catch { return; }
    if (st.isDirectory()) for (const n of fs.readdirSync(q)) walk(path.join(q, n));
    else total += st.size;
  };
  walk(p);
  return total;
};

// Directories some running process has open (cwd or open files), from /proc; empty where /proc is missing.
const inUse = () => {
  const used = new Set();
  let pids = [];
  try { pids = fs.readdirSync('/proc').filter((n) => /^\d+$/.test(n)); } catch { return used; }
  for (const pid of pids) {
    try { used.add(fs.readlinkSync(`/proc/${pid}/cwd`)); } catch { /* gone or not ours */ }
    let fds = [];
    try { fds = fs.readdirSync(`/proc/${pid}/fd`); } catch { continue; }
    for (const fd of fds) {
      try { used.add(fs.readlinkSync(`/proc/${pid}/fd/${fd}`)); } catch { /* closed */ }
    }
  }
  return used;
};

export const bundles = () => {
  const tmp = os.tmpdir(), me = os.userInfo().uid;
  return fs.readdirSync(tmp).filter((n) => n.startsWith('remotion-webpack-bundle-')).map((n) => {
    const p = path.join(tmp, n), st = fs.statSync(p);
    return {path: p, mine: st.uid === me, ageMinutes: (Date.now() - st.mtimeMs) / 60000};
  });
};

const main = () => {
  const [cmd = 'status'] = process.argv.slice(2);
  const list = bundles();
  if (cmd === 'status') {
    console.log(`Ổ trống: ${freeGb().toFixed(1)} GB (render cần ≥ ${MIN_FREE_GB} GB)`);
    let sum = 0;
    for (const b of list) {const s = sizeOf(b.path);sum += s;console.log(`  ${path.basename(b.path)}  ${(s / GB).toFixed(1)} GB  ${Math.round(b.ageMinutes)} phút${b.mine ? '' : '  (người dùng khác)'}`);}
    console.log(`Bản dựng tạm Remotion: ${list.length} thư mục, ${(sum / GB).toFixed(1)} GB`);
    for (const c of ['.cache/visual-sync', '.cache/media', 'projects']) {
      const p = path.join(ROOT, c);
      if (fs.existsSync(p)) console.log(`  ${c}: ${(sizeOf(p) / GB).toFixed(1)} GB`);
    }
    return;
  }
  if (cmd === 'clean') {
    const used = [...inUse()];
    let freed = 0, kept = 0;
    for (const b of list) {
      const busy = used.some((u) => u === b.path || u.startsWith(b.path + path.sep));
      if (!b.mine || busy || b.ageMinutes < 30) {kept++;continue;}
      freed += sizeOf(b.path);
      fs.rmSync(b.path, {recursive: true, force: true});
    }
    console.log(`Đã xóa ${(freed / GB).toFixed(1)} GB bản dựng tạm; giữ ${kept} thư mục (đang dùng, mới tạo < 30 phút hoặc của người khác). Ổ trống: ${freeGb().toFixed(1)} GB`);
    return;
  }
  console.error('Dùng: npm run temp -- status | clean');
  process.exitCode = 2;
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
