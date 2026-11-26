import type { Area } from "../common/area.js";
import type { StoredImage } from "../common/images/image.types.js";

export interface Restaurant {
  readonly id: number;
  name: string;
  area: Area;
  isOpen: boolean;
  image?: StoredImage; // the keys, never a URL (the URL is built when it is read)
}
