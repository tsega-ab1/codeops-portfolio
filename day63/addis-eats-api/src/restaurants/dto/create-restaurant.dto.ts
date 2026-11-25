import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsIn, IsOptional, IsString, Length, Matches } from "class-validator";
import { NAME_MESSAGE, NAME_PATTERN } from "../../common/validators/name.pattern.js";
import { AREAS } from "../../common/area.js";
import type { Area } from "../../common/area.js";

export class CreateRestaurantDto {
  /** The restaurant's name, 2 to 80 characters. */
  @ApiProperty({ example: "Sishu" })
  @IsString()
  @Length(2, 80)
  @Matches(NAME_PATTERN, { message: `name ${NAME_MESSAGE}` })
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
