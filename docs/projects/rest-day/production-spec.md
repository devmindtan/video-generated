# Một ngày nghỉ không cần thành tích — ghi chú dựng

## Chủ đích

Bản thử theo yêu cầu người dùng, 45 giây dọc 1080×1920, 30 fps. Người dùng chưa hoàn toàn ưng script nhưng muốn xem thử, đồng thời yêu cầu dẫn chứng sắc và mạnh hơn. Dẫn chứng được chuyển thành việc đọc ba lần không hiểu, làm sai rồi mất cả buổi sửa; câu chốt là trả giá cho việc không chịu nghỉ. Không dùng số liệu sức khỏe hoặc đe dọa đổ bệnh. Lời cuối nhấn giá trị ngày nghỉ và chăm sóc bản thân, không chỉ nghỉ để làm việc nhiều hơn.

Script hiện tại ở `script.md`, config ở `scripts/projects/rest-day/audition.json`; 151 từ. Các lần chỉnh câu được giữ riêng `audition-v1.json`, `audition-v2.json`. Không coi đây là bản lời đã được người dùng duyệt cảm xúc.

## Giọng đọc và lưu vết

Quốc Tuấn, VieNeu v3 Turbo local, legacy24 / 24 kHz PCM16, 1×. Không giãn hoặc tăng tốc giọng để ép 45 giây; `prepare-audio.py` chặn nguồn dài quá giới hạn. Thêm silence trong khoảng nghỉ giữa các câu; giữ PCM của nguồn ghép. Engine sampling thực lưu tại từng audition; prose style không phải model control.

Giữ bản đầu `public/voice-auditions/rest-day-quoc-tuan-v1/` (34,721 giây); sửa riêng các câu ASR nghi vấn và thêm một câu kết qua `rest-day-pronunciation-fix-v1/`. Bản ghép v2 vẫn được giữ. Đối chiếu thêm ba câu bằng `rest-day-pronunciation-fix-v2/`, đổi nhẹ cách nói để dễ đọc: “còn dang dở” → “chưa xong”; câu hỏi cuối về kiệt sức được viết gọn; câu “uổng phí” thay bằng “Một ngày nghỉ đâu cần thành tích mới có giá trị”. Không ghi đè takes/PCM cũ.

Raw ASR v1 có “đo/đò”, “đọc/đầu”, “dang dở/răng giờ”, “vất vả/vắt vả”, “dừng/rừng”. Các đối chiếu không được coi là duyệt phát âm; phải xem transcript cuối và ghi nghi vấn còn lại, không dùng điểm match bỏ dấu làm kết luận. Ghép từ các câu được chọn có copyMap ở `public/voice-auditions/rest-day-assembled-v3/assembly.json`; metadata và copySpans ở `scripts/projects/rest-day/voice.json`.

## Hình và chữ

Sáu ảnh sinh bằng imagegen tích hợp, sao chép nguyên bản vào `public/rest-day/images/`, đã xem từng ảnh. Prompt tại `image-prompts.md`. Không người/mặt người. Đồ vật từ góc làm việc lạnh hơn sang ghế ngồi/ngủ ấm áp; không minh họa bệnh tật. Khung đứng yên, crossfade 6 frame ở khoảng nghỉ. Không zoom lặp.

Stoic Sans local/Noto Sans Bold 700. Caption 44px màu ngà và nhấn vàng `#dcb777`, headline 88px; safe margins. Thumbnail dùng ảnh `04-recover.png`, chữ “PHẢI KIỆT SỨC / MỚI DÁM / NGHỈ?” cỡ 88/102/164, cùng font 700 và nhấn vàng. Chỉ chuẩn bị component, không render/export.

## Nhạc và kiểm tra

Night — Ludovico Einaudi, full source MP3. speechVolume 0,18 / pauseVolume 0,25 trong music.json, caption ducking. Native Audio source trim 53,954 giây, playbackRate 0,79, duration nguồn 45 giây; vẫn tự do move/trim trong Edit. MusicFade giữ fade-in 1,2 giây và fade-out 2 giây theo mép nghe thực tế/composition. Không SFX.

`npm run check:rest-day` kiểm tra đúng 45 giây, script/caption/timing, PCM nguồn/copyMap, ảnh, bộ chữ caption và thumbnail, bố cục chữ và mix trong RAM theo Edit thật. `npm run typecheck` kiểm tra TypeScript. Kết quả cuối ở qa.json, thêm bên dưới sau khi hoàn tất. Chất lượng nghe vẫn chờ người dùng nghe thử, không suy ra từ peak/RMS/ASR.

Không render MP4, thumbnail, preview frame hay audio mix; không Gemini/Vertex/Veo, không TTS trả phí. Studio: http://localhost:3000/StoicRestDay ; thumbnail: http://localhost:3000/RestDayThumbnail.

