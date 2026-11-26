import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

// There is no passwordHash here, on purpose: the record is never returned, only this mapping
export class UserResponse {
  @ApiProperty({ example: 4 })
  id!: number;

  @ApiProperty({ example: "sara@example.et" })
  email!: string;

  @ApiProperty({ enum: ["customer", "courier", "restaurant", "staff"], isArray: true, example: ["customer"] })
  roles!: string[];

  @ApiPropertyOptional({ example: 1, description: "Only for the restaurant role: the restaurant whose menu this user manages." })
  restaurantId?: number;
}
