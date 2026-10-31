# Studio Workspace — quản lý dự án trên máy

```sh
npm run manager
```

Mở **http://127.0.0.1:4310**. Website chỉ bind loopback, không cần tài khoản/hosting và không đăng ký dịch vụ cloud. Dùng `PROJECT_MANAGER_PORT=4311 npm run manager` nếu cần đổi cổng.

## Chức năng

- Đọc trực tiếp danh bạ kênh/series/tập hiện có. Tìm tiếng Việt không dấu, lọc và đổi chế độ lưới/danh sách.
- **Tự cập nhật, không cần tải lại trang:** server theo dõi `series/`, `docs|scripts|src/projects/`, `projects/` và `.automation/progress/` (bỏ qua `.manager-history`) rồi báo trang qua `/api/events` (SSE) tập nào vừa đổi. Trang đọc lại danh sách, Duyệt sản xuất, Tiến trình và tài liệu đang mở; hộp thoại duyệt đang mở được giữ nguyên và cập nhật khi đóng; ô ghi chú không bị ghi đè. Mất kết nối thì tự nối lại và đồng bộ. Kiểm tra: `npm run test:manager:live`.
- Xem trực tiếp video/thumbnail đã xuất trong player; tua video bằng điều khiển gốc. Chọn bản mới nhất tìm được trong `projects/<composition-id>/`, `projects/<slug>/`, `out/` hoặc `public/<slug>/`. Không nhầm ảnh cảnh với thumbnail đã xuất.
- Nếu chưa có bản xuất, nút xem kiểm tra và tự bật Remotion Studio ở cổng 3000. Có nút mở Studio riêng khi muốn sửa. Không tự render. Log khởi động tại `.cache/project-manager/studio.log`.
- Xem kịch bản, mô tả, tài liệu dựng và config theo tập. File nguồn hiển thị chỉ đọc.
- Mở thư mục tập bằng file manager trên máy.
- Ghi chú riêng ở `docs/projects/<id>/manager-notes.md`, có lịch sử và phát hiện xung đột với sửa từ IDE.
- Tạo hồ sơ tập bằng workflow catalog hiện tại. Series có quy trình và cấu trúc riêng nên không tạo/xóa từ trang quản lý (dùng `npm run projects -- create-series` theo `docs/architecture/series-workflow.md` khi thật sự cần). Chỉ tạo planning; không tạo composition giả, giọng, ảnh hoặc render.
- Tủ sách hỗ trợ thêm nhiều cuốn trong series Đọc sách, hiểu mình. Thêm PDF bằng nút chọn file; file được chép vào `library/books/<book>/sources/` trên máy (tối đa 200 MB/file), không ghi đè file cũ, không tự OCR/ingest. Thêm nguồn không có nghĩa đã xác minh nội dung. PDF/cache sách và `.env` không có route xem công khai.
- Trang series có **Quy trình sản xuất**: các bước của series theo giai đoạn, ai làm, đầu vào/đầu ra, lệnh automation tương ứng. Bấm bước để thêm quy tắc (mỗi dòng một quy tắc) và ghi chú cho agent; "Quy tắc chung" áp dụng cho cả series. Lưu vào `series/<channel>/<series>/workflow.json`, có kiểm tra xung đột và lịch sử. Chỉ ghi chú là sửa được; bước, cổng duyệt và quy tắc an toàn đến từ production automation. Kiểm tra: `npm run test:manager:workflow` (workspace tạm).
- **Giọng đọc**: 25 preset `all-presets-v1` có nút nghe thử, tìm theo tên giọng hoặc tên tập, lọc giới tính/vùng/đang dùng, và các tập dùng từng giọng (đọc `scripts/projects/<id>/voice.json`, nếu không có thì `public/<id>/audio/voice-metadata.json`). Nút **Chọn giọng / Bỏ chọn** sửa playlist ưu tiên trong `scripts/shared/voice-playlists.json` (theo tên preset, có kiểm tra xung đột, bản cũ ở `scripts/shared/.manager-history/`). Chọn giọng không đổi giọng của video đã có và không tạo giọng mới. Mẫu đạt ASR không có nghĩa đã nghe duyệt.
- **Nhạc nền & hiệu ứng** (chỉ đọc): hai tab Nhạc nền / Hiệu ứng, mỗi mục một dòng; tìm theo tên bài, tác giả, file hoặc tên tập; lọc đang dùng / chưa dùng / thiếu credit / dùng chung / trong thư mục tập; sắp xếp theo số tập, tên, dung lượng. “Chi tiết” mở bảng các tập dùng bài đó với speechVolume, pauseVolume và credit. Bản nhạc ở gốc `public/` chưa tập nào dùng vẫn được liệt kê; hiệu ứng đọc từ `sfx.json`. **Thêm vào thư viện**: chọn file WAV/MP3/M4A/OGG/FLAC từ thư mục bất kỳ (chọn nhiều file được), trang chép một bản vào `public/audio-library/music/` hoặc `public/audio-library/sfx/`; tên bài/tác giả (không bắt buộc) lưu ở `scripts/shared/audio-library.json`. Không ghi đè file cùng tên, kiểm tra chữ ký định dạng, nhạc tối đa 200 MB, hiệu ứng 30 MB; file gốc giữ nguyên. Test: `npm run test:manager:audio-upload` (workspace tạm). **Sửa tại chỗ**: mở “Chi tiết” một bài/hiệu ứng trong thư viện dùng chung để sửa tên bài và tác giả (ghi vào `audio-library.json`, bản cũ ở `scripts/shared/.manager-history/`; credit trong `music.json` của từng tập không đổi). Trên trang sách, nút “Sửa” cạnh tên sách cho sửa tên sách và tác giả (chỉ hai trường này của `book.json`, bản cũ ở `.manager-history/` của cuốn sách). Cả hai kiểm tra revision: nếu file vừa bị sửa ở nơi khác, trang từ chối lưu và yêu cầu tải lại. Test: `npm run test:manager:inline-edit` (workspace tạm).
- **Trình phát chung** ở cuối trang phát mẫu giọng, nhạc và hiệu ứng; tua được, vẫn phát khi chuyển trang, đóng bằng nút ×. `/api/audio` chỉ phát file mà thư viện liệt kê, không phát backup hay đường dẫn tùy ý. Kiểm tra: `npm run test:manager:library` (dữ liệu thật; lưu playlist được chặn trong trình duyệt, phần ghi có test fixture trong `test:manager`).
- Tài liệu trong hồ sơ hiển thị theo loại file: `book.json` thành thẻ thông tin nguồn và tiến độ đọc; `chapters.json` thành bảng chương có lọc, nhóm phần, tiểu mục và lưu ý chất lượng; Markdown có bảng, trích dẫn, mã, danh sách và liên kết mở tab tương ứng; JSON khác thành bảng nhãn–giá trị (mảng đối tượng thành bảng, tự ẩn cột rỗng/trùng, thời gian `*Ms` dạng mm:ss). Nút “Xem file gốc” hiện nguyên văn; mã nguồn giữ dạng code. Mọi thứ dựng bằng text node, không chèn HTML từ file. Kiểm tra: `npm run test:manager:documents` (dữ liệu thật, chỉ đọc).
- **Studio giọng nói**: mục cuối nhóm thư viện ở sidebar và nút trên trang Giọng đọc mở VoiceStudio (http://127.0.0.1:3900/) trong tab mới; nếu chưa chạy, manager khởi động nó qua `tools/voicestudio/launcher.cjs` (chỉ loopback, tắt thống kê, dữ liệu trong `.voicestudio/data`). Khởi động không tải model; cổng 3900 bị ứng dụng khác chiếm thì báo lỗi thay vì mở nhầm. Xem `docs/voice-workflow.md`. Trang Giọng đọc có khung trạng thái (Đã tắt / Đang khởi động / Đang chạy / cổng bị chiếm, kèm phiên bản, engine, RAM) và nút **Tắt** có xác nhận; chấm màu trên sidebar theo cùng trạng thái. Trạng thái cập nhật mỗi 2,5 giây khi đang bật/tắt, 15 giây khi rảnh, 60 giây khi tab ẩn. `GET /api/voicestudio` chỉ đọc; `POST /api/voicestudio/stop` cần token phiên và chỉ dừng tiến trình có thư mục làm việc trong `.voicestudio/`. Kiểm tra: `npm run test:manager:voicestudio` (API VoiceStudio được giả lập, không bật/tắt bản thật).
- Xóa dự án trong hồ sơ (không có thao tác xóa series). Luôn hỏi xác nhận và hiện số tập/bản dựng/file đã xuất; khi trống ghi rõ chưa có sản phẩm. Dữ liệu chuyển vào `.manager-trash/`, registry và danh bạ được cập nhật cùng giao dịch. PDF nguồn riêng tư được giữ lại.

Ảnh trên thẻ là nền thumbnail hoặc ảnh cảnh đã có, không phải ảnh thumbnail mới xuất. Website không chỉnh timeline, âm lượng, source trim hoặc asset cũ.

## Kiểm tra

```sh
npm run test:manager
npm run test:manager:browser
npm run test:manager:navigation
```

Backend test dùng fixture tạm. Browser test cần website đang chạy, dùng `playwright-core` với Chrome sẵn có (`/usr/bin/google-chrome`, đổi bằng `CHROME_PATH`), profile tự tách và headless. Không tải browser mới. Thử đọc dữ liệu thật và thao tác trên form nhưng không submit; không lưu ghi chú hoặc tạo tập thử trong workspace thật. Screenshot/report QA ở `.cache/project-manager/qa/`.

Các lệnh chạy server/browser có thể cần quyền bind localhost trong môi trường sandbox của agent. Test không gửi dữ liệu ra ngoài máy.

## Thiết kế và kỹ năng

Đọc [design plan](../../docs/design/project-manager-design.md) và [hướng dẫn skill](../../docs/design/design-skills.md) trước khi sửa UI. Sau thay đổi, kiểm tra desktop/tablet/mobile, các trạng thái rỗng/loading/error và các luồng tương tác có liên quan; không suy ra UI đúng chỉ từ API trả 200.

## Khôi phục xóa nhầm

Mỗi lần xóa có `.manager-trash/<timestamp-id>/manifest.json`, bản sao các file đã chuyển ở `files/`, cùng nội dung trước đó của registry và danh bạ trong `snapshots`. Dừng chỉnh sửa danh bạ, kiểm tra bản sao rồi ghép lại đường dẫn/entry cần khôi phục; không ghi đè toàn bộ snapshot cũ nếu đã có tập mới. Chạy `npm run projects:check` và `npm run typecheck` sau khôi phục. Chưa có nút khôi phục tự động.

Điều hướng có nút Quay lại và breadcrumb bấm được về cấp cha. Back/Forward khôi phục trang, bộ lọc và hồ sơ; ghi chú chưa lưu vẫn được cảnh báo. Sidebar ẩn scrollbar nhưng giữ thao tác cuộn. Nút chính xanh đậm, phụ viền trung tính, mở Studio xanh lam, xóa đỏ.

## Ảnh bìa sách

Mở hồ sơ sách → **Thêm ảnh bìa** (hoặc **Thay ảnh bìa**). Nhận JPG/PNG/WebP tối đa 8 MB. Ảnh được lưu dưới `books/<book>/covers/` cạnh hồ sơ nghiên cứu; `current.json` chọn ảnh hiện hành, các ảnh cũ vẫn được giữ. Ảnh hiển thị nguyên tỷ lệ trong tủ sách và hồ sơ; khi chưa có ảnh dùng bìa chữ mặc định. Không đọc hoặc sửa PDF khi thay bìa.

QA ảnh bìa: `node tools/project-manager/book-cover.test.cjs` dùng workspace tạm để thử upload, thay ảnh, tải lại và desktop/tablet/mobile.

Tủ sách dùng lưới riêng, tự tăng số cột theo chiều rộng (5 cột tại màn hình 1440px, 2 cột tại 390px). Bìa giữ tỷ lệ nội dung; viền trắng ngoài ảnh được giấu khi hiển thị, không sửa file gốc. Ảnh đã chọn nằm tại `series/<channel>/<series>/books/<book>/covers/`, với `current.json` trỏ tới bản hiện dùng; bản cũ vẫn được giữ.

- **Bản ghi giọng mẫu để clone sau** (trang Giọng đọc): thêm file ghi âm (tối đa 500 MB) kèm tên người nói và xác nhận đồng ý (giọng của tôi / người trong bản ghi đã đồng ý); mỗi bản ghi là một dòng gọn; bấm “Chọn đoạn mẫu” để mở dạng sóng, gợi ý đoạn 15 giây ít khoảng lặng nhất, cho chọn bằng cách bấm vào dạng sóng, phím mũi tên hoặc nhập giờ, độ dài 10/15/20/30 giây, nghe thử đúng đoạn và cắt thành WAV 48 kHz mono; cắt xong thì file ghi âm đầy đủ bị xóa, chỉ giữ đoạn mẫu. Dòng ghi tập nào đã dùng đoạn mẫu (theo SHA-256 trong manifest clone). Lưu riêng trong `library/voice-references/<mã>/` (Git bỏ qua); cắt lại cùng đoạn không tạo bản trùng; trang không tự clone. Test: `npm run test:manager:voice-refs` (workspace tạm).
- **Duyệt sản xuất** (hồ sơ dự án): mỗi bước một trạng thái rõ ràng (Đã duyệt / Cần duyệt lại / Đến lượt duyệt / Chưa tới lượt) và ô “Việc của bạn” chỉ đúng bước cần làm tiếp. Màn hình duyệt là danh sách cần xem (cột trái: chỉ mục mới, đã sửa hoặc còn thiếu; tài liệu đã duyệt ở bước trước gom thành một dòng) và một mục mỗi lần (cột phải: nghe giọng, mở composition trong Studio, so dòng/chữ với bản đã duyệt, hoặc đọc toàn bộ khi mới); “Đã xem, sang mục tiếp” đánh dấu từng mục, nút Duyệt chỉ bật khi đã xem hết. Bước chưa tới lượt mở được để xem nhưng không duyệt. Ghi qua cùng `approvals.approve` của `npm run automation -- approve` (băm từng file, `approvals.json`, người duyệt “(trang quản lý)”), lưu bản sao đã duyệt trong `.automation/approved-files/<sha256>` để lần sau so sánh. Từ chối nếu file đổi sau khi mở, thiếu file hoặc bước trước chưa duyệt; không `--allow-missing`, không duyệt xuất video. Test: `npm run test:manager:approvals` (workspace tạm).
- **Video khách hàng, tên tạm, ảnh card**: kênh ngoài có một nút “Video” (bản đã xuất nếu có, không thì video đã import; dựng trực tiếp trên video gốc). Video import mà trình duyệt không giải mã được (HEVC/ProRes MOV…) thì lần mở đầu tạo một bản xem H.264 trong `.cache/manager-playback`, file gốc giữ nguyên. Dự án không tên được đặt tên tạm “Chưa đặt tên N” (huy hiệu “Tên tạm”) và đổi tên bằng `npm run projects -- rename`. Ảnh card khi thiếu thumbnail là một khung hình lấy từ video (cache trong `.cache/manager-posters`). Mục “Đi đến thư mục” và hộp thoại xem video có nút mở thư mục chứa video đã xuất (hoặc video khách gửi), dù bản render nằm ở `out/`, `projects/<mã>/` hay `public/<mã>/`. Test: `npm run test:manager:client-media`, `npm run test:manager:posters`.
