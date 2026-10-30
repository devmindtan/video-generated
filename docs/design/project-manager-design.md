# Project manager — hướng thiết kế

## Công việc chính

Người dùng cần tìm đúng dự án và mở video, thumbnail, kịch bản, mô tả hoặc thư mục gốc. Đây là công cụ làm việc trên máy, không phải landing page. Danh bạ có 37 tập với tên tiếng Việt dài, nhiều series khác nội dung và hồ sơ sách đang chuẩn bị.

## Quyết định giao diện

- Màu: navigation xanh rừng `#16362e`, nền làm việc `#f6f8f5`, nội dung trắng `#ffffff`, chữ `#20362d`, chữ phụ `#596c61`, điểm nhấn `#b79554`. Giữ sự nhận diện đang có, sửa độ tương phản và phân cấp.
- Font: Noto Sans local, 400 và 700. Nội dung chính 15–16px, thông tin phụ tối thiểu 12px; không dùng chữ 7–10px cho thao tác quan trọng. Số dùng tabular-nums.
- Bố cục: sidebar theo kênh/series, header ngắn, bộ lọc dễ thấy, danh sách dự án là vùng chính. Bỏ nhãn trang trí và giảm không gian số liệu không phục vụ thao tác.
- Grid desktop ba cột khi đủ rộng; tablet hai; điện thoại một cột hoặc danh sách gọn, không ép hai card hẹp. Thẻ giữ tên dự án đủ đọc, link xem video/thumbnail có nhãn rõ ràng.
- Drawer: có tên tập, nút mở Studio, tab tài liệu đọc được, ghi chú và thư mục. Khóa cuộn nền, đưa focus vào drawer, cảnh báo trước khi bỏ ghi chú chưa lưu.
- Mobile: menu có lớp nền, đóng được bằng Escape/tap ngoài, không che thao tác tạo series; nút chạm tối thiểu 44px.

## Wireframe

```text
[ Kênh / series ] | Tiêu đề + Thêm series / Thêm dự án
[                ] | Tổng số gọn
[                ] | Tìm kiếm / series / trạng thái / sắp xếp
[                ] | Ảnh  + tên tập + trạng thái + Xem video / Thumbnail
[                ] | ...
```

## Những lỗi phải kiểm chứng

- Ảnh preview trống, loading/fallback, kích thước ổn định.
- Chữ quá nhỏ, icon ký tự lạ, trạng thái quá nhạt.
- Drawer/điện thoại tràn ngang, cuộn nền, focus bị lọt.
- Đổi dự án làm mất ghi chú; deep-link không khôi phục đúng panel.
- Lọc rỗng với series sách hoặc không có dữ liệu phải có bước đi tiếp.

## Tiêu chuẩn bàn giao

Đọc skill frontend-design + web-design-guidelines, audit bằng bản hướng dẫn Vercel hiện hành. Kiểm thử Playwright trên Chrome sẵn có, tối thiểu 1440px, 768px và 390px; thử filter, search không dấu, drawer, tài liệu, dialog tạo, empty state, menu mobile. Backend test bằng fixture, không ghi vào tập thật. Không render video/thumbnail, không gọi API tạo sinh.

## Bổ sung chức năng quản lý (2026-10-30)

Giữ tokens/kiểu chữ ở trên; bỏ logo để nhường sidebar cho danh mục. Thanh cuộn mảnh bo tròn, có tương phản trên cả nền sáng và sidebar. Player dùng dialog lớn, video giữ tỷ lệ gốc với controls và poster từ thumbnail đã xuất. Hộp xóa có kiểm kê và nút hủy trước hành động. Tủ sách có thao tác thêm sách ở đầu trang và thêm PDF trong hồ sơ từng cuốn; series giới thiệu số sách thay vì tên một cuốn cố định. Mọi dữ liệu thử ghi vào fixture.
