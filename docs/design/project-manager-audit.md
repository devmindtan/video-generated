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

## Điều hướng và nút thao tác (2026-10-30)

- Sidebar ẩn scrollbar nhưng vẫn cuộn được ở chiều cao cửa sổ 650px; các vùng tài liệu giữ scrollbar riêng.
- Breadcrumb có liên kết thật: Tổng quan → Kênh → Series → Dự án; hồ sơ sách có thêm Tủ sách. Có nút Quay lại ở header và drawer, mở trực tiếp thì về cấp cha.
- Lịch sử điều hướng được lưu đúng; Back/Forward khôi phục trang, tìm kiếm và hồ sơ. Hủy rời trang giữ ghi chú chưa lưu.
- Phân cấp nút: primary xanh đậm, secondary viền trung tính, Studio xanh lam, xóa đỏ, quay lại/hủy kiểu nhẹ. Tủ sách chỉ có một nút tạo chính. Nút Hồ sơ có nhãn rõ ràng.
- 10 kiểm tra điều hướng bằng Chrome đạt, cộng 16 kiểm tra trình duyệt hiện có và 10 backend tests. TypeScript đạt. Đã xem ảnh desktop, hồ sơ và mobile; không ghi dữ liệu dự án thật.

## Ảnh bìa sách (2026-10-30)

Đã kiểm tra chọn ảnh, thay ảnh, ảnh còn sau tải lại trang, ảnh cũ còn trên đĩa và hiển thị trên desktop/tablet/mobile bằng fixture. Đã xem screenshot editor và tủ sách. 11 backend tests và TypeScript đạt. Chỉ route ảnh bìa được phục vụ, không mở đường dẫn PDF/cache sách.

## Tỷ lệ bìa và mật độ tủ sách (2026-10-30)

- Lưới riêng cho sách: 5 cột ở 1440px, 2 cột ở 390px; số cột tự thích ứng vùng nội dung. Tên sách dài vẫn hiển thị đầy đủ; footer căn đều.
- Đo viền trắng trên ảnh thu nhỏ tối đa 512px, chỉ thay vùng hiển thị CSS. Kiểm tra fixture ảnh vuông có bìa dọc bên trong: tỷ lệ bìa hiển thị 0.52–0.55, file nguồn không bị xử lý lại. Ảnh thay thế và ảnh cũ vẫn được giữ trong covers/.
- Backend 11 tests đạt. Browser: upload/thay ảnh/lưu sau reload; bố cục grid/list ở 1440/768/390px; tên cực dài; 10 kiểm tra điều hướng và 16 kiểm tra tổng quát đều đạt. TypeScript và diff check đạt. Đã xem screenshot desktop/tablet và editor mobile.
- Các thao tác ghi trong kiểm tra dùng workspace tạm. Không render video, không push Git.

## Thẻ tủ sách tinh gọn (2026-10-30)

Bỏ khung bao trắng, đường chia footer và nút Hồ sơ trùng thao tác; bìa và tên vẫn mở hồ sơ bằng bàn phím/chuột. Nền đặt bìa nhẹ, tên căn đầu, tác giả và trạng thái nguồn rõ ràng. Giữ tỷ lệ ảnh, 5 cột desktop và 2 cột mobile. Đã xem screenshot ở 1440/768/390px; kiểm tra grid/list, tên dài, thay bìa, điều hướng và 16 kiểm tra trình duyệt tổng quát đều đạt; 11 backend tests đạt. Không sửa file bìa gốc hoặc dữ liệu sách thật.
