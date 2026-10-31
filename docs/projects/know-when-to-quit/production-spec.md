# Thông tin đã chốt — Biết dừng cũng là dũng cảm

- Project: `know-when-to-quit` · Series: Self-help và lời nhắc cuộc sống · Kênh: Tâm lý cuộc sống.
- Định dạng: Short dọc **1080×1920, 30 fps**.
- Thời lượng mục tiêu: **45 giây, dao động cho phép 42–48 giây.** Quá dao động thì rút chữ (bản vá kịch bản), không tăng tốc hay kéo chậm giọng, không kéo video lên 55–60 giây.
- Cảnh: 5 cảnh theo [script.md](script.md). Mốc giờ trong kịch bản chỉ là ước tính; timing thật lấy từ dữ liệu giọng và phụ đề (`src/projects/know-when-to-quit/timeline.json`), không cố định số giây.
- Composition dự kiến: `KnowWhenToQuit` (video) và `KnowWhenToQuitThumbnail` (Still), đặt cạnh nhau trong Studio: Tam-Ly-Cuoc-Song → Self-Help-Shorts → know-when-to-quit, kèm `renderTo('know-when-to-quit')`.

## Giọng

- Lựa chọn 2, clone giọng `mushashi` (VoxCPM2 qua VoiceStudio, máy GPU `desktop-kndgm60`; laptop khi máy GPU tắt). Consent: permission theo `library/voice-references/mushashi/reference.json`.
- Tốc độ gốc 1×, **+1 bán cung** giữ thời lượng (người dùng chọn khi duyệt bản vá p1). Một giọng, một cách xử lý cho cả video. Chi tiết và đoạn mẫu: [voice-audition.md](voice-audition.md).
- Lời đọc đầy đủ làm sau khi chốt ban đầu; giữ mọi take cũ; nghe lại thanh điệu, không coi điểm ASR là duyệt phát âm.

## Hình và chuyển động

- **Bản vá sau chốt v1:** tranh minh họa điện ảnh vẽ bằng SVG trong Remotion (nhiều lớp, ánh sáng có hướng, chất liệu bằng gradient và nhiễu), vì phiên này không có imagegen. Không ảnh AI, không Gemini/Veo/Vertex. Chi tiết: [image-prompts.md](image-prompts.md).
- Không có người hay mặt người; cảnh 5 dùng xẻng đã đặt xuống cạnh đôi găng tay, không vẽ tay.
- Tông: nâu đất, hổ phách, cam chạng vạng ở cảnh 1–3; xám xanh bình minh ở cảnh 4; xanh lá và nắng sớm ở cảnh 5. Nền tối, tương phản cao, nửa dưới khung tối để đặt chữ.
- Chuyển động theo frame, có lý do: đèn chập chờn và bụi trong chóp sáng (cảnh 1), cát rơi (cảnh 2), bụi đất bay (cảnh 3), sương trôi (cảnh 4), nắng lên (cảnh 5). Không zoom/pan đều đặn. Chuyển cảnh mờ chéo ngắn.

## Chữ (nhận diện Stoic)

- Phụ đề: `Stoic Sans` (Noto Sans) **Bold 700**, chữ ngà, từ khóa vàng (ví dụ: "lỡ rồi", "sai chỗ", "thông tin", "nhìn rõ"). Không dùng weight 500/750/800. Phụ đề căn theo bản thu, giữ nguyên chữ của kịch bản.
- Thumbnail: tiêu đề **BIẾT DỪNG** nhấn vàng, dòng phụ "cũng là dũng cảm", Bold 700 trên nền tối, lề an toàn. Component chuẩn bị sẵn, không tự xuất ảnh.
- Kiểm tra kiểu chữ tương đương `scripts/projects/people-pleasing/test-caption-style.cjs`.

## Âm thanh

- Nhạc: **snowfall** — Øneheart, reidenshi ([nguồn](https://oneheartisok.bandcamp.com/track/snowfall)), file đầy đủ `public/own-timeline/audio/snowfall.mp3` dùng chung read-only, tốc độ 1×. Cấu hình: [music.json](../../../src/projects/know-when-to-quit/music.json): `speechVolume` 0,35, `pauseVolume` 0,40, fade-in 1,2 giây, fade-out 2 giây theo mép clip; ducking theo phụ đề; start/end và source trim chỉnh tự do trong Studio.
- Không SFX. Khoảng lặng sau "Ba năm. Bốn mươi triệu." và trước câu cuối để nguyên, không lấp bằng hiệu ứng.

## Quy tắc đang áp dụng

- AGENTS.md: Short triết lý mới mặc định 45 giây; nhận diện Stoic cho caption và thumbnail; chủ thể không lộ mặt; nhạc giữ fade và volume control; không Gemini/Veo cho video triết lý; không render/export cả video (chỉ clip duyệt từng cảnh qua `automation scene-clip`); kiểm tra thanh điệu tiếng Việt khi nghe.
- Series `self-help-shorts` chưa có `workflow.json`, nên không có quy tắc riêng của series tại thời điểm chốt.
- Sau khi chốt, mọi sửa đổi các mục trong gói đi qua `npm run automation -- patch know-when-to-quit --reason "…"`.
