# Hình từng cảnh · 4 short giới thiệu tập 3

Người dùng (2026-11-09, khi trả gói): *"Mặc dù nội dung được lấy từ video chính nhưng animation hay khung nền này kia
không cần giống, có thể thiết kế khác."* Vì vậy, short tập 3 **không chép hình nét vàng trên nền tối của tập dài**. Mỗi
short có hình và chuyển động riêng, thiết kế cho khung dọc. Lời và giọng vẫn là đoạn trích của tập 3.

Không dùng hình AI; mọi thứ vẽ bằng code.

## Ngôn ngữ hình chung: "giấy và mực"

Short đi theo thumbnail F của tập 3, để người xem thấy short và video dài cùng một nhà.

- **Nền**: giấy sáng có vân nhẹ, nghiêng dần từ xám ngà lạnh sang ngà ấm, có vignette mỏng ở mép. Đây là phần tương phản
  nhẹ của thumbnail F, đặt theo chiều dọc: phía trên lạnh, phía dưới ấm. Riêng short 3 chia trái/phải giống hệt F.
- **Màu**:
  - mực xám đá `#2b3a44` cho nét và chữ chính;
  - đỏ của bìa sách `#a3241b` cho từ khóa hay điểm nhấn;
  - vàng `#c99a45` cho đường nối và chỗ sáng;
  - ngà cho chữ trên nền tối.
- **Nét**: nét mực dày 4–6px, đầu tròn, vẽ ra theo lời đọc (stroke draw), thỉnh thoảng có một mảng tô phẳng.
  - Người vẽ thành dáng đơn giản, không mặt.
  - Vật to, ít chi tiết, đọc được trên điện thoại.
- **Chữ trong hình**: Stoic Sans 700, ≥ 56px. Chữ chuyển động kiểu kinetic typography (chữ rơi vào, lật, gạch đi) là
  một phần của hình, không phải chú thích.
- **Phụ đề**: giữ kiểu chữ Stoic của kênh (ngà, từ khóa vàng, sáng theo giọng). Phụ đề nằm trên một dải mực tối bo
  góc ở y ≈ 1380–1560, nên vẫn đọc rõ trên nền giấy sáng.
- **Đầu trang** (y ≈ 200–400): "ĐỌC SÁCH, HIỂU MÌNH · TẬP 03" màu nâu vàng, cùng dòng "Đắc nhân tâm · Dale Carnegie".
- **Chuyển cảnh**: không cắt cứng. Trang giấy trượt nhẹ hoặc mực tan; mỗi đổi hình có một nhịp lặng ngắn, như quy tắc
  chuyển cảnh của series.
- **Vùng hình**: y ≈ 460–1340, rộng 80–940. Chừa mép phải khoảng 140px và đáy khoảng 380px cho YouTube.

## Cảnh chung

| Cảnh | Hình |
|---|---|
| Câu mở (khung đầu) | Câu mở hiện **trọn trên một trang ngay từ khung đầu**, chữ mực to khoảng 76px, từ khóa đỏ. Bên dưới, hình riêng của short đã có sẵn và bắt đầu chuyển động, không để nửa dưới trống. |
| Lời mời | Thumbnail F thu nhỏ (hình thật của video dài) nghiêng nhẹ trên trang giấy, có viền bóng như một tấm ảnh. Dưới đó: "Xem trọn tập 03", rồi một khung bình luận vẽ nét với chữ "Link ở phần bình luận" và mũi tên nhỏ chỉ xuống. |

Lời đọc đã viết mới (script.md, narration.json). Mỗi hình gắn với một câu và hiện đúng chữ được đọc trong câu đó
(Video.tsx, `c.w(<id câu>, <chữ>)`); sau mỗi câu có khoảng lặng để hình vẽ xong rồi mới chuyển.

## Short 1 · Thắng cũng là thua

