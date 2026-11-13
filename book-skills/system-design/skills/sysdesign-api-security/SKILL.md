---
name: sysdesign-api-security
description: Thiết kế giao tiếp giữa các thành phần và bảo mật hệ thống - chọn HTTP/REST, gRPC/RPC, TCP hay UDP theo nhu cầu (API công khai, gọi nội bộ, thời gian thực), API gateway; xác thực (mật khẩu băm Argon2/bcrypt có salt, MFA, session hay JWT), phân quyền (RBAC, ABAC, OAuth2/OpenID Connect), bảo vệ API (không để lộ khóa ở client, CORS, rate limit, kiểm tra đầu vào), bảo vệ dữ liệu (HTTPS/TLS, HSTS, mã hóa khi lưu), chống XSS, CSRF, cookie Secure/HttpOnly/SameSite, upload file an toàn. Dùng khi thiết kế API mới, chọn giao thức giữa các service, làm đăng nhập/phân quyền, review bảo mật một tính năng web, hoặc khi người dùng hỏi về REST vs gRPC, JWT vs session, OAuth, CORS, rate limiting, XSS, CSRF. English triggers - API design, REST vs gRPC, TCP vs UDP, API gateway, authentication, authorization, RBAC, ABAC, OAuth2, OpenID Connect, JWT, session, password hashing, CORS, rate limiting, input validation, XSS, CSRF, cookie flags, secure file upload.
---

# Giao tiếp và bảo mật

## Chọn cách giao tiếp

| Lựa chọn | Đặc điểm | Hợp với |
|---|---|---|
| HTTP + REST | tài nguyên + URL + động từ (`GET /tasks`, `POST /tasks`, `DELETE /tasks/123`), văn bản, dễ dùng, dễ cache | API công khai, trình duyệt, đối tác |
| RPC / gRPC | gọi hàm từ xa như hàm nội bộ, nhị phân, nhanh, có hợp đồng chặt | gọi giữa các service nội bộ; trình duyệt không gọi thẳng được |
| TCP | bắt tay, xác nhận, gửi lại, đúng thứ tự | khi không được mất dữ liệu (file, database, email) |
| UDP | gửi không chờ xác nhận, nhanh, có thể mất gói | gọi video, game, DNS, QUIC/HTTP3 |

Mẫu hay gặp: REST (qua API gateway lo xác thực, rate limit, định tuyến) cho bên ngoài, gRPC giữa các service bên trong. HTTP
không giữ trạng thái: phiên đăng nhập đi bằng cookie hoặc token. Dùng đúng ngữ nghĩa động từ: GET không thay đổi dữ liệu;
POST/PATCH không idempotent nên cần idempotency key khi có retry (skill `sysdesign-scaling`).

## Xác thực (bạn là ai)

- Mật khẩu: không bao giờ lưu bản gốc; băm bằng thuật toán chậm dành cho mật khẩu (Argon2, bcrypt, PBKDF2) với salt riêng mỗi
  người. Thêm MFA/OTP cho tài khoản quan trọng.
- **Session** (server giữ trạng thái, client giữ session ID trong cookie): thu hồi dễ (xóa phiên). Hợp ứng dụng web thường.
- **JWT** (header.payload.signature): không cần tra kho mỗi lần, hợp hệ phân tán; nhưng payload ai cũng đọc được (không bỏ dữ
  liệu bí mật vào), và khó thu hồi trước hạn, nên để hạn ngắn kèm refresh token và danh sách thu hồi khi cần.

## Phân quyền (bạn được làm gì)

- **RBAC**: quyền theo vai trò; đơn giản, dễ kiểm toán, nhưng dễ "nổ" số vai trò khi luật chi tiết.
- **ABAC**: quyết theo thuộc tính của người, tài nguyên, ngữ cảnh (chỉ trong giờ hành chính, chỉ tài liệu của phòng mình).
  Linh hoạt, khó kiểm thử hơn.
