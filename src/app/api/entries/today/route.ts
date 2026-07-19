import { and, eq } from "drizzle-orm";
import { dailyEntries } from "@/db/schema";
import { db } from "@/db";
import { getCurrentUser } from "@/lib/session";
import { getEntryForDate } from "@/lib/queries";
import { todayInTz } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const today = todayInTz(user.timezone);
  const entry = await getEntryForDate(user.id, today);
  return Response.json({ date: today, entry });
}

// Server-enforced guard: even direct API calls cannot mutate a locked entry's
// content. The only allowed change is the lightweight `completed` progress flag.
export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (typeof body.completed !== "boolean") {
    return Response.json({ error: "Only `completed` may change." }, { status: 400 });
  }

  const today = todayInTz(user.timezone);
  const [updated] = await db
    .update(dailyEntries)
    .set({ completed: body.completed })
    .where(
      and(
        eq(dailyEntries.userId, user.id),
        eq(dailyEntries.date, today),
        eq(dailyEntries.status, "locked"),
      ),
    )
    .returning();

  if (!updated) {
    return Response.json({ error: "Nothing to update yet today." }, { status: 404 });
  }
  return Response.json({ entry: updated });
}
