# Lời khuyên đúng còn tùy hoàn cảnh

Composition: `StoicRightAdvice` — 48 giây, 30 fps, 1080×1920. Cover `RightAdviceThumbnail` có sẵn dưới dạng component chỉnh được; chưa xuất ảnh.

## Mạch kể và biên tập

Giữ luận điểm lời khuyên cần phù hợp hoàn cảnh, không biến thành chủ nghĩa “không có gì đúng sai”. Mở bằng các cặp khuyên trái ngược, ví dụ cụ thể là câu “cố thêm chút nữa”; so sánh người trì hoãn với người làm nhiều tuần không nghỉ, rồi đưa ra câu hỏi tự đối chiếu trước khi làm theo.

Bỏ ví dụ thuốc hạ sốt/co giật/hạ thân nhiệt: không dùng một khẳng định y khoa làm bằng chứng cho ẩn dụ. Không gọi người xem “lười biếng”, “hèn nhát”; không nói rằng chỉ bản thân mới biết cách chữa lành. Hình lọ thuốc là ẩn dụ cho tính phù hợp, không phải chỉ dẫn tự chẩn đoán hay dùng thuốc. [Lời thoại đầy đủ](script.md).

## Hình và âm thanh

Năm cảnh ở 0–8, 8–18, 18–28, 28–38, 38–48 giây. Năm ảnh mới, framing ổn định, chồng mờ đầu cảnh 0,16 giây với ảnh trước giữ thêm 0,2 giây; không phóng gần lặp lại. Sương/bụi trang trí đồng bộ theo frame. Không giả rằng búa, chén và đĩa cân đang chuyển động thật. [Prompt và asset](image-prompts.md).

Giọng Hải Đăng 1×, ngắt ngắn và tự nhiên. Tạo cục bộ bằng pipeline VieNeu đang dùng; căn phụ đề bằng faster-whisper medium cục bộ, giữ chữ tác giả trong Caption JSON và SRT. Không gọi API tạo video/nhạc/giọng.

Nhạc đã khôi phục về Experience reverb ban đầu, dùng nguồn đầy đủ `public/single-task/audio/experience-reverb-full.wav`, source trim 85 giây, tốc độ nhạc 0,85× (không đổi tốc độ lời đọc). Mức âm 0,28 khi đọc, 0,36 khi nghỉ; timing vẫn chỉnh trong Edit, mức âm trong `music.json`. Các nguồn METAMORPHOSIS và Memory Reboot được giữ nguyên, không xóa. Không tạo đoạn nguồn bị đóng cứng theo 48 giây; cần kiểm tra quyền đăng nhạc thương mại.

Chỉnh đầu/cuối/source trim/tốc độ trên native Audio trong Edit. Giữ `speechVolume` và `pauseVolume` trong `src/projects/right-advice/music.json`, tự duck theo lời đọc. Fade-in 1 giây và fade-out 2 giây theo `fadeInSeconds`/`fadeOutSeconds`; dùng MusicFade ở shared cùng tập discipline-purpose, đọc mép clip hiện tại và giới hạn theo composition, không lưu mốc kết thúc cũ.

Theo quyết định mới của người dùng, tập này **không dùng SFX**: `enabled: false` trong `sfx.json`, nên toàn bộ track hiệu ứng không được mount. Chỉ giữ nhạc nền và lời đọc. Thiết kế thử [v2](sound-v2.md), các source stem và snapshot v1 được giữ lại để có thể khôi phục; không tự bật lại.

## Kiểm tra và bàn giao

```sh
npm run check:right-advice
npm run typecheck
npm run test:music-edit
node scripts/projects/discipline-purpose/test-music-fade.mjs
npm run dev
```

Chọn `StoicRightAdvice` để nghe duyệt, đặc biệt đầu/cuối nhạc và ba điểm SFX. QA tự động kiểm tra source, timing, ảnh, phụ đề, tốc độ giọng, headroom và tương quan nhạc/giọng trong RAM; không thay thế nghe/xem thực tế. Báo cáo tại [qa.json](qa.json).

Tạo lại giọng: `npm run voice:right-advice` (cache câu không đổi). Generator SFX hiện tại: `npm run sfx:v2:right-advice`; lệnh `sfx:right-advice` cũ chỉ là v1, không được dùng để dựng bản hiện tại. Cả hai từ chối ghi đè asset đã có. Không tự render/export MP4, preview still hay thumbnail; không Gemini/Veo/Vertex.
