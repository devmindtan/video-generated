# Đi tìm lẽ sống: tổng quan và đánh giá

- Kênh: `tam-ly-cuoc-song` · Series: `book-insights` (Đọc sách, hiểu mình).
- Project ID (đề xuất): `book-dtls-001-overview` · Sách: `di-tim-le-song` (*Đi tìm lẽ sống*, Viktor E. Frankl).
- Định dạng: long, 16:9, 1920×1080, 30 fps. Thời lượng mục tiêu 13–15 phút (không quá 18 phút).
- Trạng thái: **thiết kế/kịch bản và kế hoạch** (OpenCode). Chưa dựng, chưa chốt; thực hiện do Claude/Codex.

## Mục tiêu

Tóm tắt trọn vẹn cuốn sách: phần tự thuật trong trại tập trung (ba giai đoạn tâm lý), ý chính của liệu pháp ý nghĩa, tái bút
1984 và lời cuối; giúp người xem hiểu Frankl nói gì về ý nghĩa, trách nhiệm và thái độ, đồng thời thấy rõ giới hạn (không
biến đau khổ thành điều đáng ca ngợi, không đổ lỗi cho người không sống sót).

## Hướng kể

- Trung lập, kể đúng điều sách viết; phân biệt hồi ức, lập luận của tác giả và bình luận trong lời cuối. Khi nhắc tác giả
  trong lời đọc dùng "tác giả", không đọc tên riêng; tên sách/tác giả/ấn bản để thẻ tập và description.
- Mở đầu theo quy tắc từ tập 3: màn hình tập 5–10 s chỉ có nhạc intro series, rồi giọng vào với hook riêng (gợi tò mò, lời
  cho người xem lần đầu, chỉ nêu tên sách), không intro series cũ, không đoạn "Cách làm".
- Có "Những điểm chưa đạt" (mức tổng quát, không nhắc nội dung sai/nhạy cảm như hướng dẫn hại) và "Ý kiến cá nhân" (nháp
  của kênh, "mình thấy/mình nghĩ").

## Quy tắc áp dụng

- Bố cục chuẩn book-insights (từ tập 3): Hook mở đầu → Mở chuyện → Phần 1 Cuốn sách là gì → Phần 2 Sợi chỉ xuyên suốt →
  Nội dung chính chia nhóm → Những điểm chưa đạt → Tổng kết → Ý kiến cá nhân → Nhận xét chung → Outro series (dùng lại).
- Nhạc: intro series Pufino – Enlivening ở màn hình mở; thân bài nhạc nền rất nhỏ, **giữ mức cố định** khi có lời/nghỉ
  (pauseVolume = speechVolume). Không xuất/render khi đang làm.
- Script có hồn (`docs/script-voice-guide.md`), không đọc thông tin thừa, hình vẽ bằng code (được vẽ người, không ảnh AI),
  chuyển cảnh mượt tiết chế.

## Gói kế hoạch

- [script.md](script.md) · [sources.md](sources.md) · [production-spec.md](production-spec.md) · [image-prompts.md](image-prompts.md)
