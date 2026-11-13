---
name: sysdesign-scaling
description: Mở rộng và tăng hiệu năng hệ thống - load balancer (round robin, least connections, IP hash, weighted; tầng 4 và tầng 7), cache (vị trí từ client, CDN, reverse proxy, ứng dụng tới database; chiến lược cache-aside, write-through, write-back, refresh-ahead; TTL và xóa cache), message queue (việc nền, san tải đỉnh, tách service, nhiều consumer, backpressure), idempotency key cho thao tác lặp lại an toàn, khóa bi quan và khóa lạc quan khi ghi đồng thời. Dùng khi hệ thống chậm hoặc sắp quá tải, khi thêm cache hay hàng đợi, khi API bị gọi lặp (retry, double click, webhook gửi hai lần), khi hai người cùng sửa một bản ghi, hoặc khi người dùng hỏi về load balancing, caching, queue, Kafka/RabbitMQ, race condition. English triggers - load balancer, caching strategy, cache invalidation, message queue, async processing, backpressure, idempotency key, optimistic locking, pessimistic locking, SELECT FOR UPDATE, race condition.
---

# Mở rộng và hiệu năng

Thêm từng kỹ thuật khi đo được vấn đề nó giải, không phải để "đủ bộ". Mỗi kỹ thuật đem theo một độ phức tạp vận hành.

## Load balancer

Một địa chỉ duy nhất phía trước nhiều máy: chia tải, cho phép thêm máy, bỏ máy hỏng (cần health check).

- **Round robin**: lần lượt; đơn giản, hợp khi các máy và yêu cầu giống nhau.
- **Least connections**: gửi cho máy đang ít kết nối nhất; hợp khi yêu cầu dài ngắn khác nhau.
- **IP hash / sticky**: cùng client về cùng máy; chỉ dùng khi buộc phải giữ phiên trong máy, tốt hơn là đưa phiên ra kho
  chung để app không giữ trạng thái.
- **Weighted**: máy mạnh nhận nhiều hơn.
- **Tầng 4** (theo IP/port): nhanh, không hiểu nội dung. **Tầng 7** (theo URL, header, cookie): định tuyến theo đường dẫn
  (ví dụ tách đường video độ phân giải khác nhau sang cụm khác nhau), kết thúc TLS, nhưng tốn tài nguyên hơn.
- Bản thân load balancer cũng cần dự phòng (cặp active–passive hoặc dịch vụ có sẵn của cloud).

## Cache

Đặt ở đâu: trình duyệt/app, CDN, reverse proxy, bộ nhớ của ứng dụng hoặc cache chung (Redis, Memcached), cache của
database. Gần người dùng hơn thì nhanh hơn nhưng khó xóa hơn.

| Chiến lược | Cách chạy | Hợp với | Rủi ro |
|---|---|---|---|
| Cache-aside (lazy) | đọc cache; trượt thì đọc DB rồi ghi cache; ghi DB thì xóa key | đa số trường hợp đọc nhiều | lần đầu chậm; dữ liệu cũ nếu quên xóa |
| Write-through | ghi cache và DB cùng lúc | đọc ngay sau ghi phải mới | ghi chậm hơn |
| Write-back | ghi cache trước, đẩy DB sau | ghi rất nhiều, chấp nhận rủi ro | mất dữ liệu nếu cache chết trước khi đẩy |
| Refresh-ahead | làm mới trước khi TTL hết | dữ liệu đọc nóng, dự đoán được (tỷ giá, bảng giá) | làm mới cả thứ không ai đọc |

Quy tắc: luôn có TTL; quyết định rõ ai xóa key khi dữ liệu đổi; không cache dữ liệu cần nhất quán mạnh (số dư) trừ khi
hiểu rõ cách xóa; đề phòng nhiều yêu cầu cùng trượt một key nóng (khóa nạp lại hoặc làm mới sớm). Xóa cache đúng lúc là phần
khó nhất.

## Message queue

Producer đẩy việc vào hàng đợi, consumer chạy nền lấy ra xử lý. Dùng cho: việc chậm không cần làm trong request (email,
xử lý video, báo cáo), san tải đột biến, tách các service qua sự kiện ("đơn đã tạo"), ghi nhận sự kiện theo dõi. Lợi: phản
hồi người dùng nhanh hơn, service độc lập, tăng consumer khi hàng dài ra.

Cần thiết kế thêm:
- **Backpressure** khi producer nhanh hơn consumer: theo dõi độ dài hàng, giới hạn, làm chậm hoặc từ chối bớt phía nhận.
- Hầu hết hàng đợi giao **ít nhất một lần**: consumer phải xử lý trùng an toàn (idempotent, bên dưới).
- Thứ tự chỉ bảo đảm trong phạm vi hẹp (một partition/queue); việc cần thứ tự phải chọn key cho đúng.
- Việc lỗi nhiều lần đi vào hàng chết (dead-letter) để người xem, không lặp vô hạn.

RabbitMQ, Kafka, SQS là ví dụ sách nêu; chọn theo nhu cầu (hàng việc hay log sự kiện lưu lâu) và thứ đội đã vận hành.

## Idempotency

Gọi một thao tác nhiều lần cho cùng kết quả như gọi một lần. Bắt buộc với tiền, đơn hàng, webhook, mọi thứ có retry.
GET, PUT, DELETE vốn idempotent theo ngữ nghĩa; POST, PATCH thì không. Cách làm: client gửi **idempotency key** duy nhất
cho mỗi ý định; server lưu key cùng kết quả (ràng buộc unique trong database), gặp lại key thì trả kết quả cũ, không làm lại.
Ví dụ code: [references/concurrency.md](references/concurrency.md).

## Ghi đồng thời: khóa bi quan và lạc quan

- **Bi quan**: khóa bản ghi trước khi sửa (`SELECT … FOR UPDATE` trong transaction). Chắc chắn, nhưng người khác phải chờ,
  có thể deadlock. Dùng khi xung đột thường xuyên hoặc sai là mất tiền (chuyển khoản, giữ chỗ).
- **Lạc quan**: mỗi bản ghi có `version`; cập nhật kèm điều kiện version cũ, không dòng nào bị đổi nghĩa là có người sửa
  trước, đọc lại và thử lại hoặc báo người dùng. Không khóa, hợp khi xung đột hiếm, đọc nhiều ghi ít.

## Nguồn

Ý của sách "System Design" (Nguyễn Thế Huy, ebook tiếng Việt), số trang là trang PDF:

- Load balancer, bốn thuật toán, tầng 4 và tầng 7: PDF tr. 45–49. Cache: lợi ích, vị trí, bốn chiến lược, ví dụ tỷ giá:
  PDF tr. 49–55. Message queue: trường hợp dùng, producer–queue–consumer, tăng consumer, backpressure, ví dụ xử lý video,
  gợi ý trình bày: PDF tr. 55–60.
- Idempotency, idempotency key, khóa bi quan, khóa lạc quan và khi nào chọn: PDF tr. 60–62.

Phần của skill: giao "ít nhất một lần", dead-letter, thứ tự theo partition, nguy cơ nhiều yêu cầu cùng trượt một key nóng,
ví dụ code idempotency và optimistic locking (kiến thức chung, không có trong sách).
