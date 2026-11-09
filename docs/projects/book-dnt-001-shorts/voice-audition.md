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

- Nhận dạng cục bộ khớp 99%. Chỗ nghe có vẻ sai thanh hoặc sai chữ: "Trong" → "Tròng" (1-4), "thêm" → "thềm" (2-3),
  "trọn" → "chọn" (2-6 và lời mời), "thật lòng" → "thật long" (3-1), "Đắc nhân tâm" → "Đặc nhần tầm" (câu mở short 4),
  "nịnh hót" → "lịnh hot" (4-3), "dạy nịnh" → "dạy lịnh" (4-5). Đây là giọng tạm: chỉ để xem nhịp và hình, không sửa.
- Ghép bằng `build-shorts.py --take book-dnt-shorts-qt-v2`: mỗi short một bản đọc, khoảng lặng sau câu theo narration.json.

## Giọng clone

Chưa làm: chờ người dùng chốt lời đọc mới; sau đó clone toàn bộ 25 câu và lời mời trên máy GPU.
