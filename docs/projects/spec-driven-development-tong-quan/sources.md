# Nguồn — Spec Driven Development: tóm tắt cả cuốn sách

## Sách

- *Spec Driven Development* — Nguyễn Thế Huy. Ebook PDF tiếng Việt, tác giả tự phát hành (huynt.dev; liên hệ trong
  sách), không có trang thông tin xuất bản/ISBN. 79 trang PDF.
- Source SHA-256: `cca3fe77fc99d14775427da1576462aebeed1599e310c8c5a8b5b09842d8c696`. Cache edition
  `cca3fe77…d8c696-de2a45e349f9`, `inventory --verify` toàn vẹn 2026-11-11. **Không có số trang in; tham chiếu là trang
  PDF 1-based.**
- Hồ sơ nghiên cứu: `series/ngoai-kenh/chua-thuoc-series/books/spec-driven-development/research.md`;
  bản đồ: `chapters.json` (đã đọc 8/8 đơn vị).

## Bảng tham chiếu theo đoạn kịch bản

| Đoạn | Ý / ví dụ dùng | Trang PDF |
|---|---|---|
| 00 Mở đầu | Vấn đề "code không có ngữ cảnh/ý định biến mất"; spec là nơi viết rõ mình muốn gì trước khi AI viết code; SDD là giao diện làm việc người–AI; hook câu chuyện tốc độ và giá phải trả | 3, 6–11 |
| 01 Ch.1 Vibe coding và cái bẫy tốc độ | Câu chuyện Nam/Linh, MVP cho vay, ship nhanh rồi rối `verification_status`, refactor 3→11 ngày; vibe coding lấp khoảng trống bằng phỏng đoán; test AI sinh từ code tạo an toàn giả; định nghĩa SDD "sửa spec trước rồi mới sửa code"; so sánh tuần 1 vs tháng 3; SDD ≠ waterfall; 3 câu hỏi cho team | 6–11 |
| 02 Ch.2 Spec là gì | User story ba dòng không đủ; 4 tầng BR / Use Case / Entity Model / AC; ví dụ QR checkout, Order/Payment/QRSession; spec hiện tại vs thay đổi (`specs/` vs `changes/`, tinh thần OpenSpec); use case có Main/Alt/Exception/AC; Ubiquitous Language, Bounded Context; Hexagonal tách lõi khỏi adapter; khi chưa cần đầy đủ | 12–22 |
| 03 Ch.3 Sáu nguyên tắc | (1) Requirements-Driven, `is_premium` rải 4 chỗ; (2) AI-Assisted, người giữ quyết định; (3) Iterative Improvement, spec sống; (4) Test-Protected, test bám AC/hành vi; (5) Stakeholder-Centric, người chịu hậu quả đọc được; (6) Traceable, UC/BR ID trong commit/test/PR | 23–31 |
| 04 Ch.4 Greenfield | HR tool 5 ngày, 3 người (Tuấn/Diệp/An); Ngày 1 phỏng vấn HR → BR-001, 5 UC; Ngày 2 use case diagram, entity, phát hiện "ngày lễ"; Ngày 3–4 UC-004 xin nghỉ, `/plan` đề xuất trừ balance sai so spec → sửa plan, 2 test fail dẫn tới bổ sung AC/rule; Ngày 5 staging, phản hồi; lỗi hay gặp và checklist | 32–43 |
| 05 Ch.5 Brownfield | Billing-engine ~320k dòng, `calculate()` ~800 dòng; hai sai lầm (big bang rewrite, tin spec sinh từ code); 5 bước: entity từ DB, UC từ code/log/UI, kiểm chứng nghiệp vụ, characterization test (50 record anonymized), refactor có bảo vệ (strategy, feature flag 2 tuần); vùng nóng/ấm/lạnh; "dừng vay thêm nợ" | 44–52 |
| 06 Ch.6 Vận hành team | Vai trò PO/BA/TL/Dev/EM/QA; cấu trúc repo `/specs`, `/src` theo use case/domain/ports/adapters, `/tests` map AC, `openspec/specs` vs `changes`; review spec trước code, link UC; lỗi thường gặp; chỉ số Spec/AC Coverage, Regen Success, Trace Ratio; lộ trình 30/60/90 ngày; một ngày mẫu | 53–63 |
| 07 Kết và bắt đầu nhỏ | Khi không nên dùng (prototype ngắn, spike, script một lần, side project một người, chưa có chủ sở hữu nghiệp vụ) và khi nên dùng; gỡ hiểu nhầm; vai trò engineer đổi; 3 việc tuần sau: 1 use case, 1 sprint, 1 dev + 1 người nghiệp vụ, đo rồi học; câu chốt "bắt đầu nhỏ" | 64–68, 63 |

## Diễn giải của kênh (không phải lời sách)

- Câu hook "AI viết gần xong một tính năng trong mười phút, nhưng hai tuần sau không ai giải thích được nó chạy vì sao"
  và cách mở bằng câu hỏi là lời kênh, bám trải nghiệm mở đầu và câu chuyện Nam/Linh (PDF 3, 6–7).
- Lời nối chuyển chương, ví dụ nói gọn, và câu chốt "spec không làm AI chậm đi, nó làm tốc độ có hướng" là cách kênh
  tóm ý (bám PDF 3, 9–11, 68), không phải trích nguyên văn.
- Các con số/so sánh hiệu quả (20 phút ship, 3→11 ngày, 47 file, 32 test, ~70% coverage mục tiêu…) được trình bày là
  **ví dụ/kinh nghiệm trong sách**, không phải số liệu đo đạc độc lập của kênh.

## Không dùng / lưu ý

- Không trích nguyên văn dài; diễn giải và giữ đúng ý bốn tầng, sáu nguyên tắc, hai sai lầm brownfield.
- Không đọc email, đường link, tên công cụ cụ thể như lệnh bắt buộc trừ khi cần ý chính; chi tiết tool (Spec Kit,
  OpenSpec, AIUP, lệnh `/specify`…) chỉ nhắc ở mức khái niệm nếu xuất hiện trong hình.
- Không biến nhận định của sách thành chuẩn bắt buộc cho mọi đội; phần "khi không nên dùng" phải được giữ.
- Thông tin ấn bản/credit trong PDF còn thiếu (không ISBN, không nhà xuất bản/năm); ghi rõ tính chất ebook tự phát hành
  trong description, đối chiếu trước khi credit chính thức.
