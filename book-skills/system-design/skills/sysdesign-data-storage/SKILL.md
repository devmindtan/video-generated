---
name: sysdesign-data-storage
description: Chọn và thiết kế lớp dữ liệu cho hệ thống - SQL hay NoSQL (hay kết hợp), mô hình nhất quán (mạnh, cuối cùng, yếu), replication đồng bộ/bất đồng bộ và failover, quorum (W + R lớn hơn N), định lý CAP (chọn CP hay AP khi mạng bị chia cắt), sharding (theo phạm vi, theo băm, bảng tra, theo địa lý; consistent hashing; chọn shard key tránh hot spot), index (B-Tree, thứ tự cột của index ghép, cái giá khi ghi), OLTP/OLAP và polyglot persistence. Dùng khi chọn database cho dự án, thiết kế schema và index, khi database chậm hoặc sắp quá tải, khi cân nhắc replica, shard, chia dữ liệu theo vùng, hoặc khi người dùng hỏi về consistency, CAP, quorum. English triggers - choose a database, SQL vs NoSQL, sharding, partitioning, shard key, replication, read replicas, consistency model, eventual consistency, CAP theorem, quorum, indexing strategy, composite index.
---

# Dữ liệu và lưu trữ

## Chọn loại lưu trữ

Hỏi theo thứ tự:

1. **Kiểu tải**: giao dịch nhỏ, nhiều (OLTP) hay phân tích quét lớn (OLAP)? Hai loại thường cần hai kho khác nhau.
2. **Hình dạng dữ liệu**: quan hệ chặt, cần JOIN và ràng buộc (SQL); key-value; document linh hoạt; đồ thị quan hệ (graph);
   file/media lớn (object storage, lưu đường dẫn trong database).
3. **Nhất quán cần đến đâu** cho từng phần (bên dưới).
4. **Quy mô**: dung lượng và tải ghi; SQL mở rộng đọc dễ (replica), mở rộng ghi khó hơn; nhiều NoSQL sinh ra để mở rộng ngang
   và chấp nhận nhất quán chậm hơn.
5. **Chi phí và kinh nghiệm của đội**: một database quen thuộc vận hành tốt thường hơn một database "đúng lý thuyết".

Kết hợp là bình thường (polyglot persistence): SQL cho tiền và đơn hàng, cache/KV cho phiên và đếm, kho tìm kiếm cho
tìm kiếm, object storage cho ảnh. Mỗi kho thêm là thêm một thứ phải vận hành và đồng bộ.

## Nhất quán và replication

- **Mạnh**: đọc luôn thấy lần ghi mới nhất. Cần cho số dư, tồn kho cuối, ghế cuối cùng.
- **Cuối cùng (eventual)**: các bản sao sẽ khớp sau một lúc. Hợp với ảnh đại diện, lượt thích, feed.
- **Yếu**: không bảo đảm thời gian khớp, chấp nhận dữ liệu cũ (cache vài chục giây, bảng xếp hạng).
- Chọn **theo từng module**, không một mức cho cả hệ thống.
- **Replication đồng bộ**: ghi xong khi bản sao xác nhận, an toàn nhưng chậm và phụ thuộc bản sao. **Bất đồng bộ**: nhanh,
  có thể mất phần ghi cuối khi primary chết. **Failover**: khi primary hỏng, đẩy một secondary lên; cần phát hiện hỏng và
  tránh hai primary cùng lúc.
- **Quorum**: N bản sao, ghi cần W xác nhận, đọc hỏi R bản; W + R > N thì tập đọc và tập ghi luôn giao nhau nên đọc thấy bản
  mới nhất (ví dụ N=5, W=3, R=3). Giảm W hoặc R để nhanh hơn, đổi lại nhất quán yếu hơn.
- **CAP**: khi mạng giữa các nút bị chia cắt (P gần như không tránh được trong hệ phân tán), phải chọn **C** (từ chối phục
  vụ để không sai, hợp ngân hàng) hay **A** (vẫn phục vụ, có thể trả dữ liệu cũ, hợp mạng xã hội). Khi mạng bình thường, đánh
  đổi thường gặp là độ trễ so với nhất quán.

## Sharding

Chia dữ liệu ra nhiều máy khi một máy không còn chứa nổi hay chịu nổi tải ghi. Chưa cần cho MVP: index, replica đọc và cache
thường đủ lâu hơn ta nghĩ.

| Cách | Ưu | Nhược |
|---|---|---|
| Theo phạm vi (ID, ngày, chữ cái) | truy vấn theo khoảng dễ | dễ lệch tải (dữ liệu mới dồn một shard) |
| Theo băm của key | phân bố đều | truy vấn khoảng khó; thêm máy phải chia lại, dùng consistent hashing để chỉ di chuyển một phần |
| Bảng tra (directory) | linh hoạt, chuyển từng khách | bảng tra thành điểm phụ thuộc phải nhân bản |
| Theo địa lý | gần người dùng, đáp ứng luật lưu trú dữ liệu (như GDPR) | truy vấn xuyên vùng đắt |

**Shard key** quyết định tất cả: chọn theo truy vấn phổ biến nhất để đa số truy vấn chỉ chạm một shard, và tránh key làm một
shard nóng (người nổi tiếng, ngày hôm nay). Ghi lại cách xử lý truy vấn xuyên shard và việc chia lại.

## Index

Như mục lục sách: đọc nhanh hơn, ghi chậm hơn và tốn chỗ. Tạo index cho cột lọc/sắp xếp/JOIN thường dùng, xác nhận bằng
kế hoạch truy vấn (`EXPLAIN`), không tạo cho mọi cột. **Index ghép** dùng được theo tiền tố trái: index `(country, name)`
giúp lọc theo `country` hoặc `country + name`, không giúp lọc riêng `name`.

## Trình bày một thiết kế dữ liệu

Yêu cầu dữ liệu (đọc/ghi, khối lượng, nhất quán) → loại database và lý do → các thực thể chính và quan hệ → kế hoạch replica
và (nếu cần) shard key → index cho truy vấn chính → mức nhất quán từng module → trả lời được "nếu tải gấp mười, nếu một nút
chết, nếu mạng chia cắt thì sao".

## Nguồn

Ý của sách "System Design" (Nguyễn Thế Huy, ebook tiếng Việt), số trang là trang PDF:

- Ba mức nhất quán và ví dụ, replication đồng bộ/bất đồng bộ, failover, quorum W+R>N, CAP với CP/AP, ba điều khi trình bày:
  PDF tr. 21–33.
- SQL và NoSQL, kết hợp, sharding bốn cách, consistent hashing, hot spot, MVP chưa cần shard, index và B-Tree, index ghép,
  chọn lưu trữ (OLTP/OLAP, mô hình dữ liệu, quy mô, chi phí, polyglot persistence), gợi ý trình bày: PDF tr. 33–44.

Phần của skill: thứ tự câu hỏi chọn lưu trữ, nhắc kiểm chứng index bằng `EXPLAIN`, câu về độ trễ và nhất quán khi mạng bình
thường (kiến thức chung, không có trong sách).
