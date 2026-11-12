# Kịch bản — Kiến trúc ứng dụng web: tóm tắt cả cuốn sách

Sách: *Kiến trúc ứng dụng web*, Nguyễn Thế Huy. Nguồn: hồ sơ [research.md](../../../series/ngoai-kenh/chua-thuoc-series/books/kien-truc-ung-dung-web/research.md),
trang PDF ghi trong [sources.md](sources.md). Giọng: Minh Đức (VieNeu, lựa chọn 1). Mỗi dòng là một câu đọc; `[nghỉ]`
là chỗ đổi ý. Chữ trong ngoặc vuông sau dấu `→` là cách viết riêng cho giọng đọc (phụ đề vẫn giữ chữ gốc).

Kịch bản đi theo bảy chương, cùng một chức năng đặt hàng được tách dần khỏi hạ tầng. Ví dụ và cách đặt vấn đề lấy từ
sách; lời kênh chỉ nối ý và đặt câu hỏi.

## 00 · Mở đầu (màn tên video chạy trên nhạc ~6,5 giây, rồi giọng vào)

Một controller đặt hàng e-book, gần ba mươi dòng.
Nó lấy giá từ database, nhân với số lượng, ghi vào bảng orders, rồi nhét mã đơn vào session.
Chạy đúng. [nghỉ]
Nhưng thử hỏi: nghiệp vụ tính tiền nằm ở đâu?
Nếu ngày mai đổi sang PostgreSQL, thêm một API JSON bên cạnh trang web, hay chỉ muốn viết một test cho phần tính tiền, bạn sẽ phải sửa những đâu? [nghỉ]
Cuốn Kiến trúc ứng dụng web trả lời đúng câu hỏi đó.
Sách kể một chức năng đặt hàng, rồi mổ nó ra từng lớp: tách nghiệp vụ khỏi database, khỏi framework, khỏi cách giao tiếp bên ngoài.
Mình sẽ đi qua bảy chương, giữ đúng một ví dụ xuyên suốt, và dừng ở những chỗ đáng lấy.
Thứ đáng mang về là một câu hỏi dùng được mỗi ngày: đoạn code này có chạy được một mình, trong bộ nhớ, không cần database, không cần framework không?

## 01 · Khi nghiệp vụ và hạ tầng nằm chung (PDF 3–11)

Bắt đầu bằng đúng đoạn code đó.
Hàm đặt hàng nhận request, gọi database lấy giá, nhân với số lượng, ghi vào bảng orders, rồi lưu mã đơn vào session.
Nhìn qua thì gọn. [nghỉ]
Nhưng trong cùng một hàm có đủ thứ: một câu SQL, một phép tính tiền, một quy ước lưu session, và cả cách trả về của framework.
Muốn test phần tính tiền, bạn phải dựng database.
Muốn đổi cách lưu đơn, bạn phải sửa một chỗ không hề nói gì về việc lưu trữ.
Và không ai kiểm tra email có đúng không, số lượng có lớn hơn không. [nghỉ]
Sách gọi phần này là code trộn lẫn.
Phần nghiệp vụ thật sự chỉ có một câu: đơn hàng này gồm gì, giá bao nhiêu.
Phần còn lại là hạ tầng: database, session, framework, thư viện.
Khi hai thứ dính vào nhau, có năm chuyện thường xảy ra.
Đọc code không thấy câu chuyện nghiệp vụ, chỉ thấy công nghệ.
Đổi công nghệ kéo theo sửa logic.
Test tự động khó, vì mỗi test phải mang theo cả môi trường.
Dữ liệu không được bảo đảm hợp lệ, vì chẳng có chỗ nào đứng ra kiểm tra.
Và code nhanh chóng thành thứ không ai dám sửa, tức là legacy. [nghỉ]
Ngược lại, khi tách được, lợi ích cũng rất cụ thể.
Code nghiệp vụ đọc như một câu chuyện: tạo đơn, kiểm tra, lưu.
Test chạy trong bộ nhớ, không cần dựng MySQL.
Đổi hạ tầng chỉ sửa đúng phần hạ tầng.
Và cả team có chung một quy ước: ai cũng biết code nào đặt ở đâu, người mới vào nắm nhanh hơn.
Theo tác giả, ứng dụng nào sống quá hai năm thì việc tách khỏi hạ tầng rất đáng làm, vì framework, database và dịch vụ ngoài đổi nhanh hơn nghiệp vụ.

