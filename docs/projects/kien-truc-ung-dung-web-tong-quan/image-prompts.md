# Kế hoạch hình/animation từng cảnh (chưa có ảnh)

Video dài 16:9, 1920×1080, 30 fps, theme **Bản vẽ kỹ thuật** (`ban-ve-ky-thuat`) + style **Sơ đồ hệ thống động**
(`so-do-he-thong`). Mọi hình vẽ bằng code (`src/projects/kien-truc-ung-dung-web-tong-quan/Chapters.tsx`,
`src/looks/diagram-kit.tsx`, màu `themeOf`); không dùng ảnh tạo AI. Tài sản tĩnh duy nhất: bìa sách
`public/kien-truc-ung-dung-web-tong-quan/images/book-cover.jpg` (người dùng cung cấp).

Quy tắc dàn hình (sửa 2026-11-12 sau khi người dùng thấy nhiều chỗ chưa đạt): mỗi cảnh có hình ngay từ câu đầu (danh
sách và sơ đồ nhiều bước hiện mờ trước, sáng dần theo lời); hình nằm trong vùng y 110–870, trên phụ đề; chữ ≥ 34 px,
code ≥ 30 px; không chữ nào đè viền, icon hay chữ khác; dòng code được tô đúng dòng.

## Màn tên (0–6,5 s, chỉ nhạc)
- Lưới nền bản vẽ, tiêu đề "Kiến trúc ứng dụng web", dòng phụ "Tóm tắt cả cuốn sách · Nguyễn Thế Huy".

## 00 · Mở đầu (`00-mo-dau`)
- `OrderController.php` gõ dần; dây nối Database và Session, gói "giá"/"đơn" chạy trên dây; dấu ✓ "chạy đúng".
- "Nghiệp vụ tính tiền nằm ở đâu?": khung vàng quanh dòng `$amount`; ba thẻ thay đổi (đổi PostgreSQL, thêm API JSON,
  viết test tính tiền) lần lượt sáng, mỗi thẻ tô đỏ đúng các dòng phải sửa.
- Bìa sách, tên sách, ba chip "tách nghiệp vụ khỏi database / framework / giao tiếp bên ngoài".
- Bảy ô chương sáng lần lượt, một gói chạy qua cả bảy.
- Câu hỏi mang về, rẽ hai nhánh "có → nghiệp vụ" / "không → hạ tầng".

## 01 · Khi nghiệp vụ và hạ tầng nằm chung
- Cùng controller; năm chip tách hàng, mỗi chip nối về đúng dòng của nó: SQL, session, framework = hạ tầng; tính tiền =
  nghiệp vụ.
- Ba khung giá phải trả: test tính tiền phải dựng MySQL thật; đổi cách lưu phải sửa giữa hàm đặt hàng; dữ liệu sai
  (email "abc@", quantity = 0) lọt thẳng vào bảng orders.
- Code trộn lẫn: khung "nghiệp vụ" (một câu) và "hạ tầng" (database, session, framework, thư viện) bị dây rối buộc vào
  nhau.
- Năm chuyện thường xảy ra: năm dòng hiện mờ ngay câu giới thiệu, mỗi dòng sáng kèm dấu ✕ theo lời.
- Khi tách được: bốn thẻ lợi ích hiện mờ, sáng lần lượt kèm dấu ✓.
- Theo tác giả, ứng dụng sống quá 2 năm: dòng thời gian, framework/database/dịch vụ ngoài đổi nhiều lần, thanh nghiệp vụ
  chạy liền một mạch.

## 02 · Ranh giới core và hạ tầng
- "core code = bộ nhớ + CPU", năm thứ bên ngoài (database, gọi mạng, đọc file, đồng hồ, SMTP) bị gạch.
- Hai quy tắc, mỗi quy tắc một khung với các thứ bị loại; chip "thiếu một trong hai → hạ tầng".
- Hai cột core / hạ tầng điền theo lời; công thức "hạ tầng = toàn bộ code − core".
- Thư mục `app/Services/`: `PriceCalculator.php` (core) và `RateClient.php` gọi API ngoài (hạ tầng).
- `interface Connection { insert($table, $data) }` (vẫn lộ database) đặt cạnh `interface OrderRepository { save(Order) }`.
- Đồng hồ: logic gọi thẳng giờ thật (dây đỏ), rồi `interface Clock` chen vào giữa; giờ hệ thống ở hạ tầng, đồng hồ giả
  nhảy tới 23:59 khi test.

## 03 · Domain Model: để đối tượng tự bảo vệ
- Hai khung ngay câu đầu: Transaction Script (5 bước rời, dữ liệu là mảng) và Domain Model (Order gom dữ liệu + hành vi).
- `Order.php` constructor: mỗi câu "nếu … ném lỗi" tô đúng dòng `if` và tick một luật bên phải; dòng tổng tiền tô cuối.
- Bốn nguồn (Controller, API, CLI, Test) đều đi qua một constructor; đơn `quantity = 0` bật ra.
- Entity (`Order #101` ≠ `Order #102` dù cùng nội dung) và value object (`Email(...) == Email(...)`,
  `Money(120000, "VND")`).
