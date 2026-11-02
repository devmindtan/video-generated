// Production review (docs/architecture/review-workflow.md): one initial lock of five items, then patches the
// user reviews one by one. A patch is everything the agent wants the user to look at: changed package files
// (text diffs) and/or results to watch and listen to (scene clips, narration takes); the user marks each item
// Đạt / Chưa đạt with notes and accepts or returns the patch (user 2026-11-02: one place to see results and give
// feedback, no separate per-scene review). Stored next to the old gate history in docs/projects/<slug>/approvals.json
// (schema 2). Only the user locks or decides (manager); agents create patches and record rendered clips.
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
  return {...store, locks: store.locks || [], patches: store.patches || [], scenes: store.scenes || {}, notes: store.notes || {}, lockReturns: store.lockReturns || []};
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
  // Results are reviewed inside patches: the build is ready for the final look once a patch was accepted after the lock.
  const reviewed = store.patches.some(p => p.status === 'accepted');
  if (lock && !reviewed) blockers.push('Chưa có bản vá nào được chấp nhận sau khi chốt');
  // The latest "Chưa đạt" on the initial package, while still unlocked: what was asked and which items changed since.
  const back = !lock ? store.lockReturns.at(-1) || null : null;
  const returned = back && {at: back.at, by: back.by, note: back.note, itemNotes: back.itemNotes,
    revisedItems: list.filter(i => i.files.some(f => (back.files[f.path] ?? null) !== f.sha256)).map(i => i.id)};
  return {state: !lock ? 'unlocked' : pending ? 'patch-pending' : 'locked', version: lock?.version || 0, returned,
    lockedAt: lock?.at || null, lockedBy: lock?.by || null, items: list, missing: files.filter(f => !f.exists).map(f => f.path),
    drift, pending, patches: [...store.patches].reverse(), notes: openNotes(root, plan, store, pending), scenes, scenesApproved: Boolean(lock) && reviewed && !pending && !drift.length,
    final: {ready: !blockers.length, blockers}};
}

// Per-item notes written while reviewing (manager), kept as drafts until the lock or the patch decision takes
// them: store.notes[context][item] with context 'lock' or a pending patch id; item is the item id (lock) or the
// file path (patch). Each note remembers the item's file hashes, so a later edit shows as "changed since".
function noteFiles(root, plan, store, context, item) {
  if (context === 'lock') return items(root, plan).find(i => i.id === item)?.files || null;
  const patch = store.patches.find(p => p.id === context);
  if (!patch) return null;
  const media = /^media:(\d+)$/.exec(item);
  if (media) return patch.media?.[Number(media[1])] ? [patch.media[Number(media[1])].file] : null;
  const change = /^change:(\d+)$/.exec(item);
  if (change) return patch.changes?.[Number(change[1])] ? [] : null;
  return patch.changed[item] ? [item] : null;
}
function setNote(root, plan, {context, item, text, by}) {
  if (typeof text !== 'string' || text.length > 4000) throw new Error('Ghi chú tối đa 4000 ký tự');
  const store = load(root, plan.projectId);
  if (context === 'lock' ? latestLock(store) : store.patches.find(p => p.id === context)?.status !== 'pending')
    throw Object.assign(new Error(context === 'lock' ? 'Đã chốt ban đầu; ghi chú mới đi kèm bản vá' : 'Bản vá này không còn chờ duyệt'), {status: 409});
  const files = noteFiles(root, plan, store, context, item);
  if (!files) throw new Error('Không có mục này để ghi chú');
  const notes = store.notes[context] ||= {};
  if (text.trim()) notes[item] = {text: text.trim(), at: now(), by, files: Object.fromEntries(files.map(rel => [rel, approvals.sha256(root, rel)]))};
  else delete notes[item];
  if (!Object.keys(notes).length) delete store.notes[context];
  store.notes = {...store.notes};save(root, plan.projectId, store);
  return notes[item] || null;
}
const noteView = (root, notes = {}) => Object.fromEntries(Object.entries(notes).map(([item, n]) =>
  [item, {...n, changedSince: Object.entries(n.files || {}).some(([rel, sha]) => approvals.sha256(root, rel) !== sha)}]));
function openNotes(root, plan, store, pending) {
  const out = {};
  if (store.notes.lock) out.lock = noteView(root, store.notes.lock);
  if (pending && store.notes[pending.id]) out[pending.id] = noteView(root, store.notes[pending.id]);
  return out;
}
// Drafts become part of the record they were written for (lock entry or patch decision).
function takeNotes(store, context) {
  const notes = store.notes[context] || {};
  delete store.notes[context];
  return Object.fromEntries(Object.entries(notes).map(([item, n]) => [item, {text: n.text, at: n.at}]));
}

