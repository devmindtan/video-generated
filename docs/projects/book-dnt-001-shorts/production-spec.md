# Thông tin đã chốt · Short “Đổi nhưng thành và”

## Định dạng

- Một Composition dọc 1080×1920, 30 fps và một Still bìa đặt cạnh video trong Studio.
- Thời lượng mục tiêu 45 giây; chấp nhận 40–50 giây theo take clone cuối, tuyệt đối không quá 60 giây.
- Không render/export tự động; người dùng xem và tự xuất trong Studio.

## Bố cục và chữ

- Nền than `#0b0b0c`, ngà `#f3efe3`, vàng ấm `#d6aa55`; Stoic Sans (Noto Sans) 700.
- Hook hiện **trọn câu, sáng hẳn từ frame đầu**, khoảng 76–84 px, tối đa ba dòng; hình chiếc cầu câu chữ chiếm nửa
  dưới để không có khoảng trống vô nghĩa trong ba giây đầu.
- Vùng hình chính x ≈ 80–900, y ≈ 430–1290. Chừa mép phải 150 px và đáy 380 px cho giao diện YouTube Shorts.
- Phụ đề x ≈ 80–900, y ≈ 1340–1560; tối đa hai dòng, khoảng 58 px, ngà với từ khóa vàng. Sau khi chọn giọng cuối,
  từng từ sáng theo voice; hook là ngoại lệ, luôn sáng toàn câu ngay từ frame đầu.
- Không đặt tên sách/tác giả dưới câu trích. Nhãn series nhỏ ở đầu và thẻ CTA cuối mới ghi “Đắc nhân tâm”.

## Motion

- Entrance mềm 8–12 frame; interaction có nghĩa; exit nối hướng chuyển động sang cảnh sau. Không shake tần số cao.
- Beat 1: câu hook giữ yên đủ đọc; đường vàng xuất hiện như một cầu nối hai vế.
- Beat 2: từ **NHƯNG** rơi vào điểm nối, đường bị tách đôi; vế khen mờ đi để diễn tả sự nghi ngờ.
- Beat 3: ví dụ cũ hiện như hai mảnh giấy; không lặp card cho từng câu.
- Beat 4: **VÀ** thay **NHƯNG**, đường nối liền lại; “MÔN TOÁN CŨNG SẼ KHÁ LÊN” được mask reveal theo hướng đi
  của đường vàng. Chỉ từ khóa có spring nhẹ, không elastic quá mức.
- Beat 5: match cut đường nối thành gạch chân “XEM TRỌN TẬP”; CTA giữ ít nhất 1,2 giây sau từ cuối.
- Các lớp text, đường nối, ví dụ cũ/mới và CTA là node/layer Remotion riêng, chỉnh được trong Studio; không flatten.

## Âm thanh

- Giọng clone người dùng +2 bán cung. Không kéo chậm; chỉ đặt khoảng nghỉ tự nhiên khoảng 0,35–0,55 giây sau hook
  và 0,7–0,9 giây trước CTA.
- Nhạc Moavii — Butterflies: tốc độ 0,85; 4% khi có lời, 8% lúc nghỉ; fade theo cạnh clip và giữ Start/Duration/End
  chỉnh độc lập trong Studio.
- Sound design tối giản: một `Wood_Tap` hoặc `Classic_Click` đơn ở lúc “NHƯNG” cắt đường; một `Soft_Blow` ngắn khi
  “VÀ” nối lại. Chỉ dùng sau khi nghe đúng variation và xác minh nguồn; nếu không có hit phù hợp thì để im lặng.
- Voice, music, SFX là các track tách biệt. Không dùng trailer boom/whoosh nặng và không gắn click cho từng từ.

## QC bắt buộc trước khi gửi bản dựng

- `visual-sync` tại frame đầu, giữa/sau từng beat; chữ không tràn, không chạm UI-safe area, không nét/chữ đè nhau.
- Xem real-time entrance/interaction/exit; still không được dùng để kết luận motion đạt.
- Nghe giọng thô và mix: dấu tiếng Việt, “nhưng / và / khá lên”, khoảng nghỉ, tail; số đo không thay nghe thật.
- Probe/decode bản xuất chỉ khi người dùng tự render; chưa có bản xuất thì đánh dấu NOT_TESTED, không báo hoàn thành.
