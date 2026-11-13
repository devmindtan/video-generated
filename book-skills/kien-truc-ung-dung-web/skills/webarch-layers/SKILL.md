---
name: webarch-layers
description: Tổ chức backend web thành ba tầng Domain, Application, Infrastructure với phụ thuộc chỉ hướng vào trong (Dependency Rule) - application service/use case handler nhận command object, controller mỏng chỉ dịch request thành command và kết quả thành response, dependency injection qua constructor thay cho service locator, domain event cho việc phụ như gửi email, cây thư mục và cách nối interface với hiện thực. Dùng khi dựng cấu trúc dự án backend mới, khi controller hoặc service phình to vì chứa cả use case, khi cùng một use case cần chạy từ web, CLI, job và test, khi người dùng hỏi nên chia thư mục/tầng thế nào hoặc logic này thuộc tầng nào. English triggers - layered architecture, application service, use case handler, command handler, thin controller, dependency rule, dependency injection, service locator, folder structure, domain events.
---

# Ba tầng và application service

## Ba tầng

| Tầng | Chứa | Không được |
|---|---|---|
| **Domain** | entity, value object, domain service, domain event, interface repository, factory | import framework, ORM, HTTP, đồng hồ hệ thống; biết tầng ngoài tồn tại |
| **Application** | use case handler / application service, command và query, mở và đóng transaction, listener của use case | chứa luật nghiệp vụ chi tiết (đẩy xuống domain); biết chi tiết database hay email |
| **Infrastructure** | controller, route, CLI command, job; repository hiện thực (ORM, SQL); adapter dịch vụ ngoài (email, thanh toán); cấu hình DI | quyết định luật nghiệp vụ (chỉ có if/else kỹ thuật như retry, đổi định dạng) |

**Dependency Rule**: phụ thuộc lúc biên dịch chỉ hướng vào trong.

```text
[giao diện / controller] → [Application] → [Domain] ← [Infrastructure]
```

Domain cần lưu hay gửi gì thì định nghĩa interface (port); Application gọi interface đó; Infrastructure hiện thực nó và
được tiêm vào lúc chạy. Domain "đừng gọi tôi, tôi sẽ gọi anh": nó không chủ động tìm hạ tầng.

Lợi: biết đặt code ở đâu, đổi công nghệ một tầng không lan, test được từng tầng. Rủi ro: logic rò giữa tầng (chỉ kỷ luật
và review ngăn được), quá nhiều tầng mỏng thành "code lasagna", và thiết kế từ dưới lên bắt đầu từ bảng database khiến
domain thành bản sao của schema.

## Application service và command

- Mỗi use case một handler (`PlaceOrderHandler.handle(cmd)`), nhận một **command** là DTO dữ liệu thuần (không có đối tượng
  request của framework), trả về thứ tối thiểu (ID, DTO kết quả).
- Handler điều phối: lấy dữ liệu qua repository, gọi domain, tạo entity qua factory/`nextIdentity()`, lưu, phát event. Thấy
  tính toán phức tạp trong handler thì chuyển xuống entity hoặc domain service.
- Transaction mở và đóng ở đây.
- Cùng handler chạy được từ controller web, CLI, job hàng đợi, và test.
- **Controller mỏng**: validate định dạng đầu vào, dựng command, gọi handler, đổi kết quả hoặc lỗi nghiệp vụ thành response.
- **Dependency injection qua constructor**: handler khai báo các interface nó cần; container (hoặc một "composition root"
  viết tay) nối interface với hiện thực. Không gọi service locator (`container.get(...)`, `app()->make(...)`) bên trong
  code nghiệp vụ, vì phụ thuộc bị giấu và test khó thay thế.
- Việc phụ sau use case (gửi email, cập nhật read model) đi qua **domain event** và listener, để thêm kênh mới (SMS) là
  thêm listener, không sửa handler.

Cây thư mục và ví dụ handler/controller/test: [references/structure.md](references/structure.md).

## Cách làm khi được nhờ

1. Xác định use case (động từ nghiệp vụ: đặt hàng, hủy đơn), viết command và chữ ký handler trước.
2. Viết test cho handler với repository trong bộ nhớ và adapter giả, chưa cần framework.
3. Viết domain (entity, value object) đủ cho test xanh.
4. Viết hiện thực hạ tầng (repository SQL, adapter email), nối DI, controller mỏng; integration test cho hạ tầng.
5. Với module đơn giản (CRUD thuần), gộp bớt: controller gọi repository là đủ. Ghi lý do để người sau không tưởng là quên.

## Kiểm tra trước khi xong

- [ ] Không file nào trong `domain/` import framework, ORM, HTTP client, `Date.now()` trực tiếp.
- [ ] Controller không chứa luật nghiệp vụ, không gọi SQL.
- [ ] Handler test được không cần khởi động framework hay database.
- [ ] Không có service locator trong domain/application.
- [ ] Có thể chạy use case từ một entry point thứ hai (CLI hoặc test) mà không sửa handler.

Có thể thêm một test kiến trúc (dependency-cruiser, ArchUnit, deptrac, import-linter…) để chặn import sai hướng.

## Nguồn

Ý của sách "Kiến trúc ứng dụng web" (Nguyễn Thế Huy, ebook tiếng Việt, ví dụ Laravel/PHP), số trang là trang PDF:

- Controller phình to, Application Service, Command, `PlaceOrderService`, DI qua constructor thay service locator, test bằng
  repository trong bộ nhớ: PDF tr. 33–38.
- Kiến trúc 3-tier gốc, lợi và rủi ro, các vấn đề thường gặp, ba tầng Domain/Application/Infrastructure, Dependency Rule,
  quan hệ giữa các tầng: PDF tr. 38–45.
- Cây thư mục, binding interface trong service provider, luồng request → handler → event → listener, so sánh với không phân
  lớp, không phải việc gì cũng cần nhiều lớp: PDF tr. 45–48.
- Sách hẹn một chương riêng về DI, service locator và composition root nhưng không có (PDF tr. 36, 38): phần đó trong skill
  là kiến thức chung, không phải của sách.

Phần của skill: thứ tự làm 5 bước (test handler trước), checklist, gợi ý test kiến trúc, ví dụ TypeScript.
