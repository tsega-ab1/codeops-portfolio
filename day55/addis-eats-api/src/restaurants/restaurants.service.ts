import { Inject, Injectable } from "@nestjs/common";
import type { Area } from "../common/area.js";
import type { CreateRestaurantDto } from "./dto/create-restaurant.dto.js";
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

  findAll(area?: Area): Restaurant[] {
    const rows = this.repo.all();
    return area ? rows.filter((r) => r.area === area) : rows;
  }

  findOne(id: number): Restaurant {
    const hit = this.repo.byId(id);
    if (!hit) throw new RestaurantNotFoundError(id);
    return hit;
  }

  // Used by the dishes module to check a restaurant exists
  exists(id: number): boolean {
    return this.repo.byId(id) !== undefined;
  }

  // Deliberately naive id; the database replaces it in Module 5
  create(dto: CreateRestaurantDto): Restaurant {
    const id = Math.max(0, ...this.repo.all().map((r) => r.id)) + 1;
    return this.repo.save({ ...dto, id, isOpen: dto.isOpen ?? true });
  }
}
