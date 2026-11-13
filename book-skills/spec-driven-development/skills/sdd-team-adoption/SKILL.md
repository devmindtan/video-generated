---
name: sdd-team-adoption
description: Đưa Spec Driven Development vào một đội hoặc dự án và vận hành hằng ngày - quyết định có nên dùng SDD không, vai trò của PO/BA, tech lead, dev, engineering manager, QA quanh spec, bốn chỉ số (Spec Coverage, AC Coverage, Regen Success Rate, Trace Ratio), lộ trình thử 30/60/90 ngày, nhịp một ngày làm việc, các hiểu nhầm hay gặp. Dùng khi người dùng hỏi có nên áp dụng SDD hay spec-first cho dự án/đội của mình, muốn bắt đầu thử, đặt quy trình review spec, đo xem SDD có hiệu quả không, hoặc phân vai khi làm cùng AI coding agent. English triggers - adopt spec-driven development, rollout plan, team process with AI agents, roles, metrics, pilot, when not to use SDD.
---

# Đưa SDD vào một đội

## Có nên dùng không

Cân nhắc dùng khi: hệ thống sẽ sống trên khoảng nửa năm, có hơn hai dev, có quy tắc nghiệp vụ không đơn giản (tiền, hợp
đồng, pháp lý, quyền truy cập, quy trình), người trong đội hay thay đổi, AI sinh phần đáng kể code, hoặc đây là phần lõi
sản phẩm. Quy tắc ngắn: nếu chi phí bảo trì và đào tạo người mới về sau lớn hơn chi phí viết spec từ đầu thì nên dùng.

Không nên: prototype dùng dưới một tuần rồi bỏ; spike kỹ thuật (chứng minh đáng làm rồi mới viết spec); script một lần;
dự án một người (README ngắn là đủ); khi chưa có người nào đứng ra sở hữu và làm rõ nghiệp vụ, việc cần sửa trước là
chuyện sở hữu đó.

Gỡ hiểu nhầm khi người dùng ngần ngại:
- Không phải waterfall: spec vừa đủ, sống trong repo, sửa liên tục.
- Tuần đầu có chậm hơn, phần bù lại đến sau vài tháng; dự án một tuần thì không kịp hoàn vốn.
- Không chỉ dành cho doanh nghiệp lớn, và không bắt buộc DDD hay Hexagonal đầy đủ.
- AI càng giỏi viết code thì câu hỏi "viết đúng cái gì" càng đáng giá.

## Vai trò

| Vai | Giữ gì | Không làm |
|---|---|---|
| PO / BA | BR, cùng viết UC (tác nhân, luồng, ngoại lệ nghiệp vụ), bắt các câu "đương nhiên" | không cần đọc code |
| Tech lead | review spec góc kỹ thuật, quyết phần nào giao AI phần nào người giữ, ADR gắn với spec | không để AI quyết kiến trúc |
| Dev | phát hiện chỗ spec thiếu, viết test map AC, dẫn dắt AI | không âm thầm quyết quy tắc trong code; mở spec PR |
| Engineering manager | nhịp review, ai sở hữu gì, chỉ số, đào tạo người mới, giải thích với lãnh đạo vì sao tuần đầu chậm | không cần review từng dòng spec |
| QA | vào từ lúc viết spec: AC test được không, Given/When/Then đủ rõ chưa, trường hợp biên nào người dùng thật sẽ chạm | không đợi code xong mới test |

Đội nhỏ: một người đội nhiều mũ được, nhưng không tự duyệt mọi thứ của mình; kéo founder, khách hàng, vận hành hoặc hỗ
trợ vào đọc spec để có người không viết code hỏi những câu đời thường.

## Bốn chỉ số

- **Spec Coverage**: % use case đang hoạt động có spec dùng được, có link BR và có AC. Gợi ý của sách: MVP mới gần 100%;
  module nóng của hệ thống cũ khoảng 70% sau một quý; đừng ép 100% cho toàn bộ hệ thống cũ.
- **AC Coverage**: % AC có ít nhất một test. Quan trọng hơn code coverage, vì thiếu nó thì để AI sinh lại code là rủi ro.
- **Regen Success Rate**: % lần AI sinh lại code mà bộ test xanh, không phải sửa tay nhiều. Thấp thường do spec chưa rõ
  hoặc test chưa đúng.
- **Trace Ratio**: % PR hoặc commit có mã UC hợp lệ.

Không đo bằng số dòng spec, số UC đã đóng, hay code coverage thay cho AC coverage. Ngoài ra theo dõi thời gian để người
mới làm được việc và tỷ lệ lỗi ở module đã áp dụng.

## Lộ trình thử

- **Ngày 1–30**: một use case nhỏ, một dev, một người nghiệp vụ; cài đặt tối thiểu; học cái gì hiệu quả, vướng ở đâu.
- **Ngày 31–60**: mở rộng sang một module "ấm" của hệ thống cũ; đo coverage (đếm tay cũng được); mục tiêu phần lớn PR
  mới có mã UC (sách gợi ý từ 60%).
- **Ngày 61–90**: nhìn lại theo số liệu và chọn: chuẩn hóa cho cả đội, áp dụng một phần, hoặc dừng.

Ba việc làm ngay tuần tới: chọn một use case với một dev và một người nghiệp vụ đi trọn một vòng trong một sprint; tạo
thư mục `specs/` với mẫu UC; đo chỉ số đầu tiên là bao nhiêu PR có mã UC.

## Nhịp một ngày

Standup nói theo mã UC → gặp chỗ spec thiếu thì mở spec PR → người nghiệp vụ bổ sung AC → merge spec → AI triển khai →
dev đọc và sửa test → review hỏi nguồn gốc quyết định → cuối ngày viết nhanh spec nháp cho use case tiếp theo.

Ở buổi sprint review: đọc AC cùng người nghiệp vụ, báo cáo test theo AC, phản hồi mới thành AC mới trong spec, chỗ spec
còn thiếu thành câu hỏi mở có người sở hữu.

## Khi agent được hỏi về quy trình

Đưa ra lộ trình và chỉ số phù hợp quy mô thật của người dùng (một người, đội nhỏ, nhiều đội), nói rõ cái gì là kinh
nghiệm của tác giả chứ không phải số liệu đo độc lập, và đề xuất bắt đầu nhỏ thay vì đổi quy trình cả đội một lần. Các
skill liên quan: `sdd-write-spec` (viết spec), `sdd-feature-loop` (vòng làm và review), `sdd-legacy-code` (hệ thống cũ).

## Nguồn

Ý của sách "Spec Driven Development" (Nguyễn Thế Huy, ebook tiếng Việt), số trang là trang PDF:

- Đối tượng đọc và chỉ số cho engineering manager: PDF tr. 4. So sánh vibe coding và SDD theo thời gian: PDF tr. 10.
- Cảnh sprint review, vai trò, đội nhỏ: PDF tr. 53–55. Chỉ số: PDF tr. 60–61. Lộ trình 30/60/90, một ngày mẫu, ba việc
  tuần sau: PDF tr. 61–63.
- Khi nên và không nên dùng, gỡ hiểu nhầm, vai trò thay đổi: PDF tr. 64–66. Lời khuyên bắt đầu nhỏ: PDF tr. 68.

Phần của skill: bảng vai trò gom gọn, và cách agent trả lời câu hỏi về quy trình theo quy mô của người dùng.
