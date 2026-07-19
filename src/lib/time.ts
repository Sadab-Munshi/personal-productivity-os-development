/**
 * Date helpers that operate on calendar-day strings ("YYYY-MM-DD").
 *
 * The `daily_entries.date` column stores the calendar day in the *user's*
 * timezone, so all streak/week logic works on these plain date strings and
 * never on instants — that keeps "one entry per day" unambiguous.
 */

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAY_NAMES_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Returns today's calendar day in the given IANA timezone as "YYYY-MM-DD". */
export function todayInTz(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    // Invalid timezone id — fall back to UTC.
    return new Intl.DateTimeFormat("en-CA").format(new Date());
  }
}

/** Current hour (0-23) in the given timezone, for reminder scheduling. */
export function hourInTz(timezone: string, now: Date = new Date()): number {
  try {
    const h = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone || "UTC",
      hour: "2-digit",
      hour12: false,
    }).format(now);
    return Number(h) % 24;
  } catch {
    return now.getUTCHours();
  }
}

/** Parse a "YYYY-MM-DD" string to a UTC midnight Date for safe arithmetic. */
function toUtcDate(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

/** Day of week, 0 = Sunday .. 6 = Saturday. */
export function dayOfWeek(s: string): number {
  return toUtcDate(s).getUTCDay();
}

/** Add (or subtract) days from a date string. */
export function addDays(s: string, n: number): string {
  const d = toUtcDate(s);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Difference in days: b - a (can be negative). */
export function diffDays(a: string, b: string): number {
  const ms = toUtcDate(b).getTime() - toUtcDate(a).getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * Calendar dates strictly between `a` (exclusive) and `b` (exclusive),
 * assuming a <= b. Empty when a and b are adjacent.
 */
export function daysBetweenExclusive(a: string, b: string): string[] {
  const out: string[] = [];
  let cur = addDays(a, 1);
  while (diffDays(cur, b) < 0) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

/** The Monday that starts the week containing `dateStr`. */
export function weekStartMonday(dateStr: string): string {
  const dow = dayOfWeek(dateStr); // 0 Sun .. 6 Sat
  const daysSinceMonday = (dow + 6) % 7; // Mon=0 ... Sun=6
  return addDays(dateStr, -daysSinceMonday);
}

/** The Sunday that ends the week containing `dateStr`. */
export function weekEndSunday(dateStr: string): string {
  return addDays(weekStartMonday(dateStr), 6);
}

/** Is the week containing `weekStart` (a Monday) already over as of `today`? */
export function isWeekOver(weekStart: string, today: string): boolean {
  return diffDays(weekStart, today) > 6;
}

/** List the 7 date strings (Mon..Sun) for the week containing `dateStr`. */
export function weekDates(dateStr: string): string[] {
  const start = weekStartMonday(dateStr);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "Mon, Jun 3" — short human label for a date string. */
export function formatHuman(s: string): string {
  const d = toUtcDate(s);
  return `${DAY_NAMES[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** "June 3" */
export function formatMonthDay(s: string): string {
  const d = toUtcDate(s);
  return `${MONTHS_LONG()[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function MONTHS_LONG() {
  return [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
}

/** Generate the last `n` date strings ending at `today` (inclusive), oldest first. */
export function lastNDays(today: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, -(n - 1 - i)));
}
