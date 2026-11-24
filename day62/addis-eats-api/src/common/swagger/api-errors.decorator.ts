import { applyDecorators } from "@nestjs/common";
import { ApiResponse } from "@nestjs/swagger";
import { ErrorResponse } from "./error.response.js";

// One line per failure, saying WHEN it happens (the success shape is already inferred):
//   @ApiErrors({ 404: "No order with that id", 409: "The restaurant is closed" })
export function ApiErrors(errors: Record<number, string>) {
  return applyDecorators(
    ...Object.entries(errors).map(([status, description]) =>
      ApiResponse({ status: Number(status), description, type: ErrorResponse }),
    ),
  );
}
