---
name: sdd-feature-loop
description: Vòng làm một tính năng theo Spec Driven Development khi AI viết code - từ spec đã duyệt sang kế hoạch, đối chiếu kế hoạch với spec, chia việc, triển khai, viết test theo từng Acceptance Criteria, rồi đưa mọi phát hiện mới về sửa spec trước khi sửa code. Gồm quy ước repo (specs, src theo use case, tests theo AC), commit và PR có mã UC, tách spec PR khỏi code PR, câu hỏi khi review, và cách giữ lõi nghiệp vụ tách khỏi adapter để AI sinh lại code an toàn. Dùng khi implement một use case đã có spec, khi lên plan/tasks từ spec, khi review PR do AI viết, khi test fail vì spec thiếu, hoặc khi dựng cấu trúc repo cho dự án mới theo SDD. English triggers - implement from spec, spec to code, plan and tasks, acceptance tests, traceability, PR review against spec, Spec Kit, OpenSpec, greenfield.
---

# Vòng làm tính năng theo spec

Khi đã có spec được duyệt (xem `sdd-write-spec`), việc còn lại là giữ cho code, test và spec luôn khớp nhau. AI làm phần
lặp lại nhanh; con người giữ các quyết định. Mọi điều mới học được khi làm (test fail, câu hỏi bất ngờ, phản hồi từ
người dùng) đi về spec trước, rồi code mới đổi theo.

## Vòng làm

1. **Đọc spec và các spec liên quan.** Thiếu spec cho hành vi sắp viết thì dừng lại viết spec (hoặc đề xuất với người
   dùng), không âm thầm tự quyết trong code.
2. **Lập kế hoạch kỹ thuật** (plan): cách làm, file sẽ đụng, thứ tự.
3. **Đối chiếu kế hoạch với spec, từng dòng.** Đây là bước dễ bỏ qua nhất. Ví dụ trong sách: spec nói số ngày phép chỉ
   bị trừ khi đơn được duyệt, còn kế hoạch AI đề xuất trừ ngay lúc nộp đơn; phải sửa kế hoạch trước khi sinh code. Chỗ
   nào kế hoạch thêm một quy tắc mà spec không có, coi đó là câu hỏi cho người dùng.
4. **Chia việc nhỏ** (tasks), mỗi việc gắn với UC và AC nó phục vụ.
5. **Triển khai.** Giao cho AI phần lặp lại (CRUD, ánh xạ dữ liệu, boilerplate, đổi tên, test theo AC đã viết rõ, tài
   liệu). Giữ cho người quyết: chính sách về tiền, pháp lý, quyền truy cập, kiến trúc lớn.
6. **Test theo AC.** Mỗi AC có ít nhất một test, tên test hoặc `describe` chứa mã UC và AC (`UC-042 AC-3 …`). Test kiểm
   hành vi nghiệp vụ, không chỉ "trả về 200". Test mẫu đầu tiên của một kiểu do người viết hoặc đọc kỹ; đừng để AI viết
   code rồi tự viết test cho chính code đó, vì test sẽ chỉ chứng minh code làm đúng điều code đang làm.
7. **Khi test fail hoặc lộ ra trường hợp chưa nghĩ tới**: quyết định đó là lỗi code hay spec thiếu. Spec thiếu thì bổ
   sung AC (hoặc quy tắc) vào spec, ghi `History`, rồi mới sửa code và thêm test. Ví dụ trong sách: hai ngày nghỉ trùng
   nhau ở đúng ngày biên, và đơn của người không có quản lý trực tiếp thì ai duyệt: cả hai thành AC/quy tắc mới.
8. **Phản hồi sau demo**: yêu cầu mới vào spec (hoặc vào "ngoài phạm vi", phiên bản sau), không sửa thẳng vào code.

## Quy ước để truy vết

- Commit: `<type>(UC-xxx): <mô tả>` (cũng dùng `BR-xxx` cho thay đổi yêu cầu), ví dụ `feat(UC-042): validate QR
  expiry`, `test(UC-042): add AC-4 idempotency test`, `docs(BR-001): clarify out-of-scope`.
- Spec PR tách khỏi code PR: spec PR chỉ có file spec, người nghiệp vụ và tech lead duyệt; code PR có code và test, link
  tới UC. PR đụng hành vi nghiệp vụ mà không có UC thì gắn nhãn `needs-spec`. Commit spec trước code.
