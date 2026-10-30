# Đứng dậy sau vấp ngã

## Thumbnail hiện tại — bản 3, câu hỏi đã được chọn

Người dùng chốt **“BẠN SỢ THẤT BẠI… HAY SỢ THỬ LẠI?”** và cho phép đổi hình cho phù hợp. Dùng ảnh `02-hesitation.png`: nhân vật dừng trước bậc thang, tay chạm lan can, nhìn lên đoạn đường còn lại. Giữ một hero duy nhất, không ghép hai tư thế. Chỉ đổi ảnh trong thumbnail, không thay cảnh video.

Chia câu thành ba dòng để nhấn “THỬ LẠI?” lớn màu vàng: 88px / 78px / 148px, Stoic Sans Bold700; dòng đầu và dòng nối trắng ngà. Safe margin84px, nền tối, brand STOIC nhỏ. Font metrics các dòng khoảng804/275/668px trong khung912px. Câu được giữ nguyên, không thêm lời giật gân hay hứa hẹn nội dung không có trong video. Ảnh đã có được tái dùng, không tạo ảnh mới. Bản trước lưu `public/get-back-up/backups/thumbnail-v2/Thumbnail.tsx`. Không đổi script, caption, giọng, timing hoặc nhạc Past Lives. Chưa render cover; mở `GetBackUpThumbnail` trong Studio để duyệt.

## Thumbnail hiện tại — bản 2

Người dùng chưa thấy cover ghép hai ảnh phù hợp. Bản mới chỉ dùng ảnh nguồn `04-help.png` (bàn tay giúp đứng lên bậc đá), crop lớn để hành động rõ, không ghép nhân vật hai tư thế. Hook đổi thành **“NGÃ XUỐNG… / CHƯA PHẢI HẾT.”** để bám ý vẫn còn cơ hội sau thất bại, thay câu chơi chữ “Ngã rồi… Đừng dừng.”

Giữ Stoic Sans Bold700, trắng ngà/vàng trên nền tối; hai dòng 110px, safe margin ngang84px. Font metrics khoảng763/861px trong khung912px. Bàn tay và hook cùng nằm trong vùng trung tâm để vẫn hiểu khi thu nhỏ. Dùng ảnh có sẵn, không imagegen thêm, không đổi video/caption/giọng/nhạc. Bản ghép trước lưu `public/get-back-up/backups/thumbnail-v1/Thumbnail.tsx`. Chưa render hoặc xuất ảnh; chờ người dùng xem trong Studio.

## Bản hiện tại — giãn nhịp v2

Người dùng thấy lời nhanh và yêu cầu thêm khoảng nghỉ. Bản dựng hiện dài **41 giây** (1230 frames). Không tổng hợp lại giọng và không làm chậm thêm: giữ edit người dùng đang có là **Quốc Tuấn playback 0,99, volume 1,2**.

`scripts/projects/get-back-up/pauses-v2.json` đánh dấu 14 chỗ nghỉ: giãn nhẹ giữa câu, rõ hơn giữa năm đoạn và trước câu chốt. `make-pauses.py` tìm cửa sổ gần im lặng 25ms, chọn điểm có biên độ thấp rồi chèn tổng 4,61 giây im lặng. WAV mới `public/get-back-up/audio/narration-quoc-tuan-v2-pauses.wav` dài nguồn 40,20017 giây, phát ở 0,99 tương đương 40,60623 giây. Không đổi gain/pitch/tempo hoặc bỏ bất kỳ mẫu PCM nào trong file; bỏ các khoảng chèn sẽ khôi phục nguyên vẹn PCM của v1. Metadata/copy spans: `public/get-back-up/audio/pacing-v2.json`.

Caption giữ nguyên chữ, dịch timing theo các khoảng chèn và edit 0,99; ranh giới đoạn được kẹp vào mốc cụm đọc thật để tránh ASR hiện lời sớm. Ảnh cắt tại 0 / 6,80 / 13,53 / 21,30 / 30,43 giây, vẫn chồng mờ 6 frames. Không thay ảnh hoặc thumbnail. Bản TSX/caption/music/voice config/SRT trước lần sửa giữ tại `public/get-back-up/backups/pacing-v1/`; WAV v1 không sửa.

Giữ thay đổi nhạc của người dùng: **Past Lives (Slow & Reverb)**, trim nguồn 41,5 giây, playback nhạc 1×, speech/pause volume **0,35/0,40**. Chỉ kéo đuôi clip từ 36 lên 41 giây để phủ nhịp mới; fade-in 1,2s/fade-out 2s vẫn theo mép clip. ID3 của tệp ghi artist **Dj Nestor**, credit cũ Snowfall đã sửa; đây là metadata local, không xác nhận độc lập quyền/phối bản.

**Cảnh báo mix:** với mức giọng/nhạc đang giữ, QA đo đỉnh +1,23dBFS và nhạc chỉ thấp hơn lời khoảng 4,52dB. Guard clipping báo lỗi; không coi mix đã duyệt. Đã thông báo người dùng và không tự giảm các mức âm lượng họ chỉnh. Cần cân âm lượng trước khi xuất. Các kiểm tra PCM, lời/timing, ảnh và typography đạt; nhịp nghỉ mới chờ nghe duyệt. Không render.

## Thiết kế bản đầu 36 giây — lịch sử

`StoicGetBackUp` — **36 giây**, 1080×1920, 30 fps (1080 frames). Thumbnail component: `GetBackUpThumbnail`, 1080×1920; chưa xuất ảnh.

