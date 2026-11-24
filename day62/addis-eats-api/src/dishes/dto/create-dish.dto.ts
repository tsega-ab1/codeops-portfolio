import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsString, Min, Validate } from "class-validator";
import { IsSantimConstraint } from "../../common/validators/is-santim.constraint.js";

export class CreateDishDto {
  /** The dish's name as it appears on the menu. */
  @ApiProperty({ example: "Gomen" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  /** The price in whole santim, 1 to 10,000,000. 15000 is 150.00 ETB. */
  @ApiProperty({ example: 15000 })
  @Validate(IsSantimConstraint) // a whole number of santim, 1 to 10,000,000
  priceSantim!: number;

  /** The restaurant whose menu gets this dish. It must exist (404). */
  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  restaurantId!: number;
}
