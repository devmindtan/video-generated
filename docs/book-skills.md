# Bộ skill từ sách kỹ thuật

Người dùng 2026-11-13: với sách kỹ thuật, ngoài video tóm tắt (để người dùng xem nội dung sách) còn làm một **bộ skill
hoàn chỉnh** để các agent dùng kiến thức của sách khi phát triển hệ thống sau này. Hai việc tách hẳn nhau: bộ skill
không phụ thuộc video, kịch bản hay series. Làm xong thì cài vào thư mục skill toàn cục của mọi agent trên máy.

## Nằm ở đâu

| Thứ | Đường dẫn |
|---|---|
| Bộ skill của một sách (nguồn, có trong Git) | `book-skills/<book-id>/pack.json` + `skills/<tên-skill>/SKILL.md` + `references/*.md` |
| Công cụ | `npm run book-skills -- list|scaffold|check|install|status|uninstall` (`scripts/book-skills/`) |
| Kiểm thử công cụ | `npm run test:book-skills` (repo giả và thư mục đích tạm, không đụng máy thật) |
| Nơi cài (bản sao, mỗi thư mục có dấu `.book-skill.json`) | Claude Code `~/.claude/skills/`, Codex `~/.codex/skills/` (hoặc `$CODEX_HOME/skills`), OpenCode `~/.config/opencode/skills/` |

`BOOK_SKILLS_TARGETS="tên=/đường/dẫn,..."` đổi nơi cài (máy khác, kiểm thử).

## Quy trình cho agent

1. **Sách phải được đọc hết** theo `docs/book-pdf-workflow.md`: `book.json` có `chaptersRead == chaptersTotal`,
   `research.md` ghi theo trang. `check` từ chối bộ skill của sách chưa đọc xong hoặc đã đổi bản PDF (`sourceSha256`).
2. **Thiết kế bản đồ skill** trước khi viết: mỗi skill là **một việc** một agent làm khi phát triển phần mềm và cuốn
   sách giúp làm tốt hơn (viết spec, thiết kế lớp nghiệp vụ, ước lượng tải…), không phải một chương. Thường 3–6 skill.
   Tên tiếng Anh, chữ thường, có tiền tố của sách (`sdd-`, `webarch-`…) để không trùng skill khác trên máy.
3. `npm run book-skills -- scaffold <book-id> --prefix <p> --skills a,b,c` tạo khung, rồi viết:
   - `description` (≤ 1024 ký tự): làm gì và **khi nào dùng**, kèm từ khóa tiếng Việt lẫn tiếng Anh để agent tự nhận ra.
   - Thân SKILL.md (≤ 500 dòng) viết cho agent làm việc: khi nào dùng/không dùng, các bước, checklist trước khi xong,
     lỗi hay gặp, chỗ phải hỏi người dùng thay vì tự quyết. Chi tiết dài (mẫu, ví dụ, bảng) để trong `references/`.
   - `## Nguồn` ghi trang PDF cho từng ý của sách, và tách rõ phần nào là ý sách, phần nào là cách skill áp dụng.
4. **Viết bằng lời của mình.** `check` so mọi file với chữ của sách trong `library/books/` và báo lỗi khi có đoạn từ
   14 chữ liền trùng nguyên văn; không chép đoạn văn, không đưa đường dẫn PDF riêng hay email vào skill. Con số và case
   study của tác giả ghi đúng là kinh nghiệm của tác giả; tên lệnh/công cụ trong sách ghi là "tại thời điểm viết sách,
   kiểm tra tài liệu chính thức".
5. Viết cho mọi agent: không dựa vào công cụ riêng của một agent, không giả định dự án này (Remotion, video).
6. `npm run book-skills -- check <book-id>` đến khi 0 lỗi, rồi `install <book-id>` (cài vào cả ba agent) và
   `status <book-id>` để xác nhận. `install` lập kế hoạch trước và không đổi gì nếu một thư mục đích cùng tên không phải
   của bộ này; skill đã bỏ khỏi `pack.json` thì được gỡ khỏi máy.
7. Commit `book-skills/<book-id>/` (một commit cho mỗi bộ). Sửa skill về sau: sửa trong `book-skills/`, `check`,
   `install` lại (`status` báo `outdated` khi bản cài cũ hơn nguồn).

## Không làm

- Không sửa skill trực tiếp trong thư mục toàn cục: bản cài sẽ bị ghi đè ở lần `install` sau.
- Không xóa hay ghi đè skill toàn cục không có dấu `.book-skill.json` (skill của người khác, symlink của OpenCode).
- Không dùng dịch vụ trả phí hay gửi nội dung sách ra ngoài để viết skill.
