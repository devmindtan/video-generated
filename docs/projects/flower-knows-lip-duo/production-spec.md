# Son hai đầu Flower Knows — lồng giọng Adam bựa

- Hình: video khách gửi `public/flower-knows-lip-duo/imported-video.mp4` (HEVC 1080×1920, 30 fps cố định, 638 frame, 21,27 giây) giữ nguyên. Bản dùng trong composition là `public/flower-knows-lip-duo/video/source.mp4` (H.264, 30 fps, 638 frame, không audio). Các hiệu ứng hình của khách (tối dần ~2,8 s, chuyển cảnh chân mèo 4,5 s) nằm sẵn trong hình.
- Âm thanh gốc: **giữ nguyên** (yêu cầu của người dùng 2026-11-03): `public/flower-knows-lip-duo/audio/source-audio.wav` là audio của file khách, chỉ đổi sang WAV 48 kHz (`npx remotion ffmpeg -i public/flower-knows-lip-duo/imported-video.mp4 -map 0:a:0 -c:a pcm_s16le -ar 48000 public/flower-knows-lip-duo/audio/source-audio.wav`). Phát ở `sourceVolume` 1, không ducking, không lọc. Không có lời; ngoài các hiệu ứng là im lặng số. Hiệu ứng: 4,55–5,6 s (chân mèo), 9,25–10,75 s, 12,46 s (mở nắp), 13,75–16,15 s (quẹt son), 18,3–20,5 s (phủ bóng), 20,75–21,3 s.
- Lời đọc: preset **Adam bựa**, VieNeu-TTS v3 Turbo chạy local, không voice clone (lựa chọn giọng 1). Cách viết theo các video Adam bựa trước: chào "các con vợ của chồng", cà khịa nhẹ bám thao tác, kết "giải tán, các con vợ!". Đoạn 4,5–5,6 s để trống cho tiếng chân mèo. Câu "Quẹt ra hồng đất" neo 13,85 s khi màu chạm lòng bàn tay.
- Trộn: giọng `voiceVolume` 1. Âm gốc tự chạm 0 dBFS ở các tiếng tách đơn mẫu; khi giọng chồng lên tiếng tách 18,988 s thì đúng 1 mẫu vượt (+1,08 dB, 1/48000 s, không nghe được). `check.py` cho phép tối đa 4 mẫu và chỉ tại chỗ âm gốc đã chạm 0 dBFS.
- Take 1 (cảnh 2 ASR mất chữ "bạc") giữ ở `public/flower-knows-lip-duo/voice-takes/take-1/`; bản hiện tại đọc lại cảnh 2 ở temperature 0,5.
- Không phụ đề, không nhạc/SFX thêm. Không nêu công dụng chưa kiểm chứng.
- Composition: `FlowerKnowsLipDuoAdam`, 1080×1920, 30 fps, 638 frame (21,267 giây). Âm lượng ở `src/projects/flower-knows-lip-duo/audio.json`.
- Chưa render MP4. Thanh điệu cần nghe duyệt trong Studio (xem `qa.json` → `asrFlags`).
