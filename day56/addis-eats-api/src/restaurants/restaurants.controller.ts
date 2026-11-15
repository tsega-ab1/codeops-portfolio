import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from "@nestjs/common";
import { PageQuery } from "../common/page-query.js";
import type { Page } from "../common/page.js";
import { CreateRestaurantDto } from "./dto/create-restaurant.dto.js";
import { FindRestaurantsQuery } from "./dto/find-restaurants.query.js";
import type { Restaurant } from "./restaurant.types.js";
import { RestaurantsService } from "./restaurants.service.js";

@Controller("restaurants")
export class RestaurantsController {
  constructor(private readonly restaurants: RestaurantsService) {}

  @Get()
  findAll(@Query() query: FindRestaurantsQuery): Page<Restaurant> {
    return this.restaurants.findAll(query);
  }

  // STATIC routes go ABOVE ":id" - Nest matches in the order they are written here
  @Get("open")
  findOpen(@Query() query: PageQuery): Page<Restaurant> {
    return this.restaurants.findOpen(query);
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
