const fs = require('node:fs');
const path = require('node:path');
const {ROOT, load, validate, auditMigration, inside, slug} = require('./catalog.cjs');

function flags(argv) {
  const values = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (!key.startsWith('--') || !argv[i+1] || argv[i+1].startsWith('--') || key in values) throw new Error(`Expected --option value: ${key}`);
    values[key] = argv[++i];
  }
  return values;
}
function allowed(options, keys) {
  for (const key of Object.keys(options)) if (!keys.includes(key)) throw new Error(`Unknown option: ${key}`);
}
function atomicJson(file, value) {
  const temp = file + '.tmp-' + process.pid;
  fs.writeFileSync(temp, JSON.stringify(value, null, 2) + '\n', {flag:'wx'});
  fs.renameSync(temp, file);
}
function cleanSeries(series) {
  const {file, relativeFile, ...value} = series;
  return value;
}
const UNTITLED = /^chua-dat-ten(?:-(\d+))?$/;
const pascal = id => id.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join('');
function taken(catalog, id) {
  return catalog.series.some(s => s.projects.some(p => p.id === id)) ||
    ['src/projects', 'scripts/projects', 'docs/projects', 'public'].some(prefix => fs.existsSync(inside(catalog.root, `${prefix}/${id}`)));
}
function untitledId(catalog) {
  for (let n = 1; ; n++) if (!taken(catalog, `chua-dat-ten-${n}`)) return `chua-dat-ten-${n}`;
}
function createProject(catalog, options) {
  allowed(options, ['--series', '--id', '--title', '--format', '--duration', '--book']);
  const series = catalog.series.find(s => s.id === options['--series']);
  let id = options['--id']?.trim() || '', title = options['--title']?.trim() || '';
  const format = options['--format'], autoNamed = !title;
  // No title: a temporary name the agent replaces with `projects rename` once the content is known.
  if (autoNamed) { id ||= untitledId(catalog); title = `Chưa đặt tên ${id.match(UNTITLED)?.[1] || ''}`.trim(); }
  if (!series || !slug(id) || !series.formats.includes(format)) throw new Error('Require valid --series, unique --id (or an empty --title for a temporary name), --format short|long');
  if (catalog.series.some(s => s.projects.some(p => p.id === id))) throw new Error(`Project slug already exists: ${id}`);
  if (options['--book'] && (!slug(options['--book']) || !fs.existsSync(path.join(path.dirname(series.file), 'books', options['--book'], 'book.json')))) throw new Error('Unknown book in this series');
  const duration = options['--duration'] === undefined ?
    (series.defaultDurationSeconds ?? (series.channel === 'tam-ly-cuoc-song' && format === 'short' ? 45 : null)) : Number(options['--duration']);
  if (duration !== null && (!Number.isFinite(duration) || duration <= 0)) throw new Error('Invalid duration');
  const paths = {source:`src/projects/${id}`, scripts:`scripts/projects/${id}`, docs:`docs/projects/${id}`, assets:`public/${id}`};
  for (const relative of Object.values(paths)) if (fs.existsSync(inside(catalog.root, relative))) throw new Error(`Existing directory would be reused: ${relative}`);
  const project = {id, title, status:'planning', format, durationSeconds:duration, paths, registrations:[],
    ...(options['--book'] ? {book:options['--book']} : {}), ...(autoNamed ? {autoNamed:true} : {})};
  // Planning creates documents only: no synthetic composition, voice, image, render or API call.
  const directory = inside(catalog.root, paths.docs);
  fs.mkdirSync(directory, {recursive:true});
  fs.writeFileSync(path.join(directory, 'brief.md'), `# ${title}\n\n- Kênh: ${series.channel}\n- Series: ${series.id}\n- Project ID: ${id}\n- Định dạng: ${format}\n- Thời lượng: ${duration === null ? 'chưa duyệt' : duration + ' giây'}\n- Trạng thái: planning, chưa có composition/asset/giọng.\n\n## Nội dung\n\nChưa viết; cần duyệt mục tiêu, dàn ý và kịch bản trước sản xuất.\n\n## Nguồn và kiểm chứng\n\n${options['--book'] ? 'Sách: ' + options['--book'] + '. Đọc hồ sơ nghiên cứu của sách trong series; ghi source SHA/chương/PDF page.' : 'Ghi nguồn khi sử dụng kiến thức hoặc trích dẫn.'}\n\n## Hoàn thành\n\n- [ ] Mục tiêu/dàn ý/kịch bản đã duyệt\n- [ ] Code, scripts, asset trong các đường dẫn chuẩn\n- [ ] Đăng ký literal Composition/Still trong đúng Studio Folder; cập nhật registrations và status trong series.json\n- [ ] Caption/thumbnail typography, âm nhạc có tác giả, QA timing và nghe duyệt\n- [ ] Không render tự động\n`, {flag:'wx'});
  try {
    atomicJson(series.file, {...cleanSeries(series), projects:[...series.projects, project]});
  } catch (error) {
    // Preserve the reviewable brief on write failure; never delete unrelated directories.
    throw new Error(`Brief preserved at ${directory}; catalog save failed: ${error.message}`);
  }
  return project;
}

