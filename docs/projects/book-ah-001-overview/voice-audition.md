# Nghe thử giọng — Thay đổi tí hon hiệu quả bất ngờ

- Lựa chọn giọng: **2, clone giọng người dùng** (+2 bán cung, giữ thời lượng), như tập 1; một giọng cho cả series.
  Tham chiếu `library/voice-references/tam-nhin-cho-cuoc-song/clips/006130-15s.wav`, consent self. Không cần clone thử
  (giọng và tham chiếu đã duyệt ở tập 1).
- Intro, đoạn Cách làm và outro: dùng lại nguyên giọng clone của tập 1.

## Giọng tạm (đang dùng để dựng, không phải giọng cuối)

Quốc Tuấn (VieNeu, laptop), theo quy tắc video dài: dựng đủ bằng giọng tạm, chốt kịch bản xong mới clone một lượt.

| Đoạn | Take | Thời lượng |
|---|---|---|
| Thẻ tập | `book-ah-tam-qt-01` | 10,5 giây |
| Mở chuyện | `book-ah-tam-qt-02b` (bản viết lại, p2) | 79,1 giây |
| Cuốn sách là gì | `book-ah-tam-qt-03` | 27,0 giây |
| Sợi chỉ xuyên suốt | `book-ah-tam-qt-04` | 84,6 giây |
| Quy luật 1 | `book-ah-tam-qt-05b` ("đường sắt tại Nhật Bản", p4) | 82,1 giây |
| Quy luật 2 | `book-ah-tam-qt-06` | 72,1 giây |
| Quy luật 3 | `book-ah-tam-qt-07` | 78,9 giây |
| Quy luật 4 | `book-ah-tam-qt-08` | 75,2 giây |
| Khi thói quen đã thành nếp | `book-ah-tam-qt-08b` | 55,5 giây |
| Những điểm chưa đạt | `book-ah-tam-qt-08e` | 41,6 giây |
| Tổng kết | `book-ah-tam-qt-08f` | 26,2 giây |
| Ý kiến cá nhân (nháp kênh) | `book-ah-tam-qt-08g` | 72,4 giây |
| Nhận xét chung | `book-ah-tam-qt-09` | 20,1 giây |

Nhận dạng cục bộ của các take giọng tạm khớp đủ chữ; nhận dạng không xác nhận thanh điệu. Bản cũ giữ nguyên
(`book-ah-tam-qt-02`, `book-ah-tam-qt-05`).

## Giọng clone (2026-11-04)

- Kịch bản chốt sau bản vá p5. Clone một lượt 139 câu: thẻ tập trên laptop (máy GPU chưa sẵn sàng lúc đầu, cùng model),
  12 đoạn nội dung trên máy GPU desktop-kndgm60 (GTX 1660 SUPER, khoảng 34 giây mỗi câu). Take `seg-<đoạn>-v1`.
- Kiểm tra dấu cục bộ đánh dấu 58 câu; clone lại các câu đó một lần (`seg-<đoạn>-v2`, máy GPU). Mỗi câu dùng bản mới
  nhất qua kiểm tra dấu, nếu không có thì bản mới nhất (`build-body.py --project book-ah-001-overview`), ghép với nhịp
  nghỉ như tập 1 rồi +2 bán cung giữ thời lượng.
- Nghe liền cả tập trong Studio: **BookAhTap02Clone** (13 phút 48 giây). BookAhTap02 vẫn là giọng tạm cho tới khi người
  dùng chọn.

### Sửa theo lần nghe đầu (2026-11-04)

Người dùng nghe BookAhTap02Clone và góp ý trong chat: tên sách đọc có ngắt, "giấc mơ mà cậu theo đuổi", câu người hút
thuốc cụ thể hơn, câu đường sắt dễ hiểu hơn, hai câu mở mới (chưa đạt, nhận xét chung), chỗ đọc lướt. 7 câu đổi lời
được clone lại (`seg-<đoạn>-v3`, máy GPU; câu thẻ tập trên laptop khi máy GPU chưa vào được SSH). Câu người hút thuốc
clone 3 bản (v3–v5), cả ba đều bị nhận dạng nghe "nhịn" thành "nhìn": người dùng nghe để quyết.
Nhịp mới (`scripts/projects/book-ah-001-overview/pacing.json`): câu nhanh hơn 4,6 tiếng/giây kéo chậm nhẹ, giữ cao độ, tối
đa 12%; sau câu tiêu đề mục ngắn nghỉ ít nhất 0,5 giây. Cả tập clone giờ 14 phút 14 giây (trong mức 11,5–14,5 phút).

