# Chủ đề hình ảnh và phong cách animation

Người dùng (2026-11-10): người xem phổ thông xem short nhiều hơn, nên kênh cần làm thật nhiều short trước; mỗi video
chọn một **chủ đề hình ảnh** và một **phong cách animation 2D** hợp với điều muốn nói, để các video đa dạng mà vẫn có
chủ đích. Áp dụng cho mọi video, short hay dài.

## Dữ liệu

| File | Nội dung | Ai sửa |
|---|---|---|
| `src/looks/themes.json` | Chủ đề: bảng màu theo vai trò (background, surface, ink, muted, accent, accent2), nền (`grain`, `paper`, `chalk`, `glow`, `marble`, `grid`, `none`), nét vẽ, kiểu phụ đề, không khí nhạc, chủ đề nói hợp, phong cách gợi ý, câu mẫu | Người dùng ở trang quản lý → **Chủ đề hình ảnh** (tạo, sửa, nhân bản, xóa khi chưa dùng); agent khi được yêu cầu |
| `src/looks/animation-styles.json` | Phong cách animation làm được bằng Remotion: mô tả, hợp với, cách làm, nhịp, độ công phu, mẫu Studio; `favorite` và `userNote` của người dùng | Agent cập nhật mô tả/kỹ thuật khi làm thêm; người dùng chỉ ghi chú và đánh dấu ưu tiên |
| `series.json` → dự án → `"look": {"theme", "style"}` | Lựa chọn tay của dự án (chỉ khi muốn khác điều trang tự nhận diện) | Người dùng ở hai trang (nút **Gắn cho dự án**); `projects:check` từ chối mã không có |

## Tự nhận diện (2026-11-10)

"Đang dùng" không cần ai cập nhật: mỗi lần mở trang, `tools/project-manager/looks.cjs` đọc mã nguồn của từng dự án (thư
mục `src/projects/<slug>/` và các file nó import trong `src/`, sâu 3 cấp):

- **Chủ đề:** các mã màu trong code phải có màu gần nền, chữ và màu nhấn của chủ đề (sai lệch cho phép: nền và chữ 20,
  nhấn 36 trên thang RGB, vì cùng một bộ mặt hay xê dịch giữa các video). Khớp nhiều chủ đề thì chọn cái sát nhất, ưu
  tiên chủ đề có gợi ý trùng phong cách vừa nhận diện.
- **Phong cách:** `detect.any` trong `animation-styles.json` (regex) xuất hiện nhiều nhất thắng, trừ khi có dấu hiệu
  `detect.none` (vd. `<Video>` cảnh quay thật thì không tính ảnh tĩnh). Phong cách không có `detect.any` chỉ hiện khi
  được chọn tay.
- `look` trong series.json là **lựa chọn tay**, chỉ ghi khi muốn khác điều trang nhận ra; nó luôn thắng nhận diện và
  được đánh dấu "bạn chọn". Thêm phong cách mới thì thêm luôn dấu hiệu `detect` cho nó.

Video quay thật, 3D và video sản phẩm không khớp phong cách 2D nào nên không hiện; số dự án nhận diện được ghi ở đầu
mỗi trang.

Mỗi lần ghi từ trang quản lý giữ bản cũ trong `.manager-history/` cạnh file và từ chối khi file vừa đổi ở nơi khác.

## Agent dùng thế nào

- Khi bắt đầu một video, xem chủ đề/phong cách của dự án (trang quản lý hoặc `look` trong series.json). Có thì dùng đúng
  chủ đề và phong cách đó; chưa có thì đề xuất 1–2 chủ đề hợp với nội dung (trường `topics`, `mood`) và phong cách gợi ý của chủ đề, ghi
  vào brief/gói chốt để người dùng chọn. Không tự đổi `look` của dự án đã có video.
- Trong composition, đọc token qua `src/looks/looks.tsx`: `themeOf(id)`, `strokeOf(theme)`, `ThemeBackground`,
  `ThemeCaption`; không chép mã màu cứng. Font duy nhất trên máy là Stoic Sans (Noto Sans 400/700).
- Bộ nhận diện đã chốt của từng series (vd. Đọc sách, hiểu mình: chủ đề `rung-dem-vang`) vẫn được ưu tiên trừ khi
  người dùng chọn khác. Video đã đăng giữ nguyên.
- Mẫu từng phong cách: Studio → thư mục **Thu-Vien-Phong-Cach** (`src/looks/StyleSamples.tsx`, đăng ký trong
  `src/looks/LooksRoot.tsx`, ngoài danh bạ dự án, không phải video để đăng). Đổi chủ đề ở ô props. Thêm phong cách
  mới: thêm mục vào `animation-styles.json`, viết mẫu trong `StyleSamples.tsx` (mọi chuyển động suy ra từ frame), thêm
  vào `SAMPLES`, thêm khung mô phỏng CSS trong `tools/project-manager/web/looks.js` (`motionArt`) và chạy
  `npm run test:manager:looks`.
- Không render để kiểm tra; ảnh chụp tự kiểm tra (nếu cần) để trong `.cache/` và xóa khi xong.
