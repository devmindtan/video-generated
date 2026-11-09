# Thông tin đã chốt · 4 short giới thiệu tập 3

## Định dạng

- Dọc 1080×1920, 30 fps. Có 4 composition riêng (mỗi short đăng riêng) và 4 bìa (Still), mỗi bìa đặt cạnh short của nó.
- Thời lượng: khoảng 52, 39, 33, 43 giây (± 3 giây theo độ dài câu mở và lời mời khi clone). Mỗi short không dưới 30
  giây, không quá 60 giây.
- Không render tự động; người dùng tự xuất bằng nút Render trong Studio. Bản xuất ra thẳng -14 LUFS
  (`scripts/shared/render-loudness.cjs`).

## Bố cục màn hình (vùng an toàn của YouTube Shorts)

Hình và nền **thiết kế riêng cho short**, không giống tập dài. Đây là ý của người dùng khi trả gói (2026-11-09).
Chi tiết ở [image-prompts.md](image-prompts.md).

- **Kiểu hình**: "giấy và mực" theo thumbnail F của tập 3.
  - Nền giấy sáng, tương phản lạnh/ấm nhẹ.
  - Nét mực xám đá, điểm nhấn đỏ của bìa sách và vàng.
  - Chữ chuyển động là một phần của hình.
- **Phần dùng lại và phần làm mới**:
  - Dùng lại phần thời gian, giọng, phụ đề và nhạc của bộ khung short trong series (`src/projects/book-hvtt-001-shorts/ShortFrame`), không chép thành bản riêng.
  - Phần hình (nền, nét, chuyển cảnh, thẻ lời mời) làm mới trong `src/projects/book-dnt-001-shorts/`.
- **Đầu trang** (y ≈ 200–400): "ĐỌC SÁCH, HIỂU MÌNH · TẬP 03" và "Đắc nhân tâm · Dale Carnegie".
- **Vùng hình** (y ≈ 460–1340, rộng 80–940):
  - Vật to, ít chi tiết, nét mực 4–6px.
  - Chữ trong hình ≥ 56px.
  - Không nét chồng nét, không chữ đè lên nét.
- **Phụ đề** (y ≈ 1380–1560):
  - Giữ kiểu chữ Stoic của kênh: Stoic Sans 700, màu ngà, từ khóa vàng, khoảng 58px, sáng theo giọng từng chữ.
  - Phụ đề đặt trên một dải mực tối bo góc để đọc rõ trên nền sáng.
- **Hook**: ngay từ khung đầu tiên, câu mở hiện trọn trên một trang, chữ to, kèm hình nói đúng chủ đề của short. Không
  để nửa dưới trống trong 3 giây đầu.
- **Lời mời**: có thumbnail F thu nhỏ của video dài để người xem nhận ra.
- **Vùng của YouTube**: chừa mép phải khoảng 140px và đáy khoảng 380px cho nút và tiêu đề.
- **Không dùng**: intro/outro series, thanh tiến trình, thanh giọng ở góc.

## Bìa

- **Không lấy khung hình trong video.** Người dùng 2026-11-09: "cả thumbnail cũng cần phải thiết kế cẩn thận hơn".
- **Định dạng**: mỗi short có một bìa dọc 1080×1920, thiết kế bằng HTML/CSS trong `thumbnail-web/`.
- **Phương án**: ít nhất 3 hướng cho mỗi short. Người dùng chọn trong tab Thumbnail của dự án; tab sẽ được mở rộng để
  mỗi short có một nhóm phương án riêng.
- **Vào Studio**: phương án đã chọn được chép 1:1 vào Still dọc, đặt cạnh short của nó.
- **Vùng an toàn**: chữ và vật chính nằm giữa 1080×1350, vì lưới short cắt bìa về 4:5.
- **Kiểm tra trước khi gửi**: chấm điểm theo thang thumbnail của series; dưới 60/100 thì làm lại.

## Âm thanh

- **Giọng**: lựa chọn 2, clone giọng người dùng +2 bán cung, như tập 3.
  - Đoạn trích dùng nguyên giọng đã chốt (`public/book-dnt-001-overview/audio/<đoạn>-voice-full.wav`), cắt ở khoảng nghỉ
    giữa hai chữ.
  - Câu mở và lời mời được clone mới trên máy GPU; người dùng nghe và chọn trước khi ghép.
  - Không kéo chậm giọng. Nghỉ 0,5 giây giữa câu mở và đoạn trích, khoảng 0,8 giây trước lời mời.
- **Nhạc**: Moavii – Butterflies (freetouse.com), tốc độ 0,85, như short tập 1–2.
  - Âm lượng giữ cố định 4%, cả lúc có lời lẫn lúc nghỉ. Đây là quy tắc series 2026-11-08: nhạc dưới lời không to nhỏ
    theo khoảng nghỉ. Short tập 2 dùng 4%/8%.
  - Có fade vào/ra; người dùng chỉnh điểm đầu và cuối của nhạc trong Studio.

## Quy tắc áp dụng

- **Hình theo lời** (quy tắc series, workflow.json): hình đúng điều đang được đọc, chữ trên hình hiện cùng lúc với từ
  được đọc.
  - Trước mỗi bản vá có hình, chạy `npm run visual-sync -- book-dnt-001-shorts --composition <ID>`.
  - Soát từng khung: đồng bộ với lời, nét chồng, chữ đè, lệch tâm.
- **Đoạn trích**: giữ nguyên lời đã chốt, không cắt giữa câu. Short 4 bỏ hai chữ đánh số "Thứ ba," và "Thứ tư," (xem
  script.md).
- **Câu mở và lời mời**: mỗi short một câu mở kiểu khác, không lặp câu mở của short tập 1–2. Lời mời nói rõ link video đầy
  đủ nằm ở phần bình luận; khi đăng, ghim một bình luận có link theo câu mẫu trong description.md.
- **Mô tả mỗi short**: hai dòng đầu nêu thông điệp (quy tắc D1–D3 của series), kèm Sách/Tác giả, link video dài và 2–4
  hashtag. Không có dòng nói về giọng AI.
- **Tiến trình và duyệt**: không render để duyệt; người dùng xem trong Studio. Mỗi lần sửa sau khi chốt đi qua bản vá.
