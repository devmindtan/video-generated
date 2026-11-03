# Đọc sách, hiểu mình

Series tóm tắt và phân tích sách; nghiên cứu theo nguồn, duyệt script trước sản xuất.

- Kênh: Tâm lý cuộc sống.
- Hồ sơ và danh sách tập: [series.json](series.json).
- Tra cứu: `npm run projects -- list --series book-insights`.
- Tạo hồ sơ tập: `npm run projects -- create --series book-insights --id <slug-duy-nhat> --title '<Tên tập>' --format <short-hoặc-long> --duration <giây>`.
- `existing` chỉ ghi nhận tập đã có code, không khẳng định đã xuất bản hoặc nghe duyệt.

## Bố cục chuẩn của một tập dài (theo tập 1, người dùng 2026-11-03)

| # | Phần | Làm thế nào |
|---|---|---|
| 1 | Intro series (lời chào) | Dùng lại nguyên `BookHvttIntro`, không làm lại |
| 2 | Cách làm của tập | Dùng lại nguyên `CachLam` (`BookHvttCachLam`), không nhắc tên sách |
| 3 | Thẻ giới thiệu tập | Làm mới: số tập, tên sách, tác giả, một câu giới thiệu |
| 4 | Mở chuyện | Một câu chuyện có trong sách, khoảng 40 giây |
| 5–7 | Cuốn sách là gì · Sợi chỉ xuyên suốt · Nội dung chính theo nhóm | Mỗi nhóm có thẻ tiêu đề |
| 8–9 | Những điểm chưa đạt · Tổng kết | |
| 10 | Ý kiến cá nhân | Lời của người dùng |
| 11 | Nhận xét chung | |
| 12 | Outro series | Dùng lại nguyên `BookHvttOutro` |

Trình bày, nhạc, nhịp, phụ đề, thanh giọng ở góc, thanh tiến trình, mô tả có chương, `captions.srt`, QA và
thumbnail giống tập 1. Các thành phần dùng chung (Intro, Outro, CachLam, scene-kit, EpisodeCard) nằm ở
`src/projects/book-hvtt-001-overview/`; tập sau import lại, không chép bản riêng. Quy tắc đầy đủ: [workflow.json](workflow.json).

## Cuốn đầu tiên: Hiểu về trái tim — Minh Niệm

[Hồ sơ sách](books/hieu-ve-trai-tim/book.json) · [Nghiên cứu](books/hieu-ve-trai-tim/research.md) · [Kế hoạch](books/hieu-ve-trai-tim/season-plan.md).

Tập 1 (`book-hvtt-001-overview`, tổng quan và đánh giá, 13:07) đã đăng ngày 2026-11-03. Tách tóm tắt/phân tích bằng lời riêng khỏi đọc nguyên tác. Không đưa các tập tự nhắc bản thân cũ vào đây chỉ vì chủ đề giống sách.

Đọc [workflow PDF](../../../docs/book-pdf-workflow.md) và ghi nguồn trước khi viết script. Một hồ sơ sách phục vụ nhiều tập, mỗi tập giữ script/caption/take riêng ở project ID tương ứng.
