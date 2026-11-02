# Duyệt sản xuất: Chốt ban đầu + Bản vá

Thiết kế theo yêu cầu người dùng 2026-10-31, áp dụng cho mọi series. Thay cho bốn cổng nối tiếp
(`approve-script` → `approve-voice` → `approve-assets` → `review-preview`), vốn khóa cứng theo hash: sửa một
file là cả chuỗi phía sau thành "cần duyệt lại". Cách làm thật là chốt một lần rồi vá liên tục.

## Ba trạng thái của một dự án

| Trạng thái | Nghĩa | Ai chuyển |
|---|---|---|
| **Chưa chốt** | Đang soạn gói chốt ban đầu. | — |
| **Đã chốt vN** | Gói đã được duyệt; sản xuất làm theo bản chốt mới nhất. | Người dùng bấm Chốt / chấp nhận bản vá |
| **Có bản vá chờ duyệt** | Agent đã sửa một mục sau khi chốt; chờ người dùng chấp nhận hoặc trả lại. | Agent tạo, người dùng quyết |

## 1. Chốt ban đầu (một lần duyệt)

Một màn hình, năm mục; nút **Chốt** chỉ bật khi đã xem hết từng mục.

| Mục | Nội dung | File |
|---|---|---|
| Kịch bản | Bản lời đọc đầy đủ | `docs/projects/<slug>/script.md` |
| Nhạc nền | Bài, tác giả, đoạn dùng, nghe thử | `src/projects/<slug>/music.json` (hoặc lựa chọn ghi trong `production-spec.md` khi chưa có code) |
| Giọng đọc | Lựa chọn giọng (preset/clone, pitch, tốc độ) + **một đoạn nghe mẫu**; lời đọc đầy đủ làm sau khi chốt | `scripts/projects/<slug>/voice.json` + file mẫu |
| Thông tin đã chốt | Thời lượng mục tiêu ± dao động cho phép, định dạng, kích thước, các quy tắc series đang áp dụng (chụp lại từ `workflow.json`) | `docs/projects/<slug>/production-spec.md` |
| Prompt từng cảnh | Prompt hình/animation cho từng cảnh, **chưa có ảnh**. Thiếu nhi: kế hoạch footage chuyển động thay cho ảnh tĩnh | `docs/projects/<slug>/image-prompts.md` |

Bấm Chốt ghi **bản chốt v1**: hash + bản sao của mọi file trong gói, người chốt, thời điểm, ghi chú.

**Trả lại cho agent sửa** (người dùng 2026-11-01): có mục Chưa đạt thì nút chính chuyển thành
“Trả lại cho agent sửa”. Lần trả lại được ghi vào `lockReturns` của approvals.json (ghi chú, ghi chú từng mục, hash file lúc trả); agent
đọc ở `npm run automation -- review <slug>` → `returned`, sửa các file trong gói (chưa chốt nên sửa thẳng, không cần bản vá).
Lần xem sau, mục đã sửa được so với bản đã trả lại và ghi chú cũ hiện ở đầu mục; trả lại bao nhiêu lần cũng được trước khi chốt.

Mỗi mục hiện dạng dễ đọc (nhạc nền và giọng đọc: tên bài, tác giả, âm lượng %, fade, cách chọn giọng, sự đồng ý,
cao độ, tốc độ, kèm trình nghe; JSON gốc gập lại). Mỗi mục có hai nút **Đạt** / **Chưa đạt** (người dùng 2026-11-01).
Đạt thì không cần ghi chú. Chưa đạt thì ô **chỗ chưa đạt** mới hiện và bắt buộc ghi; ô tự lưu khi gõ, còn nguyên khi
quay lại mục đó. Ghi chú là bản nháp agent đọc được ngay qua `automation review <slug>` (trường `notes`; `changedSince` =
file của mục đã đổi sau ghi chú); đổi một mục sang Đạt thì ghi chú của mục đó bị xóa. Chân hộp thoại: tất cả Đạt thì nút
chính là **Chốt ban đầu**; có mục Chưa đạt thì nút chính là **Trả lại cho agent sửa** (ô ghi chú chung, không bắt buộc,
chỉ hiện lúc này). Agent sửa tới khi mọi mục đạt. Bản vá dùng cùng cách: tất cả Đạt thì Chấp nhận, có mục Chưa đạt thì
Trả lại kèm ghi chú của mục đó.

