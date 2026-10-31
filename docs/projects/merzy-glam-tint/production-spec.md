# Merzy The Glam Mellow Tint — lồng giọng Adam bựa

- Hình: video khách gửi `public/merzy-glam-tint/imported-video.mov` (HEVC, khung hình biến thiên: phần lớn 30 fps, đoạn quẹt son 14,85–18,1 s khoảng 39 fps) giữ nguyên. Bản dùng trong composition là `public/merzy-glam-tint/video/source.mp4` (H.264, **60 fps** cố định, 1571 frame, không audio): giữ đủ 820 khung gốc đúng thời điểm. Bản 30 fps cũ (`video/source-30fps.mp4`) bỏ 36 khung, chủ yếu ở đoạn quẹt son, gây giật; giữ lại để đối chiếu.
- Audio gốc: chỉ là tạp âm phòng (~-41 dB, không lời), tắt bằng `muted`.
- Lời đọc: preset **Adam bựa**, VieNeu-TTS v3 Turbo chạy local, không voice clone và không dịch vụ trả phí. Viết theo cách của `skin-care-nhuy`: chào "các con vợ của chồng", cà khịa nhẹ bám thao tác, kết "giải tán, các con vợ!".
- Không phụ đề (yêu cầu của khách); `captions.json`/`captions.srt` chỉ là sản phẩm phụ của bước căn chỉnh.
- Không SFX/nhạc trong bản này.
- Composition: `MerzyGlamTintAdam`, 720×1280, 60 fps, 1571 frame (26,183 giây). Âm lượng giọng chỉnh ở `src/projects/merzy-glam-tint/audio.json`.
- Take 1 (cảnh 5 "Hàng Hàn hẳn hoi", ASR nghe ra lặp chữ) giữ ở `public/merzy-glam-tint/voice-takes/take-1/`; bản hiện tại đổi thành "Xuất xứ Hàn Quốc" (khớp chữ Made in Korea trên đáy nắp).
- Chưa render MP4 tự động. Thanh điệu và chất lượng cảm nhận cần nghe duyệt trong Studio (xem `qa.json` → `asrFlags`).
- Take 2 (cảnh 4 đọc lúc 13,0–16,8 s, trước động tác quẹt) giữ ở `public/merzy-glam-tint/voice-takes/take-2/`. Bản hiện tại neo hai câu cảnh 4 vào hình (`at`): “Quẹt phát lên màu đỏ gạch” 14,9 s khi đầu cọ chạm tay, câu bookmark 16,7 s khi màu đang tán; tempo 1,052×. Các cảnh khác giữ nguyên.
