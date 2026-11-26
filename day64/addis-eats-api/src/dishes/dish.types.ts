import type { StoredImage } from "../common/images/image.types.js";

export interface Dish {
  readonly id: number;
  restaurantId: number;
  name: string;
  priceSantim: number; // 100 santim = 1 ETB
  image?: StoredImage; // the keys, never a URL
}
