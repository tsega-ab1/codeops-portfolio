import type { Area } from "../common/area.js";

export interface Restaurant {
  readonly id: number;
  name: string;
  area: Area;
  isOpen: boolean;
}
