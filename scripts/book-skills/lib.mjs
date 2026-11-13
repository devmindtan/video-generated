// Skill packs built from technical books (user request 2026-11-13): each book gets a set of agent skills that carry
// its knowledge for future development work, independent of the book's summary video. Packs live in
// book-skills/<book-id>/ (pack.json + skills/<name>/SKILL.md + references), are validated here and installed as
// copies into every agent's global skill folder on this machine (Claude Code, Codex, OpenCode).
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const REPO = process.env.BOOK_SKILLS_REPO
  ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const MARKER = '.book-skill.json';
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_DESCRIPTION = 1024;
const MAX_SKILL_LINES = 500;
// A run of this many words identical to the book counts as copied text: skills restate the book in their own words.
export const VERBATIM_WORDS = 14;

// Global skill folders. BOOK_SKILLS_TARGETS="name=/path,name2=/path2" overrides them (tests, other machines).
export const targets = () => {
  const env = process.env.BOOK_SKILLS_TARGETS;
  if (env) return env.split(',').filter(Boolean).map((x) => {const [name, ...p] = x.split('='); return {name, dir: p.join('=')};});
  const home = os.homedir();
  return [
    {name: 'claude', dir: path.join(home, '.claude', 'skills')},
    {name: 'codex', dir: path.join(process.env.CODEX_HOME ?? path.join(home, '.codex'), 'skills')},
    {name: 'opencode', dir: path.join(home, '.config', 'opencode', 'skills')},
  ];
};

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const rel = (p) => path.relative(REPO, p);

// Books are found by id under series/<channel>/<series>/books/<id>/book.json.
export const findBooks = () => {
  const out = [];
  const series = path.join(REPO, 'series');
  if (!fs.existsSync(series)) return out;
  for (const ch of fs.readdirSync(series, {withFileTypes: true})) {
    if (!ch.isDirectory()) continue;
    for (const se of fs.readdirSync(path.join(series, ch.name), {withFileTypes: true})) {
      const books = path.join(series, ch.name, se.name, 'books');
      if (!se.isDirectory() || !fs.existsSync(books)) continue;
      for (const b of fs.readdirSync(books, {withFileTypes: true})) {
        const file = path.join(books, b.name, 'book.json');
        if (b.isDirectory() && fs.existsSync(file)) out.push({id: b.name, dir: path.dirname(file), book: readJson(file)});
      }
    }
  }
  return out;
};
export const findBook = (id) => findBooks().find((b) => b.id === id) ?? null;

export const packDir = (id) => path.join(REPO, 'book-skills', id);
export const listPacks = () => {
  const root = path.join(REPO, 'book-skills');
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, {withFileTypes: true})
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(root, d.name, 'pack.json'))).map((d) => d.name);
};
export const loadPack = (id) => {
  const file = path.join(packDir(id), 'pack.json');
  if (!fs.existsSync(file)) throw new Error(`Chưa có bộ skill cho sách "${id}" (${rel(file)})`);
  return readJson(file);
};
export const skillDir = (id, name) => path.join(packDir(id), 'skills', name);

