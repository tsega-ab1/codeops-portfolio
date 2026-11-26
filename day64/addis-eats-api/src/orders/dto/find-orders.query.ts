import { IsIn, IsOptional } from "class-validator";
import { AREAS } from "../../common/area.js";
import type { Area } from "../../common/area.js";
import { PageQuery } from "../../common/page-query.js";
import { CsvList, SortList } from "../../common/query-helpers.js";
import { ORDER_STATUSES } from "../order.types.js";
import type { OrderStatus } from "../order.types.js";

export const ORDER_SORT_FIELDS = ["id", "customer", "area", "totalSantim"] as const;
export const ORDER_FIELDS = [
  "id",
  "customer",
  "area",
  "status",
  "restaurantId",
  "paymentMethod",
  "dishes",
  "telebirrPhone",
  "totalSantim",
] as const;
export type OrderField = (typeof ORDER_FIELDS)[number];

// ?status=PENDING,PREPARING&area=Bole&sort=area,-totalSantim&fields=id,status&limit=5
export class FindOrdersQuery extends PageQuery {
  /** Only these statuses, several allowed: `PENDING,PREPARING`. */
  @IsOptional()
  @CsvList()
  @IsIn(ORDER_STATUSES, { each: true })
  status?: OrderStatus[];

  /** Only these delivery areas, several allowed: `Bole,Piassa`. */
  @IsOptional()
  @CsvList()
  @IsIn(AREAS, { each: true })
  area?: Area[];

  /** Sort by id, customer, area or totalSantim. A leading minus means descending, several allowed: `area,-totalSantim`. */
  @SortList(ORDER_SORT_FIELDS)
  sort: string = "id";

  /** Keep only these keys of each order, to shrink the response: `id,status,totalSantim`. */
  @IsOptional()
  @CsvList()
  @IsIn(ORDER_FIELDS, { each: true })
  fields?: OrderField[];
}
