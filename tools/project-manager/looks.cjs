// Visual themes and 2D animation styles (user 2026-11-10): the manager's "Chủ đề hình ảnh" and "Phong cách animation"
// pages. Data lives in src/looks/themes.json and src/looks/animation-styles.json (read by the videos through
// src/looks/looks.tsx); a project's choice is the "look" field of its entry in series.json. Every write checks the
// file's revision (409 when it changed elsewhere), keeps the previous text in a .manager-history folder and replaces
// the file atomically. Nothing here renders, generates or touches a video's own files.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {load} = require('../../scripts/catalog/catalog.cjs');

const THEMES = 'src/looks/themes.json', STYLES = 'src/looks/animation-styles.json';
const TEXTURES = ['grain', 'paper', 'chalk', 'glow', 'marble', 'grid', 'none'], ROLES = ['background', 'surface', 'ink', 'muted', 'accent', 'accent2'];
const hashText = text => crypto.createHash('sha256').update(text).digest('hex');
const conflict = what => Object.assign(new Error(`${what} vừa được sửa ở nơi khác. Hãy tải lại trang.`), {status: 409});
const fail = message => Object.assign(new Error(message), {status: 400});

function createLooks(root) {
  const file = rel => path.join(root, rel);
  const read = rel => {const f = file(rel);if (fs.lstatSync(f).isSymbolicLink()) throw new Error(`${rel} must not be a symlink`);return fs.readFileSync(f, 'utf8');};
  // Revision-checked atomic write with the previous text kept beside the file.
  function write(target, before, revision, text, what) {
    if (hashText(before) !== revision) throw conflict(what);
    const history = path.join(path.dirname(target), '.manager-history');
    fs.mkdirSync(history, {recursive: true});
    fs.writeFileSync(path.join(history, `${path.basename(target, '.json')}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.json`), before, {flag: 'wx'});
    const temp = path.join(path.dirname(target), `.${path.basename(target)}-${crypto.randomBytes(8).toString('hex')}.tmp`);
    fs.writeFileSync(temp, text, {flag: 'wx'});
    if (hashText(fs.readFileSync(target, 'utf8')) !== revision) {fs.unlinkSync(temp);throw conflict(what);}
    fs.renameSync(temp, target);
    return hashText(text);
  }
  // ---- automatic detection (user 2026-11-10: "Đang dùng" must recognise itself, not wait for an agent) ----------------
  // A project's code plus the files it imports (relative, inside src/, three levels deep): its colours and markers.
  function codeOf(sourceDir) {
    const seen = new Set(), texts = [], src = path.join(root, 'src');
    const walk = dir => {for (const e of fs.existsSync(dir) ? fs.readdirSync(dir, {withFileTypes: true}) : []) {
      const f = path.join(dir, e.name);if (e.isDirectory()) walk(f);else if (/\.(tsx?|jsx?)$/.test(e.name)) add(f, 0);}};
    const add = (file, depth) => {
      if (seen.has(file) || !file.startsWith(src + path.sep) || file.includes(`${path.sep}looks${path.sep}`)) return;
      seen.add(file);const text = fs.readFileSync(file, 'utf8');texts.push(text);
      if (depth >= 3) return;
      for (const m of text.matchAll(/from\s+['"](\.{1,2}\/[^'"]+)['"]/g)) {
        const base = path.resolve(path.dirname(file), m[1]);
        const hit = [base, `${base}.tsx`, `${base}.ts`, path.join(base, 'index.tsx'), path.join(base, 'index.ts')].find(x => fs.existsSync(x) && fs.statSync(x).isFile());
        if (hit) add(hit, depth + 1);
      }
    };
    walk(sourceDir);
    return texts.join('\n');
  }
  const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const distance = (a, b) => Math.hypot(...rgb(a).map((v, i) => v - rgb(b)[i]));
  // Theme: its background, text and accent all appear (within a small colour distance); the closest theme wins.
  function detectTheme(code, themes, style) {
    // A composition that reads its colours through themeOf('<id>') (docs/looks.md) names its theme outright.
    const named = [...code.matchAll(/themeOf\(\s*['"]([a-z0-9-]+)['"]\s*\)/g)].map(m => m[1]).find(id => themes.some(t => t.id === id));
    if (named) return {id: named, why: `code đọc màu qua themeOf('${named}')`};
    const colors = [...new Set((code.match(/#[0-9a-fA-F]{6}\b/g) || []).map(c => c.toLowerCase()))];
    if (!colors.length) return null;
    let best = null;
    for (const t of themes) {
      // The same identity drifts a little from video to video (near-black grounds, warmer or paler golds).
      const gaps = ['background', 'ink', 'accent'].map(role => Math.min(...colors.map(c => distance(c, t.palette[role]))));
      // Themes of one colour family (dark, ivory, gold) are told apart by the style the project uses.
      const score = gaps.reduce((a, b) => a + b) - (style && t.styles.includes(style) ? 15 : 0);
      if (gaps[0] <= 20 && gaps[1] <= 20 && gaps[2] <= 36 && (!best || score < best.score)) best = {id: t.id, score};
    }
    return best && {id: best.id, why: 'màu nền, chữ và nhấn trong code khớp bảng màu'};
  }
  // Style: the one whose "detect.any" markers occur most often in the code, unless one of its "detect.none" markers is
  // there (a short with eight stills and one drawn line is a still-image short).
  function detectStyle(code, styles) {
    let best = null;
    for (const s of styles) {
      const none = s.detect?.none || [];
      if (!(s.detect?.any || []).length || none.some(r => new RegExp(r).test(code))) continue;
      const count = s.detect.any.reduce((n, r) => n + (code.match(new RegExp(r, 'g')) || []).length, 0);
      if (count && (!best || count > best.count)) best = {id: s.id, count};
    }
    return best && {id: best.id, why: `${best.count} dấu hiệu trong code`};
  }
  const projects = (themes, styles) => load(root).series.flatMap(series => series.projects.map(p => {
    const code = themes ? codeOf(path.join(root, p.paths.source)) : '';
    const foundStyle = styles ? detectStyle(code, styles) : null, foundTheme = themes ? detectTheme(code, themes, foundStyle?.id) : null;
    const theme = p.look?.theme ? {id: p.look.theme, by: 'chosen'} : foundTheme ? {...foundTheme, by: 'detected'} : null;
    const style = p.look?.style ? {id: p.look.style, by: 'chosen'} : foundStyle ? {...foundStyle, by: 'detected'} : null;
    return {id: p.id, title: p.title, format: p.format, status: p.status, series: series.id, seriesTitle: series.title, look: p.look || null, theme, style};
  }));

  function overview() {
    const themesText = read(THEMES), stylesText = read(STYLES), list = projects(JSON.parse(themesText).themes, JSON.parse(stylesText).styles);
    const themes = JSON.parse(themesText).themes.map(t => ({...t, usedBy: list.filter(p => p.theme?.id === t.id).map(p => p.id)}));
    const styles = JSON.parse(stylesText).styles.map(s => ({...s, usedBy: list.filter(p => p.style?.id === s.id).map(p => p.id),
      suggestedBy: themes.filter(t => t.styles.includes(s.id)).map(t => t.id)}));
    return {themes, styles, projects: list, textures: TEXTURES, revisions: {themes: hashText(themesText), styles: hashText(stylesText)}};
  }

  // A theme as typed in the form, cleaned and validated; ids are new or kept, never renamed (projects point at them).
  function cleanTheme(input, styleIds) {
    const text = (v, max, name) => {const s = typeof v === 'string' ? v.trim() : '';if (!s || s.length > max) throw fail(`${name} cần từ 1 đến ${max} ký tự`);return s;};
    const list = (v, max) => (Array.isArray(v) ? v : String(v || '').split(',')).map(x => String(x).trim()).filter(Boolean).slice(0, max).map(x => x.slice(0, 60));
    const palette = {};
    for (const role of ROLES) {const c = String(input?.palette?.[role] || '').toLowerCase();if (!/^#[0-9a-f]{6}$/.test(c)) throw fail(`Màu "${role}" phải dạng #rrggbb`);palette[role] = c;}
    const formats = list(input.formats, 2).filter(f => ['short', 'long'].includes(f));
    if (!formats.length) throw fail('Chọn ít nhất một định dạng: short hoặc video dài');
    if (!TEXTURES.includes(input.texture)) throw fail('Chất liệu nền không hợp lệ');
    const strokeColor = ROLES.includes(input?.stroke?.color) ? input.stroke.color : 'accent', width = Number(input?.stroke?.width);
    if (!(width >= 1 && width <= 8)) throw fail('Độ dày nét từ 1 đến 8');
    const role = (v, fallback) => ROLES.includes(v) ? v : fallback;
    const sampleCaption = text(input?.sample?.caption, 120, 'Câu phụ đề mẫu'), keyword = String(input?.sample?.keyword || '').trim();
    if (keyword && !sampleCaption.includes(keyword)) throw fail('Từ khóa mẫu phải nằm trong câu phụ đề mẫu');
    return {name: text(input.name, 60, 'Tên chủ đề'), mood: text(input.mood, 80, 'Không khí'), description: text(input.description, 400, 'Mô tả'),
      topics: list(input.topics, 8), formats, palette, texture: input.texture, stroke: {color: strokeColor, width: Math.round(width * 10) / 10},
      caption: {text: role(input?.caption?.text, 'ink'), keyword: role(input?.caption?.keyword, 'accent'), box: Boolean(input?.caption?.box)},
      music: text(input.music, 120, 'Không khí nhạc'), styles: list(input.styles, 6).filter(id => styleIds.has(id)), sample: {caption: sampleCaption, keyword}};
  }
  const slugOf = name => name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'chu-de';

  // Create (no id) or update (id) a theme.
  function saveTheme({id, theme, revision}) {
    const target = file(THEMES), before = read(THEMES), data = JSON.parse(before);
    const styleIds = new Set(JSON.parse(read(STYLES)).styles.map(s => s.id)), clean = cleanTheme(theme || {}, styleIds);
    let saved;
    if (id) {
      const index = data.themes.findIndex(t => t.id === id);
      if (index < 0) throw fail('Không tìm thấy chủ đề này');
      saved = {id, ...clean};data.themes[index] = saved;
    } else {
      let next = slugOf(clean.name), n = 2;const base = next;
      while (data.themes.some(t => t.id === next)) next = `${base}-${n++}`;
      saved = {id: next, ...clean};data.themes.push(saved);
    }
    const text = JSON.stringify(data, null, 2) + '\n';
    return {revision: write(target, before, revision, text, 'Danh sách chủ đề'), theme: saved};
  }
  function deleteTheme({id, revision}) {
    const target = file(THEMES), before = read(THEMES), data = JSON.parse(before);
    if (!data.themes.some(t => t.id === id)) throw fail('Không tìm thấy chủ đề này');
    const users = overview().projects.filter(p => p.theme?.id === id);
    if (users.length) throw fail(`Chủ đề đang dùng cho ${users.length} dự án (${users.map(p => p.title).slice(0, 3).join(', ')}). Đổi chủ đề của các dự án đó trước.`);
    if (data.themes.length === 1) throw fail('Cần giữ ít nhất một chủ đề');
    data.themes = data.themes.filter(t => t.id !== id);
    return {revision: write(target, before, revision, JSON.stringify(data, null, 2) + '\n', 'Danh sách chủ đề')};
  }
  // The user's own note and favourite mark on a style; the technical description stays the agent's.
  function saveStyleNote({id, userNote, favorite, revision}) {
    const target = file(STYLES), before = read(STYLES), data = JSON.parse(before), style = data.styles.find(s => s.id === id);
    if (!style) throw fail('Không tìm thấy phong cách này');
    const note = typeof userNote === 'string' ? userNote.trim() : '';
    if (note.length > 1000) throw fail('Ghi chú tối đa 1000 ký tự');
    style.userNote = note;style.favorite = Boolean(favorite);
    return {revision: write(target, before, revision, JSON.stringify(data, null, 2) + '\n', 'Danh sách phong cách')};
  }
  // A project's look in its series.json entry; the revision is that series file's.
  function setLook({project: id, theme, style, revision}) {
    const series = load(root).series.find(s => s.projects.some(p => p.id === id));
    if (!series) throw fail('Không tìm thấy dự án');
    const view = overview();
    if (theme != null && theme !== '' && !view.themes.some(t => t.id === theme)) throw fail('Chủ đề không có trong danh sách');
    if (style != null && style !== '' && !view.styles.some(s => s.id === style)) throw fail('Phong cách không có trong danh sách');
    const before = fs.readFileSync(series.file, 'utf8'), data = JSON.parse(before), entry = data.projects.find(p => p.id === id);
    const look = {...(entry.look || {})};
    if (theme !== undefined) {if (theme) look.theme = theme;else delete look.theme;}
    if (style !== undefined) {if (style) look.style = style;else delete look.style;}
    if (Object.keys(look).length) entry.look = look;else delete entry.look;
    return {revision: write(series.file, before, revision, JSON.stringify(data, null, 2) + '\n', 'Danh bạ series'), look: entry.look || null};
  }
  function seriesRevision(id) {
    const series = load(root).series.find(s => s.projects.some(p => p.id === id));
    if (!series) throw fail('Không tìm thấy dự án');
    return {revision: hashText(fs.readFileSync(series.file, 'utf8'))};
  }
  // Studio IDs of the style samples, the only compositions outside the project catalog the manager opens.
  const sampleIds = () => JSON.parse(read(STYLES)).styles.map(s => s.sample);
  return {looks: overview, saveTheme, deleteTheme, saveStyleNote, setLook, seriesRevision, sampleIds};
}

module.exports = {createLooks};
