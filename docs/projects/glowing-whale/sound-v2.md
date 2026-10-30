# SFX dưới nước v2

Bản v1 giữ ở `public/glowing-whale/backups/sfx-v1/`; WAV v1 không bị ghi đè. Không đổi giọng B hoặc tạo/render video mới.

## Thiết kế mới

- Nền nước thật đã xử lý: tiếng rền nước và chuyển động nước xuyên suốt 6 cảnh đầu, thay lớp nhiễu cực nhỏ cũ.
- 30 cue theo giây clip nguồn: cụm bọt nước, tiếng lướt/quẫy, gợn nước; chỉ giữ 2 điểm sáng nhỏ, giảm tiếng chime giống bíp.
- Duck SFX nhẹ 18%, nền nước 15% dưới lời thay vì để mất âm môi trường. Nhạc hạ nhẹ (.14 khi có lời, .22 khi nghỉ); WAV nhạc không đổi trong lần chỉnh này.
- Chỉ lọc SFX cho cảm giác nước; không làm nghẹt giọng kể. Đoạn từ 53 giây lên mặt biển giảm lớp chìm, chuyển sang gợn nước thoáng hơn.
- Khống chế các đỉnh pop riêng trước khi phối nền; không để một đỉnh âm kéo nhỏ toàn bộ nền 60 giây.
- Ba stem để nghe kiểm tra: `ocean-underwater-sfx-v2.wav` (tổng), `ocean-underwater-ambience-v2.wav` (nền), `ocean-water-actions-v2.wav` (hành động). Runtime chỉ phát stem tổng, không cộng thêm hai stem còn lại.

## Nguồn và giấy phép

Tất cả nguồn bên dưới được trang tác giả ghi **CC0**, kiểm tra ngày 24/10/2026:

1. **Kinoton — Underwater Ambience**: [trang tác giả và giấy phép](https://freesound.org/people/Kinoton/sounds/393819/). Bản ghi môi trường đã xử lý bằng pitch/EQ/reverb; dùng trích đoạn 60 giây đầu từ preview HQ công khai. Lưu PCM 24 kHz trong `audio/sources/kinoton-underwater-excerpt-60s.wav`. Không lấy hay yêu cầu thông tin đăng nhập. Bản tải MP3 bị gián đoạn được giữ trong `.cache/glowing-whale-sfx-downloads/`, chỉ phần 60 giây đã giải mã đủ được dùng; không coi MP3 tải thiếu là bản master hoàn chỉnh.
2. **BMacZero / Brian MacIntosh — Bubble Sound Effects**: [trang nguồn và giấy phép](https://opengameart.org/content/bubble-sound-effects). Ba single bubble và hai bubble loop; cắt cụm, đổi nhịp nhẹ, lọc và chỉnh mức.
3. **jcpmcdonald — Skippy Fish Water Sound Collection**: [trang nguồn và giấy phép](https://opengameart.org/content/skippy-fish-water-sound-collection). Chỉ lấy `swim.wav` và `water.wav` làm chuyển động/gợn nước, không lấy scream/eating hay lời nói.

Các file tải gốc dùng cho dựng nằm trong `public/glowing-whale/audio/sources/`. Đây không phải bản ghi hydrophone thực địa của bối cảnh phim; là thiết kế âm thanh từ các mẫu nước và môi trường đã xử lý.

## Kiểm tra

`npm run check:glowing-whale` kiểm tra mức SFX tương đối với lời, nền nước của từng cảnh, clipping ước tính, thời lượng và tài nguyên. Kết quả số không thay thế nghe duyệt bằng tai trên thiết bị của người dùng. Không dùng API trả phí để chỉnh âm.