## Kết quả bản thử cuối

Active `public/rest-day/audio/narration-quoc-tuan-v3-pauses.wav`: 45 giây, native 1×. Nguồn ghép `narration-quoc-tuan-v3.wav` 38,1415 giây, thêm 6,8585 giây silence vào khoảng nghỉ và đuôi, không sửa PCM giọng. Nguồn ghép v3 chọn các câu theo copyMap từ ba audition local; các bản v1, fix-v1, fix-v2 và nguồn ghép v2 được giữ nguyên. Không thay video/take của dự án khác.

24 trang caption; cảnh bắt đầu ở frame 0 / 197 / 367 / 693 / 859 / 1066, lengths 203 / 176 / 332 / 172 / 213 / 284. Giữ ảnh ổn định, crossfade 6 frame trong khoảng nghỉ. Native nhạc đặt duration nguồn 45 giây, playbackRate 0,79; phần nghe được giới hạn ở composition 45 giây, fade cuối 2 giây bám đúng mép.

Raw transcript của nguồn ghép v3 đã được đọc đối chiếu toàn văn, nhận đúng các cụm trước đây bị nghi ngờ: “đo”, “đọc một đoạn”, “chưa xong”, “vất vả”, “kiệt sức”, “có giá trị”. Match bỏ dấu 100% chỉ là dữ liệu hỗ trợ, không phải duyệt phát âm. Lưu nguyên transcript ở `public/voice-auditions/rest-day-assembled-v3/recognition/narration-quoc-tuan-recognition.json`; giọng vẫn chờ người dùng nghe cảm xúc/dấu thanh trong Studio.

`npm run check:rest-day` và `npm run typecheck` đều qua. Bộ kiểm tra fade cũng qua các tình huống move/trim/short/empty. Peak mix −2,09 dBFS, nhạc thấp hơn giọng 18,19 dB trong vùng có lời; tính trong RAM, không xuất mix hoặc frame. Báo cáo `qa.json` đọc timing/volume từ JSX thật. Ảnh đã được xem riêng; không dùng screenshot/render composition để tự duyệt hình/video hoàn chỉnh.

## Cập nhật nhạc nghe thử — Experience

Theo yêu cầu mới, bản đang dùng chuyển từ Night sang **Experience — Ludovico Einaudi**, nguồn đầy đủ `public/stoic/audio/experience.mp3` (315,559 giây), bản gốc không thêm reverb, playbackRate 1×. Giữ source trim 53,954 giây, duration nguồn 45 giây, speechVolume/pauseVolume 0,18/0,25, caption ducking và fade-in/out 1,2/2 giây bám mép nghe thực tế. Native Edit vẫn tùy chỉnh đầu/cuối/source trim. Giọng đọc, hình ảnh, caption, thumbnail và thời lượng video không đổi.

Bản nhạc Night cùng Video/music/QA/description trước đổi được giữ tại `public/rest-day/backups/music-night-v1/`; các ghi chú Night và mix phía trên là lịch sử bản trước. QA mới: peak −2,12 dBFS, nhạc thấp hơn giọng 17,86 dB. TypeScript và check:rest-day qua; cảm nhận phối chờ người dùng nghe. Không render hoặc xuất mix.

## Thumbnail v2

Thay thumbnail theo yêu cầu mới: ảnh hero chiếc ghế bị xích thay ảnh nội thất, câu hỏi “NGHỈ THÔI… / SAO THẤY / CÓ LỖI?”. Copy gần với cảm giác có lỗi khi nghỉ, không hứa hẹn hiệu quả click. Stoic Sans Bold 700, chữ ngà và vàng, cỡ 112/100/152; 896px safe width, đã đo không tràn. Asset mới tại `public/rest-day/images/thumbnail-rest-guilt-v2.png`; prompt và nguồn ở `thumbnail-v2-prompt.md`. Đã xem ảnh nguyên bản, không render/export thumbnail. Backup component v1 và bộ kiểm tra ở `public/rest-day/backups/thumbnail-v1/`. Kiểm tra hash xác nhận Video.tsx, caption, nhạc và WAV không đổi. Các ghi chú thumbnail v1 phía trên là lịch sử.

## Quay lại Night

Theo yêu cầu mới, khôi phục clip Night — Ludovico Einaudi từ backup music-night-v1: source trim 53,954 giây, duration nguồn 45 giây, playbackRate 0,79. Giữ speech/pause levels hiện tại, fade/ducking và native timing Edit. Track Experience cùng các chỉnh sửa Studio mới nhất (trim 69,6223 giây, duration nguồn 38,25 giây, rate 0,85) được lưu tại `public/rest-day/backups/music-experience-v1/`. Thumbnail v2, giọng, hình và caption không thay đổi.
