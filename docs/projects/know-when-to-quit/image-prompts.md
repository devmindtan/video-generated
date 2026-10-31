# Hình / animation từng cảnh — Biết dừng cũng là dũng cảm

**Bản vá sau chốt v1:** phiên làm việc này không có công cụ tạo ảnh (các Short trước dùng imagegen tích hợp của Codex). Người dùng chọn vẽ bằng code, với yêu cầu đẹp hơn kiểu nét vàng đơn điệu. Mỗi cảnh là một **tranh minh họa điện ảnh vẽ bằng SVG trong Remotion**, chuyển động theo frame. Không ảnh AI, không Gemini/Veo, không người hay mặt người.

## Phong cách chung

- **Nhiều lớp, có chiều sâu:** hậu cảnh mờ trong không khí, trung cảnh là chủ thể, tiền cảnh tối có bóng đổ dài. Không vẽ phẳng một lớp.
- **Ánh sáng có hướng:** một nguồn sáng chính mỗi cảnh (đèn bàn, nắng xiên, mặt trời thấp, bình minh). Chủ thể được tô bằng gradient theo hướng sáng, có viền sáng (rim light) và vùng tối thật.
- **Chất liệu:** vân gỗ, đá, đất nứt, thủy tinh, đồng thau, giấy, vải. Làm bằng gradient và nhiễu `feTurbulence`, cộng một lớp hạt film rất nhẹ cho cả khung.
- **Màu:** cảnh 1–3 nâu đất, hổ phách, cam chạng vạng trên nền mực tối; cảnh 4 xám xanh bình minh; cảnh 5 xanh lá và nắng sớm ấm. Nhận diện Stoic giữ ở chữ (ngà/vàng `#dcb777`), không tô vàng toàn bộ hình.
- **Bố cục dọc 9:16:** tranh chiếm khoảng 60% trên, chuyển dần về nền tối ở nửa dưới để đặt tiêu đề và phụ đề.
- **Chuyển động có lý do, theo frame:** không zoom/pan đều đặn. Chỉ có ánh sáng, hạt, sương, cát; parallax rất nhẹ giữa các lớp. Chuyển cảnh mờ chéo ngắn.

## Cảnh 1 · Sổ chi tiêu dưới đèn bàn — "Ở lại chỉ vì tiếc công…"

Đêm, bàn gỗ cũ trong phòng tối. Đèn bàn kim loại bên phải hắt chóp sáng hổ phách xuống cuốn sổ mở. Hai trang sổ cong nhẹ, nhiều dòng số viết tay (nét nhỏ, không đọc được), vài dòng bị gạch. Bên trái là xấp hóa đơn kẹp bằng kẹp sắt; tách trà nguội không còn hơi.
**Chuyển động:** đèn chập chờn rất nhẹ, bụi lơ lửng trôi trong chóp sáng.

## Cảnh 2 · Đồng hồ cát — "thời gian đã qua thì không lấy lại được"

Đồng hồ cát khung đồng thau trên gờ đá, tường đá tối, nắng xiên từ trái. Bầu dưới gần đầy, bầu trên còn rất ít, một dòng cát mảnh đang rơi. Kính có phản quang và viền sáng.
**Chuyển động:** dòng cát rơi bằng hạt theo frame; cát bầu trên vơi dần, đụn cát dưới nhích lên rất chậm trong suốt cảnh.

## Cảnh 3 · Giếng khô và cái xẻng — "Đào giếng sai chỗ…"

Chạng vạng, mặt trời thấp sát đường chân trời, các lớp đồi xa mờ trong khói bụi. Mặt đất nứt nẻ. Một hố đào sâu viền đá, lòng hố tối và khô. Cạnh hố là đống đất mới đào, cái xẻng cán gỗ cắm thẳng, xô rỗng trên sợi dây sờn. Bóng đổ dài.
**Chuyển động:** bụi đất bay ngang khung theo gió, mặt trời lặn xuống rất chậm.

## Cảnh 4 · Ngã ba trong sương — "nếu hôm nay mới bắt đầu…"

Sáng sớm trên đồi. Con đường đất từ dưới khung tách thành hai nhánh đi hai hướng. Ở ngã ba là cột biển chỉ đường bằng gỗ cũ, hai tấm biển trống (không chữ) chỉ hai phía. Sương nằm trong thung lũng, chân trời ửng sáng.
**Chuyển động:** các dải sương trôi chậm, trời sáng dần.

## Cảnh 5 · Xẻng đã đặt xuống, thung lũng phía trước — "Đặt cái xẻng xuống…"

Đổi so với bản chốt: không vẽ đôi tay, vì tay vẽ vector rất dễ xấu. Thay bằng cái xẻng **nằm** trên mặt đất khô ở mép đồi, cạnh đôi găng tay lao động vừa tháo ra (vẫn giữ ý buông tay, không có người). Phía trước, con đường đi xuống thung lũng xanh có dòng suối lấp lánh dưới nắng sớm, hậu cảnh hơi nhòe theo chiều sâu.
**Chuyển động:** nắng lên dần, tia sáng và ánh lấp lánh trên suối; cuối video mờ dần về tối.

## Thumbnail · `KnowWhenToQuitThumbnail`

Dùng tranh cảnh 3 (xẻng cắm cạnh giếng khô lúc chạng vạng), phần dưới tối để đặt tiêu đề **BIẾT DỪNG** (vàng) và dòng phụ "cũng là dũng cảm" (ngà), Stoic Sans Bold 700. Chỉ chuẩn bị component, không tự xuất ảnh.
