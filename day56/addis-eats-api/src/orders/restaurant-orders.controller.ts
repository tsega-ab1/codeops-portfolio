import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import type { Page } from "../common/page.js";
import { FindOrdersQuery } from "./dto/find-orders.query.js";
import type { Order } from "./order.types.js";
import { OrdersService } from "./orders.service.js";

@Controller("restaurants/:restaurantId/orders")
export class RestaurantOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  findAll(
    @Param("restaurantId", ParseIntPipe) restaurantId: number,
    @Query() query: FindOrdersQuery,
  ): Page<Order> {
    return this.orders.findByRestaurant(restaurantId, query);
  }
}
