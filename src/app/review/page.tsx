import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { StreakChip } from "@/components/StreakChip";
import { ReviewEditor, type ReviewDay } from "@/components/ReviewEditor";
import {
  buildWeekStats,
  displayStreak,
  getEntriesInRange,
  getReview,
  getStreakRow,
} from "@/lib/queries";
import {
  addDays,
  diffDays,
  formatMonthDay,
  todayInTz,
  weekEndSunday,
  weekStartMonday,
} from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const today = todayInTz(user.timezone);
  const sp = await searchParams;
  const currentWs = weekStartMonday(today);
  const requested = sp.week ? weekStartMonday(sp.week) : currentWs;
  // Never allow jumping into a future week.
  const ws = diffDays(currentWs, requested) < 0 ? currentWs : requested;
  const we = weekEndSunday(ws);

  const entries = await getEntriesInRange(user.id, ws, we);
  const stats = buildWeekStats(entries, ws, today, user.restDay);
  const review = await getReview(user.id, ws);
  const streakRow = await getStreakRow(user.id);
  const streak = displayStreak(
    streakRow ?? { currentStreak: 0, longestStreak: 0, lastShownUpDate: null },
    today,
    user.restDay,
  );

  const days: ReviewDay[] = stats.days.map((d) => ({
    date: d.date,
    dow: d.dow,
    isRest: d.isRest,
    isFuture: d.isFuture,
    hasEntry: !!d.entry,
    category: d.entry?.aiCategory ?? null,
    completed: !!d.entry?.completed,
  }));

  const hasNext = diffDays(addDays(ws, 7), currentWs) <= 0;
  const navBtn =
    "focus-ring rounded-full border border-line-strong px-4 py-2 text-sm font-medium transition-colors";

  return (
    <AppShell right={<StreakChip days={streak.current} />}>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-2">
          <Link
            href={`/review?week=${addDays(ws, -7)}`}
            className={`${navBtn} text-ink-soft hover:text-ink`}
          >
            ← Prev
          </Link>
          <span className="text-center text-xs text-ink-faint">
            {formatMonthDay(ws)} – {formatMonthDay(we)}
          </span>
          {hasNext ? (
            <Link
              href={`/review?week=${addDays(ws, 7)}`}
              className={`${navBtn} text-ink-soft hover:text-ink`}
            >
              Next →
            </Link>
          ) : (
            <span className={`${navBtn} cursor-default text-ink-faint/40`}>
              Next →
            </span>
          )}
        </div>

        <ReviewEditor
          weekStart={stats.weekStart}
          weekEnd={stats.weekEnd}
          draftText={stats.draftText}
          initialReflection={review?.reflectionText ?? ""}
          completionRate={stats.completionRate}
          shownUp={stats.shownUp}
          available={stats.available}
          locked={stats.locked}
          days={days}
        />
      </div>
    </AppShell>
  );
}
