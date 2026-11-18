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
import { LocationInterceptor } from "../common/location.interceptor.js";
import type { Page } from "../common/page.js";
import { CreateOrderDto } from "./dto/create-order.dto.js";
import { FindOrdersQuery } from "./dto/find-orders.query.js";
import { UpdateStatusDto } from "./dto/update-status.dto.js";
import type { Order } from "./order.types.js";
import { OrdersService } from "./orders.service.js";

@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  // "pending" is a filter, so it is ?status=PENDING now (see docs/api-audit.md)
  @Get()
  findAll(@Query() query: FindOrdersQuery): Page<Partial<Order>> {
    return this.orders.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number): Order {
    return this.orders.find(id);
  }

  @Post() // 201 + a Location header pointing at the new order
  @UseInterceptors(LocationInterceptor)
  create(@Body() dto: CreateOrderDto): Order {
    return this.orders.create(dto);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ): Order {
    return this.orders.updateStatus(id, dto.status);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT) // 204 every time, even on a repeat call
  cancel(@Param("id", ParseIntPipe) id: number): void {
    this.orders.cancel(id);
  }
}