## 02 · Ranh giới: core và hạ tầng (PDF 11–16)

Vậy lấy gì để biết một đoạn code là core hay hạ tầng?
Sách đưa một định nghĩa rất thực dụng: core code là code chạy được chỉ với bộ nhớ và CPU.
Không database, không gọi mạng, không đọc file, không đồng hồ hệ thống, không SMTP.
Quy tắc thứ nhất: không phụ thuộc trực tiếp vào hệ thống bên ngoài.
Quy tắc thứ hai: không cần môi trường đặc biệt. Không cần web server, không cần CLI, không cần framework, không cần biến POST hay session.
Thiếu một trong hai, nó là hạ tầng. [nghỉ]
Một hàm tính VAT là core.
Một đối tượng Order tự tính tổng tiền là core.
Một OrderService chỉ dùng entity và interface là core.
Còn câu SQL, lời gọi HTTP, đoạn đọc file, controller, Eloquent model: hạ tầng.
Có một cách nói dễ nhớ: hạ tầng là phần còn lại sau khi trừ core.
Và đừng nhầm thư mục với bản chất.
Cùng nằm trong thư mục Service, một file có thể là core, file bên cạnh có thể là hạ tầng.
Điều quyết định là nó có chạm vào thế giới bên ngoài hay không. [nghỉ]
Sách còn cảnh báo một cái bẫy: đặt interface lên trên hạ tầng không tự biến nó thành core.
Một interface Connection với hàm insert bảng và dữ liệu vẫn lộ nguyên khái niệm database.
Che bằng tên gọi không đủ; phải che bằng ý nghĩa nghiệp vụ.
Ví dụ dễ thấy nhất là đồng hồ.
Gọi thẳng thư viện thời gian ở giữa logic thì test nào cũng phụ thuộc giờ thật.
Sách thay bằng một interface Clock, còn bản gọi thư viện thời gian nằm ở ngoài, trong hạ tầng.
Khi test, bạn đưa vào một đồng hồ giả và chỉnh giờ tùy ý. [nghỉ]
Đó là toàn bộ tinh thần của chương này: tìm đúng đường ranh giới, rồi giữ nó bằng những thứ nhỏ như vậy.

## 03 · Domain Model: để đối tượng tự bảo vệ (PDF 16–25)

Sang chương ba, sách so hai cách viết cùng một nghiệp vụ.
Cách thứ nhất là Transaction Script: mọi bước nằm trong controller, dữ liệu chỉ là mảng, không ai giữ luật.
Cách thứ hai là Domain Model: dữ liệu và hành vi nằm chung trong đối tượng.
Ví dụ là entity Order.
Constructor nhận đủ bốn thứ: mã e-book, email, số lượng và đơn giá.
Nếu mã e-book nhỏ hơn hoặc bằng không, ném lỗi.
Nếu email sai định dạng, ném lỗi.
Nếu số lượng nhỏ hơn hoặc bằng không, ném lỗi.
Nếu giá âm, ném lỗi.
Và tổng tiền do chính Order tính, không phải controller tính. [nghỉ]
Điều quan trọng hơn mấy câu if: không có cách nào tạo ra một Order sai.
Mọi chỗ trong hệ thống muốn có đơn hàng, đều phải đi qua cái constructor đó.
Luật nghiệp vụ chỉ nằm một chỗ, thay vì rải khắp các controller. [nghỉ]
Sách phân biệt thêm entity và value object.
Entity có danh tính: hai đơn hàng khác id thì khác nhau, dù nội dung giống hệt.
Value object không có danh tính, so bằng giá trị, như một địa chỉ email hay một số tiền.
Địa chỉ email bọc trong value object được kiểm tra định dạng ngay lúc tạo.
Số tiền đi kèm đơn vị tiền tệ thì khó tính nhầm đơn vị.
Đó là cùng một ý: đặt luật vào nơi sinh ra giá trị. [nghỉ]
Nhưng đối tượng đẹp đến mấy vẫn cần được lưu.
Sách không để entity tự gọi database; việc lưu thuộc về một thành phần khác.

