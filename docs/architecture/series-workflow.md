# Tổ chức kênh, series và tập

## Quyền sở hữu dữ liệu

```text
series/
  catalog.json                     # kênh và đường dẫn series
  tam-ly-cuoc-song/
    self-help-shorts/series.json    # tập self-help cũ và mới
    stoic-stories/series.json       # câu chuyện dài cũ
    book-insights/
      series.json                  # tập dài/Short phân tích sách
      books/hieu-ve-trai-tim/       # hồ sơ sách, nghiên cứu, phạm vi đọc
  kids/{tiny-dino,ocean-stories}/
  client-work/product-videos/

src/projects/<project-id>/          # Video/Thumbnail, captions/music và Edit của một tập
scripts/projects/<project-id>/      # story, take metadata, pipeline và QA riêng tập
docs/projects/<project-id>/         # brief/script/description/QA của một tập
public/<project-id>/                # asset phát trong video, ignored trong Git

src/shared/                        # code dùng chung: font, MusicFade, envelope...
scripts/shared/                    # engine/workflow voice, PDF, budget và test chung
scripts/catalog/                   # quản lý danh bạ, kiểm tra, scaffold
library/books/                     # PDF/OCR/cache riêng tư, ignored, không public
repos/                             # upstream reference-only
```

Tập là đơn vị sản xuất; series là đơn vị biên tập. Kênh sở hữu series. Mỗi project ID thuộc đúng một series và dùng một bộ đường dẫn chuẩn. Không nhân bản tập sang một folder khác chỉ để xuất hiện ở hai nơi; dùng liên kết tập liên quan khi cần.

Các đường dẫn tập cũ được giữ ổn định vì pipeline/metadata/backups/caption tham chiếu lẫn nhau. Danh bạ và Studio Folder thực hiện phân nhóm mà không di chuyển media hoặc thay relative imports của bản dựng. Nhờ vậy các lệnh QA và Studio Edit cũ tiếp tục trỏ đúng nguồn. Đừng tự tạo thêm cây `src/series/.../episodes` cạnh `src/projects/...` khiến có hai bản nội dung.

## Nguồn nào quyết định điều gì?

- `series/catalog.json`: kênh, ID series, đường dẫn hồ sơ series.
- `series/<channel>/<series>/series.json`: chủ đề, format được phép, danh sách project, status và ID Composition/Still thuộc từng tập. Không lặp lại timeline đã render/được người dùng chỉnh ở đây.
- `src/projects/registry.tsx`: từng node JSX literal đăng ký composition/thumbnail và folder Studio. Không tạo registration bằng loop trên metadata hoặc đổi ID cũ.
- `src/projects/<id>/Video.tsx` và config: timing/trim/volume hiện hành. Catalog không ghi đè chúng.
- `series/.../books/<book>/`: một hồ sơ nghiên cứu chung cho nhiều tập cùng cuốn sách.
- `docs/projects/<id>/`: nội dung biên tập riêng từng tập, chỉ tham chiếu nghiên cứu sách; không sao chép toàn bộ nguồn.

`existing` nghĩa là đã có implementation, không suy ra published/approved. `planning` là hồ sơ đang chuẩn bị, có thể chưa có source/scripts/asset. `production` dùng khi bắt đầu implementation; trước khi chuyển cần tạo đầy đủ đường dẫn và đăng ký video thật. Nghe duyệt/xuất bản vẫn ghi trong QA/hồ sơ tập, không tự suy từ trạng thái catalog.

## Tra cứu trước khi sửa

```sh
npm run projects -- list
npm run projects -- list --channel kids
npm run projects -- list --series self-help-shorts
npm run projects -- show one-bad-day
```

`show` in đúng folder source/scripts/docs/assets và link video/thumbnail. Không cần mở README dài để đoán tập ở đâu.

## Thêm tập

```sh
npm run projects -- create --series book-insights --id book-hvtt-001-overview --title 'Hiểu về trái tim: tập tổng quan' --format long --book hieu-ve-trai-tim
```

Lệnh trên là ví dụ, chưa được chạy để tạo tập thật. Nó chỉ tạo `docs/projects/<id>/brief.md` và thêm hồ sơ planning; không dựng video, tổng hợp giọng, tạo ảnh, gọi API hoặc render. Duration của tập dài để null nếu chưa được duyệt. Short mới của Tâm lý cuộc sống mặc định 45s; không ép video dài về 45s.

Chọn ID duy nhất toàn workspace, nên có tiền tố giúp nhận ra series: `book-hvtt-001-overview`, `book-hvtt-001-short`. ID cũ không phải đổi tên cho đồng bộ. Không ghi đè thư mục đã tồn tại.

Sau khi có tài liệu và duyệt kịch bản:

