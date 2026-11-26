import { ApiProperty } from "@nestjs/swagger";

export class DishResponse {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1, description: "The restaurant whose menu this dish is on." })
  restaurantId!: number;

  @ApiProperty({ example: "Doro Wat" })
  name!: string;

  @ApiProperty({ example: 32000, description: "Whole santim. 32000 is 320.00 ETB." })
  priceSantim!: number;

  @ApiProperty({ nullable: true, example: "/static/dishes/3f7a1c52-8d3e-4b7a-9c1e-5a2b6d7e8f90.webp", description: "The full image (WebP, at most 1200 x 800), or null when none was uploaded." })
  imageUrl!: string | null;

  @ApiProperty({ nullable: true, example: "/static/dishes/3f7a1c52-8d3e-4b7a-9c1e-5a2b6d7e8f90-thumb.webp", description: "A 320 x 240 thumbnail for lists, or null." })
  thumbUrl!: string | null;

  @ApiProperty({ nullable: true, example: "doro-wat.jpg", description: "The name the file had when it was uploaded, as a label. Never used as a path." })
  imageName!: string | null;
}