- Cấu trúc repo để spec, code, test soi được vào nhau: xem [references/repo-and-review.md](references/repo-and-review.md).
- Mỗi spec có `## History`; AC không còn đúng thì đánh dấu deprecated, không xóa.

## Khi review (của người, hoặc tự rà trước khi giao)

- Mở spec trước, code sau: luồng đã rõ chưa, AC kiểm thử được không, có thiếu ngoại lệ hiển nhiên không. Đọc code trước
  thì dễ sa vào đặt tên và cấu trúc mà bỏ sót quy tắc nghiệp vụ.
- Quy tắc này đến từ spec nào? Không chỉ ra được thì hoặc bỏ, hoặc bổ sung spec.
- Năm AC thì ít nhất năm test tương ứng; AC quan trọng thiếu test phải có lý do.
- "Chỗ này AI tự đề xuất hay người quyết?" Ghi lại nguồn gốc quyết định để sau này còn gỡ lỗi.

## Lõi nghiệp vụ tách khỏi adapter

Để AI sinh lại một phần code mà không kéo đổ phần khác, giữ use case, entity, quy tắc và các port (interface) ở lõi;
HTTP, database, cổng thanh toán, email nằm ở adapter bên ngoài cắm vào port. Đổi nhà cung cấp chỉ sinh lại adapter; test
lõi không cần database hay dịch vụ thật; khi giao việc cho AI có thể khoanh đúng phần context cần thiết. Ánh xạ tự
nhiên: Use Case → use case ở lõi, Entity Model → entity/aggregate/value object, hệ thống ngoài → port + adapter.

Chỉ đầu tư cách tách này (và DDD mức nhẹ) khi có quy tắc nghiệp vụ không đơn giản, hệ thống sống trên khoảng nửa năm
hoặc có hơn hai người làm; script một lần, CRUD quản trị thuần hay prototype thì không cần.

## Dự án mới (greenfield) trong một tuần

Nhịp sách đi qua với một công cụ nội bộ (3 người, 5 ngày): ngày 1 phỏng vấn người nghiệp vụ → BR + danh sách 5–10 UC;
ngày 2 sơ đồ use case + entity model, ghi rõ những gì cố ý chưa làm; ngày 3–4 viết spec đầy đủ cho một UC mẫu rồi chạy
vòng ở trên; ngày 5 đưa lên môi trường thử, gom phản hồi vào spec. Checklist khởi động trong
[references/repo-and-review.md](references/repo-and-review.md) (mục "Checklist dự án mới").

## Công cụ

Sách dùng GitHub Spec Kit (`/specify → /plan → /tasks → /implement`), OpenSpec (thư mục thay đổi, delta spec, archive)
và plugin AI Unified Process; tên lệnh là tại thời điểm viết sách, kiểm tra tài liệu chính thức trước khi dùng. Không
bắt buộc công cụ nào: spec là Markdown đọc được để đổi công cụ không mất gì. Chọn một công cụ, làm trọn một use case rồi
mới đánh giá. Tóm tắt lệnh: [references/tools.md](references/tools.md).

## Lỗi hay gặp

- AI đi tắt qua spec: code có quy tắc mà spec không nói. Trả lại, cập nhật spec trước.
- Test mock luôn cả domain: test xanh nhưng production sai. Kiểm AC ở tầng hành vi.
- Đo code coverage thay cho "mỗi AC có test".
- Một người viết spec, viết code và tự duyệt cả hai.

## Nguồn

Ý của sách "Spec Driven Development" (Nguyễn Thế Huy, ebook tiếng Việt), số trang là trang PDF:

- Sửa spec trước, AI là thợ nhanh còn người chịu trách nhiệm ý định, test là hàng rào: PDF tr. 9–10.
- Hexagonal và khi nào nên dùng: PDF tr. 19–21. Sáu nguyên tắc (spec dẫn dắt, AI hỗ trợ, lặp, test bảo vệ, người liên
  quan làm trung tâm, truy vết): PDF tr. 23–31.
- Case dự án mới 5 ngày, kế hoạch sai so với spec, hai test fail thành AC mới, công cụ, checklist: PDF tr. 32–43.
- Cấu trúc repo, quy tắc review, lỗi và cách chữa: PDF tr. 55–60. Cheatsheet lệnh, quy ước git, mẫu PR: PDF tr. 72–74.

Phần của skill: gom thành vòng 8 bước cho agent, câu hỏi tự rà trước khi giao, và quy tắc "kế hoạch thêm quy tắc mà spec
không có thì hỏi người dùng".
