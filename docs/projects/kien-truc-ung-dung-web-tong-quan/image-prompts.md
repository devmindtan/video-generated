# Kế hoạch hình/animation từng cảnh (chưa có ảnh)

Video dài 16:9, 1920×1080, 30 fps, theme **Bản vẽ kỹ thuật** (`ban-ve-ky-thuat`) + style **Sơ đồ hệ thống động** (`so-do-he-thong`). Mọi hình vẽ bằng code (SVG/React, `src/looks/diagram-kit.tsx`, màu `themeOf`); không dùng ảnh tạo AI. Tài sản tĩnh duy nhất: bìa sách `public/kien-truc-ung-dung-web-tong-quan/images/book-cover.jpg` (người dùng cung cấp). Hình đổi theo câu (mốc `timing.json`), phần tử chạy liên tục (gói dữ liệu, luồng), phụ đề dưới y ≈ 930.

## Màn tên (0–6,5 s, chỉ nhạc)
- Lưới nền bản vẽ, sơ đồ thu gọn Controller → lõi → Database với gói dữ liệu chạy.
- Tiêu đề "Kiến trúc ứng dụng web" (nhấn màu accent), dòng phụ "Tóm tắt cả cuốn sách · Nguyễn Thế Huy".

## 00 · Mở đầu (`00-mo-dau`, 59,1 s)
- Thẻ code `OrderController.php`: lấy giá `DB::table('ebooks')`, tính tiền, `insert orders`, `session()->put(...)`; đường nối tới Database/Session, gói dữ liệu và chip "giá"/"order id".
- Ba câu hỏi đổi: PostgreSQL, job gửi mail, test phần tính tiền — mỗi câu một thẻ có dấu hỏi/cảnh báo.
- Sơ đồ khái niệm "nghiệp vụ" (đơn, giá) nối chéo "hạ tầng" (database, session, framework), nhấn xung đột.
- Bìa sách bên trái, giới thiệu 7 chương thành lưới ô (01–07) và gói chạy qua lộ trình.
- Câu hỏi lõi: "chạy được một mình, trong bộ nhớ, không cần database, không cần framework?" với hai nhánh "có → nghiệp vụ" / "không → hạ tầng".

## 01 · Khi nghiệp vụ và hạ tầng nằm chung (`01-khi-nghiep-vu-va-ha-tang-nam-chung`, 107,3 s)
- Thẻ code hàm trộn lẫn, bốn đường nối sang Database/Session/Framework/Tính tiền (một câu nghiệp vụ, ba thứ hạ tầng).
- Ba thẻ giá: test phải dựng DB, đổi lưu trữ phải sửa chỗ khác, dữ liệu không ai kiểm — dấu X.
- Hai hộp nghiệp vụ/hạ tầng bị buộc chồng, nhãn "hai thứ dính vào nhau".
- Năm vấn đề (check đỏ) và bốn lợi ích khi tách (check xanh).
- Chip chốt "nghiệp vụ sống lâu · hạ tầng hay thay".

## 02 · Ranh giới core và hạ tầng (`02-ranh-gioi-core-va-ha-tang`, 115,9 s)
- Hai vùng: CORE (VAT, `Order.calculateTotalAmount()`, `OrderService.placeOrder()`) và HẠ TẦNG (SQL, HTTP, file, controller, Eloquent) với đánh dấu đúng/sai.
- Công thức "tổng code − core = hạ tầng"; thẻ thư mục `app/Services/` cho thấy `PriceCalculator` (core) và `OrderRepository` (hạ tầng) cùng chỗ.
- Bẫy interface: `Connection.insert(table, data)` nối thẳng Database, chip "vẫn lộ khái niệm database".
- Ví dụ Clock: `Carbon::now()` (sai) → interface `Clock` → `SystemClock` / `FakeClock` cho test nửa đêm.

