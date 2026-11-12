# Kịch bản — Spec Driven Development: tóm tắt cả cuốn sách

Sách: *Spec Driven Development*, Nguyễn Thế Huy. Nguồn: `series/ngoai-kenh/chua-thuoc-series/books/spec-driven-development/research.md`, trang PDF ghi trong [sources.md](sources.md). Đề xuất giọng: Minh Đức (VieNeu, lựa chọn 1). Mỗi dòng là một câu đọc; `[nghỉ]` là chỗ đổi ý/nhịp nghỉ. `{…}` là ghi chú, không đọc.

Đây là **bản thiết kế kịch bản** (OpenCode): đủ để Claude/Codex dựng video theo kế hoạch. Không tạo giọng, không dựng hình, không render.

## 00 · Mở đầu (màn tên 6,5 s trên nhạc, rồi giọng vào)

Bạn nhờ AI viết gần xong một tính năng trong mười phút.
Code chạy, test xanh, rồi ai cũng mừng. [nghỉ]
Hai tuần sau, một lỗi nhỏ xuất hiện, và không ai trả lời nổi: đoạn này chạy như vậy vì đúng nghiệp vụ, hay vì lúc đó AI đoán bừa?
Mình cũng từng rơi vào cảm giác ấy. [nghỉ]
Cuốn Spec Driven Development bàn đúng chỗ đó: khi AI viết code ngày càng nhanh, thứ dễ mất không phải là code, mà là ý định phía sau. {PDF 3, 6–8}
Video này tóm tắt cả cuốn sách, đi từ cái bẫy của tốc độ, tới cách viết spec, sáu nguyên tắc vận hành, rồi cách áp dụng cho dự án mới lẫn mã cũ. [nghỉ]
Không cần biến quy trình thành giấy tờ nặng nề. Ý của cuốn sách đơn giản hơn: trước khi bảo AI viết, hãy nói rõ mình muốn gì.

## 01 · Vibe coding và cái bẫy của tốc độ (Ch.1, PDF 6–11)

Sách mở bằng câu chuyện của Nam và Linh trong một đội nhỏ làm sản phẩm cho vay.
Nam đưa cho AI một câu nhắc, hai mươi phút sau đã có đủ các lớp, test và tài liệu, kịp giao đúng hạn. {PDF 6}
Vài tuần trôi qua, trạng thái xác minh khách hàng bị đặt ở ba chỗ với ba cách hiểu khác nhau.
Không có ghi chú, không có bản đặc tả, hỏi lại AI thì nó chỉ giải thích dựa trên đống code đang có. {PDF 6–7}
Đến lúc thêm một tính năng mới, việc tưởng chỉ mất ba ngày kéo thành mười một ngày, vì ai cũng phải đoán lại. [nghỉ] {PDF 7; số ngày là ví dụ trong sách}
Tác giả gọi cách làm thử nhanh, sửa nhanh, gộp nhanh đó là vibe coding.
Khi yêu cầu còn hở, AI thường lấp chỗ trống bằng lựa chọn trông hợp lý, và với tiền, quyền truy cập hay dữ liệu khách hàng, cái hợp lý ấy có thể rất đắt. {PDF 7–8}
Ngay cả bộ test do AI sinh từ chính đoạn code vừa viết cũng dễ tạo cảm giác an toàn giả: nó chứng minh code làm đúng… code. [nghỉ] {PDF 8}
Spec Driven Development, hay SDD, đặt một tấm spec ở giữa: con người thống nhất ý định, AI dựa vào đó để viết code, test và tài liệu.
Khi có gì sai, sửa spec trước rồi mới sửa code. {PDF 9}
Tuần đầu có thể chậm hơn một chút vì phải viết spec, nhưng về sau, việc đọc lại, sửa đổi và bàn giao đỡ phải đoán. {PDF 10}
Đây không phải quay về waterfall.
Spec là file văn bản trong kho mã, ngắn vừa đủ để bắt đầu, sai thì sửa, và được kiểm bằng tiêu chí nghiệm thu chứ không phải bằng chữ ký. [nghỉ] {PDF 10–11}
Trước khi đi tiếp, cuốn sách gợi ba câu hỏi: người mới hiểu logic quan trọng bằng cách nào, sửa code AI viết dựa vào đâu, và khi yêu cầu đổi thì biết phải đụng file nào. {PDF 11}

