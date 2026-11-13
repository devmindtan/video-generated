---
name: sysdesign-reliability
description: Thiết kế hệ thống chịu lỗi và quan sát được - nhận diện các loại sự cố (phần cứng, phần mềm, mạng chia cắt, con người, quá tải), loại bỏ điểm lỗi đơn bằng dự phòng và replication, failover active-passive có health check, retry có giới hạn với exponential backoff và jitter, circuit breaker, graceful degradation, chọn giữa high availability và fault tolerance, đo uptime/SLA/MTBF/MTTR; cùng monitoring (chỉ số, ngưỡng cảnh báo) và observability (logs, metrics, traces). Dùng khi thiết kế hoặc review độ tin cậy của một service, khi gọi dịch vụ ngoài hay service khác, khi đặt SLO/cảnh báo, khi thêm logging/tracing, sau một sự cố, hoặc khi người dùng hỏi về failover, retry, circuit breaker, monitoring, observability. English triggers - fault tolerance, high availability, single point of failure, failover, retry with backoff, circuit breaker, graceful degradation, SLA, SLO, MTTR, monitoring, alerting, observability, logs metrics traces, OpenTelemetry.
---

# Chịu lỗi, phục hồi và quan sát

Mọi thứ có thể hỏng rồi sẽ hỏng: ổ đĩa, máy chủ, bản deploy lỗi, mạng chia cắt, một lệnh gõ nhầm, một đợt tải đột biến.
Thiết kế để khi một phần hỏng thì hệ thống vẫn chạy (có thể kém đi) và đội biết ngay chuyện gì đang xảy ra.

## Các kỹ thuật

- **Dự phòng, bỏ điểm lỗi đơn**: mỗi thành phần quan trọng có ít nhất hai bản (app server sau load balancer, database có
  replica, load balancer có cặp). Vẽ sơ đồ và hỏi từng hộp: hộp này chết thì sao?
- **Failover**: active–passive, bản dự phòng nhận việc khi bản chính hỏng. Cần health check rõ (ví dụ kiểm tra vài giây một
  lần, hỏng vài lần liên tiếp mới chuyển, để tránh chuyển vì một lần chập chờn) và cách tránh hai bản cùng làm chính.
- **Retry có giới hạn với exponential backoff** (chờ 2 s, 4 s, 8 s…) cộng jitter ngẫu nhiên để các client không thử lại cùng
  lúc. Chỉ retry lỗi tạm thời (timeout, 503), không retry lỗi do dữ liệu (400). Thao tác có tác dụng phụ phải idempotent
  trước khi được retry (skill `sysdesign-scaling`). Luôn đặt timeout cho mọi lời gọi ra ngoài.
- **Circuit breaker**: lỗi vượt ngưỡng thì "ngắt", trả lời nhanh bằng phương án dự phòng thay vì tiếp tục gọi dịch vụ đang
  chết; sau một lúc cho thử vài yêu cầu, ổn thì đóng lại. Chặn lỗi lan dây chuyền.
- **Graceful degradation**: chạy chậm hoặc thiếu tính năng phụ còn hơn đứng hẳn: tắt bình luận trực tiếp, hạ chất lượng
  video, trả dữ liệu cache cũ, xếp việc vào hàng đợi làm sau. Quyết trước tính năng nào được tắt.
- **Health check và giám sát** cho từng thành phần, gắn với cảnh báo và failover.

## HA hay FT

- **High availability**: cho phép gián đoạn ngắn khi chuyển sang bản dự phòng; rẻ hơn, đủ cho đa số dịch vụ.
- **Fault tolerance**: chạy song song active–active, không gián đoạn khi một bản hỏng; đắt và phức tạp. Dành cho thứ không
  được phép ngừng (thanh toán lõi, hệ thống an toàn). Giống máy bay hai động cơ so với trực thăng một động cơ.

## Đo độ tin cậy

- **Uptime** theo số 9: 99,9% ≈ 8,8 giờ ngừng/năm, 99,99% ≈ 53 phút/năm. Tính ngược từ ngân sách lỗi này khi chọn kiến trúc.
- **SLA**: cam kết với khách (kèm đền bù); đặt mục tiêu nội bộ (SLO) chặt hơn SLA.
- **MTBF**: thời gian trung bình giữa hai lần hỏng (càng dài càng tốt). **MTTR**: thời gian trung bình để khôi phục (càng
  ngắn càng tốt). Giảm MTTR (phát hiện nhanh, rollback nhanh, runbook) thường rẻ hơn tăng MTBF.

## Monitoring và observability

- **Monitoring** trả lời "chuyện gì đang xảy ra" bằng chỉ số định sẵn và ngưỡng: tỷ lệ lỗi, độ trễ (p50/p95/p99), lưu lượng,
  độ bão hòa (CPU, bộ nhớ, kết nối, độ dài hàng đợi). Cảnh báo theo triệu chứng người dùng thấy (ví dụ lỗi 5xx vượt 1% trong
  5 phút), không theo mọi chỉ số nội bộ.
- **Observability** trả lời "vì sao" từ dữ liệu hệ thống tự phát ra, gồm ba trụ cột:
  - **Logs** có cấu trúc (JSON), có request ID/trace ID, không chứa mật khẩu, token, dữ liệu cá nhân nhạy cảm.
  - **Metrics** theo thời gian để thấy xu hướng (độ trễ tăng từ 100 ms lên 500 ms lúc 10 giờ sáng).
  - **Traces** đi theo một yêu cầu qua nhiều service để tìm chặng chậm hay lỗi (A gọi B gọi C, C timeout khi gọi bên thứ ba).
- Công cụ sách nêu làm ví dụ: Prometheus + Grafana, ELK, Jaeger/Zipkin, OpenTelemetry, Datadog, New Relic. Ưu tiên chuẩn mở
  (OpenTelemetry) để đổi backend không phải sửa code.

## Kiểm tra trước khi giao

- [ ] Mọi lời gọi ra ngoài có timeout; retry có giới hạn, backoff, chỉ cho lỗi tạm thời và thao tác idempotent.
- [ ] Không còn điểm lỗi đơn ở đường chính, hoặc đã ghi rõ chấp nhận rủi ro đó.
- [ ] Có danh sách tính năng được tắt khi quá tải hoặc khi phụ thuộc chết.
- [ ] Có health check, chỉ số chính, ngưỡng cảnh báo, log có trace ID.
- [ ] Biết cách khôi phục: rollback, failover, sao lưu đã thử khôi phục thật.

## Nguồn

Ý của sách "System Design" (Nguyễn Thế Huy, ebook tiếng Việt), số trang là trang PDF:

- Các loại sự cố, dự phòng, failover và health check, load balancing, retry với exponential backoff, graceful degradation và
  circuit breaker, HA so với FT, uptime, SLA, MTBF, MTTR, gợi ý trình bày: PDF tr. 71–79.
- Monitoring và observability, ba trụ cột, ví dụ độ trễ và trace, công cụ, gợi ý trình bày: PDF tr. 86–93.

Phần của skill: jitter, chỉ retry lỗi tạm thời, SLO, ưu tiên giảm MTTR, cảnh báo theo triệu chứng, p95/p99, log không chứa
dữ liệu nhạy cảm, thử khôi phục bản sao lưu (kiến thức chung, không có trong sách).
