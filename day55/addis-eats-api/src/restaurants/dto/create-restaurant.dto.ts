import { IsBoolean, IsIn, IsOptional, IsString, Length } from "class-validator";
import { AREAS } from "../../common/area.js";
import type { Area } from "../../common/area.js";

export class CreateRestaurantDto {
  @IsString()
  @Length(2, 80)
  name!: string;

  @IsIn(AREAS)
  area!: Area;

  @IsBoolean()
  @IsOptional()
  isOpen?: boolean;
}
