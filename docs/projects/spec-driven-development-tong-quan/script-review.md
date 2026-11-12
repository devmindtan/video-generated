# Phản biện kịch bản và bản dựng — Spec Driven Development: tóm tắt cả cuốn sách

## Bản dựng đầu (2026-11-12)

Gói thiết kế do OpenCode lập (script.md, brief, sources, production-spec, image-prompts). Claude thực hiện: màn tên +
mở đầu trước (luật video dài), rồi cả video khi người dùng nói "Tiếp tục hết đi".

### Kịch bản

- Đọc đúng nguyên văn script.md; không thêm, không bớt ý. Ghi chú nguồn `{…}` chỉ là ghi chú, không đọc.
- Hai cách đọc riêng cho giọng (phụ đề giữ chữ gốc): "vibe coding" → "vai bờ cô đinh"; "hỏi lại AI thì" → "hỏi lại AI,
  thì" (bản đầu đọc lặp "AI AI").
- Thời lượng: kịch bản 88 câu đọc ở 1× ra 10:50, ngắn hơn mục tiêu 13–14 phút của production-spec. Không kéo giọng và
  không thêm lời để bù; nếu muốn dài hơn thì cần người dùng duyệt thêm nội dung cho kịch bản.

### Hình

- Giống hai video sách kỹ thuật trước: chủ đề Bản vẽ kỹ thuật, sơ đồ vẽ bằng code, không có code thật trên hình (khối
  code chỉ là các vạch xám). Một nhịp hình mỗi câu hoặc vế chính, đổi cảnh lần lượt (cảnh cũ tắt hẳn rồi cảnh mới mới
  hiện) nên hai sơ đồ không bao giờ chồng nhau.
- Bộ hình lặp lại cả video: tờ spec màu vàng hổ phách (gấp góc), AI và hệ thống màu xanh lơ, lỗi/rủi ro màu đỏ, chuỗi
  người → spec → AI → code mở và đóng video.
- Từng phần: câu chuyện Nam và Linh (ba cách hiểu, 3 ngày thành 11 ngày), vòng vibe coding và an toàn giả, bốn tầng yêu
  cầu, hai loại spec, cùng một từ ở hai ngữ cảnh, lõi lục giác và các đầu nối; danh sách sáu nguyên tắc với hình riêng
  từng nguyên tắc; dòng ngày 1 → ngày 5 cho dự án chấm công; năm bước cho mã cũ và lưới chỗ nóng/chỗ lạnh; các vai quanh
  spec, cột truy vết, chỉ số, lộ trình 30/60/90 ngày; khi nào nên/không, hiểu nhầm, ba việc bắt đầu.
- Kiểm tra: `npm run layout-check` trên toàn video (mỗi 6 khung) còn 0 chỗ chữ/viền/dây đè nhau (lượt đầu có 3: dây đỏ
  "sai thì sửa spec trước" cắt qua ô "tài liệu", dấu X cắt qua chữ "hồ sơ dày / chờ chữ ký"; đã dời). Rà khung giữa và
  cuối từng câu (visual-sync, 88 câu): mỗi câu có hình đúng ý; chữ trên hình ≥ 32 px.
