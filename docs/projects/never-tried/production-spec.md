# Chưa thua, hay chưa thử?

Composition `StoicNeverTried` — 48 giây, 30 fps, 1080×1920. Still `NeverTriedThumbnail` đã đăng ký, chưa xuất ảnh.

## Nội dung đã biên tập

Lời đọc hiện tại là bản sửa đã được người dùng duyệt: chưa thua có thể chỉ vì chưa thử → chờ chuẩn bị kỹ/tự tin có thể thành né tránh → thực tế giúp xác định chỗ cần sửa → thời gian trôi mà kế hoạch vẫn đó → làm một phần nhỏ đến nơi đến chốn hôm nay. Bỏ danh sách hồ sơ/khách hàng/sản phẩm dàn trải và các cụm gượng “lùi ngày biết”, “bản thử nhỏ nhất”. Giữ một mạch xưng hô và thời gian rõ ràng.

Bỏ “cái chết êm đềm”, “gặm nhấm đến hết đời”, “hèn nhát”, “ngã sấp mặt”, “thà gãy cánh”. Không coi mọi khoảng nghỉ/lựa chọn không tham gia là suy thoái. Không khẳng định thất bại tự động tạo bài học hay chắc chắn dẫn đến thành công: phải xem lại kết quả và sửa. Không dùng ẩn dụ tàu/thân gỗ lệch với hình mỏ neo; mỏ neo rỉ chỉ là hình ảnh liên tưởng cho trì hoãn.

Hành động cụ thể là hoàn thành một phần nhỏ hôm nay, không đòi đánh cược tất cả. Câu chốt: “Đừng giữ thành tích ‘chưa từng thua’ bằng cách mãi không bắt đầu.” [Lời thoại đầy đủ](script.md). Bản thu/script/caption trước khi sửa được giữ tại `public/never-tried/backups/narration-v1/`; không sửa nhạc, ảnh hay thumbnail trong lần cập nhật lời thoại này. Chỉ đồng bộ keyword highlight và hai headline cuối để không còn chữ “bản thử”/mốc “một năm” lệch với lời mới.

## Hình và chữ

Năm cảnh 0–8, 8–18, 18–28, 28–38, 38–48 giây. Kiếm sau kính → mỏ neo rỉ → khiên có dấu va chạm → ghế trống → vận động viên xuất phát. Framing ổn định, không zoom theo thói quen; glow lò rèn rất nhẹ ở cảnh khiên lấy từ Remotion frame. Ảnh trước giữ thêm 0,2 giây để cảnh mới chồng mờ 0,16 giây. Không giả có time-lapse rỉ sét hay vận động viên chạy thật trên still. [Prompt và asset](image-prompts.md).

Theo mẫu đã duyệt: **Stoic Sans/Noto Sans Bold 700** cho caption, headline và toàn bộ chữ thumbnail; trắng ngà với từ khóa/headline nhấn vàng. Không weight 500/750/800 chưa nạp. Caption 44px, headline 88px, lề an toàn trái 84–88px/phải 120–128px. Highlight giữ nguyên text, dấu và timing. Chữ vàng thumbnail “HAY CHƯA THỬ?” dùng 104px để vừa vùng chữ; không giảm tương phản hoặc bỏ chữ để nhét dòng.

## Giọng và nhạc

Hải Đăng cục bộ, tốc độ giọng **1×**, câu đanh và phát âm tự nhiên. Mỗi đoạn có khoảng nghỉ ngắn, không kéo giọng hay giãn im lặng đều để lấp 48 giây. Căn phụ đề bằng faster-whisper medium, Caption JSON và SRT giữ chính tả tác giả.

Giữ **snowfall — Øneheart & reidenshi**, không theo gợi ý Darksynth/Phonk. Nguồn đầy đủ `public/own-timeline/audio/snowfall.mp3`, dùng read-only, source trim mặc định 24,9 giây. Nhạc 0,85× như edit gần nhất của tập trước; không gọi là một bản remix chính thức. Mức nền mặc định 0,18 khi đọc và 0,26 khi nghỉ để giữ độ rõ của lời; người dùng chỉnh trong `music.json`.

Timing, source trim và tốc độ vẫn nằm trên native Audio trong Edit, không bake nhạc thành file đúng 48 giây. Giữ caption ducking, fade-in 1,2 giây và fade-out 2 giây bám mép clip/composition hiện tại. Không SFX. Credit nghệ sĩ lưu trong music.json; khi đưa mô tả phải ghi đủ tên bài và nghệ sĩ, kiểm tra lại tốc độ/phiên bản nếu người dùng đã sửa Edit.

Nguồn credit: [Bandcamp của Øneheart](https://oneheartisok.bandcamp.com/track/snowfall), xác minh tên hai nghệ sĩ từ lần tra cứu trước trong cuộc hội thoại. Có file nhạc/ghi credit không đồng nghĩa có chứng từ quyền đăng; không tuyên bố nhạc miễn phí bản quyền.

## Kiểm tra và bàn giao

```sh
npm run check:never-tried
npm run typecheck
npm run test:music-edit
node scripts/projects/discipline-purpose/test-music-fade.mjs
npm run dev
```

Check project chạy guard font/caption/thumbnail, kiểm tra nguồn ảnh, word-match, tốc độ giọng 1× và giải mã mix trong RAM. Timing/gain thực tế của nhạc **và cả năm đoạn giọng** được đọc từ native Audio JSX, không bỏ qua volume người dùng chỉnh. Nếu di chuyển/trim/retime giọng khiến lệch picture beat/phụ đề, QA báo cần căn lại thay vì giả định timeline cũ. [Báo cáo](qa.json).

Nghe/xem `StoicNeverTried` trong Studio trước khi tự xuất. Kiểm tra số đo không thay thế duyệt cảm nhận. Không xuất MP4, preview still hoặc thumbnail tự động. Không gọi Gemini app/API, Veo hay Vertex. Các project và edit cũ không đổi.
