import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from "@nestjs/common";
import type { Page } from "../common/page.js";
import { CreateDishDto } from "./dto/create-dish.dto.js";
import { FindDishesQuery } from "./dto/find-dishes.query.js";
import type { Dish } from "./dish.types.js";
import { DishesService } from "./dishes.service.js";

@Controller("dishes")
export class DishesController {
  constructor(private readonly dishes: DishesService) {}

  @Get()
  findAll(@Query() query: FindDishesQuery): Page<Dish> {
    return this.dishes.findAll(query);
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
