// THE decision (see docs/api-standard.md):
//   collections -> Page<T>      members -> the bare object      errors -> Nest's shape
export interface Page<T> {
  items: T[];
  total: number; // how many rows MATCHED, counted before paging
  limit: number;
  offset: number;
}

export interface PageRequest {
  limit: number;
  offset: number;
}

// Order of work in every service: filter, search, sort, page (this), then pick fields
export function paginate<T>(rows: T[], request: PageRequest): Page<T> {
  return {
    items: rows.slice(request.offset, request.offset + request.limit),
    total: rows.length,
    limit: request.limit,
    offset: request.offset,
  };
}

// ?sort=area,-totalSantim : left to right, a leading minus means descending,
// the first key wins and the next one breaks ties.
// The DTO has already checked every name against the allowed list.
// Sorts a COPY: Array.sort changes the array in place, and this array may be our real store.
export function sortRows<T>(rows: T[], raw: string): T[] {
  const keys = raw.split(",").map((part) => ({
    field: (part.startsWith("-") ? part.slice(1) : part) as keyof T,
    direction: part.startsWith("-") ? -1 : 1,
  }));
  return [...rows].sort((a, b) => {
    for (const { field, direction } of keys) {
      const x = a[field];
      const y = b[field];
      const result =
        typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x).localeCompare(String(y));
      if (result !== 0) return result * direction;
    }
    return 0;
  });
}

// ?fields=id,status : keep only the asked-for keys, so the response shrinks
export function pickFields<T extends object, K extends keyof T>(
  item: T,
  fields: readonly K[],
): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const field of fields) out[field] = item[field];
  return out;
}

// ?q=abyssinia : case-insensitive "contains"
export function matchesText(value: string, query: string): boolean {
  return value.toLowerCase().includes(query.toLowerCase());
}
