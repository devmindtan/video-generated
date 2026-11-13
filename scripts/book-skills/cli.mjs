#!/usr/bin/env node
// npm run book-skills -- <command>. See docs/book-skills.md.
import {checkPack, findBooks, install, listPacks, loadPack, scaffold, status, targets, uninstall} from './lib.mjs';

const [cmd, ...args] = process.argv.slice(2);
const flag = (name) => {const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined;};
const has = (name) => args.includes(`--${name}`);
const ids = () => (args[0] && !args[0].startsWith('--') ? [args[0]] : listPacks());

const usage = `Usage: npm run book-skills -- <command>
  list                                  sách có thể làm bộ skill và trạng thái từng bộ
  scaffold <book> --prefix p --skills a,b,c
                                        tạo book-skills/<book>/ với khung SKILL.md (còn TODO)
  check [book]                          kiểm tra frontmatter, nguồn trang PDF, liên kết, chép nguyên văn sách
  install [book] [--dry-run]            kiểm tra rồi chép skill vào thư mục skill toàn cục của mọi agent
  status [book]                         skill đã cài, cũ, thiếu hay trùng tên ở từng agent
  uninstall <book>                      gỡ skill do bộ này cài (chỉ thư mục có dấu .book-skill.json)
Targets: ${targets().map((t) => `${t.name}=${t.dir}`).join(', ')}`;

try {
  if (cmd === 'list') {
    const packs = new Set(listPacks());
    for (const b of findBooks()) {
      const read = b.book.chaptersTotal ? `${b.book.chaptersRead ?? 0}/${b.book.chaptersTotal} chương` : 'chưa có bản đồ chương';
      const pack = packs.has(b.id) ? `bộ skill: ${loadPack(b.id).skills.length} skill` : 'chưa có bộ skill';
      console.log(`${b.id.padEnd(30)} ${read.padEnd(16)} ${pack}`);
    }
  } else if (cmd === 'scaffold') {
    const pack = scaffold(args[0], {prefix: flag('prefix'), skills: (flag('skills') ?? '').split(',').filter(Boolean)});
    console.log(`Đã tạo book-skills/${pack.book}/ với ${pack.skills.length} skill: ${pack.skills.map((s) => s.name).join(', ')}`);
  } else if (cmd === 'check') {
    let bad = 0;
    for (const id of ids()) {
      const {errors, warnings, pack} = checkPack(id);
      console.log(`${id}: ${pack ? pack.skills.length : 0} skill, ${errors.length} lỗi, ${warnings.length} cảnh báo`);
      for (const e of errors) console.log(`  LỖI ${e}`);
      for (const w of warnings) console.log(`  chú ý ${w}`);
      bad += errors.length;
    }
    process.exitCode = bad ? 1 : 0;
  } else if (cmd === 'install') {
    for (const id of ids()) {
      const plan = install(id, {dryRun: has('dry-run')});
      const copies = plan.filter((p) => p.op === 'copy'), removed = plan.filter((p) => p.op === 'remove');
      console.log(`${has('dry-run') ? '(thử) ' : ''}${id}: ${copies.length / targets().length} skill × ${targets().length} agent`
        + (removed.length ? `, gỡ ${removed.length} skill cũ` : ''));
      for (const p of plan) console.log(`  ${p.op === 'copy' ? 'cài' : 'gỡ'} ${p.target.padEnd(9)} ${p.dest}`);
    }
  } else if (cmd === 'status') {
    const rows = status(ids());
    for (const r of rows) console.log(`${r.state.padEnd(10)} ${r.target.padEnd(9)} ${r.skill}`);
    const by = rows.reduce((a, r) => ({...a, [r.state]: (a[r.state] ?? 0) + 1}), {});
    console.log(Object.entries(by).map(([k, v]) => `${k}: ${v}`).join(', ') || 'chưa có bộ skill');
  } else if (cmd === 'uninstall') {
    if (!args[0]) throw new Error('Cần tên sách');
    const removed = uninstall(args[0]);
    console.log(`Đã gỡ ${removed.length} thư mục`);
    for (const r of removed) console.log(`  ${r.target.padEnd(9)} ${r.skill}`);
  } else {
    console.log(usage);
    process.exitCode = cmd && cmd !== 'help' ? 1 : 0;
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}
