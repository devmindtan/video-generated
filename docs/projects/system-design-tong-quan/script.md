# Kịch bản — System Design: tóm tắt cả cuốn sách

Sách: *Hướng dẫn cách tiếp cận phỏng vấn System Design* (System Design), Nguyễn Thế Huy. Nguồn: hồ sơ
[research.md](../../../series/ngoai-kenh/chua-thuoc-series/books/system-design/research.md), trang PDF ghi trong
[sources.md](sources.md). Giọng: Minh Đức (VieNeu, lựa chọn 1). Mỗi dòng là một câu đọc; `[nghỉ]` là chỗ đổi ý.
Chữ trong ngoặc vuông sau dấu `→` là cách viết riêng cho giọng đọc (phụ đề vẫn giữ chữ gốc).

Kịch bản bám sát thứ tự 10 chương. Ví dụ đời thường và câu "nói khi phỏng vấn" đều lấy từ sách; lời kênh chỉ nối ý.

## 00 · Mở đầu (màn tên video chạy trên nhạc ~6 giây, rồi giọng vào)

Bốn mươi lăm phút, một cái bảng trắng, và một câu đề: hãy thiết kế cho tôi một ứng dụng chia sẻ ảnh.
Không có yêu cầu chi tiết. Không phải viết dòng code nào. Và cũng không có đáp án đúng.
Đó là vòng phỏng vấn System Design, và ở nhiều công ty lớn, kết quả vòng này quyết định cả chuyện bạn được nhận lẫn mức đãi ngộ. [nghỉ]
Video này tóm tắt cuốn System Design, một cuốn hướng dẫn cách đi qua vòng phỏng vấn đó.
Mình đi lần lượt mười chương của sách: từ khái niệm nền tảng, dữ liệu, mở rộng hệ thống, cho tới chịu lỗi, bảo mật và giám sát.
Phần nào cũng có một ví dụ đời thường như trong sách, và một ý bạn có thể nói ngay trong buổi phỏng vấn.

## 01 · Vòng phỏng vấn này chấm điều gì (PDF 6–10)

Trước hết, người phỏng vấn muốn thấy gì?
Bạn nhận một bài toán mở, chẳng hạn một dịch vụ nhắn tin hay một nền tảng xem phim.
Việc của bạn là vẽ ra các thành phần chính, cách chúng nói chuyện với nhau, và vì sao hệ thống chịu được lượng người dùng đặt ra. [nghỉ]
Người mới hay vấp ở mấy chỗ.
Câu hỏi quá mở nên không biết bắt đầu từ đâu.
Chưa từng làm hệ thống lớn, nên không rõ khi nào cần cache hay hàng đợi.
Chỉ có bốn lăm đến sáu mươi phút, dễ mải vẽ chi tiết mà quên ý chính.
Và nỗi ám ảnh phải đưa ra một thiết kế hoàn hảo. [nghỉ]
Theo sách, đa số người trượt vòng này vì thiếu một cách làm lặp lại được.
Một khung đơn giản: hỏi rõ yêu cầu, vẽ kiến trúc tổng quan, rồi đi sâu vào từng phần.
Người phỏng vấn chấm cách bạn đi tới đáp án, nhiều hơn chính đáp án.
Và trong lúc làm, hãy nghĩ thành tiếng, đừng im lặng quá lâu.

## 02 · Những viên gạch nền (PDF 11–21)

Chương hai đặt những viên gạch đầu tiên.
Độ trễ, latency, là thời gian một xe đi qua trạm thu phí.
Thông lượng, throughput, là số xe qua trạm trong một phút.
Hai con số này không đi cùng nhau: hệ thống có thể trả lời rất nhanh mà vẫn chỉ phục vụ được ít người. [nghỉ]
Khi quán phở đông khách, bạn có hai cách.
Mua nồi to hơn, thuê đầu bếp giỏi hơn: đó là mở rộng theo chiều dọc, nâng cấp chính cái máy chủ đang có.
Hoặc mở thêm quán: mở rộng theo chiều ngang, thêm máy chủ chạy song song.
Cách thứ hai thường được chọn, vì một quán đóng cửa thì quán khác vẫn bán. [nghỉ]
Tính khả dụng được đo bằng những con số chín.
Chín mươi chín phẩy chín chín phần trăm nghĩa là cứ mười nghìn phút, hệ thống chỉ được ngừng một phút.
Độ tin cậy đòi thêm một điều: không mất dữ liệu, không sai giao dịch. [nghỉ]
Rồi đến kiến trúc cấp cao, giống bản thiết kế tổng thể của một ngôi nhà, trước khi lo từng phòng.
Web server là lễ tân đón yêu cầu, application server là gian bếp xử lý nghiệp vụ, database là bộ nhớ lâu dài.
Đứng trước tất cả là load balancer chia việc.
Cache giữ sẵn bản sao dữ liệu hay dùng, CDN đặt nội dung gần người xem, còn message queue nhận việc để làm sau.

