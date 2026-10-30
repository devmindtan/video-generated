# Project manager — audit và xác minh

## tools/project-manager/web/styles.css

- Đã sửa: typography 7–10px trên nhiều thành phần → chữ nội dung/điều hướng dễ đọc hơn, tài liệu 15px; tăng tương phản và focus.
- Đã sửa: mobile ép hai card hẹp → một cột, menu có backdrop, nút chạm đủ lớn; giảm số liệu phụ trên mobile.
- Đã sửa: nền vẫn cuộn và focus có thể ra ngoài drawer → khóa cuộn, inert nền và giới hạn Tab trong drawer.
- Đã thống nhất stylesheet theo design plan, không để chuỗi override chồng nhau.

## tools/project-manager/web/app.js

- Đã sửa: icon ký tự khó đoán → SVG icon và nhãn Video/Thumbnail.
- Đã sửa: ảnh không có dimensions, ảnh đầu trang lazy → hộp ổn định, eager cho hàng đầu, fallback cho ảnh lỗi.
- Đã sửa: trạng thái ghi chú của drawer đã đóng vẫn bị coi là unsaved → chỉ kiểm drawer đang mở và có project thật.
- Đã sửa: chuyển hồ sơ có thể bỏ ghi chú chưa lưu → guard trước khi rời.
- Đã sửa: link dự án/điều hướng không hỗ trợ mở tab → anchor có URL, giữ Ctrl/Cmd click.
- Đã đồng bộ thêm trạng thái bộ lọc/sắp xếp/layout vào URL.

## tools/project-manager/web/index.html

- Đã sửa: nút icon có nhãn truy cập và icon nhất quán, menu mobile đóng được, font được preload.
- Giữ label cho form, skip link, thông báo lỗi/toast, ngôn ngữ vi và không khóa zoom.

## Kiểm chứng

- 5 kiểm thử backend: catalog/tài liệu, file riêng tư/traversal/symlink, origin/Host, notes conflict/history, planning và mở folder giới hạn — passed.
- 12 bước browser QA bằng Chrome headless/Playwright: desktop 1440×1000, tablet 768×1000, mobile 390×844; preview, search không dấu, lọc Tí Hon, drawer/script, unsaved guard, tủ sách, dialog tạo, menu mobile, Escape và console — passed.
- Đã xem screenshot desktop, mobile, mobile-detail và project-form. Screenshot/report ở `.cache/project-manager/qa/`.
- Browser test không submit tạo tập/series hoặc lưu ghi chú thật. Không render video/thumbnail; không dùng API tạo sinh.
- Đây là audit các luồng đã thử, không phải chứng nhận accessibility đầy đủ hay cam kết không còn lỗi trong mọi tình huống.

## Cập nhật 2026-10-30

- Bỏ logo/sidebar mark và avatar trang trí; scrollbar thống nhất ở trang, navigation, drawer và tài liệu.
- Xem trực tiếp các bản xuất hiện có, gồm Range response để tua video. Đã mở video 45 giây và tua tới giây 3 trên Chrome. Thumbnail dùng bản xuất, không tự tạo ảnh mới.
- Studio được bật theo thao tác người dùng, kiểm tra composition hợp lệ và hiện lỗi khởi động. Đã thử khởi động thực tế thành công.
- Thêm sách riêng, chọn PDF để chép vào private library; không ghi đè và không tự đọc/ingest. Series không còn cố định một tên sách.
- Xóa có kiểm kê, xác nhận và revision chống xác nhận cũ; chuyển file vào thùng rác, cập nhật registry/catalog và rollback khi thất bại. Nguồn PDF riêng tư giữ nguyên.
- 10 backend tests + 16 browser checks + 6 catalog tests đạt; `typecheck`, `projects:check` đạt. Kiểm tra hình desktop/tablet/mobile, player, thumbnail, form sách và xác nhận xóa. Browser test không submit ghi/xóa dữ liệu thật.
