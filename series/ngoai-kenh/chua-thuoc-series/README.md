# Chưa thuộc series

Chỗ cho dự án và sách chưa xếp vào kênh hay series nào (người dùng 2026-11-11), ví dụ một video về sách kỹ thuật.
Khi đã có kênh/series riêng thì chuyển dự án sang đó.

- Nhóm: Chưa thuộc kênh (`ngoai-kenh`). Hồ sơ: [series.json](series.json).
- Có tủ sách (`"bookshelf": true`) nhưng tập không bắt buộc gắn sách. Tập gắn sách dùng quy trình sách (nghiên cứu theo
  nguồn, duyệt script trước sản xuất); tập không gắn sách chưa có quy trình automation.
- Thêm sách: trang quản lý → Chưa thuộc series → Thêm sách, rồi thêm PDF. Hồ sơ ở `books/<mã-sách>/`, PDF và text trích
  xuất ở `library/books/<mã-sách>/` (không vào Git), đọc theo [workflow PDF](../../../docs/book-pdf-workflow.md).
- Tạo tập: từ trang sách, hoặc `npm run projects -- create --series chua-thuoc-series --id <slug> --title '<Tên tập>' --format <long|short> [--book <mã-sách>]`.

Bố cục, giọng, nhạc, chủ đề hình ảnh và phong cách animation chọn riêng cho từng dự án: đề xuất trong brief cho người
dùng chọn. Quy tắc của Đọc sách, hiểu mình (intro, hook, bố cục 12 phần, giọng clone) không tự áp sang đây.

Với sách kỹ thuật: đoạn code, sơ đồ và thuật ngữ trên hình phải đúng với sách và đủ lớn để đọc; tên riêng tiếng Anh cần
kiểm tra cách giọng đọc phát âm.
