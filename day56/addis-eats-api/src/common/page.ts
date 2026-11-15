// THE decision (also written in README.md):
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

// Order of work in every service: filter, then sort, then page (this is the last step)
export function paginate<T>(rows: T[], request: PageRequest): Page<T> {
  return {
    items: rows.slice(request.offset, request.offset + request.limit),
    total: rows.length,
    limit: request.limit,
    offset: request.offset,
  };
}

// Sorts a COPY: Array.sort changes the array in place, and this array may be our real store
export function sortBy<T, K extends keyof T>(rows: T[], key: K): T[] {
  return [...rows].sort((a, b) => {
    const x = a[key];
    const y = b[key];
    if (typeof x === "number" && typeof y === "number") return x - y;
    return String(x).localeCompare(String(y));
  });
}
