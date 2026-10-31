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

## Lời đọc đầy đủ sau chốt v1 (2026-10-31)

- Clone 5 cảnh trên **máy GPU `desktop-kndgm60`** bằng cài đặt của đoạn mẫu v2 (bản mẫu + lời bản mẫu), take `clone-mushashi-v3-full`. Cảnh 2 dùng take làm lại `clone-mushashi-v3-s2-seed7` (bản đầu có tiếng thừa "Ước ạ" và "Ba năm" bị nghe thành "bà nằm"). Cảnh 3 làm lại seed 7 không khác, giữ bản đầu.
- Ghi chú khi chốt "tăng cao độ vài bậc": cả video +2 bán cung, giữ thời lượng. Mẫu so sánh cảnh 1: `public/know-when-to-quit/voice-auditions/pitch-samples/scene-01-sang{1,2,3}.wav`.
- File dùng trong video: `public/know-when-to-quit/audio/0N-*-voice-full.wav` (dựng bằng `npm run voice:know-when-to-quit`). Tổng video 43,2 giây.
- ASR cần nghe kỹ (không phải duyệt thanh điệu): cảnh 1 "tiếc" → "tiết"; cảnh 3 "giếng" → "diễn" (cả hai take); cảnh 5 "xẻng" → "sẻng", "rảnh" → "dành". **Chưa ai nghe duyệt.**
