# Đánh giá hệ thống hiện tại: tối ưu & tái cấu trúc

- **Ngày đánh giá:** 2026-11-13
- **Phạm vi:** toàn bộ workspace `20-repo-generate-video` (ứng dụng Remotion, công cụ quản lý, tự động hóa sản xuất, pipeline giọng/PDF/media/ảnh, catalog series/project, tài liệu vận hành).
- **Mục đích:** cung cấp cơ sở toàn diện để một agent khác lập kế hoạch và thực hiện tối ưu/tái cấu trúc.
- **Phương pháp:** phân tích tĩnh mã nguồn, tài liệu kiến trúc/quy trình, cấu hình và thống kê kho (`wc -l`, liệt kê module/project, `graphify-out`/`graph:query`, đọc `package.json`, `tools/*`, `docs/architecture/*`, `scripts/shared/*`). **Không chạy benchmark/profiling** (render, TTS/clone, manager, I/O) và không đo peak RAM/VRAM thời gian thực; các nhận định hiệu năng là suy luận có căn cứ từ kiến trúc và chính sách hiện có.
- **Ràng buộc bắt buộc khi thực hiện tối ưu (kế thừa `AGENTS.md`):** thay đổi nhỏ nhất giải quyết trọn vấn đề; không đổi ID/slug/composition/take/asset đã ổn định và không ghi đè chỉnh sửa của người dùng; giữ tài nguyên máy (≥10% CPU/RAM/đĩa trống, job nặng qua `limited`, một job nặng/lúc); chỉ dùng công cụ/dịch vụ local, open-source hoặc miễn phí thực sự, không gửi dữ liệu/media riêng ra ngoài; không render/xuất/đăng tải/tạo giọng thay bản đã duyệt trừ khi được yêu cầu rõ; mỗi thay đổi hoàn tất tạo commit tập trung (không push).

## 1. Bức tranh hệ thống

### 1.1 Thành phần chính

| Thành phần | Vị trí | Vai trò |
|---|---|---|
| Video app (Remotion) | `src/index.tsx`, `src/projects/<slug>/`, `src/shared/`, `src/looks/`, `src/examples/` | Composition/Still, timing/captions/music config, render output theo `renderTo` (`remotion.config.ts`, `src/projects/registry.tsx`) |
| Tài sản & dữ liệu tập | `public/<slug>/`, `docs/projects/<slug>/`, `scripts/projects/<slug>/` | Media/voice, tài liệu biên tập/QA, story/take/check riêng từng tập |
| Catalog & series | `series/catalog.json`, `series/<channel>/<series>/**`, `scripts/catalog/*` | Nguồn sự thật kênh/series/tập/sách; `projects:check`, scaffold, tra cứu |
| Project manager (local) | `tools/project-manager/*` (`server.cjs`, `store.cjs`, `web/*`, `approvals-view.cjs`, `library.cjs`, `backup.cjs`, `loudness.cjs`, `looks.cjs`, `thumbnails.cjs`, `workflow.cjs`…) | UI/API loopback quản lý tập/sách/ghi chú/duyệt/phê duyệt/backup/loudness/thumbnail/looks/studio hooks |
| Tự động hóa sản xuất | `tools/production-automation/*` (`cli.cjs`, `runner.cjs`, `review.cjs`, `approvals.cjs`, `progress.cjs`, `policy.json`), `.automation/runs/` | Lập kế hoạch/chạy nháp tài liệu cô lập (staging + runtime `../multi-agent-system` nhánh `production-hardening`), apply có kiểm tra, cổng duyệt theo hash, patch/review/progress |
| Pipeline chung | `scripts/shared/*` (voice, PDF, media/stock, layout-check, temp-files, render-loudness, requirements*) | TTS/VieNeu, audition, book-PDF (ingest/search bounded), phân tích media, dọn temp, loudness |
| GPU & voice studio | `tools/gpu-host/*`, `tools/voicestudio/*`, `docs/architecture/gpu-host.md`, `docs/voice-workflow.md` | Chạy clone/LLM/image nặng trên `desktop-kndgm60` qua SSH tunnel loopback khi khả dụng; lease, dự phòng laptop; VoiceStudio/VoxCPM2 local |
| Tham chiếu & graph | `repos/*` (reference-only), `graphify-out/`, `repos-manifest.json` | Pin upstream; graph code-only để điều hướng ngữ cảnh |

