# Nghe thử giọng · 4 short giới thiệu tập 3

- Lựa chọn giọng: **2, clone giọng người dùng** (+2 bán cung), như tập 3. Đoạn trích dùng nguyên giọng clone đã chốt của
  tập 3 (`public/book-dnt-001-overview/audio/<đoạn>-voice-full.wav`, p15).
- Câu mở và lời mời: theo quy tắc "giọng tạm trước, clone sau", dựng thử trước bằng giọng tạm.

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

## Giọng clone

Chưa làm: chờ người dùng nghe bản dựng thử và chốt câu mở, lời mời.
