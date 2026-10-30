# Video Tí Hon — gói Gemini và Gemini API

Tích hợp hiện hành chỉ dùng Gemini Developer API (`generativelanguage.googleapis.com`) hoặc nhập video tải thủ công từ gói Gemini/Flow. Đường Cloud cũ đã bị loại bỏ; không dùng lại hướng dẫn bật service account, OAuth hoặc project cũ.

## Footage đã có

Giữ đủ 5 clip nguồn 8 giây và manifest hiện hành. Metadata model trong footage.json là nguồn gốc lịch sử của asset, không phải cấu hình để gọi API. Không tạo lại clip chỉ vì chuyển tích hợp. Giọng B mặc định; không tự render.

## Cấu hình và chi phí

Chỉ đặt `GEMINI_API_KEY` trong `.env.local`, không đưa vào React, public hoặc chat. Xem [khóa chi phí](../../gemini-api-safety.md) và [ngân sách Short](../../../budgets/README.md). Trần API tổng cộng cho một Short là 20.000₫, không phải từng cảnh; mọi take và lần chạy dùng chung sổ theo project. Thiếu giá/tỷ giá mới, vượt trần hoặc chưa được duyệt tạo thì không gửi yêu cầu.

```sh
npm run veo:plan:tiny-dino-adventure
npm run veo:tiny-dino-adventure
npm run test:veo
npm run test:video-budget
npm run flow:pack:tiny-dino-adventure
```

Hai lệnh veo đầu chỉ là dry-run offline, không thử key bằng POST. Để dùng gói Gemini, chạy công cụ handoff với `--app gemini`; tải clip về rồi import có kiểm tra, không gọi API ẩn. Xem [quy trình gói Gemini và API](../../flow-and-gemini.md).

Không có tự retry hoặc tự chuyển model/provider. Job không rõ kết quả phải đối soát, không gửi lại. Lịch sử tác vụ cũ vẫn giữ để kiểm tra chi phí; không poll/migrate nó thành yêu cầu mới.

Nguồn chính thức: [Veo trong Gemini API](https://ai.google.dev/gemini-api/docs/veo), [bảng giá](https://ai.google.dev/gemini-api/docs/pricing), [thanh toán](https://ai.google.dev/gemini-api/docs/billing).
