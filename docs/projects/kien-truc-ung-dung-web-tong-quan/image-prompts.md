# Kế hoạch hình/animation từng cảnh (chưa có ảnh)

Video dài 16:9, 1920×1080, 30 fps, theme **Bản vẽ kỹ thuật** (`ban-ve-ky-thuat`) + style **Sơ đồ hệ thống động**
(`so-do-he-thong`). Mọi hình vẽ bằng code (`src/projects/kien-truc-ung-dung-web-tong-quan/Chapters.tsx`,
`src/looks/diagram-kit.tsx`, màu `themeOf`); không dùng ảnh tạo AI. Tài sản tĩnh duy nhất: bìa sách
`public/kien-truc-ung-dung-web-tong-quan/images/book-cover.jpg`.

## Cách vẽ (bản giải thích đơn giản, người dùng 2026-11-12)

- **Một hình lớn cho một ý.** Mỗi cảnh chỉ một sơ đồ ở giữa màn hình, tối đa 4–5 khối; chữ trên hình là vài từ (≥ 40 px),
  không câu dài, không danh sách chữ. Lời đọc giải thích, hình cho thấy.
- **Gần như không có code.** Không thẻ code nhiều dòng; tên class chỉ còn vài tên chính (Order, Repository, Clock) dưới
  dạng nhãn khối.
- **Bộ hình quen thuộc lặp lại xuyên suốt** để người xem nhận ra ngay: khối vàng **nghiệp vụ** (luật bán hàng), khối xanh
  **hạ tầng** (database, session, framework, email), **ổ cắm** (hợp đồng/interface) ở giữa hai bên, và **đơn hàng** là
  một tấm phiếu nhỏ chạy qua các khối.
- **Chuyển cảnh lần lượt**: cảnh cũ mờ hết rồi cảnh mới mới hiện, không bao giờ hai sơ đồ chồng lên nhau.
- Mỗi cảnh có hình ngay từ câu đầu; hình nằm trong vùng y 120–860, phụ đề ở dưới; không chữ nào đè viền, dây hay chữ
  khác (kiểm bằng công cụ đo chồng chữ trên toàn video trước khi gửi duyệt).

## Từng phần

- **00 Mở đầu.** Một khối "hàm đặt hàng" duy nhất, bên trong bốn dải màu (hỏi giá · tính tiền · ghi đơn · nhớ mã đơn).
  Ba yêu cầu thay đổi (đổi database, thêm API, viết test) bay tới, cả ba đều cắm vào cùng một khối, khối rung lên. Rồi
  khối tách đôi: **luật** (vàng) và **máy móc** (xanh); bìa sách và một câu tóm tắt.
- **01 Một hàm làm đủ mọi việc.** Bốn dải tách ra thành bốn khối; một khối vàng "nghiệp vụ", ba khối xanh "hạ tầng". Ba
  rắc rối diễn ra trên hình: test phải kéo cả database theo; đổi database thì vết sửa lan vào khối vàng; đơn số lượng 0
  lọt thẳng xuống database. Thanh thời gian 2 năm: các khối xanh thay mấy lần, khối vàng giữ nguyên.
- **02 Phép thử.** Một chiếc "máy chỉ có bộ nhớ + CPU" ở giữa; các đoạn code lần lượt được thả vào: chạy được → vào ô
  core, cần thứ bên ngoài → rơi sang ô hạ tầng. Ví dụ đồng hồ: logic hỏi giờ qua ổ cắm "Clock"; cắm đồng hồ thật, rút
  ra, cắm đồng hồ giả chỉ 23:59.
- **03 Đơn hàng tự giữ luật.** Bên trái: một mảng dữ liệu trơ (Transaction Script). Bên phải: tấm phiếu Order có "cửa
  kiểm tra"; bốn đơn thử đi vào, đơn sai bị chặn lại kèm lý do ngắn, đơn đúng đi qua và tự hiện tổng tiền. Mọi lối vào
  (web, API, test) đều đi qua một cửa. Entity (hai phiếu khác số = hai đơn) và value object (hai email giống nhau = một).
- **04 Nhà kho.** Order đưa phiếu cho một ổ cắm "Repository" với hai câu: "cất đơn" / "lấy đơn số…". Sau ổ cắm, lần lượt
  cắm kho MySQL, kho bộ nhớ (test), kho API; đơn hàng không đổi. Cuối cảnh: hàm đặt hàng ban đầu gọn lại thành năm bước.
- **05 Đọc khác với ghi.** Trang e-book nhận cả đối tượng e-book đầy đủ (kèm nút đổi giá, ẩn, đổi trạng thái) → đổi
  thành tấm thẻ chỉ có mã, tên, giá đã định dạng. CQRS (hai kho) hiện mờ rồi lùi đi; cách của sách: một database, đường
  đọc riêng.
- **06 Mỗi việc một service.** Controller phình to; tách ra khối "Đặt hàng" (Application Service) mà web, API, lệnh nền,
  test đều gọi. Phiếu yêu cầu (mã khách, sản phẩm, email) đi vào, các bước sáng lần lượt, hết hàng thì dừng đỏ, cuối
  cùng trả mã đơn. Khi test: cắm kho bộ nhớ và bộ gửi mail giả, đèn PASS.
- **07 Mũi tên vào trong.** Ba tầng chồng nhau có chỗ rò; rồi xếp lại thành ba vòng tròn đồng tâm: Domain · Application ·
  Infrastructure. Các mũi tên chỉ vào trong; một mũi tên thử đi từ trong ra bị gạch. Một chỗ khai báo duy nhất bật qua
  lại giữa "kho MySQL" và "kho bộ nhớ".
- **08 Ổ cắm USB.** Máy tính có cổng USB: chuột, bàn phím, ổ cứng thay nhau cắm. Chuyển thành lục giác nghiệp vụ với
  các cổng: bên trái cổng vào (web, API, dòng lệnh, test), bên phải cổng ra (lưu đơn, gửi thông báo). Mỗi cổng có adapter
  thật/giả thay nhau cắm. Mở rộng: cắm thêm adapter CSV, thêm database thứ hai, lõi không đổi.
- **09 Đừng làm quá, bắt đầu nhỏ.** Một màn hình đầy ổ cắm thừa (cái giá) → giữ lại chỉ chỗ hay đổi/khó test. Phép thử
  quay lại lần cuối; bốn bước nhỏ thành một vòng lặp.

## Caption
- Phụ đề một dòng, bám thời gian từng chữ của giọng (`captions.json`), đặt thấp dưới y ≈ 900; từ khóa vàng.