### 1.2 Quy mô (ước lượng tại thời điểm đánh giá)

- ~**24,9k dòng** trong `src/`, `scripts/`, `tools/` (tổng `wc -l` trên các tệp nguồn chính).
- **55 thư mục project** trong `src/projects/`.
- **6.074 node** trong `graphify-out` (graph điều hướng code-only, cục bộ).
- `package.json` rất dài, chứa **hàng loạt script npm lặp theo từng project** (voice/check/render/thumbnail/audio/sfx…).
- Module manager/automation lớn: `approvals-view.cjs` ~354 dòng, `automation.test.cjs` ~354, `cli.cjs` ~343, `store.cjs` ~277, `review.cjs` ~274, `manager.test.cjs` ~256, `runner.cjs` ~242… (theo `wc -l`).
- Nhiều môi trường cô lập theo mục đích: `.venv` (voice), `.venv-pdf`, `.venv-graph`, `.venv-agents`, `.voicestudio/`, runtime GPU tách host — tránh trộn dependency (đúng định hướng).

## 2. Điểm mạnh hiện có (nên giữ)

1. **Phân tách đơn vị sản xuất rõ:** mỗi tập gắn `slug` với 4 đường dẫn chuẩn (`src/scripts/docs/public/<slug>`), catalog/registry là nguồn sự thật; `renderTo` chuẩn hóa output Studio; `projects:check`/catalog tests bảo vệ tính nhất quán.
2. **Ranh giới dùng chung có chủ đích:** `src/shared`, `scripts/shared`, `tools/*` tách khỏi nội dung tập; upstream clone là tham chiếu, không sửa trực tiếp.
3. **Kiểm soát hiệu năng/năng lượng ở tầng vận hành:** quy tắc `limited`, một job nặng/lúc, GPU host + lease + tunnel loopback + fallback, kiểm tra/dọn temp (`assertFreeSpace`/`npm run temp`), loudness normalize khi render — phù hợp với workload nặng (TTS, render, media).
4. **An toàn & quyền riêng tư tương đối tốt cho miền bài toán:** manager bind loopback + token/origin checks, dữ liệu nhạy/PDF/cache trong `library/` (ignored), `graphify` code-only `.graphifyignore`, policy denylist/scope, không paid services/cloud theo quy ước.
5. **Tự động hóa đi đúng hướng “human-gated”:** staging chọn lọc, không ghi đè repo khi chạy, apply kiểm scope + phát hiện đích đổi, duyệt gắn hash artifact, chặng rủi ro/nặng (voice-audition, render, pdf retrieval, clone) là operator-only; blocker/gap được ghi nhận minh bạch.
6. **Khả năng quan sát/điều hướng:** `automation status/runs/events`, `graph:query/explain/path`, tài liệu workflow/review/voice/book-PDF phong phú.

## 3. Đặc tính hiệu năng (nhận định)

> Hiệu năng của hệ thống này **chủ yếu là throughput của pipeline media/AI**, không phải QPS của dịch vụ web.

| Hạng mục | Đặc điểm | Trạng thái | Ghi chú |
|---|---|---|---|
| Sinh giọng (VieNeu) & clone (VoxCPM2) | CPU/GPU/RAM rất cao, chạy dài | **Đã giảm thiểu** (GPU offload, 1 model nặng/lúc, loopback-only, operator-only) | Nút thắt phần cứng; tối ưu bằng đo/điều phối, không bằng refactor kiến trúc app |
| Render Remotion/ffmpeg | CPU/disk/IO, tạo bundle tạm | **Đã giảm thiểu** (temp cleanup, port tách, loudnorm pipeline) | Thời gian render tỉ lệ độ phức tạp composition/asset |
| Phân tích PDF/media/stock | I/O + CPU, dữ liệu cục bộ | **Ổn** (bounded search/ingest, cache theo edition/checksum) | Cần giữ bounded context, không nạp toàn bộ |
| Project manager (HTTP local) | Một người dùng, loopback, đọc file/catalog theo request | **Chưa thấy nghẽn** (chưa đo) | Có rủi ro tăng độ trễ nếu logic/store phình và số project/tài liệu tăng mạnh |
| Studio/dev/build | Remotion bundling, typecheck trên codebase lớn | **Chấp nhận được** (chưa đo) | Chi phí tăng tuyến tính theo số module/composition đăng ký |

