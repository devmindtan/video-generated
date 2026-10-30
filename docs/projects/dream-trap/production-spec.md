# Dream trap — bản dựng v1

## Cập nhật ảnh thumbnail v2

Chỉ đổi ảnh nền thumbnail thành `public/dream-trap/images/thumbnail-reflection-v2.png`: cận hơn vào người đang ngồi và phiên bản thành công trong gương để chủ đề dễ đọc ở kích thước nhỏ. Giữ nguyên câu “BẠN ĐANG CỐ GẮNG… HAY CHỈ MƠ?”, vị trí chữ, font, màu và bố cục. Component v1 được giữ ở `public/dream-trap/backups/thumbnail-v1/Thumbnail.tsx`; năm ảnh của video không thay đổi. Ảnh tạo bằng imagegen tích hợp, chưa render/export thumbnail.

Tên: **Bạn đang cố gắng… hay chỉ đang tưởng tượng?**

- Composition: `StoicDreamTrap`, dọc 1080×1920, 30 fps, 1440 frame / 48 giây.
- Thumbnail: `DreamTrapThumbnail`; câu “BẠN ĐANG CỐ GẮNG… HAY CHỈ MƠ?”. Một ảnh chủ đạo thể hiện đối lập thực tế và hình dung thành công. Component đã chuẩn bị, chưa export/render.
- Kịch bản nguyên văn đã chốt: [script.md](script.md). Cấu hình tổng hợp 15 cụm: `scripts/projects/dream-trap/audition.json`.
- Giọng Quốc Tuấn, local VieNeu v3 Turbo legacy24, 24 kHz PCM16, 1×. Đây là lựa chọn dựng mới từ playlist ưu tiên, chờ người dùng nghe duyệt; không đổi giọng các tập cũ.
- Bản nguyên gốc: `public/dream-trap/audio/narration-quoc-tuan-v1.wav`, 43.75283 giây. Bản active `narration-quoc-tuan-v2-pauses.wav` dài 48 giây: chỉ thêm 4.24717 giây im lặng, không thay đổi bất cứ sample tiếng nói nào. Bản gốc và audition đều được giữ.
- Caption 27 trang, theo ASR local medium rồi giới hạn theo từng cụm tiếng nói. Chữ giữ nguyên kịch bản, timing được dịch theo khoảng nghỉ. ASR 99.42% không thay thế nghe duyệt; lưu ý kiểm tra âm “khác”/“khắc”, “ngay”/“ngày”.
- Ảnh tĩnh tạo bằng imagegen tích hợp, được xem từng ảnh; prompt đầy đủ trong [image-prompts.md](image-prompts.md). Không gọi Gemini/Veo hoặc API TTS trả phí.
- Màu charcoal, ivory và gold; Stoic Sans / Noto Sans Bold 700 dùng cho cả caption, headline và thumbnail. Có kiểm tra typography tương đương people-pleasing. Không thêm SFX.
- Cảnh bắt đầu tại frame 0, 274, 561, 852, 1169; chuyển cảnh ở khoảng nghỉ giữa các đoạn. Overlap 6 frame với incoming fade 0.2 giây; không zoom.
- Nhạc đầy đủ: `Ludovico Einaudi - Night (Official Video).mp3`, Ludovico Einaudi theo tên tệp nguồn. Đọc 1×, source trim mặc định 41.5 giây. Đây là source trim, không phải timeline Start. Timeline Start mặc định 0, Duration 48 giây. Người dùng có thể kéo/cắt native Audio độc lập trong Edit.
- `music.json`: speechVolume 0.12, pauseVolume 0.22, duck theo caption; fade-in 1.2s, fade-out 2s theo mép nghe được của clip/composition. Không bake excerpt 48 giây.
- QA bằng `npm run check:dream-trap`: kiểm tra PCM/hash, script/caption, thời gian cảnh, cỡ ảnh, chữ không tràn, native Audio controls và phối âm trong RAM. Lần kiểm tra đầu: peak −1.47 dBFS, nhạc thấp hơn giọng khoảng 12.93 dB khi có lời. Chưa xác nhận chất lượng nghe bằng các chỉ số này.
- `npm run typecheck` đã qua. Mở Studio để nghe/xem, không tự xuất MP4, thumbnail hoặc preview frame. Không thay đổi nội dung hay mức nhạc video trước.
