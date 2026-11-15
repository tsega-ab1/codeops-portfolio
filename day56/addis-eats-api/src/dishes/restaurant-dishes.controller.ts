import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import type { Page } from "../common/page.js";
import { DishPageQuery } from "./dto/find-dishes.query.js";
import type { Dish } from "./dish.types.js";
import { DishesService } from "./dishes.service.js";

@Controller("restaurants/:restaurantId/dishes")
export class RestaurantDishesController {
  constructor(private readonly dishes: DishesService) {}

  @Get()
  findAll(
    @Param("restaurantId", ParseIntPipe) restaurantId: number,
    @Query() query: DishPageQuery,
  ): Page<Dish> {
    return this.dishes.findByRestaurant(restaurantId, query);
  }

  @Get(":dishId")
  findOne(
    @Param("restaurantId", ParseIntPipe) restaurantId: number,
    @Param("dishId", ParseIntPipe) dishId: number,
  ): Dish {
    return this.dishes.findOneOfRestaurant(restaurantId, dishId);
  }
}
