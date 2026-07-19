"use client";

import { useState } from "react";
import { categoryMeta } from "@/lib/categories";
import { DAY_NAMES, formatMonthDay } from "@/lib/time";

export type ReviewDay = {
  date: string;
  dow: number;
  isRest: boolean;
  isFuture: boolean;
  hasEntry: boolean;
  category: string | null;
  completed: boolean;
};

export function ReviewEditor({
  weekStart,
  weekEnd,
  draftText,
  initialReflection,
  completionRate,
  shownUp,
  available,
  locked,
  days,
}: {
  weekStart: string;
  weekEnd: string;
  draftText: string;
  initialReflection: string;
  completionRate: number;
  shownUp: number;
  available: number;
  locked: boolean;
  days: ReviewDay[];
}) {
  const [reflection, setReflection] = useState(initialReflection ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    if (locked || saving) return;
    setSaving(true);
    setErr("");
    setSaved(false);
    try {
      const res = await fetch("/api/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart, reflectionText: reflection }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        const d = await res.json().catch(() => ({}));
        setErr(d?.error || "Could not save.");
      }
    } catch {
      setErr("Network problem. Could not save.");
    } finally {
      setSaving(false);
    }
  }

  const pct = Math.round(completionRate * 100);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(43,42,37,0.04)]">
        <div className="flex items-baseline justify-between">
          <h1 className="font-display text-2xl font-semibold text-ink">
            Weekly review
          </h1>
          <span className="text-xs text-ink-faint">
            {formatMonthDay(weekStart)} – {formatMonthDay(weekEnd)}
          </span>
        </div>

        {/* Completion + week strip */}
        <div className="mt-4 flex items-center gap-4">
          <div className="text-center">
            <div className="font-display text-4xl font-semibold text-ink">
              {pct}
              <span className="text-lg text-ink-faint">%</span>
            </div>
            <div className="text-xs text-ink-faint">shown up</div>
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-7 gap-1.5">
              {days.map((d) => {
                const m = categoryMeta(d.category);
                return (
                  <div
                    key={d.date}
                    title={`${DAY_NAMES[d.dow]} · ${d.hasEntry ? m.label : d.isRest ? "rest" : d.isFuture ? "upcoming" : "no entry"}`}
                    className="flex flex-col items-center gap-1"
                  >
                    <span className="text-[10px] text-ink-faint">
                      {DAY_NAMES[d.dow][0]}
                    </span>
                    <span
                      className="flex h-8 w-full items-center justify-center rounded-lg text-xs font-medium"
                      style={
                        d.hasEntry
                          ? { backgroundColor: m.color, color: "#fffdf8" }
                          : d.isFuture
                            ? {
                                backgroundColor: "transparent",
                                boxShadow: "inset 0 0 0 1px var(--color-line)",
                              }
                            : d.isRest
                              ? {
                                  backgroundColor: "var(--color-surface-2)",
                                  boxShadow:
                                    "inset 0 0 0 1px var(--color-line-strong)",
                                }
                              : {
                                  backgroundColor: "var(--color-paper-2)",
                                  opacity: 0.6,
                                  color: "var(--color-ink-faint)",
                                }
                      }
                    >
                      {d.hasEntry ? m.emoji : ""}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-ink-faint">
              {shownUp} of {available} day{available === 1 ? "" : "s"} · rest day
              excluded
            </p>
          </div>
        </div>
      </div>

      {/* Auto draft (read only) */}
      <div className="rounded-3xl border border-line bg-surface-2/60 p-5">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
          From your week
        </div>
        <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">
          {draftText}
        </p>
      </div>

      {/* Reflection */}
      <div className="rounded-3xl border border-line bg-surface p-5">
        <label
          htmlFor="reflection"
          className="mb-2 block text-sm font-medium text-ink"
        >
          Your reflection
        </label>
        <textarea
          id="reflection"
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          disabled={locked}
          rows={5}
          maxLength={4000}
          placeholder="How did the week feel? Anything you noticed?"
          className="focus-ring w-full resize-none rounded-2xl border border-line-strong bg-surface-2 p-4 text-base text-ink placeholder:text-ink-faint disabled:opacity-60"
        />

        {locked ? (
          <div
            className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-ink-soft"
          >
            <span aria-hidden>🔒</span>
            This week is locked — the week is over. Same anti-perfectionism rule,
            applied weekly.
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-ink-faint">
              {saved ? "Saved ✓" : "Editable until the week ends."}
              {err ? ` · ${err}` : ""}
            </span>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="focus-ring rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform active:scale-[0.98] disabled:opacity-60"
              style={{ backgroundImage: "linear-gradient(145deg, #6f9173, #4f6b53)" }}
            >
              {saving ? "Saving…" : "Save reflection"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