**Kết luận hiệu năng:** không có dấu hiệu cần “tối ưu hiệu năng bằng tái cấu trúc lớn” ở tầng ứng dụng; ưu tiên là **đo điểm nghẽn thực tế** (render time, clone time, disk/`public` growth, memory peak) rồi tối ưu cục bộ.

## 4. Vấn đề & nợ kỹ thuật (cần tối ưu/tái cấu trúc)

Mức độ: **Cao / Trung bình / Thấp** (ảnh hưởng × khả năng xảy ra). Nỗ lực: **S / M / L**.

### 4.1 Khả năng mở rộng & bảo trì (ưu tiên chính)

| ID | Vấn đề | Bằng chứng | Mức độ | Nỗ lực | Tác động |
|---|---|---|---|---|---|
| M1 | **Script npm lặp theo project** trong `package.json` (voice/check/render/thumbnail/sfx/audio cho từng slug) | `package.json` rất dài, mẫu lặp lại hàng chục lần | **Cao** | M | Khó thêm/sửa hàng loạt, dễ drift (tham số, model, đường dẫn), tăng ma sát khi số tập tăng |
| M2 | **Logic QA/voice/tiện ích per-project trùng lặp** bên cạnh engine chung | `scripts/projects/<slug>/*` nhiều biến thể (check/build/voice/sfx) trong khi `scripts/shared/*` đã có pipeline | **Trung bình** | M | Nhân công bảo trì, khó nâng cấp hành vi chung (nhưng tập cũ là lịch sử/take đã duyệt — phải thận trọng) |
| M3 | **Project manager `server.cjs` monolith**: định tuyến, auth nhẹ, upload/range serving, gọi store/backup/loudness/looks/thumbnails/voice trong một tệp/luồng xử lý lớn | `tools/project-manager/server.cjs` (~159 dòng, nhiều nhánh route) + các module lớn (`store.cjs`, `approvals-view.cjs`, `library.cjs`) | **Trung bình** | M | Khó mở rộng tính năng, khó test cô lập, rủi ro hồi quy khi sửa |
| M4 | **`src/projects/registry.tsx` tăng tuyến tính** theo số tập/Composition/Still (JSX literal bắt buộc) | quy ước đăng ký thủ công, 55 project | **Thấp–TB** | S–M | Chi phí đọc/sửa và nguy cơ sai `renderTo`/folder/ID khi thêm mới (đã có `projects:check` giảm rủi ro) |
| M5 | **Thiếu chuẩn “một lệnh tham số hóa”** cho thao tác lặp (voice/check/render) thống nhất mọi project | phụ thuộc script tĩnh per-slug | **Trung bình** | M | Onboarding/automation khó hơn; agent dễ chọn nhầm lệnh |

### 4.2 Tự động hóa & kiến trúc pipeline (hoàn thiện có kiểm soát)

| ID | Vấn đề | Bằng chứng | Mức độ | Nỗ lực | Tác động |
|---|---|---|---|---|---|
| A1 | **Chặng assembly/asset mount read-only chưa hoàn thiện** (P1 đã ghi nhận) | `docs/architecture/production-automation.md` | **Trung bình** | M–L | Chặn tự động hóa an toàn phần ghép; hiện đúng là thủ công — không phải bug |
| A2 | **Quan sát/UI quy trình (P2)** chưa có tab hàng đợi/duyệt/diff/provenance đầy đủ | `production-automation.md` (dữ liệu `status/runs/events` đã có) | **Thấp–TB** | M | Trải nghiệm vận hành, không ảnh hưởng correctness |
| A3 | **Ranh giới bảo mật upstream/runtime cần duy trì:** redirect LiteLLM chưa kiểm soát, sandbox bọc lệnh (policy bảo vệ tiến trình Python) | `production-automation.md`, `policy.json` | **Trung bình** | M | Rủi ro khi mở rộng phạm vi chạy; cần test deny-before-side-effect khi chạm |
| A4 | **Độ bao phủ “profile/series” tự động hóa chưa đồng đều** (vd. series chưa profile như khách hàng) | tài liệu + `series-notes/workflow` cơ chế đã có | **Thấp** | M | Hạn chế áp dụng, không ảnh hưởng luồng hiện tại |

