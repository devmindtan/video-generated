# Giọng đọc — Kiến trúc ứng dụng web: tóm tắt cả cuốn sách

- Lựa chọn giọng: **1, preset VieNeu**, không clone. Giọng **Minh Đức** (playlist "Giọng đã chọn"), cùng giọng video
  System Design của cùng tác giả. VieNeu v3 Turbo trên laptop (CPU), `legacy24`, tốc độ 1×, temperature 0,5. Mỗi đoạn
  một file `public/kien-truc-ung-dung-web-tong-quan/audio/<đoạn>-voice-full.wav` (`voice.sh` →
  `scripts/shared/make-voice.py`, story `scripts/projects/kien-truc-ung-dung-web-tong-quan/story.json` dựng từ
  script.md bằng `build-story.py`).
- Chưa ai nghe xác nhận. Nhận dạng giọng (faster-whisper medium) chỉ là gợi ý, không thay cho nghe thật.

## Bản giải thích đơn giản 2026-11-12 (bản hiện tại)

Kịch bản viết lại theo ý (người dùng: "phải tóm tắt được cuốn sách sau đó làm ra 1 video giải thích 1 cách đơn giản
nhất", duyệt "Được tiếp đi"). Đọc lại toàn bộ bằng Minh Đức: 10 đoạn, 163 câu, lời đọc 750,8 giây, video 12:38,5
(758,5 giây, cả màn tên 6,5 giây). Thời lượng từng đoạn và mã băm trong `scripts/projects/kien-truc-ung-dung-web-tong-quan/voice.json`.

- Khớp chữ từng đoạn (nhận dạng lại sau khi chỉnh độ dài): 96%, 98%, 99%, 99%, 100%, 98%, 100%, 96%, 96%, 97%.
- Chữ bị kéo dài: `fix-drag.py` lượt một gắn cờ 46 câu, thay 42; lượt hai (5 lần đọc mỗi câu) gắn cờ 22, thay 16.
  Còn lại cần nghe:
  - Tên tiếng Anh đọc từng chữ cái, dài tự nhiên, không thay: "API" (00, 03), "SQL" (04, 07), "USB" (08), "MySQL" (08),
    "object" (03).
  - Chữ Việt hơi dài, nên nghe: "và" ("database **và** dịch vụ bên ngoài", đoạn 01; "**và** trả kết quả", đoạn 06),
    "gọi **là** repository" (04), "chỉ **nói** với nhà kho hai câu" (04), "Test dễ **viết**" (06).
- Chưa ai nghe xác nhận; nhận dạng chỉ là gợi ý, không thay cho nghe thật.

## Các bản trước (đã thay)

### Bản đọc lại 2026-11-12 (người dùng: "nhiều chỗ chưa đạt")

Bản đầu đọc thành lời nhiều tên class và cú pháp code ("Order Repository sang Save", "app sang mạch", "Cheat Cache",
"Touray") và đọc sai thuật ngữ vì bộ cách đọc riêng để trống ("Port" → "Pod", "lasagna" → "lô gian nhà", "Cockburn" →
"CodeBurn", "CQRS" → "CQJS"). Kịch bản đã viết lại bằng lời thường (tên class chỉ hiện trên hình) và cả video được đọc
lại: 10 đoạn, 213 câu, video 16:19 (978,9 giây, cả màn tên 6,5 giây).

### Cách đọc riêng (phụ đề vẫn giữ chữ gốc)

`SAY` trong `build-story.py`: Alistair Cockburn → "A lít tơ Cô bơn", lasagna → "la da nha", CQRS → "xê kiu a ét",
Port/port → "Pót", HTTP → "hát tê tê pê", POST → "pốt", SMTP → "ét em ti pi", idempotency → "ai đem pô tần xi". 18 câu
dùng cách đọc riêng. Nhận dạng lại giờ nghe "port", "la ra nha", "alitco bơn": cần nghe xem có tự nhiên không.

### Chữ bị kéo dài

`scripts/shared/fix-drag.py --story scripts/projects/kien-truc-ung-dung-web-tong-quan/story.json` chạy hai lượt: lượt
một gắn cờ 54 câu và thay 48, lượt hai (5 lần đọc mỗi câu) thay thêm 11. Còn gắn cờ, cần nghe:

- Nhiều khả năng là ngắt tự nhiên trước một vế: "và" (đoạn 01, câu 4 và 22), "về việc lưu trữ" (01), "thì" (02),
  "đều" — không thay.
- Thuật ngữ viết tắt hoặc tiếng Anh đọc dài hơn chữ Việt: "VAT" (02), "entity", "email" (03), "CQRS" (05, đọc 4 âm),
  "DTO" (05).
- Đáng nghe nhất: "Phần MySQL **nằm** gọn trong một lớp" (đoạn 04, "nằm" 0,66 giây, gấp 3 lần chữ bên cạnh),
  "Repository là một interface **đứng** về phía nghiệp vụ" (04), "Test dễ **viết**" (06), "quá nhiều **tầng**" (07).

### Khớp chữ từng đoạn

96%, 99%, 97%, 95%, 99%, 97%, 98%, 96%, 96%, 96%. Chỗ nhận dạng nghe khác, nên nghe lại:

- "khi tách được" nghe "khi tech được" (01) — có thể sai thanh.
- "một API JSON" nghe "một epa json" (00).
- "tách read model" nghe "tách viết model" (05).
- "lục giác" nghe "lục rác", "gửi xác nhận" nghe "gửi sách nhận", "đừng trừu tượng" nghe "đừng chiều tượng" (08).
- "sự kiện" nghe "sự tiện" (07).

Âm "tr" gần "ch", "r" gần "d/gi" là giọng miền Bắc của preset, không phải lỗi; "code" nghe "cốt" là cách đọc thường.
