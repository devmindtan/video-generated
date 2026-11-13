# Cấu trúc repo, PR và review

Theo gợi ý trong sách (PDF tr. 55–60, 74). Không cần copy y nguyên; giữ ý chính: spec, code, test xếp theo cùng một nhịp
để người và AI tìm thấy nhau.

## Cấu trúc gợi ý

```text
specs/                         # nguồn sự thật về nghiệp vụ
  business-requirements/BR-001-<ten>.md
  use-cases/<context>/UC-042-<ten>.md
  use-cases/_legacy/           # spec của phần cũ chưa xác nhận
  entities/<context>.md
  diagrams/                    # sơ đồ use case, kiến trúc (PlantUML, Mermaid)
docs/adr/                      # quyết định kiến trúc, link tới spec liên quan
src/
  use-cases/<context>/<ten-use-case>/
  domain/
  ports/
  adapters/
tests/
  use-cases/<context>/<ten-use-case>/AC-1.test.* ...
  characterization/            # test chụp hành vi hệ thống cũ (xem sdd-legacy-code)
```

PR đụng UC-042 thì người review biết xem ba chỗ: file spec UC-042, thư mục code của use case đó, thư mục test của nó.

Nếu dùng OpenSpec: thêm `openspec/specs/` (baseline) và `openspec/changes/<ten>/` (`proposal.md`, `specs/`, `design.md`,
`tasks.md`), `changes/archive/` sau khi gộp.

## Mẫu mô tả PR

```markdown
## UC liên quan
- UC-xxx: <link spec>

## Loại thay đổi
- [ ] Tính năng mới theo spec  - [ ] Sửa lỗi  - [ ] Refactor không đổi hành vi  - [ ] Cập nhật spec

## AC đã triển khai
- AC-1, AC-2 ...

## Test
- <test nào map AC nào>

## Dùng AI
- <phần nào AI sinh, phần nào người quyết hoặc sửa tay>
```

## Năm quy tắc review

1. Spec PR tách khỏi code PR.
2. Code PR phải link UC (tiêu đề, mô tả, tên test); thiếu thì `needs-spec`.
3. Review spec trước, code sau.
4. Test phải map AC.
5. Hỏi "AI quyết hay bạn quyết?" để ghi nguồn gốc quyết định.

## Lỗi hay gặp

| Vấn đề | Biểu hiện | Xử lý |
|---|---|---|
| Code có trước, spec bổ sung sau | spec viết "cho đủ hồ sơ" | không merge code đổi hành vi khi spec chưa có |
| Spec quá chi tiết từ đầu | buổi viết spec kéo dài, dev ngồi chờ | giới hạn 1–2 giờ cho UC mới |
| AI đi tắt qua spec | code có quy tắc spec không nói | trả lại PR, cập nhật spec |
| Test mock domain | test xanh, production lỗi | test AC ở tầng hành vi |
| Người nghiệp vụ không đọc spec | chỉ có dev xem spec | mỗi spec PR phải có một người duyệt phía nghiệp vụ |
| Spec không có lịch sử | không biết quy tắc có từ khi nào | mục `History` trong mỗi spec |
| Khóa vào công cụ | spec theo định dạng riêng của một tool | giữ spec Markdown thường |
| Spec coverage ảo | nhiều file spec, AC không có test | đo AC coverage, không đếm file |

## Checklist dự án mới

- [ ] BR có mục tiêu, chỉ số, ngoài phạm vi.
- [ ] 5–10 use case có ID (stub cũng được).
- [ ] Entity model sơ bộ cho ngữ cảnh chính.
- [ ] Đã chọn một công cụ (hoặc chỉ Markdown) và làm thử trọn một UC.
- [ ] Quy ước commit có UC ID.
- [ ] Test đặt theo UC/AC.
- [ ] Mỗi spec PR có người duyệt phía nghiệp vụ.

(Gom từ PDF tr. 42–43.)
