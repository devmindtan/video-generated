# Nghe thử giọng — intro (lời chào) · book-hvtt-001-overview

- Ngày: 2026-10-30. Lựa chọn giọng: **1 (giọng có sẵn)**, không clone.
- Lời đọc: phần 0 của script.md đã duyệt, cấu hình `scripts/projects/book-hvtt-001-overview/audition.json`.
- Take: `public/voice-auditions/book-hvtt-intro-v1/` (VieNeu v3 Turbo, legacy24, temperature 0,5, tốc độ 1×, không nhạc/SFX). Trang nghe: `public/voice-auditions/book-hvtt-intro-v1/index.html`.
- Năm giọng trong playlist ưu tiên; ASR cục bộ đều đạt, **chưa ai nghe duyệt**. ASR không xác nhận thanh điệu: cần nghe chỗ "Đọc sách, hiểu mình", "dành cho bạn", "hạnh phúc".

| Giọng | Thời lượng |
|---|---|
| Hải Đăng (05) | 23,1 giây |
| Minh Đức (11) | 28,8 giây |
| Xuân Vĩnh (14) | 23,7 giây |
| Ngọc Linh (16) | 25,5 giây |
| Quốc Tuấn (25) | 23,9 giây |

## Intro trong Studio

- Composition `BookHvttIntro` (Tam-Ly-Cuoc-Song → Book-Insights → book-hvtt-001-overview), 1920×1080, 30 fps; thời lượng = giọng đang chọn + 3,2 giây thẻ sách.
- Đổi giọng nghe thử bằng prop `voice` trong Studio: `05-hai-dang`, `11-minh-duc`, `14-xuan-vinh`, `16-ngoc-linh`, `25-quoc-tuan`. Đang thử `14-xuan-vinh` theo yêu cầu người dùng (2026-10-30); chưa chốt cho cả tập.
- Dải sóng âm và caption lấy từ `src/projects/book-hvtt-001-overview/intro-takes.json`, sinh bởi `.venv/bin/python scripts/projects/book-hvtt-001-overview/intro-bands.py` (phân tích file giọng theo từng khung hình; không tạo âm thanh mới).
- Chưa có nhạc nền: cần chọn nhạc (có fade vào/ra, giảm nhạc khi có lời).
- Không render/export.

## Chờ người dùng

- Chọn giọng (cho intro và cả tập).
- Nhận xét hình intro trong Studio.

## Xuân Vĩnh: thử bớt kéo dài cuối câu (2026-10-30)

Người dùng: tông giọng Xuân Vĩnh ổn nhưng cuối câu kéo dài không cần thiết. Thử ba bộ tham số VieNeu (cùng lời, tốc độ 1×, không chỉnh tempo sau tổng hợp):

| Bản | Tham số | Take | Prop `voice` |
|---|---|---|---|
| A | nhiệt độ 0,5 · top-k 25 · phạt lặp 1,2 (bản đầu) | book-hvtt-intro-v1 | `14-xuan-vinh` |
| B | nhiệt độ 0,35 | book-hvtt-intro-xv-b | `14-xuan-vinh-b` |
| C | phạt lặp 1,5 | book-hvtt-intro-xv-c | `14-xuan-vinh-c` |
| D | nhiệt độ 0,35 · phạt lặp 1,5 · top-k 15 | book-hvtt-intro-xv-d | `14-xuan-vinh-d` |

Đo thô độ dài tiếng cuối mỗi câu (`final-syllable.py`, chỉ để tham khảo): không bản nào ngắn rõ rệt hơn; câu "…gặp lại mọi người." dài ≈ 0,6–0,7 giây ở cả bốn bản, nên kéo dài có vẻ là đặc điểm của preset hơn là do tham số. Cần người dùng nghe. Clone qua VoiceStudio chưa làm (xem lưu ý đồng ý trong tin nhắn cho người dùng).

## Lựa chọn 2: clone giọng người dùng (2026-10-30)

