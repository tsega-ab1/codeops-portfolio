import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsIn, IsOptional, IsString, Length } from "class-validator";
import { AREAS } from "../../common/area.js";
import type { Area } from "../../common/area.js";

export class CreateRestaurantDto {
  /** The restaurant's name, 2 to 80 characters. */
  @ApiProperty({ example: "Sishu" })
  @IsString()
  @Length(2, 80)
  name!: string;

  /** The area the restaurant is in. */
  @ApiProperty({ enum: AREAS, example: "Kazanchis" })
  @IsIn(AREAS)
  area!: Area;

  /** Whether it is taking orders right now. Defaults to true. */
  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isOpen?: boolean;
}
