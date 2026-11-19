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
import { Roles } from "../common/decorators/roles.decorator.js";
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
  @Roles("staff") // customers place orders; only staff move them along
  updateStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ): Order {
    return this.orders.updateStatus(id, dto.status);
  }

  @Delete(":id")
  @Roles("staff")
  @HttpCode(HttpStatus.NO_CONTENT) // 204 every time, even on a repeat call
  cancel(@Param("id", ParseIntPipe) id: number): void {
    this.orders.cancel(id);
  }
}
