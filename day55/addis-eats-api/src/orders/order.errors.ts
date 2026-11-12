// Domain errors: real Error subclasses, never thrown as strings.

export class OrderNotFoundError extends Error {
  constructor(public readonly orderId: number) {
    super(`Order ${orderId} was not found`);
    this.name = "OrderNotFoundError";
  }
}

export class PaymentDeclinedError extends Error {
  constructor(
    public readonly phone: string,
    public readonly reason: string,
  ) {
    super(`Payment from ${phone} was declined: ${reason}`);
    this.name = "PaymentDeclinedError";
  }
}
