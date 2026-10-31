# Tự động hóa sản xuất

Cập nhật 2026-10-30. Pin tham chiếu `repos/devmindtan--multi-agent-system` (`4ac3558`) giữ nguyên. Runtime đã cứng hóa nằm ở checkout của người dùng `../multi-agent-system`, nhánh `production-hardening` (chưa commit/push; chi tiết ở `docs/hardening.md` trong repo đó). Tích hợp phía này: `tools/production-automation/` (`cli.cjs`, `runner.cjs`, `approvals.cjs`, `policy.json`).

## Dùng thế nào

```sh
npm run automation -- doctor                          # runtime, sandbox, graph
npm run automation -- status one-bad-day              # file, cổng duyệt, các lần chạy
npm run automation -- run one-bad-day editorial-review
npm run automation -- events <run-id> --follow        # theo dõi trực tiếp (terminal khác)
npm run automation -- apply <run-id>                  # hoặc: reject <run-id>
npm run automation -- review one-bad-day             # chốt ban đầu, bản vá, clip từng cảnh
npm run automation -- patch one-bad-day --reason "…"  # đề xuất sửa sau khi chốt
npm run automation -- approve one-bad-day review-preview
npm run test:automation
```

Vòng làm việc của một chặng:

1. `run <slug> <stage>`: chỉ cho các chặng soạn tài liệu (`brief`, `script`, `editorial-review`, `visual-plan`, `metadata`). Runner kiểm các cổng duyệt phía trước còn hợp lệ, chép **chỉ** các file trong `readScope` (bỏ `deniedPaths`, file nhị phân, quá lớn) vào `.automation/runs/<run-id>/staging`, khởi tạo Git trong đó rồi chạy model local (Ollama, `qwen2.5-coder:7b-instruct`, 1 worker). Model chạy trên máy GPU qua tunnel loopback khi máy đó bật, ngược lại trên Ollama của laptop (`--gpu`/`--local` để ép; xem `docs/architecture/gpu-host.md`). Output đã có thì phải thêm `--revise`. `--prepare-only` chỉ dựng staging; chạy sau bằng `run-prepared <run-id>`.
2. Worker chỉ có `read_file`, `list_files`, `write_file`, `patch_file`; mọi lần đọc/ghi qua `PathPolicy`. Không có lệnh shell (`commands.mode: operations`, danh sách thao tác rỗng). Model loop chạy với môi trường tối thiểu, không có khóa API.
3. Kết thúc: patch ở `.automation/runs/<run-id>/artifacts/<run-id>.patch`, trạng thái `awaiting-approval`. Repo chưa bị đổi.
4. `apply <run-id>`: kiểm patch chỉ chạm `writeScope`, file đích **không đổi** kể từ lúc chuẩn bị (sửa tay của bạn thắng, runner từ chối), rồi `git apply`. Apply không phải duyệt.
5. `approve <slug> review-preview`: bạn ghi duyệt bản xem cuối (cổng duy nhất còn dùng `approve`); lưu SHA256 mọi file trong `bindsArtifacts` vào `docs/projects/<slug>/approvals.json` cùng tên git và thời điểm. Sửa bất kỳ file nào → cổng `stale` → chặng sau bị chặn. Tập cũ thiếu file (ví dụ chưa có `brief.md`) cần `--allow-missing` để ghi rõ là vắng. `export` không duyệt ở đây: render vẫn thủ công. Từ 2026-10-31 các cổng kịch bản/giọng/hình được thay bằng quy trình Chốt ban đầu + Bản vá + Duyệt từng cảnh (`docs/architecture/review-workflow.md`): `initial-lock` và `scene-review` ghi trên trang quản lý, không qua `approve`; `review-preview` vẫn băm file. Agent dùng `review <slug>`, `patch <slug> --reason`, `scene-clip <slug> <cảnh>`.

