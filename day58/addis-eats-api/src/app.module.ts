import { Module } from "@nestjs/common";
import { DishesModule } from "./dishes/dishes.module.js";
import { OrdersModule } from "./orders/orders.module.js";
import { RestaurantsModule } from "./restaurants/restaurants.module.js";

@Module({
  imports: [OrdersModule, RestaurantsModule, DishesModule],
})
export class AppModule {}
