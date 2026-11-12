# Giọng đọc — Spec Driven Development: tóm tắt cả cuốn sách

- Lựa chọn giọng: **1, preset VieNeu**, không clone. Giọng **Minh Đức**, như đề xuất trong brief và cùng giọng hai video
  sách kỹ thuật trước (System Design, Kiến trúc ứng dụng web). VieNeu v3 Turbo trên laptop (CPU), `legacy24`, tốc độ 1×,
  temperature 0,5. Mỗi đoạn một file `public/spec-driven-development-tong-quan/audio/<đoạn>-voice-full.wav`
  (`voice.sh` → `scripts/shared/make-voice.py`; story dựng từ script.md bằng `build-story.py`, bỏ ghi chú nguồn `{…}`).
- Chưa ai nghe xác nhận. Nhận dạng giọng (faster-whisper medium) chỉ là gợi ý, không thay cho nghe thật.

## Đợt 2 (2026-11-12): cả video (người dùng: "Tiếp tục hết đi")

Đọc toàn bộ bằng Minh Đức: 8 đoạn, 88 câu, video 10:50 (650,0 giây, cả màn tên 6,5 giây). Thời lượng, mã băm và khớp chữ
từng đoạn trong `scripts/projects/spec-driven-development-tong-quan/voice.json`. Đoạn 00 cũng được đọc lại trong lượt này
(nhịp nghỉ chung cả video), nên mẫu nghe đợt 1 đã được thay.

- Khớp chữ từng đoạn: 97%, 96%, 98%, 95%, 96%, 98%, 95%, 99%.
- Cách đọc riêng (`SAY` trong `build-story.py`, phụ đề giữ chữ gốc): "vibe coding" → "vai bờ cô đinh" (bản đầu nghe
  "VIP coding"); "hỏi lại AI, thì" thêm dấu phẩy vì bản đầu đọc lặp "AI AI". Nhận dạng lại: nghe "viber coding", hết lặp.
- Chữ bị kéo dài: `fix-drag.py` lượt một gắn cờ 40 câu, thay 34; lượt hai (5 lần đọc mỗi câu) gắn cờ 26, thay 18. Còn
  lại 20 chữ dài 0,44–0,64 giây, phần lớn là ngắt tự nhiên trước một vế ("và", "thì", "mà", "cùng"). Nên nghe:
  - "hay **SDD**" ở phần kết (đoạn 07; nhận dạng nghe "FDD", chữ dài 0,64 giây);
  - "Nam và **Linh**" (01), "ở ba **chỗ**" (01), "khoảng trống **AI** sẽ tự điền" (02), "**Domain**-Driven Design" (02).
- Nhận dạng nghe khác, nên nghe lại vì có thể sai thanh:
  - 00: "**nghiệp** vụ" → "nhiệp";
  - 02: "đề xuất **đang bàn**" → "đàng bản", "**ngữ** cảnh" → "ngứa";
  - 03: "vòng **lặp**" → "lập" (2 lần), "**mã** yêu cầu" → "mãi", "**bàn giao**" → "bản dao";
  - 04: "**hằng** ngày **đau**" → "hàng ngày đâu", "câu hỏi **tưởng** nhỏ" → "tường", "không bị **vá** lặng" → "ván";
  - 05: "**luồng** chưa ai giải thích" → "nguồm", "**cách** đi" → "tách";
  - 06: "**đương** nhiên" → "đường", "**kỹ** sư" → "ký", "âm **thầm**" → "thẩm".
- Cách đọc thường, không gắn cờ: "code" → "cốt", "spec" → "speck", tr/ch, r/gi/d, số đọc thành chữ.
- Chưa ai nghe xác nhận; nhận dạng chỉ là gợi ý, không thay cho nghe thật.

## Đợt 1 (2026-11-12): màn tên + mở đầu, chờ duyệt (đã thay)

Luật video dài: làm màn tên và phần mở đầu trước (đoạn 00, 7 câu, 51,1 giây; cả bản dựng 58,8 giây), chờ người dùng xem
trong Studio rồi mới đọc các phần sau.

- Khớp chữ 97%. Chữ bị kéo dài: 2 câu gắn cờ ("Video **này**…", "quy **trình**"), đã đọc lại cả hai; không còn cờ.
- Nhận dạng nghe khác, nên nghe lại vì có thể sai thanh:
  - "đúng **nghiệp** vụ" nghe "nhiệp vụ";
  - "cái **bẫy** của tốc độ" nghe "cái bấy";
  - "giấy tờ nặng **nề**" nghe "nặng nể".
- "code" nghe "cốt" là cách đọc thường. "Spec Driven Development", "spec", "AI" nhận dạng đúng, chưa cần cách đọc riêng.