- Order không tự gọi database (dây đỏ bị gạch); "Repository ?" xuất hiện ở giữa.

## 04 · Repository: kho của đối tượng nghiệp vụ
- `interface OrderRepository { save(Order): int; getById(int): Order }`; "bảng nào? cột nào? SQL ra sao?" bị gạch.
- Viết dòng mình muốn gọi trước (`$this->orders->save($order);`) rồi mới đến interface.
- Một interface, ba cài đặt (Sql / Memory / Remote); gói dữ liệu đổi đường giữa các bản, controller không biết bản nào.
- Controller sau khi tách: năm bước hiện mờ, tick theo lời.
- `SqlOrderRepository` (mọi câu SQL, integration test) cạnh `Order` thuần PHP (unit test).

## 05 · Đọc và ghi không nhất thiết dùng chung một mô hình
- Entity ghi `Ebook` mang `changePrice() / hide() / changeStatus()` được đưa thẳng cho View.
- `EbookReadModel` + `EbookReadRepository` chỉ để đọc; bản nhẹ hơn `interface GetPrice`.
- CQRS (kho ghi, kho đọc, domain event, phải giữ nhất quán) mờ đi; cách sách chọn: một database, repository đọc riêng,
  integration test.
- View model: trang e-book (`price: 120000` → `120.000 ₫`) và JSON API danh sách đơn qua `OrderListViewRepository`.
- Nguyên tắc chốt chương.

## 06 · Application Service và Command
- `OrderController` phình dần sáu khối trách nhiệm.
- `PlaceOrderService` một use case, gọi từ web/CLI/job/test.
- `PlaceOrderCommand` (customerId, items, email) → `handle($command)` → `OrderId`.
- Sáu bước trong service sáng lần lượt theo lời, gói chạy theo; nhánh `OutOfStockException`.
- Controller còn hai việc: request → command → service → response.
- Constructor injection (`OrderRepository`, `ProductRepository`, `Mailer`) thay `app()->make(...)`; khi test truyền
  `InMemoryOrderRepository`, `FakeMailer`.
- `PlaceOrderServiceTest`: PASS, không framework, database hay mạng.

## 07 · Ba tầng và luật phụ thuộc một chiều
- Ba tầng cũ, đường rò rỉ giữa các tầng, chồng lớp thành mã lasagna.
- Domain / Application / Infrastructure hiện mờ ngay câu đầu, sáng theo lời; Domain "không import framework".
- Dependency Rule: ba vòng lồng; Controller → Application → Domain, `EloquentOrderRepository` trỏ vào Domain; chip
  Hollywood Principle.
- `OrderServiceProvider` bind interface → Eloquent (chạy thật) / InMemory (khi test).
- Luồng đặt hàng: Request → Controller → Handler → Repository → MySQL, OrderPlaced → Listener → Email; gói chạy qua.
- Việc đơn giản một lớp là đủ; module lõi phức tạp mới chia đủ tầng.

## 08 · Ports and Adapters: lõi ở giữa, mọi thứ cắm vào
- Lục giác "lõi ứng dụng", Alistair Cockburn · 2005, "sáu cạnh chỉ là ẩn dụ"; cổng USB = port, chuột/bàn phím/ổ cứng
  thay nhau cắm = adapter.
- Bốn chỗ phân lớp còn để ngỏ: hiện mờ, sáng kèm ✕ theo lời.
- Port đầu vào (UI, API, CLI, test) và port đầu ra (lưu trữ, thông báo, bên thứ ba), gói chạy vào/ra lõi; adapter ở
  Infrastructure, mỗi port một adapter thật + một adapter giả.
- Bốn bước hiện mờ, sáng lần lượt: xác định port → interface trong core → viết adapter → nối bằng DI.
- Ví dụ sách: `OrderRepository` (Eloquent / InMemory), `OrderNotification` (Email / Log); service provider; test
  không khởi động Laravel.
- Mở rộng: nhập đơn từ CSV, hai database, phân hệ khách hàng qua một port; lõi giữ nguyên.
- Cái giá: nhiều interface và class hơn, cần quy ước đặt tên, đừng trừu tượng hóa mọi thứ, chỉ tách chỗ dễ đổi/khó test.

## 09 · Khép lại
- Câu hỏi phân loại, hai nhánh nghiệp vụ (giữ sạch) / hạ tầng (đẩy ra rìa, sau interface).
- Vòng lặp bốn bước: chọn một use case → tách phụ thuộc khó test → viết test không cần DB → lặp lại; gói chạy vòng.
- Lục giác nghiệp vụ với web/API/database/email; đổi database chỉ sửa đúng chỗ đó.

## Caption
- Phụ đề một dòng, bám thời gian từng chữ của giọng (`captions.json`), đặt thấp dưới y ≈ 900; từ khóa vàng.
