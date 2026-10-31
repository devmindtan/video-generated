# Nghe thử giọng — know-when-to-quit

- Ngày: 2026-10-31. Lựa chọn giọng: **2, clone `mushashi`** (consent: permission theo `library/voice-references/mushashi/reference.json`).
- Đoạn mẫu: `library/voice-references/mushashi/clips/002288-15s.wav` (15 giây). Engine VoxCPM2 qua VoiceStudio, cả hai take tạo trên **máy GPU `desktop-kndgm60`**, tốc độ 1×, không đổi cao độ, không nhạc/SFX.
- Lời đọc: cảnh 1 ("Ba năm. Bốn mươi triệu. Và tối nào cũng tự nhủ: lỡ rồi, cố thêm chút nữa."). Lời đọc đầy đủ làm sau khi chốt ban đầu.

| Take | Cách tạo | Thời lượng | ASR (faster-whisper medium) |
|---|---|---|---|
| `clone-mushashi-v1` | chỉ bản mẫu | 6,78 giây | "**bà nằm**, bốn mươi triệu, và tối nào cũng tự **nhù**…": nghi lệch thanh ở "Ba năm", "nhủ" |
| `clone-mushashi-v2-reftext` (đề xuất) | bản mẫu + `--ref-text` (lời của bản mẫu, chép bằng ASR) | 5,51 giây | "3 năm, 40 triệu Và tối nào cũng tự nhủ Lỡ rồi, cố thêm chút nữa": khớp lời |

Trang nghe: `public/know-when-to-quit/voice-auditions/clone-mushashi-v1/index.html` và `…/clone-mushashi-v2-reftext/index.html`.

ASR khớp không xác nhận thanh điệu; **chưa ai nghe duyệt**. Khi nghe, chú ý "Ba năm", "nhủ", và độ nhanh của v2 (ngắn hơn v1 1,3 giây; nếu thấy vội thì clone lại với seed khác, không kéo chậm).

## Chờ người dùng

- Nghe và chọn take mẫu (v1, v2 hoặc yêu cầu thử lại) trong màn Chốt ban đầu.
