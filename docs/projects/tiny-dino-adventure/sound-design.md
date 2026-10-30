# SFX v2 — đồng bộ với chuyển động Veo

Thay bốn tiếng tổng hợp đặt ở mốc cố định bằng audio gốc từ từng clip Veo. Âm thanh được retime bằng atempo đúng playbackRate (1×, 0.8×, 2/3×, 2/3×, 1×), giữ cao độ; cắt cảnh kết còn sáu giây. Fade đầu 120ms, cuối 240ms; giảm gain khi có lời kể theo caption.

Whisper small/VAD không phát hiện lời nói trong năm track gốc. Đây là kiểm tra nhận dạng tự động, không phải xác nhận mọi âm thanh đều tự nhiên hoặc không có nhạc. Cần nghe duyệt nếu muốn thay phong cách âm thanh từng cảnh.

Config âm lượng và envelope: `src/projects/tiny-dino-adventure/sfx.json`. Thay đổi config hoặc footage/caption rồi chạy `npm run sfx:synced:tiny-dino-adventure`. Lệnh này tạo track SFX cho Remotion, bản mix WAV để nghe thử và báo cáo peak trong `public/tiny-dino-adventure/sfx/sfx-v2-check.json`.

Lời kể Trúc Ly và nhạc không đổi. Bản MP4 mới: `out/chuyen-phieu-luu-cua-ti-hon-sfx-v2.mp4`; giữ bản trước để so sánh. Video được copy nguyên từ bản xuất trước, chỉ thay audio bằng bản mix mới, không làm giảm chất lượng hình. Kiểm tra bản mix: 48 giây, peak khoảng −1.87 dBFS, không clipping.

Script `make-sfx.py` cũ vẫn tạo asset tổng hợp cũ để tham khảo; timeline hiện dùng `veo-synced-v2.wav`. Không cần gọi Veo hay phát sinh thêm tác vụ tạo video để cập nhật SFX.
