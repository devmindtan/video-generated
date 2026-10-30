> Tài liệu README được lưu trước tái cấu trúc series ngày 2026-10-29. Giữ thông tin lịch sử, không tự chạy lại lệnh tạo asset/render/API. Xem [cấu trúc hiện hành](architecture/series-workflow.md) và [rule](../AGENTS.md) trước khi thao tác.

# Video playground

Môi trường tạo, xem trước và xuất video bằng React và Remotion. Tài liệu này hướng dẫn quy trình sử dụng chung cho các video trong dự án.

## Cài đặt

Yêu cầu Node.js và npm. Chạy các lệnh tại thư mục gốc của dự án:

```sh
npm ci
```

## Xem trước

**Khóa chi phí Veo:** các lệnh `veo:<project>` hiện chỉ chạy thử offline. Vertex AI bị chặn, tạo clip mới/retry mặc định bị khóa. Xem [Gemini API và an toàn chi phí](../docs/gemini-api-safety.md). Gemini API Veo không phải dịch vụ tạo video miễn phí.

**Hai nguồn video:** ưu tiên [gói Gemini thủ công + Gemini API](../docs/flow-and-gemini.md). `npm run gemini:pack:glowing-whale` chuẩn bị ảnh/prompt offline; người dùng tạo/tải clip trong ứng dụng rồi nhập lại. API có [trần tổng 20.000₫ cho mỗi Short](../budgets/README.md), giữ chỗ cộng dồn cả các lần thử; không tự trừ hạn mức gói hoặc gọi API thay thế.

```sh
npm run dev
```

Mở địa chỉ Remotion Studio hiển thị trong terminal, chọn composition trong danh sách rồi bấm Play. Bạn có thể tua đến từng frame để kiểm tra hình ảnh, chuyển động và âm thanh.

## Chỉnh sửa hoặc thêm video

Tập **Bạn đang lắng nghe, hay đang sửa chữa người khác?**: `StoicListenFirst` (45 giây, Quốc Tuấn 1×), `ListenFirstThumbnail`. Sáu ảnh đồ vật/thiên nhiên và tượng tai không mặt người; chữ Stoic Bold 700. Nhạc Night — Ludovico Einaudi, nguồn đầy đủ, Edit timing, fade/ducking. [Kịch bản](../docs/projects/listen-first/script.md), [ghi chú dựng](../docs/projects/listen-first/production-spec.md). `npm run check:listen-first`; giọng/phối chờ nghe duyệt, không tự render.

Tập **Xin lỗi rồi, sao mọi thứ vẫn như cũ?**: `StoicApologyChange` (45 giây, Quốc Tuấn 1×), `ApologyChangeThumbnail`. Sáu ảnh khái niệm không người, Stoic Bold 700. Nhạc Night — Ludovico Einaudi, nguồn đầy đủ, native Edit timing, fade/ducking. [Kịch bản](../docs/projects/apology-change/script.md), [ghi chú dựng](../docs/projects/apology-change/production-spec.md). `npm run check:apology-change`; giọng/phối chờ nghe duyệt, không tự render.

Tập **Một ngày nghỉ không cần thành tích**: `StoicRestDay` (45 giây, Quốc Tuấn 1×), `RestDayThumbnail`. Dẫn chứng đọc nhiều lần không hiểu và làm sai phải sửa; sáu ảnh đồ vật không người, Stoic Bold 700. Nhạc Night — Ludovico Einaudi, native Edit timing, ducking và fade. [Kịch bản](../docs/projects/rest-day/script.md), [ghi chú dựng](../docs/projects/rest-day/production-spec.md). `npm run check:rest-day`; bản thử chờ nghe duyệt, không tự render.

Tập **Khi vẫn còn có nhau**: `StoicCherishToday` (45 giây, Quốc Tuấn 1×), `CherishTodayThumbnail`. Sáu ảnh đồ vật/không gian nhà không người, chữ Stoic Bold 700 và nhấn vàng. Nhạc Night — Ludovico Einaudi với nguồn đầy đủ, timing Edit, fade/ducking. [Kịch bản](../docs/projects/cherish-today/script.md), [ghi chú dựng](../docs/projects/cherish-today/production-spec.md). `npm run check:cherish-today`; giọng/phối chờ nghe duyệt, không tự render.

