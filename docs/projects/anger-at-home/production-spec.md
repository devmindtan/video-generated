# Anger at home — bản dựng 60 giây

Tên **Đừng để người thương bạn phải thu mình**. Composition `StoicAngerAtHome`, dọc 1080×1920, 30 fps, 1800 frame / 60 giây. Thumbnail `AngerAtHomeThumbnail`: **NGƯỜI NHÀ… ĐÂU CÓ LỖI?**, cốc sứ nứt cạnh chiếc cốc nguyên. Chuẩn bị component, không export/render.

## Lời và giọng

Theo [bản lời người dùng chốt](script.md), không có đối thoại, không quay lại tình huống hỏi–đáp cũ, giữ sáu chặng tâm trạng và câu kết. Bản nguyên đọc tự nhiên 57.59279 giây nên dựng 60 giây thay vì ép 50 bằng tăng tốc hoặc cắt ý. Quốc Tuấn local VieNeu v3 Turbo legacy24 / PCM16 / 24 kHz, narration 1×. Không paid TTS, cloning hoặc giả định voice-style prose điều khiển model.

Đã rà raw ASR có dấu; bản đầu có các khác biệt như con/Còn, cáo/cáu, ca nhệt/cay nghiệt, yếu lỏng/yếu lòng, ngồi giận/nguôi giận, dự ý/giữ ý. Hai audition sửa riêng temperature 0.45 và 0.55 được giữ trong public/voice-auditions. Chọn ba cụm từ fix-v1 (Còn người…, cay nghiệt…, yếu lòng…) và năm cụm từ fix-v2. Một số cách nói tương đương được biên tập cho rõ hơn: cáu → nổi nóng; trút ra → tuôn ra; nguôi giận → hết giận; đã trút được bực bội → đã nói hết những bực bội; giữ ý hơn → cẩn trọng hơn. Đã thông báo trong quá trình dựng, cập nhật kịch bản và caption đồng bộ, không đổi ý hay mạch cảm xúc.

`assemble-voice.py` ghép câu được chọn, giữ nguyên PCM các câu còn lại và khoảng nghỉ gốc. Bản ghép native 58.54917 giây, có source offsets/hash/copy map tại `public/voice-auditions/anger-at-home-assembled-v2/assembly.json`. Bản đầu và tất cả audition vẫn còn; backup meta/caption v1 `public/anger-at-home/backups/narration-v1/`.

Bản ghép được ASR local medium lại toàn bộ, word match 98.71%. Raw câu lẻ nhận “cay nghiệt” nhưng raw toàn bài lại ghi “ca nhịt”; toàn bài cũng ghi tuân thay cho tuôn. Đây là khác biệt nhận dạng theo ngữ cảnh, chưa đủ để kết luận phát âm thực tế đúng/sai. **Cần người dùng nghe duyệt “tuôn ra” khoảng giây 14–18 và “cay nghiệt” khoảng giây 19–24.** Không gọi bản giọng là pronunciation-approved chỉ vì normalized match cao.

`prepare-audio-v2.py` giữ mọi sample của bản ghép, chèn 1.45083 giây im lặng để đạt 60. Active source `public/anger-at-home/audio/narration-quoc-tuan-v2-pauses.wav`, bản ghép trước pacing `narration-quoc-tuan-v2.wav`; hai bản v1 vẫn giữ. Runner không ghi đè take đã tồn tại. Caption 36 trang chính tả theo kịch bản hiện tại, giới hạn theo cụm nói, split nếu trang bắc qua pause, đổi thời gian theo silence mới. SRT `public/anger-at-home/captions.srt`.

## Hình ảnh và chữ

Sáu ảnh mới ở `public/anger-at-home/images/`, tạo riêng từng ảnh bằng imagegen tích hợp và đã xem: chìa khóa/túi và bữa cơm; cốc tràn; cốc nứt; ghế cách bàn; ấm trà/hai cốc; cửa nhà và bàn ăn. Không người, tay, mặt, bóng người hoặc chân dung. [Prompt](image-prompts.md). Không Gemini/Veo. Hình là không gian và biểu tượng cảm xúc, không minh họa bạo lực, không khẳng định đã xảy ra hòa giải.

Scene start frame 0 / 214 / 568 / 1007 / 1379 / 1597. Incoming fade 6 frame / 0.2 giây, overlap 6 frame, cắt ở khoảng nghỉ; không zoom. Câu kết ba dòng để không tràn safe width. Caption 44px và headline 88px, thumbnail 106 / 92 / 164px; Stoic Sans / Noto Sans Bold 700, ivory và gold theo chuẩn people-pleasing. Kiểm tra caption lẫn thumbnail cùng lúc, giữ chữ caption khi styling.

## Nhạc, Edit và QA

Nhạc **Night — Ludovico Einaudi**, nguồn MP3 đầy đủ local; credit theo tên file. Native Audio source trim 53.954 giây, playbackRate 0.79, source Duration 60 giây; timeline Start 0, audible span giới hạn bởi composition 60 giây. Narration độc lập vẫn 1×. Native Edit cho kéo/cắt start/duration/end và source trim, không khóa vào config/import và không bake excerpt.

music.json speechVolume 0.18 / pauseVolume 0.25; caption-driven ducking, fade-in 1.2s / fade-out 2s theo actual audible clip/composition edges. Không SFX hoặc CTA.

`npm run typecheck` và `npm run check:anger-at-home` kiểm tra script/caption, PCM/hash của mọi mảnh ghép và pacing, frame scene coverage, cỡ ảnh, độ rộng caption/headline/thumbnail, native Edit values và mix trong RAM. Đã qua: peak −2.14 dBFS, nhạc thấp hơn giọng khoảng 19.23 dB lúc nói. Đây là QA kỹ thuật, chưa là duyệt cảm nhận. Không render MP4, thumbnail, preview frame hoặc mix WAV.

[Mô tả YouTube kèm tác giả nhạc](description.md).