Quy tắc và ghi chú người dùng thêm cho series (`series/<channel>/<series>/workflow.json`, sửa trong trang quản lý) có trong `plan` dưới `seriesNotes`; `run` chèn phần `general` và phần của chặng vào `project_context.md` và ghi `seriesNotes.revision` vào `run.json`. Chúng không đổi đồ thị chặng hay quyền.

Không tự động: assembly (cần mount asset chỉ-đọc và kiểm Remotion trong sandbox), nguồn PDF (`npm run pdf`, sách riêng không vào worker), thử giọng (TTS nặng, phải nghe), QA (lệnh npm xác định, không cần model), render, upload, sinh nội dung trả phí. Không có scheduler.

### Quan sát

- Trực tiếp: `run` in mọi sự kiện (`--verbose` của runtime); terminal khác dùng `events <run-id> --follow`.
- Lưu lại: `.automation/runs/<run-id>/` có `run.json` (trạng thái, runtime commit + cờ `dirty`, model, hash input/target), `events.db` (SQLite), `log.txt`, `plan.json`, `settings.json`, `tools.json`, `staging/`, `artifacts/*.patch`.
- `status <slug>` gộp cổng duyệt và danh sách lần chạy; `runs` liệt kê mọi lần chạy.
- `doctor.runner` báo runtime có đủ tính năng cứng hóa, nhánh, commit, `dirty`.

### Hợp đồng manifest (runner dùng trực tiếp)

| Trường | Ý nghĩa |
|---|---|
| `kind` | `draft-task` (worker LLM tương lai), `operator-task` (công cụ local nặng do người dùng/host chạy: thử giọng, truy xuất PDF), `check` (thao tác cố định chỉ đọc), `human-approval`. |
| `readScope` / `writeScope` | Allowlist theo chặng. Ghi chỉ trong 4 đường dẫn canonical của project; mọi scope bị đối chiếu với `deniedPaths` (`.env*`, `library/`, `budgets/`, `backups/`, `.manager-history/`, `repos/`, `*.mp4`, `veo-safety.json`…). Tương ứng `write_scope` của `TaskSpec` upstream, nhưng phải được runner kiểm **trước** mỗi lần đọc/ghi. |
| `outputs` | File cụ thể được băm cho approval. |
| `bindsArtifacts` | Ở cổng duyệt: toàn bộ output của các chặng phía trước. Approval tương lai lưu SHA256 của tập này. |
| `invalidates` | Các chặng phía sau phải kiểm lại khi output chặng này đổi (ví dụ đổi `script.md` làm mất hiệu lực duyệt giọng, assets, assembly, QA). |
| `operations` | ID cố định → argv do host tạo (`check:<slug>`, `typecheck`, `projects:check`); không mạng, không ghi. Thao tác nặng/riêng tư (`voice-audition`, `pdf-retrieval`, `render`) là `operatorOnly`, không bao giờ là tool LLM. |
| `gaps` | Thiếu điều kiện để tự động hóa, ví dụ project chưa có `check:<slug>` thì chặng QA không thể tự chạy. |

### Ngữ cảnh rẻ bằng code graph (Graphify)

Worker tương lai (và agent hiện tại) lấy ngữ cảnh code qua `npm run --silent graph:query -- "<câu hỏi>"` thay vì đọc nhiều file: mỗi truy vấn trả về subgraph trong ngân sách mặc định khoảng 2.000 token, kèm file/dòng để đọc đúng đoạn cần. Graph dựng bằng `npm run graph:update`: tree-sitter AST cục bộ, không LLM, không mạng; lần đầu khoảng 7 giây cho 607 file (2.880 node). `doctor` báo `codeGraph.stale` khi `src/`, `scripts/`, `tools/` có file mới hơn graph. Chỉ dùng chế độ code-only: semantic pass của Graphify gửi tài liệu/PDF cho LLM, trái quy tắc nguồn riêng tư và chi phí. Khi có runner, context loader nên lấy subgraph theo `readScope` thay vì quét cả cây thư mục (upstream hiện cho đến `context_max_files: 500`).

## Quy trình đề xuất

