# Duyệt sản xuất: Chốt ban đầu + Bản vá + Duyệt từng cảnh

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

Mỗi mục hiện dạng dễ đọc (nhạc nền và giọng đọc: tên bài, tác giả, âm lượng %, fade, cách chọn giọng, sự đồng ý,
cao độ, tốc độ, kèm trình nghe; JSON gốc gập lại). Dưới mỗi mục có ô **ghi chú cho mục này**: tự lưu khi gõ,
còn nguyên khi quay lại mục đó, rail đánh dấu "có ghi chú". Ghi chú là bản nháp agent đọc được ngay qua
`automation review <slug>` (trường `notes`, kể cả khi chưa chốt; `changedSince` = file của mục đã đổi sau ghi
chú). Khi chốt, ghi chú vào bản chốt (`itemNotes`); agent xử lý chúng qua bản vá. Bản vá cũng có ghi chú từng
file; trả lại chỉ cần ghi chú chung hoặc ghi chú ở một mục.

## 2. Bản vá (chỉnh sửa trong quá trình làm)

- Sau khi chốt, agent sửa một mục rồi tạo bản vá: `npm run automation -- patch <slug> --reason "<lý do>"`.
  Lệnh so mọi file trong gói với bản chốt mới nhất, ghi mục nào đổi (diff), trạng thái **chờ duyệt**.
- Người dùng mở bản vá trên trang quản lý, xem so sánh với bản chốt, rồi **Chấp nhận** (thành bản chốt mới:
  v1 → v2…) hoặc **Trả lại** kèm ghi chú (agent sửa tiếp, tạo bản vá mới).
- Sửa file mà chưa tạo bản vá: trang quản lý báo "có thay đổi chưa vào bản vá", không âm thầm coi là đã duyệt.
- Không chặn cả chuỗi như trước: các phần khác vẫn làm tiếp. Bản xem cuối cần không còn bản vá chờ duyệt.

## 3. Duyệt từng cảnh

- **Cảnh** = một phần có giọng đọc riêng: video dài sách là các composition phần (`BookHvttMoChuyen`,
  `BookHvttCuonSach`, …); Short là các cảnh trong `story.json`.
- Cảnh nào xong (ảnh/animation + giọng) thì agent **xuất video riêng của cảnh đó** để duyệt:
  `npm run automation -- scene-clip <slug> <cảnh>` → `projects/<slug>/review/<cảnh>.mp4`. Người dùng cho phép
  render clip duyệt từng cảnh; render cả video vẫn chỉ làm khi người dùng yêu cầu.
- Trang quản lý hiện từng clip, mỗi cảnh có ô ghi chú và hai nút **Đạt** / **Chưa đạt**. Agent đọc ghi chú
  (`automation status`), sửa, xuất lại clip; clip cũ giữ lại để so sánh. Clip hết hiệu lực khi cảnh đó đổi.

## 4. Xem bản dựng và xuất

`review-preview` mở khi mọi cảnh **Đạt** và không còn bản vá chờ duyệt: xem toàn bộ trong Studio. Render cả
video vẫn thủ công theo yêu cầu.

## Dữ liệu

`docs/projects/<slug>/approvals.json` (chỉ CLI/trang quản lý ghi, worker không đọc được), schema 2:

```json
{"schemaVersion": 2, "projectId": "…",
 "locks":   [{"version": 1, "files": {"<rel>": "<sha256>"}, "by": "…", "at": "…", "note": "…", "fromPatch": null}],
 "patches": [{"id": "p1", "baseVersion": 1, "changed": {"<rel>": {"before": "…", "after": "…"}}, "reason": "…",
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

