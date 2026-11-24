import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiBearerAuth,
  ApiTags,
} from "@nestjs/swagger";
import { Roles } from "../common/decorators/roles.decorator.js";
import { LocationInterceptor } from "../common/location.interceptor.js";
import type { Page } from "../common/page.js";
import { ApiErrors } from "../common/swagger/api-errors.decorator.js";
import { ApiPaginatedResponse } from "../common/swagger/api-paginated-response.decorator.js";
import { CreateOrderDto } from "./dto/create-order.dto.js";
import { FindOrdersQuery } from "./dto/find-orders.query.js";
import { OrderResponse } from "./dto/order.response.js";
import { UpdateStatusDto } from "./dto/update-status.dto.js";
import type { Order } from "./order.types.js";
import { OrdersService } from "./orders.service.js";

@ApiTags("orders")
@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @ApiOperation({
    summary: "List orders, filtered, sorted and paged",
    description:
      "Filter by status and area (several values each), sort by one or more fields, page with limit and offset, " +
      "and shrink the response with `fields`. `total` counts every match, before paging.",
  })
  @ApiPaginatedResponse(OrderResponse, "One page of orders")
  @ApiErrors({ 400: "A query parameter is not allowed: limit over 50, an unknown status, area, sort field or field name." })
  findAll(@Query() query: FindOrdersQuery): Page<Partial<Order>> {
    return this.orders.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one order by id" })
  @ApiOkResponse({ type: OrderResponse })
  @ApiErrors({ 400: "The id is not a whole number.", 404: "No order has that id." })
  findOne(@Param("id", ParseIntPipe) id: number): Order {
    return this.orders.find(id);
  }

  @Post() // 201 + a Location header pointing at the new order
  @UseInterceptors(LocationInterceptor)
  @ApiOperation({
    summary: "Place an order",
    description:
      "Send the lines, not a total: the server prices the order from the menu. " +
      "The checks run in a fixed order: the restaurant exists (404), it is open (409), every dish is on its menu (422), " +
      "then the order is priced and saved.",
  })
  @ApiCreatedResponse({
    type: OrderResponse,
    description: "The order was created. The Location header points at it.",
    headers: { Location: { description: "Where the new order lives, for example /api/v1/orders/15", schema: { type: "string" } } },
  })
  @ApiErrors({
    400: "Validation failed: a field is missing or malformed, an undeclared field was sent (including totalSantim), lines is empty, or paymentMethod is TELEBIRR without a phone.",
    404: "The restaurant does not exist.",
    409: "The restaurant is closed and is not taking orders.",
    422: "A dish in the lines is not on that restaurant's menu.",
  })
  create(@Body() dto: CreateOrderDto): Order {
    return this.orders.create(dto);
  }

  @Patch(":id/status")
  @Roles("staff") // customers place orders; only staff move them along
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Move an order to its next status (staff only)",
    description:
      "Only legal moves are accepted: PENDING to PREPARING or CANCELLED, PREPARING to ON_THE_WAY or CANCELLED, " +
      "ON_THE_WAY to DELIVERED. DELIVERED and CANCELLED are final.",
  })
  @ApiOkResponse({ type: OrderResponse })
  @ApiErrors({
    400: "The id is not a whole number, or status is not one of the five statuses.",
    401: "Missing, invalid or expired access token.",
    403: "The key is wrong, or it belongs to a caller who is not staff.",
    404: "No order has that id.",
    409: "The order's current status does not allow that move.",
  })
  updateStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ): Order {
    return this.orders.updateStatus(id, dto.status);
  }

  @Delete(":id")
  @Roles("staff")
  @ApiBearerAuth("bearer")
  @HttpCode(HttpStatus.NO_CONTENT) // 204 every time, even on a repeat call
  @ApiOperation({
    summary: "Cancel (delete) an order (staff only)",
    description: "Idempotent: deleting an order that is already gone, or never existed, is still a 204.",
  })
  @ApiNoContentResponse({ description: "Done. The body is empty." })
  @ApiErrors({
    400: "The id is not a whole number.",
    401: "Missing, invalid or expired access token.",
    403: "The key is wrong, or it belongs to a caller who is not staff.",
  })
  cancel(@Param("id", ParseIntPipe) id: number): void {
    this.orders.cancel(id);
  }
}
