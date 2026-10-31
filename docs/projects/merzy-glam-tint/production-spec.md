# Merzy The Glam Mellow Tint — lồng giọng Adam bựa

- Hình: video khách gửi `public/merzy-glam-tint/imported-video.mov` (HEVC, khung hình biến thiên) giữ nguyên; bản dùng trong composition là `public/merzy-glam-tint/video/source.mp4` (H.264, 30 fps cố định, 787 frame, không audio).
- Audio gốc: chỉ là tạp âm phòng (~-41 dB, không lời), tắt bằng `muted`.
- Lời đọc: preset **Adam bựa**, VieNeu-TTS v3 Turbo chạy local, không voice clone và không dịch vụ trả phí. Viết theo cách của `skin-care-nhuy`: chào "các con vợ của chồng", cà khịa nhẹ bám thao tác, kết "giải tán, các con vợ!".
- Không phụ đề (yêu cầu của khách); `captions.json`/`captions.srt` chỉ là sản phẩm phụ của bước căn chỉnh.
- Không SFX/nhạc trong bản này.
- Composition: `MerzyGlamTintAdam`, 720×1280, 30 fps, 787 frame (26,233 giây). Âm lượng giọng chỉnh ở `src/projects/merzy-glam-tint/audio.json`.
- Take 1 (cảnh 5 "Hàng Hàn hẳn hoi", ASR nghe ra lặp chữ) giữ ở `public/merzy-glam-tint/voice-takes/take-1/`; bản hiện tại đổi thành "Xuất xứ Hàn Quốc" (khớp chữ Made in Korea trên đáy nắp).
- Chưa render MP4 tự động. Thanh điệu và chất lượng cảm nhận cần nghe duyệt trong Studio (xem `qa.json` → `asrFlags`).