## 04 · Repository: kho của đối tượng nghiệp vụ (PDF 22–30)

Repository là một interface đứng về phía nghiệp vụ, mô tả việc lưu và lấy đối tượng.
Nó không nói bảng nào, cột nào, SQL ra sao.
Nó chỉ nói hai việc: lưu một đơn hàng và nhận lại mã đơn; đưa một mã đơn và nhận lại đơn hàng. [nghỉ]
Có một mẹo viết rất hay: cứ giả định thành phần mình cần đã tồn tại, rồi định nghĩa nó.
Trong controller, bạn muốn viết đúng một dòng: lưu đơn hàng này.
Vậy thì viết interface đúng như cách bạn muốn gọi.
Phần cài đặt để sau. [nghỉ]
Bản chạy thật dùng query builder, hoặc giấu một Eloquent model bên trong.
Bản dùng để test chỉ giữ đơn hàng trong bộ nhớ.
Sau này nếu đơn hàng phải lưu sang một hệ thống khác qua API, chỉ cần thêm một bản cài đặt nữa.
Controller không cần biết đang dùng cái nào. [nghỉ]
Sau khi tách, controller chỉ còn vài bước.
Lấy giá e-book qua một repository khác.
Tạo Order, và bắt lỗi nếu dữ liệu sai.
Lưu đơn qua repository.
Ghi mã đơn vào session.
Trả về trang tiếp theo.
Phần MySQL nằm gọn trong một lớp.
Phần nghiệp vụ là một đối tượng PHP thuần, không kế thừa framework, không gọi database.
Và mỗi phần có thể test riêng. [nghỉ]
Đó là lần tách đầu tiên trong sách, và các chương sau đều xây tiếp trên nó.

## 05 · Đọc và ghi không nhất thiết dùng chung một mô hình (PDF 30–33)

Đến chương bốn, sách chỉ ra một chỗ hay bị bỏ qua: phần đọc.
Thường thì ta lấy luôn entity dùng để ghi, đưa cho view.
Nhưng entity đó mang theo đủ phương thức đổi giá, ẩn sản phẩm, đổi trạng thái.
View chỉ cần hiển thị, lại cầm một đối tượng có thể thay đổi dữ liệu.
Lâu dần, class phình to vì phục vụ cả hai việc. [nghỉ]
Sách đề nghị tách read model.
Có thể là một lớp đọc riêng cho e-book, chỉ gồm mã, tên và giá, đi kèm một repository chỉ để đọc.
Cũng có thể nhẹ hơn: một interface chỉ có một hàm trả về giá của một e-book.
Cách nặng hơn là CQRS: lưu trữ đọc riêng, cập nhật qua domain event.
Sách không đẩy bạn vào đó, vì phải giữ nhất quán giữa hai kho.
Sách chọn cách đơn giản: chung database, chỉ tách repository đọc, kèm integration test để hai bên không hiểu lệch dữ liệu. [nghỉ]
Rồi đến view model.
Đây là một DTO được tạo đúng theo thứ màn hình cần.
View model của e-book có sẵn giá đã định dạng thành chuỗi tiền.
API danh sách đơn hàng thì trả về view model chỉ gồm mã đơn, ngày, tên khách và tổng tiền, lấy qua một repository riêng cho màn hình đó.
Nhờ vậy tầng hiển thị không phải biết cấu trúc dữ liệu bên trong của domain. [nghỉ]
Nguyên tắc gói lại một câu: đừng dùng một đối tượng có thể thay đổi và có logic phức tạp cho việc chỉ đọc.
Đọc thì trả đúng thứ cần đọc.

