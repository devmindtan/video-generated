# VieNeu — cải thiện và duyệt giọng đọc

## Kết quả xem repo

Đã clone upstream vào `repos/pnnbao97--VieNeu-TTS`, commit `04044e1b8f822f946bafb2c88b716459f4164152` (ghi trong repos-manifest.json). Repo chỉ tham khảo, không sửa hoặc cài editable từ đó. Quy trình cũ **đã dùng VieNeu-TTS v3 Turbo 3.8.3** trong `.venv`; bản clone cũng khai báo 3.8.3 nên không nâng cấp môi trường một cách không cần thiết.

Tài liệu chính chủ: [README tiếng Việt](https://github.com/pnnbao97/VieNeu-TTS/blob/04044e1b8f822f946bafb2c88b716459f4164152/README.vi.md), [mã inference v3 Turbo](https://github.com/pnnbao97/VieNeu-TTS/blob/04044e1b8f822f946bafb2c88b716459f4164152/src/vieneu/v3turbo.py). V3 Turbo xuất native 48 kHz; `style` đã deprecated/bị bỏ qua, phong cách theo giọng preset/reference. V4 được README nêu là proprietary, không có trong bản clone; không kết nối dịch vụ trả phí.

Vấn đề trong pipeline của chúng ta: đầu ra bị hạ xuống 24 kHz/PCM16, có thể tự đổi tempo để vừa cảnh, cân RMS riêng từng cụm ý và cắt khoảng lặng khá sát. `--voice-style` trước đây chỉ được lưu trong metadata, không phải prompt điều khiển model. Không hứa rằng đổi sample rate sẽ làm giọng hay hơn; nhịp, phát âm và lựa chọn preset vẫn phải nghe duyệt.

## Hai profile, cùng một pipeline

| Thuộc tính | legacy24 (mặc định tương thích) | natural48 (ứng viên nghe thử) |
|---|---|---|
| Engine | V3 Turbo, ONNX CPU FP32 | Cùng engine, pin rõ mode/precision |
| WAV | 24 kHz PCM16 | Native 48 kHz PCM24 |
| Tempo | Giữ logic cũ | Chỉ 1×, không atempo trung gian |
| Không vừa cảnh | Logic tự fit cũ | Báo lỗi trước khi publish, không cắt lời |
| Gain | RMS từng cụm ý | Một gain cho cả cảnh, giữ tương quan giữa câu |
| Khoảng giữ đầu/cuối raw | 70/90 ms | 120/180 ms để giữ khoảng thở tốt hơn |
| Cache | Giữ key lịch sử với sampling mặc định | Key riêng gồm profile, tham số, phiên bản SDK/model refs |

Chọn profile bằng `--quality-profile natural48`. Tham số thật có tác dụng: `--voice`, `--temperature`, `--top-k`, `--top-p`, `--repetition-penalty`, cách chia `sentences`, `pauseAfter` và nhịp hình. Temperature cao hơn không đồng nghĩa hay hơn; cần thử phát âm/độ ổn định. `--voice-style` là ghi chú biên tập; metadata mới ghi rõ `styleAppliedByModel: false`.

Profile mới không được upsample mô hình 24 kHz thành 48 kHz rồi gọi là native. Cache mới xác minh sample rate/bit depth; giọng trống/non-finite bị chặn. Không thay đổi cache hoặc WAV đã duyệt để tạo cảm giác “đã nâng cấp”.

## Nghe thử không sửa video

```sh
npm run voice:audition -- --project take-stock --scene 4 --take vieneu-v2
npm run test:voice-quality
```

Dùng tên take **mới** mỗi lần. Lệnh chỉ sinh hai ứng viên bằng local CPU, dùng model đã cache với `HF_HUB_OFFLINE=1`; không API từ xa, không đăng nhập, không mua credit, không tự retry. Take đã tồn tại sẽ bị từ chối thay vì xóa/ghi đè. Nếu có lỗi, giữ phần kết quả và manifest để kiểm tra.

Mỗi take chứa HTML với native audio controls và ba mẫu cùng nội dung:

- **A:** sao chép bản đang dùng, không thay đổi.
- **B:** giữ giọng và cách chia cụm ý hiện tại; natural48, temperature 0,5.
- **C:** cùng giọng nhưng thử đọc liền đoạn; natural48, temperature 0,8.

B/C là lần tổng hợp mới, không phải phép thử tách riêng ảnh hưởng của sample rate. Không tự kết luận chất lượng cảm nhận bằng ASR/RMS hoặc số lượng Hz. So sánh độ rõ tiếng Việt, trọng âm, ngắt hơi, nhịp nối câu, lặp/nuốt chữ và sự phù hợp với nội dung. A/B/C chưa cân bằng loudness để làm blind test; đừng đánh giá chỉ vì mẫu nào sáng/lớn hơn.

Nếu scene có mốc `at` cho hành động, bản C không được tự bỏ các mốc đó. Bộ audition không phải công cụ retime cả video. Phần khác của giọng/nhạc/caption/story được kiểm tra checksum trước/sau, không tự chuyển bản đang dùng.

## Bộ nghe thử đã tạo

`public/take-stock/voice-auditions/vieneu-v1/index.html` — dùng đoạn 4 vừa duyệt. A 24 kHz PCM16; B/C native 48 kHz PCM24, tất cả 1×. B/C word-match 100% theo faster-whisper medium. Manifest nằm cạnh HTML, có metadata từng bản và trạng thái chờ người dùng nghe chọn.

Mở HTML trực tiếp trong trình duyệt để nghe các WAV tương đối. Nếu dùng Studio, lấy URL của file từ Media/static assets; `/public/...` hoặc `/<project>/...` không phải URL file của Studio. Static asset prefix được Studio tạo động, không hardcode nó vào runner.

## Khi người dùng chọn giọng

### Playlist đã chọn cho nội dung sau này

Người dùng chọn **5 Hải Đăng, 11 Minh Đức, 14 Xuân Vĩnh, 16 Ngọc Linh, 25 Quốc Tuấn** từ bộ `all-presets-v1`. Cấu hình chung: `scripts/shared/voice-playlists.json`. Lưu bằng tên preset để không lệch nếu SDK sắp lại số thứ tự. Đây là nhóm ưu tiên cho nội dung mới, chưa có một giọng mặc định duy nhất hoặc phân công cố định theo thể loại. Không tự đổi giọng video hiện tại; giọng B thiếu nhi đã duyệt vẫn giữ nếu chưa có chỉ dẫn khác.

Trang catalog mặc định lọc “Giọng đã chọn”, đánh dấu ★ và phát lần lượt năm giọng này. Đổi dropdown sang “Tất cả giọng” để nghe đủ 25. Không tạo lại WAV khi cập nhật playlist.

Người dùng đã chọn **giữ bản giọng hiện tại**, không áp dụng B/C natural48. Việc tạo catalog toàn bộ preset sau đó chỉ phục vụ nghe thử; không thay quyết định này.

Chỉ áp dụng take được chọn, backup bản hiện tại, ghép đúng câu/beat, cập nhật nguồn Audio và metadata, căn lại caption/SRT. Chạy QA theo timing/gain trong Studio Edit. Những checker cũ có assert 24 kHz phải được cập nhật trước khi áp dụng WAV 48 kHz; không đổi nhãn sample rate hoặc âm thầm downsample.

Các npm `voice:<project>` hiện có vẫn mặc định legacy24 để giữ khả năng tái tạo. Không tự làm lại giọng các tập cũ. Triết lý giữ Hải Đăng ở 1× khi đã chọn như vậy; kids giữ Trúc Ly voice B (+2,5 semitone và bù tempo bảo toàn thời lượng), không biến đổi profile kids khi thử giọng triết lý.

Không bật voice cloning hoặc fine-tune chỉ vì clone Git repo. Nếu cần chất giọng mới, trước hết nghe preset khác; reference/fine-tune chỉ thực hiện khi có mẫu giọng và quyền sử dụng phù hợp. Không render video/thumbnail để kiểm tra giọng.

## Kiểm chứng đã thực hiện

- Tám test offline: tương thích cache và phép gain cũ, cache HQ, headroom/dynamics, chặn tempo khác 1×, âm thanh lỗi; test pipeline giả lập xác nhận 48 kHz PCM24 và không publish khi quá dài.
- Hai ứng viên B/C được tổng hợp thật và ASR cục bộ, không chỉ chạy mock.
- Tạo lại riêng đoạn 4 theo legacy24 ở thư mục tạm rồi so byte với WAV đang dùng: giống hệt. Không thay file active.
- Chưa có người dùng nghe duyệt; chất lượng cảm nhận chưa được xác nhận.

## Nghe toàn bộ preset

Runner cũng hỗ trợ kịch bản riêng và một số giọng được chọn, không thay bộ catalog 25 giọng:

```sh
npm run voice:catalog -- --take get-back-up-v1 --config scripts/projects/get-back-up/audition.json --voices 'Xuân Vĩnh' 'Quốc Tuấn'
```

Giữ số thứ tự gốc của SDK (14/25) dù chỉ thử hai giọng. Toàn bộ lời được đọc theo nhịp tự nhiên, không ép vào thời lượng video. Có `phraseRanges` để đối chiếu ranh giới các đoạn và Caption JSON nếu ASR đạt; chưa áp dụng vào video hay tự tạo hình. Cấu hình mẫu dài có thể đặt `maxDurationSeconds` riêng thay vì bị giới hạn 40 giây như một đoạn thử ngắn.

```sh
npm run voice:catalog -- --take all-presets-v1
npm run test:voice-catalog
```

Runner `scripts/shared/voice-catalog.py` lấy tất cả giọng từ SDK cài trên máy, không hardcode chỉ một nhóm giọng. Bộ đầu tiên lưu trong `public/voice-auditions/all-presets-v1/`: từng WAV riêng, manifest, audit nhận dạng và HTML có tìm tên, lọc giới tính/vùng giọng, phát riêng hoặc nghe lần lượt. HTML dùng mẫu `scripts/shared/templates/voice-catalog.html`, có dữ liệu nhúng nên cũng mở trực tiếp bằng file local được; khi mở qua HTTP sẽ cập nhật tiến độ 10 giây/lần mà không ngắt audio đang phát.

Cùng hai cụm lời ở `scripts/shared/voice-catalog.json`, cùng temperature 0,5, xử lý tương thích legacy24 (24 kHz PCM16), tốc độ tự nhiên 1×, không fit một duration cố định, không nhạc/SFX. Chỉ model có sẵn trong cache; một engine dùng xuyên suốt để tránh nạp lại 25 lần. Faster-whisper medium kiểm tra từng bản; ASR nghi ngờ thì giữ WAV và gắn cảnh báo để nghe, không tự tổng hợp lại và không coi ASR là phán quyết chất giọng.

Giọng Trúc Ly là preset gốc, chưa nâng +2,5 semitone như bản B đã chọn cho kids. Các preset không bị biến đổi để bắt chước giọng video đang dùng. Không có preset nào được tự áp dụng vào video.

Take mới không ghi đè take cũ. Nếu quá trình bị gián đoạn, `--resume` là lựa chọn tiếp tục rõ ràng: giữ mẫu hoàn tất, chỉ thử phần chưa hoàn tất. Không áp dụng cơ chế này cho API có phí. Không render MP4/still/thumbnail.

## VoiceStudio — studio giọng nói local (cài 2026-10-30)

Nguồn tham khảo: `repos/debpalash--VoiceStudio`, ghim `4d4cb0b` trong `repos-manifest.json` (không sửa). Bản chạy là một checkout riêng cùng commit ở `.voicestudio/app` (ngoài Git), giống cách multi-agent-system có runtime riêng.

- Mở: trang quản lý → **Studio giọng nói** (sidebar hoặc nút trên trang Giọng đọc), hoặc `npm run voicestudio -- start` rồi vào http://127.0.0.1:3900/. `npm run voicestudio -- status` báo trạng thái. Server chạy nền; log ở `.voicestudio/server.log`.
- Cài đặt: `bun` 1.4.2 qua mise (không kích hoạt toàn cục); Python 3.11 + PyTorch `2.8.0+cpu` theo `uv.lock` của repo trong `.voicestudio/app/.venv`; giao diện web build vào `.voicestudio/app/frontend/dist`. Lệnh cài lại: `.voicestudio/install.sh` (đặt `OMNIVOICE_TORCH_VARIANT=cpu`). Không dùng `curl … | sh`, không đụng `.venv` của VieNeu hay các môi trường khác.
- Chạy: chỉ bind `127.0.0.1:3900` (API loopback không cần khóa; không bật chia sẻ mạng), `OMNIVOICE_ANALYTICS_DISABLED=1`, dữ liệu và cache model trong `.voicestudio/data` (`HF_HOME=.voicestudio/data/huggingface`). Gỡ: dừng server và xóa `.voicestudio/`.
- Model: **VoxCPM2** (`openbmb/VoxCPM2`, Apache-2.0, có tiếng Việt, 48 kHz, nhân bản và thiết kế giọng bằng mô tả) cài qua sidecar một chạm vào `.voicestudio/data/engines/voxcpm2`. **OmniVoice** (engine mặc định) **không tải**: trọng số CC-BY-NC, chỉ phi thương mại, không hợp với kênh có thể kiếm tiền. Người dùng đã chọn VoxCPM2 ngày 2026-10-30; muốn dùng OmniVoice cần người dùng tự chấp nhận license. CosyVoice 3 và MOSS-TTS-Nano không có tiếng Việt.
- Máy không có GPU NVIDIA: tạo giọng chạy CPU, chậm hơn VieNeu nhiều; thử câu ngắn trước.
- Take tạo ra đi qua thử A/B, nghe chọn, giữ take cũ; điểm ASR không chứng minh thanh điệu tiếng Việt đúng. Không thay giọng đã duyệt của video hiện có nếu không được yêu cầu.

## Hai lựa chọn giọng cho video mới (người dùng chốt 2026-10-30)

Mỗi video mới chọn một trong hai cách và ghi vào `brief.md` của tập (ví dụ `Giọng: lựa chọn 1 — Hải Đăng` hoặc `Giọng: lựa chọn 2 — clone từ bản ghi của tôi`). Không ghi thì dùng lựa chọn 1.

| | Lựa chọn 1 — Giọng có sẵn (mặc định) | Lựa chọn 2 — Clone giọng (khi muốn) |
|---|---|---|
| Công cụ | VieNeu v3 Turbo trong `.venv` (`voice:audition`) | VoiceStudio + VoxCPM2 (`npm run voicestudio -- start`, trang quản lý → Studio giọng nói) |
| Nguồn giọng | 25 preset; ưu tiên playlist trong `scripts/shared/voice-playlists.json`; kids giữ Trúc Ly giọng B | Bản ghi mẫu người dùng cung cấp; hoặc thiết kế giọng bằng mô tả |
| Điều kiện | Không | Bản ghi là giọng của người dùng hoặc người đã đồng ý cho clone. Không clone người nổi tiếng, người sáng tạo khác hay giọng lấy từ video khi chưa có sự đồng ý |
| Bản ghi mẫu | — | 10–30 giây, một người nói, rõ, không nhạc nền hay tiếng vang; VoxCPM2 chỉ dùng 30 giây đầu. Lưu trong VoiceStudio (`.voicestudio/data`, ngoài Git), không đưa vào `public/` |
| Tốc độ trên máy này | Nhanh | Chậm: câu 4 giây mất khoảng 100 giây trên CPU, dùng khoảng 6–7 GB RAM; tắt VoiceStudio khi xong |

Cả hai đều tạo take thử: nghe chọn, giữ take cũ, ghi take đã chọn vào metadata của tập. Agent không tự chuyển sang lựa chọn 2.

### Agent làm gì khi người dùng yêu cầu giọng clone (lựa chọn 2)

1. **Bản ghi mẫu và sự đồng ý.** Cần đường dẫn file người dùng đưa (WAV/MP3/FLAC/M4A/OGG, 10–30 giây, một người nói, rõ, không nhạc) và biết đó là giọng của ai: `self` (của người dùng) hoặc `permission` (người trong bản ghi đã đồng ý). Thiếu một trong hai thì hỏi lại. Không tự tìm hay cắt giọng từ video/internet. Nếu người dùng cho biết lời nói trong bản ghi, truyền vào `--ref-text`.
2. **Ghi lựa chọn vào brief** của tập: `Giọng: cách 2 — clone (consent: self)`. Tập thiếu nhi chỉ dùng clone khi người dùng nói rõ cho tập đó; mặc định vẫn Trúc Ly giọng B.
3. **Thử ngắn trước** (CPU chậm, khoảng 100 giây cho mỗi câu 4 giây, chiếm 6–7 GB RAM; không chạy song song VieNeu, Remotion render hay model khác):

   ```sh
   npm run voicestudio -- clone --project <slug> --take clone-v1 --ref <file> --consent self --scene 1
   ```

   Lời đọc: `--scene N` hoặc `--all` (theo `scripts/projects/<slug>/audition.json`), `--text-file <file>` (mỗi dòng/đoạn một WAV), hoặc `--text "…"`. Tùy chọn: `--ref-text "…"`, `--instruct "…"` (phong cách đọc), `--seed N`, `--keep-running`.
4. **Đưa người dùng nghe** `public/<slug>/voice-auditions/<take>/index.html`. Chỉ chạy `--all` cho cả kịch bản khi họ đồng ý với giọng ở bản thử. Mỗi lần chạy dùng tên take mới; lệnh từ chối ghi đè.
5. **Không tự áp dụng** take vào `Video.tsx`/captions/timing. Việc ghép take đã chọn là bước dựng riêng, sau khi người dùng chọn take.

Lệnh tự bật VoiceStudio nếu đang tắt và tự tắt khi xong (trừ khi nó đã mở sẵn hoặc có `--keep-running`), kể cả khi lỗi giữa chừng. Bản ghi mẫu được chép theo SHA vào `.voicestudio/data/references/` (ngoài Git, không vào `public/`); `manifest.json` của take ghi SHA, tên file gốc, sự đồng ý, engine/model, seed, thời gian tạo và trạng thái "chờ nghe chọn". Mã: `tools/voicestudio/clone.cjs`; kiểm tra: `npm run test:voicestudio` (VoiceStudio giả, workspace tạm).
