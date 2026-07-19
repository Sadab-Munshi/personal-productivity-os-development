import type { DisplayStreak } from "@/lib/streaks";
import { formatMonthDay } from "@/lib/time";

function ring(level: number): string {
  // Calm, never alarming — greens only.
  if (level >= 7) return "#4f6b53";
  if (level >= 3) return "#5f7e63";
  if (level >= 1) return "#8aa68e";
  return "#c3c0b6";
}

export function StreakPanel({
  display,
  restDayName,
}: {
  display: DisplayStreak;
  restDayName: string;
}) {
  const status =
    display.state === "today"
      ? "You showed up today. Steady wins."
      : display.state === "pending"
        ? "Your streak is alive — today is still open."
        : display.state === "broken"
          ? display.lastDate
            ? `Your run ended on ${formatMonthDay(display.lastDate)}. Today's a fresh start.`
            : "Today's a fresh start."
          : "No streak yet. Today is a fine day to begin.";

  return (
    <section
      aria-label="Streak"
      className="rounded-3xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(43,42,37,0.04)]"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span
              className="font-display text-5xl font-semibold leading-none"
              style={{ color: display.current > 0 ? ring(display.current) : "#a39e91" }}
            >
              {display.current}
            </span>
            <span className="text-sm text-ink-soft">
              day{display.current === 1 ? "" : "s"}
            </span>
          </div>
          <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-ink-soft">
            {status}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xs uppercase tracking-wide text-ink-faint">
            Longest
          </div>
          <div className="font-display text-2xl font-semibold text-ink">
            {display.longest}
          </div>
        </div>
      </div>
      <p className="mt-4 border-t border-line pt-3 text-xs text-ink-faint">
        {restDayName}s are your rest day — they never break the streak.
      </p>
    </section>
  );
}
