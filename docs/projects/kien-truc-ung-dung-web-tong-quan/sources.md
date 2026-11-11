# Nguồn — Kiến trúc ứng dụng web: tóm tắt cả cuốn sách

- Sách: *Kiến trúc ứng dụng web*, Nguyễn Thế Huy, ebook PDF 60 trang, tiếng Việt, tác giả tự phát hành; không có
  trang thông tin xuất bản/ISBN. Cùng tác giả với cuốn `system-design`.
- Source SHA-256 `fd1059a41637391c2c5f0ff5abfbb384e24c0686db9b63621941d856bd71d86a`, cache edition
  `fd1059a4…d86a-de2a45e349f9`, `inventory --verify` toàn vẹn 2026-11-11. Hồ sơ:
  [research.md](../../../series/ngoai-kenh/chua-thuoc-series/books/kien-truc-ung-dung-web/research.md),
  [chapters.json](../../../series/ngoai-kenh/chua-thuoc-series/books/kien-truc-ung-dung-web/chapters.json).
- Phạm vi: tổng quan cả sách; đã đọc đủ 7/7 chương, lời mở đầu, lời kết. Số trang là trang PDF 1-based (sách không
  đánh số trang in). Sách dạy bằng một ví dụ xuyên suốt: đặt hàng e-book trong Laravel/PHP.

