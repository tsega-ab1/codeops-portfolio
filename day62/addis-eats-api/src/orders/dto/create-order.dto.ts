import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Max,
  Min,
  Validate,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { IsTeleBirrNumber } from "../../common/validators/is-telebirr-number.validator.js";
import { PhoneRequiredForTeleBirr } from "../../common/validators/phone-required-for-telebirr.constraint.js";
import { AREAS, PAYMENT_METHODS } from "../order.types.js";
import type { Area, PaymentMethod } from "../order.types.js";

/** One line of an order: which dish, and how many. */
export class OrderLineDto {
  /** A dish id. The dish must be on the menu of the restaurant being ordered from. */
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  dishId!: number;

  /** How many of it, 1 to 20. */
  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  @Max(20)
  quantity!: number;
}

// NOTE: there is no totalSantim here. The server prices the order from the dishes.
// A client that can name its own total can order Doro Wat for one santim.
export class CreateOrderDto {
  /** The customer's full name, as they gave it. */
  @ApiProperty({ example: "Almaz Bekele" })
  @IsString()
  @Length(2, 80)
  customer!: string;

  /** One of the four Addis Ababa delivery areas. */
  @ApiProperty({ enum: AREAS, example: "Bole" })
  @IsIn(AREAS)
  area!: Area;

  /** The restaurant to order from. It must exist (404) and be open (409). */
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  restaurantId!: number;

  /** How the customer pays. TELEBIRR requires a phone number. Defaults to CASH. */
  @ApiProperty({ enum: PAYMENT_METHODS, example: "TELEBIRR", required: false, default: "CASH" })
  @IsOptional() // must stay FIRST: absent means "use the default", skip the rest
  @IsIn(PAYMENT_METHODS)
  paymentMethod: PaymentMethod = "CASH";

  /** TeleBirr number: `09xxxxxxxx` or `+2519xxxxxxxx`. Required when paymentMethod is TELEBIRR. */
  @ApiProperty({ example: "0912345678", required: false })
  // @ValidateIf, not @IsOptional: an absent phone must STILL be checked when
  // paymentMethod is TELEBIRR (@IsOptional would skip every rule on an absent value)
  @ValidateIf((o: CreateOrderDto) => o.paymentMethod === "TELEBIRR" || o.phone !== undefined)
  @Validate(PhoneRequiredForTeleBirr)
  @IsTeleBirrNumber()
  phone?: string;

  /** What is being ordered: at least one line. The total is computed from these, never sent. */
  @ApiProperty({ type: [OrderLineDto], minItems: 1, example: [{ dishId: 1, quantity: 2 }] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true }) // tells class-validator to go INSIDE each line...
  @Type(() => OrderLineDto) //        ...and this tells class-transformer which class to build
  lines!: OrderLineDto[];
}
