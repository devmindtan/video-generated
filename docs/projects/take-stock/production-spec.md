# Đừng đợi mất đi mới biết trân trọng

`StoicTakeStock`: 48 giây, 30 fps, 1080×1920. Cover `TakeStockThumbnail` đã cập nhật component; chưa xuất ảnh.

## Bản lời đã được duyệt

Người dùng chốt lại chủ đề bằng câu: “Tôi đã khóc khi không có giày để đi cho đến khi tôi thấy một người không có chân để đi giày.” Triển khai nguyên văn năm đoạn lời đã được duyệt trong hội thoại, không quay lại bản “kiểm kê kỹ năng/công cụ”. [Lời đọc](script.md).

Mạch: câu nói mở đầu → điều bình thường của mình có thể là mong mỏi của người khác → mải nhìn giày mà quên đôi chân → nghĩ về đôi chân trước cả những lúc đau → trân trọng trước khi mất. Đoạn 4 thay bằng câu đã duyệt “Ta không phải đợi mất đi mới biết một điều quý giá đến đâu...”; các đoạn khác giữ nguyên. Không tự gán tác giả câu nói. Không thêm lời trách “đóng vai nạn nhân”, cảnh bò, đau đớn hoặc thương hại.

## Hình và chữ

Ảnh nguồn tĩnh, framing ổn định, fade vào 0,16 giây và giữ ảnh trước thêm 0,2 giây; không habitual zoom, không video AI. Scene 1 đổi thành đôi giày sau cửa kính cửa hàng; scene 3 đổi thành người dùng xe lăn nhìn bình minh trong sinh hoạt bình thường, trang phục kín, không vết thương. Các ảnh lồng mở, giày trên nền đất và cột đá được giữ lại làm không khí minh họa. Không còn cảnh bàn tay/công cụ trong bản đang chọn.

Ảnh mới và prompt đầy đủ: [image-prompts.md](image-prompts.md). Đã xem trực tiếp hai ảnh nguồn mới; không render frame để kiểm tra. Caption/headline/thumbnail giữ local **Stoic Sans/Noto Sans Bold 700**, trắng ngà và nhấn vàng. 44px caption, 88px headline. Chữ trên hình không thay thế câu đọc.

Thumbnail v3: ghép hai crop tĩnh từ ảnh hiện có (giày bên trái, người dùng xe lăn bên phải), phân chia chéo và chuyển tối mềm phía sau chữ. Chỉ giữ hook bốn từ “TÔI TƯỞNG / MÌNH THIẾU…” ở 112/126px, logo STOIC nhỏ; bỏ đoạn giải thích dài. Không dùng mũi tên, khoanh đỏ, từ ngữ thương hại hoặc hình vết thương để gây chú ý. Kiểm tra font metrics: hai dòng rộng khoảng 628/849px trong khung 932px; ở chiều rộng hiển thị 180px tương đương 18,7/21px. Đây là kiểm tra kích thước, chưa phải duyệt cảm nhận hay bằng chứng CTR. Bản thumbnail trước lưu tại `public/take-stock/backups/thumbnail-v2/Thumbnail.tsx`. Không đổi nội dung video, giọng hoặc nhạc; không render ảnh.

## Giọng và nhạc

Hải Đăng local VieNeu, native 1×. Câu mở đầu ngắt 1 giây giữa hai vế; cảnh 4 mới ngắt 0,32 giây trước “Đôi chân vẫn đưa mình đi...”. Chỉ thay giọng/phụ đề riêng cảnh 4, giữ nguyên các cảnh còn lại. Caption JSON/SRT căn theo bản thu bằng faster-whisper medium cục bộ. Bản cảnh 4 trước lần sửa này lưu tại `public/take-stock/backups/scene4-v2/`.

Giữ nguyên music.json và timing Audio hiện có: **snowfall — Øneheart & reidenshi**, full source `public/own-timeline/audio/snowfall.mp3`, source trim 24,9 giây, native duration 48 giây, playback 0,85×. Start/Duration/End/source trim vẫn sửa độc lập trong Studio Edit; không bake nhạc thành đoạn 48 giây. Speech/pause volume 0,18/0,26, duck theo caption mới. Fade-in 1,2 giây và fade-out 2 giây theo mép clip/composition bằng shared MusicFade. Không SFX.

## Bản cũ và kiểm tra

Giọng/SRT cũ: `public/take-stock/backups/narration-v1/`; TSX/caption cũ trong thư mục `source/` tại đó. Story cũ: `scripts/projects/take-stock/backups/v1/`; docs cũ: `docs/projects/take-stock/backups/v1/`. Ảnh cũ giữ nguyên, không xóa.

```sh
npm run check:take-stock
npm run typecheck
npm run test:music-edit
node scripts/projects/discipline-purpose/test-music-fade.mjs
npm run dev
```

Checker xác minh đúng năm ảnh đang chọn từ JSX, lời/phụ đề và native giọng 1×; mix trong RAM theo timing/gain Audio thật. [QA](qa.json). Kiểm tra kỹ thuật không thay thế nghe duyệt trong Studio. Không xuất MP4, mix WAV, preview frame hoặc thumbnail. Không Gemini/Veo/Vertex hay chi phí API tạo video.
