# Dùng gói Gemini và Gemini API

**Quyết định mới nhất — 24/10/2026:** tạm đóng tạo video qua API, giữ quy trình Gemini thủ công bên dưới. Không thử thêm model, không chuyển sang Omni và không tự fallback sang API. Chỉ xem xét mở lại khi người dùng yêu cầu rõ ràng và duyệt chi phí mới. Giữ clip, tích hợp và lịch sử ngân sách để đối chiếu; đây không phải thao tác đóng tài khoản hay tắt billing phía Google.

Quy ước 24/10/2026: **ưu tiên gói Gemini qua ứng dụng**, Gemini Developer API dùng bổ sung trong trần **20.000₫ tổng API cho một Short**. Flow vẫn là lựa chọn nhập thủ công nếu người dùng có hạn mức riêng. Không tự chuyển sang API khi gói hết hạn mức, bị chậm hoặc lỗi. Tích hợp/xác thực Cloud cũ đã gỡ; chỉ còn Gemini API.

Ảnh người dùng gửi hiển thị số dư Prepay **279.378₫ của Gemini API**, Auto-reload Off; đây là ảnh chụp, không phải số dư được truy vấn trực tiếp. Nó không phải credit Flow/gói Gemini. Chưa đăng nhập hoặc kiểm tra hạn mức ứng dụng của người dùng. Kiểm tra số đầu ra/hạn mức trong giao diện trước mỗi lần tạo; không tự mua thêm hoặc nâng gói.

## 1. Chuẩn bị ảnh và prompt để đưa vào gói Gemini

```sh
npm run gemini:pack:glowing-whale
```

Tạo bộ giao nhận offline ở `public/glowing-whale/gemini-handoff/<mã-bộ>/`: ảnh đầu cảnh, `prompts.md`, `queue.json`. Đây là copy tài nguyên, **không render** và không tạo video. Gói cũ không bị ghi đè. Các cảnh đã có clip local được đánh dấu để tránh tạo lại vô tình; take đã loại không xuất. Những ảnh đầu cho cảnh nối tiếp chưa có sẽ không được đóng gói. Muốn chuẩn bị cho Flow, dùng lệnh `flow:pack:<project>` với bộ giao nhận Flow riêng.

Người dùng mở ứng dụng Gemini bằng tài khoản/gói của mình, đưa ảnh/prompt vào, kiểm tra khả năng tạo video, tỉ lệ, thời lượng và hạn mức rồi chủ động tạo. Nếu dùng Flow thì làm tương tự với hạn mức Flow riêng. Agent không tự đăng nhập, bấm tạo, mua credit, nâng gói hoặc dùng session/cookie để gọi API ẩn.

## 2. Nhập clip đã tải về từ ứng dụng

Ví dụ kiểm tra một take kết thay thế, **chưa đổi bản dựng**:

```sh
.venv/bin/python scripts/shared/flow-handoff.py import --app gemini --project glowing-whale --scene 07-shine-v2 --file /duong-dan/clip-da-tai.mp4 --replace
```

Sau khi duyệt, thêm `--apply` để nhập. Công cụ kiểm tra MP4, tỉ lệ và độ dài; từ chối đoạn quá ngắn nếu phải kéo chậm dưới .85×. Clip mới được lưu bằng mã nội dung, clip cũ không bị ghi đè; metadata cũ được backup khi thay take. Import không thay giọng, phụ đề, cấu trúc cảnh hay tự render. Nếu nhịp chuyển động khác, cần chỉnh cue SFX và chạy lại `npm run audio:glowing-whale`, sau đó `npm run check:glowing-whale`.

Nếu nhập cho một cảnh khác, dùng đúng scene key trong `queue.json`. Đặc biệt cảnh kết đang chọn của Bọt Biển là `07-shine-v2`, không phải bản `07-shine` đã loại.

## 3. Gemini API khi thực sự cần

Giữ nguyên [khóa chi phí](gemini-api-safety.md). Key AI Studio đặt riêng ở `GEMINI_API_KEY` trong `.env.local`; chỉ key này được đọc. Các lệnh `npm run veo:<project>` chỉ tạo kế hoạch offline. [Ngân sách 20.000₫ mỗi Short](../budgets/README.md) là tổng chi API từ khi áp dụng policy, không phải từng cảnh. Yêu cầu tạo video cụ thể phải có giá/tỷ giá còn mới và giữ chỗ chi phí trước POST; vượt/thiếu dự toán thì không gửi, kể cả model rẻ hơn cũng không tự chuyển.

Kiểm tra không tốn phí API: `npm run test:flow`, `npm run test:veo`, `npm run typecheck`. Các test dùng fixture/mock, không gửi yêu cầu sinh video.
