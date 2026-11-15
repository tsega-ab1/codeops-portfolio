import { IsIn, IsOptional } from "class-validator";
import { AREAS } from "../../common/area.js";
import type { Area } from "../../common/area.js";
import { PageQuery } from "../../common/page-query.js";
import { ORDER_STATUSES } from "../order.types.js";
import type { OrderStatus } from "../order.types.js";

export const ORDER_SORT_FIELDS = ["id", "customer", "area", "totalSantim"] as const;
export type OrderSortField = (typeof ORDER_SORT_FIELDS)[number];

// ?status=PENDING&area=Bole&limit=5&offset=5&sort=totalSantim
export class FindOrdersQuery extends PageQuery {
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: OrderStatus;

  @IsOptional()
  @IsIn(AREAS)
  area?: Area;

  @IsOptional()
  @IsIn(ORDER_SORT_FIELDS)
  sort: OrderSortField = "id";
}
