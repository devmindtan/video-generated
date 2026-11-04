// Channel profiles on social platforms: name, handle, link, description and images per platform, kept in
// series/<channel>/channel.json. Metadata only: nothing here logs in to, fetches from or posts to a platform.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {load, slug} = require('../../scripts/catalog/catalog.cjs');

const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const PLATFORMS = {youtube: 'YouTube', tiktok: 'TikTok', facebook: 'Facebook', instagram: 'Instagram', threads: 'Threads', x: 'X', zalo: 'Zalo', website: 'Website', other: 'Khác'};
const LIMITS = {name: 120, handle: 80, url: 500, description: 5000, notes: 2000};
const IMAGE_KINDS = ['avatar', 'banner'];
const IMAGE_FILE = /^[a-f0-9]{64}\.(png|jpg|webp)$/;
const MAX_IMAGE = 8 * 1024 * 1024;

function conflict() {
  return Object.assign(new Error('Hồ sơ kênh vừa được sửa ở nơi khác. Hãy tải lại trang.'), {status: 409});
}
function text(value, field, required = false) {
  const v = typeof value === 'string' ? value.trim() : value == null ? '' : null;
  if (v === null) throw new Error('Dữ liệu không hợp lệ');
  if (required && !v) throw new Error('Cần nhập tên kênh');
  if (v.length > LIMITS[field]) throw new Error(`Tối đa ${LIMITS[field]} ký tự cho ${field === 'name' ? 'tên kênh' : field === 'description' ? 'mô tả' : field === 'notes' ? 'ghi chú' : field === 'url' ? 'link' : 'tên người dùng'}`);
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(v)) throw new Error('Dữ liệu có ký tự điều khiển');
  return v;
}
function link(value) {
  const v = text(value, 'url');
  if (!v) return '';
  let parsed;
  try {parsed = new URL(v);} catch {throw new Error('Link cần bắt đầu bằng https:// hoặc http://');}
  if (!['https:', 'http:'].includes(parsed.protocol) || !parsed.hostname) throw new Error('Link cần bắt đầu bằng https:// hoặc http://');
  return parsed.href;
}
function imageExtension(data) {
  if (data.length >= 33 && data.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) && data.toString('ascii', 12, 16) === 'IHDR') return 'png';
  if (data.length >= 4 && data[0] === 255 && data[1] === 216 && data[2] === 255 && data[data.length - 2] === 255 && data[data.length - 1] === 217) return 'jpg';
  if (data.length >= 20 && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  throw new Error('Chỉ nhận ảnh JPG, PNG hoặc WebP hợp lệ');
}

