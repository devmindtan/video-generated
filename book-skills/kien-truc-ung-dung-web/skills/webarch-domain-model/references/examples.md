# Ví dụ TypeScript

Sách dùng Laravel/PHP với chức năng đặt mua e-book. Ví dụ dưới đây viết lại cùng ý bằng TypeScript; đổi sang ngôn ngữ
khác giữ nguyên cấu trúc.

## Value object và entity

```ts
// domain/order/values.ts
export class EmailAddress {
  private constructor(readonly value: string) {}
  static of(raw: string): EmailAddress {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(raw)) throw new DomainError('Email không hợp lệ');
    return new EmailAddress(raw.toLowerCase());
  }
}

export class Money {
  private constructor(readonly minor: number, readonly currency: string) {}
  static of(minor: number, currency = 'VND'): Money {
    if (!Number.isInteger(minor) || minor < 0) throw new DomainError('Số tiền không hợp lệ');
    return new Money(minor, currency);
  }
  times(n: number): Money { return Money.of(this.minor * n, this.currency); }
}

// domain/order/order.ts
export class Order {
  private constructor(
    readonly id: OrderId, readonly ebookId: EbookId, readonly buyer: EmailAddress,
    readonly quantity: number, readonly unitPrice: Money, readonly total: Money,
    private status: 'awaiting_payment' | 'paid' | 'cancelled',
  ) {}

  static place(id: OrderId, ebookId: EbookId, buyer: EmailAddress, quantity: number, unitPrice: Money): Order {
    if (!Number.isInteger(quantity) || quantity <= 0) throw new DomainError('Số lượng phải lớn hơn 0');
    return new Order(id, ebookId, buyer, quantity, unitPrice, unitPrice.times(quantity), 'awaiting_payment');
  }

  markPaid(): void {
    if (this.status !== 'awaiting_payment') throw new DomainError('Đơn không ở trạng thái chờ thanh toán');
    this.status = 'paid';
  }
}
```

## Repository: interface ở domain, hiện thực ở hạ tầng

```ts
// domain/order/order-repository.ts
export interface OrderRepository {
  nextIdentity(): OrderId;
  save(order: Order): Promise<void>;
  byId(id: OrderId): Promise<Order | null>;
}

// infrastructure/persistence/sql-order-repository.ts
export class SqlOrderRepository implements OrderRepository {
  constructor(private readonly db: SqlClient) {}
  nextIdentity(): OrderId { return OrderId.generate(); }
  async save(order: Order): Promise<void> {
    await this.db.query(
      'insert into orders (id, ebook_id, email, quantity, unit_price, total, status) values ($1,$2,$3,$4,$5,$6,$7) '
      + 'on conflict (id) do update set status = excluded.status',
      [order.id.value, order.ebookId.value, order.buyer.value, order.quantity,
       order.unitPrice.minor, order.total.minor, order.statusName()],
    );
  }
  async byId(id: OrderId): Promise<Order | null> { /* select ... rồi dựng lại Order */ return null; }
}

// test/support/in-memory-order-repository.ts
export class InMemoryOrderRepository implements OrderRepository {
  readonly saved = new Map<string, Order>();
  nextIdentity(): OrderId { return OrderId.generate(); }
  async save(order: Order) { this.saved.set(order.id.value, order); }
  async byId(id: OrderId) { return this.saved.get(id.value) ?? null; }
}
```

## Read model và view model

```ts
// application/catalog/ebook-prices.ts — chỉ một giá trị thì một hàm là đủ
export interface EbookPrices { ofEbook(id: EbookId): Promise<Money> }

// application/orders/recent-orders.ts — read model cho một màn hình
export type RecentOrderRow = { id: string; title: string; total: Money; placedAt: Date };
export interface RecentOrders { latest(limit: number): Promise<RecentOrderRow[]> }

// interface/web/order-list-view.ts — view model: đúng định dạng cho giao diện, không có logic nghiệp vụ
export const toOrderListView = (rows: RecentOrderRow[]) => rows.map((r) => ({
  id: r.id, title: r.title,
  total: new Intl.NumberFormat('vi-VN', {style: 'currency', currency: r.total.currency}).format(r.total.minor),
  placedAt: r.placedAt.toISOString().slice(0, 10),
}));
```

## Test nghiệp vụ không cần database

```ts
test('không tạo được đơn với số lượng 0', () => {
  expect(() => Order.place(OrderId.generate(), EbookId.of(7), EmailAddress.of('khach@example.com'), 0, Money.of(50_000)))
    .toThrow(DomainError);
});
```
