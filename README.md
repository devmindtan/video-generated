# Bộ công cụ thử làm video

## Video đang dựng: 3 lúc người thông minh chọn im lặng

Bản dựng `StoicSilence`: 45 giây, dọc 1080×1920, 30fps, gồm năm cảnh theo kịch bản đã duyệt.

```sh
npm run dev
```

Mở **http://localhost:3000/StoicSilence**, bấm Play và bật âm thanh. Nếu Studio dùng cổng khác, dùng địa chỉ hiện trong terminal rồi chọn `StoicSilence` ở danh sách composition.

- `public/stoic/thumbnail.png`: thumbnail dọc 1080×1920; chỉnh bằng `src/StoicThumbnail.tsx` hoặc chọn Still `StoicThumbnail` trong Studio. Tái xuất bằng `npm run thumbnail:stoic`.
- `src/StoicVideo.tsx`: ảnh nền, chuyển động camera, tiêu đề, hạt bụi, sương, phụ đề và các track âm thanh.
- `src/stoic-captions.json`: phụ đề ngắn, căn theo từ nhận dạng trong bản thu; giữ nguyên chữ của kịch bản.
- `scripts/stoic-story.json`: nguồn kịch bản đầy đủ, danh sách câu và thời gian mỗi cảnh.
- `docs/stoic-script.md`: bản kịch bản dễ đọc để duyệt nội dung.
- `public/stoic/images/`: năm ảnh điện ảnh tạo bằng công cụ image_gen tích hợp; prompt tại `public/stoic/image-prompts.json`.
- `public/stoic/audio/`: nhạc dark cinematic “Sức Mạnh Tĩnh Lặng” và các track giọng nam. Nhạc tự hạ khi có lời đọc, tăng nhẹ ở khoảng nghỉ.
- `public/stoic/captions.srt`: phụ đề có thể nhập vào công cụ khác.

**Lời đọc sử dụng giọng nam tự nhiên “Hải Đăng” của VieNeu-TTS v3 Turbo, chạy miễn phí trên CPU.** Giọng được tạo từ preset có sẵn, tạo lời đọc theo câu hoàn chỉnh, giữ cao độ tự nhiên; tốc độ chỉ được tinh chỉnh nhẹ để vừa cảnh, với khoảng nghỉ ngắn giữa các câu. Không cần ElevenLabs API key. Phụ đề được căn lại theo từ trong bản thu mới bằng faster-whisper. Bộ tạo giọng sẽ dừng nếu phần lời quá dài, cuối cảnh bị trống quá 0,8 giây hoặc đối chiếu nội dung không đạt ngưỡng kiểm tra. Các tệp âm thanh có sẵn nên không cần chạy mô hình khi xem hoặc xuất video.

Nhạc nền mới có nhịp pulse 72 BPM, sub bass, hit chuyển cảnh và texture tối hiện đại; toàn bộ được tổng hợp riêng cho video, không dùng nhạc tải ngoài. Lệnh `npm run check:audio` tạo bản nghe thử tổng hợp tại `out/stoic-audio-review.wav`, kiểm tra mức âm thanh và báo lỗi nếu có khoảng lặng của giọng dài từ một giây trở lên. Bản dựng hiện dùng lời đọc đầy đủ, phần đuôi mỗi cảnh chỉ còn khoảng 0,24–0,52 giây.

Xuất ảnh xem trước hoặc MP4 khi cần:

```sh
npm run still:stoic
npm run render:stoic
```

Đầu ra: `out/stoic-preview.png` và `out/3-quy-tac-im-lang.mp4`. Mẫu cũ `HelloVideo` vẫn dùng lệnh `npm run render`.

Tái tạo giọng và nhạc:

```sh
npm run voice:stoic
npm run music:stoic
npm run check:audio
```