1. Chốt đề bài, khán giả, format và thời lượng. Shorts triết lý mới mặc định 45s; giữ thời lượng các tập cũ. Video dài cần quyết định riêng.
2. Với sách: lấy nguồn từ cache PDF theo phạm vi, ghi chương/trang, phân biệt ý tác giả và diễn giải. Không đưa toàn bộ PDF vào context. Đọc `docs/book-pdf-workflow.md` trước.
3. Viết và phản biện kịch bản: câu tự nhiên, tránh lặp mô-típ, kiểm tra luận điểm và nhịp đọc 1×.
4. Người dùng duyệt kịch bản và duration. Approval tương lai gắn SHA256 bản cụ thể; script đổi thì các sản phẩm phụ thuộc cần kiểm tra lại.
5. Có thể lên storyboard và thử giọng song song sau bước 4. Ban đầu chạy một worker để đo hiệu năng. Chọn giọng bằng nghe thật, không suy từ điểm ASR; giữ take cũ.
6. Triết lý: ảnh tĩnh + animation theo frame, typography Stoic, không Gemini/Veo. Kids: footage chuyển động thật, ưu tiên tái sử dụng rồi handoff Gemini thủ công. Thiếu footage phải báo thiếu.
7. Duyệt giọng và visual; assembler mới đưa vào source chuẩn. Nhạc giữ trim tự do, ducking và fade theo cạnh clip; không thêm SFX hình thức.
8. QA kỹ thuật và metadata có thể tách nhau. Mô tả phải có tên nhạc và tác giả. QA không tự suy ra nghe duyệt.
9. Người dùng xem Studio/nghe; render và đăng tải vẫn là thao tác riêng theo yêu cầu rõ ràng.

## Kết quả kiểm tra upstream

Điểm phù hợp: `core/dag.py` có dependency graph và tránh write scope chồng lấn khi lên lịch; `core/workspace.py` tách worktree, kiểm tra scope khi tích hợp, tạo patch; `core/events.py`/`jobs.py` lưu SQLite và có claim chống nhận cùng lịch chạy hai lần. Đây là cơ sở điều phối tốt, nhưng hiện thiên về coding, chưa phải dây chuyền media.

| Ưu tiên | Phát hiện trong mã | Nâng cấp cần thiết |
|---|---|---|
| P0 | `tools/fs_tools.py` chỉ chặn ra ngoài root (có `resolve()` nên symlink trỏ ra ngoài bị chặn); `.env`, PDF riêng và backup **trong** root vẫn đọc/ghi được, `write_file` ghi đè không giữ bản cũ. Write scope được kiểm tra khi integrate, không phải trước mọi lần ghi. | Áp `readScope`/`writeScope` + `deniedPaths` của manifest trước read/write, theo vai trò; ghi qua file tạm và giữ bản cũ; test deny-before-side-effect. |
| P0 | `tools/bash_tools.py` cho phép cả `python`, `node`, `npm`, `git`; kiểm basename và vài argument không hạn chế nội dung chương trình. Bubblewrap mặc định không bắt buộc, ro-bind toàn `/`, không tách network và vẫn kế thừa environment. | Fixed operation IDs với argv do host tạo; môi trường tối thiểu, filesystem tối thiểu, sandbox bắt buộc, network off. Không cho LLM tùy ý gọi script voice/render/API. |
| P0 | `core/llm_gateway.py` kiểm local endpoint bằng substring; URL chứa `127.0.0.1` nhưng host khác có thể lọt. `local_only` còn có thể tắt trong config. | Parse URL/hostname chính xác, kiểm redirect, khóa policy bên ngoài model; deny cloud ở runner. Chưa gửi thử request đến host bên ngoài. |
| P0 | `main.py --settings` chỉ đổi settings; executor/context loader vẫn `load_tool_config()` mặc định, profiles cũng mặc định. | Hỗ trợ `--tools-config`, `--agents-config`, truyền xuyên suốt mọi node và ghi config digest trong audit. Không giả định file config mới tự có hiệu lực. |
| P0 | Review model quyết định hoàn thành; `scheduler.apply_changes` mặc định true. Chưa có trạng thái chờ người dùng duyệt artifact. | Approval store với project/stage/hash/người duyệt/thời điểm; stale approvals bị vô hiệu, chỉ apply sau duyệt người dùng, không auto-render. |
| P1 | Worktree yêu cầu Git sạch; tài nguyên ignored như `public/`, fonts, `.venv` không theo worktree. Non-Git fallback chạy chung thư mục. | Staging workspace riêng từ snapshot chọn lọc, read-only mount asset được phép; không stash/commit thay người dùng, không fallback shared production. |
| P1 | `max_parallel_writers` và `fail_fast` có trong YAML nhưng scheduler đang dùng `max_parallel_tasks`; gateway chưa truyền timeout từ setting vào completion. | Thực thi giới hạn CPU/GPU/writer thật, timeout và cancel rõ; thử lỗi/restart, không retry generation mất mã tác vụ. |
| P1 | Dependencies trong `requirements.txt` dùng khoảng phiên bản rộng; chưa có môi trường runtime riêng ở đây. | Tạo `.venv-agents` riêng khi triển khai, resolve và khóa dependency; không sửa môi trường voice/PDF. Chạy full suite với gateway giả trước inference. |
| P2 | CLI/event DB có thể làm nền cho UI nhưng chưa có production approvals và artifact provenance. | Thêm tab Quy trình vào manager: hàng đợi, chờ duyệt, lỗi, diff, take cũ/mới, chi phí và resume. Navigation không khởi động job. |

