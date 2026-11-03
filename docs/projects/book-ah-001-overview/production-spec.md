# Thông tin đã chốt — Thay đổi tí hon hiệu quả bất ngờ: tổng quan

- Project: book-ah-001-overview · Series: Đọc sách, hiểu mình · Tập 02 · video dài 1920×1080, 30 fps.
- Dựa trên script.md (nháp v1) và brief.md. Không render/export cả video tự động; người dùng xem trong Studio.

## Thông tin chốt

- **Thời lượng:** mục tiêu 13 phút (780 giây), cho phép **11,5–14,5 phút** (±1,5 phút). Lời đọc phần nội dung hiện khoảng
  2.300 tiếng ≈ 10 phút ở nhịp 1×; cộng intro, Cách làm, thẻ tập, outro, khoảng nghỉ và phần ý kiến cá nhân (1–1,5 phút)
  ≈ 12,5–13,5 phút. Không tăng tốc giọng để vừa thời lượng; dài quá thì rút câu.
- **Duyệt:** chốt ban đầu 5 mục → bản vá (chữ, mô tả thay đổi, video, âm thanh; chỉ phần mới; góp ý qua chat được ghi lại)
  → xem bản dựng (`docs/architecture/review-workflow.md`). Sau khi chốt, agent lập kế hoạch ở tab Tiến trình.
- **Quy tắc đang áp dụng** (series `workflow.json`, AGENTS.md):
  - Bố cục chuẩn của series (quy tắc chung 4): dùng lại nguyên intro, Cách làm của tập, outro của tập 1.
  - Một giọng cho cả tập: clone giọng người dùng +2 bán cung (lựa chọn 2). Dựng bằng giọng tạm Quốc Tuấn; kịch bản chốt
    (kể cả ý kiến cá nhân) xong mới clone một lượt trên máy GPU, người dùng nghe chọn rồi mới ghép.
  - Video dài: dựng 30 giây đầu sau phần mở đầu trước, chờ người dùng xem rồi mới làm tiếp.
  - Câu nhận xét chung và lời kết giữ chữ người dùng; phần ý kiến cá nhân người dùng đưa khi video gần xong, để chỗ trống
    có đánh dấu ngay trước nhận xét chung.
  - "Những điểm chưa đạt" ở mức tổng quát; không đọc số liệu bản dịch sai; không dùng ví dụ nhạy cảm/bạo lực đã loại.
  - Giọng người kể: "mình" kể cho "cả nhà / các bạn", nội dung sách gắn với tác giả, không viết trống không.
  - Nhịp tự nhiên, liền mạch: nghỉ ngắn giữa câu, mỗi ý một hình vẽ trọn vẹn, không nét đứt/chồng nét.

## Cấu trúc composition

| Composition | Nội dung | Ghi chú |
|---|---|---|
| `BookAhTap02` | Cả tập: intro → Cách làm → thẻ tập → các phần → nhận xét chung → outro | Thanh tiến trình, nhạc nền phần nội dung |
| `BookHvttIntro`, `BookHvttCachLam`, `BookHvttOutro` | Dùng lại nguyên của tập 1 | Import từ `src/projects/book-hvtt-001-overview`, không chép |
| `BookAhEpisodeCard` | Thẻ "TẬP 02 · Thay đổi tí hon hiệu quả bất ngờ · James Clear" | Dùng component `BookInsightsEpisodeCard` của tập 1, giọng mới |
| `BookAhMoChuyen`, `BookAhCuonSach`, `BookAhSoiChi`, `BookAhQuyLuat1`–`4`, `BookAhThanhNep`, `BookAhChuaDat`, `BookAhTongKet`, `BookAhNhanXet` | Các phần 0b, 1, 2, 3A–3E, 3F, 3G, 5 | Dùng scene-kit của tập 1 |
| `BookAhThumbnail` | Thumbnail 1280×720 cùng kiểu tập 1 | Chuẩn bị, không tự xuất |

## Phong cách hình

Như tập 1: minh họa **nét vàng vẽ bằng code** (SVG trong Remotion), không ảnh chụp, không ảnh AI; được vẽ người theo nét
tối giản. Nền mực tối, khung vàng đôi; nét tự hiện; mỗi ý một hình trọn vẹn, đổi cảnh mờ chéo; thanh giọng nhỏ ở góc phải;
thanh tiến trình ở mép dưới. Bản này có một hình nền tảng dùng lại xuyên suốt: **vòng thói quen bốn bước** (dấu hiệu →
khao khát → hành động → phần thưởng), mỗi quy luật làm sáng một bước của vòng.

## Chữ

Stoic Sans (Noto Sans) Bold 700; phụ đề ngà, từ khóa vàng, gộp trang tối đa 2 dòng; thẻ tiêu đề cho năm nhóm (3A–3E);
câu trích kèm "Thay đổi tí hon hiệu quả bất ngờ, James Clear".

## Âm thanh

- Giọng: clone giọng người dùng +2 bán cung; file chính thức `public/book-ah-001-overview/audio/NN-đoạn-voice-full.wav`.
- Nhạc intro/outro: của series (Pufino – Enlivening, trong intro/outro của tập 1). Nhạc nền phần nội dung: Moavii –
  Butterflies, 1,5% khi có lời, 2,8% lúc nghỉ, tốc độ 0,85 ([body-music.json](../../../src/projects/book-ah-001-overview/body-music.json)).
- Không hiệu ứng âm thanh.
