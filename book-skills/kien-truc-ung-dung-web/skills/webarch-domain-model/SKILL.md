---
name: webarch-domain-model
description: Thiết kế lớp nghiệp vụ của ứng dụng web theo Domain Model - entity tự giữ luật và tự kiểm tra dữ liệu khi được tạo, value object bất biến (Money, EmailAddress, OrderId), repository là interface do domain định nghĩa và được hiện thực ở hạ tầng (SQL, ORM, bộ nhớ, API), cùng read model và view model tách khỏi entity ghi. Dùng khi tạo model/entity mới, khi thấy logic nghiệp vụ nằm rải trong controller hoặc trong câu SQL, khi entity của ORM bị dùng khắp nơi, khi cần màn hình đọc dữ liệu mà không muốn đụng entity ghi, hoặc khi người dùng hỏi về entity, value object, repository pattern, transaction script, anemic model, CQRS đơn giản. English triggers - domain model, entity invariants, value object, repository pattern, read model, view model, DTO, transaction script vs domain model, Active Record leakage.
---

# Domain model, repository, read model

Luật nghiệp vụ nên sống trong đối tượng nghiệp vụ, không rải trong controller hay câu SQL. Đối tượng giữ luật, kho lưu
trữ giấu sau một interface, và đường đọc dữ liệu đi riêng khỏi đường ghi.

## Transaction script và domain model

- **Transaction script**: một hàm thủ tục làm lần lượt các bước (đọc, tính, ghi). Đủ tốt cho việc đơn giản.
- **Domain model**: dữ liệu và hành vi ở cùng một đối tượng, đối tượng tự bảo vệ trạng thái. Chọn khi có luật thật, khi
  cùng một luật cần ở nhiều nơi, hoặc khi luật hay đổi.

## Entity: tự giữ luật

- Có danh tính (ID) và vòng đời, trạng thái đổi theo thời gian.
- Nhận **đủ dữ liệu bắt buộc khi tạo** và từ chối dữ liệu sai ngay lúc đó (ném lỗi nghiệp vụ). Không có đối tượng "nửa
  vời" thiếu email hay chưa tính tiền.
- Tự tính các giá trị dẫn xuất (tổng tiền = đơn giá × số lượng) và lưu lại những gì cần giữ nguyên dù dữ liệu gốc đổi về
  sau (đơn giá tại thời điểm mua).
- Đổi trạng thái qua phương thức mang tên nghiệp vụ (`markPaid()`, `cancel(reason)`), không qua setter tự do.
- Tạo qua factory/hàm tĩnh có tên (`Order.place(...)`) khi cần ID mới hoặc nhiều cách tạo.

## Value object: giá trị bất biến

So sánh bằng giá trị, không có danh tính, không đổi sau khi tạo, tự kiểm tra khi tạo: `EmailAddress`, `Money` (số nguyên
đơn vị nhỏ nhất + loại tiền, không dùng float), `Quantity`, `DateRange`, `OrderId`. Dùng thay kiểu nguyên thủy để
luật nằm ở một chỗ.

## Repository: kho do domain định nghĩa

- Interface nằm cùng domain, nói bằng ngôn ngữ nghiệp vụ: `save(order)`, `byId(id)`, `nextIdentity()`. Không có tên
  bảng, câu SQL, đối tượng của ORM trong chữ ký.
- Mẹo thiết kế: viết code nghiệp vụ như thể kho đã có, gọi đúng phương thức mình cần, rồi mới định nghĩa interface theo
  đúng nhu cầu đó.
- Hiện thực ở hạ tầng: bằng SQL/query builder, bằng ORM (model của ORM chỉ dùng bên trong repository, không lộ ra), bằng
  bộ nhớ cho test, hoặc gọi API từ xa. Mọi chi tiết database nằm trong một lớp; đổi schema chỉ sửa lớp đó.
- Repository hiện thực cần **integration test** với database thật; code nghiệp vụ test bằng repository trong bộ nhớ.

## Read model và view model

- Đừng nạp entity ghi chỉ để hiển thị: tầng giao diện nhận cả các phương thức đổi trạng thái nó không cần, và entity phình
  to vì phải chiều cả hai vai.
- **Read model**: lớp nhỏ chỉ có dữ liệu cần đọc, với repository đọc riêng (`EbookReadModel` + `EbookReads.byId`); chỉ cần
  một giá trị thì một hàm là đủ (`prices.ofEbook(id): Money`).
- Cách đơn giản (nên bắt đầu ở đây): chung database, repository đọc riêng truy vấn thẳng bảng. Cần integration test để
  đọc và ghi hiểu dữ liệu giống nhau (ví dụ khi đổi đơn vị lưu giá).
- Cách nặng hơn (CQRS đầy đủ): kho đọc riêng cập nhật qua domain event; nhanh khi đọc nhiều nhưng phải lo nhất quán. Chỉ
  chọn khi có lý do đo được.
- **View model**: DTO đúng định dạng cho giao diện hay API (giá đã định dạng, ngày dạng chuỗi), có `toJSON()`; không chứa
  logic nghiệp vụ.

Ví dụ code TypeScript cho cả bốn phần: [references/examples.md](references/examples.md).

## Kiểm tra trước khi xong

- [ ] Không tạo được entity ở trạng thái sai; test tạo với dữ liệu sai phải ném lỗi.
- [ ] Entity và interface repository không import ORM, HTTP, framework, đồng hồ hệ thống.
- [ ] Mọi SQL/ORM của một aggregate nằm trong repository hiện thực của nó.
- [ ] Màn hình chỉ đọc không nhận entity ghi.
- [ ] Code nghiệp vụ có unit test chạy trong bộ nhớ; repository hiện thực có integration test.

## Lỗi hay gặp

- Model của ORM (Active Record) dùng làm domain model: luật nghiệp vụ dính vào database, test cần database.
- Setter tự do khiến luật bị bỏ qua ở một nhánh code nào đó.
- Repository "generic" kiểu `find(table, where)`: chỉ đổi tên câu SQL, không phải kho nghiệp vụ.
- Dùng float cho tiền.

## Nguồn

Ý của sách "Kiến trúc ứng dụng web" (Nguyễn Thế Huy, ebook tiếng Việt, ví dụ Laravel/PHP), số trang là trang PDF:

- Transaction script và domain model, entity `Order` kiểm tra đầu vào và tự tính tổng, entity với value object: PDF tr. 16–22.
- Repository (dẫn Martin Fowler), mẹo định nghĩa theo nhu cầu, hiện thực SQL/ORM/bộ nhớ/từ xa, controller sau refactor,
  lợi ích: PDF tr. 22–30.
- Read model, view model, cách đơn giản và CQRS, cần integration test: PDF tr. 30–33. `nextIdentity()`, `OrderId`: PDF tr. 35–37.

Phần của skill: ví dụ viết lại bằng TypeScript, gợi ý `Money` dùng số nguyên, checklist và danh sách lỗi hay gặp.