- Người dùng xác nhận bản ghi "Tầm nhìn cho cuộc sống.mp3" là giọng của chính họ (`--consent self`). Mẫu 15 giây (613–628 giây), lời mẫu nhận dạng bằng faster-whisper cục bộ và gửi kèm (`--ref-text`). Bản mẫu được VoiceStudio giữ riêng ở `.voicestudio/data/references/f78fa36e61f957c5.wav` (ngoài Git, ngoài public). Theo yêu cầu người dùng, file mp3 gốc đã được xóa sau khi trích (đã kiểm hash bản mẫu trước khi xóa).
- `clone-v1`: một câu thử. `clone-v2`: 5 câu intro (VoxCPM2, CPU, ≈ 15 phút), mỗi câu một WAV, không chỉnh tempo.
- Ghép bằng `assemble-clone.py` → `public/voice-auditions/book-hvtt-intro-clone-v2/` (cùng lead-in/khoảng nghỉ như audition.json, 25,4 giây, ASR khớp chữ). Trong Studio: prop `voice` = `clone-ban`. Mặc định trong registry giữ `14-xuan-vinh-d` mà người dùng đã lưu từ Studio.
- Đo thô tiếng cuối: trung bình ≈ 0,6 giây, không ngắn hơn Xuân Vĩnh; cần người dùng nghe.

## Quyết định (2026-10-30)

Người dùng chọn **giọng clone của mình** (`clone-ban`, lựa chọn 2) cho intro; prop mặc định của `BookHvttIntro` đã đặt `clone-ban`. Giọng cho phần nội dung chính dự kiến dùng cùng giọng clone (cần tạo bằng VoiceStudio, CPU ≈ 30 giây xử lý cho mỗi giây lời).

## Sửa lời chào (2026-10-30)

Người dùng sửa hai câu đầu: "Xin chào cả nhà, chào mừng mọi người đã đến với series Đọc sách, hiểu mình." / "Ở series này, mình sẽ đọc trọn từng cuốn sách, rồi kể lại những nội dung chính và những điều đáng giữ trong mỗi cuốn." Chỉ clone lại hai câu này (`clone-v3`); ba câu sau lấy từ `clone-v2`. Ghép bằng `assemble-clone.py --clone clone-v2 clone-v3` → `public/voice-auditions/book-hvtt-intro-clone-v3/` (25,8 giây, ASR khớp chữ). Prop mặc định của `BookHvttIntro`: `clone-ban-v3`. Bản `clone-ban` cũ vẫn giữ.

## Biến thể cao độ của giọng clone (2026-10-31)

Người dùng muốn giọng khác bản clone một chút. `voice-variants.py` đổi cao độ, giữ nguyên thời lượng (resample + atempo, như giọng B của Tí Hon), phụ đề và nhịp giữ nguyên; bản gốc không đổi.

| Prop `voice` | Cao độ | f0 trung vị (đo thô) |
|---|---|---|
| `clone-ban-v3` | gốc | ≈ 103 Hz |
| `clone-ban-v3-tram1` | −1 bán cung | ≈ 96 Hz |
| `clone-ban-v3-tram2` | −2 bán cung | ≈ 91 Hz |
| `clone-ban-v3-sang1` | +1 bán cung | ≈ 109 Hz |

Chưa chọn; mặc định vẫn `clone-ban-v3`. Đổi cao độ bằng resample dịch cả formant nên âm sắc đổi theo; mức lớn hơn ±2 dễ nghe giả.

## Chọn +1 bán cung; sửa chỗ "Đọc sách, hiểu mình" đọc nhanh (2026-10-31)

Người dùng chọn `clone-ban-v3-sang1` và báo cụm "Đọc sách, hiểu mình" đọc nhanh bất thường. Đo `word-rate.py`: câu 1 bản v3 đọc liền "series Đọc sách hiểu mình", không ngừng ở dấu phẩy. Clone lại câu 1 (`clone-v4`) theo hai cách, không chỉnh tempo:

| Prop `voice` | Cách | Đo |
|---|---|---|
| `clone-ban-v4a-sang1` | A: "Xin chào cả nhà. Chào mừng…" (dấu chấm sau "cả nhà") | cả câu 3,16 tiếng/giây (v3: 3,67) |
| `clone-ban-v4b-sang1` | B: "…đến với series" + nghỉ 0,12 giây + "Đọc sách, hiểu mình." tạo riêng | cụm tên 2,35 tiếng/giây |

Cả hai +1 bán cung như bản đã chọn. Mặc định đặt `clone-ban-v4b-sang1`; chờ người dùng nghe. Lời trong script.md chưa đổi (cách A chỉ khác dấu câu; cách B giữ nguyên chữ).
