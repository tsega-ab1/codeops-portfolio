export class DishNotFoundError extends Error {
  constructor(public readonly dishId: number) {
    super(`Dish ${dishId} was not found`);
    this.name = "DishNotFoundError";
  }
}

// A relationship rule: every dish in an order must be on THAT restaurant's menu
export class DishNotOnMenuError extends Error {
  constructor(
    public readonly restaurantId: number,
    public readonly dishIds: number[],
  ) {
    super(
      `Dish ${dishIds.join(", ")} is not on the menu of restaurant ${restaurantId}`,
    );
    this.name = "DishNotOnMenuError";
  }
}
