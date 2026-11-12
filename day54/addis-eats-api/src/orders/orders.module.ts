import { Module } from "@nestjs/common";
import {
  InMemoryOrderRepository,
  ORDER_REPOSITORY,
} from "./order.repository.js";
import { OrdersController } from "./orders.controller.js";
import { OrdersService } from "./orders.service.js";

@Module({
  controllers: [OrdersController],
  providers: [
    OrdersService,
    { provide: ORDER_REPOSITORY, useClass: InMemoryOrderRepository },
  ],
})
export class OrdersModule {}