## 02 · Spec là gì, và vì sao cần ngôn ngữ chung (Ch.2, PDF 12–22)

Một câu chuyện người dùng ba dòng chưa phải là spec.
Khách muốn quét mã để thanh toán, nhưng mã hết hạn sau năm phút hay mười lăm phút, tiền về chậm thì xử lý ra sao, đó là những khoảng trống AI sẽ tự điền nếu mình im lặng. [nghỉ] {PDF 12}
Sách chia yêu cầu thành bốn tầng.
Đầu tiên là yêu cầu nghiệp vụ, nói vì sao phải làm và đo thành công bằng gì. {PDF 12–13}
Tiếp là use case, nói ai làm gì: tác nhân, điểm bắt đầu, luồng chính, luồng khác và ngoại lệ. {PDF 13–14}
Rồi tới mô hình thực thể, đặt tên cho những "danh từ" của nghiệp vụ như Đơn hàng, Thanh toán hay Phiên mã, cùng trạng thái và quan hệ của chúng. {PDF 14–15}
Cuối cùng là tiêu chí nghiệm thu: cho trước điều kiện nào, khi làm việc gì, thì kết quả phải ra sao. {PDF 15–16}
Bốn tầng này nối câu chuyện của người làm sản phẩm với thứ có thể kiểm thử được. [nghỉ]
Sách cũng tách hai loại spec: spec mô tả hệ thống đang chạy như thế nào, và spec mô tả thay đổi sắp làm.
Nhờ vậy, mình không trộn "sự thật hiện tại" với "đề xuất đang bàn". {PDF 16–17}
Khi đặt tên, cuốn sách mượn ý của Domain-Driven Design: dùng cùng một ngôn ngữ với nghiệp vụ, và chia ranh giới khi một từ như "Đơn hàng" mang nghĩa khác nhau ở các ngữ cảnh khác nhau. {PDF 18–19}
Còn kiến trúc lục giác gợi một cách sắp xếp: lõi nghiệp vụ ở giữa, những thứ như giao diện web, cơ sở dữ liệu hay cổng thanh toán cắm vào như adapter bên ngoài.
Làm vậy, khi phải thay một đầu nối hay nhờ AI viết lại một phần, phần lõi ít bị kéo theo. {PDF 19–21}
Sách cũng nói rõ: script chạy một lần, trang quản trị đơn giản hay bản thử nghiệm thì chưa cần làm đủ mọi tầng. {PDF 21}

## 03 · Sáu nguyên tắc Spec-Driven (Ch.3, PDF 23–31)

Từ thực hành, cuốn sách rút ra sáu nguyên tắc. [nghỉ]
Một, yêu cầu dẫn dắt.
Khi một quy tắc mới chỉ nằm trong code, nó sẽ bị rải ra nhiều chỗ; có spec thì người và AI cùng biết phải sửa ở đâu. {PDF 23–24}
Hai, AI hỗ trợ, người giữ quyết định.
AI rất hợp với việc lặp lại, tạo khung, viết test theo tiêu chí, nhưng chuyện tiền, quyền truy cập, pháp lý hay kiến trúc lớn phải có người chịu trách nhiệm. {PDF 24–25}
Ba, cải tiến theo vòng lặp.
Spec không cần hoàn hảo ngay từ đầu: viết vừa đủ, thử, nhận phản hồi, rồi sửa, nhưng nên giữ lịch sử những gì đã thay đổi. {PDF 25–26}
Bốn, được bảo vệ bằng kiểm thử.
Điều quan trọng không phải có nhiều test, mà là test bám vào hành vi nghiệp vụ và tiêu chí nghiệm thu, để sau này sửa hay viết lại vẫn có hàng rào. {PDF 27–28}
Năm, lấy người liên quan làm trung tâm.
Spec phải đọc được với người chịu hậu quả: một câu "đương nhiên là như vậy" mà không ai viết ra, chính là nơi bug hay trú. {PDF 28–29}
Sáu, truy vết được.
Khi mỗi thay đổi gắn với mã yêu cầu, lần tới có sự cố hay cần bàn giao, mình lần ngược từ code về spec, về lý do ban đầu, thay vì đoán trong đêm. [nghỉ] {PDF 29–30}

