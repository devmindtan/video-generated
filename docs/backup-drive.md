# Backup dữ liệu ngoài Git lên Google Drive

Backup này không phụ thuộc Codex, ChatGPT hay connector của một agent. Mọi agent có terminal, quyền đọc workspace và chạy dưới cùng tài khoản hệ điều hành đều dùng chung lệnh và cấu hình OAuth của `rclone`.

## Phạm vi

Đích Drive: folder ID `1LfnD8usK-89xeeuOZpiCycsWIwy3GXyP`.

Allowlist được version hóa ở `scripts/backup/drive-config.json`:

- `public/`: media và tài nguyên phát trong video;
- `projects/`: bản xuất/render do người dùng giữ;
- `library/`: PDF sách, voice references và stock có provenance;
- `.automation/`: run/staging/event cục bộ của production automation;
- `.manager-trash/`: dữ liệu xóa có thể khôi phục;
- mọi `.manager-history/` nằm dưới `docs/`, `scripts/` và `series/`.

Không backup credential hoặc dữ liệu tái tạo được: `.env*`, `.git/`, `.venv*`, `.voicestudio/`, `.gpu/`, `node_modules/`, `repos/`, `.cache/`, `graphify-out/`, `out/`, `.manager-staging/`. Script từ chối một source chứa tên cấm ngay cả khi config bị sửa nhầm.

Symlink không được đi theo; script báo số symlink bị bỏ qua.

## Cài công cụ

Rclone chính thức được cài ở `~/.local/bin/rclone`. Có thể kiểm tra:

```sh
~/.local/bin/rclone version
```

Không lưu `rclone.conf`, OAuth token hoặc mật khẩu trong repo.

## Kết nối Google Drive một lần

Chạy:

```sh
~/.local/bin/rclone config
```

Tạo remote với các giá trị:

1. Tên: `video-playground-drive`.
2. Storage: `drive` (Google Drive).
3. Client ID/secret: dùng OAuth Desktop client riêng của dự án Google Cloud `video-playground-backup`. Không dùng client mặc định của rclone vì client dùng chung được rclone thông báo nghỉ hoạt động trong năm 2026. File JSON tải từ Google Cloud và `rclone.conf` đều ở ngoài repo, quyền `600`; không in hoặc gửi chúng qua chat.
4. Scope: quyền đọc/ghi đầy đủ (`drive`).
5. Root folder ID: `1LfnD8usK-89xeeuOZpiCycsWIwy3GXyP`.
6. Service account: để trống.
7. Advanced config: không cần, trừ khi rclone yêu cầu để nhập root folder ID.
8. Auto config: `y`; đăng nhập đúng tài khoản Google có quyền Editor trên folder và chấp thuận OAuth.
9. Shared Drive: `n` vì link hiện tại là folder thường, không phải Shared Drive ID.

Rclone lưu token ngoài repo, thường tại `~/.config/rclone/rclone.conf`, với quyền chỉ tài khoản người dùng đọc. Agent không được in hoặc commit nội dung file này.

### Tạo OAuth Desktop client riêng

Trong Google Cloud Console, dùng một project riêng cho backup:

1. Bật Google Drive API.
2. Cấu hình OAuth consent screen cho chính tài khoản chủ Drive; nếu app ở chế độ Testing, thêm tài khoản đó làm test user.
3. Tạo OAuth Client ID loại **Desktop app**.
4. Tải JSON về máy, chuyển đến `~/.config/rclone/google-drive-client.json`, đặt quyền `600`, rồi nhập `client_id` và `client_secret` từ file qua prompt cục bộ. Không lưu hai giá trị vào file tracked, terminal log hoặc chat.

## Lệnh chuẩn

```sh
npm run backup:drive -- plan
npm run backup:drive -- doctor
npm run backup:drive -- run
npm run backup:drive -- verify
```

- `plan`: chỉ đọc local, in source, số file và dung lượng.
- `doctor`: kiểm tra binary, remote và quyền truy cập folder.
- `run`: copy tăng dần vào `current/`, chuyển phiên bản file bị thay thế vào `versions/<run-id>/`, rồi verify checksum. Không xóa file Drive chỉ vì local đã mất.
- `verify`: so sánh một chiều từng source local với `current/` bằng checksum do local và Google Drive cung cấp; không tải lại toàn bộ dữ liệu chỉ để kiểm tra.

Sau một run thành công, manifest nằm trong `_manifests/<run-id>.json`; bản local ở `.cache/backup-drive/manifests/` và bị Git bỏ qua.

## Chính sách an toàn

- Không dùng `rclone sync`, `delete`, `purge`, `rmdirs` hoặc `cleanup` cho backup này.
- Không thêm source mới ngoài allowlist nếu chưa kiểm tra secret, dung lượng và quyền phân phối.
- Không coi upload thành công cho đến khi `rclone check` đạt cho mọi source và manifest đã được tải lên.
- Không chạy nhiều backup đồng thời. Nếu một run bị dừng, chạy lại `run`; `copy` tiếp tục theo trạng thái đích và không xóa dữ liệu.
- Agent ở máy/tài khoản khác phải tự được cấp OAuth hợp lệ. Không gửi `rclone.conf` qua Git hoặc chat.