## 03 · Nhất quán hay khả dụng (PDF 21–33)

Chương ba nói về một cặp luôn kéo nhau: nhất quán và khả dụng.
Nhất quán mạnh nghĩa là ghi xong thì ai đọc cũng thấy giá trị mới.
Chuyến bay chỉ còn một ghế: đại lý A vừa bán, đại lý B phải thấy ngay là đã hết.
Nhất quán cuối cùng thì cho phép lệch một lúc: bạn đổi ảnh đại diện, vài giây sau mọi người mới thấy ảnh mới. [nghỉ]
Để có nhiều bản sao dữ liệu, người ta dùng replication.
Đồng bộ chặt thì chậm mà chắc, bất đồng bộ thì nhanh nhưng có lúc lệch.
Máy chính hỏng thì failover chuyển sang máy dự phòng. [nghỉ]
Quorum là một cách cân hai bên.
Với năm bản sao, ghi phải được ba máy xác nhận, đọc thì hỏi ba máy.
Chỉ cần số máy ghi cộng số máy đọc lớn hơn tổng số bản sao, hai nhóm luôn gặp nhau ở ít nhất một máy có dữ liệu mới. [nghỉ]
Và định lý CAP: khi mạng giữa các máy bị cắt, bạn phải chọn giữ nhất quán hoặc giữ khả dụng. → [Và định lý xê a pê: khi mạng giữa các máy bị cắt, bạn phải chọn giữ nhất quán hoặc giữ khả dụng.]
Hai cửa hàng dùng chung một kho mà mất liên lạc: hoặc ngừng bán một bên cho chắc, hoặc cứ bán và chấp nhận có thể bán trùng chiếc laptop cuối cùng.
Ngân hàng thường chọn nhất quán, mạng xã hội thường chọn khả dụng.
Sách gói lại ba điều: hiểu nhu cầu, biết đánh đổi, và giải thích mạch lạc.

## 04 · Chọn chỗ lưu dữ liệu (PDF 33–44)

Dữ liệu là trung tâm của hệ thống lớn.
SQL lưu thành bảng có cấu trúc chặt, mạnh ở giao dịch và JOIN, nhưng khó mở rộng ngang.
NoSQL linh hoạt hơn, thêm máy dễ hơn, đổi lại phải nhường bớt tính nhất quán tức thì.
Nhiều hệ thống dùng cả hai: SQL cho số dư và giao dịch, NoSQL cho nhật ký hoạt động. [nghỉ]
Khi một máy database thành nút thắt, ta chia dữ liệu ra nhiều máy, gọi là sharding.
Chia theo khoảng giá trị thì dễ truy vấn nhưng dễ lệch tải.
Chia theo hàm băm thì đều hơn, nhưng thêm máy phải tính lại, nên người ta dùng consistent hashing.
Còn có chia theo bảng tra, và chia theo vùng địa lý để dữ liệu ở gần người dùng.
Chọn sai khóa chia, một shard sẽ nóng rực trong khi các shard khác ngồi chơi. [nghỉ]
Index giống mục lục của cuốn sách: tra mục lục thay vì lật từng trang.
Nhưng index nào cũng làm việc ghi chậm đi, và với index nhiều cột, thứ tự cột quyết định nó có được dùng hay không. [nghỉ]
Khi trình bày, đi từ yêu cầu dữ liệu, chọn loại database có lý do, rồi nói trước kế hoạch khi người dùng tăng gấp mười.

