// Live production progress of a project, for the user to follow (docs/architecture/review-workflow.md,
// "Theo dõi tiến trình"). After the initial lock the agent writes a plan of tasks and keeps each task's
// status/percent up to date; every change is saved at once in .automation/progress/<slug>.json (Git-ignored),
// so an interrupted job keeps its last state. Purely informational: nothing here gates or changes the workflow.
const fs = require('node:fs');
const path = require('node:path');

const KINDS = {voice: 'Giọng đọc', visuals: 'Hình ảnh / animation', music: 'Nhạc nền', assembly: 'Dựng', clip: 'Clip duyệt cảnh', check: 'Kiểm tra', other: 'Việc khác'};
const STATUSES = ['pending', 'running', 'done', 'failed', 'blocked'];
const STALE_MS = 20 * 60 * 1000; // a running task with no update for 20 minutes is shown as interrupted
const MAX_EVENTS = 500;

const file = (root, id) => path.join(root, '.automation/progress', `${id}.json`);
const now = () => new Date().toISOString();
function load(root, id) {
  try {return JSON.parse(fs.readFileSync(file(root, id), 'utf8'));}
  catch (e) {if (e.code === 'ENOENT') return {schemaVersion: 1, projectId: id, plan: null, tasks: [], events: []};throw e;}
}
function save(root, id, store) {
  const target = file(root, id), tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2) + '\n');
  fs.renameSync(tmp, target);
}
function event(store, type, task, message = '', percent = null) {
  store.events.push({at: now(), type, task: task?.id || null, title: task?.title || null, message, percent});
  if (store.events.length > MAX_EVENTS) store.events.splice(0, store.events.length - MAX_EVENTS);
}
const percentOf = t => t.status === 'done' ? 100 : t.steps?.total ? Math.round(100 * t.steps.done / t.steps.total) : t.percent || 0;
function alive(pid) {try {process.kill(pid, 0);return true;} catch (e) {return e.code === 'EPERM';}}

// The plan comes from the agent after the lock: [{id, title, kind?, weight?, detail?, steps?}]. Re-planning keeps
// the progress of tasks whose id stays, so a revised plan never loses work already done.
function setPlan(root, id, {tasks, summary = '', by = 'agent', lockVersion = 0}) {
  if (!Array.isArray(tasks) || !tasks.length) throw new Error('Kế hoạch cần ít nhất một việc');
  const store = load(root, id), old = new Map(store.tasks.map(t => [t.id, t])), seen = new Set();
  store.tasks = tasks.map(t => {
    if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(t.id || '') || seen.has(t.id)) throw new Error(`Mã việc không hợp lệ hoặc trùng: ${t.id}`);
    if (typeof t.title !== 'string' || !t.title.trim()) throw new Error(`Việc ${t.id} cần tên`);
    seen.add(t.id);
    const prev = old.get(t.id) || {};
    return {id: t.id, title: t.title.trim(), kind: KINDS[t.kind] ? t.kind : 'other', detail: t.detail || '', weight: t.weight > 0 ? t.weight : 1,
      status: prev.status || 'pending', percent: prev.percent || 0,
      steps: t.steps ? {done: prev.steps?.done || 0, total: t.steps} : prev.steps || null,
      note: prev.note || '', startedAt: prev.startedAt || null, updatedAt: prev.updatedAt || null, finishedAt: prev.finishedAt || null, pid: prev.pid || null};
  });
  store.plan = {createdAt: store.plan?.createdAt || now(), updatedAt: now(), by, summary, lockVersion};
  event(store, store.plan.createdAt === store.plan.updatedAt ? 'plan' : 'replan', null, summary || `${store.tasks.length} việc`);
  save(root, id, store);
  return view(root, id);
}
// A task the agent starts outside the plan (e.g. a scene's review clip) is appended, never silently dropped.
function ensureTask(root, id, {id: taskId, title, kind = 'other'}) {
  const store = load(root, id);
  if (store.tasks.some(t => t.id === taskId)) return;
  store.tasks.push({id: taskId, title, kind: KINDS[kind] ? kind : 'other', detail: '', weight: 1, status: 'pending', percent: 0, steps: null,
    note: '', startedAt: null, updatedAt: null, finishedAt: null, pid: null});
  event(store, 'plan-add', store.tasks.at(-1), 'Thêm vào kế hoạch');
  save(root, id, store);
}
function update(root, id, taskId, {status, percent, steps, note, pid}) {
  const store = load(root, id), task = store.tasks.find(t => t.id === taskId);
  if (!task) throw new Error(`Không có việc ${taskId} trong kế hoạch; cập nhật kế hoạch trước`);
  if (status && !STATUSES.includes(status)) throw new Error(`Trạng thái không hợp lệ: ${status}`);
  if (status === 'failed' && !note) throw new Error('Ghi lý do lỗi (--note)');
  const t = now(), before = task.status;
  if (status) task.status = status;
  if (percent !== undefined) task.percent = Math.max(0, Math.min(100, Number(percent) || 0));
  if (steps) task.steps = {done: Math.max(0, steps.done), total: Math.max(1, steps.total)};
  if (note !== undefined) task.note = note;
  if (pid !== undefined) task.pid = pid;
  if (task.status === 'running' && !task.startedAt) task.startedAt = t;
  if (['done', 'failed'].includes(task.status)) {task.finishedAt = t;task.pid = null;}
  if (task.status === 'running' && before !== 'running') task.finishedAt = null;
  task.updatedAt = t;
  event(store, task.status !== before ? task.status : 'update', task, note || '', percentOf(task));
  save(root, id, store);
  return task;
}
function log(root, id, message, taskId = null) {
  if (!message) throw new Error('Cần nội dung (--note)');
  const store = load(root, id);
  event(store, 'log', store.tasks.find(t => t.id === taskId) || null, message);
  save(root, id, store);
}
// What the page shows. "interrupted" is derived, never stored: the last saved state stays as it was.
function view(root, id, {at = Date.now()} = {}) {
  const store = load(root, id);
  const tasks = store.tasks.map(t => {
    const stale = t.status === 'running' && ((t.pid && !alive(t.pid)) || at - Date.parse(t.updatedAt || t.startedAt || 0) > STALE_MS);
    return {...t, percent: percentOf(t), display: stale ? 'interrupted' : t.status, kindTitle: KINDS[t.kind]};
  });
  const weight = tasks.reduce((a, t) => a + t.weight, 0);
  const overall = weight ? Math.round(tasks.reduce((a, t) => a + t.weight * t.percent, 0) / weight) : 0;
  const count = s => tasks.filter(t => t.display === s).length;
  return {projectId: id, plan: store.plan, overall, tasks, events: [...store.events].reverse().slice(0, 80),
    counts: {total: tasks.length, done: count('done'), running: count('running'), interrupted: count('interrupted'), failed: count('failed'), blocked: count('blocked'), pending: count('pending')},
    lastActivity: store.events.at(-1)?.at || null};
}
module.exports = {KINDS, STATUSES, setPlan, ensureTask, update, log, view, load, file};
