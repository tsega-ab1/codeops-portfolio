import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";
import { CreateOrderDto } from "./dto/create-order.dto.js";
import type { Order } from "./order.types.js";
import { OrdersService } from "./orders.service.js";

@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  findAll(): Order[] {
    return this.orders.findAll();
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number): Order {
    return this.orders.find(id);
  }

  @Post()
  create(@Body() dto: CreateOrderDto): Order {
    return this.orders.create(dto);
  }
}
