import { ApiProperty } from "@nestjs/swagger";
import { AREAS } from "../../common/area.js";

export class RestaurantResponse {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: "Yod Abyssinia" })
  name!: string;

  @ApiProperty({ enum: AREAS, example: "Bole" })
  area!: string;

  @ApiProperty({ example: true, description: "Closed restaurants still appear in lists. Check this before offering a menu: placing an order with a closed restaurant answers 409." })
  isOpen!: boolean;

  @ApiProperty({ nullable: true, example: "/static/restaurants/3f7a1c52-8d3e-4b7a-9c1e-5a2b6d7e8f90.webp", description: "The full image (WebP, at most 1200 x 800), or null when none was uploaded." })
  imageUrl!: string | null;

  @ApiProperty({ nullable: true, example: "/static/restaurants/3f7a1c52-8d3e-4b7a-9c1e-5a2b6d7e8f90-thumb.webp", description: "A 320 x 240 thumbnail for lists, or null." })
  thumbUrl!: string | null;

  @ApiProperty({ nullable: true, example: "yod-front.jpg", description: "The name the file had when it was uploaded, as a label. Never used as a path." })
  imageName!: string | null;
}