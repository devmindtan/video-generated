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

  function list(slug) {
    const m = readManifest(slug);
    if (!m) return {available: false, variants: []};
    const d = m.data, folder = folderOf(slug);
    const variants = (d.variants || []).filter(v => typeof v.file === 'string' && !v.file.includes('/') && fs.existsSync(path.join(folder, v.file)))
      .map(v => ({id: v.id, title: v.title, summary: v.summary || '', url: `/thumb/${encodeURIComponent(slug)}/${encodeURIComponent(v.file)}`}));
    const still = (project(slug).registrations || []).find(r => r.kind === 'Still' && r.id === d.studioStill);
    const png = still && path.join(root, 'projects', slug, `${still.id}.png`);
    const exported = png && fs.existsSync(png) ? {name: path.basename(png), at: fs.statSync(png).mtime.toISOString()} : null;
    return {available: true, revision: m.revision, variants, chosen: d.chosen || null, chosenAt: d.chosenAt || null, chosenBy: d.chosenBy || null,
      studioStill: still ? still.id : null, studioVariant: d.studioVariant || null, exported};
  }

  function choose({id, variant, revision, by = 'người dùng'}) {
    const m = readManifest(id);
    if (!m) throw err('Dự án này chưa có thiết kế thumbnail', 404);
    if (m.revision !== revision) throw err('Danh sách thumbnail vừa thay đổi. Tải lại rồi chọn lại.', 409);
    if (!(m.data.variants || []).some(v => v.id === variant)) throw err('Không có phương án này', 404);
    const file = manifestOf(id), history = path.join(path.dirname(file), '.manager-history');
    fs.mkdirSync(history, {recursive: true});
    fs.copyFileSync(file, path.join(history, `thumbnails-${new Date().toISOString().replace(/[:.]/g, '-')}.json`));
    const next = {...m.data, chosen: variant, chosenAt: new Date().toISOString(), chosenBy: by};
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
