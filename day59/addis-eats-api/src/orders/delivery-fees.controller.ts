import { Controller, Get, Query } from "@nestjs/common";
import type { Area } from "../common/area.js";
import { ParseAreaPipe } from "../common/pipes/parse-area.pipe.js";
import { OrdersService } from "./orders.service.js";

@Controller("delivery-fees")
export class DeliveryFeesController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  find(
    @Query("area", ParseAreaPipe) area: Area,
  ): { area: Area; feeSantim: number } {
    return { area, feeSantim: this.orders.feesByArea()[area] };
  }
}
