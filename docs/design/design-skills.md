# Skill thiết kế và kiểm thử web

Đã clone các repo chính chủ và cài chọn lọc bằng helper skill-installer vào `skills/` của workspace. Không thay cấu hình skill toàn máy và không sửa upstream clone. Các lượt làm việc sau đọc các đường dẫn dưới đây theo AGENTS.md.

| Skill | Nguồn | Vai trò |
|---|---|---|
| [frontend-design](../../skills/frontend-design/SKILL.md) | [anthropics/skills](https://github.com/anthropics/skills) | Định hướng thiết kế, typography, bố cục theo nhiệm vụ người dùng |
| [web-design-guidelines](../../skills/web-design-guidelines/SKILL.md) | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | Audit accessibility, forms, focus, ảnh, responsive và state |
| [webapp-testing](../../skills/webapp-testing/SKILL.md) | [anthropics/skills](https://github.com/anthropics/skills) | Kiểm tra web bằng Playwright, screenshot và browser logs |

Bản clone [web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines) giữ tiêu chuẩn Vercel để đối chiếu. Skill Vercel yêu cầu tải guideline mới khi review: đã lấy bản hiện hành trong lượt này và đối chiếu với `repos/vercel-labs--web-interface-guidelines/command.md`. Không tự chạy install.sh của repo.

Revision nằm trong `repos-manifest.json`; nguồn, revision và hash từng file skill được cài nằm ở `skills/design-skills-manifest.json`. Các file license kèm skill Anthropic được giữ nguyên. Việc có skill không tự chứng minh sản phẩm đạt chất lượng; cần kiểm tra UI thật.

## Workflow từ nay

1. Đọc brief, dữ liệu thật và frontend-design; chốt design plan nhỏ trước khi sửa UI.
2. Triển khai theo một hệ token/style thống nhất, kiểm tên tiếng Việt dài và tương phản; không chồng nhiều bản vá CSS.
3. Review theo web-design-guidelines, ghi phát hiện có vị trí file.
4. Kiểm thử browser theo webapp-testing: chờ trang tải, kiểm DOM, thao tác và chụp màn hình desktop/tablet/mobile.
5. Chỉ sửa các vấn đề quan sát được, chạy lại phần test bị ảnh hưởng rồi bàn giao. Không hứa đã đạt đầy đủ WCAG chỉ từ vài test.

Webapp-testing minh họa Python Playwright. Workspace này dùng **Node Playwright core** để dùng Node/Chrome đã có, tránh tải trùng driver/browser và tránh thay môi trường voice/PDF. Luồng kiểm tra trình duyệt, network-idle, screenshot và console vẫn được giữ.
