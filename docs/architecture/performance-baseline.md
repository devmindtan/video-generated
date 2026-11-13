# Baseline hiệu năng và nợ lặp

- **Ngày đo:** 2026-11-13
- **Mục tiêu:** baseline P0 cho [đánh giá hệ thống](system-evaluation.md), trước khi tối ưu hoặc tái cấu trúc lớn.
- **Phạm vi lần đo này:** typecheck, test lõi manager, dung lượng cục bộ và kiểm kê lặp. Không render, tạo giọng, clone giọng hay gọi model.

## Điều kiện máy

| Hạng mục | Giá trị |
|---|---:|
| CPU | Intel Core i5-1135G7, 4 core / 8 thread |
| RAM | 24.94 GB; available 9.70 GB lúc đo |
| Swap | 2.15 GB; gần như chưa dùng |
| Filesystem workspace | 250.38 GB; còn 84.24 GB (78.5 GiB), 65% đã dùng |
| Load trước phép đo | 2.25 / 1.80 / 1.43 |

Các job có khả năng nặng chạy qua `limited`. `npm run temp -- status` trước và sau test đều báo 0 bundle Remotion tạm và còn hơn ngưỡng 12 GB.

## Thời gian và bộ nhớ

| Phép đo | Lệnh | Kết quả |
|---|---|---:|
| Typecheck | `/usr/bin/time -f ... limited npm run typecheck` | 4.20 s; max RSS 1,031,520 KiB; exit 0 |
| Manager core trước refactor | `/usr/bin/time -f ... limited npm run test:manager` | 0.90 s; max RSS 108,288 KiB; 20 test đạt (19 manager + 1 activity) |

Đây là một mẫu đơn trên máy đang có tải nền, dùng để phát hiện thoái lui lớn chứ chưa phải benchmark thống kê. Chưa có bằng chứng typecheck hoặc manager là nút thắt cần tối ưu hiệu năng.

## Dung lượng

`du -B1` là block đã cấp phát trên filesystem; `du --apparent-size -B1` là kích thước logic. Các số này không được diễn giải thành dung lượng đã thu hồi trên ổ Windows/host khác.

| Vùng | Block đã cấp phát | Kích thước logic |
|---|---:|---:|
| `public/` | 4,377,821,184 B | 4,367,434,892 B |
| `library/` | 56,737,792 B | 52,541,168 B |
| `.cache/` | 4,169,216,000 B | 4,160,482,127 B |
| `.automation/runs/` | 6,602,752 B | 2,582,105 B |
| `graphify-out/` | 23,330,816 B | 18,252,100 B |

Áp lực chính trong phạm vi đo là `public/` và `.cache/`. Không có thư mục nào bị xóa chỉ vì lớn; cần kiểm kê quyền sở hữu và khả năng tái tạo trước một đợt dọn riêng.

## Kiểm kê nợ lặp

### Lệnh npm

`package.json` có 197 script. Các họ lớn nhất là:

| Họ | Số lượng |
|---|---:|
| `check:*` | 40 |
| `voice:*` | 37 |
| `test:*` | 37 |
| `render:*` | 16 |
| `thumbnail:*` | 14 |
| `still:*` | 14 |
| `sfx:*` | 8 |

Kết luận cho P1.1: chưa thay hàng loạt các lệnh này. `voice:*` chứa tham số biên tập/model/timing riêng theo tập; entrypoint chung trước hết phải mô hình hóa phần metadata khác nhau, giữ alias cũ và chỉ áp dụng cho project mới hoặc project đang được chạm.

### Script riêng theo project

Trong `scripts/projects/*`, tên file lặp nhiều nhất là `story.json` (31), `check.py` (28), `voice.json` (23), `test-caption-style.cjs` (17), `audition.json` (15), `prepare-audio.py` (12), `check-audio.py` (10). Đây là danh sách tìm ứng viên refactor cơ hội, không chứng minh nội dung các file giống nhau.

### Project manager

Trước refactor, `server.cjs` chứa bootstrap, security, parse upload/JSON, 75 nhánh route và streaming media trong cùng module. Increment P1.3 đầu tiên tách thành:

- `server.cjs`: bootstrap, dependency wiring và security boundary;
- `post-routes.cjs`: upload và mutation routes;
- `get-routes.cjs`: query, static/media routes;
- `http-response.cjs`: JSON, file và byte-range responses.

Contract HTTP được giữ và kiểm bằng toàn bộ 22 lệnh `test:manager*`, cộng acceptance test `SYS-EVAL AC-P1.3` cho content type, JSON hợp lệ/không hợp lệ và unknown route. Bước này giảm phạm vi phải đọc/sửa trong bootstrap; chưa tuyên bố hoàn tất việc chia handler theo từng miền.

## Chưa đo và lý do

- **Render 2–3 composition:** chưa chạy vì render/export cần yêu cầu rõ của người dùng và là job nặng; không dùng video sản xuất làm benchmark ngầm.
- **Voice audition / clone:** chưa chạy vì có thể tạo take mới, dùng model nặng và cần lựa chọn mẫu không ảnh hưởng bản đã duyệt.
- **Peak GPU/VRAM:** môi trường đo hiện tại không cung cấp số liệu GPU host phù hợp.

Khi người dùng yêu cầu benchmark media riêng, chọn fixture hoặc project được chỉ định, ghi input/hash, chạy từng job một qua `limited`, dọn output tạm và đo lại free space.

## Lệnh tái lập phần an toàn

```sh
npm run temp -- status
/usr/bin/time -f 'elapsed=%e user=%U sys=%S maxrss_kb=%M exit=%x' limited npm run typecheck
/usr/bin/time -f 'elapsed=%e maxrss_kb=%M exit=%x' limited npm run test:manager
du -s -B1 public library .cache .automation/runs graphify-out
du -s --apparent-size -B1 public library .cache .automation/runs graphify-out
```
