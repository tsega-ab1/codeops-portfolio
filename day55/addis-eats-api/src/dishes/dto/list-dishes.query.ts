import { Type } from "class-transformer";
import { IsInt, IsOptional, Min } from "class-validator";

// The query string for GET /api/dishes: ?restaurantId=1 (optional)
export class ListDishesQuery {
  @IsOptional()
  @Type(() => Number) // query values arrive as strings; "1" becomes 1
  @IsInt()
  @Min(1)
  restaurantId?: number;
}
