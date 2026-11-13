---
name: sdd-write-spec
description: Viết hoặc rà spec nghiệp vụ trước khi để AI viết code, theo Spec Driven Development (SDD) - Business Requirement có mục tiêu đo được, Use Case có luồng chính/luồng khác/ngoại lệ, Entity Model bằng ngôn ngữ nghiệp vụ, Acceptance Criteria Given/When/Then. Dùng khi bắt đầu một tính năng hay module mới, khi người dùng nhờ viết spec, PRD, user story, use case, tiêu chí nghiệm thu, hoặc nhờ AI code một việc đụng tới tiền, hợp đồng, quyền truy cập, định danh, dữ liệu khách hàng mà yêu cầu còn mơ hồ. English triggers - write a spec, requirements, use case, acceptance criteria, Given When Then, spec-driven development, clarify requirements before coding.
---

# Viết spec trước khi để AI viết code

AI viết code rất nhanh, nhưng khi yêu cầu còn hở nó lấp chỗ trống bằng lựa chọn "nghe hợp lý" chứ không phải bằng
quyết định của người làm nghiệp vụ. Spec là chỗ ghi lại **ý định** để con người thống nhất với nhau, AI bám vào để sinh
code, test và tài liệu, dev mới đọc để hiểu, và người nghiệp vụ đọc để phản biện. Khi có gì sai, sửa spec trước rồi mới
sửa code. Skill này giúp viết một spec vừa đủ: đủ rõ để bắt đầu, không cần hoàn hảo, sửa dần qua demo, test và phản hồi.

## Khi nào dùng, khi nào không

Dùng khi một trong các điều sau đúng: hệ thống sẽ sống lâu hơn khoảng nửa năm; có hơn hai người cùng sửa; có quy tắc
nghiệp vụ phức tạp, nhất là về tiền, hợp đồng, quyền truy cập, quy trình duyệt hay yêu cầu pháp lý; AI sẽ sinh phần lớn code; đây là
phần lõi của sản phẩm.

Không cần cả bộ: bản thử nghiệm dùng dưới một tuần rồi bỏ, spike kỹ thuật (viết spec sau khi biết đáng làm), script chạy
một lần, side project một người (README ngắn là đủ), trang quản trị CRUD thuần. Khi đó chỉ ghi vài dòng mục tiêu và
phạm vi. Nếu chưa ai chịu trách nhiệm làm rõ nghiệp vụ, nói với người dùng: cần người sở hữu nghiệp vụ trước, spec
không thay được việc đó.

## Bốn tầng của một spec

Viết theo thứ tự, mỗi tầng ngắn. Mẫu đầy đủ trong [references/templates.md](references/templates.md), ví dụ hoàn chỉnh
trong [references/example-qr-checkout.md](references/example-qr-checkout.md).

1. **Business Requirement (BR-xxx): vì sao làm.** Bối cảnh, một câu mục tiêu có số đo ("từ X lên Y, đo bằng gì"),
   trong phạm vi, ngoài phạm vi, ràng buộc, câu hỏi còn mở. Chưa nói giải pháp. Tránh mục tiêu kiểu "tối ưu", "cải
   thiện" khi chưa có chỉ số.
2. **Use Case (UC-xxx): ai làm gì.** Tác nhân (người, admin, hệ thống, job định kỳ, webhook), sự kiện khởi đầu, điều
   kiện trước, luồng chính đánh số, luồng khác (biến thể hợp lệ, đánh `2a`, `3a`…), ngoại lệ (`E1`, `E2`: tình huống
   ngoài ý muốn mà hệ thống phải xử lý có chủ đích, khác với bug), trạng thái sau khi xong.
3. **Entity Model: các "danh từ" của nghiệp vụ.** Tên, ý nghĩa, các trạng thái và cách chuyển trạng thái, quan hệ.
   Đây không phải schema database: không index, không kiểu cột. Dùng đúng từ người nghiệp vụ dùng (`Order`, `Payment`
   thay vì `tbl_dh_v2`). Nếu cùng một từ mang nghĩa khác nhau ở hai chỗ (đơn hàng lúc thanh toán khác đơn hàng lúc
   giao vận), tách thành hai ngữ cảnh (bounded context) với mô hình riêng.
4. **Acceptance Criteria (AC-n): thế nào là đúng.** Given / When / Then (+ And), mỗi AC kiểm thử được và sẽ có ít nhất
   một test. AC là cầu nối từ spec sang test.

User story ba dòng ("là khách hàng, tôi muốn…") chỉ là điểm bắt đầu cuộc trò chuyện, chưa phải spec.

## Cách làm khi được nhờ

1. **Tìm spec có sẵn trước**: `specs/`, `openspec/`, `docs/`, file `UC-*.md`, `BR-*.md`, ADR. Có thì đọc và bám theo;
   tính năng mới thì viết thêm theo đúng định dạng repo đang dùng thay vì tạo kiểu mới.
