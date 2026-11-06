# Short giới thiệu tập 3 · Đắc nhân tâm

- Kênh: tam-ly-cuoc-song · Series: book-insights (Đọc sách, hiểu mình)
- Project ID: `book-dnt-001-shorts` · sách `dac-nhan-tam` · dẫn tới `book-dnt-001-overview`
- Nguồn: đoạn “Đổi chữ nhưng thành chữ và” trong kịch bản tập dài Đắc nhân tâm — Dale Carnegie
- Định dạng: một Short dọc 1080×1920, 30 fps, mục tiêu 45 giây (cho phép 40–50 giây theo giọng cuối)
- Trạng thái: planning; gói chốt ban đầu chờ người dùng duyệt, chưa có composition, ảnh hay giọng mới

## Mục tiêu

Biến một ý cụ thể trong tập dài thành một clip tự đứng được: chỉ ra vì sao chữ “nhưng” có thể làm lời khen mất tác
dụng, rồi minh họa cách đổi sang chữ “và”. Clip kết bằng lời mời xem tập đầy đủ, không tóm tắt cả cuốn sách.

## Cấu trúc

Hook mới gây tò mò → đoạn trích nguyên lời của tập dài, không cắt giữa câu → CTA mới dẫn tới video đầy đủ.

## Creative direction theo `adaptive-video-editor`

Thứ tự ưu tiên: câu chuyện → thông điệp → thiết kế → motion → hiệu ứng. Ngôn ngữ chính là nét vàng tối giản của
series; `motion-kinetic-type` chỉ làm accent cho ba từ khóa **NHƯNG / VÀ / KHÁ LÊN**. Không dùng template Canvas đi
kèm registry vì ZIP không có skill con/template và project này cần source Remotion chỉnh được.

| Ứng viên | Content | Emotion | Clarity | Compatibility | Assets | Feasibility | Kết luận |
|---|---:|---:|---:|---:|---:|---:|---|
| Nét vàng tối giản của series | 5 | 5 | 5 | 5 | 5 | 5 | Primary; giữ nhận diện và vẽ đúng quan hệ “cắt / nối” |
| motion-kinetic-type | 5 | 4 | 5 | 4 | 5 | 5 | Accent; nhấn từ khóa, không biến cả clip thành chữ đập liên tục |
| motion-bauhaus | 3 | 3 | 4 | 3 | 5 | 5 | Không chọn; hình học mạnh nhưng không giải thích câu góp ý rõ hơn |
| motion-blueprint | 3 | 2 | 4 | 3 | 5 | 4 | Không chọn; quá kỹ thuật và lạnh cho một tình huống gia đình |

Thiết kế dùng nền than đen, ngà và vàng ấm; Stoic Sans 700; bố cục chừa vùng nút Shorts bên phải và vùng tiêu đề
phía dưới. Motion thể hiện động từ: chữ “nhưng” cắt đứt đường nối; chữ “và” nối lại hai vế. Không camera shake,
không zoom lặp, không effect trang trí không mang nghĩa.

## Giọng đọc

Lựa chọn 2, giọng clone của chính người dùng +2 bán cung, đồng nhất với tập dài. Hook và CTA clone mới sau khi khóa;
đoạn trích dùng nguyên take clone cuối của tập dài, không dùng giọng tạm Quốc Tuấn làm giọng cuối. Không kéo chậm
giọng; mốc thời gian chỉ được khóa sau khi người dùng chọn take.

## Hoàn thành

- [ ] Gói chốt ban đầu được người dùng khóa: kịch bản, nhạc, giọng + mẫu, thông số, prompt animation
- [ ] Hook/CTA được clone trên máy GPU và người dùng nghe chọn; đoạn trích dùng take cuối của tập dài
- [ ] Dựng Composition + Still, phụ đề sáng theo giọng, nhạc và source chỉnh được trong Remotion Studio
- [ ] Tạo description.md, captions.srt, qa.json và chạy kiểm tra hình/âm thanh; không render tự động
