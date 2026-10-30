# Kỷ luật cần một lý do

Composition: `StoicDisciplinePurpose`; 48 giây, 30 fps, 1080×1920. Cover: `DisciplinePurposeThumbnail`, chỉ đăng ký component, chưa xuất ảnh.

## Nội dung

Giữ cú phản biện nhưng không quy mọi sự kiệt sức cho thiếu động lực. Bỏ cách gọi điều kiện cần/đủ: đây là góc nhìn thực hành, không phải định luật tâm lý. Phân biệt lý do (đích đến), động lực (muốn theo đuổi), kỷ luật (giữ nhịp hành động). Tránh lời kết vỗ về và cấu trúc chữa lành lặp lại. Lời thoại hoàn chỉnh trong [script](script.md).

## Hình và giọng

Năm cảnh bắt đầu ở 0, 8, 18, 28, 38 giây. Ảnh tĩnh mới, bố cục ổn định, không zoom liên tục; bụi và ánh sáng trang trí lấy từ frame Remotion. Chuyển cảnh chồng mờ 0,2 giây. Xem [prompt và đường dẫn asset](image-prompts.md).

Giọng Hải Đăng giữ tốc độ gốc 1×, không kéo chậm để lấp thời lượng. Căn phụ đề theo audio cục bộ, giữ chính tả tác giả. Cần nghe duyệt trong Studio trước khi xuất; QA tự động không thay thế nghe thực tế.

## Nhạc và SFX

Experience reverb dùng lại nguồn đầy đủ có sẵn tại `public/single-task/audio/experience-reverb-full.wav`, không sửa asset của tập trước. Đây là xử lý reverb cục bộ, không khẳng định là remix bên thứ ba hoặc có quyền đăng nhạc thương mại; người đăng cần kiểm tra quyền sử dụng.

Trong Edit chọn track nhạc để chỉnh đầu/cuối, source trim, tốc độ. Timing nằm trực tiếp trong Audio JSX, không đóng cứng vào file nhạc 48 giây. Âm lượng vẫn chỉnh bằng `speechVolume` và `pauseVolume` trong `src/projects/discipline-purpose/music.json`; tự hạ theo phụ đề. Giữ fade-in 1 giây và fade-out 2 giây, chỉnh bằng `fadeInSeconds`/`fadeOutSeconds` trong cùng JSON. Envelope đọc timing từ chính Audio, bám theo mép clip sau chỉnh sửa và giới hạn ở mép composition, không giữ mốc kết thúc cũ. Không sửa file nhạc nguồn.

SFX ma sát kim loại bắt đầu giây 8 (2 giây), tiếng động cơ trầm giây 29 (4 giây). Tổng hợp cục bộ bằng NumPy, là âm thanh cách điệu gốc, không phải thu âm thực địa. Âm lượng riêng trong `sfx.json`; timing chỉnh trong Edit. Nguồn và thông số lưu tại `public/discipline-purpose/audio/sfx-provenance.json`.

## Kiểm tra và xem trước

```sh
npm run check:discipline-purpose
npm run test:music-edit
node scripts/projects/discipline-purpose/test-music-fade.mjs
npm run typecheck
npm run dev
```

Chọn `StoicDisciplinePurpose` trong Studio. [QA](qa.json) kiểm tra thời lượng, ảnh, phụ đề, tốc độ giọng và mix offline; không xuất WAV mix hay render video/ảnh preview. Tạo lại giọng: `npm run voice:discipline-purpose`. Tạo SFX: `npm run sfx:discipline-purpose` (không ghi đè file đang có).

Không dùng Gemini, Veo, Vertex hoặc API tạo video. Không tự render MP4 hay thumbnail.
