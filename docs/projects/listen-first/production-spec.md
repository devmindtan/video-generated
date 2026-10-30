# Lắng nghe trước — ghi chú dựng

## Nội dung

Composition `StoicListenFirst`, 45 giây / 1350 frame, 1080×1920, 30 fps. Giữ lời dẫn 161 từ vừa được người dùng duyệt ở `script.md` và `scripts/projects/listen-first/audition.json`. Sáu chặng: lời khuyên đến quá sớm → biến buồn thành bài toán → người nói phải bảo vệ cảm xúc → biết cách nhưng chưa có sức/nơi nói thật → hỏi họ cần gì → thấu hiểu giúp có thêm sức. Không nói rằng mọi lời khuyên đều xấu; giữ lựa chọn “cùng tìm cách” hoặc “ngồi nghe”.

## Giọng và caption

Quốc Tuấn, VieNeu v3 Turbo local, legacy24 / 24 kHz PCM16, native 1×. Take nguyên bản giữ tại `public/voice-auditions/listen-first-quoc-tuan-v1/`, dài 39,54825 giây. Không TTS từ xa, không voice cloning. Không coi mô tả style là model control.

Raw transcript đã được đọc đối chiếu với toàn văn, nhận đúng từ và các dấu tiếng Việt hiển thị, bao gồm “an ủi”, “chấm điểm”, “chưa đủ sức”, “thấu hiểu”. Match 100% chỉ là hỗ trợ; không mô tả phát âm/cảm xúc đã được duyệt trước khi người dùng nghe. Không cần tái tạo take để cải thiện điểm ASR.

Nguồn `public/listen-first/audio/narration-quoc-tuan-v1.wav` được sao chép nguyên bản, thêm 5,45175 giây silence giữa các câu/đuôi để thành `narration-quoc-tuan-v1-pauses.wav` đúng 45 giây. Mọi mẫu PCM nguồn giữ nguyên; metadata hash/copySpans/cuts và phraseRanges nằm tại `scripts/projects/listen-first/voice.json`. Không giãn tiếng hoặc tăng tốc. 25 trang caption được căn theo giọng, tách ở ranh giới câu để không hiện lời xuyên khoảng nghỉ; xuất SRT kèm JSON.

## Hình và nhận diện

Sáu ảnh tạo bằng công cụ imagegen tích hợp, bản gốc ở `public/listen-first/images/`; đã xem từng ảnh. Prompt tại `image-prompts.md`. Không người sống, mặt người hoặc phản chiếu người. Mảnh tai bằng đá là chi tiết tượng rời, không có đầu/mặt; phù hợp tùy chọn tượng của người dùng.

Scene starts 0 / 181 / 371 / 618 / 1000 / 1168 frame; lengths 187 / 196 / 253 / 388 / 174 / 182. Các ảnh khung ổn định, không zoom, crossfade 6 frame trong khoảng nghỉ. Cảnh 4 dài hơn vì chứa hai ý về chưa đủ sức và nơi được nói thật; không chia chữ thành cảnh giả để kéo thời lượng.

Stoic Sans local/Noto Sans Bold 700, caption 44px màu ngà và chọn lọc từ khóa vàng `#dcb777`; headline 88px. Thumbnail `ListenFirstThumbnail` dùng ảnh tượng tai và thước đo, copy “LẮNG NGHE… / HAY ĐANG / CHẤM ĐIỂM?” cỡ 100/100/112; width 896px, safe margins, không dùng chữ regular. Chỉ chuẩn bị component, không render/export thumbnail.

## Nhạc và Edit

Night — Ludovico Einaudi, nguồn MP3 đầy đủ, speechVolume 0,18 / pauseVolume 0,25, ducking theo caption. Native Audio trimBefore 53,954 giây, duration nguồn 45 giây, playbackRate 0,79, vẫn move/trim tự do trong Edit. Fade-in 1,2 giây / fade-out 2 giây qua MusicFade theo mép nghe thực tế và composition, không hardcode mốc kết thúc cũ. Giọng đọc vẫn 1×. Không SFX.

## Kiểm tra

`npm run check:listen-first` và `npm run typecheck` qua: đúng 45 giây, toàn văn caption/script, source PCM/hash và silence, scene coverage/crossfade, ảnh 9:16, bộ chữ caption/thumbnail, dòng chữ không tràn và mix trong RAM theo timing Edit thật. Peak −2,07 dBFS; nhạc thấp hơn giọng 18,41 dB trong vùng có lời. Báo cáo `qa.json`. Kiểm tra kỹ thuật không duyệt cảm nhận giọng/nhạc hoặc screenshot composition.