## Lời và giọng

[Script đã chốt](script.md) được giữ nguyên toàn bộ, đặc biệt câu kết: “Bạn đã từng ngã ở đó. Không có nghĩa là bạn phải dừng ở đó.” Không thêm lời thoại/CTA để kéo dài tập.

Dùng đúng take Quốc Tuấn người dùng vừa chọn: `public/get-back-up/audio/narration-quoc-tuan-v1.wav`, legacy24 mono PCM16, **1×**, dài 35,59017 giây. Hash SHA256 được đối chiếu với [voice.json](../../../scripts/projects/get-back-up/voice.json) và bản audition. Không tổng hợp lại, cắt, dịch cao độ hay kéo tempo; natural48 không được áp dụng. Hai bản thử vẫn giữ nguyên.

Dự kiến 48–52 giây trước đây là ước lượng khi chưa đo giọng. Bản dựng theo take thật, kết thúc ở 36 giây để không thêm 12–16 giây trống. Còn khoảng 0,76 giây sau mốc kết thúc cụm đọc cuối.

Caption JSON sao nguyên chữ/timing từ bản Quốc Tuấn đã nghe; SRT đi kèm. Một Sequence chung cho toàn bộ giọng và caption trên cùng clock nguồn, không dời từng đoạn hoặc rải đều khoảng nghỉ để lấp thời lượng. Nhạc được giữ ngoài nhóm để sửa timing độc lập.

## Nhịp hình

| Cảnh | Khoảng chính | Hình và ý |
|---|---|---|
| 1 | 0–6,20s | Ngồi trên bậc đá sau một điều chưa thành; khó nhất là dám tin lại |
| 2 | 6,20–12,00s | Chần chừ trước bậc thang, sợ thử tiếp |
| 3 | 12,00–18,93s | Buộc lại dây giày; sửa điều chưa ổn, đổi cách làm |
| 4 | 18,93–26,83s | Bàn tay giúp nhau đứng lên; việc nhỏ và nhờ giúp khi cần |
| 5 | 26,83–36,00s | Nhân vật đi lên từng bậc; không dừng ở chỗ đã ngã |

Các điểm cắt nằm trong khoảng nghỉ đã có của bản thu. Giữ ảnh trước thêm 6 frames và fade ảnh mới 6 frames (0,2 giây), không làm lùi clock lời đọc. Framing ổn định; chỉ opacity và đường nhấn dưới headline chạy theo frame, không zoom/pan tự động mỗi cảnh. Năm [ảnh và prompt](image-prompts.md) đã xem trực tiếp, không render preview still.

## Chữ và cover

Local **Stoic Sans/Noto Sans Bold 700** cho caption 44px, headline 88px và toàn bộ chữ trên cover. Trắng ngà, nhấn vàng; chỉ weights 400/700 đã cài. Caption giữ nguyên nội dung/timing khi chia span highlight, có div bọc tránh lỗi flex tách từ.

Thumbnail ghép cảnh ngồi và cảnh đứng/đi lên, dùng crop có chủ đích nhưng không đổi ảnh trong video. Hook bốn từ: **“NGÃ RỒI… / ĐỪNG DỪNG.”**, 118/126px, brand STOIC nhỏ, không đoạn giải thích dài, không hình chấn thương hay giật gân. Đã đo font metrics và chỉnh dòng quá dài trước khi bàn giao; cần người dùng duyệt cảm nhận trong Studio. Không xuất PNG.

## Nhạc

**snowfall — Øneheart & reidenshi**, giữ bản full `public/own-timeline/audio/snowfall.mp3`, nguồn nghệ sĩ trong music.json. Playback nhạc 0,85× như workflow gần nhất; không coi đây là remix chính thức được phát hành.

Native Audio mặc định start 0, source trim 24,9s; source duration 30,6s ở 0,85× tương ứng 36s trên timeline. Timing/source trim/speed đều inline literal trong JSX để Edit sửa trực tiếp, không khóa theo import config. Không tạo excerpt 36s.

`speechVolume` 0,22 và `pauseVolume` 0,30 là mặc định của riêng tập mới, không sửa mức 0,35/0,40 mà người dùng chỉnh ở tập trước. Duck theo caption. Fade-in 1,2s/fade-out 2s dùng shared MusicFade, theo mép clip/composition thực khi người dùng move/trim trong Edit. Không SFX.

## Kiểm tra và bàn giao

```sh
npm run check:get-back-up
npm run typecheck
npm run test:music-edit
node scripts/projects/discipline-purpose/test-music-fade.mjs
npm run dev
```

[QA](qa.json) đọc timing/gain nhạc và giọng từ native Audio JSX, kiểm tra checksum take, phụ đề, điểm cắt trong khoảng nghỉ, ảnh 9:16, coverage/chồng mờ và mix tính trong RAM. Không xuất WAV mix, MP4, preview frame hoặc cover để kiểm tra. Guard typography kiểm tra cả caption và thumbnail cùng lúc.

Chất giọng đã được người dùng nghe chọn; phần phối nhạc/chuyển cảnh/hình cuối vẫn chờ người dùng xem/nghe trong Studio. Không dùng số đo RMS/peak để tự gọi chất lượng cảm nhận đã duyệt. Không gọi Gemini/Veo/Vertex hoặc phát sinh API video; ảnh dùng imagegen tích hợp. [Mô tả đăng video](description.md) có đủ tên nhạc và nghệ sĩ.
