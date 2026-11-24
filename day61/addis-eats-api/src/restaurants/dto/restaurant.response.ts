import { ApiProperty } from "@nestjs/swagger";
import { AREAS } from "../../common/area.js";

export class RestaurantResponse {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: "Yod Abyssinia" })
  name!: string;

  @ApiProperty({ enum: AREAS, example: "Bole" })
  area!: string;

  @ApiProperty({ example: true, description: "Closed restaurants still appear in lists. Check this before offering a menu: placing an order with a closed restaurant answers 409." })
  isOpen!: boolean;
}
