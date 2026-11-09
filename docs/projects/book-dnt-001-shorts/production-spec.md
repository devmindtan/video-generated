# Thông tin đã chốt · 4 short giới thiệu tập 3

## Định dạng

- Dọc 1080×1920, 30 fps. Có 4 composition riêng (mỗi short đăng riêng) và 4 bìa (Still), mỗi bìa đặt cạnh short của nó.
- Thời lượng: khoảng 52, 39, 33, 43 giây (± 3 giây theo độ dài câu mở và lời mời khi clone). Mỗi short không dưới 30
  giây, không quá 60 giây.
- Không render tự động; người dùng tự xuất bằng nút Render trong Studio. Bản xuất ra thẳng -14 LUFS
  (`scripts/shared/render-loudness.cjs`).

## Bố cục màn hình (vùng an toàn của YouTube Shorts), như short tập 1–2

Dùng chung bộ khung short của series (`src/projects/book-hvtt-001-shorts/ShortFrame`), không chép thành bản riêng.

- **Trên cùng** (y ≈ 200–400): "ĐỌC SÁCH, HIỂU MÌNH" và tên sách "Đắc nhân tâm · Dale Carnegie".
- **Giữa** (y ≈ 460–1340, rộng 80–940): hình nét vàng của tập 3, vẽ lại cho khung dọc.
  - Vật xếp trên dưới, hình to, ít chi tiết.
  - Chữ trong hình ≥ 44px, nét ≥ 2,6. Không nét chồng nét, không chữ đè lên nét.
- **Phụ đề** (y ≈ 1380–1560): Stoic Sans 700, màu ngà, từ khóa vàng, khoảng 58px. Từng chữ sáng lên khi giọng đọc tới.
- **Hook**: ngay từ khung đầu tiên, câu mở hiện trọn trên một trang, chữ to và sáng hẳn, kèm hình nói đúng chủ đề của
  short. Không để nửa dưới màn hình trống trong 3 giây đầu.
- **Chừa chỗ cho YouTube**: chừa mép phải khoảng 140px và đáy khoảng 380px cho nút và tiêu đề.
- **Bỏ khỏi short**: intro hay outro series, thanh tiến trình và thanh giọng ở góc của tập dài.

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
- **Bìa**: hình là chính, chữ ít (như bìa short tập 1–2), không lộ mặt người.
- **Tiến trình và duyệt**: không render để duyệt; người dùng xem trong Studio. Mỗi lần sửa sau khi chốt đi qua bản vá.
