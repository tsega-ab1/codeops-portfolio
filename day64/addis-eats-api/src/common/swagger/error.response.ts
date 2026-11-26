import { ApiProperty } from "@nestjs/swagger";

// The five fields every failure carries (see docs/api-standard.md)
export class ErrorResponse {
  @ApiProperty({ example: 404, description: "The HTTP status code." })
  statusCode!: number;

  @ApiProperty({
    oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
    example: "Order 99999 was not found",
    description: "What went wrong. An array of strings for validation, one per broken rule, each naming its field.",
  })
  message!: string | string[];

  @ApiProperty({ example: "/api/v1/orders/99999", description: "The path that was requested." })
  path!: string;

  @ApiProperty({ example: "2026-11-20T09:30:00.000Z", description: "When the error happened (ISO 8601, UTC)." })
  timestamp!: string;

  @ApiProperty({ example: "3f0c8c1e-6a52-4c2b-9d0e-2f6a5b7c1d11", description: "The request id: the same value as the x-request-id response header." })
  requestId!: string;
}