- **OAuth2**: ủy quyền cho ứng dụng khác bằng access token có phạm vi (scope); cần biết người dùng là ai thì dùng OpenID
  Connect bên trên OAuth2.
- Kiểm tra quyền ở server cho từng yêu cầu và từng tài nguyên (không chỉ ẩn nút ở giao diện); mặc định từ chối.

## Bảo vệ API

- Không nhúng khóa bí mật hay API key vào app client hay JavaScript; gọi dịch vụ bên thứ ba từ server.
- CORS chỉ cho phép đúng các origin tin cậy, không dùng `*` cho API có cookie.
- Rate limit theo IP, tài khoản, token (ví dụ trong sách: tối đa 5 lần đăng nhập sai trong 10 phút rồi khóa tạm).
- Kiểm tra đầu vào sớm, theo danh sách cho phép (whitelist): kiểu, độ dài, định dạng; truy vấn database luôn dùng tham số
  (chống SQL injection).

## Bảo vệ dữ liệu và trình duyệt

- HTTPS/TLS cho mọi kết nối, bật HSTS; mã hóa dữ liệu nhạy cảm khi lưu (ổ đĩa, trường quan trọng, bản sao lưu).
- XSS: escape theo ngữ cảnh khi hiển thị dữ liệu người dùng, dùng template an toàn, thêm Content Security Policy.
- CSRF: token chống CSRF trong form và/hoặc cookie `SameSite=Lax/Strict`; thao tác nhạy cảm (chuyển tiền, đổi email) yêu cầu
  xác nhận lại.
- Cookie phiên: `Secure`, `HttpOnly`, `SameSite`, tiền tố `__Host-`, hạn dùng hợp lý, phạm vi domain/path hẹp.
- Upload file: bắt đăng nhập, kiểm tra loại file thật và kích thước, quét mã độc, đổi tên ngẫu nhiên, lưu nơi riêng (bucket)
  không chạy được, chỉ chủ sở hữu hoặc nhóm được phép mới xem/xóa.

Bảo mật có giá về hiệu năng và trải nghiệm (TLS, băm mật khẩu chậm có chủ đích, xác nhận lại); nói rõ đánh đổi thay vì bỏ
lớp bảo vệ. Phòng thủ nhiều lớp: không lớp nào được coi là đủ một mình.

## Kiểm tra trước khi giao một tính năng

- [ ] Mỗi endpoint có xác thực và kiểm tra quyền trên đúng tài nguyên (không lộ dữ liệu của người khác qua ID).
- [ ] Đầu vào được kiểm tra; truy vấn có tham số; dữ liệu hiển thị được escape.
- [ ] Không có bí mật trong code client, log hay repo.
- [ ] Có rate limit cho đăng nhập và endpoint tốn kém.
- [ ] Cookie và header bảo mật đúng; chỉ HTTPS.

## Nguồn

Ý của sách "System Design" (Nguyễn Thế Huy, ebook tiếng Việt), số trang là trang PDF:

- HTTP, các động từ, TCP và UDP, RPC/gRPC, REST, API gateway REST trước gRPC nội bộ: PDF tr. 62–70.
- Phòng thủ nhiều lớp, xác thực (mật khẩu, MFA, session, JWT), phân quyền (RBAC, ABAC, OAuth2, OpenID Connect), bảo vệ API
  (API key, CORS, rate limit, kiểm tra đầu vào), bảo vệ dữ liệu (TLS, HSTS, mã hóa, băm mật khẩu, XSS, CSRF, cookie), ví dụ
  upload file và quản lý người dùng, đánh đổi hiệu năng–bảo mật: PDF tr. 80–85.

Phần của skill: bảng chọn giao thức, refresh token và danh sách thu hồi cho JWT, kiểm tra quyền theo tài nguyên và mặc định từ
chối, truy vấn có tham số, checklist (kiến thức chung bổ sung, không có nguyên văn trong sách).