| Câu | Hình |
|---|---|
| 1-1 câu mở | Chiếc cúp nghiêng như bìa đã chọn; vết nứt đỏ vẽ dần. |
| 1-2 "Vì khi bị nói là sai…" | Hai dáng người; người trái chỉ tay, bong bóng "SAI!" đỏ ở chữ "sai"; người phải khoanh tay ở "đổi ý", chữ "không đổi ý". |
| 1-3 "Họ lo giữ thể diện…" | Người phải ôm khối "Ý" trước ngực, viền đỏ dày lên ở "bám chặt"; hai người giãn ra, mũi tên hai đầu phía trên. |
| 1-4 "…thua thì mình thua, còn thắng thì mình cũng thua." | Bảng chữ lật: THUA → THUA, rồi THẮNG → THUA, từng ô theo từng chữ. |
| 1-5 "Lời khuyên của sách…" | Mảnh giấy xé: "Tôn trọng ý kiến của người khác", "Đừng nói thẳng: “Bạn sai rồi”", nét đỏ gạch ở chữ "sai". |
| 1-6 "…chừa cho họ một đường lùi." | Hai dáng người; đường vàng cong mở ra sau người phải, nhãn "ĐƯỜNG LÙI". |

## Short 2 · Chữ "nhưng" thành chữ "và"

**Một khung cố định** từ câu mở tới lời mời (người dùng 2026-11-09: chữ KHEN xuất hiện chỗ này chỗ kia): KHEN ở trên,
hàng ô lật ở giữa, GÓP Ý ở dưới; từng phần đổi trạng thái tại chỗ, không vẽ lại khung.

| Câu | Thay đổi trong khung |
|---|---|
| 2-1 câu mở | KHEN; năm ô lật trống, dấu "?" đỏ. |
| 2-2 "Đó là chữ nhưng." | Năm ô lật lần lượt thành NHƯNG. |
| 2-3 "…rồi mới góp ý." | Ô GÓP Ý hiện ở dưới. |
| 2-3b ví dụ "bài này em làm tốt lắm, nhưng…" | Bong bóng lời nói ở nửa trên: câu ví dụ, chữ "nhưng" đỏ; tắt khi sang câu 2-5. |
| 2-4 "…nghi lời khen…" | KHEN nhạt đi, dấu "?" lớn bên phải. |
| 2-5 "…đổi chữ nhưng thành chữ và." | Hàng NHƯNG lật một lần thành VÀ vàng. |
| 2-6 "Mình nói trọn lời khen trước…" | KHEN sáng lại, quầng ấm; dấu "?" tắt. |
| 2-6b "Câu lúc nãy sẽ thành…" | Bong bóng lời nói lại hiện: cùng câu ví dụ với chữ "và" vàng. |
| 2-7 "…một lời động viên." | Ô GÓP Ý đổi thành ĐỘNG VIÊN viền vàng, trái tim nhỏ. |

## Short 3 · Tấm lòng hay cửa miệng

| Câu | Hình |
|---|---|
| 3-1 câu mở | Bong bóng lời nói rỗng nét đứt và trái tim đỏ, như bìa đã chọn. |
| 3-2 "…sách dạy nịnh." | Bìa sách thật; con dấu "DẠY NỊNH?" đóng chéo ở chữ "dạy nịnh". |
| 3-3 "…vạch ranh giới rất rõ." | Bìa tách đôi lạnh/ấm; đường vàng vẽ dọc ở chữ "vạch"; hai nhãn NỊNH / THẬT LÒNG. |
| 3-4 câu trích | Dáng người nghiêng: tim và đường vàng từ ngực ra "TẤM LÒNG", đường xám nét đứt từ miệng ra "CỬA MIỆNG", mỗi đường ở chữ của nó. |
| 3-5 "…đi kèm sự chân thành." | Hai dáng người, trái tim đỏ giữa họ, chữ "CHÂN THÀNH". |
| 3-6 "…chỉ còn là cái vỏ bên ngoài." | Nụ cười và thẻ tên hiện theo chữ; ở "cái vỏ" một khung viền nét đứt khép quanh cả hai, cả hai rỗng ruột và nhạt xám, chữ "chỉ còn là cái vỏ?" (người dùng 2026-11-10: đổi chữ "kỹ thuật"). |