## 04 · Greenfield: bắt đầu từ con số không (Ch.4, PDF 32–43)

Phần thực hành đầu tiên là một dự án mới: công cụ chấm công và nghỉ phép nội bộ, ba người, một tuần. {PDF 32}
Ngày đầu, đội ngồi với người làm nhân sự, hỏi việc hằng ngày đau ở đâu, và viết ra mục tiêu đo được cùng những thứ nằm ngoài phạm vi.
Chỉ sau buổi nói chuyện đó, họ mới chốt một bản yêu cầu nghiệp vụ và khoảng năm use case cốt lõi. [nghỉ] {PDF 32–34}
Ngày thứ hai, họ vẽ sơ đồ tác nhân, dựng mô hình thực thể, và phát hiện câu hỏi tưởng nhỏ: ngày lễ xử lý thế nào, ghi rõ là chưa làm ở bản đầu. {PDF 34–36}
Ngày thứ ba và thứ tư, họ viết spec chi tiết cho một use case mẫu.
Khi AI đề xuất trừ phép ngay lúc nhân viên gửi đơn, spec nói rõ là chỉ trừ khi quản lý duyệt, nên kế hoạch bị sửa trước khi sinh code. {PDF 36–38}
Hai bài test lỗi sau đó không bị vá lặng trong code, mà dẫn ngược về việc bổ sung tiêu chí nghiệm thu và quy tắc còn thiếu. [nghỉ] {PDF 38–40}
Ngày cuối, bản chạy thử nhận phản hồi: cái gì ngoài phạm vi thì ghi vào phiên bản tiếp theo, cái gì thiếu trong tiêu chí thì bổ sung rồi mới chỉnh.
Cuốn sách kể lại kết quả như một ví dụ: đội có một bộ spec, bộ test bám theo, và quan trọng hơn, họ biết sửa yêu cầu mới ở đâu. {PDF 40–41}
Những lỗi hay gặp cũng rất đời: viết spec quá chi tiết từ ngày một, quên tiêu chí nghiệm thu, để AI viết code trước rồi mới bổ sung spec, hoặc người viết tự duyệt. {PDF 42}

## 05 · Brownfield: làm với mã cũ (Ch.5, PDF 44–52)

Sang hệ thống cũ, bài toán khác hẳn.
Tâm nhận một kho mã tính phí lớn, tài liệu gần như trống, người viết ban đầu đã nghỉ, và mọi thay đổi đều đáng sợ. {PDF 44}
Sách cảnh báo hai sai lầm.
Một là đập đi viết lại toàn bộ bằng AI khi chưa hiểu hệ thống đang chạy đúng điều gì.
Hai là để AI đọc code rồi sinh ra spec, sau đó tin spec đó là sự thật, vì một lỗi sống trong code ba năm vẫn chỉ là lỗi. [nghỉ] {PDF 44–45}
Cách đi được đề xuất gồm năm bước.
Bước một, dựng lại mô hình thực thể từ cơ sở dữ liệu, rồi ngồi với người vận hành để hiểu từng trường thực sự nghĩa là gì. {PDF 45–46}
Bước hai, lần ra các use case từ code, nhật ký và giao diện, rồi tạm đánh dấu những luồng chưa ai giải thích được. {PDF 46–47}
Bước ba, kiểm chứng với nghiệp vụ: cái nào là hành vi đúng hiện tại, cái nào là thay đổi cần bàn, tách rõ trước khi sửa. {PDF 47–48}
Bước bốn, bọc quanh hành vi hiện tại bằng các bài test đặc tả từ dữ liệu thật đã ẩn danh, không để chứng minh đúng sai, mà để refactor không làm lệch những gì đang chạy. {PDF 48–49}
Bước năm, mới tái cấu trúc có bảo vệ: mỗi lần một phần, có cờ bật tắt, có so sánh, và không vừa refactor lớn vừa đổi quy tắc nghiệp vụ. [nghỉ] {PDF 49–50}
Không cần viết spec cho toàn bộ kho mã.
Ưu tiên chỗ nóng, chỗ hay đổi; chỗ lạnh thì tạm để yên.
Cuốn sách gọi việc này rất thực tế: không phải trả hết nợ kỹ thuật, mà là dừng vay thêm. {PDF 50–52}