const TEXT = new Set(['.tsx', '.ts', '.json', '.py', '.md', '.cjs', '.mjs', '.js', '.txt', '.srt', '.html', '.css']);
function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, {withFileTypes:true}).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isSymbolicLink() ? [] : entry.isDirectory() ? walk(file) : [file];
  });
}
function renameProject(catalog, oldId, options) {
  allowed(options, ['--id', '--title']);
  const series = catalog.series.find(s => s.projects.some(p => p.id === oldId));
  if (!series) throw new Error(`Unknown project: ${oldId}`);
  const project = series.projects.find(p => p.id === oldId);
  // Only temporary names move: settled slugs, paths and Studio IDs stay stable.
  if (!project.autoNamed && !UNTITLED.test(oldId)) throw new Error(`${oldId} already has a real name; only temporary (Chưa đặt tên) projects can be renamed`);
  const id = options['--id'] || oldId, title = options['--title']?.trim();
  if (!slug(id) || !title || UNTITLED.test(id)) throw new Error('Require --title and a descriptive --id slug');
  if (id !== oldId && taken(catalog, id)) throw new Error(`Project slug or directory already exists: ${id}`);
  const slugPattern = new RegExp(`(?<![A-Za-z0-9-])${oldId}(?![A-Za-z0-9]|-[A-Za-z0-9])`, 'g');
  const pascalPattern = new RegExp(`(?<![A-Za-z0-9])${pascal(oldId)}(?![a-z0-9])`, 'g');
  const swap = text => id === oldId ? text : text.replace(slugPattern, id).replace(pascalPattern, pascal(id));
  const moves = Object.entries(project.paths).map(([kind, relative]) => [inside(catalog.root, relative), inside(catalog.root, relative.replace(slugPattern, id))]);
  // Plan every rewrite before touching disk. approvals.json is hash-bound and never rewritten.
  const rewrites = new Map();
  for (const [from, to] of moves) for (const file of walk(from)) {
    if (!TEXT.has(path.extname(file)) || path.basename(file) === 'approvals.json' || fs.statSync(file).size > 2 * 1024 * 1024) continue;
    const text = fs.readFileSync(file, 'utf8');
    let next = swap(text);
    if (file === path.join(inside(catalog.root, project.paths.docs), 'brief.md')) next = next.replace(/^# .*$/m, `# ${title}`);
    if (next !== text) rewrites.set(path.join(to, path.relative(from, file)), next);
  }
  const shared = ['src/projects/registry.tsx', 'package.json'].map(relative => inside(catalog.root, relative))
    .filter(file => fs.existsSync(file)).map(file => [file, fs.readFileSync(file, 'utf8')]).filter(([, text]) => swap(text) !== text);
  for (const [from, to] of moves) if (fs.existsSync(from)) fs.renameSync(from, to);
  for (const [file, text] of rewrites) fs.writeFileSync(file, text);
  for (const [file, text] of shared) fs.writeFileSync(file, swap(text));
  const {autoNamed, ...rest} = project;
  const renamed = JSON.parse(swap(JSON.stringify({...rest, id: oldId}))); renamed.id = id; renamed.title = title;
  atomicJson(series.file, {...cleanSeries(series), projects: series.projects.map(p => p.id === oldId ? renamed : p)});
  return {from: oldId, ...renamed, rewrittenFiles: rewrites.size, sharedFiles: shared.map(([file]) => path.relative(catalog.root, file))};
}
function createSeries(catalog, options) {
  allowed(options, ['--channel', '--id', '--title', '--formats']);
  const channel = options['--channel'], id = options['--id'], title = options['--title']?.trim();
  const formats = [...new Set((options['--formats'] || '').split(','))];
  if (!catalog.channels.some(c => c.id === channel) || !slug(id) || !title || formats.some(f => !['short','long'].includes(f))) throw new Error('Require --channel, unique --id, --title, --formats short,long');
  if (catalog.series.some(s => s.id === id)) throw new Error(`Series already exists: ${id}`);
  const relative = `series/${channel}/${id}/series.json`, file = inside(catalog.root, relative);
  const dir = path.dirname(file);
  if (fs.existsSync(dir)) throw new Error(`Directory exists: ${dir}`);
  fs.mkdirSync(dir, {recursive:true});
  fs.writeFileSync(file, JSON.stringify({schemaVersion:1,id,channel,title,studioFolder:id,formats,
    defaultDurationSeconds:null,summary:'Chưa duyệt mục tiêu series.',projects:[]}, null, 2)+'\n', {flag:'wx'});
  fs.writeFileSync(path.join(dir,'README.md'), `# ${title}\n\nHồ sơ: [series.json](series.json). Chưa có tập sản xuất.\n\nChốt mục tiêu, đối tượng và workflow trước khi thêm tập.\n`, {flag:'wx'});
  const {series, root, ...index} = catalog;
  atomicJson(path.join(catalog.root,'series/catalog.json'), {...index,series:[...series.map(s => ({id:s.id,channel:s.channel,path:s.relativeFile})),{id,channel,path:relative}]});
  return {id,channel,path:relative};
}

function main(argv = process.argv.slice(2)) {
  const [command = 'list', ...rest] = argv;
  const catalog = load();
  if (command === 'show') {
    if (rest.length !== 1) throw new Error('Use projects show <slug>');
    for (const series of catalog.series) {
      const project = series.projects.find(p => p.id === rest[0]);
      if (project) return {...project,channel:series.channel,series:series.id,
        studio:project.registrations.map(r=>({id:r.id,url:`http://localhost:3000/${r.id}`}))};
    }
    throw new Error(`Unknown project: ${rest[0]}`);
  }
  if (command === 'rename') {
    if (!rest[0] || rest[0].startsWith('--')) throw new Error("Use projects rename <slug> --id <new-slug> --title '<Tên>'");
    validate(catalog); const result = renameProject(catalog, rest[0], flags(rest.slice(1))); validate(load()); return result;
  }
  const options = flags(rest);
  if (command === 'check') { allowed(options,[]); return validate(catalog); }
  if (command === 'audit-migration') { allowed(options,[]); return auditMigration(); }
  if (command === 'create') { validate(catalog); return createProject(catalog,options); }
  if (command === 'create-series') { validate(catalog); return createSeries(catalog,options); }
  if (command !== 'list') throw new Error('Commands: list, show, check, create, rename, create-series, audit-migration');
  allowed(options, ['--channel','--series']);
  if (options['--channel'] && !catalog.channels.some(c=>c.id===options['--channel'])) throw new Error('Unknown channel');
  if (options['--series'] && !catalog.series.some(s=>s.id===options['--series'])) throw new Error('Unknown series');
  return catalog.series.filter(s => (!options['--channel'] || s.channel===options['--channel']) && (!options['--series'] || s.id===options['--series']))
    .map(s=>({channel:s.channel,series:s.id,title:s.title,config:s.relativeFile,
      projects:s.projects.map(p=>({id:p.id,title:p.title,status:p.status,format:p.format}))}));
}

if (require.main === module) {
  try { console.log(JSON.stringify(main(), null, 2)); }
  catch (error) { console.error(`projects: ${error.message}`); process.exitCode = 1; }
}
module.exports = {main,createProject,renameProject,createSeries};
