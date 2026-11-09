# Nghe thử giọng — Đắc nhân tâm (tập 3)

- Lựa chọn giọng: **2, clone giọng người dùng** (+2 bán cung, giữ thời lượng), như tập 1–2; một giọng cho cả series.
  Tham chiếu `library/voice-references/tam-nhin-cho-cuoc-song/clips/006130-15s.wav`, consent self. Không cần clone thử
  (giọng và tham chiếu đã duyệt ở tập 1).
- Từ tập 3 không còn intro series và đoạn Cách làm (quy tắc 2026-11-08): lời mở đầu của tập (thẻ tập + hook) là một
  đoạn clone mới; outro dùng lại nguyên giọng clone của tập 1.

## Giọng tạm (đã dùng để dựng, không phải giọng cuối)

Quốc Tuấn (VieNeu, laptop), theo quy tắc video dài: dựng đủ bằng giọng tạm, chốt kịch bản xong mới clone một lượt.
Các take `book-dnt-tam-qt-*` vẫn giữ nguyên trong `public/book-dnt-001-overview/voice-auditions/` và trong
`body-takes.json` (các composition từng phần trong Studio vẫn mở bằng giọng tạm, như tập 2).

## Giọng clone

| Lượt | Take | Câu | Máy | Vì sao |
|---|---|---|---|---|
| Clone một lượt (2026-11-08) | `seg-<đoạn>-v1`, 12 đoạn | 116 | máy GPU desktop-kndgm60 | Kịch bản đã chốt |
| Sửa lần 1 | `seg-fix-v1`, `-v2` | 7 | máy GPU | Câu bị kiểm tra dấu đánh dấu |
| Sửa theo p9 | `seg-fix2-v1`, `-v2` | 15 | máy GPU | Bỏ "À", câu "Có người lại chê…", tên Meade đọc là "Mít" (`say`), câu "anh sai rồi, chị sai rồi" |
| Sửa theo p12 | `seg-fix3-v1` (laptop), `-v2`, `-v3` (máy GPU) | 1 | laptop rồi máy GPU | "tỉ lệ phần trăm" phải đọc liền |
| Sửa theo p13 | `seg-fix4-v1`–`-v3` | 2 | máy GPU | Chữ "Tác" bị lướt; "thay đổi không" kéo dài chữ "đổi" |

- Mỗi câu dùng bản mới nhất qua kiểm tra dấu, trừ các câu chọn tay trong `scripts/projects/book-dnt-001-overview/voice-picks.json`
  (chọn theo nhận dạng cục bộ: bản đọc đủ chữ, không ngắt giữa cụm). Ghép bằng `build-body.py --project book-dnt-001-overview`
  với nhịp nghỉ của `pacing.json` (p12: tổng lặng ở chỗ đổi hình khoảng 0,9 giây, giữa hai phần khoảng 2,5–3 giây), rồi
  +2 bán cung giữ thời lượng.
- "thay đổi không": cả ba bản clone đều ngân dài cuối câu hỏi, nên 0,7 giây cuối được đọc nhanh hơn 20%, giữ nguyên cao
  độ (`tailTempo` trong audition-02).
- Phụ đề sáng theo giọng: mốc từng chữ bằng `word-times.py` (faster-whisper cục bộ) cho cả 12 đoạn clone; chữ hiển thị
  vẫn là chữ của kịch bản.
- Kiểm tra dấu còn đánh dấu vài chữ mà mình cho là nhận dạng nghe nhầm ("oán" → "quán", "hả" → "hã", "chê" → "che",
  "cẩm nang" → "cẩm nan"), cùng các chỗ x đọc như s (giọng của người dùng, không phải lỗi) và số viết bằng chữ số. Nhận
  dạng không xác nhận thanh điệu; nghe duyệt là của người dùng.

## Người dùng nghe và chọn

- Nghe liền cả tập trong Studio (**BookDntTap03Clone**) qua các bản vá p9–p15; trả lại p9–p14 kèm góp ý (nhịp mở đầu,
  phát âm Meade, chuyển cảnh, nhạc nền, "tỉ lệ phần trăm", "thay đổi không", chữ "Tác", hình chuyển cảnh, cảnh gập sách).
- **Chấp nhận p15 ngày 2026-11-09.** Từ đó `BookDntTap03` dùng giọng clone (`cardVoice: 01-gioi-thieu-tap-sang2`,
  `clone: true`); bản nghe thử BookDntTap03Clone được bỏ khỏi Studio.
- Giọng đã chọn được chép sang `public/book-dnt-001-overview/audio/<đoạn>-voice-full.wav` kèm captions và
  `voice-metadata.json`; ghi ở `scripts/projects/book-dnt-001-overview/voice.json` (`segments`, `listeningReview`).
  Các take nghe thử giữ nguyên.
