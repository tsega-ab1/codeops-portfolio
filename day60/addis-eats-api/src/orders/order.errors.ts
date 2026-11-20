// Domain errors: real Error subclasses, never thrown as strings.
// They know nothing about HTTP: the filter in common/filters decides the status code.

export class OrderNotFoundError extends Error {
  constructor(public readonly orderId: number) {
    super(`Order ${orderId} was not found`);
    this.name = "OrderNotFoundError";
  }
}

// An invariant: the request was fine, the CURRENT STATE of the order refuses it
export class InvalidTransitionError extends Error {
  constructor(
    public readonly from: string,
    public readonly to: string,
  ) {
    super(`An order cannot go from ${from} to ${to}`);
    this.name = "InvalidTransitionError";
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
