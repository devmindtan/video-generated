# Ví dụ: thanh toán bằng mã QR

Ví dụ xuyên suốt chương 2 của sách (PDF tr. 12–16), viết lại gọn để thấy bốn tầng nối với nhau thế nào. Con số là ví
dụ minh họa của tác giả.

## Từ user story đến khoảng trống

User story: khách muốn quét mã QR để trả tiền cho nhanh. Nghe đủ, nhưng code phải chọn: mã sống bao lâu (5 hay 15
phút)? Tiền về muộn sau khi mã hết hạn thì sao? Khách chuyển sai số tiền thì sao? Thông báo từ cổng thanh toán đến chậm
hoặc đến hai lần thì sao? Nếu spec im lặng, AI sẽ tự chọn.

## BR

- Mục tiêu: tăng tỷ lệ khách mới hoàn tất thanh toán từ khoảng 62% lên 80% trong một quý.
- Chỉ số đo trên nhóm khách mới: số đơn đã trả / số lần bắt đầu thanh toán.
- Ngoài phạm vi: khách cũ (để một BR sau), thanh toán quốc tế.

## UC: đặt hàng và trả bằng QR

- Tác nhân: khách hàng (đã hoặc chưa đăng nhập); cổng thanh toán gửi webhook.
- Sự kiện khởi đầu: khách bấm thanh toán QR ở giỏ hàng.
- Luồng chính: tạo mã QR chứa mã đơn, số tiền, hạn dùng → hiện mã kèm đồng hồ đếm ngược → khách quét bằng app ngân hàng
  → hệ thống nhận webhook từ cổng thanh toán → xác nhận đơn, gửi email và thông báo.
- Luồng khác: khách chưa đăng nhập → chuyển sang đăng nhập nhanh (một UC khác); webhook về chậm quá 30 giây → hiện "đang
  xác nhận".
- Ngoại lệ: mã quá 15 phút → báo hết hạn, mời tạo mã mới; số tiền không khớp → tự hoàn tiền và ghi sự cố; sau 30 phút
  vẫn không có webhook → đơn chuyển sang chờ kiểm tra thủ công.

## Entity Model

- `Order`: nháp, chờ thanh toán, đã thanh toán, đã hủy, chờ kiểm tra thủ công.
- `OrderItem`: một dòng trong đơn.
- `Payment`: đang chờ, thành công, thất bại, đã hoàn.
- `QRSession`: hết hạn sau 15 phút; một đơn có thể có nhiều phiên nếu khách tạo lại mã.

 Không có kiểu cột hay index: đó là việc của thiết kế kỹ thuật.

## AC

- AC-1 tạo mã: Given đơn đang chờ thanh toán, When khách chọn QR, Then tạo phiên QR hết hạn sau 15 phút và trả về ảnh mã kèm đồng hồ.
- AC-2 trả thành công: Given phiên QR còn hạn, When cổng báo đã nhận đủ tiền, Then đơn chuyển sang đã thanh toán, And email
  xác nhận được gửi trong vòng 10 giây.
- AC-3 tiền về muộn: Given phiên QR đã hết hạn, When cổng báo nhận tiền, Then tạo lệnh hoàn tiền, đơn giữ trạng thái chờ
  thanh toán và ghi một sự cố.

Mỗi AC thành ít nhất một test có tên chứa `UC-xxx` và `AC-n`.