2. **Liệt kê khoảng trống** trước khi viết: những gì người dùng chưa nói mà code bắt buộc phải chọn. Hay gặp: thời hạn
   và giới hạn (hết hạn sau bao lâu, tối đa bao nhiêu), ai duyệt và ai duyệt thay khi người đó vắng, khi bên ngoài trả
   chậm hoặc trả hai lần, hủy giữa chừng thì hoàn gì, sai số tiền, quyền xem/sửa, dữ liệu cũ, múi giờ, ngày lễ.
3. **Không tự quyết thay người dùng** các quy tắc về tiền, pháp lý, quyền truy cập, chính sách với khách hàng hay kiến
   trúc lớn. Ghi chúng thành câu hỏi mở và hỏi người dùng; nếu phải đi tiếp, ghi rõ giả định tạm và đánh dấu cần xác
   nhận. Cái gì quyết định không làm ở bản này thì ghi vào ngoài phạm vi, đừng để trống.
4. **Viết bản nháp vừa đủ, có giới hạn thời gian**: spec đầu một hai trang; một use case cỡ vừa không nên quá một hai
   giờ cho vòng đầu. Chưa biết thì ghi câu hỏi, không bịa chi tiết cho đầy.
5. **Rà theo checklist dưới đây**, đưa spec cho người dùng (hoặc người nghiệp vụ) duyệt. Chỉ khi spec được chốt mới lên
   kế hoạch và viết code (xem skill `sdd-feature-loop`).
6. Spec là file Markdown trong repo, review như code, có mục `History` ghi mỗi lần đổi. Tách **hành vi hiện tại**
   (baseline) khỏi **thay đổi đề xuất**: thay đổi mới viết ở chỗ riêng (change folder hoặc phần "Đề xuất") và chỉ gộp
   vào baseline khi đã triển khai và xác nhận.

## Kiểm tra trước khi xong

- [ ] BR có mục tiêu một câu kèm số đo, có cả "trong phạm vi" và "ngoài phạm vi".
- [ ] Mỗi UC có ID, tác nhân, sự kiện khởi đầu, luồng chính, ít nhất các luồng khác và ngoại lệ hiển nhiên.
- [ ] Mọi khái niệm mới (trường, trạng thái, luồng, quyền, chính sách) đều có trong spec, không chỉ nằm trong code.
- [ ] Mỗi AC viết được thành test tự động; không có AC kiểu "nhanh", "thân thiện", "hợp lý".
- [ ] Tên trong Entity Model là tên nghiệp vụ, mỗi tên chỉ một nghĩa trong một ngữ cảnh.
- [ ] Các quyết định về tiền/pháp lý/quyền đã có người xác nhận, hoặc nằm trong câu hỏi mở.
- [ ] Có ít nhất một người đọc từ phía nghiệp vụ và một từ phía kỹ thuật (với dự án một người: người dùng chính là
      người duyệt; không tự duyệt spec mình viết).

## Lỗi hay gặp

- Coi user story là spec và để AI tự điền phần còn lại.
- Viết quá chi tiết ngay ngày đầu, cả nhóm ngồi chờ; spec tốt là spec chịu được việc học thêm.
- Spec không có AC: không có AC thì không có cách biết code đúng, và không nên code.
- Viết code trước rồi "viết spec cho đẹp" sau: spec lúc đó chỉ kể lại code, mất vai trò thống nhất ý định.
- Đặt tên theo kỹ thuật (`OrderManager`, `Handler`, tên bảng) thay vì theo nghiệp vụ.
- Trộn "hệ thống đang chạy thế nào" với "chúng ta định đổi gì" trong cùng một đoạn.
- Viết spec từ code có sẵn rồi coi là đúng: code chỉ cho biết nó đang làm gì (xem `sdd-legacy-code`).

## Nguồn

Ý của sách "Spec Driven Development" (Nguyễn Thế Huy, ebook tiếng Việt), số trang là trang PDF:

- Vấn đề "code không có ngữ cảnh", AI lấp chỗ trống bằng xác suất, test do AI sinh tạo an toàn giả: PDF tr. 3, 7–8.
- Định nghĩa SDD, sửa spec trước, spec không cần hoàn hảo, SDD không phải waterfall: PDF tr. 9–11.
- Bốn tầng BR / Use Case / Entity Model / AC, user story chỉ là điểm bắt đầu: PDF tr. 12–16.
- Spec hiện tại tách khỏi thay đổi đề xuất: PDF tr. 16–17. Cấu trúc use case, ngoại lệ khác bug: PDF tr. 17–18.
- Ngôn ngữ chung, bounded context: PDF tr. 18–19. Khi nào chưa cần đầy đủ: PDF tr. 21, 64.
- Nguyên tắc "khái niệm mới phải có trong spec", AI hỗ trợ còn người quyết: PDF tr. 23–25.
- Lỗi hay gặp (quá chi tiết, thiếu AC, code trước spec, tự duyệt): PDF tr. 42, 59–60. Mẫu BR/UC: PDF tr. 69–72.

Phần của skill (không có nguyên văn trong sách): danh sách "khoảng trống hay gặp" ở bước 2, quy tắc hỏi người dùng thay
vì tự quyết ở bước 3, và checklist được gom lại từ các chương cho việc của một agent.
