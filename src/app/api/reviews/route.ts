import { getCurrentUser } from "@/lib/session";
import { cleanStr } from "@/lib/validation";
import {
  diffDays,
  isWeekOver,
  todayInTz,
  weekEndSunday,
  weekStartMonday,
} from "@/lib/time";
import {
  buildWeekStats,
  getEntriesInRange,
  getStreakRow,
  upsertReviewReflection,
  writeAnalyticsReport,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const today = todayInTz(user.timezone);
  const weekStart = weekStartMonday(String(body.weekStart || today));

  // Structural guard: can't review a future week.
  if (diffDays(weekStartMonday(today), weekStart) < 0) {
    return Response.json(
      { error: "You can't review a week that hasn't happened yet." },
      { status: 400 },
    );
  }

  // Structural guard (non-negotiable): once the week is over it is locked,
  // enforced server-side so not even a direct API call can edit it.
  if (isWeekOver(weekStart, today)) {
    return Response.json(
      { error: "This week's review is locked — the week is over." },
      { status: 403 },
    );
  }

  const entries = await getEntriesInRange(
    user.id,
    weekStart,
    weekEndSunday(weekStart),
  );
  const stats = buildWeekStats(entries, weekStart, today, user.restDay);
  const reflection = cleanStr(body.reflectionText, 4000);

  const review = await upsertReviewReflection(
    user.id,
    weekStart,
    reflection,
    stats.completionRate,
    user.restDay,
  );

  // Persist a v2 analytics report so the data exists from day one.
  const streak = await getStreakRow(user.id);
  await writeAnalyticsReport(user.id, "weekly", {
    weekStart,
    completionRate: stats.completionRate,
    shownUp: stats.shownUp,
    available: stats.available,
    categoryCounts: stats.categoryCounts,
    streak: streak
      ? { current: streak.currentStreak, longest: streak.longestStreak }
      : null,
  });

  return Response.json({ review, stats });
}
