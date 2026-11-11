# Thông tin đã chốt (đề xuất) — System Design: tóm tắt cả cuốn sách

| Mục | Giá trị |
|---|---|
| Định dạng | Video dài 16:9, 1920×1080, 30 fps |
| Thời lượng mục tiêu | 12,5 phút ± 1,5 phút (bản dựng hiện tại 12:31; không ép giọng nhanh để vừa thời lượng) |
| Cấu trúc | Màn tên video 6,5 s (chỉ nhạc) → Mở đầu (hook) → 10 chương theo thứ tự sách → Khép lại |
| Giọng | Lựa chọn 1, Minh Đức (VieNeu), một giọng cho cả video; voice.json |
| Nhạc | Aylex – Passionate (freetouse.com): 30% trên màn tên, hạ về 1,2% khi giọng vào, giữ cố định dưới lời; fade theo cạnh clip, chỉnh đầu/cuối trong Studio; music.json |
| Chủ đề hình ảnh | Bản vẽ kỹ thuật (`ban-ve-ky-thuat`): nền xanh #0b1a2b có lưới, xanh lơ #4fd1e8, vàng hổ phách #ffb547, chữ #e6f1fa; màu lấy qua `themeOf`, không viết cứng |
| Phong cách animation | Sơ đồ hệ thống động (`so-do-he-thong`, `src/looks/diagram-kit.tsx`) + đồ họa thông tin cho số liệu |
| Chữ | Stoic Sans (Noto Sans) 700 cho tiêu đề, nhãn, phụ đề; chữ tiếng Việt trong thẻ dùng font chủ đề; code/số trong thẻ dùng font đơn cách (DejaVu Sans Mono); chữ trên hình ≥ 34 px |
| Phụ đề | Trang phụ đề theo thời gian từng chữ của giọng (make-voice + faster-whisper), một dòng là chính, từ khóa màu nhấn; không làm chữ sáng theo giọng như series sách tâm lý |
| Nhịp hình | Mỗi câu một nhịp hình (mốc câu lấy từ giọng, `timing.json`); hình chạy liên tục (gói dữ liệu, bộ đếm), không vẽ theo từng chữ |
| Chuyển chương | Nhãn chương góc trên trái; nghỉ 1,2 s cuối mỗi đoạn có sẵn trong giọng; hình mờ ra/vào trên nền giữ nguyên |
| Duyệt | 30 giây đầu đã qua (người dùng 2026-11-11 bảo tiếp tục); cả video xem trong Studio, không render/xuất để duyệt |
| Xuất | Chỉ khi video xong và người dùng yêu cầu; người dùng bấm Render trong Studio |

## Quy tắc đang áp dụng

- Không có `workflow.json` riêng cho "Chưa thuộc series"; các quy tắc chung áp dụng: kịch bản có hồn, không đọc thông
  tin thừa, video dài làm 30 giây đầu rồi chờ duyệt, nhạc dưới lời giữ mức nhỏ cố định, không render khi đang làm,
  ảnh tạo mới không lộ mặt người (video này không dùng ảnh tạo, chỉ sơ đồ vẽ bằng code và bìa sách).
- Quy tắc của Đọc sách, hiểu mình (intro series, giọng clone, bố cục 12 phần, karaoke caption) **không** áp dụng.
