# Công cụ sách nhắc tới

Tên lệnh dưới đây là tại thời điểm viết sách (PDF tr. 41–42, 72–74). Công cụ thay đổi nhanh: kiểm tra tài liệu chính
thức trước khi cài hay chạy, và chỉ cài khi người dùng đồng ý.

## GitHub Spec Kit

Luồng: `/specify` (spec từ ý tưởng) → người review spec → `/plan` (kế hoạch triển khai) → `/tasks` (chia việc) →
`/implement` (AI làm từng việc). Hợp với người mới vì luồng rõ ràng.

## OpenSpec

- Cài theo tài liệu của dự án (sách ghi gói npm `@fission-ai/openspec` và lệnh `openspec init`).
- Luồng nhanh: `/opsx:propose` (tạo thư mục thay đổi và các file cần) → `/opsx:apply` (làm theo tasks/design/spec của
  thay đổi) → `/opsx:sync` (đồng bộ khi file đổi giữa chừng) → `/opsx:archive` (gộp delta vào baseline, cất thay đổi).
  `/opsx:explore` để tìm hiểu khi yêu cầu còn mơ hồ, chưa tạo file.
- Hợp khi nhiều thay đổi song song, cần lịch sử và kiểm toán, hoặc làm trên hệ thống cũ.
- Nguyên tắc: không sửa baseline tùy tiện khi đang nghĩ về tính năng mới; làm trong thư mục thay đổi, xong mới archive.

## AI Unified Process (plugin cho Claude Code)

Lệnh lõi: `/requirements` (danh mục BR), `/entity-model`, `/use-case-diagram` (PlantUML), `/use-case-spec` (spec chi tiết
một UC), `/reverse-engineer` (hệ thống cũ: sinh spec nháp từ code). Có bộ mở rộng cho Java Vaadin + jOOQ.

## Khác

IDE quen thuộc với agent nào cũng được (Cursor, Copilot, Codex, Claude Code); sơ đồ bằng PlantUML hoặc Mermaid; feature
flag (LaunchDarkly, Unleash) khi chạy song song code cũ và mới.

Lời khuyên của sách: chọn một công cụ, làm trọn một use case rồi đánh giá; spec nằm trong repo dưới dạng Markdown thì đổi
công cụ không mất gì.
