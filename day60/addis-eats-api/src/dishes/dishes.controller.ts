import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseInterceptors,
} from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { LocationInterceptor } from "../common/location.interceptor.js";
import type { Page } from "../common/page.js";
import { ApiErrors } from "../common/swagger/api-errors.decorator.js";
import { ApiPaginatedResponse } from "../common/swagger/api-paginated-response.decorator.js";
import { CreateDishDto } from "./dto/create-dish.dto.js";
import { DishResponse } from "./dto/dish.response.js";
import { FindDishesQuery } from "./dto/find-dishes.query.js";
import type { Dish } from "./dish.types.js";
import { DishesService } from "./dishes.service.js";

@ApiTags("dishes")
@Controller("dishes")
export class DishesController {
  constructor(private readonly dishes: DishesService) {}

  @Get()
  @ApiOperation({
    summary: "List dishes across all menus, searched, sorted and paged",
    description: "Prices are whole santim. Use `restaurantId` to see one menu.",
  })
  @ApiPaginatedResponse(DishResponse, "One page of dishes")
  @ApiErrors({ 400: "A query parameter is not allowed: limit over 50, restaurantId that is not a whole number, an unknown sort field." })
  findAll(@Query() query: FindDishesQuery): Page<Dish> {
    return this.dishes.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one dish by id" })
  @ApiOkResponse({ type: DishResponse })
  @ApiErrors({ 400: "The id is not a whole number.", 404: "No dish has that id." })
  findOne(@Param("id", ParseIntPipe) id: number): Dish {
    return this.dishes.findOne(id);
  }

  @Post() // 201 + a Location header pointing at the new dish
  @UseInterceptors(LocationInterceptor)
  @ApiOperation({ summary: "Add a dish to a restaurant's menu" })
  @ApiCreatedResponse({
    type: DishResponse,
    description: "The dish was created. The Location header points at it.",
    headers: { Location: { description: "Where the new dish lives, for example /api/v1/dishes/9", schema: { type: "string" } } },
  })
  @ApiErrors({
    400: "Validation failed: a field is missing or malformed, the price is not a whole number of santim between 1 and 10,000,000, or an undeclared field was sent.",
    404: "The restaurant does not exist.",
  })
  create(@Body() dto: CreateDishDto): Dish {
    return this.dishes.create(dto);
  }
}
