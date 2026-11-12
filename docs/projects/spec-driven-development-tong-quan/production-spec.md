# Thông tin đã chốt (đề xuất) — Spec Driven Development: tóm tắt cả cuốn sách

| Mục | Giá trị |
|---|---|
| Định dạng | Video dài 16:9, 1920×1080, 30 fps |
| Thời lượng mục tiêu | 13–14 phút (± 1,5 phút); không ép giọng nhanh |
| Thời lượng thực tế | **10:50** (650,0 giây, 19 500 khung; màn tên 6,5 s + lời 642,3 s + đuôi 1,2 s). Kịch bản đọc đúng nguyên văn ở tốc độ 1× ngắn hơn mục tiêu; không kéo giọng hay thêm lời để bù (xem script-review.md) |
| Cấu trúc | Màn tên 6,5 s (chỉ nhạc) → Mở đầu (hook, câu chuyện code không có ngữ cảnh) → Ch.1–6 → Phần kết (khi nào nên/không nên, bắt đầu nhỏ) |
| Giọng | Lựa chọn 1 (preset VieNeu), **Minh Đức**, một giọng cho cả video; không clone. Mẫu nghe đề xuất: đoạn mở đầu (sau khi tạo giọng). `scripts/projects/spec-driven-development-tong-quan/voice.json` (dự kiến) |
| Nhạc | Aylex – Passionate (freetouse.com) hoặc track nền tương đương: 30% trên màn tên, hạ ~1,2% khi giọng vào, giữ cố định dưới lời; fade theo cạnh clip; `src/projects/spec-driven-development-tong-quan/music.json` (dự kiến) |
| Chủ đề hình ảnh | Bản vẽ kỹ thuật (`ban-ve-ky-thuat`): nền xanh #0b1a2b có lưới, xanh lơ #4fd1e8, vàng hổ phách #ffb547, chữ #e6f1fa; màu qua `themeOf` |
| Phong cách animation | Sơ đồ hệ thống động (`so-do-he-thong`, `src/looks/diagram-kit.tsx`) + thẻ thông tin/bảng; luồng, hộp, mũi tên, gói dữ liệu chạy theo frame |
| Chữ | Stoic Sans (Noto Sans) 700 cho tiêu đề/nhãn/phụ đề; code/số DejaVu Sans Mono; chữ trên hình ≥ 34 px |
| Phụ đề | Một dòng là chính, bám mốc câu/giọng; từ khóa nhấn màu; không che vùng nội dung chính (nội dung dưới ~880 px) |
| Nhịp hình | Mỗi câu/vế chính một nhịp hình (mốc từ giọng/timing); sơ đồ chạy liên tục, không vẽ theo từng chữ |
| Chuyển chương | Nhãn chương góc trên trái; nghỉ 1,1–1,2 s cuối đoạn; chuyển mờ trên nền giữ nguyên |
| Duyệt | Làm màn tên + 30 giây đầu sau màn tên trước, chờ người dùng duyệt trong Studio; không render/xuất để duyệt. Quy trình: chốt ban đầu → bản vá → review-preview |
| Xuất | Chỉ khi video xong và người dùng yêu cầu (Render trong Studio) |

## Quy tắc đang áp dụng

- Series "Chưa thuộc series" (`ngoai-kenh/chua-thuoc-series`) không có `workflow.json` riêng: áp dụng quy tắc chung dự án
  (kịch bản có hồn `docs/script-voice-guide.md`, không đọc thông tin thừa, video dài 30 giây đầu rồi chờ duyệt, nhạc
  dưới lời giữ mức nhỏ cố định, không render khi đang làm).
- **Phân vai (2026-11-12):** gói này là thiết kế/kế hoạch của OpenCode; việc thực hiện (giọng, dựng hình/composition,
  timing/captions, ghép, QA sản xuất) do Claude/Codex thực hiện.
- Không intro series, không "Cách làm", không ý kiến cá nhân. Tên tác giả/chi tiết ấn bản không đọc thành lời (để màn
  hình/description).
- Không ảnh tạo bằng AI; chỉ bìa sách (nếu cung cấp) và sơ đồ/thẻ vẽ bằng code. Ảnh tạo mới (nếu có sau này) không lộ
  mặt người.
- Nhận định/đo đạc trong sách là kinh nghiệm của tác giả; kênh trình bày trung thực, không khẳng định như số liệu độc
  lập. Giữ phần "khi không nên dùng SDD".

## Cấu trúc dự kiến (thực hiện)

| Thành phần | Đường dẫn dự kiến |
|---|---|
| Composition | `SpecDrivenDevelopmentTongQuan` (1920×1080, 30 fps) trong `src/projects/spec-driven-development-tong-quan/` và `src/projects/registry.tsx`, `renderTo('spec-driven-development-tong-quan')` |
| Mã hình | `src/projects/spec-driven-development-tong-quan/{Video,Chapters,common,timing,captions,music}.tsx/json` |
| Giọng | `public/spec-driven-development-tong-quan/audio/*.wav` + voice-metadata/timing (preset Minh Đức) |
| Tài liệu | `docs/projects/spec-driven-development-tong-quan/` (script, brief, sources, production-spec, image-prompts, script-review, voice-audition, description, captions.srt, qa) |
| Script pipeline | `scripts/projects/spec-driven-development-tong-quan/` (build-story, sentence-times, voice, voice.json) |

## Kế hoạch giọng & nhạc (đề xuất)

- **Giọng:** option 1 (preset), Minh Đức, tốc độ 1×, nghỉ tự nhiên giữa câu/ý; thuật ngữ (SDD, BR, Use Case, AC, Bounded
  Context, Hexagonal, Greenfield/Brownfield, Spec Kit/OpenSpec) đọc rõ, giữ cách đọc nhất quán; phụ đề giữ chữ gốc.
- **Nhạc:** track không lời, năng lượng vừa, không lấn giọng; 30% màn tên, ~1,2% dưới lời, pause giữ mức nhỏ cố định,
  fade in/out theo cạnh clip; chọn/trim trong Studio, bản nguồn đầy đủ (không excerpt cứng).