Tập **Đừng để người thương bạn phải thu mình**: `StoicAngerAtHome` (60 giây, Quốc Tuấn 1×), `AngerAtHomeThumbnail`. Sáu chặng cảm xúc, sáu ảnh đồ vật/nhà không người. Nhạc Night — Ludovico Einaudi, nguồn đầy đủ, fade/ducking và native Edit timing. [Kịch bản](../docs/projects/anger-at-home/script.md), [ghi chú dựng](../docs/projects/anger-at-home/production-spec.md). `npm run check:anger-at-home`; bản đọc cần nghe duyệt “tuôn ra” và “cay nghiệt”. Không tự render.

Tập **Bạn còn nghĩ mãi. Họ có khi đã quên.**: `StoicSmallMistakes` (50 giây, Quốc Tuấn native 1×), `SmallMistakesThumbnail`. Mở đầu kết hợp lớp học và phòng họp bằng hai shot; sáu ảnh không người. Nhạc Night — Ludovico Einaudi giữ nguồn đầy đủ, Edit timing/source trim tự do và fade/ducking. [Kịch bản](../docs/projects/small-mistakes/script.md), [ghi chú dựng](../docs/projects/small-mistakes/production-spec.md). Kiểm tra `npm run check:small-mistakes`; giọng/phối chờ nghe duyệt, không tự render.

Tập **Chuyện gì cũng cần một lời nhận xét sao?**: `StoicLessJudgment` (50 giây, Quốc Tuấn native 1×), `LessJudgmentThumbnail`. Tình huống cà phê trực tiếp, bớt phán xét người vắng mặt; bộ ảnh đồ vật và quán cà phê không người. Nhạc Night — Ludovico Einaudi giữ full source, Edit timing tự do và fade/ducking. [Kịch bản đầy đủ](../docs/projects/less-judgment/script.md), [ghi chú dựng](../docs/projects/less-judgment/production-spec.md). Kiểm tra `npm run check:less-judgment`; không tự render.

Tập **Có tiền rồi, bạn sẽ mua lại ngày nào?**: `StoicTimeAndGold` (50 giây, Quốc Tuấn native 1×), `TimeAndGoldThumbnail`. Bộ ảnh và thumbnail dùng đồ vật/không gian, không có người. Nhạc Night — Ludovico Einaudi; native Edit giữ đầu/cuối/source trim độc lập, volume/ducking/fade giữ trong `src/projects/time-and-gold/music.json`. Chạy `npm run check:time-and-gold`; xem [kịch bản](../docs/projects/time-and-gold/script.md). Không tự render.

Tập **“Để mai” — cho đến khi không còn ngày mai**: `StoicCallBack` (48 giây, Quốc Tuấn native 1×, cùng giọng dream-trap), `CallBackThumbnail`. Nhạc Night — Ludovico Einaudi, đầu/cuối và source trim chỉnh trong Edit, mức giọng/nghỉ trong `src/projects/call-back/music.json`. Chạy `npm run check:call-back`; xem [kịch bản](../docs/projects/call-back/script.md) và [ghi chú dựng](../docs/projects/call-back/production-spec.md). Giữ bản Hải Đăng/Xuân Vĩnh để đối chiếu; không tự render.

Tập mới **Bạn đang cố gắng… hay chỉ đang tưởng tượng?**: chọn `StoicDreamTrap` (48 giây, Quốc Tuấn native 1×) và `DreamTrapThumbnail` trong Studio. Năm ảnh mới nằm ở `public/dream-trap/images/`; nhạc Past Lives chỉnh timing/source trim tại track Audio, âm lượng khi nói/nghỉ ở `src/projects/dream-trap/music.json`. Chạy `npm run check:dream-trap` để kiểm tra. [Kịch bản](../docs/projects/dream-trap/script.md), [ghi chú dựng](../docs/projects/dream-trap/production-spec.md). Bản giọng/phối chờ nghe duyệt; không tự xuất video hay thumbnail.

