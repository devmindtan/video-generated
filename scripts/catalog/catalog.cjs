const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {parse} = require('@babel/parser');

const ROOT = path.resolve(__dirname, '../..');
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
const slug = (value) => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const inside = (root, relative) => {
  if (typeof relative !== 'string' || path.isAbsolute(relative)) throw new Error('Expected relative project path');
  const target = path.resolve(root, relative);
  if (!target.startsWith(path.resolve(root) + path.sep)) throw new Error(`Path escapes workspace: ${relative}`);
  return target;
};

function load(root = ROOT) {
  const index = read(path.join(root, 'series/catalog.json'));
  const series = index.series.map((entry) => {
    const file = inside(root, entry.path);
    const data = read(file);
    if (entry.id !== data.id || entry.channel !== data.channel) throw new Error(`Series index mismatch: ${entry.id}`);
    return {...data, file, relativeFile: entry.path};
  });
  return {root, ...index, series};
}

function registrations(root = ROOT) {
  const source = fs.readFileSync(path.join(root, 'src/projects/registry.tsx'), 'utf8');
  const ast = parse(source, {sourceType: 'module', plugins: ['typescript', 'jsx']});
  const imports = new Map();
  for (const node of ast.program.body) {
    if (node.type === 'ImportDeclaration') {
      for (const item of node.specifiers) imports.set(item.local.name, node.source.value);
    }
  }
  const records = [];
  function visit(node, folders = []) {
    if (!node || typeof node !== 'object') return;
    let next = folders;
    if (node.type === 'JSXElement') {
      const name = node.openingElement.name.name;
      const attrs = Object.fromEntries(node.openingElement.attributes.filter(a => a.type === 'JSXAttribute').map(a => [a.name.name, a.value]));
      if (name === 'Folder') {
        if (attrs.name?.type !== 'StringLiteral') throw new Error('Studio folders must have literal names');
        next = [...folders, attrs.name.value];
      }
      if (['Composition', 'Still'].includes(name)) {
        if (attrs.id?.type !== 'StringLiteral') throw new Error('Composition ID must be a literal');
        const component = attrs.component?.expression?.name;
        const project = imports.get(component)?.match(/^\.\/([^/]+)\//)?.[1];
        if (!project) throw new Error(`Cannot locate component for ${attrs.id.value}`);
        const raw = source.slice(node.start, node.end);
        records.push({id: attrs.id.value, kind: name, project, folders,
          durationFrames: attrs.durationInFrames?.expression?.value ?? null,
          fps: attrs.fps?.expression?.value ?? null, width: attrs.width?.expression?.value,
          height: attrs.height?.expression?.value, jsxSha256: hash(raw)});
      }
    }
    for (const [key, value] of Object.entries(node)) {
      if (['loc', 'start', 'end'].includes(key)) continue;
      if (Array.isArray(value)) value.forEach(v => visit(v, next));
      else if (value && typeof value === 'object') visit(value, next);
    }
  }
  visit(ast);
  return records;
}

function validate(catalog) {
  const {root} = catalog;
  if (catalog.schemaVersion !== 1) throw new Error('Unsupported catalog schema');
  const channels = new Map(), allSeries = new Set(), projects = new Map(), declared = new Map();
  for (const channel of catalog.channels) {
    if (!slug(channel.id) || channels.has(channel.id) || !/^[a-zA-Z0-9-]+$/.test(channel.studioFolder)) throw new Error(`Invalid/duplicate channel: ${channel.id}`);
    channels.set(channel.id, channel);
  }
  for (const series of catalog.series) {
    if (!slug(series.id) || allSeries.has(series.id) || !channels.has(series.channel)) throw new Error(`Invalid/duplicate series: ${series.id}`);
    if (!/^[a-zA-Z0-9-]+$/.test(series.studioFolder) || series.schemaVersion !== 1) throw new Error(`Invalid series config: ${series.id}`);
    if (!Array.isArray(series.formats) || !series.formats.length || series.formats.some(f => !['short', 'long'].includes(f))) throw new Error(`Invalid formats: ${series.id}`);
    if (series.defaultDurationSeconds != null && (!Number.isFinite(series.defaultDurationSeconds) || series.defaultDurationSeconds <= 0)) throw new Error(`Invalid default duration: ${series.id}`);
    allSeries.add(series.id);
    for (const project of series.projects) {
      if (!slug(project.id) || projects.has(project.id)) throw new Error(`Duplicate/invalid project slug: ${project.id}`);
      if (!['existing', 'planning', 'production'].includes(project.status) || !series.formats.includes(project.format)) throw new Error(`Invalid status/format: ${project.id}`);
      if (!project.title?.trim() || !Array.isArray(project.registrations)) throw new Error(`Incomplete project: ${project.id}`);
      projects.set(project.id, {series, project});
      for (const [kind, prefix] of Object.entries({source:'src/projects', scripts:'scripts/projects', docs:'docs/projects', assets:'public'})) {
        const expected = `${prefix}/${project.id}`;
        if (project.paths[kind] !== expected) throw new Error(`Noncanonical ${kind} path for ${project.id}`);
        const target = inside(root, expected);
        if (project.status !== 'planning' && !fs.existsSync(target)) throw new Error(`Missing ${kind}: ${expected}`);
      }
      for (const record of project.registrations) {
        if (declared.has(record.id) || !['Composition', 'Still'].includes(record.kind)) throw new Error(`Duplicate/invalid registration: ${record.id}`);
        declared.set(record.id, {project, series, kind: record.kind});
      }
    }
  }
  const actual = registrations(root), seen = new Set();
  for (const record of actual) {
    if (seen.has(record.id)) throw new Error(`Duplicate Studio ID: ${record.id}`);
    seen.add(record.id);
    const declaration = declared.get(record.id);
    if (!declaration || declaration.project.id !== record.project || declaration.kind !== record.kind) throw new Error(`Uncatalogued/misassigned registration: ${record.id}`);
    const expected = [channels.get(declaration.series.channel).studioFolder, declaration.series.studioFolder, record.project];
    if (JSON.stringify(record.folders) !== JSON.stringify(expected)) throw new Error(`Wrong Studio folder: ${record.id}`);
  }
  for (const id of declared.keys()) if (!seen.has(id)) throw new Error(`Catalog references missing Studio ID: ${id}`);
  for (const entry of fs.readdirSync(path.join(root, 'src/projects'), {withFileTypes:true})) {
    if (entry.isDirectory() && !projects.has(entry.name)) throw new Error(`Project folder has no series: ${entry.name}`);
  }
  for (const {project} of projects.values()) {
    if (project.status !== 'planning' && !project.registrations.some(r => r.kind === 'Composition')) throw new Error(`Production project needs a video: ${project.id}`);
  }
  return {channels: channels.size, series: allSeries.size, projects: projects.size,
    registeredCompositionsAndStills: actual.length,
    planning: [...projects.values()].filter(x => x.project.status === 'planning').length};
}

function auditMigration(root = ROOT) {
  const baseline = read(path.join(root, 'docs/architecture/series-migration-baseline.json'));
  const current = new Map(registrations(root).map(r => [r.id, r]));
  for (const record of baseline.registrations) {
    if (current.get(record.id)?.jsxSha256 !== record.jsxSha256) throw new Error(`Registration changed during migration: ${record.id}`);
  }
  if (current.size !== baseline.registrations.length) throw new Error('Migration added/removed a registration');
  for (const [file, expected] of Object.entries(baseline.protectedFiles)) {
    if (hash(fs.readFileSync(inside(root, file))) !== expected) throw new Error(`Production source changed during migration: ${file}`);
  }
  return {unchangedRegistrations: current.size, unchangedSourceFiles: Object.keys(baseline.protectedFiles).length,
    note:'One-time migration audit; legitimate future episode edits need not match this baseline.'};
}

module.exports = {ROOT, load, validate, registrations, auditMigration, inside, slug, read};
