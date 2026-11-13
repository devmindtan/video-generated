---
name: webarch-ports-adapters
description: Áp dụng Ports and Adapters (Hexagonal Architecture, Alistair Cockburn) cho ứng dụng web - lõi Domain + Application ở giữa, port là hợp đồng cho mỗi đường vào (web, API, CLI, test) và đường ra (lưu trữ, thông báo, thanh toán, hệ thống khác), adapter là hiện thực cụ thể ở hạ tầng, mỗi port có một adapter thật và một adapter giả cho test, nối bằng dependency injection. Dùng khi tích hợp dịch vụ ngoài (cổng thanh toán, email/SMS, API đối tác, service khác), khi cần đổi nhà cung cấp hay database, khi thêm kênh vào mới (CLI, import file, API cho mobile), khi test chậm vì gọi hạ tầng thật, hoặc khi tách module/bounded context. English triggers - hexagonal architecture, ports and adapters, adapter pattern for integrations, fake adapters for tests, swap provider, anti-corruption between bounded contexts.
---

# Ports and Adapters

Lõi ứng dụng (domain + application) ở giữa; mọi thứ ra vào lõi đi qua một **port** (hợp đồng) và một **adapter** (phần cắm
cụ thể). Giống cổng USB: máy không quan tâm cắm chuột hay ổ đĩa, miễn đúng chuẩn cổng. "Lục giác" chỉ là ẩn dụ cho nhiều
cổng, không phải sáu.

Đây là bước tiếp của kiến trúc ba tầng (skill `webarch-layers`): tầng Infrastructure được gọi tên chi tiết thành từng loại
kết nối, mỗi loại có cơ chế cắm/rút riêng. Nó giải các chỗ ba tầng còn vướng: phụ thuộc ngầm, thêm kênh mới khó, test
application còn chậm vì đi qua hạ tầng thật, tích hợp hệ thống khác làm bẩn domain.

## Port và adapter

- **Port vào** (primary): cách bên ngoài gọi use case: giao diện web, API, CLI, job, và cả bộ test. Thường chính là các
  application service/handler; có thể thêm interface khi cần nhiều giao diện cùng một hợp đồng.
- **Port ra** (secondary): cách lõi dùng tài nguyên ngoài: lưu trữ (repository), thông báo, thanh toán, dịch vụ khác. Luôn
  là interface do lõi định nghĩa, bằng ngôn ngữ nghiệp vụ.
- Độ rộng port tùy thiết kế: cực đoan là mỗi use case một port; thực tế gom theo nhóm chức năng hay theo tác nhân.
- **Adapter** ở hạ tầng: dịch giao thức và định dạng giữa bên ngoài và lõi. Adapter phụ thuộc vào port, không bao giờ
  ngược lại. Một port có nhiều adapter: **ít nhất một thật và một giả** (bộ nhớ, ghi log) cho test và chạy offline. Lý do
  ban đầu Cockburn đề xuất kiến trúc này chủ yếu là để test dễ.

## Bốn bước

1. **Liệt kê port**: những cách người và hệ thống khác dùng ứng dụng (vào), những tài nguyên ứng dụng cần (ra).
2. **Định nghĩa interface trong lõi** cho mỗi port ra (`OrderRepository`, `OrderNotifier`, `PaymentGateway`,
   `CustomerDirectory`).
3. **Viết adapter**: thật (SQL, email SMTP, HTTP tới cổng thanh toán) và giả (`InMemory…`, `Logging…`, `Fake…`); controller
   và CLI command là adapter vào gọi handler.
4. **Nối bằng DI** ở một chỗ (container hoặc composition root); cấu hình test dùng adapter giả.

Ví dụ đầy đủ: [references/example.md](references/example.md).

## Những gì được

- Test use case trong bộ nhớ, không khởi động framework, không mạng, không database; adapter thật có integration test riêng.
- Đổi công nghệ chỉ thay adapter: email sang SMS, MySQL sang database khác, thậm chí đổi framework web.
- Thêm kênh mới không đụng lõi: import đơn từ CSV là một CLI adapter gọi đúng handler hiện có; ghi song song hai kho trong
  giai đoạn chuyển đổi là thêm một adapter lưu trữ.
- Tích hợp giữa các bounded context không phá ranh giới: context Đặt hàng định nghĩa port `CustomerDirectory` với đúng
  những gì nó cần, adapter gọi API của context Khách hàng; đổi cách tích hợp chỉ sửa adapter. Không đọc thẳng database của
  context khác.
- Dễ tách thành service riêng về sau, vì ranh giới đã rõ.

## Cái giá và khi nào không

Nhiều interface và class hơn; cần quy ước đặt tên (ví dụ `<Port>` cho interface, `<Công nghệ><Port>` cho adapter thật,
`InMemory<Port>`/`Fake<Port>` cho adapter giả). Dùng ở chỗ **dễ thay đổi hoặc khó test** (dịch vụ ngoài, lưu trữ, thông
báo, thời gian); đừng bọc interface quanh mọi thứ, nhất là thứ chỉ có một hiện thực và không bao giờ cần giả.

## Kiểm tra trước khi xong

- [ ] Interface port nói bằng ngôn ngữ nghiệp vụ, không lộ HTTP, SQL, SDK của nhà cung cấp (không trả về kiểu của SDK).
- [ ] Mỗi port ra có adapter giả dùng trong test use case, và adapter thật có integration test.
- [ ] Lỗi của nhà cung cấp được adapter dịch sang lỗi của lõi; retry, timeout, ánh xạ mã lỗi nằm trong adapter.
- [ ] Không có import từ lõi sang thư mục adapter.

## Nguồn

Ý của sách "Kiến trúc ứng dụng web" (Nguyễn Thế Huy, ebook tiếng Việt, ví dụ Laravel/PHP), chương 7, số trang là trang PDF:

- Giới thiệu, Cockburn 2005, ẩn dụ lục giác và cổng USB: PDF tr. 48–49. Hạn chế của kiến trúc phân lớp: PDF tr. 49–50.
- Port vào/ra, độ rộng port, adapter, một port nhiều adapter (thật và giả), lý do vì testing: PDF tr. 50–52.
- Quan hệ với kiến trúc phân lớp, bốn bước áp dụng: PDF tr. 52. Ví dụ `OrderRepository`, `OrderNotification`, binding, test
  không khởi động framework: PDF tr. 53–57.
- Thêm kênh CSV, lưu hai kho, port giữa bounded context, tổng kết lợi ích, cái giá, áp dụng có chọn lọc: PDF tr. 57–59.

Phần của skill: quy ước đặt tên gợi ý, checklist (dịch lỗi nhà cung cấp, không lộ kiểu SDK), ví dụ TypeScript.
