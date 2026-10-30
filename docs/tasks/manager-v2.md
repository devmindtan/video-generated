# Quản lý workspace — cải thiện chức năng

- [x] Scrollbar thống nhất, bỏ logo trang trí.
- [x] Nhận diện sản phẩm đã xuất, xem video/ảnh trực tiếp; nút Studio riêng.
- [x] Tự bật Studio khi người dùng yêu cầu mở, có trạng thái chờ/lỗi.
- [x] Thêm nhiều sách; chép PDF nguồn vào kho riêng của từng sách, không OCR/upload ra ngoài.
- [x] Xóa dự án/series với kiểm kê và xác nhận cả khi trống; lưu thùng rác và cập nhật registry.
- [x] Bỏ giới thiệu sách ghi cứng trong series; phân biệt sách và tập.
- [x] Kiểm thử API, trình duyệt desktop/mobile, catalog và TypeScript.

Giữ palette và typography hiện tại. Player là dialog lớn có điều khiển gốc, không autoplay.
Xóa yêu cầu xác nhận dữ liệu hiện tại; kiểm thử dùng fixture, không xóa dữ liệu thật.

Hoàn thành 2026-10-30. Xác minh: 10 kiểm thử backend, 16 bước trình duyệt trên desktop/tablet/mobile, 6 kiểm thử catalog, `projects:check`, `typecheck`. Đã kiểm tra player tua tới giây 3, ảnh thumbnail đã xuất và ảnh chụp các hộp thoại. Tự bật Studio thực tế thành công; không render video/thumbnail. Dữ liệu thật chỉ đọc trong kiểm thử, thao tác ghi/xóa chạy với fixture.
