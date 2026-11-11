# Nghiên cứu sách — Kiến trúc ứng dụng web — Nguyễn Thế Huy

## Nguồn

- *Kiến trúc ứng dụng Web*, tác giả Nguyễn Thế Huy (tự giới thiệu là Technical Leader 10 năm kinh nghiệm, PDF 2).
  Ebook tiếng Việt, không có trang thông tin xuất bản, năm hay NXB. Cùng tác giả với cuốn `system-design`.
- PDF source SHA-256: `fd1059a41637391c2c5f0ff5abfbb384e24c0686db9b63621941d856bd71d86a`. Cache edition:
  `fd1059a4…d86a-de2a45e349f9` (PyMuPDF 1.26.7). `inventory --verify`: toàn vẹn ngày 2026-11-11.
- Nguồn người dùng thêm qua trang quản lý: `library/books/kien-truc-ung-dung-web/sources/Kiến trúc ứng dụng web.pdf`
  (60 trang PDF). Native text, không OCR, 118.779 ký tự. 1 trang bị gắn cờ ít chữ: PDF 1 là bìa, không cần OCR.
- 51 bookmark; bản đồ chương: [chapters.json](chapters.json). Không có số trang in: mọi tham chiếu là trang PDF.

## Kiểm tra chất lượng và phạm vi

- Đã đọc tuần tự toàn bộ PDF 1–60 ngày 2026-11-11 (lời mở đầu, 7/7 chương, lời kết). Dấu tiếng Việt và thứ tự đọc
  tốt. Các khối code PHP trích xuất đủ, có ký tự vô hình (zero-width) ở cuối dòng; cần gõ lại nếu đưa lên hình.
- Sách dạy bằng một ví dụ xuyên suốt: chức năng **đặt hàng e-book** trong Laravel/PHP, bắt đầu từ một controller trộn
  lẫn (PDF 9–10) và refactor dần qua từng chương. Phần lớn ý tưởng theo hướng Domain-Driven Design, có dẫn Martin
  Fowler (Repository, PDF 22) và Alistair Cockburn (Hexagonal Architecture, đề xuất năm 2005, PDF 48, 51–52).
- Chỗ sách tự không nhất quán (ghi lại để không lặp lại lời hứa của sách trong kịch bản):
  - PDF 36 và 38 hẹn "chương sau" nói kỹ về Dependency Injection so với Service Locator và composition root, nhưng
    sách không có chương đó; DI chỉ được nhắc rải rác (PDF 7, 35, 47, 52, 54).
  - PDF 41 viết "Domain Events… như đã nói" trong khi các chương trước chưa giới thiệu domain event.
  - Ví dụ đổi giữa chừng: chương 3 dùng `Order(ebookId, email, quantity, pricePerUnit)` và `save(): int`; chương 5 trở
    đi dùng `Order::create(orderId, customerId, product, …)`, `nextIdentity()` và `OrderId`.
  - PDF 26 có lỗi đánh máy "amount tổng tiền và 18 quantity".
- Một nhận định định lượng không có nguồn: "nếu ứng dụng có vòng đời dài hơn 2 năm thì việc decouple khỏi hạ tầng là
  điều rất đáng để áp dụng" (PDF 6). Dùng thì ghi rõ là lời tác giả.
- Trang cuối có email cá nhân của tác giả: không đưa vào video, mô tả hay tài liệu.

## Coverage và ghi chú từng chương

