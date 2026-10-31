# Hình minh họa — Hiểu về trái tim: tổng quan

Tập này **không dùng ảnh tạo bằng AI hay ảnh chụp** (người dùng chọn cách B, 2026-10-31). Mọi hình là minh họa nét vàng
vẽ bằng code trong Remotion, nên không có prompt tạo ảnh; mỗi mục dưới đây mô tả bức vẽ và chuyển động đi theo từng câu đọc.

## Nguyên tắc (người dùng 2026-10-31)

- **Được vẽ người**: dáng người, cử chỉ, nhân vật trong chuyện (người bà, đứa cháu, cô gái bên hồ, bác nông dân…) theo nét
  vẽ tối giản. Quy tắc không lộ mặt chỉ áp dụng khi tạo ảnh mới (ảnh AI hoặc ảnh chụp), không áp dụng cho minh họa vẽ tay bằng code.
- **Animation đủ chi tiết, đi theo lời thoại**: mỗi câu (hoặc vế dài) có một nhịp hình riêng, bắt đầu đúng lúc đọc tới từ khóa
  của câu (canh theo phraseRanges của giọng, không đặt giờ cứng). Không để một hình đứng yên suốt cả đoạn; giữa hai nhịp luôn
  có chuyển động nhỏ (nét đang vẽ, vật đang dịch, ánh sáng đổi). Chuyển cảnh mờ chéo ~0,5 giây, không zoom/pan lặp lại.
- Câu trích nguyên văn hiện thành chữ trên hình, kèm "Hiểu về trái tim, Minh Niệm".

## 0b · Mở chuyện (`MoChuyen.tsx`; đoạn 1 đã dựng, cập nhật theo lời mới)

| Câu đọc | Hình và chuyển động |
|---|---|
| "Ở chương cuối, tác giả kể một chuyện…" | Cuốn sách mở, trang lật nhanh tới chương cuối; nét vẽ từ trang sách loang ra thành khung cửa nhà xưa |
| "Một đứa bé đang chạy nhảy thì vấp phải cái ngạch cửa, ngã nhào và khóc ré lên." | Nhà xưa mái ngói cong, cửa gỗ hai cánh, ngạch cửa gỗ nổi; dáng đứa bé chạy vào khung, chân vướng ngạch cửa, ngã chúi về trước; chiếc dép nhỏ văng ra đúng lúc "ngã nhào"; vài nét rung quanh đầu bé khi "khóc ré lên" |
| "Người bà chạy tới… mắng cái ngạch cửa sao dám làm cháu bà đau." | Dáng người bà lom khom bước nhanh vào; cảnh gần: cây gậy của bà gõ xuống thanh ngạch cửa ba nhịp, vệt "cộc" nhỏ ở mỗi nhịp |
| "Đợi cháu nín rồi, bà mới dặn: lần sau đi đứng cẩn thận nghe con." | Bà ngồi xuống cạnh cháu, tay đặt lên vai bé; đôi dép nhỏ được xếp lại ngay ngắn trước ngạch cửa; ánh sáng trong nhà ấm dần |
| "Lúc đó, đứa bé chỉ thấy hả dạ…" | Đứa bé ngẩng lên nhìn cái ngạch cửa, dáng ngồi thẳng lại; gậy của bà dựa vào khung cửa |
| "Bà dỗ cái đau của cháu trước, rồi mới dạy sau." | Cảnh gần hai bàn tay: tay bà xoa nhẹ đầu gối nhỏ, rồi một ngón tay khẽ chỉ về phía ngạch cửa |
| "Còn người lớn chúng ta… học lại chuyện đó." | Bóng dáng người lớn ngồi bên bàn dưới đèn, đặt tay lên cuốn sách mở; ánh đèn ấm hắt ra từ cửa |

## 1 · Cuốn sách là gì

| Câu đọc | Hình và chuyển động |
|---|---|
| "Mở cuốn sách ra, điều mình chú ý đầu tiên là mục lục." | Bàn tay mở bìa sách; trang mục lục hiện ra |
| "Năm mươi chương… bình yên." | Từng tên chương (khổ đau, tức giận, ghen tuông…) hiện lần lượt thành dòng chữ vàng khi được đọc tới; 50 vạch nhỏ xếp vòng quanh cuốn sách |
| "Đọc lướt thôi… những ngày vui buồn của chính mình." | Các tên chương bay nhẹ thành những ô cửa sổ sáng tối khác nhau |
| "Các chương khá độc lập…" | Ngón tay lật thẳng tới chương Lo Lắng rồi chương Tức Giận, trang mở đúng chương được nhắc |
| "Theo tác giả, chất liệu của sách…" | Ba nét hình tụ vào cuốn sách: bông sen (đạo Phật), mái đình (văn hóa Việt), con đường nhỏ (trải nghiệm riêng) |
| "…như lời tâm tình của một người đi trước, hơn là một giáo trình." | Hai người ngồi bên ấm trà trò chuyện (dáng nghiêng), cuốn giáo trình dày mờ đi phía sau |

