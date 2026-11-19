import { Inject, Injectable } from "@nestjs/common";
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
    return this.repo.save({ ...dto, id, isOpen: dto.isOpen ?? true });
  }
}