// "Chưa đạt" on the initial package: the user sends it back with notes (overall and/or per item). The files are
// kept as they were, so the next look shows exactly what the agent changed since.
function returnLock(root, plan, {by, note = ''}) {
  const store = load(root, plan.projectId);
  if (latestLock(store)) throw new Error('Đã chốt ban đầu; chỉnh sửa sau đó đi qua bản vá');
  if (!note.trim() && !Object.keys(store.notes.lock || {}).length) throw new Error('Ghi chú chỗ chưa đạt (chung hoặc ở từng mục) để agent biết cần sửa gì');
  const files = Object.fromEntries(items(root, plan).flatMap(i => i.files).map(rel => [rel, approvals.sha256(root, rel)]));
  for (const [rel, hash] of Object.entries(files)) approvals.snapshot(root, rel, hash);
  const entry = {at: now(), by, note: note.trim(), itemNotes: takeNotes(store, 'lock'), files};
  store.lockReturns.push(entry);save(root, plan.projectId, store);
  return entry;
}
function lock(root, plan, {by, note = ''}) {
  const store = load(root, plan.projectId);
  if (latestLock(store)) throw new Error('Đã chốt ban đầu; thay đổi sau đó đi qua bản vá');
  const files = Object.fromEntries(items(root, plan).flatMap(i => i.files).map(rel => [rel, approvals.sha256(root, rel)]));
  const missing = Object.keys(files).filter(rel => !files[rel]);
  if (missing.length) throw new Error(`Thiếu file, chưa chốt được: ${missing.join(', ')}`);
  for (const [rel, hash] of Object.entries(files)) approvals.snapshot(root, rel, hash);
  const entry = {version: 1, files, by, at: now(), note, itemNotes: takeNotes(store, 'lock'), fromPatch: null};
  store.locks.push(entry);save(root, plan.projectId, store);
  return entry;
}

// Results attached to a patch: files the user watches or listens to, only from the project's render folder or public/.
const MEDIA_KIND = rel => /\.(mp4|webm|mov)$/i.test(rel) ? 'video' : /\.(wav|mp3|m4a|ogg|flac)$/i.test(rel) ? 'audio' : null;
function mediaEntry(root, plan, {file, title, scene}) {
  const rel = path.normalize(String(file || '')).replace(/\\/g, '/');
  if (rel.startsWith('..') || path.isAbsolute(rel) || !(rel.startsWith(`projects/${plan.projectId}/`) || rel.startsWith('public/')))
    throw new Error(`File kết quả phải nằm trong projects/${plan.projectId}/ hoặc public/: ${file}`);
  const kind = MEDIA_KIND(rel);
  if (!kind) throw new Error(`Chỉ đính kèm video (mp4/webm/mov) hoặc âm thanh (wav/mp3/m4a/ogg/flac): ${file}`);
  const sha256 = approvals.sha256(root, rel);
  if (!sha256) throw new Error(`Không thấy file ${rel}`);
  return {kind, file: rel, title: String(title || '').trim() || path.basename(rel), sha256, ...(scene ? {scene} : {})};
}
// The latest recorded clip of a scene, as a patch attachment.
function sceneClip(root, plan, sceneId) {
  const def = sceneDefs(root, plan).find(s => s.id === sceneId);
  if (!def) throw new Error(`Không có cảnh ${sceneId}`);
  const clip = load(root, plan.projectId).scenes[sceneId]?.clips?.at(-1);
  if (!clip) throw new Error(`Cảnh ${sceneId} chưa có clip; chạy scene-clip trước`);
  return {file: clip.file, title: `Video cảnh: ${def.title}`, scene: sceneId};
}

// Edits outside the package files (drawings, audio processing, captions, pacing) described in words: what changed,
// where, why, optionally before/after. Each becomes an item the user marks, without exporting a clip for it.
const CHANGE_AREAS = ['visual', 'audio', 'caption', 'timing', 'other'];
function changeEntry(c) {
  const text = (v, max) => {if (v === undefined || v === null) return '';if (typeof v !== 'string' || v.length > max) throw new Error(`Mô tả thay đổi tối đa ${max} ký tự`);return v.trim();};
  const entry = {area: CHANGE_AREAS.includes(c?.area) ? c.area : 'other', where: text(c?.where, 200), what: text(c?.what, 2000), why: text(c?.why, 2000), before: text(c?.before, 2000), after: text(c?.after, 2000)};
  if (!entry.what) throw new Error('Mỗi thay đổi cần ghi đã sửa gì (what)');
  return Object.fromEntries(Object.entries(entry).filter(([, v]) => v));
}

