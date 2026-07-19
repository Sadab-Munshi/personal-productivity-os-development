import { db } from "@/db";
import { users } from "@/db/schema";
import { sendEmail, emailLayout } from "@/lib/email";
import { logNotification, notifiedSince } from "@/lib/notify";
import {
  buildWeekStats,
  getEntriesInRange,
  getStreakRow,
  writeAnalyticsReport,
} from "@/lib/queries";
import { addDays, formatMonthDay, todayInTz, weekEndSunday, weekStartMonday } from "@/lib/time";
import { categoryMeta } from "@/lib/categories";

export const dynamic = "force-dynamic";

/**
 * Runs weekly (Vercel Cron). Summarizes the just-finished week for each user:
 * sends a calm summary email, logs it, and writes an analytics_reports row.
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
    const weekStart = addDays(weekStartMonday(today), -7); // the week that just ended
    const weekEnd = weekEndSunday(weekStart);

    const since = new Date(Date.now() - 6 * 24 * 3600 * 1000);
    if (await notifiedSince(u.id, "email:weekly-summary", since)) continue;

    const entries = await getEntriesInRange(u.id, weekStart, weekEnd);
    const stats = buildWeekStats(entries, weekStart, today, u.restDay);
    const streak = await getStreakRow(u.id);

    // Always record the analytics report for the week (v2 data, from day one).
    await writeAnalyticsReport(u.id, "weekly", {
      weekStart,
      completionRate: stats.completionRate,
      shownUp: stats.shownUp,
      available: stats.available,
      categoryCounts: stats.categoryCounts,
      streak: streak
        ? { current: streak.currentStreak, longest: streak.longestStreak }
        : null,
    });

    if (!u.emailOptIn) continue;

    const pct = Math.round(stats.completionRate * 100);
    const catLines = Object.entries(stats.categoryCounts)
      .map(
        ([c, n]) =>
          `<tr><td style="padding:6px 0;color:#6f6d64;">${categoryMeta(c).label}</td><td style="padding:6px 0;text-align:right;color:#2b2a25;font-weight:500;">${n}</td></tr>`,
      )
      .join("");

    const streakLine = streak
      ? `<p style="font-size:14px;color:#6f6d64;margin:0 0 16px;">Current streak: <strong style="color:#2b2a25;">${streak.currentStreak} day${streak.currentStreak === 1 ? "" : "s"}</strong> &middot; longest: ${streak.longestStreak}</p>`
      : "";

    const inner = `
      <h1 style="font-family:Fraunces,Georgia,serif;font-size:26px;margin:0 0 8px;color:#2b2a25;font-weight:600;">Your week, gently</h1>
      <p style="font-size:14px;color:#9b978c;margin:0 0 18px;">${formatMonthDay(weekStart)} – ${formatMonthDay(weekEnd)}</p>
      <p style="font-size:17px;line-height:1.6;color:#2b2a25;margin:0 0 8px;">You showed up on <strong>${stats.shownUp} of ${stats.available}</strong> day${stats.available === 1 ? "" : "s"} (${pct}%).</p>
      ${streakLine}
      ${
        catLines
          ? `<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-top:8px;border-top:1px solid #ece6d9;">${catLines}</table>`
          : `<p style="font-size:14px;color:#9b978c;">No entries this week — that's okay. Next week is a fresh start.</p>`
      }
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://steady.app"}"
         style="display:inline-block;margin-top:22px;background:#5f7e63;color:#fffdf8;text-decoration:none;font-weight:500;padding:14px 26px;border-radius:999px;font-size:15px;">
        See your week
      </a>`;
    const delivered = await sendEmail({
      to: u.email,
      subject: `Your week: ${pct}% shown up`,
      html: emailLayout(inner, `You showed up on ${stats.shownUp} of ${stats.available} days.`),
    });

    await logNotification(
      u.id,
      "email:weekly-summary",
      `Weekly summary ${weekStart} (${pct}%) (delivered=${delivered})`,
    );
    sent += 1;
  }

  return Response.json({ ok: true, sent });
}
