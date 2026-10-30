# Sound design v2 — từ rối sang rõ

Trạng thái: người dùng không chọn bản sound design này; đã tắt toàn bộ SFX bằng `enabled: false`. Tập hiện chỉ dùng nhạc và lời đọc. Tài liệu/asset dưới đây giữ làm lịch sử thử nghiệm, không tự bật lại.

Mục tiêu không phải tăng số lượng tiếng động. Mỗi lớp phải có vai trò: tạo không gian, xác định chất liệu, nhấn sự chuyển ý hoặc rút ra để câu kết được nghe rõ. Không lặp một tiếng whoosh/ding ở mọi lần chuyển cảnh.

## Thiết kế theo đoạn

| Đoạn | Không gian / chất liệu | Vai trò |
| --- | --- | --- |
| 0–8,4 giây | Gió stereo không đều, ba lần gỗ căng/nhả nhỏ ở biển chỉ đường | Không gian ngoài trời và cảm giác nhiều hướng; không dùng tiếng còi thuần âm |
| 7,7–18 giây | Không khí kín vào sớm, hai chạm kính ngắn trên đế gỗ lúc kệ lọ hiện ra | Dẫn cảnh ngoài → trong; không liên tục chèn tiếng lọ trong lúc giảng giải |
| 17,967–28,2 giây | Một cú chạm thân chén, nứt giòn, mảnh sứ nhỏ lắng; giữ nền phòng rất mỏng | Cảnh chén là minh họa va chạm/sai cách áp dụng, không giả có nhiều cú đập trên ảnh tĩnh |
| 28,067–38 giây | Ma sát trục rồi các chạm đĩa/xích đồng giảm dần; nền thu hẹp | Chuyển từ va chạm sang cân nhắc, kết thúc bằng trạng thái ổn định |
| 37,7–48 giây | Không gian mở thoáng xuất hiện ngắn, rút hết ở 41,5 | 6,5 giây cuối chỉ còn nhạc và lời; không thêm tiếng kính vỡ vì hình có mảnh gương |

Giữ mốc người dùng đã chỉnh: clip gốm từ frame 539, cân từ frame 842 (30 fps). Onset bên trong file có phần chuẩn bị ngắn; không coi đầu file là đỉnh transient. Tất cả clip còn chỉnh được trong Edit. Các lớp nền chồng nhẹ trên track riêng; không cắt cụt đuôi để ép chung một track.

## Nguồn và mức âm

Tám source stem ở `public/right-advice/audio/sound-v2/`. Tạo cục bộ bằng `scripts/projects/right-advice/make-sound-v2.py`: nhiễu được lọc, nhiều mode cộng hưởng không nguyên bội, các tiếp xúc có cường độ giảm dần, vị trí stereo vừa phải và phản xạ sớm ngắn. Đây là âm thanh tổng hợp cách điệu, **không phải bản thu foley/hiện trường**. Không tải thêm hay gọi API. Manifest có hash/thông số tại `provenance.json` trong thư mục asset.

Nền tự hạ thêm 25% khi có lời, còn âm điểm giữ transient để không biến mất. Nhạc Experience reverb, volume/trim, fade-in/out và toàn bộ lời đọc/hình ảnh không thay đổi ở lần làm này.

Trong `src/projects/right-advice/sfx.json`:

- `enabled: false`: nghe cùng video nhưng không có SFX để so sánh giá trị thực sự của thiết kế.
- `masterVolume`: mức tổng chỉ cho SFX; `1` giữ hiện tại, `0.5` giảm một nửa biên độ, `0` tắt tiếng, `1.2` tăng 20% biên độ. Có thể tăng trên 1 nhưng cần kiểm tra clipping. Không đổi nhạc/giọng. Mức tổng nhân với từng mức riêng và ducking nền.
- Các trường `windVolume`, `roomVolume`, `balanceRoomVolume`, `clearingVolume`: mức lớp nền.
- `woodVolume`, `bottleVolume`, `porcelainVolume`, `brassVolume`: mức âm chất liệu.
- `bedSpeechDuck`: tỷ lệ hạ lớp nền theo phụ đề, từ 0 đến 1.

Bản v1 giữ nguyên ba WAV và generator cũ. [Snapshot](sound-v1-snapshot.json) lưu timing/gain v1 sau lần chỉnh của người dùng, không xóa hoặc ghi đè để mất đường quay lại.

## Kiểm tra và nghe duyệt

`check:right-advice` đọc trực tiếp from/trimBefore/durationInFrames/playbackRate/gain/ducking từ Audio JSX bằng AST, không dùng ba mốc cứng cũ. Nhạc và SFX được giải mã, retime/cắt đúng trong RAM để đo mix, không xuất video/WAV mix.

`strongest50msAboveMusicDb` trong QA đo âm điểm so với nhạc tại cùng vị trí, giúp phát hiện một transient bị mất dù RMS trung bình cả tập vẫn đạt. Đây không phải chứng nhận âm thanh nghe tự nhiên hay không che từng phụ âm. Kiểm tra source thêm sample rate, hash, hai mép, DC và khả năng nghe mono.

```sh
node scripts/projects/right-advice/test-sfx-edit.cjs
.venv/bin/python scripts/projects/right-advice/test-sound-v2.py
npm run check:right-advice
npm run typecheck
```

Nghe trong `StoicRightAdvice`: đầu tập, vùng 7,7–10,3, 17,9–20,2, 28–31,1 và 37,7–48 giây. So sánh `enabled: true/false` ở cùng mức loa, trên tai nghe và loa điện thoại nếu có. Nếu bật SFX không giúp nhận biết không gian/chất liệu hoặc làm khó nghe câu đọc, cần giảm/bỏ lớp đó; không lấy số lớp làm thước đo chất lượng.

Chưa có xác nhận nghe duyệt của người dùng. Không tự render MP4, preview still hay thumbnail.
