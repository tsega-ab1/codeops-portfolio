import { Module } from "@nestjs/common";
import { DishesModule } from "../dishes/dishes.module.js";
import { RestaurantsModule } from "../restaurants/restaurants.module.js";
import { OrderPolicy } from "../common/policies/order.policy.js";
import { DeliveryFeesController } from "./delivery-fees.controller.js";
import {
  InMemoryOrderRepository,
  ORDER_REPOSITORY,
} from "./order.repository.js";
import { OrdersController } from "./orders.controller.js";
import { OrdersService } from "./orders.service.js";
import { RestaurantOrdersController } from "./restaurant-orders.controller.js";

@Module({
  imports: [RestaurantsModule, DishesModule], // orders check their restaurant and their dishes
  controllers: [OrdersController, RestaurantOrdersController, DeliveryFeesController],
  providers: [
    OrdersService,
    OrderPolicy, // the guard on the routes needs it in THIS module
    { provide: ORDER_REPOSITORY, useClass: InMemoryOrderRepository },
  ],
})
export class OrdersModule {}
