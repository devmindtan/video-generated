# Kế hoạch hình/animation từng cảnh (chưa có ảnh)

Video dài 16:9, 1920×1080, 30 fps. Theme **Bản vẽ kỹ thuật** (`ban-ve-ky-thuat`) + style **Sơ đồ hệ thống động**
(`so-do-he-thong`). Mọi hình vẽ bằng code (SVG/React, `diagram-kit.tsx`, màu `themeOf`); **không ảnh tạo AI**. Hình đổi
theo câu (mốc giọng/timing), phần tử chạy liên tục (luồng, gói, nhịp sáng), phụ đề dưới ~930 px.

## Màn tên (0–6,5 s, chỉ nhạc)
- Lưới bản vẽ, sơ đồ mờ "prompt → AI → code" với dấu hỏi ngữ cảnh; gói dữ liệu chạy.
- Tiêu đề "Spec Driven Development" (nhấn accent), dòng phụ "Tóm tắt cả cuốn sách".

## 00 · Mở đầu — code nhanh, ngữ cảnh mất
- Thẻ chat/prompt gửi AI → khối code hiện nhanh (file/controller/service/test) + đồng hồ "phút"; rồi hai tuần sau: ba chỗ
  set `status` khác nhau, bong bóng "tại sao?".
- Câu hỏi hook: "chạy được, nhưng ý định nằm ở đâu?"; so sánh "có spec" (neo) vs "không spec" (mờ).

## 01 · Ch.1 — Vibe coding và cái bẫy của tốc độ
- Timeline Nam/Linh: MVP ship nhanh → tháng 3 rối logic → thêm tính năng 3 ngày thành 11 ngày (thanh thời gian).
- Vibe coding: khoảng trống trong yêu cầu → AI điền bằng phỏng đoán; test sinh từ code = vòng tròn "an toàn giả".
- Định nghĩa SDD: "người thống nhất ý định ↔ spec ↔ AI viết code/test/doc", vòng "sai thì sửa spec trước".
- Bảng nhỏ so sánh tuần 1/tháng 3 (onboard, refactor, đổi tool); nhãn "SDD ≠ waterfall" (spec markdown, sửa được, AC).

## 02 · Ch.2 — Bốn tầng spec, ngôn ngữ chung, ranh giới
- User story 3 dòng vs khoảng trống (QR hết hạn 5 hay 15 phút?).
- Bốn tầng xếp chồng: **BR** (vì sao, đo được) → **Use Case** (actor/flow/ngoại lệ) → **Entity Model** (Order, Payment, QRSession) → **AC** (Given/When/Then).
- Hai ngăn: `specs/` (baseline hiện tại) và `changes/` (proposal, delta, design, tasks) → archive nhập baseline.
- Ubiquitous Language: tên rõ thay `tbl_dh_v2`; Bounded Context: "Order" ở checkout/shipping/finance tách vùng.
- Hexagonal: lõi (use case/entity/rule, port) ở giữa, adapter (HTTP, DB, payment, email) cắm ngoài; mũi tên phụ thuộc hướng vào lõi.
- Thẻ "khi chưa cần": script một lần/CRUD đơn giản/prototype.

## 03 · Ch.3 — Sáu nguyên tắc
- Vòng 6 nút sáng lần lượt: **Requirements-Driven** (`is_premium` rải 4 chỗ → đưa vào spec/DoD), **AI-Assisted** (AI lặp, người quyết tiền/quyền/kiến trúc), **Iterative Improvement** (v1→v2→v3, history/deprecate AC), **Test-Protected** (test bám AC, cây thư mục theo UC/AC), **Stakeholder-Centric** (PO/dev/QA cùng đọc, câu "đương nhiên?"), **Traceable** (commit/PR/test gắn UC/BR, truy vết sự cố).
- Mỗi nguyên tắc 1 icon + 1 ví dụ ngắn từ sách.

## 04 · Ch.4 — Greenfield (HR tool 5 ngày)
- Dòng thời gian 5 ngày: Ngày 1 phỏng vấn → BR-001 + 5 UC; Ngày 2 diagram + entity + "ngày lễ" chưa rõ; Ngày 3–4 spec UC-004, plan sai (trừ balance khi submit) bị chặn bởi spec, test 26/28 → bổ sung AC/rule; Ngày 5 staging, phản hồi, chốt MVP.
- Bảng kết quả minh họa (15 ngày công, 32 test map AC, BR/UC/entity/diagram) — gắn nhãn "ví dụ trong sách".
- Ba lỗi hay gặp (spec quá chi tiết sớm, thiếu AC, code trước spec) dạng checklist cảnh báo.

## 05 · Ch.5 — Brownfield (billing-engine)
- Kho mã legacy: `calculate()` 800 dòng, nhánh `flag_v2/v3/specialCase`; nhãn "320k dòng, README 4 dòng".
- Hai sai lầm gạch chéo: big bang rewrite khi chưa baseline; viết spec từ code rồi coi là đúng.
- 5 bước dạng bậc thang: entity từ DB (xác nhận nghiệp vụ) → UC từ code/log/UI (rõ/đoán/bí ẩn) → kiểm chứng với nghiệp vụ, tách baseline vs change → characterization test (record thật anonymized) → refactor có bảo vệ (strategy, feature flag chạy song song 2 tuần).
- Bản đồ nóng/ấm/lạnh; chip kết "SDD trên legacy: dừng vay thêm nợ".

## 06 · Ch.6 — Vận hành team
- Các vai trò quanh "spec" ở giữa: PO/BA (BR, UC, edge case), TL (kiến trúc/ADR, AI hay người), Dev (gap, test map AC), EM (nhịp/chỉ số/onboard), QA (soi AC sớm).
- Sơ đồ repo: `/specs` (BR/UC/entity, `_legacy`), `/src` (use-cases/domain/ports/adapters), `/tests` (AC), `openspec/specs` vs `changes`.
- Pipeline review: spec PR → code PR link UC → test map AC → hỏi "AI quyết hay bạn quyết?".
- 4 chỉ số: Spec Coverage, AC Coverage, Regen Success, Trace Ratio (thanh/gauge minh họa).
- Lộ trình 30/60/90 ngày (pilot → mở rộng + đo → retrospective).

## 07 · Kết — khi nào nên/không nên, bắt đầu nhỏ
- Hai cột: **nên dùng** (sống >6 tháng, >2 dev, rule không tầm thường, turnover, AI sinh nhiều code) vs **không nên** (prototype ngắn, spike, script một lần, side project một người, chưa ai giữ nghiệp vụ).
- Ba hiểu nhầm gỡ nhanh: không phải waterfall, đầu tư trả lại về sau, không chỉ enterprise.
- Ba việc tuần sau nổi bật: chọn 1 use case, làm trọn vòng trong 1 sprint (1 dev + 1 người nghiệp vụ), tạo `/specs` + template, đo 1 chỉ số (PR có UC ID).
- Kết: "bắt đầu nhỏ, để tốc độ có hướng".

## Caption
- Một dòng, bám mốc câu; đặt thấp, không che sơ đồ. Thuật ngữ (SDD, BR, Use Case, Entity, AC, UC, Bounded Context, Hexagonal, Greenfield/Brownfield) giữ chữ gốc, nhấn màu khi là từ khóa.
