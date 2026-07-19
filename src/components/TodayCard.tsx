import type { DailyEntry } from "@/db/schema";
import { CategoryPill } from "./CategoryPill";
import { CompleteToggle } from "./CompleteToggle";
import { formatHuman } from "@/lib/time";

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <rect x="5" y="10" width="14" height="9.5" rx="2.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function timeLabel(iso: string | Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat([], {
      timeZone: timezone || "UTC",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleTimeString();
  }
}

export function TodayCard({
  entry,
  today,
  timezone,
}: {
  entry: DailyEntry | null;
  today: string;
  timezone: string;
}) {
  if (!entry) {
    return (
      <section className="rounded-3xl border border-dashed border-line-strong bg-surface-2/50 p-7 text-center">
        <p className="font-display text-2xl font-medium leading-snug text-ink">
          What&apos;s one thing today?
        </p>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
          Tap the button when something comes to mind. One thing is enough — it
          locks the moment you save.
        </p>
      </section>
    );
  }

  const summary = entry.aiSummary ?? entry.rawDescription;

  return (
    <section className="animate-pop relative overflow-hidden rounded-3xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(43,42,37,0.04)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-[0.06]"
        style={{ backgroundColor: "var(--color-accent)" }}
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs uppercase tracking-wide text-ink-faint">
          Today · {formatHuman(today)}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-ink-faint">
          <LockIcon /> Locked {timeLabel(entry.createdAt, timezone)}
        </span>
      </div>

      <div className="mt-3">
        <CategoryPill category={entry.aiCategory} />
      </div>

      <p className="mt-3 font-display text-2xl font-medium leading-snug text-ink">
        {summary}
      </p>
      <p className="mt-1.5 text-sm italic leading-relaxed text-ink-soft">
        &ldquo;{entry.rawDescription}&rdquo;
      </p>

      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <CompleteToggle completed={!!entry.completed} />
        <span className="text-xs text-ink-faint">No edits — by design.</span>
      </div>
    </section>
  );
}
