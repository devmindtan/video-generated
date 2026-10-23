# Production spec — Dành cho những ngày bạn cảm thấy kiệt sức

## Kết luận đã chốt

- Composition mới, không ghi đè `StoicControl`.
- 48 giây, 1080×1920, 30fps; năm cảnh tại 0–8–20–32–42–48 giây.
- Giọng nam Thiền Tâm Đức (VieNeu local, miễn phí), tốc độ 0,90–0,929×; không cảnh nào bị ép nhanh.
- Khoảng lặng được lưu bằng `pauseAfter` trong JSON và ghép thật vào audio.
- Nhạc piano–cello ambient nguyên gốc, tạo cục bộ; mức 0,30 dưới lời và 0,35 trong khoảng nghỉ, fade đầu 1,2 giây và cuối 1,5 giây.
- Chuyển động bám frame Remotion: zoom cảnh 1/3, pan cảnh 4/5, ripple nhẹ cảnh 2.
- Hình ảnh đi từ xanh than lạnh sang bình minh vàng; nửa dưới giữ tối cho typography.
- Caption trắng ngà, fade mềm, từ khóa vàng nhạt; không dùng bounce.

## Tiêu chí kiểm tra

- Voice không nhanh hơn 0,929×.
- Khoảng nghỉ chủ đạo giữa câu 0,8–1,1 giây; cuối mỗi cảnh có thêm 0,5–0,8 giây lắng.
- Nhạc tăng đúng 0,05 trong khoảng không lời, chuyển mức mềm theo frame để không tạo tiếng bật.
- Peak bản mix xấp xỉ -1dBFS và không clipping.
- Animation chỉ phụ thuộc `useCurrentFrame()`.
