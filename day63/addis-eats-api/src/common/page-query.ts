import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

// The query-string part every collection shares: ?limit=10&offset=20
export class PageQuery {
  /** How many items to return, 1 to 50. */
  @IsOptional()
  @Type(() => Number) // "10" arrives as a string; this turns it into 10
  @IsInt()
  @Min(1)
  @Max(50) // a real defence: ?limit=1000000 would serialise the whole store
  limit: number = 20;

  /** How many items to skip, for the next page. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;
}
