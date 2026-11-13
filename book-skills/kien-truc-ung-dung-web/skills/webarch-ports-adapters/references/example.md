# Ví dụ: thông báo đơn hàng và cổng thanh toán

Cùng ý với ví dụ của sách (port lưu trữ và port thông báo, adapter thật và giả, PDF tr. 53–57), viết bằng TypeScript và
thêm một port thanh toán để thấy cách dịch lỗi nhà cung cấp.

## Port trong lõi

```ts
// application/ports.ts
export interface OrderNotifier {
  orderConfirmed(order: {id: OrderId; buyer: EmailAddress; total: Money}): Promise<void>;
}

export type ChargeResult = {ok: true; reference: string} | {ok: false; reason: 'declined' | 'unavailable'};
export interface PaymentGateway {
  charge(orderId: OrderId, amount: Money): Promise<ChargeResult>;
}
```

## Adapter thật

```ts
// infrastructure/notifications/email-order-notifier.ts
export class EmailOrderNotifier implements OrderNotifier {
  constructor(private readonly mail: MailTransport) {}
  async orderConfirmed(o: {id: OrderId; buyer: EmailAddress; total: Money}) {
    await this.mail.send({to: o.buyer.value, subject: `Đơn ${o.id.value} đã xác nhận`, text: `Tổng: ${o.total.minor}`});
  }
}

// infrastructure/payments/http-payment-gateway.ts
export class HttpPaymentGateway implements PaymentGateway {
  constructor(private readonly http: HttpClient, private readonly apiKey: string) {}
  async charge(orderId: OrderId, amount: Money): Promise<ChargeResult> {
    try {
      const r = await this.http.post('/charges', {order: orderId.value, amount: amount.minor, currency: amount.currency},
        {headers: {authorization: `Bearer ${this.apiKey}`}, timeoutMs: 10_000, idempotencyKey: orderId.value});
      return r.status === 'succeeded' ? {ok: true, reference: r.id} : {ok: false, reason: 'declined'};
    } catch {
      return {ok: false, reason: 'unavailable'}; // lỗi mạng/nhà cung cấp được dịch sang ngôn ngữ của lõi
    }
  }
}
```

## Adapter giả

```ts
// test/support/fakes.ts
export class RecordingNotifier implements OrderNotifier {
  readonly sent: OrderId[] = [];
  async orderConfirmed(o: {id: OrderId}) { this.sent.push(o.id); }
}

export class FakePaymentGateway implements PaymentGateway {
  constructor(private readonly outcome: ChargeResult = {ok: true, reference: 'fake-1'}) {}
  async charge() { return this.outcome; }
}
```

## Test use case chỉ trong bộ nhớ

```ts
test('thanh toán bị từ chối thì đơn không được xác nhận và không gửi email', async () => {
  const orders = new InMemoryOrderRepository();
  const notifier = new RecordingNotifier();
  const handler = new PayOrderHandler(orders, new FakePaymentGateway({ok: false, reason: 'declined'}), notifier);
  const id = await seedAwaitingOrder(orders);

  await expect(handler.handle({orderId: id.value})).rejects.toThrow(PaymentDeclined);
  expect(notifier.sent).toEqual([]);
});
```

## Port giữa hai bounded context

```ts
// ordering/application/ports.ts — chỉ những gì context Đặt hàng cần
export interface CustomerDirectory { find(id: CustomerId): Promise<{id: CustomerId; email: EmailAddress} | null> }

// ordering/infrastructure/customer-directory-http.ts — gọi API của context Khách hàng
export class CustomerDirectoryHttp implements CustomerDirectory { /* GET /customers/:id rồi ánh xạ */ }
```

Đổi cách tích hợp (gộp database, chuyển sang message) chỉ sửa `CustomerDirectoryHttp`.
