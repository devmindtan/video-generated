// node --test scripts/book-skills/book-skills.test.mjs — runs on a fixture repo and temporary target folders, never
// on the real book-skills/ or the real global skill folders.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'book-skills-'));
const repo = path.join(tmp, 'repo');
const tA = path.join(tmp, 'agentA'), tB = path.join(tmp, 'agentB');
process.env.BOOK_SKILLS_REPO = repo;
process.env.BOOK_SKILLS_TARGETS = `a=${tA},b=${tB}`;
const lib = await import('./lib.mjs');
test.after(() => fs.rmSync(tmp, {recursive: true, force: true}));

const write = (p, text) => {fs.mkdirSync(path.dirname(p), {recursive: true}); fs.writeFileSync(p, text);};
const BOOK_TEXT = 'Khi có gì sai thì sửa spec trước rồi mới sửa code vì spec là nơi con người thống nhất ý định với nhau mỗi ngày làm việc';
write(path.join(repo, 'series/c/s/books/demo/book.json'), JSON.stringify({id: 'demo', title: 'Demo', authors: ['A'],
  sourceSha256: 'abc', chaptersRead: 2, chaptersTotal: 2}));
write(path.join(repo, 'library/books/demo/current.json'), JSON.stringify({edition: 'e1'}));
write(path.join(repo, 'library/books/demo/e1/pages/00007.txt'), BOOK_TEXT);

const skillText = (name, body = 'Viết spec trước, sửa spec trước khi sửa code.') => `---
name: ${name}
description: Viết spec trước khi để AI viết code; write a spec first.
---

# Demo

${body}

Xem [mẫu](references/mau.md).

## Nguồn

- Sách "Demo", PDF tr. 7: ý chính.
`;
const makePack = (skills = ['demo-a']) => {
  fs.rmSync(path.join(repo, 'book-skills'), {recursive: true, force: true});
  lib.scaffold('demo', {prefix: 'demo', skills});
  const pack = lib.loadPack('demo');
  pack.skills = pack.skills.map((s) => ({...s, purpose: 'viết spec', pages: '7'}));
  write(path.join(repo, 'book-skills/demo/pack.json'), JSON.stringify(pack));
  for (const s of skills) {
    write(path.join(repo, `book-skills/demo/skills/${s}/SKILL.md`), skillText(s));
    write(path.join(repo, `book-skills/demo/skills/${s}/references/mau.md`), '# Mẫu\n');
  }
};

test('scaffold leaves TODOs that check rejects', () => {
  fs.rmSync(path.join(repo, 'book-skills'), {recursive: true, force: true});
  lib.scaffold('demo', {prefix: 'demo', skills: ['viet-spec']});
  const {errors} = lib.checkPack('demo');
  assert.ok(errors.some((e) => e.includes('TODO')));
  assert.throws(() => lib.scaffold('demo', {prefix: 'demo', skills: ['x']}), /Đã có/);
});

test('a clean pack passes; copied book text, missing pages and broken links fail', () => {
  makePack();
  assert.deepEqual(lib.checkPack('demo').errors, []);
  const file = path.join(repo, 'book-skills/demo/skills/demo-a/SKILL.md');
  fs.writeFileSync(file, skillText('demo-a', BOOK_TEXT));
  assert.ok(lib.checkPack('demo').errors.some((e) => /chép nguyên văn sách \(PDF 7\)/.test(e)));
  fs.writeFileSync(file, skillText('demo-a').replace('PDF tr. 7', 'chương 1'));
  assert.ok(lib.checkPack('demo').errors.some((e) => /chưa ghi trang PDF/.test(e)));
  fs.writeFileSync(file, skillText('demo-a').replace('references/mau.md', 'references/khong-co.md'));
  assert.ok(lib.checkPack('demo').errors.some((e) => /liên kết hỏng/.test(e)));
  fs.writeFileSync(file, skillText('demo-a').replace('name: demo-a', 'name: other'));
  assert.ok(lib.checkPack('demo').errors.some((e) => /trùng tên thư mục/.test(e)));
});

test('an unfinished reading or a changed book edition blocks the pack', () => {
  makePack();
  const bookFile = path.join(repo, 'series/c/s/books/demo/book.json');
  const book = JSON.parse(fs.readFileSync(bookFile, 'utf8'));
  fs.writeFileSync(bookFile, JSON.stringify({...book, chaptersRead: 1, sourceSha256: 'zzz'}));
  const {errors} = lib.checkPack('demo');
  assert.ok(errors.some((e) => /1\/2 chương/.test(e)));
  assert.ok(errors.some((e) => /sourceSha256/.test(e)));
  fs.writeFileSync(bookFile, JSON.stringify(book));
});

test('install copies into every target, status tracks edits, removed skills are cleaned up', () => {
  makePack(['demo-a', 'demo-b']);
  lib.install('demo');
  for (const t of [tA, tB]) for (const s of ['demo-a', 'demo-b']) {
    assert.ok(fs.existsSync(path.join(t, s, 'SKILL.md')));
    assert.equal(JSON.parse(fs.readFileSync(path.join(t, s, lib.MARKER), 'utf8')).pack, 'demo');
  }
  assert.ok(lib.status(['demo']).every((r) => r.state === 'installed'));
  fs.appendFileSync(path.join(repo, 'book-skills/demo/skills/demo-a/SKILL.md'), '\nThêm một dòng.\n');
  assert.equal(lib.status(['demo']).filter((r) => r.state === 'outdated').length, 2);
  makePack(['demo-a']);
  lib.install('demo');
  assert.ok(!fs.existsSync(path.join(tA, 'demo-b')) && !fs.existsSync(path.join(tB, 'demo-b')));
  assert.ok(lib.status(['demo']).every((r) => r.state === 'installed'));
});

test('install refuses to overwrite a skill it does not own and changes nothing', () => {
  makePack(['demo-a', 'demo-c']);
  write(path.join(tB, 'demo-c', 'SKILL.md'), 'someone else');
  const before = fs.readFileSync(path.join(tA, 'demo-a', 'SKILL.md'), 'utf8');
  fs.appendFileSync(path.join(repo, 'book-skills/demo/skills/demo-a/SKILL.md'), '\nĐổi.\n');
  assert.throws(() => lib.install('demo'), /trùng tên/);
  assert.equal(fs.readFileSync(path.join(tA, 'demo-a', 'SKILL.md'), 'utf8'), before);
  assert.ok(!fs.existsSync(path.join(tA, 'demo-c')));
  assert.ok(lib.status(['demo']).some((r) => r.state === 'conflict'));
});

test('uninstall removes only folders carrying this pack marker', () => {
  write(path.join(tA, 'unrelated', 'SKILL.md'), 'keep');
  const removed = lib.uninstall('demo');
  assert.ok(removed.length >= 2);
  assert.ok(fs.existsSync(path.join(tA, 'unrelated', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(tB, 'demo-c', 'SKILL.md')));
  assert.ok(!fs.existsSync(path.join(tA, 'demo-a')));
});