function createChannels(root) {
  const base = fs.realpathSync(root);
  function folderOf(id) {
    if (!slug(id)) throw new Error('Invalid channel');
    const channel = load(root).channels.find(c => c.id === id);
    if (!channel) throw new Error('Channel not found');
    const folder = path.join(base, 'series', id);
    if (fs.existsSync(folder) && (fs.lstatSync(folder).isSymbolicLink() || !fs.realpathSync(folder).startsWith(base + path.sep))) throw new Error('Invalid channel folder');
    return {channel, folder, file: path.join(folder, 'channel.json'), assets: path.join(folder, 'channel-assets')};
  }
  function readRaw(file) {
    if (!fs.existsSync(file)) return '';
    if (fs.lstatSync(file).isSymbolicLink()) throw new Error('Invalid channel profile path');
    return fs.readFileSync(file, 'utf8');
  }
  function parse(raw, id) {
    const data = raw ? JSON.parse(raw) : {schemaVersion: 1, channel: id, platforms: []};
    if (!Array.isArray(data.platforms)) throw new Error('channel.json cần có danh sách platforms');
    return data;
  }
  function view(id) {
    const {channel, file} = folderOf(id), raw = readRaw(file), data = parse(raw, id);
    return {channel: id, title: channel.title, file: path.relative(base, file), revision: digest(raw), platformNames: PLATFORMS, limits: LIMITS, platforms: data.platforms};
  }
  // Every write rereads the file, refuses a stale revision and keeps the previous text in .manager-history/.
  function commit(id, revision, change) {
    const {folder, file} = folderOf(id), before = readRaw(file);
    if (digest(before) !== revision) throw conflict();
    const data = parse(before, id);
    change(data);
    data.schemaVersion = 1;data.channel = id;
    const next = JSON.stringify(data, null, 2) + '\n';
    fs.mkdirSync(folder, {recursive: true});
    if (before) {
      const history = path.join(folder, '.manager-history');fs.mkdirSync(history, {recursive: true});
      fs.writeFileSync(path.join(history, `channel-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.json`), before, {flag: 'wx'});
    }
    const temp = path.join(folder, `.channel-${crypto.randomBytes(8).toString('hex')}.tmp`);
    fs.writeFileSync(temp, next, {flag: 'wx'});
    if (digest(readRaw(file)) !== revision) {fs.unlinkSync(temp);throw conflict();}
    fs.renameSync(temp, file);
    return view(id);
  }
  function saveChannelPlatform(body) {
    const p = body?.platform || {};
    if (!PLATFORMS[p.platform]) throw new Error('Chọn một nền tảng');
    const fields = {platform: p.platform, name: text(p.name, 'name', true), handle: text(p.handle, 'handle'), url: link(p.url), description: text(p.description, 'description'), notes: text(p.notes, 'notes')};
    let saved;
    const result = commit(body.channel, body.revision, data => {
      if (p.id) {
        const item = data.platforms.find(x => x.id === p.id);
        if (!item) throw conflict();
        Object.assign(item, fields, {updatedAt: new Date().toISOString()});saved = item.id;
      } else {
        if (data.platforms.length >= 30) throw new Error('Tối đa 30 nền tảng cho một kênh');
        saved = `${p.platform}-${crypto.randomBytes(3).toString('hex')}`;
        data.platforms.push({id: saved, ...fields, avatar: null, banner: null, updatedAt: new Date().toISOString()});
      }
    });
    return {...result, saved};
  }
  function deleteChannelPlatform(body) {
    return commit(body.channel, body.revision, data => {
      const before = data.platforms.length;
      data.platforms = data.platforms.filter(x => x.id !== body.id);
      if (data.platforms.length === before) throw conflict();
    });
  }
  function moveChannelPlatform(body) {
    return commit(body.channel, body.revision, data => {
      const i = data.platforms.findIndex(x => x.id === body.id), j = i + (body.direction === 'up' ? -1 : 1);
      if (i < 0) throw conflict();
      if (j < 0 || j >= data.platforms.length) return;
      [data.platforms[i], data.platforms[j]] = [data.platforms[j], data.platforms[i]];
    });
  }
  // Images are stored once by content hash (older ones stay, like book covers); the profile points at the current one.
  async function uploadChannelImage(id, platformId, kind, revision, request) {
    if (!IMAGE_KINDS.includes(kind)) throw new Error('Loại ảnh không hợp lệ');
    const {assets} = folderOf(id);
    if (digest(readRaw(folderOf(id).file)) !== revision) throw conflict();
    let bytes = 0;const chunks = [];
    for await (const chunk of request) {bytes += chunk.length;if (bytes > MAX_IMAGE) throw new Error('Ảnh tối đa 8 MB');chunks.push(chunk);}
    const data = Buffer.concat(chunks), name = digest(data) + '.' + imageExtension(data);
    if (fs.existsSync(assets) && fs.lstatSync(assets).isSymbolicLink()) throw new Error('Invalid channel image folder');
    fs.mkdirSync(assets, {recursive: true});
    try {fs.writeFileSync(path.join(assets, name), data, {flag: 'wx'});} catch (e) {if (e.code !== 'EEXIST') throw e;}
    return commit(id, revision, profile => {
      const item = profile.platforms.find(x => x.id === platformId);
      if (!item) throw conflict();
      item[kind] = name;item.updatedAt = new Date().toISOString();
    });
  }
  function removeChannelImage(body) {
    if (!IMAGE_KINDS.includes(body.kind)) throw new Error('Loại ảnh không hợp lệ');
    return commit(body.channel, body.revision, data => {
      const item = data.platforms.find(x => x.id === body.id);
      if (!item) throw conflict();
      item[body.kind] = null;item.updatedAt = new Date().toISOString();
    });
  }
  function channelImage(id, name) {
    if (!IMAGE_FILE.test(String(name || ''))) return null;
    const {assets} = folderOf(id), file = path.join(assets, name);
    if (!fs.existsSync(file) || fs.lstatSync(file).isSymbolicLink() || !fs.statSync(file).isFile()) return null;
    if (!fs.realpathSync(file).startsWith(base + path.sep)) return null;
    return file;
  }
  return {channelProfile: view, saveChannelPlatform, deleteChannelPlatform, moveChannelPlatform, uploadChannelImage, removeChannelImage, channelImage};
}
module.exports = {createChannels, PLATFORMS};
