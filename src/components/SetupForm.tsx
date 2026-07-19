"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const HOURS: { value: number; label: string }[] = [
  { value: 16, label: "4pm" },
  { value: 17, label: "5pm" },
  { value: 18, label: "6pm" },
  { value: 19, label: "7pm" },
  { value: 20, label: "8pm" },
  { value: 21, label: "9pm" },
  { value: 22, label: "10pm" },
];
const COMMON_TZ = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Madrid",
  "Africa/Lagos",
  "Africa/Nairobi",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export function SetupForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [restDay, setRestDay] = useState(0);
  const [reminderHour, setReminderHour] = useState(20);
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) setTimezone(tz);
    } catch {
      /* keep UTC */
    }
  }, []);

  const tzOptions = Array.from(new Set([timezone, ...COMMON_TZ]));

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          email,
          timezone,
          restDay,
          reminderHour,
          emailOptIn,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.refresh();
      } else {
        setError(data?.error || "Could not save. Please try again.");
        setSaving(false);
      }
    } catch {
      setError("Network problem. Please try again.");
      setSaving(false);
    }
  }

  const inputCls =
    "focus-ring w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-ink-faint";
  const labelCls = "mb-1.5 block text-sm font-medium text-ink-soft";

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="name" className={labelCls}>
          Your name <span className="text-ink-faint">(optional)</span>
        </label>
        <input
          id="name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="What should we call you?"
          className={inputCls}
          maxLength={60}
        />
      </div>

      <div>
        <label htmlFor="email" className={labelCls}>
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={inputCls}
          autoComplete="email"
        />
        <p className="mt-1.5 text-xs text-ink-faint">
          Used for gentle reminders and weekly summaries.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="tz" className={labelCls}>
            Timezone
          </label>
          <select
            id="tz"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className={inputCls}
          >
            {tzOptions.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="rest" className={labelCls}>
            Rest day
          </label>
          <select
            id="rest"
            value={restDay}
            onChange={(e) => setRestDay(Number(e.target.value))}
            className={inputCls}
          >
            {DAYS.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Daily reminder</label>
        <label className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 px-3.5 py-3">
          <input
            type="checkbox"
            checked={emailOptIn}
            onChange={(e) => setEmailOptIn(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-accent)]"
          />
          <span className="text-sm text-ink">
            Email me if I haven&apos;t logged by{" "}
            <select
              value={reminderHour}
              onChange={(e) => setReminderHour(Number(e.target.value))}
              disabled={!emailOptIn}
              className="focus-ring rounded-md border border-line-strong bg-surface px-1.5 py-0.5 text-sm disabled:opacity-50"
            >
              {HOURS.map((h) => (
                <option key={h.value} value={h.value}>
                  {h.label}
                </option>
              ))}
            </select>
          </span>
        </label>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border p-3 text-sm"
          style={{ borderColor: "var(--color-clay)", color: "#8a5a34", background: "#f6ece2" }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="focus-ring w-full rounded-full px-5 py-3.5 text-base font-semibold text-white shadow-sm transition-transform active:scale-[0.99] disabled:opacity-70"
        style={{ backgroundImage: "linear-gradient(145deg, #6f9173, #4f6b53)" }}
      >
        {saving ? "Setting up…" : "Start"}
      </button>
    </form>
  );
}