Không render MP4, preview frame, thumbnail hoặc mix audio. Không Gemini/Vertex/Veo hoặc API TTS có phí. Preview: http://localhost:3000/StoicListenFirst ; thumbnail: http://localhost:3000/ListenFirstThumbnail. Người dùng nghe duyệt trong Studio và tự render.

## Rà soát tổng quát và chỉnh nhịp v2

Người dùng phản hồi mở đầu nhanh, yêu cầu rà soát toàn video. Kiểm tra actual Studio JSX xác nhận speech playbackRate vẫn 1×; câu mở đầu 24 từ trong 5,1171 giây, khoảng nghỉ sau câu dài 1,3321 giây trong khi hai dấu phẩy chỉ có khoảng ngắt ngắn. Không diễn giải đó là đã nghe duyệt giọng; đây là timing/PCM audit dựa trên phản hồi nghe của người dùng.

Active mới: `public/listen-first/audio/narration-quoc-tuan-v2-pacing.wav`. Không TTS lại, không atempo/resample, không sửa lời. `apply-pacing-v2.py` thêm silence tại quiet zero-crossings đã kiểm tra waveform và lấy lại đúng số mẫu zero từ khoảng nghỉ sau câu, trong bốn vùng độc lập. Bảo toàn mọi mẫu speech PCM và toàn bộ timing ngoài vùng chỉnh; sample/gap/spans audit nằm trong voice.json. `sourcePcmPreserved=false` ở QA có nghĩa silence nguồn được phân bổ lại; `speechPcmPreserved=true` được kiểm tra bằng span và chuỗi mẫu nonzero, không phải thay giọng.

- Mở đầu: voice vào giây 0,45 thay 0,25; thêm 0,24 giây sau “mệt” và 0,16 sau “làm gì”. Lời câu đầu kết thúc 5,9671 thay 5,3671; câu thứ hai vẫn bắt đầu 6,6992, khoảng nghỉ sau mở đầu còn 0,7321. Caption mở đầu đổi từ bốn cụm cắt theo độ dài sang ba ý nguyên vẹn, toàn bộ text giữ nguyên.
- Đoạn dài: thêm 0,18 giây sau “không ổn”, không dời câu tiếp theo.
- Đoạn hỏi: thêm 0,22 giây sau “thử hỏi”, tách rõ lời dẫn và câu hỏi; câu kết tiếp theo vẫn bắt đầu đúng mốc cũ.
- Kết: thêm 0,22 giây sau “thấu hiểu” và 0,18 sau “đủ sức”, lấy lại silence cuối; lời cuối kết thúc khoảng 44,15, còn khoảng 0,85 giây trước hết video.

Tổng 1,4 giây silence được phân bổ lại, không tăng tổng thời lượng. Cảnh 2 dời từ frame 181 đến 190, để chuyển ảnh trong khoảng nghỉ mới; các cảnh 3–6 giữ mốc. Scene lengths mới 196 / 187 / 253 / 388 / 174 / 182, overlap 6 frame. Không thêm zoom/chuyển động tùy tiện hoặc tái tạo ảnh; giữ thumbnail và nhạc Night, native Edit timing, volume và fade. Caption còn 24 trang. Script và metadata model control không đổi.

ASR word-alignment dùng để tìm ranh giới câu/từ, lưu ở `pacing-review-v1.json`. Lượt nhận dạng trên WAV đã thêm khoảng nghỉ nhận “cần giải” thành “cần dài” và “an ủi” thành “ăn uỷ”; raw của take gốc trước pacing nhận đúng hai cụm, và kiểm tra PCM xác nhận lời nói giống hệt. Vì thế đây là nghi vấn cần nghe đối chiếu, không tự kết luận lỗi phát âm hoặc tái tạo câu chỉ để đổi điểm ASR. Không gọi bản này pronunciation-approved trước khi người dùng nghe.

Backup trước sửa ở `public/listen-first/backups/pacing-v1/`, gồm Video, metadata, caption/SRT, QA và ghi chú dựng; WAV cũ giữ nguyên. Hash xác nhận music.json, Thumbnail.tsx và audition.json không thay đổi. `check:listen-first` / TypeScript qua, bao gồm PCM/mốc ngoài vùng sửa, font/layout và mix. Peak −1,91 dBFS, nhạc thấp hơn giọng khoảng 18,42 dB; fade vẫn bám mép clip/composition. Không render video, thumbnail, preview frame hoặc audio mix; cần người dùng nghe lại nhịp/các cụm được đánh dấu trong Studio.