Môi trường `.venv` đã cài VieNeu-TTS, NumPy và faster-whisper; các phiên bản chính được ghi trong `scripts/requirements-voice.txt`. Mô hình giọng nằm tại `.cache/huggingface/`, các câu đọc nằm tại `.cache/stoic-audio/`; mô hình kiểm tra lời đọc nằm tại `.cache/whisper/`. Lần đầu khôi phục môi trường cần mạng để tải mô hình; khi có cache, có thể tái tạo trên máy. Lệnh `npm run music:stoic` tái tạo bản dark cinematic hiện dùng trong video.

Nhạc nền của video Stoic được điều khiển tại `scripts/stoic-music.json`: `sourceStartSeconds` chọn vị trí bắt đầu trong file nhạc, `videoStartSeconds` và `videoEndSeconds` chọn khoảng phát trong video, còn `baseVolume` và `speechVolume` lần lượt là âm lượng khi nghỉ và khi có lời đọc. Bản hiện tại dùng `experience.mp3` từ 1:15, phát trong toàn bộ 45 giây.

---

20 repository gốc nằm trong `repos/`, đặt tên theo dạng `owner--repo` để tránh trùng tên. Đây là shallow clone của nhánh mặc định, không tải toàn bộ lịch sử. `repos-manifest.json` ghi đường dẫn và commit thực tế. Chạy `python3 scripts/clone-repos.py` để tải lại các repo còn thiếu; lệnh này giữ nguyên repo đã có.

## Thử video ngay

Yêu cầu Node.js và npm. Các dependency được cài tại thư mục gốc; lần sau dùng `npm ci` để khôi phục đúng phiên bản trong lockfile.

```sh
npm run dev
```

Mở địa chỉ Studio hiển thị trong terminal. Composition `HelloVideo` dài 5 giây, 1920×1080, 30fps. Sửa chữ, màu và animation trong `src/index.tsx`.

```sh
npm run typecheck
npm run still
npm run render
```

Ảnh xem trước: `out/preview.png`. Video: `out/hello.mp4`. Lần render đầu có thể cần mạng để Remotion tải Chrome Headless Shell. Remotion dùng bộ mã hóa đi kèm; repository FFmpeg là mã nguồn và chưa được biên dịch thành lệnh `ffmpeg` hệ thống.

## Những gì được cài

- Skill: 21 skill từ Remotion Skills, Motion AI Kit và GSAP Skills nằm trong `skills/`. `AGENTS.md` hướng dẫn agent đọc các skill này trong dự án. Chưa cấu hình Motion MCP hoặc Motion+.
- Design: `svgo`, `satori`.
- Animation: `gsap`, `animejs`, `motion`, `@rive-app/canvas`, `@lottiefiles/dotlottie-web`.
- Video: `remotion`, `@remotion/cli`, `@motion-canvas/core`, `@motion-canvas/2d`.
- 3D: `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/rapier`, `@react-three/postprocessing`.
- Âm thanh và media: `howler`, `mediabunny`; mã nguồn FFmpeg nằm tại `repos/FFmpeg--FFmpeg`.

Các npm package là bản phân phối phát hành; commit source clone có thể khác phiên bản npm. Chưa cài dev dependency hoặc build riêng từng upstream monorepo. Motion Canvas có pipeline riêng; package đã sẵn sàng để thử nhưng dự án mẫu hiện dùng Remotion. Các thư viện chạy animation theo thời gian thực cần đồng bộ theo frame trước khi dùng trong video render. Mẫu hiện tại dùng animation theo frame của Remotion.

Danh sách repo và commit đầy đủ: xem `repos-manifest.json`. Giấy phép của từng công cụ nằm trong repository tương ứng.

## Kết quả kiểm tra phụ thuộc

Đã áp dụng `npm audit fix` không dùng `--force`. Còn 2 cảnh báo mức moderate liên quan `satori` → `fflate`; npm đề xuất hạ Satori qua phiên bản có thay đổi API, nên giữ phiên bản đã cài. Mẫu Remotion hiện không dùng Satori. Chưa kiểm thử runtime riêng từng thư viện trong danh sách.
# video-generated
