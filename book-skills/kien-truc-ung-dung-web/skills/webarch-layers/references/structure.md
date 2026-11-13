# Cây thư mục và ví dụ

Sách gợi ý cấu trúc `app/Domain`, `app/Application`, `app/Infrastructure` cho Laravel (PDF tr. 45–47). Bản dưới đây cùng ý
cho một dự án TypeScript; tên thư mục theo quy ước của repo nếu đã có.

```text
src/
  domain/order/
    order.ts            # entity
    values.ts           # value object: OrderId, Money, EmailAddress
    events.ts           # OrderPlaced, OrderCancelled
    order-repository.ts # interface (port)
  application/order/
    place-order.ts      # command + handler
    on-order-placed.ts  # listener: gửi xác nhận qua interface Notifier
  infrastructure/
    persistence/sql-order-repository.ts
    notifications/email-notifier.ts
    http/order-routes.ts
    cli/import-orders.ts
    composition-root.ts # nối interface với hiện thực
test/
  support/in-memory-order-repository.ts
  application/place-order.test.ts
  infrastructure/sql-order-repository.int.test.ts
```

## Handler

```ts
// application/order/place-order.ts
export type PlaceOrderCommand = {customerEmail: string; items: {ebookId: number; quantity: number}[]};

export class PlaceOrderHandler {
  constructor(
    private readonly orders: OrderRepository,
    private readonly prices: EbookPrices,
    private readonly events: EventPublisher,
  ) {}

  async handle(cmd: PlaceOrderCommand): Promise<OrderId> {
    const buyer = EmailAddress.of(cmd.customerEmail);
    const lines = await Promise.all(cmd.items.map(async (i) =>
      ({ebookId: EbookId.of(i.ebookId), quantity: i.quantity, unitPrice: await this.prices.ofEbook(EbookId.of(i.ebookId))})));
    const order = Order.place(this.orders.nextIdentity(), buyer, lines);
    await this.orders.save(order);
    await this.events.publish(new OrderPlaced(order.id, buyer));
    return order.id;
  }
}
```

## Controller mỏng

```ts
// infrastructure/http/order-routes.ts
router.post('/orders', async (req, res) => {
  try {
    const id = await placeOrder.handle({customerEmail: String(req.body.email), items: req.body.items ?? []});
    res.status(201).json({id: id.value});
  } catch (e) {
    if (e instanceof DomainError) return res.status(422).json({error: e.message});
    throw e;
  }
});
```

## Composition root

```ts
// infrastructure/composition-root.ts
const db = new SqlClient(process.env.DATABASE_URL!);
export const placeOrder = new PlaceOrderHandler(new SqlOrderRepository(db), new SqlEbookPrices(db), new InProcessEvents([
  new OnOrderPlaced(new EmailNotifier(mailer)),
]));
```

## Test handler không cần framework

```ts
test('đặt hàng lưu đơn và phát OrderPlaced', async () => {
  const orders = new InMemoryOrderRepository();
  const events = new RecordingEvents();
  const handler = new PlaceOrderHandler(orders, new FixedPrices({7: Money.of(50_000)}), events);

  const id = await handler.handle({customerEmail: 'khach@example.com', items: [{ebookId: 7, quantity: 2}]});

  expect((await orders.byId(id))?.total.minor).toBe(100_000);
  expect(events.published.map((e) => e.constructor.name)).toEqual(['OrderPlaced']);
});
```

Cùng handler được gọi từ `cli/import-orders.ts` cho từng dòng CSV mà không sửa gì ở application hay domain.
