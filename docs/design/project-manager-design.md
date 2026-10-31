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

## Điều hướng và phân cấp thao tác (2026-10-30)

- Giữ palette xanh rừng/trắng, chữ 13–16px cho điều hướng. Sidebar cuộn được bằng chuột/chạm/bàn phím nhưng không vẽ scrollbar.
- Nút chính nền xanh đậm; thao tác phụ viền trung tính; quay lại/hủy kiểu nhẹ; mở Studio xanh lam kèm biểu tượng mở ngoài; xóa đỏ và tách khỏi nhóm tạo nội dung. Trong tủ sách chỉ “Thêm sách” là nút chính.
- Header: Quay lại + breadcrumb Tổng quan / Kênh / Series. Hồ sơ dự án có breadcrumb riêng đầy đủ tới tên tập; hồ sơ sách đi qua series / tủ sách / tên sách. Các cấp cha là liên kết thật.
- Lịch sử pushState cho điều hướng, replaceState cho nhập tìm kiếm; Back/Forward phục hồi bộ lọc và hồ sơ. Truy cập trực tiếp không có lịch sử nội bộ thì Quay lại về cấp cha. Giữ cảnh báo ghi chú chưa lưu.

## Tên sách dài (2026-10-30)

Giữ màu bìa và Noto Sans hiện tại. Bìa minh họa 136×174px, tên 14px/700 giới hạn 4 dòng, tác giả 11px giới hạn 2 dòng trong vùng riêng; không để chữ đẩy ra ngoài bìa. Tên đầy đủ và tác giả ở phần thông tin bên dưới tự xuống dòng. Vùng bìa có chiều cao tối thiểu để phù hợp cả lưới/danh sách và mobile. Kiểm tra sách thực tế Atomic Habits cùng tên/tác giả rất dài bằng dữ liệu trình duyệt giả lập, không sửa hồ sơ sách thật.

## Ảnh bìa sách (2026-10-30)

Giữ bảng màu và chữ hiện tại. Hồ sơ sách thêm vùng “Ảnh bìa” phía trên tài liệu: preview cao 200px, nút chọn/thay ảnh và trạng thái lưu. Nhận JPG, PNG, WebP tối đa 8 MB; xem trọn bìa bằng object-fit contain, không cắt chữ trên ảnh. Thẻ tủ sách dùng ảnh đã chọn với khung ổn định; tên/tác giả đầy đủ vẫn nằm bên dưới. Chưa có ảnh hoặc ảnh lỗi thì dùng bìa chữ mặc định. Thay ảnh giữ bản cũ, không sửa thông tin sách/PDF. QA upload/thay ảnh bằng fixture, không thêm ảnh vào sách thật.

## Tủ sách gọn và đúng tỷ lệ (2026-10-30)

Tách books-grid khỏi lưới video: cột rộng tối thiểu 180px, 5 cột ở viewport 1440px, tự tăng/giảm theo vùng nội dung; mobile 2 cột từ 360px. Giữ chữ chính 13–14px, tác giả/trạng thái 12px. Vùng bìa cao 224px, bìa hiển thị khoảng 200px với tỷ lệ thật. Chỉ đo và giấu viền trắng bên ngoài ảnh bằng CSS; không sửa ảnh gốc. Đo trên canvas giới hạn 512px; giữ 2px đệm, bỏ qua trường hợp vùng nhận diện quá nhỏ để tránh cắt nội dung. Ảnh và các bản thay trước vẫn nằm trong covers/ của hồ sơ sách.

## Thẻ sách dạng kệ (2026-10-30)

Giữ palette có sẵn: nền #f6f8f5, chữ #20362d, phụ #596c61, vùng đặt sách #edf1eb, hover #e4ebe1. Workspace Bold 700 cho tên 14px/1.6, tác giả và trạng thái 12px. Bỏ khung trắng bao ngoài và footer chia vạch kiểu thẻ video; bìa thật là trọng tâm, vùng đặt bìa 232px có bóng nhẹ, metadata thẳng trái bên dưới. Bỏ nút Hồ sơ lặp lại: bấm bìa hoặc tên đều mở hồ sơ, giữ nhãn truy cập và focus rõ. 5 cột desktop, 2 cột mobile; giữ tên dài đầy đủ, trạng thái nguồn và fallback sách thiếu bìa. List giữ bố cục ngang. Kiểm tra ảnh thật, tìm kiếm, detail và upload fixture trên ba kích thước.