## Short 4 · Vì sao có người không thích cuốn sách

| Câu | Hình |
|---|---|
| 4-1 câu mở | Bìa sách thật, tờ ghi chú "CHÊ?" dán lên góc bìa. |
| 4-2 "…rất dễ thành thao túng." | Ghi chú "dễ thành thao túng?"; tay cầm dây con rối, dây đứt ở chữ "túng". |
| 4-3 "…dừng ở đâu." | Ghi chú "dừng ở đâu?"; một con đường, vạch dừng đỏ nét đứt và dấu "?". |
| 4-4 "…nói thẳng, hay cần đặt giới hạn." | Ghi chú "lúc cần nói thẳng?"; hai dáng người, bong bóng "!", đường giới hạn đỏ, chữ "GIỚI HẠN". |
| 4-5 "…gọi cả cuốn là sách dạy nịnh thì cũng chưa công bằng." | Cân hai đĩa THÍCH / CHÊ; tờ "dạy nịnh?" đặt lên đĩa CHÊ làm cân lệch; chữ "chưa công bằng". |
| 4-6 "Hai cách nhìn ấy…" | Cân thăng bằng lại; chữ "đều có phần đúng". |

## Bìa của từng short: thiết kế kỹ như thumbnail tập 3

Người dùng (2026-11-09): *"nhớ là cả thumbnail cũng cần phải thiết kế cẩn thận hơn"*. Bìa short **không lấy một khung
hình trong video**. Bìa làm theo đúng cách đã làm thumbnail tập 3:

- **Thiết kế bằng HTML/CSS**: mỗi bìa là một sân khấu cố định 1080×1920.
  - Thư mục `src/projects/book-dnt-001-shorts/thumbnail-web/`, dùng base.css/base.js, font và ảnh lấy từ `/public/...`.
  - Mỗi short có **ít nhất 3 phương án theo những hướng khác nhau**. Ví dụ: hướng chữ là chính, hướng vật thể là chính,
    hướng dựa trên thumbnail F.
- **Chọn trong trang quản lý**: bạn so sánh và chọn trong tab **Thumbnail** của dự án. Tab sẽ được mở rộng để mỗi short
  có một nhóm phương án và một lựa chọn riêng. Không có trang so sánh riêng.
- **Chuyển vào Studio**: phương án đã chọn được chép 1:1 vào Still dọc của short đó (đặt cạnh composition, dùng
  `renderTo`). Bạn xuất bằng nút Render.

Tiêu chí cho mỗi bìa:

- **Vùng an toàn**: chữ và vật chính nằm trong khoảng giữa 1080×1350. Lưới short thường cắt bìa về 4:5 nên ngoài vùng
  này chỉ để nền.
- **Chữ**: một thông điệp, tối đa 6 từ trên 2–3 dòng, chiếm ít nhất 60% chiều rộng. Vẫn phải đọc được khi thu bìa còn
  1/4.
- **Một hình chính** tràn khung, nói đúng chủ đề của short, cùng ngôn ngữ giấy và mực với thumbnail F để nhận ra cả bộ.
- **Không lộ mặt người.** Tương phản rõ.
- **Chấm điểm trước khi gửi**, theo thang của series: tương phản, số từ/dòng, chiều rộng chữ, đọc được ở 1/4, hình
  chính cụ thể. Dưới 60/100 thì làm lại.

Bìa đã chọn (người dùng 2026-11-09, "1. A 2. C 3. C 4. A"; đã dựng thành Still trong Studio):

1. A · Chiếc cúp nứt: "THẮNG / CŨNG LÀ / THUA"
2. C · Bảng chữ lật: "ĐỪNG NÓI / NHƯNG / hãy nói / VÀ"
3. C · Bong bóng và trái tim: "KHÉO MIỆNG / HAY / THẬT LÒNG?"
4. A · Giấy ghi chú: "VÌ SAO / NHIỀU NGƯỜI / CHÊ?"

Hình mở đầu mỗi short dùng lại hình ảnh của bìa đã chọn, để người xem lướt từ bìa vào video thấy liền mạch.
