import { IsIn } from "class-validator";
import { ORDER_STATUSES } from "../order.types.js";
import type { OrderStatus } from "../order.types.js";

// Body of PATCH /api/orders/:id/status  ->  { "status": "PREPARING" }
export class UpdateStatusDto {
  @IsIn(ORDER_STATUSES)
  status!: OrderStatus;
}