## 2. Bản vá: xem kết quả và góp ý

Người dùng 2026-11-02: gộp "bản vá" và "duyệt từng cảnh" làm một. Bước 2 là nơi duy nhất người dùng xem agent
đã làm gì, góp ý và quyết định; không còn màn duyệt riêng từng cảnh.

- **Một bản vá gom mọi thứ cần xem của một lượt làm**: chữ đã sửa trong gói chốt (so với bản chốt) và/hoặc kết quả
  để xem, nghe (video cảnh, đoạn giọng đọc, nhạc…). Lệnh:
  `npm run automation -- patch <slug> --reason "<đã làm gì, vì sao>" [--changes <file.json>] [--clip <cảnh>]... [--media <file>[|tiêu đề]]...`
  - `--changes`: sửa ngoài tài liệu chốt (hình vẽ, xử lý âm thanh, phụ đề, nhịp) mô tả bằng lời, không cần xuất clip
    (người dùng 2026-11-02): `[{"area": "visual|audio|caption|timing|other", "where": "cảnh/phần", "what": "sửa gì", "why": "vì sao", "before": "…", "after": "…"}]`.
    Mỗi mục là một mục duyệt (khóa ghi chú `change:<n>`).
  - Lệnh so mọi file trong gói với bản chốt mới nhất (diff) và đính kèm các file kết quả.
  - `--clip <cảnh>` lấy clip mới nhất của cảnh đó: xuất trước bằng `scene-clip <slug> <cảnh> [--voice <id>]`
    (`--voice` để xuất với một take giọng khác mặc định, ví dụ take clone đang chờ chọn).
  - `--media` nhận video (mp4/webm/mov) hoặc âm thanh (wav/mp3/m4a/ogg/flac), chỉ trong `projects/<slug>/` hoặc `public/`.
  - Bản vá chỉ có kết quả (không sửa chữ) vẫn hợp lệ.
- **Trên trang quản lý**: bản vá chờ duyệt hiện đầu tiên, kèm tóm tắt bên trong có gì (“Chữ: Kịch bản · 3 video · 2 âm thanh”).
  Mở ra là danh sách mục bên trái: mỗi file chữ đã sửa, mỗi mô tả thay đổi, mỗi video, mỗi file âm thanh là một mục.
  Chữ đã sửa hiện theo từng đoạn, dưới tên phần của nó, dạng “Trước / Sau” dễ đọc (chữ thêm tô xanh, chữ bỏ gạch đỏ);
  bản so từng dòng gập lại bên dưới. Mỗi mục **Đạt** /
  **Chưa đạt** (chưa đạt thì ghi chỗ cần sửa, tự lưu). Tất cả đạt thì **Chấp nhận**; có mục chưa đạt thì
  **Trả lại cho agent sửa**.
- Chấp nhận bản vá có sửa chữ thì thành bản chốt mới (v1 → v2…). Bản vá chỉ có kết quả thì giữ nguyên bản chốt.
  Clip cảnh trong bản vá nhận theo quyết định (đạt / chưa đạt kèm ghi chú của mục đó) để lưu lịch sử của cảnh.
- Agent đọc ghi chú ở `npm run automation -- review <slug>` (trường `notes`, khóa `media:<n>` là mục kết quả thứ n),
  sửa, rồi gửi bản vá mới. Bản vá mới thay bản còn chờ (người dùng chỉ quyết bản mới nhất; ghi chú cũ đi theo).
- Sửa file trong gói mà chưa tạo bản vá: trang báo "có thay đổi chưa vào bản vá", không âm thầm coi là đã duyệt.
  File kết quả đổi sau khi gửi thì không chấp nhận được; agent gửi bản vá mới.

