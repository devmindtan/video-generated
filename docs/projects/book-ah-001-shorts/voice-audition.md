# Nghe giọng · 4 short giới thiệu tập 2

Lựa chọn 2: giọng clone của người dùng (tham chiếu `library/voice-references/tam-nhin-cho-cuoc-song`, consent: self),
+2 bán cung giữ thời lượng như tập 2. Clone trên máy GPU desktop-kndgm60 (2026-11-05).

| Câu | Take dùng | Máy nghe (check-tones) | Nghe tại |
|---|---|---|---|
| Câu mở short 1 "Vì sao cố gắng mãi…" | `clone-v1` câu 1 | sạch | `public/book-ah-001-shorts/voice-auditions/clone-v1-sang2/part-01-sang2.wav` |
| Câu mở short 2 "Muốn bỏ một thói quen xấu…" | `clone-v1` câu 2 | sạch | `…/clone-v1-sang2/part-02-sang2.wav` |
| Câu mở short 3 "Lên kế hoạch kỹ đến đâu…" | `clone-v1` câu 3 | "kỹ → kỷ" (nhận dạng; cần nghe) | `…/clone-v1-sang2/part-03-sang2.wav` |
| Câu mở short 4 "Có một lý do khiến…" | `clone-v1` câu 4 | sạch | `…/clone-v1-sang2/part-04-sang2.wav` |
| Lời mời (chung) | `cta-v3` (= `cta-v2` seed 7, rút khoảng lặng sau "trọn cuốn") | sạch | `…/cta-v3-sang2/part-01-sang2.wav` |

Người dùng 2026-11-05: "trọn cuốn … thay đổi tí hon" bị khựng một nhịp, cần đọc một mạch → `cta-v3`: khoảng lặng 0,37 giây giữa "cuốn" và "Thay" rút còn 0,06 giây, không clone lại, tốc độ không đổi. Bản lời mời đầu (`clone-v1` câu 5) bị nghe "trọn → tròn" nên clone thêm `cta-v2`; giữ cả hai. Đoạn trích dùng nguyên giọng
đã chốt của tập 2 (không kéo chậm). Nghỉ 0,5 giây sau câu mở và 0,8 giây trước lời mời (`src/projects/book-ah-001-shorts/layout.json`).
Chờ người dùng nghe chọn trong bản vá.
