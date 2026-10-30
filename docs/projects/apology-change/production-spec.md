# Xin lỗi và thay đổi — ghi chú dựng

## Nội dung

Người dùng duyệt toàn bộ kịch bản ở `script.md`. Dựng 45 giây, 1080×1920, 30 fps, Quốc Tuấn native 1×. 156 từ, sáu chặng: tin lời xin lỗi → cùng tổn thương lặp lại → thất vọng vì tiếp tục tin → không còn muốn tranh luận → hành động phải khác → cho người kia thấy thay đổi. Không khẳng định chắc chắn người im lặng nghĩ gì; giữ “Có thể vì” như bản duyệt. Không coi thay đổi là cách bảo đảm người khác phải ở lại.

## Hình và nhận diện

Sáu ảnh do công cụ imagegen tích hợp tạo, bản gốc ở `public/apology-change/images/`; prompt đầy đủ `image-prompts.md`. Từng ảnh đã xem: phong bì, chân ghế buộc vá, dây sờn, cửa đóng, sửa mối nối, ghế chắc chắn. Đây là các minh họa khái niệm và motif sửa chữa, không phải footage thao tác sửa một chiếc ghế cụ thể. Không người, mặt người hoặc phản chiếu người. Giữ khung đứng yên và crossfade 6 frame trong khoảng nghỉ; không zoom lặp.

Caption Stoic Sans local/Noto Sans Bold 700, cỡ 44, màu ngà với nhấn vàng `#dcb777`; headline 88. Thumbnail `ApologyChangeThumbnail` dùng một ảnh hero chân ghế buộc vá, copy “XIN LỖI… / RỒI LẠI / NHƯ CŨ?” cỡ 112/100/144, safe margins, ngà-vàng cùng Bold 700. Chuẩn bị component, không export/render thumbnail.

## Giọng và kiểm tra phát âm

VieNeu v3 Turbo local, legacy24 / 24 kHz PCM16, tốc độ 1×. Bản gốc `public/voice-auditions/apology-change-quoc-tuan-v1/` dài 39,069 giây được giữ nguyên. Raw ASR bản đầu nhận “Muốn giữ một người” thành “Muốn giúp một người”. Tạo một take local riêng cho đúng câu đó, temperature 0,55; audition `apology-change-pronunciation-fix-v1/`. Raw ngắn nhận “Nguồn giữ”, cần đối chiếu lại trên bản ghép đầy đủ, không kết luận chỉ từ một điểm match.

`assemble-voice.py` chỉ chọn lại câu index 8, các câu và PCM khoảng nghỉ khác giữ nguyên từ take gốc. Nguồn ghép v2 cùng take sửa 0,55 được giữ nguyên vì raw toàn bản vẫn nhận “Nguồn giữ”. Đối chiếu thêm đúng câu này tại `apology-change-pronunciation-fix-v2/` (0,45): raw ngắn nhận đúng “Muốn giữ một người”. Bản đang ghép lấy câu đối chiếu này, lưu copyMap và raw ASR ở `public/voice-auditions/apology-change-assembled-v3/`. `prepare-audio.py` chèn khoảng lặng giữa các câu để thành đúng 45 giây, chặn nguồn quá dài thay vì tăng tốc; metadata và copySpans tại `scripts/projects/apology-change/voice.json`. Không dùng style prose như model control. Không voice cloning/TTS từ xa.

Không coi word-match bỏ dấu là kiểm tra dấu thanh hay xác nhận chất lượng giọng. Phát âm/cảm xúc chờ người dùng nghe trong Studio, kể cả khi ASR nhận đúng toàn văn.

## Nhạc và chỉnh sửa

Night — Ludovico Einaudi, file MP3 đầy đủ có sẵn. speechVolume 0,18, pauseVolume 0,25, ducking theo caption. Native Audio source trim 53,954 giây, duration nguồn 45 giây, playbackRate 0,79, timing nằm trên JSX để Edit tự do. Fade-in 1,2 giây / fade-out 2 giây qua MusicFade bám mép nghe thực tế và composition khi move/trim. Không SFX.

## Kiểm tra và giới hạn

`npm run check:apology-change`: đúng 45 giây, caption khớp toàn văn, timing/cảnh/overlap, ảnh, font 700 và bố cục caption/thumbnail, provenance PCM và silence, mix trong RAM theo timing và gain Edit hiện tại. `npm run typecheck`: TypeScript. Mix peak/RMS chỉ là kiểm tra kỹ thuật, không duyệt cảm nhận.

