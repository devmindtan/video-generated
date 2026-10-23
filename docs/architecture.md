# Kiến trúc project video

Mục tiêu của cấu trúc này là nhìn vào đường dẫn đã biết ngay một file thuộc project nào, hay là phần dùng chung. `slug` là tên kebab-case ổn định của project, ví dụ `crab-mentality`.

```text
src/
  projects/<slug>/       Video.tsx, Thumbnail.tsx, captions.json, music.json
  shared/                code runtime dùng chung
  examples/              composition thử nghiệm
  index.tsx              entry point tối thiểu
scripts/
  projects/<slug>/       story và script sản xuất riêng
  shared/                pipeline dùng chung
  tooling/               bảo trì repository
docs/projects/<slug>/    script, review, description, production spec
public/<slug>/           ảnh, audio, video, font và asset lớn
```

## Ranh giới dùng riêng và dùng chung

- Mặc định, code mới nằm trong project sở hữu nó.
- Chỉ chuyển một phần sang `shared/` khi có ít nhất hai project thật sự sử dụng và API đã rõ.
- `src/shared/` chỉ chứa code chạy trong Remotion. Công cụ Python/Node dùng khi sản xuất nằm trong `scripts/shared/`.
- Không import trực tiếp từ project này sang project khác. Nếu hai project cần cùng một phần, tách phần đó sang `shared/`.
- Config được component import lúc render, như `music.json`, nằm cạnh component. Dữ liệu đầu vào cho pipeline, như `story.json`, nằm trong `scripts/projects/<slug>/`.
- Asset trong `public/<slug>/` giữ nguyên theo project để URL `staticFile()` dễ đoán và không phụ thuộc đường dẫn source.

## Thêm project mới

1. Tạo `src/projects/<slug>/Video.tsx`; thêm `Thumbnail.tsx`, `captions.json`, `music.json` nếu cần.
2. Tạo `public/<slug>/` cho asset.
3. Tạo `scripts/projects/<slug>/story.json` và các script riêng nếu project có pipeline audio.
4. Tạo `docs/projects/<slug>/script.md` và tài liệu liên quan.
5. Đăng ký video/thumbnail trong `src/projects/registry.tsx`.
6. Thêm command rút gọn vào `package.json` nếu cần.
7. Chạy `npm run typecheck`, sau đó kiểm tra composition trong `npm run dev`.

## Nguyên tắc đặt tên

- Thư mục project và asset: `kebab-case`.
- Component export: `PascalCase` có ý nghĩa nghiệp vụ, ví dụ `BoundariesVideo`.
- File chuẩn trong project dùng tên ngắn ổn định: `Video.tsx`, `Thumbnail.tsx`, `captions.json`, `music.json`, `story.json`.
- Composition ID là public API của lệnh render; không đổi ID chỉ vì di chuyển file.
