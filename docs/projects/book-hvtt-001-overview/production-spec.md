# Kế hoạch dựng — Hiểu về trái tim: tổng quan

- Project: book-hvtt-001-overview · Series: Đọc sách, hiểu mình · 1920×1080, 30 fps · ước 11–12 phút.
- Dựa trên script.md đã duyệt (2026-10-31) và brief.md. Không render/export tự động; người dùng xem trong Studio.
- Cổng làm việc: intro + 30 giây đầu sau intro đã dựng để duyệt (`BookHvttTap01`); phần sau làm tiếp từng đoạn hoặc toàn bộ theo lựa chọn của người dùng.

## Cấu trúc composition

| Composition | Nội dung | Ghi chú |
|---|---|---|
| `BookHvttTap01` | Cả tập ghép theo thứ tự: intro → thẻ tập → các phần nội dung → (ý kiến cá nhân) → nhận xét chung → outro | Một lớp nhạc nền chạy liền; mỗi phần là một `Sequence` riêng, dài theo giọng đọc |
| `BookHvttIntro` | Lời chào series | Giữ nguyên mọi tập |
| `BookHvttEpisodeCard` | Thẻ "TẬP 01 · Hiểu về trái tim · Minh Niệm" + câu giới thiệu tập | Đổi theo tập |
| `BookHvttMoChuyen` | Phần 0b, đoạn 1 (người bà và ngạch cửa) | Đã dựng; các phần sau thêm composition tương tự |
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
- Nhạc: Pufino – Enlivening (freetouse.com), to ở đầu rồi giảm dần từ giây 3, giữ đều phía dưới giọng; có fade đầu/cuối. Nhạc cho phần nội dung chính: chờ người dùng quyết (giữ Pufino hay bản khác).
- Không hiệu ứng âm thanh.

## Danh sách cảnh

Chi tiết từng minh họa: [image-prompts.md](image-prompts.md). Trạng thái: **đã dựng** = có trong Studio; **dự kiến** = chưa dựng.

| Phần | Cảnh | Trạng thái |
|---|---|---|
| 0 | Intro series | đã dựng |
| 0a | Thẻ tập | đã dựng |
| 0b | Người bà và ngạch cửa (đoạn 1) | đã dựng |
| 0b | "Người bà ấy không học tâm lý…" (đoạn 2) | dự kiến |
| 1 | Cuốn sách là gì | dự kiến |
| 2 | Sợi chỉ xuyên suốt | dự kiến |
| 3A–3D | 16 ý, mỗi ý một minh họa | dự kiến |
| 4 | Ý kiến cá nhân | chờ người dùng |
| 5–6 | Nhận xét chung, outro | outro đã dựng |

## QA (khi dựng xong)

Kiểm tra kiểu chữ Stoic, thời gian phụ đề so với giọng, nhạc fade/duck theo đúng công thức, không tràn khung, tất cả composition mở và phát trong Studio không lỗi. Kiểm tra kỹ thuật không thay cho việc người dùng xem/nghe.
