# Thay đổi tí hon hiệu quả bất ngờ: tổng quan và đánh giá

- Kênh: tam-ly-cuoc-song · Series: book-insights (Đọc sách, hiểu mình) · Tập 02
- Project ID: book-ah-001-overview
- Sách: Thay đổi tí hon hiệu quả bất ngờ (Atomic Habits) — James Clear, bản dịch Lý Ngọc Anh
  (`series/tam-ly-cuoc-song/book-insights/books/thay-doi-ti-hon-hieu-qua-bat-ngo-atomic-habits/`, đã đọc 20/20 chương)
- Định dạng: video dài 1920×1080, 30 fps, khoảng 13 phút
- Trạng thái: planning; gói chốt ban đầu chờ người dùng duyệt, chưa có composition/asset/giọng.

## Mục tiêu

Kể lại trọn cuốn sách cho người không có nhiều thời gian: ý xuyên suốt (thói quen nhỏ nhân lên như lãi kép, hệ thống
hơn mục tiêu, thay đổi bắt đầu từ con người mình muốn trở thành) và bốn quy luật cùng cách đảo ngược, kèm những câu chuyện
dễ nhớ của sách; rồi những điểm chưa đạt, tổng kết, ý kiến riêng của người dùng và nhận xét chung.

## Bố cục (chuẩn series, theo tập 1)

Intro series (dùng lại) → Cách làm của tập (dùng lại) → thẻ "TẬP 02" (mới) → Mở chuyện: tai nạn gậy bóng chày và những
thói quen nhỏ của tác giả → 1 Cuốn sách là gì → 2 Sợi chỉ xuyên suốt → 3A–3D bốn quy luật, 3E khi thói quen đã thành nếp
(mỗi nhóm có thẻ tiêu đề) → 3F Những điểm chưa đạt → 3G Tổng kết → 4 Ý kiến cá nhân (lời người dùng, đưa sau) →
5 Nhận xét chung → Outro series (dùng lại). Kịch bản: [script.md](script.md).

## Giọng đọc

Lựa chọn 2: clone giọng của chính người dùng, +2 bán cung, giống tập 1 (một giọng cho cả series, vì intro, đoạn Cách làm
và outro dùng lại nguyên). Không cần clone thử: giọng và tham chiếu đã duyệt ở tập 1
(`library/voice-references/tam-nhin-cho-cuoc-song/clips/006130-15s.wav`, consent self). Theo quy tắc video dài: dựng
bằng giọng tạm Quốc Tuấn, kịch bản chốt xong mới clone một lượt trên máy GPU, người dùng nghe chọn rồi mới ghép.

## Hình và âm thanh

Như tập 1: hình nét vàng vẽ bằng code, đi theo từng câu, không ảnh AI; phụ đề Stoic Sans 700 (ngà, từ khóa vàng); thanh
giọng nhỏ ở góc phải, thanh tiến trình ở mép dưới; nhạc intro/outro của series, nhạc nền rất nhỏ cho phần nội dung.
Chi tiết: [production-spec.md](production-spec.md), [image-prompts.md](image-prompts.md).

## Nguồn và kiểm chứng

Chỉ trích các câu đã đối chiếu nguyên văn trong research.md; không đọc các số liệu bản dịch sai; các tỉ lệ nghiên cứu sách
nêu không đọc như sự thật đã kiểm chứng. Không dùng: nghiên cứu lính Mỹ nghiện heroin trong chiến tranh Việt Nam (nhạy cảm),
đề xuất mã hạt nhân của Roger Fisher (bạo lực), chi tiết cờ bạc/chất gây nghiện.

## Hoàn thành

- [ ] Gói chốt ban đầu đã duyệt (kịch bản, nhạc, giọng, thông tin đã chốt, prompt từng cảnh)
- [ ] Dựng bằng giọng tạm, intro + 30 giây đầu chờ duyệt, rồi các phần còn lại
- [ ] Ý kiến cá nhân của người dùng; clone một lượt; ghép giọng clone
- [ ] description.md, captions.srt, qa.py, thumbnail; người dùng xem bản dựng; không render tự động
