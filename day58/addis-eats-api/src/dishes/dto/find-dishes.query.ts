import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min, MaxLength } from "class-validator";
import { PageQuery } from "../../common/page-query.js";
import { SortList } from "../../common/query-helpers.js";

export const DISH_SORT_FIELDS = ["name", "priceSantim"] as const;

// For GET /api/v1/restaurants/:id/dishes - the restaurant is already in the path
export class DishPageQuery extends PageQuery {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  q?: string;

  @SortList(DISH_SORT_FIELDS)
  sort: string = "name";
}

// For GET /api/v1/dishes - may also filter by restaurant
export class FindDishesQuery extends DishPageQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  restaurantId?: number;
}
