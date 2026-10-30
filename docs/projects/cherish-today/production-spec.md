# Khi vẫn còn có nhau — bản 45 giây

## Bản đang dùng

Composition `StoicCherishToday`, dọc 1080×1920, 30 fps, **45 giây / 1350 frame**. Người dùng yêu cầu rút gọn nội dung, không tăng tốc giọng. Bản 60 giây được lưu ở `public/cherish-today/backups/edit-60s-v2/` gồm Video.tsx, script, config, metadata, caption/SRT và QA; các WAV cũ cũng được giữ nguyên.

Lời đọc còn 163 từ, từ 217 từ ban đầu. Bỏ ba câu lặp ý: câu kể nghe giọng/hỏi han, câu giải thích những điều diễn ra hằng ngày và câu về lời hứa thật lớn. Giữ mạch: ngày bình thường → hẹn để sau → người thương cũng cần mình → quan tâm bằng việc nhỏ → không coi sự hiện diện là hiển nhiên → yêu thương trước “giá như”. Toàn văn ở `script.md`; config hiện tại ở `scripts/projects/cherish-today/audition.json`.

## Giọng và bảo toàn bản cũ

Quốc Tuấn, legacy24 / 24 kHz PCM16, **1×**. Không tổng hợp giọng mới, không atempo hoặc resample. Ghép nguyên PCM của tám câu giữ lại từ nguồn v2; chỉ thay khoảng lặng giữa các câu. Chất giọng/phát âm các câu giữ lại không đổi.

Nguồn mới `public/cherish-today/audio/narration-quoc-tuan-v3-short-source.wav` dài 41,1391 giây; thêm 3,8609 giây khoảng lặng thành `narration-quoc-tuan-v3-45s.wav`. Copy map nguồn tại `audio/assembly-v3-45s.json`; hash và copySpans của bản thêm khoảng nghỉ ở `scripts/projects/cherish-today/voice.json`. `shorten-to-45.py` có chặn ghi đè bản backup/take.

Tám câu lấy theo index 0-based [0,3,4,6,7,8,9,10] của bản 60 giây. Câu có nghi vấn ASR “hỏi han/hỏi hăn” đã bỏ khỏi nội dung, không còn trong video hiện tại. Raw transcript của nguồn v2 vẫn chứa các câu đã bỏ nên không gán điểm match cũ thành điểm ASR mới: `wordMatchRatio=null`, điểm cũ được lưu riêng `priorSourceWordMatchRatio`. Không chạy lại TTS/ASR không cần thiết khi PCM các câu được giữ nguyên. Đối chiếu nguyên liệu và lịch sử phát âm ở backup production-spec và các audition cũ; `tail-recognition-review.json` ghi kiểm tra câu cuối nguồn v2.

Kiểm tra PCM không xác nhận chất lượng nghe/cảm xúc đã được người dùng duyệt.

## Hình, chữ và timing

Giữ nguyên sáu ảnh đã tạo bằng imagegen tích hợp và kiểm tra trực quan; ảnh gốc trong `public/cherish-today/images/`, prompt ở `image-prompts.md`. Không người/mặt người. Không tạo lại ảnh hoặc thumbnail.

Các cảnh bắt đầu ở frame 0 / 171 / 363 / 601 / 790 / 1099; độ dài 177 / 198 / 244 / 195 / 315 / 251 frame. Crossfade 6 frame trong khoảng nghỉ, không zoom. Caption còn 23 trang, giữ nguyên text và timing tương đối của từng câu được giữ lại, căn sang vị trí mới.

Stoic Sans local/Noto Sans Bold 700: caption cỡ 44 màu ngà, nhấn vàng `#dcb777`; headline cỡ 88. Thumbnail `CherishTodayThumbnail` giữ hình ấm trà và copy “CÒN BÊN NHAU… / ĐỪNG ĐỢI / ‘GIÁ NHƯ’”, safe margins và Bold 700. Không export thumbnail.

## Nhạc và Studio Edit

**Night — Ludovico Einaudi**, nguồn MP3 đầy đủ; speechVolume 0,18, pauseVolume 0,25, ducking theo caption mới. Giữ nguyên source trim 53,954 giây, playbackRate 0,79 và native Audio duration nguồn 60 giây đã đặt; không khóa hoặc xóa chỉnh sửa timing. Composition kết thúc ở 45 giây nên phần nghe thực tế bị giới hạn ở đó. `MusicFade` tự bám mép composition mới, fade-in 1,2 giây, fade-out 2 giây, kết thúc ở giây 45. Không cắt nhạc thành file ngắn. Không SFX.

## Kiểm tra

`npm run check:cherish-today` và `npm run typecheck` đã qua: đúng 45 giây, caption khớp script rút gọn, chữ đúng font/không tràn, cảnh phủ đủ thời lượng và khớp câu, PCM câu giữ lại giống nguồn, các khoảng nối là silence, fade đầu/cuối và mix theo native timing Edit. Peak −1,98 dBFS, nhạc thấp hơn giọng khoảng 18,57 dB trong vùng có lời, tính trong RAM. Không thay thế việc nghe duyệt.

Không render MP4, preview frame, thumbnail hoặc mix audio. Không gọi API tạo hình/video/TTS trong lần rút gọn này.

Studio: http://localhost:3000/StoicCherishToday
Thumbnail: http://localhost:3000/CherishTodayThumbnail