Nhạc nền phải là một clip Audio độc lập trong Edit, dùng nguồn đầy đủ để kéo/cắt tùy ý; không đóng cứng đoạn nhạc vào đúng độ dài video. Với `StoicSingleTask`, chọn track “Nhạc nền · Kéo/cắt tự do” để chỉnh đầu/cuối và source trim. **Âm lượng vẫn chỉnh qua `speechVolume` và `pauseVolume` trong `music.json`**, chỉ timing lưu trong JSX; xem [hướng dẫn chi tiết](../docs/projects/single-task/production-spec.md#chỉnh-nhạc-trực-tiếp-trong-edit).

Quy tắc theo nội dung:

- **Triết lý / Stoic / lời nhắc bản thân:** giữ cách làm cũ — ảnh tĩnh, chuyển động dựng bằng Remotion, lời đọc và nhạc. Không dùng Gemini (cả ứng dụng lẫn API) hoặc Veo.
- **Video trẻ em:** phải có footage chuyển động thật; zoom/pan ảnh tĩnh không thay thế được. Ưu tiên clip sẵn có, tiếp đến gói Gemini thao tác thủ công; chỉ dùng API khi được duyệt chi phí, trong trần tổng 20.000₫/Short. Nếu thiếu clip thì báo thiếu, không tự chuyển sang ảnh hoặc vượt ngân sách.

1. Tạo hoặc chỉnh sửa project trong `src/projects/<slug>/`.
2. Đăng ký component bằng `<Composition>` trong `src/projects/registry.tsx`, khai báo `id`, kích thước, `fps` và `durationInFrames`. Với ảnh tĩnh, dùng `<Still>`.
3. Đặt ảnh, âm thanh và tài nguyên khác trong `public/<slug>/`; sử dụng `staticFile()` của Remotion để tham chiếu chúng.
4. Xem trước trong Studio và kiểm tra TypeScript:

```sh
npm run typecheck
```

Thời lượng video được tính bằng `durationInFrames / fps`. Animation cần dựa trên frame của Remotion để kết quả khi xem trước, tua và xuất video nhất quán. Các thư viện animation chạy theo thời gian thực cần được đồng bộ theo frame trước khi sử dụng.

## Xuất ảnh và video

Xuất bản mẫu mặc định bằng các lệnh có sẵn:

```sh
npm run still
npm run render
```

Đầu ra lần lượt là `out/preview.png` và `out/hello.mp4`.

Để xuất composition khác, thay `CompositionId` bằng `id` đã đăng ký trong `src/projects/registry.tsx`:

```sh
npx remotion still src/index.tsx CompositionId out/preview.png --frame=0
npx remotion render src/index.tsx CompositionId out/video.mp4
```

Với video, `--frame` chọn frame cần xuất thành ảnh. Với composition ảnh tĩnh (`<Still>`), có thể bỏ tùy chọn này. Các lệnh rút gọn riêng cho từng video được khai báo trong phần `scripts` của `package.json`.

Lần xuất đầu tiên có thể cần kết nối mạng để Remotion tải Chrome Headless Shell.

## Cấu trúc thư mục

| Đường dẫn | Mục đích |
| --- | --- |
| `src/index.tsx` | Điểm khởi tạo Remotion; không chứa code riêng của video |
| `src/projects/<slug>/` | Video, thumbnail, captions và config runtime riêng của một project |
| `src/projects/registry.tsx` | Nơi đăng ký toàn bộ composition và still |
| `src/shared/` | Mã runtime đã được ít nhất hai project dùng chung |
| `src/examples/` | Composition thử nghiệm, không thuộc project sản xuất |
| `public/<slug>/` | Asset lớn của từng project; giữ URL ổn định |
| `scripts/projects/<slug>/` | Story và pipeline riêng của project |
| `scripts/shared/` | Công cụ sản xuất dùng chung |
| `scripts/tooling/` | Công cụ bảo trì repository |
| `docs/projects/<slug>/` | Kịch bản, review và mô tả riêng của project |
| `out/` | Kết quả xuất ảnh, video và các tệp kiểm tra |
| `skills/` | Hướng dẫn sử dụng Remotion, Motion và GSAP cho agent |
| `repos/` | Mã nguồn upstream để tham khảo |
| `repos-manifest.json` | Danh sách repository upstream và commit tương ứng |

Quy tắc phân ranh giới và checklist thêm project nằm trong [`docs/architecture.md`](../docs/architecture.md). Sử dụng các npm package đã cài ở thư mục gốc khi phát triển. Không chỉnh sửa `repos/` để triển khai video. Nếu cần tải lại các repository tham khảo còn thiếu, chạy `python3 scripts/tooling/clone-repos.py`.

## Làm việc với agent

### Đứng dậy sau vấp ngã — đã chọn Quốc Tuấn

`StoicGetBackUp` — **41 giây**, 1080×1920; cover `GetBackUpThumbnail`. Giữ nguyên [lời đã chốt](../docs/projects/get-back-up/script.md) và PCM take Quốc Tuấn, thêm 4,61s nghỉ; giữ edit người dùng 0,99×/gain1,2, không làm chậm thêm. [Cấu hình giọng](../scripts/projects/get-back-up/voice.json). Năm ảnh bậc đá/bình minh, caption và thumbnail Bold 700 nhấn vàng. Nhạc người dùng đổi sang Past Lives, giữ full source, Edit tự do, ducking/fade-in/out và volume đã chỉnh. QA hiện cảnh báo clipping với mức mix đang giữ; cần cân trước khi xuất. Không SFX, không Gemini, không tự render. [Thiết kế/QA](../docs/projects/get-back-up/production-spec.md), [prompt và ảnh](../docs/projects/get-back-up/image-prompts.md), [mô tả/credit nhạc](../docs/projects/get-back-up/description.md). `npm run check:get-back-up` kiểm tra.

### Cải thiện giọng VieNeu và nghe A/B/C

Repo `pnnbao97/VieNeu-TTS` đã clone trong `repos/`, pin commit trong manifest. Pipeline vốn dùng VieNeu 3.8.3; nay thêm profile `natural48` (48 kHz PCM24, 1×, giữ dynamics theo cảnh) bên cạnh `legacy24` tương thích. Chưa đổi giọng các video đã duyệt.

`npm run voice:audition -- --project take-stock --scene 4 --take <ten-take-moi>` tạo A hiện tại, B chia cụm ý và C liền đoạn, có HTML để nghe. `npm run test:voice-quality` kiểm thử offline. Đọc [quy trình, giới hạn và hướng dẫn nghe chọn](../docs/voice-workflow.md). Bộ đầu tiên: `public/take-stock/voice-auditions/vieneu-v1/index.html`.

Nghe toàn bộ preset: `npm run voice:catalog -- --take <ten-take-moi>` tạo WAV từng giọng và trang tìm/lọc/phát lần lượt. Bộ đầu tiên: `public/voice-auditions/all-presets-v1/index.html`. Giữ cách xử lý 24 kHz hiện tại; chỉ nghe thử, không thay giọng đã chọn. `npm run test:voice-catalog` kiểm thử helper và HTML.

### Đừng đợi mất đi mới biết trân trọng

`StoicTakeStock` — 48 giây, 1080×1920; cover `TakeStockThumbnail`. Bản lời đã duyệt xoay quanh câu “Tôi đã khóc khi không có giày để đi… cho đến khi tôi thấy một người không có chân để đi giày.” Giọng Hải Đăng 1×, Snowfall giảm tốc 0,85×; caption/thumbnail Bold 700 và nhấn vàng. Nhạc giữ Edit tự do, fade-in/out và volume/ducking trong JSON. Bản cũ giữ trong backups. Không SFX, không Gemini, không tự render.

Xem [thiết kế](../docs/projects/take-stock/production-spec.md), [script](../docs/projects/take-stock/script.md), [prompt và ảnh](../docs/projects/take-stock/image-prompts.md), [mô tả có nghệ sĩ nhạc](../docs/projects/take-stock/description.md). `npm run voice:take-stock` tạo giọng/phụ đề cục bộ; `npm run check:take-stock` kiểm tra typography, asset và mix theo Audio JSX.

### Chưa thua, hay chưa thử?

`StoicNeverTried` — 48 giây, 1080×1920; cover `NeverTriedThumbnail`. Năm ảnh mới, Hải Đăng native 1×, Snowfall giữ kiểu giảm tốc của tập trước. Caption/thumbnail Bold 700 và nhấn vàng; nhạc giữ Edit tự do, fade-in/out, volume/ducking trong JSON. Không SFX, không Gemini, không tự render.

Xem [thiết kế](../docs/projects/never-tried/production-spec.md), [script](../docs/projects/never-tried/script.md), [prompt và ảnh](../docs/projects/never-tried/image-prompts.md), [mô tả có credit nhạc](../docs/projects/never-tried/description.md). `npm run voice:never-tried` tạo giọng/phụ đề cục bộ; `npm run check:never-tried` kiểm tra typography, asset và mix với timing/gain đọc từ Audio JSX.

### Tử tế, đừng quên giới hạn

`StoicPeoplePleasing` — 48 giây, 1080×1920; cover `PeoplePleasingThumbnail`. Năm ảnh mới tông xanh tím, giọng Hải Đăng native 1×. Nhạc Snowfall đầy đủ, đầu/cuối chỉnh trong Edit, fade-in/out theo mép clip; volume/ducking giữ trong `music.json`. Không SFX, không Gemini, không tự render.

Xem [thiết kế](../docs/projects/people-pleasing/production-spec.md), [script](../docs/projects/people-pleasing/script.md), [prompt và ảnh](../docs/projects/people-pleasing/image-prompts.md), [mô tả kèm nhạc](../docs/projects/people-pleasing/description.md). `npm run voice:people-pleasing` tạo giọng/phụ đề cục bộ; `npm run check:people-pleasing` kiểm tra asset và mix offline.

### Lời khuyên đúng còn tùy hoàn cảnh

`StoicRightAdvice` — 48 giây, 1080×1920; cover `RightAdviceThumbnail`. Năm ảnh mới, giọng Hải Đăng 1×, nhạc Experience reverb có fade-in/out theo mép clip. Theo lựa chọn mới của người dùng, toàn bộ SFX đã tắt; [sound design v2](../docs/projects/right-advice/sound-v2.md) và bản cũ chỉ giữ làm lịch sử thử nghiệm. Không Gemini, không tự render.

Xem [thiết kế](../docs/projects/right-advice/production-spec.md), [script](../docs/projects/right-advice/script.md), [prompt và asset](../docs/projects/right-advice/image-prompts.md), [mô tả](../docs/projects/right-advice/description.md). `npm run check:right-advice` kiểm tra offline; đầu/cuối nhạc chỉnh trong Edit, mức âm và độ dài fade trong `music.json`.

### Kỷ luật cần một lý do

`StoicDisciplinePurpose` — 48 giây, 1080×1920; cover `DisciplinePurposeThumbnail`. Giọng Hải Đăng 1×, nhạc Experience reverb nguồn đầy đủ, SFX ma sát kim loại và động cơ tổng hợp cục bộ. Năm ảnh mới, không Gemini, không tự render.

Xem [thiết kế](../docs/projects/discipline-purpose/production-spec.md), [script](../docs/projects/discipline-purpose/script.md), [prompt và asset](../docs/projects/discipline-purpose/image-prompts.md), [mô tả](../docs/projects/discipline-purpose/description.md). Kiểm tra bằng `npm run check:discipline-purpose`; đầu/cuối nhạc chỉnh trong Edit, âm lượng giữ trong `music.json`.

### Một việc. Không tab thứ hai.

`StoicSingleTask` — 45 giây, 1080×1920; cover `SingleTaskThumbnail`. Project `single-task` dùng nhịp cắt thẳng, giọng Hải Đăng 1× và năm ảnh tạo bằng imagegen tích hợp, không Gemini. Nhạc Experience được xử lý reverb cục bộ từ file có sẵn, giữ bản gốc; không coi đây là bản remix bên thứ ba đã xác minh.

Xem [thiết kế](../docs/projects/single-task/production-spec.md), [script](../docs/projects/single-task/script.md), [prompt và asset](../docs/projects/single-task/image-prompts.md), [mô tả](../docs/projects/single-task/description.md). Dùng `npm run check:single-task`, `npm run voice:single-task`, `npm run music:single-task`; không tự render.

### Để mọi thứ lắng xuống

`StoicLetItSettle` — 48 giây, 1080×1920; cover `LetItSettleThumbnail`. Project riêng `let-it-settle`: hình ảnh hũ nước từ đục đến trong tạo bằng imagegen tích hợp, giọng Hải Đăng giữ tốc độ 1×, nhạc Snowfall 0,8×, CTA chỉ bằng chữ. Không Gemini và không tự render.

Xem [thiết kế sản xuất](../docs/projects/let-it-settle/production-spec.md), [script](../docs/projects/let-it-settle/script.md), [prompt và đường dẫn ảnh](../docs/projects/let-it-settle/image-prompts.md), [mô tả đăng video](../docs/projects/let-it-settle/description.md). Kiểm tra bằng `npm run check:let-it-settle`, tạo lại giọng/phụ đề bằng `npm run voice:let-it-settle`.

### Tha thứ cho chính mình trong quá khứ

`StoicPastSelf` — 50 giây, 1080×1920; `PastSelfThumbnail` là cover chỉnh được trong Studio, chưa xuất ảnh. Project `past-self` độc lập với `forgiveness` cũ. Dùng năm ảnh mới tạo bằng imagegen tích hợp, chuyển động trang trí theo frame, giọng Hải Đăng của Stoic Control giữ tốc độ gốc 1× và nhạc Snowfall theo yêu cầu; không gọi Gemini.

Xem [thiết kế sản xuất](../docs/projects/past-self/production-spec.md), [lời thoại](../docs/projects/past-self/script.md), [prompt và đường dẫn ảnh](../docs/projects/past-self/image-prompts.md), [mô tả đăng video](../docs/projects/past-self/description.md). `npm run check:past-self` kiểm tra asset và âm thanh offline; `npm run voice:past-self` tạo lại lời đọc và phụ đề cục bộ. Không tự render.

### Tí Hon: Short và tập đầy đủ

Short `TinyDinoAdventure` (48 giây, 9:16) là teaser của cùng câu chuyện trong `TinyDinoHomecoming` (180 giây, 16:9), từ lúc nở trứng đến khi về với mẹ. Giọng B dễ thương đã được chọn làm mặc định; bản gốc và backup vẫn giữ nguyên.

Xem và nghe bằng `npm run dev`, chọn composition trong Studio. **Không tự render**; các lệnh xuất chỉ chạy khi người dùng muốn. Xem [thiết kế tập đầy đủ](../docs/projects/tiny-dino-homecoming/production-spec.md), [quy ước giọng và sản xuất](../docs/projects/tiny-dino-homecoming/production-preferences.md), [mô tả đăng video](../docs/projects/tiny-dino-homecoming/description.md).

`AGENTS.md` chứa quy ước của dự án. Trước khi tạo hoặc sửa video, agent cần đọc `skills/remotion-best-practices/SKILL.md` và các quy tắc liên quan. Với Motion hoặc GSAP, đọc thêm skill tương ứng trong `skills/`.

### Bọt Biển: Bé Cá Voi Phát Sáng

Short `GlowingWhale` (60 giây, 1080×1920, 7 cảnh), still `GlowingWhaleThumbnail`. Giữ giọng B, bản gốc A và cấu trúc asset riêng; không thay đổi các tập Tí Hon. Nhạc và SFX đại dương gốc, nguồn Veo muted, góc máy chủ yếu cố định.

Xem [thiết kế sản xuất](../docs/projects/glowing-whale/production-spec.md), [bộ prompt hình](../docs/projects/glowing-whale/image-prompts.md), [mô tả đăng video](../docs/projects/glowing-whale/description.md). Kiểm tra bằng `npm run test:glowing-whale` và `npm run check:glowing-whale`. Không tự render.

### Start before ready — Bạn không cần đợi hết sợ mới bắt đầu

- Studio: http://localhost:3000/StoicStartBeforeReady · thumbnail: http://localhost:3000/StartBeforeReadyThumbnail
- 45s, 1080×1920; Quốc Tuấn 1×; Night — Ludovico Einaudi. Không render tự động.
- [Script](../docs/projects/start-before-ready/script.md), [production/QA notes](../docs/projects/start-before-ready/production-spec.md), [image prompts](../docs/projects/start-before-ready/image-prompts.md), [description](../docs/projects/start-before-ready/description.md).
- Kiểm tra: `npm run check:start-before-ready`. Cụm “trì hoãn” cần nghe đối chiếu với raw ASR; chưa duyệt chất lượng cảm nhận.

### One bad day — Một ngày chưa tốt không xóa cả hành trình

- Video: http://localhost:3000/StoicOneBadDay · thumbnail: http://localhost:3000/OneBadDayThumbnail
- 45s, Quốc Tuấn native 1×, Night — Ludovico Einaudi, không render tự động.
- [Script](../docs/projects/one-bad-day/script.md), [QA/spec](../docs/projects/one-bad-day/production-spec.md), [image prompts](../docs/projects/one-bad-day/image-prompts.md), [description](../docs/projects/one-bad-day/description.md).
- `npm run check:one-bad-day`. Cụm “để còn sửa” cần nghe đối chiếu.

### Nghiên cứu PDF cho series sách

[Workflow và rule đọc sách](../docs/book-pdf-workflow.md) · [Mẫu ghi chú nguồn](../docs/templates/book-research.md).

```sh
npm run pdf -- doctor
npm run pdf -- inspect library/books/inbox/ten-sach.pdf
npm run pdf -- ingest library/books/inbox/ten-sach.pdf --book ten-sach
npm run pdf -- toc --book ten-sach
npm run pdf -- search --book ten-sach --query 'lắng nghe'
npm run pdf -- read --book ten-sach --pages 10-12
npm run test:pdf
```

PyMuPDF core pin trong `.venv-pdf`, không dùng môi trường giọng đọc. Repo OCRmyPDF đã clone để tham khảo; backend OCR tùy chọn phải kiểm bằng `doctor`. Không tự OCR, không API/LLM/embedding, không đưa toàn văn sách vào chat hoặc `public/`. Đường dẫn/số trang ở trên chỉ là ví dụ, chưa có PDF sách thật.
