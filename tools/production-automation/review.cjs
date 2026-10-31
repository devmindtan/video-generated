// Production review (docs/architecture/review-workflow.md): one initial lock of five items, then patches the
// user accepts or returns one by one, then per-scene review clips with notes. Stored next to the old gate
// history in docs/projects/<slug>/approvals.json (schema 2). Only the user locks, accepts or reviews (manager);
// agents may only create patches and record rendered scene clips.
const fs = require('node:fs');
const path = require('node:path');
const approvals = require('./approvals.cjs');
const {registrations} = require('../../scripts/catalog/catalog.cjs');

function items(root, plan) {
  const {source: S, scripts: X, docs: D} = plan.paths;
  // Every *music.json of the project (main track, intro/outro tracks) is part of the music choice.
  let music = [`${S}/music.json`];
  try {music = [...new Set([...music, ...fs.readdirSync(path.join(root, S)).filter(n => /music\.json$/.test(n)).sort().map(n => `${S}/${n}`)])];} catch {}
  return [
    {id: 'script', title: 'Kịch bản', guide: 'Đọc toàn bộ lời đọc: ý, nhịp, câu chữ.', files: [`${D}/script.md`]},
    {id: 'music', title: 'Nhạc nền', guide: 'Nghe bài nhạc; kiểm tra tên bài, tác giả, nguồn và mức âm lượng dưới giọng.', files: music},
    {id: 'voice', title: 'Giọng đọc', guide: 'Nghe đoạn mẫu; kiểm tra giọng đã chọn (preset hay clone, pitch, tốc độ). Lời đọc đầy đủ làm sau khi chốt.', files: [`${X}/voice.json`]},
    {id: 'specs', title: 'Thông tin đã chốt', guide: 'Thời lượng mục tiêu và mức dao động cho phép, định dạng, kích thước, các quy tắc series áp dụng.', files: [`${D}/production-spec.md`]},
    {id: 'prompts', title: plan.profile === 'kids' ? 'Kế hoạch footage từng cảnh' : 'Prompt hình / animation từng cảnh',
      guide: plan.profile === 'kids' ? 'Footage chuyển động cho từng cảnh: dùng lại cảnh nào, cảnh nào cần quay/tạo.' : 'Prompt cho từng cảnh; chưa có ảnh. Ảnh thật xem trong clip duyệt từng cảnh.',
      files: [`${D}/image-prompts.md`]},
  ];
}

function load(root, id) {
  const store = approvals.load(root, id);
  return {...store, locks: store.locks || [], patches: store.patches || [], scenes: store.scenes || {}};
}
function save(root, id, store) {
  const file = approvals.storePath(root, id), tmp = `${file}.${process.pid}.tmp`;
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(tmp, JSON.stringify({...store, schemaVersion: 2}, null, 2) + '\n');
  fs.renameSync(tmp, file);
}
const now = () => new Date().toISOString();
const latestLock = store => store.locks[store.locks.length - 1] || null;
const pendingPatch = store => store.patches.find(p => p.status === 'pending') || null;

// Scenes: scripts/projects/<slug>/scenes.json ([{id,title,composition,frames?}]) or the scenes of story.json
// on the project's video composition.
function sceneDefs(root, plan) {
  const X = path.join(root, plan.paths.scripts);
  try {return JSON.parse(fs.readFileSync(path.join(X, 'scenes.json'), 'utf8'));} catch {}
  let story;try {story = JSON.parse(fs.readFileSync(path.join(X, 'story.json'), 'utf8'));} catch {return [];}
  const video = registrations(root).find(r => r.project === plan.projectId && r.kind === 'Composition');
  if (!video || !Array.isArray(story)) return [];
  return story.filter(s => s.id && Number.isFinite(s.start) && Number.isFinite(s.duration)).map(s => ({id: s.id, title: s.id, composition: video.id,
    frames: [Math.round(s.start * video.fps), Math.round((s.start + s.duration) * video.fps) - 1]}));
}

function summary(root, plan) {
  const store = load(root, plan.projectId), lock = latestLock(store), pending = pendingPatch(store);
  const list = items(root, plan).map(item => ({...item, files: item.files.map(rel => {
    const sha256 = approvals.sha256(root, rel), locked = lock ? lock.files[rel] ?? null : null;
    return {path: rel, exists: Boolean(sha256), sha256, lockedSha256: locked, changed: Boolean(lock) && locked !== sha256};
  })}));
  const files = list.flatMap(i => i.files);
  // Edits after the lock that are not (exactly) what the pending patch proposes.
  const drift = lock ? files.filter(f => f.changed && pending?.changed[f.path]?.after !== f.sha256).map(f => f.path) : [];
  const scenes = sceneDefs(root, plan).map(def => {
    const clips = store.scenes[def.id]?.clips || [], last = clips[clips.length - 1] || null;
    return {...def, clips, status: last ? last.status : 'not-rendered'};
  });
  const blockers = [];
  if (!lock) blockers.push('Chưa chốt ban đầu');
  if (pending) blockers.push('Còn bản vá chờ duyệt');
  if (drift.length) blockers.push('Có thay đổi chưa vào bản vá');
  const notApproved = scenes.filter(s => s.status !== 'approved');
  if (notApproved.length) blockers.push(`Cảnh chưa đạt hoặc chưa có clip: ${notApproved.map(s => s.title).join(', ')}`);
  return {state: !lock ? 'unlocked' : pending ? 'patch-pending' : 'locked', version: lock?.version || 0,
    lockedAt: lock?.at || null, lockedBy: lock?.by || null, items: list, missing: files.filter(f => !f.exists).map(f => f.path),
    drift, pending, patches: [...store.patches].reverse(), scenes, scenesApproved: scenes.length > 0 && !notApproved.length,
    final: {ready: !blockers.length, blockers}};
}

