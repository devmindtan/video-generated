# Nghe thử giọng · 4 short giới thiệu tập 3

- Lựa chọn giọng: **2, clone giọng người dùng** (+2 bán cung), như tập 3. Từ 2026-11-09 lời đọc viết mới toàn bộ (không còn
  đoạn trích giọng của tập 3), nên toàn bộ lời sẽ được clone; trước đó dựng thử bằng giọng tạm.

## Giọng tạm (người dùng 2026-11-09: "sử dụng giọng quốc tuấn trước xem thế nào")

| Take | Giọng | Máy | Câu |
|---|---|---|---|
| `public/voice-auditions/book-dnt-shorts-qt-v1/` | Quốc Tuấn (VieNeu, preset) | laptop | 4 câu mở + lời mời (`scripts/projects/book-dnt-001-shorts/audition-qt.json`) |

- Nhận dạng cục bộ khớp 96%. Chỗ cần nghe: "thật lòng" nghe như "thật long" (câu mở short 3); "trọn" như "chọn" và
  "thì link" như "kỳ linh" (lời mời). Đây là giọng tạm, không phải giọng cuối; nghe duyệt giọng tạm không thay cho việc
  kiểm tra thanh điệu của bản clone.
- Ghép bằng `.venv/bin/python scripts/projects/book-dnt-001-shorts/build-shorts.py --take book-dnt-shorts-qt-v1`: cắt
  từng câu theo mốc của take, cắt đoạn trích ở khoảng lặng đo được (short 1 từ 32,20; short 4 nối ở 39,80 → 40,62).
- Giọng tạm không có mốc từng chữ: phụ đề câu mở và lời mời dùng mốc ước lượng theo độ dài chữ, chỉ để lật trang đúng
  lúc. Phụ đề sáng theo giọng thật sẽ làm sau khi người dùng chọn bản clone.

## Giọng tạm cho lời viết mới

| Take | Giọng | Máy | Câu |
|---|---|---|---|
| `public/voice-auditions/book-dnt-shorts-qt-v2/` | Quốc Tuấn (VieNeu, preset) | laptop | 25 câu của 4 short + lời mời (`audition-qt-v2.json`, sinh từ narration.json) |
| `public/voice-auditions/book-dnt-shorts-qt-v3/` | Quốc Tuấn | laptop | Như v2, short 2 có câu ví dụ (`audition-qt-v3.json`) |
| `public/voice-auditions/book-dnt-shorts-qt-v4/` | Quốc Tuấn | laptop | Như v3, "và" trước dấu phẩy (`audition-qt-v4.json`) |

- Nhận dạng cục bộ khớp 99%. Chỗ nghe có vẻ sai thanh hoặc sai chữ: "Trong" → "Tròng" (1-4), "thêm" → "thềm" (2-3),
  "trọn" → "chọn" (2-6 và lời mời), "thật lòng" → "thật long" (3-1), "Đắc nhân tâm" → "Đặc nhần tầm" (câu mở short 4),
  "nịnh hót" → "lịnh hot" (4-3), "dạy nịnh" → "dạy lịnh" (4-5). Đây là giọng tạm: chỉ để xem nhịp và hình, không sửa.
- Ghép bằng `build-shorts.py --take book-dnt-shorts-qt-v2`: mỗi short một bản đọc, khoảng lặng sau câu theo narration.json.

## Giọng clone (người dùng 2026-11-09: "clone đi")

| Lượt | Take | Câu | Máy | Vì sao |
|---|---|---|---|---|
| Clone một lượt | `clone-v1` | 26 (25 câu + lời mời, `lines-clone.txt`) | máy GPU desktop-kndgm60 | Lời đọc viết mới |
| Clone lại | `clone-fix-v1`, `clone-fix-v2` | 8 (`lines-fix.txt`) | máy GPU | Kiểm tra dấu đánh dấu: cãi, lùi, chữ "nhưng", nãy, vạch ranh, cả |
| Short 2 sửa lời (2026-11-10) | `clone-fix2-v1`, `clone-fix2-v2` | 4 (`lines-fix2.txt`) | máy GPU | Thêm câu ví dụ 2-3b, 2-6b; viết lại 2-5, 2-6 để chữ "và" không đứng cuối câu (người dùng: "chữ và đang bị kéo dài") |
| "và" bị đọc lướt (2026-11-10) | `clone-fix3-v1`–`-v3` | 2 (`lines-fix3.txt`) | máy GPU | "và" đặt trước dấu phẩy; chọn bản theo độ dài chữ "và" đo bằng nhận dạng cục bộ: 2-5 bản v1 (0,40 giây, nghỉ 0,30), 2-6 bản v2 (0,28 giây, nghỉ 0,42); bản cũ chỉ 0,20–0,22 giây, không nghỉ. Ghi ở `voice-picks.json` |
| Short 3 câu cuối (2026-11-10) | `clone-fix4-v1`, `clone-fix4-v2` | 1 (`lines-fix4.txt`) | laptop (máy GPU tắt) | "cái vỏ bên ngoài" thay "kỹ thuật" theo người dùng; cả hai bản qua kiểm tra dấu, dùng v2; bản thứ ba bỏ để laptop không quá tải |

- Mẫu giọng `library/voice-references/tam-nhin-cho-cuoc-song/clips/006130-15s.wav` (consent self), lời mẫu nhận dạng lại
  bằng faster-whisper cục bộ và gửi kèm (`--ref-text`), như tập 1–3.
- Mỗi câu lấy bản có ít chỗ bị đánh dấu nhất (`build-shorts.py --clone clone-v1 clone-fix-v1 clone-fix-v2`; bản dùng ghi ở
  `shorts-clone.json` "sentenceTakes"); chọn tay thì ghi `scripts/projects/book-dnt-001-shorts/voice-picks.json`.
  Xử lý như tập 3: ngắt trong câu tối đa 0,3 giây, cắt tiếng thở hai đầu, cân âm lượng từng câu, +2 bán cung giữ thời
  lượng; không giãn giọng.
- Còn đánh dấu ở mọi bản: "nhưng" nghe như "nhân" (short 2), "vạch ranh" (3-3), "giữ/dữ", "trọn/chọn", "đắc/đắt", "một/1".
  Nhiều khả năng là chất giọng và nhận dạng (tập 3 đọc "nhưng" nhiều lần và người dùng đã duyệt), nên chờ người dùng nghe.
- Nghe trong Studio: `BookDntShortThangThuaClone`, `…NhungVaClone`, `…TamLongClone`, `…ChuaDatClone` (cùng hình, giọng
  clone). Chưa thay vào short thật; phụ đề sáng theo giọng làm sau khi người dùng chọn.
