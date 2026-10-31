// Series production workflow for the manager: the stage graph comes from production automation,
// the user's extra rules/notes per stage from series-notes. Only notes are writable here.
const {load, slug} = require('../../scripts/catalog/catalog.cjs');
const {seriesWorkflow} = require('../production-automation/cli.cjs');
const seriesNotes = require('../production-automation/series-notes.cjs');
const policy = require('../production-automation/policy.json');

const phases = [
  {id: 'prepare', title: 'Chuẩn bị', stages: ['brief', 'sources']},
  {id: 'lock', title: 'Chốt ban đầu', stages: ['script', 'editorial-review', 'music', 'voice-audition', 'visual-plan', 'initial-lock']},
  {id: 'build', title: 'Sản xuất', stages: ['narration', 'visuals', 'assembly', 'scene-review', 'qa', 'metadata']},
  {id: 'release', title: 'Hoàn thiện', stages: ['review-preview', 'export']},
];
const profiles = {philosophy: 'Triết lý, ảnh tĩnh', book: 'Phân tích sách', kids: 'Thiếu nhi, footage chuyển động'};
const blocked = {
  assembly: 'Chưa tự động: cần mount asset chỉ-đọc và kiểm Remotion trong sandbox.',
  sources: 'Bạn chạy `npm run pdf` trên máy; sách riêng không đưa vào agent.',
  'voice-audition': 'Bạn chạy `voice:audition` trên máy, chọn giọng và một đoạn nghe mẫu.',
  music: 'Chọn bài trong thư viện nhạc trên máy; ghi music.json có tên bài và tác giả.',
  narration: 'Tạo giọng cho toàn bộ kịch bản đã chốt trên máy (clone thì trên máy GPU).',
  visuals: 'Làm ảnh/animation theo prompt đã chốt trên máy; không tự gọi dịch vụ trả phí.',
  qa: 'Chạy các lệnh kiểm tra npm cố định, không cần model.',
};
function automation(stage) {
  if (stage.id === 'export') return {mode: 'manual', text: 'Render thủ công khi bạn yêu cầu; không tự đăng tải.'};
  if (stage.id === 'initial-lock') return {mode: 'gate', text: 'Bạn chốt một lần trên trang quản lý (Duyệt sản xuất); sửa sau đó agent tạo bản vá để bạn duyệt.', command: 'npm run automation -- patch <slug> --reason "…"'};
  if (stage.id === 'scene-review') return {mode: 'gate', text: 'Agent xuất clip từng cảnh đã xong; bạn xem, bấm Đạt hoặc ghi chú trên trang quản lý.', command: 'npm run automation -- scene-clip <slug> <cảnh>'};
  if (stage.kind === 'human-approval') return {mode: 'gate', text: 'Chỉ bạn ghi duyệt, gắn với mã hash của file.', command: `npm run automation -- approve <slug> ${stage.id}`};
  if (blocked[stage.id]) return {mode: stage.kind === 'draft-task' ? 'manual' : stage.kind, text: blocked[stage.id]};
  if (policy.runner.runnableStages.includes(stage.id)) return {mode: 'agent', text: 'Agent local soạn bản nháp trong bản sao riêng; bạn xem diff rồi apply.', command: `npm run automation -- run <slug> ${stage.id}`};
  return {mode: 'manual', text: 'Làm thủ công.'};
}

function createWorkflow(root) {
  function seriesOf(id) {
    if (!slug(id)) throw new Error('Invalid series');
    const series = load(root).series.find(s => s.id === id);
    if (!series) throw new Error('Series not found');
    return series;
  }
  function workflow(id) {
    const series = seriesOf(id), flow = seriesWorkflow(root, id), notes = seriesNotes.read(root, series);
    const byId = Object.fromEntries(flow.stages.map(s => [s.id, s]));
    const rules = flow.profile ? [...policy.runner.contextRules.common, ...(policy.runner.contextRules[flow.profile] || [])] : [];
    return {series: id, title: series.title, profile: flow.profile, profileTitle: profiles[flow.profile] || null,
      file: notes.file, revision: notes.revision, general: notes.general, builtInRules: rules,
      phases: phases.map(p => ({...p, stages: p.stages.filter(s => byId[s])})).filter(p => p.stages.length),
      stages: flow.stages.map((s, index) => ({id: s.id, number: index + 1, title: s.title, guide: s.guide, kind: s.kind,
        dependencies: s.dependencies, reads: s.readScope, writes: s.writeScope, invalidates: s.invalidates,
        automation: automation(s), config: notes.stages[s.id] || {rules: [], notes: ''}}))};
  }
  function saveWorkflow(body) {
    const series = seriesOf(body.series);
    const stages = seriesWorkflow(root, series.id).stages.map(s => s.id);
    if (body.stage !== 'general' && !stages.includes(body.stage)) throw new Error('Unknown stage');
    return seriesNotes.save(root, series, body.stage, {rules: body.rules, notes: body.notes}, body.revision);
  }
  return {workflow, saveWorkflow};
}
module.exports = {createWorkflow};
