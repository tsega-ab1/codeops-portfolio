import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class LoginDto {
  /** The email the account was registered with. */
  @ApiProperty({ example: "sara@example.et" })
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(254)
  email!: string;

  /** The account password. */
  @ApiProperty({ example: "a-long-passphrase-123" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password!: string;
}
