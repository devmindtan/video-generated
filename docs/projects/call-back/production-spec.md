# Call back — bản dựng đầu

## Bản hiện tại — Quốc Tuấn

Người dùng chọn dùng giọng như video trước (dream-trap), tức **Quốc Tuấn**. Bản gốc mới `public/call-back/audio/narration-quoc-tuan-v1.wav` 40.294875 giây, bản active `narration-quoc-tuan-v1-pauses.wav` 48 giây, chỉ chèn 7.705125 giây im lặng, giữ toàn bộ PCM tiếng nói và native 1×. ASR word match 100%; cảm nhận vẫn cần nghe. Kịch bản không thay đổi. Cảnh bắt đầu 0 / 276 / 596 / 909 / 1197 frame; quietBeat căn lại theo cảnh 3 từ 29.23525 đến 31.35779 giây. Nhạc/source trim/playbackRate và volume người dùng giữ nguyên. Peak phối kiểm tra −2.16 dBFS, nhạc thấp hơn giọng 19.81 dB.

Hải Đăng và Xuân Vĩnh đều được giữ; bản JSX/caption/music/voice metadata/QA trước khi đổi nằm tại `public/call-back/backups/hai-dang-v1/`. Bản thu Xuân Vĩnh: `public/voice-auditions/call-back-xuan-vinh-v1/`. Runner mới là `scripts/projects/call-back/prepare-quoc-tuan.py`; runner Hải Đăng giữ làm lịch sử, không tự chạy lại để ghi đè lựa chọn mới. Không render.

## Lịch sử bản Hải Đăng

Composition `StoicCallBack`: 48 giây, 1080×1920, 30 fps. Thumbnail component `CallBackThumbnail` dùng chiếc ghế trống và câu “ĐỂ MAI… NẾU KHÔNG CÒN NGÀY MAI?”. Không export/render thumbnail hoặc video tự động.

Lời theo [script.md](script.md), không thêm CTA. Khi TTS, bỏ dấu trích dẫn và chuẩn hóa dấu chấm, không thay từ. Giọng Hải Đăng từ playlist ưu tiên là lựa chọn dựng mới chờ nghe duyệt; không đổi narration các tập cũ, không gọi TTS trả phí hay cloning. VieNeu local legacy24 / PCM16 / 24 kHz, tiếng nói 1×.

Take gốc 40.37971 giây tại `public/call-back/audio/narration-hai-dang-v1.wav`. Bản active `narration-hai-dang-v3-pauses.wav` thêm 7.62029 giây im lặng, giữ từng sample tiếng nói. Khoảng nghỉ sau cảnh 3 dài 2.05 giây, phần còn lại rải giữa các cụm kể chuyện. Bản v2 được giữ như artifact lần chuẩn bị caption chưa hoàn tất, không được tham chiếu trong video. Metadata/hash/copy spans ở `scripts/projects/call-back/voice.json`.

Caption 25 trang, chữ nguyên kịch bản tổng hợp. ASR local medium đạt word match 97.35%; một số chỗ cần nghe duyệt: “bữa cơm với nhà”, “món quà đắt tiền”, “hai chữ giá như”. ASR không phải kết luận giọng đọc chuẩn hoặc cảm xúc phù hợp. Caption được giới hạn theo cụm nói, tách trang nếu bắc qua khoảng nghỉ, dịch clock theo silence mới; bản SRT ở `public/call-back/captions.srt`.

Năm ảnh tĩnh mới trong `public/call-back/images/`, tạo bằng imagegen tích hợp rồi xem từng ảnh. Prompt lưu [image-prompts.md](image-prompts.md). Không Gemini/Veo. Cảnh 1 điện thoại bị bỏ qua; cảnh 2 bữa cơm đợi; cảnh 3 nhìn điện thoại bên ảnh gia đình; cảnh 4 ghế trống; cảnh 5 chủ động gọi khi còn có thể. Cảnh cuối là lời nhắc điều kiện, không diễn tả người đã mất được gọi trở lại.

Cảnh bắt đầu ở frame 0 / 280 / 587 / 902 / 1188. Chuyển ở khoảng nghỉ, incoming fade 6 frame / 0.2 giây; không zoom. Caption 44 px, headline 88 px, thumbnail headline 76–126 px; tất cả Stoic Sans / Noto Sans Bold 700, ivory với nhấn gold, dark background và safe margins. Guard typography tương đương chuẩn people-pleasing.

Nhạc **Night — Ludovico Einaudi**, credit theo tên tệp local đầy đủ. Giữ native Audio source trim 41.5 giây, playbackRate 0.8 hiện có, duration source 48 giây (audible span 60 giây được composition chặn ở 48). Start/Duration/End và source trim chỉnh độc lập trong Studio; không bake excerpt. Narration vẫn 1×, không liên quan nhạc 0.8×. speechVolume 0.18 / pauseVolume 0.25 trong music.json và caption-driven ducking. Fade-in 1.2s / fade-out 2s theo clip/composition audible edges. Sau câu “giờ không thể gọi nữa”, quietBeat giảm thêm xuống 25% từ 29.177 đến 30.527 giây, ramp trước/sau; có thể chỉnh trong music.json. Không SFX.

`npm run check:call-back` đọc native Edit thật và kiểm tra script/caption, PCM/hash, scene coverage, ảnh đủ cỡ, chữ không tràn, cùng mix trong RAM (không xuất mix WAV hoặc frame). Lần kiểm tra đầu: peak −2.08 dBFS, nhạc thấp hơn giọng 19.48 dB khi có lời. `npm run typecheck` đã qua. Mức kỹ thuật này chưa xác nhận chất lượng cảm nhận; cần người dùng nghe/xem trong Studio.
