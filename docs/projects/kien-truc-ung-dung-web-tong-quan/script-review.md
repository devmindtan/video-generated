# Phản biện kịch bản và bản dựng — Kiến trúc ứng dụng web: tóm tắt cả cuốn sách

Người dùng 2026-11-12: "Kiểm tra lại video mới làm xong nhưng mà tôi thấy nhiều chỗ chưa đạt". Bản dựng đầu (commit
`6f6086e`) được rà lại toàn bộ: kịch bản so với sách (research.md, sources.md), giọng đọc (nhận dạng lại từng đoạn), và
khung hình giữa từng câu (visual-sync, 225 câu).

## Kịch bản: chỗ sai hoặc gán cho sách điều sách không nói (đã sửa)

| Câu cũ | Vấn đề | Sửa |
|---|---|---|
| "sách nhắc đi nhắc lại: kiến trúc là công cụ, không phải tôn giáo" | Sách không có câu này | Bỏ; giữ lời sách: chỉ tách ở chỗ dễ đổi hoặc khó test (PDF 59) |
| "OrderListViewModel có findRecentOrders" | Hàm đó thuộc OrderListViewRepository (PDF 32) | Kể đúng: view model chỉ gồm 4 trường, lấy qua repository riêng |
| "Lý do: nhìn constructor là biết class cần gì" | Lý do của sách là không dính container toàn cục, dễ truyền mock (PDF 35–36) | Đổi theo sách |
| "Chương này cũng nói rõ cách nối dependency" | Sách hẹn chương sau nhưng chương đó không có | "Chương này cũng nhắc…" |
| "Sách vẽ một mũi tên vòng vào trong" | Sơ đồ của sách là một dòng thẳng (PDF 44) | Bỏ; giữ Hollywood Principle (PDF 41) |
| "Use case chạy trong vài mili giây" | Con số bịa | Bỏ |
| "Một Money đã tạo được thì không tự nhiên thành số âm" | Sách nói Money giữ tiền kèm đơn vị, tránh nhầm đơn vị (PDF 21) | Đổi theo sách |
| "CRUD bắt đi qua đủ bốn tầng thì chỉ làm chậm team… trông có vẻ chuyên nghiệp" | Diễn giải quá đà, gán cho sách | Lời sách: việc đơn giản thì gộp bớt; module lõi phức tạp mới chia đủ (PDF 48) |
| "Với đa số dự án, chung database… là đủ" | Sách chỉ nói "trong phạm vi ebook" chọn cách đơn giản (PDF 32) | "Sách chọn cách đơn giản…" |
| "thêm một job gửi mail" ở mở đầu | Không có trong sách | "thêm một API JSON bên cạnh trang web" (PDF 4) |
| "Đó là nhận định của tác giả, không phải một con số đo được" | Câu cãi với người không có mặt | Gộp vào câu "Theo tác giả…" kèm lý do của sách (PDF 6) |
| "Cái đáng lấy không phải… Mà là…" | Khuôn "không phải X mà là Y" | Nói thẳng ý |

## Giọng đọc

- Kịch bản đọc thành lời nhiều tên class và cú pháp code: `orderRepository->save(order)` nghe "Order Repository sang
  Save", `app()->make` nghe "app sang mạch", `try catch` nghe "Cheat Cache", `toArray` nghe "Touray". Đã viết lại câu
  bằng lời thường; tên class vẫn hiện trên hình.
- Bộ cách đọc riêng (`SAY` trong `build-story.py`) để trống: "Port" nghe "Pod", "lasagna" nghe "lô gian nhà",
  "Cockburn" nghe "CodeBurn", "CQRS" nghe "CQJS". Đã thêm cách đọc. "bounded context" (nghe "bào đẹp contact") được nói
  bằng lời thường ("hai phân hệ").
- "lời giải" lại nghe thành "lời dài" (sai thanh, như video System Design): đã đổi câu.
- Chưa rà chữ bị kéo dài: đã chạy `scripts/shared/fix-drag.py` cho cả video.

## Hình (đã dựng lại toàn bộ Chapters.tsx)

- Chữ phụ 26–30 px, sơ đồ dồn nửa trên màn hình, nửa dưới trống → mọi chữ ≥ 34 px (code ≥ 30 px), dùng hết vùng hình.
- Nhiều cảnh giữa câu chỉ có tiêu đề trên nền trống (hình chậm hơn lời) → mỗi cảnh có hình ngay từ câu đầu.
- Khối thấp có nhãn bị icon đè; nhãn port nằm đè viền; chú thích tràn khung → sửa bộ vẽ (khối thấp có nhãn thì bỏ
  icon) và dàn lại.
- "Tính tiền" bị xếp vào nhóm hạ tầng cạnh Database/Session/Framework → gắn đúng: tính tiền là nghiệp vụ.
- Phương trình "hạ tầng = tổng code − core" bị vỡ chữ; danh sách "Controller sau khi tách" chỉ dòng đầu có dấu ✓ → sửa.
- Sơ đồ Dependency Rule thiếu tầng Giao diện dù lời đọc nhắc; mũi tên không hướng vào trong → vẽ lại, mọi mũi tên vào trong.
- Nhiều cảnh chỉ là danh sách chữ → thay bằng sơ đồ chạy: dòng code bị sửa khi đổi công nghệ, dữ liệu sai lọt vào
  database, constructor chặn đơn sai, repository đổi bản cài đặt, các bước trong service sáng lần lượt, luồng đặt hàng.

## Thời lượng

Bản đầu 16:50 trong khi brief ghi 12–13 phút. Bản sửa ngắn hơn một chút nhờ bớt đọc tên class; vẫn dưới 18 phút theo
quy tắc video dài. Brief đã cập nhật lại thời lượng thực.
