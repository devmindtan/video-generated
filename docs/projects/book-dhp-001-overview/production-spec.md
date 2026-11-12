# Thông tin đã chốt (đề xuất) — Dám hạnh phúc: tổng quan và đánh giá

| Mục | Giá trị |
|---|---|
| Định dạng | Video dài 16:9, 1920×1080, 30 fps |
| Thời lượng mục tiêu | 13–15 phút (≤ 18 phút), không ép giọng nhanh |
| Cấu trúc (book-insights, từ tập 3) | Màn hình tập 5–10 s (nhạc intro series) → Hook giọng → Mở chuyện → Phần 1 Cuốn sách là gì → Phần 2 Sợi chỉ xuyên suốt → Nội dung chính chia nhóm (5 phần/nhóm ý) → Những điểm chưa đạt → Tổng kết → Ý kiến cá nhân → Nhận xét chung → Outro series (dùng lại) |
| Giọng | Option 1 đề xuất: preset VieNeu (Minh Đức hoặc playlist hiện tại), 1×, một giọng; clone chỉ khi người dùng chọn. Karaoke từng chữ sau khi giọng cuối chốt |
| Nhạc | Intro: Pufino – Enlivening (dùng lại). Thân bài: nhạc nền rất nhỏ, **speechVolume = pauseVolume** cố định. `body-music.json` (dự kiến, khi dựng) |
| Chủ đề & animation | Đề xuất: `triet-hoc-co-dien` + `minh-hoa-cam-xuc` (đối thoại, lớp học, ranh giới, "chúng ta"); chốt khi dựng. Hình vẽ bằng code, chuyển cảnh mượt tiết chế |
| Chữ | Stoic Sans (Noto Sans) 700, phụ đề ngà/từ khóa vàng, thẻ tiêu đề nhóm; chữ ≥ 34 px, không tràn khung |
| Phụ đề | Tối đa 2 dòng, bám mốc câu/giọng; không che hình |
| Duyệt | Màn hình tập + 30 giây đầu sau hook trước, chờ duyệt trong Studio. Chốt ban đầu → bản vá → review-preview; không render khi làm |
| Xuất | Chỉ khi video xong và người dùng yêu cầu |

## Quy tắc áp dụng (bắt buộc)

- Workflow `series/tam-ly-cuoc-song/book-insights/workflow.json` (từ tập 3): không intro series/Cách làm cũ, hook riêng có câu cho người xem lần đầu, gọi tác giả là "tác giả" trong lời đọc, không đọc thông tin thừa (năm XB/dịch giả/NXB trong lời), kịch bản có hồn, nhạc dưới lời mức cố định, hình theo lời (nhịp hình theo câu/mốc), không xuất clip khi làm.
- `docs/script-voice-guide.md`: mở thẳng chuyện, cụ thể, nhịp câu tự nhiên.
- **Phân vai (2026-11-12):** gói này là thiết kế/kế hoạch (OpenCode). Thực hiện (giọng, code hình/composition, timing, QA sản xuất, render) do Claude/Codex.
- Đối thoại hư cấu, lập luận triết học/Adler, không phải chẩn đoán hay bằng chứng giáo dục. Không dùng để phủ nhận sang chấn/bệnh tâm lý hay biện minh bỏ mặc/bạo lực; "tin trước"/phân chia nhiệm vụ cần an toàn và trách nhiệm chung. Phần tình yêu hẹp vào quan hệ đôi lứa — trình bày thận trọng, không áp cho quan hệ bạo hành hay người độc thân.

## Thành phần dự kiến (khi thực hiện)

- Project: `docs/projects/book-dhp-001-overview/`, `scripts/projects/book-dhp-001-overview/`, `src/projects/book-dhp-001-overview/`, `public/book-dhp-001-overview/`.
- Đăng ký: `series/tam-ly-cuoc-song/book-insights/series.json` (`book: "dam-hanh-phuc"`), `src/projects/registry.tsx`, composition/thumbnail/hook/parts theo bố cục chuẩn (tái dùng hook/outro/scene-kit).
- Ghi chú: cuốn tiếp theo *Dám bị ghét*; nên có câu nối ngắn trong mở đầu nhưng tập phải hiểu được khi xem riêng.
