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

## Chốt cách A; outro (2026-10-31)

- Người dùng chọn **cách A**: intro mặc định `clone-ban-v4a-sang1`. Câu 1 trong script.md và audition.json đổi thành "Xin chào cả nhà. Chào mừng mọi người đã đến với series Đọc sách, hiểu mình." (thêm dấu chấm).
- Outro: take đang nối vào `BookHvttOutro` là `outro-v1` (VoxCPM2, cùng bản mẫu, `--consent self`), ghép → `public/voice-auditions/book-hvtt-outro-clone-v1/` (15,1 giây), +1 bán cung → `outro-ban-sang1`. Take này vẫn nói **“comment”**, trong khi script đích đã đổi thành **“bình luận”**; `audition-outro.json` giữ câu đích để tạo take thay thế sau. Câu "Hẹn gặp lại cả nhà." đọc khá nhanh (≈ 4,9 tiếng/giây). Chưa được nghe duyệt; không coi ASR là duyệt phát âm.

## Outro: "comment" → "bình luận" (2026-10-31)

Người dùng đổi chữ "comment" thành "bình luận" trong lời kết. Chỉ clone lại câu 2 (`outro-v2`, mẫu `library/voice-references/tam-nhin-cho-cuoc-song/clips/006130-15s.wav`), câu 1 và 3 lấy từ `outro-v1`; ghép → `book-hvtt-outro-clone-v2` (14,9 giây, ASR khớp chữ), +1 bán cung → prop `outro-ban-v2-sang1`. File chính thức `99-outro-voice-full.wav` **chưa thay**: chờ người dùng nghe trong Studio rồi mới cập nhật `publish-voice.py` (bản cũ sẽ được giữ trong `audio/backups/`).

## Thử khác giọng gốc thêm (2026-10-31)

Người dùng muốn giọng khác bản clone thêm một chút. Tạo +1,5 và +2 bán cung (giữ thời lượng) cho cả intro (`clone-ban-v4a-sang1_5`, `clone-ban-v4a-sang2`) và outro mới (`outro-ban-v2-sang1_5`, `outro-ban-v2-sang2`); f0 trung vị intro: gốc ≈ 101 Hz, +1 ≈ 107, +1,5 ≈ 111, +2 ≈ 113. Chưa chọn; khi chọn thì intro và outro phải cùng mức (một giọng cho cả tập), rồi chạy `publish-voice.py`.

## Chốt (2026-10-31)

Người dùng chọn **+2 bán cung** cho cả tập và chốt outro đọc "bình luận". `publish-voice.py` đã chép vào `public/book-hvtt-001-overview/audio/00-intro-voice-full.wav` (26,5 giây) và `99-outro-voice-full.wav` (14,9 giây); bản +1 cũ giữ trong `audio/backups/`. `voice.json`: "Giọng người dùng (clone) +2 bán cung", mẫu `library/voice-references/tam-nhin-cho-cuoc-song/clips/006130-15s.wav`. Prop Studio người dùng lưu (`clone-ban-v4a-sang2`, `outro-ban-v2-sang2`) trỏ cùng file âm thanh với bản chính thức. Phần nội dung chính sẽ clone cùng mẫu và cùng +2 bán cung.

## Giới thiệu tập 1 (2026-10-31)

Người dùng yêu cầu thêm 5–10 giây giới thiệu tập 1 làm về cuốn sách gì. Câu nháp: "Tập đầu tiên, mình chọn cuốn Hiểu về trái tim của tác giả Minh Niệm, một cuốn sách viết về những cảm xúc rất đời thường của mỗi người." Clone `episode-v1` (cùng mẫu), ghép → `book-hvtt-episode-clone-v1` (8,0 giây, ASR khớp chữ), +2 bán cung → prop `episodeVoice: tap-ban-sang2` của `BookHvttIntro`, đọc trên thẻ "TẬP 01 · Hiểu về trái tim · Minh Niệm" sau lời chào (intro ≈ 36 giây). Chưa đưa vào `public/<slug>/audio/` (dự kiến tên `01-gioi-thieu-tap-voice-full.wav`) cho tới khi người dùng duyệt câu chữ. Phần 1 của script bỏ câu "Cuốn sách là Hiểu về trái tim, của tác giả Minh Niệm." để không lặp.

