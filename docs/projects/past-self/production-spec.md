# Học cách tha thứ cho chính mình trong quá khứ

Composition `StoicPastSelf` · 50 giây · 1080×1920 · 30 fps. Cover riêng `PastSelfThumbnail`; chỉ đăng ký trong Studio, chưa xuất ảnh.

## Nội dung và hình ảnh

Lần bổ sung thoại: thêm “Chính những lần vấp ngã đã dạy bạn điều đó.” cuối cảnh 2 và “Bắt đầu bằng một việc nhỏ mà bạn vẫn còn làm được.” cuối cảnh 4 để giảm khoảng trống, vẫn giữ tốc độ giọng 1×, mốc 0/8/18/28/40 và tổng 50 giây. Bản 1× trước bổ sung được backup tại `public/past-self/backups/native-voice-v2/`. Mức nhạc người dùng chỉnh trực tiếp 0,25 khi nói / 0,30 khi nghỉ được giữ nguyên; checker vẫn cảnh báo nếu vượt mục tiêu cân bằng giọng, không tự hạ âm lượng.

Giữ nguyên lời thoại đã được duyệt; tha thứ không xóa trách nhiệm. Thứ tự 0/8/18/28/40 giây: mặt nạ nứt → cánh hoa trong băng → đèn đá → thả tro → hồ bình yên. Ảnh tĩnh mới tạo bằng imagegen tích hợp, không dùng Gemini hoặc Veo. Project độc lập `past-self`, không ghi đè video `forgiveness` cũ.

Đúng workflow triết lý: bố cục ảnh ổn định, không zoom toàn cảnh liên tục; gợn nước, ánh sáng và hạt tro là overlay trang trí tính từ frame. Không mô tả đây là footage chuyển động thật hoặc mô phỏng tan băng vật lý. Crossfade ảnh 0,45 giây, ảnh cũ giữ đến khi ảnh mới hiện đủ, không chèn đen giữa cảnh. Mốc thoại/phụ đề không bị dời theo overlap.

Chữ màu ngà/vàng đồng, nhận diện Stoic, chủ thể ở nửa trên. Caption 44px ở vùng thấp nhưng cách mép dưới trên 200px; headline 86px ở vùng tối. Thumbnail lấy mặt nạ nứt làm nhận diện, chữ “ĐỪNG MÃI TRÁCH MÌNH”.

## Âm thanh

- Hải Đăng, cùng giọng của Stoic Control; VieNeu CPU cục bộ, không API trả phí. Theo yêu cầu nghe lại: giữ tốc độ giọng gốc 1× ở cả năm cảnh, không kéo chậm để lấp thời lượng. Giữ mốc cảnh và tổng 50 giây nên khoảng nghỉ sau lời đọc dài hơn; không dàn đều hoặc kéo giãn tiếng nói.
- faster-whisper medium cục bộ kiểm tra lời đọc, giữ chính tả tác giả trong caption JSON và SRT.
- Theo yêu cầu mới: dùng Snowfall – Øneheart và reidenshi, asset sẵn có `own-timeline/audio/snowfall.mp3`, lấy liên tục từ 24,9–74,9 giây ở tốc độ nhạc gốc 1×; duck theo lời đọc. Đây là nhạc thương mại, việc có file local không xác nhận quyền sử dụng/kiếm tiền trên YouTube; người dùng cần kiểm tra quyền hoặc thư viện nhạc được phép trước khi đăng.
- Không thêm tiếng whoosh hoặc tiếng động mạnh phá khoảng lắng. Câu nhận lỗi đọc nhẹ, CTA hạ giọng. Bản giọng tự nhiên để khoảng 3 giây cuối cho nhạc.
- Bản giọng chậm, caption, story và cấu hình nhạc trước sửa đã giữ ở `public/past-self/backups/slow-voice-v1/`.

## Kiểm tra / bàn giao

`npm run voice:past-self` tạo lời đọc và phụ đề. `npm run check:past-self` kiểm tra ảnh/thoại/caption/biên độ mix offline, ghi báo cáo JSON, không export. `npm run typecheck` kiểm tra TS.

Xem `http://localhost:3000/StoicPastSelf`. Chưa nghe duyệt cảm xúc giọng đọc hay kiểm tra trực quan bản dựng trong browser bằng công cụ tự động; người dùng nghe/xem trong Studio. Không tự render MP4, preview still hoặc thumbnail.
