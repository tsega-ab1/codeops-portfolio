import { ApiProperty } from "@nestjs/swagger";
import { AREAS } from "../order.types.js";

export class DeliveryFeeResponse {
  @ApiProperty({ enum: AREAS, example: "Bole", description: "The area in its canonical spelling, whatever letter case was sent." })
  area!: string;

  @ApiProperty({ example: 4000, description: "Whole santim. 4000 is 40.00 ETB." })
  feeSantim!: number;
}
