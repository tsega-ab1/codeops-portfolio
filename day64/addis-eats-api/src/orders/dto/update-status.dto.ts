import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";
import { ORDER_STATUSES } from "../order.types.js";
import type { OrderStatus } from "../order.types.js";

// Body of PATCH /api/v1/orders/:id/status  ->  { "status": "PREPARING" }
export class UpdateStatusDto {
  /** The status to move to. Only legal moves are accepted, anything else is a 409. */
  @ApiProperty({ enum: ORDER_STATUSES, example: "PREPARING" })
  @IsIn(ORDER_STATUSES)
  status!: OrderStatus;
}