### 4.3 Hiệu năng/độ tin cậy vận hành (tối ưu cục bộ, cần đo)

| ID | Vấn đề | Bằng chứng | Mức độ | Nỗ lực | Tác động |
|---|---|---|---|---|---|
| P1 | **Chưa có số liệu baseline** (thời gian render/clone, dung lượng `public/` & cache, memory peak, tần suất temp đầy) | không có benchmark trong repo | **Trung bình** | S | Khó ưu tiên tối ưu đúng chỗ; nguy cơ tối ưu sớm |
| P2 | **Chi phí typecheck/bundle/dev tăng theo số project** | 55 project, registry/composition lớn | **Thấp** | M | Trải nghiệm dev; chỉ xử lý khi đo thấy chậm |
| P3 | **I/O & dung lượng media tăng dài hạn** (`public/`, `library/`, `.cache/`, `.automation/` đã ignore nhưng chiếm đĩa cục bộ) | quy mô asset video | **Trung bình** | S–M | Ảnh hưởng thực tế (đầy đĩa) — đã có quy tắc dọn temp; cần kỷ luật và quan sát |

### 4.4 Rủi ro tái cấu trúc (chống chỉ định)

- Thay đổi hàng loạt `package.json`, script per-project, đường dẫn asset, ID/slug/composition, hoặc pipeline giọng/take đã duyệt → **rủi ro phá render, QA, metadata, backup, chỉnh sửa người dùng**.
- Hợp nhất “vì đẹp” các project cũ khác policy/giọng/bố cục lịch sử → vi phạm quy ước áp dụng tương lai/không đụng bản đã chốt.
- Tối ưu không dựa trên đo (micro-optimization, thêm cache/phức tạp) → tăng độ phức tạp, ít lợi ích với workload-bound.

## 5. Backlog đề xuất (ưu tiên thực hiện)

> Nguyên tắc: **đo trước → refactor cơ hội, áp dụng cho mới → không chạm lịch sử đã ổn định trừ khi có lỗi/đo được lợi ích**. Mỗi hạng mục hoàn tất phải kèm kiểm chứng (test/lệnh liên quan) và commit tập trung.

### P0 — Nền tảng quyết định (bắt buộc trước tối ưu lớn)

| # | Hạng mục | Công việc cụ thể | Đầu ra/tiêu chí nghiệm thu | Ảnh hưởng |
|---|---|---|---|---|
| 0.1 | **Baseline đo lường** | Đo & ghi lại: thời gian `typecheck`, thời gian render 2–3 composition đại diện (ngắn/dài), thời gian một luồng voice audition mẫu (nếu môi trường cho phép và không thay take), dung lượng `public/`, `library/`, `.cache/`, `.automation/runs`, `graphify-out`; ghi điều kiện máy (CPU/RAM/disk/GPU). Không thay đổi hành vi sản xuất. | Tài liệu/ghi chú số liệu tái lập (vd. bổ sung mục trong doc này hoặc `docs/architecture/perf-baseline.md`) | Cho phép ưu tiên đúng |
| 0.2 | **Kiểm kê nợ lặp** | Thống kê script npm per-project, mẫu `scripts/projects/*` trùng chức năng, route/logic tập trung trong manager. | Danh sách mục tiêu refactor + phạm vi “áp dụng cho mới” vs “giữ nguyên cũ” | Giảm rủi ro |

### P1 — Bảo trì & giảm drift (ưu tiên cao, rủi ro thấp nếu làm đúng)

