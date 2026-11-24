import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AREAS, ORDER_STATUSES, PAYMENT_METHODS } from "../order.types.js";

export class OrderItemResponse {
  @ApiProperty({ example: "Doro Wat" })
  name!: string;

  @ApiProperty({ example: 32000, description: "Whole santim. 32000 is 320.00 ETB." })
  priceSantim!: number;
}

export class OrderResponse {
  @ApiProperty({ example: 15 })
  id!: number;

  @ApiProperty({ example: "Almaz Bekele" })
  customer!: string;

  @ApiProperty({ enum: AREAS, example: "Bole", description: "The delivery area." })
  area!: string;

  @ApiProperty({ enum: ORDER_STATUSES, example: "PENDING" })
  status!: string;

  @ApiProperty({ example: 1, description: "The restaurant cooking the order." })
  restaurantId!: number;

  @ApiProperty({ enum: PAYMENT_METHODS, example: "TELEBIRR" })
  paymentMethod!: string;

  @ApiProperty({ type: [OrderItemResponse], description: "One entry per unit ordered: two lines of Doro Wat appear twice." })
  dishes!: OrderItemResponse[];

  @ApiPropertyOptional({ example: "0912345678", description: "The TeleBirr number the customer gave, if any." })
  telebirrPhone?: string;

  @ApiProperty({ example: 64000, description: "Whole santim, computed by the server from the dishes. 64000 is 640.00 ETB." })
  totalSantim!: number;
}