1. Triển khai ở các đường dẫn chuẩn của project. Giữ engine dùng chung trong `scripts/shared`, không copy cả pipeline vào series.
2. Tạo Composition/Still literal trong registry: `Folder kênh → Folder series → Folder project ID`. Đặt video và thumbnail cạnh nhau; lấy tên folder kênh/series từ catalog.
3. Ghi đúng IDs/kinds vào `registrations` của tập rồi chuyển sang production. Trạng thái không tự thay bằng CLI tạo hồ sơ.
4. Chạy `projects:check`, typecheck và QA của tập. Không chạy batch render hoặc tái tạo tất cả giọng để kiểm tra kiến trúc.

## Quy trình sản xuất và ghi chú theo series

Trang quản lý hiện quy trình của từng series (trang series → Quy trình sản xuất): các bước đánh số theo giai đoạn, ai làm (agent soạn nháp, bạn chạy công cụ, bạn duyệt, kiểm tra, thủ công), đầu vào/đầu ra và các bước phải kiểm lại khi kết quả đổi. Đồ thị bước lấy từ `tools/production-automation/cli.cjs` theo profile của series (triết lý, sách, thiếu nhi); series chưa có profile (ví dụ Video khách hàng) chưa có quy trình được duyệt.

Bạn thêm quy tắc và ghi chú vào `series/<channel>/<series>/workflow.json`:

```json
{
  "schemaVersion": 1,
  "general": {"rules": ["Quy tắc cho mọi bước"], "notes": ""},
  "stages": {"script": {"rules": ["Mở đầu bằng một tình huống cụ thể"], "notes": "Bối cảnh cho agent"}}
}
```

Agent đọc `general` và mục của bước đang làm trước khi làm; runner chèn chúng vào `project_context.md`. Quy tắc/ghi chú chỉ bổ sung hướng dẫn, không đổi bước, cổng duyệt, và không mở khóa render, đăng tải hay sinh nội dung trả phí. Lưu từ web kiểm tra phiên bản (sửa ngoài trang thì web từ chối ghi đè) và giữ bản cũ trong `.manager-history/`.

## Thêm series

```sh
npm run projects -- create-series --channel tam-ly-cuoc-song --id new-series --title 'Tên series mới' --formats long,short
```

Lệnh chỉ tạo hồ sơ series và cập nhật danh bạ. Chốt đối tượng, định dạng, âm thanh/thị giác, nguồn và quy trình duyệt trong README của series. Không mặc định mọi series dùng cùng giọng/nhạc/cách dựng. Thêm kênh mới bằng cách cập nhật catalog, chốt chính sách kênh và thêm Folder khi có composition thật.

## Dùng chung và dùng riêng

| Phạm vi | Ví dụ | Nguyên tắc |
|---|---|---|
| Toàn workspace | engine local TTS, PDF CLI, budget lock | Một implementation chung; không nhân bản theo tập |
| Kênh/series | Stoic typography, format biên tập, mẫu credit | Ghi policy ở hồ sơ series; component thật dùng `src/shared` khi đã ổn định |
| Sách | source SHA, chapter map, coverage, ghi chú tác giả | Một hồ sơ cho cả sách; không đưa PDF vào public/Git |
| Tập | script, captions, take đã chọn, music trim, thumbnail | Cô lập theo project ID, giữ phiên bản/backups và user edits |
| Tài nguyên chung | font, nhạc nguồn đang dùng, voice catalog | Tham chiếu bản nguồn hiện có; không copy file nhạc vào mỗi tập |
| Lịch sử | metadata/take cũ, budget audit | Giữ tại đường dẫn cũ; không chạy lại để “đồng bộ” |

## Kiểm tra kiến trúc

```sh
npm run projects:check
npm run test:catalog
npm run typecheck
```

Checker phát hiện ID trùng, project không có series, đường dẫn không chuẩn, registration thiếu hoặc sai folder. `test:catalog` dùng fixture tạm để kiểm scaffold, duplicate, path traversal và duration planning. Nó không chạy voice/image/render.

`npm run projects -- audit-migration` chỉ dùng để đối chiếu lần tái cấu trúc 2026-10-29: fingerprint từng JSX registration và các source file trước khi đổi folder. Đây là bằng chứng di chuyển cấu trúc, không phải ràng buộc đóng băng các tập mãi mãi. Sau khi người dùng sửa một tập, baseline cũ có thể không còn khớp và không cần sửa baseline để giả vờ migration vẫn đúng.

README gốc trước tái cấu trúc được giữ ở [hướng dẫn dự án cũ](../legacy-project-guide.md). Các quy tắc hiện hành ở AGENTS.md và workflow chuyên biệt được ưu tiên hơn hướng dẫn lịch sử.
