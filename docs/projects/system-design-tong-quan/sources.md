# Nguồn — System Design: tóm tắt cả cuốn sách

- Sách: *Hướng dẫn cách tiếp cận phỏng vấn System Design* (System Design), Nguyễn Thế Huy, ebook PDF 94 trang.
- Source SHA-256 `f119d2b346861c620b66bed8afb5bb6a51c42906cafbe269133d8a9fb0f5400b`, cache edition `…-de2a45e349f9`,
  `inventory --verify` toàn vẹn 2026-11-11. Hồ sơ: [research.md](../../../series/ngoai-kenh/chua-thuoc-series/books/system-design/research.md),
  [chapters.json](../../../series/ngoai-kenh/chua-thuoc-series/books/system-design/chapters.json).
- Phạm vi: tổng quan cả sách; đã đọc đủ 10/10 chương, lời mở đầu, lời kết. Số trang là trang PDF (sách không có số in).

| Đoạn kịch bản | Ý / chi tiết dùng | Trang PDF |
|---|---|---|
| 00 Mở đầu | Bài toán mở kiểu "thiết kế mạng xã hội chia sẻ ảnh", không code, không đáp án đúng tuyệt đối; kết quả ảnh hưởng quyết định tuyển dụng và đãi ngộ | 6–8 |
| 01 Vòng phỏng vấn | Dịch vụ nhắn tin, nền tảng xem phim; vẽ thành phần, tương tác, đáp ứng yêu cầu; các khó khăn (câu hỏi mở, thiếu kinh nghiệm hệ thống lớn, 45–60 phút, ám ảnh hoàn hảo); "đa số ứng viên thất bại… do thiếu một quy trình tư duy lặp lại được"; khung hỏi yêu cầu → tổng quan → đi sâu; "nghĩ thành tiếng" | 6–10 |
| 02 Nền tảng | Trạm thu phí (latency/throughput), không tỷ lệ thuận; quán phở 5 bàn, mở rộng dọc/ngang; 99,99% = 1 phút trên 10.000 phút; reliability; bản thiết kế ngôi nhà; lễ tân/bếp/bộ nhớ; LB, cache, CDN, message queue | 11–20 |
| 03 Nhất quán | Ghế máy bay cuối cùng; avatar vài giây; replication đồng bộ/bất đồng bộ; failover; quorum N=5, W=R=3, W+R>N; CAP, CP/AP; hai cửa hàng chung kho, laptop cuối cùng; ngân hàng vs mạng xã hội; "hiểu nhu cầu, biết đánh đổi, giải thích mạch lạc" | 21–33 |
| 04 Dữ liệu | SQL/NoSQL và kết hợp (số dư vs nhật ký hoạt động); 4 chiến lược sharding, consistent hashing, hot spot; index như mục lục, chậm ghi, thứ tự cột composite; tăng 10 lần | 33–44 |
| 05 Mở rộng | Nhân viên điều phối quầy ngân hàng; round robin, least connections, IP hash; tầng 4/7; cache = nhớ đường lần hai; vị trí cache; cache-aside, write-through, write-back; invalidation khó; phiếu gọi món, producer/consumer; upload video → worker; backpressure | 45–60 |
| 06 Idempotency | Trừ tiền nhiều lần; idempotency key; khóa bi quan/lạc quan, version, deadlock; tài chính dùng bi quan | 60–62 |
| 07 Giao tiếp | HTTP stateless; TCP bắt tay ba bước, ACK, gửi lại; UDP gửi là quên, video call/game; RPC/gRPC nội bộ, khớp nối chặt; REST cho API công khai, GET/POST/DELETE /tasks | 62–70 |
| 08 Chịu lỗi | "Mọi thứ có thể hỏng sẽ hỏng"; 5 loại sự cố; redundancy, health check + failover, retry với backoff tăng gấp đôi, circuit breaker, graceful degradation (HD → thấp); HA vs FT, máy bay hai động cơ; MTBF, MTTR | 71–79 |
| 09 Bảo mật | Hash + salt, OTP; session vs JWT (payload đọc được, khó thu hồi); RBAC, ABAC (giờ hành chính, phòng ban); OAuth2 access token; rate limit, input validation, không nhúng API key ở client; HTTPS; cookie Secure/HttpOnly/SameSite; XSS, CSRF; phòng thủ nhiều lớp | 80–85 |
| 10 Giám sát | Monitoring "chuyện gì", observability "vì sao"; metrics (100 → 500 ms lúc 10 giờ), logs, traces; đèn cảnh báo vs máy chẩn đoán dưới nắp capo | 86–93 |
| 11 Khép lại | Không có thiết kế hoàn hảo, người phỏng vấn xem cách suy nghĩ; ba cặp đánh đổi lặp lại qua các chương (lời kênh tổng hợp) | 7–8, 33, 74–79, 85 |

## Diễn giải của kênh (không phải lời sách)

- Câu nối giữa các đoạn, câu hỏi mở đầu chương, và câu tổng kết ở đoạn 11 ("câu hỏi lặp lại nhiều nhất…").
- Ví dụ "Em sẽ đặt load balancer trước các server, và dùng cache cho dữ liệu đọc nhiều…" trên màn hình mở đầu là câu
  rút gọn từ các gợi ý phỏng vấn của sách (PDF 49, 54–55), không phải trích nguyên văn.
