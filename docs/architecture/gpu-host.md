# Máy GPU qua Tailscale

Laptop không có card đồ họa. Hai việc nặng chạy trên máy GPU `desktop-kndgm60` (Windows 10, WSL2 Ubuntu 24.04, GTX 1660 SUPER 6 GB, driver 560.94) khi máy đó bật:

| Dịch vụ | Dùng cho | Trên máy GPU (WSL) | Cổng ở laptop | Dự phòng |
|---|---|---|---|---|
| VoiceStudio + VoxCPM2 | `npm run voicestudio -- clone …` | `~/voicestudio-gpu` | `127.0.0.1:3901` | VoiceStudio CPU ở `.voicestudio/` |
| Ollama 0.40.13 (`qwen3:8b`, `qwen2.5-coder:7b-instruct`) | `npm run automation -- run …` | `~/ollama-gpu` | `127.0.0.1:11435` | Ollama của laptop `127.0.0.1:11434` |

**Quy tắc của người dùng (2026-10-31): dùng máy GPU khi nó bật; chỉ chạy trên laptop khi nó không dùng được.** Lệnh tự quyết, mỗi lần một vòng SSH (dưới 1 giây): máy GPU tắt/không kết nối, chưa cài dịch vụ, hoặc card đang bận với dịch vụ kia, hoặc dịch vụ không bật lên được → chạy trên laptop và in lý do. `--gpu` bắt buộc dùng máy GPU (báo lỗi thay vì chuyển), `--local` bắt buộc dùng laptop. `qwen2.5-coder:14b` (9 GB) không vừa card nên không tải lên máy GPU.

## Cách nối

- Mỗi dịch vụ chỉ bind `127.0.0.1` trong WSL; không mở ra tailnet (VoiceStudio API không có khóa). Một tiến trình SSH vừa chạy `<dir>/run.sh` ở foreground vừa chuyển cổng về loopback của laptop. Runtime automation vẫn chỉ thấy `api_base` loopback (`127.0.0.1:11435`), đúng chính sách `local_only` của gateway; laptop không đặt `MULTI_AGENT_ALLOW_REMOTE_MODELS`.
- Card 6 GB chỉ chứa một model (VoxCPM2 ~5,9 GB, `qwen3:8b` ~5,2 GB): dịch vụ này đang chạy thì dịch vụ kia dùng laptop. Ollama trên máy GPU đặt `OLLAMA_MAX_LOADED_MODELS=1`, `OLLAMA_NUM_PARALLEL=1`.
- **Lease:** mỗi người dùng một dịch vụ (một lệnh clone, một run, `gpu start` thủ công) giữ một file trong `.gpu/leases/`; người cuối cùng ra thì chạy `<dir>/stop.sh` (dừng tiến trình theo thư mục làm việc, trả VRAM) và đóng tunnel. Holder đã chết bị bỏ qua. `npm run voicestudio -- gpu stop` dừng ngay bất kể lease.
- Cấu hình: `.gpu/host.json` (`{"host": "desktop-kndgm60"}`, tùy chọn `services.<id>.dir/localPort`), ngoài Git. Log tunnel: `.gpu/<dịch vụ>.log`; log server: `<dir>/server.log` trên máy GPU. Mã: `tools/gpu-host/gpu-host.cjs`; kiểm tra: `npm run test:voicestudio`, `npm run test:automation` (không SSH).
- `run.json` của mỗi run automation ghi `machine` (`gpu`/`local`) và lý do; manifest clone ghi `machine`.

## SSH và cài đặt

- Đăng nhập bằng key `~/.ssh/id_ed25519_gpu` (mục `Host desktop-kndgm60` trong `~/.ssh/config`); khóa công khai nằm trong `C:\ProgramData\ssh\administrators_authorized_keys` vì tài khoản là admin. Không lưu mật khẩu trong repo hay script. Thu hồi: xóa dòng đó.
- VoiceStudio: chi tiết ở `docs/voice-workflow.md`, mục "Máy GPU qua Tailscale".
- Ollama: `~/ollama-gpu/bin/ollama` (bản Linux 0.40.13 từ GitHub release, giống laptop; `zstd` lấy bằng `apt-get download`, không sudo), model trong `~/ollama-gpu/models` (tải tay bằng `OLLAMA_MODELS=… ollama pull`, digest khớp laptop). Không dùng Ollama cài trên Windows (app riêng của người dùng, không chạy được qua SSH). `run.sh` không bao giờ tải model.
- Gỡ: dừng dịch vụ rồi xóa thư mục tương ứng trong WSL.
