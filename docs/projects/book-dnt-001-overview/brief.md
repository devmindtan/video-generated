# Đắc nhân tâm: tổng quan và đánh giá

- Kênh: tam-ly-cuoc-song · Series: book-insights (Đọc sách, hiểu mình) · Tập 03
- Project ID: book-dnt-001-overview
- Sách: Đắc nhân tâm (How to Win Friends and Influence People) — Dale Carnegie; Revised & Updated Edition, bản tiếng Việt
  First News – Trí Việt, Nhà xuất bản Trẻ, 2008 (`series/tam-ly-cuoc-song/book-insights/books/dac-nhan-tam/`, đã đọc
  30/30 chương)
- Định dạng: video dài 1920×1080, 30 fps, không quá 18 phút (dự kiến khoảng 14–15 phút)
- Trạng thái: planning; gói chốt ban đầu chờ người dùng duyệt, chưa có composition/asset/giọng.

## Mục tiêu

Kể lại trọn cuốn sách cho người không có nhiều thời gian: ý xuyên suốt (người ta dễ thay đổi khi được tôn trọng hơn là
khi bị chê trách; bắt đầu từ điều người kia muốn; mọi thứ phải thật lòng), bốn phần với ba mươi nguyên tắc, kèm những câu
chuyện dễ nhớ của sách; rồi những điểm chưa đạt, tổng kết, ý kiến cá nhân và nhận xét chung.

## Hướng biên tập: trung lập (người dùng 2026-11-05)

Đắc nhân tâm là cuốn sách gây tranh cãi, có người thích, có người ghét, nên tập này giữ sự trung lập và đánh giá khách quan:

- Kể đúng điều tác giả viết, mỗi ý gắn với tác giả ("theo tác giả…", "tác giả kể…"); phỏng đoán của tác giả nói rõ là
  phỏng đoán (vd. Lincoln "tự nhủ" gì khi giữ lại lá thư, PDF 41–42).
- Không đọc các con số không nguồn hay tuyên bố quảng bá như sự thật (99%, 15%/85%, "chín trong mười", doanh số, "hay
  nhất"); không đọc câu "khoa học đã kiểm chứng" khi sách không dẫn nguồn.
- Nêu cả hai luồng ý kiến ngay ở phần "Cuốn sách là gì", và ở "Những điểm chưa đạt" nói cả lý do người ta chê lẫn chỗ
  người chê hay bỏ qua (tác giả nhiều lần tách lời khen thật với lời nịnh).
- Ở những phần dễ bị hiểu thành thao túng (Phần hai, Phần ba), một câu nhận xét của kênh về ranh giới, có "mình thấy /
  mình nghĩ"; không phán xét tác giả hay người đọc.
- Không bịa chuyện riêng; nhận xét của kênh tách khỏi ý tác giả.

## Bố cục (chuẩn series, theo tập 1)

Intro series (dùng lại) → Cách làm của tập (dùng lại) → thẻ "TẬP 03" (mới) → Mở chuyện: lá thư Lincoln không gửi →
1 Cuốn sách là gì → 2 Sợi chỉ xuyên suốt → 3A–3D bốn phần của sách (mỗi phần có thẻ tiêu đề) → 3E Những điểm chưa đạt →
3F Tổng kết → 4 Ý kiến cá nhân (nháp của kênh, người dùng sửa) → 5 Nhận xét chung → Outro series (dùng lại).
Kịch bản: [script.md](script.md).

## Giọng đọc

Lựa chọn 2: clone giọng của chính người dùng, +2 bán cung, giống tập 1–2 (một giọng cho cả series, vì intro, đoạn Cách
làm và outro dùng lại nguyên). Không cần clone thử: giọng và tham chiếu đã duyệt ở tập 1
(`library/voice-references/tam-nhin-cho-cuoc-song/clips/006130-15s.wav`, consent self). Theo quy tắc video dài: dựng
bằng giọng tạm Quốc Tuấn, kịch bản chốt xong (kể cả ý kiến cá nhân) mới clone một lượt trên máy GPU, người dùng nghe chọn
rồi mới ghép.

## Hình và âm thanh

Như tập 1–2: hình nét vàng vẽ bằng code, đi theo từng câu, không ảnh AI; phụ đề Stoic Sans 700 (ngà, từ khóa vàng); thanh
giọng nhỏ ở góc phải, thanh tiến trình ở mép dưới; nhạc intro/outro của series, nhạc nền rất nhỏ cho phần nội dung.
Chi tiết: [production-spec.md](production-spec.md), [image-prompts.md](image-prompts.md).

## Nguồn và kiểm chứng

Chỉ trích các câu đã đối chiếu nguyên văn ([sources.md](sources.md)). Không dùng: chuyện tội phạm ở chương 1 (Crowley,
Al Capone), vụ ám sát Lincoln, cảnh chiến trận ở Gettysburg, chuyện công nhân hút thuốc (Ch23), các con số tỉ lệ không
nguồn.

## Hoàn thành

- [ ] Gói chốt ban đầu đã duyệt (kịch bản, nhạc, giọng, thông tin đã chốt, prompt từng cảnh)
- [ ] Dựng bằng giọng tạm, intro + 30 giây đầu chờ duyệt, rồi các phần còn lại
- [ ] Người dùng sửa ý kiến cá nhân; clone một lượt; ghép giọng clone
- [ ] description.md, captions.srt, qa.py, thumbnail (mẫu BookThumbnail); người dùng xem bản dựng; không render tự động