### Câu còn bị đánh dấu (người dùng nghe, mốc trong BookAhTap02Clone)

Phần lớn các chữ lặp lại y hệt ở mọi bản, nên nhiều khả năng là nhận dạng nghe nhầm; chỉ tai người dùng quyết định.
Bỏ qua khác biệt chỉ do cách viết (tỉ/tỷ, ý/í, Habits/Habit).

| Mốc | Phần | Nhận dạng nghe | Câu |
|---|---|---|---|
| 1:02 | Mở chuyện | cậu → cầu, chày → dày | Vào ngày cuối của năm thứ hai trung học, một cây gậy bóng chày tuột khỏi tay một bạn cùng lớp và đập thẳng vào mặt cậu. |
| 1:09 | Mở chuyện | cậu → cầu, mũi rạn xương → mỗi ràng sương | Cậu bị gãy mũi, rạn xương sọ, được đưa đi cấp cứu bằng trực thăng và hôn mê suốt đêm hôm đó. |
| 1:20 | Mở chuyện | cậu → cầu, chày → chầy, cậu → cầu | Điều cậu mong nhất là được quay lại sân bóng, vì bóng chày là giấc mơ mà cậu theo đuổi từ năm bốn tuổi. |
| 1:46 | Mở chuyện | cậu → cầu, tát → tác, lại → ra | Theo tác giả, những việc ấy chẳng có gì to tát, nhưng cho cậu cảm giác mình đang làm chủ lại được đời mình. |
| 1:53 | Mở chuyện | tin → tính | Sự tự tin ấy lan dần sang việc học, rồi sang cả phòng tập. |
| 2:02 | Mở chuyện | tiến → tiếng | Tác giả kể rằng không có một khoảnh khắc nào biến cậu từ một bệnh nhân hôn mê thành người như thế, mà là cả một chuỗi dài những bước tiến rất nhỏ. |
| 3:09 | Phần 2 · Sợi chỉ xuyên suốt | lãi → lại | Nhưng lãi kép thì đến muộn. |
| 3:12 | Phần 2 · Sợi chỉ xuyên suốt | tác → tắt | Tác giả ví như một cục nước đá trong phòng lạnh: nhiệt độ tăng dần mà đá chưa tan, đến một mức nào đó mới tan. |
| 3:46 | Phần 2 · Sợi chỉ xuyên suốt | nhịn → nhìn | Người thứ nhất vẫn thấy mình là người hút thuốc đang cố nhịn; người thứ hai đã thấy mình là người không hút thuốc nữa. |
| 4:08 | Phần 2 · Sợi chỉ xuyên suốt | hiển → hiện, quen → quan, quen → quan | Từ bốn bước đó có bốn quy luật để xây thói quen tốt: làm cho nó hiển nhiên, hấp dẫn, dễ dàng và thỏa mãn; và đảo ngược lại để bỏ thói quen xấu. |
| 5:32 | Quy luật 1 · Làm cho hiển nhiên | giường → dường | Ông cũng khuyên mỗi không gian chỉ nên gắn với một việc: giường để ngủ, bàn để làm việc. |
| 5:49 | Quy luật 1 · Làm cho hiển nhiên | chúng → trúng | Như tác giả viết: "Tránh những cám dỗ dễ dàng hơn kháng cự chúng." |
| 6:09 | Quy luật 2 · Làm cho hấp dẫn | giản → giảng | Ông cũng tự ghi chú rằng đây là cách nói giản lược về bộ não. |
| 6:13 | Quy luật 2 · Làm cho hấp dẫn | cám → căm | Gói cám dỗ. |
| 6:39 | Quy luật 2 · Làm cho hấp dẫn | thà → thả | Theo tác giả, thói quen nào là bình thường ở nơi mình sống sẽ là thói quen hấp dẫn nhất, vì "Hầu hết thời gian chúng ta thà sai theo đám đông còn hơn là đúng một mình." |
| 6:55 | Quy luật 2 · Làm cho hấp dẫn | khát → khắc | Theo tác giả, "Thói quen là giải pháp thời hiện đại cho những khát khao nguyên thủy." |
| 6:59 | Quy luật 2 · Làm cho hấp dẫn | dậy → dạy, dậy → dạy | Cùng một việc, đổi chữ "phải" thành chữ "được" thì cảm giác khác hẳn: không phải "mình phải dậy sớm đi làm", mà "mình được dậy sớm đi làm". |
| 7:07 | Quy luật 2 · Làm cho hấp dẫn | đảo → đạo | Đảo ngược lại, muốn bỏ thói quen xấu thì nhìn rõ nó không thật sự cho mình điều mình cần. |
| 7:19 | Quy luật 3 · Làm cho dễ dàng | nghĩ → nghỉ | Làm nhiều hơn nghĩ. |
| 7:21 | Quy luật 3 · Làm cho dễ dàng | nhiếp → nhếp | Một thầy dạy nhiếp ảnh chia lớp làm hai: một nửa chấm điểm theo số lượng ảnh, nửa kia chỉ cần nộp một tấm thật hoàn hảo. |
| 7:39 | Quy luật 3 · Làm cho dễ dàng | tần suất → tành xuất | Theo tác giả, "việc hình thành thói quen dựa trên tần suất chứ không phải thời gian." |
| 7:45 | Quy luật 3 · Làm cho dễ dàng | ma → mà | Bớt ma sát. |
| 7:46 | Quy luật 3 · Làm cho dễ dàng | van → văn | Tác giả ví như vòi nước bị gập: thay vì vặn van mạnh hơn, hãy gỡ chỗ gập. |
| 8:21 | Quy luật 3 · Làm cho dễ dàng | choàng → toàn | Nhà văn Victor Hugo nhờ người khóa hết quần áo của mình lại, chỉ chừa một tấm khăn choàng, để không thể ra ngoài và phải ngồi viết. |
| 9:00 | Quy luật 4 · Làm cho thỏa mãn | lõi → loại | Theo tác giả, quy tắc cốt lõi là: điều được thưởng ngay thì lặp lại, điều khó chịu ngay thì tránh. |
| 9:20 | Quy luật 4 · Làm cho thỏa mãn | đặc → nặc | Tác giả lưu ý phần thưởng phải hợp với con người mình muốn trở thành, vì "Sự khích lệ có thể bắt đầu một thói quen. Đặc tính duy trì một thói quen." |
| 9:30 | Quy luật 4 · Làm cho thỏa mãn | lọ → lò, lọ → lò, môi → mô | Một nhân viên môi giới trẻ đặt hai cái lọ trên bàn, mỗi cuộc gọi xong lại chuyển một cái kẹp giấy sang lọ kia. |
| 9:37 | Quy luật 4 · Làm cho thỏa mãn | lên → linh | Tác giả gợi ý đánh dấu lên lịch mỗi ngày đã làm, và nhắc một nguyên tắc: "Bỏ lỡ một lần là vô tình. Bỏ lỡ hai lần chính là khởi đầu cho một thói quen mới." |
| 9:45 | Quy luật 4 · Làm cho thỏa mãn | làm → là | Những ngày tệ mà vẫn làm một chút lại là những ngày đáng giá nhất. |
| 9:50 | Quy luật 4 · Làm cho thỏa mãn | đảo → đạo | Đảo ngược: có người cùng giữ lời. |
| 9:53 | Quy luật 4 · Làm cho thỏa mãn | tác → tắc, kể → kê, huấn → quấn | Tác giả kể chuyện một người ký hợp đồng thói quen với vợ và huấn luyện viên, ghi sẵn hình phạt nếu bỏ cuộc. |
| 9:59 | Quy luật 4 · Làm cho thỏa mãn | dõi → giỏi | Theo tác giả, khi biết có người đang dõi theo, mình khó làm điều sai hơn. |
| 10:27 | Khi thói quen đã thành nếp | nhàm → nhằm | Vừa sức và chịu được nhàm chán. |
| 10:51 | Khi thói quen đã thành nếp | gắn → ngắn | Tác giả tự làm một bản tổng kết mỗi cuối năm, và khuyên đừng gắn chặt mình vào một vai trò duy nhất. |
| 11:03 | Những điểm chưa đạt | cuốn → cũng | Cuốn sách có nhiều cách làm hay, nhưng cũng có vài điểm mình chưa ưng. |
| 11:31 | Những điểm chưa đạt | mẹo → mèo | Thứ ba, phần lớn ví dụ là chuyện người thành công ở Mỹ, và các mẹo sắp xếp môi trường khó áp dụng khi mình đang thật sự nghiện hay đang ở hoàn cảnh quá khó; chính tác giả cũng thừa nhận điều đó. |
| 11:46 | Tổng kết | bền → bình | Tóm lại, Thay đổi tí hon, hiệu quả bất ngờ xoay quanh một ý: những thói quen nhỏ, lặp lại đủ lâu, sẽ nhân lên thành kết quả lớn, và thói quen bền nhất bắt đầu từ con người mình muốn trở thành. |
| 11:58 | Tổng kết | hiển → hiện | Từ đó, sách đưa ra bốn quy luật: làm cho hiển nhiên, hấp dẫn, dễ dàng và thỏa mãn, cùng cách đảo ngược để bỏ thói quen xấu. |
| 12:10 | Tổng kết | chúng → chung | Như tác giả viết ở cuối sách: "Những thói quen nhỏ không thêm vào mà chúng hợp thành." |
| 12:37 | Ý kiến cá nhân | quãng → quảng | Rất nhiều người bỏ cuộc đúng ở quãng đó, khi đã cố gắng mà chưa thấy gì thay đổi. |
| 12:49 | Ý kiến cá nhân | ngẫm → ngẩm | Nhưng nếu chịu ngồi lại ngẫm, sẽ thấy điều tác giả muốn nói sâu hơn: mình không thắng một thói quen bằng sức chịu đựng, mà bằng cách sắp xếp để việc đúng dễ xảy ra hơn. |
| 13:21 | Ý kiến cá nhân | gợi → gửi | Nếu chỉ chọn một cách để bắt đầu, mình gợi ý xếp chồng thói quen. |
| 13:32 | Nhận xét chung | gấp → ngấp | Gấp sách lại, điều mình nhớ nhất không phải một con số nào, mà là thay đổi hóa ra không cần bắt đầu bằng một quyết tâm lớn. |
| 13:41 | Nhận xét chung | dở → vỡ ở | Nếu bạn đang muốn đổi một thói quen mà lần nào cũng bỏ dở giữa chừng, cuốn này cho bạn rất nhiều cách để thử lại, bắt đầu từ những việc chưa tới hai phút. |