| Chương | PDF | Trạng thái | Ghi chú nội dung |
|---|---:|---|---|
| Lời mở đầu | 2 | Đã đọc | Mục đích: từ tách code nghiệp vụ và code hạ tầng đến triển khai Hexagon Architecture; cho cả dự án mới lẫn "legacy" |
| 1. Mục tiêu và tầm quan trọng | 3–11 | Đã đọc | Core code = logic nghiệp vụ thuần; infrastructure code = phần nối với DB, bên thứ ba, file, framework. Đọc core code phải thấy "câu chuyện nghiệp vụ". Năm vấn đề khi trộn: khó nắm logic, phụ thuộc công nghệ, khó test tự động, không bảo đảm dữ liệu hợp lệ, bảo trì khó ("code smell", sớm thành legacy). Sáu lợi ích: hợp DDD, hợp TDD, minh bạch (`orderRepository->save($order)`), tái sử dụng và đổi hạ tầng, nâng cấp framework ít đau, chuẩn hóa cho team. Năm kỹ thuật: Dependency Injection/Inversion of Control, phân tầng Domain–Application–Infrastructure, pattern (Repository, Domain Model, Factory, Clock interface), giấu hạ tầng sau interface, giữ framework ở rìa. Ví dụ `orderEbook(Request)`: lấy giá bằng `DB::table('ebooks')`, tính `quantity * price`, insert `orders`, lưu ID vào session: khó test, dính MySQL, không kiểm tra email hay số lượng |
| 2. Định nghĩa core và infrastructure | 11–16 | Đã đọc | Core code chạy được ở mọi ngữ cảnh chỉ với bộ nhớ và CPU. Quy tắc 1: không phụ thuộc trực tiếp hệ thống ngoài (DB, API, file, đồng hồ hệ thống, SMTP). Quy tắc 2: không cần môi trường đặc biệt (web server, CLI, framework, `$_POST`, Session). Không thỏa một trong hai là infrastructure. Ví dụ core: hàm tính VAT, `$order->calculateTotalAmount()`, `OrderService.placeOrder()` chỉ dùng domain và interface. Ví dụ infra: SQL/ORM (`User::find(5)`), gọi HTTP, đọc file, controller và Eloquent model. "infrastructure code = tổng code − core code". Abstraction không tự biến hạ tầng thành core: interface `Connection.insert($table, $data)` vẫn lộ khái niệm DB. Phân loại theo chức năng, không theo thư mục. Adapter cô lập hạ tầng tại một điểm (`Clock`/`SystemClock` thay `Carbon::now()`) |
| 3. Domain Model và Repository | 16–30 | Đã đọc | Transaction Script (các bước thủ tục trong controller) so với Domain Model (dữ liệu + hành vi trong đối tượng). Entity `Order`: constructor nhận đủ ebookId, email, quantity, pricePerUnit, ném exception nếu ID ≤ 0, email sai, số lượng ≤ 0, giá âm; tự tính `totalAmount`. Entity (có danh tính, đổi trạng thái) vs Value Object (bất biến, so bằng giá trị: `EmailAddress`, `Money`). Repository: "kho" đối tượng domain, domain chỉ thấy interface; `OrderRepository { save(Order): int; getById(int): Order }`; mẹo "giả định đã có thành phần mình cần rồi định nghĩa nó". `SqlOrderRepository` dùng Query Builder (`insertGetId`), hoặc Eloquent model ẩn trong repository; có thể có `MemoryOrderRepository` cho test, `RemoteOrderRepository` gọi API. Controller sau refactor: lấy giá qua `EbookRepository`, `new Order(...)` trong try/catch, `save`, lưu session, redirect. Lợi ích: core là POPO thuần, mọi thứ MySQL nằm trong một lớp, mỗi phần test riêng |
| 4. Read Model và View Model | 30–33 | Đã đọc | Dùng entity ghi cho việc đọc trao cho tầng hiển thị cả phương thức đổi trạng thái (`Ebook->changePrice()`, `hide()`) và làm class phình to. Tách write model và read model: `EbookReadModel` + `EbookReadRepository`, hoặc chỉ một interface `GetPrice.ofEbook(EbookId): int`. Lựa chọn nặng hơn (CQRS): lưu trữ đọc riêng, cập nhật qua domain event, phải giữ nhất quán. Sách chọn cách đơn giản: chung DB, repository đọc riêng, cần integration test. View model = DTO đúng định dạng cho UI/API (`EbookViewModel.formattedPrice`, `OrderListViewModel` + `findRecentOrders(limit)`, `toArray()`/`JsonSerializable`). Nguyên tắc: không dùng đối tượng mutable có logic phức tạp cho việc chỉ đọc |
| 5. Application Service và Command | 33–38 | Đã đọc | Controller phình to vì chứa use case. Application Service điều phối một use case, gọi được từ web, CLI, job, test. Command/DTO gom input: `PlaceOrderCommand(customerId, items, email…)`; `PlaceOrderService.handle(cmd): OrderId` lấy sản phẩm, kiểm tồn kho (`OutOfStockException`), tính tiền, `nextIdentity()`, `Order::create`, `save`. Controller chỉ đổi request thành command và trả response. Dependency Injection qua constructor thay cho Service Locator (`app()->make`). Test bằng repository in-memory và stub email, không cần framework |
| 6. Kiến trúc phân lớp | 38–48 | Đã đọc | Gốc 3-tier: Presentation, Business Logic, Data Access. Lợi: biết đặt code ở đâu, đổi công nghệ một tầng, test từng tầng. Rủi ro: rò rỉ logic giữa tầng (chỉ có kỷ luật ngăn), quá nhiều tầng thành "mã lasagna". Vấn đề thường gặp: code spaghetti, phát triển "từ dưới lên" từ bảng DB (domain thành "nô lệ" của database), khó đổi, test flaky. Giải pháp ba tầng: Domain (entity/aggregate, value object, domain service, domain event, repository interface, factory; không import framework; Hollywood Principle), Application (use case handler, command/query, transaction, "lớp keo"), Infrastructure (framework và driver, ORM, adapter dịch vụ ngoài, implement interface; test dạng integration). Dependency Rule: chỉ phụ thuộc vào trong. Sơ đồ: `[Giao diện] -> [Application] -> [Domain] <- [Infrastructure]`. Cây thư mục `app/Domain`, `app/Application`, `app/Infrastructure`; `OrderServiceProvider` bind interface với `EloquentOrderRepository`; luồng `/orders/place` → controller → `PlaceOrderHandler` → repository → event `OrderPlaced` → listener gửi email. Lưu ý: không phải việc gì cũng cần nhiều lớp |
| 7. Ports and Adapters | 48–59 | Đã đọc | Hexagonal Architecture (Alistair Cockburn, 2005): lõi ở giữa, port trên các mặt, adapter cắm vào; "lục giác" chỉ là ẩn dụ. Ví dụ cổng USB. Hạn chế còn lại của phân lớp: phụ thuộc ngầm, thêm kênh mới khó, test application còn chậm, tích hợp hệ thống khác làm bẩn domain. Port đầu vào (UI, API, CLI, bộ test) và đầu ra (persistence, notification, dịch vụ ngoài); port là interface. Adapter là code cụ thể ở Infrastructure; mỗi port có ít nhất một adapter thật và một adapter giả cho test (Cockburn đề xuất chủ yếu vì testing). Bốn bước áp dụng: xác định port, định nghĩa interface trong core, viết adapter, nối bằng DI. Ví dụ: `OrderRepository` (Eloquent / InMemory), `OrderNotification.sendOrderConfirmation` (Email / Log), `HexagonBindings`; test `PlaceOrderHandler` với adapter giả, không boot Laravel. Mở rộng: `ImportOrderCommand` đọc CSV, lưu hai DB song song, port `CustomerContext` giữa các bounded context. Tổng kết sáu lợi ích; cái giá: nhiều interface và class hơn, cần quy ước đặt tên, đừng trừu tượng hóa mọi thứ |
| Lời kết | 60 | Đã đọc | Lời cảm ơn. Có email cá nhân: không dùng |

