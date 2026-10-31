// Human-gated draft runs: copy only a stage's readable files into a disposable Git staging
// repo, run the hardened local runtime there, keep the patch until the user applies it.
const fs = require('node:fs');
const path = require('node:path');
const {spawn, execFileSync} = require('node:child_process');
const policy = require('./policy.json');
const approvals = require('./approvals.cjs');
const seriesNotes = require('./series-notes.cjs');
const R = policy.runner;
const helpers = () => require('./cli.cjs'); // lazy: cli.cjs also requires this module

const runsDir = root => path.join(root, R.runDirectory);
const runDir = (root, runId) => {
  if (!/^[a-z0-9-]+--[a-z0-9-]+--\d{8}-\d{6}$/.test(runId)) throw new Error(`Invalid run id: ${runId}`);
  return path.join(runsDir(root), runId);
};
const alive = pid => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
// A run left "running" by a killed parent is reported as interrupted instead of hanging forever.
function readRun(root, runId) {
  const run = JSON.parse(fs.readFileSync(path.join(runDir(root, runId), 'run.json'), 'utf8'));
  if (run.status === 'running' && !(run.pid && alive(run.pid))) {
    Object.assign(run, {status: 'interrupted', finishedAt: run.finishedAt || new Date().toISOString()});
    writeRun(root, run);
  }
  return run;
}
const writeRun = (root, run) => fs.writeFileSync(path.join(runDir(root, run.runId), 'run.json'), JSON.stringify(run, null, 2) + '\n');
const stamp = now => now.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);

