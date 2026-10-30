# Kiểm tra bản dựng hiện hành

## Cập nhật SFX v2 — 24/10/2026

Kiểm tra hiện hành đã đạt: 30 cue nước + nền nước CC0, SFX thấp hơn lời khoảng 13.17 dB; nền 6 cảnh dưới nước khoảng −31.87 đến −28.62 dBFS RMS. Nhạc thấp hơn lời 27.11 dB, mức đỉnh tổng ước tính −2.00 dBFS. Stem tổng `ocean-underwater-sfx-v2.wav` đã được chọn trong runtime, v1 đã backup. Đây vẫn là kiểm tra số, cần người dùng nghe duyệt; không render hoặc gọi API tạo clip. Thông số 16 cue/−2.24 dBFS bên dưới là lần kiểm tra v1 trước đó, không phải thông số runtime hiện hành.

`test:flow` 7 test, `test:veo` 25 test (mock/offline), `test:glowing-whale` 6 test và TypeScript đều đạt. Việc thêm Flow/Gemini không tạo video mới, không mở khóa API có phí. Bộ Flow chỉ đóng gói ảnh và prompt sẵn có.

## Lần kiểm tra hình và bản phối v1

- Composition `GlowingWhale`: 60 giây, 1800 frame, 30 fps, 1080×1920.
- 7/7 cảnh có video thật được chọn; nguồn 720×1280, 8 giây mỗi clip. `07-shine-v2` thay bản kết `07-shine` bị đổi khuôn mặt/kéo dài thân. Cả hai nguồn vẫn giữ, `takes.json` chỉ chọn v2.
- Đã xem các khung nguồn 1/4/7 giây của 6 cảnh đầu, thêm 1/4/6.8 giây của bản kết v2; không phát hiện lỗi nhân đôi lớn hoặc kéo dài thân như bản kết bị loại trong các khung đã xem. Đây là kiểm tra mẫu, không bảo đảm mọi frame AI đều hoàn hảo.
- Giọng B mặc định và A gốc đủ cả 7 cảnh, cùng sample rate 24 kHz và thời lượng; không cắt lời ở cuối cảnh.
- Phụ đề giữ đúng toàn bộ chữ của kịch bản, mốc theo bản đọc, không chồng trang hoặc tràn cảnh. Đối chiếu ASR thấp nhất 88.89%; kết quả này không thay thế nghe duyệt phát âm tên riêng.
- Stem nhạc và SFX đủ 60 giây; 16 cue quy đổi theo tốc độ clip nguồn. Native Veo audio luôn tắt.
- Mức đỉnh bản phối tuyến tính **ước tính** −2.24 dBFS; nhạc thấp hơn lời trong vùng có giọng khoảng 25.45 dB. Đây là phân tích WAV theo envelope runtime, không phải kiểm tra một MP4 đã render.
- `npm run typecheck`: đạt.
- `npm run test:glowing-whale`: 6 test đạt.
- `npm run test:veo`: 14 test đạt (mock, không gọi API tạo video).
- `npm run check:glowing-whale`: đạt; báo cáo ở `public/glowing-whale/audio/check.json`.
- Remotion bundle chạy được, danh sách composition nhận đúng video/thumbnail; trang Studio trả HTTP 200.

Chưa render MP4, composition still hoặc thumbnail; chưa nghe/xem liên tục toàn bộ bản phối trong trình duyệt. Người dùng mở `http://localhost:3000/GlowingWhale` để duyệt cảm quan trước khi chủ động xuất.

Ảnh, video, WAV và state API nằm ngoài git; sao lưu `public/glowing-whale/` và `.cache/veo/glowing-whale/` riêng nếu cần chuyển máy. Không chia sẻ `.env.local`.
