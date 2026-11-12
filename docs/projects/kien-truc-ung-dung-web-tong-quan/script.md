# Kịch bản — Kiến trúc ứng dụng web: tóm tắt cả cuốn sách

Sách: *Kiến trúc ứng dụng web*, Nguyễn Thế Huy. Nguồn: hồ sơ [research.md](../../../series/ngoai-kenh/chua-thuoc-series/books/kien-truc-ung-dung-web/research.md),
trang PDF ghi trong [sources.md](sources.md) và ở tiêu đề từng phần. Giọng: Minh Đức (VieNeu, lựa chọn 1). Mỗi dòng là
một câu đọc; `[nghỉ]` là chỗ đổi ý. Chữ trong ngoặc vuông sau dấu `→` là cách viết riêng cho giọng đọc (phụ đề vẫn giữ
chữ gốc).

Cách kể (người dùng 2026-11-12: "bản chất là phải tóm tắt được cuốn sách sau đó làm ra 1 video giải thích 1 cách đơn
giản nhất"; 12–15 phút, gần như không có code): video đi theo ý, không theo chương. Cả cuốn gói vào một ý: **tách luật
của việc kinh doanh (nghiệp vụ) khỏi máy móc chạy nó (hạ tầng)**; mỗi phần sau là một bước của ý đó, cùng một ví dụ
xuyên suốt của sách là đặt mua e-book. Ví dụ, thuật ngữ và lập luận lấy từ sách; so sánh đời thường (hợp đồng, nhà kho,
phiếu yêu cầu) là lời kênh để dễ hiểu, không gán cho sách.

## 00 · Mở đầu (màn tên video chạy trên nhạc ~6,5 giây, rồi giọng vào; PDF 3–4)

Bạn mở hàm đặt mua e-book của một trang web bán sách.
Khoảng ba mươi dòng.
Trong đó có câu hỏi database giá bao nhiêu, phép nhân ra tiền, lệnh ghi đơn vào bảng, và một dòng cất mã đơn vào session.
Nó chạy đúng. [nghỉ]
Rồi tuần sau phải đổi sang database khác.
Tháng sau phải làm thêm một API để ứng dụng khác gọi vào đặt hàng.
Và ai đó hỏi: phần tính tiền đã có test chưa? [nghỉ]
Cả ba việc đều đụng vào đúng cái hàm ba mươi dòng ấy.
Cuốn Kiến trúc ứng dụng web viết ra để gỡ đúng tình huống này.
Gói cả cuốn sách lại, chỉ còn một ý.
Tách luật của việc kinh doanh ra khỏi máy móc chạy nó.
Luật thì sống lâu, còn máy móc thì thay liên tục. [nghỉ]
Mình sẽ đi qua ý đó từng bước, với đúng một ví dụ của sách: đặt mua một cuốn e-book.

## 01 · Một hàm làm đủ mọi việc (PDF 3–11)

Nhìn kỹ hàm đặt hàng đó, nó đang làm bốn việc khác nhau.
Hỏi database giá bao nhiêu.
Tính tiền.
Ghi đơn vào bảng.
Và nhớ mã đơn cho trang tiếp theo. [nghỉ]
Chỉ có một việc thật sự là chuyện của cửa hàng: đơn này gồm gì, giá bao nhiêu, tổng bao nhiêu.
Sách gọi phần đó là nghiệp vụ.
Ba việc còn lại là đồ nghề để chạy nó: database, session, framework.
Sách gọi chúng là hạ tầng. [nghỉ]
Khi hai thứ dính vào nhau, rắc rối đến rất nhanh.
Muốn kiểm tra phép tính tiền, bạn phải bật cả database lên.
Đổi database, bạn phải sửa ngay giữa chỗ tính tiền.
Không có chỗ nào đứng ra chặn một đơn hàng có số lượng bằng không.
Lâu dần, đọc code chỉ thấy công nghệ, không thấy câu chuyện bán hàng.
Và chẳng ai dám sửa nữa. [nghỉ]
Theo tác giả, ứng dụng nào sống quá hai năm thì việc tách này rất đáng làm.
Vì framework, database và dịch vụ bên ngoài thay nhanh hơn nhiều so với luật bán hàng.

## 02 · Phép thử: chạy được một mình không? (PDF 11–16)

Vậy làm sao biết một đoạn code thuộc phía nào?
Sách đưa ra một phép thử rất gọn.
Đoạn code này có chạy được chỉ với bộ nhớ và CPU không?
Không database, không gọi mạng, không đọc file, không hỏi giờ hệ thống, không cần web server hay framework.
Chạy được, nó là phần lõi, sách gọi là core.
Cần bất cứ thứ gì bên ngoài, nó là hạ tầng. [nghỉ]
Hàm tính thuế VAT chạy được một mình, vậy là core.
Câu lệnh SQL, lời gọi sang một API khác, controller nhận request: đều cần thế giới bên ngoài, vậy là hạ tầng.
Phép thử này nhìn vào việc code làm, không nhìn tên thư mục.
Hai file nằm cạnh nhau trong cùng một thư mục, một file là core, file kia vẫn có thể là hạ tầng. [nghỉ]
Có một ví dụ nhỏ mà rất đáng nhớ: giờ hiện tại.
Nếu luật bán hàng hỏi thẳng đồng hồ của máy, mọi bài test đều phụ thuộc vào giờ thật lúc chạy.
Sách cho logic hỏi giờ qua một interface tên là Clock.
Interface ở đây giống một bản hợp đồng: chỉ nói cần gì, không nói lấy từ đâu.
Chạy thật thì cắm đồng hồ của máy vào.
Khi test thì cắm một đồng hồ giả, chỉnh mấy giờ cũng được. [nghỉ]
Hợp đồng ở giữa, đồ thật cắm vào sau.
Ý này sẽ quay lại suốt phần còn lại của cuốn sách.

## 03 · Để đơn hàng tự giữ luật (PDF 16–22)

Giờ tới chính phần nghiệp vụ: viết nó thế nào?
Cách quen tay là viết một mạch từ trên xuống: lấy giá, tính tiền, gom dữ liệu vào một mảng, rồi lưu.
Sách gọi cách đó là Transaction Script.
Dữ liệu chỉ là một cái mảng, chẳng ai giữ luật cho nó. [nghỉ]
Sách chọn cách khác: để đơn hàng tự giữ luật của mình.
Đơn hàng trở thành một đối tượng, gọi là entity Order.
Lúc được tạo ra, nó tự kiểm tra: mã e-book phải hợp lệ, email phải đúng định dạng, số lượng phải lớn hơn không, giá không được âm.
Sai một điều, nó từ chối ra đời.
Tổng tiền cũng do chính nó tính. [nghỉ]
Điều đáng giá nhất nằm ở đây: trong cả hệ thống, không còn cách nào tạo ra một đơn hàng sai.
Từ trang web, từ API hay từ bài test, ai muốn có đơn hàng cũng phải đi qua đúng một cửa ấy.
Luật nằm một chỗ, thay vì chép rải rác khắp các controller. [nghỉ]
Sách còn phân biệt hai loại đối tượng.
Entity là thứ có danh tính: hai đơn hàng giống hệt nhau nhưng khác mã thì vẫn là hai đơn.
Value object chỉ là một giá trị: hai địa chỉ email giống nhau là một.
Gói email vào value object, nó được kiểm tra định dạng ngay lúc tạo.
Gói số tiền kèm đơn vị tiền tệ, sẽ khó cộng nhầm đồng với đô.
Cả hai cùng một tinh thần: đặt luật ở đúng nơi giá trị sinh ra.

## 04 · Nhà kho cho đơn hàng: Repository (PDF 22–30)

Đơn hàng đã tự giữ luật, nhưng vẫn phải được lưu lại.
Sách không cho đơn hàng tự gọi database.
Việc lưu giao cho một thứ gọi là repository.
Cứ hình dung nó như một nhà kho. [nghỉ]
Phía nghiệp vụ chỉ nói với nhà kho hai câu: cất đơn này giúp tôi, và đưa tôi đơn số mấy.
Không nói bảng nào, cột nào, câu SQL nào.
Hai câu đó được viết thành một interface, một bản hợp đồng đặt ở phía nghiệp vụ.
Sách có một mẹo: viết dòng mình muốn gọi trước, như thể nhà kho đã có sẵn, rồi mới định nghĩa nó. [nghỉ]
Sau đó mới tới các nhà kho cụ thể.
Kho chạy thật cất đơn vào MySQL.
Kho dùng khi test chỉ giữ đơn trong bộ nhớ, không cần bật database.
Sau này cần cất sang một hệ thống khác qua API, chỉ việc thêm một kho nữa.
Phía nghiệp vụ không cần biết đang dùng kho nào. [nghỉ]
Sau lần tách này, hàm đặt hàng ban đầu gọn hẳn: lấy giá, tạo đơn hàng, cất vào kho, nhớ mã đơn, chuyển trang.
Mọi câu SQL nằm gọn trong một chỗ.
Đơn hàng là code thuần, không dính framework.
Và mỗi bên test riêng được.
Đây là lần tách đầu tiên, và các chương sau đều xây tiếp trên nó.

## 05 · Đọc khác với ghi (PDF 30–33)

Có một chỗ hay bị bỏ quên: lúc chỉ cần đọc.
Trang chi tiết e-book chỉ cần mã, tên và giá.
Nhưng thường ta đưa luôn đối tượng e-book đầy đủ, kèm cả các hàm đổi giá, ẩn sản phẩm, đổi trạng thái.
Trang hiển thị chỉ cần nhìn, lại được cầm cả quyền sửa.
Và cái class ấy phình dần, vì phải phục vụ cả hai việc. [nghỉ]
Sách tách phần đọc ra riêng: một mô hình chỉ để đọc, mang đúng mã, tên và giá, lấy qua một kho chỉ để đọc.
Màn hình cần gì thì đưa đúng thứ đó, ví dụ giá đã định dạng sẵn thành chuỗi tiền.
Có một cách nặng hơn tên là CQRS, tách hẳn hai kho cho đọc và ghi.
Sách không đẩy bạn tới đó, vì giữ hai kho khớp nhau là cả một việc.
Sách chọn cách nhẹ: vẫn chung một database, chỉ tách đường đọc, và có test để hai bên không hiểu lệch dữ liệu. [nghỉ]
Gói lại một câu: đọc thì trả đúng thứ cần đọc.

## 06 · Mỗi việc một service (PDF 33–38)

Quay lại controller.
Nó vẫn có xu hướng phình ra, vì đó là chỗ ai cũng tiện tay nhét thêm việc vào.
Sách tách mỗi việc của người dùng, như đặt hàng, thành một service riêng, gọi là Application Service.
Một service làm đúng một việc, và ai cũng gọi được: trang web, API, một lệnh chạy nền, hay bài test. [nghỉ]
Đầu vào được gói thành một phiếu yêu cầu, sách gọi là command: mã khách, các sản phẩm, email.
Service nhận phiếu, rồi làm lần lượt: lấy sản phẩm, kiểm tra còn hàng, tính tiền, tạo đơn, cất vào kho.
Hết hàng thì báo lỗi.
Xong việc, nó trả lại mã đơn.
Controller chỉ còn hai việc: đổi yêu cầu từ web thành phiếu, và trả kết quả về. [nghỉ]
Những thứ service cần, như nhà kho hay bộ gửi mail, được đưa vào từ bên ngoài lúc tạo service, thay vì để nó tự đi lấy.
Nhờ vậy khi test, bạn đưa vào một kho trong bộ nhớ và một bộ gửi mail giả.
Bài test đặt hàng chạy được mà không cần framework, không cần database, không cần mạng.
Test dễ viết thì người ta mới dám sửa code.

## 07 · Mũi tên chỉ hướng vào trong (PDF 38–48)

Bây giờ lùi lại nhìn cả hệ thống.
Cách chia quen thuộc là ba tầng chồng lên nhau: giao diện ở trên, nghiệp vụ ở giữa, dữ liệu ở dưới.
Cách đó giúp biết đặt code ở đâu.
Nhưng logic vẫn dễ rò từ tầng này sang tầng khác.
Còn chia quá nhiều lớp thì thành mã lasagna, lớp chồng lớp, khó lần theo. [nghỉ]
Sách xếp lại thành ba vòng, nghiệp vụ nằm ở chính giữa.
Vòng trong cùng là Domain: đơn hàng, giá trị, luật bán hàng.
Vòng này không dùng tới framework.
Vòng giữa là Application: các service cho từng việc, như lớp keo nối mọi thứ lại.
Vòng ngoài là Infrastructure: framework, database, gửi mail, và các nhà kho cụ thể. [nghỉ]
Chỉ có một luật, gọi là Dependency Rule: mũi tên phụ thuộc chỉ được chỉ vào trong.
Vòng ngoài biết vòng trong.
Vòng trong không biết gì về vòng ngoài.
Nhà kho MySQL ở ngoài làm theo hợp đồng của Domain, còn Domain không cần biết ai đang làm việc đó.
Sách gọi tinh thần này là Hollywood Principle: đừng gọi chúng tôi, chúng tôi sẽ gọi bạn. [nghỉ]
Các vòng được ráp lại ở một chỗ khai báo duy nhất.
Chạy thật thì đưa kho MySQL, chạy test thì đưa kho trong bộ nhớ.
Và sách cũng nhắc: không phải việc gì cũng cần đủ ba vòng.
Việc đơn giản thì gộp lại cho đỡ rối, chỉ phần lõi phức tạp mới đáng chia đủ.

## 08 · Ổ cắm USB: Ports and Adapters (PDF 48–59)

Chương cuối đưa một cách nhìn gọn hơn nữa: Hexagonal Architecture.
Alistair Cockburn đề xuất nó năm 2005.
Hình lục giác chỉ là cách vẽ, hệ thống không cần có sáu cạnh.
Hãy nghĩ tới cổng USB trên máy tính.
Máy không cần biết bạn cắm chuột, bàn phím hay ổ cứng.
Nó chỉ biết một chuẩn cắm. [nghỉ]
Phần nghiệp vụ là cái máy ở giữa.
Các chuẩn cắm gọi là port.
Mỗi thiết bị cụ thể cắm vào gọi là adapter.
Có port để thế giới gọi vào: trang web, API, dòng lệnh, bài test.
Và có port để lõi gọi ra: lưu đơn, gửi thông báo, gọi dịch vụ bên ngoài. [nghỉ]
Trong ví dụ của sách, lưu đơn là một port, cắm được hai adapter: MySQL khi chạy thật, bộ nhớ khi test.
Gửi xác nhận đơn là port thứ hai: một adapter gửi email thật, một adapter chỉ ghi log khi test.
Nên bài test đặt hàng chỉ cần hai adapter giả, không phải khởi động Laravel.
Theo sách, Cockburn nghĩ ra mô hình này trước hết để test cho dễ. [nghỉ]
Cái hay lộ ra khi cần mở rộng.
Muốn nhập đơn từ file CSV: viết thêm một adapter đọc file, lõi đặt hàng giữ nguyên.
Muốn lưu song song hai database: thêm một adapter nữa cho cùng một port.
Phần đặt hàng cần nói chuyện với phần khách hàng: đi qua một port, không chọc thẳng vào database của nhau. [nghỉ]
Cách áp dụng có bốn bước: tìm các port, viết hợp đồng cho chúng ở phía lõi, viết adapter, rồi ráp lại ở một chỗ.

## 09 · Đừng làm quá, bắt đầu nhỏ (PDF 57–60)

Cái giá cũng có, và sách nói thẳng.
Nhiều interface hơn, nhiều class hơn.
Không có quy ước đặt tên thì sẽ rối.
Và đừng trừu tượng hóa mọi thứ: chỉ tách ở chỗ hay thay đổi hoặc khó test. [nghỉ]
Nếu chỉ nhớ một điều từ cuốn sách, hãy nhớ phép thử này.
Đoạn code này có chạy được một mình, trong bộ nhớ, không cần gì bên ngoài không?
Có, thì giữ nó sạch ở giữa.
Không, thì đẩy nó ra rìa, đứng sau một bản hợp đồng. [nghỉ]
Không cần đập đi làm lại cả dự án.
Chọn một việc thật, như đặt hàng.
Tách ra một phụ thuộc khó test nhất.
Viết một bài test chạy không cần database.
Rồi làm tiếp việc sau. [nghỉ]
Sách không hứa code sẽ chạy nhanh hơn.
Điều sách hứa khiêm tốn hơn: khi yêu cầu thay đổi, bạn biết phải sửa ở đâu.
Cảm ơn bạn đã nghe đến đây.
