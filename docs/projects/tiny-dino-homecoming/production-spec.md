# Cuộc Phiêu Lưu Tìm Đường Về Tổ Của Tí Hon

180 giây · 1920×1080 · 30 fps · composition `TinyDinoHomecoming`.

**Hướng dựng hiện tại:** [Diễn tiến và lời kể v3](continuity-v3.md), thay mô-típ hai góc lặp lại bằng clip nối tiếp và góc gần chọn lọc. [SFX/chuyển cảnh v2](sound-and-transitions-v2.md) và các số kiểm tra bên dưới là lịch sử. Trạng thái kích hoạt thực tế nằm ở `edit.json` và các báo cáo kiểm tra trong public.

## Mục tiêu cặp Short / tập đầy đủ

Short `TinyDinoAdventure` (48 giây, 9:16) giới thiệu nở trứng, bước đi, kết bạn và trượt lá; chưa giải quyết việc về nhà. Tập dài kể trọn cùng hành trình, tự hiểu được mà không cần xem Short trước. Không mở bằng “Sau khi trượt…” như bản phần tiếp theo cũ. Kết tập dài bằng đoàn tụ và lời cảm ơn bạn bè, không dùng CTA xem tập đầy đủ lần nữa.

## Timeline

| Chặng | Thời gian | Nội dung |
| --- | --- | --- |
| Nở trứng | 00:00–00:16 | Tí Hon chào đời |
| Thân cây | 00:16–00:34 | Bước chập chững, giữ thăng bằng |
| Bướm Xanh | 00:34–00:52 | Người bạn đầu tiên |
| Trượt lá | 00:52–01:10 | Vui chơi, nhận ra bị lạc |
| Suối nấm | 01:10–01:42 | Ngập ngừng, thử từng bước |
| Ốc Sên | 01:42–02:10 | Hỏi đường và cảm ơn |
| Chiếc ô | 02:10–02:34 | Chia sẻ chỗ trú mưa |
| Tổ ấm | 02:34–03:00 | Đoàn tụ với mẹ |

## Hình ảnh và chuyển động

8 ảnh ngang; bốn cảnh mở đầu được tạo bằng imagegen tích hợp với ảnh Short làm tham chiếu. Các cảnh suối nấm, ốc sên, mưa và tổ ấm tái sử dụng ảnh ngang đã duyệt. Tạo hình xanh lá / bụng kem / mào san hô / đốm xanh ngọc / mắt hổ phách giữ xuyên suốt.

Veo tạo hai clip 8 giây cho mỗi chặng, tổng 16 góc wide/close. Nguồn 1280×720 được đặt vào composition 1920×1080; không gọi đây là footage 1080p gốc. Clip phát chậm theo độ dài từng nửa chặng, không loop hoặc nối đuôi ảnh đứng. Chặng suối nấm có tốc độ 0.5×; cần nghe/xem duyệt nhịp trước khi xuất. Cắt giữa hai clip độc lập có thể có khác biệt nhẹ về pose; kiểm tra trong Studio.

`footage.json` chỉ chứa đường dẫn sau khi clip đã được tải, kiểm tra tỷ lệ 16:9 và thời lượng. Giá trị null là fallback storyboard trong khi chờ Google, không được xem là true motion đã hoàn thành. Nhật ký tác vụ ở `.cache/veo/tiny-dino-homecoming/jobs.json` để không gọi trùng. Không tự retry lỗi kết nối không xác định; lỗi quá tải chỉ retry khi đã xác nhận tác vụ thất bại.

## Giọng kể và âm thanh

Mặc định: giọng B đã chọn — Trúc Ly nâng +2.5 semitone, bù tempo, giữ số mẫu / thời lượng bản gốc. WAV gốc ở `audio/`, B ở `audio/childlike/`; bản tập cũ được giữ trong `backups/sequel-v1/`. Giọng hoạt hình cách điệu, không phải bản thu trẻ em thật.

Thu từng câu, dành khoảng nghỉ cho hành động. Phụ đề JSON/SRT căn theo bản thu thực tế, kiểm tra bằng faster-whisper medium và đối chiếu đủ câu chữ. Không tự hạ ngưỡng kiểm tra để bỏ qua lời đọc sai.

Kịch bản hiện có 378 đơn vị tách theo khoảng trắng. Kiểm tra lời kể từng chặng đạt 89.47–100% exact word match sau chuẩn hóa dấu/punctuation; đây là kiểm tra hỗ trợ, không thay thế nghe duyệt.

Nhạc gốc: mallet vui tươi 0–130s, piano dịu 130–154s, dây ấm và hợp âm kết 154–180s. Nhạc giảm dưới lời. SFX lấy từ chính clip Veo, retime bằng atempo theo từng shot, fade ở điểm cắt và duck khi kể. Bản SFX tổng hợp cũ chỉ được giữ làm tham khảo, không dùng trong Video.tsx.

## Kiểm tra và xem thử

- `npm run typecheck`, `npm run test:veo`.
- `npm run veo:plan:tiny-dino-homecoming`: kiểm tra cấu hình, không tạo clip.
- `npm run veo:poll:tiny-dino-homecoming -- --skip-unresolved`: chỉ lấy kết quả đã gửi.
- `npm run voice:tiny-dino-homecoming`: tạo bản gốc, kiểm tra phụ đề, sau đó tạo B.
- `npm run audio:tiny-dino-homecoming`: nhạc và stem SFX theo timeline mới; cần đủ clip.
- `npm run check:tiny-dino-homecoming`: kiểm tra 8 chặng, 16 clip, phụ đề, thời lượng giọng B và peak mix.
- `HF_HUB_OFFLINE=1 .venv/bin/python scripts/projects/tiny-dino-homecoming/check-footage.py --speech`: giải mã các clip nguồn, kiểm tra frame có thay đổi và quét lời nói ngoài ý muốn; không render composition.
- `npm run dev` → chọn `TinyDinoHomecoming`.

Không tự render MP4 / ảnh still / thumbnail theo lựa chọn của người dùng. Thumbnail đã cập nhật mã nguồn và xem qua composition `TinyDinoHomecomingThumbnail`; người dùng tự xuất khi cần.

Tài nguyên public/out/cache hiện gitignore, cần sao lưu riêng khi chuyển máy. Các file kiểm tra trong `public/tiny-dino-homecoming/audio/` ghi kết quả thực tế, không thay cho nghe và xem duyệt toàn tập trong Studio.

## Kết quả kiểm tra bản cập nhật

Đủ 16 clip nguồn 1280×720, mỗi clip 8 giây; giải mã mẫu tại 1/4/7 giây cho thấy frame thay đổi. Quét Whisper/VAD không nhận được lời nói trong cả 16 track native. Đây là kiểm tra tự động, không phải đảm bảo tuyệt đối nội dung âm thanh/hình ảnh.

Bản mix 180 giây có peak −1.73 dBFS, không clipping; nhạc thấp hơn lời khoảng 21.17 dB khi có tiếng nói. Toàn bộ caption khớp câu chữ trong story, timestamp nằm trong từng chặng. Giọng B giữ đúng số mẫu của từng WAV gốc. TypeScript và 14 kiểm thử pipeline Veo đạt. Chưa render composition, thumbnail hay MP4.
