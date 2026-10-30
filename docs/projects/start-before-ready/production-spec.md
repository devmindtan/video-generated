# Bạn không cần đợi hết sợ mới bắt đầu

- Composition: `StoicStartBeforeReady`, 45 giây, 1080×1920, 30 fps.
- Lời đọc: kịch bản đã duyệt; Quốc Tuấn local VieNeu v3 Turbo, legacy24, native 1×. Khoảng nghỉ có chủ đích, không kéo chậm hoặc tăng tốc giọng.
- Hình: sáu ảnh mới, đồ vật/kiến trúc/thiên nhiên; không có mặt người. Bố cục ổn định, chuyển cảnh hòa nhẹ 6 frame, không lặp zoom.
- Caption và thumbnail: Stoic Sans Bold 700, ivory và nhấn vàng, giữ safe margins. Thumbnail: “ĐỢI HẾT SỢ… / ĐẾN BAO GIỜ / MỚI LÀM?”.
- Nhạc: Night — Ludovico Einaudi, toàn bộ file nguồn. Native Audio cho chỉnh start/end/source trim; speechVolume/pauseVolume trong music.json, ducking theo caption; fade-in/out theo mép clip nghe được.
- Không SFX, không Gemini/Vertex/Veo, không render/export tự động.
- QA: kiểm tra nguyên văn caption, timing cảnh, bảo toàn PCM giọng ở 1×, đọc raw ASR tiếng Việt, kiểm tra font và mix trong RAM. Chất lượng cảm nhận/phát âm vẫn cần người dùng nghe duyệt.

## Kiểm tra phát âm

Bản v1 và take sửa riêng được giữ lại. Bản active v2 ghép câu 6 và 8 từ take sửa, giữ nguyên PCM sáu câu khác và khoảng nghỉ nguồn. Nhận dạng lại toàn bộ đã nhận đúng “thiếu gì”, nhưng vẫn ghi “chi hoãn” thay cho “trì hoãn” ở câu cuối. Đây là cờ cần nghe đối chiếu, chưa kết luận lỗi phát âm chỉ từ ASR; chưa gọi bản này là đã duyệt phát âm.
