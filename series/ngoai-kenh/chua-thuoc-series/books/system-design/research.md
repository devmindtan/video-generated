# Nghiên cứu sách — System Design — Nguyễn Thế Huy

## Nguồn

- Tên đầy đủ trên mỗi trang: *Hướng dẫn cách tiếp cận phỏng vấn System Design*, tác giả Nguyễn Thế Huy (tự giới thiệu là
  Technical Leader hơn 10 năm kinh nghiệm, PDF 5). Ebook tiếng Việt, không có trang thông tin xuất bản, năm hay NXB.
- PDF source SHA-256: `f119d2b346861c620b66bed8afb5bb6a51c42906cafbe269133d8a9fb0f5400b`. Cache edition:
  `f119d2b3…400b-de2a45e349f9` (PyMuPDF 1.26.7). `inventory --verify`: toàn vẹn ngày 2026-11-11.
- Nguồn người dùng thêm qua trang quản lý: `library/books/system-design/sources/System Design.pdf` (94 trang PDF).
- Native text, không OCR, 218.029 ký tự. 0 trang bị gắn cờ cần xem lại. Có 92 bookmark; bản đồ chương:
  [chapters.json](chapters.json). Không có số trang in: mọi tham chiếu dưới đây là trang PDF.

## Kiểm tra chất lượng và phạm vi

- Đã đọc tuần tự toàn bộ PDF 2–94 ngày 2026-11-11 (mục lục, lời mở đầu, 10/10 chương, lời kết). Dấu tiếng Việt và thứ
  tự đọc tốt; tiêu đề chương 4 và 7 bị đảo chữ khi trích xuất ("dữ liệu, Sharding và TốiLựa chọn Cơ sở…") nhưng bookmark
  đúng.
- Sách là hướng dẫn phỏng vấn, không phải giáo trình: mỗi chương giải thích khái niệm bằng ví dụ đời thường rồi kết bằng
  "gợi ý khi phỏng vấn" kèm câu trả lời mẫu. Sách không có bài thiết kế mẫu trọn vẹn (vd. thiết kế Instagram từ đầu đến
  cuối), không có ước lượng dung lượng (back-of-the-envelope) và không có sơ đồ.
- Đánh số chương trong sách không nhất quán (PDF 11 gọi "chương 2", PDF 41 nhắc "Chương 3", PDF 63 gọi "Chương 6" dù
  chương Idempotency không đánh số). Ở đây đánh số theo bookmark.
- Một vài con số trong sách là ước lượng phổ biến, không có nguồn: 99,99% ≈ 53 phút/năm, 99,9% ≈ 8,8 giờ/năm (PDF 76);
  "99,99% nghĩa là trong 10000 phút chỉ được ngưng 1 phút" (PDF 13). Các phép tính này đúng về số học.
- Trang cuối có email cá nhân của tác giả: không đưa vào video, mô tả hay tài liệu.

## Coverage và ghi chú từng chương

