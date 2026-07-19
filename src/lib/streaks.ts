import { dayOfWeek, daysBetweenExclusive } from "./time";

export type StreakInput = {
  currentStreak: number;
  longestStreak: number;
  lastShownUpDate: string | null;
};

export type StreakResult = {
  currentStreak: number;
  longestStreak: number;
  lastShownUpDate: string;
};

/**
 * Recompute the streak after the user shows up on date `entryDate`.
 *
 * The rest day never breaks the streak: if the only days missed between the
 * previous show-up and today are rest days, the run continues. Any genuinely
 * missed day (a non-rest day with no entry) resets the run to 1.
 */
export function computeStreakOnEntry(
  prev: StreakInput,
  entryDate: string,
  restDay: number,
): StreakResult {
  if (!prev.lastShownUpDate) {
    return {
      currentStreak: 1,
      longestStreak: Math.max(prev.longestStreak, 1),
      lastShownUpDate: entryDate,
    };
  }

  const last = prev.lastShownUpDate;

  // Same day — should be prevented upstream; never double count.
  if (last === entryDate) {
    return {
      currentStreak: prev.currentStreak,
      longestStreak: prev.longestStreak,
      lastShownUpDate: entryDate,
    };
  }

  const gap = daysBetweenExclusive(last, entryDate);
  // Consecutive (gap empty) OR the only gap days are rest days -> continue.
  const onlyRestInGap = gap.every((d) => dayOfWeek(d) === restDay);

  if (onlyRestInGap) {
    const currentStreak = prev.currentStreak + 1;
    return {
      currentStreak,
      longestStreak: Math.max(prev.longestStreak, currentStreak),
      lastShownUpDate: entryDate,
    };
  }

  // A real day was missed — start a fresh, honest run.
  return {
    currentStreak: 1,
    longestStreak: prev.longestStreak,
    lastShownUpDate: entryDate,
  };
}

export type StreakState = "fresh" | "today" | "pending" | "broken";

export type DisplayStreak = {
  current: number;
  longest: number;
  lastDate: string | null;
  state: StreakState;
};

/**
 * What to show the user right now, given the stored streak and today's date.
 *
 * - `today`  : showed up today
 * - `pending`: last entry was earlier but the streak is still alive (only rest
 *              days in between, or yesterday) — waiting for today
 * - `broken` : a real day was missed; the run has ended
 * - `fresh`  : no entries yet
 *
 * Framing is always calm and factual — never alarming.
 */
export function displayStreak(
  streak: StreakInput,
  today: string,
  restDay: number,
): DisplayStreak {
  const last = streak.lastShownUpDate;
  if (!last) {
    return { current: 0, longest: streak.longestStreak, lastDate: null, state: "fresh" };
  }
  if (last === today) {
    return {
      current: streak.currentStreak,
      longest: streak.longestStreak,
      lastDate: last,
      state: "today",
    };
  }

  const gap = daysBetweenExclusive(last, today);
  const alive = gap.every((d) => dayOfWeek(d) === restDay);
  if (alive) {
    return {
      current: streak.currentStreak,
      longest: streak.longestStreak,
      lastDate: last,
      state: "pending",
    };
  }
  return {
    current: 0,
    longest: streak.longestStreak,
    lastDate: last,
    state: "broken",
  };
}
