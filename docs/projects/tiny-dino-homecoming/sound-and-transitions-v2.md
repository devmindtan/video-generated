# SFX và chuyển cảnh v2

## Chỉnh sửa

Bản native Veo cũ chủ yếu là ambience, không bảo đảm có đủ tiếng nhấn hành động. Bản v2 giữ native, thêm 21 cue foley ngắn: vỏ trứng nứt/rung, bước chân mềm, cánh bướm/lấp lánh, trượt lá, chạm thảm cánh hoa, nấm nảy và đáp chân. Thêm hai lớp suối/mưa nối liên tục, tổng 23 cue/lớp. Không bật lại stem SFX cũ vì các cue của nó theo cấu trúc tập trước.

Các tiếng bổ sung được tổng hợp cục bộ, không giả định là sample thu thật; tránh meme, tiếng sấm giật mình và hiệu ứng quá chói. Giữ giọng B, lời thoại và nhạc gốc; không gọi thêm Veo.

- Cue: `scripts/projects/tiny-dino-homecoming/foley.json`. `sourceSecond` là giây trong clip gốc, được đổi sang thời gian dựng bằng tốc độ shot mới, không gán cứng theo lời kể.
- Config: `src/projects/tiny-dino-homecoming/edit.json`.
- Stem đang dùng: `public/tiny-dino-homecoming/audio/homecoming-designed-sfx-v2.wav`.
- Stem foley riêng để đối chiếu: `public/tiny-dino-homecoming/audio/homecoming-foley-v2.wav`.
- Backup trước thay: `public/tiny-dino-homecoming/backups/sfx-transition-v1/`.

## Chuyển cảnh

Hòa hình 0.4 giây (12 frame ở 30 fps) ở tám lần đổi góc và bảy lần đổi chặng. Hai clip có handle chồng nhau; tốc độ hình và native audio tính lại cùng công thức trong `edit-timing.py`. Clip nguồn vẫn được phát trọn, không loop hay giữ ảnh cuối.

Bỏ lớp tối rồi sáng lại giữa các chặng. Giữ fade vào mở đầu và fade ra cuối tập. Các chặng/lời kể/phụ đề vẫn bắt đầu ở 0, 16, 34, 52, 70, 102, 130 và 154 giây; tổng 180 giây. Các timing có phần lẻ được làm tròn ra frame nguyên trước khi đưa vào Sequence.

Âm thanh native nối chồng bằng equal-power fade, tránh khoảng trống ở điểm cắt. Foley được duck nhẹ hơn ambience để tiếng hành động vẫn nghe được khi người kể nói. Stem có giới hạn headroom, kiểm tra lại toàn mix sau khi chỉnh gain.

## Kiểm tra

`npm run test:tiny-dino-homecoming`: kiểm tra toàn bộ 5400 frame không có khoảng hở ở điểm cắt, handle chồng đúng, đủ 180 giây, không vượt clip nguồn, cue tham chiếu đúng và foley tái tạo ổn định.

`npm run check:tiny-dino-homecoming`: kiểm tra stem v2 thực sự được dùng, giữ thời lượng/giọng B/phụ đề và peak mix. Bản v2 đạt peak −1.78 dBFS, không clipping; nhạc thấp hơn lời khoảng 21.17 dB.

Chưa render hay xuất MP4/still. Cần nghe và xem duyệt trong Studio, nhất là pose khác nhau ở hai clip AI độc lập; hòa cảnh chỉ làm mềm điểm cắt, không thể bảo đảm liên tục chuyển động như hai góc quay cùng một take.
