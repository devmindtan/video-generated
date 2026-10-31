// Per-series workflow notes: extra rules and notes the user adds to each production stage.
// Stored in series/<channel>/<series>/workflow.json, read by the runner into project_context.md.
// Notes are guidance; they never change the stage graph, gates or safety policy.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const LIMITS = {rules: 30, ruleLength: 500, notes: 10000, fileBytes: 200000};
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
const empty = () => ({rules: [], notes: ''});

function fileOf(series) {
  const file = path.join(path.dirname(series.file), 'workflow.json');
  if (fs.existsSync(file) && fs.lstatSync(file).isSymbolicLink()) throw new Error('workflow.json must not be a symlink');
  return file;
}
function clean(entry) {
  const rules = Array.isArray(entry?.rules) ? entry.rules.filter(r => typeof r === 'string').map(r => r.trim()).filter(Boolean) : [];
  return {rules, notes: typeof entry?.notes === 'string' ? entry.notes : ''};
}
function parse(text) {
  if (!text) return {schemaVersion: 1, general: empty(), stages: {}};
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('workflow.json is not an object');
  return data;
}
function read(root, series) {
  const file = fileOf(series), text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const data = parse(text);
  const stages = Object.fromEntries(Object.entries(data.stages || {}).map(([id, entry]) => [id, clean(entry)]));
  return {file: path.relative(root, file).split(path.sep).join('/'), exists: Boolean(text), revision: hash(text),
    general: clean(data.general), stages};
}
function validate({rules, notes}) {
  if (!Array.isArray(rules) || rules.length > LIMITS.rules || rules.some(r => typeof r !== 'string' || r.length > LIMITS.ruleLength))
    throw new Error(`Tối đa ${LIMITS.rules} quy tắc, mỗi quy tắc dưới ${LIMITS.ruleLength} ký tự`);
  if (typeof notes !== 'string' || notes.length > LIMITS.notes) throw new Error(`Ghi chú tối đa ${LIMITS.notes} ký tự`);
  return {rules: rules.map(r => r.trim()).filter(Boolean), notes: notes.replace(/\s+$/, '')};
}
// key is 'general' or a stage id the caller has checked against the series workflow.
function save(root, series, key, entry, revision) {
  const value = validate(entry), file = fileOf(series), folder = path.dirname(file);
  const before = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const conflict = () => {const e = new Error('Quy trình vừa được sửa ở nơi khác. Hãy tải lại trước khi lưu.'); e.status = 409; return e;};
  if (hash(before) !== revision) throw conflict();
  // Keep unknown keys and other stages exactly as they were in the file.
  const data = parse(before);
  data.schemaVersion = data.schemaVersion || 1;
  if (key === 'general') data.general = value;
  else {
    data.stages = data.stages && typeof data.stages === 'object' ? data.stages : {};
    if (value.rules.length || value.notes) data.stages[key] = value; else delete data.stages[key];
  }
  const text = JSON.stringify(data, null, 2) + '\n';
  if (Buffer.byteLength(text) > LIMITS.fileBytes) throw new Error('workflow.json quá lớn');
  if (text === before) return {revision: hash(text)};
  if (before) {
    const history = path.join(folder, '.manager-history');
    fs.mkdirSync(history, {recursive: true});
    fs.writeFileSync(path.join(history, `workflow-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.json`), before, {flag: 'wx'});
  }
  const temp = path.join(folder, `.workflow-${crypto.randomBytes(8).toString('hex')}.tmp`);
  fs.writeFileSync(temp, text, {flag: 'wx'});
  if (hash(fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '') !== revision) {fs.unlinkSync(temp); throw conflict();}
  fs.renameSync(temp, file);
  return {revision: hash(text)};
}
// Markdown block appended to a worker's project_context.md for one stage.
function contextFor(notes, stageId) {
  const stage = notes.stages[stageId] || empty(), parts = [];
  if (notes.general.rules.length) parts.push(`## Quy tắc chung của series (người dùng thêm)\n\n${notes.general.rules.map(r => `- ${r}`).join('\n')}`);
  if (notes.general.notes) parts.push(`## Ghi chú chung của series\n\n${notes.general.notes}`);
  if (stage.rules.length) parts.push(`## Quy tắc bổ sung cho bước này (bắt buộc)\n\n${stage.rules.map(r => `- ${r}`).join('\n')}`);
  if (stage.notes) parts.push(`## Ghi chú cho bước này\n\n${stage.notes}`);
  return parts.join('\n\n');
}
module.exports = {read, save, contextFor, LIMITS};
