import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
} from "class-validator";
import { AREAS } from "../order.types.js";
import type { Area } from "../order.types.js";

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  customer!: string;

  @IsIn(AREAS)
  area!: Area;

  @IsInt()
  @Min(1)
  totalSantim!: number;

  @IsOptional()
  @Matches(/^(?:\+251|0)9\d{8}$/, {
    message: "phone must be a valid TeleBirr number",
  })
  phone?: string;
}
