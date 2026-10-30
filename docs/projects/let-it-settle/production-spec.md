# Bạn không cần phải sửa chữa mọi thứ ngay lập tức

`StoicLetItSettle` · 48 giây · 1080×1920 · 30 fps. Project độc lập `let-it-settle`, không thay đổi video `past-self` hoặc các video trẻ em.

## Nội dung

Bản thử thoại v2: lời độc thoại một giờ sáng, từ chuyện đọc lại tin nhắn đến ghi việc cần làm ra giấy. Cảnh 3 dùng “Bạn đọc lại tin nhắn lần thứ mười…” thay ví dụ khuấy nước. Không còn lời giải thích “khuấy mãi cặn không lắng” hoặc lời trấn an “bạn được phép nghỉ”. Chỉ hoãn chuyện **chưa gấp**, không hứa rằng sáng mai vấn đề tự hết. Câu kết “Đặt xuống thôi. Ngủ đã.”; CTA chỉ bằng chữ. Chữ tiêu đề từng cảnh cập nhật cùng lời đọc.

Ảnh hũ nước giữ nguyên làm nền không khí cho lần nghe thử; không phải minh họa trực tiếp động tác đọc điện thoại/ghi giấy. Chưa tạo thêm ảnh hoặc gọi API. Bản thoại/audio/caption/video trước thay đổi nằm ở `public/let-it-settle/backups/script-v1/`.

## Hình ảnh

Workflow triết lý: ảnh tĩnh mới tạo bằng imagegen tích hợp, không Gemini/Veo, không dùng footage có phí. Ảnh đầu làm reference cho ba trạng thái tiếp theo để giữ hũ thủy tinh, bàn, cửa sổ và góc máy nhất quán. Ảnh cuối chuyển sang cửa sổ phòng ngủ. Mốc cảnh 0/8/18/28/40, thời lượng 8/10/10/12/8 giây.

Không zoom/pan. Ảnh crossfade 0,45 giây, giữ ảnh cũ bên dưới để không chèn đen giữa cảnh. Cảnh 3 hòa dần ảnh nước trong trên ảnh nước đang lắng. Hạt bụi trang trí được tính bằng frame, không phải mô phỏng nước vật lý hoặc video AI chuyển động thật. Cảnh 4 và 5 chủ ý yên tĩnh. Giữ chữ ngà/vàng đồng, headline 86px, caption 44px, chủ thể ở nửa trên. Thumbnail `LetItSettleThumbnail`: hũ nước, chữ “ĐỪNG CỐ GỠ / NGAY ĐÊM NAY”; chỉ đăng ký trong Studio, chưa xuất ảnh.

## Âm thanh

Hải Đăng như Stoic Control, tổng hợp CPU cục bộ ở tốc độ gốc 1×. Không kéo chậm giọng để lấp thời lượng. Phụ đề JSON/SRT căn theo từng bản thu bằng faster-whisper medium, giữ chính tả của lời viết. Kiểm tra bằng nhận dạng không thay thế việc người dùng nghe duyệt ngữ điệu.

Snowfall – Øneheart & reidenshi, asset có sẵn `own-timeline/audio/snowfall.mp3`. Bắt đầu từ nguồn 24,9 giây, nhạc 0,8× theo phong cách người dùng chỉnh ở tập trước; chỉ nhạc chậm, không ảnh hưởng giọng 1×. Nhạc duck khi có lời và fade ở hai đầu. Không thêm whoosh, tiếng khuấy hoặc tiếng bọt quá rõ phá không khí nhẹ nhàng. File nhạc local không chứng minh quyền đăng/kiếm tiền; cần kiểm tra giấy phép hoặc dùng nhạc được cấp phép trước khi xuất bản.

## Xem và kiểm tra

- `npm run voice:let-it-settle`: tạo lời đọc/phụ đề offline.
- `npm run check:let-it-settle`: kiểm tra ảnh, thời lượng, phụ đề, tempo và mix theo đúng nhạc 0,8×; chỉ ghi JSON, không xuất video/ảnh/audio review.
- `npm run typecheck`: kiểm tra TypeScript.
- Studio: `http://localhost:3000/StoicLetItSettle`.

Không tự render MP4, preview still hoặc thumbnail. Chưa thực hiện duyệt nghe/kiểm tra browser trực quan tự động; người dùng xem và nghe trong Studio trước khi render.
