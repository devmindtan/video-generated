# Kế hoạch animation từng cảnh — System Design: tóm tắt cả cuốn sách

Không có ảnh tạo bằng AI: mọi hình là sơ đồ vẽ bằng code (`src/looks/diagram-kit.tsx`, chủ đề Bản vẽ kỹ thuật), cộng
bìa sách người dùng đã tải lên. Mỗi dòng là một nhịp hình, bắt đầu ở câu ghi trong ngoặc. Hình chạy liên tục (gói dữ
liệu trên đường nối, bộ đếm, đồng hồ); không vẽ theo từng chữ. Đã dựng toàn bộ (Video.tsx, Chapters.tsx); mô tả dưới đây là kế hoạch, chi tiết có thể khác chút sau khi xem khung hình.

## Màn tên (6,5 s, chỉ nhạc) — đã dựng
Sơ đồ mờ phía trên (điện thoại → load balancer → 3 máy chủ, gói dữ liệu chạy), chữ "System Design", "Tóm tắt cả cuốn
sách", dòng nhỏ tên sách đầy đủ · tác giả.

## 00 Mở đầu — đã dựng
1. (câu 1–2) Bảng trắng, đồng hồ 45:00 đếm ngược, thẻ "de-bai.txt: Thiết kế một ứng dụng chia sẻ ảnh"; ba dòng
   "Yêu cầu chi tiết / Viết code / Đáp án đúng" lần lượt bị gạch ✗.
2. (câu 3) Nhãn "System Design Interview"; sơ đồ app chia sẻ ảnh tự vẽ: App → load balancer → 3 máy chủ → Database và
   Kho ảnh, gói dữ liệu chạy; hai nhãn "được nhận", "mức đãi ngộ".
3. (câu 4) Bìa sách + tên đầy đủ + tác giả + "Ebook · 10 chương · 94 trang".
4. (câu 5) Lộ trình 10 chương thành hai hàng; một gói dữ liệu đi dọc lộ trình, thắp sáng từng chương.
5. (câu 6) Thẻ "Ví dụ đời thường" (trạm thu phí, xe chạy qua) và thẻ "phong-van.md" gõ dần một câu trả lời mẫu.

## 01 Vòng phỏng vấn — dựng tới hết danh sách khó khăn
1. (câu 1–2) "Người phỏng vấn muốn thấy gì?"; hai đề bài "Dịch vụ nhắn tin", "Nền tảng xem phim".
2. (câu 3) Sơ đồ chat: Người gửi → Chat → Hàng đợi → Lưu tin, đường phản hồi nét đứt; nhãn "thành phần", "giao tiếp",
   "chịu tải"; thanh người dùng 1 nghìn → 1 triệu, gói dữ liệu dày lên theo tải.
3. (câu 4–8) Bốn thẻ khó khăn: câu hỏi mở (ba nhánh + dấu hỏi), chưa làm hệ thống lớn (cache, queue mờ + dấu hỏi),
   45–60 phút (vòng thời gian chạy), thiết kế hoàn hảo (ngôi sao bị gạch).
4. (câu 9–12) Một vòng lặp ba bước "Hỏi yêu cầu → Kiến trúc tổng quan → Đi sâu" chạy lặp; con trỏ chấm điểm
   nằm trên mũi tên "cách đi" hơn là ô "đáp án"; bong bóng thoại "nghĩ thành tiếng" bật lên liên tục.

## 02 Những viên gạch nền
1. Trạm thu phí: thời gian một xe qua (latency, ms) và số xe/phút (throughput) chạy song song; hai đồng hồ đo.
2. Quán phở → máy chủ: một máy to lên (dọc, chạm trần giới hạn) vs nhiều máy song song (ngang), một máy tắt mà khách
   vẫn được phục vụ.
3. Con số chín: 99,99% → thanh 10.000 phút với 1 phút đỏ; độ tin cậy: giao dịch không mất khi một máy sập.
4. Bản thiết kế ngôi nhà → sơ đồ khối; bảy thành phần lần lượt vào chỗ (web server lễ tân, app server bếp, database,
   load balancer, cache, CDN, message queue), mỗi thành phần một chuyển động riêng.

## 03 Nhất quán hay khả dụng
1. Hai đại lý, một ghế: A bán, B thấy "hết" ngay (nhất quán mạnh). Avatar đổi, bạn bè thấy ảnh mới trễ vài giây
   (nhất quán cuối cùng).
