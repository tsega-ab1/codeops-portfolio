export class DishNotFoundError extends Error {
  constructor(public readonly dishId: number) {
    super(`Dish ${dishId} was not found`);
    this.name = "DishNotFoundError";
  }
}

// The request body points at a restaurant that does not exist
export class UnknownRestaurantError extends Error {
  constructor(public readonly restaurantId: number) {
    super(`restaurantId ${restaurantId} does not match any restaurant`);
    this.name = "UnknownRestaurantError";
  }
}
