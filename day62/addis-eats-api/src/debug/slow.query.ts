import { Type } from "class-transformer";
import { IsInt, Max, Min } from "class-validator";

export class SlowQuery {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  ms: number = 1000;
}
