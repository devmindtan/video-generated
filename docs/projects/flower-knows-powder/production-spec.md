# Phấn phủ Flower Knows — lồng giọng Adam bựa

- Hình: video khách gửi `public/flower-knows-powder/imported-video.mp4` (HEVC 1080×1440, 30 fps cố định, 34 giây) giữ nguyên. Bản dùng trong composition là `public/flower-knows-powder/video/source.mp4` (H.264, 30 fps, 958 frame, không audio): bỏ màn logo CapCut từ frame 958 (31,93 s) tới hết.
- Audio gốc: không có lời (VAD của Whisper không thấy giọng), chỉ tiếng thao tác/tạp âm; tắt bằng `muted`.
- Lời đọc: preset **Adam bựa**, VieNeu-TTS v3 Turbo chạy local, không voice clone và không dịch vụ trả phí (lựa chọn giọng 1). Viết theo cách của `skin-care-nhuy`/`merzy-glam-tint`: chào "các con vợ của chồng", cà khịa nhẹ bám thao tác, kết "giải tán, các con vợ!".
- Cảnh neo theo điểm cắt hình: 3,27 s nắp thiên nga · 11,53 s viền bạc · 18,8 s mặt nắp + ngón tay · 21,1 s mở ra, bông phấn (câu thứ hai cảnh 5 neo `at` 2,4 s = 21,2 s) · 23,43 s mặt phấn hoa tuyết · 27,67 s nắp trong lòng bàn tay.
- Không phụ đề (giống bản Merzy); `captions.json`/`captions.srt` chỉ là sản phẩm phụ của bước căn chỉnh.
- Không SFX/nhạc trong bản này. Không nêu công dụng sản phẩm chưa kiểm chứng; chỉ mô tả cái thấy trên hình và một mẹo dùng chung ("dặm mỏng").
- Composition: `FlowerKnowsPowderAdam`, 1080×1440, 30 fps, 958 frame (31,933 giây). Âm lượng giọng chỉnh ở `src/projects/flower-knows-powder/audio.json`.
- Chưa render MP4 tự động. Thanh điệu và chất lượng cảm nhận cần nghe duyệt trong Studio (xem `qa.json` → `asrFlags`).
