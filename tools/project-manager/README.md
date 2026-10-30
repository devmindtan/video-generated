# Studio Workspace — quản lý dự án trên máy

```sh
npm run manager
```

Mở **http://127.0.0.1:4310**. Website chỉ bind loopback, không cần tài khoản/hosting và không đăng ký dịch vụ cloud. Dùng `PROJECT_MANAGER_PORT=4311 npm run manager` nếu cần đổi cổng.

## Chức năng

- Đọc trực tiếp danh bạ kênh/series/tập hiện có. Tìm tiếng Việt không dấu, lọc và đổi chế độ lưới/danh sách.
- Xem trực tiếp video/thumbnail đã xuất trong player; tua video bằng điều khiển gốc. Chọn bản mới nhất tìm được trong `projects/<composition-id>/`, `projects/<slug>/`, `out/` hoặc `public/<slug>/`. Không nhầm ảnh cảnh với thumbnail đã xuất.
- Nếu chưa có bản xuất, nút xem kiểm tra và tự bật Remotion Studio ở cổng 3000. Có nút mở Studio riêng khi muốn sửa. Không tự render. Log khởi động tại `.cache/project-manager/studio.log`.
- Xem kịch bản, mô tả, tài liệu dựng và config theo tập. File nguồn hiển thị chỉ đọc.
- Mở thư mục tập bằng file manager trên máy.
- Ghi chú riêng ở `docs/projects/<id>/manager-notes.md`, có lịch sử và phát hiện xung đột với sửa từ IDE.
- Tạo hồ sơ tập/series bằng workflow catalog hiện tại. Chỉ tạo planning; không tạo composition giả, giọng, ảnh hoặc render.
- Tủ sách hỗ trợ thêm nhiều cuốn trong series Đọc sách, hiểu mình. Thêm PDF bằng nút chọn file; file được chép vào `library/books/<book>/sources/` trên máy (tối đa 200 MB/file), không ghi đè file cũ, không tự OCR/ingest. Thêm nguồn không có nghĩa đã xác minh nội dung. PDF/cache sách và `.env` không có route xem công khai.
- Xóa dự án trong hồ sơ, xóa series ở đầu trang series. Luôn hỏi xác nhận và hiện số tập/bản dựng/file đã xuất; khi trống ghi rõ chưa có sản phẩm. Dữ liệu chuyển vào `.manager-trash/`, registry và danh bạ được cập nhật cùng giao dịch. PDF nguồn riêng tư được giữ lại.

Ảnh trên thẻ là nền thumbnail hoặc ảnh cảnh đã có, không phải ảnh thumbnail mới xuất. Website không chỉnh timeline, âm lượng, source trim hoặc asset cũ.

## Kiểm tra

```sh
npm run test:manager
npm run test:manager:browser
```

Backend test dùng fixture tạm. Browser test cần website đang chạy, dùng `playwright-core` với Chrome sẵn có (`/usr/bin/google-chrome`, đổi bằng `CHROME_PATH`), profile tự tách và headless. Không tải browser mới. Thử đọc dữ liệu thật và thao tác trên form nhưng không submit; không lưu ghi chú hoặc tạo tập thử trong workspace thật. Screenshot/report QA ở `.cache/project-manager/qa/`.

Các lệnh chạy server/browser có thể cần quyền bind localhost trong môi trường sandbox của agent. Test không gửi dữ liệu ra ngoài máy.

## Thiết kế và kỹ năng

Đọc [design plan](../../docs/design/project-manager-design.md) và [hướng dẫn skill](../../docs/design/design-skills.md) trước khi sửa UI. Sau thay đổi, kiểm tra desktop/tablet/mobile, các trạng thái rỗng/loading/error và các luồng tương tác có liên quan; không suy ra UI đúng chỉ từ API trả 200.

## Khôi phục xóa nhầm

Mỗi lần xóa có `.manager-trash/<timestamp-id>/manifest.json`, bản sao các file đã chuyển ở `files/`, cùng nội dung trước đó của registry và danh bạ trong `snapshots`. Dừng chỉnh sửa danh bạ, kiểm tra bản sao rồi ghép lại đường dẫn/entry cần khôi phục; không ghi đè toàn bộ snapshot cũ nếu đã có tập mới. Chạy `npm run projects:check` và `npm run typecheck` sau khôi phục. Chưa có nút khôi phục tự động.
