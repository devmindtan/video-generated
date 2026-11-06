# Tạo ảnh local cho thumbnail

Runtime dùng **ComfyUI v0.44.0 + SDXL Base 1.0** trên `desktop-kndgm60` (GTX 1660 SUPER 6 GB). Nó không dùng API trả phí, chỉ bind `127.0.0.1` trong WSL và được chuyển tiếp về `127.0.0.1:8189` trên laptop. Runtime/model nằm ngoài Git tại `~/imagegen-gpu`; không đưa model, cache hay ảnh nháp vào repository.

SDXL Base 1.0 là model CreativeML Open RAIL++-M, file `sd_xl_base_1.0.safetensors` 6.938.078.334 byte, SHA-256 `31e35c80fc4829d14f90153f4c74cd59c90b779f6afe05a74cd6120b893f7e5b`. ComfyUI dùng GPL-3.0. Bản cài giữ license SDXL tại `~/imagegen-gpu/SDXL-LICENSE.md` và commit ComfyUI tại `~/imagegen-gpu/COMFYUI_COMMIT`.

## Nguyên tắc

- SDXL tạo **hình nền/nhân vật không chữ**. Typography tiếng Việt, bìa sách, logo và các chi tiết phải chính xác được ghép bằng Remotion.
- Tuân thủ rule hình của series: ảnh AI/người thật không lộ mặt; ưu tiên góc sau, silhouette hoặc mặt bị che. Không tạo hình người thật cụ thể, người nổi tiếng hoặc nội dung gây hiểu lầm.
- Mỗi lần sinh lưu PNG và manifest JSON (prompt, negative prompt, seed, kích thước, steps, CFG) dưới `public/<slug>/generated/` để tái tạo được.
- Card 6 GB chỉ chạy một model nặng. Lệnh từ chối chạy nếu VoiceStudio hoặc Ollama đang giữ GPU; không tự dừng công việc khác.
- ComfyUI chạy `--offline`, tắt custom nodes và không dùng partner/cloud nodes.
- Cấu hình card 6 GB dùng `--lowvram`, VAE trên CPU và nạp UNet/text encoder ở FP8; kích thước mặc định đã thử thực tế là 1024×576, 24 bước. Không dùng cấu hình `novram` vì 12 GB RAM của WSL không đủ an toàn cho checkpoint SDXL đầy đủ.
- Prompt không được coi là bộ điều khiển bố cục chính xác. Chọn ảnh đạt về chủ thể/ánh sáng, sau đó dùng Remotion để khóa vị trí, gradient, chữ và bìa thật; loại ảnh lộ mặt hoặc không còn vùng chữ sạch.

## Dùng

Tạo hai file prompt trong repository, rồi chạy:

```bash
npm run image:local -- generate \
  --project book-hvtt-001-overview \
  --name thumbnail-background-v1 \
  --prompt-file docs/projects/book-hvtt-001-overview/thumbnail-prompt.txt \
  --negative-file docs/projects/book-hvtt-001-overview/thumbnail-negative.txt \
  --seed 20261106 --width 1024 --height 576 --steps 24 --cfg 7
```

Các lệnh quản trị:

```bash
npm run image:local -- status
npm run image:local -- start
npm run image:local -- stop
npm run test:image-local
```

`start` chỉ dành cho xem ComfyUI thủ công tại `http://127.0.0.1:8189`; `generate` tự mở và dừng dịch vụ theo lease. Không tự render/export thumbnail hoàn chỉnh sau khi tạo nền.
