# Video playground

Môi trường tạo, xem trước và xuất video bằng React và Remotion. Tài liệu này hướng dẫn quy trình sử dụng chung cho các video trong dự án.

## Cài đặt

Yêu cầu Node.js và npm. Chạy các lệnh tại thư mục gốc của dự án:

```sh
npm ci
```

## Xem trước

```sh
npm run dev
```

Mở địa chỉ Remotion Studio hiển thị trong terminal, chọn composition trong danh sách rồi bấm Play. Bạn có thể tua đến từng frame để kiểm tra hình ảnh, chuyển động và âm thanh.

## Chỉnh sửa hoặc thêm video

1. Tạo hoặc chỉnh sửa project trong `src/projects/<slug>/`.
2. Đăng ký component bằng `<Composition>` trong `src/projects/registry.tsx`, khai báo `id`, kích thước, `fps` và `durationInFrames`. Với ảnh tĩnh, dùng `<Still>`.
3. Đặt ảnh, âm thanh và tài nguyên khác trong `public/<slug>/`; sử dụng `staticFile()` của Remotion để tham chiếu chúng.
4. Xem trước trong Studio và kiểm tra TypeScript:

```sh
npm run typecheck
```

Thời lượng video được tính bằng `durationInFrames / fps`. Animation cần dựa trên frame của Remotion để kết quả khi xem trước, tua và xuất video nhất quán. Các thư viện animation chạy theo thời gian thực cần được đồng bộ theo frame trước khi sử dụng.

## Xuất ảnh và video

Xuất bản mẫu mặc định bằng các lệnh có sẵn:

```sh
npm run still
npm run render
```

Đầu ra lần lượt là `out/preview.png` và `out/hello.mp4`.

Để xuất composition khác, thay `CompositionId` bằng `id` đã đăng ký trong `src/projects/registry.tsx`:

```sh
npx remotion still src/index.tsx CompositionId out/preview.png --frame=0
npx remotion render src/index.tsx CompositionId out/video.mp4
```

Với video, `--frame` chọn frame cần xuất thành ảnh. Với composition ảnh tĩnh (`<Still>`), có thể bỏ tùy chọn này. Các lệnh rút gọn riêng cho từng video được khai báo trong phần `scripts` của `package.json`.

Lần xuất đầu tiên có thể cần kết nối mạng để Remotion tải Chrome Headless Shell.

## Cấu trúc thư mục

| Đường dẫn | Mục đích |
| --- | --- |
| `src/index.tsx` | Điểm khởi tạo Remotion; không chứa code riêng của video |
| `src/projects/<slug>/` | Video, thumbnail, captions và config runtime riêng của một project |
| `src/projects/registry.tsx` | Nơi đăng ký toàn bộ composition và still |
| `src/shared/` | Mã runtime đã được ít nhất hai project dùng chung |
| `src/examples/` | Composition thử nghiệm, không thuộc project sản xuất |
| `public/<slug>/` | Asset lớn của từng project; giữ URL ổn định |
| `scripts/projects/<slug>/` | Story và pipeline riêng của project |
| `scripts/shared/` | Công cụ sản xuất dùng chung |
| `scripts/tooling/` | Công cụ bảo trì repository |
| `docs/projects/<slug>/` | Kịch bản, review và mô tả riêng của project |
| `out/` | Kết quả xuất ảnh, video và các tệp kiểm tra |
| `skills/` | Hướng dẫn sử dụng Remotion, Motion và GSAP cho agent |
| `repos/` | Mã nguồn upstream để tham khảo |
| `repos-manifest.json` | Danh sách repository upstream và commit tương ứng |

Quy tắc phân ranh giới và checklist thêm project nằm trong [`docs/architecture.md`](docs/architecture.md). Sử dụng các npm package đã cài ở thư mục gốc khi phát triển. Không chỉnh sửa `repos/` để triển khai video. Nếu cần tải lại các repository tham khảo còn thiếu, chạy `python3 scripts/tooling/clone-repos.py`.

## Làm việc với agent

`AGENTS.md` chứa quy ước của dự án. Trước khi tạo hoặc sửa video, agent cần đọc `skills/remotion-best-practices/SKILL.md` và các quy tắc liên quan. Với Motion hoặc GSAP, đọc thêm skill tương ứng trong `skills/`.
