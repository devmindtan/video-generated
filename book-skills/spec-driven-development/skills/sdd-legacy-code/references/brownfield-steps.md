# Năm bước, chi tiết và ví dụ

Ví dụ trong sách (PDF tr. 44–52): một hệ thống tính cước khoảng 320 nghìn dòng Java, viết từ 2020, README bốn dòng, người
viết đã nghỉ; một lớp tính cước gần 1800 dòng với hàm chính khoảng 800 dòng. Người nhận cần thêm tính năng cước chuyển
vùng quốc tế. Con số là case tổng hợp của tác giả.

## 1. Entity model từ database (khoảng một tuần trong ví dụ)

- Cho AI đọc schema (sách dùng lệnh `/reverse-engineer` của AI Unified Process; công cụ nào đọc được schema cũng được)
  để có bản nháp: thực thể, quan hệ, tên nghiệp vụ đề xuất cho tên bảng khó hiểu.
- Ngồi với người vận hành hỏi từng chỗ mơ hồ. Ví dụ: hai cột cờ phiên bản hóa ra là chính sách phụ phí cũ và mới, chia
  theo ngày ký hợp đồng. Ghi nghĩa, ghi cái nào đã ngừng dùng, ghi đề xuất đổi tên để sau.
- Kết quả trong ví dụ: khoảng bốn mươi thực thể được người vận hành xác nhận.

## 2. Use case từ code, log, giao diện (khoảng hai tuần)

- Ba nguồn: controller/endpoint (cửa vào), log production (cái gì thật sự được dùng), luồng màn hình (người dùng làm gì).
- AI đề xuất danh sách; người đọc lại, gộp endpoint cùng một luồng, bỏ endpoint nội bộ ít liên quan.
- Ví dụ: 42 use case, gồm 18 rõ, 16 đoán được, 8 bí ẩn. Tám cái bí ẩn gắn `legacy-unverified`, thêm đo lưu lượng, cam
  kết không đụng bốn tuần; sau đó năm cái không còn request được đề xuất bỏ, ba cái có khách lớn dùng phải đi tìm người
  hiểu nghiệp vụ.

## 3. Kiểm chứng với nghiệp vụ

- Workshop theo ngữ cảnh (ví dụ: thuê bao, kỳ tính cước, khoản phí, báo cáo), mỗi buổi khoảng 90 phút, có vận hành, tài
  chính, chăm sóc khách hàng.
- Đọc từng AC của spec nháp và hỏi: đúng thực tế không, thiếu trường hợp nào, có quy tắc "đương nhiên" nào chưa ghi.
- Ví dụ phát hiện: khách doanh nghiệp được giảm 10% cuối tháng khi tổng sử dụng vượt một ngưỡng, có từ 2021, nằm trong một
  hàm helper không test, không chú thích. Viết thành UC riêng có AC và người sở hữu, qua một thư mục thay đổi:

```text
changes/document-enterprise-discount/
  proposal.md   # vì sao ghi lại quy tắc này
  specs/        # delta: thêm UC và các tình huống
  design.md     # ảnh hưởng tới lớp tính cước
  tasks.md      # characterization test, AC test, refactor sau
```

- Gộp vào baseline chỉ sau khi workshop và test xác nhận.

## 4. Characterization test

- Lấy một bộ bản ghi thật đã ẩn danh (ví dụ 50 bản ghi tháng trước), mỗi bản ghi có input và output hiện tại.
- Mỗi bản ghi thành một test: nạp input, chạy hàm cũ, so với output đã lưu. Đặt tên theo trường hợp và nguồn dữ liệu.

```java
@Test
void billing_matches_snapshot_case_001() {
    Bill actual = calculator.calculate(fixture("case-001/input.json"));
    assertEquals(fixture("case-001/expected.json"), actual);
}
```

- Ý nghĩa: "chưa làm đổi hành vi cũ", không phải "hành vi cũ đúng".

## 5. Refactor có bảo vệ

- Năm quy tắc: giữ nguyên hành vi khi refactor; muốn hành vi khác thì viết spec trước; tách PR refactor lớn khỏi PR đổi
  quy tắc; characterization test xanh; AC test mới xanh.
- Ví dụ: hàm 800 dòng chứa bốn use case (phí cơ bản, phụ phí cuối tuần, giảm giá thành viên, làm tròn hóa đơn); mỗi cái
  có spec ngắn và test AC; AI giúp tách thành bốn lớp strategy; code cũ và mới chạy song song qua feature flag hai tuần.

## Lệnh và kỹ thuật hữu ích

```bash
# module nóng: file đổi nhiều nhất trong sáu tháng
git log --since=6.months.ago --name-only --pretty=format: | sort | uniq -c | sort -rn | head -30
# vì sao dòng này tồn tại
git log -L <start>,<end>:<file>
git blame -w -C <file>
```

- Refactor cơ học an toàn hơn bằng công cụ dựa trên AST (jscodeshift, rope, OpenRewrite).
- Feature flag (LaunchDarkly, Unleash hoặc cờ tự viết) để chạy song song và so kết quả.
- Hỏi AI "các class này thuộc những bounded context nào" để có điểm bắt đầu thảo luận, không phải kết luận.
