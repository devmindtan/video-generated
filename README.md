# Video playground

Workspace sản xuất video cho **Tâm lý cuộc sống**, kênh **thiếu nhi** và **video khách hàng**. Quản lý theo kênh → series → tập.

**Bắt đầu ở [danh bạ series](series/README.md)** để chọn đúng nội dung. Series mới **Đọc sách, hiểu mình** có [hồ sơ Hiểu về trái tim](series/tam-ly-cuoc-song/book-insights/books/hieu-ve-trai-tim/book.json), đang chờ tài liệu trước khi viết kịch bản.

## Trang quản lý trên máy

```sh
npm run manager
```

Mở **http://127.0.0.1:4310** để duyệt kênh/series/tập, tìm dự án, xem kịch bản và mô tả, mở Studio/thumbnail/thư mục, lưu ghi chú hoặc tạo hồ sơ chuẩn bị. Dữ liệu vẫn ở trong project. [Hướng dẫn](tools/project-manager/README.md).

Skill thiết kế và browser QA đã được cài vào `skills/`; xem [nguồn và workflow](docs/design/design-skills.md).

## Mở và tìm tập

```sh
npm ci
npm run dev
npm run projects -- list --channel tam-ly-cuoc-song
npm run projects -- show one-bad-day
```

Studio có folder riêng cho kênh, series và từng tập; video/thumbnail nằm cạnh nhau. ID/link composition cũ giữ nguyên. `projects show` in đường dẫn code, scripts, docs, assets và link Studio.

## Thêm nội dung

- [Kiến trúc, phần dùng chung/dùng riêng và cách thêm series/tập](docs/architecture/series-workflow.md)
- [Đọc và kiểm chứng sách PDF](docs/book-pdf-workflow.md)
- [Quy trình giọng đọc và playlist](docs/voice-workflow.md)
- [Nguyên tắc sản xuất hiện hành](AGENTS.md)
- [Hướng dẫn các dự án cũ được giữ lại](docs/legacy-project-guide.md)

```sh
npm run projects -- list --series book-insights
npm run projects:check
npm run test:catalog
npm run typecheck
```

`projects create` tạo hồ sơ planning, không tạo giọng/ảnh/video hay render. Short self-help mới mặc định 45s; tập sách dài cần chốt thời lượng riêng. Nguồn PDF/cache ở `library/books/` (ignored), không đưa vào public hoặc Git.

## Ranh giới sản xuất

- Triết lý/self-help: stills, animation theo frame, giọng và nhạc; giữ nhận diện caption/thumbnail Stoic. Dựng theo script đã duyệt.
- Thiếu nhi: footage chuyển động thật, giọng B đã chọn; không thay bằng zoom ảnh tĩnh.
- Chỉ timing/trim nhạc chỉnh độc lập trong Studio Edit; giữ volume/ducking và fade-in/out.
- Không render/export tự động. Không tự tái tạo take hoặc thay user edits để “đồng bộ”.
- Gemini API/Veo đang tạm dừng, Vertex không sử dụng. Kids có workflow Gemini thủ công; API chỉ khi có phê duyệt mới và kiểm tra chi phí. [An toàn chi phí](docs/gemini-api-safety.md), [workflow thủ công](docs/flow-and-gemini.md).

## Thư mục

`series/` tổ chức biên tập; `src/projects/`, `scripts/projects/`, `docs/projects/` và `public/<id>/` giữ nội dung riêng từng tập. `src/shared/` và `scripts/shared/` chứa công cụ dùng chung. `repos/` chỉ để tham khảo upstream.

### Chuẩn bị tự động hóa sản xuất

Repo multi-agent tham chiếu đã được ghim trong `repos-manifest.json`. Xem [đánh giá, workflow và lộ trình nâng cấp](docs/architecture/production-automation.md).

- `npm run automation -- doctor`: kiểm tra clone/revision và các điều kiện còn thiếu.
- `npm run automation -- plan <project-id>`: lập manifest các chặng từ canonical catalog; không sửa tập hay chạy sản xuất.
- `npm run test:automation`: kiểm tra lớp lập kế hoạch bằng fixture.

Đây là chế độ chuẩn bị, chưa bật runtime/model, scheduler, auto-render hay API có phí. Manifest không chạy trực tiếp được trên upstream.
