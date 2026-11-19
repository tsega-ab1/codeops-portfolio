import { IsInt, IsNotEmpty, IsString, Min, Validate } from "class-validator";
import { IsSantimConstraint } from "../../common/validators/is-santim.constraint.js";

export class CreateDishDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Validate(IsSantimConstraint) // a whole number of santim, 1 to 10,000,000
  priceSantim!: number;

  @IsInt()
  @Min(1)
  restaurantId!: number;
}
