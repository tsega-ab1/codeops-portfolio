const UNIT_SECONDS = { s: 1, m: 60, h: 3600, d: 86400 } as const;

// "15m" -> 900. Seconds as a plain number are accepted by every version of the JWT library.
export function toSeconds(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) throw new Error(`"${value}" is not a duration like 15m`);
  return Number(match[1]) * UNIT_SECONDS[match[2] as keyof typeof UNIT_SECONDS];
}
