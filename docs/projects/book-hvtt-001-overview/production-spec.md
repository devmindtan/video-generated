# Kế hoạch dựng — Hiểu về trái tim: tổng quan

- Project: book-hvtt-001-overview · Series: Đọc sách, hiểu mình · video dài 1920×1080, 30 fps.
- Dựa trên script.md (bản v3 có 3E/3F, sửa theo ghi chú duyệt 2026-10-31) và brief.md. Không render/export cả video tự động; người dùng xem trong Studio.

## Thông tin chốt

- **Thời lượng:** mục tiêu 12,5 phút (750 giây); cho phép dao động **10–15 phút** (±2,5 phút) theo brief. Kịch bản hiện ≈ 2.080 tiếng lời đọc ≈ 12–13 phút ở nhịp 1× có nghỉ, chưa tính phần ý kiến cá nhân (1–2 phút). Không tăng tốc giọng để vừa thời lượng; dài quá thì rút câu.
- **Duyệt:** chốt ban đầu 5 mục → bản vá cho mọi chỉnh sửa sau đó → clip duyệt từng cảnh (đã có giọng) → xem bản dựng (`docs/architecture/review-workflow.md`). Sau khi chốt, agent lập kế hoạch ở tab Tiến trình.
- **Quy tắc đang áp dụng** (series `workflow.json` + AGENTS.md):
  - Một giọng cho cả tập: clone giọng người dùng, +2 bán cung (lựa chọn 2). Trong lúc dựng dùng giọng tạm Quốc Tuấn; sau khi chốt kịch bản thì clone toàn bộ một lượt trên máy GPU, người dùng nghe chọn rồi mới ghép.
  - Video dài: dựng intro + 30 giây đầu sau intro trước, chờ người dùng xem rồi mới làm tiếp.
  - Lời chào, câu chúc, câu chuyển, câu nhận xét chung và lời kết giữ nguyên chữ người dùng.
  - Phần ý kiến cá nhân người dùng đưa khi video gần xong; để chỗ trống có đánh dấu ngay trước nhận xét chung.
  - "Những điểm chưa đạt" nói ở mức tổng quát, không bắt lỗi từng chỗ, không nhắc lại nội dung sai hoặc nhạy cảm của sách.
  - Hình vẽ bằng code, không mặt người, không ảnh AI/Gemini/Veo; chữ Stoic Sans Bold 700; không hiệu ứng âm thanh.

## Cấu trúc composition

| Composition | Nội dung | Ghi chú |
|---|---|---|
| `BookHvttTap01` | Cả tập ghép theo thứ tự: intro → thẻ tập → các phần nội dung → (ý kiến cá nhân) → nhận xét chung → outro | Một lớp nhạc nền chạy liền; mỗi phần là một `Sequence` riêng, dài theo giọng đọc |
| `BookHvttIntro` | Lời chào series | Giữ nguyên mọi tập |
| `BookHvttEpisodeCard` | Thẻ "TẬP 01 · Hiểu về trái tim · Minh Niệm" + câu giới thiệu tập | Đổi theo tập |
| `BookHvttMoChuyen` | Phần 0b (người bà và ngạch cửa) | Đã dựng đoạn 1 |
| `BookHvttCuonSach`, `BookHvttSoiChi`, `BookHvttNhom3A`–`3D`, `BookHvttNhanXet` | Các phần 1, 2, 3A–3D, 5 | Có composition; hình từng ý dựng sau khi chốt |
| (mới) 3E, 3F | Những điểm chưa đạt, Tổng kết | Thêm composition và cảnh khi dựng |
| `BookHvttOutro` | Lời kết, thẻ bình luận/đăng ký, "HẸN GẶP LẠI" | Giữ nguyên mọi tập |

## Phong cách hình (người dùng chọn cách B)

- Minh họa **nét vàng vẽ bằng code** (SVG trong Remotion), không ảnh chụp, không ảnh tạo bằng AI, không Gemini/Veo. Không mặt người; người chỉ xuất hiện qua đồ vật hoặc bàn tay.
- Nền chung với intro/outro: mực tối `#0d1411`, ánh sáng xuyên chéo, bụi vàng, vân giấy (ảnh nhiễu tĩnh dời theo frame), khung vàng đôi đã vẽ sẵn.
- Nét vẽ tự hiện ra (stroke draw) khi cảnh bắt đầu; mỗi cảnh một ý, đổi cảnh bằng mờ chéo ~0,5 giây. Hình sáng nhẹ theo mức to nhỏ của giọng đọc. Không zoom/pan đều đặn mọi cảnh.
- Mỗi cảnh canh theo câu đọc (phraseRanges của giọng), không đặt mốc giờ cứng.

## Chữ

- Stoic Sans (Noto Sans) Bold 700 cho phụ đề và tiêu đề; phụ đề ngà, từ khóa vàng; nhãn kênh "TÂM LÝ CUỘC SỐNG" ở trên.
- Thẻ tiêu đề cho bốn nhóm nội dung (3A–3D); câu trích hiển thị kèm "Hiểu về trái tim, Minh Niệm".

## Âm thanh

- Giọng: clone giọng người dùng, +2 bán cung, một giọng cho cả tập. File chính thức `public/book-hvtt-001-overview/audio/NN-đoạn-voice-full.wav`.
- Nhạc: Pufino – Enlivening (freetouse.com), to ở đầu rồi giảm dần từ giây 3, giữ đều phía dưới giọng; có fade đầu/cuối. **Đề xuất cho phần nội dung chính:** giữ Pufino chạy liền cả tập (một lớp nhạc trong `BookHvttTap01`); người dùng chốt hoặc đổi ở mục Nhạc nền khi chốt ban đầu.
- Không hiệu ứng âm thanh.

## Danh sách cảnh

Chi tiết từng minh họa: [image-prompts.md](image-prompts.md). Trạng thái: **đã dựng** = có trong Studio; **dự kiến** = chưa dựng.

| Phần | Cảnh | Trạng thái |
|---|---|---|
| 0 | Intro series | đã dựng |
| 0a | Thẻ tập | đã dựng |
| 0b | Người bà và ngạch cửa (đoạn 1) | đã dựng |
| 0b | "Lúc đó, đứa nhỏ chỉ thấy hả dạ…" (đoạn 2) | dự kiến |
| 1 | Cuốn sách là gì | dự kiến |
| 2 | Sợi chỉ xuyên suốt | dự kiến |
| 3A–3D | 16 ý, mỗi ý một minh họa | dự kiến |
| 3E | Những điểm chưa đạt (3 ý) | dự kiến |
| 3F | Tổng kết | dự kiến |
| 4 | Ý kiến cá nhân | chờ người dùng |
| 5–6 | Nhận xét chung, outro | outro đã dựng |

## QA (khi dựng xong)

Kiểm tra kiểu chữ Stoic, thời gian phụ đề so với giọng, nhạc fade/duck theo đúng công thức, không tràn khung, tất cả composition mở và phát trong Studio không lỗi. Kiểm tra kỹ thuật không thay cho việc người dùng xem/nghe.