## 05 · Mở rộng và tăng tốc (PDF 45–60)

Chương năm là ba công cụ mở rộng quen thuộc nhất.
Load balancer giống nhân viên điều phối ở ngân hàng, đưa từng khách tới quầy còn trống.
Round robin chia lần lượt, least connections đưa việc cho máy đang rảnh nhất, IP hash giữ một người dùng ở cùng một máy.
Load balancer tầng bốn chỉ nhìn địa chỉ và cổng nên rất nhanh.
Tầng bảy đọc được đường dẫn, cookie, nên chia việc thông minh hơn, đổi lại tốn tài nguyên hơn. [nghỉ]
Cache giống như lần thứ hai đi một con đường: bạn đã nhớ đường, nên đi nhanh hơn hẳn.
Cache có thể nằm ở trình duyệt, ở CDN, ở reverse proxy, trong ứng dụng hay cạnh database.
Phổ biến nhất là cache-aside: tìm trong cache trước, không có thì đọc database rồi cất vào cache.
Write-through ghi cả hai nơi cùng lúc, write-back ghi vào cache trước rồi mới đẩy xuống database sau.
Cái khó muôn thuở là biết lúc nào phải xóa bản cũ. [nghỉ]
Message queue thì giống tấm phiếu gọi món ở quán đông khách.
Producer đặt phiếu vào hàng đợi rồi đi tiếp, consumer lấy từng phiếu ra làm theo sức mình.
Người dùng tải video lên là có phản hồi ngay, còn việc chuyển định dạng để các worker chạy phía sau.
Khi phiếu dồn nhanh hơn sức bếp, hệ thống cần backpressure: chậm nhận lại, hoặc thêm người làm.

## 06 · Gửi hai lần mà chỉ tính một (PDF 60–62)

Mạng chập chờn, client gửi lại yêu cầu, và tiền bị trừ hai lần.
Idempotency là thuộc tính giúp gửi bao nhiêu lần thì kết quả cũng như một lần.
Cách hay dùng là gắn kèm một idempotency key cho mỗi yêu cầu chuyển tiền hay đặt hàng. [nghỉ]
Khi hai người cùng sửa một bản ghi, có hai kiểu khóa.
Khóa bi quan khóa bản ghi ngay từ đầu, người sau phải chờ: an toàn, nhưng dễ tắc và có thể kẹt cứng.
Khóa lạc quan để mọi người cùng sửa, mỗi bản ghi mang một số phiên bản.
Lúc lưu, ai cầm phiên bản cũ thì phải đọc lại và làm lại.
Ít xung đột thì dùng khóa lạc quan, còn tiền bạc thì sách nghiêng về khóa bi quan.

## 07 · Các máy nói chuyện với nhau thế nào (PDF 62–70)

HTTP là kiểu hỏi đáp quen thuộc của web, và nó không nhớ bạn là ai giữa hai lần gọi.
Chính vì không giữ trạng thái, thêm máy chủ phía sau rất dễ.
TCP bắt tay ba bước rồi mới gửi, đánh số từng gói, mất gói nào gửi lại gói đó.
UDP thì gửi là quên: nhanh, mất vài gói cũng kệ.
Gọi video hay chơi game chọn UDP, vì mất một khung hình còn hơn hình bị trễ. [nghỉ]
Giữa các dịch vụ nội bộ, RPC như gRPC cho phép gọi hàm ở máy khác như gọi hàm ngay trong code.
Nó nhanh, nhưng hai bên dính chặt vào cùng một giao diện.
Còn API mở ra bên ngoài thì REST là lựa chọn an toàn: mỗi tài nguyên một đường dẫn, mỗi thao tác một động từ HTTP.
Lấy danh sách công việc là GET, tạo mới là POST, xóa là DELETE.

## 08 · Khi mọi thứ hỏng (PDF 71–79)

