import { BadRequestException } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import { ApiBody, ApiConsumes } from "@nestjs/swagger";
import { DishManageGuard } from "../common/guards/dish-manage.guard.js";
import { ImageViewInterceptor } from "../common/images/image-view.interceptor.js";
import { MAX_IMAGE_BYTES } from "../common/images/image.service.js";
import { imageFilePipe } from "../common/images/parse-image-file.pipe.js";
import { envInt } from "../config/security.config.js";
import { Public } from "../common/decorators/public.decorator.js";
import type { AuthenticatedUser } from "../common/auth/auth.types.js";
import { CurrentUser } from "../common/decorators/current-user.decorator.js";
import { MenuPolicy } from "../common/policies/menu.policy.js";
import { Roles } from "../common/decorators/roles.decorator.js";
import {
  Body,
  Controller,
  ForbiddenException,
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
import { CreateDishDto } from "./dto/create-dish.dto.js";
import { DishResponse } from "./dto/dish.response.js";
import { FindDishesQuery } from "./dto/find-dishes.query.js";
import type { Dish } from "./dish.types.js";
import { DishesService } from "./dishes.service.js";

@UseInterceptors(ImageViewInterceptor) // keys in the record, URLs in the response
@ApiTags("dishes")
@Controller("dishes")
export class DishesController {
  constructor(
    private readonly dishes: DishesService,
    private readonly menuPolicy: MenuPolicy,
  ) {}

  @Public()
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

  @Public()
  @Get(":id")
  @ApiOperation({ summary: "Get one dish by id" })
  @ApiOkResponse({ type: DishResponse })
  @ApiErrors({ 400: "The id is not a whole number.", 404: "No dish has that id." })
  findOne(@Param("id", ParseIntPipe) id: number): Dish {
    return this.dishes.findOne(id);
  }

  @Post() // 201 + a Location header pointing at the new dish
  @Roles("staff", "restaurant") // the restaurant role only for ITS OWN menu: checked below, because the restaurantId is in the body
  @ApiBearerAuth("bearer")
  @UseInterceptors(LocationInterceptor)
  @ApiOperation({ summary: "Add a dish to a restaurant's menu" })
  @ApiCreatedResponse({
    type: DishResponse,
    description: "The dish was created. The Location header points at it.",
    headers: { Location: { description: "Where the new dish lives, for example /api/v1/dishes/9", schema: { type: "string" } } },
  })
  @ApiErrors({
    400: "Validation failed: a field is missing or malformed, the price is not a whole number of santim between 1 and 10,000,000, or an undeclared field was sent.",
    401: "Missing, invalid or expired access token.",
    403: "The caller is neither staff nor the restaurant whose menu this is.",
    404: "The restaurant does not exist.",
  })
  create(@Body() dto: CreateDishDto, @CurrentUser() user: AuthenticatedUser): Dish {
    if (!this.menuPolicy.canManage(user, dto.restaurantId)) {
      throw new ForbiddenException("You may only add dishes to your own restaurant's menu");
    }
    return this.dishes.create(dto);
  }

  // POST /dishes/:id/image: the nine-step pipeline. Steps 1 to 3 (JWT, role, policy) cost nothing: they refuse BEFORE Multer reads a byte.
  @Post(":id/image")
  @Roles("restaurant", "staff") // the ROLE gate
  @UseGuards(DishManageGuard) // the POLICY gate: a restaurant user only for their own dish
  @Throttle({ default: { limit: () => envInt("THROTTLE_UPLOAD_LIMIT", 30), ttl: 3_600_000 } }) // resizing is real work (API4)
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 10, parts: 12 } }))
  @ApiBearerAuth("bearer")
  @ApiConsumes("multipart/form-data")
  @ApiBody({ schema: { type: "object", required: ["file"], properties: { file: { type: "string", format: "binary", description: "A JPEG, PNG or WebP image, at most 2 MB." } } } })
  @ApiOperation({
    summary: "Upload or replace the image of a dish",
    description: "multipart/form-data with ONE field named `file`. The type is read from the file's bytes, never from its name or Content-Type. The image is re-encoded to WebP (1200 x 800 at most) with a 320 x 240 thumbnail, and its EXIF (including any GPS position) is removed. Replacing an image deletes the old files.",
  })
  @ApiCreatedResponse({ type: DishResponse, description: "The dish, now with imageUrl, thumbUrl and imageName." })
  @ApiErrors({
    400: "No file was sent, it is not in a field named file, or the id is not a whole number.",
    401: "Missing, invalid or expired access token.",
    403: "The caller is neither staff nor the restaurant that owns this dish.",
    404: "No dish has that id.",
    413: "The file is larger than 2 MB.",
    422: "The file is not a JPEG, PNG or WebP image (judged by its bytes), or it could not be decoded.",
    429: "Too many uploads from this address. Wait the number of seconds in the Retry-After header.",
  })
  uploadImage(
    @Param("id", ParseIntPipe) id: number,
    @UploadedFile(imageFilePipe()) file?: Express.Multer.File,
  ): Promise<Dish> {
    if (!file) throw new BadRequestException('Send the image as multipart/form-data in ONE field named "file"');
    return this.dishes.setImage(id, file);
  }
}