export const parseFrontmatter = (text) => {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  if (!m) return null;
  const data = {};
  let key = null;
  for (const line of m[1].split('\n')) {
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (kv) {key = kv[1]; data[key] = kv[2].replace(/^(['"])(.*)\1$/, '$2');}
    else if (key && /^\s+\S/.test(line)) data[key] += ' ' + line.trim();
  }
  return {data, body: text.slice(m[0].length)};
};

const walk = (dir, base = dir) => fs.readdirSync(dir, {withFileTypes: true}).flatMap((e) => {
  const p = path.join(dir, e.name);
  if (e.name === MARKER) return [];
  return e.isDirectory() ? walk(p, base) : [path.relative(base, p)];
}).sort();

export const treeHash = (dir) => {
  const h = crypto.createHash('sha256');
  for (const f of walk(dir)) {h.update(f + '\0'); h.update(fs.readFileSync(path.join(dir, f))); h.update('\0');}
  return h.digest('hex');
};

// ---- verbatim check against the book's cached page text ------------------------------------------------------------
const words = (text) => (text.normalize('NFC').toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []);
export const bookPages = (bookId) => {
  const root = path.join(REPO, 'library', 'books', bookId);
  const cur = path.join(root, 'current.json');
  if (!fs.existsSync(cur)) return null;
  const pages = path.join(root, readJson(cur).edition, 'pages');
  if (!fs.existsSync(pages)) return null;
  return fs.readdirSync(pages).filter((f) => f.endsWith('.txt')).sort()
    .map((f) => ({page: Number.parseInt(f, 10), text: fs.readFileSync(path.join(pages, f), 'utf8')}));
};
export const bookIndex = (pages, n = VERBATIM_WORDS) => {
  const index = new Map();
  for (const {page, text} of pages) {
    const w = words(text);
    for (let i = 0; i + n <= w.length; i++) {const k = w.slice(i, i + n).join(' '); if (!index.has(k)) index.set(k, page);}
  }
  return index;
};
// Runs of >= n words that also appear in the book, merged, with the PDF page of the first match.
export const verbatimRuns = (text, index, n = VERBATIM_WORDS) => {
  const w = words(text), runs = [];
  let start = -1, end = -1, page = null;
  for (let i = 0; i + n <= w.length; i++) {
    const hit = index.get(w.slice(i, i + n).join(' '));
    if (hit !== undefined) {
      if (start >= 0 && i <= end) end = i + n;
      else {if (start >= 0) runs.push({page, words: end - start, text: w.slice(start, end).join(' ')}); start = i; end = i + n; page = hit;}
    }
  }
  if (start >= 0) runs.push({page, words: end - start, text: w.slice(start, end).join(' ')});
  return runs;
};

// ---- validation --------------------------------------------------------------------------------------------------
export const checkPack = (id, {index} = {}) => {
  const errors = [], warnings = [];
  let pack;
  try {pack = loadPack(id);} catch (e) {return {errors: [e.message], warnings, pack: null};}
  const book = findBook(pack.book ?? id);
  if (!book) errors.push(`pack.json: không tìm thấy sách "${pack.book}" trong series/*/*/books/`);
  else {
    if (pack.sourceSha256 !== book.book.sourceSha256)
      errors.push('pack.json: sourceSha256 khác book.json (sách đã đổi bản, cần rà lại bộ skill)');
    const {chaptersRead, chaptersTotal} = book.book;
    if (chaptersTotal && chaptersRead !== chaptersTotal)
      errors.push(`Sách mới đọc ${chaptersRead}/${chaptersTotal} chương: đọc hết sách trước khi viết bộ skill`);
  }
  if (!pack.prefix || !NAME_RE.test(pack.prefix)) errors.push('pack.json: prefix phải là chữ thường, số, gạch nối');
  if (!Array.isArray(pack.skills) || pack.skills.length === 0) errors.push('pack.json: skills trống');
  const names = new Set();
  const otherNames = new Map(listPacks().filter((p) => p !== id).flatMap((p) => {
    try {return loadPack(p).skills.map((s) => [s.name, p]);} catch {return [];}
  }));
  const idx = index === undefined ? (() => {const pages = bookPages(pack.book ?? id); return pages ? bookIndex(pages) : null;})() : index;
  if (!idx) warnings.push('Không có bản chữ của sách trong library/books: bỏ qua kiểm tra chép nguyên văn');
  for (const s of pack.skills ?? []) {
    const where = `skills/${s.name}`;
    if (/TODO/.test(`${s.purpose} ${s.pages}`) || !s.purpose) errors.push(`pack.json: ${s.name} chưa ghi purpose/pages`);
    if (!NAME_RE.test(s.name ?? '') || s.name.length > 64) {errors.push(`${where}: tên không hợp lệ`); continue;}
    if (!s.name.startsWith(pack.prefix + '-')) errors.push(`${where}: tên phải bắt đầu bằng "${pack.prefix}-"`);
    if (names.has(s.name)) errors.push(`${where}: trùng tên trong pack`);
    if (otherNames.has(s.name)) errors.push(`${where}: trùng tên với pack "${otherNames.get(s.name)}"`);
    names.add(s.name);
    const dir = skillDir(id, s.name), file = path.join(dir, 'SKILL.md');
    if (!fs.existsSync(file)) {errors.push(`${where}: thiếu SKILL.md`); continue;}
    const text = fs.readFileSync(file, 'utf8');
    const fm = parseFrontmatter(text);
    if (!fm) {errors.push(`${where}/SKILL.md: thiếu frontmatter ---`); continue;}
    if (fm.data.name !== s.name) errors.push(`${where}/SKILL.md: name "${fm.data.name}" phải trùng tên thư mục`);
    const desc = fm.data.description ?? '';
    if (!desc) errors.push(`${where}/SKILL.md: thiếu description`);
    if (desc.length > MAX_DESCRIPTION) errors.push(`${where}/SKILL.md: description ${desc.length} ký tự (tối đa ${MAX_DESCRIPTION})`);
    if (/[<>]/.test(desc)) errors.push(`${where}/SKILL.md: description không được có dấu < >`);
    if (text.split('\n').length > MAX_SKILL_LINES) errors.push(`${where}/SKILL.md: quá ${MAX_SKILL_LINES} dòng, chuyển chi tiết sang references/`);
    if (!/^## Nguồn\b/m.test(fm.body)) errors.push(`${where}/SKILL.md: thiếu mục "## Nguồn"`);
    else if (!/PDF\s*(tr\.?|trang)?\s*\d/i.test(fm.body.split(/^## Nguồn\b/m)[1])) errors.push(`${where}/SKILL.md: mục Nguồn chưa ghi trang PDF`);
    const files = walk(dir).filter((f) => f.endsWith('.md'));
    for (const f of files) {
      const t = fs.readFileSync(path.join(dir, f), 'utf8');
      if (/\bTODO\b/.test(t)) errors.push(`${where}/${f}: còn TODO`);
      if (/library\/books|\.pdf\b|[\w.+-]+@[\w-]+\.[\w.]+/i.test(t)) errors.push(`${where}/${f}: có đường dẫn sách/PDF riêng hoặc email`);
      for (const [, link] of t.matchAll(/\]\(([^)#\s]+)(#[^)]*)?\)/g)) {
        if (/^[a-z]+:/i.test(link)) continue;
        if (!fs.existsSync(path.resolve(path.dirname(path.join(dir, f)), link))) errors.push(`${where}/${f}: liên kết hỏng ${link}`);
      }
      if (idx) for (const r of verbatimRuns(t, idx))
        errors.push(`${where}/${f}: ${r.words} chữ chép nguyên văn sách (PDF ${r.page}): "${r.text.slice(0, 90)}…"`);
    }
  }
  const onDisk = fs.existsSync(path.join(packDir(id), 'skills')) ? fs.readdirSync(path.join(packDir(id), 'skills')) : [];
  for (const d of onDisk) if (!names.has(d)) warnings.push(`skills/${d}: có thư mục nhưng không có trong pack.json (không cài)`);
  return {errors, warnings, pack};
};

// ---- install / status / uninstall --------------------------------------------------------------------------------
const readMarker = (dir) => {
  try {return readJson(path.join(dir, MARKER));} catch {return null;}
};
const exists = (p) => {try {fs.lstatSync(p); return true;} catch {return false;}};

export const status = (ids = listPacks()) => ids.flatMap((id) => {
  const pack = loadPack(id);
  return pack.skills.flatMap((s) => {
    const src = skillDir(id, s.name), hash = fs.existsSync(src) ? treeHash(src) : null;
    return targets().map((t) => {
      const dest = path.join(t.dir, s.name), m = readMarker(dest);
      const state = !exists(dest) ? 'missing' : !m || m.pack !== id ? 'conflict' : m.hash === hash && treeHash(dest) === hash ? 'installed' : 'outdated';
      return {pack: id, skill: s.name, target: t.name, dest, state};
    });
  });
});

// Copies every skill of the pack into every target. Plans first and changes nothing if any destination belongs to
// someone else (a folder or link without our marker, or a marker from another pack). Removes skills this pack
// installed earlier that are no longer in pack.json.
export const install = (id, {dryRun = false} = {}) => {
  const {errors, pack} = checkPack(id);
  if (errors.length) throw new Error(`Bộ skill "${id}" chưa đạt kiểm tra (${errors.length} lỗi): chạy check`);
  const plan = [], conflicts = [];
  for (const t of targets()) {
    for (const s of pack.skills) {
      const dest = path.join(t.dir, s.name), m = readMarker(dest);
      if (exists(dest) && (!m || m.pack !== id)) conflicts.push(`${t.name}: ${dest} đã có skill khác cùng tên`);
      plan.push({op: 'copy', target: t.name, skill: s.name, src: skillDir(id, s.name), dest});
    }
    if (fs.existsSync(t.dir)) for (const d of fs.readdirSync(t.dir)) {
      const dest = path.join(t.dir, d), m = readMarker(dest);
      if (m?.pack === id && !pack.skills.some((s) => s.name === d)) plan.push({op: 'remove', target: t.name, skill: d, dest});
    }
  }
  if (conflicts.length) throw new Error(`Không cài, trùng tên với skill không thuộc bộ này:\n  ${conflicts.join('\n  ')}`);
  if (dryRun) return plan;
  const at = new Date().toISOString();
  for (const p of plan) {
    fs.rmSync(p.dest, {recursive: true, force: true});
    if (p.op === 'remove') continue;
    fs.mkdirSync(path.dirname(p.dest), {recursive: true});
    fs.cpSync(p.src, p.dest, {recursive: true});
    fs.writeFileSync(path.join(p.dest, MARKER), JSON.stringify({
      pack: id, book: pack.book, skill: p.skill, source: rel(p.src), hash: treeHash(p.src), installedAt: at,
    }, null, 2) + '\n');
  }
  return plan;
};

export const uninstall = (id) => {
  const removed = [];
  for (const t of targets()) {
    if (!fs.existsSync(t.dir)) continue;
    for (const d of fs.readdirSync(t.dir)) {
      const dest = path.join(t.dir, d);
      if (readMarker(dest)?.pack === id) {fs.rmSync(dest, {recursive: true, force: true}); removed.push({target: t.name, skill: d});}
    }
  }
  return removed;
};

// ---- scaffold ----------------------------------------------------------------------------------------------------
export const scaffold = (id, {prefix, skills}) => {
  const book = findBook(id);
  if (!book) throw new Error(`Không tìm thấy sách "${id}"`);
  if (fs.existsSync(path.join(packDir(id), 'pack.json'))) throw new Error(`Đã có ${rel(path.join(packDir(id), 'pack.json'))}`);
  if (!prefix || !NAME_RE.test(prefix)) throw new Error('Cần --prefix (chữ thường, số, gạch nối)');
  const names = skills.map((s) => (s.startsWith(prefix + '-') ? s : `${prefix}-${s}`));
  const pack = {
    book: id, title: book.book.title, authors: book.book.authors ?? [], bookDir: rel(book.dir),
    sourceSha256: book.book.sourceSha256, prefix, createdAt: new Date().toISOString().slice(0, 10),
    skills: names.map((name) => ({name, purpose: 'TODO', pages: 'TODO'})),
  };
  fs.mkdirSync(packDir(id), {recursive: true});
  fs.writeFileSync(path.join(packDir(id), 'pack.json'), JSON.stringify(pack, null, 2) + '\n');
  for (const name of names) {
    const dir = skillDir(id, name);
    fs.mkdirSync(path.join(dir, 'references'), {recursive: true});
    fs.writeFileSync(path.join(dir, 'SKILL.md'), `---
name: ${name}
description: TODO làm gì, khi nào dùng (từ khóa tiếng Việt và tiếng Anh để agent nhận ra)
---

# TODO tiêu đề

TODO một hai câu: skill giúp việc gì. Kiến thức rút từ sách "${pack.title}" (${pack.authors.join(', ')}).

## Khi nào dùng, khi nào không

## Cách làm

## Kiểm tra trước khi xong

## Lỗi hay gặp

## Nguồn

- Sách "${pack.title}", PDF tr. TODO: TODO ý của sách.
- Phần áp dụng/diễn giải của skill: TODO.
`);
  }
  return pack;
};
