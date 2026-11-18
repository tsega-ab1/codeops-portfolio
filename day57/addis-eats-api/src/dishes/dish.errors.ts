export class DishNotFoundError extends Error {
  constructor(public readonly dishId: number) {
    super(`Dish ${dishId} was not found`);
    this.name = "DishNotFoundError";
  }
}

// Moved to the restaurants folder because orders use it too; re-exported so dishes keep working
export { UnknownRestaurantError } from "../restaurants/restaurant.errors.js";