## 03 · Domain Model: để đối tượng tự bảo vệ (`03-domain-model-de-doi-tuong-tu-bao-ve`, 99,2 s)
- So sánh Transaction Script (các bước rời) với Domain Model (entity `Order` gom dữ liệu + hành vi + bảo vệ).
- Thuộc tính và `__construct` kiểm tra (id ≤ 0, email sai, số lượng ≤ 0, giá âm) → ném exception.
- Entity có danh tính (hai đơn #42 cùng dữ liệu); Value object `EmailAddress`, `Money` so bằng giá trị, tạo được là hợp lệ.
- Nguyên tắc: đối tượng mutable có logic phức tạp không dùng cho việc chỉ đọc.

## 04 · Repository: kho của đối tượng nghiệp vụ (`04-repository-kho-cua-doi-tuong-nghiep-vu`, 93,4 s)
- Interface `OrderRepository { save(Order): int; getById(int): Order }` — không bảng, không cột, không SQL.
- Ba cài đặt rẽ từ cùng interface: `SqlOrderRepository` (DB), `MemoryOrderRepository` (mảng, test), `RemoteOrderRepository` (API).
- Controller sau tách: các bước lấy giá, tạo Order, save, lưu session (dạng danh sách kiểm).
- So sánh: lưu trực tiếp trong controller vs giao cho repository (chip "lưu được ở đâu: kho lo").

## 05 · Đọc và ghi không nhất thiết dùng chung một mô hình (`05-doc-va-ghi-khong-nhat-thiet-dung-chung-mot-mo-hinh`, 90,9 s)
- Entity ghi `Order` với hành vi `changePrice()/hide()` bị gắn vào luồng đọc — dấu X.
- Tách `EbookReadModel` + `EbookReadRepository` (truy vấn), view model/DTO định dạng hiển thị (`formattedPrice`, `toArray`).
- Nhấn CQRS nhẹ: chung DB, repository đọc riêng, integration test; không cần hạ tầng CQRS nặng.

## 06 · Application Service và Command (`06-application-service-va-command`, 94,4 s)
- Controller phình với nhiều trách nhiệm (validate, lấy SP, tồn kho, tính tiền, tạo Order, mail, response).
- `PlaceOrderService` ở giữa, bốn lối vào Web/CLI/Job/Test cùng gọi một use case.
- `PlaceOrderCommand` (customerId, items, email) → `handle(cmd): OrderId`.
- Bên trong service: từng bước nghiệp vụ, nhánh `OutOfStockException`; constructor injection vs `app()->make()` (dấu X); test với repository in-memory, không framework.

## 07 · Ba tầng và luật phụ thuộc một chiều (`07-ba-tang-va-luat-phu-thuoc-mot-chieu`, 133,8 s)
- Ba tầng cũ Presentation/Business/Data xếp chồng.
- Ba tầng theo nghiệp vụ: Domain (entity, value object, domain service/event, interface), Application (use case, command/query, transaction), Infrastructure (framework, ORM, adapter).
- Vòng tròn phụ thuộc lồng nhau: Infrastructure → Application → Domain; mũi tên chỉ vào trong, hạ tầng cũng trỏ vào Domain; "Đừng gọi tôi, tôi sẽ gọi bạn" (Hollywood Principle).
- `OrderServiceProvider` bind interface → cài đặt (chạy thật/test); luồng `/orders/place` → Controller → Handler → Repository và sự kiện `OrderPlaced`.
- Cảnh báo: CRUD đơn giản không cần đủ bốn tầng; kiến trúc để giảm chi phí thay đổi.

## 08 · Ports and Adapters: lõi ở giữa, mọi thứ cắm vào (`08-ports-and-adapters-loi-o-giua-moi-thu-cam-vao`, 161,2 s)
- Lục giác Domain ở giữa, các thiết bị USB/Database/API/CLI cắm vào; port = chuẩn, adapter = thiết bị cụ thể.
- Bốn hạn chế còn lại của phân lớp (dấu X).
- Hai loại port: đầu vào (UI/API/CLI/test gọi vào lõi) và đầu ra (lưu trữ/thông báo/dịch vụ), cả hai là interface trong core; adapter ở Infrastructure, mỗi port có adapter thật + adapter giả.
- Bốn bước: xác định port → định nghĩa interface trong core → viết adapter → nối bằng DI.
- Ví dụ: `OrderRepository` ← Eloquent/InMemory, `OrderNotification` ← Email/Log, `HexagonBindings`; test handler với adapter giả không boot Laravel.
- Mở rộng: `ImportOrderCommand` (CSV adapter), hai DB, `CustomerContext` giữa bounded context — không đụng lõi.
- Cái giá: nhiều interface/class, cần quy ước, không trừu tượng hóa mọi thứ.

## 09 · Khép lại (`09-khep-lai`, 47,6 s)
- Câu hỏi phân loại: chạy một mình trong bộ nhớ? có → giữ sạch / không → đẩy ra rìa.
- Ba bước bắt đầu nhỏ: một use case, tách một phụ thuộc khó test, viết một test không cần database — rồi lặp lại.
- Kết: không hứa chạy nhanh hơn, mà biết phải sửa ở đâu; cảm ơn.

## Caption
- Phụ đề một dòng, bám thời gian câu (`captions.json`), đặt thấp, không che sơ đồ (nội dung chính dưới ~880 px). Style theo caption chung dự án (chữ rõ, nền/viền đọc được trên nền xanh).