function createPatch(root, plan, {reason, by, media = [], changes = [], requests = [], requestedBy = 'người dùng'}) {
  const store = load(root, plan.projectId), base = latestLock(store);
  if (!base) throw new Error('Chưa chốt ban đầu: chưa có gì để vá');
  if (typeof reason !== 'string' || !reason.trim()) throw new Error('Cần ghi lý do của bản vá (--reason)');
  const changed = {};
  for (const rel of items(root, plan).flatMap(i => i.files)) {
    const after = approvals.sha256(root, rel), before = base.files[rel] ?? null;
    if (after !== before) {changed[rel] = {before, after};approvals.snapshot(root, rel, after);}
  }
  const attached = media.map(m => mediaEntry(root, plan, m)).filter((m, i, all) => all.findIndex(x => x.file === m.file) === i);
  const described = (Array.isArray(changes) ? changes : []).map(changeEntry);
  if (!Object.keys(changed).length && !attached.length && !described.length) throw new Error('Không có thay đổi nào so với bản chốt v' + base.version + ', không có mô tả thay đổi hay video/âm thanh nào để xem');
  // Change requests the user made in chat instead of in the manager (user 2026-11-02): the waiting patch is recorded
  // as returned with those words (never accepted), and the new patch lists them as handled.
  const asked = (Array.isArray(requests) ? requests : []).map(r => String(r).trim()).filter(Boolean);
  if (asked.some(r => r.length > 2000)) throw new Error('Mỗi yêu cầu tối đa 2000 ký tự');
  // A newer patch replaces one still waiting: the user only ever decides on the latest proposal.
  // Notes on the replaced proposal carry over: they are about the same files.
  for (const p of store.patches) if (p.status === 'pending') {
    if (asked.length) Object.assign(p, {status: 'returned', decidedAt: now(), decidedBy: `${requestedBy} (góp ý qua chat)`, via: 'chat', note: asked.join(' · '), itemNotes: takeNotes(store, p.id)});
    else {p.status = 'superseded';p.decidedAt = now();if (store.notes[p.id]) store.notes[`p${store.patches.length + 1}`] = store.notes[p.id];delete store.notes[p.id];}
  }
  const patch = {id: `p${store.patches.length + 1}`, baseVersion: base.version, changed, changes: described, media: attached, ...(asked.length ? {requests: asked.map(text => ({text, via: 'chat'}))} : {}), reason: reason.trim(), by, createdAt: now(),
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
    const moved = [...Object.entries(patch.changed).filter(([rel, c]) => approvals.sha256(root, rel) !== c.after).map(([rel]) => rel),
      ...(patch.media || []).filter(m => approvals.sha256(root, m.file) !== m.sha256).map(m => m.file)];
    if (moved.length) throw Object.assign(new Error(`File đổi sau khi tạo bản vá: ${moved.join(', ')}. Tạo bản vá mới rồi duyệt.`), {status: 409});
    // Only package edits make a new lock version; a patch of results alone (clips, takes) leaves the lock as it is.
    if (Object.keys(patch.changed).length) {
      const files = {...base.files};
      for (const [rel, c] of Object.entries(patch.changed)) files[rel] = c.after;
      store.locks.push({version: base.version + 1, files, by, at: now(), note, fromPatch: patch.id});
    }
  }
  const itemNotes = takeNotes(store, patch.id);
  // Scene clips in the patch take the decision (and the note written on that clip), for the scene's history.
  for (const [i, m] of (patch.media || []).entries()) {
    const clip = m.scene && store.scenes[m.scene]?.clips?.find(c => c.file === m.file);
    if (clip) Object.assign(clip, {status: decision === 'accepted' ? 'approved' : itemNotes[`media:${i}`] ? 'needs-changes' : clip.status,
      note: itemNotes[`media:${i}`]?.text || '', decidedAt: now(), decidedBy: by, patch: patch.id});
  }
  Object.assign(patch, {status: decision, decidedAt: now(), decidedBy: by, note, itemNotes});
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

module.exports = {returnLock, items, summary, lock, createPatch, decidePatch, sceneDefs, sceneClip, addClip, reviewScene, setNote, load};
