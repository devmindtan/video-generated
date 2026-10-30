# Một ngày chưa tốt không xóa cả hành trình

- `StoicOneBadDay`: 45 giây, 1080×1920, 30 fps. `OneBadDayThumbnail`: mục Still riêng trong Studio.
- Script được người dùng duyệt, giữ nguyên từ ngữ; câu tự nhủ mở đầu được đọc liền, không cần giọng nhân vật khác.
- Quốc Tuấn, local VieNeu v3 Turbo, legacy24 24kHz PCM16 ở tốc độ native 1×. Chèn khoảng lặng giữa các cụm ý, không tăng/giảm tốc để ép thời lượng.
- Sáu ảnh 9:16 mới, không người/mặt người: domino một lần đổ, tháp đá còn nguyên, vải đang dệt, xe cút kít quá tải, dụng cụ điều chỉnh, đường đá nối tiếp. Hình ảnh hỗ trợ ý, không đọc lời giải thích ẩn dụ.
- Caption/headline/thumbnail Stoic Sans Bold 700, ivory và gold. Cảnh ổn định, fade 6 frame giữa cảnh, không zoom liên tục.
- Thumbnail: “MỚI LỠ MỘT NGÀY… / ĐÃ VỘI / BỎ CUỘC?”, hero domino. Chỉ chuẩn bị component, không xuất file ảnh tự động.
- Night — Ludovico Einaudi, nguồn đầy đủ; native Audio cho phép chỉnh đầu/cuối/trim riêng trong Studio Edit. Giữ speechVolume/pauseVolume, caption ducking và fade-in 1.2s/fade-out 2s theo mép nghe được.
- Không SFX. Không Gemini/Veo/Vertex/API tạo video. Không render/export MP4 hay thumbnail/preview tự động.
- Kiểm tra kỹ thuật không thay thế nghe duyệt phát âm tiếng Việt hay đánh giá cảm nhận. Đọc raw transcript để phát hiện thay từ/dấu.

## Chọn take và kiểm tra phát âm

Active v2 dùng câu “Bạn muốn bỏ…” từ pronunciation-fix-v2, giữ sáu câu còn lại và các khoảng nghỉ của nguồn v1. Cả hai take sửa và các assembly trung gian đều được giữ. Câu “Bạn cần hiểu…” giữ bản gốc: các ứng viên sửa làm ASR đổi thêm “thay” thành “thấy”, nên không được chọn. Raw transcript toàn assembly đã nhận đúng “về bản thân”, “thay được”; vẫn ghi “con sửa” cho “còn sửa”. Chưa xác nhận dấu/phát âm nếu chưa có nghe đối chiếu. Điểm word match 1.0 bỏ qua dấu không phải xác nhận phát âm đúng.
