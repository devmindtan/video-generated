# Kênh → series → tập

Điểm bắt đầu để chọn đúng nội dung trước khi sửa hoặc tạo video. [catalog.json](catalog.json) là danh bạ kênh/series; mỗi `series.json` là nguồn duy nhất về tập thuộc series nào. Registry TSX vẫn là nguồn cho timing, component và Studio Edit.

| Kênh | Series | Nội dung |
|---|---|---|
| Tâm lý cuộc sống | [Self-help Shorts](tam-ly-cuoc-song/self-help-shorts/README.md) | Shorts cũ và những tập self-help tiếp theo |
| Tâm lý cuộc sống | [Câu chuyện Stoic](tam-ly-cuoc-song/stoic-stories/README.md) | Các câu chuyện dài đã có |
| Tâm lý cuộc sống | [Đọc sách, hiểu mình](tam-ly-cuoc-song/book-insights/README.md) | Series sách mới, hồ sơ nghiên cứu tách biệt |
| Thiếu nhi | [Tí Hon](kids/tiny-dino/README.md) | Short và video dài của khủng long |
| Thiếu nhi | [Đại dương](kids/ocean-stories/README.md) | Bọt Biển và các tập cùng hướng |
| Khách hàng | [Video sản phẩm](client-work/product-videos/README.md) | Tách khỏi hai kênh nội dung |

```sh
npm run projects -- list --channel tam-ly-cuoc-song
npm run projects -- list --series book-insights
npm run projects -- show one-bad-day
npm run projects:check
```

Trong Studio, video và thumbnail nằm chung folder của từng tập. Các ID/link composition cũ giữ nguyên. Series chưa có video sản xuất chỉ xuất hiện trong danh bạ và hồ sơ nghiên cứu; không tạo composition giả để lấp sidebar.

Thêm series bằng `projects create-series`; thêm tập ở trạng thái planning bằng `projects create`. Xem [kiến trúc và hướng dẫn mở rộng](../docs/architecture/series-workflow.md).
