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
import type { AuthenticatedUser } from "../common/auth/auth.types.js";
import { CheckPolicy } from "../common/decorators/check-policy.decorator.js";
import { CurrentOrder } from "../common/decorators/current-order.decorator.js";
import { CurrentUser } from "../common/decorators/current-user.decorator.js";
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

@ApiBearerAuth("bearer") // every order route needs a token: say so once, for the whole controller
@ApiTags("orders")
@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @ApiOperation({
    summary: "List the orders you may read, filtered, sorted and paged",
    description:
      "Staff see every order; a customer sees the orders they placed; a courier sees the orders assigned to them. Filter by status and area (several values each), sort by one or more fields, page with limit and offset, " +
      "and shrink the response with `fields`. `total` counts every match, before paging.",
  })
  @ApiPaginatedResponse(OrderResponse, "One page of orders")
  @ApiErrors({
    400: "A query parameter is not allowed: limit over 50, an unknown status, area, sort field or field name.",
    401: "Missing, invalid or expired access token.",
  })
  findAll(@Query() query: FindOrdersQuery, @CurrentUser() user: AuthenticatedUser): Page<Partial<Order>> {
    return this.orders.findAll(query, user);
  }

  @Get(":id")
  @CheckPolicy("read") // the guard loads the order and decides who may see it
  @ApiOperation({ summary: "Get one order by id" })
  @ApiOkResponse({ type: OrderResponse })
  @ApiErrors({
    400: "The id is not a whole number.",
    401: "Missing, invalid or expired access token.",
    404: "No order has that id, or it is not yours to see. The two answers are identical on purpose.",
  })
  findOne(@Param("id", ParseIntPipe) _id: number, @CurrentOrder() order: Order): Order {
    return order; // already loaded and checked by the guard
  }

  @Post() // 201 + a Location header pointing at the new order
  @UseInterceptors(LocationInterceptor)
  @ApiOperation({
    summary: "Place an order",
    description:
      "Send the lines, not a total: the server prices the order from the menu, and records you as its owner. " +
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
    401: "Missing, invalid or expired access token.",
    404: "The restaurant does not exist.",
    409: "The restaurant is closed and is not taking orders.",
    422: "A dish in the lines is not on that restaurant's menu.",
  })
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: AuthenticatedUser): Order {
    return this.orders.create(dto, user);
  }

  @Patch(":id/status")
  @Roles("courier", "staff") // the ROLE gate: customers and restaurants stop here
  @CheckPolicy("updateStatus") // the POLICY gate: a courier only for an order assigned to them
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Move an order to its next status (staff, or the courier it is assigned to)",
    description:
      "Only legal moves are accepted: PENDING to PREPARING or CANCELLED, PREPARING to ON_THE_WAY or CANCELLED, " +
      "ON_THE_WAY to DELIVERED. DELIVERED and CANCELLED are final.",
  })
  @ApiOkResponse({ type: OrderResponse })
  @ApiErrors({
    400: "The id is not a whole number, or status is not one of the five statuses.",
    401: "Missing, invalid or expired access token.",
    403: "The caller is not staff or a courier, or the order is visible to them but not theirs to move or in a state they may not move it from.",
    404: "No order has that id, or it is not yours to see.",
    409: "The order's current status does not allow that move.",
  })
  updateStatus(
    @Param("id", ParseIntPipe) _id: number,
    @Body() dto: UpdateStatusDto,
    @CurrentOrder() order: Order,
  ): Order {
    return this.orders.updateStatus(order.id, dto.status);
  }

  @Delete(":id")
  @CheckPolicy("cancel") // staff always; a customer only for their own order, only while it is PENDING
  @ApiBearerAuth("bearer")
  @HttpCode(HttpStatus.NO_CONTENT) // 204 every time, even on a repeat call
  @ApiOperation({
    summary: "Cancel (delete) an order (staff, or its owner while it is PENDING)",
    description: "Idempotent for staff: deleting an order that is already gone, or never existed, is still a 204.",
  })
  @ApiNoContentResponse({ description: "Done. The body is empty." })
  @ApiErrors({
    400: "The id is not a whole number.",
    401: "Missing, invalid or expired access token.",
    403: "The order is yours to see, but not to cancel: it is no longer PENDING, or you are its courier.",
    404: "No order has that id, or it is not yours to see.",
  })
  cancel(@Param("id", ParseIntPipe) id: number): void {
    this.orders.cancel(id);
  }
}
