import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session";
import {
  clampDay,
  clampHour,
  cleanEmail,
  cleanStr,
  isValidTz,
  looksLikeEmail,
} from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};

  if (body.displayName !== undefined) {
    patch.displayName = body.displayName ? cleanStr(body.displayName, 60) : null;
  }
  if (body.timezone !== undefined) {
    patch.timezone = isValidTz(String(body.timezone))
      ? String(body.timezone)
      : user.timezone;
  }
  if (body.restDay !== undefined) patch.restDay = clampDay(body.restDay);
  if (body.reminderHour !== undefined)
    patch.reminderHour = clampHour(body.reminderHour);
  if (body.emailOptIn !== undefined) patch.emailOptIn = body.emailOptIn !== false;
  if (body.email !== undefined) {
    const email = cleanEmail(body.email);
    if (looksLikeEmail(email)) patch.email = email;
  }

  const [updated] = await db
    .update(users)
    .set(patch)
    .where(eq(users.id, user.id))
    .returning();

  return Response.json({ user: updated });
}
