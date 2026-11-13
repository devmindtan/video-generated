---
name: sdd-legacy-code
description: Áp Spec Driven Development lên hệ thống cũ (brownfield, legacy code) khi có AI hỗ trợ - đào lại entity model từ database và use case từ code, log, giao diện; kiểm chứng với người vận hành trước khi tin; bọc characterization test quanh hành vi hiện tại; refactor có spec và test bảo vệ; ưu tiên module nóng theo lịch sử git; biết khi nào dừng. Dùng khi người dùng muốn hiểu, viết spec, thêm tính năng, refactor hay viết lại một codebase cũ, thiếu tài liệu, người viết đã nghỉ, hoặc nhờ AI "đọc code rồi sinh spec" hay "viết lại toàn bộ bằng AI". English triggers - legacy code, brownfield, reverse engineer spec from code, characterization tests, refactor safely, rewrite with AI, strangler, hot spots, technical debt.
---

# Spec Driven Development trên hệ thống cũ

Hệ thống cũ đang chạy và đang đúng (hoặc đủ đúng) theo nhiều quy tắc chưa ai ghi lại. Mục tiêu không phải trả hết nợ kỹ
thuật mà là **dừng vay thêm**: mỗi spec mới, mỗi characterization test, mỗi commit gắn mã UC là một khoản nợ ngừng tăng.

## Hai việc không làm

1. **Viết lại toàn bộ bằng AI khi chưa có baseline.** Kịch bản quen thuộc: hào hứng vài tháng, rồi lộ ra các "tính năng
   ẩn" khách đang dùng, tiến độ kéo dài, nghiệp vụ mất niềm tin. Viết lại không sai; sai là viết lại khi chưa biết hệ
   thống đang làm gì. Khi người dùng đề nghị viết lại toàn bộ, nói rõ rủi ro và đề xuất đi theo năm bước dưới đây.
2. **Sinh spec từ code rồi coi là sự thật.** Code chỉ cho biết nó đang làm gì, không cho biết làm vậy có đúng không.
   Một bug sống lâu mà khách đã quen né có thể bị biến thành "tính năng" trong spec. Spec sinh từ code luôn ghi là
   **chưa kiểm chứng** và kèm danh sách câu hỏi cho người nghiệp vụ.

Giữ riêng **baseline** (hệ thống đang chạy thế nào, kể cả chỗ xấu) và **thay đổi đề xuất** (muốn sửa gì). Trộn hai thứ
thì không còn phân biệt được đâu là bug, đâu là tính năng, đâu mới là đề xuất.

## Năm bước

1. **Entity model từ database.** Schema là chỗ rẻ nhất để bắt đầu: danh từ, quan hệ, một phần lịch sử. Cho AI đọc schema
   và đề xuất tên nghiệp vụ cho các bảng khó hiểu, nhưng mọi cột mơ hồ (`flag_v2`, `status2`, `is_new_policy`) phải
   hỏi người vận hành rồi mới ghi nghĩa. Đề xuất đổi tên để sau, ghi chú lại.
2. **Use case từ code, log và giao diện.** Endpoint/controller cho biết cửa vào; log production cho biết cái gì thực sự
   được dùng; luồng giao diện cho biết người dùng làm gì trong ngày. Gộp các endpoint chỉ là chi tiết của cùng một luồng.
   Phân loại: rõ (có code, có log, có người xác nhận), đoán được (có code, ý định chưa chắc), bí ẩn (không ai biết còn
   dùng không). Use case bí ẩn đánh dấu `legacy-unverified`, đo lưu lượng một thời gian trước khi đụng, rồi mới đề xuất
   bỏ hoặc đi tìm người hiểu.
3. **Kiểm chứng baseline với nghiệp vụ.** Theo từng ngữ cảnh, đọc spec nháp cùng người vận hành, tài chính, chăm sóc khách
   hàng; hỏi: có đúng thực tế không, thiếu trường hợp nào, có quy tắc nào "đương nhiên" mà spec chưa ghi. Quy tắc tìm ra
   được viết thành UC có AC và người sở hữu, đi qua một thay đổi riêng (đề xuất, delta spec, thiết kế, tasks) rồi mới gộp
   vào baseline.