## 3. (Bỏ) Duyệt từng cảnh

Màn duyệt riêng từng cảnh không còn. Clip từng cảnh vẫn được xuất bằng `scene-clip` (người dùng cho phép render clip
duyệt từng cảnh; render cả video vẫn chỉ khi người dùng yêu cầu), nhưng được gửi trong bản vá. Bước nội bộ vẫn mang mã
`scene-review` để giữ lịch sử; nó đạt khi đã chốt, có ít nhất một bản vá được chấp nhận và không còn bản vá chờ.

## 4. Xem bản dựng và xuất

`review-preview` mở khi đã có bản vá được chấp nhận và không còn bản vá chờ duyệt: xem toàn bộ trong Studio. Render cả
video vẫn thủ công theo yêu cầu.

## Dữ liệu

`docs/projects/<slug>/approvals.json` (chỉ CLI/trang quản lý ghi, worker không đọc được), schema 2:

```json
{"schemaVersion": 2, "projectId": "…",
 "locks":   [{"version": 1, "files": {"<rel>": "<sha256>"}, "by": "…", "at": "…", "note": "…", "fromPatch": null}],
 "patches": [{"id": "p1", "baseVersion": 1, "changed": {"<rel>": {"before": "…", "after": "…"}}, "reason": "…",
              "media": [{"kind": "video|audio", "file": "…", "title": "…", "sha256": "…", "scene": "<cảnh, nếu là clip>"}],
              "status": "pending|accepted|returned", "createdAt": "…", "decidedAt": "…", "note": "…"}],
 "scenes":  {"<cảnh>": {"clips": [{"file": "…", "sha256": "…", "renderedAt": "…", "status": "pending|approved|needs-changes", "note": "…"}]}},
 "notes":   {"lock|<patch id>": {"<mục hoặc file>": {"text": "…", "at": "…", "by": "…", "files": {"<rel>": "<sha256>"}}}},
 "history": []}
```

`history` giữ nguyên các lần duyệt theo cổng cũ (chỉ đọc). Bản sao file đã chốt lưu ở `.automation/approved-files/<sha256>`.

## Chuyển đổi

- Dự án đang dở (`book-hvtt-001-overview`): lịch sử cũ giữ nguyên; trang quản lý mở màn Chốt ban đầu với các
  file hiện tại để người dùng chốt v1.
- Bốn cổng cũ bỏ khỏi quy trình; `run`/`apply` của runner kiểm "đã chốt" thay cho từng cổng.

## Theo dõi tiến trình (người dùng 2026-10-31)

Tab **Tiến trình** của mỗi dự án cho người dùng theo dõi trực tiếp việc agent đang làm; chỉ hiển thị, không thay đổi quy trình.

- Ngay sau khi chốt, agent phân tích gói chốt và lập kế hoạch thực hiện: `npm run automation -- progress <slug> plan --file plan.json`
  (`{summary, tasks:[{id, title, kind, weight, steps}]}`; `kind` là voice, visuals, music, assembly, clip, check hoặc other).
- Khi làm: `progress <slug> start|update|done|fail|block <việc> [--percent N | --steps 3/10] [--note "…"]`, `progress <slug> log --note "…"`.
  `scene-clip` tự báo việc "Xuất clip duyệt cảnh …". Lập lại kế hoạch giữ tiến độ của các việc cùng mã.
- % tổng = trung bình có trọng số (`weight`) của % từng việc. Mỗi thay đổi lưu ngay vào `.automation/progress/<slug>.json` (Git bỏ qua).
- Bị ngắt: việc "đang làm" mà tiến trình báo cáo đã chết, hoặc 20 phút không cập nhật, hiện là **Bị ngắt** kèm % và ghi chú cuối cùng; file không bị sửa.
- Trang tự làm mới 4 giây một lần khi tab đang mở; thẻ dự án ngoài danh sách hiện "Đang làm / Bị ngắt · x%".

