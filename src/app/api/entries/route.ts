import { db } from "@/db";
import { dailyEntries } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session";
import { aiCategorize } from "@/lib/openrouter";
import { localCategorize } from "@/lib/categorize";
import { applyStreakOnEntry } from "@/lib/queries";
import { todayInTz } from "@/lib/time";
import { cleanStr } from "@/lib/validation";
import { displayStreak } from "@/lib/streaks";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Not set up yet." }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const rawDescription = cleanStr(body.rawDescription, 1000);
  if (!rawDescription) {
    return Response.json(
      { error: "Write one thing first — even a few words is enough." },
      { status: 400 },
    );
  }

  const today = todayInTz(user.timezone);

  // Server-side enforcement of "one entry per day": explicit check first...
  const [existing] = await db
    .select()
    .from(dailyEntries)
    .where(and(eq(dailyEntries.userId, user.id), eq(dailyEntries.date, today)))
    .limit(1);
  if (existing) {
    return Response.json(
      {
        error: "Today's entry is already locked.",
        entry: existing,
        alreadyLocked: true,
      },
      { status: 409 },
    );
  }

  // ...with the DB unique constraint as the race-condition backstop.
  let entry;
  try {
    // AI categorize; on ANY failure fall back to the local heuristic so the
    // user's input is never lost. `aiCategorize` never throws.
    const ai = await aiCategorize(rawDescription);
    const result = ai ?? localCategorize(rawDescription);

    [entry] = await db
      .insert(dailyEntries)
      .values({
        userId: user.id,
        date: today,
        rawDescription,
        aiCategory: result.category,
        aiSummary: result.summary,
        status: "locked",
        completed: false,
      })
      .returning();
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "23505") {
      // unique(user_id, date) violation — another request won the race.
      return Response.json(
        { error: "Today's entry is already locked.", alreadyLocked: true },
        { status: 409 },
      );
    }
    throw err;
  }

  const streak = await applyStreakOnEntry(user.id, today, user.restDay);
  const shown = displayStreak(
    {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastShownUpDate: streak.lastShownUpDate,
    },
    today,
    user.restDay,
  );

  return Response.json({ entry, streak: shown });
}
