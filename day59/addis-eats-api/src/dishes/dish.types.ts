export interface Dish {
  readonly id: number;
  restaurantId: number;
  name: string;
  priceSantim: number; // 100 santim = 1 ETB
}
