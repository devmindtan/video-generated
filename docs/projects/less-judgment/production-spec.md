# Less judgment — bản dựng đầu

## Thumbnail hiện tại — v2

Người dùng yêu cầu cải thiện thumbnail. Bản v2 chuyển sang tượng đá cổ bịt mắt, nhấn việc phán xét khi chưa hiểu rõ. Copy: **CHƯA HIỂU HẾT… ĐÃ VỘI PHÁN XÉT?**. Cỡ 88 / 78 / 144px, Stoic Sans Bold 700, ivory và gold; safe width 896px, độ rộng dòng lần lượt 760 / 273 / 786px. Ảnh riêng `public/less-judgment/images/thumbnail-blind-judgment-v2.png`, tạo bằng imagegen tích hợp, đã xem ảnh gốc; [prompt](thumbnail-v2-prompt.md). Tượng được phép theo sở thích người dùng, không dùng mặt người thật. Bản cũ giữ trong `public/less-judgment/backups/thumbnail-v1/Thumbnail.tsx`. Năm ảnh của video giữ nguyên. Không tự xuất thumbnail hoặc frame xem trước.

## Lịch sử bản đầu

Tên **Chuyện gì cũng cần một lời nhận xét sao?**; composition `StoicLessJudgment`, 1080×1920, 30 fps, 1500 frame / 50 giây. Thumbnail `LessJudgmentThumbnail`: **ĐI CÀ PHÊ… HAY ĐI CHẤM ĐIỂM?**, búa gỗ đặt trên sách chưa mở cạnh hai tách cà phê. Chuẩn bị component, không export/render.

## Kịch bản và giọng

[Kịch bản đầy đủ](script.md) đi từ tình huống thật tại quán cà phê đến phản xạ góp lời, nhận ra thiếu thông tin, rồi chuyển câu chuyện về người trước mặt. Không mạng xã hội, không phân xử đồng nghiệp. Câu kết giữ: “Một buổi gặp gỡ đâu cần trở thành buổi chấm điểm những người vắng mặt.” So với bản gợi ý, câu chữ cụ thể hơn và có cách chuyển hướng thực tế: “Chuyện của họ, mình cũng không rõ” → “Dạo này bạn thế nào?”. Không thêm CTA hoặc lời vỗ về.

Quốc Tuấn tiếp tục từ tập trước, VieNeu local legacy24 / 24 kHz PCM16 / native 1×. `--voice-style` không được dùng làm điều khiển model. Take gốc 43.76621 giây, bản có khoảng nghỉ dài 50 giây. Không kéo chậm tiếng nói; thêm 6.23379 giây silence, ưu tiên sau các bước ngoặt và trước câu kết. V1 gốc/pauses và mọi audition đều giữ.

Đọc raw ASR phát hiện “người quen” thành “người quanh”, “cả buổi gặp” thành “ca buổi gặp”. Đã tạo riêng hai câu bằng local temperature 0.45, đổi dấu ngắt ở lời trích dẫn; câu thứ hai biên tập gọn thành “Cứ thế, cuộc trò chuyện chỉ còn là những lời khen chê người vắng mặt.” Take fix-v1 giữ làm lịch sử, fix-v2 được chọn vì raw transcript có đúng các từ/dấu. Đây không phải phán quyết chất lượng nghe; người dùng vẫn cần nghe duyệt.

Active source `public/less-judgment/audio/narration-quoc-tuan-v2-pronunciation.wav`. Thay hai vùng 6.17821–10.0265 và 15.45871–19.53721 giây (có dùng phần silence sẵn có), toàn bộ PCM bên ngoài giữ nguyên; không đổi tốc độ, tổng 50 giây hoặc start frame các cảnh. Script `repair-pronunciation.py` và voice.json lưu SHA, vùng thay, provenance. Backup meta/caption v1 tại `public/less-judgment/backups/narration-v1/`. Runner tạo v1 giữ lịch sử, không chạy lại ghi đè lựa chọn mới.

Caption 24 trang, chính tả và dấu câu theo kịch bản hiện tại; chỉ hai nhóm câu sửa được căn lại từ ASR mới. Source-clock toàn narration và caption cùng một Sequence. SRT trong `public/less-judgment/captions.srt`. Không dùng accent-insensitive match để kết luận phát âm đã được duyệt.

## Hình ảnh và bố cục

Năm ảnh trong `public/less-judgment/images/` được tạo riêng bằng imagegen tích hợp, xem từng ảnh trước khi dùng. [Prompt đầy đủ](image-prompts.md). Không người, mặt, tay, bóng người, chân dung hoặc phản chiếu. Màu gỗ tối, charcoal, ivory và gold; quán cà phê thống nhất. Không Gemini/Veo. Cảnh: hai tách cà phê → búa phán quyết trên sách đóng → trang sách chưa đọc → hai tách gần nhau, sách sang bên → toàn cảnh bàn và ghế đối diện.

Scene start frame 0 / 307 / 592 / 878 / 1233; overlap 6 frame với incoming opacity fade 0.2 giây, không zoom. Chuyển hình ở khoảng nghỉ, không dùng phát lại toàn/cận để kéo dài.

Stoic Sans / Noto Sans Bold 700 cho caption 44px, headline 88px và thumbnail 84–110px, ivory với nhấn gold. Headline dài rút gọn để nằm trong safe width: “Chưa rõ chuyện”, “đừng vội phán xét”. Chữ caption không đổi bởi styling. Guard theo reference people-pleasing kiểm tra cả caption/thumbnail, font installed weights và nhấn gold.

## Nhạc và kiểm tra

**Night — Ludovico Einaudi**, tên/tác giả theo full source MP3 local. Giữ native source trim ban đầu 53.954 giây và playbackRate 0.79 theo kiểu nhạc tập trước, duration source 50 giây; audible span được composition giới hạn 50 giây. Source trim khác timeline Start; native Audio cho sửa start/duration/end và trim độc lập trong Edit. Không bake một excerpt cố định.

music.json speechVolume 0.18 / pauseVolume 0.25, caption-driven ducking, fade-in 1.2s và fade-out 2s theo audible clip/composition edges. Không SFX.

TypeScript và QA kỹ thuật đã qua: `npm run typecheck`, `npm run check:less-judgment`. QA đọc props Audio trong JSX hiện có, đối chiếu PCM/hash của vùng sửa và vùng giữ, script/caption, thời gian cảnh, kích thước ảnh, đo chữ không tràn, mix trong RAM. Lần đầu peak −2.09 dBFS, nhạc thấp hơn giọng 18.77 dB khi có lời. Chưa xác nhận chất giọng/phối bằng nghe; mở Studio để người dùng duyệt. Không render MP4, thumbnail, preview frame hoặc mix WAV.

[Mô tả đăng YouTube kèm nhạc và tác giả](description.md).