| Đoạn kịch bản | Ý / chi tiết dùng | Trang PDF |
|---|---|---|
| 00 Mở đầu | Controller `orderEbook(Request)` lấy giá bằng `DB::table('ebooks')`, tính `quantity * price`, insert `orders`, lưu id vào session; không kiểm tra email/số lượng; ba câu hỏi đổi database, thêm job mail, viết test; câu hỏi phân loại core/hạ tầng | 3, 9–11, 15–16 |
| 01 Trộn lẫn | Năm vấn đề khi trộn core và hạ tầng: khó nắm logic, phụ thuộc công nghệ, khó test tự động, không bảo đảm dữ liệu hợp lệ, bảo trì khó/legacy; sáu lợi ích; nhận định "vòng đời dài hơn 2 năm" (lời tác giả) | 3–11 |
| 02 Ranh giới | Core code chạy chỉ với bộ nhớ và CPU; hai quy tắc; ví dụ VAT, `calculateTotalAmount`, `OrderService.placeOrder`; hạ tầng = tổng code − core; phân loại theo chức năng, không theo thư mục; interface `Connection.insert` vẫn lộ DB; `Clock`/`SystemClock` | 11–16 |
| 03 Domain Model | Transaction Script so với Domain Model; entity `Order(ebookId, email, quantity, pricePerUnit)` ném exception khi id ≤ 0, email sai, số lượng ≤ 0, giá âm; tự tính `totalAmount`; entity có danh tính, value object bất biến (`EmailAddress`, `Money`) | 16–25 |
| 04 Repository | Repository là "kho" đối tượng domain; domain chỉ thấy interface; `save(Order): int`, `getById(int): Order`; mẹo "giả định đã có thành phần mình cần rồi định nghĩa nó"; `SqlOrderRepository` (query builder/`insertGetId` hoặc Eloquent ẩn bên trong), `MemoryOrderRepository`, `RemoteOrderRepository`; controller sau refactor; lợi ích: POPO thuần, MySQL trong một lớp, test riêng | 22–30 |
| 05 Read model, view model | Không dùng entity ghi cho việc đọc (mang theo `changePrice()`, `hide()`, làm class phình); tách `EbookReadModel` + `EbookReadRepository`, hoặc `GetPrice.ofEbook(EbookId)`; CQRS nặng hơn (lưu trữ đọc riêng, domain event, nhất quán); sách chọn chung DB + repository đọc riêng + integration test; view model DTO (`formattedPrice`, `OrderListViewModel.findRecentOrders`, `toArray`/`JsonSerializable`); nguyên tắc không dùng đối tượng mutable có logic phức tạp cho việc chỉ đọc | 30–33 |
| 06 Application Service, Command | Controller phình vì chứa use case; Application Service điều phối một use case, gọi được từ web/CLI/job/test; `PlaceOrderCommand(customerId, items, email…)`; `PlaceOrderService.handle(cmd): OrderId` lấy sản phẩm, kiểm tồn kho (`OutOfStockException`), tính tiền, `nextIdentity()`, `Order::create`, `save`; controller chỉ đổi request thành command và trả response; constructor injection thay `app()->make`; test bằng repository in-memory và stub email, không cần framework | 33–38 |
| 07 Ba tầng | Gốc 3-tier Presentation/Business Logic/Data Access; lợi ích và rủi ro rò rỉ logic, "mã lasagna"; ba tầng Domain (entity/aggregate, value object, domain service, domain event, repository interface, factory; không import framework; Hollywood Principle), Application (use case handler, command/query, transaction, lớp keo), Infrastructure (framework, ORM, adapter, implement interface; test integration); Dependency Rule chỉ hướng vào trong; sơ đồ `[Giao diện] → [Application] → [Domain] ← [Infrastructure]`; cây thư mục `app/Domain`, `app/Application`, `app/Infrastructure`; `OrderServiceProvider`; luồng `/orders/place` → controller → `PlaceOrderHandler` → repository → `OrderPlaced` → listener gửi email; không phải việc gì cũng cần nhiều lớp | 38–48 |
| 08 Ports and Adapters | Hexagonal Architecture (Alistair Cockburn, 2005), ẩn dụ cổng USB; hạn chế còn lại của phân lớp: phụ thuộc ngầm, thêm kênh mới khó, test application còn chậm, tích hợp hệ thống khác làm bẩn domain; port đầu vào (UI, API, CLI, bộ test) và đầu ra (persistence, notification, dịch vụ ngoài); port là interface, adapter là code cụ thể ở Infrastructure; mỗi port có ít nhất một adapter thật và một adapter giả cho test (Cockburn chủ yếu vì testing); bốn bước áp dụng; `OrderRepository` (Eloquent/InMemory), `OrderNotification.sendOrderConfirmation` (Email/Log), `HexagonBindings`; test `PlaceOrderHandler` với adapter giả, không boot Laravel; mở rộng `ImportOrderCommand` CSV, lưu hai DB, `CustomerContext` giữa bounded context; cái giá: nhiều interface/class hơn, cần quy ước đặt tên, đừng trừu tượng hóa mọi thứ | 48–59 |
| 09 Khép lại | Câu hỏi phân loại xuyên suốt; bắt đầu nhỏ với một use case, một phụ thuộc khó test, một test không cần database; kiến trúc để biết sửa ở đâu | 11, 15–16, 59–60 |

## Diễn giải của kênh (không phải lời sách)

- Câu hook "chạy đúng, nhưng nghiệp vụ tính tiền nằm ở đâu" và câu chốt "khi yêu cầu đổi, bạn biết phải sửa ở đâu" là
  cách kênh đặt vấn đề, dựa trên PDF 3, 9–11 và 59–60.
- Các câu nối giữa đoạn, câu hỏi mở đầu chương và ví dụ "đổi sang PostgreSQL" là lời kênh; sách dùng MySQL/SQL.
- Không trích nguyên văn câu nào; mọi tên class, tham số và hành vi đều lấy từ ví dụ của sách.

## Giới hạn nguồn

- Sách chỉ dùng Laravel/PHP và một miền nghiệp vụ nhỏ (đặt hàng), không có số liệu đo hay dự án mẫu hoàn chỉnh.
- Chủ đề DI so với Service Locator và composition root được hẹn nhưng không có chương riêng.
- Aggregate, bounded context, CQRS, domain event chỉ ở mức giới thiệu.
