"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DAYS_LONG, REMINDER_HOURS, COMMON_TIMEZONES } from "@/lib/constants";

export type UserSettings = {
  email: string;
  displayName: string;
  timezone: string;
  restDay: number;
  reminderHour: number;
  emailOptIn: boolean;
};

export function SettingsForm({ user }: { user: UserSettings }) {
  const router = useRouter();
  const [email, setEmail] = useState(user.email);
  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [timezone, setTimezone] = useState(user.timezone);
  const [restDay, setRestDay] = useState(user.restDay);
  const [reminderHour, setReminderHour] = useState(user.reminderHour);
  const [emailOptIn, setEmailOptIn] = useState(user.emailOptIn);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setErr("");
    setSaved(false);
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          displayName: displayName || null,
          timezone,
          restDay,
          reminderHour,
          emailOptIn,
        }),
      });
      setSaving(false);
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        setErr("Could not save those changes.");
      }
    } catch {
      setSaving(false);
      setErr("Network problem. Could not save.");
    }
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const inputCls =
    "focus-ring w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-ink-faint";
  const labelCls = "mb-1.5 block text-sm font-medium text-ink-soft";
  const tzOptions = Array.from(new Set([timezone, ...COMMON_TIMEZONES]));

  return (
    <form onSubmit={save} className="space-y-5">
      <div>
        <label htmlFor="s-name" className={labelCls}>
          Name
        </label>
        <input
          id="s-name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={inputCls}
          maxLength={60}
        />
      </div>

      <div>
        <label htmlFor="s-email" className={labelCls}>
          Email
        </label>
        <input
          id="s-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="s-tz" className={labelCls}>
            Timezone
          </label>
          <select
            id="s-tz"
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
          <label htmlFor="s-rest" className={labelCls}>
            Rest day
          </label>
          <select
            id="s-rest"
            value={restDay}
            onChange={(e) => setRestDay(Number(e.target.value))}
            className={inputCls}
          >
            {DAYS_LONG.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 px-3.5 py-3">
        <input
          type="checkbox"
          checked={emailOptIn}
          onChange={(e) => setEmailOptIn(e.target.checked)}
          className="h-4 w-4 accent-[var(--color-accent)]"
        />
        <span className="text-sm text-ink">
          Send daily reminder if I haven&apos;t logged by{" "}
          <select
            value={reminderHour}
            onChange={(e) => setReminderHour(Number(e.target.value))}
            disabled={!emailOptIn}
            className="focus-ring rounded-md border border-line-strong bg-surface px-1.5 py-0.5 text-sm disabled:opacity-50"
          >
            {REMINDER_HOURS.map((h) => (
              <option key={h.value} value={h.value}>
                {h.label}
              </option>
            ))}
          </select>
        </span>
      </label>

      {err && (
        <p
          role="alert"
          className="rounded-xl border p-3 text-sm"
          style={{ borderColor: "var(--color-clay)", color: "#8a5a34", background: "#f6ece2" }}
        >
          {err}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={signOut}
          className="focus-ring rounded-full px-4 py-2.5 text-sm font-medium text-ink-faint transition-colors hover:text-ink"
        >
          Sign out
        </button>
        <button
          type="submit"
          disabled={saving}
          className="focus-ring rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm transition-transform active:scale-[0.98] disabled:opacity-60"
          style={{ backgroundImage: "linear-gradient(145deg, #6f9173, #4f6b53)" }}
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
