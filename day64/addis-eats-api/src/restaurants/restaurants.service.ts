import { Inject, Injectable } from "@nestjs/common";
import { ImageService } from "../common/images/image.service.js";
import { matchesText, paginate, sortRows } from "../common/page.js";
import type { Page } from "../common/page.js";
import type { CreateRestaurantDto } from "./dto/create-restaurant.dto.js";
import type { FindRestaurantsQuery } from "./dto/find-restaurants.query.js";
import { RestaurantNotFoundError } from "./restaurant.errors.js";
import type { Restaurant } from "./restaurant.types.js";
import { RESTAURANT_REPOSITORY } from "./restaurants.repository.js";
import type { RestaurantRepository } from "./restaurants.repository.js";

@Injectable()
export class RestaurantsService {
  constructor(
    @Inject(RESTAURANT_REPOSITORY)
    private readonly repo: RestaurantRepository,
    private readonly images: ImageService,
  ) {}

  // 1 filter  ->  2 search  ->  3 sort  ->  4 page
  findAll(query: FindRestaurantsQuery): Page<Restaurant> {
    const { area, isOpen, q } = query;
    let rows = this.repo.all();
    if (area) rows = rows.filter((r) => area.includes(r.area));
    if (isOpen !== undefined) rows = rows.filter((r) => r.isOpen === isOpen);
    if (q) rows = rows.filter((r) => matchesText(r.name, q));
    return paginate(sortRows(rows, query.sort), query);
  }

  findOne(id: number): Restaurant {
    const hit = this.repo.byId(id);
    if (!hit) throw new RestaurantNotFoundError(id);
    return hit;
  }

  // Used by the dishes and orders modules to check a restaurant exists
  exists(id: number): boolean {
    return this.repo.byId(id) !== undefined;
  }

  // Deliberately naive id; the database replaces it in Module 5
  create(dto: CreateRestaurantDto): Restaurant {
    const id = Math.max(0, ...this.repo.all().map((r) => r.id)) + 1;
    // every field by NAME: a spread would let any extra property in the body become part of the record
    return this.repo.save({ id, name: dto.name, area: dto.area, isOpen: dto.isOpen ?? true });
  }

  // Replace the restaurant's image: process, store, save, and only then delete the old pair (see ImageService.attach)
  async setImage(id: number, file: Express.Multer.File): Promise<Restaurant> {
    const restaurant = this.findOne(id);
    await this.images.attach(file, "restaurants", restaurant.image, (image) => {
      this.repo.save({ ...restaurant, image });
    });
    return this.findOne(id);
  }
}
