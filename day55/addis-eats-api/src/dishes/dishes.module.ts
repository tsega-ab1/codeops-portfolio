import { Module } from "@nestjs/common";
import { RestaurantsModule } from "../restaurants/restaurants.module.js";
import { RestaurantsService } from "../restaurants/restaurants.service.js";
import { DishesController } from "./dishes.controller.js";
import { DISH_REPOSITORY, InMemoryDishRepository } from "./dishes.repository.js";
import type { DishRepository } from "./dishes.repository.js";
import { DishesService } from "./dishes.service.js";

@Module({
  imports: [RestaurantsModule], // gives us RestaurantsService (it is exported)
  controllers: [DishesController],
  providers: [
    { provide: DISH_REPOSITORY, useClass: InMemoryDishRepository },
    {
      provide: DishesService,
      useFactory: (repo: DishRepository, restaurants: RestaurantsService) =>
        new DishesService(repo, restaurants),
      inject: [DISH_REPOSITORY, RestaurantsService],
    },
  ],
})
export class DishesModule {}
