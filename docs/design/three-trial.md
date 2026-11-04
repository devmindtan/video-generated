# Thử 3D: nét vẽ 2D so với three.js (2026-11-04)

Bản thử để quyết định có đưa 3D vào tập thật hay không. Chưa dùng trong tập nào, chưa render.

## Xem ở đâu

Remotion Studio (`npm run dev`) → thư mục **Thu-Nghiem-3D**. Mỗi chủ đề có ba composition 8 giây:

| Composition | Nội dung |
|---|---|
| `Trial3D-<chủ đề>-SoSanh` | Hai bản chạy cùng lúc, trái 2D, phải 3D |
| `Trial3D-<chủ đề>-Truoc` | Bản hiện tại: nét vàng vẽ bằng SVG |
| `Trial3D-<chủ đề>-Sau` | Bản 3D: three.js qua `@remotion/three` |

Chủ đề: `Columns` (hàng cột đền, "điều nằm trong tay ta"), `Cairn` (chồng đá cân bằng), `Hourglass` (đồng hồ cát). Cả ba hợp quy tắc chủ thể không lộ mặt. Nền, bụi vàng, vệt sáng, câu chữ và nhịp thời gian giống hệt nhau ở hai bản; chỉ khác cách vẽ chủ thể.

Code: `src/examples/three-trial/` (`kit.tsx` nền và chữ chung, `three-kit.tsx` canvas, camera, đèn; mỗi chủ đề một file).

## Khác nhau quan sát được

| | Trước (2D nét vàng) | Sau (3D) |
|---|---|---|
| Cảm giác | Tối giản, như bản phác trên giấy; hợp giọng đọc trầm, mang tính suy ngẫm | Có khối, có bóng đổ, có chiều sâu; máy quay lượn chậm nên khung hình "sống" hơn |
| Nhận diện kênh | Đúng nhận diện hiện tại (nét vàng trên nền mực) | Màu đá ấm vẫn hợp nền mực, nhưng là phong cách khác; cần chọn một hướng cho cả series |
| Chuyển động | Nét tự vẽ ra là chuyển động chính; ít "camera" | Vật rơi, nảy, trồi lên; ánh sáng và bóng đổi theo góc máy |
| Đồ vật phức tạp | Vẽ tay từng đường; vật cong (đá, kính) khó vẽ đẹp | Khối cơ bản (trụ, cầu, hình xoay) cho ra đá, kính, gỗ khá tự nhiên |
| Người | Vẽ được dáng người bằng nét | Dựng người bằng khối nhìn thô; nên giữ 3D cho đồ vật, kiến trúc, thiên nhiên |
| Công sức một cảnh | Thấp: vài đường path | Trung bình: dựng khối, đặt đèn, đặt máy quay, chỉnh khung để không đè chữ |
| Rủi ro | Gần như không | Cần WebGL khi render; bóng và kính làm mỗi frame nặng hơn; khung hình phải kiểm kỹ (lần đầu mái đền và đồng hồ bị cắt mép, đã sửa) |

Chưa đo thời gian render vì chưa render. Nếu dùng thật, nên render thử một cảnh để biết chi phí trên máy này.

## Gợi ý dùng

- Không thay toàn bộ nét vẽ. Dùng 3D cho một vài khoảnh khắc cần trọng lượng: mở đầu một phần lớn, hình ảnh ẩn dụ chính của tập, thumbnail có chiều sâu.
- Có thể trộn: vật 3D làm nền, nét vàng 2D vẽ đè lên để giữ nhận diện.
- Quy tắc kỹ thuật (skill `remotion-markup/3d.md`): bọc trong `ThreeCanvas`, mọi chuyển động lấy từ `useCurrentFrame()`, không dùng `useFrame`, `Sequence` bên trong canvas phải `layout="none"`.