## Tách intro series và thẻ tập (2026-10-31)

Người dùng: intro và outro giữ nguyên xuyên suốt series, phần giới thiệu tập đổi theo tập. `BookHvttIntro` chỉ còn lời chào series (≈ 28 giây); composition mới `BookHvttEpisodeCard` (≈ 10 giây) gồm thẻ "TẬP 01 · Hiểu về trái tim · Minh Niệm" và câu giới thiệu tập. Người dùng nghe ổn câu giới thiệu → `publish-voice.py` thêm `01-gioi-thieu-tap-voice-full.wav` (8,0 giây).

## 02 Mở chuyện, đoạn 1: người bà và ngạch cửa (2026-10-31)

Bốn câu đầu phần 0b (`audition-02-mo-chuyen.json`), clone cùng mẫu, +2 bán cung. Lần 1 (`mo-chuyen-v1`) ASR nghe "Ba chạy tới", "mắn cái ngạch cửa", "vấp phai" → tạo lại câu 2–3 (`mo-chuyen-v2`) và câu 1 (`mo-chuyen-v3`); bản ghép `book-hvtt-mo-chuyen-clone-v2` (câu 1 từ v3, câu 2–3 từ v2, câu 4 từ v1), +2 → `mo-chuyen-v2-sang2` (19,1 giây). Bản thô ASR của cả đoạn đúng chữ và dấu ("Bà chạy tới", "mắng cái ngạch cửa", "vấp phải"); ASR không xác nhận thanh điệu, cần người dùng nghe. Chưa đưa vào `audio/02-mo-chuyen-voice-full.wav` cho tới khi người dùng duyệt 30 giây đầu.

## Nội dung chính 02–09 (2026-10-31)

Clone cùng mẫu, mỗi đoạn một take (`seg-<đoạn>-v1`, đoạn 2 phần 0b là `mo-chuyen-doan2-v1`), `build-body.py` ghép theo pause của `audition-<đoạn>.json`, +2 bán cung → prop `<đoạn>-sang2` của các composition đoạn và `BookHvttTap01`. 02–06 và 20 câu đầu của 07 chạy CPU laptop; từ 15:30 chuyển sang máy GPU `desktop-kndgm60` theo quy tắc mới của người dùng (5 câu cuối 07 = `seg-07-nhom-3c-v1b`, 08, 09, và hai bản sửa `repair-a`, `repair-b` cho 26 câu bị gắn cờ ở 03–06; manifest ghi `machine`).

`check-tones.py` gắn cờ nhiều câu, nhưng phần lớn lặp lại cùng kiểu ở cả ba bản (tầng → tần, chương → chân, giơ → dưa, tinh → tin, cách → các): khả năng cao là giọng mẫu/ASR thiên giọng Bắc chứ không phải lỗi clone. Riêng "Ghen tuông." ASR nghe thành "cảm ơn" ở cả hai bản sửa, cần nghe kỹ. `build-body.py` giờ chọn cho mỗi câu bản mới nhất qua được kiểm tra (số viết thành chữ số không tính là lỗi), không có thì bản mới nhất; `voice-picks.json` (lựa chọn của người dùng khi nghe) thắng cả hai. `review-page.py` → `public/book-hvtt-001-overview/voice-auditions/review/index.html` (mở bằng file local): 34 câu còn cờ, mọi bản cạnh nhau. Độ dài: 02 29,8 · 03 39,3 · 04 61,4 · 05 79,4 · 06 105,6 · 07 105,1 · 08 88,5 · 09 9,9 giây (≈ 8,7 phút). Chưa đưa vào `audio/`; chờ người dùng nghe.
