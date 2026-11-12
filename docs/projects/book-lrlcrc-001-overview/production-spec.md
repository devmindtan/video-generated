# Thông tin đã chốt (đề xuất) — Làm ra làm chơi ra chơi: tổng quan và đánh giá

| Mục | Giá trị |
|---|---|
| Định dạng | Video dài 16:9, 1920×1080, 30 fps |
| Thời lượng mục tiêu | 13–15 phút (≤ 18 phút), không ép giọng nhanh |
| Cấu trúc (book-insights, từ tập 3) | Màn hình tập 5–10 s (nhạc intro series) → Hook giọng → Mở chuyện → Phần 1 Cuốn sách là gì → Phần 2 Sợi chỉ xuyên suốt → Nội dung chính chia nhóm (3 ý Phần 1 + 4 quy tắc) → Những điểm chưa đạt → Tổng kết → Ý kiến cá nhân → Nhận xét chung → Outro series (dùng lại) |
| Giọng | Option 1 đề xuất: preset VieNeu (Minh Đức hoặc playlist hiện tại), 1×, một giọng; clone chỉ khi người dùng chọn. Karaoke từng chữ sau khi giọng cuối chốt |
| Nhạc | Intro: Pufino – Enlivening (dùng lại). Thân bài: nhạc nền rất nhỏ, **speechVolume = pauseVolume** cố định. `body-music.json` (dự kiến, khi dựng) |
| Chủ đề & animation | Đề xuất: `nang-luong-tre` (rõ, tỉnh, nhịp làm việc) + `do-hoa-thong-tin` (khối lịch, thang đo sâu/hời hợt, luồng chú ý); chốt khi dựng. Hình vẽ bằng code, chuyển cảnh mượt tiết chế |
| Chữ | Stoic Sans (Noto Sans) 700, phụ đề ngà/từ khóa vàng, thẻ tiêu đề nhóm; chữ ≥ 34 px, không tràn khung |
| Phụ đề | Tối đa 2 dòng, bám mốc câu/giọng; không che hình |
| Duyệt | Màn hình tập + 30 giây đầu sau hook trước, chờ duyệt trong Studio. Chốt ban đầu → bản vá → review-preview; không render khi làm |
| Xuất | Chỉ khi video xong và người dùng yêu cầu |

## Quy tắc áp dụng (bắt buộc)

- Workflow `series/tam-ly-cuoc-song/book-insights/workflow.json` (từ tập 3): không intro series/Cách làm cũ, hook riêng có câu cho người xem lần đầu, gọi tác giả là "tác giả" trong lời đọc, không đọc thông tin thừa, kịch bản có hồn, nhạc dưới lời mức cố định, hình theo lời, không xuất clip khi làm.
- `docs/script-voice-guide.md`: mở thẳng chuyện, cụ thể, nhịp câu tự nhiên.
- **Phân vai (2026-11-12):** gói này là thiết kế/kế hoạch (OpenCode). Thực hiện (giọng, code hình/composition, timing, QA sản xuất, render) do Claude/Codex.
- **Nguồn bản dịch hạn chế:** chỉ diễn giải ý, **không trích nguyên văn**, **không dùng con số/danh xưng chưa đối chiếu**. Không trình bày các giai thoại bệnh/tâm lý hay cơ sở nghiên cứu cũ như lời khuyên hay đồng thuận chắc chắn. Lời khuyên thực hành cần gắn giới hạn (người tự chủ lịch, không đẩy chi phí sang người khác).

## Thành phần dự kiến (khi thực hiện)

- Project: `docs/projects/book-lrlcrc-001-overview/`, `scripts/projects/book-lrlcrc-001-overview/`, `src/projects/book-lrlcrc-001-overview/`, `public/book-lrlcrc-001-overview/`.
- Đăng ký: `series/tam-ly-cuoc-song/book-insights/series.json` (`book: "lam-ra-lam-choi-ra-choi"`), `src/projects/registry.tsx`, composition/thumbnail/hook/parts theo bố cục chuẩn (tái dùng hook/outro/scene-kit).
- Ghi chú: nội dung thực dụng nhưng cần điều chỉnh theo hoàn cảnh người xem (ca, dịch vụ, chăm sóc); tên tiếng Việt và tinh thần "làm ra làm, chơi ra chơi" được nối rõ trong kịch bản.
