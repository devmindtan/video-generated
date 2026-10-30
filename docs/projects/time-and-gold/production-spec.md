# Time and gold — bản dựng v1

## Sửa phát âm “mẹ”

Người dùng nghe chữ “mẹ” thành “mẽ”. Bản v2 `narration-quoc-tuan-v2-mother-fix.wav` thay riêng câu “Một buổi chiều còn được ngồi cạnh mẹ?” bằng bản local Quốc Tuấn mới, temperature 0.45 và dấu chấm kết câu trong đầu vào TTS để tránh đường giọng hỏi làm lệch dấu. Chữ hiển thị giữ nguyên dấu hỏi và từ ngữ đã duyệt. Target accent-aware ASR có “mẹ”, không có “mẽ”; ASR vẫn ghi “con” ở vị trí “còn”, nên không xem normalized word match 100% là duyệt toàn bộ dấu/phát âm. Chờ người dùng nghe xác nhận.

Giữ mọi PCM ngoài vùng 4.26425–6.07017 giây nguyên byte; câu mới không bị thay tốc độ. Không đổi timeline 50 giây hoặc thời gian các cảnh/câu khác. Chỉ timing caption của câu thay được căn lại. Bản thu và source cũ giữ nguyên, backup trước sửa tại `public/time-and-gold/backups/before-mother-fix/`; metadata speechRepair ghi SHA và vùng thay. Giữ các chỉnh sửa nhạc người dùng đang có (.85×, speechVolume .30 / pauseVolume .35). Runner `scripts/projects/time-and-gold/repair-mother.py` không ghi đè take đã tạo.

## Lịch sử bản v1

Tên: **Có tiền rồi, bạn sẽ mua lại ngày nào?**

Composition `StoicTimeAndGold`, dọc 1080×1920, 30 fps, 1500 frame / 50 giây. Thumbnail component `TimeAndGoldThumbnail`: đồng hồ cát và vàng, câu “CÓ TIỀN… MUA LẠI ĐƯỢC HÔM NAY?”. Chỉ chuẩn bị component, không export/render.

## Lời và giọng

Kịch bản nguyên văn đã chốt tại [script.md](script.md), cấu hình TTS `scripts/projects/time-and-gold/audition.json`. Tiếp tục giọng Quốc Tuấn từ tập trước, local VieNeu v3 Turbo legacy24, 24 kHz PCM16, narration native 1×. Không gọi TTS từ xa hoặc cloning. Take gốc `public/time-and-gold/audio/narration-quoc-tuan-v1.wav` dài 45.89967 giây. Take active `narration-quoc-tuan-v1-pauses.wav` thêm 4.10033 giây im lặng để đạt 50 giây; không thay đổi một sample tiếng nói nào. Bản gốc, audition, hash/copy spans được giữ trong voice.json.

Nghỉ nhiều hơn sau câu hỏi mở đầu và giữa các ý/chặng, chừa phần cuối để câu kết đọng lại. Caption 27 trang giữ nguyên lời và chính tả kịch bản, ASR local medium rồi giới hạn theo cụm nói và dịch theo silence mới; split trang nếu bắc qua khoảng nghỉ. SRT ở `public/time-and-gold/captions.srt`. ASR word match 98.29%; nghe duyệt “mẹ”, “hai mươi”, “giàu” (ASR ghi mẽ/20/dầu), không coi kiểm tra nhận dạng là duyệt chất giọng.

## Hình ảnh

Năm ảnh mới tại `public/time-and-gold/images/`: 01-clock, 02-suitcase, 03-empty-home, 04-tea, 05-hourglass. Tạo riêng từng ảnh bằng imagegen tích hợp, đã xem từng ảnh trước khi dùng. Không có người, tay, mặt, bóng người hoặc chân dung; phù hợp quy tắc mới. [Prompt đầy đủ](image-prompts.md). Không Gemini/Veo.

Khung hình ổn định, incoming fade 0.2 giây / overlap 6 frame, không zoom. Cảnh bắt đầu tại frame 0 / 294 / 607 / 911 / 1239, ở khoảng nghỉ giữa các đoạn. Typography theo people-pleasing: captions 44px và headline 88px, Stoic Sans / Noto Sans Bold 700, ivory và gold; thumbnail 88–130px cùng font/màu và safe margins. Guard kiểm tra cả captions lẫn thumbnail, cỡ chữ và caption text được giữ.

## Âm nhạc và chỉnh sửa

**Night — Ludovico Einaudi**, credit theo tên file source local. Nguồn MP3 đầy đủ, không bake excerpt. Track native Audio “Night · Chỉnh trực tiếp trong Edit”: source trim ban đầu 51.9 giây, playbackRate 0.79 theo kiểu nhạc tập trước, source Duration 50 giây; composition giới hạn audible end ở 50 giây. Các thông số này độc lập và sửa được trong Studio; không nhầm source trim với timeline Start. Narration vẫn 1×.

speechVolume 0.18 / pauseVolume 0.25 trong music.json, duck theo caption. Fade-in 1.2s / fade-out 2s dùng shared MusicFade, theo actual audible clip/composition edges kể cả khi kéo/cắt nhạc. Không SFX; giữ khoảng lặng để lời rõ.

## Kiểm tra và duyệt

`npm run typecheck` và `npm run check:time-and-gold` đã qua. QA đọc native Audio props đang có, kiểm tra PCM/hash, nội dung/timing captions, coverage từng cảnh, đủ kích thước ảnh, headline/caption/thumbnail không tràn và mix trong RAM. Lần kiểm tra đầu: peak −2.12 dBFS; nhạc thấp hơn giọng khoảng 19.08 dB lúc có lời. Những con số này không xác nhận chất lượng cảm nhận; chờ người dùng nghe/xem trong Studio.

Không render MP4, thumbnail, preview frame hoặc mix WAV. Không sửa video cũ, không gọi API có phí. Mô tả đăng bài kèm tác giả nhạc tại [description.md](description.md).
