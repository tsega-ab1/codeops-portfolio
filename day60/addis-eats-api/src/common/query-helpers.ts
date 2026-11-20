import { applyDecorators } from "@nestjs/common";
import { Transform } from "class-transformer";
import { IsOptional, Matches } from "class-validator";

// "PENDING,DELIVERED" -> ["PENDING", "DELIVERED"]
// (a repeated key, ?status=A&status=B, already arrives as an array and is kept)
export function CsvList() {
  return Transform(({ value }) =>
    typeof value === "string" ? value.split(",").map((v) => v.trim()) : value,
  );
}

// ?sort=area,-totalSantim : comma separated, a leading minus means descending
export function SortList(fields: readonly string[]) {
  const one = `-?(?:${fields.join("|")})`;
  return applyDecorators(
    IsOptional(),
    Matches(new RegExp(`^${one}(?:,${one})*$`), {
      message: `sort must be a comma-separated list of: ${fields.join(", ")} (a leading - means descending)`,
    }),
  );
}
