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
function createProject(catalog, options) {
  allowed(options, ['--series', '--id', '--title', '--format', '--duration', '--book']);
  const series = catalog.series.find(s => s.id === options['--series']);
  const id = options['--id'], title = options['--title']?.trim(), format = options['--format'];
  if (!series || !slug(id) || !title || !series.formats.includes(format)) throw new Error('Require valid --series, unique --id, --title, --format short|long');
  if (catalog.series.some(s => s.projects.some(p => p.id === id))) throw new Error(`Project slug already exists: ${id}`);
  if (options['--book'] && (!slug(options['--book']) || !fs.existsSync(path.join(path.dirname(series.file), 'books', options['--book'], 'book.json')))) throw new Error('Unknown book in this series');
  const duration = options['--duration'] === undefined ?
    (series.defaultDurationSeconds ?? (series.channel === 'tam-ly-cuoc-song' && format === 'short' ? 45 : null)) : Number(options['--duration']);
  if (duration !== null && (!Number.isFinite(duration) || duration <= 0)) throw new Error('Invalid duration');
  const paths = {source:`src/projects/${id}`, scripts:`scripts/projects/${id}`, docs:`docs/projects/${id}`, assets:`public/${id}`};
  for (const relative of Object.values(paths)) if (fs.existsSync(inside(catalog.root, relative))) throw new Error(`Existing directory would be reused: ${relative}`);
  const project = {id, title, status:'planning', format, durationSeconds:duration, paths, registrations:[],
    ...(options['--book'] ? {book:options['--book']} : {})};
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
  const options = flags(rest);
  if (command === 'check') { allowed(options,[]); return validate(catalog); }
  if (command === 'audit-migration') { allowed(options,[]); return auditMigration(); }
  if (command === 'create') { validate(catalog); return createProject(catalog,options); }
  if (command === 'create-series') { validate(catalog); return createSeries(catalog,options); }
  if (command !== 'list') throw new Error('Commands: list, show, check, create, create-series, audit-migration');
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
module.exports = {main,createProject,createSeries};
