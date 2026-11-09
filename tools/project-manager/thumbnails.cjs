// Thumbnail designs of a project (user 2026-11-09): the web-designed variants an agent prepares live in
// <project source>/thumbnail-web/ with a thumbnails.json manifest; the project page's "Thumbnail" tab shows them live
// (no separate comparison page), the user picks one there, and the agent carries the pick into the Studio Still.
// Older episodes without that folder are left alone. Serving is read-only and limited to that folder (pages, styles,
// scripts, images) and to fonts/images under public/ that the pages reference as /public/...
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const PAGE_TYPES = {'.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp'};
const PUBLIC_TYPES = {'.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml'};
// The designs use inline styles and are framed by the manager itself; scripts stay same-origin files only.
const PAGE_CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'none'";

function createThumbnails(root, {catalog}) {
  const err = (message, status) => Object.assign(new Error(message), {status});
  const project = slug => {
    const p = catalog(slug);
    if (!p) throw err('Không có dự án này', 404);
    return p;
  };
  const folderOf = slug => path.join(root, project(slug).paths?.source || `src/projects/${slug}`, 'thumbnail-web');
  const manifestOf = slug => path.join(folderOf(slug), 'thumbnails.json');
  const readManifest = slug => {
    const file = manifestOf(slug);
    if (!fs.existsSync(file)) return null;
    const text = fs.readFileSync(file, 'utf8');
    return {data: JSON.parse(text), revision: crypto.createHash('sha256').update(text).digest('hex').slice(0, 16)};
  };

  // A manifest holds one design set (a long video's thumbnail: top-level variants/chosen/studioStill) or several in
  // "sets" (one per short: each with its own variants, pick and Studio Still). Sets may give their stage size
  // (width/height, default 1280×720) so the tab frames portrait covers as portrait.
  const setsOf = d => Array.isArray(d.sets) ? d.sets : [{...d, id: 'main', title: d.title || null}];

  function describe(slug, set, folder) {
    const registrations = project(slug).registrations || [];
    const variants = (set.variants || []).filter(v => typeof v.file === 'string' && !v.file.includes('/') && fs.existsSync(path.join(folder, v.file)))
      .map(v => ({id: v.id, title: v.title, summary: v.summary || '', url: `/thumb/${encodeURIComponent(slug)}/${encodeURIComponent(v.file)}`}));
    const still = registrations.find(r => r.kind === 'Still' && r.id === set.studioStill);
    const png = still && path.join(root, 'projects', slug, `${still.id}.png`);
    const exported = png && fs.existsSync(png) ? {name: path.basename(png), at: fs.statSync(png).mtime.toISOString()} : null;
    return {id: String(set.id), title: set.title || null, width: Number(set.width) || 1280, height: Number(set.height) || 720, variants,
      chosen: set.chosen || null, chosenAt: set.chosenAt || null, chosenBy: set.chosenBy || null,
      studioStill: still ? still.id : null, plannedStill: set.studioStill || null, studioVariant: set.studioVariant || null, exported};
  }

  function list(slug) {
    const m = readManifest(slug);
    if (!m) return {available: false, variants: [], sets: []};
    const folder = folderOf(slug), sets = setsOf(m.data).map(set => describe(slug, set, folder));
    // The first set's fields stay at the top level for single-thumbnail projects.
    const {id: _id, title: _title, ...first} = sets[0] || {variants: []};
    return {available: true, revision: m.revision, ...first, sets};
  }

  function choose({id, variant, set = null, revision, by = 'người dùng'}) {
    const m = readManifest(id);
    if (!m) throw err('Dự án này chưa có thiết kế thumbnail', 404);
    if (m.revision !== revision) throw err('Danh sách thumbnail vừa thay đổi. Tải lại rồi chọn lại.', 409);
    const multi = Array.isArray(m.data.sets);
    const target = multi ? m.data.sets.find(x => String(x.id) === String(set)) : m.data;
    if (!target) throw err('Không có nhóm thumbnail này', 404);
    if (!(target.variants || []).some(v => v.id === variant)) throw err('Không có phương án này', 404);
    const file = manifestOf(id), history = path.join(path.dirname(file), '.manager-history');
    fs.mkdirSync(history, {recursive: true});
    fs.copyFileSync(file, path.join(history, `thumbnails-${new Date().toISOString().replace(/[:.]/g, '-')}.json`));
    const pick = {chosen: variant, chosenAt: new Date().toISOString(), chosenBy: by};
    const next = multi ? {...m.data, sets: m.data.sets.map(x => x === target ? {...x, ...pick} : x)} : {...m.data, ...pick};
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(next, null, 2) + '\n');
    fs.renameSync(tmp, file);
    return list(id);
  }

  // GET /thumb/<slug>/<file> and /public/<path>: returns {file, type, csp} or null.
  function resolve(route) {
    let m = route.match(/^\/thumb\/([^/]+)\/([^/]+)$/);
    if (m) {
      const slug = decodeURIComponent(m[1]), name = decodeURIComponent(m[2]);
      let folder;
      try {folder = folderOf(slug);} catch {return null;}
      const file = path.join(folder, name), type = PAGE_TYPES[path.extname(name).toLowerCase()];
      if (!type || name.startsWith('.') || path.dirname(file) !== folder || !fs.existsSync(file)) return null;
      return {file, type, csp: PAGE_CSP};
    }
    m = route.match(/^\/public\/(.+)$/);
    if (m) {
      const rel = decodeURIComponent(m[1]), file = path.join(root, 'public', rel), type = PUBLIC_TYPES[path.extname(rel).toLowerCase()];
      if (!type || rel.split('/').some(p => p.startsWith('.') || p === '') || !file.startsWith(path.join(root, 'public') + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return null;
      return {file, type, csp: PAGE_CSP};
    }
    return null;
  }

  return {list, choose, resolve};
}

module.exports = {createThumbnails};
