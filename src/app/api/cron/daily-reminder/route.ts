import { db } from "@/db";
import { users } from "@/db/schema";
import { sendEmail, emailLayout } from "@/lib/email";
import { logNotification, notifiedSince } from "@/lib/notify";
import { getEntryForDate } from "@/lib/queries";
import { hourInTz, todayInTz, formatMonthDay } from "@/lib/time";

export const dynamic = "force-dynamic";

/**
 * Runs on a Vercel Cron schedule (see vercel.json). Protected by CRON_SECRET.
 * For each user whose local time is past their reminder hour and who hasn't
 * logged today's entry, sends a calm daily reminder email (and logs it).
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const allUsers = await db.select().from(users);
  let sent = 0;

  for (const u of allUsers) {
    const today = todayInTz(u.timezone);
    const hour = hourInTz(u.timezone);
    if (hour < u.reminderHour) continue; // not late enough in their timezone
    if (!u.emailOptIn) continue;

    const entry = await getEntryForDate(u.id, today);
    if (entry) continue; // already showed up today

    // De-duplicate within a generous window across timezone edges.
    const since = new Date(Date.now() - 20 * 3600 * 1000);
    if (await notifiedSince(u.id, "email:daily-reminder", since)) continue;

    const inner = `
      <h1 style="font-family:Fraunces,Georgia,serif;font-size:26px;margin:0 0 12px;color:#2b2a25;font-weight:600;">A small nudge for ${formatMonthDay(today)}</h1>
      <p style="font-size:16px;line-height:1.6;color:#4a4942;margin:0 0 20px;">
        No pressure — just a friendly check-in. What's <em>one</em> thing you'd like
        to do today? Tap the button when you're ready.
      </p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://steady.app"}"
         style="display:inline-block;background:#5f7e63;color:#fffdf8;text-decoration:none;font-weight:500;padding:14px 26px;border-radius:999px;font-size:15px;">
        Open Steady
      </a>
      <p style="font-size:13px;color:#9b978c;margin:24px 0 0;">Showing up is the whole point. One thing is enough.</p>`;
    const delivered = await sendEmail({
      to: u.email,
      subject: "A gentle nudge for today",
      html: emailLayout(inner, "One small thing is enough."),
    });

    await logNotification(
      u.id,
      "email:daily-reminder",
      `Daily reminder for ${today} (delivered=${delivered})`,
    );
    sent += 1;
  }

  return Response.json({ ok: true, sent });
}
