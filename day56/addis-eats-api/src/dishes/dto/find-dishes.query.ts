import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Min } from "class-validator";
import { PageQuery } from "../../common/page-query.js";

export const DISH_SORT_FIELDS = ["name", "priceSantim"] as const;
export type DishSortField = (typeof DISH_SORT_FIELDS)[number];

// For GET /api/restaurants/:id/dishes - the restaurant is already in the path
export class DishPageQuery extends PageQuery {
  @IsOptional()
  @IsIn(DISH_SORT_FIELDS)
  sort: DishSortField = "name";
}

// For GET /api/dishes - may also filter by restaurant
export class FindDishesQuery extends DishPageQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  restaurantId?: number;
}
