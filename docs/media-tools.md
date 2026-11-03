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