4. **Characterization test quanh hành vi hiện tại.** Lấy dữ liệu thật đã ẩn danh (input và output hiện tại), sinh test
   khẳng định output không đổi. Các test này như ảnh chụp: không chứng minh nghiệp vụ đúng, chỉ bảo đảm refactor không đổi
   hành vi cũ. Không đưa dữ liệu khách hàng chưa ẩn danh vào repo hay vào prompt.
5. **Refactor có spec và test bảo vệ.** Quy tắc: khi refactor thì giữ nguyên hành vi; muốn hành vi khác thì viết spec trước; PR
   refactor lớn tách khỏi PR đổi quy tắc nghiệp vụ; characterization test và AC test phải xanh. Với một hàm khổng lồ, nhận
   diện các use case nằm bên trong, viết spec ngắn và test AC cho từng cái, tách dần; cho code cũ và mới chạy song song
   sau feature flag một thời gian để so kết quả, lệch thì đối chiếu spec và dữ liệu mẫu để quyết bên nào đúng.

Chi tiết từng bước, lệnh và ví dụ: [references/brownfield-steps.md](references/brownfield-steps.md).

## Nguyên tắc thực dụng

- **Không viết spec cho 100% codebase.** Chia module nóng (đổi mỗi sprint: spec đủ, characterization + AC test), ấm (vài
  tháng mới đổi: spec nháp, thêm test khi sắp đụng), lạnh (để yên trừ khi có lý do nghiệp vụ). Tìm module nóng bằng tần
  suất file trong lịch sử git sáu tháng gần nhất.
- **Ngữ cảnh trước, chi tiết sau.** Chia hệ thống thành vài bounded context trước; đào sâu context đang đụng tới. Có thể
  nhờ AI gợi ý class nào thuộc context nào, nhưng chỉ coi là điểm bắt đầu để bàn với người dùng.
- **Test trước refactor.** Code xấu rất ngứa tay; refactor không test là đánh bạc.
- **Để lại rõ hơn một chút** mỗi lần đụng, không cần biến cả hệ thống thành kiến trúc đẹp.
- **Spec brownfield được phép xấu**: có ghi chú cần kiểm chứng, chú thích lịch sử, thuật ngữ cũ cạnh thuật ngữ mới. Cần
  spec thật trước khi cần spec đẹp.

## Khi nào dừng

Ba dấu hiệu: người mới làm độc lập ở bất kỳ module nào trong khoảng một tuần; module nóng có spec cho phần lớn use case
(sách gợi ý trên khoảng 70%) và use case quan trọng có AC test; khi nghiệp vụ hỏi "làm được không", tech lead trả lời
trong một giờ thay vì một tuần. Qua điểm đó, đầu tư thêm thường chỉ là làm đẹp.

## Kiểm tra trước khi giao

- [ ] Spec sinh từ code được đánh dấu chưa kiểm chứng và có câu hỏi cho người nghiệp vụ.
- [ ] Refactor lớn và đổi quy tắc nằm ở hai PR khác nhau; PR đổi quy tắc có spec.
- [ ] Characterization test chạy trên dữ liệu đã ẩn danh và xanh trước khi refactor.
- [ ] Use case bí ẩn không bị xóa khi chưa có số liệu sử dụng và người xác nhận.

## Nguồn

Ý của sách "Spec Driven Development" (Nguyễn Thế Huy, ebook tiếng Việt), chương 5, số trang là trang PDF:

- Bối cảnh hệ thống billing cũ, hai sai lầm, tách baseline với thay đổi: PDF tr. 44–45.
- Năm bước (entity từ DB, use case từ code/log/UI, workshop kiểm chứng, characterization test, refactor có bảo vệ): PDF
  tr. 45–50.
- Module nóng/ấm/lạnh, ngữ cảnh trước, test trước refactor, spec được phép xấu, công cụ: PDF tr. 50–52.
- Khi nào dừng và "dừng vay thêm": PDF tr. 52. Characterization test lấy cảm hứng từ Michael Feathers: PDF tr. 67.

Phần của skill: cách phản hồi khi người dùng đề nghị viết lại toàn bộ hoặc sinh spec từ code, yêu cầu ẩn danh dữ liệu
trước khi đưa vào repo/prompt, và checklist trước khi giao.