## 06 · Application Service và Command (PDF 33–38)

Chương năm xử lý một chỗ phình khác: controller.
Lý do controller phình rất dễ hiểu: nó là nơi duy nhất ai cũng nhét use case vào.
Sách tách use case ra thành Application Service.
Một service điều phối đúng một use case, và gọi được từ web, từ CLI, từ job, hay từ test.
Đầu vào được gói thành Command.
Ví dụ lệnh đặt hàng gồm mã khách, danh sách sản phẩm và email.
Service đặt hàng có một hàm nhận lệnh đó và trả về mã đơn. [nghỉ]
Bên trong service làm những việc của nghiệp vụ.
Lấy sản phẩm.
Kiểm tra tồn kho, hết hàng thì báo lỗi.
Tính tiền.
Xin một mã đơn mới.
Tạo Order.
Lưu.
Controller chỉ còn hai việc: đổi request thành command, và trả response. [nghỉ]
Chương này cũng nhắc cách đưa các phụ thuộc vào service.
Truyền chúng qua constructor, thay vì để service tự đi lấy từ container của framework.
Như vậy service không dính vào container toàn cục.
Và khi test, bạn truyền thẳng bản giả vào. [nghỉ]
Và lợi ích đo được nằm ở test.
Test service đặt hàng chỉ cần một repository trong bộ nhớ và một bản giả của phần gửi mail.
Không cần framework, không cần database, không cần mạng.
Test dễ viết thì đội ngũ mới tự tin sửa code.

## 07 · Ba tầng và luật phụ thuộc một chiều (PDF 38–48)

Chương sáu lùi lại nhìn toàn bộ hệ thống.
Cách chia cũ là ba tầng: giao diện, nghiệp vụ, truy cập dữ liệu.
Nó vẫn hữu ích: biết đặt code ở đâu, đổi một tầng thì ít đụng tầng khác.
Nhưng nó có hai rủi ro.
Logic rò rỉ giữa các tầng, và chỉ có kỷ luật con người mới ngăn được.
Còn chia quá nhiều tầng thì thành mã lasagna, lớp chồng lên lớp, khó lần theo luồng xử lý. [nghỉ]
Sách đề nghị ba tầng theo hướng nghiệp vụ đứng giữa.
Domain: entity, aggregate, value object, domain service, domain event, interface repository, factory.
Tầng này không import framework.
Application: use case handler, command, query, transaction; sách gọi là lớp keo.
Infrastructure: framework, ORM, adapter gọi dịch vụ ngoài, phần cài đặt interface.
Tầng này test kiểu integration. [nghỉ]
Điểm cốt lõi là Dependency Rule: phụ thuộc chỉ được hướng vào trong.
Giao diện biết Application.
Application biết Domain.
Infrastructure cũng trỏ vào Domain, nhưng Domain không biết ai đang cài đặt mình.
Domain không tự gọi ra ngoài; sách gọi đó là Hollywood Principle: đừng gọi chúng tôi, chúng tôi sẽ gọi bạn. [nghỉ]
Nối các tầng bằng một service provider.
Service provider khai báo: chỗ nào cần repository đơn hàng thì đưa bản dùng Eloquent.
Khi chạy thật, container đưa bản Eloquent.
Khi test, đưa bản trong bộ nhớ.
Luồng đặt hàng đi như sau: request vào controller, controller gọi handler, handler lưu đơn qua repository, phát sự kiện đơn đã đặt, rồi một listener gửi email.
Mỗi mũi tên đều đi vào trong, không có mũi tên nào từ Domain trỏ ra database. [nghỉ]
Nhưng sách cũng nhắc: không phải việc gì cũng cần nhiều lớp.
Việc rất đơn giản thì gộp bớt cho đỡ rối.
Những module phức tạp, nằm ở lõi hệ thống, mới đáng chia đủ ba tầng.

