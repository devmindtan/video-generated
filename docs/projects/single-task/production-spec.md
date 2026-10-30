# Một việc. Không tab thứ hai.

`StoicSingleTask` · 45 giây · 1080×1920 · 30 fps. Cover `SingleTaskThumbnail`, chưa export. Project độc lập `single-task`.

## Hướng viết và nhịp dựng

Thẳng vào hành vi mở tab, làm việc lặt vặt để né việc chính; không dùng công thức chữa lành của `past-self` hoặc `let-it-settle`. Không “thở sâu”, “bạn đã làm rất tốt”, “dừng lại một chút”, không CTA đọc. Trực tiếp nhưng không gọi người xem lười hoặc quy mọi kiệt sức cho mất tập trung.

Kịch bản triển khai giữ năm ý của đề bài, chỉnh lời nói cho tự nhiên: mở đầu “không phải lúc nào bạn cũng mệt vì việc quá nhiều”; đoạn 30 phút hướng đến “một phần cụ thể”, không hứa hoàn thành bất kỳ việc khó nào trong 30 phút. Câu kết theo yêu cầu mới: “Đừng tìm cảm hứng nữa. Quay lại làm việc đi. Cảm hứng sẽ đến sau khi bạn bắt đầu.” Giữ đúng chữ “sẽ”, không dùng “thường” hoặc “có đà”. Bản kết trước sửa được backup ở `public/single-task/backups/ending-v1/`.

Mốc 0/7/17/28/38, thời lượng 7/10/11/10/7 giây. Cắt thẳng, không dissolve dài hoặc fade đen ở giữa. Ảnh đứng yên, chữ hiện nhanh 0,12 giây, không zoom lặp. Headline 96px, caption 44px. Bảng màu thép/ivory, nhấn đồng, ánh sáng gắt hơn hai video trước. Thumbnail dùng điện thoại nứt, chữ “BẬN RỘN / HAY ĐANG NÉ?”.

## Asset và âm thanh

Năm ảnh mới: điện thoại, máy đánh chữ kẹt, pin thủy tinh, đóng laptop, đục đá. Tạo bằng imagegen tích hợp, không Gemini/Veo hoặc API trả phí riêng. Đây là ảnh tĩnh theo workflow triết lý; không giả nhận có clip ngón tay lướt hoặc cần gõ chuyển động thật. Hình đóng laptop mang nghĩa ngắt phân tán, không chỉ dẫn đóng máy rồi không làm việc.

Giọng Hải Đăng (Stoic Control), VieNeu CPU cục bộ, giọng gọn/đanh, pause ngắn, tốc độ gốc 1×. Caption JSON/SRT căn theo bản thu bằng faster-whisper medium. Kiểm tra tự động không thay thế nghe duyệt ngữ điệu.

Nhạc: chỉ tìm thấy `stoic/audio/experience.mp3`, chưa có bản reverb được nhận diện nguồn. Bản nguồn đầy đủ đã xử lý reverb tại `public/single-task/audio/experience-reverb-full.wav` dài khoảng 317,16 giây (315,56 giây gốc cộng đuôi reverb). Bản cắt 45 giây `experience-reverb-local.wav` và provenance cũ vẫn được giữ, không còn dùng làm nguồn runtime. Có early reflections và diffuse tail stereo; không phải bản remix bên thứ ba đã xác minh. Giữ MP3 gốc, ghi hash và provenance; không gán giấy phép của file nhạc procedural trong `stoic/audio/music-credits.json` cho Experience. Việc có file local hoặc thêm reverb không cấp quyền đăng/kiếm tiền; người dùng kiểm tra quyền nhạc trước khi đăng.

## Chỉnh nhạc trực tiếp trong Edit

Trong `StoicSingleTask`, chọn track **Nhạc nền · Kéo/cắt tự do** → clip **Experience · Reverb · Chỉnh trực tiếp trong Edit**. Timing trên native Audio viết inline nên Edit có thể lưu trực tiếp vào JSX: `from` (vị trí trên timeline), `trimBefore` (đoạn bỏ qua ở đầu file nhạc), `durationInFrames` (độ dài đoạn nguồn), `playbackRate`. Khi rate = 1, thời điểm kết thúc trên timeline = Start + Duration. Kéo thân clip để dời, kéo mép để trim hoặc sửa các ô timing trong Edit. Không có fade-out cố định theo giây 45.

Đã chuyển lựa chọn người dùng nhập `sourceStartSeconds: 10` trong bản cắt bắt đầu ở giây 75 thành **trim 85 giây trong bản đầy đủ**, mặc định phát 0–45 giây trên timeline. Các giá trị này là mặc định chỉnh được, không phải ràng buộc của asset. **Âm lượng vẫn chỉnh trong `music.json`: `speechVolume` khi có lời đọc (0,25), `pauseVolume` khi nghỉ (0,30).** Caption-driven ducking được khôi phục, không điều khiển hoặc khóa đầu/cuối clip. Chỉ timing tách khỏi JSON, không bỏ các điều khiển âm lượng. Video vẫn dài 45 giây: nhạc kéo ra ngoài video không làm video tự dài hơn, muốn nghe/xuất sau giây 45 phải đổi duration của composition riêng.

Backup config/JSX/script trước sửa: `public/single-task/backups/music-fixed-v1/`. Không tự render. `make-reverb.py` không ghi đè bản nguồn đầy đủ đã có; đổi phiên bản nếu muốn làm lại. `check:single-task` đọc timing thực từ JSX, không còn đòi nhạc bắt đầu ở 0 hoặc nguồn chỉ dài 45 giây. `npm run test:music-edit` kiểm tra các thay đổi move/trim/rate/volume offline; chưa tự động xác nhận thao tác kéo thả trong browser.

## Thao tác

- `npm run voice:single-task`: tổng hợp giọng và căn phụ đề offline.
- `npm run music:single-task`: tạo asset reverb riêng từ bản nguồn local, không xuất MP4/still.
- `npm run check:single-task`: kiểm tra ảnh, nhịp, caption, tempo, headroom và music/voice trong RAM, chỉ ghi QA JSON.
- `npm run typecheck`: kiểm tra TS.
- `http://localhost:3000/StoicSingleTask`: xem/nghe trong Studio, người dùng tự render.

Không tự render MP4, preview still hoặc thumbnail. Các ảnh nguồn đã được xem; chưa thực hiện duyệt nghe và kiểm tra trực quan bản dựng tự động trong browser.
