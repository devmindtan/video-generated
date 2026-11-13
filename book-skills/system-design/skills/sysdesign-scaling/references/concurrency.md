# Idempotency và khóa: ví dụ

Ví dụ SQL (PostgreSQL) và TypeScript. Ý từ sách (PDF tr. 60–62); code là của skill.

## Idempotency key cho API tạo thanh toán

```sql
create table payment_requests (
  idempotency_key text primary key,
  request_hash    text not null,      -- chặn dùng lại key cho một yêu cầu khác
  status          text not null,      -- processing | done
  response        jsonb,
  created_at      timestamptz not null default now()
);
```

```ts
async function createPayment(key: string, body: PaymentInput) {
  const hash = sha256(JSON.stringify(body));
  return db.tx(async (tx) => {
    const inserted = await tx.query(
      `insert into payment_requests (idempotency_key, request_hash, status) values ($1, $2, 'processing')
       on conflict (idempotency_key) do nothing returning idempotency_key`, [key, hash]);
    if (inserted.rowCount === 0) {
      const prev = await tx.one('select request_hash, status, response from payment_requests where idempotency_key = $1', [key]);
      if (prev.request_hash !== hash) throw new HttpError(422, 'Key đã dùng cho yêu cầu khác');
      if (prev.status !== 'done') throw new HttpError(409, 'Yêu cầu đang được xử lý');
      return prev.response;                                   // lặp lại: trả kết quả cũ, không trừ tiền lần hai
    }
    const result = await chargeOnce(tx, body);
    await tx.query(`update payment_requests set status = 'done', response = $2 where idempotency_key = $1`, [key, result]);
    return result;
  });
}
```

Bản ghi kẹt ở `processing` (tiến trình chết giữa chừng) cần hết hạn hoặc một job dọn, kèm kiểm tra với nhà cung cấp
thanh toán trước khi cho làm lại.

Consumer của hàng đợi làm tương tự với ID của message (bảng `processed_messages` có khóa chính là message ID).

## Khóa bi quan

```sql
begin;
select balance from accounts where id = $1 for update;  -- người khác muốn sửa dòng này phải chờ
update accounts set balance = balance - $2 where id = $1 and balance >= $2;
commit;
```

Khóa nhiều dòng thì luôn khóa theo cùng một thứ tự (ví dụ theo ID tăng dần) để tránh deadlock; đặt timeout cho khóa.

## Khóa lạc quan

```sql
update profiles set display_name = $2, version = version + 1
where id = $1 and version = $3;     -- $3 là version lúc đọc
```

```ts
const r = await db.query(sql, [id, name, versionReadEarlier]);
if (r.rowCount === 0) throw new ConflictError('Hồ sơ vừa được người khác sửa, hãy tải lại');
```

Retry tự động chỉ khi thao tác tính lại được từ dữ liệu mới; nếu người dùng đã nhập gì đó, báo xung đột để họ quyết.
