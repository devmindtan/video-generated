# Hai bản giọng để nghe và lựa chọn

A: Trúc Ly gốc, giữ nguyên để đối chiếu. B: cùng giọng nền được nâng 2.5 bán âm và bù tốc độ để mô phỏng giọng hoạt hình trẻ nhỏ. B không phải preset hay bản thu của trẻ em thật. Người dùng đã chọn B làm mặc định cho Tí Hon và các tập sau; không tự render.

Backup trước thay đổi: `public/tiny-dino-adventure/backups/truc-ly-before-long-cta/`, gồm WAV gốc, metadata, caption, SRT và story gốc. Video SFX v2 trước đó vẫn được giữ trong out. Các file lớn trong public/out đang gitignore, cần sao lưu riêng khi chuyển máy.

Giọng B ở `public/tiny-dino-adventure/audio/childlike-preview/`. Hai bản dùng chung hình, câu chữ, thời lượng và SFX để dễ so sánh. Tốc độ/cao độ được xử lý cục bộ, không phát sinh yêu cầu Veo mới. Thời gian câu giữ theo bản A, xử lý atempo có thể làm onset lệch nhẹ; cần nghe duyệt B để quyết định.

Composition mặc định B: `TinyDinoAdventure`; alias nghe thử B: `TinyDinoAdventureChildVoice`. Để nghe A, dùng prop `voiceVariant: 'original'`. WAV gốc vẫn ở thư mục audio ban đầu.

CTA: “Muốn khám phá trọn chuyến phiêu lưu cùng Tí Hon? Xem tập đầy đủ nhé!” Câu hỏi rồi lời mời ngắn, vừa trong cảnh 42–48 giây. Chữ kết: “Khám phá trọn hành trình!” và “Xem tập đầy đủ trên kênh”. Không giả định đã có link video dài hoặc đã đăng lên YouTube.

Định hướng cặp nội dung: tập dài `tiny-dino-homecoming` đã được viết lại thành câu chuyện đầy đủ từ lúc nở trứng đến khi đoàn tụ với mẹ, gồm 8 chặng trong 180 giây. Short chọn hook và các tình huống đầu của cùng hành trình, chưa tiết lộ phần giải quyết, rồi mời xem tập đầy đủ. Không coi tập dài là phần tiếp theo bắt buộc phải xem short trước.

Tạo lại mẫu giọng: `npm run voice:audition:tiny-dino-adventure`. Sau đó chạy `npm run sfx:synced:tiny-dino-adventure` cho mix A, thêm `-- --childlike` cho mix B.