## Câu đảo ngược tách đôi (2026-11-04, máy GPU)

Người dùng thấy phần "đảo ngược" khó hiểu: câu "…và đảo ngược lại để bỏ thói quen xấu" được tách thành hai câu, câu
sau nói rõ bốn điều ngược lại. Clone mới: `seg-04-soi-chi-v6` (hai câu) và `seg-04-soi-chi-v7` (câu đầu, seed 7);
bản ghép dùng v7 cho câu đầu và v6 cho câu sau. Máy nghi một chữ, cần nghe:

| Mốc (BookAhTap02Clone) | Phần | Máy nghe | Câu |
| --- | --- | --- | --- |
| 4:08 | Sợi chỉ | hiển → hiện (v7; v6 nghe "mãn → mạng") | Từ bốn bước đó có bốn quy luật để xây thói quen tốt: làm cho nó hiển nhiên, hấp dẫn, dễ dàng và thỏa mãn. |
| 4:14 | Sợi chỉ | (không) | Muốn bỏ thói quen xấu thì làm ngược lại: cho nó khó thấy, kém hấp dẫn, khó làm và không thỏa mãn. |

## Còn lại

- Người dùng nghe BookAhTap02Clone và báo câu nào đọc sai thật: clone lại riêng câu đó thành take mới.
- Sau khi người dùng chọn: đưa giọng clone vào BookAhTap02, cân lại thời gian, phụ đề sáng theo giọng (word-times.py),
  mô tả có chương, QA; bỏ bản nghe thử BookAhTap02Clone.
