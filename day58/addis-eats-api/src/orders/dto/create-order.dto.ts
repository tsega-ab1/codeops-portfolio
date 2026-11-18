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
import { IsTeleBirrNumber } from "../../common/validators/is-telebirr-number.validator.js";
import { PhoneRequiredForTeleBirr } from "../../common/validators/phone-required-for-telebirr.constraint.js";
import { AREAS, PAYMENT_METHODS } from "../order.types.js";
import type { Area, PaymentMethod } from "../order.types.js";

// One line of an order: which dish, and how many
export class OrderLineDto {
  @IsInt()
  @IsPositive()
  dishId!: number;

  @IsInt()
  @Min(1)
  @Max(20)
  quantity!: number;
}

// NOTE: there is no totalSantim here. The server prices the order from the dishes.
// A client that can name its own total can order Doro Wat for one santim.
export class CreateOrderDto {
  @IsString()
  @Length(2, 80)
  customer!: string;

  @IsIn(AREAS)
  area!: Area;

  @IsInt()
  @Min(1)
  restaurantId!: number;

  @IsOptional() // must stay FIRST: absent means "use the default", skip the rest
  @IsIn(PAYMENT_METHODS)
  paymentMethod: PaymentMethod = "CASH";

  // @ValidateIf, not @IsOptional: an absent phone must STILL be checked when
  // paymentMethod is TELEBIRR (@IsOptional would skip every rule on an absent value)
  @ValidateIf((o: CreateOrderDto) => o.paymentMethod === "TELEBIRR" || o.phone !== undefined)
  @Validate(PhoneRequiredForTeleBirr)
  @IsTeleBirrNumber()
  phone?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true }) // tells class-validator to go INSIDE each line...
  @Type(() => OrderLineDto) //        ...and this tells class-transformer which class to build
  lines!: OrderLineDto[];
}
