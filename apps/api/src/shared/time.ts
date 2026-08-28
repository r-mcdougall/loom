const UNIT_SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 60 * 60 * 24,
};

export function parseDurationToSeconds(duration: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(duration.trim());
  if (!match) {
    throw new Error(`Invalid duration format: "${duration}" (expected e.g. "15m", "7d")`);
  }
  const amount = match[1] ?? "";
  const unit = match[2] ?? "";
  return Number(amount) * (UNIT_SECONDS[unit] ?? 0);
}
