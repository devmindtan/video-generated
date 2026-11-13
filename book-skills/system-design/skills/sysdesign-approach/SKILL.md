---
name: sysdesign-approach
description: Cách tiếp cận một bài thiết kế hệ thống (system design) có phương pháp - làm rõ yêu cầu chức năng và phi chức năng, phác kiến trúc tổng quan từ các khối cơ bản (web/app server, database, load balancer, cache, CDN, message queue), đi sâu vào phần quan trọng nhất, nói rõ đánh đổi, và trình bày mạch lạc. Kèm các khái niệm nền (latency, throughput, scalability dọc/ngang, availability theo số 9, reliability). Dùng khi người dùng nhờ thiết kế một hệ thống hay tính năng chịu tải lớn, viết design doc/kiến trúc tổng quan, chuẩn bị hoặc luyện phỏng vấn system design, hoặc hỏi "hệ thống này nên dựng thế nào". English triggers - system design, design a system like X, architecture overview, design doc, scalability, high level design, system design interview, trade-offs.
---

# Tiếp cận một bài thiết kế hệ thống

Không có thiết kế đúng tuyệt đối. Điều có giá trị là **cách đi tới quyết định**: hiểu nhu cầu, chọn có lý do, nói rõ cái giá
phải trả, và đổi hướng được khi yêu cầu đổi. Dùng cùng một khung cho phỏng vấn lẫn thiết kế thật (design doc, review kiến
trúc); các skill `sysdesign-data-storage`, `sysdesign-scaling`, `sysdesign-reliability`, `sysdesign-api-security` đi sâu
từng mảng.

## Khung năm bước

1. **Làm rõ yêu cầu.** Chức năng: người dùng làm được gì (đăng, xem, tìm, nhắn…), cái gì ngoài phạm vi. Phi chức năng: số
   người dùng, tỷ lệ đọc/ghi, độ trễ chấp nhận được, mức sẵn sàng, mức nhất quán cần (tiền khác lượt thích), dữ liệu giữ
   bao lâu, ràng buộc pháp lý hay vùng địa lý. Hỏi, đừng đoán; ghi giả định khi không ai trả lời.
2. **Ước lượng thô** (phần bổ sung của skill, sách không có): yêu cầu/giây trung bình và lúc đỉnh, dung lượng mỗi ngày và
   sau vài năm, băng thông. Chỉ cần đúng bậc độ lớn, để biết có cần shard, cache, CDN hay chưa.
3. **Kiến trúc tổng quan**: vẽ luồng chính qua các khối cơ bản, như bản phác ngôi nhà trước khi vào từng phòng. Bắt đầu
   đơn giản (một app server, một database) rồi thêm khối khi yêu cầu bắt buộc.
4. **Đi sâu** vào hai ba phần khó nhất của bài này (mô hình dữ liệu, đường đọc nóng, luồng thanh toán…), không dàn đều.
5. **Đánh đổi và rủi ro**: mỗi lựa chọn kèm "được gì, mất gì, khi nào phải đổi"; điểm lỗi đơn, nút cổ chai, cách giám sát.

Trong phỏng vấn (45–60 phút): nghĩ thành tiếng, chia thời gian cho cả năm bước, đừng sa vào vẽ chi tiết một hộp khi chưa
nói hết bức tranh. Không cần đáp án hoàn hảo; cần thấy cách quyết định khi thông tin thiếu.

## Khái niệm nền

- **Latency** (một yêu cầu mất bao lâu) và **throughput** (bao nhiêu yêu cầu mỗi giây) không đi cùng nhau: tăng một cái có
  thể làm xấu cái kia.
- **Scalability**: mở rộng **dọc** (máy mạnh hơn, đơn giản, có trần và là điểm lỗi đơn) hay **ngang** (thêm máy, thường
  được ưu tiên, cần load balancer và ứng dụng không giữ trạng thái trong máy).
- **Availability** đo bằng số 9: 99,9% cho phép khoảng 8,8 giờ ngừng mỗi năm, 99,99% khoảng 53 phút. Mỗi số 9 thêm đắt
  hơn nhiều. **Reliability** rộng hơn: chạy đúng và giữ dữ liệu nguyên vẹn, không chỉ "còn sống".

## Các khối cơ bản

| Khối | Vai trò | Khi nào thêm |
|---|---|---|
| Web server / reverse proxy | nhận kết nối, TLS, file tĩnh | gần như luôn có |
| Application server | logic nghiệp vụ, không giữ trạng thái | luôn có; nhân bản khi mở rộng ngang |
| Database | lưu trữ bền; SQL hoặc NoSQL, replica | luôn có; xem `sysdesign-data-storage` |
| Load balancer | chia tải nhiều app server, bỏ máy hỏng | khi có từ hai máy |
| Cache | giữ dữ liệu đọc nhiều gần ứng dụng | khi đọc nóng làm database quá tải; xem `sysdesign-scaling` |
| CDN | phục vụ file tĩnh/media gần người dùng | khi người dùng phân tán, media nặng |
| Message queue | việc chạy nền, san tải đỉnh, tách service | khi có việc chậm (email, xử lý video) hay tải dồn |

## Kiểm tra trước khi giao một thiết kế

- [ ] Yêu cầu phi chức năng có số (tải, độ trễ, sẵn sàng), không chỉ "nhanh", "lớn".
- [ ] Luồng ghi và luồng đọc chính đều đi được trên sơ đồ.
- [ ] Mỗi khối được thêm vì một yêu cầu cụ thể; không thêm cho "đủ bộ".
- [ ] Có mục đánh đổi: nhất quán hay sẵn sàng, chi phí, độ phức tạp vận hành.
- [ ] Có điểm lỗi đơn nào không, và giám sát gì để biết hệ thống đang ổn.
- [ ] Với dự án thật nhỏ (MVP), ghi rõ những gì cố ý chưa làm (shard, multi-region) và dấu hiệu nào thì cần làm.

## Nguồn

Ý của sách "System Design" (tên đầy đủ "Hướng dẫn cách tiếp cận phỏng vấn System Design", Nguyễn Thế Huy, ebook tiếng
Việt), số trang là trang PDF:

- Vòng phỏng vấn, bốn khó khăn (câu hỏi mở, thiếu kinh nghiệm, áp lực 45–60 phút, thiếu phương pháp, ám ảnh hoàn hảo), năm
  kỹ năng: PDF tr. 6–10.
- Latency/throughput, scalability dọc/ngang, availability và các số 9, reliability, kiến trúc cấp cao, các thành phần: PDF
  tr. 11–21. Con số thời gian ngừng theo số 9: PDF tr. 13, 76.
- Khung chung "hiểu nhu cầu → chọn có lý do → nói cái giá": PDF tr. 31–33, 42–44, 77–79, 91–93.

Phần của skill: bước ước lượng thô (sách không có), bảng "khi nào thêm khối", checklist cho thiết kế thật.
