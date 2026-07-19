import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { StreakChip } from "@/components/StreakChip";
import { Fab } from "@/components/Fab";
import { TodayCard } from "@/components/TodayCard";
import { StreakPanel } from "@/components/StreakPanel";
import { Heatmap } from "@/components/Heatmap";
import { NudgeBanner } from "@/components/NudgeBanner";
import { SetupForm } from "@/components/SetupForm";
import {
  displayStreak,
  getEntriesInRange,
  getEntryForDate,
  getStreakRow,
} from "@/lib/queries";
import { DAY_NAMES_LONG, formatHuman, hourInTz, lastNDays, todayInTz } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    return <Welcome />;
  }

  const today = todayInTz(user.timezone);
  const entry = await getEntryForDate(user.id, today);
  const streakRow = await getStreakRow(user.id);
  const streak = displayStreak(
    streakRow ?? { currentStreak: 0, longestStreak: 0, lastShownUpDate: null },
    today,
    user.restDay,
  );
  const from = lastNDays(today, 18 * 7)[0];
  const recent = await getEntriesInRange(user.id, from, today);

  const hour = hourInTz(user.timezone);
  const part = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  return (
    <AppShell right={<StreakChip days={streak.current} />}>
      <div className="space-y-5">
        <header>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
            {user.displayName ? `Good ${part}, ${user.displayName}` : `Good ${part}`}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">{formatHuman(today)}</p>
        </header>

        {!entry && <NudgeBanner />}

        <TodayCard entry={entry} today={today} timezone={user.timezone} />

        <StreakPanel display={streak} restDayName={DAY_NAMES_LONG[user.restDay]} />

        <section className="rounded-3xl border border-line bg-surface p-5">
          <Heatmap
            entries={recent.map((e) => ({ date: e.date, category: e.aiCategory }))}
            today={today}
            restDay={user.restDay}
          />
          <Link
            href="/history"
            className="focus-ring mt-5 inline-block rounded-full border border-line-strong px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
          >
            View full history →
          </Link>
        </section>

        {!entry && <Fab />}
      </div>
    </AppShell>
  );
}

function Welcome() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <div className="text-center">
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full text-white shadow-[0_10px_24px_-8px_rgba(95,126,99,0.6)]"
          style={{ backgroundImage: "linear-gradient(145deg, #6f9173, #4f6b53)" }}
        >
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden="true">
            <path
              d="M5 18c0-6 4.5-10 11-10 0 6.5-4 10.5-9 10.5-.9 0-2-.5-2-1.5Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path d="M9 15c2-2 4-3 6.5-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="font-display text-[2.5rem] font-semibold leading-[1.05] text-ink">
          One thing a day.
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-ink-soft">
          A calm system for consistency over intensity. Show up once a day — no
          planning, no perfectionism. Just one small thing, locked in.
        </p>
      </div>

      <div className="mt-9 rounded-3xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(43,42,37,0.04)]">
        <SetupForm />
      </div>

      <p className="mt-6 text-center text-xs text-ink-faint">
        No password — your email just links this device to your space.
      </p>
    </main>
  );
}
