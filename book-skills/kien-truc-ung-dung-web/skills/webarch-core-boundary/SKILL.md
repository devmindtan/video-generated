---
name: webarch-core-boundary
description: Tách code nghiệp vụ (core) khỏi code hạ tầng (database, API ngoài, file, đồng hồ hệ thống, email, framework, request/session) trong ứng dụng web, và lộ trình refactor một controller "làm đủ mọi việc" thành domain model, repository, application service, các tầng và port/adapter. Dùng khi thiết kế backend mới, khi review hoặc refactor controller/service phình to, khi code khó test vì dính database hay framework, khi chuẩn bị đổi database, framework hay nhà cung cấp, hoặc khi người dùng hỏi nên đặt logic ở đâu. English triggers - separate business logic from infrastructure, fat controller refactor, testable backend, decouple from framework, clean architecture, where should this logic go.
---

# Ranh giới core và hạ tầng

Một ứng dụng web có hai loại code. **Core** kể câu chuyện nghiệp vụ: đơn hàng hợp lệ khi nào, tiền tính thế nào, ai được
làm gì. **Hạ tầng** nối câu chuyện đó với máy móc: database, HTTP, file, email, framework. Trộn hai loại thì logic khó
đọc, dính chặt vào công nghệ, khó test tự động, dữ liệu sai lọt vào hệ thống, và code sớm thành "legacy". Tách được thì
core đọc như nghiệp vụ, test nhanh trong bộ nhớ, đổi công nghệ chỉ sửa phần rìa.

## Phép thử một câu

> Đoạn code này có chạy được chỉ với bộ nhớ và CPU, trong một script độc lập, không cần gì bên ngoài không?

Cụ thể là hai điều kiện, đủ cả hai mới là core:

1. **Không gọi trực tiếp hệ thống ngoài**: database, API từ xa, file, đồng hồ hệ thống, gửi mail, hàng đợi. Gọi qua
   interface được, miễn interface đó không lộ chi tiết kỹ thuật.
2. **Không cần môi trường đặc biệt**: không giả định đang chạy trong request web, CLI hay container của framework; không
   đọc biến toàn cục của request, session, biến môi trường.

Thiếu một điều kiện là hạ tầng. Hạ tầng = toàn bộ code trừ core.

Những điểm dễ nhầm:
- **Interface không tự làm sạch**: một interface `insert(table, data)` hay `httpGet(url)` vẫn là khái niệm của database
  hay HTTP, code gọi nó vẫn là hạ tầng. Interface phải nói bằng ngôn ngữ nghiệp vụ (`orders.save(order)`).
- **Phân loại theo việc code làm, không theo thư mục**: một lớp "Calculator" trong `utils/` mà gọi API tỷ giá là hạ tầng;
  một thư viện parse Markdown trong `node_modules` có thể coi như core.
- Thời gian hiện tại cũng là hạ tầng: core nhận `clock.now()` qua interface `Clock` thay vì gọi đồng hồ hệ thống.
- Value object (`Money`, `DateRange`, `EmailAddress`) thay cho kiểu nguyên thủy là core và giúp core tự kiểm tra dữ liệu.

## Lộ trình refactor một controller làm đủ mọi việc

Điểm xuất phát điển hình: một handler nhận request, truy vấn giá trực tiếp từ database, tính tiền, insert đơn, ghi
session, không kiểm tra email hay số lượng. Đi từng bước, mỗi bước chạy được và có test:

1. **Đưa luật vào đối tượng nghiệp vụ**: entity `Order` tự kiểm tra đầu vào khi được tạo và tự tính tổng → skill
   `webarch-domain-model`.
2. **Giấu lưu trữ sau repository** do core định nghĩa; câu SQL/ORM chỉ còn trong một lớp → `webarch-domain-model`.
3. **Tách đường đọc** khỏi entity ghi khi chỉ cần hiển thị (read model, view model) → `webarch-domain-model`.
4. **Đưa use case ra application service** nhận một command; controller chỉ đổi request thành command và kết quả thành
   response → `webarch-layers`.
5. **Xếp ba tầng** Domain, Application, Infrastructure với phụ thuộc chỉ hướng vào trong → `webarch-layers`.
6. **Gọi tên các cổng**: mỗi thứ bên ngoài là một port, mỗi công nghệ là một adapter, test bằng adapter giả →
   `webarch-ports-adapters`.

Không phải dự án nào cũng cần đi hết. Dừng ở bước đủ cho độ phức tạp thật của nghiệp vụ.

## Khi nào đáng làm

Đáng: ứng dụng sống lâu (tác giả cho rằng trên khoảng hai năm thì rất đáng tách khỏi hạ tầng), nghiệp vụ có luật thật,
nhiều người cùng làm, có kế hoạch đổi database/framework/nhà cung cấp, cần test tự động nhanh.

Không cần làm đủ: CRUD đơn giản, script, prototype. Gộp bớt tầng cho phần đơn giản; chỉ tách ở nơi dễ thay đổi hoặc khó
test. Trừu tượng hóa mọi thứ cũng là một kiểu nợ.

## Khi review code

- Đánh dấu từng dòng của hàm nghiệp vụ là core hay hạ tầng; chỗ trộn là chỗ cần tách.
- Tìm chi tiết kỹ thuật trong logic nghiệp vụ: tên bảng, SQL, URL, đường dẫn file, đối tượng request/session, gọi đồng
  hồ hệ thống, facade/singleton của framework.
- Hỏi: test hàm này có cần database, mạng hay khởi động framework không? Nếu có, luật nghiệp vụ đang bị nhốt trong hạ tầng.
- Đề xuất thay đổi nhỏ nhất đủ để tách, không đề xuất viết lại cả kiến trúc khi người dùng chỉ cần sửa một chỗ.

## Nguồn

Ý của sách "Kiến trúc ứng dụng web" (Nguyễn Thế Huy, ebook tiếng Việt, ví dụ bằng Laravel/PHP), số trang là trang PDF:

- Core code và infrastructure code, năm vấn đề khi trộn, sáu lợi ích, năm kỹ thuật, ví dụ controller đặt mua: PDF tr. 3–11.
- Hai quy tắc của core, ví dụ core và hạ tầng, interface không tự làm sạch, phân loại theo chức năng, `Clock`: PDF tr. 11–16.
- Lộ trình qua các chương (domain model, read model, application service, phân lớp, ports and adapters): PDF tr. 16–59.
- Nhận định "vòng đời trên 2 năm" là của tác giả: PDF tr. 6. Không áp dụng máy móc: PDF tr. 48, 59.

Phần của skill: lộ trình sáu bước gom từ thứ tự các chương, danh sách điều cần soi khi review, và ví dụ bằng TypeScript
thay cho PHP trong các skill liên quan.
