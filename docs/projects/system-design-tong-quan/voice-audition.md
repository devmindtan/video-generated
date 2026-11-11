# Giọng đọc — System Design: tóm tắt cả cuốn sách

- Lựa chọn giọng: **1, preset VieNeu**, không clone (người dùng 2026-11-11: "sử dụng giọng cơ bản không clone").
- Giọng đề xuất: **Minh Đức** (playlist "Giọng đã chọn"), VieNeu v3 Turbo trên laptop (CPU), `legacy24`, tốc độ 1×,
  temperature 0,5. Mỗi đoạn một file `public/system-design-tong-quan/audio/<đoạn>-voice-full.wav`
  (`scripts/shared/make-voice.py`, story `scripts/projects/system-design-tong-quan/story.json`, dựng từ script.md bằng
  `build-story.py`).
- Đoạn nghe mẫu: `public/system-design-tong-quan/audio/00-mo-dau-voice-full.wav` (mở đầu, 44,6 giây) và
  `01-vong-phong-van-nay-cham-dieu-gi-voice-full.wav` (chương 1, 58,9 giây; bản dựng duyệt cắt ở 37,4 giây).

## Vì sao Minh Đức

Thử ngày 2026-11-11 với Minh Đức và Xuân Vĩnh trên các câu nhiều thuật ngữ, rồi nhận dạng lại bằng faster-whisper
(medium). Minh Đức đọc được "Load Balancer", "request", "SQL", "NoSQL", "Sharding", "API", "REST", "Message Queue",
"latency", "throughput", "failover", "health check", "circuit breaker", "cookie", "OTP", "session"; Xuân Vĩnh đọc sai
nhiều hơn ("Note balancer", "định lý cướp"). Nhận dạng giọng chỉ là gợi ý, không thay cho nghe thật.

## Cách đọc riêng cho thuật ngữ (phụ đề vẫn giữ chữ gốc)

Từ nào giọng đọc lệch trong lần thử thì viết lại theo cách kỹ sư Việt hay nói (`SAY` trong `build-story.py`, trường
`say` của make-voice): CAP → "xê a pê", replication → "rép li kê sần", quorum → "quô rầm", sharding/shard → "sác
đinh"/"sát", cache-aside → "cát ơ sai", idempotency → "ai đem pô tần xi", HTTP/HTTPS/HttpOnly → "hát tê tê pê…", TCP →
"tê xê pê", RPC/gRPC → "a pi xi"/"gi a pi xi", POST → "pốt", MTBF/MTTR → "em ti bi ép"/"em ti ti a", JWT → "gi đáp bờ
liu ti", RBAC/ABAC → "a rờ bác"/"ây bác", OAuth2 → "ô ót hai", SameSite → "sêm sai", XSS → "ích ét ét", CSRF → "xi ét
a ép", CPU → "xi pi iu", Metrics → "mét trích", Logs → "lóc". 21 câu dùng cách đọc riêng; chưa ai nghe xác nhận.

## Chữ bị kéo dài (người dùng 2026-11-11)

Người dùng nghe "ví dụ đời... thường": giọng giữ chữ "đời" 0,44 giây, gấp đôi các chữ bên cạnh. VieNeu đọc mỗi lần
một khác, nên đây là một lần đọc xấu chứ không phải lỗi chữ. `scripts/projects/system-design-tong-quan/fix-drag.py` đo
thời lượng từng chữ trong mọi câu (faster-whisper), câu nào có chữ giữ ≥ 0,42 giây và ≥ 1,8 lần chữ trung vị (bỏ chữ đầu,
chữ cuối, chữ đứng trước dấu câu, thuật ngữ dài) thì đọc lại tối đa 4 lần và giữ lần mượt nhất; bản cũ còn trong cache.
Kết quả: câu "ví dụ đời thường" giờ đọc "đời" 0,22 giây; 49 câu trong cả video được thay. Phép đo chỉ là gợi ý, vẫn cần
nghe: các chữ còn bị gắn cờ sau khi thay phần lớn là chỗ ngắt tự nhiên ("là", "và" trước một vế).

## Cả video (12 đoạn, 12:31)

Khớp chữ từng đoạn 89–98%. Chỗ nhận dạng nghe khác, cần người dùng nghe: "Cache giữ" (nghe "Các chữ", đoạn 02), "muôn
thuở" (05), "thì REST" (07), "Lỗi" (nghe "Lối", 08), "Metrics" (đã đổi cách đọc thành "mét trích", 10), "Logs" (nghe
"Lock", 10). Âm "tr" đọc gần "ch" (trễ → chễ) là giọng miền Bắc của preset, không phải lỗi.

## Kiểm tra hai đoạn đầu (lần đọc thứ nhất)

| Đoạn | Thời lượng | Khớp chữ | Ghi chú nhận dạng (cần nghe) |
|---|---|---|---|
| 00 Mở đầu | 44,6 s | 96% | "dòng code" nghe thành "dòng cốt" |
| 01 Chương 1 | 58,9 s | 98% | "lặp lại" nghe thành "lập lại" (có thể sai thanh) |

Khớp chữ không xác nhận thanh điệu tiếng Việt; chưa có lần nghe duyệt.
