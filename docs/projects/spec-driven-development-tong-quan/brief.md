# Spec Driven Development: tóm tắt cả cuốn sách

- Nhóm: Chưa thuộc kênh / Chưa thuộc series (`ngoai-kenh/chua-thuoc-series`); sách `spec-driven-development`
  (*Spec Driven Development*, Nguyễn Thế Huy), hồ sơ nghiên cứu đã đọc đủ 8/8 đơn vị nội dung (lời nói đầu, 6 chương,
  phần kết, phụ lục), 79 trang PDF.
- Project ID (đề xuất): `spec-driven-development-tong-quan`.
- Định dạng: video dài 16:9, 1920×1080, 30 fps. Thời lượng mục tiêu 13–14 phút.
- Trạng thái: **thiết kế/kịch bản và kế hoạch** (OpenCode). Chưa dựng, chưa chốt; việc thực hiện giao cho Claude/Codex.
- Thực hiện (Claude, 2026-11-12, người dùng: "Làm luôn cho cuốn sách kỹ thuật còn lại"): project đã đăng ký
  (`series.json`, composition `SpecDrivenDevelopmentTongQuan`). Theo luật video dài, làm trước màn tên + phần mở đầu
  (giọng Minh Đức, hình) rồi chờ người dùng xem trong Studio; các phần sau làm khi người dùng cho đi tiếp. Hình theo
  hướng giải thích đơn giản của video Kiến trúc ứng dụng web: mỗi ý một sơ đồ lớn, không chữ code, chuyển cảnh lần lượt.

## Mục tiêu

Tóm tắt trọn vẹn cách cuốn sách nhìn vấn đề "AI viết code rất nhanh nhưng thiếu ngữ cảnh": vì sao cần spec, spec gồm
những tầng nào, sáu nguyên tắc vận hành, và cách áp dụng cho dự án mới (greenfield) lẫn mã cũ (brownfield). Người xem
nắm được ý chính của từng chương và biết nên bắt đầu nhỏ từ đâu, không cần đọc hết ebook.

## Khán giả và thông điệp

- Lập trình viên, Tech Lead, Engineering Manager, PO/BA đang dùng AI coding agent hoặc chuẩn bị đưa AI vào quy trình.
- Thông điệp: tốc độ của AI khuếch đại cả đúng lẫn sai; spec là nơi neo ý định (cho người và cho AI), không phải giấy tờ
  waterfall. Bắt đầu nhỏ: một use case, một vòng spec → test → code → phản hồi.

## Cách làm (bám sách)

- Không intro series, không đoạn "Cách làm", không ý kiến cá nhân. Màn tên trên nhạc → hook vào câu chuyện Nam/Linh và
  lỗi "code không có ngữ cảnh" → đi theo thứ tự 6 chương + phần kết/phụ lục tinh gọn → khép bằng "bắt đầu nhỏ".
- Giữ ví dụ xuyên suốt của sách: KYC/checkout, HR tool 5 ngày (greenfield), billing-engine legacy (brownfield), các mẫu
  BR/Use Case/Entity/AC.
- Hình là sơ đồ và thẻ vẽ bằng code: luồng vibe coding vs SDD, bốn tầng yêu cầu, spec hiện tại/thay đổi, vòng lặp 6
  nguyên tắc, luồng greenfield 5 ngày, 5 bước brownfield, cấu trúc repo/traceability, chỉ số và lộ trình 30/60/90 ngày.
- Không dùng ảnh tạo bằng AI; chỉ bìa sách (nếu có) và sơ đồ/thẻ code.

## Lựa chọn đề xuất (chờ người dùng duyệt khi chốt)

| Mục | Đề xuất | Ghi chú |
|---|---|---|
| Chủ đề hình ảnh | **Bản vẽ kỹ thuật** (`ban-ve-ky-thuat`) | Nền xanh bản vẽ, nét xanh lơ, nhấn vàng hổ phách; hợp sơ đồ/luồng |
| Phong cách animation | **Sơ đồ hệ thống động** (`so-do-he-thong`) + đồ họa thông tin | Hộp, mũi tên phụ thuộc, thẻ spec/code, gói dữ liệu/luồng chạy |
| Giọng | Lựa chọn 1: **Minh Đức** (VieNeu preset), một giọng | Rõ, phù hợp nội dung kỹ thuật/quy trình; nghe mẫu trước khi chốt |
| Nhạc | Aylex – Passionate (freetouse.com) hoặc track nền nhỏ tương đương | 30% trên màn tên, ~1,2% dưới lời, fade theo cạnh clip |
| Chữ | Stoic Sans (Noto Sans) 700; code/số DejaVu Sans Mono; chữ trên hình ≥ 34 px | Phụ đề một dòng, từ khóa nhấn màu |

## Nguồn và kiểm chứng

Xem [sources.md](sources.md). Bám hồ sơ nghiên cứu
`series/ngoai-kenh/chua-thuoc-series/books/spec-driven-development/research.md` (đọc đủ 79/79 trang, SHA
`cca3fe77…`, trang PDF 1-based). Lời kênh chỉ nối ý; các nhận định/đo đạc của sách được trình bày như kinh nghiệm của
tác giả, không như bằng chứng định lượng độc lập. Không đọc thông tin thừa (email, website, năm xuất bản không có trong
PDF) vào lời; chi tiết ấn bản/credit để description và màn hình.

## Gói kế hoạch (thiết kế)

- [script.md](script.md): kịch bản theo câu, mốc phần/chương, ghi chú nguồn.
- [sources.md](sources.md): bảng tham chiếu trang PDF cho từng đoạn.
- [production-spec.md](production-spec.md): thông tin chốt đề xuất, cấu trúc, quy tắc áp dụng.
- [image-prompts.md](image-prompts.md): kế hoạch hình/animation từng cảnh (không ảnh AI).
