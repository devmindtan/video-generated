# Giọng đọc — Spec Driven Development: tóm tắt cả cuốn sách

- Lựa chọn giọng: **1, preset VieNeu**, không clone. Giọng **Minh Đức**, như đề xuất trong brief và cùng giọng hai video
  sách kỹ thuật trước (System Design, Kiến trúc ứng dụng web). VieNeu v3 Turbo trên laptop (CPU), `legacy24`, tốc độ 1×,
  temperature 0,5. Mỗi đoạn một file `public/spec-driven-development-tong-quan/audio/<đoạn>-voice-full.wav`
  (`voice.sh` → `scripts/shared/make-voice.py`; story dựng từ script.md bằng `build-story.py`, bỏ ghi chú nguồn `{…}`).
- Chưa ai nghe xác nhận. Nhận dạng giọng (faster-whisper medium) chỉ là gợi ý, không thay cho nghe thật.

## Đợt 1 (2026-11-12): màn tên + mở đầu, chờ duyệt

Luật video dài: làm màn tên và phần mở đầu trước (đoạn 00, 7 câu, 51,1 giây; cả bản dựng 58,8 giây), chờ người dùng xem
trong Studio rồi mới đọc các phần sau.

- Khớp chữ 97%. Chữ bị kéo dài: 2 câu gắn cờ ("Video **này**…", "quy **trình**"), đã đọc lại cả hai; không còn cờ.
- Nhận dạng nghe khác, nên nghe lại vì có thể sai thanh:
  - "đúng **nghiệp** vụ" nghe "nhiệp vụ";
  - "cái **bẫy** của tốc độ" nghe "cái bấy";
  - "giấy tờ nặng **nề**" nghe "nặng nể".
- "code" nghe "cốt" là cách đọc thường. "Spec Driven Development", "spec", "AI" nhận dạng đúng, chưa cần cách đọc riêng.