| # | Hạng mục | Công việc cụ thể | Phạm vi an toàn | Kiểm chứng |
|---|---|---|---|---|
| 1.1 | **Chuẩn hóa lệnh tham số hóa** (M1, M5) | Tạo/củng cố entrypoint chung: `voice/check/render/still/thumbnail <slug> [opts]` (Node/Python) đọc metadata/story theo quy ước; cho phép *giữ* script per-project cũ nhưng ngừng sinh thêm script mới trùng lặp; dần alias trong `package.json` cho tập mới | **Chỉ áp dụng/khuyến nghị cho tập mới hoặc tập đang chạm**; không xóa lệnh cũ đang dùng trong tài liệu/automation của tập đã ổn định | Chạy lệnh đại diện trên project mẫu + `projects:check`, `typecheck` phần liên quan |
| 1.2 | **Tái dùng logic shared** (M2) | Khi sửa/chạm một project, ưu tiên rút bước trùng (kiểm tra timing/caption/style, build voice/sfx pattern) vào `scripts/shared` hoặc helper có API rõ; không refactor hàng loạt lịch sử | Refactor cơ hội, từng cụm nhỏ | QA/check của project bị chạm vẫn pass, không đổi output đã duyệt |
| 1.3 | **Tách module manager** (M3) | Bóc `server.cjs` theo miền (routing, auth/context, range/static serving, handlers: projects/books/approvals/review/backup/loudness/looks/thumbnails/voice) thành module trong `tools/project-manager/`; giữ contract API/UI | Không đổi hành vi/API, không đổi đường dẫn dữ liệu | `manager.test.cjs`, `approvals-ui.test.cjs`, `progress-ui.test.cjs`, `looks.test.cjs` và các test liên quan pass; smoke mở manager local |
| 1.4 | **Củng cố kiểm tra cấu trúc** (M4) | Mở rộng `projects:check`/test catalog nếu phát hiện lỗi đăng ký hay lệch quy ước mới (vd. cảnh báo script trùng lặp cho tập mới) | Chỉ thêm kiểm tra, không sửa dữ liệu cũ tự động | `npm run projects:check`, `npm run test:catalog` |

### P2 — Hoàn thiện tự động hóa (theo lộ trình hiện có)

| # | Hạng mục | Công việc cụ thể | Ghi chú/tiêu chí |
|---|---|---|---|
| 2.1 | **Assembly an toàn** (A1) | Thiết kế & hiện thực mount asset read-only, kiểm Remotion trong sandbox/staging theo blocker P1 đã nêu | Không auto-render/apply; giữ human-gated; test deny/isolation trước |
| 2.2 | **Quan sát & UI quy trình** (A2) | Tận dụng `status/runs/events.db/progress`: bổ sung hiển thị hàng đợi, diff, provenance, trạng thái duyệt (navigation không khởi động job) | Dữ liệu sẵn có; thay đổi UI thuần trong manager |
| 2.3 | **Gia cố biên an toàn** (A3) | Kiểm soát redirect/hostname ở gateway/proxy tích hợp (nếu còn dùng), rà timeout/cancel, bổ sung test deny-before-side-effect khi chạm luồng chạy | Phù hợp `policy.json` và runtime hardening |

### P3 — Tối ưu hiệu năng cục bộ (chỉ sau khi có baseline P0)

| # | Hạng mục | Ví dụ công việc | Điều kiện kích hoạt |
|---|---|---|---|
| 3.1 | **Render/dev chậm đo được** (P2) | Giảm chi phí bundle/load (lazy/entry tách), tối ưu asset nặng, xem xét parallelism build an toàn | Có số liệu cho thấy bước cụ thể là nút thắt |
| 3.2 | **Dung lượng đĩa** (P3) | Báo cáo/cảnh báo dung lượng `public`/cache/run artifacts, quy trình dọn có kiểm chứng (không xóa dữ liệu người dùng/nguồn) | `temp -- status`/đo cho thấy áp lực |
| 3.3 | **Manager chậm đo được** | Cache đọc catalog/index trong bộ nhớ với invalidation theo mtime, giảm parse lặp, streaming hợp lý | Có độ trễ quan sát được trên thao tác thực |

