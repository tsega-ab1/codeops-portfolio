import { Module } from "@nestjs/common";
import { ImageService } from "../common/images/image.service.js";
import { MenuPolicy } from "../common/policies/menu.policy.js";
import { RestaurantsModule } from "../restaurants/restaurants.module.js";
import { RestaurantsService } from "../restaurants/restaurants.service.js";
import { DishesController } from "./dishes.controller.js";
import { DISH_REPOSITORY, InMemoryDishRepository } from "./dishes.repository.js";
import type { DishRepository } from "./dishes.repository.js";
import { DishesService } from "./dishes.service.js";
import { RestaurantDishesController } from "./restaurant-dishes.controller.js";

@Module({
  imports: [RestaurantsModule], // gives us RestaurantsService (it is exported)
  controllers: [DishesController, RestaurantDishesController],
  providers: [
    { provide: DISH_REPOSITORY, useClass: InMemoryDishRepository },
    {
      provide: DishesService,
      useFactory: (repo: DishRepository, restaurants: RestaurantsService, images: ImageService) =>
        new DishesService(repo, restaurants, images),
      inject: [DISH_REPOSITORY, RestaurantsService, ImageService],
    },
    MenuPolicy,
  ],
  exports: [DishesService], // lent to the orders module
})
export class DishesModule {}
