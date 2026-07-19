export function StreakChip({ days }: { days: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path
          d="M5 18c0-6 4.5-10 11-10 0 6.5-4 10.5-9 10.5-.9 0-2-.5-2-1.5Z"
          fill="var(--color-accent)"
          opacity="0.85"
        />
      </svg>
      <span className="font-semibold text-ink">{days}</span>
      <span className="text-xs text-ink-faint">day{days === 1 ? "" : "s"}</span>
    </div>
  );
}
