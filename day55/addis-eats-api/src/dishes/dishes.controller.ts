import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from "@nestjs/common";
import { CreateDishDto } from "./dto/create-dish.dto.js";
import { ListDishesQuery } from "./dto/list-dishes.query.js";
import type { Dish } from "./dish.types.js";
import { DishesService } from "./dishes.service.js";

@Controller("dishes")
export class DishesController {
  constructor(private readonly dishes: DishesService) {}

  @Get()
  findAll(@Query() query: ListDishesQuery): Dish[] {
    return this.dishes.findAll(query.restaurantId);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number): Dish {
    return this.dishes.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDishDto): Dish {
    return this.dishes.create(dto);
  }
}
