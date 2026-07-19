import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { StreakChip } from "@/components/StreakChip";
import { Heatmap } from "@/components/Heatmap";
import { CategoryPill } from "@/components/CategoryPill";
import { displayStreak, getAllEntries, getStreakRow } from "@/lib/queries";
import { formatHuman, lastNDays, todayInTz } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const today = todayInTz(user.timezone);
  const all = await getAllEntries(user.id);
  const streakRow = await getStreakRow(user.id);
  const streak = displayStreak(
    streakRow ?? { currentStreak: 0, longestStreak: 0, lastShownUpDate: null },
    today,
    user.restDay,
  );
  const from = lastNDays(today, 53 * 7)[0];
  const inRange = all.filter((e) => e.date >= from);

  return (
    <AppShell right={<StreakChip days={streak.current} />}>
      <div className="space-y-6">
        <header>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
            History
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Every day you showed up — {all.length}{" "}
            {all.length === 1 ? "entry" : "entries"} in total.
          </p>
        </header>

        <section className="rounded-3xl border border-line bg-surface p-5">
          <Heatmap
            entries={inRange.map((e) => ({ date: e.date, category: e.aiCategory }))}
            today={today}
            restDay={user.restDay}
            weeks={53}
          />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-medium text-ink-soft">Entries</h2>
          {all.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-line-strong bg-surface-2/50 p-10 text-center">
              <p className="font-display text-xl text-ink">Nothing here yet.</p>
              <p className="mt-1 text-sm text-ink-soft">
                Your first entry will start the story. Head to Today.
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {[...all].reverse().map((e) => (
                <li
                  key={e.id}
                  className="rounded-2xl border border-line bg-surface p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs uppercase tracking-wide text-ink-faint">
                      {formatHuman(e.date)}
                    </span>
                    <CategoryPill category={e.aiCategory} />
                  </div>
                  <p className="mt-1.5 font-display text-lg font-medium leading-snug text-ink">
                    {e.aiSummary ?? e.rawDescription}
                  </p>
                  <p className="mt-0.5 text-sm italic text-ink-soft">
                    &ldquo;{e.rawDescription}&rdquo;
                  </p>
                  {e.completed && (
                    <span className="mt-2 inline-block text-xs font-medium text-accent-strong">
                      ✓ did it
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
