import { ApiProperty } from "@nestjs/swagger";

export class TokenPairResponse {
  @ApiProperty({ description: "Send it as `Authorization: Bearer <token>` on every request. Short-lived.", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
  accessToken!: string;

  @ApiProperty({ description: "Send it ONLY to POST /auth/refresh, when the access token has expired. It works once.", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
  refreshToken!: string;

  @ApiProperty({ example: "Bearer" })
  tokenType!: string;

  @ApiProperty({ example: 900, description: "Seconds until the access token expires." })
  expiresIn!: number;
}