## 08 · Ports and Adapters: lõi ở giữa, mọi thứ cắm vào (PDF 48–59)

Chương bảy đưa cách nhìn cuối cùng: Hexagonal Architecture.
Alistair Cockburn đề xuất năm 2005.
Cái tên lục giác chỉ là ẩn dụ; không có nghĩa là hệ thống phải có sáu cạnh.
Hình dung một cổng USB.
Lõi máy không biết bạn cắm chuột, bàn phím hay ổ cứng.
Nó chỉ biết một chuẩn cắm.
Port là chuẩn đó; adapter là từng thiết bị cụ thể. [nghỉ]
Sách chỉ ra những chỗ phân lớp còn chưa giải quyết.
Phụ thuộc vẫn có thể nằm ngầm.
Thêm một kênh mới, ví dụ CLI, vẫn phải sửa nhiều.
Test tầng application vẫn có thể chậm nếu khởi động framework.
Và tích hợp với hệ thống khác dễ làm bẩn domain. [nghỉ]
Hexagonal tách hai loại port.
Port đầu vào là cách thế giới gọi vào lõi: UI, API, CLI, bộ test.
Port đầu ra là cách lõi gọi ra ngoài: lưu trữ, gửi thông báo, dịch vụ bên thứ ba.
Cả hai đều là interface nằm trong core.
Adapter là code cụ thể ở Infrastructure.
Và mỗi port nên có ít nhất một adapter thật, một adapter giả cho test.
Theo sách, Cockburn đề xuất mô hình này trước hết để test cho dễ. [nghỉ]
Cách áp dụng có bốn bước.
Xác định port.
Định nghĩa interface trong core.
Viết adapter.
Nối bằng dependency injection. [nghỉ]
Ví dụ trong sách.
Lưu đơn hàng là một port, với hai adapter: Eloquent khi chạy thật, bộ nhớ khi test.
Gửi xác nhận đơn là port thứ hai: một adapter gửi email thật, một adapter chỉ ghi log khi test.
Một service provider nối mỗi port với adapter cần dùng.
Test use case đặt hàng chỉ cần hai adapter giả, không cần khởi động Laravel. [nghỉ]
Sách còn mở rộng.
Thêm lệnh nhập đơn từ file CSV: đọc file là một adapter mới, phần xử lý đơn vẫn là lõi cũ.
Lưu hai database song song: hai adapter cùng một port.
Hai phân hệ như đặt hàng và khách hàng nói chuyện qua một port, thay vì gọi thẳng vào database của nhau. [nghỉ]
Cái giá cũng được nói rõ.
Nhiều interface và class hơn.
Cần quy ước đặt tên, nếu không sẽ rối.
Và đừng trừu tượng hóa mọi thứ.
Chỉ tách ở chỗ dễ thay đổi hoặc khó test.

## 09 · Khép lại

Đọc hết bảy chương, câu hỏi quay lại rất đơn giản.
Đoạn code này có chạy được một mình, trong bộ nhớ, không cần gì bên ngoài không?
Nếu có, nó là nghiệp vụ, và nên được giữ sạch.
Nếu không, nó là hạ tầng, và nên bị đẩy ra rìa sau một interface.
Bạn không cần biến cả dự án thành hexagonal trong một tuần.
Chọn một use case thật.
Tách một phụ thuộc khó test nhất.
Viết một test chạy không cần database.
Rồi lặp lại. [nghỉ]
Sách không hứa code sẽ chạy nhanh hơn.
Điều sách hứa khiêm tốn hơn: khi yêu cầu đổi, bạn biết phải sửa ở đâu.
Và đó thường là thứ đắt nhất trong một hệ thống sống đủ lâu.
Cảm ơn bạn đã nghe đến đây.
