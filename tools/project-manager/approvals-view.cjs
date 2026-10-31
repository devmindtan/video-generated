// Production review in the manager (docs/architecture/review-workflow.md): the initial lock of five items,
// patches the user accepts or returns, per-scene clips with notes, and the final hash-bound review-preview gate.
// Every write needs the user's click (token + explicit confirm + the revision they reviewed). Never called by
// workers, never --allow-missing, never export or render.
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const cli = require('../production-automation/cli.cjs');
const approvals = require('../production-automation/approvals.cjs');
const review = require('../production-automation/review.cjs');
const progress = require('../production-automation/progress.cjs');
const runner = require('../production-automation/runner.cjs');
const {load} = require('../../scripts/catalog/catalog.cjs');

const FILE_NAMES = {'script.md': 'Kịch bản', 'brief.md': 'Brief: mục tiêu, dàn ý, quyết định sản xuất', 'sources.md': 'Nguồn và trích dẫn', 'script-review.md': 'Phản biện kịch bản',
  'production-spec.md': 'Thông tin đã chốt', 'music.json': 'Nhạc nền', 'outro-music.json': 'Nhạc outro', 'voice.json': 'Giọng đọc đã chọn', 'image-prompts.md': 'Prompt hình ảnh', 'voice-audition.md': 'Nghe thử giọng', 'audition.json': 'Lời đọc nghe thử', 'qa.json': 'Kiểm tra QA', 'description.md': 'Mô tả đăng bài'};
const TEXT = /\.(md|json|txt|srt|tsx?|cjs|js)$/i;

// Line diff (LCS) with word-level marks for replaced lines. Small documents only (a few thousand lines).
function lcs(a, b, eq = (x, y) => x === y) {
  const n = a.length, m = b.length, w = m + 1, t = new Uint16Array((n + 1) * w);
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) t[i * w + j] = eq(a[i], b[j]) ? t[(i + 1) * w + j + 1] + 1 : Math.max(t[(i + 1) * w + j], t[i * w + j + 1]);
  const ops = [];let i = 0, j = 0;
  while (i < n && j < m) {if (eq(a[i], b[j])) {ops.push(['=', a[i], b[j]]);i++;j++;} else if (t[(i + 1) * w + j] >= t[i * w + j + 1]) ops.push(['-', a[i++]]);else ops.push(['+', b[j++]]);}
  while (i < n) ops.push(['-', a[i++]]);while (j < m) ops.push(['+', b[j++]]);
  return ops;
}
function words(oldLine, newLine) {
  const split = t => t.match(/\s+|[^\s]+/g) || [];
  const ops = lcs(split(oldLine), split(newLine)), del = [], add = [];
  for (const [op, x] of ops) {if (op !== '+') del.push([op === '-' ? 1 : 0, x]);if (op !== '-') add.push([op === '+' ? 1 : 0, x]);}
  // A space between two changed words counts as changed, so a rewritten phrase is one highlight.
  const bridge = parts => parts.map((p, i) => p[0] === 0 && /^\s+$/.test(p[1]) && parts[i - 1]?.[0] === 1 && parts[i + 1]?.[0] === 1 ? [1, p[1]] : p);
  const merge = parts => bridge(parts).reduce((out, [c, x]) => {const last = out[out.length - 1];if (last && last[0] === c) last[1] += x;else out.push([c, x]);return out;}, []);
  return {del: merge(del), add: merge(add)};
}
function diff(oldText, newText) {
  const a = oldText.split('\n'), b = newText.split('\n');
  if (a.length * b.length > 4e6) return {tooLarge: true, added: null, removed: null, rows: []};
  const ops = lcs(a, b), rows = [];let oldNo = 0, newNo = 0, added = 0, removed = 0;
  for (let k = 0; k < ops.length; k++) {
    const [op, x] = ops[k];
    if (op === '=') {oldNo++;newNo++;rows.push({t: ' ', o: oldNo, n: newNo, text: x});continue;}
    // Pair a run of removed lines with the following added lines for word-level highlights.
    const dels = [], adds = [];
    while (k < ops.length && ops[k][0] === '-') dels.push(ops[k++][1]);
    while (k < ops.length && ops[k][0] === '+') adds.push(ops[k++][1]);
    k--;
    dels.forEach((line, d) => {oldNo++;removed++;const pair = adds[d];rows.push({t: '-', o: oldNo, text: line, parts: pair !== undefined && line.trim() && pair.trim() ? words(line, pair).del : null});});
    adds.forEach((line, d) => {newNo++;added++;const pair = dels[d];rows.push({t: '+', n: newNo, text: line, parts: pair !== undefined && line.trim() && pair.trim() ? words(pair, line).add : null});});
  }
  return {added, removed, rows};
}