Không render MP4, thumbnail, preview frame hoặc audio mix. Không gọi Gemini, Vertex, Veo hoặc TTS trả phí. Preview: http://localhost:3000/StoicApologyChange ; thumbnail: http://localhost:3000/ApologyChangeThumbnail.

## Kết quả bản đang dùng

Active `public/apology-change/audio/narration-quoc-tuan-v2-pauses.wav`, đúng 45 giây. Nguồn ghép 39,0597 giây; thêm 5,9403 giây silence, giữ nguyên PCM nguồn. CopyMap của nguồn ghép v3 và copySpans bản chèn pause đã được kiểm tra theo hash và mẫu PCM; chỉ câu index 8 lấy từ take sửa v2 (0,45), các câu và khoảng nghỉ nguồn khác từ bản đầu. Giữ tất cả audition và nguồn ghép v2 để đối chiếu.

Raw transcript toàn bản ghép v3 đã đọc đối chiếu: nhận đúng toàn bộ từ, gồm “Muốn giữ một người”, không còn “giúp/Nguồn”. Match 100% không phải xác nhận dấu thanh hay duyệt nghe; vẫn chờ người dùng nghe phát âm/cảm xúc.

24 trang caption. Scene starts 0 / 199 / 363 / 610 / 850 / 1123 frame; lengths 205 / 170 / 253 / 246 / 279 / 227. Chuyển ảnh trong khoảng nghỉ, overlap 6 frame, scene cuối kết thúc đúng frame 1350.

`check:apology-change` và TypeScript qua; bộ kiểm tra fade move/trim/short/empty qua. Peak mix −2,07 dBFS, nhạc thấp hơn giọng khoảng 18,91 dB trong vùng có lời, tính trong RAM theo Edit thật. Audio và ảnh hero trả HTTP 200 trong Studio. Chỉ ảnh nguồn được xem trực quan; không tự render composition/thumbnail để duyệt. QA đầy đủ ở `qa.json`.

## Phần kết sửa theo bản duyệt mới

Active hiện tại: `public/apology-change/audio/narration-quoc-tuan-v3-ending.wav`, 45 giây, Quốc Tuấn native 1×. Thay ba câu từ 32,7165 giây bằng đúng đoạn người dùng vừa duyệt:

> Họ đã tin lời xin lỗi của bạn đủ nhiều rồi. Điều họ cần bây giờ là được ở bên bạn mà không phải lo chuyện cũ sẽ lặp lại. Đừng để người đã chọn tha thứ lại phải hối hận vì đã tin mình.

Lấy tiếng mới từ `public/voice-auditions/apology-change-ending-v1/` (temperature 0,45), raw transcript đã đọc đối chiếu nhận đúng toàn văn/dấu hiển thị; chất lượng nghe vẫn chờ người dùng duyệt. Không có ASR toàn bản mới; metadata wordMatchRatio để null, endingWordMatchRatio lưu riêng. Không tự gọi điểm match 100% là duyệt phát âm.

Giữ nguyên mọi mẫu PCM trước 32,716458 giây, thời gian bảy câu đầu và toàn bộ trang caption trước phần kết. `apply-ending-v1.py` sao chép các câu mới ở 1×, đặt pause 0,55/0,7 giây giữa các ý. Lời mới kết thúc 43,054 giây; nguồn ghép gồm tail dài 43,704 giây, pad silence cuối đến 45. Các khoảng nối là digital silence; copyMap ở `public/apology-change/audio/assembly-ending-v1.json`, copySpans/hash/endingEdit ở voice.json. Không kéo giãn giọng hoặc cắt âm cuối.

Sáu ảnh giữ nguyên. Bốn cảnh đầu và điểm bắt đầu cảnh 5 không đổi; cảnh 6 bắt đầu frame 1054 thay 1123, để khớp “Điều họ cần…”. Headline cảnh 6 đổi thành “Đừng để họ / hối hận vì đã tin.”, giữ Stoic Bold 700 và nhấn vàng. 24 trang caption; cập nhật SRT/script/description. Nhạc Night, source trim/rate/mức âm lượng/fade và thumbnail giữ nguyên, kiểm tra hash xác nhận.

Bản cũ gồm Video, script, config, metadata, caption/SRT, description, QA và production-spec lưu tại `public/apology-change/backups/ending-v2/`; các WAV cũ giữ nguyên. Những ghi chú bản trước phía trên là lịch sử.

`check:apology-change` và TypeScript qua, bao gồm so PCM prefix và caption/timing cũ. Mix mới peak −2,07 dBFS, nhạc thấp hơn giọng khoảng 18,87 dB. Không render MP4, thumbnail, preview hoặc mix audio.