## Ý chính xuyên suốt (diễn giải của kênh, có trang dẫn)

- Một câu hỏi phân loại dùng suốt sách: "đoạn code này có chạy độc lập, trong bộ nhớ, không cần gì bên ngoài không?"
  (PDF 11, 15–16).
- Mỗi chương là một bước refactor cùng một chức năng đặt hàng: trộn lẫn → entity + repository → read model →
  application service + command → ba tầng → port và adapter (PDF 9–10, 27–29, 36–37, 45–47, 53–57).
- Phụ thuộc chỉ hướng vào trong; lợi ích đo được rõ nhất là test nhanh không cần DB hay framework, và đổi công nghệ
  chỉ sửa adapter (PDF 29–30, 37, 44, 57–58).
- Sách nhắc hai lần rằng không nên áp dụng máy móc: gộp bớt lớp cho việc đơn giản (PDF 48), chỉ dùng port/adapter ở
  chỗ dễ thay đổi hoặc khó test (PDF 59).

## Giới hạn nguồn (để ghi trong mô tả nếu cần)

- Ví dụ chỉ bằng Laravel/PHP và một miền nghiệp vụ nhỏ (đặt hàng); không có số liệu đo, không có dự án mẫu hoàn chỉnh.
- Chủ đề DI so với Service Locator và composition root được hẹn nhưng không có chương riêng.
- Aggregate, bounded context, CQRS, domain event chỉ được nhắc ở mức giới thiệu.
