# Kiến trúc ứng dụng web: tóm tắt cả cuốn sách

- Nhóm: Chưa thuộc kênh / Chưa thuộc series (`ngoai-kenh/chua-thuoc-series`); nối sách `kien-truc-ung-dung-web`
  (*Kiến trúc ứng dụng web*, Nguyễn Thế Huy), hồ sơ nghiên cứu đã đọc đủ 7/7 chương.
- Project ID: `kien-truc-ung-dung-web-tong-quan`.
- Định dạng: video dài 16:9, 1920×1080, 30 fps. Thời lượng thực 16:19 (978,9 giây); dự kiến ban đầu 12–13 phút nhưng
  kịch bản đủ 7 chương cần dài hơn, vẫn dưới 18 phút.
- Trạng thái (2026-11-12): đã có bản dựng cả video (commit `6f6086e`); người dùng thấy nhiều chỗ chưa đạt nên đã rà và
  sửa lại kịch bản, giọng và hình ([script-review.md](script-review.md)); chờ người dùng xem lại trong Studio và chốt
  gói ban đầu.

## Yêu cầu của người dùng (2026-11-11)

- "Giúp tôi làm tiếp video cho cuốn sách kiến trúc ứng dụng web": làm video tổng hợp cả cuốn, tiếp nối cách làm của
  video *System Design: tóm tắt cả cuốn sách* (cùng tác giả, cùng series, cùng định dạng dài).
- Giọng cơ bản, **không clone** → lựa chọn 1 (preset VieNeu), thống nhất Minh Đức như video System Design.
- Hình phải thể hiện được kỹ thuật: sơ đồ phụ thuộc, interface, adapter chạy thật; không minh họa chung chung.

## Khán giả và thông điệp

- Lập trình viên junior–middle đang làm web/Laravel hoặc bất kỳ framework nào, đã từng thấy controller trộn SQL với
  nghiệp vụ; người chuẩn bị phỏng vấn về clean architecture, DDD nhẹ, hexagonal.
- Thông điệp: tách code nghiệp vụ khỏi hạ tầng để test nhanh, đổi công nghệ rẻ và biết sửa ở đâu. Theo sách, chỉ tách ở
  chỗ dễ đổi hoặc khó test; việc đơn giản thì gộp bớt (PDF 48, 59).

## Cách làm

- Không intro series, không đoạn "Cách làm", không phần ý kiến cá nhân. Màn tên video trên nhạc, rồi hook vào thẳng
  controller đặt hàng; đi bảy chương theo thứ tự sách; khép lại bằng câu hỏi phân loại core/hạ tầng.
- Giữ đúng một ví dụ xuyên suốt: chức năng đặt hàng e-book trong Laravel/PHP, từ controller trộn lẫn đến port và adapter.
- Hình là sơ đồ vẽ bằng code: controller, database, interface, adapter, mũi tên phụ thuộc, thẻ code; gói dữ liệu chạy
  trên đường nối. Hình đổi theo câu (mốc câu lấy từ giọng), không vẽ theo từng từ.
- Không dùng ảnh tạo bằng AI; chỉ bìa sách người dùng đã tải lên và sơ đồ code.

## Lựa chọn đề xuất (chờ người dùng chốt)

| Mục | Đề xuất | Ghi chú |
|---|---|---|
| Chủ đề hình ảnh | **Bản vẽ kỹ thuật** (`ban-ve-ky-thuat`), đã có từ video System Design | Nền xanh bản vẽ, nét xanh lơ, nhấn vàng hổ phách; đổi trong trang **Chủ đề hình ảnh** nếu muốn |
| Phong cách animation | **Sơ đồ hệ thống động** (`so-do-he-thong`) + đồ họa thông tin cho số liệu | Đúng chất chủ đề: sơ đồ phụ thuộc, interface, adapter cắm vào lõi |
| Giọng | Lựa chọn 1: **Minh Đức** (VieNeu, trong playlist đã chọn) | Cùng giọng với video System Design để hai video cùng tác giả nghe liền mạch; chờ người dùng nghe mẫu |
| Nhạc | Aylex – Passionate (freetouse.com), cùng track video System Design | 30% trên màn tên, 1,2% dưới lời; fade theo cạnh clip, chỉnh đầu/cuối trong Studio |
| Chữ | Stoic Sans (Noto Sans) 700; code/số dùng DejaVu Sans Mono | Chữ trên hình ≥ 34 px, phụ đề một dòng, từ khóa vàng |

## Nguồn và kiểm chứng

[sources.md](sources.md): mỗi đoạn kịch bản ghi trang PDF. Ví dụ, tên class và cách đặt vấn đề lấy từ sách; lời kênh chỉ
nối ý. Không đọc tên tác giả, email hay thông tin ấn bản thành lời (để trên màn hình và mô tả).

## Hoàn thành

- [ ] Gói chốt ban đầu được người dùng chốt (kịch bản, nhạc, giọng + mẫu, thông tin chốt, kế hoạch animation)
- [x] Bản dựng cả video (bản đầu bỏ qua bước duyệt 30 giây đầu; bản sửa 2026-11-12 chờ người dùng xem trong Studio)
- [x] description.md, captions.srt (đề xuất), voice-audition.md
- [ ] Thumbnail web, QA; render chỉ khi người dùng yêu cầu
