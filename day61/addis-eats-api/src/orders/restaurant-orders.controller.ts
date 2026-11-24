import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Page } from "../common/page.js";
import { ApiErrors } from "../common/swagger/api-errors.decorator.js";
import { ApiPaginatedResponse } from "../common/swagger/api-paginated-response.decorator.js";
import { FindOrdersQuery } from "./dto/find-orders.query.js";
import { OrderResponse } from "./dto/order.response.js";
import type { Order } from "./order.types.js";
import { OrdersService } from "./orders.service.js";

@ApiTags("restaurants", "orders")
@Controller("restaurants/:restaurantId/orders")
export class RestaurantOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @ApiOperation({
    summary: "List the orders of one restaurant",
    description: "Takes the same filters, sorting, paging and `fields` as the general order list. A restaurant that does not exist is a 404, never an empty page.",
  })
  @ApiPaginatedResponse(OrderResponse, "One page of that restaurant's orders")
  @ApiErrors({
    400: "The restaurant id is not a whole number, or a query parameter is not allowed.",
    404: "No restaurant has that id.",
  })
  findAll(
    @Param("restaurantId", ParseIntPipe) restaurantId: number,
    @Query() query: FindOrdersQuery,
  ): Page<Partial<Order>> {
    return this.orders.findByRestaurant(restaurantId, query);
  }
}
