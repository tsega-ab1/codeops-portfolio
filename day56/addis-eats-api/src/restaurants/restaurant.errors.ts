export class RestaurantNotFoundError extends Error {
  constructor(public readonly restaurantId: number) {
    super(`Restaurant ${restaurantId} was not found`);
    this.name = "RestaurantNotFoundError";
  }
}

// A request BODY points at a restaurant that does not exist (dishes and orders use this)
export class UnknownRestaurantError extends Error {
  constructor(public readonly restaurantId: number) {
    super(`restaurantId ${restaurantId} does not match any restaurant`);
    this.name = "UnknownRestaurantError";
  }
}
