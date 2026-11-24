import { Type, applyDecorators } from "@nestjs/common";
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from "@nestjs/swagger";

// Page<T> is a generic, and generics are erased, so the schema is spelled out once here
export function ApiPaginatedResponse<T extends Type<unknown>>(model: T, description: string) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      description,
      schema: {
        type: "object",
        required: ["items", "total", "limit", "offset"],
        properties: {
          items: { type: "array", items: { $ref: getSchemaPath(model) } },
          total: { type: "integer", example: 14, description: "How many rows matched, counted before paging." },
          limit: { type: "integer", example: 20 },
          offset: { type: "integer", example: 0 },
        },
      },
    }),
  );
}
