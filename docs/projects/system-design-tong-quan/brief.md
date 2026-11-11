# System Design: tóm tắt cả cuốn sách

- Nhóm: Chưa thuộc kênh / Chưa thuộc series (`ngoai-kenh/chua-thuoc-series`); chuyển sang kênh riêng khi có.
- Project ID: `system-design-tong-quan`. Sách: `system-design` (*Hướng dẫn cách tiếp cận phỏng vấn System Design*,
  Nguyễn Thế Huy), hồ sơ nghiên cứu đọc đủ 10/10 chương.
- Định dạng: video dài 16:9, 1920×1080, 30 fps. Thời lượng dự kiến 12–13 phút (lời đọc ≈ 11 phút, chưa chốt).
- Trạng thái: gói chốt ban đầu + bản dựng duyệt 30 giây đầu (màn tên video, mở đầu, đầu chương 1).

## Yêu cầu của người dùng (2026-11-11)

- "Đọc cuốn vừa rồi sau đó làm video tổng hợp cuốn sách": tóm tắt cả cuốn, **không giống video tâm lý**; bám sát sách,
  chỉ giữ những phần quan trọng nhất.
- Giọng cơ bản, **không clone** → lựa chọn giọng 1 (preset VieNeu).
- "Animation phải thể hiện được kỹ thuật, không cần nói tới đâu vẽ animation tới đó."
- Theme và phong cách animation: người dùng để agent tự chọn hoặc kết hợp.

## Khán giả và thông điệp

- Lập trình viên junior–middle chuẩn bị phỏng vấn System Design, hoặc muốn ôn lại khái niệm (đúng đối tượng sách
  nhắm tới, PDF 11, 33).
- Thông điệp: thiết kế hệ thống là chọn đánh đổi có lý do; người phỏng vấn chấm cách suy nghĩ, không chờ thiết kế
  hoàn hảo (PDF 7–8, 33, 79).

## Cách làm khác series tâm lý

- Không intro series, không đoạn "Cách làm", không phần ý kiến cá nhân hay "điểm chưa đạt": mở bằng hook, rồi đi
  thẳng 10 chương theo thứ tự sách, mỗi chương một ví dụ đời thường của sách và một ý nói được khi phỏng vấn.
- Hình là sơ đồ hệ thống chạy thật (gói dữ liệu chạy trên đường nối, máy hỏng đổi màu, bộ đếm, thẻ code), không vẽ
  tay theo từng chữ. Hình đổi theo câu (mốc câu lấy từ giọng), không theo từng từ.

## Lựa chọn đề xuất (chờ người dùng chốt)

| Mục | Đề xuất | Ghi chú |
|---|---|---|
| Chủ đề hình ảnh | **Bản vẽ kỹ thuật** (`ban-ve-ky-thuat`, mới): nền xanh bản vẽ có lưới, nét xanh lơ, nhấn vàng hổ phách | Không chủ đề cũ nào hợp sách kỹ thuật; đổi trong trang **Chủ đề hình ảnh** nếu muốn |
| Phong cách animation | **Sơ đồ hệ thống động** (`so-do-he-thong`, mới), kết hợp **Đồ họa thông tin** cho con số | Mẫu ở Studio → Thu-Vien-Phong-Cach → PhongCachSoDoHeThong |
| Giọng | Lựa chọn 1: **Minh Đức** (VieNeu, trong playlist đã chọn) | Đọc thuật ngữ tiếng Anh tốt nhất trong lần thử với Xuân Vĩnh; xem voice-audition.md |
| Nhạc | Aylex – Passionate (freetouse.com): 30% trên màn tên, 1,2% cố định dưới lời | Bài miễn phí trong thư viện; không dùng các bài thương mại (Einaudi…) |

## Nguồn và kiểm chứng

[sources.md](sources.md): mỗi đoạn kịch bản ghi trang PDF. Mọi ví dụ, con số và câu "nói khi phỏng vấn" lấy từ sách;
lời kênh chỉ nối ý. Không đọc tên tác giả, email hay thông tin ấn bản thành lời (để trên màn hình và mô tả).

## Hoàn thành

- [ ] Gói chốt ban đầu được người dùng chốt
- [x] Bản dựng 30 giây đầu sau mở đầu để duyệt trong Studio (không render)
- [ ] Các chương 2–10 và đoạn kết, sau khi người dùng duyệt 30 giây đầu
- [ ] description.md, captions.srt, QA, thumbnail web; render chỉ khi người dùng yêu cầu
