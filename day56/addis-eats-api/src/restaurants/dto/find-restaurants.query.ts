import { Transform } from "class-transformer";
import { IsBoolean, IsIn, IsOptional } from "class-validator";
import { AREAS } from "../../common/area.js";
import type { Area } from "../../common/area.js";
import { PageQuery } from "../../common/page-query.js";

export const RESTAURANT_SORT_FIELDS = ["name", "area"] as const;
export type RestaurantSortField = (typeof RESTAURANT_SORT_FIELDS)[number];

export class FindRestaurantsQuery extends PageQuery {
  @IsOptional()
  @IsIn(AREAS)
  area?: Area;

  // NOT @Type(() => Boolean): Boolean("false") is true, so ?isOpen=false would show open ones
  @IsOptional()
  @Transform(({ value }) =>
    value === "true" ? true : value === "false" ? false : value,
  )
  @IsBoolean()
  isOpen?: boolean;

  @IsOptional()
  @IsIn(RESTAURANT_SORT_FIELDS)
  sort: RestaurantSortField = "name";
}
