import { Module } from "@nestjs/common";
import {
  InMemoryRestaurantRepository,
  RESTAURANT_REPOSITORY,
} from "./restaurants.repository.js";
import { RestaurantsController } from "./restaurants.controller.js";
import { RestaurantsService } from "./restaurants.service.js";

@Module({
  controllers: [RestaurantsController],
  providers: [
    RestaurantsService,
    { provide: RESTAURANT_REPOSITORY, useClass: InMemoryRestaurantRepository },
  ],
  exports: [RestaurantsService], // lent to the dishes module
})
export class RestaurantsModule {}
