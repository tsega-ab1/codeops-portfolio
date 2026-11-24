import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterDto {
  /** The account email. Letter case does not matter: it is stored in lower case. */
  @ApiProperty({ example: "sara@example.et" })
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(254)
  email!: string;

  /** 10 to 128 characters. The upper limit stops a huge password being hashed on purpose. */
  @ApiProperty({ example: "a-long-passphrase-123", minLength: 10, maxLength: 128 })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  password!: string;
}
