import { Transform } from "class-transformer";
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { AREAS } from "../../common/area.js";
import type { Area } from "../../common/area.js";
import { PageQuery } from "../../common/page-query.js";
import { CsvList, SortList } from "../../common/query-helpers.js";

export const RESTAURANT_SORT_FIELDS = ["name", "area"] as const;

// ?area=Bole,Piassa&isOpen=true&q=abyssinia&sort=-name
export class FindRestaurantsQuery extends PageQuery {
  @IsOptional()
  @CsvList()
  @IsIn(AREAS, { each: true })
  area?: Area[];

  // NOT @Type(() => Boolean): Boolean("false") is true, so ?isOpen=false would show open ones
  @IsOptional()
  @Transform(({ value }) =>
    value === "true" ? true : value === "false" ? false : value,
  )
  @IsBoolean()
  isOpen?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  q?: string;

  @SortList(RESTAURANT_SORT_FIELDS)
  sort: string = "name";
}
