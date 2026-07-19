import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { SettingsForm, type UserSettings } from "@/components/SettingsForm";
import { getAllEntries } from "@/lib/queries";
import { DAYS_LONG } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const all = await getAllEntries(user.id);
  const settings: UserSettings = {
    email: user.email,
    displayName: user.displayName ?? "",
    timezone: user.timezone,
    restDay: user.restDay,
    reminderHour: user.reminderHour,
    emailOptIn: user.emailOptIn,
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <header>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
            Settings
          </h1>
          <p className="mt-1 text-sm text-ink-soft">Tune your rhythm.</p>
        </header>

        <section className="rounded-3xl border border-line bg-surface p-6">
          <SettingsForm user={settings} />
        </section>

        <section className="space-y-3 rounded-3xl border border-line bg-surface p-6">
          <h2 className="text-sm font-medium text-ink">How Steady works</h2>
          <ul className="space-y-2 text-sm leading-relaxed text-ink-soft">
            <li>• One entry per day, locked the moment you save it — no edits, ever, not even via the API.</li>
            <li>
              • {DAYS_LONG[user.restDay]} is your rest day. It never breaks the
              streak.
            </li>
            <li>• Weekly reviews lock when the week ends (same rule, weekly).</li>
            <li>• Reminders and summaries arrive by email only — no push notifications.</li>
            <li>• Categories are sorted automatically and fall back gracefully if the AI is unavailable.</li>
          </ul>
          <p className="pt-1 text-xs text-ink-faint">
            {all.length} {all.length === 1 ? "entry" : "entries"} logged so far.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
