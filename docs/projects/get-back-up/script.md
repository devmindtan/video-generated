# Đứng dậy sau vấp ngã — lời và giọng đã chốt

Chủ đề: Thành công lớn nhất là biết cách đứng dậy sau những lần vấp ngã.

Người dùng chọn **Quốc Tuấn**, chính take đã nghe ở `get-back-up-v1`. Sau yêu cầu giãn nhịp, bản dựng dài **41 giây**, thêm 4,61 giây nghỉ vào bản nguồn; không áp dụng natural48 hoặc tổng hợp lại. Giữ edit người dùng đang đặt: playback giọng **0,99**, volume **1,2**, nhạc **Past Lives**. Không kéo chậm thêm. WAV v1 và toàn bộ mẫu PCM gốc vẫn giữ; file v2 chỉ chèn im lặng. Cấu hình/checksum ở `scripts/projects/get-back-up/voice.json`, các mốc nghỉ ở `pauses-v2.json`. Lời dưới đây không thay. Đã chuẩn bị đủ ảnh, caption, thumbnail và nhạc; chưa render. Nhịp nghỉ mới và phối nhạc chờ nghe duyệt; có cảnh báo clipping cần cân âm lượng trước khi xuất. Xem [thiết kế hiện tại và lịch sử](production-spec.md).

## Đoạn 1

Sau một lần thất bại, điều khó nhất đôi khi không phải là làm lại. Mà là dám tin rằng mình vẫn có thể làm được.

## Đoạn 2

Bạn sợ thử thêm lần nữa rồi vẫn chẳng tới đâu. Sợ người khác cười. Sợ lại phải thất vọng về chính mình.

## Đoạn 3

Nhưng một lần làm chưa được không có nghĩa là mãi mãi không làm được. Hãy nhìn lại xem lần trước mình sai ở đâu, để lần này làm khác đi.

## Đoạn 4

Chưa đủ sức làm lại tất cả thì bắt đầu từ một việc nhỏ. Học lại điều chưa hiểu. Nhờ giúp ở chỗ mình đang mắc. Không cần chứng minh gì với ai.

## Đoạn 5

Đứng dậy không khiến lần vấp ngã biến mất. Nhưng nó cho bạn cơ hội đi xa hơn chỗ mình đã ngã. Bạn đã từng ngã ở đó. Không có nghĩa là bạn phải dừng ở đó.

## Nghe thử

`npm run voice:catalog -- --take get-back-up-v1 --config scripts/projects/get-back-up/audition.json --voices 'Xuân Vĩnh' 'Quốc Tuấn'`

Hai bản thử vẫn giữ tại `public/voice-auditions/get-back-up-v1/`, không xóa Xuân Vĩnh. Quốc Tuấn đã được người dùng nghe chọn; captions nguồn và audit ASR được giữ cùng bộ thử để dựng tiếp. Không thay bất kỳ giọng của video cũ.
