export class RestaurantNotFoundError extends Error {
  constructor(public readonly restaurantId: number) {
    super(`Restaurant ${restaurantId} was not found`);
    this.name = "RestaurantNotFoundError";
  }
}

export class RestaurantClosedError extends Error {
  constructor(public readonly restaurantId: number) {
    super(`Restaurant ${restaurantId} is closed and is not taking orders`);
    this.name = "RestaurantClosedError";
  }
}