Trạng thái xử lý (2026-10-30, nhánh `production-hardening`, 27 test upstream + 8 test adapter):

- P0 đọc/ghi: **đã xử lý** bằng `core/policy.py`; kiểm trước tác dụng phụ, cả đường dẫn yêu cầu lẫn đích symlink; ghi nguyên tử.
- P0 lệnh: **đã xử lý** bằng `run_operation(id)` với argv do host định nghĩa; bwrap bắt buộc, `--unshare-all` (đã thử: mạng "unreachable"), `--clearenv`, tùy chọn ẩn `$HOME` và che file.
- P0 endpoint: **đã xử lý**, parse hostname loopback; tắt `local_only` cần thêm biến môi trường. Redirect của LiteLLM chưa kiểm soát.
- P0 config: **đã xử lý**, `--tools-config`, `--agents-config`, `--plan-file`.
- P0 duyệt: **đã xử lý** theo hướng `apply_changes:false` + sự kiện `run.awaiting_approval` + approval store theo hash ở phía này.
- P1 staging: **đã xử lý cho tài liệu** (bản sao chọn lọc, không cần Git sạch). Asset mount chỉ-đọc cho assembly **chưa làm**.
- P1 scheduler/timeout: **đã xử lý** `max_parallel_writers`, `fail_fast`, timeout mỗi lần gọi model; huỷ giữa chừng vẫn chỉ là Ctrl+C.
- P1 dependency: **đã xử lý** `.venv-agents`, khóa ở `scripts/shared/requirements-agents.txt` (gói phát hành trước 2026-10-16).
- P2 UI: **chưa làm**; dữ liệu cho tab Quy trình đã có (`status`, `runs`, `events.db`).

Sandbox chỉ bao lệnh; tiến trình Python chạy vòng model được giới hạn bằng `PathPolicy` và môi trường tối thiểu. Prompt "đừng đọc secrets" không phải là cơ chế bảo vệ.

## Máy hiện tại và thứ tự nâng cấp

Máy báo 8 CPU threads, khoảng 23.2 GiB RAM; RAM available khoảng 10.5 GiB tại thời điểm kiểm tra. Có Ollama và bubblewrap. GET `/api/tags` xác nhận đã có `qwen2.5-coder:7b-instruct` (4.68 GB file model) và `qwen2.5-coder:14b` (8.99 GB). Đây là dung lượng file, **không phải** peak RAM khi inference. Không có `nvidia-smi` trong PATH nên chưa kết luận GPU có/không hoặc tốc độ.

