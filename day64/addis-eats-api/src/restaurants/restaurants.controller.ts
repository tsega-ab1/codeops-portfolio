import { BadRequestException } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import { ApiBody, ApiConsumes } from "@nestjs/swagger";
import { RestaurantManageGuard } from "../common/guards/restaurant-manage.guard.js";
import { ImageViewInterceptor } from "../common/images/image-view.interceptor.js";
import { MAX_IMAGE_BYTES } from "../common/images/image.service.js";
import { imageFilePipe } from "../common/images/parse-image-file.pipe.js";
import { envInt } from "../config/security.config.js";
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
  UploadedFile,
  UseGuards,
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

@UseInterceptors(ImageViewInterceptor) // keys in the record, URLs in the response
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

  // POST /restaurants/:id/image: the nine-step pipeline. Steps 1 to 3 (JWT, role, policy) cost nothing: they refuse BEFORE Multer reads a byte.
  @Post(":id/image")
  @Roles("restaurant", "staff") // the ROLE gate
  @UseGuards(RestaurantManageGuard) // the POLICY gate: a restaurant user only for their own restaurant
  @Throttle({ default: { limit: () => envInt("THROTTLE_UPLOAD_LIMIT", 30), ttl: 3_600_000 } }) // resizing is real work (API4)
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 10, parts: 12 } }))
  @ApiBearerAuth("bearer")
  @ApiConsumes("multipart/form-data")
  @ApiBody({ schema: { type: "object", required: ["file"], properties: { file: { type: "string", format: "binary", description: "A JPEG, PNG or WebP image, at most 2 MB." } } } })
  @ApiOperation({
    summary: "Upload or replace the image of a restaurant",
    description: "multipart/form-data with ONE field named `file`. The type is read from the file's bytes, never from its name or Content-Type. The image is re-encoded to WebP (1200 x 800 at most) with a 320 x 240 thumbnail, and its EXIF (including any GPS position) is removed. Replacing an image deletes the old files.",
  })
  @ApiCreatedResponse({ type: RestaurantResponse, description: "The restaurant, now with imageUrl, thumbUrl and imageName." })
  @ApiErrors({
    400: "No file was sent, it is not in a field named file, or the id is not a whole number.",
    401: "Missing, invalid or expired access token.",
    403: "The caller is neither staff nor the restaurant that owns this restaurant.",
    404: "No restaurant has that id.",
    413: "The file is larger than 2 MB.",
    422: "The file is not a JPEG, PNG or WebP image (judged by its bytes), or it could not be decoded.",
    429: "Too many uploads from this address. Wait the number of seconds in the Retry-After header.",
  })
  uploadImage(
    @Param("id", ParseIntPipe) id: number,
    @UploadedFile(imageFilePipe()) file?: Express.Multer.File,
  ): Promise<Restaurant> {
    if (!file) throw new BadRequestException('Send the image as multipart/form-data in ONE field named "file"');
    return this.restaurants.setImage(id, file);
  }
}
