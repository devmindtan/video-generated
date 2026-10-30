# Dựng lại theo diễn tiến — bản v3

Người dùng chọn giữ 180 giây và tạo clip nối tiếp mới, thay vì rút video ngắn hơn. Không tự render.

## Vấn đề bản cũ

Hai góc wide/close cùng dùng một ảnh đầu nên cùng diễn lại một hành động. Việc giãn hai clip 8 giây thành một chương 28–32 giây tạo cảm giác chậm và lặp. Crop 1.4× ở thân cây và các camera push-in có sẵn làm toàn bộ video giống mô-típ phóng gần. Hòa cảnh không sửa được nguyên nhân này.

Lời kể cũng mô tả một số hành động không thấy: trứng còn đóng trong khi bé đã nở; nhặt lá khi đã cầm ô; chạy đến mẹ trong khi đã đoàn tụ; đếm nhảy quá muộn. Không dùng lại các câu này.

## Phương án mới

- 8 chặng, giữ mốc 0/16/34/52/70/102/130/154 giây; tổng 180 giây.
- 27 nhịp hình: tái sử dụng 8 clip mở chặng, một góc trú mưa có chủ đích và 18 clip nối tiếp được chọn. Những bản bị loại không nằm trong timeline.
- Mỗi đoạn mới dùng khung cuối **phần thực sự được giữ** của đoạn trước, không dùng lại ảnh mở chặng, không lấy phần đuôi đã cắt bỏ.
- Khung tham chiếu lấy lùi tối đa khoảng hai frame để FFmpeg giải mã được frame cuối nguồn 24 fps. Không phải ảnh still render từ composition.
- Camera khóa trong hầu hết đoạn mới. Không còn scale/pan/zoom bằng CSS ở footage hoặc ảnh fallback. Một số clip mở chặng cũ có camera chuyển động sẵn; không tuyên bố có thể xóa chuyển động đó bằng CSS.
- Nguồn gần tốc độ thật (khoảng 0.93–1×), không loop, không chạy lại cảnh cũ. Cắt bớt đuôi nguồn khi không cần để không ép nhanh toàn clip.
- Các đoạn nối tiến hành động: giữ thăng bằng → bờ cỏ; bướm rời mũi → dẫn đường; đáp lá → nhìn quanh → bước đi; từng cây nấm → lên bờ; gặp ốc → chỉ hướng → cảm ơn; trú mưa → mưa dịu; đoàn tụ → cảm ơn bạn → kết ấm áp.

## Mưa: bản v5 trong chuỗi v3

Cuối clip mưa gốc làm mất chiếc lá. Chuỗi v3 sinh thêm khủng long; chuỗi v4 thêm ốc sên. Vì vậy chỉ dùng 4.2 giây đầu clip gốc còn sạch, chuyển có chủ đích sang góc trú mưa `07-rain-close` đã kiểm tra, rồi tạo hai đoạn `07-rain-continue-v5-*` từ khung cuối sạch của góc này. Không bắt các nhân vật đổi chỗ hoặc thao tác thêm ô, chỉ có phản ứng nhỏ và thời tiết dịu lại. Đây là một ngoại lệ dùng góc gần để thể hiện sự che chở, không phải phóng to mọi cảnh. Các bản lỗi vẫn lưu, không chọn để dựng.

Native audio của `06-snail-continue-v3-3` bị cách ly khỏi mix vì quét nhận dạng có kết quả đáng ngờ; không khẳng định đó là lời nói thật hay hallucination của ASR. Runtime video luôn muted, stem SFX đặt gain native của shot này bằng 0.

## Lời kể

Kịch bản mới 370 từ, giọng B giữ nguyên. Mỗi câu có `at` (giây trong chặng) để gắn nhịp hình; không tự chia đều khoảng nghỉ để lấp thời lượng. Căn lại phụ đề bằng Whisper medium + VAD, không hạ ngưỡng đối chiếu lời. Những khoảng nghỉ cuối có chủ đích cho phản ứng của nhân vật.

## Dữ liệu và lệnh

- `src/projects/tiny-dino-homecoming/cuts-v3.json`: phần clip giữ lại, thời gian xuất hiện, thời lượng, tốc độ và thứ tự.
- `scripts/projects/tiny-dino-homecoming/veo-continuity.json`: mô tả hành động mới, frame nối và ràng buộc nhận diện/camera.
- `scripts/projects/tiny-dino-homecoming/continuity-plan.json`: kế hoạch nguồn, phải khớp cuts-v3.
- `make-continuity.py` mặc định chỉ poll, `--max-new-jobs 5` mới cho phép gửi tối đa năm tác vụ. Không tự gửi lại trạng thái uncertain.
- `edit.json` → `continuityV3`: chỉ bật khi đủ clip được chọn và đã kiểm tra. Stem SFX phải tạo lại từ chính lịch cắt này.
- Backup: `public/tiny-dino-homecoming/backups/before-continuity-v3/` có nguồn, script, caption và audio bản trước.

Kiểm tra kỹ thuật chỉ xác nhận tài nguyên/timing/mức âm thanh; không thay thế nghe/xem toàn tập. Các clip AI độc lập vẫn cần duyệt tạo hình, vật thể và camera ở nhiều frame, không chỉ frame đầu.

## Trạng thái đã kích hoạt

`edit.json` đã bật v3 sau khi đủ 27 clip được chọn và stem `homecoming-continuity-sfx-v3.wav` tạo thành công. Chọn `TinyDinoHomecoming` trong Studio; không có composition mới cần đổi tên.

Kiểm tra: đủ 180 giây, 27 clip duy nhất, nguồn không bị vượt thời lượng, tốc độ 0.93–1×, không loop/zoom bằng CSS. Lời kể 370 từ, đối chiếu nhận dạng 91.67–100%; phụ đề không xuất hiện trước mốc câu đã đặt. Mix peak −1.95 dBFS, nhạc thấp hơn lời khoảng 21.45 dB; không clipping. Tám kiểm thử dựng và 14 kiểm thử Veo đạt. Đã giải mã/quét native audio toàn bộ phần nguồn được giữ; track ốc sên có kết quả ASR đáng ngờ đã bị tắt trong stem thực tế.

Có kiểm tra khung nguồn nhưng chưa xem/nghe toàn tập như người duyệt, chưa render composition, still hay MP4. Không cam kết tạo hình AI giống tuyệt đối từng pixel; các đoạn mới dựa vào frame nối và các lỗi nhân đôi lớn đã phát hiện đều bị loại khỏi lựa chọn.
