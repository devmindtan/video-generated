# Thông tin đã chốt (đề xuất) — Đi tìm lẽ sống: tổng quan và đánh giá

| Mục | Giá trị |
|---|---|
| Định dạng | Video dài 16:9, 1920×1080, 30 fps |
| Thời lượng mục tiêu | 13–15 phút (≤ 18 phút), không ép giọng nhanh |
| Cấu trúc (book-insights, từ tập 3) | Màn hình tập 5–10 s (nhạc intro series) → Hook giọng (chào, vì sao đáng bàn, câu cho người xem lần đầu, nêu tên sách) → Mở chuyện → Phần 1 Cuốn sách là gì → Phần 2 Sợi chỉ xuyên suốt → Nội dung chính chia nhóm → Những điểm chưa đạt → Tổng kết → Ý kiến cá nhân → Nhận xét chung → Outro series (dùng lại) |
| Giọng | Option 1 đề xuất: preset VieNeu (Minh Đức hoặc theo playlist hiện tại), 1×, một giọng; clone chỉ khi người dùng chọn. Kịch bản/giọng cuối chốt trước khi làm word-timing karaoke |
| Nhạc | Intro series: Pufino – Enlivening (dùng lại). Thân bài: nhạc nền rất nhỏ, **speechVolume = pauseVolume** (mức cố định, không nhô ở nghỉ/chuyển cảnh). `body-music.json` (dự kiến, khi dựng) |
| Chủ đề & animation | Đề xuất: `cam-xuc-lua` (ấm, nội tâm, phù hợp chủ đề ý nghĩa/bi kịch) + `minh-hoa-cam-xuc` (hình ẩn dụ, chuyển động theo nhịp câu), hoặc `triet-hoc-co-dien` + `minh-hoa-cam-xuc`; chốt khi dựng. Hình vẽ bằng code, chuyển cảnh mượt tiết chế |
| Chữ | Stoic Sans (Noto Sans) 700, phụ đề ngà/từ khóa vàng, thẻ tiêu đề nhóm; chữ ≥ 34 px, không tràn khung |
| Phụ đề | Trang gộp tối đa 2 dòng, bám mốc câu/giọng; karaoke từng chữ chỉ sau khi giọng cuối được chọn/chốt (theo workflow series) |
| Duyệt | Màn hình tập + 30 giây đầu sau hook (không tính intro nhạc) làm trước, chờ duyệt trong Studio. Chốt ban đầu → bản vá → review-preview; không render/xuất khi đang làm |
| Xuất | Chỉ khi video xong và người dùng yêu cầu |

## Quy tắc áp dụng (bắt buộc)

- Workflow `series/tam-ly-cuoc-song/book-insights/workflow.json`: không intro series/Cách làm từ tập 3, hook riêng có câu người xem lần đầu, gọi tác giả là "tác giả" trong lời đọc, không đọc thông tin thừa (năm XB/dịch giả trong lời), kịch bản có hồn, nhạc dưới lời mức cố định, hình theo lời (chụp khung giữa/cuối mỗi ý khi dựng), không xuất clip khi làm.
- `docs/script-voice-guide.md`: mở thẳng chuyện, cụ thể, nhịp câu tự nhiên, bỏ rào đón/câu chốt rỗng.
- **Phân vai (2026-11-12):** gói này là thiết kế/kế hoạch (OpenCode). Thực hiện (giọng, code hình/composition, timing, QA sản xuất, render) do Claude/Codex.
- Nội dung nhạy cảm (trại tập trung, đau khổ, trầm cảm/tự sát): kể trung thực theo sách, không giật gân, không tôn sùng đau khổ, không đổ lỗi nạn nhân/người không sống sót, không dùng làm lời khuyên y tế.

## Thành phần dự kiến (khi thực hiện)

- Project: `docs/projects/book-dtls-001-overview/`, `scripts/projects/book-dtls-001-overview/`, `src/projects/book-dtls-001-overview/`, `public/book-dtls-001-overview/`.
- Đăng ký: `series/tam-ly-cuoc-song/book-insights/series.json` (`book: "di-tim-le-song"`), `src/projects/registry.tsx`, composition/thumbnail/hook/parts theo bố cục chuẩn.
- Tái dùng: `BookInsightsHookCard`/hook opening, outro series, scene-kit từ tập chuẩn (không chép thành bản riêng nếu có thể import).