2. Replication đồng bộ (chờ đủ máy) vs bất đồng bộ (trả lời ngay, bản sao trễ); máy chính tắt → failover.
3. Quorum: 5 bản sao, ghi chạm 3, đọc chạm 3, vùng giao nhau sáng lên; công thức W + R > N.
4. CAP: đường mạng giữa hai cụm đứt; nhánh C (một bên ngừng ghi) và nhánh A (hai bên cùng bán chiếc laptop cuối).

## 04 Chọn chỗ lưu dữ liệu
1. Bảng SQL có khóa ngoại và JOIN vs tài liệu NoSQL linh hoạt; ứng dụng chi tiêu dùng cả hai.
2. Sharding: chia theo khoảng (một shard đỏ rực), theo băm (đều), consistent hashing (vòng băm, thêm máy chỉ dời một
   đoạn), theo địa lý (bản đồ ba vùng).
3. Index: mục lục trỏ thẳng tới trang; thẻ code `CREATE INDEX (country, name)` và truy vấn chỉ theo name không dùng
   được index.

## 05 Mở rộng và tăng tốc
1. Load balancer chia khách: round robin (lần lượt), least connections (thanh tải từng máy), IP hash (một người luôn về
   một máy); tầng 4 đọc IP:port, tầng 7 đọc `/video/720p` và cookie.
2. Cache: đường đi lần hai ngắn hơn; luồng cache-aside (hit/miss), write-through, write-back (vạch "dirty").
3. Message queue: phiếu gọi món vào hàng, worker lấy ra; upload video trả lời ngay, worker chuyển định dạng phía
   sau; hàng dài ra → backpressure (cửa hàng đợi khép lại, thêm worker).

## 06 Gửi hai lần mà chỉ tính một
1. Yêu cầu chuyển tiền gửi lại vì mạng chập chờn; có idempotency key thì lần hai bị nhận ra và bỏ qua.
2. Khóa bi quan: ổ khóa trên bản ghi, người sau xếp hàng; khóa lạc quan: hai người cùng sửa, version 3 → 4, người cầm
   version 3 bị trả về làm lại (`UPDATE … WHERE version = 3`).

## 07 Các máy nói chuyện với nhau thế nào
1. HTTP hỏi–đáp, máy chủ không nhớ người gọi; thêm máy phía sau dễ dàng.
2. TCP: bắt tay ba bước SYN / SYN-ACK / ACK, gói đánh số, gói mất được gửi lại; UDP: gói bay liên tục, mất vài gói
   vẫn chạy (khung hình video call).
3. RPC: dòng code `getUserInfo(userId)` gọi sang máy khác như hàm nội bộ; REST: bảng `GET /tasks`, `POST /tasks`,
   `DELETE /tasks/123`.

## 08 Khi mọi thứ hỏng
1. Năm sự cố lần lượt đánh vào sơ đồ (ổ cứng, bug, đứt mạng, gõ nhầm lệnh, quá tải).
2. Dự phòng + health check (nhịp ping), máy không trả lời → failover; retry chờ 2 s, 4 s, 8 s; circuit breaker ngắt
   mạch; graceful degradation: tắt bình luận trực tiếp, video HD → thấp, phần lõi vẫn chạy.
3. HA vs FT: máy bay hai động cơ, một động cơ tắt vẫn bay; dòng thời gian MTBF (khoảng giữa hai lần hỏng) và MTTR
   (khoảng hồi phục).

## 09 Bảo mật nhiều lớp
1. Hai cánh cửa "Bạn là ai?" / "Bạn được làm gì?". Mật khẩu → băm + muối; OTP; session lưu trên máy chủ vs JWT ba phần
   header.payload.signature (payload đọc được).
2. RBAC vai trò, ABAC điều kiện (giờ làm việc), OAuth2 cấp access token thay cho mật khẩu.
3. Các lớp phòng thủ chồng lên nhau: rate limit, kiểm tra đầu vào, HTTPS, cookie Secure/HttpOnly/SameSite chặn XSS,
   CSRF.

## 10 Biết chuyện gì đang xảy ra
1. Bảng điều khiển: CPU, độ trễ, tỷ lệ lỗi; vượt ngưỡng thì đèn đỏ (monitoring).
2. Ba trụ cột: biểu đồ độ trễ nhảy 100 → 500 ms lúc 10:00 (metrics), dòng log lỗi (logs), trace A → B → C với đoạn C
   dài nhất (traces).
3. Đèn cảnh báo trên táp lô xe vs nắp capo mở, máy chẩn đoán đọc mã lỗi.

## 11 Khép lại
Ba cán cân đánh đổi lần lượt nghiêng: nhanh–chính xác, đơn giản–không ngừng, tiện–an toàn; lộ trình 10 chương sáng
lại một lần; ba bước "hỏi yêu cầu → vẽ khung → đi sâu".
