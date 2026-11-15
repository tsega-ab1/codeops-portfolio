import { Inject, Injectable } from "@nestjs/common";
import { paginate, sortBy } from "../common/page.js";
import type { Page, PageRequest } from "../common/page.js";
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

  // 1 filter  ->  2 sort  ->  3 page
  findAll(q: FindRestaurantsQuery): Page<Restaurant> {
    let rows = this.repo.all();
    if (q.area) rows = rows.filter((r) => r.area === q.area);
    if (q.isOpen !== undefined) rows = rows.filter((r) => r.isOpen === q.isOpen);
    return paginate(sortBy(rows, q.sort), q);
  }

  findOpen(q: PageRequest): Page<Restaurant> {
    const rows = this.repo.all().filter((r) => r.isOpen);
    return paginate(sortBy(rows, "name"), q);
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
