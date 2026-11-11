# Đọc sách kỹ thuật

Series tóm tắt và phân tích sách kỹ thuật (lập trình, kiến trúc phần mềm, hệ thống…); nghiên cứu theo nguồn, duyệt
script trước sản xuất.

- Nhóm: Chưa thuộc kênh (`ngoai-kenh`, người dùng 2026-11-11: làm video sách kỹ thuật trước, kênh riêng cấu hình sau).
- Hồ sơ và danh sách tập: [series.json](series.json). Series sách (`"requireBook": true`): mỗi tập gắn một cuốn.
- Thêm sách: trang quản lý → series này → Tủ sách → Thêm sách, rồi thêm PDF. Hồ sơ nằm ở `books/<mã-sách>/`, PDF và
  text trích xuất ở `library/books/<mã-sách>/` (không vào Git), đọc theo [workflow PDF](../../../docs/book-pdf-workflow.md).
- Tạo tập: từ trang sách, hoặc `npm run projects -- create --series sach-ky-thuat --id <slug> --title '<Tên tập>' --format <long|short> --book <mã-sách>`.

## Chưa chốt

Bố cục tập, giọng, nhạc, chủ đề hình ảnh và phong cách animation của series này chưa được chọn. Quy tắc của
Đọc sách, hiểu mình (intro, hook, bố cục 12 phần, giọng clone) không tự áp sang đây. Ở tập đầu, đề xuất các lựa chọn
trong brief cho người dùng chọn rồi ghi quy tắc đã chốt vào `workflow.json` của series.

Lưu ý riêng cho sách kỹ thuật: đoạn code, sơ đồ và thuật ngữ trên hình phải đúng với sách và đủ lớn để đọc; tên
riêng tiếng Anh cần kiểm tra cách giọng đọc phát âm.
