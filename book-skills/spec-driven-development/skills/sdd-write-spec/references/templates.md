# Mẫu spec

Các mẫu dưới đây dựa theo cấu trúc mẫu trong phụ lục của sách (PDF tr. 69–72), đã rút gọn và chỉnh cho agent dùng.
Nếu repo đã có định dạng riêng, theo định dạng của repo.

## Business Requirement: `specs/business-requirements/BR-xxx-<ten>.md`

```markdown
# BR-xxx: <tên yêu cầu theo ngôn ngữ nghiệp vụ>

## Metadata
- ID: BR-xxx
- Trạng thái: draft | approved | in-progress | done
- Người sở hữu: <người chịu trách nhiệm nghiệp vụ>
- Các bên liên quan: <...>
- Mốc thời gian: <quý / hạn chót nếu có>

## Bối cảnh
<Vì sao cần: phản hồi khách hàng, số liệu kinh doanh, quy định pháp lý...>

## Mục tiêu
<Một câu. Có số đo; không viết "tối ưu", "cải thiện" khi chưa có chỉ số.>

## Chỉ số thành công
- <chỉ số>: từ <X> lên <Y>, đo bằng <công cụ>, mốc so sánh <thời điểm>

## Trong phạm vi
- <...>

## Ngoài phạm vi
- <những thứ cố ý không làm ở yêu cầu này>

## Use case liên quan
- UC-xxx: <...>

## Ràng buộc
- Kỹ thuật: <...>
- Pháp lý / quy định: <...>
- Thời hạn: <...>

## Câu hỏi còn mở
- [ ] <câu hỏi cần người nghiệp vụ trả lời>

## History
- v1 (YYYY-MM-DD, <người>): bản đầu
```

## Use Case: `specs/use-cases/<context>/UC-xxx-<ten>.md`

```markdown
# UC-xxx: <tên ngắn theo ngôn ngữ nghiệp vụ>

## Metadata
- ID: UC-xxx
- Ngữ cảnh (bounded context): <Checkout, Billing...>
- BR liên quan: BR-yyy
- Trạng thái: draft | reviewed | implemented | deprecated
- Người sở hữu: <...>
- Cập nhật: YYYY-MM-DD

## Tác nhân
<người dùng, admin, hệ thống, job định kỳ, webhook...>

## Sự kiện khởi đầu
<khi nào use case bắt đầu>

## Điều kiện trước
- <...>

## Luồng chính
1. <...>
2. <...>

## Luồng khác
- 2a. <biến thể hợp lệ>: <mô tả>

## Ngoại lệ
- E1. <tình huống>: <hệ thống xử lý thế nào>

## Trạng thái sau khi xong
- <...>

## Acceptance Criteria
### AC-1: <tên ngắn>
Given <ngữ cảnh>
When <hành động>
Then <kết quả mong đợi>
And <kết quả thêm>

## Phụ thuộc
- UC phải xong trước: <...>
- UC phụ thuộc vào UC này: <...>
- Hệ thống ngoài: <cổng thanh toán, email, LDAP...>

## Ghi chú
<quyết định lịch sử, lý do nghiệp vụ, link ADR, câu hỏi mở>

## History
- v1 (YYYY-MM-DD, <người>): bản đầu
- v2 (YYYY-MM-DD, <người>): thêm AC-4 về gửi trùng (idempotency)
```

AC không còn đúng thì đánh dấu `deprecated` kèm lý do và phiên bản, không xóa, để còn biết quy tắc từng tồn tại.

## Entity Model: `specs/entities/<context>.md`

```markdown
# Entity Model: <ngữ cảnh>

## <TênThựcThể>
- Ý nghĩa: <một câu theo ngôn ngữ nghiệp vụ>
- Thuộc tính chính: <tên: ý nghĩa> (không ghi kiểu cột, index)
- Trạng thái: <a> → <b> (khi nào) → <c> (khi nào)
- Quan hệ: <một Order có nhiều OrderItem...>
- Quy tắc bất biến: <điều luôn phải đúng>
```

## Thay đổi đề xuất (khi repo có baseline)

Theo cách nghĩ của OpenSpec mà sách giới thiệu (PDF tr. 16–17, 73): baseline mô tả hệ thống đang chạy; mỗi thay đổi
có một thư mục riêng, được review trước khi làm và chỉ gộp vào baseline sau khi đã triển khai, kiểm tra xong.

```text
specs/                  # hoặc openspec/specs/: hành vi hiện tại
changes/<ten-thay-doi>/ # hoặc openspec/changes/<ten>/
  proposal.md           # vì sao làm, phạm vi
  specs/                # phần spec thêm / sửa / bỏ so với baseline
  design.md             # hướng kỹ thuật
  tasks.md              # checklist triển khai
changes/archive/        # thay đổi đã gộp vào baseline
```
