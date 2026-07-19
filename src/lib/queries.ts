import { db } from "@/db";
import { dailyEntries, streaks, weeklyReviews, analyticsReports } from "@/db/schema";
import { and, eq, gte, lte, asc } from "drizzle-orm";
import type { DailyEntry } from "@/db/schema";
import {
  addDays,
  dayOfWeek,
  diffDays,
  formatHuman,
  weekEndSunday,
  weekStartMonday,
  isWeekOver,
} from "./time";
import { computeStreakOnEntry, displayStreak } from "./streaks";
import { categoryMeta, type Category } from "./categories";

export async function getEntryForDate(
  userId: string,
  date: string,
): Promise<DailyEntry | null> {
  const [row] = await db
    .select()
    .from(dailyEntries)
    .where(and(eq(dailyEntries.userId, userId), eq(dailyEntries.date, date)))
    .limit(1);
  return row ?? null;
}

export async function getEntriesInRange(
  userId: string,
  fromDate: string,
  toDate: string,
): Promise<DailyEntry[]> {
  return db
    .select()
    .from(dailyEntries)
    .where(
      and(
        eq(dailyEntries.userId, userId),
        gte(dailyEntries.date, fromDate),
        lte(dailyEntries.date, toDate),
      ),
    )
    .orderBy(asc(dailyEntries.date));
}

export async function getAllEntries(userId: string): Promise<DailyEntry[]> {
  return db
    .select()
    .from(dailyEntries)
    .where(eq(dailyEntries.userId, userId))
    .orderBy(asc(dailyEntries.date));
}

export async function getStreakRow(userId: string) {
  const [row] = await db
    .select()
    .from(streaks)
    .where(eq(streaks.userId, userId))
    .limit(1);
  return row ?? null;
}

/**
 * Apply streak math for a new show-up and persist. Uses upsert so it is safe
 * whether or not a streak row already exists.
 */
export async function applyStreakOnEntry(
  userId: string,
  entryDate: string,
  restDay: number,
) {
  const prev = (await getStreakRow(userId)) ?? {
    currentStreak: 0,
    longestStreak: 0,
    lastShownUpDate: null,
  };
  const next = computeStreakOnEntry(prev, entryDate, restDay);
  await db
    .insert(streaks)
    .values({
      userId,
      currentStreak: next.currentStreak,
      longestStreak: next.longestStreak,
      lastShownUpDate: next.lastShownUpDate,
    })
    .onConflictDoUpdate({
      target: streaks.userId,
      set: {
        currentStreak: next.currentStreak,
        longestStreak: next.longestStreak,
        lastShownUpDate: next.lastShownUpDate,
      },
    });
  return next;
}

export async function getReview(
  userId: string,
  weekStart: string,
) {
  const [row] = await db
    .select()
    .from(weeklyReviews)
    .where(
      and(eq(weeklyReviews.userId, userId), eq(weeklyReviews.weekStart, weekStart)),
    )
    .limit(1);
  return row ?? null;
}

export type WeekDay = {
  date: string;
  dow: number;
  isRest: boolean;
  isFuture: boolean;
  entry: DailyEntry | null;
};

export type WeekStats = {
  weekStart: string;
  weekEnd: string;
  days: WeekDay[];
  shownUp: number;
  available: number;
  completionRate: number;
  categoryCounts: Record<string, number>;
  draftText: string;
  locked: boolean;
};

/**
 * Build the per-week picture used by the review UI and the weekly summary:
 * day-by-day entries, honest completion rate (excluding the rest day), a calm
 * auto-generated draft, and category distribution for analytics.
 */
export function buildWeekStats(
  entries: DailyEntry[],
  anchor: string,
  today: string,
  restDay: number,
): WeekStats {
  const weekStart = weekStartMonday(anchor);
  const weekEnd = weekEndSunday(anchor);
  const byDate = new Map(entries.map((e) => [e.date, e]));

  const days: WeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    days.push({
      date,
      dow: dayOfWeek(date),
      isRest: dayOfWeek(date) === restDay,
      isFuture: diffDays(today, date) > 0,
      entry: byDate.get(date) ?? null,
    });
  }

  // Completion rate: days shown up / available days (non-rest, up to today).
  const counted = days.filter((d) => !d.isRest && !d.isFuture);
  const available = counted.length;
  const shownUp = counted.filter((d) => d.entry).length;
  const completionRate = available > 0 ? shownUp / available : 0;

  const categoryCounts: Record<string, number> = {};
  for (const e of entries) {
    const c = (e.aiCategory ?? "uncategorized") as Category;
    categoryCounts[c] = (categoryCounts[c] ?? 0) + 1;
  }

  const draftText = buildReviewDraft(entries, shownUp, available);

  return {
    weekStart,
    weekEnd,
    days,
    shownUp,
    available,
    completionRate,
    categoryCounts,
    draftText,
    locked: isWeekOver(weekStart, today),
  };
}

function buildReviewDraft(
  entries: DailyEntry[],
  shownUp: number,
  available: number,
): string {
  const header =
    available > 0
      ? `This week you showed up on ${shownUp} of ${available} day${
          available === 1 ? "" : "s"
        }.`
      : `The week is just beginning.`;

  if (entries.length === 0) {
    return `${header}\n\nNo entries yet — there's nothing to look back on. Be gentle with yourself.`;
  }

  const byCat: Record<string, DailyEntry[]> = {};
  for (const e of entries) {
    const c = (e.aiCategory ?? "uncategorized") as Category;
    (byCat[c] ??= []).push(e);
  }

  const order = (Object.keys(byCat) as Category[]).sort(
    (a, b) => (byCat[b]?.length ?? 0) - (byCat[a]?.length ?? 0),
  );

  const sections = order
    .map((cat) => {
      const meta = categoryMeta(cat);
      const items = byCat[cat]
        .map((e) => `• ${e.aiSummary ?? e.rawDescription}`)
        .join("\n");
      return `${meta.label}\n${items}`;
    })
    .join("\n\n");

  return `${header}\n\n${sections}`;
}

export async function upsertReviewReflection(
  userId: string,
  weekStart: string,
  reflectionText: string,
  completionRate: number,
  restDay: number,
) {
  const restDayDate = (() => {
    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStart, i);
      if (dayOfWeek(d) === restDay) return d;
    }
    return null;
  })();

  const [row] = await db
    .insert(weeklyReviews)
    .values({
      userId,
      weekStart,
      reflectionText,
      completionRate: completionRate.toFixed(4),
      restDayDate,
    })
    .onConflictDoUpdate({
      target: [weeklyReviews.userId, weeklyReviews.weekStart],
      set: {
        reflectionText,
        completionRate: completionRate.toFixed(4),
        updatedAt: new Date(),
      },
    })
    .returning();
  return row;
}

/** Write a periodic analytics report (v2: data model now, UI later). */
export async function writeAnalyticsReport(
  userId: string,
  period: string,
  data: Record<string, unknown>,
) {
  const [row] = await db
    .insert(analyticsReports)
    .values({ userId, period, data })
    .returning();
  return row;
}

export { displayStreak, formatHuman };