Chương tám bắt đầu bằng một câu: mọi thứ có thể hỏng thì sẽ hỏng.
Ổ cứng chết, phần mềm có lỗi, mạng bị chia cắt, người vận hành gõ nhầm lệnh, hay lượng truy cập vượt dự tính. [nghỉ]
Cách chống đỡ đầu tiên là không để trứng vào một giỏ: thành phần nào quan trọng cũng phải có bản dự phòng.
Health check hỏi thăm từng máy vài giây một lần, máy không trả lời thì failover chuyển việc sang máy khác.
Lỗi tạm thời thì thử lại, nhưng mỗi lần chờ lâu gấp đôi, để không dồn thêm tải vào chỗ đang hỏng.
Lỗi kéo dài thì circuit breaker ngắt hẳn đường gọi.
Và khi buộc phải hy sinh, hãy tắt bớt tính năng phụ, hạ video từ HD xuống chất lượng thấp, giữ phần cốt lõi chạy tiếp. [nghỉ]
Sách phân biệt hai mức.
Sẵn sàng cao chấp nhận gián đoạn vài chục giây để đổi lấy sự đơn giản.
Chịu lỗi hoàn toàn thì như máy bay hai động cơ: hỏng một chiếc vẫn bay tiếp, nhưng chi phí cao hơn nhiều.
Đo bằng thời gian giữa hai lần hỏng, MTBF, và thời gian để hồi phục, MTTR.
Lý tưởng là lâu lắm mới hỏng, mà hỏng thì dậy rất nhanh.

## 09 · Bảo mật nhiều lớp (PDF 80–85)

Bảo mật bắt đầu bằng hai câu hỏi: bạn là ai, và bạn được làm gì.
Câu thứ nhất là xác thực: mật khẩu chỉ lưu dạng băm có thêm muối, có thêm mã OTP cho tài khoản quan trọng.
Session lưu trạng thái trên máy chủ, dễ thu hồi.
JWT thì tự mang thông tin, gọn cho nhiều dịch vụ, nhưng phần nội dung ai cũng đọc được, và bị lộ thì khó thu hồi. [nghỉ]
Câu thứ hai là phân quyền: RBAC chia theo vai trò, ABAC xét thêm thuộc tính như phòng ban hay giờ làm việc.
OAuth2 cho ứng dụng khác một access token thay vì đưa nó mật khẩu của bạn. [nghỉ]
Ở cửa API: giới hạn số lần gọi, kiểm tra mọi dữ liệu đầu vào, và không nhúng khóa bí mật vào ứng dụng phía người dùng.
Với dữ liệu: mọi kết nối đi qua HTTPS, cookie bật Secure, HttpOnly và SameSite để chặn XSS và CSRF.
Sách gọi chung là phòng thủ nhiều lớp: không một biện pháp nào đủ một mình.

## 10 · Biết chuyện gì đang xảy ra (PDF 86–93)

Chương cuối tách hai việc hay bị gộp làm một.
Monitoring cho biết chuyện gì đang xảy ra: CPU, độ trễ, tỷ lệ lỗi, vượt ngưỡng là báo động.
Observability giúp trả lời vì sao. [nghỉ]
Nó dựa vào ba trụ cột.
Metrics là những con số theo thời gian, như độ trễ bỗng nhảy từ một trăm lên năm trăm mili giây lúc mười giờ sáng.
Logs là nhật ký từng sự kiện, cho bạn biết lỗi xảy ra ở dòng nào.
Traces lần theo một yêu cầu qua nhiều dịch vụ, chỉ ra đúng chỗ đang làm chậm cả chuỗi. [nghỉ]
Sách ví monitoring như đèn cảnh báo trên xe hơi, còn observability là mở nắp capo, cắm máy chẩn đoán vào xem.

## 11 · Khép lại

Đọc hết mười chương, câu hỏi lặp lại nhiều nhất là: hệ thống này thật sự cần gì, và mình sẵn sàng trả giá nào để có nó.
Nhanh hay chính xác, đơn giản hay không bao giờ ngừng, tiện hay an toàn.
Sách nói rõ: người phỏng vấn không chờ một thiết kế hoàn hảo, họ chờ xem bạn suy nghĩ thế nào.
Nếu bạn đang chuẩn bị cho vòng này, hãy chọn một ứng dụng quen thuộc và thử đi lại đúng các bước trong video: hỏi yêu cầu, vẽ khung, rồi đi sâu từng phần.
Cảm ơn bạn đã nghe đến đây.
