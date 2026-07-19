"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { categoryMeta, type Category } from "@/lib/categories";

type Phase = "closed" | "open" | "submitting" | "locked" | "conflict" | "error";

type Result = { category: Category; summary: string };

export function Fab() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("closed");
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [justDone, setJustDone] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const isOpen = phase !== "closed";

  // Lock background scroll + allow Escape while the sheet is up.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "submitting") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, phase]);

  // Focus the field the moment it opens.
  useEffect(() => {
    if (phase === "open") {
      const t = setTimeout(() => taRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const open = useCallback(() => {
    setText("");
    setResult(null);
    setErrorMsg("");
    setPhase("open");
  }, []);

  const close = useCallback(() => setPhase("closed"), []);

  async function submit() {
    const value = text.trim();
    if (!value || phase === "submitting") return;
    setPhase("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawDescription: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setResult({
          category: data.entry.aiCategory,
          summary: data.entry.aiSummary ?? value,
        });
        setPhase("locked");
      } else if (res.status === 409) {
        setPhase("conflict");
      } else {
        setErrorMsg(
          data?.error ||
            "Something went wrong saving it. Your words are still here — try again.",
        );
        setPhase("error");
      }
    } catch {
      setErrorMsg("Network hiccup. Your words are still here — try again.");
      setPhase("error");
    }
  }

  function done() {
    // Hide the button immediately so it doesn't flash back before the server
    // refresh unmounts this component (today's entry now exists).
    setJustDone(true);
    close();
    router.refresh();
  }

  const editing = phase === "open" || phase === "submitting" || phase === "error";

  return (
    <>
      {/* The floating action button — only when today is still open. */}
      {phase === "closed" && !justDone && (
        <button
          type="button"
          onClick={open}
          aria-label="Log today's one thing"
          className="animate-breathe focus-ring fixed right-5 z-40 flex h-16 w-16 items-center justify-center rounded-full text-white shadow-[0_12px_30px_-8px_rgba(95,126,99,0.7)] transition-transform active:scale-95"
          style={{
            bottom: "calc(5.25rem + env(safe-area-inset-bottom))",
            backgroundImage:
              "linear-gradient(145deg, #6f9173 0%, #5f7e63 55%, #4f6b53 100%)",
          }}
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close"
            onClick={phase === "submitting" ? undefined : close}
            className="animate-fade absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
          />

          {/* Sheet */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Log today's one thing"
            className="animate-rise relative z-10 w-full rounded-t-[1.75rem] border border-line bg-surface p-6 shadow-[0_-12px_40px_-12px_rgba(43,42,37,0.25)] sm:max-w-md sm:rounded-[1.75rem]"
          >
            {/* grab handle (mobile) */}
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line-strong sm:hidden" />

            {editing && (
              <>
                <h2 className="font-display text-2xl font-medium leading-snug text-ink">
                  What do you want to do today?
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  One thing. It locks the moment you save — that&apos;s the whole
                  point.
                </p>

                <textarea
                  ref={taRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
                  }}
                  rows={3}
                  maxLength={1000}
                  placeholder="e.g. Read 10 pages, take a walk, ship the form…"
                  className="focus-ring mt-4 w-full resize-none rounded-2xl border border-line-strong bg-surface-2 p-4 text-base text-ink placeholder:text-ink-faint"
                />

                {phase === "error" && (
                  <p
                    role="alert"
                    className="animate-fade mt-3 rounded-xl border p-3 text-sm"
                    style={{
                      borderColor: "var(--color-clay)",
                      color: "#8a5a34",
                      backgroundColor: "#f6ece2",
                    }}
                  >
                    {errorMsg}
                  </p>
                )}

                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="text-xs text-ink-faint">
                    {text.length}/1000 · ⌘↵ to save
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={close}
                      disabled={phase === "submitting"}
                      className="focus-ring rounded-full px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={submit}
                      disabled={!text.trim() || phase === "submitting"}
                      className="focus-ring inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform active:scale-[0.98] disabled:opacity-60"
                      style={{
                        backgroundImage:
                          "linear-gradient(145deg, #6f9173, #4f6b53)",
                      }}
                    >
                      {phase === "submitting" ? (
                        <>
                          <span className="animate-spin-soft inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white" />
                          Locking…
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                            <rect x="5" y="10" width="14" height="9.5" rx="2.2" stroke="currentColor" strokeWidth="1.8" />
                            <path d="M8 10V7.5a4 4 0 0 1 8 0V10" stroke="currentColor" strokeWidth="1.8" />
                          </svg>
                          Lock it in
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {phase === "locked" && result && (
              <LockedConfirmation result={result} onDone={done} />
            )}

            {phase === "conflict" && (
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-2xl">
                  🔒
                </div>
                <h2 className="mt-4 font-display text-2xl font-medium text-ink">
                  Already locked
                </h2>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
                  Today&apos;s entry is already in. That&apos;s enough — come back
                  tomorrow.
                </p>
                <button
                  type="button"
                  onClick={done}
                  className="focus-ring mt-6 w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-surface"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function LockedConfirmation({
  result,
  onDone,
}: {
  result: Result;
  onDone: () => void;
}) {
  const meta = categoryMeta(result.category);
  return (
    <div className="text-center">
      {/* The satisfying seal */}
      <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
        <div
          className="animate-seal absolute inset-0 rounded-full"
          style={{ backgroundColor: meta.color, opacity: 0.16 }}
        />
        <div
          className="animate-seal flex h-16 w-16 items-center justify-center rounded-full text-white shadow-md"
          style={{ backgroundColor: meta.color }}
        >
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden="true">
            <path
              d="M7 12.5l3.2 3.2L17 9"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <h2 className="mt-4 font-display text-2xl font-semibold text-ink">
        Locked for today
      </h2>
      <p className="mt-1 text-sm text-ink-soft">
        One thing, set. You can&apos;t tweak it — and that&apos;s the point.
      </p>

      <div className="mt-5 rounded-2xl border border-line bg-surface-2 p-4 text-left">
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
          style={{
            backgroundColor: meta.soft,
            color: meta.color,
            borderColor: meta.border,
          }}
        >
          <span aria-hidden="true">{meta.emoji}</span>
          {meta.label}
        </span>
        <p className="mt-2.5 font-display text-lg font-medium leading-snug text-ink">
          {result.summary}
        </p>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="focus-ring mt-6 w-full rounded-full px-5 py-3 text-sm font-semibold text-white shadow-sm transition-transform active:scale-[0.99]"
        style={{ backgroundImage: "linear-gradient(145deg, #6f9173, #4f6b53)" }}
      >
        Done
      </button>
    </div>
  );
}
