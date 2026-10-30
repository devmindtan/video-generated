# Gemini Developer API và khóa chi phí

Cập nhật 24/10/2026: đường gọi Vertex AI đã bị chặn trong transport. Không fallback sang `aiplatform.googleapis.com`, không dùng `GOOGLE_CLOUD_PROJECT`, `GOOGLE_API_KEY` hay OAuth cũ. Chỉ nhận `GEMINI_API_KEY` trong `.env.local` phía máy sản xuất; không đưa key vào React hoặc chat.

## Trạng thái mặc định

Phạm vi sử dụng: video triết lý/Stoic giữ workflow ảnh tĩnh cũ, không dùng Gemini ứng dụng, Gemini API hay Veo. Video trẻ em cần footage chuyển động thật, ưu tiên asset có sẵn hoặc handoff ứng dụng thủ công; yêu cầu chuyển động không cho phép tự vượt ngân sách. Nếu thiếu footage thì báo thiếu thay vì dùng zoom ảnh để giả chuyển động.

Người dùng chọn dùng cả hai: [gói Gemini thao tác thủ công và Gemini API](flow-and-gemini.md), không tự fallback. Trần API **20.000₫ cho toàn bộ mỗi Short**, cộng dồn mọi cảnh/take/lần chạy; xem [sổ ngân sách](../budgets/README.md). Việc hỗ trợ hai nguồn không tự mở khóa tạo video trả phí.

- `scripts/veo-safety.json`: `generationEnabled: false` — không tạo clip mới.
- `npm run veo:<project>` và `veo:plan:<project>`: dry-run offline, không gọi API.
- CLI mặc định `--max-new-jobs 0`. Mở Studio, dựng, chỉnh SFX và dùng lại asset local không gọi Veo.
- Batch continuity và tự retry đã bị chặn. Không thay key, bật billing hay khôi phục Vertex tự động.
- `--check` chỉ GET metadata model khi người dùng chủ động chạy; không dùng một POST tạo video để thử key.
- Cache Gemini riêng `.cache/veo-gemini/<project>/`; lịch sử Vertex `.cache/veo/<project>/` giữ nguyên, không poll lại hoặc tự chuyển thành job mới.
- Footage local có sẵn được dùng lại, không tạo trùng. Muốn thay take phải dùng tên phiên bản mới.

Chỉ khi có yêu cầu tạo video cụ thể, giá/tỷ giá mới đã xác minh và dự toán còn trong trần đã duyệt, mới cân nhắc mở policy và opt-in CLI cho đúng một cảnh mỗi lần. Mọi POST tạo clip phải có khoản giữ chỗ tiền trước khi gửi. Counter nằm trong `budgets/shorts/`, không phải cache; lỗi/timeout không tự hoàn hoặc đặt lại tiền. Thiếu dữ liệu giá, vượt trần, sổ không hợp lệ hoặc lịch sử job không khớp sổ thì dừng.

Nếu người dùng yêu cầu một lần tạo thử có phí: tối đa một clip trong ngân sách đã duyệt, không tự retry, không thay vào bản dựng và khóa lại policy sau lần chạy. API trả video chỉ chứng minh tạo video hoạt động; khoản tiền thực trừ phải đối chiếu Usage/Spend hoặc billing của AI Studio, có thể cập nhật trễ. Không dùng key cũ đã công khai trong chat; đặt key AI Studio mới tại `GEMINI_API_KEY` trong `.env.local`.

Policy/sổ là khóa dự toán trong repository, **không phải hard cap thanh toán của Google**. Không có cam kết dừng chi phí của các script khác, ứng dụng khác hay job đã được Google nhận trước đó. Khóa cục bộ không hoàn tiền hoặc hủy một job phía Google.

```sh
npm run budget:glowing-whale
npm run test:video-budget
```

Hai lệnh này không gọi API. Giá model và tỷ giá có ngày xác minh được lưu ở `scripts/gemini-video-pricing.json`; dữ liệu quá hạn sẽ chặn tạo clip. Không tự giả định tỷ giá, thuế hay số clip có thể tạo từ số dư tài khoản.

## Không nhầm API với ứng dụng

[Veo trong Gemini API](https://ai.google.dev/gemini-api/docs/veo) dùng API key/endpoint `generativelanguage.googleapis.com`, GET operation và tải URI kết quả. Nó vẫn là dịch vụ tạo video có phí; phải xem [bảng giá chính thức](https://ai.google.dev/gemini-api/docs/pricing) tại thời điểm muốn tạo. Không coi gói Gemini/Flow, hạn mức trong ứng dụng hoặc Google AI Studio UI là số dư miễn phí dùng cho script API.

Đã gửi đúng một POST tạo thử theo yêu cầu ngày 24/10/2026: metadata GET thành công nhưng generation trả HTTP 404, model Veo Lite không còn khả dụng. Không có clip, không retry; policy đã khóa lại. Xem [biên bản thử](projects/glowing-whale/api-smoke-test.md). Chưa xác nhận khoản tiền thực trừ hoặc quyền tạo video của model thay thế. Không tự chuyển key Vertex cũ thành Gemini key.

## Tài khoản và hóa đơn

Việc người dùng đã tắt dịch vụ/tài khoản được giữ nguyên; agent không thay đổi cấu hình Cloud. Để đối chiếu khoản đã phát sinh, người dùng cần kiểm tra hóa đơn/lịch sử sử dụng phía Google; agent chưa truy cập billing và không thể xác nhận chi phí thực từ số clip local. Nên thu hồi key đã từng công khai trong chat, không gửi key thay thế qua tin nhắn.
