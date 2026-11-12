export class RestaurantNotFoundError extends Error {
  constructor(public readonly restaurantId: number) {
    super(`Restaurant ${restaurantId} was not found`);
    this.name = "RestaurantNotFoundError";
  }
}
