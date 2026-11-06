// Agent-independent local image generation through ComfyUI + SDXL on desktop-kndgm60.
// The GPU service is loopback-only; outputs and reproducibility manifests stay in the named project.
const fs = require('node:fs');
const path = require('node:path');
const gpu = require('../gpu-host/gpu-host.cjs');

const ROOT = path.resolve(__dirname, '../..');
const MODEL = 'sd_xl_base_1.0.safetensors';
const POLL_MS = 1000;
const TIMEOUT_MS = 20 * 60 * 1000;

function values(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (!key.startsWith('--')) throw Error(`Tham số không hợp lệ: ${key}`);
    if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) throw Error(`Thiếu giá trị cho ${key}`);
    out[key.slice(2)] = argv[++i];
  }
  return out;
}

function safeProject(project) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(project || '')) throw Error('--project chỉ nhận slug chữ thường, số và dấu gạch ngang.');
  if (!fs.existsSync(path.join(ROOT, 'src/projects', project)) && !fs.existsSync(path.join(ROOT, 'docs/projects', project))) {
    throw Error(`Không có dự án ${project}.`);
  }
  return project;
}

function safeFile(file, label) {
  if (!file) throw Error(`Thiếu ${label}.`);
  const resolved = path.resolve(ROOT, file);
  if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) throw Error(`${label} phải nằm trong repository.`);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) throw Error(`Không tìm thấy ${label}: ${file}`);
  return resolved;
}

function integer(value, fallback, min, max, label) {
  const n = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(n) || n < min || n > max) throw Error(`${label} phải là số nguyên ${min}–${max}.`);
  return n;
}

function parseGenerate(argv) {
  const o = values(argv), project = safeProject(o.project);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(o.name || '')) throw Error('--name chỉ nhận chữ thường, số và dấu gạch ngang.');
  const width = integer(o.width, 1216, 512, 1536, '--width');
  const height = integer(o.height, 704, 512, 1536, '--height');
  if (width % 64 || height % 64) throw Error('--width và --height phải chia hết cho 64.');
  return {project, name: o.name, promptFile: safeFile(o['prompt-file'], '--prompt-file'),
    negativeFile: o['negative-file'] ? safeFile(o['negative-file'], '--negative-file') : null,
    width, height, steps: integer(o.steps, 30, 1, 60, '--steps'), cfg: Number(o.cfg || 7),
    seed: integer(o.seed, Math.floor(Math.random() * 2 ** 31), 0, 2 ** 32 - 1, '--seed')};
}

function workflow(o, positive, negative) {
  return {
    '1': {class_type: 'CheckpointLoaderSimple', inputs: {ckpt_name: MODEL}},
    '2': {class_type: 'EmptyLatentImage', inputs: {width: o.width, height: o.height, batch_size: 1}},
    '3': {class_type: 'CLIPTextEncode', inputs: {text: positive, clip: ['1', 1]}},
    '4': {class_type: 'CLIPTextEncode', inputs: {text: negative, clip: ['1', 1]}},
    '5': {class_type: 'KSampler', inputs: {seed: o.seed, steps: o.steps, cfg: o.cfg, sampler_name: 'dpmpp_2m', scheduler: 'karras', denoise: 1,
      model: ['1', 0], positive: ['3', 0], negative: ['4', 0], latent_image: ['2', 0]}},
    '6': {class_type: 'VAEDecode', inputs: {samples: ['5', 0], vae: ['1', 2]}},
    '7': {class_type: 'SaveImage', inputs: {filename_prefix: `agent/${o.project}/${o.name}-${o.seed}`, images: ['6', 0]}},
  };
}

