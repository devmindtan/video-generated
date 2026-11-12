# Thông tin đã chốt (đề xuất) — Kiến trúc ứng dụng web: tóm tắt cả cuốn sách

| Mục | Giá trị |
|---|---|
| Định dạng | Video dài 16:9, 1920×1080, 30 fps |
| Thời lượng mục tiêu | 16:19 ± 1:00 (bản dựng 2026-11-12: 978,9 s, 10 đoạn, 213 câu; dưới 18 phút; không ép giọng nhanh để vừa thời lượng) |
| Cấu trúc | Màn tên video 6,5 s (chỉ nhạc, bìa sách) → Mở đầu (hook, controller đặt hàng) → 7 chương theo thứ tự sách gộp thành 8 đoạn nội dung (Domain+Repository, Đọc/ghi, Application Service, Ba tầng, Ports & Adapters) → Khép lại |
| Giọng | Lựa chọn 1, Minh Đức (VieNeu preset), một giọng cho cả video; `scripts/projects/kien-truc-ung-dung-web-tong-quan/voice.json` |
| Nhạc | Aylex – Passionate (freetouse.com), cùng track video System Design: 30% trên màn tên, hạ về 1,2% khi giọng vào, giữ cố định dưới lời; fade theo cạnh clip, chỉnh đầu/cuối trong Studio; `src/projects/kien-truc-ung-dung-web-tong-quan/music.json` |
| Chủ đề hình ảnh | Bản vẽ kỹ thuật (`ban-ve-ky-thuat`): nền xanh #0b1a2b có lưới, xanh lơ #4fd1e8, vàng hổ phách #ffb547, chữ #e6f1fa; màu lấy qua `themeOf`, không viết cứng |
| Phong cách animation | Sơ đồ hệ thống động (`so-do-he-thong`, `src/looks/diagram-kit.tsx`): sơ đồ phụ thuộc, interface, adapter, luồng đặt hàng, gói dữ liệu chạy trên đường nối; thẻ code cho ví dụ Laravel/PHP |
| Chữ | Stoic Sans (Noto Sans) 700 cho tiêu đề, nhãn, phụ đề; chữ tiếng Việt trong thẻ dùng font chủ đề; code/số dùng font đơn cách (DejaVu Sans Mono); chữ trên hình ≥ 34 px |
| Phụ đề | Phụ đề theo thời gian câu của giọng (mốc câu từ `sentence-times.py` / `timing.json`), một dòng là chính; chữ trên hình và phụ đề không đè nhau (nội dung dưới y ≈ 880) |
| Nhịp hình | Mỗi câu một nhịp hình (mốc câu lấy từ giọng, `timing.json`); hình chạy liên tục (gói dữ liệu, luồng), không vẽ theo từng từ |
| Chuyển đoạn | Nhãn đoạn góc trên trái; nghỉ 1,2 s cuối mỗi đoạn có sẵn trong giọng; chuyển mờ trên nền giữ nguyên |
| Duyệt | Màn tên + 30 giây đầu sau mở đầu chờ người dùng duyệt trong Studio (không render/xuất); tiếp tục phần còn lại chỉ sau khi người dùng duyệt |
| Xuất | Chỉ khi video xong và người dùng yêu cầu; người dùng bấm Render trong Studio |

## Quy tắc đang áp dụng

- Series "Chưa thuộc series" không có `workflow.json` riêng: áp dụng quy tắc chung (kịch bản có hồn, không đọc thông
  tin thừa, video dài làm 30 giây đầu rồi chờ duyệt, nhạc dưới lời giữ mức nhỏ cố định, không render khi đang làm).
- Không intro series, không đoạn "Cách làm", không ý kiến cá nhân. Màn tên 6,5 s trên nhạc rồi hook thẳng vào ví dụ.
- Không dùng ảnh tạo bằng AI; chỉ bìa sách người dùng đã tải lên (`public/kien-truc-ung-dung-web-tong-quan/images/book-cover.jpg`) và sơ đồ vẽ bằng code.
- Ảnh tạo mới (nếu có về sau) không lộ mặt người; video này hiện không dùng ảnh tạo.
- Quy tắc của Đọc sách, hiểu mình (intro series, giọng clone, bố cục 12 phần, karaoke caption từng từ) **không** áp dụng.

## Thành phần kỹ thuật

- Composition: `KienTrucUngDungWebTongQuan` (1920×1080, 30 fps, 29368 khung) trong `src/projects/registry.tsx`, `renderTo('kien-truc-ung-dung-web-tong-quan')`.
- Mã hình: `src/projects/kien-truc-ung-dung-web-tong-quan/` (`Video.tsx`, `Chapters.tsx`, `common.tsx`, `timing.json`, `captions.json`, `music.json`).
- Lời đọc: `public/kien-truc-ung-dung-web-tong-quan/audio/*.wav` (10 đoạn), mốc câu `src/projects/kien-truc-ung-dung-web-tong-quan/timing.json`.
- Nhạc: `public/system-design-tong-quan/music/aylex-passionate-cut.wav` (dùng chung track đã có; chỉnh đầu/cuối trong Studio).