### Increment triển khai 2026-11-13

Phạm vi được chọn sau khi đối chiếu kế hoạch với code là **P0 + lát cắt đầu tiên của P1.3**. P1.1 chưa triển khai vì kiểm kê cho thấy các lệnh voice/render chứa nhiều tham số riêng theo tập; chưa có một schema chung đủ rõ để thay alias cũ an toàn.

Acceptance criteria của increment:

- **SYS-EVAL AC-P0.1:** ghi baseline tái lập cho typecheck, test manager, dung lượng và điều kiện máy; chỗ chưa đo phải ghi rõ, không chạy render/voice khi chưa được yêu cầu.
- **SYS-EVAL AC-P0.2:** thống kê lệnh npm, mẫu file per-project và điểm tập trung route để quyết định phạm vi refactor.
- **SYS-EVAL AC-P1.3:** tách bootstrap/security, GET, POST và HTTP streaming thành module riêng mà không đổi route, status, header, payload hay data path; toàn bộ test manager phải đạt.
- **SYS-EVAL AC-SAFE:** chỉ stage/commit file thuộc increment; không chạm các thay đổi approval, workflow, book và cover đang có từ tiến trình khác.

Kết quả và số đo nằm tại [performance-baseline.md](performance-baseline.md). P0.1/P0.2 đã hoàn tất trong phạm vi an toàn; benchmark render/voice được ghi là chưa đo. P1.3 đã hoàn tất lát cắt routing/HTTP, chưa hoàn tất việc tách từng handler theo miền.

## 6. Thứ tự thực hiện gợi ý cho agent tối ưu

1. **Đọc & chốt ràng buộc:** `AGENTS.md`, `docs/architecture.md`, `series-workflow.md`, `production-automation.md`, `gpu-host.md`, tài liệu voice/book-PDF/review liên quan.
2. **Thực hiện P0 (đo/kiểm kê)** → chốt 1–2 mục tiêu có lợi ích đo được.
3. **P1.3 hoặc P1.1** theo phạm vi chạm thực tế (ưu tiên refactor cơ hội, *tập mới*): mỗi cụm một commit, kèm test/lệnh liên quan.
4. **P2** theo nhu cầu vận hành (assembly/UI/biên an toàn), giữ human-gated.
5. **P3** chỉ khi baseline chứng minh nút thắt.

## 7. Tiêu chí “hoàn tất” của một đợt tối ưu

- Không thay đổi hành vi/đầu ra đã duyệt của tập cũ (trừ khi sửa lỗi được yêu cầu và xác minh).
- `projects:check`, test catalog/manager/automation liên quan và/hoặc `typecheck` pass theo phần bị ảnh hưởng.
- Có bằng chứng đo được (trước/sau) nếu mục tiêu là hiệu năng; có giảm trùng lặp/độ phức tạp cụ thể nếu mục tiêu là bảo trì.
- Tuân thủ quy tắc tài nguyên, không paid service, không rò rỉ dữ liệu riêng, commit tập trung, không push.

## 8. Tóm tắt điều hành

- **Cần tái cấu trúc/tối ưu?** Có — **có chọn lọc**, tập trung vào **khả năng bảo trì và giảm lặp** (script npm per-project, trùng lặp pipeline per-project, monolith manager) và **hoàn thiện lộ trình automation**.
- **Cần đại tu vì hiệu năng?** **Chưa**. Hệ thống chịu tải bởi TTS/render/media (workload-bound) và đã có các biện pháp giảm thiểu phù hợp; bước tiếp theo đúng là **đo baseline rồi tối ưu cục bộ**.
- **Cách làm an toàn:** refactor dần, ưu tiên tập mới, giữ nguyên ID/đường dẫn/bản đã duyệt, bám kiểm tra tự động và cổng duyệt hiện có.

## 9. History

- **2026-11-13:** thêm acceptance criteria và trạng thái increment P0 + P1.3; liên kết baseline đo thực tế; ghi rõ render/voice chưa được benchmark và P1.3 mới hoàn tất ranh giới routing/HTTP.
