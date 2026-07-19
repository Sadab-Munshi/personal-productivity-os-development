"use client";

import { useState } from "react";

export function NudgeBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div
      role="status"
      className="animate-rise flex items-start gap-3 rounded-2xl border border-accent-soft bg-accent-soft/60 p-3.5 text-sm text-accent-strong"
    >
      <span aria-hidden="true" className="mt-0.5 text-base">🌱</span>
      <p className="flex-1 leading-relaxed">
        No entry yet today. Whenever you&apos;re ready, tap the button — one
        small thing is enough.
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss reminder"
        className="focus-ring -mr-1 shrink-0 rounded-lg p-1 text-accent-strong/70 transition-colors hover:text-accent-strong"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
