# Thông tin đã chốt (đề xuất) — Dám bị ghét: tổng quan và đánh giá

| Mục | Giá trị |
|---|---|
| Định dạng | Video dài 16:9, 1920×1080, 30 fps |
| Thời lượng mục tiêu | 13–15 phút (≤ 18 phút), không ép giọng nhanh |
| Cấu trúc (book-insights, từ tập 3) | Màn hình tập 5–10 s (nhạc intro series) → Hook giọng → Mở chuyện → Phần 1 Cuốn sách là gì → Phần 2 Sợi chỉ xuyên suốt → Nội dung chính chia nhóm (5 đêm/3–4 cụm) → Những điểm chưa đạt → Tổng kết → Ý kiến cá nhân → Nhận xét chung → Outro series (dùng lại) |
| Giọng | Option 1 đề xuất: preset VieNeu (Minh Đức hoặc playlist hiện tại), 1×, một giọng; clone chỉ khi người dùng chọn |
| Nhạc | Intro: Pufino – Enlivening (dùng lại). Thân bài: nhạc nền rất nhỏ, **speechVolume = pauseVolume** cố định |
| Chủ đề & animation | Đề xuất: `triet-hoc-co-dien` + `minh-hoa-cam-xuc` (đối thoại, ranh giới, quan hệ); chốt khi dựng. Hình vẽ bằng code, chuyển cảnh mượt tiết chế |
| Chữ | Stoic Sans (Noto Sans) 700, phụ đề ngà/từ khóa vàng; chữ ≥ 34 px |
| Phụ đề | Tối đa 2 dòng, bám mốc câu/giọng |
| Duyệt | Màn hình tập + 30 giây đầu sau hook trước, chờ duyệt trong Studio. Chốt ban đầu → bản vá → review-preview; không render khi làm |
| Xuất | Chỉ khi người dùng yêu cầu |

## Quy tắc áp dụng (bắt buộc)

- Workflow book-insights (từ tập 3), `docs/script-voice-guide.md`. **Phân vai (2026-11-12):** thiết kế/kế hoạch (OpenCode); thực hiện do Claude/Codex.
- Gọi tác giả là "tác giả"; không đọc thông tin thừa. Trình bày rõ: đối thoại hư cấu, lập luận triết học/Adler, không phải chẩn đoán hay sự thật lâm sàng.
- Không dùng để phủ nhận sang chấn/bệnh tâm lý hay biện minh bỏ mặc/bạo lực; phân chia nhiệm vụ cần an toàn và trách nhiệm chung.

## Thành phần dự kiến (khi thực hiện)

- Project: `docs/projects/book-dbg-001-overview/`, `scripts/projects/book-dbg-001-overview/`, `src/projects/book-dbg-001-overview/`, `public/book-dbg-001-overview/`.
- Đăng ký: `series/tam-ly-cuoc-song/book-insights/series.json` (`book: "dam-bi-ghet"`), registry, tái dùng hook/outro/scene-kit.
