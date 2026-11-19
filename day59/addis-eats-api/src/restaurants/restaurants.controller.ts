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
import { LocationInterceptor } from "../common/location.interceptor.js";
import type { Page } from "../common/page.js";
import { CreateRestaurantDto } from "./dto/create-restaurant.dto.js";
import { FindRestaurantsQuery } from "./dto/find-restaurants.query.js";
import type { Restaurant } from "./restaurant.types.js";
import { RestaurantsService } from "./restaurants.service.js";

@Controller("restaurants")
export class RestaurantsController {
  constructor(private readonly restaurants: RestaurantsService) {}

  // "open" is a filter, so it is ?isOpen=true now (see docs/api-audit.md)
  @Get()
  findAll(@Query() query: FindRestaurantsQuery): Page<Restaurant> {
    return this.restaurants.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number): Restaurant {
    return this.restaurants.findOne(id);
  }

  @Post() // 201 + a Location header pointing at the new restaurant
  @UseInterceptors(LocationInterceptor)
  create(@Body() dto: CreateRestaurantDto): Restaurant {
    return this.restaurants.create(dto);
  }
}