## 06 · Vận hành team Spec-Driven hằng ngày (Ch.6, PDF 53–63)

SDD không chỉ là kỹ thuật viết tài liệu, mà là cách đội làm việc cùng nhau. [nghỉ]
Người làm sản phẩm giữ mục tiêu và hỏi những câu "đương nhiên là thế nào".
Kỹ sư dẫn dắt giữ kiến trúc, quyết chỗ nào giao cho AI và chỗ nào cần người.
Lập trình viên phát hiện khoảng hở, nối test với tiêu chí, và không âm thầm quyết định nghiệp vụ trong code.
Người quản lý giữ nhịp, còn kiểm thử bước vào từ lúc viết spec để soi ca biên. {PDF 53–55}
Trong kho mã, spec, mã nguồn và test soi vào nhau theo use case; mỗi bình luận sửa code đáng ra nên dẫn được về một yêu cầu cụ thể. {PDF 55–58}
Cuốn sách gợi vài chỉ số để biết đội đang đi đúng hướng: bao nhiêu use case có spec dùng được, bao nhiêu tiêu chí có test, có viết lại được an toàn không, và bao nhiêu thay đổi truy vết được về yêu cầu. {PDF 60–61}
Lộ trình thực tế cũng đi dần: ba mươi ngày đầu thử một use case nhỏ, sáu mươi ngày mở rộng và đo, chín mươi ngày nhìn lại dữ liệu rồi quyết định tiếp hay dừng. [nghỉ] {PDF 61–62}

## 07 · Khi nào nên, khi nào không, và bắt đầu nhỏ (Kết, PDF 64–68)

Sách không khuyên dùng SDD cho mọi thứ.
Một bản thử nghiệm ném đi sau một tuần, một đoạn script chạy một lần, hay dự án một người tự biết hết, thường không cần. {PDF 64}
Nhưng với hệ thống sống lâu, nhiều người cùng chạm vào, quy tắc nghiệp vụ quan trọng, hoặc AI đang sinh ra phần lớn mã, việc thiếu spec sẽ sớm thành cái giá phải trả. {PDF 64–65}
Cuốn sách cũng gỡ vài hiểu nhầm: spec không phải quay về làm việc chậm, không chỉ dành cho doanh nghiệp lớn, và càng có AI giỏi thì câu hỏi "viết đúng thứ gì" càng đáng tiền. [nghỉ] {PDF 65–66}
Ba việc nhỏ để bắt đầu trong tuần tới: chọn một use case, làm trọn một vòng trong một lần làm việc ngắn, một người kỹ thuật và một người hiểu nghiệp vụ cùng ngồi lại.
Tạo chỗ để spec sống trong kho mã, và đo một điều đơn giản, chẳng hạn bao nhiêu thay đổi gắn được với một yêu cầu. {PDF 63}
Spec không làm AI chậm đi.
Nó chỉ giúp tốc độ đi về đúng chỗ. {PDF 3, 68}
