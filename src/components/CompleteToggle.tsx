"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function CompleteToggle({ completed }: { completed: boolean }) {
  const router = useRouter();
  const [done, setDone] = useState(completed);
  const [pending, startTransition] = useTransition();

  async function toggle() {
    const next = !done;
    setDone(next);
    startTransition(async () => {
      await fetch("/api/entries/today", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: next }),
      });
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={done}
      className="focus-ring inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60"
      style={
        done
          ? {
              backgroundColor: "var(--color-accent)",
              borderColor: "var(--color-accent)",
              color: "#fffdf8",
            }
          : {
              borderColor: "var(--color-line-strong)",
              color: "var(--color-ink-soft)",
            }
      }
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
        {done && (
          <path
            d="M8.5 12.5l2.5 2.5 4.5-5"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
      {done ? "Did it" : "Mark done"}
    </button>
  );
}
