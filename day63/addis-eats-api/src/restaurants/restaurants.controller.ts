import { Public } from "../common/decorators/public.decorator.js";
import { Roles } from "../common/decorators/roles.decorator.js";
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
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { LocationInterceptor } from "../common/location.interceptor.js";
import type { Page } from "../common/page.js";
import { ApiErrors } from "../common/swagger/api-errors.decorator.js";
import { ApiPaginatedResponse } from "../common/swagger/api-paginated-response.decorator.js";
import { CreateRestaurantDto } from "./dto/create-restaurant.dto.js";
import { FindRestaurantsQuery } from "./dto/find-restaurants.query.js";
import { RestaurantResponse } from "./dto/restaurant.response.js";
import type { Restaurant } from "./restaurant.types.js";
import { RestaurantsService } from "./restaurants.service.js";

@ApiTags("restaurants")
@Controller("restaurants")
export class RestaurantsController {
  constructor(private readonly restaurants: RestaurantsService) {}

  // "open" is a filter, so it is ?isOpen=true (see docs/api-audit.md)
  @Public()
  @Get()
  @ApiOperation({
    summary: "List restaurants, filtered, searched, sorted and paged",
    description: "Closed restaurants are included: check `isOpen`, or filter with `isOpen=true`.",
  })
  @ApiPaginatedResponse(RestaurantResponse, "One page of restaurants")
  @ApiErrors({ 400: "A query parameter is not allowed: limit over 50, an unknown area or sort field, isOpen that is not true or false." })
  findAll(@Query() query: FindRestaurantsQuery): Page<Restaurant> {
    return this.restaurants.findAll(query);
  }

  @Public()
  @Get(":id")
  @ApiOperation({ summary: "Get one restaurant by id" })
  @ApiOkResponse({ type: RestaurantResponse })
  @ApiErrors({ 400: "The id is not a whole number.", 404: "No restaurant has that id." })
  findOne(@Param("id", ParseIntPipe) id: number): Restaurant {
    return this.restaurants.findOne(id);
  }

  @Post() // 201 + a Location header pointing at the new restaurant
  @Roles("staff") // adding a restaurant is Addis Eats staff work (Day 63 audit: it used to need only ANY login)
  @ApiBearerAuth("bearer")
  @UseInterceptors(LocationInterceptor)
  @ApiOperation({ summary: "Add a restaurant" })
  @ApiCreatedResponse({
    type: RestaurantResponse,
    description: "The restaurant was created. The Location header points at it.",
    headers: { Location: { description: "Where the new restaurant lives, for example /api/v1/restaurants/5", schema: { type: "string" } } },
  })
  @ApiErrors({
    400: "Validation failed: a field is missing or malformed, or an undeclared field was sent.",
    401: "Missing, invalid or expired access token.",
    403: "The caller is not staff.",
  })
  create(@Body() dto: CreateRestaurantDto): Restaurant {
    return this.restaurants.create(dto);
  }
}
