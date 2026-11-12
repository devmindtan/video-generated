# Thông tin đã chốt (đề xuất) — Chủ nghĩa khắc kỷ: tổng quan và đánh giá

| Mục | Giá trị |
|---|---|
| Định dạng | Video dài 16:9, 1920×1080, 30 fps |
| Thời lượng mục tiêu | 13–15 phút (≤ 18 phút), không ép giọng nhanh |
| Cấu trúc (book-insights, từ tập 3) | Màn hình tập 5–10 s (nhạc intro series) → Hook giọng → Mở chuyện → Phần 1 Cuốn sách là gì → Phần 2 Sợi chỉ xuyên suốt → Nội dung chính chia nhóm → Những điểm chưa đạt → Tổng kết → Ý kiến cá nhân → Nhận xét chung → Outro series (dùng lại) |
| Giọng | Option 1 đề xuất: preset VieNeu (Minh Đức hoặc playlist hiện tại), 1×, một giọng; clone chỉ khi người dùng chọn. Karaoke từng chữ sau khi giọng cuối chốt |
| Nhạc | Intro: Pufino – Enlivening (dùng lại). Thân bài: nhạc nền rất nhỏ, **speechVolume = pauseVolume** cố định |
| Chủ đề & animation | Đề xuất: `triet-hoc-co-dien` (trầm, suy niệm) + `minh-hoa-cam-xuc`; hoặc `cam-xuc-lua` + `minh-hoa-cam-xuc`; chốt khi dựng. Hình vẽ bằng code, chuyển cảnh mượt tiết chế |
| Chữ | Stoic Sans (Noto Sans) 700, phụ đề ngà/từ khóa vàng, thẻ tiêu đề nhóm; chữ ≥ 34 px |
| Phụ đề | Tối đa 2 dòng, bám mốc câu/giọng; không che hình |
| Duyệt | Màn hình tập + 30 giây đầu sau hook trước, chờ duyệt trong Studio. Chốt ban đầu → bản vá → review-preview; không render khi làm |
| Xuất | Chỉ khi người dùng yêu cầu |

## Quy tắc áp dụng (bắt buộc)

- Workflow book-insights (từ tập 3): không intro/Cách làm cũ, hook riêng có câu người xem lần đầu, gọi tác giả là "tác giả", không đọc thông tin thừa, nhạc dưới lời cố định, hình theo lời, không xuất clip khi làm.
- `docs/script-voice-guide.md`. **Phân vai (2026-11-12):** thiết kế/kế hoạch (OpenCode); thực hiện do Claude/Codex.
- Phân biệt diễn giải của tác giả hiện đại với Khắc kỷ cổ; không đưa kỹ thuật chịu đau/đói hay nhận định y khoa như lời khuyên.

## Thành phần dự kiến (khi thực hiện)

- Project: `docs/projects/book-cnkk-001-overview/`, `scripts/projects/book-cnkk-001-overview/`, `src/projects/book-cnkk-001-overview/`, `public/book-cnkk-001-overview/`.
- Đăng ký: `series/tam-ly-cuoc-song/book-insights/series.json` (`book: "chu-nghia-khac-ky"`), registry, composition/parts theo chuẩn; tái dùng hook/outro/scene-kit.