## 2 · Sợi chỉ xuyên suốt

| Câu đọc | Hình và chuyển động |
|---|---|
| "Nếu gom năm mươi chương lại thành một ý…" | 50 vạch quanh sách gom lại thành một sợi chỉ vàng |
| "…không nằm hết ở chuyện đã xảy ra, mà ở cách lòng mình phản ứng…" | Một viên sỏi rơi xuống mặt hồ; vòng sóng lan rộng dần (phản ứng của lòng) |
| "\"đau và khổ là hai cung bậc…\"" | Hai chữ "đau" và "khổ" tách ra hai bên, kèm câu trích |
| "Đau là điều xảy đến, còn khổ là…" | Bên "đau": một vết xước trên tay. Bên "khổ": dáng người ngồi ôm đầu, những vòng suy nghĩ quay mãi quanh đầu |
| "…chia hạnh phúc thành ba tầng…" | Ba bậc thang hiện lần lượt theo từng tầng được đọc: món ăn và lời khen ở bậc một, lá cờ trên đỉnh dốc ở bậc hai, ngọn đèn yên tĩnh ở bậc ba |
| "…phải hiểu thì mới thương được…" | Hai trái tim nét vàng lồng vào nhau, câu trích "Lòng phải hiểu được lòng…" hiện bên dưới |

## 3A · Những cơn sóng trong lòng

| Ý | Nhịp hình theo câu |
|---|---|
| Cơn giận | (1) Ấm nước trên bếp, từng bọt nhỏ nổi lên theo "bực bội nhỏ"; (2) dáng người bước ra hiên, ngực phồng xẹp theo hơi thở; (3) lửa dưới ấm dịu xuống; (4) hai người ngồi đối diện, câu trích "tình thương chính là khắc tinh…" |
| Trí tưởng tượng | (1) Điện thoại úp trên bàn, kim đồng hồ quay nhanh; (2) bong bóng suy nghĩ phình to vẽ cảnh xe cộ hỗn loạn; (3) câu trích; (4) bong bóng xẹp, cửa mở, người thân bước vào |
| Lo lắng | (1) Bàn tay giơ cốc nước, đồng hồ nhảy từ phút sang giờ sang cả ngày, cánh tay run dần; (2) chiếc cốc nặng dần thành tảng đá; (3) danh sách viết ra từng dòng; (4) cốc được đặt xuống bàn, câu trích "Sống sâu sắc với hôm nay…" |

## 3B · Thương và được thương

| Ý | Nhịp hình theo câu |
|---|---|
| Ghen tuông | (1) Hai dáng người đứng cạnh nhau, dòng ca dao hiện chữ; (2) bóng của một người phủ lên người kia rồi rút về; (3) mỗi người có một khoảng trời riêng (cây đàn, sách, bạn bè); (4) một người chìa tay, người kia nắm lấy |
| Nhàm chán | (1) Củ ấu tròn trịa phóng to trong khung tim; (2) khung tim thu lại, củ ấu lộ góc nhọn; (3) hai bàn tay cùng nâng một mái nhà nhỏ (tình và nghĩa); (4) cây bút dừng lại trên tờ đơn, không ký |
| Tha thứ | (1) Bàn tay đo gang trên trái tim, một gang rưỡi; (2) vết nứt một gang lọt vừa; (3) trái tim nới rộng ra; (4) hai người ngồi cạnh nhau, một người nói, người kia gật nhẹ |
| Lắng nghe, phán xét | (1) Khung tranh đóng quanh dáng một người; (2) câu trích "Thấy vậy chứ không phải vậy", khung tranh tan; (3) mặt hồ gợn sóng lặng dần (chữ lắng); (4) hai người ngồi đối diện, một người nghiêng về phía người đang nói |

## 3C · Đi qua những lúc thăng trầm

