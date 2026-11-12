import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from "@nestjs/common";
import type { Area } from "../common/area.js";
import { CreateRestaurantDto } from "./dto/create-restaurant.dto.js";
import type { Restaurant } from "./restaurant.types.js";
import { RestaurantsService } from "./restaurants.service.js";

@Controller("restaurants")
export class RestaurantsController {
  constructor(private readonly restaurants: RestaurantsService) {}

  @Get()
  findAll(@Query("area") area?: Area): Restaurant[] {
    return this.restaurants.findAll(area);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number): Restaurant {
    return this.restaurants.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateRestaurantDto): Restaurant {
    return this.restaurants.create(dto);
  }
}