async function generateWithApi(base, o, positive, negative, fetchImpl = fetch) {
  const queued = await fetchImpl(new URL('/prompt', base), {method: 'POST', headers: {'content-type': 'application/json'},
    body: JSON.stringify({prompt: workflow(o, positive, negative), client_id: `agent-${process.pid}`})});
  if (!queued.ok) throw Error(`ComfyUI từ chối workflow (${queued.status}): ${(await queued.text()).slice(0, 500)}`);
  const promptId = (await queued.json()).prompt_id;
  if (!promptId) throw Error('ComfyUI không trả prompt_id.');
  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, POLL_MS));
    const response = await fetchImpl(new URL(`/history/${encodeURIComponent(promptId)}`, base));
    if (!response.ok) continue;
    const history = (await response.json())[promptId];
    if (!history) continue;
    if (history.status?.status_str === 'error') throw Error(`ComfyUI tạo ảnh thất bại: ${JSON.stringify(history.status.messages || []).slice(0, 1000)}`);
    const image = history.outputs?.['7']?.images?.[0];
    if (!image) continue;
    const url = new URL('/view', base);url.searchParams.set('filename', image.filename);url.searchParams.set('subfolder', image.subfolder || '');url.searchParams.set('type', image.type || 'output');
    const file = await fetchImpl(url);
    if (!file.ok) throw Error(`Không tải được ảnh từ ComfyUI (${file.status}).`);
    return {promptId, bytes: Buffer.from(await file.arrayBuffer()), remote: image};
  }
  throw Error('ComfyUI chưa hoàn tất sau 20 phút.');
}

async function generate(argv) {
  const o = parseGenerate(argv), positive = fs.readFileSync(o.promptFile, 'utf8').trim();
  const negative = o.negativeFile ? fs.readFileSync(o.negativeFile, 'utf8').trim() : 'text, letters, logo, watermark, face, deformed hands, extra fingers, duplicate person, split screen, border';
  if (!positive) throw Error('Prompt trống.');
  const choice = gpu.pick(ROOT, 'imagegen', {gpu: true});
  if (choice.machine !== 'gpu') throw Error('Tạo ảnh local cần máy GPU.');
  let started = false;
  try {
    const service = await gpu.start(ROOT, 'imagegen');started = true;
    const result = await generateWithApi(service.url, o, positive, negative);
    const dir = path.join(ROOT, 'public', o.project, 'generated');fs.mkdirSync(dir, {recursive: true});
    const image = path.join(dir, `${o.name}-${o.seed}.png`), manifest = path.join(dir, `${o.name}-${o.seed}.json`);
    fs.writeFileSync(image, result.bytes);
    fs.writeFileSync(manifest, JSON.stringify({generator: 'ComfyUI', model: MODEL, machine: 'desktop-kndgm60', promptId: result.promptId,
      prompt: positive, negativePrompt: negative, width: o.width, height: o.height, steps: o.steps, cfg: o.cfg, seed: o.seed,
      generatedAt: new Date().toISOString(), note: 'Hình nền local; chữ và bìa sách ghép bằng Remotion.'}, null, 2) + '\n');
    console.log(JSON.stringify({image: path.relative(ROOT, image), manifest: path.relative(ROOT, manifest), seed: o.seed, width: o.width, height: o.height}, null, 2));
  } finally {
    if (started) await gpu.release(ROOT, 'imagegen').catch(() => {});
  }
}

async function main() {
  const [command = 'status', ...argv] = process.argv.slice(2);
  if (command === 'generate') return generate(argv);
  if (command === 'status') return console.log(JSON.stringify((await gpu.status(ROOT)).imagegen, null, 2));
  if (command === 'start') {const state = await gpu.start(ROOT, 'imagegen', {lease: 'manual'});return console.log(`ComfyUI SDXL sẵn sàng tại ${state.url}`);}
  if (command === 'stop') {const state = await gpu.stop(ROOT, 'imagegen');return console.log(state.remote || 'Đã dừng ComfyUI SDXL.');}
  throw Error('Usage: npm run image:local -- status|start|stop|generate --project <slug> --name <id> --prompt-file <file> [--negative-file <file>] [--seed N] [--width 1216 --height 704 --steps 30 --cfg 7]');
}

module.exports = {parseGenerate, workflow, generateWithApi, MODEL};
if (require.main === module) main().catch(error => {console.error(error.message);process.exitCode = 1;});
