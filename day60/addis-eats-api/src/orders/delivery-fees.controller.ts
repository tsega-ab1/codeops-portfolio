import { Controller, Get, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import type { Area } from "../common/area.js";
import { AREAS } from "../common/area.js";
import { ParseAreaPipe } from "../common/pipes/parse-area.pipe.js";
import { ApiErrors } from "../common/swagger/api-errors.decorator.js";
import { DeliveryFeeResponse } from "./dto/delivery-fee.response.js";
import { OrdersService } from "./orders.service.js";

@ApiTags("delivery-fees")
@Controller("delivery-fees")
export class DeliveryFeesController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @ApiOperation({
    summary: "What delivery costs in one area",
    description: "The area may be sent in any letter case (`bole`, `BOLE`); the answer uses the canonical spelling.",
  })
  @ApiQuery({ name: "area", enum: AREAS, example: "bole", description: "A delivery area, any letter case." })
  @ApiOkResponse({ type: DeliveryFeeResponse })
  @ApiErrors({ 400: "The area is missing, or is not one of the four delivery areas." })
  find(
    @Query("area", ParseAreaPipe) area: Area,
  ): { area: Area; feeSantim: number } {
    return { area, feeSantim: this.orders.feesByArea()[area] };
  }
}
