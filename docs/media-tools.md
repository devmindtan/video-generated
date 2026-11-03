# Công cụ media miễn phí (lấy từ OpenMontage)

Một số công cụ được chọn lọc từ OpenMontage (`repos/calesthio--OpenMontage`, bản clone chỉ để tham khảo, giấy phép AGPLv3) và viết lại gọn theo cách làm của repo này. Chỉ giữ những phần chạy local hoặc dùng kho lưu trữ công khai không cần key. Không có dịch vụ trả phí nào.

## Ảnh và footage miễn phí: `npm run stock`

Script chỉ dùng thư viện chuẩn của Python (`python3`), không cài thêm gói nào. Các nguồn đều không cần key:

| Nguồn | Có gì | Giấy phép |
|---|---|---|
| `wikimedia` | Ảnh và video trên Wikimedia Commons: tượng, kiến trúc, thiên nhiên, tranh cổ | Mỗi file một giấy phép (CC0, PD, CC BY, CC BY-SA…) |
| `nasa` | Ảnh và video của NASA: Trái Đất, bầu trời, vũ trụ | Phần lớn là phạm vi công cộng. Không được ngụ ý NASA bảo trợ. Kiểm tra nếu ảnh ghi tên bên thứ ba |
| `archive` | Phim Prelinger, home movies, cùng ảnh và video có ghi giấy phép PD/CC trên Archive.org | Theo `licenseurl`. Prelinger và home movies là phạm vi công cộng |

```bash
npm run stock -- search "marble statue"                    # mặc định: ảnh, mọi nguồn, 8 kết quả mỗi nguồn
npm run stock -- search "rain on window" --kind video --source wikimedia,archive
npm run stock -- search "earth sunrise" --kind any --json   # in JSON để agent đọc
npm run stock -- fetch wikimedia:145689096                  # tải vào library/stock/<nguồn>/<id>/
npm run stock -- fetch nasa:STS052-23-022 --project <slug>  # chép thêm vào public/<slug>/stock/ và ghi credit
```

- Mỗi kết quả có `id` dạng `<nguồn>:<id>`, kích thước, thời lượng, `licenseStatus` (`public-domain`, `attribution`, `share-alike`, `restricted`, `unknown`) và đường dẫn trang gốc.
- `fetch` lưu file kèm `source.json` (giấy phép, tác giả, trang gốc, sha256, thời điểm tải) vào `library/stock/`. Thư mục này nằm trong `.gitignore`. File đã tải sẽ được dùng lại, không tải lần hai.
- `--project <slug>` chép file vào `public/<slug>/stock/` (dùng bằng `staticFile('<slug>/stock/<file>')`) và thêm một dòng credit vào `docs/projects/<slug>/stock-credits.json`. Khi viết mô tả video, chép các dòng `credit` của mục `attribution`/`share-alike` vào.
- Giấy phép NC/ND (phi thương mại, không phái sinh) bị từ chối, vì kênh có thể kiếm tiền và video luôn cắt ghép. Chỉ dùng `--allow-restricted` khi người dùng đã xác nhận. Nếu giấy phép là `unknown`, script cảnh báo: mở trang gốc để kiểm tra trước khi dùng.
- File quá `--max-mb` (mặc định 150 MB) sẽ không tải.
- Ưu tiên hình ảnh của kênh: đồ vật, thiên nhiên, kiến trúc, tượng. Ảnh hoặc video có mặt người thật thì không dùng làm hình chính (quy tắc không lộ mặt).
- Library of Congress chặn truy cập tự động (Cloudflare), nên không có trong danh sách nguồn.

Kiểm thử offline: `npm run test:stock`.

## Phân tích media local: `npm run media`

Script dùng ffmpeg đi kèm Remotion (`node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg`). Bản ffmpeg này không có filter `select`, `ebur128` hay `tile`, nên khung hình và âm thanh được giải mã thô rồi đo bằng numpy, contact sheet ghép bằng Pillow (cả hai đều có sẵn trong `python3` của hệ thống). Script chỉ đọc file đầu vào, không render composition nào.

```bash
npm run media -- shots public/<slug>/imported-video.mp4      # danh sách cảnh và điểm cắt (--json, --threshold 0.3, --min-gap 0.5)
npm run media -- sheet public/<slug>/imported-video.mp4      # contact sheet 12 khung có mốc thời gian → .cache/media/<tên>-sheet.png
npm run media -- sheet <video> --at 3,7.5,12 --cols 3 --out <file.png>
npm run media -- energy public/audio-library/music/<file>.mp3   # mức âm của nhạc; thời điểm nhạc lên tới mức to
npm run media -- silences public/<slug>/voice/<take>.wav     # các quãng lặng (--noise -35 --min 0.35)
```

- **shots**: mặc định, một khung được tính là cut khi mức thay đổi của nó cao hẳn so với giây xung quanh. Cách này bắt được cả cut cứng lẫn chuyển cảnh mờ ngắn trong video tĩnh, và bỏ qua chuyển động máy cầm tay đều đều. Chuyển cảnh mờ dài hơn khoảng 1 giây có thể bị sót: khi đó xem thêm `sheet`. Dùng khi nhận video nhập vào (dub, review) hoặc khi phân tích nhịp cắt của video mẫu.
- **sheet**: cách nhanh để agent "xem" một video. Mở PNG kết quả bằng công cụ đọc ảnh, không cần render hay mở Studio.
- **energy**: mức RMS theo cửa sổ 0,4 giây (thay cho LUFS), làm mượt 1 giây, so với "phần to" của bài (phân vị 95). Kết quả cho biết từ lúc nào nhạc giữ được mức cách phần to 18, 12 và 6 dB. Dùng để chọn source trim trong `music.json`. Đây chỉ là gợi ý: vẫn giữ fade-in/fade-out, ducking và quyết định nghe thử của người dùng.
- **silences**: liệt kê các quãng lặng của một take giọng đọc hoặc của nhạc, để kiểm tra nhịp nghỉ (khoảng nghỉ có chủ đích giữa các ý). Đây không phải đánh giá chất lượng phát âm.

Kiểm thử: `npm run test:media`.
