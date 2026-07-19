export function isValidTz(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function clampInt(
  v: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const n =
    typeof v === "number"
      ? v
      : typeof v === "string"
        ? parseInt(v, 10)
        : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export const clampDay = (v: unknown) => clampInt(v, 0, 6, 0);
export const clampHour = (v: unknown) => clampInt(v, 0, 23, 20);

export function cleanEmail(v: unknown): string {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 320);
}

export function cleanStr(v: unknown, max: number): string {
  return String(v ?? "")
    .trim()
    .slice(0, max);
}

export function looksLikeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
