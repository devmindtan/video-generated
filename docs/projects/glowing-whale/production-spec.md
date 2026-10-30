# Bé Cá Voi Phát Sáng

Short 60 giây · 1080×1920 · 9:16 · 30 fps. Composition `GlowingWhale`, thumbnail `GlowingWhaleThumbnail`.

## Hướng kể

Bọt Biển ngại chiếc bụng phát sáng → Cụ Rùa an ủi → đàn cá hề bị lạc → bé quyết định giúp → dùng ánh sáng dẫn đường → các bạn cảm ơn → bé tự tin hơn. Khác biệt đáng được trân trọng ngay cả khi không cần trở thành người hùng.

Giữ đủ 7 cảnh và các mốc 0 / 8 / 17 / 26 / 35 / 44 / 53 / 60 giây. Lời kể rút gọn, bỏ động tác hít sâu dưới nước, giảm mô tả hiểm nguy cho trẻ nhỏ. CTA đăng ký kênh; không quảng cáo một tập dài chưa được sản xuất.

## Hình và chuyển động

Ảnh tạo bằng imagegen tích hợp, một mẫu Bọt Biển làm tham chiếu các cảnh: da xanh trời, vây lưng xanh đậm, mắt xanh ngọc, bụng kem phát sáng vàng, hai vây bên và đuôi ngang. Ảnh đầu cảnh ở `public/glowing-whale/images/`; bộ prompt ở [image-prompts.md](image-prompts.md). `takes.json` chọn bản kết `07-shine-v2`: nhấp nhô/vẫy vây trên mặt nước thay cho cú nhảy lớn bị đổi mặt và kéo dài thân ở bản đầu. Bản bị loại vẫn giữ nguyên nhưng không dùng trong composition.

Footage hiện có gồm clip 8 giây mỗi cảnh; nguồn 720×1280, upscale khi xuất composition 1080×1920. Cảnh 1 phát khoảng .964×; cảnh 2–6 khoảng .860×; cảnh 7 dùng 7 giây đầu ở 1×. Không loop, không nhân đôi hành động, không Ken Burns/phóng to bằng CSS. Cảnh vào hòa .3 giây trên phần đuôi cảnh trước, không fade qua đen giữa các cảnh. Không tạo lại các clip này khi chuyển tích hợp. Tạo mới chỉ dùng [Gemini API](https://ai.google.dev/gemini-api/docs/veo) theo [trần 20.000₫ mỗi Short](../../../budgets/README.md), hoặc nhập clip từ gói Gemini qua thao tác thủ công.

Đặc điểm nhỏ và vị trí san hô có thể khác giữa các clip AI; cần xem duyệt trong Studio trước khi đăng. Kiểm tra ảnh đầu/cuối không thay thế xem chuyển động toàn tập.

## Âm thanh

Cập nhật: runtime đang dùng [SFX dưới nước v2](sound-v2.md), nền môi trường và mẫu nước CC0 với 30 cue, thay 16 cue tổng hợp quá nhẹ ở bản đầu. Cấu hình hiện hành là `sfx.json`, `music.json`; thông số v1 bên dưới chỉ mô tả bản ban đầu. Chuyển động có sẵn vẫn được giữ, không tạo lại clip để sửa âm.

Giọng B mặc định: Trúc Ly +2.5 bán âm, bù tempo giữ thời lượng. Giọng gốc A ở `audio/`, B ở `audio/childlike/`; dùng prop `voiceVariant: 'original'` để so sánh. Bản đọc căn theo mốc câu trong `story.json`, phụ đề đối chiếu bằng Whisper medium, giữ chính tả kịch bản.

Nhạc gốc celesta/đàn gảy, dịu hơn khi đàn cá bị lạc, mở sáng ở đoạn giải cứu. 16 cue SFX gốc: bọt nước, lướt bơi và điểm sáng; bỏ cú splash lớn theo động tác kết mới. Nguồn Veo luôn muted để không lọt lời nói/nhạc ngoài kịch bản. Cue trong `foley.json` tính theo giây nguồn và được đổi sang tốc độ clip khi dựng stem. Nhạc duck theo phụ đề, SFX duck đã bake trong WAV.

## Lệnh

```sh
npm run dev
npm run typecheck
npm run test:glowing-whale
npm run check:glowing-whale
npm run veo:poll:glowing-whale
npm run veo:poll-ending:glowing-whale
```

Lệnh poll chỉ truy vấn mã đã lưu; không tạo clip mới. Lệnh `veo:glowing-whale` có phí và giới hạn một yêu cầu mới. Không tự retry tác vụ mất mã hoặc không rõ trạng thái. Lỗi quá tải code 8 chỉ retry có giới hạn, lưu lịch sử trong `.cache/veo/glowing-whale/jobs.json`.

Không tự render MP4, still hay thumbnail. Chỉ đăng ký composition, tạo tài nguyên và kiểm tra; người dùng chủ động xuất. `public/` bị gitignore, cần sao lưu asset riêng khi chuyển máy.