| Ý | Nhịp hình theo câu |
|---|---|
| Chịu đựng | (1) Câu trích chịu/đựng; (2) bàn tay thả vốc muối vào tô nước, nước đổi màu đục; (3) vốc muối thả xuống dòng sông, dòng nước vẫn trong và chảy; (4) dòng sông mở rộng ra |
| Thất bại | (1) Bức tường gạch xếp dở; (2) chữ "thất bại" gạch đi thành "chưa thành công"; (3) dáng người vội chạy từ cửa này sang cửa khác; (4) người ấy ngồi xuống bậc thềm, nhìn lại bức tường |
| Buông xả | (1) Bác nông dân chạy ngang cánh đồng, tay chỉ về xa; (2) mười hai con bò nét vẽ đi xa dần; (3) nhóm người ngồi dưới gốc cây, câu trích; (4) những món đồ, huy chương, bong bóng lời khen buộc dây vào tay một người rồi tuột dần |
| Biết đủ, thảnh thơi | (1) Lá thu rơi trên bàn làm việc đầy giấy, câu "Ủa, mùa thu đến rồi à?"; (2) chồng tiền nhỏ dần thành một chiếc ghế êm; (3) con đường quanh co, dáng người thong thả bước; (4) bước chân để lại dấu trên đường, không có vạch đích |

## 3D · Sống giữa mọi người

| Ý | Nhịp hình theo câu |
|---|---|
| Cô đơn | (1) Bàn ăn đông người, một dáng ngồi khuất sau bức tường mờ; (2) tường hiện rõ từng viên gạch (phòng thủ, tự ái); (3) câu trích, một ô cửa sổ trên tường mở ra; (4) dáng người ngồi yên bên cửa sổ, nắng sớm |
| Biết ơn | (1) Trái cam trên tay; (2) từ trái cam mọc ngược ra rễ, hạt giống, mưa, nắng, gió và dáng người trồng; (3) hai bàn tay chắp lại |
| Ta làm từ những thứ không phải ta | (1) Tô canh chua bốc khói trên bàn bếp; (2) phía sau hiện dần nhiều dáng người các thế hệ đứng quanh bếp; (3) câu trích; (4) một người cúi chào trước bàn thờ nhỏ |
| Nâng đỡ | (1) Con cò bên hồ, túi nylon trùm đầu; (2) cô gái lội ào xuống, nước bắn, con cò bay đi; (3) dáng tác giả bước chậm, tay đưa ra; con cò đứng yên, túi được gỡ; (4) trở lại khung cửa nhà xưa: người bà ôm đứa cháu |

## 3E · Những điểm chưa đạt

| Ý | Nhịp hình theo câu |
|---|---|
| Lặp ý | (1) Các trang sách lật liên tục, cùng một nét vẽ trái tim lặp lại trên mỗi trang; (2) mũi tên vòng tròn quay về chỗ cũ; (3) lịch nhỏ, mỗi ngày một chương được đánh dấu |
| Y khoa, số liệu không nguồn | (1) Trang sách có ô chú thích nguồn bỏ trống, dấu hỏi nét vàng bên lề; (2) con số trên trang mờ dần; (3) ống nghe bác sĩ đặt cạnh sách |
| Niềm tin viết như điều hiển nhiên | (1) Hai cuốn sổ trên bàn; (2) bàn tay chép sang cuốn sổ nhỏ những dòng "thực hành"; (3) cuốn kia khép hờ, đặt sang một bên |

## 3F · Tổng kết

| Câu đọc | Hình và chuyển động |
|---|---|
| "Tóm lại… muốn thương thì phải hiểu trước." | Sợi chỉ vàng ở phần 2 trở lại, nối hai trái tim |
| "…sách đi qua bốn mảng…" | Bốn hình nhỏ hiện lần lượt theo từng mảng được đọc (ấm nước, hai dáng người, vốc muối và dòng sông, tô canh chua), xếp quanh cuốn sách rồi thu về giữa |
| "…mỗi tối mở ra một chương…" | Đèn ngủ đầu giường bật lên, cuốn sách mở ở một chương; ngoài cửa sổ trời tối dần |
| "Nếu các bạn đang hay giận, hay lo…" | Ba trang lần lượt mở: Tức Giận, Lo Lắng, Cô Đơn |

## 4–5

| Phần | Hình |
|---|---|
| 4 Ý kiến cá nhân | Chờ người dùng đưa lời; hình chọn sau theo nội dung |
| 5 Nhận xét chung | Cuốn sách khép lại, ánh sáng dịu |

Khi dựng từng phần, bản mô tả này được cập nhật theo hình thật trong Studio.
