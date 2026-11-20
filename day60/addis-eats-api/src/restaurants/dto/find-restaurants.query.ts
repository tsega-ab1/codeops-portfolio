import { Transform } from "class-transformer";
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { AREAS } from "../../common/area.js";
import type { Area } from "../../common/area.js";
import { PageQuery } from "../../common/page-query.js";
import { CsvList, SortList } from "../../common/query-helpers.js";

export const RESTAURANT_SORT_FIELDS = ["name", "area"] as const;

// ?area=Bole,Piassa&isOpen=true&q=abyssinia&sort=-name
export class FindRestaurantsQuery extends PageQuery {
  /** Only restaurants in these areas, several allowed: `Bole,Piassa`. */
  @IsOptional()
  @CsvList()
  @IsIn(AREAS, { each: true })
  area?: Area[];

  /** `true` for restaurants taking orders now, `false` for closed ones. */
  // NOT @Type(() => Boolean): Boolean("false") is true, so ?isOpen=false would show open ones
  @IsOptional()
  @Transform(({ value }) =>
    value === "true" ? true : value === "false" ? false : value,
  )
  @IsBoolean()
  isOpen?: boolean;

  /** Text to look for in the name, case-insensitive: `abyss`. */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  q?: string;

  /** Sort by name or area. A leading minus means descending: `-name`. */
  @SortList(RESTAURANT_SORT_FIELDS)
  sort: string = "name";
}