const NAMES = {'approve-script': 'Duyệt kịch bản', 'approve-voice': 'Duyệt giọng đọc', 'approve-assets': 'Duyệt hình ảnh', 'review-preview': 'Xem bản dựng', 'initial-lock': 'Chốt ban đầu', 'scene-review': 'Duyệt từng cảnh'};
const AUDIO = /\.(wav|mp3|m4a|ogg|flac)$/i;

function createApprovals(root) {
  function view(id) {
    let plan;try {plan = cli.plan(root, id);} catch (e) {return {available: false, reason: e.message, gates: []};}
    const store = approvals.load(root, id);
    const gates = plan.stages.filter(s => s.kind === 'human-approval' && s.id !== 'export').map(stage => {
      const g = approvals.gateState(root, plan, stage.id);
      const files = stage.bindsArtifacts.map(rel => ({path: rel, sha256: approvals.sha256(root, rel)}));
      return {id: stage.id, title: NAMES[stage.id] || stage.title || stage.id, guide: stage.guide || '', state: g.state, changed: g.changed || [],
        approvedAt: g.entry?.approvedAt || null, approvedBy: g.entry?.approvedBy || null, note: g.entry?.note || '',
        files: files.map(f => ({path: f.path, exists: Boolean(f.sha256)})),
        // What the user reviewed: the files' current hashes and the last decision. A save must match it.
        revision: crypto.createHash('sha256').update(JSON.stringify([files, g.entry?.approvedAt || null])).digest('hex')};
    });
    // Earlier gates that must be approved first (same rule approvals.approve enforces).
    for (const gate of gates) {
      const stage = plan.stages.find(s => s.id === gate.id);
      gate.blockedBy = plan.stages.filter(s => s.kind === 'human-approval' && s.invalidates.includes(stage.id))
        .map(s => gates.find(x => x.id === s.id)).filter(g => g && g.state !== 'approved').map(g => g.title);
      gate.missing = gate.files.filter(f => !f.exists).map(f => f.path);
      // Which production step creates each missing file, so the page can say what is still to do.
      gate.missingInfo = gate.missing.map(rel => ({path: rel, name: FILE_NAMES[path.basename(rel)] || path.basename(rel),
        by: plan.stages.find(s => s.outputs.includes(rel))?.title || ''}));
      gate.changedNames = gate.changed.map(rel => FILE_NAMES[path.basename(rel)] || path.basename(rel));
    }
    return {available: true, gates, history: store.history.slice(-8).reverse().map(e => ({gate: NAMES[e.stageId] || e.stageId, decision: e.decision, at: e.approvedAt, by: e.approvedBy, note: e.note || ''}))};
  }
  function approveGate({id, gate, note, revision, confirm}) {
    if (confirm !== true) throw new Error('Cần xác nhận đã xem các file trước khi duyệt');
    if (typeof note !== 'string' || note.length > 1000) throw new Error('Ghi chú tối đa 1000 ký tự');
    const current = view(id), g = current.gates.find(x => x.id === gate);
    if (!g) throw new Error('Không có bước duyệt này');
    if (g.revision !== revision) throw Object.assign(new Error('File vừa thay đổi sau khi bạn mở. Tải lại để xem bản mới rồi duyệt.'), {status: 409});
    if (g.missing.length) throw new Error(`Thiếu file: ${g.missing.join(', ')}. Tạo đủ rồi mới duyệt.`);
    let by = 'unknown';try {by = execFileSync('git', ['-C', root, 'config', 'user.name'], {encoding: 'utf8'}).trim() || by;} catch {}
    const entry = approvals.approve(root, cli.plan(root, id), gate, {note: note.trim(), by: `${by} (trang quản lý)`});
    return {gate, approvedAt: entry.approvedAt, approvedBy: entry.approvedBy};
  }
  // What the user is asked to approve: per bound file, the change since the last approval of this gate
  // (or the whole current text when it was never approved / no copy of the approved version exists).
  // What to listen to / look at for media gates: the project's published voice segments or its images.
  function media(id, gate) {
    const project = cli.plan(root, id).paths.assets;
    if (gate === 'approve-voice') {
      let meta = [];try {meta = JSON.parse(fs.readFileSync(path.join(root, project, 'audio/voice-metadata.json'), 'utf8'));} catch {}
      return {voices: (Array.isArray(meta) ? meta : []).filter(m => typeof m.file === 'string' && fs.existsSync(path.join(root, project, 'audio', m.file)))
        .map(m => ({name: m.scene || m.file, file: m.file, durationSeconds: m.durationSeconds ?? null, voice: m.voice || ''}))};
    }
    if (gate === 'approve-assets') {
      // Pictures may be image files or drawings in code: list both, compositions open in Studio.
      const dir = path.join(root, project, 'images');
      const entry = load(root).series.flatMap(s => s.projects).find(p => p.id === id);
      return {images: fs.existsSync(dir) ? fs.readdirSync(dir).filter(n => /\.(png|jpe?g|webp)$/i.test(n) && !/^film-grain\./.test(n)).sort() : [],
        compositions: (entry?.registrations || []).map(r => r.id)};
    }
    return {};
  }
  // Stream a listed voice segment or image of a project's assets folder only.
  function projectMedia(id, kind, file) {
    let m;try {m = media(id, kind === 'voice' ? 'approve-voice' : 'approve-assets');} catch {return null;}
    const ok = kind === 'voice' ? (m.voices || []).some(v => v.file === file) : (m.images || []).includes(file);
    return ok ? path.join(root, cli.plan(root, id).paths.assets, kind === 'voice' ? 'audio' : 'images', file) : null;
  }
  function gateReview(id, gate) {
    const v = view(id), g = v.gates.find(x => x.id === gate);if (!g) throw new Error('Không có bước duyệt này');
    const plan = cli.plan(root, id), entry = approvals.gateState(root, plan, gate).entry;
    // Documents an earlier, still-approved gate already covers are not shown again in full.
    const earlier = new Map(), inherited = new Set();
    for (const s of plan.stages.filter(s => s.kind === 'human-approval' && s.invalidates.includes(gate))) {
      s.bindsArtifacts.forEach(rel => inherited.add(rel));
      const st = approvals.gateState(root, plan, s.id);
      if (st.state === 'approved') for (const [rel, hash] of Object.entries(st.entry.artifactSha256)) earlier.set(rel, {hash, gate: NAMES[s.id] || s.id});
    }
    const files = g.files.map(f => {
      const name = FILE_NAMES[path.basename(f.path)] || path.basename(f.path), base = {path: f.path, name, own: !inherited.has(f.path)};
      if (!f.exists) return {...base, status: 'missing'};
      const prior = earlier.get(f.path);
      if (prior && prior.hash === approvals.sha256(root, f.path)) return {...base, status: 'earlier', earlierGate: prior.gate};
      const current = fs.readFileSync(path.join(root, f.path));
      if (!TEXT.test(f.path)) return {...base, status: entry?.artifactSha256?.[f.path] === approvals.sha256(root, f.path) ? 'unchanged' : 'binary'};
      const text = current.toString('utf8');
      const oldHash = entry && entry.decision === 'approved' ? entry.artifactSha256[f.path] : undefined;
      if (oldHash === undefined || oldHash === null) return {...base, status: 'new', text: text.slice(0, 300000)};
      if (oldHash === approvals.sha256(root, f.path)) return {...base, status: 'unchanged'};
      const old = approvals.approvedContent(root, oldHash);
      if (!old) return {...base, status: 'no-baseline', text: text.slice(0, 300000)};
      return {...base, status: 'changed', ...diff(old.toString('utf8'), text)};
    });
    // Changed files first, then first-time and missing ones, unchanged last.
    const order = {changed: 0, 'no-baseline': 1, new: 1, binary: 1, missing: 2, unchanged: 3, earlier: 4};
    files.sort((x, y) => Number(y.own) - Number(x.own));
    files.sort((x, y) => order[x.status] - order[y.status]);
    return {gate: g, media: media(id, gate), previous: entry && entry.decision === 'approved' ? {at: entry.approvedAt, by: entry.approvedBy, note: entry.note || ''} : null, files};
  }
  const userName = () => {let by = 'unknown';try {by = execFileSync('git', ['-C', root, 'config', 'user.name'], {encoding: 'utf8'}).trim() || by;} catch {}return `${by} (trang quản lý)`;};
  const nameOf = rel => FILE_NAMES[path.basename(rel)] || path.basename(rel);
  // What to listen to inside an item: the music track(s) and the voice sample, files under public/ only.
  function audioOf(id, item) {
    const plan = cli.plan(root, id), out = [];
    const add = (name, rel) => {if (typeof rel === 'string' && AUDIO.test(rel) && !rel.includes('..') && fs.existsSync(path.join(root, 'public', rel))) out.push({name, key: rel, kind: item.id});};
    for (const f of item.files) {
      let data;try {data = JSON.parse(fs.readFileSync(path.join(root, f.path || f), 'utf8'));} catch {continue;}
      if (item.id === 'music') add(`${data.credit?.title || path.basename(data.file || '')}${data.credit?.artists ? ' — ' + data.credit.artists.join(', ') : ''} (${nameOf(f.path || f)})`, data.file);
      if (item.id === 'voice') add(`Đoạn mẫu: ${data.name || data.voice || ''}`, data.sample || Object.values(data.segments || {})[0]?.file);
    }
    return out;
  }
  function reviewView(id) {
    let plan;try {plan = cli.plan(root, id);} catch (e) {return {available: false, reason: e.message};}
    const r = review.summary(root, plan), preview = view(id).gates.find(g => g.id === 'review-preview') || null;
    const revision = crypto.createHash('sha256').update(JSON.stringify([r.items.map(i => i.files.map(f => f.sha256)), r.version, r.pending?.id || null])).digest('hex');
    return {available: true, state: r.state, version: r.version, lockedAt: r.lockedAt, lockedBy: r.lockedBy, revision,
      items: r.items.map(i => ({id: i.id, title: i.title, guide: i.guide, files: i.files.map(f => ({path: f.path, name: nameOf(f.path), exists: f.exists, changed: f.changed}))})),
      missing: r.missing.map(rel => ({path: rel, name: nameOf(rel)})), drift: r.drift.map(rel => ({path: rel, name: nameOf(rel)})),
      pending: r.pending && {id: r.pending.id, reason: r.pending.reason, createdAt: r.pending.createdAt, files: Object.keys(r.pending.changed).map(nameOf)},
      patches: r.patches.map(p => ({id: p.id, reason: p.reason, status: p.status, createdAt: p.createdAt, decidedAt: p.decidedAt, note: p.note, files: Object.keys(p.changed).map(nameOf)})),
      scenes: r.scenes.map(s => ({id: s.id, title: s.title, status: s.status, clips: s.clips.map((c, i) => ({index: i, renderedAt: c.renderedAt, lockVersion: c.lockVersion, status: c.status, note: c.note, decidedAt: c.decidedAt}))})),
      final: r.final, preview};
  }
  // Lock: every item in full (text, music and voice sample). Patch: per changed file, the diff against the lock.
  function reviewDetail(id, mode, patchId) {
    const plan = cli.plan(root, id), r = review.summary(root, plan), v = reviewView(id);
    const text = rel => fs.readFileSync(path.join(root, rel), 'utf8').slice(0, 300000);
    if (mode === 'lock') {
      const lockFiles = review.load(root, id).locks.at(-1)?.files || {};
      return {mode, revision: v.revision, state: r.state, items: r.items.map(i => ({key: i.id, title: i.title, guide: i.guide, audio: audioOf(id, i),
        files: i.files.map(f => {
          if (!f.exists) return {path: f.path, name: nameOf(f.path), status: 'missing'};
          if (!TEXT.test(f.path)) return {path: f.path, name: nameOf(f.path), status: 'binary'};
          const locked = lockFiles[f.path] && lockFiles[f.path] !== f.sha256 ? approvals.approvedContent(root, lockFiles[f.path]) : null;
          return locked ? {path: f.path, name: nameOf(f.path), status: 'changed', ...diff(locked.toString('utf8'), text(f.path))} : {path: f.path, name: nameOf(f.path), status: 'text', text: text(f.path)};
        })}))};
    }
    const patch = review.load(root, id).patches.find(p => p.id === patchId);
    if (!patch) throw new Error('Không có bản vá này');
    const itemOf = rel => r.items.find(i => i.files.some(f => f.path === rel));
    return {mode: 'patch', revision: v.revision, patch: {id: patch.id, reason: patch.reason, status: patch.status, createdAt: patch.createdAt, baseVersion: patch.baseVersion, note: patch.note},
      items: Object.entries(patch.changed).map(([rel, c], k) => {
        const item = itemOf(rel), before = approvals.approvedContent(root, c.before), after = approvals.approvedContent(root, c.after);
        const file = {path: rel, name: nameOf(rel)};
        if (!c.after) Object.assign(file, {status: 'missing'});
        else if (!TEXT.test(rel) || !after) Object.assign(file, {status: 'binary'});
        else if (!before) Object.assign(file, {status: 'text', text: after.toString('utf8').slice(0, 300000)});
        else Object.assign(file, {status: 'changed', ...diff(before.toString('utf8'), after.toString('utf8'))});
        return {key: 'p' + k, title: !item || nameOf(rel) === item.title ? nameOf(rel) : `${item.title}: ${nameOf(rel)}`, guide: item?.guide || '', audio: item ? audioOf(id, {id: item.id, files: [rel]}) : [], files: [file]};
      })};
  }
  function checked(id, revision) {
    const v = reviewView(id);
    if (!v.available) throw new Error(v.reason);
    if (v.revision !== revision) throw Object.assign(new Error('Nội dung vừa thay đổi sau khi bạn mở. Tải lại để xem bản mới.'), {status: 409});
    return v;
  }
  function lockProject({id, note = '', revision, confirm}) {
    if (confirm !== true) throw new Error('Cần xác nhận đã xem hết các mục trước khi chốt');
    if (typeof note !== 'string' || note.length > 1000) throw new Error('Ghi chú tối đa 1000 ký tự');
    checked(id, revision);
    return review.lock(root, cli.plan(root, id), {by: userName(), note: note.trim()});
  }
  function decidePatch({id, patch, decision, note = '', revision}) {
    if (typeof note !== 'string' || note.length > 2000) throw new Error('Ghi chú tối đa 2000 ký tự');
    if (decision === 'returned' && !note.trim()) throw new Error('Ghi chú lý do trả lại để agent biết cần sửa gì');
    checked(id, revision);
    return review.decidePatch(root, cli.plan(root, id), patch, {decision, note: note.trim(), by: userName()});
  }
  function reviewScene({id, scene, clip, decision, note = ''}) {
    if (typeof note !== 'string' || note.length > 4000) throw new Error('Ghi chú tối đa 4000 ký tự');
    return review.reviewScene(root, cli.plan(root, id), scene, clip, {decision, note, by: userName()});
  }
  // Streams only what the review lists: an item's audio under public/, or a recorded scene clip.
  function reviewMedia(id, kind, key) {
    const plan = cli.plan(root, id);
    if (kind === 'clip') {
      const [scene, index] = String(key).split(':'), clip = review.load(root, id).scenes[scene]?.clips?.[Number(index)];
      return clip && clip.file.startsWith(`projects/${id}/review/`) && !clip.file.includes('..') ? path.join(root, clip.file) : null;
    }
    const item = review.items(root, plan).find(i => i.id === kind);
    return item && audioOf(id, item).some(a => a.key === key) ? path.join(root, 'public', key) : null;
  }
  // Read-only: what the agent planned after the lock and is doing now, plus local model runs of this project.
  function progressView(id) {
    let plan;try {plan = cli.plan(root, id);} catch (e) {return {available: false, reason: e.message};}
    const p = progress.view(root, id), r = review.summary(root, plan);
    const runs = runner.list(root, id).slice(-10).reverse().map(x => ({runId: x.runId, stage: plan.stages.find(s => s.id === x.stageId)?.title || x.stageId, status: x.status, createdAt: x.createdAt}));
    return {available: true, locked: r.version > 0, lockVersion: r.version, ...p, runs};
  }
  function progressSummary(id) {
    try {const p = progress.view(root, id);return p.plan ? {overall: p.overall, running: p.counts.running, interrupted: p.counts.interrupted, failed: p.counts.failed, total: p.counts.total, done: p.counts.done} : null;}
    catch {return null;}
  }
  return {approvalsView: view, approveGate, gateReview, projectMedia, reviewView, reviewDetail, lockProject, decidePatch, reviewScene, reviewMedia, progressView, progressSummary};
}
module.exports = {createApprovals};
