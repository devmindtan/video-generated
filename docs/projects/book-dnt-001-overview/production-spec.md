# Thông tin đã chốt — Đắc nhân tâm: tổng quan

- Project: book-dnt-001-overview · Series: Đọc sách, hiểu mình · Tập 03 · video dài 1920×1080, 30 fps.
- Dựa trên script.md (nháp v1) và brief.md. Không render/export cả video tự động; người dùng xem trong Studio.

## Thông tin chốt

- **Thời lượng:** không quá **18 phút** (quy tắc series). Lời đọc phần riêng của tập khoảng 2.640 tiếng ≈ 11,5 phút ở
  nhịp clone của tập 2; cộng intro, Cách làm, thẻ tập, outro và khoảng nghỉ ≈ 14–15 phút. Không tăng tốc hay giãn giọng
  để vừa thời lượng; dài quá thì rút câu.
- **Hướng biên tập:** trung lập, đánh giá khách quan (người dùng 2026-11-05) — chi tiết trong brief.md.
- **Duyệt:** chốt ban đầu 5 mục → bản vá (chữ, mô tả thay đổi, video, âm thanh; chỉ phần mới; góp ý qua chat được ghi lại)
  → xem bản dựng (`docs/architecture/review-workflow.md`). Sau khi chốt, agent lập kế hoạch ở tab Tiến trình, các bước của
  người dùng có `doneWhen`.
- **Quy tắc đang áp dụng** (series `workflow.json`, AGENTS.md):
  - Bố cục chuẩn của series: dùng lại nguyên intro, Cách làm của tập, outro của tập 1; chỉ thẻ tập và phần thân là mới.
  - Một giọng cho cả tập: clone giọng người dùng +2 bán cung (lựa chọn 2). Dựng bằng giọng tạm Quốc Tuấn; kịch bản chốt
    (kể cả ý kiến cá nhân) xong mới clone một lượt trên máy GPU, người dùng nghe chọn rồi mới ghép. Không giãn/chậm giọng;
    nhịp nghỉ theo pacing.json (pauseScale 0,6, titlePause 0,5, maxPause 0,3, edgeRms 0,006), nghỉ ~0,8 giây trước ý mới.
  - Video dài: dựng intro + 30 giây đầu sau intro trước, chờ người dùng xem rồi mới làm tiếp.
  - Câu mở mỗi phần nói khác tập 1–2 (đã so, xem script-review.md). Lời cuối của nhận xét chung giữ chữ người dùng.
  - Ý kiến cá nhân: kênh viết nháp ngay, người dùng sửa trong bản vá.
  - "Những điểm chưa đạt" ở mức tổng quát; không đọc số không nguồn; không dùng các chuyện đã loại (brief.md).
  - Giọng người kể: "mình" kể cho "cả nhà / các bạn", nội dung sách gắn với tác giả, không viết trống không.
  - Phụ đề sáng theo giọng cho phần thân chỉ làm sau khi giọng clone cuối đã được chọn.

## Cấu trúc composition

| Composition | Nội dung | Ghi chú |
|---|---|---|
| `BookDntTap03` | Cả tập: intro → Cách làm → thẻ tập → các phần → nhận xét chung → outro | Dùng episode-kit của series; thanh tiến trình, nhạc nền phần nội dung |
| `BookHvttIntro`, `BookHvttCachLam`, `BookHvttOutro` | Dùng lại nguyên của tập 1 | Import từ `src/projects/book-hvtt-001-overview`, không chép |
| `BookDntEpisodeCard` | Thẻ "TẬP 03 · Đắc nhân tâm · Dale Carnegie" | Component thẻ của series, giọng mới |
| `BookDntMoChuyen`, `BookDntCuonSach`, `BookDntSoiChi`, `BookDntPhan1`–`4`, `BookDntChuaDat`, `BookDntTongKet`, `BookDntYKien`, `BookDntNhanXet` | Các phần 0b, 1, 2, 3A–3D, 3E, 3F, 4, 5 | Composition từng phần để xem riêng trong Studio, ghi `"part": true` trong series.json |
| `BookDntThumbnail` | Thumbnail 1280×720 theo mẫu BookThumbnail (layout B: tên sách + ảnh bìa thật) | Ảnh bìa từ `books/dac-nhan-tam/covers/` theo current.json; chuẩn bị, không tự xuất |

## Phong cách hình

Như tập 1–2: minh họa **nét vàng vẽ bằng code** (SVG trong Remotion), không ảnh chụp, không ảnh AI; được vẽ người theo nét
tối giản (quy tắc không lộ mặt chỉ áp dụng cho ảnh tạo mới). Nền mực tối, khung vàng đôi; nét tự hiện; mỗi ý một hình trọn
vẹn, đổi cảnh mờ chéo. Hình nền tảng dùng lại xuyên suốt: **hai dáng người đối diện** (mình và người kia); mỗi phần làm
sáng một chi tiết giữa hai người (Phần một: lá thư; Phần hai: bàn tay chìa ra; Phần ba: hai bong bóng lời khác nhau gặp
nhau ở giữa; Phần bốn: bàn tay đặt lên vai). Chữ trên hình ≥ 34 px, trong khung an toàn; không nét chồng, không chữ đè nét.

## Chữ

Stoic Sans (Noto Sans) Bold 700; phụ đề ngà, từ khóa vàng, gộp trang tối đa 2 dòng; thẻ tiêu đề cho bốn phần (3A–3D).
Không đặt dòng tên sách/tác giả dưới câu trích (quy tắc series).

## Âm thanh

- Giọng: clone giọng người dùng +2 bán cung; file chính thức `public/book-dnt-001-overview/audio/NN-đoạn-voice-full.wav`
  (scripts/projects/book-dnt-001-overview/voice.json).
- Nhạc intro/outro: của series (Pufino – Enlivening, trong intro/outro của tập 1). Nhạc nền phần nội dung: Moavii –
  Butterflies, 1,5% khi có lời, 2,8% lúc nghỉ, tốc độ 0,85 ([body-music.json](../../../src/projects/book-dnt-001-overview/body-music.json)).
- Không hiệu ứng âm thanh.
- Bản đăng: -14 LUFS ± 1, đỉnh thật ≤ -1 dBTP qua `npm run media -- loudness … --fix` sau khi người dùng xuất.
