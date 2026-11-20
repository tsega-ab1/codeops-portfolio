import { ApiProperty } from "@nestjs/swagger";

export class DishResponse {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1, description: "The restaurant whose menu this dish is on." })
  restaurantId!: number;

  @ApiProperty({ example: "Doro Wat" })
  name!: string;

  @ApiProperty({ example: 32000, description: "Whole santim. 32000 is 320.00 ETB." })
  priceSantim!: number;
}
