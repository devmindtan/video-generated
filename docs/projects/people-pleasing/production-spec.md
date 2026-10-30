# Tử tế, đừng quên giới hạn

Composition `StoicPeoplePleasing`: 48 giây, 30 fps, 1080×1920. Cover `PeoplePleasingThumbnail` chỉ là component đã đăng ký, chưa xuất ảnh.

## Biên tập lời thoại

Giữ sự dứt khoát nhưng chuyển từ phán xét con người sang mô tả hành vi: miệng nhận lời dù trong đầu muốn từ chối; gác việc riêng để tránh làm người khác thất vọng; nói rõ khả năng và giới hạn. Mở bằng tình huống cụ thể, không dùng lại cấu trúc vỗ về.

Bỏ “bạn không hề tốt bụng”, “cơn nghiện công nhận rẻ mạt”, “kẻ tàn nhẫn nhất”, và khẳng định mọi người sẽ giẫm đạp khi thiếu ranh giới. Không trình bày đây là quy luật tâm lý hay chẩn đoán. Không dùng ẩn dụ cánh cửa bị lau chân (lẫn cửa với thảm). Không khuyên lạnh lùng, phá cam kết hay bỏ trách nhiệm: thay bằng hai mẫu câu rõ phạm vi nhận việc, lịch sự nhưng dứt khoát. Việc một người chưa nói rõ giới hạn không cho ai quyền lợi dụng họ.

Hai câu hành động: “Hôm nay tôi không nhận thêm việc.” và “Tôi giúp được phần này, phần còn lại thì không.” Câu chốt: “Tử tế không có nghĩa là luôn đồng ý.” [Script hoàn chỉnh](script.md).

## Hình và giọng

Cảnh ở 0–8, 8–18, 18–28, 28–38, 38–48 giây. Năm ảnh mới theo prompt mặt nạ, vòng kim loại mở, giày/lụa, cổng, bóng người dưới đèn. Tông lạnh xanh tím, framing ổn định; chỉ có ánh sáng trang trí theo frame ở hai cảnh đầu. Không zoom đều mọi cảnh, không giả mặt nạ đang tách hay cổng sập thật. Chuyển chồng mờ ngắn 0,16 giây, giữ ảnh trước thêm 0,2 giây. [Prompt và đường dẫn asset](image-prompts.md).

Giọng Hải Đăng dùng pipeline VieNeu cục bộ, tốc độ gốc 1×. Giọng thấp, câu gọn, không kéo chữ hay hét; giọng nhận diện vẫn như Stoic Control. Rút câu nếu quá thời lượng thay vì làm chậm/tăng tốc toàn bài. Căn phụ đề bằng faster-whisper medium cục bộ, giữ chữ tác giả trong Caption JSON/SRT.

Caption dùng rõ `Stoic Sans` **Bold 700** (Noto Sans Bold local), cỡ 44px, chữ trắng ngà và từ khóa vàng như mẫu Stoic gốc. Thumbnail áp dụng cùng nhận diện: tiêu đề và dòng phụ Bold 700, headline nhấn vàng trên nền tối. Không dùng weight 500/750/800 vì nguồn font chỉ có 400/700. Giữ timing, căn giữa và vị trí caption; tô từ khóa không thay đổi chữ hay khoảng trắng. Quy tắc này đã lưu trong AGENTS.md để các tập triết lý sau áp dụng đồng bộ, không tự sửa các tập cũ. Kiểm tra cả hai bằng `node scripts/projects/people-pleasing/test-caption-style.cjs`.

## Nhạc

Theo yêu cầu dùng **Snowfall**, không Phonk/808. Nguồn đầy đủ có sẵn `public/own-timeline/audio/snowfall.mp3` dùng read-only, không tạo đoạn asset 48 giây. Native Audio mặc định từ timeline 0, source trim 24,9 giây, tốc độ nhạc 1×. Đầu/cuối/tốc độ/source trim chỉnh trực tiếp trong Studio Edit, không đặt trong config khóa thời gian.

Giữ `speechVolume`/`pauseVolume` trong `src/projects/people-pleasing/music.json`, duck theo phụ đề. Fade-in 1,2 giây và fade-out 2 giây dùng shared MusicFade, bám mép clip hiện tại và giới hạn composition. Không xóa volume controls khi cho chỉnh timing. Nguồn có sẵn không đồng nghĩa đã có giấy phép đăng nhạc; kiểm tra quyền trước khi đăng.

**Không có SFX** theo lựa chọn gần nhất của người dùng. Không thêm tiếng nứt/gate/bass impact để lấp khoảng trống.

## Xem và kiểm tra

```sh
npm run check:people-pleasing
npm run typecheck
npm run test:music-edit
node scripts/projects/discipline-purpose/test-music-fade.mjs
npm run dev
```

Chọn `StoicPeoplePleasing` để nghe/xem duyệt. QA kiểm tra ảnh, WAV/metadata native 1×, chữ và thời gian phụ đề, giải mã mix trong RAM với timing nhạc đọc từ JSX và fade/duck đúng công thức runtime; không xuất WAV mix, MP4, preview still hoặc thumbnail. Báo cáo [qa.json](qa.json). Kiểm tra kỹ thuật không thay thế đánh giá nghe/xem thực tế của người dùng.

Tạo lại giọng/phụ đề cục bộ bằng `npm run voice:people-pleasing`, giữ cache những câu không đổi. Không dùng Gemini app/API/Veo/Vertex, không tự render. Project mới độc lập, không sửa nội dung các video cũ.
