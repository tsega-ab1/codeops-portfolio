import { ApiProperty } from "@nestjs/swagger";

// There is no passwordHash here, on purpose: the record is never returned, only this mapping
export class UserResponse {
  @ApiProperty({ example: 4 })
  id!: number;

  @ApiProperty({ example: "sara@example.et" })
  email!: string;

  @ApiProperty({ enum: ["staff", "customer"], isArray: true, example: ["customer"] })
  roles!: string[];
}
