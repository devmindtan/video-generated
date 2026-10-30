# Prompt sản xuất

Bản dựng hiện tại dùng [chuỗi nối tiếp v3](continuity-v3.md) và `scripts/projects/tiny-dino-homecoming/veo-continuity.json`. Bộ hai góc wide/close bên dưới là lịch sử, không phải mô-típ mặc định cho bản mới. Camera mới khóa ổn định, góc gần chỉ dùng có chủ đích.

Dùng imagegen tích hợp cho ảnh, không dùng CLI hay SVG giả ảnh. Ảnh đầu vào là tham chiếu nhận diện từ Short; không sửa/xóa ảnh Short gốc. Ảnh dự án nằm ở `public/tiny-dino-homecoming/images/`.

## Bộ prompt ảnh ngang bổ sung

Ràng buộc chung: illustration-story; ONE landscape 16:9 cinematic frame; premium warm 3D family animation; preserve exact lime-green Tí Hon, cream muzzle/belly, coral crest, teal cheek spots, amber eyes. Preserve cyan-violet butterfly. No text, logos, watermark, panels or duplicated characters.

1. **01-hatch.png** — Reference: Short 01-hatch.png. Wide establishing frame of the same baby dinosaur emerging from an already cracked speckled egg in a warm twig nest amid a lush magical prehistoric jungle. Full egg visible in middle foreground, colorful mushrooms and ferns, soft morning sunlight and distant waterfall, joyful face.
2. **02-log.png** — Reference: Short 02-log.png. Tí Hon takes a tentative step across a broad LOW mossy fallen log over a very shallow crystal stream, arms spread, curious cute expression. Entire dinosaur including feet and tail visible, safe crossing, colorful ferns and mushrooms, golden light; widen the jungle environment horizontally.
3. **03-butterfly.png** — Reference: Short 03-butterfly.png. Tí Hon stands on safe mossy ground with both feet visible, smiling curiously at ONE luminous cyan butterfly with violet rim hovering in front of his snout. Full character centered with space around face; lush ferns, tiny glowing mushrooms and distant waterfall in warm forest.
4. **04-slide.png** — Reference: Short 04-slide.png. Tí Hon sits on a broad smooth curved giant leaf slide. Both feet forward, tiny arms raised joyfully; ONE cyan-violet butterfly follows beside him. Leaf curves gently down to a safe thick dry bed of rainbow flower petals, no water pool. Full dinosaur center-left, sunny jungle fills horizontal edges.

Bốn ảnh còn lại tái sử dụng tài nguyên ngang đã có: 02-mushrooms → 05-mushrooms, 03-snail → 06-snail, 04-rain → 07-rain, 05-nest → 08-nest. Giữ file cũ để bảo toàn bản dựng cũ/thumbnail cũ.

## Bộ prompt chuyển động

Nguồn chính xác, đầy đủ và có thể chạy lại: `scripts/projects/tiny-dino-homecoming/veo.json` (16 prompt, mỗi prompt có first-frame image, thời lượng timeline, model override nếu cần). Không sao chép các prompt cũ 5 cảnh của bản phần tiếp theo vào bản đầy đủ.

Mỗi chặng có wide và close, giữ nguyên sinh vật và môi trường, yêu cầu chuyển động cơ thể thực tế. Âm thanh chỉ SFX và thiên nhiên; không lời nói, hát hay nhạc, vì sẽ ghép giọng B và nhạc riêng. Chỉ điền manifest sau khi kết quả tải thành công. Xem lại anatomy, hành động, pose ở điểm cắt và âm thanh trước khi tự xuất.

Góc cận Ốc Sên dùng phiên bản `06-snail-close-v2`: bản đầu bị Veo kéo dài râu thành vật trong tay Tí Hon, nên không dùng trong timeline. Prompt mới giữ hai tay bé ở bụng, râu giữ nguyên độ dài, không chạm vào Ốc Sên. Clip cũ vẫn được giữ để đối chiếu.

Góc cận trượt lá dùng `04-slide-close-v2`, khóa đúng Tí Hon và Bướm Xanh, không để Ốc Sên xuất hiện trước cảnh gặp gỡ. Góc cận đoàn tụ dùng `08-nest-close-v2`, khóa đúng bốn nhân vật đã có, không tự thêm Ốc Sên thứ hai ở tiền cảnh. Các bản đầu vẫn lưu nhưng không được timeline tham chiếu.

Góc cận thân cây được crop 1.4×, neo phía trên để giữ mặt/tay và loại các chi tiết phụ AI thêm ở rìa trái. Không thay đổi tốc độ hoặc SFX của shot này.