| Chương | PDF | Trạng thái | Ghi chú nội dung |
|---|---:|---|---|
| Lời mở đầu | 5 | Đã đọc | Mục đích: khái niệm cốt lõi và kinh nghiệm phỏng vấn System Design, cho cả người mới lẫn người có kinh nghiệm |
| 1. Giới thiệu | 6–10 | Đã đọc | Vòng phỏng vấn: bài toán mở (thiết kế Instagram, WhatsApp, Netflix), không code, vẽ sơ đồ, thảo luận đánh đổi. Bốn khó khăn: câu hỏi mở không có đáp án cố định; thiếu kinh nghiệm hệ thống lớn; áp lực 45–60 phút; thiếu phương pháp (hỏi rõ yêu cầu → thiết kế tổng quan → đi sâu); ám ảnh giải pháp hoàn hảo. Năm kỹ năng: nền tảng, phân tích (functional/non-functional), thiết kế quy mô lớn, ra quyết định và đánh đổi, giao tiếp ("nghĩ thành tiếng") |
| 2. Khái niệm nền tảng | 11–21 | Đã đọc | Latency (bưu phẩm Hà Nội–TP.HCM) và throughput (trạm thu phí 60 xe/phút): không tỷ lệ thuận. Scalability: quán phở 5 bàn, mở rộng dọc (nồi to hơn) vs ngang (thêm quán), ngang thường được ưu tiên nhưng cần load balancer. Availability: các số 9 (99,99% → 1 phút/10.000 phút). Reliability bao hàm availability cộng tính toàn vẹn dữ liệu. Kiến trúc cấp cao như bản thiết kế ngôi nhà. Thành phần: web server = lễ tân, application server = bếp, database = bộ nhớ (SQL/NoSQL, replication), load balancer (round-robin, least connections), cache (photo tài liệu để trên bàn; invalidate là khó), CDN (kho hàng vệ tinh), message queue (phiếu gọi món ghim trong bếp) |
| 3. Nhất quán và khả dụng | 21–33 | Đã đọc | Nhất quán mạnh (ghế máy bay cuối cùng, ATM), cuối cùng (ảnh đồng bộ ổ cứng mỗi thứ Sáu, avatar), yếu (cache 60 giây, bảng xếp hạng game). Replication đồng bộ chặt/bất đồng bộ; failover primary→secondary; quorum: W+R>N bảo đảm tập đọc và ghi giao nhau (N=5, W=R=3; Cassandra tunable). CAP: khi phân vùng mạng phải chọn C hoặc A; P coi như bắt buộc nên chọn CP (ngân hàng, SQL) hay AP (NoSQL, mạng xã hội). Ví dụ hai cửa hàng chung kho mất mạng. Ba điều khi phỏng vấn: hiểu nhu cầu, biết đánh đổi, giải thích mạch lạc (PDF 33) |
| 4. Cơ sở dữ liệu và lưu trữ | 33–44 | Đã đọc | SQL (schema, ACID, JOIN, khó scale-out) vs NoSQL (linh hoạt, scale-out, hy sinh nhất quán tức thì); thường kết hợp (app chi tiêu cá nhân). Sharding: theo phạm vi (dễ truy vấn khoảng, dễ lệch), theo băm (đều, khó thêm node → consistent hashing), theo bảng tra, theo địa lý (GDPR); shard key sai tạo hot spot; MVP chưa cần shard. Index như mục lục sách, B-Tree; không lạm dụng (chậm ghi); thứ tự cột của composite index (country, name) quan trọng. Chọn lưu trữ: OLTP/OLAP, mô hình dữ liệu (KV, document, graph, object storage), quy mô, nhất quán, chi phí và kinh nghiệm đội, polyglot persistence. Gợi ý trình bày: yêu cầu dữ liệu → chọn loại DB có lý do → thực thể chính → kế hoạch replica/shard → index → nhất quán từng module → tự tin trước "nếu… thì sao" |
| 5. Mở rộng và hiệu suất | 45–60 | Đã đọc | Load balancer như nhân viên điều phối quầy ngân hàng: chia tải, mở rộng, sẵn sàng, một địa chỉ duy nhất. Thuật toán: round robin, least connections, IP hash (sticky), weighted round robin. Tầng 4 (IP/port, nhanh) vs tầng 7 (đọc URL, cookie; /video/720p vs /1080p; terminate SSL). Cache: nhớ đường lần hai; lợi ích; vị trí client, CDN, reverse proxy, ứng dụng, database. Chiến lược: cache-aside (lazy loading, miss → DB → ghi cache; ghi DB thì xóa cache), write-through (ghi cả hai, chậm ghi), write-back (ghi cache trước, dirty, rủi ro mất dữ liệu), refresh-ahead (làm mới trước khi hết TTL, báo 7 giờ sáng); ví dụ tỷ giá USD. Message queue: số thứ tự ở quán ăn; dùng cho việc nền, đỉnh tải, microservices ("Order Created"), tracking; RabbitMQ, Kafka, SQS; producer–queue–consumer, FIFO, decoupling, tăng consumer; backpressure khi producer nhanh hơn consumer; ví dụ upload video → queue VideoProcessing → worker |
| 6. Idempotency và khóa | 60–62 | Đã đọc | Idempotency: lệnh trừ 100k gửi nhiều lần chỉ trừ một lần; GET/PUT/DELETE idempotent, POST/PATCH thì không → idempotency key. Khóa bi quan: khóa trước (SELECT … FOR UPDATE), an toàn nhưng chờ và deadlock. Khóa lạc quan: cột version, UPDATE … WHERE id = ? AND version = ?, xung đột thì retry. Hợp với ít xung đột/đọc nhiều; bi quan cho tài chính |
| 7. Giao tiếp và API | 62–70 | Đã đọc | HTTP request/response, stateless (cần cookie/token), GET/POST/PUT/PATCH/DELETE. TCP: bắt tay ba bước, ACK, gửi lại, đúng thứ tự (file, DB, email). UDP: gửi là quên, nhanh, mất gói chấp nhận được (gọi video, game, DNS, QUIC/HTTP3). RPC/gRPC: gọi hàm từ xa như hàm nội bộ, nhị phân nhanh, khớp nối chặt, không gọi thẳng từ trình duyệt → nội bộ. REST: tài nguyên + URL + verb (GET /tasks, POST /tasks, DELETE /tasks/123), dễ dùng, mở rộng tốt, chậm hơn nhị phân → API công khai, có thể đặt API Gateway REST trước gRPC nội bộ |
| 8. Chịu lỗi và phục hồi | 71–79 | Đã đọc | "Mọi thứ có thể hỏng sẽ hỏng". Sự cố: phần cứng, phần mềm, mạng (partition), con người, quá tải. Chiến lược: redundancy/replication (không để trứng một giỏ, bỏ single point of failure), failover active–passive với health check, load balancing, retry có giới hạn + exponential backoff (2 s, 4 s…), graceful degradation + circuit breaker ("chạy chậm còn hơn đứng hẳn": tắt bình luận trực tiếp, hạ HD xuống SD), health check và monitoring (ping 5 giây, 3 lần không phản hồi → failover). HA (cho phép gián đoạn ngắn, rẻ) vs FT (active–active, không gián đoạn, đắt); máy bay hai động cơ vs trực thăng một động cơ. Chỉ số: uptime (99,9% ≈ 8,8 giờ/năm, 99,99% ≈ 53 phút/năm), SLA, MTBF (168 giờ, 3 lần sập → ≈55 giờ), MTTR (4 sự cố, 2 giờ → 30 phút) |
| 9. Bảo mật và phân quyền | 80–85 | Đã đọc | Phòng thủ nhiều lớp. Xác thực: mật khẩu (hash+salt), MFA/OTP, session (stateful, dễ thu hồi), JWT (header.payload.signature, payload đọc được, khó thu hồi). Phân quyền: RBAC (vai trò, "role explosion"), ABAC (thuộc tính, giờ hành chính), OAuth2 (access token, scope; OpenID Connect cho nhận dạng). API: không nhúng API key ở client, CORS, rate limit (5 lần sai/10 phút), input validation (SQL injection, XSS). Dữ liệu: HTTPS/TLS, HSTS, mã hóa lưu trữ, Argon2/bcrypt + salt, XSS (escape, CSP), CSRF (token, SameSite), cookie Secure/HttpOnly/SameSite. Ví dụ upload file, quản lý người dùng, ngân hàng. Đánh đổi hiệu năng–bảo mật |
| 10. Monitoring và Observability | 86–93 | Đã đọc | Monitoring: chỉ số định sẵn, ngưỡng cảnh báo (lỗi 500 > 1%), trả lời "chuyện gì đang xảy ra"; Prometheus, Grafana, Nagios/Zabbix, Datadog, New Relic. Observability: suy ra trạng thái bên trong từ đầu ra, trả lời "vì sao"; ba trụ cột logs, metrics (độ trễ 100 ms → 500 ms lúc 10 giờ), traces (A → B → C, C timeout khi gọi bên thứ ba). Đèn cảnh báo trên xe vs máy chẩn đoán dưới nắp capo. ELK, Jaeger/Zipkin, OpenTelemetry. Gợi ý trình bày: metric chính, cảnh báo, logging + tracing, công cụ "một cách tự nhiên" |
| Lời kết | 94 | Đã đọc | Lời cảm ơn, mong người đọc thành "kiến trúc sư ứng dụng đúng nghĩa". Có email cá nhân: không dùng |

## Ý chính xuyên suốt (diễn giải của kênh, có trang dẫn)

- Không có thiết kế đúng tuyệt đối; người phỏng vấn chấm cách tiếp cận và cách đánh đổi (PDF 7–8, 79).
- Mọi chương quay về cùng một khung: hiểu yêu cầu → chọn giải pháp có lý do → nói rõ cái giá phải trả (PDF 31–33,
  42–44, 77–79, 91–93).
- Mỗi kỹ thuật đi kèm một đánh đổi cụ thể: nhanh–chính xác (CAP, cache, quorum), đơn giản–chịu lỗi (HA/FT), hiệu năng–
  bảo mật (TLS, băm mật khẩu).

## Giới hạn nguồn (để ghi trong mô tả nếu cần)

- Là hướng dẫn nhập môn cho junior–middle (PDF 11, 33): giải thích khái niệm, chưa đi vào một bài thiết kế mẫu đầy đủ
  hay ước lượng dung lượng.
- Tên công cụ (Kafka, RabbitMQ, Prometheus…) là ví dụ phổ biến tại thời điểm viết, không phải khuyến nghị duy nhất.
