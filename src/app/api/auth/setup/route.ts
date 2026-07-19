import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { setSessionCookie } from "@/lib/session";
import {
  clampDay,
  clampHour,
  cleanEmail,
  cleanStr,
  isValidTz,
  looksLikeEmail,
} from "@/lib/validation";
import type { User } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const email = cleanEmail(body.email);
  if (!looksLikeEmail(email)) {
    return Response.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  const timezone = isValidTz(String(body.timezone))
    ? String(body.timezone)
    : "UTC";
  const restDay = clampDay(body.restDay);
  const reminderHour = clampHour(body.reminderHour);
  const displayName = body.displayName
    ? cleanStr(body.displayName, 60)
    : null;
  const emailOptIn = body.emailOptIn !== false;

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let user: User;
  if (existing) {
    const [updated] = await db
      .update(users)
      .set({ displayName, timezone, restDay, reminderHour, emailOptIn })
      .where(eq(users.id, existing.id))
      .returning();
    user = updated;
  } else {
    const [created] = await db
      .insert(users)
      .values({ email, displayName, timezone, restDay, reminderHour, emailOptIn })
      .returning();
    user = created;
  }

  await setSessionCookie(user.id);
  return Response.json({ user });
}