function runtimeCheck(root) {
  const dir = path.resolve(root, R.runtime);
  const missing = R.requiredRuntimeFeatures.filter(({file, pattern}) => {
    try { return !fs.readFileSync(path.join(dir, file), 'utf8').includes(pattern); } catch { return true; }
  }).map(f => f.file);
  let commit = null, branch = null, dirty = null;
  try {
    const git = (...a) => execFileSync('git', ['-C', dir, ...a], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']}).trim();
    commit = git('rev-parse', 'HEAD'); branch = git('branch', '--show-current'); dirty = git('status', '--porcelain') !== '';
  } catch {}
  return {dir, commit, branch, dirty, python: fs.existsSync(path.join(root, R.python)), missingFeatures: missing,
    ready: !missing.length && fs.existsSync(path.join(root, R.python))};
}

// Expand a scope pattern to readable repository files, skipping denied and non-text files.
function expand(root, pattern) {
  const {denied} = helpers();
  const star = pattern.indexOf('*');
  const base = star < 0 ? pattern : pattern.slice(0, pattern.lastIndexOf('/', star) + 1).replace(/\/$/, '');
  const full = path.join(root, base);
  let st; try { st = fs.lstatSync(full); } catch { return []; }
  const files = st.isFile() ? [base] : st.isDirectory()
    ? fs.readdirSync(full, {recursive: true, withFileTypes: true}).filter(e => e.isFile())
      .map(e => path.relative(root, path.join(e.parentPath ?? e.path, e.name)).split(path.sep).join('/')) : [];
  const re = star < 0 ? null : globRegex(pattern);
  return files.filter(rel => (!re || re.test(rel)) && !denied(rel));
}
function globRegex(g) {
  return new RegExp('^' + g.split(/(\*\*\/|\/\*\*|\*)/).map(t => t === '**/' ? '(?:.*/)?' : t === '/**' ? '(?:/.*)?' :
    t === '*' ? '[^/]*' : t.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('') + '$');
}
function isText(buffer) {
  return !buffer.includes(0) && Buffer.from(buffer.toString('utf8'), 'utf8').equals(buffer);
}

function gatesBefore(plan, stageId) {
  return plan.stages.filter(s => s.kind === 'human-approval' && s.invalidates.includes(stageId));
}

function prepare(root, id, stageId, {revise = false, now = new Date(), skipRuntimeCheck = false} = {}) {
  const plan = helpers().plan(root, id);
  const stage = plan.stages.find(s => s.id === stageId);
  if (!stage) throw new Error(`Unknown stage ${stageId}. Stages: ${plan.stages.map(s => s.id).join(', ')}`);
  if (R.blockedStages[stageId]) throw new Error(`Stage ${stageId} is not automated: ${R.blockedStages[stageId]}`);
  if (!R.runnableStages.includes(stageId) || stage.kind !== 'draft-task') throw new Error(`Stage ${stageId} is a ${stage.kind}, not an automated draft`);
  const notApproved = gatesBefore(plan, stageId).map(g => approvals.gateState(root, plan, g.id)).filter(g => g.state !== 'approved');
  if (notApproved.length) throw new Error(`Approve first: ${notApproved.map(g => `${g.stageId} (${g.state})`).join(', ')}\n` +
    `  npm run automation -- approve ${id} <gate>`);
  const existing = stage.outputs.filter(rel => approvals.sha256(root, rel));
  if (existing.length && !revise) throw new Error(`Output already exists: ${existing.join(', ')}. Pass --revise to draft a reviewable change.`);
  const runtime = runtimeCheck(root);
  if (!skipRuntimeCheck && !runtime.ready) throw new Error(`Hardened runtime not ready at ${runtime.dir}: missing ${runtime.missingFeatures.join(', ') || R.python}`);

  const runId = `${id}--${stageId}--${stamp(now)}`, dir = runDir(root, runId), staging = path.join(dir, 'staging');
  if (fs.existsSync(dir)) throw new Error(`Run already exists: ${runId}`);
  const files = [...new Set([...stage.readScope, ...stage.outputs].flatMap(p => expand(root, p)))].sort();
  const {maxFiles, maxBytes, maxFileBytes} = R.stagingLimits;
  let total = 0; const copied = {}, skipped = [];
  for (const rel of files) {
    const buffer = fs.readFileSync(path.join(root, rel));
    if (buffer.length > maxFileBytes || !isText(buffer)) { skipped.push(rel); continue; }
    total += buffer.length;
    if (Object.keys(copied).length >= maxFiles || total > maxBytes) throw new Error(`Stage ${stageId} read scope exceeds staging limits`);
    fs.mkdirSync(path.dirname(path.join(staging, rel)), {recursive: true});
    fs.writeFileSync(path.join(staging, rel), buffer);
    copied[rel] = approvals.sha256(root, rel);
  }
  const rules = [...R.contextRules.common, ...(R.contextRules[plan.profile] || [])];
  // The user's series notes for this stage come after the fixed rules; they add guidance, never permissions.
  const userNotes = seriesNotes.contextFor(plan.seriesNotes, stageId);
  fs.writeFileSync(path.join(staging, 'project_context.md'),
    `# Quy tắc cho tác vụ ${stageId} (${id})\n\n${rules.map(r => `- ${r}`).join('\n')}\n\n` +
    (userNotes ? `${userNotes}\n\n` : '') +
    `Tác vụ: ${R.stageInstructions[stageId]}\nChỉ được ghi: ${stage.writeScope.join(', ')}\n`);
  const git = (...a) => execFileSync('git', ['-C', staging, ...a], {stdio: 'ignore'});
  git('init', '-q'); git('add', '-A');
  git('-c', 'user.name=automation', '-c', 'user.email=automation@localhost', 'commit', '-qm', `staging ${runId}`);

  const task = {id: stageId, kind: 'implement', profile: 'writer',
    description: `${R.stageInstructions[stageId]} Dự án: ${id} (${plan.series}). ${stage.deliverable}`,
    read_scope: [...stage.readScope, ...stage.outputs, 'project_context.md'], write_scope: stage.writeScope,
    acceptance_criteria: [`Tạo hoặc cập nhật ${stage.writeScope.join(', ')} bằng tiếng Việt theo project_context.md`,
      'Không sửa file nào khác', 'Không bịa nguồn, trích dẫn hay phê duyệt',
      ...(userNotes ? ['Tuân thủ quy tắc bổ sung và ghi chú của series trong project_context.md'] : [])]};
  fs.writeFileSync(path.join(dir, 'plan.json'), JSON.stringify({tasks: [task]}, null, 2));
  const settings = JSON.parse(JSON.stringify(R.settings));
  settings.system.runtime_directory = path.join(dir, 'runtime');
  settings.system.artifact_directory = path.join(dir, 'artifacts');
  settings.system.database_path = path.join(dir, 'events.db');
  fs.writeFileSync(path.join(dir, 'settings.json'), JSON.stringify(settings, null, 2));
  fs.writeFileSync(path.join(dir, 'tools.json'), JSON.stringify(R.tools, null, 2));
  const run = {runId, projectId: id, stageId, status: 'prepared', createdAt: now.toISOString(),
    runtime: {dir: runtime.dir, commit: runtime.commit, branch: runtime.branch, dirty: runtime.dirty},
    model: settings.models.executor.model_name, writeScope: stage.writeScope,
    targets: Object.fromEntries(stage.writeScope.map(rel => [rel, approvals.sha256(root, rel)])),
    inputs: copied, skipped, seriesNotes: {file: plan.seriesNotes.file, revision: plan.seriesNotes.revision, applied: Boolean(userNotes)}};
  writeRun(root, run);
  return run;
}

function execute(root, runId, {verbose = true, out = process.stdout} = {}) {
  const run = readRun(root, runId), dir = runDir(root, runId);
  if (run.status !== 'prepared') throw new Error(`Run ${runId} is ${run.status}; prepare a new run instead`);
  const runtime = runtimeCheck(root);
  if (!runtime.ready) throw new Error(`Hardened runtime not ready: ${runtime.missingFeatures.join(', ')}`);
  const args = [path.join(runtime.dir, 'main.py'), '--project-dir', path.join(dir, 'staging'),
    '--task', `${run.stageId} for ${run.projectId}`, '--plan-file', path.join(dir, 'plan.json'),
    '--settings', path.join(dir, 'settings.json'), '--tools-config', path.join(dir, 'tools.json'),
    '--event-db', path.join(dir, 'events.db'), '--run-id', runId, ...(verbose ? ['--verbose'] : [])];
  // Minimal environment: no API keys or cloud credentials reach the model loop.
  const env = {PATH: process.env.PATH, HOME: process.env.HOME, LANG: 'C.UTF-8', PYTHONUNBUFFERED: '1',
    LITELLM_LOCAL_MODEL_COST_MAP: 'True', NO_PROXY: '127.0.0.1,localhost'};
  const log = fs.createWriteStream(path.join(dir, 'log.txt'));
  return new Promise(resolve => {
    const child = spawn(path.resolve(root, R.python), args, {cwd: runtime.dir, env, stdio: ['ignore', 'pipe', 'pipe']});
    Object.assign(run, {status: 'running', startedAt: new Date().toISOString(), pid: child.pid,
      maxMinutes: R.maxRunMinutes});
    writeRun(root, run);
    let stopReason = null;
    const stop = reason => () => { stopReason = reason; child.kill('SIGTERM'); setTimeout(() => child.kill('SIGKILL'), 10000).unref(); };
    const onSignal = stop('interrupted');
    process.once('SIGINT', onSignal); process.once('SIGTERM', onSignal);
    const timer = setTimeout(stop('timed-out'), R.maxRunMinutes * 60000);
    for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => { log.write(chunk); out.write(chunk); });
    child.on('close', code => {
      clearTimeout(timer); process.off('SIGINT', onSignal); process.off('SIGTERM', onSignal);
      log.end();
      const types = events(root, runId).map(e => e.type);
      run.status = stopReason || (types.includes('run.awaiting_approval') ? 'awaiting-approval'
        : types.includes('run.completed') ? 'completed-no-changes' : 'failed');
      run.exitCode = code; run.finishedAt = new Date().toISOString();
      const patch = path.join(dir, 'artifacts', `${runId}.patch`);
      if (fs.existsSync(patch)) run.patch = path.relative(root, patch);
      writeRun(root, run);
      resolve(run);
    });
  });
}

function events(root, runId) {
  const db = path.join(runDir(root, runId), 'events.db');
  if (!fs.existsSync(db)) return [];
  const {DatabaseSync} = require('node:sqlite');
  const connection = new DatabaseSync(db, {readOnly: true});
  try {
    return connection.prepare('SELECT sequence, timestamp, type, source, data FROM events WHERE run_id = ? ORDER BY sequence')
      .all(runId).map(row => ({...row, data: JSON.parse(row.data)}));
  } finally { connection.close(); }
}

function list(root, id = null) {
  let names = [];
  try { names = fs.readdirSync(runsDir(root)); } catch {}
  return names.filter(n => !id || n.startsWith(`${id}--`)).sort().map(n => {
    try { const r = readRun(root, n); return {runId: r.runId, projectId: r.projectId, stageId: r.stageId, status: r.status,
      createdAt: r.createdAt, patch: r.patch || null}; } catch { return null; }
  }).filter(Boolean);
}

function changedFiles(root, patch) {
  return execFileSync('git', ['apply', '--numstat', patch], {cwd: root, encoding: 'utf8'})
    .split('\n').filter(Boolean).map(line => line.split('\t')[2]);
}

function apply(root, runId) {
  const run = readRun(root, runId);
  if (run.status !== 'awaiting-approval' || !run.patch) throw new Error(`Run ${runId} is ${run.status}; nothing to apply`);
  const patch = path.join(root, run.patch), {denied} = helpers();
  const files = changedFiles(root, patch);
  const outside = files.filter(rel => !run.writeScope.includes(rel) || denied(rel));
  if (outside.length) throw new Error(`Patch touches files outside the stage write scope: ${outside.join(', ')}`);
  const edited = files.filter(rel => approvals.sha256(root, rel) !== (run.targets[rel] ?? null));
  if (edited.length) throw new Error(`Changed since the run was prepared (your edits are kept): ${edited.join(', ')}. Prepare a new run.`);
  execFileSync('git', ['apply', '--check', patch], {cwd: root, stdio: 'pipe'});
  execFileSync('git', ['apply', patch], {cwd: root, stdio: 'pipe'});
  Object.assign(run, {status: 'applied', appliedAt: new Date().toISOString(), appliedFiles: files});
  writeRun(root, run);
  return run;
}

function reject(root, runId, note = '') {
  const run = readRun(root, runId);
  if (['applied', 'rejected'].includes(run.status)) throw new Error(`Run ${runId} is already ${run.status}`);
  Object.assign(run, {status: 'rejected', rejectedAt: new Date().toISOString(), note});
  writeRun(root, run);
  return run;
}

module.exports = {prepare, execute, events, list, apply, reject, runtimeCheck, readRun, gatesBefore};