function lock(root, plan, {by, note = ''}) {
  const store = load(root, plan.projectId);
  if (latestLock(store)) throw new Error('Đã chốt ban đầu; thay đổi sau đó đi qua bản vá');
  const files = Object.fromEntries(items(root, plan).flatMap(i => i.files).map(rel => [rel, approvals.sha256(root, rel)]));
  const missing = Object.keys(files).filter(rel => !files[rel]);
  if (missing.length) throw new Error(`Thiếu file, chưa chốt được: ${missing.join(', ')}`);
  for (const [rel, hash] of Object.entries(files)) approvals.snapshot(root, rel, hash);
  const entry = {version: 1, files, by, at: now(), note, fromPatch: null};
  store.locks.push(entry);save(root, plan.projectId, store);
  return entry;
}

function createPatch(root, plan, {reason, by}) {
  const store = load(root, plan.projectId), base = latestLock(store);
  if (!base) throw new Error('Chưa chốt ban đầu: chưa có gì để vá');
  if (typeof reason !== 'string' || !reason.trim()) throw new Error('Cần ghi lý do của bản vá (--reason)');
  const changed = {};
  for (const rel of items(root, plan).flatMap(i => i.files)) {
    const after = approvals.sha256(root, rel), before = base.files[rel] ?? null;
    if (after !== before) {changed[rel] = {before, after};approvals.snapshot(root, rel, after);}
  }
  if (!Object.keys(changed).length) throw new Error('Không có thay đổi nào so với bản chốt v' + base.version);
  // A newer patch replaces one still waiting: the user only ever decides on the latest proposal.
  for (const p of store.patches) if (p.status === 'pending') {p.status = 'superseded';p.decidedAt = now();}
  const patch = {id: `p${store.patches.length + 1}`, baseVersion: base.version, changed, reason: reason.trim(), by, createdAt: now(),
    status: 'pending', decidedAt: null, decidedBy: null, note: ''};
  store.patches.push(patch);save(root, plan.projectId, store);
  return patch;
}

function decidePatch(root, plan, patchId, {decision, note = '', by}) {
  if (!['accepted', 'returned'].includes(decision)) throw new Error('Quyết định phải là chấp nhận hoặc trả lại');
  const store = load(root, plan.projectId), patch = store.patches.find(p => p.id === patchId);
  if (!patch || patch.status !== 'pending') throw new Error('Bản vá này không còn chờ duyệt');
  const base = latestLock(store);
  if (patch.baseVersion !== base.version) throw new Error('Bản chốt đã đổi sau khi tạo bản vá; tạo bản vá mới');
  if (decision === 'accepted') {
    const moved = Object.entries(patch.changed).filter(([rel, c]) => approvals.sha256(root, rel) !== c.after).map(([rel]) => rel);
    if (moved.length) throw Object.assign(new Error(`File đổi sau khi tạo bản vá: ${moved.join(', ')}. Tạo bản vá mới rồi duyệt.`), {status: 409});
    const files = {...base.files};
    for (const [rel, c] of Object.entries(patch.changed)) files[rel] = c.after;
    store.locks.push({version: base.version + 1, files, by, at: now(), note, fromPatch: patch.id});
  }
  Object.assign(patch, {status: decision, decidedAt: now(), decidedBy: by, note});
  save(root, plan.projectId, store);
  return {patch, version: latestLock(store).version};
}

function addClip(root, plan, sceneId, rel) {
  const store = load(root, plan.projectId), lockEntry = latestLock(store);
  if (!sceneDefs(root, plan).some(s => s.id === sceneId)) throw new Error(`Không có cảnh ${sceneId}`);
  const sha256 = approvals.sha256(root, rel);
  if (!sha256) throw new Error(`Không thấy clip ${rel}`);
  const scene = store.scenes[sceneId] ||= {clips: []};
  const clip = {file: rel, sha256, renderedAt: now(), lockVersion: lockEntry?.version || 0, status: 'pending', note: '', decidedAt: null, decidedBy: null};
  scene.clips.push(clip);save(root, plan.projectId, store);
  return clip;
}

function reviewScene(root, plan, sceneId, clipIndex, {decision, note = '', by}) {
  if (!['approved', 'needs-changes'].includes(decision)) throw new Error('Quyết định phải là Đạt hoặc Chưa đạt');
  if (decision === 'needs-changes' && !note.trim()) throw new Error('Ghi chú chỗ chưa đạt để agent biết cần sửa gì');
  const store = load(root, plan.projectId), clips = store.scenes[sceneId]?.clips || [];
  if (clipIndex !== clips.length - 1) throw Object.assign(new Error('Đã có clip mới hơn cho cảnh này; tải lại để xem'), {status: 409});
  const clip = clips[clipIndex];
  if (approvals.sha256(root, clip.file) !== clip.sha256) throw Object.assign(new Error('Clip đã bị thay đổi sau khi xuất; xuất lại rồi duyệt'), {status: 409});
  Object.assign(clip, {status: decision, note: note.trim(), decidedAt: now(), decidedBy: by});
  save(root, plan.projectId, store);
  return clip;
}

module.exports = {items, summary, lock, createPatch, decidePatch, sceneDefs, addClip, reviewScene, load};
