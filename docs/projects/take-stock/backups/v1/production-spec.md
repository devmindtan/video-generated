# Đừng chỉ nhìn phần còn thiếu

`StoicTakeStock`: 48 giây, 30 fps, 1080×1920. Cover `TakeStockThumbnail` đã đăng ký dưới dạng component, chưa xuất ảnh.

## Biên tập

Mạch: đôi giày dùng được bỗng bị chê sau một lần so sánh → chỉ nhìn phần thiếu khiến bỏ qua điều quen thuộc → kiểm lại kỹ năng/công cụ/sự giúp đỡ → biết ơn không có nghĩa phải hài lòng với mọi thứ → dùng nguồn lực hiện có vào việc trước mắt. [Script](script.md).

Không trình bày đây là một chẩn đoán “nghiện so sánh”. Bỏ khẳng định thiếu thốn vật chất không gây đau khổ, “điểm mù chết người”, “ngừng đóng vai nạn nhân” và việc lấy người khuyết tật làm đối chiếu để trách người xem. Thừa nhận rõ: những gì đang có không xóa hết khó khăn. Có thể mong muốn công việc/cuộc sống tốt hơn mà không xem điều mình đang có là vô giá trị.

Hai thay đổi hình đã thông báo khi triển khai: thay người dùng nạng bằng bàn tay sắp công cụ, thay bàn chân trần trên đá sắc bằng giày cũ trên nền đất vững. Không dùng điều kiện cơ thể làm thước đo giá trị hoặc quyền hành động.

## Hình và typography

Năm cảnh: giày cũ còn nguyên đế (0–8), lồng mở và chim bình thản (8–18), công cụ trên bàn (18–28), giày đặt vững trên đất (28–38), cột đá (38–48). Năm ảnh mới [lưu tại đây](image-prompts.md). Không diễn giải chim trong ảnh là đang sợ hãi hoặc từ chối tự do; lồng chỉ là liên tưởng về sự chú ý bị giới hạn.

Framing ổn định, chồng mờ đầu cảnh 0,16 giây và giữ ảnh trước thêm 0,2 giây. Lớp ánh sáng rất nhẹ theo frame ở cảnh công cụ, không zoom đều, không giả ảnh đang chuyển động như video AI. Không render preview still để duyệt.

Caption 44px, headline 88px, thumbnail headline 116/108px và dòng phụ 44px. Tất cả chữ chính dùng local **Stoic Sans/Noto Sans Bold 700**, trắng ngà và nhấn vàng. Chỉ dùng weights 400/700 đã nạp. Caption highlight giữ nguyên chữ/dấu/khoảng trắng/timing; guard kiểm tra cả caption lẫn thumbnail. Đã kiểm tra độ rộng chữ bằng font metrics, không xuất ảnh.

## Âm thanh

Hải Đăng local VieNeu, tốc độ gốc 1×, giọng trầm và dứt khoát nhưng không công kích. Căn Caption JSON/SRT bằng faster-whisper medium cục bộ. Không kéo chậm giọng để lấp cảnh.

Giữ **snowfall — Øneheart & reidenshi**, nguồn đầy đủ `public/own-timeline/audio/snowfall.mp3`, playback 0,85× như các tập gần nhất. Credit nguồn nghệ sĩ: [Bandcamp](https://oneheartisok.bandcamp.com/track/snowfall). Không tự gán tên một bản remix chính thức, không coi credit là chứng từ quyền sử dụng.

Native Audio giữ source trim 24,9 giây, start 0 và duration nguồn 48 giây mặc định. Tất cả timing/source trim/speed còn chỉnh được trong Edit. `speechVolume`/`pauseVolume` trong music.json mặc định 0,18/0,26, duck theo caption. Fade-in 1,2 giây/fade-out 2 giây theo mép clip/composition hiện tại bằng shared MusicFade. Không dùng nhạc bị bake thành đoạn 48 giây, không SFX.

## Kiểm tra và bàn giao

```sh
npm run check:take-stock
npm run typecheck
npm run test:music-edit
node scripts/projects/discipline-purpose/test-music-fade.mjs
npm run dev
```

QA kiểm tra font, chữ phụ đề, ảnh, WAV/metadata giọng 1×. Mix tính trong RAM với timing/gain thật của năm đoạn giọng và nhạc đọc từ native Audio JSX. Nếu retime/di chuyển giọng lệch hình/phụ đề, checker báo cần căn lại. [Báo cáo](qa.json). Không xuất WAV mix/MP4/ảnh để kiểm tra, không tự render thumbnail; cần người dùng nghe/xem duyệt trong Studio.

Lệnh tạo lại giọng/phụ đề: `npm run voice:take-stock`. Không Gemini app/API, Veo hay Vertex; không sửa edit của các tập cũ.
