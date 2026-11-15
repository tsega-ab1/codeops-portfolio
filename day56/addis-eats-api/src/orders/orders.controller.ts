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
} from "@nestjs/common";
import { PageQuery } from "../common/page-query.js";
import type { Page } from "../common/page.js";
import { CreateOrderDto } from "./dto/create-order.dto.js";
import { FindOrdersQuery } from "./dto/find-orders.query.js";
import { UpdateStatusDto } from "./dto/update-status.dto.js";
import type { Order } from "./order.types.js";
import { OrdersService } from "./orders.service.js";

@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  findAll(@Query() query: FindOrdersQuery): Page<Order> {
    return this.orders.findAll(query);
  }

  // STATIC routes go ABOVE ":id" - Nest matches in the order they are written here
  @Get("pending")
  findPending(@Query() query: PageQuery): Page<Order> {
    return this.orders.findPending(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number): Order {
    return this.orders.find(id);
  }

  @Post()
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
  @HttpCode(HttpStatus.NO_CONTENT) // 204: success with NO body, so return void
  cancel(@Param("id", ParseIntPipe) id: number): void {
    this.orders.cancel(id);
  }
}
