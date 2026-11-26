import { Public } from "../common/decorators/public.decorator.js";
import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Page } from "../common/page.js";
import { ApiErrors } from "../common/swagger/api-errors.decorator.js";
import { ApiPaginatedResponse } from "../common/swagger/api-paginated-response.decorator.js";
import { DishPageQuery } from "./dto/find-dishes.query.js";
import { DishResponse } from "./dto/dish.response.js";
import type { Dish } from "./dish.types.js";
import { DishesService } from "./dishes.service.js";

@ApiTags("restaurants", "dishes")
@Controller("restaurants/:restaurantId/dishes")
export class RestaurantDishesController {
  constructor(private readonly dishes: DishesService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: "List one restaurant's menu",
    description: "A restaurant that does not exist is a 404, never an empty page.",
  })
  @ApiPaginatedResponse(DishResponse, "One page of that restaurant's dishes")
  @ApiErrors({
    400: "The restaurant id is not a whole number, or a query parameter is not allowed.",
    404: "No restaurant has that id.",
  })
  findAll(
    @Param("restaurantId", ParseIntPipe) restaurantId: number,
    @Query() query: DishPageQuery,
  ): Page<Dish> {
    return this.dishes.findByRestaurant(restaurantId, query);
  }

  @Public()
  @Get(":dishId")
  @ApiOperation({
    summary: "Get one dish of one restaurant",
    description: "Both ids must be valid AND belong together: dish 3 is on restaurant 2's menu, so asking for it under restaurant 1 is a 404.",
  })
  @ApiOkResponse({ type: DishResponse })
  @ApiErrors({
    400: "An id is not a whole number.",
    404: "No such restaurant, or that dish is not on this restaurant's menu.",
  })
  findOne(
    @Param("restaurantId", ParseIntPipe) restaurantId: number,
    @Param("dishId", ParseIntPipe) dishId: number,
  ): Dish {
    return this.dishes.findOneOfRestaurant(restaurantId, dishId);
  }
}
