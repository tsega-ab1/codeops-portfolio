import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class RefreshDto {
  /** The refresh token from the last login or refresh. It works once: every refresh issues a new one. */
  @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  refreshToken!: string;
}