Ưu tiên sửa P0 và thử một worker trước, tránh chạy 14B + nhiều 7B đồng thời khi còn TTS/Studio. Dùng model coder cho công việc code/kiểm tra; khả năng biên tập tiếng Việt cần audition riêng bằng các script đã duyệt, không mặc định model lớn hơn viết hay hơn. Chưa cần mua GPU/RAM hay tải model mới: đo latency, peak RAM, chất lượng và tỷ lệ sửa lại trước khi quyết định.

Thứ tự triển khai: **cứng hóa quyền → một job nháp cô lập → human approval theo hash → artifact/asset manifest → UI hàng đợi → tăng concurrency sau benchmark**. Cụ thể từng mốc, mỗi mốc có test trước khi qua mốc sau:

1. **Adapter phía host (đã có phần khai báo):** manifest v2 có scope, deny list, operation ID cố định và `status` băm artifact. Chưa có phần thực thi.
2. **Approval store:** file JSON nằm ngoài vùng ghi của worker (ví dụ `docs/projects/<slug>/approvals.json` chỉ do manager ghi), lưu đúng `futureApprovalContract`; `status` so SHA256 hiện tại với bản đã duyệt để báo `stale`. Nút duyệt trong manager chỉ ghi bản ghi duyệt, không khởi động job.
3. **Runner một worker, chỉ `draft-task` dạng tài liệu** (brief, script-review, metadata) trong staging copy; kết quả là diff để người dùng xem, không auto-apply. Gateway giả trước, Ollama local sau.
4. **Chặng `check`:** host chạy argv cố định, ghi kết quả vào `qa.json` bản nháp; vẫn không suy ra duyệt nghe.
5. **Assembly** chỉ sau khi P0 upstream được sửa và asset mount read-only được kiểm chứng. Chỉ sau các bước này mới cân nhắc lịch chạy tự động; không đưa render hay trả phí vào lịch mặc định.

## Bằng chứng và giới hạn kiểm tra

- Clone đúng revision, không thay file tracked của upstream.
- Upstream chạy 10 tests offline: 3 workspace, 5 file/command tools, 2 persistence; tất cả đạt, dùng thư mục tạm.
- Chưa chạy toàn bộ engine/DAG/executor suite: Python hệ thống chưa có pydantic/langgraph/litellm/mcp; chưa cài dependency. Các test đã qua không chứng minh sandbox đủ an toàn.
- Adapter kiểm tra graph phụ thuộc, các điểm duyệt, canonical lookup, slug/path guard và chế độ không thực thi bằng fixture. Đã tạo thử manifest `one-bad-day` ở `/tmp`, không sửa tập.
- 2026-10-30 (cập nhật): `git ls-remote` xác nhận HEAD upstream vẫn là revision đã ghim. Đọc lại `llm_gateway.py`, `fs_tools.py`, `bash_tools.py`, `dag.py`, `tools.yaml`, `settings.yaml`: các phát hiện P0/P1 còn nguyên, 7/7 probe `stillPresent:true`. Thêm manifest v2, `status`, probe; 4 test fixture đạt (deny list, scope ghi, binds/invalidates, status chỉ đọc). `status one-bad-day` cho thấy chưa có `brief.md`/`script-review.md` — tập cũ không theo đủ chặng, điều này bình thường và không phải lỗi.
- Chưa gọi model, chưa tải model, không chạy sản xuất, render, tạo API có phí, auto-apply, commit hoặc push.

Quy tắc hiện hành ở `AGENTS.md`, `docs/architecture/series-workflow.md`, `docs/voice-workflow.md`, `docs/book-pdf-workflow.md` luôn được ưu tiên. Mỗi lần nâng revision upstream cần kiểm lại các phát hiện và test trước khi đổi pin.
