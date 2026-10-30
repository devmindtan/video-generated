# Small mistakes — bản dựng v1

Tên **Bạn còn nghĩ mãi. Họ có khi đã quên.**; composition `StoicSmallMistakes`: 50 giây, dọc 1080×1920, 30 fps, 1500 frame. Thumbnail `SmallMistakesThumbnail`: **HỌ ĐÃ QUÊN… BẠN VẪN NGHĨ?**, kính lúp phóng đại vết mực nhỏ. Component đã chuẩn bị, chưa export/render.

## Lời và giọng

[Kịch bản](script.md) giữ bản người dùng đã chốt. Mở đầu có lớp học và phòng họp, sau đó nói chung cho cả người đi học/đi làm. Không khẳng định mọi người luôn quên lỗi; phân biệt việc người khác nhận ra với việc họ sẽ nhớ mãi. Kết bằng việc vẫn lên tiếng khi có câu hỏi hoặc ý kiến.

Quốc Tuấn local VieNeu legacy24, 24 kHz PCM16, narration native 1×. Không remote TTS, cloning hoặc giả định voice-style prose điều khiển model. Bản gốc `public/small-mistakes/audio/narration-quoc-tuan-v1.wav` dài 48.025125 giây; bản pauses thêm 1.974875 giây silence để thành 50 giây, giữ toàn bộ PCM gốc trước sửa. Khoảng nghỉ nhấn ở chuyển ý, không kéo chậm tiếng nói.

Raw ASR có “nêm”, “Xay”, “lỗ nhỏ”, “xửa” thay cho các từ nên, Sai, lỗi nhỏ, sửa. Đã tạo local audition hai bản riêng cho ba cụm câu (temperature 0.45 và 0.55, đổi dấu ngắt nhưng giữ từ). Chọn fix-v2: nhận dạng có “mình nên im lặng” và “Một lỗi nhỏ cần được sửa”, vẫn viết “Xai” ở vị trí “Sai”. Không coi normalized word match là duyệt dấu hoặc phát âm; cần nghe câu “Sai thông tin…” trong bản dựng để xác nhận. Không tự kết luận S/X là lỗi phát âm từ riêng một bản nhận dạng.

Active `narration-quoc-tuan-v2-pronunciation.wav`, chỉ thay ba vùng được lưu trong voice.json/speechRepairs; toàn bộ PCM ngoài vùng giữ nguyên, không đổi tốc độ hoặc tổng 50 giây. Hai ứng viên và bản nguồn/pauses cũ đều giữ. Caption chỉ ba nhóm sửa được căn lại; 29 trang giữ chính tả/dấu câu của kịch bản gốc. Backup tại `public/small-mistakes/backups/narration-v1/`; SRT `public/small-mistakes/captions.srt`. `prepare-audio.py` và `repair-pronunciation.py` không ghi đè take đã tồn tại.

## Hình và chữ

Sáu ảnh mới trong `public/small-mistakes/images/`: 01-classroom, 01b-meeting, 02-magnify, 03-notebooks, 04-correction, 05-microphone. Tạo riêng bằng imagegen tích hợp, đã xem từng ảnh; không người, tay, mặt, bóng hoặc chân dung. [Prompt](image-prompts.md). Không Gemini/Veo. Hình ổn định, không zoom; riêng mở đầu chuyển từ lớp sang phòng họp ở khoảng nghỉ hai câu đầu.

Shot start frame 0 / 73 / 310 / 542 / 849 / 1220; overlap 6 frame, incoming opacity fade 0.2 giây. Năm chặng lời có start 0 / 310 / 542 / 849 / 1220. Cảnh kết trở về micro với ánh sáng dịu.

Caption 44px, headline 88px, thumbnail 106 / 92 / 164px; Stoic Sans / Noto Sans Bold 700, ivory và nhấn gold, nền tối tương phản và safe margins. Độ rộng ba dòng thumbnail 771 / 418 / 520px trong 896px. Guard theo people-pleasing kiểm tra caption và thumbnail cùng lúc, installed weights và nhấn gold, không đổi chữ caption bởi styling. QA đo cả headline không tràn.

## Âm thanh, Edit và QA

**Night — Ludovico Einaudi**, credit theo tên full MP3 local. Native Audio source trim mặc định 53.954s, playbackRate 0.79, Duration source 50s, timeline Start 0; composition giới hạn audible end ở giây 50. Source trim khác Start. Native Edit cho sửa start/duration/end/trim độc lập, không đóng cứng vào config/import hoặc bake excerpt. Narration vẫn 1×.

music.json speechVolume 0.18 / pauseVolume 0.25, duck theo caption. Fade-in 1.2s / fade-out 2s theo actual audible clip/composition edges. Không SFX, không CTA.

`npm run typecheck` và QA kỹ thuật đã qua (`npm run check:small-mistakes`). Đọc actual inline native Edit values; kiểm tra PCM/hash, vùng sửa/vùng giữ, toàn bộ caption text/timing, sáu shot và hai bối cảnh, kích thước ảnh, chữ không tràn, phối âm trong RAM. Peak −2.09 dBFS, nhạc thấp hơn giọng 18.5 dB lúc có lời. Các chỉ số không thay thế nghe duyệt. Không render MP4, thumbnail, preview frame hoặc mix WAV.

[Mô tả đăng YouTube kèm tác giả nhạc](description.md).
